import { FieldZone, RichTextValue } from '@/types/preset';
import { createFormattedRichTextFromExtractedText } from '@/utils/richTextParser';

// Cache para el worker de Tesseract para reutilizarlo en múltiples llamadas y evitar descargas repetidas
let ocrWorkerPromise: Promise<any> | null = null;

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['spa', 'eng']);
      return worker;
    })().catch((err) => {
      console.warn('No se pudo inicializar worker de Tesseract:', err);
      ocrWorkerPromise = null;
      throw err;
    });
  }
  return ocrWorkerPromise;
}

/**
 * Intenta extraer texto digital directo usando el textContent de PDF.js
 */
async function extractDigitalTextFromZone(
  page: any,
  zone: FieldZone
): Promise<string | null> {
  try {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    if (!textContent || !textContent.items || textContent.items.length === 0) {
      return null;
    }

    interface MatchingItem {
      str: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const matchingItems: MatchingItem[] = [];

    for (const item of textContent.items) {
      if (!('transform' in item) || !item.str) continue;

      const [scaleX, skewY, , , tx, ty] = item.transform;
      const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

      const fontSize = Math.sqrt(scaleX * scaleX + skewY * skewY) || 12;
      const itemHeight = item.height || fontSize;
      const itemWidth = item.width || (item.str.length * fontSize * 0.5);

      const itemXPercent = (vx / viewport.width) * 100;
      const itemYPercent = ((vy - itemHeight) / viewport.height) * 100;
      const itemWPercent = (itemWidth / viewport.width) * 100;
      const itemHPercent = (itemHeight / viewport.height) * 100;

      const itemCenterX = itemXPercent + itemWPercent / 2;
      const itemCenterY = itemYPercent + itemHPercent / 2;

      // Verificar si está dentro de la zona o se solapa
      const isInside =
        (itemCenterX >= zone.x - 0.5 &&
          itemCenterX <= zone.x + zone.width + 0.5 &&
          itemCenterY >= zone.y - 0.5 &&
          itemCenterY <= zone.y + zone.height + 0.5) ||
        (itemXPercent < zone.x + zone.width &&
          itemXPercent + itemWPercent > zone.x &&
          itemYPercent < zone.y + zone.height &&
          itemYPercent + itemHPercent > zone.y);

      if (isInside && item.str.trim()) {
        matchingItems.push({
          str: item.str,
          x: itemXPercent,
          y: itemYPercent,
          w: itemWPercent,
          h: itemHPercent,
        });
      }
    }

    if (matchingItems.length === 0) {
      return null;
    }

    // Agrupar items en líneas ordenando por Y y luego por X
    matchingItems.sort((a, b) => a.y - b.y || a.x - b.x);

    const lines: { y: number; items: MatchingItem[] }[] = [];
    const lineThreshold = 1.2; // % de diferencia para considerarse la misma línea

    for (const item of matchingItems) {
      const existingLine = lines.find(
        (l) => Math.abs(l.y - item.y) <= lineThreshold
      );
      if (existingLine) {
        existingLine.items.push(item);
        // Actualizar Y promedio
        existingLine.y =
          (existingLine.y * (existingLine.items.length - 1) + item.y) /
          existingLine.items.length;
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }

    // Ordenar líneas de arriba hacia abajo
    lines.sort((a, b) => a.y - b.y);

    // Unir texto en cada línea ordenado de izquierda a derecha
    const extractedLines = lines.map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      return line.items.map((it) => it.str).join(' ').trim();
    });

    const fullText = extractedLines.filter(Boolean).join('\n').trim();
    return fullText.length > 0 ? fullText : null;
  } catch (err) {
    console.warn('Error extrayendo texto digital:', err);
    return null;
  }
}

/**
 * Aplica OCR óptico (Tesseract.js) sobre la zona renderizada en un canvas de alta resolución
 */
async function extractOcrFromZoneCanvas(
  page: any,
  zone: FieldZone
): Promise<string> {
  // Renderizar la página a escala 2.5 para nitidez de OCR
  const scale = 2.5;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No se pudo crear contexto 2D para OCR');
  }

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  // Recortar la sub-región de la zona
  const cropX = Math.max(0, Math.floor((zone.x / 100) * canvas.width));
  const cropY = Math.max(0, Math.floor((zone.y / 100) * canvas.height));
  const cropW = Math.min(canvas.width - cropX, Math.ceil((zone.width / 100) * canvas.width));
  const cropH = Math.min(canvas.height - cropY, Math.ceil((zone.height / 100) * canvas.height));

  if (cropW <= 0 || cropH <= 0) {
    return '';
  }

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cropCtx = croppedCanvas.getContext('2d');

  if (!cropCtx) {
    return '';
  }

  cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  try {
    const worker = await getOcrWorker();
    const ret = await worker.recognize(croppedCanvas);
    const rawText = ret.data.text || '';
    
    // Limpiar saltos de línea repetidos y caracteres sobrantes
    const cleanText = rawText
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
      .join('\n')
      .trim();

    return cleanText;
  } catch (err) {
    console.warn('Error en Tesseract OCR:', err);
    return '';
  }
}

/**
 * Extrae texto de una zona específica de un PDF (híbrido: digital primero, OCR como respaldo/escaneado)
 */
export async function extractTextFromZone(
  pdfBuffer: ArrayBuffer,
  zone: FieldZone,
  forceOcr: boolean = false
): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer.slice(0) });
  const doc = await loadingTask.promise;
  const pageNumber = Math.min(Math.max(1, zone.pageNumber || 1), doc.numPages);
  const page = await doc.getPage(pageNumber);

  if (!forceOcr) {
    const digitalText = await extractDigitalTextFromZone(page, zone);
    if (digitalText && digitalText.trim().length > 0) {
      return digitalText;
    }
  }

  // Si no hay texto digital o se solicita OCR forzado, aplicar OCR óptico
  return await extractOcrFromZoneCanvas(page, zone);
}

/**
 * Extrae el texto de todas las zonas de un PDF de forma paralela u organizada por página
 */
export async function extractTextFromAllZones(
  pdfBuffer: ArrayBuffer,
  zones: FieldZone[],
  forceOcr: boolean = false,
  onProgress?: (completed: number, total: number, zoneName: string) => void
): Promise<Record<string, RichTextValue>> {
  if (!zones || zones.length === 0) return {};

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer.slice(0) });
  const doc = await loadingTask.promise;

  const results: Record<string, RichTextValue> = {};
  let completedCount = 0;

  for (const zone of zones) {
    const pageNumber = Math.min(Math.max(1, zone.pageNumber || 1), doc.numPages);
    const page = await doc.getPage(pageNumber);

    let extractedText = '';

    if (!forceOcr) {
      const digitalText = await extractDigitalTextFromZone(page, zone);
      if (digitalText && digitalText.trim().length > 0) {
        extractedText = digitalText;
      }
    }

    if (!extractedText) {
      extractedText = await extractOcrFromZoneCanvas(page, zone);
    }

    const richValue = createFormattedRichTextFromExtractedText(
      extractedText,
      zone
    );

    results[zone.id] = richValue;

    completedCount++;
    if (onProgress) {
      onProgress(completedCount, zones.length, zone.name);
    }
  }

  return results;
}
