import { PDFDocument } from 'pdf-lib';

/**
 * Recibe un arreglo de URLs (de PDFs o imágenes PNG/JPG) y las consolida en un solo Uint8Array PDF.
 */
export async function mergePdfAndImageUrls(urls: string[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  let addedPagesCount = 0;

  for (const url of urls) {
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      const arrayBuffer = await res.arrayBuffer();

      const isPdf = url.toLowerCase().includes('.pdf') || contentType.includes('pdf');

      if (isPdf) {
        const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          addedPagesCount++;
        });
      } else {
        // Asumir imagen (PNG / JPG / JPEG)
        let img;
        if (url.toLowerCase().includes('.png') || contentType.includes('png')) {
          img = await mergedPdf.embedPng(arrayBuffer);
        } else {
          try {
            img = await mergedPdf.embedJpg(arrayBuffer);
          } catch {
            img = await mergedPdf.embedPng(arrayBuffer);
          }
        }

        if (img) {
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
          addedPagesCount++;
        }
      }
    } catch (err) {
      console.warn(`[mergePdfAndImageUrls] Error al procesar archivo desde URL (${url}):`, err);
    }
  }

  if (addedPagesCount === 0) {
    throw new Error('No se encontraron archivos válidos para consolidar en este PDF.');
  }

  return await mergedPdf.save();
}
