'use client';

import React from 'react';
import { ArchivoItem } from '@/types/archivos';
import {
  FileText,
  FileImage,
  FileQuestion,
  Eye,
  Download,
  Copy,
  ExternalLink,
  Trash2,
  Folder,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ArchivoItemRowProps {
  archivo: ArchivoItem;
  onPreview: (archivo: ArchivoItem) => void;
  onDelete?: (archivo: ArchivoItem) => void;
}

export function ArchivoItemRow({ archivo, onPreview, onDelete }: ArchivoItemRowProps) {
  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(archivo.url);
    toast.success('Enlace copiado al portapapeles');
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
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <tr
      onClick={() => onPreview(archivo)}
      className={`border-b transition-colors cursor-pointer group ${
        archivo.isAnexado
          ? 'border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-950/25'
          : 'border-zinc-800/60 bg-[#12141a]/40 hover:bg-zinc-800/40'
      }`}
    >
      {/* Icon + Display Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              archivo.isAnexado
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : archivo.isPdf
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
            }`}
          >
            {archivo.isPdf ? (
              <FileText className="w-4 h-4" />
            ) : archivo.isImage ? (
              <FileImage className="w-4 h-4" />
            ) : (
              <FileQuestion className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <p
              className={`text-xs font-bold truncate max-w-md ${
                archivo.isAnexado ? 'text-white group-hover:text-emerald-300' : 'text-zinc-200'
              }`}
            >
              {archivo.displayName}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 truncate max-w-sm">{archivo.name}</p>
          </div>
        </div>
      </td>

      {/* Distinction Badge */}
      <td className="px-4 py-3 whitespace-nowrap">
        {archivo.isAnexado ? (
          <div className="inline-flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-900/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Anexado Oficial</span>
            </span>
            {archivo.anexadoLabel && (
              <span className="text-[10px] text-emerald-400/80 font-medium truncate max-w-[160px]">
                {archivo.anexadoLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
            <span>📄 Adicional</span>
          </span>
        )}
      </td>

      {/* Subfolder */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
          <Folder className="w-3 h-3 text-zinc-500" />
          <span>{archivo.folder || 'Raíz'}</span>
        </span>
      </td>

      {/* Size */}
      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-300">
        {archivo.sizeFormatted}
      </td>

      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-zinc-400">
        {formattedDate}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onPreview(archivo)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Visualizar documento"
          >
            <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Descargar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Copiar enlace"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a
            href={archivo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Abrir en pestaña"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onDelete && !archivo.isAnexado && (
            <button
              type="button"
              onClick={() => onDelete(archivo)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Eliminar de almacenamiento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
