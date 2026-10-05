'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PenTool,
  RotateCcw,
  Check,
  Eye,
  Trash2,
  ExternalLink,
  Layers,
  User,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Preset, FieldZone, ProcessedFieldValues } from '@/types/preset';
import { Cliente } from '@/types/cliente';
import CanvasPdfViewer from '@/components/CanvasPdfViewer';
import { SignaturePadModal } from '@/components/SignaturePadModal';
import { applyEditsToPdf } from '@/utils/pdfModifier';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface LiveDocFillerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: Preset;
  cliente: Cliente | null;
  tramiteType?: string;
  onSaveSuccess?: (generatedPdfUrl: string, presetId: string) => void;
}

export function LiveDocFillerModal({
  isOpen,
  onClose,
  preset,
  cliente,
  tramiteType,
  onSaveSuccess,
}: LiveDocFillerModalProps) {
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldAlignments, setFieldAlignments] = useState<Record<string, 'left' | 'center' | 'right'>>({});
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  // Modal para captura de firma interactiva
  const [activeSignatureZone, setActiveSignatureZone] = useState<{ id: string; name: string } | null>(null);

  // Estados de acción
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Pestaña en móviles (formulario vs pdf)
  const [mobileTab, setMobileTab] = useState<'form' | 'pdf'>('form');

  const formInputsRefs = useRef<Record<string, HTMLElement | null>>({});
  const pdfScrollContainerRef = useRef<HTMLDivElement>(null);

  // Modo de ajuste y zoom del visor PDF ('page' muestra el 100% completo sin cortes, 'width' al ancho)
  const [fitMode, setFitMode] = useState<'page' | 'width'>('page');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Scroll suave automático dentro del visor PDF hacia la zona activa
  useEffect(() => {
    if (!activeZoneId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`canvas-zone-${activeZoneId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [activeZoneId, currentPage]);

  // Cargar la plantilla PDF y los valores iniciales
  useEffect(() => {
    if (!isOpen || !preset) return;

    let isMounted = true;

    async function initData() {
      try {
        setLoadingPdf(true);
        setErrorMsg(null);

        // 1. Descargar el PDF base como ArrayBuffer
        if (!preset.samplePdfUrl) {
          setErrorMsg('Este formato no tiene una plantilla PDF asignada en el servidor.');
          setLoadingPdf(false);
          return;
        }

        const res = await fetch(preset.samplePdfUrl);
        if (!res.ok) {
          throw new Error('No se pudo descargar la plantilla del documento desde Supabase Storage.');
        }
        const buffer = await res.arrayBuffer();
        if (isMounted) {
          setPdfBuffer(buffer);
        }

        // 2. Consultar si existen valores previamente guardados para este cliente y formato
        const supabase = createClient();
        let savedFilledValues: Record<string, any> = {};

        if (cliente?.id) {
          const { data: linkData } = await supabase
            .from('client_document_links')
            .select('filled_values')
            .eq('cliente_id', cliente.id)
            .eq('preset_id', preset.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (linkData?.filled_values && typeof linkData.filled_values === 'object') {
            savedFilledValues = linkData.filled_values;
          }
        }

        // 3. Pre-llenar datos conocidos del cliente
        const initialForm: Record<string, string> = {};
        const today = new Date();
        const curDay = String(today.getDate()).padStart(2, '0');
        const curMonth = String(today.getMonth() + 1).padStart(2, '0');
        const curYear = String(today.getFullYear());

        const fullNombre = [cliente?.nombre, cliente?.apellido_paterno, cliente?.apellido_materno]
          .filter(Boolean)
          .join(' ');

        preset.zones.forEach((zone) => {
          if (savedFilledValues[zone.id] !== undefined && savedFilledValues[zone.id] !== null) {
            initialForm[zone.id] = String(savedFilledValues[zone.id]);
          } else {
            const nameLower = zone.name.toLowerCase();
            let defaultVal = '';

            if (cliente) {
              if (nameLower.includes('apellido paterno') || nameLower === 'paterno') {
                defaultVal = cliente.apellido_paterno || '';
              } else if (nameLower.includes('apellido materno') || nameLower === 'materno') {
                defaultVal = cliente.apellido_materno || '';
              } else if (nameLower.includes('nombre') || nameLower.includes('cliente') || nameLower.includes('derechohabiente')) {
                defaultVal = fullNombre || cliente.nombre || '';
              } else if (nameLower.includes('curp')) {
                defaultVal = cliente.curp || '';
              } else if (nameLower.includes('nss') || nameLower.includes('seguridad social')) {
                defaultVal = cliente.nss || '';
              } else if (nameLower.includes('rfc')) {
                defaultVal = cliente.rfc || '';
              } else if (nameLower.includes('teléfono') || nameLower.includes('telefono') || nameLower.includes('celular')) {
                defaultVal = cliente.telefono || '';
              } else if (nameLower.includes('email') || nameLower.includes('correo')) {
                defaultVal = cliente.email || '';
              } else if (nameLower.includes('dirección') || nameLower.includes('direccion') || nameLower.includes('domicilio') || nameLower.includes('calle')) {
                defaultVal = cliente.direccion || '';
              } else if (nameLower === 'dia' || nameLower.includes('día')) {
                defaultVal = curDay;
              } else if (nameLower === 'mes') {
                defaultVal = curMonth;
              } else if (nameLower === 'año' || nameLower.includes('anio')) {
                defaultVal = curYear;
              } else if (nameLower.includes('fecha')) {
                defaultVal = `${curDay}/${curMonth}/${curYear}`;
              }
            }

            initialForm[zone.id] = defaultVal;
          }
        });

        // 4. Inicializar alineaciones de campos (cargando previas si existen)
        const initialAlignments: Record<string, 'left' | 'center' | 'right'> = {};
        if (savedFilledValues._fieldAlignments && typeof savedFilledValues._fieldAlignments === 'object') {
          Object.entries(savedFilledValues._fieldAlignments).forEach(([k, v]) => {
            if (v === 'left' || v === 'center' || v === 'right') {
              initialAlignments[k] = v;
            }
          });
        }
        preset.zones.forEach((zone) => {
          if (!initialAlignments[zone.id]) {
            initialAlignments[zone.id] = zone.alignment || 'left';
          }
        });

        if (isMounted) {
          setFormValues(initialForm);
          setFieldAlignments(initialAlignments);
          setCurrentPage(1);
        }
      } catch (err: any) {
        console.error('Error al inicializar el llenador de documento:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Error al cargar la plantilla del documento.');
        }
      } finally {
        if (isMounted) {
          setLoadingPdf(false);
        }
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, preset, cliente]);

  // Zonas activas con alineación personalizada aplicada en tiempo real (fondo 100% transparente para no alterar el documento base)
  const activeZonesWithAlignment = useMemo(() => {
    return preset.zones.map((z) => ({
      ...z,
      alignment: fieldAlignments[z.id] || z.alignment || 'left',
      bgColor: 'transparent',
      drawBackground: false,
    }));
  }, [preset.zones, fieldAlignments]);

  // Cambiar alineación de un campo específico
  const handleAlignmentChange = (zoneId: string, align: 'left' | 'center' | 'right') => {
    setFieldAlignments((prev) => ({
      ...prev,
      [zoneId]: align,
    }));
  };

  // Cambiar alineación de todos los campos
  const handleSetAllAlignments = (align: 'left' | 'center' | 'right') => {
    const updated: Record<string, 'left' | 'center' | 'right'> = {};
    preset.zones.forEach((z) => {
      updated[z.id] = align;
    });
    setFieldAlignments(updated);
    toast.success(
      `Todos los campos alineados a: ${
        align === 'center' ? 'Centro' : align === 'right' ? 'Derecha' : 'Izquierda'
      }`
    );
  };

  // Agregar sangría (+4 espacios al inicio)
  const handleAddIndent = (zoneId: string) => {
    setFormValues((prev) => {
      const cur = prev[zoneId] || '';
      return {
        ...prev,
        [zoneId]: '    ' + cur,
      };
    });
  };

  // Manejo de tecla Tab para insertar espacios (sangría) sin perder el foco
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    zoneId: string
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const val = target.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      handleInputChange(zoneId, newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Actualizar un valor del formulario en tiempo real
  const handleInputChange = (zoneId: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [zoneId]: value,
    }));
  };

  // Cuando el usuario hace clic en una zona del PDF: enfocar el input correspondiente en el formulario
  const handleSelectZoneFromPdf = (zoneId: string) => {
    setActiveZoneId(zoneId);
    setMobileTab('form');
    const el = formInputsRefs.current[zoneId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
    }
  };

  // Botón rápido de auto-rellenar para pruebas
  const handleQuickAutoFill = () => {
    const autoForm: Record<string, string> = { ...formValues };
    const today = new Date();
    const curDay = String(today.getDate()).padStart(2, '0');
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    const curYear = String(today.getFullYear());

    // Mock realista de firma en trazo SVG PNG
    const mockSignatureDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABgCAYAAADRF78XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADbSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAzGvAAFIQyS8AAAAAElFTkSuQmCC';

    preset.zones.forEach((zone) => {
      const isSig =
        zone.isSignature ||
        zone.name.toLowerCase().includes('rubrica') ||
        zone.name.toLowerCase().includes('firma');

      if (zone.fieldType === 'circle_select') {
        if (zone.circleOptions && zone.circleOptions.length > 0) {
          autoForm[zone.id] = `CIRCLE_${zone.circleOptions[0].id}`;
        } else {
          autoForm[zone.id] = 'SELECTED';
        }
      } else if (isSig) {
        if (!autoForm[zone.id] || !autoForm[zone.id].startsWith('data:image/')) {
          autoForm[zone.id] = mockSignatureDataUrl;
        }
      } else if (!autoForm[zone.id]) {
        const nameLower = zone.name.toLowerCase();
        if (nameLower.includes('dia') || nameLower.includes('día')) autoForm[zone.id] = curDay;
        else if (nameLower.includes('mes')) autoForm[zone.id] = curMonth;
        else if (nameLower.includes('año') || nameLower.includes('anio')) autoForm[zone.id] = curYear;
        else if (nameLower.includes('curp')) autoForm[zone.id] = cliente?.curp || 'HERJ950815HDFRR09';
        else if (nameLower.includes('nss')) autoForm[zone.id] = cliente?.nss || '12948573610';
        else if (nameLower.includes('rfc')) autoForm[zone.id] = cliente?.rfc || 'HERJ950815AB1';
        else if (nameLower.includes('tel')) autoForm[zone.id] = cliente?.telefono || '3312345678';
        else if (nameLower.includes('monto') || nameLower.includes('honorarios')) autoForm[zone.id] = '15,000.00';
        else if (nameLower.includes('porcentaje')) autoForm[zone.id] = '15%';
        else if (nameLower.includes('letra')) autoForm[zone.id] = 'QUINCE MIL PESOS 00/100 M.N.';
        else if (nameLower.includes('banco')) autoForm[zone.id] = 'BBVA Bancomer';
        else if (nameLower.includes('clabe')) autoForm[zone.id] = '012320012345678901';
        else if (nameLower.includes('direccion') || nameLower.includes('domicilio')) autoForm[zone.id] = cliente?.direccion || 'Av. Vallarta #1234, Col. Americana';
        else if (nameLower.includes('empresa') || nameLower.includes('patron')) autoForm[zone.id] = 'Consultores S.A. de C.V.';
        else autoForm[zone.id] = `DATO ${zone.name}`;
      }
    });

    setFormValues(autoForm);
    toast.success('Formulario rellenado automáticamente para prueba.');
  };

  // Descarga directa del PDF generado
  const handleDownloadPdfLocally = async () => {
    if (!pdfBuffer || !preset) return;
    try {
      setIsDownloading(true);
      const processedValues: ProcessedFieldValues = {};
      Object.entries(formValues).forEach(([k, v]) => {
        processedValues[k] = v;
      });

      const modifiedPdfBytes = await applyEditsToPdf(pdfBuffer, activeZonesWithAlignment, processedValues);
      const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanNombre = (cliente?.nombre || 'documento').replace(/\s+/g, '_');
      a.download = `${preset.name}_${cleanNombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado con los valores actuales.');
    } catch (err: any) {
      console.error('Error al descargar PDF:', err);
      toast.error('No se pudo generar la descarga del PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Guardar y registrar el PDF en Supabase y expediente del cliente
  const handleSaveAndGenerate = async () => {
    if (!pdfBuffer || !preset) return;

    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // 1. Aplicar los valores al PDF
      const processedValues: ProcessedFieldValues = {};
      Object.entries(formValues).forEach(([k, v]) => {
        processedValues[k] = v;
      });

      const modifiedPdfBytes = await applyEditsToPdf(pdfBuffer, activeZonesWithAlignment, processedValues);

      // 2. Subir a Supabase Storage
      const fileName = `filled_${cliente?.id || 'admin'}_${preset.id}_${Date.now()}.pdf`;
      const storagePath = `completed_client_docs/${fileName}`;
      const pdfBlob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      const { error: uploadErr } = await supabase.storage
        .from('pdf_presets')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Error al subir archivo a Storage: ${uploadErr.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('pdf_presets')
        .getPublicUrl(storagePath);

      const finalPublicUrl = urlData.publicUrl;

      // 3. Actualizar expediente en la tabla `clientes`
      if (cliente?.id && finalPublicUrl) {
        const { data: currentCli } = await supabase
          .from('clientes')
          .select('documentos_urls')
          .eq('id', cliente.id)
          .single();

        const currentDocs = currentCli?.documentos_urls || {};
        const docKey = `doc_preset_${preset.id}`;
        currentDocs[docKey] = finalPublicUrl;

        const { error: updateCliErr } = await supabase
          .from('clientes')
          .update({ documentos_urls: currentDocs })
          .eq('id', cliente.id);

        if (updateCliErr) {
          console.warn('Advertencia al actualizar clientes.documentos_urls:', updateCliErr);
        }

        // 4. Registrar o actualizar en `client_document_links`
        const valuesToSave = {
          ...formValues,
          _fieldAlignments: fieldAlignments,
        };

        const { data: existingLink } = await supabase
          .from('client_document_links')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('preset_id', preset.id)
          .maybeSingle();

        if (existingLink?.id) {
          await supabase
            .from('client_document_links')
            .update({
              status: 'completed',
              filled_values: valuesToSave,
              generated_pdf_url: finalPublicUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLink.id);
        } else {
          await supabase
            .from('client_document_links')
            .insert({
              cliente_id: cliente.id,
              preset_id: preset.id,
              tramite_type: tramiteType || 'todos',
              token: `direct_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              status: 'completed',
              filled_values: valuesToSave,
              generated_pdf_url: finalPublicUrl,
            });
        }
      }

      toast.success(`¡Documento "${preset.name}" guardado exitosamente en el expediente!`);
      if (onSaveSuccess) {
        onSaveSuccess(finalPublicUrl, preset.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al guardar y generar documento:', err);
      toast.error(`Error: ${err.message || 'No se pudo guardar el documento.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zonas ordenadas lógicamente por página y posición vertical
  const sortedZones = useMemo(() => {
    return [...activeZonesWithAlignment].sort((a, b) => {
      const pageDiff = (a.pageNumber || 1) - (b.pageNumber || 1);
      if (pageDiff !== 0) return pageDiff;
      return a.y - b.y;
    });
  }, [activeZonesWithAlignment]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full h-full max-w-7xl max-h-[96vh] flex flex-col bg-[#0d0e12] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER PRINCIPAL */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#12131a] border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30 shrink-0">
              <FileText className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {preset.name}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Llenado en Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                Cliente:{' '}
                <strong className="text-zinc-200 font-semibold">
                  {[cliente?.nombre, cliente?.apellido_paterno, cliente?.apellido_materno].filter(Boolean).join(' ') || 'Cliente no asignado'}
                </strong>
                {cliente?.nss ? <span className="ml-2 font-mono text-zinc-500 text-[11px]">NSS: {cliente.nss}</span> : null}
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-rellenar para pruebas */}
            <button
              type="button"
              onClick={handleQuickAutoFill}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Rellenar automáticamente todos los campos para probar la visualización"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-rellenar (Prueba)</span>
            </button>

            {/* Descargar copia directa */}
            <button
              type="button"
              onClick={handleDownloadPdfLocally}
              disabled={loadingPdf || isDownloading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Descargar PDF con los datos actuales"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#c5a059]" />}
              <span>Descargar Borrador</span>
            </button>

            {/* Cerrar modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS PARA PANTALLAS MÓVILES */}
        <div className="flex lg:hidden border-b border-zinc-800 bg-[#12131a]/80 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              mobileTab === 'form'
                ? 'border-[#c5a059] text-[#dfba73] bg-[#c5a059]/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Formulario ({sortedZones.length} campos)</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('pdf')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              mobileTab === 'pdf'
                ? 'border-[#c5a059] text-[#dfba73] bg-[#c5a059]/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>PDF en Tiempo Real</span>
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL: FORMULARIO + VISTA PREVIA EN VIVO */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* PANEL IZQUIERDO: FORMULARIO DE ENTRADA */}
          <div
            className={`w-full lg:w-[42%] xl:w-[40%] flex flex-col border-r border-zinc-800 bg-[#0d0e12] overflow-hidden ${
              mobileTab === 'form' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Header del formulario */}
            <div className="p-3 sm:p-4 bg-[#12131a] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#c5a059]" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Campos del Documento
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {sortedZones.length} campos
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickAutoFill}
                className="lg:hidden text-[11px] font-bold text-[#dfba73] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-rellenar</span>
              </button>
            </div>

            {/* Barra de alineación automática global */}
            <div className="px-3.5 py-2 bg-[#101118] border-b border-zinc-800/80 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-zinc-400 font-medium">Alineación automática:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetAllAlignments('left')}
                  className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold flex items-center gap-1 border border-zinc-700/60 transition-all cursor-pointer"
                  title="Alinear todos los campos de texto a la izquierda"
                >
                  <AlignLeft className="w-3 h-3 text-[#c5a059]" />
                  <span>Todos Izq</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllAlignments('center')}
                  className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold flex items-center gap-1 border border-zinc-700/60 transition-all cursor-pointer"
                  title="Centrar automáticamente todos los campos de texto en el PDF"
                >
                  <AlignCenter className="w-3 h-3 text-[#c5a059]" />
                  <span>Todos Centro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllAlignments('right')}
                  className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold flex items-center gap-1 border border-zinc-700/60 transition-all cursor-pointer"
                  title="Alinear todos los campos de texto a la derecha"
                >
                  <AlignRight className="w-3 h-3 text-[#c5a059]" />
                  <span>Todos Der</span>
                </button>
              </div>
            </div>

            {/* Lista de campos interactivos con scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {sortedZones.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Este formato no tiene campos definidos en la plantilla.
                </div>
              ) : (
                sortedZones.map((zone, idx) => {
                  const isSig =
                    zone.isSignature ||
                    zone.name.toLowerCase().includes('rubrica') ||
                    zone.name.toLowerCase().includes('firma');
                  const currentVal = formValues[zone.id] || '';
                  const isActive = activeZoneId === zone.id;

                  return (
                    <React.Fragment key={zone.id}>
                      {/* Título de sección si existe */}
                      {zone.sectionHeader && (
                        <div className="pt-3 pb-1 border-b border-[#c5a059]/30 flex items-center gap-2 mt-2">
                          <span className="w-1.5 h-3.5 bg-[#c5a059] rounded-xs" />
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-[#dfba73]">
                            {zone.sectionHeader}
                          </h4>
                        </div>
                      )}

                      {/* Subtítulo si existe */}
                      {zone.sectionSubheader && (
                        <div className="pt-1.5 flex items-center gap-1.5 ml-1">
                          <span className="w-1 h-1 rounded-full bg-sky-400" />
                          <h5 className="text-[10px] font-bold text-zinc-400 uppercase">
                            {zone.sectionSubheader}
                          </h5>
                        </div>
                      )}

                      {/* Tarjeta de campo interactivo */}
                      <div
                        className={`p-3 rounded-2xl border transition-all ${
                          isActive
                            ? 'border-[#c5a059] bg-[#161722] ring-1 ring-[#c5a059]/50 shadow-md shadow-amber-500/5'
                            : 'border-zinc-800 bg-[#12131a]/70 hover:border-zinc-700'
                        }`}
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#c5a059] font-bold">
                              #{idx + 1}
                            </span>
                            <span className="truncate">{zone.name}</span>
                          </label>

                          <div className="flex items-center gap-1 shrink-0">
                            {zone.pageNumber && numPages > 1 && (
                              <button
                                type="button"
                                onClick={() => setCurrentPage(zone.pageNumber)}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                  currentPage === zone.pageNumber
                                    ? 'bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                                title={`Ver en Página ${zone.pageNumber}`}
                              >
                                Pág. {zone.pageNumber}
                              </button>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                              {zone.fieldType === 'circle_select'
                                ? '⭕ Círculo'
                                : isSig
                                ? '✍️ Firma'
                                : '📝 Texto'}
                            </span>
                          </div>
                        </div>

                        {/* BARRA DE HERRAMIENTAS DE ALINEACIÓN Y SANGRÍA (Solo para campos de texto) */}
                        {!isSig && zone.fieldType !== 'circle_select' && (
                          <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
                            <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-700/80">
                              <button
                                type="button"
                                onClick={() => handleAlignmentChange(zone.id, 'left')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  (fieldAlignments[zone.id] || zone.alignment || 'left') === 'left'
                                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                                title="Alinear a la izquierda"
                              >
                                <AlignLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAlignmentChange(zone.id, 'center')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  (fieldAlignments[zone.id] || zone.alignment || 'left') === 'center'
                                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                                title="Centrar texto en el documento"
                              >
                                <AlignCenter className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAlignmentChange(zone.id, 'right')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  (fieldAlignments[zone.id] || zone.alignment || 'left') === 'right'
                                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                                title="Alinear a la derecha"
                              >
                                <AlignRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddIndent(zone.id)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 font-mono transition-all flex items-center gap-1 cursor-pointer"
                              title="Insertar sangría (+4 espacios al inicio para centrar o tabular manualmente)"
                            >
                              <span>+ Sangría (espacios)</span>
                            </button>
                          </div>
                        )}

                        {/* INPUTS SEGÚN EL TIPO DE CAMPO */}
                        {zone.fieldType === 'circle_select' ? (
                          <div className="pt-1 flex flex-wrap gap-2">
                            {zone.circleOptions && zone.circleOptions.length > 0 ? (
                              zone.circleOptions.map((opt) => {
                                const isSelected =
                                  currentVal === opt.id ||
                                  currentVal === `CIRCLE_${opt.id}` ||
                                  currentVal === opt.label;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      handleInputChange(zone.id, `CIRCLE_${opt.id}`);
                                      setActiveZoneId(zone.id);
                                      if (zone.pageNumber && zone.pageNumber !== currentPage) {
                                        setCurrentPage(zone.pageNumber);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#c5a059] text-slate-950 border-[#dfba73] shadow-md shadow-amber-500/20'
                                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                                    }`}
                                  >
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? 'border-slate-950 bg-slate-950' : 'border-zinc-500'
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />}
                                    </span>
                                    <span>{opt.label || 'Seleccionar Círculo'}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = currentVal === 'SELECTED' ? '' : 'SELECTED';
                                  handleInputChange(zone.id, newVal);
                                  setActiveZoneId(zone.id);
                                  if (zone.pageNumber && zone.pageNumber !== currentPage) {
                                    setCurrentPage(zone.pageNumber);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                                  currentVal === 'SELECTED'
                                    ? 'bg-[#c5a059] text-slate-950 border-[#dfba73] shadow-md'
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                    currentVal === 'SELECTED' ? 'border-slate-950 bg-slate-950' : 'border-zinc-500'
                                  }`}
                                >
                                  {currentVal === 'SELECTED' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
                                  )}
                                </span>
                                <span>{currentVal === 'SELECTED' ? 'Círculo Marcado' : 'Marcar Círculo'}</span>
                              </button>
                            )}
                          </div>
                        ) : isSig ? (
                          /* CAMPO DE FIRMA DIGITAL */
                          <div className="pt-1">
                            {currentVal && currentVal.startsWith('data:image/') ? (
                              <div className="flex items-center justify-between gap-3 p-2.5 bg-zinc-900/90 rounded-xl border border-emerald-500/40">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-20 h-10 border border-zinc-700 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0">
                                    <img
                                      src={currentVal}
                                      alt="Firma capturada"
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Firma trazada
                                    </span>
                                    <span className="text-[10px] text-zinc-500 block truncate">
                                      Incrustada en tiempo real
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveSignatureZone({
                                        id: zone.id,
                                        name: zone.name,
                                      })
                                    }
                                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 text-xs transition-colors cursor-pointer"
                                    title="Modificar trazo de firma"
                                  >
                                    <PenTool className="w-3.5 h-3.5 text-[#c5a059]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange(zone.id, '')}
                                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg border border-rose-800/40 text-xs transition-colors cursor-pointer"
                                    title="Eliminar trazo de firma"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSignatureZone({
                                    id: zone.id,
                                    name: zone.name,
                                  });
                                  setActiveZoneId(zone.id);
                                  if (zone.pageNumber && zone.pageNumber !== currentPage) {
                                    setCurrentPage(zone.pageNumber);
                                  }
                                }}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/10 via-[#c5a059]/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 border border-[#c5a059]/40 hover:border-[#c5a059] rounded-xl text-xs font-bold text-[#dfba73] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                              >
                                <PenTool className="w-4 h-4 text-[#c5a059]" />
                                <span>✍️ Dibujar / Capturar Firma Digital</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          /* ENTRADA DE TEXTO (Una sola línea continua; solo hace salto si se presiona Enter) */
                          <textarea
                            ref={(el) => {
                              formInputsRefs.current[zone.id] = el;
                            }}
                            wrap="off"
                            rows={Math.min(6, Math.max(1, (currentVal.match(/\n/g) || []).length + 1))}
                            value={currentVal}
                            onChange={(e) => handleInputChange(zone.id, e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, zone.id)}
                            onFocus={() => {
                              setActiveZoneId(zone.id);
                              if (zone.pageNumber && zone.pageNumber !== currentPage) {
                                setCurrentPage(zone.pageNumber);
                              }
                            }}
                            placeholder={`Escribe ${zone.name}... (Enter para salto de línea, Tab para sangría)`}
                            style={{ whiteSpace: 'pre', overflowX: 'auto' }}
                            className={`w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all resize-none leading-relaxed ${
                              (fieldAlignments[zone.id] || zone.alignment || 'left') === 'center'
                                ? 'text-center'
                                : (fieldAlignments[zone.id] || zone.alignment || 'left') === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* BARRA INFERIOR DEL FORMULARIO CON ACCIONES */}
            <div className="p-3 sm:p-4 bg-[#12131a] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveAndGenerate}
                disabled={isSubmitting || loadingPdf}
                className="flex-1 max-w-[280px] py-2.5 px-4 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Guardando Documento...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Guardar y Generar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PANEL DERECHO: VISUALIZACIÓN EN TIEMPO REAL DEL PDF */}
          <div
            className={`flex-1 flex flex-col bg-[#08090c] overflow-hidden min-h-0 ${
              mobileTab === 'pdf' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Toolbar superior del visor PDF */}
            <div className="px-4 py-2.5 bg-[#12131a] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-zinc-200">
                  Previsualización en Tiempo Real
                </span>
                <span className="hidden sm:inline text-[11px] text-zinc-400">
                  — Se actualiza conforme escribes
                </span>
              </div>

              {/* Controles de Vista, Zoom y Paginación */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Selector de Modo de Ajuste */}
                <div className="flex items-center gap-1 bg-[#0d0e12] p-0.5 rounded-xl border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('page');
                      setZoomLevel(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      fitMode === 'page'
                        ? 'bg-[#c5a059] text-slate-950 font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Ajustar para ver el 100% de la página completa sin que se corte abajo"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver 100% Completo</span>
                    <span className="sm:hidden">100%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('width');
                      setZoomLevel(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      fitMode === 'width'
                        ? 'bg-[#c5a059] text-slate-950 font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Ajustar al ancho de la pantalla (permite scroll vertical)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ajustar Ancho</span>
                    <span className="sm:hidden">Ancho</span>
                  </button>
                </div>

                {/* Controles de Zoom */}
                <div className="flex items-center gap-1 bg-[#0d0e12] px-1 py-0.5 rounded-xl border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('width');
                      setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
                    }}
                    disabled={zoomLevel <= 0.6}
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Reducir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('width');
                      setZoomLevel(1);
                    }}
                    className="font-mono text-[10px] text-zinc-300 hover:text-white px-1 font-semibold"
                    title="Restablecer zoom al 100%"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('width');
                      setZoomLevel((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100));
                    }}
                    disabled={zoomLevel >= 1.8}
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Controles de paginación */}
                <div className="flex items-center gap-1.5 bg-[#0d0e12] px-2 py-1 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-300" />
                  </button>
                  <span className="font-mono font-semibold px-1 text-[11px] text-zinc-200">
                    Pág. {currentPage} / {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    className="p-1 hover:bg-zinc-800 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* ÁREA DEL VISOR PDF CON SCROLL */}
            <div
              ref={pdfScrollContainerRef}
              className="flex-1 overflow-auto p-3 sm:p-5 flex flex-col items-center justify-start min-h-0 bg-neutral-900/60 relative scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-[#c5a059] scrollbar-track-zinc-950/60"
              style={{ overscrollBehavior: 'contain' }}
            >
              {loadingPdf ? (
                <div className="m-auto flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <Loader2 className="w-10 h-10 text-[#c5a059] animate-spin" />
                  <p className="text-sm font-semibold text-zinc-300">
                    Cargando plantilla del documento PDF...
                  </p>
                </div>
              ) : errorMsg ? (
                <div className="m-auto p-6 bg-rose-950/40 border border-rose-800/60 rounded-2xl max-w-md text-center space-y-3 text-rose-300">
                  <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  <p className="text-xs font-semibold">{errorMsg}</p>
                </div>
              ) : pdfBuffer ? (
                <div
                  className={`transition-all duration-150 shadow-2xl rounded-xl overflow-hidden border border-zinc-700/60 bg-white ${
                    fitMode === 'page'
                      ? 'w-fit max-w-full flex justify-center'
                      : 'w-full flex justify-center'
                  }`}
                  style={{
                    width: fitMode === 'page' ? 'auto' : `${Math.round(zoomLevel * 100)}%`,
                    maxWidth: fitMode === 'page' ? 'none' : `${Math.round(zoomLevel * 56)}rem`,
                  }}
                >
                  <CanvasPdfViewer
                    pdfFile={pdfBuffer}
                    currentPage={currentPage}
                    onNumPagesChange={(n) => setNumPages(n)}
                    zones={activeZonesWithAlignment}
                    activeZoneId={activeZoneId}
                    onSelectZone={handleSelectZoneFromPdf}
                    isEditorMode={false}
                    livePreviewValues={formValues}
                    showOverlays={true}
                    readOnly={true}
                    fitMode={fitMode}
                    maxHeight="calc(96vh - 180px)"
                  />
                </div>
              ) : null}
            </div>

            {/* Footer sutil informativo */}
            <div className="px-4 py-2 bg-[#12131a]/90 border-t border-zinc-800 text-center text-[11px] text-zinc-400 shrink-0 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#c5a059]" />
                Haz clic en cualquier área del formulario para editar.
              </span>
              <span className="text-[10px] text-zinc-500">
                Santina Consultoría Web — Llenado Visual de Documentos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE TRAZO DE FIRMA DIGITAL */}
      {activeSignatureZone && (
        <SignaturePadModal
          isOpen={Boolean(activeSignatureZone)}
          title={`Firma para: ${activeSignatureZone.name}`}
          onClose={() => setActiveSignatureZone(null)}
          onSave={(dataUrl) => {
            handleInputChange(activeSignatureZone.id, dataUrl);
            setActiveSignatureZone(null);
            toast.success(`Firma registrada para "${activeSignatureZone.name}"`);
          }}
        />
      )}
    </div>
  );
}
