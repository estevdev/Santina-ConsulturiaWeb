import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FieldZone, ProcessedFieldValues, RichTextValue, TextLine, TextSpan } from '@/types/preset';

// Conversión de color (Hex o RGB) a RGB de pdf-lib (0-1)
function hexToRgb(colorStr?: string) {
  if (!colorStr) return rgb(0, 0, 0);
  const str = colorStr.trim();
  
  // Soporte para formato rgb(r, g, b) o rgba(r, g, b, a)
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      const r = Math.max(0, Math.min(1, parseInt(match[1], 10) / 255));
      const g = Math.max(0, Math.min(1, parseInt(match[2], 10) / 255));
      const b = Math.max(0, Math.min(1, parseInt(match[3], 10) / 255));
      return rgb(r, g, b);
    }
  }

  // Soporte para formato hex #RGB o #RRGGBB
  let cleanHex = str.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length >= 6) {
    const r = Math.max(0, Math.min(1, (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255));
    const g = Math.max(0, Math.min(1, (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255));
    const b = Math.max(0, Math.min(1, (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255));
    return rgb(r, g, b);
  }

  return rgb(0, 0, 0);
}

function getFontName(family: string = 'Helvetica', isBold: boolean = false, isItalic: boolean = false): StandardFonts {
  if (family === 'TimesRoman' || family === 'Times') {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (family === 'Courier' || family === 'CourierWide') {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  // Default: Helvetica
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

export async function applyEditsToPdf(
  pdfArrayBuffer: ArrayBuffer,
  zones: FieldZone[],
  values: ProcessedFieldValues
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
  const pages = pdfDoc.getPages();

  // Cache de fuentes cargadas para mejor rendimiento
  const fontCache = new Map<StandardFonts, any>();
  const getEmbeddedFont = async (fontEnum: StandardFonts) => {
    if (!fontCache.has(fontEnum)) {
      const f = await pdfDoc.embedFont(fontEnum);
      fontCache.set(fontEnum, f);
    }
    return fontCache.get(fontEnum);
  };

  for (const zone of zones) {
    const rawValue = values[zone.id];
    if (rawValue === undefined || rawValue === '') continue;

    const pageIndex = (zone.pageNumber || 1) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convertir porcentajes a coordenadas de puntos en pdf-lib
    const boxX = (zone.x / 100) * pageWidth;
    const boxYTop = (zone.y / 100) * pageHeight;
    const boxWidth = (zone.width / 100) * pageWidth;
    const boxHeight = (zone.height / 100) * pageHeight;

    const boxYBottom = pageHeight - boxYTop - boxHeight;

    // 1. Dibujar parche de fondo para blanquear y tapar el texto anterior del PDF base
    const shouldDrawBg =
      zone.bgColor !== 'transparent' &&
      zone.bgColor !== 'none';

    if (shouldDrawBg) {
      const bgColor = hexToRgb(zone.bgColor || '#FFFFFF');
      page.drawRectangle({
        x: boxX,
        y: boxYBottom,
        width: boxWidth,
        height: boxHeight,
        color: bgColor,
      });
    }

    // Si es una imagen en base64 (Firma / Rúbrica en trazo)
    if (typeof rawValue === 'string' && rawValue.startsWith('data:image/')) {
      try {
        const base64Data = rawValue.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const embeddedImg = rawValue.includes('image/png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        page.drawImage(embeddedImg, {
          x: boxX,
          y: boxYBottom,
          width: boxWidth,
          height: boxHeight,
        });
        continue;
      } catch (err) {
        console.error('Error al incrustar la imagen de firma en el PDF:', err);
      }
    }

    // 1.5. Si es una zona de marcado de círculo (circle_select)
    if (zone.fieldType === 'circle_select' || (typeof rawValue === 'string' && (rawValue === 'SELECTED' || rawValue === 'CHECKED' || rawValue.startsWith('CIRCLE_')))) {
      const radius = zone.circleRadius || 6;
      const circleColor = hexToRgb(zone.color || '#000000');
      
      // Si la zona tiene sub-opciones específicas marcadas
      if (zone.circleOptions && zone.circleOptions.length > 0) {
        const selectedOptionId = typeof rawValue === 'string' ? rawValue.replace('CIRCLE_', '') : '';
        const opt = zone.circleOptions.find((o) => o.id === selectedOptionId || o.label === rawValue) || zone.circleOptions[0];
        
        const optX = (opt.x / 100) * pageWidth;
        const optYTop = (opt.y / 100) * pageHeight;
        const optYBottom = pageHeight - optYTop;

        page.drawCircle({
          x: optX,
          y: optYBottom,
          size: radius,
          color: circleColor,
        });
      } else {
        // Círculo en el centro de la zona
        const centerX = boxX + boxWidth / 2;
        const centerY = boxYBottom + boxHeight / 2;

        page.drawCircle({
          x: centerX,
          y: centerY,
          size: radius,
          color: circleColor,
        });
      }
      continue;
    }

    // 1.8. Manejo especial de desbordamiento en grupos de párrafos (P1, P2, P3...)
    // Si la zona es parte de una secuencia P1, P2, P3... y ya fue procesada como continuación por P1, saltar
    if ((zone as any)._skipOverflow) continue;

    const pMatch = zone.name.match(/^(.*?)\s+P([1-9]\d*)$/i);
    if (pMatch && typeof rawValue === 'string') {
      const baseGroupKey = pMatch[1].trim().toLowerCase();
      const currentPNum = parseInt(pMatch[2], 10);

      // Buscar si existen las siguientes zonas en secuencia (ej. P2, P3, P4)
      const siblingZones = zones
        .filter((z) => (z.pageNumber || 1) === (zone.pageNumber || 1))
        .map((z) => {
          const m = z.name.match(/^(.*?)\s+P([1-9]\d*)$/i);
          if (m && m[1].trim().toLowerCase() === baseGroupKey) {
            return { zone: z, num: parseInt(m[2], 10) };
          }
          return null;
        })
        .filter((item): item is { zone: FieldZone; num: number } => item !== null)
        .sort((a, b) => a.num - b.num);

      if (siblingZones.length > 1 && siblingZones[0].num === currentPNum) {
        // Concatenar el texto completo disponible para el grupo
        let fullTextGroup = rawValue;

        // Si hay otros valores en los siblings, usarlos solo si el primero no trae la cadena completa
        for (const sib of siblingZones) {
          if (sib.num > currentPNum) {
            const sibVal = values[sib.zone.id];
            if (typeof sibVal === 'string' && sibVal && !fullTextGroup.includes(sibVal)) {
              fullTextGroup += ' ' + sibVal;
            }
            // Marcar hermano para no re-procesar por separado
            (sib.zone as any)._skipOverflow = true;
          }
        }

        // Dividir por palabras y distribuir según el ancho físico permitido por cada zona
        const words = fullTextGroup.split(/\s+/).filter(Boolean);
        let currentWordIdx = 0;

        for (const sib of siblingZones) {
          if (currentWordIdx >= words.length) break;

          const sibX = (sib.zone.x / 100) * pageWidth;
          const sibYTop = (sib.zone.y / 100) * pageHeight;
          const sibWidth = (sib.zone.width / 100) * pageWidth;
          const sibHeight = (sib.zone.height / 100) * pageHeight;
          const sibYBottom = pageHeight - sibYTop - sibHeight;

          const sibFontSize = sib.zone.fontSize || zone.fontSize || 10;
          const fontEnum = getFontName(
            sib.zone.fontFamily || zone.fontFamily,
            sib.zone.isBold ?? zone.isBold,
            sib.zone.isItalic ?? zone.isItalic
          );
          const font = await getEmbeddedFont(fontEnum);

          let chunkText = '';
          while (currentWordIdx < words.length) {
            const candidate = chunkText ? `${chunkText} ${words[currentWordIdx]}` : words[currentWordIdx];
            const candidateWidth = font.widthOfTextAtSize(candidate, sibFontSize);

            if (candidateWidth <= sibWidth) {
              chunkText = candidate;
              currentWordIdx++;
            } else {
              // Si no cabe ni una sola palabra en la zona, forzar meterla y pasar a la siguiente
              if (!chunkText) {
                chunkText = words[currentWordIdx];
                currentWordIdx++;
              }
              break;
            }
          }

          if (chunkText) {
            const fontAscent = sibFontSize * 0.78;
            const drawY = pageHeight - sibYTop - fontAscent;
            const textColor = hexToRgb(sib.zone.color || zone.color || '#000000');

            page.drawText(chunkText, {
              x: sibX,
              y: drawY,
              size: sibFontSize,
              font: font,
              color: textColor,
            });
          }
        }
        continue;
      }
    }

    // 2. Normalizar líneas y spans
    let inputLines: TextLine[] = [];
    if (typeof rawValue === 'object' && 'lines' in rawValue) {
      inputLines = (rawValue as RichTextValue).lines;
    } else if (typeof rawValue === 'string') {
      const splitStr = rawValue.split('\n');
      inputLines = splitStr.map((line) => ({
        spans: [
          {
            text: line,
            isBold: zone.isBold,
            isItalic: zone.isItalic,
            isUnderline: zone.isUnderline,
            color: zone.color,
            fontSize: zone.fontSize,
            fontFamily: zone.fontFamily,
          },
        ],
        alignment: zone.alignment,
      }));
    }

    if (inputLines.length === 0) continue;

    const numLines = inputLines.length;
    const baseFontSize = zone.fontSize || 12;
    const lineSpacingFactor = zone.lineHeight || 1.15;
    const lineHeight = baseFontSize * lineSpacingFactor;
    const totalHeight = (numLines - 1) * lineHeight + baseFontSize;
    const verticalOffset = boxHeight > totalHeight ? (boxHeight - totalHeight) / 2 : 0;
    const fontAscent = baseFontSize * 0.78;
    const startY = pageHeight - boxYTop - verticalOffset - fontAscent;

    // 3. Dibujar cada línea horizontal continua (permitiendo extenderse horizontalmente si no hay salto de línea)
    for (let lineIdx = 0; lineIdx < inputLines.length; lineIdx++) {
      const line = inputLines[lineIdx];
      const currentY = startY - (lineIdx * lineHeight);
      const lineAlignment = line.alignment || zone.alignment || 'left';

      let totalLineWidth = 0;
      const spanMeasurements: { span: TextSpan; font: any; width: number; fontSize: number }[] = [];

      for (const span of line.spans) {
        if (!span.text) continue;
        const spanFontSize = span.fontSize || baseFontSize;
        const fontEnum = getFontName(
          span.fontFamily || zone.fontFamily,
          span.isBold ?? zone.isBold,
          span.isItalic ?? zone.isItalic
        );
        const font = await getEmbeddedFont(fontEnum);
        const width = font.widthOfTextAtSize(span.text, spanFontSize);
        totalLineWidth += width;
        spanMeasurements.push({ span, font, width, fontSize: spanFontSize });
      }

      // Posición de inicio horizontal según alineación (a partir del borde boxX)
      let startX = boxX;
      if (lineAlignment === 'center') {
        startX = boxX + (boxWidth - totalLineWidth) / 2;
      } else if (lineAlignment === 'right') {
        startX = boxX + boxWidth - totalLineWidth;
      }

      let cursorX = startX;
      for (const item of spanMeasurements) {
        const { span, font, width, fontSize } = item;
        const targetColor = span.color || zone.color || '#000000';
        const textColor = hexToRgb(targetColor);

        page.drawText(span.text, {
          x: cursorX,
          y: currentY,
          size: fontSize,
          font: font,
          color: textColor,
        });

        if (span.isUnderline || (span.isUnderline === undefined && zone.isUnderline)) {
          const underlineY = currentY - 2;
          page.drawLine({
            start: { x: cursorX, y: underlineY },
            end: { x: cursorX + width, y: underlineY },
            thickness: Math.max(0.8, fontSize / 14),
            color: textColor,
          });
        }

        cursorX += width;
      }
    }
  }

  return await pdfDoc.save();
}
