'use client';

import React, { useState, useEffect } from 'react';
import {
  Capacitacion,
  CapacitacionAdjunto,
  CapacitacionLink,
  CreateCapacitacionInput,
} from '@/types/capacitacion';
import { parseVideoUrl, formatFileSize, getFileIconBadge } from '@/utils/capacitacionHelper';
import { createClient } from '@/utils/supabase/client';
import {
  X,
  Upload,
  Link as LinkIcon,
  Video as VideoIcon,
  Paperclip,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  StickyNote,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface CapacitacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCapacitacionInput, id?: string) => Promise<boolean>;
  initialData?: Capacitacion | null;
}

const CATEGORIAS_SUGERIDAS = [
  'General',
  'Infonavit',
  'IMSS / Afore',
  'Retiro por Desempleo',
  'Mejoravit',
  'Alta Médica',
  'Gestión y Procesos',
  'Ventas y Asesoría',
];

export default function CapacitacionFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CapacitacionFormModalProps) {
  const supabase = createClient();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [duracion, setDuracion] = useState('');

  // Video State
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Attachments State
  const [adjuntos, setAdjuntos] = useState<CapacitacionAdjunto[]>([]);
  const [isUploadingAdjuntos, setIsUploadingAdjuntos] = useState(false);

  // Links State
  const [links, setLinks] = useState<CapacitacionLink[]>([]);

  // Form submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate data if editing
  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo || '');
      setDescripcion(initialData.descripcion || '');
      setCategoria(initialData.categoria || 'General');
      setDuracion(initialData.duracion || '');
      setVideoUrl(initialData.video_url || '');
      setAdjuntos(initialData.archivos_adjuntos || []);
      setLinks(initialData.links || []);
      setVideoMode(initialData.video_url?.includes('/capacitaciones/videos/') ? 'upload' : 'url');
    } else {
      setTitulo('');
      setDescripcion('');
      setCategoria('General');
      setDuracion('');
      setVideoUrl('');
      setAdjuntos([]);
      setLinks([]);
      setVideoMode('url');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle Video File Upload
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('El archivo seleccionado no es un video válido.');
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(10);

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `videos/${Date.now()}_${cleanName}`;

      setVideoUploadProgress(40);
      const { data, error } = await supabase.storage
        .from('capacitaciones')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      setVideoUploadProgress(80);
      const { data: { publicUrl } } = supabase.storage
        .from('capacitaciones')
        .getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      setVideoUploadProgress(100);
      toast.success('Video subido exitosamente a la plataforma');
    } catch (err: any) {
      console.error('Error al subir video:', err);
      toast.error('Error al subir video', {
        description: err.message || 'Verifica la conexión o el tamaño del archivo.',
      });
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      e.target.value = '';
    }
  };

  // Handle Attachments Upload
  const handleAdjuntosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAdjuntos(true);
    try {
      const newAdjuntos: CapacitacionAdjunto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `archivos/${Date.now()}_${cleanName}`;

        const { error } = await supabase.storage
          .from('capacitaciones')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.error('Error al subir archivo:', file.name, error);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('capacitaciones')
          .getPublicUrl(filePath);

        newAdjuntos.push({
          id: `adjunto_${Date.now()}_${i}`,
          nombre: file.name,
          url: publicUrl,
          tamano: file.size,
          tipo: file.type || 'application/octet-stream',
          nota: '', // Nota opcional
        });
      }

      setAdjuntos((prev) => [...prev, ...newAdjuntos]);
      toast.success(`${newAdjuntos.length} archivo(s) agregado(s)`);
    } catch (err: any) {
      console.error('Error al procesar archivos adjuntos:', err);
      toast.error('Error al subir archivos');
    } finally {
      setIsUploadingAdjuntos(false);
      e.target.value = '';
    }
  };

  // Attachments helpers
  const handleUpdateAdjuntoNota = (id: string, nota: string) => {
    setAdjuntos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, nota } : item))
    );
  };

  const handleRemoveAdjunto = (id: string) => {
    setAdjuntos((prev) => prev.filter((item) => item.id !== id));
  };

  // Links helpers
  const handleAddLink = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: `link_${Date.now()}`,
        titulo: '',
        url: '',
        nota: '',
      },
    ]);
  };

  const handleUpdateLink = (id: string, field: 'titulo' | 'url' | 'nota', value: string) => {
    setLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveLink = (id: string) => {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('El nombre de la capacitación es obligatorio.');
      return;
    }

    if (!videoUrl.trim()) {
      toast.error('Debes proporcionar un video (archivo o enlace de video).');
      return;
    }

    // Filter valid links (those that have a URL)
    const validLinks = links.filter((l) => l.url.trim().length > 0);

    const parsed = parseVideoUrl(videoUrl);

    const payload: CreateCapacitacionInput = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria: categoria.trim() || 'General',
      duracion: duracion.trim() || undefined,
      video_url: videoUrl.trim(),
      video_tipo: parsed.provider,
      archivos_adjuntos: adjuntos,
      links: validLinks,
    };

    setIsSubmitting(true);
    try {
      const ok = await onSave(payload, initialData?.id);
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedCurrentVideo = parseVideoUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] flex items-center justify-center text-zinc-950 font-bold shrink-0 shadow-md">
              <VideoIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialData ? 'Editar Capacitación' : 'Nueva Capacitación'}
              </h2>
              <p className="text-xs text-zinc-400">
                Registra video, archivos adjuntos y enlaces con notas explicativas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. INFORMACIÓN BÁSICA */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              1. Información General
            </h3>

            {/* Nombre de la capacitación */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nombre de la capacitación <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Proceso de Trámite Mejoravit: Expediente y Validación"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-sm placeholder:text-zinc-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  Categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="General, Infonavit, IMSS..."
                    list="categorias-list"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-sm placeholder:text-zinc-500 outline-none transition-all"
                  />
                  <datalist id="categorias-list">
                    {CATEGORIAS_SUGERIDAS.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Duración aproximada (opcional)
                </label>
                <input
                  type="text"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  placeholder="Ej. 15 min, 45 min, 1h 20m"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-sm placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                Descripción
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el objetivo del video, conceptos clave y a quién está dirigido..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-sm placeholder:text-zinc-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* 2. VIDEO DE CAPACITACIÓN */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                <VideoIcon className="w-3.5 h-3.5" />
                2. Video de la Capacitación <span className="text-rose-400">*</span>
              </h3>

              {/* Video input mode selector */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setVideoMode('url')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    videoMode === 'url'
                      ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Enlace (YouTube / Drive / URL)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('upload')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    videoMode === 'upload'
                      ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Subir archivo MP4
                </button>
              </div>
            </div>

            {videoMode === 'url' ? (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o Google Drive / Vimeo / Loom / MP4 directo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-sm placeholder:text-zinc-500 outline-none transition-all"
                  />
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Compatible con YouTube, Google Drive compartido, Vimeo, Loom y enlaces directos de video.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-[#c5a059]/50 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/60 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-[#c5a059]" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {isUploadingVideo ? 'Subiendo video...' : 'Haz clic para seleccionar o arrastra tu archivo de video'}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1">
                    Formatos soportados: MP4, WebM, MOV
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileUpload}
                    disabled={isUploadingVideo}
                    className="hidden"
                  />
                </label>

                {isUploadingVideo && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                        Subiendo video a Santina Cloud...
                      </span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#c5a059] to-[#dfba73] transition-all duration-300"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video preview preview pill if exists */}
            {videoUrl && (
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-zinc-200 truncate font-mono">
                    {videoUrl}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-[#dfba73] border border-[#c5a059]/20 shrink-0">
                    {parsedCurrentVideo.provider}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
                  title="Quitar video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 3. ARCHIVOS ADJUNTOS CON NOTAS */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5" />
                  3. Archivos Adjuntos de la Capacitación
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Formatos PDF, Word, Excel, guías. Opcionalmente puedes agregar notas a cada archivo.
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 cursor-pointer transition-all">
                {isUploadingAdjuntos ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#c5a059]" />
                )}
                <span>{isUploadingAdjuntos ? 'Subiendo...' : 'Agregar Archivo'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleAdjuntosUpload}
                  disabled={isUploadingAdjuntos}
                  className="hidden"
                />
              </label>
            </div>

            {adjuntos.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                <p className="text-xs text-zinc-500">
                  Aún no has adjuntado archivos. Puedes subir manuales, plantillas o formatos de trámite.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {adjuntos.map((file) => {
                  const badge = getFileIconBadge(file.nombre);
                  return (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${badge.color} shrink-0`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs font-medium text-zinc-200 truncate">
                            {file.nombre}
                          </span>
                          {file.tamano && (
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              ({formatFileSize(file.tamano)})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAdjunto(file.id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* NOTA DEL ARCHIVO (OPCIONAL) */}
                      <div className="relative">
                        <input
                          type="text"
                          value={file.nota || ''}
                          onChange={(e) => handleUpdateAdjuntoNota(file.id, e.target.value)}
                          placeholder="Nota opcional del archivo (ej. Leer páginas 2 a 5 antes de solicitar firma)"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-all"
                        />
                        <StickyNote className="w-3.5 h-3.5 text-[#c5a059] absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. LINK DE LA CAPACITACIÓN CON NOTAS */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  4. Enlaces de la Capacitación
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Enlaces a portales oficiales, simuladores o herramientas. Opcionalmente pueden llevar notas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Agregar Enlace</span>
              </button>
            </div>

            {links.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                <p className="text-xs text-zinc-500">
                  No has agregado enlaces externos. Haz clic en &ldquo;Agregar Enlace&rdquo; si deseas añadir referencias.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          value={link.titulo || ''}
                          onChange={(e) => handleUpdateLink(link.id, 'titulo', e.target.value)}
                          placeholder="Nombre del enlace (ej. Portal Infonavit Asesores)"
                          className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-[#c5a059] text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-all"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-[#c5a059] text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-all font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
                        title="Eliminar enlace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* NOTA DEL LINK (OPCIONAL) */}
                    <div className="relative">
                      <input
                        type="text"
                        value={link.nota || ''}
                        onChange={(e) => handleUpdateLink(link.id, 'nota', e.target.value)}
                        placeholder="Nota opcional del enlace (ej. Acceder usando el correo institucional del despacho)"
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-all"
                      />
                      <StickyNote className="w-3.5 h-3.5 text-blue-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#9a7b38] hover:from-[#d8b368] hover:to-[#b08e45] text-zinc-950 text-xs font-bold shadow-lg shadow-[#c5a059]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData ? 'Guardar Cambios' : 'Crear Capacitación'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
