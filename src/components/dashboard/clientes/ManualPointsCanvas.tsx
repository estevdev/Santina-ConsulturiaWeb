'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ManualPointsCanvasProps {
  imageUrl: string;
  points: { x: number; y: number }[];
  onPointsChange: (pts: { x: number; y: number }[]) => void;
}

export function ManualPointsCanvas({
  imageUrl,
  points,
  onPointsChange,
}: ManualPointsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialPointsOnDrag, setInitialPointsOnDrag] = useState<{ x: number; y: number }[] | null>(null);

  useEffect(() => {
    const isPdf = imageUrl.toLowerCase().includes('.pdf');
    if (isPdf) {
      import('pdfjs-dist').then(async (pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const resp = await fetch(imageUrl);
        const buffer = await resp.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const c = document.createElement('canvas');
        c.width = viewport.width;
        c.height = viewport.height;
        const ctx = c.getContext('2d')!;
        await (page as any).render({ canvasContext: ctx, canvas: c, viewport }).promise;
        const img = new Image();
        img.src = c.toDataURL();
        img.onload = () => setImgObj(img);
      });
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => setImgObj(img);
    }
  }, [imageUrl]);

  // Calcular el centro de los 4 puntos
  const getCenterPoint = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length < 4) return { x: 0, y: 0 };
    const avgX = Math.round((pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4);
    const avgY = Math.round((pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4);
    return { x: avgX, y: avgY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgObj.naturalWidth || imgObj.width;
    canvas.height = imgObj.naturalHeight || imgObj.height;

    ctx.drawImage(imgObj, 0, 0);

    // Dibujar polígono entre puntos
    if (points && points.length === 4) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 250));
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const pointNames = ['1 (Top-Left)', '2 (Top-Right)', '3 (Bottom-Right)', '4 (Bottom-Left)'];

      // Dibujar los 4 puntos de las esquinas
      points.forEach((pt, idx) => {
        const radius = Math.max(10, Math.round(canvas.width / 120));
        ctx.fillStyle = activePointIndex === idx ? '#F59E0B' : '#EF4444';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(2, Math.round(canvas.width / 300));
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(13, Math.round(canvas.width / 65))}px sans-serif`;
        ctx.fillText(pointNames[idx], pt.x + radius + 4, pt.y + 4);
      });

      // Dibujar Tirador Central (Mover Todo)
      const center = getCenterPoint(points);
      const centerRadius = Math.max(14, Math.round(canvas.width / 90));
      ctx.fillStyle = activePointIndex === 99 ? '#10B981' : '#6366F1';
      ctx.beginPath();
      ctx.arc(center.x, center.y, centerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 250));
      ctx.stroke();

      // Cruz central en el punto para indicar movimiento global
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.x - centerRadius / 2, center.y);
      ctx.lineTo(center.x + centerRadius / 2, center.y);
      ctx.moveTo(center.x, center.y - centerRadius / 2);
      ctx.lineTo(center.x, center.y + centerRadius / 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(14, Math.round(canvas.width / 60))}px sans-serif`;
      ctx.fillText('❖ Mover Cuadro Completo', center.x + centerRadius + 6, center.y + 5);
    }
  }, [imgObj, points, activePointIndex]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !points || points.length < 4) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const canvasW = canvasRef.current.width;
    const clickThreshold = Math.max(30, Math.round(canvasW / 30));

    // 1. Probar si se hizo clic en el Tirador Central (Mover Todo)
    const center = getCenterPoint(points);
    const centerDist = Math.hypot(center.x - x, center.y - y);
    if (centerDist < clickThreshold * 1.5) {
      setActivePointIndex(99); // 99 es el código para Mover Todo
      setDragStartPos({ x, y });
      setInitialPointsOnDrag([...points]);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2. Probar si se hizo clic en alguna de las 4 esquinas
    let foundIdx: number | null = null;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.hypot(pt.x - x, pt.y - y);
      if (dist < clickThreshold && dist < minDist) {
        minDist = dist;
        foundIdx = idx;
      }
    });

    if (foundIdx !== null) {
      setActivePointIndex(foundIdx);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex === null || !points) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Mover todo el cuadro
    if (activePointIndex === 99 && dragStartPos && initialPointsOnDrag) {
      const deltaX = x - dragStartPos.x;
      const deltaY = y - dragStartPos.y;

      const updated = initialPointsOnDrag.map((pt) => ({
        x: pt.x + deltaX,
        y: pt.y + deltaY,
      }));
      onPointsChange(updated);
      return;
    }

    // Mover una esquina individual
    const updated = [...points];
    updated[activePointIndex] = { x, y };
    onPointsChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex !== null) {
      setActivePointIndex(null);
      setDragStartPos(null);
      setInitialPointsOnDrag(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="max-h-[70vh] max-w-full object-contain cursor-grab active:cursor-grabbing rounded-lg shadow-xl touch-none"
    />
  );
}
