'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';

// Cache en memoria para miniaturas de PDFs por URL
const pdfThumbnailCache = new Map<string, string>();

let pdfjsLibCache: any = null;
async function getPdfjs() {
  if (!pdfjsLibCache) {
    const lib = await import('pdfjs-dist');
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLibCache = lib;
  }
  return pdfjsLibCache;
}

interface PdfRemoteThumbnailProps {
  url: string;
  title: string;
  className?: string;
}

export const PdfRemoteThumbnail = React.memo(function PdfRemoteThumbnail({
  url,
  title,
  className = '',
}: PdfRemoteThumbnailProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(() => pdfThumbnailCache.get(url) || null);
  const [loading, setLoading] = useState<boolean>(() => !pdfThumbnailCache.has(url));
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Si ya está en caché, usarlo inmediatamente
    if (pdfThumbnailCache.has(url)) {
      setThumbUrl(pdfThumbnailCache.get(url)!);
      setLoading(false);
      return;
    }

    async function loadPdfThumbnail() {
      try {
        setLoading(true);
        setError(false);

        const pdfjs = await getPdfjs();
        if (!isMounted) return;

        // Descargar buffer del PDF
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (!isMounted) return;

        const loadingTask = pdfjs.getDocument({ data: buffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        const page = await pdfDoc.getPage(1);
        if (!isMounted) return;

        // Renderizado nítido de la primera página
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = Math.max(600, unscaledViewport.width * 1.2);
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('No 2d context');

        // Fondo blanco para evitar fondos negros o transparentes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display',
        });
        await renderTask.promise;

        if (isMounted) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          pdfThumbnailCache.set(url, dataUrl);
          setThumbUrl(dataUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn(`No se pudo generar miniatura para ${url}:`, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPdfThumbnail();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (thumbUrl) {
    return (
      <div className={`relative w-full h-full bg-white flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={thumbUrl}
          alt={title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Marca de agua pequeña tipo PDF en la esquina */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[9px] font-bold font-mono text-red-400 border border-red-500/30">
          PDF
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#090b0e] text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin text-[#c5a059]" />
        <span className="text-[10px] text-zinc-400">Generando vista...</span>
      </div>
    );
  }

  // Fallback si ocurre un error
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-red-400/80">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
        <FileText className="w-6 h-6 text-red-400" />
      </div>
      <span className="text-[10px] font-bold font-mono tracking-wider text-red-300/80">PDF</span>
    </div>
  );
});
