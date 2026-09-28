'use client';

import { useState, useEffect } from 'react';
import { FieldZone, Preset, ProcessedFieldValues, RichTextValue } from '@/types/preset';
import { applyEditsToPdf } from '@/utils/pdfModifier';
import { extractTextFromZone, extractTextFromAllZones } from '@/utils/ocrExtractor';
import { 
  createFormattedRichTextFromExtractedText, 
  extractLineFormatsFromRichTextValue 
} from '@/utils/richTextParser';
import { savePreset } from '@/utils/storage';
import CanvasPdfViewer from './CanvasPdfViewer';
import RichTextEditor from './RichTextEditor';
import { 
  Upload, 
  CheckCircle2, 
  Download, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  Edit2,
  Eye,
  EyeOff,
  ScanText,
  Sparkles,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface PdfProcessorProps {
  presets: Preset[];
  initialPreset?: Preset | null;
  onSavePreset?: (preset: Preset) => void;
  onBack: () => void;
}

export default function PdfProcessor({
  presets,
  initialPreset,
  onSavePreset,
  onBack,
}: PdfProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset?.id || 'custom');
  
  // Zonas activas
  const [activeZones, setActiveZones] = useState<FieldZone[]>(initialPreset ? [...initialPreset.zones] : []);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
  // Valores en tiempo real (ahora pueden ser RichTextValue)
  const [fieldValues, setFieldValues] = useState<ProcessedFieldValues>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  // Estados de procesamiento y visualización
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  // Estados de OCR y Modo de Edición
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [confirmedZones, setConfirmedZones] = useState<Record<string, boolean>>({});
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState(false);
  const [ocrLoadingZoneId, setOcrLoadingZoneId] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [presetSelectionModalOpen, setPresetSelectionModalOpen] = useState(false);

  const handleConfirmZoneReady = (zoneId: string, zoneName: string) => {
    setConfirmedZones((prev) => ({
      ...prev,
      [zoneId]: true,
    }));
    toast.success(`✓ "${zoneName}" verificado y listo`, {
      description: 'El texto ha sido guardado y está listo para la descarga del PDF final.',
      duration: 3000,
    });
  };

  useEffect(() => {
    if (initialPreset) {
      setSelectedPresetId(initialPreset.id);
      setActiveZones([...initialPreset.zones]);
      setIsDrawingMode(false);
    }
  }, [initialPreset]);

  const autoDetectPreset = (fileName: string): Preset | null => {
    const cleanName = fileName.toLowerCase();
    for (const preset of presets) {
      if (preset.identifierKeywords && preset.identifierKeywords.length > 0) {
        const matches = preset.identifierKeywords.some((kw) =>
          cleanName.includes(kw.toLowerCase())
        );
        if (matches) return preset;
      }
    }
    return null;
  };

  /**
   * Ejecuta la extracción de texto / OCR para una lista de zonas
   */
  const runOcrForZones = async (file: File, zonesToProcess: FieldZone[], forceOcr = false) => {
    if (!file || zonesToProcess.length === 0) return;

    try {
      setIsBatchOcrRunning(true);
      setOcrStatusMessage('Aplicando OCR y extrayendo texto de las zonas...');
      const buffer = await file.arrayBuffer();

      const extracted = await extractTextFromAllZones(
        buffer,
        zonesToProcess,
        forceOcr,
        (current, total, name) => {
          setOcrProgress({ current, total, name });
          setOcrStatusMessage(`Extrayendo (${current}/${total}): ${name}...`);
        }
      );

      setFieldValues((prev) => ({
        ...prev,
        ...extracted,
      }));

      setOcrStatusMessage('¡Texto extraído con éxito! Listo para editar errores.');
      setTimeout(() => {
        setOcrStatusMessage(null);
      }, 4500);
    } catch (err) {
      console.error('Error al extraer texto con OCR:', err);
      setOcrStatusMessage('No se pudo completar el OCR en algunas zonas.');
      setTimeout(() => setOcrStatusMessage(null), 4000);
    } finally {
      setIsBatchOcrRunning(false);
      setOcrProgress(null);
    }
  };

  /**
   * Ejecuta OCR para una única zona
   */
  const runOcrForSingleZone = async (zone: FieldZone, forceOcr = false) => {
    if (!selectedFile) return;

    try {
      setOcrLoadingZoneId(zone.id);
      const buffer = await selectedFile.arrayBuffer();
      const text = await extractTextFromZone(buffer, zone, forceOcr);

      const richVal = createFormattedRichTextFromExtractedText(
        text,
        zone
      );

      setFieldValues((prev) => ({
        ...prev,
        [zone.id]: richVal,
      }));
    } catch (err) {
      console.error(`Error extrayendo OCR para ${zone.name}:`, err);
    } finally {
      setOcrLoadingZoneId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDownloadUrl(null);
      setCurrentPage(1);

      let zonesToUse: FieldZone[] = [];

      if (!initialPreset) {
        const matched = autoDetectPreset(file.name);
        if (matched) {
          setSelectedPresetId(matched.id);
          zonesToUse = [...matched.zones];
          setActiveZones(zonesToUse);
          setIsDrawingMode(false);
        } else if (presets.length > 0) {
          setSelectedPresetId(presets[0].id);
          zonesToUse = [...presets[0].zones];
          setActiveZones(zonesToUse);
          setIsDrawingMode(false);
        } else {
          setSelectedPresetId('custom');
          zonesToUse = [];
          setActiveZones([]);
          setIsDrawingMode(true);
        }
      } else {
        zonesToUse = [...initialPreset.zones];
        setActiveZones(zonesToUse);
      }

      if (zonesToUse.length > 0) {
        runOcrForZones(file, zonesToUse);
      }
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    setDownloadUrl(null);
    if (presetId === 'custom') {
      setIsDrawingMode(true);
    } else {
      const found = presets.find((p) => p.id === presetId);
      if (found) {
        const newZones = [...found.zones];
        setActiveZones(newZones);
        setIsDrawingMode(false);
        if (selectedFile && newZones.length > 0) {
          runOcrForZones(selectedFile, newZones);
        }
      }
    }
  };

  const handleAddZone = (newZoneData: Partial<FieldZone>) => {
    const newZone: FieldZone = {
      id: `zone-${Date.now()}`,
      name: `Campo ${activeZones.length + 1}`,
      x: newZoneData.x || 10,
      y: newZoneData.y || 10,
      width: newZoneData.width || 30,
      height: newZoneData.height || 5,
      pageNumber: currentPage,
      fontSize: 12,
      lineHeight: 1.2,
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      bgColor: '#FFFFFF',
      color: '#000000',
      alignment: 'left',
    };
    setActiveZones((prev) => [...prev, newZone]);
    setSelectedZoneId(newZone.id);
    setDownloadUrl(null);

    if (selectedFile) {
      runOcrForSingleZone(newZone);
    }
  };

  const handleUpdateZone = (id: string, updatedFields: Partial<FieldZone>) => {
    setActiveZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updatedFields } : z))
    );
    setDownloadUrl(null);
  };

  const handleDuplicateZone = (zoneToDup: FieldZone) => {
    const duplicated: FieldZone = {
      ...JSON.parse(JSON.stringify(zoneToDup)),
      id: `zone-${Date.now()}`,
      name: `${zoneToDup.name} (Copia)`,
      x: Math.min(95, Math.round((zoneToDup.x + 2) * 100) / 100),
      y: Math.min(95, Math.round((zoneToDup.y + 2) * 100) / 100),
    };
    if (duplicated.circleOptions) {
      duplicated.circleOptions = duplicated.circleOptions.map((opt, i) => ({
        ...opt,
        id: `opt-${Date.now()}-${i}`,
        x: Math.min(95, Math.round((opt.x + 2) * 100) / 100),
        y: Math.min(95, Math.round((opt.y + 2) * 100) / 100),
      }));
    }
    setActiveZones((prev) => [...prev, duplicated]);
    setSelectedZoneId(duplicated.id);
    setDownloadUrl(null);

    // Copiar también el valor si ya existe
    if (fieldValues[zoneToDup.id]) {
      setFieldValues((prev) => ({
        ...prev,
        [duplicated.id]: fieldValues[zoneToDup.id],
      }));
    }
  };

  const handleDeleteZone = (id: string) => {
    setActiveZones((prev) => prev.filter((z) => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
    setDownloadUrl(null);
  };

  const handleFieldChange = (zoneId: string, val: RichTextValue) => {
    setFieldValues((prev) => ({
      ...prev,
      [zoneId]: val,
    }));
    setDownloadUrl(null);
  };

  const handleExportPdf = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      const originalPdfBytes = await selectedFile.arrayBuffer();

      const updatedPdfBytes = await applyEditsToPdf(
        originalPdfBytes,
        activeZones,
        fieldValues
      );

      const blob = new Blob([updatedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `modificado_${selectedFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrió un error al generar el PDF modificado');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePresetChanges = () => {
    if (activeZones.length === 0) {
      alert('No hay zonas para guardar.');
      return;
    }

    // Guardar la estructura limpia de las zonas (coordenadas X, Y, W, H, tipografía, etc.) sin almacenar datos de relleno temporales
    const cleanZones: FieldZone[] = activeZones.map((z) => {
      const { defaultRichValue, lineFormats, ...cleanZone } = z as any;
      return cleanZone as FieldZone;
    });

    if (selectedPresetId && selectedPresetId !== 'custom') {
      const existingPreset = presets.find((p) => p.id === selectedPresetId);
      if (existingPreset) {
        const updatedPreset: Preset = {
          ...existingPreset,
          zones: cleanZones,
          updatedAt: Date.now(),
        };
        savePreset(updatedPreset);
        if (onSavePreset) onSavePreset(updatedPreset);
        setSaveSuccessMessage(`Plantilla "${existingPreset.name}" actualizada con éxito (zonas y coordenadas guardadas).`);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        return;
      }
    }

    const newPresetName = prompt('Ingresa un nombre para guardar esta plantilla de zonas:', selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'Nueva Plantilla');
    if (newPresetName && newPresetName.trim()) {
      const newPreset: Preset = {
        id: `preset-${Date.now()}`,
        name: newPresetName.trim(),
        description: `Creado desde procesador el ${new Date().toLocaleDateString()}`,
        identifierKeywords: [],
        zones: cleanZones,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      savePreset(newPreset);
      if (onSavePreset) onSavePreset(newPreset);
      setSelectedPresetId(newPreset.id);
      setSaveSuccessMessage(`Plantilla "${newPreset.name}" creada y guardada.`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }
  };

  const selectedPresetObj = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d0e12] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">📄 Edición Directa (OCR)</h1>
              {!isAdvancedMode ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Modo Simple
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  ⚙️ Edición Avanzada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modifica textos del documento, pon negritas si lo requieres y genera el PDF resultante
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón para alternar Modo Avanzado */}
          <button
            type="button"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isAdvancedMode
                ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 border-amber-400 shadow-sm'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
            title="Activar o desactivar opciones avanzadas (tipografía, coordenadas, dibujo de zonas, guardado de plantilla)"
          >
            <span>{isAdvancedMode ? '⚙️ Modo Avanzado' : '🛠️ Edición Avanzada'}</span>
          </button>

          {/* Botón de Extraer todo con OCR (siempre visible cuando hay archivo y zonas) */}
          {selectedFile && activeZones.length > 0 && (
            <button
              type="button"
              onClick={() => runOcrForZones(selectedFile, activeZones, true)}
              disabled={isBatchOcrRunning}
              className="flex items-center gap-1.5 bg-[#c5a059] hover:bg-[#b08d4b] text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Re-extraer texto de todas las zonas usando OCR"
            >
              {isBatchOcrRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <ScanText className="w-4 h-4 text-zinc-950" />
              )}
              <span>Extraer todo con OCR</span>
            </button>
          )}

          {/* Botón Exportar y Descargar PDF */}
          {selectedFile && activeZones.length > 0 && (
            <button
              onClick={handleExportPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar y Descargar PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Configuración de campos y editor WYSIWYG */}
        <div className="lg:col-span-5 space-y-5">
          {/* Carga de Archivo */}
          <div className="bg-white dark:bg-[#0d0e12] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3 transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-zinc-800 pb-2">
              1. Documento PDF
            </h3>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                id="processor-pdf-upload"
                className="hidden"
              />
              <label
                htmlFor="processor-pdf-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-7 h-7 text-[#c5a059] dark:text-[#c5a059]" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : 'Subir archivo PDF'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">PDF con texto o escaneado (auto-OCR al cargar)</span>
              </label>
            </div>

            {/* BOTÓN 1-CLIC DE PRUEBA: Solo en Modo Avanzado */}
            {isAdvancedMode && (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPresetSelectionModalOpen(true)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Selecciona qué plantilla de contrato deseas cargar y autollenar para pruebas"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>⚡ Cargar PDF de Prueba + Auto-rellenar Todo (1-Clic)</span>
                </button>
              </div>
            )}
          </div>

          {/* Selector de Preset y Modo de dibujo */}
          {selectedFile && (
            <div className="bg-white dark:bg-[#0d0e12] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3 transition-colors">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  2. Configuración de Plantilla
                </h3>
                {selectedPresetObj && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3" /> {selectedPresetObj.name}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preset de Zonas
                  </label>
                  {selectedPresetId !== 'custom' && (
                    (() => {
                      const cur = presets.find((p) => p.id === selectedPresetId);
                      if (!cur) return null;
                      return cur.presetType === 'client_document' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          📝 Doc. Cliente (Firma Web)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          📄 Edición Directa (OCR)
                        </span>
                      );
                    })()
                  )}
                </div>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="custom">✏️ Personalizado (Definir o agregar zonas)</option>
                  {presets.filter(p => p.presetType === 'client_document').length > 0 && (
                    <optgroup label="📝 DOCUMENTOS PARA CLIENTE (Firma Digital Web)">
                      {presets.filter(p => p.presetType === 'client_document').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          📝 {preset.name} ({preset.zones.length} zonas)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {presets.filter(p => p.presetType !== 'client_document').length > 0 && (
                    <optgroup label="📄 EDICIÓN DIRECTA (OCR & Reemplazo Interno)">
                      {presets.filter(p => p.presetType !== 'client_document').map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          📄 {preset.name} ({preset.zones.length} zonas)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Herramientas de Dibujo y Guardado: Exclusivas de Modo Avanzado */}
              {isAdvancedMode && (
                <>
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isDrawingMode
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {isDrawingMode ? 'Dibujando Zonas (Arrastra en visor)' : '+ Dibujar nueva zona'}
                      </button>
                    </div>

                    {activeZones.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('¿Deseas limpiar todas las zonas?')) {
                            setActiveZones([]);
                            setSelectedZoneId(null);
                          }
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer ml-auto"
                      >
                        Borrar todas
                      </button>
                    )}
                  </div>

                  {/* Botón para guardar posiciones y cambios en la plantilla */}
                  {activeZones.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSavePresetChanges}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#c5a059] text-white shadow-xs transition-all cursor-pointer"
                        title="Guardar las nuevas posiciones y dimensiones de las zonas en la plantilla para futuras cargas"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {selectedPresetObj
                          ? `Guardar cambios en "${selectedPresetObj.name}"`
                          : 'Guardar como nueva plantilla'}
                      </button>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Guarda la posición ajustada
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Banner de confirmación de guardado de plantilla */}
          {saveSuccessMessage && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{saveSuccessMessage}</span>
            </div>
          )}

          {/* Banner de estado de OCR / Extracción */}
          {ocrStatusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all animate-fade-in ${
              isBatchOcrRunning 
                ? 'bg-[#c5a059] dark:bg-[#c5a059]/60 border-[#c5a059] dark:border-[#c5a059]/60 text-[#c5a059] dark:text-[#c5a059]' 
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              {isBatchOcrRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#c5a059] dark:text-[#c5a059] shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{ocrStatusMessage}</span>
                {ocrProgress && (
                  <div className="w-full bg-[#c5a059] dark:bg-[#c5a059]/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-[#c5a059] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(ocrProgress.current / ocrProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campos de Edición con Editor WYSIWYG individual */}
          {selectedFile && (
            <div className="bg-white dark:bg-[#0d0e12] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center justify-between gap-2 flex-wrap">
                <span>3. Contenido y Formato de Zonas ({activeZones.length})</span>
                
                {isAdvancedMode && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newZone: FieldZone = {
                          id: `zone-${Date.now()}`,
                          name: `Círculos Respuesta ${activeZones.length + 1}`,
                          x: 40,
                          y: 40,
                          width: 15,
                          height: 3,
                          pageNumber: currentPage,
                          fieldType: 'circle_select',
                          circleRadius: 6,
                          circleOptions: [
                            { id: `opt-${Date.now()}-1`, label: 'M', x: 42, y: 41.5 },
                            { id: `opt-${Date.now()}-2`, label: 'F', x: 46, y: 41.5 },
                          ],
                          filledBy: 'cliente',
                        };
                        setActiveZones((prev) => [...prev, newZone]);
                        setSelectedZoneId(newZone.id);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Agregar campo de Círculos de Respuesta directo"
                    >
                      <span>⭕ + Círculos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const mockSignatureDataUrl =
                          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABgCAYAAADRF78XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADbSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAzGvAAFIQyS8AAAAAElFTkSuQmCC';

                        const newValues: ProcessedFieldValues = { ...fieldValues };

                        activeZones.forEach((zone) => {
                          const isSig =
                            zone.isSignature ||
                            zone.name.toLowerCase().includes('rubrica') ||
                            zone.name.toLowerCase().includes('firma');

                          if (zone.fieldType === 'circle_select') {
                            if (zone.circleOptions && zone.circleOptions.length > 0) {
                              newValues[zone.id] = `CIRCLE_${zone.circleOptions[0].id}`;
                            } else {
                              newValues[zone.id] = 'SELECTED';
                            }
                          } else if (isSig) {
                            newValues[zone.id] = mockSignatureDataUrl;
                          } else {
                            const nameLower = zone.name.toLowerCase();
                            let valStr = '';

                            if (nameLower.includes('dia')) valStr = '26';
                            else if (nameLower.includes('mes')) valStr = '09';
                            else if (nameLower.includes('año') || nameLower.includes('anio')) valStr = '2026';
                            else if (nameLower.includes('curp')) valStr = 'HERJ950815HDFRR09';
                            else if (nameLower.includes('nss')) valStr = '12948573610';
                            else if (nameLower.includes('rfc')) valStr = 'HERJ950815AB1';
                            else if (nameLower.includes('tel')) valStr = '3312345678';
                            else if (nameLower.includes('monto') || nameLower.includes('salario') || nameLower.includes('honorarios')) valStr = '15,000.00';
                            else if (nameLower.includes('porcentaje')) valStr = '15%';
                            else if (nameLower.includes('letra')) valStr = 'QUINCE MIL PESOS 00/100 M.N.';
                            else if (nameLower.includes('banco')) valStr = 'BBVA Bancomer';
                            else if (nameLower.includes('clabe')) valStr = '012320012345678901';
                            else if (nameLower.includes('direccion') || nameLower.includes('domicilio')) valStr = 'Av. Vallarta #1234, Col. Americana';
                            else if (nameLower.includes('empresa') || nameLower.includes('patron')) valStr = 'Consultores S.A. de C.V.';
                            else if (nameLower.includes('cliente') || nameLower.includes('nombre')) valStr = 'JUAN CARLOS HERNÁNDEZ LÓPEZ';
                            else if (nameLower.includes('remodelacion') || nameLower.includes('mejora') || nameLower.includes('descripcion')) {
                              valStr = 'SE REALIZARÁ CAMBIO DE PISO Y PINTURA INTEGRAL EN ÁREAS PRINCIPALES, REPARACIÓN DE APLANADOS EN MUROS Y SUSTITUCIÓN DE CABLEADO ELÉCTRICO Y FONTANERÍA COMPLETA DE BAÑOS Y COCINA CON MATERIALES DE PRIMERA CALIDAD.';
                            } else if (nameLower.includes('direccion') || nameLower.includes('domicilio')) {
                              valStr = 'AVENIDA VALLARTA NÚMERO 1234 INTERIOR 5A, COLONIA AMERICANA, GUADALAJARA, JALISCO, CÓDIGO POSTAL 44160';
                            } else valStr = `DATO ${zone.name}`;

                            const richVal = createFormattedRichTextFromExtractedText(valStr, zone);
                            newValues[zone.id] = richVal;
                          }
                        });

                        setFieldValues(newValues);
                        setDownloadUrl(null);
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Botón temporal de prueba para auto-rellenar todas las zonas del preset con datos sintéticos"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Rellenar Automático (Prueba)</span>
                    </button>
                  </div>
                )}
              </h3>

              {/* Botones de acción directa debajo de 3. Contenido y Formato de Zonas */}
              {activeZones.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-xs">
                  {/* Botón Extraer todo con OCR */}
                  <button
                    type="button"
                    onClick={() => runOcrForZones(selectedFile, activeZones, true)}
                    disabled={isBatchOcrRunning}
                    className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#9a7b38] hover:brightness-110 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#c5a059]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    title="Re-extraer texto de todas las zonas usando OCR"
                  >
                    {isBatchOcrRunning ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    ) : (
                      <ScanText className="w-4 h-4 text-zinc-950" />
                    )}
                    <span>Extraer todo con OCR</span>
                  </button>

                  {/* Botón Exportar y Descargar PDF */}
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    title="Generar y descargar el archivo PDF con las ediciones aplicadas"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Generando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        <span>Exportar y Descargar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeZones.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs text-center space-y-1">
                  <p className="font-medium">No hay zonas para editar.</p>
                  <p>Activa <b>🛠️ Edición Avanzada</b> para dibujar o configurar zonas.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {activeZones.map((zone, idx) => {
                    const isSelected = selectedZoneId === zone.id;

                    return (
                      <div
                        key={zone.id}
                        draggable={isAdvancedMode}
                        onDragStart={(e) => {
                          if (!isAdvancedMode) return;
                          e.dataTransfer.setData('text/plain', idx.toString());
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          if (!isAdvancedMode) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          if (!isAdvancedMode) return;
                          e.preventDefault();
                          const fromIndexStr = e.dataTransfer.getData('text/plain');
                          if (!fromIndexStr) return;
                          const fromIndex = parseInt(fromIndexStr, 10);
                          if (isNaN(fromIndex) || fromIndex === idx) return;

                          setActiveZones((prev) => {
                            const updated = [...prev];
                            const [movedItem] = updated.splice(fromIndex, 1);
                            updated.splice(idx, 0, movedItem);
                            return updated;
                          });
                        }}
                        onClick={() => setSelectedZoneId(zone.id)}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isAdvancedMode ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${
                          isSelected
                            ? 'border-[#c5a059] bg-[#c5a059]/15 dark:bg-[#c5a059]/20 ring-1 ring-amber-400'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Título de la zona */}
                        {isAdvancedMode ? (
                          /* Modo Avanzado: Con selector de orden y cambio de nombre */
                          <>
                            <div className="flex justify-between items-center mb-2 gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-grab" title="Arrastra para cambiar el orden de este campo">
                                  ☰
                                </span>
                                <span className="w-5 h-5 rounded-full bg-[#c5a059] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={zone.name}
                                  onChange={(e) =>
                                    handleUpdateZone(zone.id, { name: e.target.value })
                                  }
                                  placeholder="Nombre del campo..."
                                  className="font-semibold text-xs text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#c5a059] focus:outline-none flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">
                                  Pág. {zone.pageNumber || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmZoneReady(zone.id, zone.name);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                                    confirmedZones[zone.id]
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-300 shadow-emerald-600/30'
                                      : 'bg-emerald-600/90 hover:bg-emerald-600 text-white hover:brightness-110'
                                  }`}
                                  title="Verificar y confirmar que este campo está listo para exportar en el PDF"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  <span>{confirmedZones[zone.id] ? '✓ Listo' : 'Confirmar'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Título de Sección y Subtítulo opcionales */}
                            <div className="mb-2 space-y-1 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/80 dark:border-amber-800/60">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">📌 Título Sección:</span>
                                <input
                                  type="text"
                                  value={zone.sectionHeader || ''}
                                  onChange={(e) => handleUpdateZone(zone.id, { sectionHeader: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="ej. DATOS GENERALES, REFERENCIAS..."
                                  className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none uppercase"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 pt-1 border-t border-amber-200/50 dark:border-amber-800/40">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">🏷️ Subtítulo:</span>
                                <input
                                  type="text"
                                  value={zone.sectionSubheader || ''}
                                  onChange={(e) => handleUpdateZone(zone.id, { sectionSubheader: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="ej. Referencia 1, Datos del Cónyuge..."
                                  className="w-full bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Asignación de quien debe rellenar el campo: CLIENTE o ASESOR y Tipo Firma */}
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400">Rellena:</span>
                                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateZone(zone.id, { filledBy: 'cliente' });
                                    }}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                      (zone.filledBy || 'cliente') === 'cliente'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <span>👤 Cliente</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateZone(zone.id, { filledBy: 'asesor' });
                                    }}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                      zone.filledBy === 'asesor'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <span>👔 Asesor</span>
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isSig = !(zone.fieldType === 'signature' || zone.isSignature);
                                    handleUpdateZone(zone.id, {
                                      isSignature: isSig,
                                      fieldType: isSig ? 'signature' : 'text',
                                    });
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    zone.fieldType === 'signature' || zone.isSignature || zone.name.toLowerCase().includes('rubrica') || zone.name.toLowerCase().includes('firma')
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Marcar este campo como Firma / Rúbrica en trazo"
                                >
                                  <span>✍️ Es Firma</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isCircle = zone.fieldType !== 'circle_select';
                                    handleUpdateZone(zone.id, {
                                      fieldType: isCircle ? 'circle_select' : 'text',
                                      circleRadius: isCircle ? (zone.circleRadius || 6) : undefined,
                                      circleOptions: isCircle ? (zone.circleOptions || [{ id: 'opt-1', label: 'Opción 1', x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 }]) : undefined,
                                    });
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    zone.fieldType === 'circle_select'
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Marcar este campo como Círculo de Marcado / Opción Múltiple"
                                >
                                  <span>⭕ Círculo</span>
                                </button>
                              </div>
                            </div>

                            {/* Configuración específica para Círculo de Marcado */}
                            {zone.fieldType === 'circle_select' && (
                              <div className="mt-2 mb-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1">
                                    ⭕ Ajustes de Círculos de Marcado
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Radio:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={zone.circleRadius || 6}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateZone(zone.id, { circleRadius: isNaN(val) ? 6 : val });
                                      }}
                                      className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-center text-xs font-bold text-indigo-900 dark:text-indigo-100"
                                    />
                                    <span className="text-[10px] text-slate-500">pt</span>
                                  </div>
                                </div>

                                {/* Lista de Opciones de Círculos */}
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    <span>Opciones ({zone.circleOptions?.length || 0})</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const opts = zone.circleOptions || [];
                                        const newOpt = {
                                          id: `opt-${Date.now()}`,
                                          label: `Opción ${opts.length + 1}`,
                                          x: zone.x + zone.width / 2,
                                          y: zone.y + zone.height / 2,
                                        };
                                        handleUpdateZone(zone.id, { circleOptions: [...opts, newOpt] });
                                      }}
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                    >
                                      + Agregar Opción
                                    </button>
                                  </div>

                                  {(zone.circleOptions || []).map((opt, oIdx) => (
                                    <div key={opt.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                      <span className="text-[10px] font-bold text-indigo-500">#{oIdx + 1}</span>
                                      <input
                                        type="text"
                                        value={opt.label}
                                        placeholder="Etiqueta"
                                        onChange={(e) => {
                                          const opts = (zone.circleOptions || []).map((o) =>
                                            o.id === opt.id ? { ...o, label: e.target.value } : o
                                          );
                                          handleUpdateZone(zone.id, { circleOptions: opts });
                                        }}
                                        className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                                      />
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <span className="text-slate-400">X:</span>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={opt.x}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            const opts = (zone.circleOptions || []).map((o) =>
                                              o.id === opt.id ? { ...o, x: isNaN(val) ? 0 : val } : o
                                            );
                                            handleUpdateZone(zone.id, { circleOptions: opts });
                                          }}
                                          className="w-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-center font-mono text-[10px]"
                                        />
                                        <span className="text-slate-400">Y:</span>
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={opt.y}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            const opts = (zone.circleOptions || []).map((o) =>
                                              o.id === opt.id ? { ...o, y: isNaN(val) ? 0 : val } : o
                                            );
                                            handleUpdateZone(zone.id, { circleOptions: opts });
                                          }}
                                          className="w-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-center font-mono text-[10px]"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const opts = (zone.circleOptions || []).filter((o) => o.id !== opt.id);
                                          handleUpdateZone(zone.id, { circleOptions: opts });
                                        }}
                                        className="text-rose-500 hover:text-rose-700 px-1 text-xs font-bold"
                                        title="Eliminar opción"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Coordenadas editables manualmente (X, Y, W, H) */}
                            <div className="mt-2 mb-2 space-y-1 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                <span>Página {zone.pageNumber || 1}</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">Posición y Tamaño (%)</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Coordenada X (%)">
                                  <span className="font-bold text-slate-400 text-[10px]">X:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={zone.x}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleUpdateZone(zone.id, { x: isNaN(val) ? 0 : val });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400">%</span>
                                </div>

                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Coordenada Y (%)">
                                  <span className="font-bold text-slate-400 text-[10px]">Y:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={zone.y}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleUpdateZone(zone.id, { y: isNaN(val) ? 0 : val });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400">%</span>
                                </div>

                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Ancho W (%)">
                                  <span className="font-bold text-slate-400 text-[10px]">W:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    value={zone.width}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleUpdateZone(zone.id, { width: isNaN(val) ? 1 : val });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400">%</span>
                                </div>

                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Alto H (%)">
                                  <span className="font-bold text-slate-400 text-[10px]">H:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    value={zone.height}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleUpdateZone(zone.id, { height: isNaN(val) ? 1 : val });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400">%</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Modo Simple (por defecto): Título limpio sin campos de configuración */
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[#c5a059] text-zinc-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                {zone.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded font-medium">
                                Pág. {zone.pageNumber || 1}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmZoneReady(zone.id, zone.name);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                  confirmedZones[zone.id]
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/80 shadow-emerald-600/30'
                                    : 'bg-emerald-600/90 hover:bg-emerald-600 text-white hover:brightness-110 shadow-emerald-600/20'
                                }`}
                                title="Verificar y confirmar que las ediciones de este campo están guardadas y listas para la descarga del PDF"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                <span>{confirmedZones[zone.id] ? '✓ Cambios Listos' : 'Confirmar Listo'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Editor de Texto: En modo simple solo permite cambiar texto y poner negrita */}
                        <RichTextEditor
                          zone={zone}
                          value={fieldValues[zone.id]}
                          onChange={(val) => handleFieldChange(zone.id, val)}
                          onUpdateZone={handleUpdateZone}
                          onDeleteZone={handleDeleteZone}
                          onDuplicateZone={handleDuplicateZone}
                          onExtractOcr={(z) => runOcrForSingleZone(z, true)}
                          isOcrLoading={ocrLoadingZoneId === zone.id}
                          isAdvancedMode={isAdvancedMode}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Derecho: Visor de PDF con Vista Previa en Tiempo Real */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white dark:bg-[#0d0e12] p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm min-h-[650px] transition-colors">
          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 my-auto">
              <AlertCircle className="w-12 h-12 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Ningún documento seleccionado</p>
              <p className="text-xs">Sube un archivo PDF para ver la previsualización en vivo.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Controles de página y botón de alternar Ver Original / Ver Editado */}
              <div className="flex flex-wrap justify-between items-center w-full mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800 text-sm gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOriginal((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      showOriginal
                        ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                    }`}
                    title="Haz clic para alternar entre ver el documento editado o el original"
                  >
                    {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showOriginal ? 'Viendo Fondo Original (Clic para volver)' : 'Ver Fondo Original'}
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {showOriginal ? '(Ediciones ocultas)' : '(Ediciones visibles)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span>
                    Pág. {currentPage} de {numPages}
                  </span>
                  <button
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              {/* Visor Interactivo en Vivo */}
              <div className="w-full flex justify-center bg-slate-100/70 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 overflow-auto">
                <CanvasPdfViewer
                  pdfFile={selectedFile}
                  currentPage={currentPage}
                  onNumPagesChange={setNumPages}
                  zones={activeZones}
                  activeZoneId={selectedZoneId}
                  onSelectZone={(id) => setSelectedZoneId(id)}
                  onAddZone={handleAddZone}
                  onUpdateZone={(zone) => handleUpdateZone(zone.id, zone)}
                  isEditorMode={isAdvancedMode && isDrawingMode}
                  livePreviewValues={fieldValues}
                  showOverlays={!showOriginal}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Selección de Plantilla de Contrato para Prueba */}
      {presetSelectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Selecciona la Plantilla de Contrato a Probar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPresetSelectionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Elige cuál de las plantillas deseas cargar con su PDF base y autollenar con datos de prueba:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {presets.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No hay plantillas registradas.</p>
              ) : (
                presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={async () => {
                      setPresetSelectionModalOpen(false);
                      try {
                        setOcrStatusMessage(`Cargando PDF de prueba para "${p.name}"...`);
                        let pdfBuf: ArrayBuffer | null = null;

                        if (p.samplePdfUrl) {
                          const res = await fetch(p.samplePdfUrl);
                          if (res.ok) pdfBuf = await res.arrayBuffer();
                        }

                        if (!pdfBuf) {
                          alert(`La plantilla "${p.name}" no tiene un PDF base de muestra subido en Supabase.`);
                          setOcrStatusMessage(null);
                          return;
                        }

                        const dummyFile = new File([pdfBuf], `${p.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Prueba.pdf`, { type: 'application/pdf' });
                        setSelectedFile(dummyFile);
                        setSelectedPresetId(p.id);
                        setActiveZones([...p.zones]);
                        setIsDrawingMode(false);

                        // Generar autollenado de prueba
                        const mockSignatureDataUrl =
                          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABgCAYAAADRF78XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADbSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAzGvAAFIQyS8AAAAAElFTkSuQmCC';

                        const newValues: ProcessedFieldValues = {};
                        p.zones.forEach((zone) => {
                          const isSig =
                            zone.isSignature ||
                            zone.name.toLowerCase().includes('rubrica') ||
                            zone.name.toLowerCase().includes('firma');

                          if (zone.fieldType === 'circle_select') {
                            if (zone.circleOptions && zone.circleOptions.length > 0) {
                              newValues[zone.id] = `CIRCLE_${zone.circleOptions[0].id}`;
                            } else {
                              newValues[zone.id] = 'SELECTED';
                            }
                          } else if (isSig) {
                            newValues[zone.id] = mockSignatureDataUrl;
                          } else {
                            const nameLower = zone.name.toLowerCase();
                            let valStr = '';

                            if (nameLower.includes('dia')) valStr = '26';
                            else if (nameLower.includes('mes')) valStr = '09';
                            else if (nameLower.includes('año') || nameLower.includes('anio')) valStr = '2026';
                            else if (nameLower.includes('curp')) valStr = 'HERJ950815HDFRR09';
                            else if (nameLower.includes('nss')) valStr = '12948573610';
                            else if (nameLower.includes('rfc')) valStr = 'HERJ950815AB1';
                            else if (nameLower.includes('tel')) valStr = '3312345678';
                            else if (nameLower.includes('monto') || nameLower.includes('salario') || nameLower.includes('honorarios')) valStr = '15,000.00';
                            else if (nameLower.includes('porcentaje')) valStr = '15%';
                            else if (nameLower.includes('letra')) valStr = 'QUINCE MIL PESOS 00/100 M.N.';
                            else if (nameLower.includes('banco')) valStr = 'BBVA Bancomer';
                            else if (nameLower.includes('clabe')) valStr = '012320012345678901';
                            else if (nameLower.includes('direccion') || nameLower.includes('domicilio')) valStr = 'Av. Vallarta #1234, Col. Americana';
                            else if (nameLower.includes('empresa') || nameLower.includes('patron')) valStr = 'Consultores S.A. de C.V.';
                            else if (nameLower.includes('cliente') || nameLower.includes('nombre')) valStr = 'JUAN CARLOS HERNÁNDEZ LÓPEZ';
                            else valStr = `DATO ${zone.name}`;

                            newValues[zone.id] = createFormattedRichTextFromExtractedText(valStr, zone);
                          }
                        });

                        setFieldValues(newValues);
                        setOcrStatusMessage(`¡PDF de prueba (${p.name}) cargado y autollenado con éxito!`);
                        setTimeout(() => setOcrStatusMessage(null), 3500);
                      } catch (err: any) {
                        console.error('Error cargando PDF de prueba:', err);
                        alert('Error al cargar PDF de prueba.');
                        setOcrStatusMessage(null);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                      p.presetType === 'client_document'
                        ? 'border-purple-200 dark:border-purple-900/60 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#c5a059] bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#c5a059] dark:group-hover:text-[#c5a059]">
                          {p.presetType === 'client_document' ? '📝' : '📄'} {p.name}
                        </span>
                        {p.presetType === 'client_document' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Doc. Cliente
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Edición Directa
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {p.zones.length} zonas {p.targetTramiteType ? `• (${p.targetTramiteType})` : ''}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-colors ${
                      p.presetType === 'client_document'
                        ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 group-hover:bg-purple-600 group-hover:text-white'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 group-hover:bg-[#c5a059] group-hover:text-white'
                    }`}>
                      ⚡ Probar
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPresetSelectionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
