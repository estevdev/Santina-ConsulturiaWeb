'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronLeft,
  ShieldCheck,
  Info,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { TramiteResultado } from '@/types/seguimiento';
import { DocumentoUploadCard } from './DocumentoUploadCard';
import { DocumentViewerModal, DocumentViewerModalState } from './DocumentViewerModal';

interface SubirDocumentosViewProps {
  resultado: TramiteResultado;
  folio: string;
  nss: string;
  onRefreshData?: () => Promise<void>;
}

export function SubirDocumentosView({
  resultado: initialResultado,
  folio,
  nss,
  onRefreshData,
}: SubirDocumentosViewProps) {
  const [resultado, setResultado] = useState<TramiteResultado>(initialResultado);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [viewerModal, setViewerModal] = useState<DocumentViewerModalState | null>(null);
  const [globalFeedback, setGlobalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sincronizar si las props cambian
  React.useEffect(() => {
    setResultado(initialResultado);
  }, [initialResultado]);

  const copiarEnlaceCompartible = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/seguimiento/subir-documentos?folio=${resultado.tramite.folio}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUploadDocumento = async (reqKey: string, file: File) => {
    setUploadingDocKey(reqKey);
    setGlobalFeedback(null);

    try {
      const formData = new FormData();
      formData.append('folio', folio);
      formData.append('nss', nss);
      formData.append('reqKey', reqKey);
      formData.append('file', file);

      const res = await fetch('/api/seguimiento/subir-documento', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo subir el archivo.');
      }

      // Actualizar estado local inmediatamente
      setResultado((prev) => {
        const updatedDocs = prev.documentos.map((doc) => {
          if (doc.id === reqKey) {
            return {
              ...doc,
              subido: true,
              archivoUrl: data.url,
            };
          }
          return doc;
        });

        const subidos = updatedDocs.filter((d) => d.subido).length;
        const total = updatedDocs.length;
        const porcentaje = total > 0 ? Math.round((subidos / total) * 100) : 0;

        return {
          ...prev,
          documentos: updatedDocs,
          progresoDocumentos: {
            subidos,
            total,
            porcentaje,
          },
        };
      });

      setGlobalFeedback({
        type: 'success',
        text: `¡Documento subido correctamente! Se ha registrado en tu expediente.`,
      });

      if (onRefreshData) {
        onRefreshData().catch(() => {});
      }
    } catch (err: any) {
      console.error('Error al subir documento:', err);
      setGlobalFeedback({
        type: 'error',
        text: err.message || 'Error al procesar el archivo. Intenta de nuevo.',
      });
      throw err;
    } finally {
      setUploadingDocKey(null);
    }
  };

  const progresoDocs = resultado.progresoDocumentos || {
    subidos: resultado.documentos.filter((d) => d.subido).length,
    total: resultado.documentos.length,
    porcentaje: resultado.documentos.length > 0
      ? Math.round((resultado.documentos.filter((d) => d.subido).length / resultado.documentos.length) * 100)
      : 0,
  };

  const totalPendientes = progresoDocs.total - progresoDocs.subidos;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Botón Volver y Enlace Compartible */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/seguimiento?folio=${resultado.tramite.folio}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1 self-start cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#c5a059]" />
          <span>Volver al Avance del Trámite</span>
        </Link>

        {/* Botón para compartir esta sección */}
        <button
          type="button"
          onClick={copiarEnlaceCompartible}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#c5a059]/40 text-[#dfba73] hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          title="Copiar enlace para compartir esta sección con el cliente"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#c5a059]" />}
          <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir Enlace de Subida'}</span>
        </button>
      </div>

      {/* Tarjeta de Resumen del Expediente */}
      <div className="bg-[#101217] rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#c5a059] tracking-wider">
              Cliente: {resultado.cliente.nombrePublico}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <UploadCloud className="w-5 h-5 text-[#c5a059]" />
              Buzón de Documentos del Expediente
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                Folio: {resultado.tramite.folio}
              </span>
              <span className="text-[11px] text-zinc-400">
                • {resultado.tramite.tipoNombre}
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                totalPendientes === 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {totalPendientes === 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Expediente Completo
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {totalPendientes} {totalPendientes === 1 ? 'documento pendiente' : 'documentos pendientes'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Progreso de Documentación */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-zinc-400">Progreso de Documentos Subidos</span>
            <span className="text-[#dfba73] font-bold">
              {progresoDocs.subidos} de {progresoDocs.total} ({progresoDocs.porcentaje}%)
            </span>
          </div>
          <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden border border-zinc-700/50">
            <div
              className="bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progresoDocs.porcentaje}%` }}
            />
          </div>
        </div>

        {/* Nota de Seguridad del Enlace */}
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-200">Enlace seguro:</strong> Puedes compartir la dirección de esta página. Para visualizar o subir nuevos archivos, cualquier usuario deberá autenticarse ingresando el NSS correspondiente a este folio.
          </p>
        </div>
      </div>

      {/* Feedback Global */}
      {globalFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-200 ${
            globalFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {globalFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{globalFeedback.text}</span>
        </div>
      )}

      {/* Banner de Consejos Rápidos para el Cliente */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#c5a059]/10 via-[#c5a059]/5 to-transparent border border-[#c5a059]/20 text-xs text-zinc-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#dfba73] block">Instrucciones para subir tus archivos:</span>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Asegúrate de que las fotografías o archivos escaneados no tengan brillo excesivo, estén bien iluminados y sean legibles en su totalidad. Puedes subir imágenes desde tu cámara o galería, o documentos en formato PDF.
          </p>
        </div>
      </div>

      {/* Lista de Documentos Requeridos */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-800">
          <span>Requisitos del Expediente</span>
          <span className="text-[11px] font-mono text-zinc-500">
            {resultado.documentos.length} Documentos en total
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {resultado.documentos.map((doc, idx) => (
            <DocumentoUploadCard
              key={doc.id}
              documento={doc}
              index={idx}
              isUploading={uploadingDocKey === doc.id}
              onUpload={handleUploadDocumento}
              onViewDoc={(url, title) => setViewerModal({ url, title })}
            />
          ))}
        </div>
      </div>

      {/* Modal Visualizador */}
      {viewerModal && (
        <DocumentViewerModal
          modalData={viewerModal}
          onClose={() => setViewerModal(null)}
        />
      )}
    </div>
  );
}
