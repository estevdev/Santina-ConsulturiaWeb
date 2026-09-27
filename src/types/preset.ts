export type FontFamily = 'Helvetica' | 'TimesRoman' | 'Courier' | 'CourierWide';
export type PresetType = 'standard' | 'client_document';
export type TargetTramiteType = 'todos' | 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';
export type FilledByRole = 'cliente' | 'asesor';

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
  filledBy?: FilledByRole; // 'cliente' (por defecto) o 'asesor'
  isSignature?: boolean; // Indica si este campo es una firma/rúbrica en trazo
  fieldType?: 'text' | 'signature' | 'circle_select'; // Tipo de campo: texto, firma o círculo marcado
  sectionHeader?: string; // Título o encabezado de sección para agrupar campos en la vista del cliente (ej. "DATOS GENERALES")
  sectionSubheader?: string; // Subtítulo para subgrupos de campos (ej. "Referencia 1", "Referencia 2")
  circleRadius?: number; // Radio del círculo en puntos (ej. 4, 6, 8 pt)
  circleOptions?: { id: string; label: string; x: number; y: number }[]; // Múltiples opciones de marcado en la misma zona
  lineFormats?: LineFormatRule[]; // Formato guardado línea por línea (negrita, tamaño, etc.)
  defaultTemplateHtml?: string; // Estructura HTML de plantilla guardada
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  presetType?: PresetType; // 'standard' (Edición directa) o 'client_document' (Documento para el cliente)
  targetTramiteType?: TargetTramiteType; // 'todos' | 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss'
  samplePdfUrl?: string; // URL del PDF de prueba/plantilla guardado en Supabase
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
