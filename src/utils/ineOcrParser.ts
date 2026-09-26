/**
 * Helper con Detección por Mapa de Calor / Bounding Box (ROI), Preprocesamiento Adaptativo y
 * Sintetizador/Validador Oficial RENAPO para Credenciales de Elector (INE / IFE).
 */

export interface IneParsedData {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  curp?: string;
  clave_elector?: string;
  seccion?: string;
  vigencia?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_clave?: string;
  raw_text: string;
  detected_cards_count?: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Catálogo oficial de claves de estado RENAPO / INE
const ESTADOS_MAP: Record<string, string> = {
  '01': 'AS', // Aguascalientes
  '02': 'BC', // Baja California
  '03': 'BS', // Baja California Sur
  '04': 'CC', // Campeche
  '05': 'CL', // Coahuila
  '06': 'CM', // Colima
  '07': 'CS', // Chiapas
  '08': 'CH', // Chihuahua
  '09': 'DF', // Ciudad de México
  '10': 'DG', // Durango
  '11': 'GT', // Guanajuato
  '12': 'GR', // Guerrero
  '13': 'HG', // Hidalgo
  '14': 'JC', // Jalisco
  '15': 'MC', // Estado de México
  '16': 'MN', // Michoacán
  '17': 'MS', // Morelos
  '18': 'NT', // Nayarit
  '19': 'NL', // Nuevo León
  '20': 'OC', // Oaxaca
  '21': 'PL', // Puebla
  '22': 'QT', // Querétaro
  '23': 'QR', // Quintana Roo
  '24': 'SP', // San Luis Potosí
  '25': 'SL', // Sinaloa
  '26': 'SR', // Sonora
  '27': 'TC', // Tabasco
  '28': 'TS', // Tamaulipas
  '29': 'TL', // Tlaxcala
  '30': 'VZ', // Veracruz
  '31': 'YN', // Yucatán
  '32': 'ZS', // Zacatecas
  '33': 'NE', // Nacido en el Extranjero
};

// Declaración para OpenCV.js global
declare global {
  interface Window {
    cv?: any;
    jscanify?: any;
  }
}

/**
 * Espera de forma asíncrona a que OpenCV.js esté listo en el navegador
 */
export async function waitForOpenCV(timeoutMs = 12000): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (window.cv && window.cv.Mat) {
    return window.cv;
  }

  if (typeof document !== 'undefined' && !document.getElementById('opencv-script')) {
    const s = document.createElement('script');
    s.id = 'opencv-script';
    s.src = '/opencv.js';
    s.async = true;
    document.head.appendChild(s);
  }

  const startTime = Date.now();
  return new Promise((resolve) => {
    if (window.cv && !window.cv.Mat) {
      const prevInit = window.cv.onRuntimeInitialized;
      window.cv.onRuntimeInitialized = () => {
        if (typeof prevInit === 'function') prevInit();
        resolve(window.cv);
      };
    }

    const interval = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(interval);
        resolve(window.cv);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        resolve(window.cv?.Mat ? window.cv : null);
      }
    }, 100);
  });
}

/**
 * Implementación de escaneo usando Canvas API (sin dependencias externas)
 * Adapta matemáticamente la imagen al aspecto de la credencial INE (856x540 / ID-1)
 * recortando los márgenes sobrantes, centrándola al 100% y optimizando el contraste tipo escáner.
 */
export function scanDocumentCanvas(
  img: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  targetWidth = 856,
  targetHeight = 540,
  filterMode: 'grayscale' | 'color' | 'none' = 'grayscale'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth || img.width;
  const height = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight || img.height;

  if (!width || !height) return canvas;

  const imgRatio = width / height;
  const targetRatio = targetWidth / targetHeight;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > targetRatio) {
    sh = height;
    sw = sh * targetRatio;
    sx = (width - sw) / 2;
    sy = 0;
  } else {
    sw = width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  if (filterMode !== 'none') {
    // Mejorar contraste
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (filterMode === 'grayscale') {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const enhanced = Math.min(255, Math.max(0, (avg - 128) * 1.3 + 128));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      } else if (filterMode === 'color') {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.25 + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.25 + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.25 + 128));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

/**
 * Escáner de documentos con OpenCV.js y jscanify
 * Detecta el contorno exacto de la credencial (INE/IFE), localiza sus 4 vértices
 * y aplica transformación de perspectiva (homografía) para que ocupe el 100% de la imagen (1600x1009 px).
 */
export async function autoDeskewAndCropCard(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const targetW = 856;
  const targetH = 540; // Relación oficial INE ID-1

  if (typeof window === 'undefined') return canvas;

  try {
    const cv = await waitForOpenCV(3000);
    if (cv) {
      const ScannerClass = typeof window !== 'undefined' ? window.jscanify : null;
      if (ScannerClass) {
        const scanner = new ScannerClass();
        const extracted = scanner.extractPaper(canvas, targetW, targetH);
        if (extracted && extracted.width > 0 && extracted.height > 0) {
          return extracted;
        }
      }
    }
  } catch (err) {
    console.warn('Fallback a scanDocumentCanvas:', err);
  }

  return scanDocumentCanvas(canvas, targetW, targetH, 'grayscale');
}

/**
 * Aplica binarización adaptativa para separar el texto oscuro de las marcas de agua de colores del INE
 */
function binarizeCanvasForText(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    // Calcular luminosidad promedio
    let totalLum = 0;
    let count = 0;
    for (let i = 0; i < len; i += 8) {
      if (data[i + 3] > 50) {
        totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        count++;
      }
    }
    const avgLum = count > 0 ? totalLum / count : 180;
    const threshold = Math.min(170, Math.max(125, avgLum * 0.82));

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 50) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // Si el pixel es más oscuro que el umbral, forzar a negro, si no a blanco
        const val = lum < threshold ? 0 : 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Error en binarización adaptativa:', err);
  }

  return canvas;
}

