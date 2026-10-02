'use client';

import React, { useState } from 'react';
import { Capacitacion } from '@/types/capacitacion';
import { parseVideoUrl, formatFileSize, getFileIconBadge } from '@/utils/capacitacionHelper';
import {
  X,
  Play,
  FileText,
  Download,
  ExternalLink,
  Tag,
  Clock,
  Calendar,
  Paperclip,
  StickyNote,
  Maximize2,
  Share2,
  Check,
  Video as VideoIcon,
  Info,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface CapacitacionPlayerModalProps {
  capacitacion: Capacitacion | null;
  onClose: () => void;
}

export default function CapacitacionPlayerModal({
  capacitacion,
  onClose,
}: CapacitacionPlayerModalProps) {
  if (!capacitacion) return null;

  const { provider, embedUrl, isDirectVideo } = parseVideoUrl(capacitacion.video_url);
  const attachments = capacitacion.archivos_adjuntos || [];
  const links = capacitacion.links || [];

  const formattedDate = new Date(capacitacion.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] flex items-center justify-center text-zinc-950 font-bold shrink-0 shadow-md">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="truncate">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {capacitacion.titulo}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                {capacitacion.categoria && (
                  <span className="inline-flex items-center gap-1 text-[#dfba73] font-medium">
                    <Tag className="w-3 h-3 text-[#c5a059]" />
                    {capacitacion.categoria}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {formattedDate}
                </span>
                {capacitacion.duracion && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {capacitacion.duracion}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium"
              title="Descarga deshabilitada para proteger el material interno"
            >
              <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Protegido contra descargas</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          {/* Main Video & Description Column (7 Cols on large screen) */}
          <div className="lg:col-span-7 xl:col-span-8 p-6 flex flex-col space-y-6">
            {/* Video Player Container */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800/80 shadow-2xl select-none"
            >
              {isDirectVideo ? (
                <video
                  src={capacitacion.video_url}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  playsInline
                  className="w-full h-full object-contain pointer-events-auto"
                >
                  Tu navegador no soporta la reproducción de video HTML5.
                </video>
              ) : embedUrl ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={embedUrl}
                    title={capacitacion.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                  {/* Capa invisible para evitar que hagan clic en el botón de ventana emergente / descarga de Google Drive */}
                  {provider === 'drive' && (
                    <div
                      className="absolute top-0 right-0 w-16 h-16 z-20 cursor-default bg-transparent"
                      title="Descarga deshabilitada"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <VideoIcon className="w-12 h-12 text-zinc-600 mb-3" />
                  <p className="text-zinc-300 font-medium">No se pudo cargar el reproductor integrado.</p>
                  <p className="text-xs text-zinc-500 mt-1">El formato del video no es compatible o el enlace no es válido.</p>
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {capacitacion.titulo}
              </h3>
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#c5a059]" />
                  Descripción de la capacitación
                </h4>
                <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                  {capacitacion.descripcion || 'Sin descripción detallada registrada para esta capacitación.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Attachments & Links with Notes (5 Cols on large screen) */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 bg-zinc-900/30 flex flex-col space-y-6 overflow-y-auto">
            {/* Section 1: Archivos Adjuntos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#c5a059]">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Archivos Adjuntos
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {attachments.length}
                </span>
              </div>

              {attachments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
                  <p className="text-xs text-zinc-500">No se adjuntaron archivos para esta capacitación.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((file, idx) => {
                    const badge = getFileIconBadge(file.nombre);
                    return (
                      <div
                        key={file.id || idx}
                        className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${badge.color} shrink-0`}
                            >
                              {badge.label}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-200 truncate" title={file.nombre}>
                                {file.nombre}
                              </p>
                              {file.tamano && (
                                <p className="text-[10px] text-zinc-500">
                                  {formatFileSize(file.tamano)}
                                </p>
                              )}
                            </div>
                          </div>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={file.nombre}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-[#c5a059] hover:text-zinc-950 text-zinc-300 transition-colors shrink-0"
                            title="Descargar archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* NOTA DEL ARCHIVO */}
                        {file.nota && file.nota.trim() && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[11px] leading-relaxed">
                            <StickyNote className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-[#dfba73] block mb-0.5">Nota del archivo:</span>
                              <p className="text-zinc-300">{file.nota}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Links de la Capacitación */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Enlaces de Interés
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {links.length}
                </span>
              </div>

              {links.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
                  <p className="text-xs text-zinc-500">No se registraron enlaces para esta capacitación.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link, idx) => (
                    <div
                      key={link.id || idx}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {link.titulo || 'Enlace externo'}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-mono">
                            {link.url}
                          </p>
                        </div>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-[#c5a059] hover:text-zinc-950 text-zinc-200 transition-colors shrink-0"
                        >
                          <span>Visitar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* NOTA DEL LINK */}
                      {link.nota && link.nota.trim() && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200/90 text-[11px] leading-relaxed">
                          <StickyNote className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-blue-300 block mb-0.5">Nota del enlace:</span>
                            <p className="text-zinc-300">{link.nota}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Capacitación interna de Santina Consultoría Web</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
