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

  // Estados de OCR
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState(false);
  const [ocrLoadingZoneId, setOcrLoadingZoneId] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

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

    const zonesWithDefaults: FieldZone[] = activeZones.map((z) => {
      const richVal = fieldValues[z.id];
      if (richVal && typeof richVal === 'object') {
        const lineFormats = extractLineFormatsFromRichTextValue(richVal, z);
        return {
          ...z,
          defaultRichValue: richVal,
          lineFormats: lineFormats.length > 0 ? lineFormats : z.lineFormats,
        };
      }
      return z;
    });

    if (selectedPresetId && selectedPresetId !== 'custom') {
      const existingPreset = presets.find((p) => p.id === selectedPresetId);
      if (existingPreset) {
        const updatedPreset: Preset = {
          ...existingPreset,
          zones: zonesWithDefaults,
          updatedAt: Date.now(),
        };
        savePreset(updatedPreset);
        if (onSavePreset) onSavePreset(updatedPreset);
        setSaveSuccessMessage(`Plantilla "${existingPreset.name}" actualizada con éxito.`);
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
        zones: zonesWithDefaults,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Editor Enriquecido de PDF</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edita textos con formato de Word, previsualiza y compara con el PDF original
            </p>
          </div>
        </div>

        {selectedFile && activeZones.length > 0 && (
          <button
            onClick={handleExportPdf}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Configuración de campos y editor WYSIWYG */}
        <div className="lg:col-span-5 space-y-5">
          {/* Carga de Archivo */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
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
                <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : 'Subir archivo PDF'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">PDF con texto o escaneado (auto-OCR al cargar)</span>
              </label>
            </div>
          </div>

          {/* Selector de Preset y Modo de dibujo */}
          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preset de Zonas
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="custom">✏️ Personalizado (Definir o agregar zonas)</option>
                  <optgroup label="Presets Guardados">
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        📄 {preset.name} ({preset.zones.length} zonas)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

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

                  {activeZones.length > 0 && (
                    <button
                      onClick={() => runOcrForZones(selectedFile, activeZones, true)}
                      disabled={isBatchOcrRunning}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Re-extraer texto de todas las zonas usando OCR"
                    >
                      {isBatchOcrRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ScanText className="w-3.5 h-3.5" />
                      )}
                      <span>Extraer todo con OCR</span>
                    </button>
                  )}
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
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSavePresetChanges}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
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
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300' 
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              {isBatchOcrRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{ocrStatusMessage}</span>
                {ocrProgress && (
                  <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(ocrProgress.current / ocrProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campos de Edición con Editor WYSIWYG individual */}
          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>3. Contenido y Formato de Zonas ({activeZones.length})</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Modifica los textos detectados
                </span>
              </h3>

              {activeZones.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs text-center space-y-1">
                  <p className="font-medium">No hay zonas para editar.</p>
                  <p>Presiona <b>+ Dibujar nueva zona</b> y selecciona la parte del PDF que deseas modificar.</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
                  {activeZones.map((zone) => {
                    const isSelected = selectedZoneId === zone.id;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZoneId(zone.id)}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 ring-1 ring-blue-400'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Título de la zona */}
                        <div className="flex justify-between items-center mb-2">
                          <input
                            type="text"
                            value={zone.name}
                            onChange={(e) =>
                              handleUpdateZone(zone.id, { name: e.target.value })
                            }
                            className="font-semibold text-xs text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none"
                          />
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">
                            Pág. {zone.pageNumber || 1}
                          </span>
                        </div>

                        {/* Editor de Texto con selección parcial y toolbar */}
                        <RichTextEditor
                          zone={zone}
                          value={fieldValues[zone.id]}
                          onChange={(val) => handleFieldChange(zone.id, val)}
                          onUpdateZone={handleUpdateZone}
                          onDeleteZone={handleDeleteZone}
                          onExtractOcr={(z) => runOcrForSingleZone(z, true)}
                          isOcrLoading={ocrLoadingZoneId === zone.id}
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
        <div className="lg:col-span-7 flex flex-col items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-h-[650px] transition-colors">
          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 my-auto">
              <AlertCircle className="w-12 h-12 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Ningún documento seleccionado</p>
              <p className="text-xs">Sube un archivo PDF para ver la previsualización en vivo.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Controles de página y botón de alternar Ver Original / Ver Editado */}
              <div className="flex flex-wrap justify-between items-center w-full mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-sm gap-2">
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
              <div className="w-full flex justify-center bg-slate-100/70 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 overflow-auto">
                <CanvasPdfViewer
                  pdfFile={selectedFile}
                  currentPage={currentPage}
                  onNumPagesChange={setNumPages}
                  zones={activeZones}
                  activeZoneId={selectedZoneId}
                  onSelectZone={(id) => setSelectedZoneId(id)}
                  onAddZone={handleAddZone}
                  onUpdateZone={(zone) => handleUpdateZone(zone.id, zone)}
                  isEditorMode={isDrawingMode}
                  livePreviewValues={fieldValues}
                  showOverlays={!showOriginal}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
