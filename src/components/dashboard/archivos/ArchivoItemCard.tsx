'use client';

import React from 'react';
import { ArchivoItem } from '@/types/archivos';
import {
  FileText,
  FileImage,
  CheckCircle2,
  FileQuestion,
  Eye,
  Download,
  Copy,
  ExternalLink,
  Trash2,
  Folder,
  Calendar,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PdfRemoteThumbnail } from './PdfRemoteThumbnail';

interface ArchivoItemCardProps {
  archivo: ArchivoItem;
  onPreview: (archivo: ArchivoItem) => void;
  onDelete?: (archivo: ArchivoItem) => void;
}

export function ArchivoItemCard({ archivo, onPreview, onDelete }: ArchivoItemCardProps) {
  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(archivo.url);
    toast.success('Enlace del archivo copiado al portapapeles');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = archivo.url;
    link.download = archivo.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = archivo.createdAt
    ? new Date(archivo.createdAt).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <div
      onClick={() => onPreview(archivo)}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        archivo.isAnexado
          ? 'border-emerald-500/40 bg-[#0f1715]/70 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-950/30'
          : 'border-zinc-800/80 bg-[#12141a]/70 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40'
      }`}
    >
      {/* Top Banner / Distinction Badge */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between border-b ${
          archivo.isAnexado
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {archivo.isAnexado ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 truncate">
                ✓ ANEXADO AL EXPEDIENTE
              </span>
            </>
          ) : (
            <>
              <FileQuestion className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                ARCHIVO ADICIONAL / HISTORIAL
              </span>
            </>
          )}
        </div>

        {/* Subcarpeta Badge */}
        {archivo.folder && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 shrink-0 flex items-center gap-1">
            <Folder className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{archivo.folder}</span>
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Thumbnail / File Icon Area */}
        <div className="relative w-full h-32 rounded-xl bg-[#090b0e] border border-zinc-800/60 overflow-hidden flex items-center justify-center mb-3 group-hover:border-zinc-700 transition-colors">
          {archivo.isImage ? (
            <img
              src={archivo.url}
              alt={archivo.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : archivo.isPdf ? (
            <PdfRemoteThumbnail
              url={archivo.url}
              title={archivo.displayName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-blue-400/80">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileQuestion className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider text-blue-300/80 uppercase">
                {archivo.extension || 'DOC'}
              </span>
            </div>
          )}

          {/* Quick Preview Hover Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] text-slate-950 text-xs font-bold shadow-lg">
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Archivo</span>
            </span>
          </div>

          {/* Anexado Official Badge Overlay on Preview */}
          {archivo.isAnexado && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Oficial</span>
            </div>
          )}
        </div>

        {/* Title & Requirement info */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs font-bold line-clamp-1 mb-0.5 ${
              archivo.isAnexado ? 'text-white group-hover:text-emerald-300' : 'text-zinc-200 group-hover:text-white'
            }`}
            title={archivo.displayName}
          >
            {archivo.displayName}
          </h4>

          {archivo.anexadoLabel && (
            <p className="text-[11px] text-emerald-400/90 font-medium line-clamp-1 mb-1 flex items-center gap-1">
              <span>📋</span>
              <span>{archivo.anexadoLabel}</span>
            </p>
          )}

          <p className="text-[10px] font-mono text-zinc-500 truncate" title={archivo.name}>
            {archivo.name}
          </p>
        </div>

        {/* Meta Specs */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 font-mono text-zinc-300">
            <HardDrive className="w-3 h-3 text-zinc-500" />
            {archivo.sizeFormatted}
          </span>
          <span className="flex items-center gap-1 text-zinc-500 text-[10px]">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(archivo);
          }}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Visualizar documento"
        >
          <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Descargar archivo"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={copyUrl}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Copiar enlace"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <a
          href={archivo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Abrir en pestaña nueva"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {onDelete && !archivo.isAnexado && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(archivo);
            }}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer ml-auto"
            title="Eliminar de almacenamiento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
