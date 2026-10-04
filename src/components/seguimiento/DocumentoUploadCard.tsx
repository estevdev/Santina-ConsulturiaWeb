'use client';

import React, { useRef, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Upload,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCheck,
  FileUp,
  ShieldCheck,
} from 'lucide-react';
import { DocumentoRequisito } from '@/types/seguimiento';

interface DocumentoUploadCardProps {
  documento: DocumentoRequisito;
  index: number;
  isUploading: boolean;
  onUpload: (reqKey: string, file: File) => Promise<void>;
  onViewDoc: (url: string, title: string) => void;
}

export function DocumentoUploadCard({
  documento,
  index,
  isUploading,
  onUpload,
  onViewDoc,
}: DocumentoUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setLocalError(null);
    if (file.size > 20 * 1024 * 1024) {
      setLocalError('El archivo excede el límite máximo de 20MB.');
      return;
    }
    try {
      await onUpload(documento.id, file);
    } catch (err: any) {
      setLocalError(err.message || 'Error al subir el archivo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
        dragActive
          ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/40'
          : documento.subido
          ? 'bg-[#101217] border-emerald-500/30'
          : 'bg-[#101217] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Header: Badge y Título */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                documento.subido
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {documento.subido ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                documento.obligatorio
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {documento.obligatorio ? 'Requerido' : 'Opcional'}
            </span>
          </div>

          <div>
            {documento.subido ? (
              documento.subidoPor === 'asesor' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Cargado por Asesor
                </span>
              ) : documento.estadoVerificacion === 'verificado' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Pendiente de Verificación
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-zinc-700">
                <Clock className="w-3 h-3 text-zinc-400" />
                Pendiente de Subir
              </span>
            )}
          </div>
        </div>

        <div>
          <h4
            className={`text-sm sm:text-base font-bold leading-tight ${
              documento.subido ? 'text-white' : 'text-zinc-200'
            }`}
          >
            {documento.titulo}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            {documento.descripcion}
          </p>
        </div>
      </div>

      {/* Feedback de error local */}
      {localError && (
        <div className="my-2.5 p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{localError}</span>
        </div>
      )}

      {/* Formatos e interacción de subida */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Formatos: {documento.formatosAceptados}</span>
          <span>Máx. 20MB</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={documento.mimePattern}
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />

        {documento.subido ? (
          documento.subidoPor === 'asesor' ? (
            /* Subido por el asesor: el cliente NO lo podrá ver ni cambiar */
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/30 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-semibold text-emerald-300 block text-xs">
                  Documento Integrado al Expediente
                </span>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Este documento fue integrado y resguardado por tu asesor. Se encuentra debidamente archivado en tu trámite.
                </p>
              </div>
            </div>
          ) : (
            /* Subido por el cliente: solo podrá ver o cambiar los que él sube */
            <div className="space-y-2 pt-1">
              {documento.estadoVerificacion === 'pendiente' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Archivo recibido. Tu asesor lo revisará para darle el visto bueno y anexarlo formalmente a tu expediente.
                  </span>
                </div>
              )}
              {documento.estadoVerificacion === 'verificado' && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Documento verificado y anexado con éxito a tu expediente.
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {documento.archivoUrl && documento.puedeVer !== false && (
                  <button
                    type="button"
                    onClick={() => onViewDoc(documento.archivoUrl!, documento.titulo)}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>Ver mi archivo</span>
                  </button>
                )}

                {documento.puedeCambiar !== false && (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Reemplazar archivo enviado"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Reemplazar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="pt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 active:scale-[0.99] text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Subiendo documento...</span>
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4 text-zinc-950" />
                  <span>Seleccionar o Arrastrar Archivo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