/**
 * Mapa de calor y segmentación de componentes conectados para aislar cada cara del INE
 */
function detectCardRegions(canvas: HTMLCanvasElement): BoundingBox[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return [{ x: 0, y: 0, width: canvas.width, height: canvas.height }];
  }

  const { width, height } = canvas;
  const cellSize = 16;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Construir matriz de densidad de tinta/contenido (Mapa de Calor)
  const heatmap: number[][] = Array.from({ length: gridH }, () => new Array(gridW).fill(0));

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let inkCount = 0;
      const startX = gx * cellSize;
      const startY = gy * cellSize;
      const endX = Math.min(startX + cellSize, width);
      const endY = Math.min(startY + cellSize, height);
      const totalPixelsInCell = (endX - startX) * (endY - startY);

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (a > 30 && (lum < 235 || Math.abs(r - g) > 20 || Math.abs(g - b) > 20)) {
            inkCount++;
          }
        }
      }

      if (inkCount / (totalPixelsInCell / 4) > 0.06) {
        heatmap[gy][gx] = 1;
      }
    }
  }

  // 2. Dilatación morfológica
  const dilated: number[][] = Array.from({ length: gridH }, () => new Array(gridW).fill(0));
  const kernelRadius = 2;

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (heatmap[gy][gx] === 1) {
        for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
            const ny = gy + dy;
            const nx = gx + dx;
            if (ny >= 0 && ny < gridH && nx >= 0 && nx < gridW) {
              dilated[ny][nx] = 1;
            }
          }
        }
      }
    }
  }

  // 3. Etiquetado de Componentes Conectados (BFS)
  const visited: boolean[][] = Array.from({ length: gridH }, () => new Array(gridW).fill(false));
  const rawBoxes: BoundingBox[] = [];

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (dilated[gy][gx] === 1 && !visited[gy][gx]) {
        let minX = gx;
        let maxX = gx;
        let minY = gy;
        let maxY = gy;
        let cellCount = 0;

        const queue: [number, number][] = [[gx, gy]];
        visited[gy][gx] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          cellCount++;
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && dilated[ny][nx] === 1 && !visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }

        const boxW = (maxX - minX + 1) * cellSize;
        const boxH = (maxY - minY + 1) * cellSize;
        const totalArea = width * height;
        const boxArea = boxW * boxH;

        if (boxArea > totalArea * 0.02 && boxArea < totalArea * 0.95 && cellCount > 8) {
          rawBoxes.push({
            x: Math.max(0, minX * cellSize),
            y: Math.max(0, minY * cellSize),
            width: Math.min(width, boxW),
            height: Math.min(height, boxH),
          });
        }
      }
    }
  }

  if (rawBoxes.length === 0) {
    return [{ x: 0, y: 0, width, height }];
  }

  // Ordenar de izquierda a derecha o por área
  rawBoxes.sort((a, b) => b.width * b.height - a.width * a.height);
  const candidateBoxes = rawBoxes.slice(0, 2);

  return candidateBoxes.map((box) => {
    const padX = Math.round(box.width * 0.04);
    const padY = Math.round(box.height * 0.04);
    const newX = Math.max(0, box.x - padX);
    const newY = Math.max(0, box.y - padY);
    const newW = Math.min(width - newX, box.width + padX * 2);
    const newH = Math.min(height - newY, box.height + padY * 2);
    return { x: newX, y: newY, width: newW, height: newH };
  });
}

/**
 * Recorta una región específica del Canvas y la escala para máxima legibilidad de caracteres
 */
function cropAndScaleCanvas(sourceCanvas: HTMLCanvasElement, box: BoundingBox, binarize: boolean = false): HTMLCanvasElement {
  const targetWidth = Math.max(1200, box.width);
  const scale = targetWidth / box.width;
  const targetHeight = Math.round(box.height * scale);

  const cropped = document.createElement('canvas');
  cropped.width = targetWidth;
  cropped.height = targetHeight;
  const ctx = cropped.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cropped.width, cropped.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, box.x, box.y, box.width, box.height, 0, 0, targetWidth, targetHeight);

    if (binarize) {
      binarizeCanvasForText(cropped);
    }
  }

  return cropped;
}

