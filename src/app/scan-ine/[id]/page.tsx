'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Upload,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Eye,
  FileDown,
  RefreshCw,
  Edit3,
  Check,
  UserCheck
} from 'lucide-react';
import { runOcrWithHeatmap, parseIneOcrText, IneParsedData, scanDocumentCanvas, waitForOpenCV } from '@/utils/ineOcrParser';

type Step = 'welcome' | 'scan_front' | 'review_front' | 'scan_back' | 'review_back' | 'verify' | 'processing' | 'success';

export default function PublicScanInePage() {
  const params = useParams();
  const clienteId = params?.id as string;

  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; apellidos: string; hasCompletedScan?: boolean; ineCompletaUrl?: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('welcome');

  // Filtro opcional de escaneo
  const [filterMode, setFilterMode] = useState<'grayscale' | 'color'>('grayscale');

  // Cámara y Captura
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturingText, setCapturingText] = useState<string>('Digitalizando credencial...');
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [ocrLoadingStep, setOcrLoadingStep] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Imágenes capturadas y datos OCR
  const [rawFrontSrc, setRawFrontSrc] = useState<string | null>(null);
  const [rawBackSrc, setRawBackSrc] = useState<string | null>(null);
  const [frenteBase64, setFrenteBase64] = useState<string | null>(null);
  const [reversoBase64, setReversoBase64] = useState<string | null>(null);
  const [frontOcrText, setFrontOcrText] = useState<string>('');
  const [backOcrText, setBackOcrText] = useState<string>('');
  const [consolidatedData, setConsolidatedData] = useState<IneParsedData | null>(null);

  // Estado editable para verificación del cliente
  const [editableData, setEditableData] = useState<{
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    curp: string;
    clave_elector: string;
    seccion: string;
    vigencia: string;
    direccion: string;
  }>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    curp: '',
    clave_elector: '',
    seccion: '',
    vigencia: '',
    direccion: '',
  });

  // Resultado Final
  const [pdfFinalUrl, setPdfFinalUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const [linkError, setLinkError] = useState<string | null>(null);

  // 1. Cargar asíncronamente OpenCV.js y jscanify.js garantizando que WebAssembly esté listo
  const [isEngineReady, setIsEngineReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLibraries() {
      try {
        if (typeof window === 'undefined') return;

        // 1. Cargar OpenCV.js si no existe
        if (!window.cv || !window.cv.Mat) {
          if (!document.getElementById('opencv-script')) {
            const opencvScript = document.createElement('script');
            opencvScript.id = 'opencv-script';
            opencvScript.src = '/opencv.js';
            opencvScript.async = true;
            document.head.appendChild(opencvScript);
          }

          await new Promise<void>((resolve) => {
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
          });
        }

        if (!isMounted) return;

        // 2. Cargar jscanify.js si no existe
        if (!window.jscanify) {
          if (!document.getElementById('jscanify-script')) {
            const jscanifyScript = document.createElement('script');
            jscanifyScript.id = 'jscanify-script';
            jscanifyScript.src = '/jscanify.js';
            jscanifyScript.async = true;
            document.head.appendChild(jscanifyScript);
          }

          await new Promise<void>((resolve) => {
            const checkJscanify = () => {
              if (window.jscanify) {
                resolve();
              } else {
                setTimeout(checkJscanify, 100);
              }
            };
            checkJscanify();
          });
        }

        if (isMounted) {
          setIsEngineReady(true);
        }
      } catch (err) {
        console.warn('Error inicializando motor jscanify:', err);
      }
    }

    loadLibraries();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Cargar información del cliente en segundo plano de manera no bloqueante
  useEffect(() => {
    let isMounted = true;

    async function loadClient() {
      let targetId = (params?.id as string) || '';
      if ((!targetId || targetId === '[id]') && typeof window !== 'undefined') {
        const segments = window.location.pathname.split('/').filter(Boolean);
        targetId = segments[segments.length - 1] || '';
      }

      if (!targetId || targetId === '[id]') {
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`/api/scan-ine/info?id=${encodeURIComponent(targetId)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.id) {
            setClienteInfo(data);
            if (data.hasCompletedScan && data.ineCompletaUrl) {
              setPdfFinalUrl(data.ineCompletaUrl);
              setCurrentStep('success');
            }
          }
        }
      } catch (err) {
        console.warn('Carga de cliente en segundo plano:', err);
      }
    }

    loadClient();

    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  // 2. Iniciar / Detener Cámara según el paso
  useEffect(() => {
    if (currentStep === 'scan_front' || currentStep === 'scan_back') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep]);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setOcrError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Cámara en vivo no disponible por restricciones del navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Error accediendo a la cámara:', err);
      setCameraError('No pudimos activar el visor continuo de la cámara. Puedes tomar la fotografía directamente con tu cámara nativa o subirla de tu galería.');
      setShowCameraModal(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Refs para imágenes originales y contenedores de credencial extraída (idéntico a /test)
  const frontOrigImgRef = useRef<HTMLImageElement | null>(null);
  const backOrigImgRef = useRef<HTMLImageElement | null>(null);
  const extractedFrontContainerRef = useRef<HTMLDivElement | null>(null);
  const extractedBackContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Procesamiento idéntico al de /test: ejecuta scanner.extractPaper sobre el elemento DOM <img />
   */
  const processFrontImage = () => {
    if (!frontOrigImgRef.current || !window.jscanify || !window.cv) return;
    try {
      const img = frontOrigImgRef.current;
      if (!img.naturalWidth || !img.naturalHeight) return;

      // Crear canvas de origen intermedio para asegurar lectura pixel a pixel por OpenCV
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const ctx = srcCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const scanner = new window.jscanify();
      let extractedCanvas: HTMLCanvasElement | null = null;
      try {
        extractedCanvas = scanner.extractPaper(srcCanvas, 856, 540);
      } catch (err) {
        console.warn('jscanify extract error front:', err);
      }

      if (extractedCanvas && extractedCanvas.width > 0 && extractedCanvas.height > 0) {
        const base64 = extractedCanvas.toDataURL('image/png');
        setFrenteBase64(base64);
        setOcrError(null);
      } else {
        console.warn('No se pudo detectar el contorno del frente.');
        setOcrError('No se pudo recortar la credencial automáticamente. Por favor enfoca bien la credencial sobre un fondo oscuro e inténtalo nuevamente.');
      }
    } catch (err) {
      console.warn('Error al extraer frente con jscanify:', err);
    }
  };

  const processBackImage = () => {
    if (!backOrigImgRef.current || !window.jscanify || !window.cv) return;
    try {
      const img = backOrigImgRef.current;
      if (!img.naturalWidth || !img.naturalHeight) return;

      // Crear canvas de origen intermedio para asegurar lectura pixel a pixel por OpenCV
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const ctx = srcCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const scanner = new window.jscanify();
      let extractedCanvas: HTMLCanvasElement | null = null;
      try {
        extractedCanvas = scanner.extractPaper(srcCanvas, 856, 540);
      } catch (err) {
        console.warn('jscanify extract error back:', err);
      }

      if (extractedCanvas && extractedCanvas.width > 0 && extractedCanvas.height > 0) {
        const base64 = extractedCanvas.toDataURL('image/png');
        setReversoBase64(base64);
        setOcrError(null);
      } else {
        console.warn('No se pudo detectar el contorno del reverso.');
        setOcrError('No se pudo recortar la credencial automáticamente. Por favor enfoca bien la credencial sobre un fondo oscuro e inténtalo nuevamente.');
      }
    } catch (err) {
      console.warn('Error al extraer reverso con jscanify:', err);
    }
  };

  /**
   * Captura y procesa el FRENTE del INE (idéntico a /test)
   */
  const handleCaptureFront = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      fileInputRef.current?.click();
      return;
    }

    setIsCapturing(true);
    setCapturingText('Extrayendo frente con jscanify...');
    setOcrError(null);
    setFrenteBase64(null);
    setRawFrontSrc(null);

    try {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = video.videoWidth;
      rawCanvas.height = video.videoHeight;
      const rCtx = rawCanvas.getContext('2d');
      if (rCtx) {
        rCtx.drawImage(video, 0, 0);
      }
      const dataUrl = rawCanvas.toDataURL('image/png');
      setRawFrontSrc(dataUrl);

      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate(100);
      }
      setCurrentStep('review_front');
    } catch (err: any) {
      console.error('Error en captura frente:', err);
      setOcrError('Hubo un problema al procesar la imagen. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Captura y procesa el REVERSO del INE (idéntico a /test)
   */
  const handleCaptureBack = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      fileInputRef.current?.click();
      return;
    }

    setIsCapturing(true);
    setCapturingText('Extrayendo reverso con jscanify...');
    setOcrError(null);
    setReversoBase64(null);
    setRawBackSrc(null);

    try {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = video.videoWidth;
      rawCanvas.height = video.videoHeight;
      const rCtx = rawCanvas.getContext('2d');
      if (rCtx) {
        rCtx.drawImage(video, 0, 0);
      }
      const dataUrl = rawCanvas.toDataURL('image/png');
      setRawBackSrc(dataUrl);

      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate(100);
      }
      setCurrentStep('review_back');
    } catch (err: any) {
      console.error('Error en captura reverso:', err);
      setOcrError('No se pudo procesar el reverso. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Envía las imágenes y datos al servidor para generar el PDF combinado y guardar en Supabase
   */
  const handleCompleteScan = async (frontImg: string, backImg: string, ocrData: IneParsedData) => {
    setProcessingStatus('Generando expediente digital y guardando en tu expediente...');
    setCurrentStep('processing');

    try {
      const res = await fetch('/api/scan-ine/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          frenteBase64: frontImg,
          reversoBase64: backImg,
          ocrData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el escaneo');

      setPdfFinalUrl(data.ineCompletaUrl);
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Error completando escaneo:', err);
      setCameraError(`Error al guardar: ${err.message}`);
      setCurrentStep('verify');
    }
  };

  /**
   * El cliente confirma y aprueba los datos verificados
   */
  const handleConfirmVerification = async () => {
    const updatedParsed: IneParsedData = {
      ...consolidatedData,
      nombre: editableData.nombre.trim(),
      apellido_paterno: editableData.apellido_paterno.trim(),
      apellido_materno: editableData.apellido_materno.trim(),
      curp: editableData.curp.trim().toUpperCase(),
      clave_elector: editableData.clave_elector.trim().toUpperCase(),
      seccion: editableData.seccion.trim(),
      vigencia: editableData.vigencia.trim(),
      direccion: editableData.direccion.trim(),
      raw_text: consolidatedData?.raw_text || '',
    };
    setConsolidatedData(updatedParsed);

    if (frenteBase64 && reversoBase64) {
      await handleCompleteScan(frenteBase64, reversoBase64, updatedParsed);
    }
  };

  /**
   * Ejecuta el OCR únicamente cuando el usuario aprueba ambas imágenes y avanza a verificación.
   * Evita bloqueos durante la captura de fotos y muestra un progreso limpio.
   */
  const handleProceedToVerification = async () => {
    setIsExtractingOcr(true);
    setOcrLoadingStep('Iniciando lector óptico OCR...');
    setOcrError(null);

    try {
      let rawFText = '';
      let rawBText = '';

      if (frenteBase64) {
        setOcrLoadingStep('Leyendo frente (Nombre, CURP, Clave de Elector)...');
        try {
          const blobF = await (await fetch(frenteBase64)).blob();
          const ocrResF = await runOcrWithHeatmap(blobF);
          rawFText = (ocrResF.frontText || '') + '\n' + (ocrResF.backText || '');
          setFrontOcrText(rawFText);
        } catch (errF) {
          console.warn('Error en OCR frente:', errF);
        }
      }

      if (reversoBase64) {
        setOcrLoadingStep('Leyendo reverso (Sección, Vigencia, Código MRZ)...');
        try {
          const blobB = await (await fetch(reversoBase64)).blob();
          const ocrResB = await runOcrWithHeatmap(blobB);
          rawBText = (ocrResB.frontText || '') + '\n' + (ocrResB.backText || '');
          setBackOcrText(rawBText);
        } catch (errB) {
          console.warn('Error en OCR reverso:', errB);
        }
      }

      setOcrLoadingStep('Consolidando datos de tu expediente...');
      const parsed = parseIneOcrText(rawFText, rawBText);
      setConsolidatedData(parsed);

      setEditableData({
        nombre: parsed.nombre || clienteInfo?.nombre || '',
        apellido_paterno: parsed.apellido_paterno || '',
        apellido_materno: parsed.apellido_materno || '',
        curp: parsed.curp || '',
        clave_elector: parsed.clave_elector || '',
        seccion: parsed.seccion || '',
        vigencia: parsed.vigencia || '',
        direccion: parsed.direccion || '',
      });

      setCurrentStep('verify');
    } catch (err: any) {
      console.error('Error procesando OCR:', err);
      setCurrentStep('verify');
    } finally {
      setIsExtractingOcr(false);
    }
  };

  /**
   * Subida manual por archivo (idéntico a /test)
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    setCapturingText(`Procesando ${side === 'front' ? 'frente' : 'reverso'} con jscanify...`);
    setOcrError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      if (side === 'front') {
        setRawFrontSrc(objectUrl);
        setCurrentStep('review_front');
      } else {
        setRawBackSrc(objectUrl);
        setCurrentStep('review_back');
      }
    } catch (err: any) {
      console.error('Error procesando archivo:', err);
      setOcrError('No se pudo procesar el archivo seleccionado: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsCapturing(false);
      if (e.target) e.target.value = '';
    }
  };

  if (linkError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Enlace no disponible</h2>
        <p className="text-xs text-slate-400 max-w-sm">{linkError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none">
      {/* 1. Header Superior */}
      <header className="px-5 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide uppercase">Santina Consultoría</h1>
            <p className="text-[10px] text-slate-400">Verificación Segura de Identidad (INE)</p>
          </div>
        </div>

        {clienteInfo && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Cliente:</span>
            <span className="text-xs font-semibold text-blue-400">{clienteInfo.nombre}</span>
          </div>
        )}
      </header>

      {/* 2. Cuerpo Principal Según el Paso */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        {/* ========================================================================= */}
        {/* PASO 1: PANTALLA DE BIENVENIDA */}
        {/* ========================================================================= */}
        {currentStep === 'welcome' && (
          <div className="w-full text-center space-y-6 py-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
              <ScanLine className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Hola, {clienteInfo?.nombre || 'Bienvenido'} 👋
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Para validar tu expediente y trámites oficiales, por favor escanea tu <strong className="text-slate-200">Credencial de Elector (INE / IFE)</strong> por ambos lados usando la cámara de tu celular.
              </p>
            </div>

            {/* Requisitos / Instrucciones */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 text-xs text-slate-300">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Recomendaciones para el escaneo:</p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>Coloca tu INE sobre una mesa plana con <strong className="text-white">buena iluminación</strong> y sin sombras.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>Alinea la credencial dentro del <strong className="text-white">marco guía rectangular</strong> en pantalla.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>Primero escanearemos el <strong className="text-white">Frente</strong> y luego el <strong className="text-white">Reverso</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('scan_front')}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>Comenzar Escaneo del INE</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2 & 3: SCAN FRENTE Y SCAN REVERSO (CÁMARA CON HUD / BOUNDING BOX) */}
        {/* ========================================================================= */}
        {(currentStep === 'scan_front' || currentStep === 'scan_back') && (
          <div className="w-full flex-1 flex flex-col items-center justify-between space-y-4">
            {/* Barra de progreso de pasos */}
            <div className="w-full flex items-center justify-between gap-2 px-2">
              <div className={`flex-1 h-1.5 rounded-full ${currentStep === 'scan_front' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${currentStep === 'scan_back' ? 'bg-blue-500' : 'bg-slate-800'}`} />
            </div>

            {/* Título de la Cara */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 px-3 py-1 bg-blue-950/60 border border-blue-800/60 rounded-full inline-block mb-1">
                {currentStep === 'scan_front' ? 'Paso 1 de 2: Frente' : 'Paso 2 de 2: Reverso'}
              </span>
              <h3 className="text-base font-bold text-white">
                {currentStep === 'scan_front'
                  ? 'Enfoca el Frente de tu INE'
                  : 'Voltea tu INE y enfoca el Reverso'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentStep === 'scan_front'
                  ? 'Asegúrate de que tu fotografía y CURP queden dentro del marco.'
                  : 'Asegúrate de que los códigos de barras y texto queden nítidos.'}
              </p>
            </div>

            {/* Viewfinder Cámara */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Guía visual con marco rectangular (bounding box) */}
              <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                <div className="w-full h-full border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <span className="text-[10px] text-emerald-400 font-bold bg-slate-950/80 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/40 backdrop-blur-sm">
                    {currentStep === 'scan_front' ? 'Alinea el FRENTE aquí' : 'Alinea el REVERSO aquí'}
                  </span>
                </div>
              </div>

              {/* Indicador de Procesamiento */}
              {isCapturing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                  <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-bold text-white">{capturingText}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Ajustando contornos y perspectiva con jscanify.js
                  </p>
                </div>
              )}
            </div>

            {/* Mensajes de Error de OCR / Guía */}
            {ocrError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-[11px] text-red-200 flex items-start gap-2 w-full">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{ocrError}</span>
              </div>
            )}

            {/* BOTÓN OBTURADOR DE DISPARO */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <label className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl cursor-pointer transition-colors border border-slate-800" title="Subir foto desde galería">
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, currentStep === 'scan_front' ? 'front' : 'back')}
                />
              </label>

              <button
                type="button"
                disabled={isCapturing}
                onClick={currentStep === 'scan_front' ? handleCaptureFront : handleCaptureBack}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-5 h-5 text-slate-950" />
                <span>{currentStep === 'scan_front' ? 'Capturar Frente' : 'Capturar Reverso'}</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl cursor-pointer transition-colors border border-slate-800"
                title="Reenfocar cámara"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO INTERMEDIO: VERIFICAR RESULTADO DE ESCANEO DEL FRENTE */}
        {/* ========================================================================= */}
        {currentStep === 'review_front' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full inline-block mb-1">
                Extracción jscanify (856x540)
              </span>
              <h3 className="text-base font-bold text-white">Revisa el recorte del Frente</h3>
              <p className="text-[11px] text-slate-400">
                Verifica que la credencial esté enderezada y recortada sin fondo sobrante.
              </p>
            </div>

            {/* Elemento de imagen DOM original que dispara onLoad a resolución nativa completa (idéntico a /test) */}
            {rawFrontSrc && (
              <img
                ref={frontOrigImgRef}
                src={rawFrontSrc}
                alt="Frente Original"
                onLoad={processFrontImage}
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
              />
            )}

            {/* Contenedor de la Credencial Extraída por jscanify */}
            <div className="relative w-full aspect-[1.586/1] bg-black rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl flex items-center justify-center p-0.5 bg-slate-950">
              {frenteBase64 ? (
                <img src={frenteBase64} alt="Frente Digitalizado" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Extrayendo credencial con jscanify...</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setCurrentStep('scan_back')}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Check className="w-5 h-5" />
                <span>El frente se ve bien, Continuar al Reverso</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFrenteBase64(null);
                  setRawFrontSrc(null);
                  setCurrentStep('scan_front');
                }}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-2xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a tomar foto del frente</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO INTERMEDIO: VERIFICAR RESULTADO DE ESCANEO DEL REVERSO */}
        {/* ========================================================================= */}
        {currentStep === 'review_back' && (
          <div className="w-full flex-1 flex flex-col items-center justify-between space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full inline-block mb-1">
                Extracción jscanify (856x540)
              </span>
              <h3 className="text-base font-bold text-white">Revisa el recorte del Reverso</h3>
              <p className="text-[11px] text-slate-400">
                Verifica que el reverso esté enderezado y recortado sin fondo sobrante.
              </p>
            </div>

            {/* Elemento de imagen DOM original que dispara onLoad a resolución nativa completa (idéntico a /test) */}
            {rawBackSrc && (
              <img
                ref={backOrigImgRef}
                src={rawBackSrc}
                alt="Reverso Original"
                onLoad={processBackImage}
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
              />
            )}

            {/* Contenedor de la Credencial Extraída por jscanify */}
            <div className="relative w-full aspect-[1.586/1] bg-black rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl flex items-center justify-center p-0.5 bg-slate-950">
              {reversoBase64 ? (
                <img src={reversoBase64} alt="Reverso Digitalizado" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Extrayendo credencial con jscanify...</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                disabled={isExtractingOcr}
                onClick={handleProceedToVerification}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-60"
              >
                {isExtractingOcr ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{ocrLoadingStep || 'Leyendo datos oficiales con OCR...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>El reverso se ve bien, Verificar Datos</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isExtractingOcr}
                onClick={() => {
                  setReversoBase64(null);
                  setRawBackSrc(null);
                  setCurrentStep('scan_back');
                }}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-2xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a tomar foto del reverso</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO FINAL: VERIFICACIÓN Y CONFIRMACIÓN DE DATOS POR EL CLIENTE */}
        {/* ========================================================================= */}
        {currentStep === 'verify' && (
          <div className="w-full space-y-5 py-2 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Verifica tus Datos Detectados</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hemos extraído la información de tu credencial. Por favor <strong className="text-slate-200">revisa que todos los campos sean correctos</strong> o corrígelos antes de guardar.
              </p>
            </div>

            {/* Vista Previa de Capturas (Frente y Reverso) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Frente Capturado</span>
                {frenteBase64 && (
                  <div className="relative aspect-[1.586/1] bg-black/50 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <img src={frenteBase64} alt="Frente" className="w-full h-full object-contain" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentStep('scan_front')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  Volver a tomar frente
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reverso Capturado</span>
                {reversoBase64 && (
                  <div className="relative aspect-[1.586/1] bg-black/50 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <img src={reversoBase64} alt="Reverso" className="w-full h-full object-contain" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentStep('scan_back')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  Volver a tomar reverso
                </button>
              </div>
            </div>

            {/* Formulario de Verificación Editable */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Datos Oficiales para el Expediente</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  Puedes editar si hay error
                </span>
              </div>

              <div className="space-y-3">
                {/* Nombre(s) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nombre(s)
                  </label>
                  <input
                    type="text"
                    value={editableData.nombre}
                    onChange={(e) => setEditableData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. JUAN CARLOS"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Apellidos */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Apellido Paterno
                    </label>
                    <input
                      type="text"
                      value={editableData.apellido_paterno}
                      onChange={(e) => setEditableData((prev) => ({ ...prev, apellido_paterno: e.target.value }))}
                      placeholder="Paterno"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={editableData.apellido_materno}
                      onChange={(e) => setEditableData((prev) => ({ ...prev, apellido_materno: e.target.value }))}
                      placeholder="Materno"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* CURP */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    CURP (18 Caracteres)
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={editableData.curp}
                    onChange={(e) => setEditableData((prev) => ({ ...prev, curp: e.target.value.toUpperCase() }))}
                    placeholder="ABCD123456HDFRRN01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500 uppercase transition-colors"
                  />
                </div>

                {/* Clave de Elector y Vigencia */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Clave de Elector
                    </label>
                    <input
                      type="text"
                      value={editableData.clave_elector}
                      onChange={(e) => setEditableData((prev) => ({ ...prev, clave_elector: e.target.value.toUpperCase() }))}
                      placeholder="ABCDER90123456H"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 uppercase transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Vigencia / Sección
                    </label>
                    <input
                      type="text"
                      value={editableData.vigencia ? `Vig. ${editableData.vigencia} ${editableData.seccion ? `Sec. ${editableData.seccion}` : ''}`.trim() : (editableData.seccion ? `Sec. ${editableData.seccion}` : '')}
                      onChange={(e) => setEditableData((prev) => ({ ...prev, vigencia: e.target.value }))}
                      placeholder="Ej. Vig. 2034"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Domicilio */}
                {editableData.direccion && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Domicilio Detectado
                    </label>
                    <textarea
                      rows={2}
                      value={editableData.direccion}
                      onChange={(e) => setEditableData((prev) => ({ ...prev, direccion: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* BOTÓN DE CONFIRMACIÓN */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmVerification}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                <span>Mis Datos son Correctos, Continuar</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                Al confirmar, se generará el documento oficial certificado y se anexará a tu trámite.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: PROCESANDO Y GENERANDO PDF COMBINADO */}
        {/* ========================================================================= */}
        {currentStep === 'processing' && (
          <div className="w-full text-center space-y-6 py-12">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <Sparkles className="w-10 h-10 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Generando Expediente Digital</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {processingStatus || 'Uniendo ambas caras de tu credencial en formato oficial y vinculando a tu expediente...'}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 5: ÉXITO - DOCUMENTO VERIFICADO */}
        {/* ========================================================================= */}
        {currentStep === 'success' && (
          <div className="w-full text-center space-y-6 py-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">¡Identificación Verificada!</h2>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Tu credencial de elector ha sido procesada, validada y anexada a tu expediente oficial con éxito.
              </p>
            </div>

            {/* Tarjeta de Datos Confirmados */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Datos Oficiales Validados:</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">✓ Verificado OCR</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Nombre:</span>
                <span className="font-bold text-white">
                  {[consolidatedData?.nombre, consolidatedData?.apellido_paterno, consolidatedData?.apellido_materno].filter(Boolean).join(' ') || clienteInfo?.nombre}
                </span>
              </div>

              {consolidatedData?.curp && (
                <div>
                  <span className="text-slate-400 block text-[10px]">CURP:</span>
                  <span className="font-mono font-bold text-emerald-400">{consolidatedData.curp}</span>
                </div>
              )}

              {consolidatedData?.clave_elector && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Clave de Elector:</span>
                  <span className="font-mono text-slate-200">{consolidatedData.clave_elector}</span>
                </div>
              )}
            </div>

            {/* Acciones Finales */}
            {pdfFinalUrl && (
              <div className="space-y-3">
                <a
                  href={pdfFinalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>Ver Expediente en PDF Generado</span>
                </a>
              </div>
            )}

            <p className="text-[11px] text-slate-400 italic">
              Tu asesor ha recibido la notificación y tus requisitos han sido aprobados automáticamente. Puedes cerrar esta ventana.
            </p>
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="py-3 text-center text-[10px] text-slate-400 border-t border-slate-900 bg-slate-950">
        Santina Consultoría & Asociados • Transmisión Cifrada de Extremo a Extremo (SSL 256-bit)
      </footer>

      {/* Input oculto para activar Cámara Nativa del Dispositivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          setShowCameraModal(false);
          handleFileUpload(e, currentStep === 'scan_front' ? 'front' : 'back');
        }}
      />

      {/* Input oculto para Galería / Archivos */}
      <input
        id="gallery-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          setShowCameraModal(false);
          handleFileUpload(e, currentStep === 'scan_front' ? 'front' : 'back');
        }}
      />

      {/* MODAL NOTIFICACIÓN: CÁMARA NATIVA Y FOTOGRAFÍA */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl shadow-blue-500/10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                {currentStep === 'scan_front' ? 'Captura del Frente de tu INE' : 'Captura del Reverso de tu INE'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para tomar la fotografía de tu identificación oficial con máxima nitidez, abre tu cámara nativa o selecciona una foto desde tu galería:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Opción 1: Abrir Cámara Nativa de Inmediato */}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Tomar Foto con mi Cámara</span>
              </button>

              {/* Opción 2: Subir desde Galería */}
              <label
                htmlFor="gallery-input"
                className="w-full py-3.5 px-5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Seleccionar Foto de la Galería</span>
              </label>

              {/* Reintentar Video en Vivo */}
              <button
                type="button"
                onClick={() => {
                  setShowCameraModal(false);
                  startCamera();
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 pt-2 block mx-auto underline cursor-pointer"
              >
                Reintentar escaneo en video continuo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
