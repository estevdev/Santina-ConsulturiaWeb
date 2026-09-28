import { Preset } from '../types/preset';
import { createClient } from './supabase/client';

const PRESETS_KEY = 'pdf_editor_presets_v1';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'preset-invoice-default',
    name: 'Factura Estándar / Recibo',
    description: 'Preset para modificar cliente y fecha en facturas genéricas',
    presetType: 'standard',
    targetTramiteType: 'todos',
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

export async function fetchPresetsFromSupabase(): Promise<Preset[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('pdf_presets').select('*');
    if (error || !data || data.length === 0) {
      return getPresets();
    }

    const fetchedPresets: Preset[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      presetType: row.preset_type || 'standard',
      targetTramiteType: row.target_tramite_type || 'todos',
      samplePdfUrl: row.sample_pdf_url || undefined,
      identifierKeywords: Array.isArray(row.identifier_keywords) ? row.identifier_keywords : [],
      zones: Array.isArray(row.zones) ? row.zones : [],
      createdAt: row.created_at ? Number(row.created_at) : Date.now(),
      updatedAt: row.updated_at ? Number(row.updated_at) : Date.now(),
    }));

    // Sincronizar localStorage
    if (fetchedPresets.length > 0) {
      saveAllPresets(fetchedPresets);
    }
    return fetchedPresets;
  } catch {
    return getPresets();
  }
}

export function savePreset(preset: Preset): void {
  const presets = getPresets();
  const index = presets.findIndex(p => p.id === preset.id);
  const updatedPreset = {
    ...preset,
    presetType: preset.presetType || 'standard',
    targetTramiteType: preset.targetTramiteType || 'todos',
    updatedAt: Date.now()
  };
  
  if (index >= 0) {
    presets[index] = updatedPreset;
  } else {
    presets.push({ ...updatedPreset, createdAt: preset.createdAt || Date.now() });
  }
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));

  // Async sync to Supabase database
  savePresetToSupabase(updatedPreset).catch(console.error);
}

export async function savePresetToSupabase(preset: Preset): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('pdf_presets').upsert({
      id: preset.id,
      name: preset.name,
      description: preset.description || null,
      preset_type: preset.presetType || 'standard',
      target_tramite_type: preset.targetTramiteType || 'todos',
      sample_pdf_url: preset.samplePdfUrl || null,
      identifier_keywords: preset.identifierKeywords || [],
      zones: preset.zones || [],
      created_at: preset.createdAt,
      updated_at: preset.updatedAt,
    });
  } catch (err) {
    console.error('Error al guardar preset en Supabase:', err);
  }
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  
  // Async delete from Supabase database
  deletePresetFromSupabase(id).catch(console.error);
}

export async function deletePresetFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('pdf_presets').delete().eq('id', id);
  } catch (err) {
    console.error('Error al eliminar preset de Supabase:', err);
  }
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

export async function savePresetsBatchToSupabase(presets: Preset[]): Promise<void> {
  if (!presets || presets.length === 0) return;
  try {
    const supabase = createClient();
    const rows = presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description || null,
      preset_type: preset.presetType || 'standard',
      target_tramite_type: preset.targetTramiteType || 'todos',
      sample_pdf_url: preset.samplePdfUrl || null,
      identifier_keywords: Array.isArray(preset.identifierKeywords) ? preset.identifierKeywords : [],
      zones: Array.isArray(preset.zones) ? preset.zones : [],
      created_at: preset.createdAt,
      updated_at: preset.updatedAt || Date.now(),
    }));

    const { error } = await supabase.from('pdf_presets').upsert(rows);
    if (error) {
      console.error('Error al guardar lote de presets en Supabase:', error);
    }
  } catch (err) {
    console.error('Excepción al guardar lote de presets en Supabase:', err);
  }
}

export async function importPresetsFromJson(jsonString: string): Promise<{ success: boolean; count: number; error?: string; presets: Preset[] }> {
  try {
    const parsed = JSON.parse(jsonString);
    const rawList = Array.isArray(parsed) ? parsed : [parsed];

    // Validar estructura básica
    const validPresets: Preset[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object' && item.name && Array.isArray(item.zones)) {
        validPresets.push({
          id: item.id || `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: String(item.name),
          description: item.description ? String(item.description) : undefined,
          presetType: item.presetType || 'standard',
          targetTramiteType: item.targetTramiteType || 'todos',
          samplePdfUrl: item.samplePdfUrl || undefined,
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

    // Guardar todos los presets importados en Supabase para que estén disponibles para todos los usuarios
    await savePresetsBatchToSupabase(validPresets);

    // Obtener lista actualizada desde Supabase
    const freshPresets = await fetchPresetsFromSupabase();

    return { 
      success: true, 
      count: validPresets.length, 
      presets: freshPresets.length > 0 ? freshPresets : merged 
    };
  } catch (err: any) {
    return { success: false, count: 0, error: `Error al leer el archivo JSON: ${err.message || 'Formato no válido'}`, presets: getPresets() };
  }
}