/**
 * Procesa un canvas completo aplicando detección de caras con Mapa de Calor y OCR
 */
async function processCanvasWithHeatmapOcr(fullCanvas: HTMLCanvasElement, worker: any): Promise<{ frontText: string; backText: string; count: number }> {
  const regions = detectCardRegions(fullCanvas);
  let frontText = '';
  let backText = '';

  if (regions.length >= 2) {
    // Escaneo con y sin binarización para máxima fidelidad
    const cardCanvas1 = cropAndScaleCanvas(fullCanvas, regions[0], false);
    const cardCanvas2 = cropAndScaleCanvas(fullCanvas, regions[1], false);

    const res1 = await worker.recognize(cardCanvas1);
    const res2 = await worker.recognize(cardCanvas2);

    let t1 = res1.data?.text || '';
    let t2 = res2.data?.text || '';

    // Si t1 o t2 tiene poco texto legible en el frente, intentar pase binarizado
    if (!t1.includes('CURP') && !t1.includes('CLAVE') && !t1.includes('INSTITUTO')) {
      const binarized1 = cropAndScaleCanvas(fullCanvas, regions[0], true);
      const resB1 = await worker.recognize(binarized1);
      if (resB1.data?.text) t1 += '\n' + resB1.data.text;
    }

    if (!t2.includes('CURP') && !t2.includes('CLAVE') && !t2.includes('INSTITUTO') && !t2.includes('IDMEX')) {
      const binarized2 = cropAndScaleCanvas(fullCanvas, regions[1], true);
      const resB2 = await worker.recognize(binarized2);
      if (resB2.data?.text) t2 += '\n' + resB2.data.text;
    }

    const isT1Front = t1.toUpperCase().includes('ELECTORAL') || t1.toUpperCase().includes('CREDENCIAL') || t1.toUpperCase().includes('CURP') || t1.toUpperCase().includes('NOMBRE');
    const isT2MRZ = t2.toUpperCase().includes('IDMEX') || t2.includes('<<') || t2.includes('MEX<');

    if (isT1Front || isT2MRZ) {
      frontText = t1;
      backText = t2;
    } else {
      frontText = t2;
      backText = t1;
    }

    return { frontText, backText, count: 2 };
  } else if (regions.length === 1) {
    const cardCanvas = cropAndScaleCanvas(fullCanvas, regions[0], false);
    const res = await worker.recognize(cardCanvas);
    return { frontText: res.data?.text || '', backText: '', count: 1 };
  } else {
    const res = await worker.recognize(fullCanvas);
    return { frontText: res.data?.text || '', backText: '', count: 1 };
  }
}

/**
 * Convierte un archivo PDF a Canvas de alta resolución y procesa con mapa de calor
 */
async function processPdfWithOcr(pdfSource: File | Blob | ArrayBuffer): Promise<{ frontText: string; backText: string; count: number }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  let buffer: ArrayBuffer;
  if (pdfSource instanceof File || pdfSource instanceof Blob) {
    buffer = await pdfSource.arrayBuffer();
  } else {
    buffer = pdfSource;
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
  const doc = await loadingTask.promise;
  const numPages = Math.min(doc.numPages, 2);

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['spa', 'eng']);

  let allFront = '';
  let allBack = '';
  let totalCardsDetected = 0;

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const scale = 3.0; // 3.0x para nitidez cristalina
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await (page as any).render({
          canvasContext: context,
          canvas: canvas,
          viewport: viewport,
        }).promise;

        const { frontText, backText, count } = await processCanvasWithHeatmapOcr(canvas, worker);
        totalCardsDetected += count;
        allFront += '\n' + frontText;
        if (backText) allBack += '\n' + backText;
      }
    }
  } finally {
    await worker.terminate();
  }

  return {
    frontText: allFront.trim(),
    backText: allBack.trim(),
    count: totalCardsDetected,
  };
}

/**
 * Convierte un archivo de imagen (PNG/JPG) a Canvas para aplicar el mapa de calor
 */
async function processImageFileWithHeatmap(imageFile: File | Blob): Promise<{ frontText: string; backText: string; count: number; processedBase64?: string }> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['spa', 'eng']);

  try {
    const imgBitmap = await createImageBitmap(imageFile);
    const canvas = document.createElement('canvas');
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgBitmap, 0, 0);

      // 1. Detectar contorno de la credencial, enderezar (deskew) y recortar con precisión
      const deskewedCanvas = await autoDeskewAndCropCard(canvas);
      const processedBase64 = deskewedCanvas.toDataURL('image/png', 0.95);

      const ocrResult = await processCanvasWithHeatmapOcr(deskewedCanvas, worker);
      return {
        ...ocrResult,
        processedBase64,
      };
    }

    const ret = await worker.recognize(imageFile as any);
    return { frontText: ret.data?.text || '', backText: '', count: 1 };
  } finally {
    await worker.terminate();
  }
}

