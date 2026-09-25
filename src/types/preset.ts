export type FontFamily = 'Helvetica' | 'TimesRoman' | 'Courier';

export interface TextSpan {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
}

export interface TextLine {
  spans: TextSpan[];
  alignment?: 'left' | 'center' | 'right';
}

export interface LineFormatRule {
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  alignment?: 'left' | 'center' | 'right';
}

export interface FieldZone {
  id: string;
  name: string; // e.g., "Nombre Cliente", "Fecha", "Monto"
  x: number; // Porcentaje de ancho 0 - 100
  y: number; // Porcentaje de alto 0 - 100
  width: number; // Porcentaje de ancho 0 - 100
  height: number; // Porcentaje de alto 0 - 100
  pageNumber: number; // Pagina (1-indexed)
  fontSize?: number; // Tamaño de fuente base en pt
  lineHeight?: number; // Factor de interlineado (ej. 1.2)
  fontFamily?: FontFamily;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  alignment?: 'left' | 'center' | 'right';
  color?: string; // hex
  bgColor?: string; // hex para tapar el texto anterior (ej. #FFFFFF)
  lineFormats?: LineFormatRule[]; // Formato guardado línea por línea (negrita, tamaño, etc.)
  defaultTemplateHtml?: string; // Estructura HTML de plantilla guardada
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  identifierKeywords: string[]; // Palabras clave para auto-detectar este preset al subir un PDF
  zones: FieldZone[];
  createdAt: number;
  updatedAt: number;
}

export interface RichTextValue {
  html: string;
  lines: TextLine[];
  plainText: string;
}

export interface ProcessedFieldValues {
  [fieldId: string]: string | RichTextValue;
}
