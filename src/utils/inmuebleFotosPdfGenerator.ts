import { PDFDocument } from 'pdf-lib';

/**
 * Recibe un arreglo de DataURLs o URLs de hasta 5 imágenes,
 * y genera un archivo PDF en formato File con hasta 2 imágenes por página (cada una usando media hoja).
 */
export async function generateInmuebleFotosPdf(imageSources: string[], fileName: string = 'fotos_inmueble.pdf'): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  // Ancho y alto de hoja Carta en puntos (8.5 x 11 pulgadas = 612 x 792)
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 20;
  const halfHeight = (pageHeight - (margin * 3)) / 2; // ~376px alto por ranura
  const containerWidth = pageWidth - (margin * 2); // 572px ancho

  for (let i = 0; i < imageSources.length; i += 2) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const currentChunk = imageSources.slice(i, i + 2);

    for (let j = 0; j < currentChunk.length; j++) {
      const src = currentChunk[j];
      try {
        let imageBytes: ArrayBuffer;
        if (src.startsWith('data:')) {
          const base64Data = src.split(',')[1];
          const binaryStr = atob(base64Data);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let k = 0; k < len; k++) {
            bytes[k] = binaryStr.charCodeAt(k);
          }
          imageBytes = bytes.buffer;
        } else {
          const res = await fetch(src);
          imageBytes = await res.arrayBuffer();
        }

        let embeddedImage;
        const isPng = src.toLowerCase().includes('.png') || src.startsWith('data:image/png');
        if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } catch {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          } catch {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          }
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        // Calcular aspect ratio de la imagen para centrarla dentro de la mitad correspondiente
        const scale = Math.min(containerWidth / imgWidth, halfHeight / imgHeight);
        const finalW = imgWidth * scale;
        const finalH = imgHeight * scale;

        // Posición Y en pdf-lib empieza desde abajo (0,0 es esquina inferior izquierda)
        // Ranura 0 (Top Half): Y va de (pageHeight - margin - halfHeight) a (pageHeight - margin)
        // Ranura 1 (Bottom Half): Y va de margin a (margin + halfHeight)
        const slotCenterY = j === 0 
          ? pageHeight - margin - (halfHeight / 2) 
          : margin + (halfHeight / 2);
        
        const slotCenterX = margin + (containerWidth / 2);

        const drawX = slotCenterX - (finalW / 2);
        const drawY = slotCenterY - (finalH / 2);

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: finalW,
          height: finalH,
        });
      } catch (err) {
        console.error(`Error al incrustar imagen ${i + j} en el PDF:`, err);
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  return new File([blob], fileName, { type: 'application/pdf' });
}