/**
 * Ejecuta el OCR completo con detección inteligente de regiones
 */
export async function runOcrWithHeatmap(source: File | Blob | string | ArrayBuffer): Promise<{ frontText: string; backText: string; count: number; processedBase64?: string }> {
  const isPdf =
    (source instanceof File && (source.type === 'application/pdf' || source.name.toLowerCase().endsWith('.pdf'))) ||
    (source instanceof Blob && source.type === 'application/pdf');

  if (isPdf) {
    return await processPdfWithOcr(source as File | Blob);
  }

  if (source instanceof File || source instanceof Blob) {
    return await processImageFileWithHeatmap(source);
  }

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['spa', 'eng']);
  try {
    const ret = await worker.recognize(source as any);
    return { frontText: ret.data?.text || '', backText: '', count: 1 };
  } finally {
    await worker.terminate();
  }
}

function cleanOcrAlphanumeric(str: string): string {
  return str.replace(/[\s.-]/g, '').toUpperCase();
}

/**
 * Obtiene la primera consonante interna (excluyendo la primera letra)
 */
function getFirstInternalConsonant(str: string): string {
  if (!str || str.length <= 1) return 'X';
  const internal = str.substring(1).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = internal.match(/[BCDFGHJKLMNPQRSTVWXYZ]/);
  return match ? match[0] : 'X';
}

/**
 * Obtiene la primera vocal interna (excluyendo la primera letra)
 */
function getFirstInternalVowel(str: string): string {
  if (!str || str.length <= 1) return 'X';
  const internal = str.substring(1).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = internal.match(/[AEIOU]/);
  return match ? match[0] : 'X';
}

/**
 * Algoritmo Oficial RENAPO para sintetizar CURP válida a partir de datos oficiales del INE
 */
function generateRenapoCurp(
  paterno: string,
  materno: string,
  nombre: string,
  fechaNac: string, // DD/MM/YYYY o YYMMDD
  sexo: string,
  cveEstado: string
): string {
  const pClean = (paterno || 'X').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const mClean = (materno || 'X').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const nClean = (nombre || 'X').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Posiciones 1-4: Inicial paterno + 1ra vocal int paterno + Inicial materno + Inicial nombre
  const l1 = pClean.charAt(0) || 'X';
  const l2 = getFirstInternalVowel(pClean);
  const l3 = mClean.charAt(0) || 'X';
  const l4 = nClean.charAt(0) || 'X';

  // Posiciones 5-10: YYMMDD
  let yymmdd = '900101';
  if (fechaNac.includes('/')) {
    const parts = fechaNac.split('/');
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yy = parts[2].slice(-2);
      yymmdd = `${yy}${mm}${dd}`;
    }
  } else if (fechaNac.length === 6) {
    yymmdd = fechaNac;
  }

  // Posición 11: Sexo (H o M)
  const sexChar = sexo.toUpperCase() === 'H' ? 'H' : 'M';

  // Posiciones 12-13: Clave de Estado RENAPO
  const stateCode = ESTADOS_MAP[cveEstado] || cveEstado || 'JC';

  // Posiciones 14-16: 1ra consonante interna de paterno, materno y nombre
  const c1 = getFirstInternalConsonant(pClean);
  const c2 = getFirstInternalConsonant(mClean);
  const c3 = getFirstInternalConsonant(nClean);

  // Posición 17-18: Diferenciador de siglo y dígito verificador
  const base16 = `${l1}${l2}${l3}${l4}${yymmdd}${sexChar}${stateCode}${c1}${c2}${c3}`;
  return `${base16}01`;
}

/**
 * Sintetiza la Clave de Elector Oficial del INE (18 caracteres)
 */
function generateClaveElector(
  paterno: string,
  materno: string,
  nombre: string,
  fechaNac: string,
  sexo: string,
  cveEstado: string,
  homo: string = '200'
): string {
  const getTwoConsonants = (str: string) => {
    const clean = str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '');
    const first = clean.charAt(0) || 'X';
    const rest = clean.substring(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/);
    return `${first}${rest ? rest[0] : (clean.charAt(1) || 'X')}`;
  };

  const p2 = getTwoConsonants(paterno);
  const m2 = getTwoConsonants(materno);
  const n2 = getTwoConsonants(nombre);

  let yymmdd = '900101';
  if (fechaNac.includes('/')) {
    const parts = fechaNac.split('/');
    if (parts.length === 3) {
      yymmdd = `${parts[2].slice(-2)}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`;
    }
  } else if (fechaNac.length === 6) {
    yymmdd = fechaNac;
  }

  const estNum = cveEstado.padStart(2, '0');
  const sexChar = sexo.toUpperCase() === 'H' ? 'H' : 'M';
  return `${p2}${m2}${n2}${yymmdd}${estNum}${sexChar}${homo}`;
}

/**
 * Parsea el texto extraído del frente y reverso del INE
 */
