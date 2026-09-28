import React, { useRef, useState } from 'react';
import { Preset, PresetType } from '@/types/preset';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  Sparkles,
  HelpCircle,
  Filter,
  Layers,
  ExternalLink,
  ShieldCheck,
  PenTool
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
  const [filterType, setFilterType] = useState<'all' | PresetType>('standard');
  const [showHelpGuide, setShowHelpGuide] = useState(false);

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
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        showMessage('error', 'El archivo seleccionado está vacío.');
        return;
      }

      try {
        const result = await importPresetsFromJson(content);
        if (result.success) {
          if (onPresetsChange) {
            onPresetsChange(result.presets);
          }
          showMessage('success', `¡Éxito! Se importaron y guardaron ${result.count} plantilla(s) en Supabase para todo el equipo.`);
        } else {
          showMessage('error', result.error || 'Error al importar los presets.');
        }
      } catch (err: any) {
        showMessage('error', `Error al procesar la importación: ${err?.message || 'Error desconocido'}`);
      }
    };

    reader.onerror = () => {
      showMessage('error', 'No se pudo leer el archivo seleccionado.');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const clientDocCount = presets.filter((p) => p.presetType === 'client_document').length;
  const standardDocCount = presets.filter((p) => p.presetType !== 'client_document').length;

  const filteredPresets = presets.filter((p) => {
    if (filterType === 'client_document') return p.presetType === 'client_document';
    if (filterType === 'standard') return p.presetType !== 'client_document';
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#0d0e12] rounded-2xl shadow-sm border border-slate-200/80 dark:border-zinc-800 p-6 transition-colors space-y-6">
      {/* Notificación flotante */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm animate-fade-in ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Plantillas y Presets</h2>
            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="inline-flex items-center gap-1 text-xs text-[#c5a059] hover:underline font-medium cursor-pointer"
              title="Ver diferencias entre tipos de plantillas"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showHelpGuide ? 'Ocultar guía' : '¿Cuál es la diferencia?'}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administra formatos interactivos para firma de clientes y presets de edición directa en PDF
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
            className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-amber-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Preset</span>
          </button>
        </div>
      </div>

      {/* Tarjeta explicativa interactiva sobre los 2 tipos de documentos */}
      {showHelpGuide && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4.5 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in duration-200">
          {/* Tarjeta Doc. para Cliente */}
          <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm mb-1.5">
                <span className="p-1.5 bg-purple-200 dark:bg-purple-900/60 rounded-lg text-purple-700 dark:text-purple-300">
                  <UserCheck className="w-4 h-4" />
                </span>
                <span>📝 Doc. para Cliente (Firma Digital Remota)</span>
              </div>
              <p className="text-xs text-purple-800/90 dark:text-purple-300/90 leading-relaxed mb-2.5">
                Diseñado para <strong>contratos, cartas de autorización y solicitudes</strong> que el cliente debe completar o firmar digitalmente desde su teléfono o computadora.
              </p>
              <ul className="text-[11px] text-purple-700 dark:text-purple-300/80 space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400">✓</span>
                  <span>Genera un <strong>enlace web seguro</strong> por cliente (1-clic desde su expediente).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400">✓</span>
                  <span>Soporta <strong>firma táctil</strong>, selección con círculos y campos rellenables.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400">✓</span>
                  <span>El PDF final firmado se guarda automáticamente en los documentos del cliente.</span>
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-purple-200/60 dark:border-purple-900/40 text-[11px] font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1">
              <span>📍 Aparece en:</span>
              <span className="font-normal">Módulo de Clientes &rarr; Trámites del Cliente</span>
            </div>
          </div>

          {/* Tarjeta Edición Directa */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm mb-1.5">
                <span className="p-1.5 bg-amber-200 dark:bg-amber-900/60 rounded-lg text-amber-800 dark:text-amber-300">
                  <FileText className="w-4 h-4" />
                </span>
                <span>📄 Edición Directa (OCR & Reemplazo Interno)</span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed mb-2.5">
                Diseñado para que los <strong>asesores editen y sustituyan campos</strong> sobre PDFs existentes (constancias, recibos, etc.) directamente en la plataforma.
              </p>
              <ul className="text-[11px] text-amber-700 dark:text-amber-300/80 space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400">✓</span>
                  <span>Permite <strong>subir cualquier archivo PDF</strong> y aplicar la máscara de zonas.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400">✓</span>
                  <span>Extrae texto original con <strong>OCR</strong>, oculta el anterior y escribe texto nuevo.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400">✓</span>
                  <span>Genera y descarga el PDF modificado al instante para el asesor.</span>
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span>📍 Aparece en:</span>
              <span className="font-normal">PDF Studio &rarr; Pestaña "Procesar PDF"</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs de Filtro de Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'standard'
                ? 'bg-[#c5a059] text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 Edición Directa ({standardDocCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('client_document')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'client_document'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>📝 Docs. para Cliente ({clientDocCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({presets.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredPresets.length}</span> plantillas
        </div>
      </div>

      {filteredPresets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-[#0d0e12]/50">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {filterType === 'all' 
              ? 'No tienes presets guardados' 
              : filterType === 'client_document' 
                ? 'No hay plantillas de Documentos para Cliente registradas' 
                : 'No hay presets de Edición Directa registrados'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Crea un nuevo preset marcando las zonas de un PDF de muestra o importa un archivo JSON.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 text-xs text-white font-semibold bg-[#c5a059] hover:bg-[#b08d4b] px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Nuevo Preset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const isClientDoc = preset.presetType === 'client_document';
            return (
              <div
                key={preset.id}
                className={`rounded-2xl p-4 transition-all flex flex-col justify-between group border ${
                  isClientDoc
                    ? 'border-purple-200/90 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 dark:from-purple-950/20 dark:via-zinc-900/60 dark:to-purple-950/10 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md hover:shadow-purple-500/5'
                    : 'border-amber-200/70 dark:border-zinc-800 bg-gradient-to-b from-amber-50/30 via-white to-white dark:from-amber-950/15 dark:via-zinc-900/60 dark:to-zinc-900/40 hover:border-[#c5a059] dark:hover:border-[#c5a059] hover:shadow-md'
                }`}
              >
                <div>
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                          isClientDoc
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isClientDoc ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#c5a059] dark:group-hover:text-[#c5a059] transition-colors truncate">
                          {preset.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(preset.createdAt || Date.now()).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                      <button
                        onClick={(e) => handleExportSingle(e, preset)}
                        className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Exportar esta plantilla a JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditPreset(preset)}
                        className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Editar zonas del preset"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {preset.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  )}

                  {/* Etiquetas y Badges Claros */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {isClientDoc ? (
                      <span className="text-[11px] bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 px-2.5 py-1 rounded-lg font-bold border border-purple-200 dark:border-purple-800/80 flex items-center gap-1">
                        <PenTool className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>📝 Doc. Cliente (Firma Web)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-lg font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>📄 Edición Directa (OCR)</span>
                      </span>
                    )}

                    {isClientDoc && preset.targetTramiteType && (
                      <span className="text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-medium border border-slate-200 dark:border-zinc-700">
                        {preset.targetTramiteType === 'todos' && '🎯 Todos los Trámites'}
                        {preset.targetTramiteType === 'retiro_desempleo' && '🎯 Retiro Desempleo'}
                        {preset.targetTramiteType === 'mejoravit' && '🎯 Mejoravit'}
                        {preset.targetTramiteType === 'alta_medica_imss' && '🎯 Alta Médica IMSS'}
                      </span>
                    )}

                    <span className="text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg font-medium border border-slate-200 dark:border-zinc-700">
                      {preset.zones.length} {preset.zones.length === 1 ? 'Zona' : 'Zonas'}
                    </span>

                    {preset.identifierKeywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Subtítulo informativo por tipo */}
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                    {isClientDoc ? (
                      <span className="text-purple-600/90 dark:text-purple-400/90">
                        ⚡ Enlace de llenado accesible en expedientes
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        ⚡ Procesamiento interno para asesor
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectPreset(preset)}
                  className={`w-full mt-2 flex items-center justify-center gap-2 border font-semibold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs ${
                    isClientDoc
                      ? 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/40 dark:hover:bg-purple-600 dark:text-purple-300 dark:hover:text-white border-purple-200 dark:border-purple-800'
                      : 'bg-white hover:bg-[#c5a059] text-slate-700 hover:text-white dark:bg-zinc-900 dark:hover:bg-[#c5a059] dark:text-slate-200 dark:hover:text-white border-slate-200 dark:border-zinc-700 hover:border-[#c5a059]'
                  }`}
                >
                  <span>{isClientDoc ? 'Probar Plantilla de Cliente' : 'Usar en Procesador PDF'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
