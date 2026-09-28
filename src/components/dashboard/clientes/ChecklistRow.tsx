'use client';

import React from 'react';
import { CheckCircle2, XCircle, Eye, Download, Upload } from 'lucide-react';

interface ChecklistRowProps {
  tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica';
  tramiteId: string;
  reqKey: string;
  label: string;
  isCompleted: boolean;
  existingDocUrl?: string | null;
  numberTag?: number;
  extraAction?: React.ReactNode;
  isUploading: boolean;
  isAdmin?: boolean;
  onViewDoc: (url: string, title: string) => void;
  onDownloadDoc: (url: string, title: string) => void;
  onUploadFile: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, file: File) => void;
}

export function ChecklistRow({
  tramiteTipo,
  tramiteId,
  reqKey,
  label,
  isCompleted,
  existingDocUrl,
  numberTag,
  extraAction,
  isUploading,
  isAdmin = false,
  onViewDoc,
  onDownloadDoc,
  onUploadFile,
}: ChecklistRowProps) {
  const completed = isCompleted || !!existingDocUrl;

  return (
    <div
      key={reqKey}
      className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
        completed
          ? 'bg-zinc-900/90 border-[#c5a059]/30 text-white'
          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {numberTag ? (
          <span
            className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${
              completed ? 'bg-[#c5a059] text-zinc-950' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {numberTag}
          </span>
        ) : completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        )}
        <span className="font-semibold truncate leading-tight">{label}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {extraAction}

        {existingDocUrl ? (
          <>
            {/* Visualizar en Modal Inline */}
            <button
              type="button"
              onClick={() => onViewDoc(existingDocUrl, label)}
              title="Visualizar documento aquí mismo"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>Ver</span>
            </button>

            {/* Descargar Inline */}
            <button
              type="button"
              onClick={() => onDownloadDoc(existingDocUrl, label)}
              title="Descargar documento"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Descargar</span>
            </button>

            {/* Cambiar / Reemplazar (Solo Administradores) */}
            {isAdmin && (
              <label
                title="Cambiar o reemplazar archivo"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 text-zinc-400" />
                )}
                <span>{isUploading ? '...' : 'Cambiar'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadFile(tramiteTipo, tramiteId, reqKey, f);
                  }}
                />
              </label>
            )}
          </>
        ) : (
          /* Subir Archivo (Solo Administradores) */
          isAdmin ? (
            <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 rounded-lg shadow-sm transition-all cursor-pointer">
              {isUploading ? (
                <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFile(tramiteTipo, tramiteId, reqKey, f);
                }}
              />
            </label>
          ) : (
            <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5">
              (Sin documento)
            </span>
          )
        )}
      </div>
    </div>
  );
}