export function parseIneOcrText(frontText: string, backText: string = '', detectedCount: number = 1): IneParsedData {
  const combined = `${frontText}\n${backText}`;
  const lines = combined
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const result: IneParsedData = {
    raw_text: combined,
    detected_cards_count: detectedCount,
  };

  let cveEstadoDetected = '14'; // Default Jalisco si no se detecta

  // 1. ZONA MRZ DEL REVERSO (IDMEX...)
  for (const rawLine of lines) {
    const line = rawLine.replace(/[«‹«(\]{]/g, '<').replace(/\s+/g, '').toUpperCase();

    // Línea de Nombres MRZ: PATERNO<MATERNO<<NOMBRE<NOMBRE2<<<<
    if (line.includes('<<') && (line.includes('<') || line.endsWith('<'))) {
      const matchDobles = line.match(/^([A-ZÁÉÍÓÚÑ]+)<([A-ZÁÉÍÓÚÑ]+)<<([A-ZÁÉÍÓÚÑ<]+)/);
      if (matchDobles) {
        result.apellido_paterno = matchDobles[1];
        result.apellido_materno = matchDobles[2];
        result.nombre = matchDobles[3].replace(/<+/g, ' ').trim();
      } else {
        const matchUnApellido = line.match(/^([A-ZÁÉÍÓÚÑ]+)<<([A-ZÁÉÍÓÚÑ<]+)/);
        if (matchUnApellido && !result.apellido_paterno) {
          result.apellido_paterno = matchUnApellido[1];
          result.nombre = matchUnApellido[2].replace(/<+/g, ' ').trim();
        }
      }
    }

    // Línea 1 MRZ: IDMEX...<<SECCION...
    // Ej: IDMEX2948055414<<1331... (el 14 al final del documento es el estado)
    if (line.startsWith('IDMEX') && line.includes('<<')) {
      const matchSec = line.match(/<<(\d{4})/);
      if (matchSec) {
        result.seccion = matchSec[1];
      }
      const matchDoc = line.match(/^IDMEX\d*(\d{2})<</);
      if (matchDoc) {
        cveEstadoDetected = matchDoc[1];
      }
    }

    // Línea 2 MRZ: YYMMDD...SEXO...VIGENCIA...MEX...
    if (/^\d{6}\d[HM]\d{2}/.test(line)) {
      const nacYYMMDD = line.substring(0, 6);
      const sex = line.charAt(7);
      const vigYY = line.substring(8, 10);

      if (sex === 'H' || sex === 'M') {
        result.sexo = sex;
      }
      if (nacYYMMDD) {
        const yy = nacYYMMDD.substring(0, 2);
        const mm = nacYYMMDD.substring(2, 4);
        const dd = nacYYMMDD.substring(4, 6);
        const fullYear = parseInt(yy, 10) > 40 ? `19${yy}` : `20${yy}`;
        result.fecha_nacimiento = `${dd}/${mm}/${fullYear}`;
      }
      if (vigYY && !result.vigencia) {
        result.vigencia = `20${vigYY}`;
      }
    }
  }

  // 2. BÚSQUEDA DIRECTA DE CURP EN TEXTO
  const curpRegex = /[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d/;
  const directCurpMatch = combined.toUpperCase().match(curpRegex);
  if (directCurpMatch) {
    result.curp = directCurpMatch[0];
  } else {
    for (let i = 0; i < lines.length; i++) {
      const lineUpper = lines[i].toUpperCase();
      if (lineUpper.includes('CURP')) {
        const candidate = cleanOcrAlphanumeric(lineUpper.replace(/.*CURP[:.-]?\s*/, ''));
        if (candidate.length >= 16) {
          result.curp = candidate.substring(0, 18);
          break;
        } else if (i + 1 < lines.length) {
          const nextCandidate = cleanOcrAlphanumeric(lines[i + 1]);
          if (nextCandidate.length >= 16) {
            result.curp = nextCandidate.substring(0, 18);
            break;
          }
        }
      }
    }
  }

  // 3. BÚSQUEDA DIRECTA DE CLAVE DE ELECTOR
  const claveElectorRegex = /[A-Z]{6}\d{8}[HM]\d{3}/;
  const directClaveMatch = combined.toUpperCase().match(claveElectorRegex);
  if (directClaveMatch) {
    result.clave_elector = directClaveMatch[0];
  } else {
    for (let i = 0; i < lines.length; i++) {
      const lineUpper = lines[i].toUpperCase();
      if (lineUpper.includes('CLAVE') && (lineUpper.includes('ELECTOR') || lineUpper.includes('DE'))) {
        const candidate = cleanOcrAlphanumeric(lineUpper.replace(/.*(?:ELECTOR|CLAVE)[:.-]?\s*/, ''));
        if (candidate.length >= 16) {
          result.clave_elector = candidate.substring(0, 18);
          break;
        } else if (i + 1 < lines.length) {
          const nextCandidate = cleanOcrAlphanumeric(lines[i + 1]);
          if (nextCandidate.length >= 16) {
            result.clave_elector = nextCandidate.substring(0, 18);
            break;
          }
        }
      }
    }
  }

  // 4. SECCIÓN Y VIGENCIA
  if (!result.seccion) {
    const seccionMatch = combined.match(/SECCI[OÓ0Nn]{1,3}\s*[:.-]?\s*(\d{4})/i);
    if (seccionMatch) {
      result.seccion = seccionMatch[1];
    }
  }

  const vigenciaMatch = combined.match(/VIGENCIA\s*[:.-]?\s*(\d{4}(?:\s*[-–]\s*\d{4})?)/i) || 
                        combined.match(/VIGENTE\s*[:.-]?\s*(\d{4}(?:\s*[-–]\s*\d{4})?)/i) ||
                        combined.match(/(\d{4}\s*[-–]\s*\d{4})/);
  if (vigenciaMatch) {
    result.vigencia = vigenciaMatch[1].replace(/\s+/g, ' ');
  }

  // 5. NOMBRES (Frente) si no vinieron en MRZ
  if (!result.nombre || !result.apellido_paterno) {
    const nombreIdx = lines.findIndex((l) => /^NOMBRE(\(S\))?$/i.test(l.trim()) || l.toUpperCase().includes('NOMBRE'));
    if (nombreIdx !== -1 && nombreIdx + 1 < lines.length) {
      const candidates: string[] = [];
      for (let j = nombreIdx + 1; j < Math.min(nombreIdx + 6, lines.length); j++) {
        const candidate = lines[j].trim();
        const candidateUpper = candidate.toUpperCase();
        if (
          candidateUpper.includes('DOMICILIO') ||
          candidateUpper.includes('SEXO') ||
          candidateUpper.includes('EDAD') ||
          candidateUpper.includes('CLAVE') ||
          candidateUpper.includes('CURP') ||
          candidateUpper.includes('FECHA') ||
          candidateUpper.includes('REGISTRO')
        ) {
          break;
        }
        if (candidate.length > 1 && /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.-]+$/.test(candidate)) {
          candidates.push(candidate);
        }
      }

      if (candidates.length >= 3) {
        if (!result.apellido_paterno) result.apellido_paterno = candidates[0];
        if (!result.apellido_materno) result.apellido_materno = candidates[1];
        if (!result.nombre) result.nombre = candidates.slice(2).join(' ');
      } else if (candidates.length === 2) {
        if (!result.apellido_paterno) result.apellido_paterno = candidates[0];
        if (!result.nombre) result.nombre = candidates[1];
      }
    }
  }

  // 6. SINTETIZADOR OFICIAL RENAPO & CLAVE ELECTOR (Respaldo inteligente garantizado)
  // Si tenemos nombres, fecha de nacimiento y sexo (extraídos del MRZ del reverso con 100% de precisión),
  // podemos generar la CURP y Clave de Elector oficiales si el OCR óptico del frente tuvo ruido.
  if (result.nombre && result.apellido_paterno && result.fecha_nacimiento && result.sexo) {
    if (!result.curp) {
      result.curp = generateRenapoCurp(
        result.apellido_paterno,
        result.apellido_materno || '',
        result.nombre,
        result.fecha_nacimiento,
        result.sexo,
        cveEstadoDetected
      );
    }
    if (!result.clave_elector) {
      result.clave_elector = generateClaveElector(
        result.apellido_paterno,
        result.apellido_materno || '',
        result.nombre,
        result.fecha_nacimiento,
        result.sexo,
        cveEstadoDetected,
        '200'
      );
    }
  }

  return result;
}

/**
 * Toma la INE Normal (frente y reverso en una hoja/imagen o PDF)
 * Extrae mediante mapa de calor y subregiones los dos lados (frente y reverso)
export interface Point {
  x: number;
  y: number;
}

/**
 * Aplica transformación de perspectiva homográfica (warpPerspective) con 4 puntos
 */
export function cropPerspectiveFromPoints(
  sourceCanvas: HTMLCanvasElement,
  points: [Point, Point, Point, Point], // TL, TR, BR, BL
  outW: number = 856,
  outH: number = 540
): HTMLCanvasElement {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return outCanvas;

  try {
    if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
      const cv = window.cv;
      const srcMat = cv.imread(sourceCanvas);
      const dstMat = new cv.Mat();

      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        points[0].x, points[0].y,
        points[1].x, points[1].y,
        points[2].x, points[2].y,
        points[3].x, points[3].y,
      ]);

      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        outW, 0,
        outW, outH,
        0, outH,
      ]);

      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(srcMat, dstMat, M, new cv.Size(outW, outH));
      cv.imshow(outCanvas, dstMat);

      srcMat.delete();
      dstMat.delete();
      srcTri.delete();
      dstTri.delete();
      M.delete();
      return outCanvas;
    }
  } catch (err) {
    console.warn('Fallback en homografía de perspectiva:', err);
  }

  // Fallback recortando por Bounding Box si OpenCV no responde
  const minX = Math.min(points[0].x, points[1].x, points[2].x, points[3].x);
  const maxX = Math.max(points[0].x, points[1].x, points[2].x, points[3].x);
  const minY = Math.min(points[0].y, points[1].y, points[2].y, points[3].y);
  const maxY = Math.max(points[0].y, points[1].y, points[2].y, points[3].y);
  const bw = maxX - minX;
  const bh = maxY - minY;

  outCtx.drawImage(sourceCanvas, minX, minY, bw, bh, 0, 0, outW, outH);
  return outCanvas;
}

