import { Preset } from '../types/preset';

const PRESETS_KEY = 'pdf_editor_presets_v1';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'preset-invoice-default',
    name: 'Factura Estándar / Recibo',
    description: 'Preset para modificar cliente y fecha en facturas genéricas',
    identifierKeywords: ['factura', 'invoice', 'recibo', 'ticket'],
    zones: [
      {
        id: 'zone-client-name',
        name: 'Nombre del Cliente',
        x: 15,
        y: 20,
        width: 40,
        height: 5,
        pageNumber: 1,
        bgColor: '#FFFFFF',
        color: '#000000',
        alignment: 'left'
      },
      {
        id: 'zone-date',
        name: 'Fecha de Emisión',
        x: 65,
        y: 20,
        width: 25,
        height: 5,
        pageNumber: 1,
        bgColor: '#FFFFFF',
        color: '#000000',
        alignment: 'left'
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export function getPresets(): Preset[] {
  if (typeof window === 'undefined') return INITIAL_PRESETS;
  try {
    const saved = localStorage.getItem(PRESETS_KEY);
    if (!saved) {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(INITIAL_PRESETS));
      return INITIAL_PRESETS;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_PRESETS;
  }
}

export function savePreset(preset: Preset): void {
  const presets = getPresets();
  const index = presets.findIndex(p => p.id === preset.id);
  if (index >= 0) {
    presets[index] = { ...preset, updatedAt: Date.now() };
  } else {
    presets.push({ ...preset, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function saveAllPresets(presets: Preset[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function exportPresetsToJson(presetsToExport?: Preset[], filename = 'presets_pdf_studio.json'): void {
  const data = presetsToExport || getPresets();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importPresetsFromJson(jsonString: string): { success: boolean; count: number; error?: string; presets: Preset[] } {
  try {
    const parsed = JSON.parse(jsonString);
    const rawList = Array.isArray(parsed) ? parsed : [parsed];

    // Validar estructura básica
    const validPresets: Preset[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object' && item.name && Array.isArray(item.zones)) {
        validPresets.push({
          id: item.id || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: String(item.name),
          description: item.description ? String(item.description) : undefined,
          identifierKeywords: Array.isArray(item.identifierKeywords) ? item.identifierKeywords : [],
          zones: item.zones,
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (validPresets.length === 0) {
      return { success: false, count: 0, error: 'El archivo JSON no contiene presets con formato válido.', presets: getPresets() };
    }

    const currentPresets = getPresets();
    const merged = [...currentPresets];

    for (const newP of validPresets) {
      const idx = merged.findIndex((p) => p.id === newP.id || p.name.toLowerCase() === newP.name.toLowerCase());
      if (idx >= 0) {
        merged[idx] = newP;
      } else {
        merged.push(newP);
      }
    }

    saveAllPresets(merged);
    return { success: true, count: validPresets.length, presets: merged };
  } catch (err: any) {
    return { success: false, count: 0, error: `Error al leer el archivo JSON: ${err.message || 'Formato no válido'}`, presets: getPresets() };
  }
}

