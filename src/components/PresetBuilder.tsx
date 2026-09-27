'use client';

import { useState, useEffect } from 'react';
import { FieldZone, Preset, PresetType, TargetTramiteType } from '@/types/preset';
import CanvasPdfViewer from './CanvasPdfViewer';
import TypographyToolbar from './TypographyToolbar';
import { ArrowLeft, Save, Tag, LayoutGrid, ChevronDown, ChevronUp, FileText, UserCheck, Loader2, Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PresetBuilderProps {
  initialPreset?: Preset | null;
  onSave: (preset: Preset) => void;
  onCancel: () => void;
}

export default function PresetBuilder({
  initialPreset,
  onSave,
  onCancel,
}: PresetBuilderProps) {
  const [name, setName] = useState(initialPreset?.name || '');
  const [description, setDescription] = useState(initialPreset?.description || '');
  const [presetType, setPresetType] = useState<PresetType>(initialPreset?.presetType || 'standard');
  const [targetTramiteType, setTargetTramiteType] = useState<TargetTramiteType>(initialPreset?.targetTramiteType || 'todos');
  const [keywords, setKeywords] = useState(initialPreset?.identifierKeywords?.join(', ') || '');
  const [zones, setZones] = useState<FieldZone[]>(initialPreset?.zones || []);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [samplePdfUrl, setSamplePdfUrl] = useState<string | undefined>(initialPreset?.samplePdfUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [showStyleSettings, setShowStyleSettings] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Si se carga un preset existente que tiene samplePdfUrl guardado en Supabase
  useEffect(() => {
    if (initialPreset?.samplePdfUrl && !pdfFile) {
      fetch(initialPreset.samplePdfUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => setPdfArrayBuffer(buffer))
        .catch((err) => console.error('Error al cargar PDF base desde Supabase:', err));
    }
  }, [initialPreset, pdfFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setPdfArrayBuffer(null);
    }
  };

  const handleAddZone = (newZoneData: Partial<FieldZone>) => {
    const newZone: FieldZone = {
      id: `zone-${Date.now()}`,
      name: `Campo ${zones.length + 1}`,
      x: newZoneData.x || 10,
      y: newZoneData.y || 10,
      width: newZoneData.width || 30,
      height: newZoneData.height || 5,
      pageNumber: currentPage,
      fontSize: 12,
      fontFamily: 'Helvetica',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      bgColor: '#FFFFFF',
      color: '#000000',
      alignment: 'left',
      filledBy: 'cliente',
    };
    setZones((prev) => [...prev, newZone]);
    setActiveZoneId(newZone.id);
  };

  const handleUpdateZone = (id: string, updatedFields: Partial<FieldZone>) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updatedFields } : z))
    );
  };

  const handleDeleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    if (activeZoneId === id) setActiveZoneId(null);
  };

  const toggleStyleSettings = (zoneId: string) => {
    setShowStyleSettings((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el preset');
      return;
    }
    if (zones.length === 0) {
      alert('Por favor dibuja al menos una zona sobre el PDF para modificar');
      return;
    }

    setIsSaving(true);
    let currentSampleUrl = samplePdfUrl;

    // Si hay un archivo subido, guardarlo en Supabase Storage
    if (pdfFile) {
      try {
        const supabase = createClient();
        const cleanFileName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `sample_templates/${Date.now()}_${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('pdf_presets')
          .upload(storagePath, pdfFile, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadErr) {
          console.error('Error subiendo PDF de prueba a Supabase:', uploadErr);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('pdf_presets')
            .getPublicUrl(storagePath);
          currentSampleUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error('Exception subiendo PDF de prueba:', err);
      }
    }

    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const presetToSave: Preset = {
      id: initialPreset?.id || `preset-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      presetType: presetType,
      targetTramiteType: targetTramiteType,
      samplePdfUrl: currentSampleUrl,
      identifierKeywords: keywordArray,
      zones: zones,
      createdAt: initialPreset?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setIsSaving(false);
    onSave(presetToSave);
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialPreset ? 'Editar Plantilla Preset' : 'Crear Nueva Plantilla Preset'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sube un PDF de referencia y dibuja las zonas rectangulares a reemplazar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Guardando...' : 'Guardar Preset'}</span>
          </button>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Configuración del Preset y Zonas */}
        <div className="lg:col-span-4 space-y-5">
          {/* Metadata del preset */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Datos de la Plantilla
            </h3>

            {/* SELECCIÓN DEL TIPO DE PRESET */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Preset *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPresetType('standard')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    presetType === 'standard'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Edición Directa</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    Reemplazo de campos en PDFs subidos manualmente
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetType('client_document')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    presetType === 'client_document'
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Doc. para Cliente</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    Genera link por cliente para rellenar contratos/formatos
                  </span>
                </button>
              </div>
            </div>

            {/* SI ES TIPO DOCUMENTO PARA CLIENTE: MOSTRAR ASIGNACIÓN DE TRÁMITE */}
            {presetType === 'client_document' && (
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-2 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                  ¿En qué tipo de trámite saldrá la opción para generar el link? *
                </label>
                <select
                  value={targetTramiteType}
                  onChange={(e) => setTargetTramiteType(e.target.value as TargetTramiteType)}
                  className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="todos">Todos los Trámites</option>
                  <option value="retiro_desempleo">Retiro por Desempleo</option>
                  <option value="mejoravit">Mejoravit (Infonavit)</option>
                  <option value="alta_medica_imss">Alta Médica IMSS</option>
                </select>
                <p className="text-[10px] text-purple-700 dark:text-purple-300">
                  En la sección de expediente del cliente, bajo el trámite correspondiente, aparecerá un botón de 1-clic para generar y enviar este enlace al cliente.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Preset *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Contrato de Servicios / Solicitud"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Breve descripción del uso de esta plantilla..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  Palabras Clave para Autodetección
                </span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="factura, invoice, recibo (separadas por coma)"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Si el nombre de un PDF contiene estas palabras, se seleccionará automáticamente este preset.
              </p>
            </div>
          </div>

          {/* Subir PDF de muestra */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              2. PDF Base de Calibración
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cargar documento PDF de muestra:
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60 cursor-pointer"
              />
            </div>
            {pdfFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                ✓ Documento cargado: {pdfFile.name}
              </p>
            )}
          </div>

          {/* Lista de Zonas Configuradas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                3. Zonas Definidas ({zones.length})
              </h3>
            </div>

            {zones.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 text-center">
                Haz clic y arrastra sobre el visor del PDF para crear una zona.
              </p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {zones.map((zone, idx) => {
                  const isActive = activeZoneId === zone.id;
                  const isStyleOpen = showStyleSettings[zone.id];

                  return (
                    <div
                      key={zone.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={zone.name}
                            onChange={(e) =>
                              handleUpdateZone(zone.id, { name: e.target.value })
                            }
                            onClick={() => setActiveZoneId(zone.id)}
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 px-1 py-0.5 rounded flex-1 focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => toggleStyleSettings(zone.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          title="Ajustes de estilo y tipografía"
                        >
                          {isStyleOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Asignación de quien debe rellenar el campo: CLIENTE o ASESOR y Tipo Firma */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Rellena:</span>
                          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleUpdateZone(zone.id, { filledBy: 'cliente' })}
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
                              onClick={() => handleUpdateZone(zone.id, { filledBy: 'asesor' })}
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

                        <button
                          type="button"
                          onClick={() => handleUpdateZone(zone.id, { isSignature: !zone.isSignature })}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            zone.isSignature || zone.name.toLowerCase().includes('rubrica') || zone.name.toLowerCase().includes('firma')
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title="Marcar este campo como Firma / Rúbrica en trazo"
                        >
                          <span>✍️ Es Firma</span>
                        </button>
                      </div>

                      {/* Coordenadas editables manualmente (X, Y, W, H) */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>Página {zone.pageNumber}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">Posición y Tamaño (%)</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Coordenada X (%)">
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

                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Coordenada Y (%)">
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

                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Ancho W (%)">
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

                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 shadow-xs" title="Alto H (%)">
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

                      {/* Configuración de estilos expandible */}
                      {isStyleOpen && (
                        <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                          <TypographyToolbar
                            zone={zone}
                            onUpdateZone={handleUpdateZone}
                            onDeleteZone={handleDeleteZone}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Visor de PDF y canvas de calibración */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm min-h-[600px] flex flex-col transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Visor Interactivo & Calibración de Zonas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pdfFile
                  ? 'Dibuja con el ratón o arrastra/redimensiona las zonas existentes.'
                  : 'Carga un PDF para visualizarlo aquí.'}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/80 overflow-auto">
              {pdfFile || pdfArrayBuffer ? (
                <CanvasPdfViewer
                  pdfFile={pdfFile || pdfArrayBuffer!}
                  currentPage={currentPage}
                  onNumPagesChange={(pages) => setNumPages(pages)}
                  zones={zones}
                  activeZoneId={activeZoneId}
                  onSelectZone={(id) => setActiveZoneId(id)}
                  onAddZone={handleAddZone}
                  onUpdateZone={(updated) => handleUpdateZone(updated.id, updated)}
                  isEditorMode={true}
                />
              ) : (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <p className="font-medium text-sm">No hay PDF cargado para calibrar</p>
                  <p className="text-xs mt-1">
                    Selecciona un archivo PDF en el paso 2 del panel izquierdo para comenzar a definir zonas.
                  </p>
                </div>
              )}
            </div>

            {/* Paginador si el PDF tiene múltiples páginas */}
            {numPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Página {currentPage} de {numPages}
                </span>
                <button
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