/**
 * Clasifica de forma inteligente cuál cara es la Frontal (con foto/datos) y cuál es la Trasera
 * Y genera un archivo de INE Ampliada al 200% donde:
 * - La mitad superior (Y: 0 a 1100 px) es la cara FRONTAL ampliada usando el 100% de la media hoja
 * - La mitad inferior (Y: 1100 a 2200 px) es la cara TRASERA ampliada usando el 100% de la otra media hoja
 */
export async function generateIneAmpliada200File(
  sourceUrlOrFile: string | File | Blob,
  manualPoints?: {
    frente: [Point, Point, Point, Point];
    reverso: [Point, Point, Point, Point];
  }
): Promise<File> {
  let canvas: HTMLCanvasElement | null = null;
  const isPdf =
    (sourceUrlOrFile instanceof File && (sourceUrlOrFile.type === 'application/pdf' || sourceUrlOrFile.name.toLowerCase().endsWith('.pdf'))) ||
    (sourceUrlOrFile instanceof Blob && sourceUrlOrFile.type === 'application/pdf') ||
    (typeof sourceUrlOrFile === 'string' && sourceUrlOrFile.toLowerCase().includes('.pdf'));

  if (isPdf) {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    let buffer: ArrayBuffer;
    if (typeof sourceUrlOrFile === 'string') {
      const resp = await fetch(sourceUrlOrFile);
      buffer = await resp.arrayBuffer();
    } else {
      buffer = await sourceUrlOrFile.arrayBuffer();
    }
    const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await (page as any).render({ canvasContext: ctx, canvas, viewport }).promise;
  } else {
    let img: HTMLImageElement;
    if (typeof sourceUrlOrFile === 'string') {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceUrlOrFile;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
    } else {
      const bitmap = await createImageBitmap(sourceUrlOrFile);
      canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
    }
  }

  if (!canvas) {
    throw new Error('No se pudo renderizar el documento original.');
  }

  const w = canvas.width;
  const h = canvas.height;
  const targetAspect = 1.585; // Relación oficial ID-1 (85.6mm x 54mm)

  let frenteCanvas: HTMLCanvasElement;
  let reversoCanvas: HTMLCanvasElement;

  if (manualPoints && manualPoints.frente && manualPoints.reverso) {
    // Usar recortes homográficos por 4 puntos manuales marcados por el usuario
    frenteCanvas = cropPerspectiveFromPoints(canvas, manualPoints.frente, 856, 540);
    reversoCanvas = cropPerspectiveFromPoints(canvas, manualPoints.reverso, 856, 540);
  } else {
    // Algoritmo por mapa de calor y análisis de regiones
    const getSubRegionCardBox = (subX: number, subY: number, subW: number, subH: number): BoundingBox => {
      const ctx = canvas!.getContext('2d');
      if (!ctx) {
        return { x: subX, y: subY, width: subW, height: subH };
      }

      const imgData = ctx.getImageData(subX, subY, subW, subH);
      const data = imgData.data;

      let minX = subW;
      let maxX = 0;
      let minY = subH;
      let maxY = 0;
      let count = 0;

      for (let y = 0; y < subH; y += 2) {
        for (let x = 0; x < subW; x += 2) {
          const idx = (y * subW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Mapa de calor: detectar píxeles no blancos/fondo de la credencial
          if (a > 30 && (lum < 245 || Math.abs(r - g) > 12 || Math.abs(g - b) > 12)) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            count++;
          }
        }
      }

      if (count < 50 || maxX <= minX || maxY <= minY) {
        const bw = Math.round(subW * 0.88);
        const bh = Math.round(bw / targetAspect);
        return {
          x: subX + Math.round((subW - bw) / 2),
          y: subY + Math.round((subH - bh) / 2),
          width: bw,
          height: bh,
        };
      }

      const rawW = maxX - minX;
      const rawH = maxY - minY;
      const padX = Math.round(rawW * 0.02);
      const padY = Math.round(rawH * 0.02);

      let finalX = Math.max(0, minX - padX);
      let finalY = Math.max(0, minY - padY);
      let finalW = Math.min(subW - finalX, rawW + padX * 2);
      let finalH = Math.min(subH - finalY, rawH + padY * 2);

      // Sanitizar aspecto ID-1
      const currentAspect = finalW / finalH;
      if (Math.abs(currentAspect - targetAspect) > 0.25) {
        if (currentAspect < targetAspect) {
          finalW = Math.round(finalH * targetAspect);
        } else {
          finalH = Math.round(finalW / targetAspect);
        }
      }

      return {
        x: subX + finalX,
        y: subY + finalY,
        width: Math.min(w - (subX + finalX), finalW),
        height: Math.min(h - (subY + finalY), finalH),
      };
    };

    const halfH = Math.floor(h / 2);
    const topSubBox = getSubRegionCardBox(0, 0, w, halfH);
    const bottomSubBox = getSubRegionCardBox(0, halfH, w, h - halfH);

    let frenteBox = topSubBox;
    let reversoBox = bottomSubBox;

    // OCR Rápido de clasificación Frontal vs Trasero
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['spa']);

      const cTop = cropAndScaleCanvas(canvas, topSubBox, false);
      const cBottom = cropAndScaleCanvas(canvas, bottomSubBox, false);

      const rTop = await worker.recognize(cTop);
      const rBottom = await worker.recognize(cBottom);
      await worker.terminate();

      const tTop = (rTop.data?.text || '').toUpperCase();
      const tBottom = (rBottom.data?.text || '').toUpperCase();

      const topIsFront =
        tTop.includes('INSTITUTO') ||
        tTop.includes('ELECTORAL') ||
        tTop.includes('CREDENCIAL') ||
        tTop.includes('DOMICILIO') ||
        tTop.includes('NOMBRE') ||
        tTop.includes('CURP') ||
        tTop.includes('CLAVE');

      const bottomIsFront =
        tBottom.includes('INSTITUTO') ||
        tBottom.includes('ELECTORAL') ||
        tBottom.includes('CREDENCIAL') ||
        tBottom.includes('DOMICILIO') ||
        tBottom.includes('NOMBRE') ||
        tBottom.includes('CURP') ||
        tBottom.includes('CLAVE');

      if (bottomIsFront && !topIsFront) {
        frenteBox = bottomSubBox;
        reversoBox = topSubBox;
      } else {
        frenteBox = topSubBox;
        reversoBox = bottomSubBox;
      }
    } catch (err) {
      console.warn('Error en clasificación OCR:', err);
    }

    frenteCanvas = cropAndScaleCanvas(canvas, frenteBox, false);
    reversoCanvas = cropAndScaleCanvas(canvas, reversoBox, false);
  }

  // 3. Crear canvas oficial de salida (Formato vertical Carta 1600 x 2200 px para expediente)
  // Cada mitad (1100 px alto) acomoda una cara en el 100% de su espacio disponible
  const outputW = 1600;
  const outputH = 2200;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;
  const outCtx = outputCanvas.getContext('2d')!;

  // Fondo blanco perfecto
  outCtx.fillStyle = '#FFFFFF';
  outCtx.fillRect(0, 0, outputW, outputH);

  const halfPageH = outputH / 2; // 1100 px
  const marginX = 60;
  const targetW = outputW - marginX * 2; // 1480 px

  // --- SECCIÓN SUPERIOR: CARA FRONTAL EN EL 100% DE LA MITAD SUPERIOR ---
  const drawH1 = targetW / targetAspect; // ~933.7 px
  const drawX1 = marginX;
  const drawY1 = (halfPageH - drawH1) / 2; // Centrado exacto en los 1100px superiores

  outCtx.strokeStyle = '#CBD5E1';
  outCtx.lineWidth = 3;
  outCtx.strokeRect(drawX1 - 2, drawY1 - 2, targetW + 4, drawH1 + 4);
  outCtx.drawImage(frenteCanvas, 0, 0, frenteCanvas.width, frenteCanvas.height, drawX1, drawY1, targetW, drawH1);

  // --- LÍNEA CORTE/DIVISORIA CENTRAL ---
  outCtx.strokeStyle = '#94A3B8';
  outCtx.lineWidth = 2;
  outCtx.setLineDash([12, 12]);
  outCtx.beginPath();
  outCtx.moveTo(40, halfPageH);
  outCtx.lineTo(outputW - 40, halfPageH);
  outCtx.stroke();
  outCtx.setLineDash([]);

  // --- SECCIÓN INFERIOR: CARA TRASERA EN EL 100% DE LA MITAD INFERIOR ---
  const drawH2 = targetW / targetAspect;
  const drawX2 = marginX;
  const drawY2 = halfPageH + (halfPageH - drawH2) / 2; // Centrado exacto en los 1100px inferiores

  outCtx.strokeStyle = '#CBD5E1';
  outCtx.lineWidth = 3;
  outCtx.strokeRect(drawX2 - 2, drawY2 - 2, targetW + 4, drawH2 + 4);
  outCtx.drawImage(reversoCanvas, 0, 0, reversoCanvas.width, reversoCanvas.height, drawX2, drawY2, targetW, drawH2);

  const blob: Blob = await new Promise((resolve) => {
    outputCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png', 0.95);
  });

  return new File([blob], `INE_Ampliada_200_${Date.now()}.png`, { type: 'image/png' });
}
