'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

let pdfjsLibCache: any = null;
async function getPdfjs() {
  if (!pdfjsLibCache) {
    const lib = await import('pdfjs-dist');
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLibCache = lib;
  }
  return pdfjsLibCache;
}

export interface PdfViewerModalData {
  url: string;
  title: string;
  isPdf?: boolean;
  isImage?: boolean;
  anexadoLabel?: string;
  isAnexado?: boolean;
}

interface PdfRemoteViewerModalProps {
  modalData: PdfViewerModalData | null;
  onClose: () => void;
  onDownload: (url: string, title: string) => void;
}

export function PdfRemoteViewerModal({
  modalData,
  onClose,
  onDownload,
}: PdfRemoteViewerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de PDF
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas'); // 'canvas' o 'native' (iframe)
  const [error, setError] = useState<string | null>(null);

  const isPdf = modalData
    ? modalData.isPdf ?? (modalData.url.toLowerCase().includes('.pdf') || !modalData.url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/))
    : false;

  const isImage = modalData ? !isPdf : false;

  // Cargar documento PDF cuando cambia la URL
  useEffect(() => {
    if (!modalData || !isPdf) return;

    let isMounted = true;
    let currentDoc: any = null;

    async function loadDocument() {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setRotation(0);
        setScale(1.2);

        const pdfjs = await getPdfjs();
        if (!isMounted) return;

        const response = await fetch(modalData!.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (!isMounted) return;

        const loadingTask = pdfjs.getDocument({ data: buffer.slice(0) });
        currentDoc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(currentDoc);
        setNumPages(currentDoc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Error al cargar PDF en visor:', err);
        if (isMounted) {
          setError(err.message || 'Error al cargar el documento');
          setLoading(false);
          // Fallback automático al visor nativo si pdfjs falla
          setViewMode('native');
        }
      }
    }

    loadDocument();

    return () => {
      isMounted = false;
      if (currentDoc) {
        currentDoc.destroy();
      }
    };
  }, [modalData?.url, isPdf]);

  // Renderizar la página actual en el canvas
  useEffect(() => {
    if (!pdfDoc || !isPdf || viewMode !== 'canvas') return;

    let isMounted = true;
    let renderTask: any = null;

    async function renderPage() {
      try {
        setRenderingPage(true);
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display',
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Error al renderizar página del PDF:', err);
        }
      } finally {
        if (isMounted) {
          setRenderingPage(false);
        }
      }
    }

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, viewMode, isPdf]);

  // Manejo de teclado (Escape para cerrar, flechas para página)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && isPdf && currentPage < numPages) {
        setCurrentPage((p) => Math.min(numPages, p + 1));
      } else if (e.key === 'ArrowLeft' && isPdf && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isPdf, currentPage, numPages]);

  if (!modalData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1015] border border-zinc-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Barra Superior de Herramientas */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/90 bg-zinc-900/60">
          {/* Título y Requisito */}
          <div className="flex items-center gap-2.5 min-w-0 max-w-md">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {modalData.title}
                </h3>
                {modalData.isAnexado && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                    Oficial
                  </span>
                )}
              </div>
              {modalData.anexadoLabel && (
                <p className="text-[10px] text-emerald-400 font-medium truncate">
                  {modalData.anexadoLabel}
                </p>
              )}
            </div>
          </div>

          {/* Controles de Navegación y Zoom (Solo para PDF) */}
          {isPdf && !loading && (
            <div className="flex items-center gap-1.5 bg-[#141720] border border-zinc-800 rounded-xl p-1 shrink-0">
              {/* Selector de Página */}
              <div className="flex items-center gap-1 px-1.5 text-xs text-zinc-300 font-mono">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || renderingPage}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800 cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold">
                  {currentPage} <span className="text-zinc-500">/ {numPages}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages || renderingPage}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800 cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-[1px] h-4 bg-zinc-800" />

              {/* Zoom In / Out */}
              {viewMode === 'canvas' && (
                <>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                    title="Reducir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 w-9 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)))}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-zinc-800" />

                  {/* Rotar */}
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                    title="Girar 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <div className="w-[1px] h-4 bg-zinc-800" />

              {/* Alternar Visor Canvas / Nativo */}
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'canvas' ? 'native' : 'canvas'))}
                className="px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title={viewMode === 'canvas' ? 'Cambiar a visor nativo del navegador' : 'Cambiar a visor interactivo nítido'}
              >
                {viewMode === 'canvas' ? 'Visor Nativo' : 'Visor Nítido'}
              </button>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(modalData.url, modalData.title)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#dfba73] text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <a
              href={modalData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área del Contenido del Documento */}
        <div
          ref={containerRef}
          className="flex-1 bg-[#090a0d] flex items-center justify-center overflow-auto p-4 relative"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
              <p className="text-xs font-medium">Cargando documento en alta resolución...</p>
            </div>
          )}

          {/* Visualizador de Imágenes */}
          {isImage && (
            <img
              src={modalData.url}
              alt={modalData.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-zinc-800/80"
            />
          )}

          {/* Visualizador de PDFs - Modo Canvas Nítido */}
          {isPdf && !loading && viewMode === 'canvas' && (
            <div className="flex flex-col items-center justify-center min-h-full py-4">
              <div className="relative shadow-2xl border border-zinc-800 rounded-xl overflow-hidden bg-white">
                <canvas ref={canvasRef} className="block max-w-full h-auto" />
                {renderingPage && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c5a059]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visualizador de PDFs - Modo Nativo Iframe */}
          {isPdf && !loading && viewMode === 'native' && (
            <iframe
              src={modalData.url}
              title={modalData.title}
              className="w-full h-full rounded-xl border border-zinc-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
