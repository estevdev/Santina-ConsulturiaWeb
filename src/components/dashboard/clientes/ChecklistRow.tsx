'use client';

import React from 'react';
import { Check, Eye, Download, Upload } from 'lucide-react';

export function DocumentNoFileIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hoja de documento cerrado con esquina doblada */}
      <path
        d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9L13 2z"
        stroke="#a1a1aa"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#18181b"
      />
      <path
        d="M13 2v7h7"
        stroke="#a1a1aa"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Líneas sutiles de texto del documento */}
      <path
        d="M8 13h5M8 17h4"
        stroke="#52525b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Círculo rojo con una X */}
      <circle
        cx="17"
        cy="17"
        r="5.5"
        fill="#ef4444"
        stroke="#0d0e12"
        strokeWidth="1.5"
      />
      <path
        d="M15 15l4 4M19 15l-4 4"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ChecklistRowProps {
  tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica';
  tramiteId: string;
  reqKey: string;
  label: string;
  isCompleted?: boolean;
  existingDocUrl?: string | null;
  numberTag?: number;
  extraAction?: React.ReactNode;
  isUploading: boolean;
  isToggling?: boolean;
  isAdmin?: boolean;
  onViewDoc: (url: string, title: string) => void;
  onDownloadDoc: (url: string, title: string) => void;
  onUploadFile: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, file: File) => void;
  onToggleCheck?: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, currentVal: boolean) => void;
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
  isToggling = false,
  isAdmin = false,
  onViewDoc,
  onDownloadDoc,
  onUploadFile,
  onToggleCheck,
}: ChecklistRowProps) {
  const completed = isCompleted !== undefined ? Boolean(isCompleted) : Boolean(existingDocUrl);

  return (
    <div
      key={reqKey}
      className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
        completed
          ? 'bg-zinc-900/90 border-[#c5a059]/30 text-white'
          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
      }`}
    >
      {/* Lado izquierdo: Checkbox interactivo + Etiqueta */}
      <div
        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer select-none group/item"
        onClick={() => {
          if (onToggleCheck && !isToggling) {
            onToggleCheck(tramiteTipo, tramiteId, reqKey, completed);
          }
        }}
        title={
          onToggleCheck
            ? completed
              ? 'Requisito completado (clic para desmarcar)'
              : 'Requisito pendiente (clic para marcar como completado)'
            : undefined
        }
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleCheck && !isToggling) {
              onToggleCheck(tramiteTipo, tramiteId, reqKey, completed);
            }
          }}
          disabled={!onToggleCheck || isToggling}
          title={
            completed
              ? 'Requisito completado (clic para desmarcar)'
              : 'Requisito pendiente (clic para marcar como completado)'
          }
          className={`flex items-center justify-center shrink-0 rounded-md transition-all cursor-pointer disabled:cursor-not-allowed ${
            numberTag ? 'gap-1' : ''
          }`}
        >
          {numberTag && (
            <span
              className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 transition-colors ${
                completed
                  ? 'bg-[#c5a059] text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {numberTag}
            </span>
          )}

          {isToggling ? (
            <div className="w-3.5 h-3.5 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin shrink-0" />
          ) : completed ? (
            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/30 group-hover/item:border-emerald-400 transition-all shadow-sm">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded bg-zinc-800/80 border border-zinc-600/80 flex items-center justify-center text-transparent group-hover/item:border-[#c5a059] group-hover/item:text-[#c5a059]/60 transition-all">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </div>
          )}
        </button>

        <span
          className={`font-semibold truncate leading-tight group-hover/item:text-white transition-colors ${
            completed ? 'text-white' : 'text-zinc-300'
          }`}
        >
          {label}
        </span>
      </div>

      {/* Lado derecho: Acciones y Estado del Archivo */}
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
          /* Archivo NO subido: Icono de documento cerrado con círculo rojo con una X */
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="group/nofile relative flex items-center justify-center p-1 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 transition-all cursor-help"
              title="Archivo no subido"
            >
              <DocumentNoFileIcon className="w-4 h-4" />

              {/* Tooltip flotante al pasar el cursor */}
              <span className="pointer-events-none absolute bottom-full mb-1.5 right-0 px-2 py-0.5 text-[10px] font-semibold text-red-200 bg-zinc-900 border border-red-800/80 rounded-md shadow-xl opacity-0 group-hover/nofile:opacity-100 transition-opacity whitespace-nowrap z-30">
                Archivo no subido
              </span>
            </div>

            {isAdmin ? (
              <label
                title={isUploading ? 'Subiendo archivo...' : 'Subir archivo'}
                className="group/upload relative inline-flex items-center justify-center p-1.5 px-2 text-[10px] font-bold bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isUploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span className="sr-only">Subir archivo</span>

                {/* Tooltip flotante al pasar el mouse por encima */}
                <span className="pointer-events-none absolute bottom-full mb-1.5 right-0 px-2 py-0.5 text-[10px] font-semibold text-zinc-100 bg-zinc-900 border border-zinc-700/80 rounded-md shadow-xl opacity-0 group-hover/upload:opacity-100 transition-opacity whitespace-nowrap z-30">
                  {isUploading ? 'Subiendo...' : 'Subir archivo'}
                </span>

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
              <span className="text-[10px] text-zinc-500 font-medium px-1">
                (Sin archivo)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
