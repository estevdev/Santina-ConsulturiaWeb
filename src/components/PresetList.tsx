import React, { useRef, useState } from 'react';
import { Preset } from '@/types/preset';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { exportPresetsToJson, importPresetsFromJson } from '@/utils/storage';

interface PresetListProps {
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
  onEditPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onCreateNew: () => void;
  onPresetsChange?: (newPresets: Preset[]) => void;
}

export default function PresetList({
  presets,
  onSelectPreset,
  onEditPreset,
  onDeletePreset,
  onCreateNew,
  onPresetsChange,
}: PresetListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showMessage = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleExportAll = () => {
    if (presets.length === 0) {
      showMessage('error', 'No hay presets para exportar.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    exportPresetsToJson(presets, `presets_backup_${today}.json`);
    showMessage('success', `Se han exportado ${presets.length} presets a formato JSON.`);
  };

  const handleExportSingle = (e: React.MouseEvent, preset: Preset) => {
    e.stopPropagation();
    const cleanName = preset.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    exportPresetsToJson([preset], `preset_${cleanName}.json`);
    showMessage('success', `Plantilla "${preset.name}" exportada correctamente.`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        showMessage('error', 'El archivo seleccionado está vacío.');
        return;
      }

      const result = importPresetsFromJson(content);
      if (result.success) {
        if (onPresetsChange) {
          onPresetsChange(result.presets);
        }
        showMessage('success', `¡Éxito! Se importaron/actualizaron ${result.count} plantillas.`);
      } else {
        showMessage('error', result.error || 'Error al importar los presets.');
      }
    };

    reader.onerror = () => {
      showMessage('error', 'No se pudo leer el archivo seleccionado.');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 transition-colors">
      {/* Notificación flotante */}
      {notification && (
        <div
          className={`mb-5 p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Input oculto para cargar archivos JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Encabezado con botones de acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Presets de Edición</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Plantillas con zonas, tipografía y formato predefinidos para modificar PDFs automáticamente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Importar JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
            title="Cargar presets desde un archivo .json"
          >
            <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Importar JSON</span>
          </button>

          {/* Botón Exportar Todos */}
          <button
            type="button"
            onClick={handleExportAll}
            disabled={presets.length === 0}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            title="Descargar todos los presets en un archivo .json"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Exportar Todos</span>
          </button>

          {/* Botón Crear Nuevo */}
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Preset</span>
          </button>
        </div>
      </div>

      {presets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">No tienes presets guardados</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Crea un preset marcando las zonas de un PDF de muestra o importa un archivo JSON con tus plantillas.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar archivo .json
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {preset.name}
                  </h3>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleExportSingle(e, preset)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      title="Exportar esta plantilla a JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditPreset(preset)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      title="Editar zonas del preset"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                      title="Eliminar preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {preset.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {preset.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="text-[11px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium border border-blue-200 dark:border-blue-900/60">
                    {preset.zones.length} {preset.zones.length === 1 ? 'Zona' : 'Zonas'}
                  </span>
                  {preset.identifierKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(preset)}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs text-slate-700 dark:text-slate-300 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Usar este Preset
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
