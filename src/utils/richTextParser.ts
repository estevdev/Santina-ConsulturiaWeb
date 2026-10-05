import { TextLine, TextSpan, FontFamily } from '@/types/preset';

/**
 * Convierte el JSON de Tiptap / Prosemirror o HTML a una estructura de líneas y spans de texto
 */
export function parseTiptapJsonToLines(docJson: any, defaultFontFamily: FontFamily = 'Helvetica', defaultFontSize = 12, defaultColor = '#000000'): TextLine[] {
  if (!docJson || !docJson.content) {
    return [];
  }

  const lines: TextLine[] = [];

  for (const node of docJson.content) {
    if (node.type === 'paragraph' || node.type === 'heading') {
      const align = (node.attrs?.textAlign as 'left' | 'center' | 'right') || 'left';
      const spans: TextSpan[] = [];

      if (node.content && node.content.length > 0) {
        for (const child of node.content) {
          if (child.type === 'text') {
            let isBold = false;
            let isItalic = false;
            let isUnderline = false;
            let color = defaultColor;

            if (child.marks) {
              for (const mark of child.marks) {
                if (mark.type === 'bold') isBold = true;
                if (mark.type === 'italic') isItalic = true;
                if (mark.type === 'underline') isUnderline = true;
                if (mark.type === 'textStyle' && mark.attrs?.color) {
                  color = mark.attrs.color;
                }
              }
            }

            spans.push({
              text: child.text || '',
              isBold,
              isItalic,
              isUnderline,
              color: color || defaultColor,
              fontFamily: defaultFontFamily,
              fontSize: defaultFontSize,
            });
          }
        }
      } else {
        // Línea vacía / Salto de línea
        spans.push({
          text: '',
          fontFamily: defaultFontFamily,
          fontSize: defaultFontSize,
          color: defaultColor,
        });
      }

      lines.push({
        spans,
        alignment: align,
      });
    }
  }

  return lines;
}

/**
 * Crea un RichTextValue a partir de texto plano o saltos de línea
 */
export function createRichTextValueFromText(
  plainText: string,
  fontFamily: FontFamily = 'Helvetica',
  fontSize = 12,
  color = '#000000',
  alignment: 'left' | 'center' | 'right' = 'left'
) {
  const clean = plainText || '';
  const paragraphs = clean.split(/\r?\n/);

  const html = paragraphs
    .map((p) => `<p style="white-space: pre; margin: 0; padding: 0;">${p || '<br>'}</p>`)
    .join('');

  const lines: TextLine[] = paragraphs.map((p) => ({
    alignment,
    spans: [
      {
        text: p,
        fontFamily,
        fontSize,
        color,
      },
    ],
  }));

  return {
    html,
    lines,
    plainText: clean,
  };
}

/**
 * Aplica el formato guardado de la zona y de cada línea al texto extraído por OCR o ingresado
 */
export function createFormattedRichTextFromExtractedText(
  plainText: string,
  zone: {
    fontFamily?: FontFamily;
    fontSize?: number;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    lineFormats?: any[];
  }
) {
  const clean = plainText || '';
  const rawParagraphs = clean.split(/\r?\n/).map((p) => p.trim());
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [''];

  const lines: TextLine[] = [];
  const htmlParagraphs: string[] = [];

  const baseFontFamily = zone.fontFamily || 'Helvetica';
  const baseFontSize = zone.fontSize || 12;
  const baseColor = zone.color || '#000000';
  const baseAlignment = zone.alignment || 'left';

  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i];
    const rule = zone.lineFormats && zone.lineFormats[i] ? zone.lineFormats[i] : null;

    const isBold = rule && rule.isBold !== undefined ? Boolean(rule.isBold) : Boolean(zone.isBold);
    const isItalic = rule && rule.isItalic !== undefined ? Boolean(rule.isItalic) : Boolean(zone.isItalic);
    const isUnderline = rule && rule.isUnderline !== undefined ? Boolean(rule.isUnderline) : Boolean(zone.isUnderline);
    const color = rule?.color || baseColor;
    const fontSize = rule?.fontSize || baseFontSize;
    const fontFamily = rule?.fontFamily || baseFontFamily;
    const alignment = rule?.alignment || baseAlignment;

    lines.push({
      alignment,
      spans: [
        {
          text,
          isBold,
          isItalic,
          isUnderline,
          color,
          fontSize,
          fontFamily,
        },
      ],
    });

    let innerHtml = text || '<br>';
    if (text) {
      if (isBold) innerHtml = `<strong>${innerHtml}</strong>`;
      if (isItalic) innerHtml = `<em>${innerHtml}</em>`;
      if (isUnderline) innerHtml = `<u>${innerHtml}</u>`;
      if (color && color !== '#000000') {
        innerHtml = `<span style="color: ${color}">${innerHtml}</span>`;
      }
    }

    const alignStyle = alignment !== 'left' ? ` text-align: ${alignment};` : '';
    htmlParagraphs.push(`<p style="white-space: pre; margin: 0; padding: 0;${alignStyle}">${innerHtml}</p>`);
  }

  return {
    html: htmlParagraphs.join(''),
    lines,
    plainText: clean,
  };
}

/**
 * Extrae las reglas de formato de cada línea desde un RichTextValue
 */
export function extractLineFormatsFromRichTextValue(
  value: any,
  zone: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean; color?: string; fontSize?: number; fontFamily?: FontFamily; alignment?: 'left' | 'center' | 'right' }
) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.lines)) {
    return [];
  }

  return value.lines.map((line: TextLine) => {
    const firstSpan = line.spans && line.spans.length > 0 ? line.spans[0] : null;
    const isBold = line.spans ? line.spans.some((s) => s.isBold) : Boolean(zone.isBold);
    const isItalic = line.spans ? line.spans.some((s) => s.isItalic) : Boolean(zone.isItalic);
    const isUnderline = line.spans ? line.spans.some((s) => s.isUnderline) : Boolean(zone.isUnderline);

    return {
      isBold,
      isItalic,
      isUnderline,
      color: firstSpan?.color || zone.color || '#000000',
      fontSize: firstSpan?.fontSize || zone.fontSize || 12,
      fontFamily: firstSpan?.fontFamily || zone.fontFamily || 'Helvetica',
      alignment: line.alignment || zone.alignment || 'left',
    };
  });
}
