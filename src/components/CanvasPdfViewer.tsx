'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FieldZone, ProcessedFieldValues, RichTextValue } from '@/types/preset';

interface CanvasPdfViewerProps {
  pdfFile: File | ArrayBuffer;
  currentPage: number;
  onNumPagesChange?: (pages: number) => void;
  zones?: FieldZone[];
  activeZoneId?: string | null;
  onSelectZone?: (id: string) => void;
  onAddZone?: (zone: Partial<FieldZone>) => void;
  onUpdateZone?: (zone: FieldZone) => void;
  isEditorMode?: boolean;
  livePreviewValues?: ProcessedFieldValues; // Valores en tiempo real
  showOverlays?: boolean; // Controla si se ven las zonas/ediciones o el fondo original puro
}

export default function CanvasPdfViewer({
  pdfFile,
  currentPage,
  onNumPagesChange,
  zones = [],
  activeZoneId,
  onSelectZone,
  onAddZone,
  onUpdateZone,
  isEditorMode = false,
  livePreviewValues = {},
  showOverlays = true,
}: CanvasPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  // Estados de dibujo
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Estados de arrastre / movimiento
  const [isDragging, setIsDragging] = useState(false);
  const [dragZoneId, setDragZoneId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estados de redimensionamiento (resize handle)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeZoneId, setResizeZoneId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [displayScale, setDisplayScale] = useState<number>(1);
  const [nativePageSize, setNativePageSize] = useState<{ width: number; height: number } | null>(null);

  // Cargar pdfjs
  useEffect(() => {
    let isMounted = true;

    async function loadPdf() {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      let buffer: ArrayBuffer;
      if (pdfFile instanceof File) {
        buffer = await pdfFile.arrayBuffer();
      } else {
        buffer = pdfFile;
      }

      const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
      const doc = await loadingTask.promise;

      if (isMounted) {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        if (onNumPagesChange) onNumPagesChange(doc.numPages);
      }
    }

    loadPdf().catch((err) => console.error('Error al cargar PDF:', err));

    return () => {
      isMounted = false;
    };
  }, [pdfFile]);

  // Actualizar el factor de escala visual cuando cambia el tamaño del canvas
  const updateDisplayScale = useCallback(() => {
    if (!canvasRef.current || !nativePageSize) return;
    const clientWidth = canvasRef.current.clientWidth;
    if (clientWidth > 0 && nativePageSize.width > 0) {
      setDisplayScale(clientWidth / nativePageSize.width);
    }
  }, [nativePageSize]);

  useEffect(() => {
    updateDisplayScale();
    window.addEventListener('resize', updateDisplayScale);
    return () => window.removeEventListener('resize', updateDisplayScale);
  }, [updateDisplayScale]);

  // Renderizar la página actual en el canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    async function renderPage() {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewportScale = 1.5;
      const viewport = page.getViewport({ scale: viewportScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const nativeWidth = viewport.width / viewportScale;
      const nativeHeight = viewport.height / viewportScale;
      setNativePageSize({ width: nativeWidth, height: nativeHeight });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTask = page.render(renderContext);
      await renderTask.promise;

      // Calcular escala inicial
      if (canvas.clientWidth > 0 && nativeWidth > 0) {
        setDisplayScale(canvas.clientWidth / nativeWidth);
      }
    }

    renderPage().catch((err) => {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error al renderizar página:', err);
      }
    });

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage]);

  // Ajuste con teclado para mover la zona activa (flechas con paso fino de 0.2%)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No mover con flechas si el usuario está escribiendo en un input o contenteditable
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (!activeZoneId || !onUpdateZone) return;
      const zone = zones.find((z) => z.id === activeZoneId);
      if (!zone) return;

      const step = e.shiftKey ? 1.0 : 0.2; // 0.2% normal, 1% con shift

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateZone({ ...zone, y: Math.max(0, Math.round((zone.y - step) * 100) / 100) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateZone({ ...zone, y: Math.min(100 - zone.height, Math.round((zone.y + step) * 100) / 100) });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateZone({ ...zone, x: Math.max(0, Math.round((zone.x - step) * 100) / 100) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateZone({ ...zone, x: Math.min(100 - zone.width, Math.round((zone.x + step) * 100) / 100) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeZoneId, zones, onUpdateZone]);

  // Manejo de mouse para dibujar nuevas zonas, mover existentes o redimensionar
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isEditorMode) {
      setIsDrawing(true);
      setStartCoords({ x, y });
      setCurrentBox({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDrawing && startCoords) {
      const width = Math.abs(currentX - startCoords.x);
      const height = Math.abs(currentY - startCoords.y);
      const x = Math.min(startCoords.x, currentX);
      const y = Math.min(startCoords.y, currentY);

      setCurrentBox({ x, y, width, height });
    } else if (isResizing && resizeZoneId && resizeStart && onUpdateZone) {
      const zoneToResize = zones.find((z) => z.id === resizeZoneId);
      if (zoneToResize) {
        const newWidth = Math.max(2, Math.min(100 - zoneToResize.x, currentX - zoneToResize.x));
        const newHeight = Math.max(1, Math.min(100 - zoneToResize.y, currentY - zoneToResize.y));
        onUpdateZone({
          ...zoneToResize,
          width: Math.round(newWidth * 100) / 100,
          height: Math.round(newHeight * 100) / 100,
        });
      }
    } else if (isDragging && dragZoneId && onUpdateZone) {
      const zoneToMove = zones.find((z) => z.id === dragZoneId);
      if (zoneToMove) {
        const newX = Math.max(0, Math.min(100 - zoneToMove.width, currentX - dragOffset.x));
        const newY = Math.max(0, Math.min(100 - zoneToMove.height, currentY - dragOffset.y));
        onUpdateZone({
          ...zoneToMove,
          x: Math.round(newX * 100) / 100,
          y: Math.round(newY * 100) / 100,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      setIsDrawing(false);
      // Validar dimensiones mínimas
      if (currentBox.width > 2 && currentBox.height > 1) {
        if (onAddZone) {
          onAddZone({
            x: Math.round(currentBox.x * 100) / 100,
            y: Math.round(currentBox.y * 100) / 100,
            width: Math.round(currentBox.width * 100) / 100,
            height: Math.round(currentBox.height * 100) / 100,
            pageNumber: currentPage,
          });
        }
      }
      setCurrentBox(null);
      setStartCoords(null);
    }
    if (isDragging) {
      setIsDragging(false);
      setDragZoneId(null);
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeZoneId(null);
      setResizeStart(null);
    }
  };

  const handleZoneMouseDown = (e: React.MouseEvent, zone: FieldZone) => {
    e.stopPropagation();
    if (onSelectZone) onSelectZone(zone.id);

    if (containerRef.current && onUpdateZone) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;
      setIsDragging(true);
      setDragZoneId(zone.id);
      setDragOffset({
        x: currentX - zone.x,
        y: currentY - zone.y,
      });
    }
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent, zone: FieldZone) => {
    e.stopPropagation();
    if (containerRef.current && onUpdateZone) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;
      setIsResizing(true);
      setResizeZoneId(zone.id);
      setResizeStart({
        x: currentX,
        y: currentY,
        width: zone.width,
        height: zone.height,
      });
    }
  };

  const getFontFamilyCss = (family?: string) => {
    switch (family) {
      case 'TimesRoman':
      case 'Times':
        return 'Times New Roman, serif';
      case 'Courier':
        return 'Courier New, monospace';
      default:
        return 'Arial, Helvetica, sans-serif';
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="relative border shadow-md bg-white select-none overflow-hidden rounded-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isEditorMode ? 'crosshair' : 'default' }}
      >
        <canvas ref={canvasRef} className="block max-w-full h-auto" />

        {/* Zonas sobre el canvas con preview enriquecido */}
        {showOverlays && zones
          .filter((z) => (z.pageNumber || 1) === currentPage)
          .map((zone) => {
            const isSelected = activeZoneId === zone.id;
            const liveValue = livePreviewValues[zone.id];

            let hasContent = false;
            let richHtml = '';

            if (typeof liveValue === 'object' && liveValue?.html) {
              richHtml = liveValue.html;
              hasContent = Boolean(liveValue.plainText?.trim());
            } else if (typeof liveValue === 'string' && liveValue.trim()) {
              hasContent = true;
              richHtml = `<p>${liveValue.replace(/\n/g, '<br/>')}</p>`;
            }

            return (
              <div
                key={zone.id}
                onMouseDown={(e) => handleZoneMouseDown(e, zone)}
                className={`absolute transition-shadow flex flex-col justify-center p-0 overflow-visible ${
                  isSelected
                    ? 'border-2 border-[#c5a059] ring-2 ring-amber-300 shadow-lg z-20 cursor-move'
                    : isEditorMode
                    ? 'border-2 border-dashed border-amber-500 hover:border-[#c5a059] z-10 cursor-move'
                    : 'border border-[#c5a059]/80 hover:border-[#c5a059] hover:shadow-sm z-10 cursor-move'
                }`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  backgroundColor:
                    zone.bgColor &&
                    zone.bgColor !== 'transparent' &&
                    zone.bgColor !== 'none' &&
                    zone.bgColor.toLowerCase() !== '#ffffff' &&
                    zone.bgColor.toLowerCase() !== '#fff'
                      ? zone.bgColor
                      : 'transparent',
                  color: zone.color || '#000000',
                  fontFamily: getFontFamilyCss(zone.fontFamily),
                  fontSize: `${(zone.fontSize || 12) * displayScale}px`,
                  lineHeight: zone.lineHeight || 1.15,
                  padding: 0,
                  textAlign: zone.alignment || 'left',
                }}
              >
                {hasContent ? (
                  <div 
                    className={`w-full h-full flex flex-col justify-center m-0 p-0 ${
                      zone.alignment === 'right'
                        ? 'items-end text-right'
                        : zone.alignment === 'center'
                        ? 'items-center text-center'
                        : 'items-start text-left'
                    } [&_p]:m-0 [&_p]:p-0 [&_p]:leading-[inherit] [&_p]:whitespace-nowrap overflow-visible pointer-events-none`}
                    style={{ textAlign: zone.alignment || 'left', lineHeight: zone.lineHeight || 1.15 }}
                    dangerouslySetInnerHTML={{ __html: richHtml }}
                  />
                ) : (
                  <span className="text-[10px] text-slate-500 font-sans font-normal opacity-80 truncate select-none bg-white/70 px-1 rounded block text-center pointer-events-none">
                    [{zone.name}]
                  </span>
                )}

                {/* Handle de redimensionamiento en la esquina inferior derecha */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => handleResizeHandleMouseDown(e, zone)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#c5a059] border-2 border-white rounded-xs shadow-md cursor-se-resize z-30 hover:scale-125 transition-transform"
                    title="Arrastra para cambiar el tamaño de la zona"
                  />
                )}

                {/* Badge de posición mientras se selecciona o mueve */}
                {isSelected && (
                  <div className="absolute -top-6 left-0 bg-[#0d0e12]/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30">
                    X: {zone.x}% Y: {zone.y}% | W: {zone.width}% H: {zone.height}%
                  </div>
                )}
              </div>
            );
          })}

        {/* Zona en dibujo actual */}
        {showOverlays && currentBox && (
          <div
            className="absolute border-2 border-dashed border-emerald-600 bg-emerald-500/25 pointer-events-none z-30"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
