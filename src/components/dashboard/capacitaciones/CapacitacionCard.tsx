'use client';

import React from 'react';
import { Capacitacion } from '@/types/capacitacion';
import { parseVideoUrl } from '@/utils/capacitacionHelper';
import {
  Play,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  Tag,
  Paperclip,
  StickyNote,
  Video as VideoIcon,
} from 'lucide-react';

interface CapacitacionCardProps {
  capacitacion: Capacitacion;
  canManage: boolean;
  onPlay: (item: Capacitacion) => void;
  onEdit?: (item: Capacitacion) => void;
  onDelete?: (item: Capacitacion) => void;
}

export default function CapacitacionCard({
  capacitacion,
  canManage,
  onPlay,
  onEdit,
  onDelete,
}: CapacitacionCardProps) {
  const { provider, thumbnailUrl } = parseVideoUrl(capacitacion.video_url);

  const attachmentsCount = capacitacion.archivos_adjuntos?.length || 0;
  const linksCount = capacitacion.links?.length || 0;

  const hasAttachmentNotes = capacitacion.archivos_adjuntos?.some((a) => !!a.nota?.trim());
  const hasLinkNotes = capacitacion.links?.some((l) => !!l.nota?.trim());

  return (
    <div className="group relative flex flex-col bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-[#c5a059]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#c5a059]/10 hover:-translate-y-1">
      {/* Thumbnail / Video Preview Area */}
      <div
        onClick={() => onPlay(capacitacion)}
        className="relative aspect-video w-full bg-zinc-950 overflow-hidden cursor-pointer select-none group-hover:brightness-105"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={capacitacion.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.12)_0%,_transparent_70%)]" />
            <VideoIcon className="w-12 h-12 text-zinc-700 group-hover:text-[#c5a059]/60 transition-colors" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-13 h-13 rounded-full bg-[#c5a059]/90 text-zinc-950 flex items-center justify-center shadow-lg shadow-[#c5a059]/30 transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Category Badge Top Left */}
        {capacitacion.categoria && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide bg-zinc-950/80 backdrop-blur-md text-[#dfba73] border border-[#c5a059]/30 shadow-sm">
              <Tag className="w-3 h-3 text-[#c5a059]" />
              {capacitacion.categoria}
            </span>
          </div>
        )}

        {/* Duration / Provider Badge Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {capacitacion.duracion && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-black/70 backdrop-blur-md text-zinc-300 border border-zinc-700/50">
              <Clock className="w-3 h-3 text-amber-400" />
              {capacitacion.duracion}
            </span>
          )}
          <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900/80 backdrop-blur-md text-zinc-400 border border-zinc-800">
            {provider === 'youtube' ? 'YouTube' : provider === 'vimeo' ? 'Vimeo' : provider === 'drive' ? 'Drive' : 'Video'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-5">
        <h3
          onClick={() => onPlay(capacitacion)}
          className="text-base font-bold text-white group-hover:text-[#dfba73] transition-colors line-clamp-1 cursor-pointer mb-1.5"
          title={capacitacion.titulo}
        >
          {capacitacion.titulo}
        </h3>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4 flex-1">
          {capacitacion.descripcion || 'Sin descripción detallada disponible.'}
        </p>

        {/* Attached files and Links info strip */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80 text-xs">
          {/* Attachments pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              attachmentsCount > 0
                ? 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/60'
                : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50'
            }`}
            title={`${attachmentsCount} archivos adjuntos ${hasAttachmentNotes ? '(incluye notas explicativas)' : ''}`}
          >
            <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
            <span>{attachmentsCount} {attachmentsCount === 1 ? 'adjunto' : 'adjuntos'}</span>
            {hasAttachmentNotes && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" title="Contiene notas" />
            )}
          </div>

          {/* Links pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              linksCount > 0
                ? 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/60'
                : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50'
            }`}
            title={`${linksCount} enlaces ${hasLinkNotes ? '(incluye notas explicativas)' : ''}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>{linksCount} {linksCount === 1 ? 'link' : 'links'}</span>
            {hasLinkNotes && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" title="Contiene notas" />
            )}
          </div>

          {(hasAttachmentNotes || hasLinkNotes) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#c5a059] ml-auto font-medium">
              <StickyNote className="w-3 h-3" />
              Con notas
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-800/50">
          <button
            onClick={() => onPlay(capacitacion)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#c5a059] to-[#9a7b38] hover:from-[#d8b368] hover:to-[#b08e45] text-zinc-950 shadow-md shadow-[#c5a059]/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ver Capacitación</span>
          </button>

          {canManage && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(capacitacion)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Editar capacitación"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(capacitacion)}
                  className="p-2 rounded-xl text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Eliminar capacitación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
