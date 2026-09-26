'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  FileType,
  RotateCcw,
  Camera,
  SwitchCamera,
  ScanLine,
  X
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

declare global {
  interface Window {
    cv?: any;
    jscanify?: any;
  }
}

type FormStep = 'front' | 'back' | 'result';

export default function TestJscanifyPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Cargando librerías (OpenCV.js y jscanify)...');
  const [error, setError] = useState<string | null>(null);

  // Paso del formulario
  const [currentStep, setCurrentStep] = useState<FormStep>('front');

  // Configuración de dimensiones de salida por defecto (Ultra HD 4K: 2568 x 1620 px)
  const [targetWidth] = useState<number>(2568);
  const [targetHeight] = useState<number>(1620);

  // Estado Cámara en Vivo
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeCameraStep, setActiveCameraStep] = useState<'front' | 'back'>('front');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estado Credencial Frontal
  const [frontImageSrc, setFrontImageSrc] = useState<string | null>(null);
  const [frontExtractedDataUrl, setFrontExtractedDataUrl] = useState<string | null>(null);
  const [frontCornerPoints, setFrontCornerPoints] = useState<any>(null);
  const [processingFront, setProcessingFront] = useState(false);

  // Estado Credencial Trasera
  const [backImageSrc, setBackImageSrc] = useState<string | null>(null);
  const [backExtractedDataUrl, setBackExtractedDataUrl] = useState<string | null>(null);
  const [backCornerPoints, setBackCornerPoints] = useState<any>(null);
  const [processingBack, setProcessingBack] = useState(false);

  // Estado Imagen Combinada y PDF
  const [combinedDataUrl, setCombinedDataUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Refs DOM
  const frontOrigImgRef = useRef<HTMLImageElement | null>(null);
  const frontHighlightedRef = useRef<HTMLDivElement | null>(null);
  const frontExtractedRef = useRef<HTMLDivElement | null>(null);
  const frontFileInputRef = useRef<HTMLInputElement | null>(null);

  const backOrigImgRef = useRef<HTMLImageElement | null>(null);
  const backHighlightedRef = useRef<HTMLDivElement | null>(null);
  const backExtractedRef = useRef<HTMLDivElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);

  // Carga asíncrona de OpenCV.js y jscanify.js
  useEffect(() => {
    let isMounted = true;

    async function loadLibraries() {
      try {
        setLoadingStatus('Cargando OpenCV.js...');
        
        if (!window.cv || !window.cv.Mat) {
          if (!document.getElementById('opencv-script')) {
            const opencvScript = document.createElement('script');
            opencvScript.id = 'opencv-script';
            opencvScript.src = '/opencv.js';
            opencvScript.async = true;
            document.head.appendChild(opencvScript);
          }

          await new Promise<void>((resolve, reject) => {
            const checkCv = () => {
              if (window.cv && window.cv.Mat) {
                resolve();
              } else if (window.cv && !window.cv.Mat) {
                const prevInit = window.cv.onRuntimeInitialized;
                window.cv.onRuntimeInitialized = () => {
                  if (typeof prevInit === 'function') prevInit();
                  resolve();
                };
              } else {
                setTimeout(checkCv, 100);
              }
            };
            checkCv();
            setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar OpenCV.js')), 20000);
          });
        }

        if (!isMounted) return;

        setLoadingStatus('Cargando jscanify...');

        if (!window.jscanify) {
          if (!document.getElementById('jscanify-script')) {
            const jscanifyScript = document.createElement('script');
            jscanifyScript.id = 'jscanify-script';
            jscanifyScript.src = '/jscanify.js';
            jscanifyScript.async = true;
            document.head.appendChild(jscanifyScript);
          }

          await new Promise<void>((resolve, reject) => {
            const checkJscanify = () => {
              if (window.jscanify) {
                resolve();
              } else {
                setTimeout(checkJscanify, 100);
              }
            };
            checkJscanify();
            setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar jscanify.js')), 10000);
          });
        }

        if (isMounted) {
          setIsLoaded(true);
          setLoadingStatus('Librerías cargadas correctamente');
        }
      } catch (err: any) {
        console.error('Error cargando dependencias de escaneo:', err);
        if (isMounted) {
          setError(err.message || 'Error al cargar OpenCV o jscanify.');
        }
      }
    }

    loadLibraries();

    return () => {
      isMounted = false;
    };
  }, []);

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Iniciar flujo de Cámara en Vivo
  const startCamera = async (step: 'front' | 'back', mode = facingMode) => {
    setCameraError(null);
    setActiveCameraStep(step);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Cámara en vivo no disponible por restricciones del navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Error iniciando cámara:', err);
      setCameraError(err.message || 'No se pudo acceder a la cámara en vivo.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(activeCameraStep, nextMode);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = video.videoWidth;
    rawCanvas.height = video.videoHeight;
    const ctx = rawCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    const dataUrl = rawCanvas.toDataURL('image/png');

    if (activeCameraStep === 'front') {
      setFrontImageSrc(dataUrl);
      setFrontExtractedDataUrl(null);
      if (frontHighlightedRef.current) frontHighlightedRef.current.innerHTML = '';
      if (frontExtractedRef.current) frontExtractedRef.current.innerHTML = '';
    } else {
      setBackImageSrc(dataUrl);
      setBackExtractedDataUrl(null);
      if (backHighlightedRef.current) backHighlightedRef.current.innerHTML = '';
      if (backExtractedRef.current) backExtractedRef.current.innerHTML = '';
    }

    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(80);
    }

    stopCamera();
  };

  // Mejora de contraste de color HD (Color mejorado por defecto)
  const applyImageEnhancement = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.25 + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.25 + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.25 + 128));
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  };

  // Recorte adaptativo por aspecto de respaldo en caso de que no se detecte un contorno cerrado
  const fallbackAspectCrop = (
    img: HTMLCanvasElement,
    targetW: number,
    targetH: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const w = img.width;
    const h = img.height;
    if (!w || !h) return canvas;

    const imgRatio = w / h;
    const targetRatio = targetW / targetH;

    let sx: number, sy: number, sw: number, sh: number;

    if (imgRatio > targetRatio) {
      sh = h;
      sw = sh * targetRatio;
      sx = (w - sw) / 2;
      sy = 0;
    } else {
      sw = w;
      sh = sw / targetRatio;
      sx = 0;
      sy = (h - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return canvas;
  };

  // Procesar Imagen Frontal en resolución nativa completa
  const processFrontImage = () => {
    if (!frontOrigImgRef.current || !isLoaded || !window.jscanify || !window.cv) return;

    try {
      setProcessingFront(true);
      setError(null);

      if (frontHighlightedRef.current) frontHighlightedRef.current.innerHTML = '';
      if (frontExtractedRef.current) frontExtractedRef.current.innerHTML = '';
      setFrontCornerPoints(null);
      setFrontExtractedDataUrl(null);

      const img = frontOrigImgRef.current;
      if (!img.naturalWidth || !img.naturalHeight) return;

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const sCtx = srcCanvas.getContext('2d');
      if (!sCtx) return;
      sCtx.drawImage(img, 0, 0);

      const scanner = new window.jscanify();

      try {
        const highlightedCanvas = scanner.highlightPaper(srcCanvas);
        if (highlightedCanvas && frontHighlightedRef.current) {
          highlightedCanvas.style.maxWidth = '100%';
          highlightedCanvas.style.height = 'auto';
          highlightedCanvas.className = 'rounded-lg border border-slate-700 shadow-md max-h-[300px] object-contain mx-auto';
          frontHighlightedRef.current.appendChild(highlightedCanvas);
        }
      } catch (hlErr) {
        console.warn('No se pudo resaltar el borde frontal:', hlErr);
      }

      let extractedCanvas: HTMLCanvasElement | null = null;
      try {
        extractedCanvas = scanner.extractPaper(srcCanvas, targetWidth, targetHeight);
      } catch (extractErr) {
        console.warn('jscanify extractPaper error (frontal), aplicando respaldo:', extractErr);
      }

      if (!extractedCanvas || extractedCanvas.width === 0 || extractedCanvas.height === 0) {
        extractedCanvas = fallbackAspectCrop(srcCanvas, targetWidth, targetHeight);
      }

      if (extractedCanvas && frontExtractedRef.current) {
        extractedCanvas = applyImageEnhancement(extractedCanvas);
        const dataUrl = extractedCanvas.toDataURL('image/png');
        setFrontExtractedDataUrl(dataUrl);

        const previewImg = document.createElement('img');
        previewImg.src = dataUrl;
        previewImg.className = 'rounded-lg border border-emerald-500/40 shadow-lg shadow-emerald-950/30 max-h-[300px] object-contain mx-auto';
        frontExtractedRef.current.appendChild(previewImg);
      }

      try {
        const cvMat = window.cv.imread(srcCanvas);
        const contour = scanner.findPaperContour(cvMat);
        if (contour) {
          const points = scanner.getCornerPoints(contour);
          setFrontCornerPoints(points);
          contour.delete();
        } else {
          setFrontCornerPoints({ info: 'No se detectó un contorno cerrado claro.' });
        }
        cvMat.delete();
      } catch (contourErr) {
        setFrontCornerPoints({ error: 'No se pudo obtener las esquinas.' });
      }
    } catch (err: any) {
      console.error('Error procesando frontal:', err);
      setError('Error al procesar la imagen frontal: ' + (err.message || err));
    } finally {
      setProcessingFront(false);
    }
  };

  // Procesar Imagen Trasera en resolución nativa completa
  const processBackImage = () => {
    if (!backOrigImgRef.current || !isLoaded || !window.jscanify || !window.cv) return;

    try {
      setProcessingBack(true);
      setError(null);

      if (backHighlightedRef.current) backHighlightedRef.current.innerHTML = '';
      if (backExtractedRef.current) backExtractedRef.current.innerHTML = '';
      setBackCornerPoints(null);
      setBackExtractedDataUrl(null);

      const img = backOrigImgRef.current;
      if (!img.naturalWidth || !img.naturalHeight) return;

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const sCtx = srcCanvas.getContext('2d');
      if (!sCtx) return;
      sCtx.drawImage(img, 0, 0);

      const scanner = new window.jscanify();

      try {
        const highlightedCanvas = scanner.highlightPaper(srcCanvas);
        if (highlightedCanvas && backHighlightedRef.current) {
          highlightedCanvas.style.maxWidth = '100%';
          highlightedCanvas.style.height = 'auto';
          highlightedCanvas.className = 'rounded-lg border border-slate-700 shadow-md max-h-[300px] object-contain mx-auto';
          backHighlightedRef.current.appendChild(highlightedCanvas);
        }
      } catch (hlErr) {
        console.warn('No se pudo resaltar el borde trasero:', hlErr);
      }

      let extractedCanvas: HTMLCanvasElement | null = null;
      try {
        extractedCanvas = scanner.extractPaper(srcCanvas, targetWidth, targetHeight);
      } catch (extractErr) {
        console.warn('jscanify extractPaper error (trasera), aplicando respaldo:', extractErr);
      }

      if (!extractedCanvas || extractedCanvas.width === 0 || extractedCanvas.height === 0) {
        extractedCanvas = fallbackAspectCrop(srcCanvas, targetWidth, targetHeight);
      }

      if (extractedCanvas && backExtractedRef.current) {
        extractedCanvas = applyImageEnhancement(extractedCanvas);
        const dataUrl = extractedCanvas.toDataURL('image/png');
        setBackExtractedDataUrl(dataUrl);

        const previewImg = document.createElement('img');
        previewImg.src = dataUrl;
        previewImg.className = 'rounded-lg border border-emerald-500/40 shadow-lg shadow-emerald-950/30 max-h-[300px] object-contain mx-auto';
        backExtractedRef.current.appendChild(previewImg);
      }

      try {
        const cvMat = window.cv.imread(srcCanvas);
        const contour = scanner.findPaperContour(cvMat);
        if (contour) {
          const points = scanner.getCornerPoints(contour);
          setBackCornerPoints(points);
          contour.delete();
        } else {
          setBackCornerPoints({ info: 'No se detectó un contorno cerrado claro.' });
        }
        cvMat.delete();
      } catch (contourErr) {
        setBackCornerPoints({ error: 'No se pudo obtener las esquinas.' });
      }
    } catch (err: any) {
      console.error('Error procesando trasera:', err);
      setError('Error al procesar la imagen trasera: ' + (err.message || err));
    } finally {
      setProcessingBack(false);
    }
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFrontImageSrc(URL.createObjectURL(file));
      setFrontExtractedDataUrl(null);
      if (frontHighlightedRef.current) frontHighlightedRef.current.innerHTML = '';
      if (frontExtractedRef.current) frontExtractedRef.current.innerHTML = '';
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBackImageSrc(URL.createObjectURL(file));
      setBackExtractedDataUrl(null);
      if (backHighlightedRef.current) backHighlightedRef.current.innerHTML = '';
      if (backExtractedRef.current) backExtractedRef.current.innerHTML = '';
    }
  };

  // Generar Imagen Única Unificada (Frontal + Trasera) en Alta Resolución
  const generateCombinedImage = (frontDataUrl: string, backDataUrl: string) => {
    const frontImg = new Image();
    const backImg = new Image();

    frontImg.onload = () => {
      backImg.onload = () => {
        const padding = Math.round(frontImg.width * 0.04);
        const headerHeight = Math.round(frontImg.height * 0.08);
        const canvasWidth = Math.max(frontImg.width, backImg.width) + padding * 2;
        const canvasHeight = frontImg.height + backImg.height + padding * 3 + headerHeight * 2;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = Math.max(4, Math.round(canvasWidth * 0.003));
        ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

        const fontSize = Math.max(22, Math.round(canvasWidth * 0.022));

        ctx.fillStyle = '#818cf8';
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText('CREDENCIAL DE ELECTOR - VISTA FRONTAL', padding, padding + fontSize);

        ctx.drawImage(frontImg, padding, padding + headerHeight, frontImg.width, frontImg.height);

        const yBackHeader = padding + headerHeight + frontImg.height + padding;
        ctx.fillStyle = '#818cf8';
        ctx.fillText('CREDENCIAL DE ELECTOR - VISTA TRASERA', padding, yBackHeader + fontSize);

        ctx.drawImage(backImg, padding, yBackHeader + headerHeight, backImg.width, backImg.height);

        setCombinedDataUrl(canvas.toDataURL('image/png'));
      };
      backImg.src = backDataUrl;
    };
    frontImg.src = frontDataUrl;
  };

  const goToResultStep = () => {
    if (frontExtractedDataUrl && backExtractedDataUrl) {
      generateCombinedImage(frontExtractedDataUrl, backExtractedDataUrl);
    }
    setCurrentStep('result');
  };

  const downloadUnifiedPdf = async () => {
    if (!frontExtractedDataUrl || !backExtractedDataUrl) return;
    try {
      setGeneratingPdf(true);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      page.drawRectangle({
        x: 20,
        y: 20,
        width: 572,
        height: 752,
        borderColor: rgb(0.12, 0.28, 0.55),
        borderWidth: 1.5,
        color: rgb(0.99, 0.99, 1.0),
      });

      page.drawText('EXPEDIENTE DIGITAL DE IDENTIFICACIÓN OFICIAL (INE / IFE)', {
        x: 75,
        y: 742,
        size: 12,
        font: fontBold,
        color: rgb(0.12, 0.28, 0.55),
      });

      page.drawText('SANTINA CONSULTORÍA & ASOCIADOS - DOCUMENTO PROCESADO', {
        x: 130,
        y: 726,
        size: 9,
        font: font,
        color: rgb(0.4, 0.45, 0.55),
      });

      page.drawLine({
        start: { x: 35, y: 715 },
        end: { x: 577, y: 715 },
        thickness: 1,
        color: rgb(0.85, 0.88, 0.92),
      });

      const frontBytes = await fetch(frontExtractedDataUrl).then((r) => r.arrayBuffer());
      const backBytes = await fetch(backExtractedDataUrl).then((r) => r.arrayBuffer());

      const frontImg = await pdfDoc.embedPng(frontBytes);
      const backImg = await pdfDoc.embedPng(backBytes);

      const cardWidth = 440;
      const cardHeight = (440 * targetHeight) / targetWidth;
      const x = (612 - cardWidth) / 2;

      page.drawText('1. CREDENCIAL DE ELECTOR - VISTA FRONTAL', {
        x,
        y: 685,
        size: 10,
        font: fontBold,
        color: rgb(0.12, 0.28, 0.55),
      });

      page.drawRectangle({
        x: x - 4,
        y: 675 - cardHeight - 4,
        width: cardWidth + 8,
        height: cardHeight + 8,
        borderColor: rgb(0.8, 0.84, 0.9),
        borderWidth: 1,
      });

      page.drawImage(frontImg, {
        x,
        y: 675 - cardHeight,
        width: cardWidth,
        height: cardHeight,
      });

      const yBackLabel = 675 - cardHeight - 35;
      page.drawText('2. CREDENCIAL DE ELECTOR - VISTA TRASERA', {
        x,
        y: yBackLabel,
        size: 10,
        font: fontBold,
        color: rgb(0.12, 0.28, 0.55),
      });

      page.drawRectangle({
        x: x - 4,
        y: yBackLabel - 10 - cardHeight - 4,
        width: cardWidth + 8,
        height: cardHeight + 8,
        borderColor: rgb(0.8, 0.84, 0.9),
        borderWidth: 1,
      });

      page.drawImage(backImg, {
        x,
        y: yBackLabel - 10 - cardHeight,
        width: cardWidth,
        height: cardHeight,
      });

      page.drawText(`DOCUMENTO GENERADO EL ${new Date().toLocaleDateString('es-MX')} | SISTEMA DE SCANNER HD`, {
        x: 135,
        y: 35,
        size: 8,
        font: font,
        color: rgb(0.5, 0.55, 0.6),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'credencial_unificada_oficial.pdf';
      link.click();
    } catch (err) {
      console.error('Error al generar el PDF unificado:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadUnifiedImage = () => {
    if (!combinedDataUrl) return;
    const link = document.createElement('a');
    link.href = combinedDataUrl;
    link.download = 'credencial_unificada_frontal_trasera.png';
    link.click();
  };

  const resetForm = () => {
    stopCamera();
    setFrontImageSrc(null);
    setFrontExtractedDataUrl(null);
    setFrontCornerPoints(null);
    setBackImageSrc(null);
    setBackExtractedDataUrl(null);
    setBackCornerPoints(null);
    setCombinedDataUrl(null);
    setCurrentStep('front');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
              <Sparkles className="w-5 h-5" />
              <span>Formulario de Escaneo Completo</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Escaneo de Credencial <span className="text-indigo-400">(Frontal y Trasera)</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Captura en tiempo real o sube ambas caras de la credencial para procesarlas en Ultra HD 4K y unificarlas.
            </p>
          </div>

          {/* Estado de carga de scripts */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 self-start md:self-auto">
            {isLoaded ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-400">Motor OpenCV / jscanify</div>
                  <div className="text-[11px] text-slate-400">Listo para procesar</div>
                </div>
              </>
            ) : error ? (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-rose-400">Error de carga</div>
                  <div className="text-[11px] text-slate-400">{error}</div>
                </div>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-400">Cargando motor</div>
                  <div className="text-[11px] text-slate-400">{loadingStatus}</div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Stepper / Indicador de Pasos del Formulario */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { stopCamera(); setCurrentStep('front'); }}
            className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border font-medium text-sm transition-all ${
              currentStep === 'front'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                : frontExtractedDataUrl
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span className="hidden sm:inline">1. Imagen Frontal</span>
            {frontExtractedDataUrl && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          </button>

          <button
            onClick={() => { if (frontExtractedDataUrl) { stopCamera(); setCurrentStep('back'); } }}
            disabled={!frontExtractedDataUrl}
            className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border font-medium text-sm transition-all ${
              currentStep === 'back'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                : backExtractedDataUrl
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span className="hidden sm:inline">2. Imagen Trasera</span>
            {backExtractedDataUrl && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          </button>

          <button
            onClick={() => { if (frontExtractedDataUrl && backExtractedDataUrl) { stopCamera(); goToResultStep(); } }}
            disabled={!frontExtractedDataUrl || !backExtractedDataUrl}
            className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border font-medium text-sm transition-all ${
              currentStep === 'result'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                : combinedDataUrl
                ? 'bg-slate-900 border-indigo-500/50 text-indigo-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span className="hidden sm:inline">3. Archivo Unificado</span>
          </button>
        </div>

        {/* MODAL DE CÁMARA EN VIVO */}
        {isCameraActive && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-3xl flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Camera className="w-5 h-5" />
                <span>Capturando Credencial {activeCameraStep === 'front' ? 'Frontal' : 'Trasera'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFacingMode}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
                  title="Cambiar Cámara"
                >
                  <SwitchCamera className="w-4 h-4" />
                  <span className="hidden sm:inline">Cambiar Cámara</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 p-2.5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visor de Video de Alta Definición con Enfoque Guía */}
            <div className="relative w-full max-w-3xl my-auto aspect-[4/3] sm:aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Guía Bounding Box Estilo Escáner */}
              <div className="absolute inset-0 border-[3px] border-slate-950/70 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] sm:w-[75%] aspect-[856/540] rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden flex flex-col justify-between p-4">
                  {/* Esquinas Brillantes */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                  {/* Línea de escaneo láser pulsante */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#818cf8] animate-pulse my-auto" />

                  <div className="bg-slate-950/80 backdrop-blur-md rounded-xl px-3 py-1.5 self-center text-center">
                    <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <ScanLine className="w-4 h-4 text-indigo-400 animate-spin" />
                      Alinea el marco sobre la credencial {activeCameraStep === 'front' ? 'frontal' : 'trasera'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Control de Disparo */}
            <div className="w-full max-w-3xl flex items-center justify-center pb-2 z-10">
              <button
                onClick={captureCameraPhoto}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-2xl text-base transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                <span>Tomar Foto de Credencial</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 1: IMAGEN DE CREDENCIAL FRONTAL */}
        {currentStep === 'front' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    Paso 1: Imagen de Credencial Frontal
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Captura con tu cámara en vivo o sube la fotografía del frente de la credencial.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    onClick={() => startCamera('front')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Cámara en Vivo</span>
                  </button>

                  <input
                    type="file"
                    ref={frontFileInputRef}
                    onChange={handleFrontFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => frontFileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors border border-slate-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{frontImageSrc ? 'Cambiar Imagen' : 'Subir Archivo'}</span>
                  </button>
                </div>
              </div>

              {!frontImageSrc ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => startCamera('front')}
                    className="border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300">Usar Cámara en Tiempo Real</p>
                      <p className="text-xs text-slate-400 mt-1">Abre el visor HD en vivo para enfocar y tomar foto instantánea</p>
                    </div>
                  </div>

                  <div
                    onClick={() => frontFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">Subir Archivo de Imagen</p>
                      <p className="text-xs text-slate-500 mt-1">Selecciona una imagen en formato JPG, PNG o WEBP</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Original Frontal */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 mb-2">Original Frontal</span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <img
                        ref={frontOrigImgRef}
                        src={frontImageSrc}
                        alt="Original Frontal"
                        onLoad={processFrontImage}
                        className="max-h-[250px] max-w-full rounded-lg object-contain"
                      />
                    </div>
                  </div>

                  {/* Resaltado Frontal */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 mb-2">Borde Resaltado</span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px] relative">
                      {processingFront && <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin absolute" />}
                      <div ref={frontHighlightedRef} className="w-full flex justify-center" />
                    </div>
                  </div>

                  {/* Recorte Extraído Frontal */}
                  <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col bg-gradient-to-b from-slate-900 to-emerald-950/10">
                    <span className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
                      <span>Frontal Extraída (Ultra HD 4K)</span>
                      <span className="text-[10px] font-mono text-emerald-500">{targetWidth}x{targetHeight}px</span>
                    </span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px] relative">
                      {processingFront && <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin absolute" />}
                      <div ref={frontExtractedRef} className="w-full flex justify-center" />
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Siguiente */}
              {frontExtractedDataUrl && (
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep('back')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <span>Continuar a Imagen Trasera</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: IMAGEN DE CREDENCIAL TRASERA */}
        {currentStep === 'back' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    Paso 2: Imagen de Credencial Trasera
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Captura con tu cámara en vivo o sube la fotografía del reverso de la credencial.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    onClick={() => startCamera('back')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Cámara en Vivo</span>
                  </button>

                  <input
                    type="file"
                    ref={backFileInputRef}
                    onChange={handleBackFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => backFileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors border border-slate-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{backImageSrc ? 'Cambiar Imagen' : 'Subir Archivo'}</span>
                  </button>
                </div>
              </div>

              {!backImageSrc ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => startCamera('back')}
                    className="border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300">Usar Cámara en Tiempo Real</p>
                      <p className="text-xs text-slate-400 mt-1">Abre el visor HD en vivo para enfocar y tomar foto del reverso</p>
                    </div>
                  </div>

                  <div
                    onClick={() => backFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">Subir Archivo de Imagen</p>
                      <p className="text-xs text-slate-500 mt-1">Selecciona una imagen en formato JPG, PNG o WEBP</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Original Trasera */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 mb-2">Original Trasera</span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <img
                        ref={backOrigImgRef}
                        src={backImageSrc}
                        alt="Original Trasera"
                        onLoad={processBackImage}
                        className="max-h-[250px] max-w-full rounded-lg object-contain"
                      />
                    </div>
                  </div>

                  {/* Resaltado Trasera */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 mb-2">Borde Resaltado</span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px] relative">
                      {processingBack && <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin absolute" />}
                      <div ref={backHighlightedRef} className="w-full flex justify-center" />
                    </div>
                  </div>

                  {/* Recorte Extraído Trasera */}
                  <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col bg-gradient-to-b from-slate-900 to-emerald-950/10">
                    <span className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
                      <span>Trasera Extraída (Ultra HD 4K)</span>
                      <span className="text-[10px] font-mono text-emerald-500">{targetWidth}x{targetHeight}px</span>
                    </span>
                    <div className="flex-1 flex items-center justify-center min-h-[200px] relative">
                      {processingBack && <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin absolute" />}
                      <div ref={backExtractedRef} className="w-full flex justify-center" />
                    </div>
                  </div>
                </div>
              )}

              {/* Navegación Paso 2 */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep('front')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Frontal</span>
                </button>

                {backExtractedDataUrl && (
                  <button
                    onClick={goToResultStep}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <span>Generar Archivo Unificado</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: ARCHIVO UNIFICADO CON AMBAS CARAS */}
        {currentStep === 'result' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-6 h-6 text-emerald-400" />
                    Paso 3: Archivo Unificado (Frontal y Trasera)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ambas imágenes han sido procesadas con éxito en Ultra HD 4K y combinadas en un único documento.
                  </p>
                </div>

                <button
                  onClick={resetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar Formulario</span>
                </button>
              </div>

              {/* Botones de Descarga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={downloadUnifiedImage}
                  disabled={!combinedDataUrl}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3.5 px-5 rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                >
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Descargar Imagen Unificada (.PNG)</div>
                    <div className="text-[11px] text-indigo-200">Un solo archivo PNG en Ultra HD con ambas vistas</div>
                  </div>
                </button>

                <button
                  onClick={downloadUnifiedPdf}
                  disabled={generatingPdf || !frontExtractedDataUrl || !backExtractedDataUrl}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-3.5 px-5 rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/20"
                >
                  {generatingPdf ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileType className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-semibold">Descargar PDF Unificado (.PDF)</div>
                    <div className="text-[11px] text-emerald-200">Documento PDF oficial de 1 página</div>
                  </div>
                </button>
              </div>

              {/* Previsualización del Documento Combinado */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400 mb-4 self-start">
                  Vista Previa del Archivo Unificado:
                </span>
                {combinedDataUrl ? (
                  <img
                    src={combinedDataUrl}
                    alt="Credencial Unificada Frontal y Trasera"
                    className="max-h-[550px] w-auto rounded-lg border border-slate-700 shadow-2xl object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Generando vista previa unificada...</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
