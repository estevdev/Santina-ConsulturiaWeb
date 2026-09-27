'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Preset, FieldZone, ProcessedFieldValues } from '@/types/preset';
import { applyEditsToPdf } from '@/utils/pdfModifier';
import { FileText, CheckCircle2, AlertCircle, Loader2, Send, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { SignaturePadModal } from '@/components/SignaturePadModal';

export default function LlenarDocumentoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [linkRecord, setLinkRecord] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [preset, setPreset] = useState<Preset | null>(null);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activeSignatureZone, setActiveSignatureZone] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedPdfUrl, setCompletedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocumentRequest() {
      if (!token) return;
      try {
        setLoading(true);
        const supabase = createClient();

        // 1. Obtener la solicitud del link
        const { data: linkData, error: linkErr } = await supabase
          .from('client_document_links')
          .select('*')
          .eq('token', token)
          .single();

        if (linkErr || !linkData) {
          setErrorMsg('El enlace proporcionado no es válido o ha expirado.');
          setLoading(false);
          return;
        }

        setLinkRecord(linkData);

        if (linkData.status === 'completed' && linkData.generated_pdf_url) {
          setIsCompleted(true);
          setCompletedPdfUrl(linkData.generated_pdf_url);
        }

        // 2. Obtener los datos del cliente
        if (linkData.cliente_id) {
          const { data: cliData } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', linkData.cliente_id)
            .single();
          if (cliData) setCliente(cliData);
        }

        // 3. Obtener el preset desde Supabase
        const { data: presetRow, error: presetErr } = await supabase
          .from('pdf_presets')
          .select('*')
          .eq('id', linkData.preset_id)
          .single();

        if (presetErr || !presetRow) {
          setErrorMsg('No se pudo encontrar la plantilla del documento.');
          setLoading(false);
          return;
        }

        const loadedPreset: Preset = {
          id: presetRow.id,
          name: presetRow.name,
          description: presetRow.description || undefined,
          presetType: presetRow.preset_type || 'client_document',
          targetTramiteType: presetRow.target_tramite_type || 'todos',
          samplePdfUrl: presetRow.sample_pdf_url || undefined,
          identifierKeywords: presetRow.identifier_keywords || [],
          zones: presetRow.zones || [],
          createdAt: presetRow.created_at || Date.now(),
          updatedAt: presetRow.updated_at || Date.now(),
        };

        setPreset(loadedPreset);

        // Pre-llenar formulario con datos conocidos del cliente
        const initialForm: Record<string, string> = {};
        const filledAlready = linkData.filled_values || {};

        loadedPreset.zones.forEach((zone) => {
          if (filledAlready[zone.id]) {
            initialForm[zone.id] = String(filledAlready[zone.id]);
          } else {
            // Intentar adivinar por el nombre de la zona
            const nameLower = zone.name.toLowerCase();
            let defaultVal = '';

            if (cliente) {
              const fullNombre = [cliente.nombre, cliente.apellido_paterno, cliente.apellido_materno]
                .filter(Boolean)
                .join(' ');

              if (nameLower.includes('nombre') || nameLower.includes('cliente')) {
                defaultVal = fullNombre || cliente.nombre || '';
              } else if (nameLower.includes('curp')) {
                defaultVal = cliente.curp || '';
              } else if (nameLower.includes('nss')) {
                defaultVal = cliente.nss || '';
              } else if (nameLower.includes('rfc')) {
                defaultVal = cliente.rfc || '';
              } else if (nameLower.includes('teléfono') || nameLower.includes('telefono')) {
                defaultVal = cliente.telefono || '';
              } else if (nameLower.includes('email') || nameLower.includes('correo')) {
                defaultVal = cliente.email || '';
              } else if (nameLower.includes('dirección') || nameLower.includes('direccion')) {
                defaultVal = cliente.direccion || '';
              } else if (nameLower.includes('fecha')) {
                defaultVal = new Date().toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
              }
            }
            initialForm[zone.id] = defaultVal;
          }
        });

        setFormValues(initialForm);
      } catch (err: any) {
        console.error('Error cargando documento para cliente:', err);
        setErrorMsg('Ocurrió un error al cargar la información del documento.');
      } finally {
        setLoading(false);
      }
    }

    loadDocumentRequest();
  }, [token]);

  const handleInputChange = (zoneId: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [zoneId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preset || !linkRecord) return;

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      let pdfBuffer: ArrayBuffer | null = null;

      // 1. Obtener la plantilla PDF de prueba desde Supabase samplePdfUrl
      if (preset.samplePdfUrl) {
        const response = await fetch(preset.samplePdfUrl);
        if (response.ok) {
          pdfBuffer = await response.arrayBuffer();
        }
      }

      if (!pdfBuffer) {
        alert('No se pudo descargar la plantilla base del documento desde el servidor.');
        setIsSubmitting(false);
        return;
      }

      // 2. Aplicar los datos llenados por el cliente sobre el PDF
      const processedValues: ProcessedFieldValues = {};
      Object.entries(formValues).forEach(([k, v]) => {
        processedValues[k] = v;
      });

      const modifiedPdfBytes = await applyEditsToPdf(pdfBuffer, preset.zones, processedValues);

      // 3. Subir el PDF generado a Supabase Storage
      const fileName = `filled_${linkRecord.cliente_id || 'guest'}_${preset.id}_${Date.now()}.pdf`;
      const storagePath = `completed_client_docs/${fileName}`;

      const pdfBlob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const { error: uploadErr } = await supabase.storage
        .from('pdf_presets')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      let finalPublicUrl = '';
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('pdf_presets')
          .getPublicUrl(storagePath);
        finalPublicUrl = urlData.publicUrl;
      }

      // 4. Actualizar el registro en client_document_links
      await supabase
        .from('client_document_links')
        .update({
          status: 'completed',
          filled_values: formValues,
          generated_pdf_url: finalPublicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      // 5. Registrar el documento en el expediente del cliente en la base de datos
      if (linkRecord.cliente_id && finalPublicUrl) {
        const { data: currentCli } = await supabase
          .from('clientes')
          .select('documentos_urls')
          .eq('id', linkRecord.cliente_id)
          .single();

        const currentDocs = currentCli?.documentos_urls || {};
        const docKey = `doc_preset_${preset.id}`;
        currentDocs[docKey] = finalPublicUrl;

        await supabase
          .from('clientes')
          .update({ documentos_urls: currentDocs })
          .eq('id', linkRecord.cliente_id);
      }

      setCompletedPdfUrl(finalPublicUrl);
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Error al procesar el documento:', err);
      alert(`Error al generar el documento: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d0e12] p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-zinc-800 text-center max-w-sm w-full space-y-4">
          <Loader2 className="w-10 h-10 text-[#c5a059] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cargando plantilla de contrato...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d0e12] p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-zinc-800 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Enlace No Disponible</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50/40 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d0e12] p-8 rounded-3xl shadow-xl border border-slate-200/80 dark:border-zinc-800 text-center max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              ¡Información Registrada Exitosamente!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              El documento <span className="font-semibold text-slate-800 dark:text-slate-200">{preset?.name}</span> ha sido completado y procesado correctamente.
            </p>
          </div>

          {completedPdfUrl && (
            <div className="pt-2 flex flex-col gap-3">
              <a
                href={completedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#c5a059] hover:bg-[#c5a059] text-white rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                <FileText className="w-4 h-4" />
                <span>Ver / Descargar Mi Documento PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Santina Consultoría Web — Proceso Seguro</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Encabezado del documento */}
        <div className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#c5a059] text-white rounded-2xl shadow-md shadow-amber-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a059] dark:text-[#c5a059]">
                Santina Consultoría — Documento de Cliente
              </span>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {preset?.name}
              </h1>
              {cliente && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Para: <strong className="text-slate-700 dark:text-slate-300">{cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}</strong>
                </p>
              )}
            </div>
          </div>

          {/* BOTÓN TEMPORAL DE AUTO-RELLENADO PARA PRUEBAS (SE ELIMINARÁ DESPUÉS) */}
          <button
            type="button"
            onClick={() => {
              if (!preset) return;
              const autoForm: Record<string, string> = { ...formValues };

              // Mock de firma digital transparente en base64
              const mockSignatureDataUrl =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABgCAYAAADRF78XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADbSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAzGvAAFIQyS8AAAAAElFTkSuQmCC';

              preset.zones.forEach((zone) => {
                const isSig =
                  zone.isSignature ||
                  zone.name.toLowerCase().includes('rubrica') ||
                  zone.name.toLowerCase().includes('firma');

                if (isSig) {
                  autoForm[zone.id] = mockSignatureDataUrl;
                } else if (!autoForm[zone.id]) {
                  const nameLower = zone.name.toLowerCase();
                  if (nameLower.includes('dia')) autoForm[zone.id] = '26';
                  else if (nameLower.includes('mes')) autoForm[zone.id] = '09';
                  else if (nameLower.includes('año') || nameLower.includes('anio')) autoForm[zone.id] = '2026';
                  else if (nameLower.includes('curp')) autoForm[zone.id] = cliente?.curp || 'HERJ950815HDFRR09';
                  else if (nameLower.includes('nss')) autoForm[zone.id] = cliente?.nss || '12948573610';
                  else if (nameLower.includes('rfc')) autoForm[zone.id] = cliente?.rfc || 'HERJ950815AB1';
                  else if (nameLower.includes('tel')) autoForm[zone.id] = cliente?.telefono || '3312345678';
                  else if (nameLower.includes('monto') || nameLower.includes('salario') || nameLower.includes('honorarios')) autoForm[zone.id] = '15,000.00';
                  else if (nameLower.includes('porcentaje')) autoForm[zone.id] = '15%';
                  else if (nameLower.includes('letra')) autoForm[zone.id] = 'QUINCE MIL PESOS 00/100 M.N.';
                  else if (nameLower.includes('banco')) autoForm[zone.id] = 'BBVA Bancomer';
                  else if (nameLower.includes('clabe')) autoForm[zone.id] = '012320012345678901';
                  else if (nameLower.includes('direccion') || nameLower.includes('domicilio')) autoForm[zone.id] = 'Av. Vallarta #1234, Col. Americana';
                  else if (nameLower.includes('empresa') || nameLower.includes('patron')) autoForm[zone.id] = 'Consultores S.A. de C.V.';
                  else autoForm[zone.id] = `DATO ${zone.name}`;
                }
              });

              setFormValues(autoForm);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Botón temporal para pruebas rápidas de auto-rellenado de todos los campos"
          >
            <span>⚡ Rellenar Todo Automático (Prueba)</span>
          </button>
        </div>

        {/* Descripción / Instrucciones */}
        {preset?.description && (
          <div className="bg-[#c5a059]/60 dark:bg-[#c5a059]/30 border border-[#c5a059]/80 dark:border-[#c5a059]/50 rounded-2xl p-4 text-xs text-[#c5a059] dark:text-[#c5a059] leading-relaxed">
            {preset.description}
          </div>
        )}

        {/* Formulario con las zonas definidas en el Preset */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Por favor completa o confirma los siguientes datos:
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Esta información se incrustará automáticamente en tu contrato/documento.
            </p>
          </div>

          <div className="space-y-4">
            {(preset?.zones.filter((z) => (z.filledBy || 'cliente') === 'cliente').length ? preset?.zones.filter((z) => (z.filledBy || 'cliente') === 'cliente') : preset?.zones || []).map((zone, idx) => {
              const isSig = zone.isSignature || zone.name.toLowerCase().includes('rubrica') || zone.name.toLowerCase().includes('firma');
              const currentSig = formValues[zone.id];

              return (
                <div key={zone.id} className="space-y-1.5 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {idx + 1}. {zone.name} *
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c5a059] dark:bg-[#c5a059]/80 text-[#c5a059] dark:text-[#c5a059] border border-[#c5a059] dark:border-[#c5a059]/60">
                      {isSig ? '✍️ Firma' : '👤 Cliente'}
                    </span>
                  </div>

                  {isSig ? (
                    <div className="pt-1">
                      {currentSig && currentSig.startsWith('data:image/') ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#0d0e12] rounded-xl border border-emerald-300 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-12 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center">
                              <img src={currentSig} alt="Firma capturada" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                                ✓ Firma registrada
                              </span>
                              <span className="text-[10px] text-slate-400">Trazo guardado en alta resolución</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveSignatureZone({ id: zone.id, name: zone.name })}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            ✍️ Cambiar / Volver a Firmar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSignatureZone({ id: zone.id, name: zone.name })}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="text-base">✍️</span>
                          <span>FIRMAR CAMPO ({zone.name})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formValues[zone.id] || ''}
                      onChange={(e) => handleInputChange(zone.id, e.target.value)}
                      placeholder={`Ingresa ${zone.name.toLowerCase()}...`}
                      className="w-full bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#c5a059] hover:bg-[#c5a059] disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando Documento en PDF...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirmar & Generar Documento</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de Firma Digital Canvas */}
        <SignaturePadModal
          isOpen={!!activeSignatureZone}
          title={activeSignatureZone?.name || 'Firma'}
          onClose={() => setActiveSignatureZone(null)}
          onSave={(dataUrl) => {
            if (activeSignatureZone) {
              setFormValues((prev) => ({ ...prev, [activeSignatureZone.id]: dataUrl }));
            }
          }}
        />
      </div>
    </div>
  );
}
