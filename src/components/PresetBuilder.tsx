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
      fontSize: 7,
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
    setZones((prev) => [...prev, duplicated]);
    setActiveZoneId(duplicated.id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d0e12] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm transition-colors">
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
            className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#c5a059] text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-amber-600/20 cursor-pointer disabled:opacity-50"
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
          <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
              1. Datos de la Plantilla
            </h3>

            {/* SELECCIÓN DEL TIPO DE PRESET */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  ¿Para qué usarás esta Plantilla? *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Selecciona un tipo</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opción 1: Edición Directa */}
                <button
                  type="button"
                  onClick={() => setPresetType('standard')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                    presetType === 'standard'
                      ? 'border-[#c5a059] bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/30 dark:via-zinc-900/90 dark:to-zinc-900 ring-2 ring-[#c5a059]/30 shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/60 text-slate-700 dark:text-slate-300 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <span>📄 Edición Directa</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Interno
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Para que el <strong>asesor</strong> cargue PDFs en PDF Studio, extraiga datos con OCR, reemplace campos y descargue el PDF corregido.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                    <span>⚡ Uso en: PDF Studio &rarr; Procesar PDF</span>
                  </div>
                </button>

                {/* Opción 2: Doc. para Cliente */}
                <button
                  type="button"
                  onClick={() => setPresetType('client_document')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                    presetType === 'client_document'
                      ? 'border-purple-500 bg-gradient-to-b from-purple-500/10 via-white to-purple-500/5 dark:from-purple-950/40 dark:via-zinc-900/90 dark:to-zinc-900 ring-2 ring-purple-500/30 shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/60 text-slate-700 dark:text-slate-300 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-950 dark:text-purple-200">
                        <span className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                          <UserCheck className="w-3.5 h-3.5" />
                        </span>
                        <span>📝 Doc. para Cliente</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Firma Web
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Genera un <strong>enlace web único</strong> para que el cliente llene datos y firme digitalmente desde su celular/PC en su trámite.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/40 text-[10px] text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1">
                    <span>🔗 Uso en: Expediente del Cliente &rarr; Trámites</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SI ES TIPO DOCUMENTO PARA CLIENTE: MOSTRAR ASIGNACIÓN DE TRÁMITE Y GUÍA */}
            {presetType === 'client_document' && (
              <div className="p-3.5 bg-gradient-to-r from-purple-50/80 to-purple-50/40 dark:from-purple-950/40 dark:to-zinc-900 border border-purple-200 dark:border-purple-900/60 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950 dark:text-purple-200">
                    🎯 Trámite Asignado para Enlace de Cliente *
                  </label>
                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">Integración con Expediente</span>
                </div>
                <select
                  value={targetTramiteType}
                  onChange={(e) => setTargetTramiteType(e.target.value as TargetTramiteType)}
                  className="w-full bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium shadow-2xs"
                >
                  <option value="todos">Todos los Trámites (Disponible globalmente)</option>
                  <option value="retiro_desempleo">Solo en Trámites de Retiro por Desempleo</option>
                  <option value="mejoravit">Solo en Trámites de Mejoravit (Infonavit)</option>
                  <option value="alta_medica_imss">Solo en Trámites de Alta Médica IMSS</option>
                </select>
                <div className="text-[11px] text-purple-900/80 dark:text-purple-300/80 bg-purple-100/60 dark:bg-purple-950/60 p-2.5 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                  <p className="font-semibold text-purple-950 dark:text-purple-200">💡 ¿Cómo funciona para el cliente?</p>
                  <p>1. En el expediente del cliente verás el botón <strong>"Generar Link para Cliente"</strong>.</p>
                  <p>2. El cliente abrirá el link en su navegador, verá este PDF, completará sus datos y estampará su firma digital.</p>
                  <p>3. El PDF final firmado se vinculará de inmediato al expediente del cliente.</p>
                </div>
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
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#c5a059]" />
                  Palabras Clave para Autodetección
                </span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="factura, invoice, recibo (separadas por coma)"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Si el nombre de un PDF contiene estas palabras, se seleccionará automáticamente este preset.
              </p>
            </div>
          </div>

          {/* Subir PDF de muestra */}
          <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
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
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#c5a059] dark:file:bg-[#c5a059]/60 file:text-[#c5a059] dark:file:text-[#c5a059] hover:file:bg-[#c5a059] dark:hover:file:bg-[#c5a059]/60 cursor-pointer"
              />
            </div>
            {pdfFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                ✓ Documento cargado: {pdfFile.name}
              </p>
            )}
          </div>

          {/* Lista de Zonas Configuradas */}
          <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#c5a059] dark:text-[#c5a059]" />
                3. Zonas Definidas ({zones.length})
              </h3>

              <button
                type="button"
                onClick={() => {
                  const newZone: FieldZone = {
                    id: `zone-${Date.now()}`,
                    name: `Círculos Género / Respuesta ${zones.length + 1}`,
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
                  setZones((prev) => [...prev, newZone]);
                  setActiveZoneId(newZone.id);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Agregar un campo de Círculos de Respuesta con puntos exactos por coordenada"
              >
                <span>⭕ + Círculos de Respuesta</span>
              </button>
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
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString());
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndexStr = e.dataTransfer.getData('text/plain');
                        if (!fromIndexStr) return;
                        const fromIndex = parseInt(fromIndexStr, 10);
                        if (isNaN(fromIndex) || fromIndex === idx) return;

                        setZones((prev) => {
                          const updated = [...prev];
                          const [movedItem] = updated.splice(fromIndex, 1);
                          updated.splice(idx, 0, movedItem);
                          return updated;
                        });
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                        isActive
                          ? 'border-[#c5a059] bg-[#c5a059]/40 dark:bg-[#c5a059]/30 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-grab" title="Arrastra para reordenar esta zona">
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
                            onClick={() => setActiveZoneId(zone.id)}
                            placeholder="Nombre del campo..."
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#c5a059] focus:bg-white dark:focus:bg-slate-800 px-1 py-0.5 rounded flex-1 focus:outline-none"
                          />
                        </div>

                        {/* Título de Sección y Subtítulo opcionales */}
                        <div className="mb-2 space-y-1 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/80 dark:border-amber-800/60">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">📌 Título Sección:</span>
                            <input
                              type="text"
                              value={zone.sectionHeader || ''}
                              onChange={(e) => handleUpdateZone(zone.id, { sectionHeader: e.target.value })}
                              onClick={() => setActiveZoneId(zone.id)}
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
                              onClick={() => setActiveZoneId(zone.id)}
                              placeholder="ej. Referencia 1, Datos del Cónyuge..."
                              className="w-full bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStyleSettings(zone.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                          title="Ajustes de estilo y tipografía"
                        >
                          {isStyleOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Asignación de quien debe rellenar el campo: CLIENTE o ASESOR, Tipo de Campo */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-zinc-800 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Rellena:</span>
                          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleUpdateZone(zone.id, { filledBy: 'cliente' })}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                (zone.filledBy || 'cliente') === 'cliente'
                                  ? 'bg-[#c5a059] text-white shadow-xs'
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

                        {/* Selección de Tipo de Campo: Texto | Firma | Círculo de Marcado */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
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
                            onClick={() => {
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
                                onClick={() => {
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
                                  onClick={() => {
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
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>Página {zone.pageNumber}</span>
                          <span className="font-bold text-[#c5a059] dark:text-[#c5a059]">Posición y Tamaño (%)</span>
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
                            onDuplicateZone={handleDuplicateZone}
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
          <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm min-h-[600px] flex flex-col transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Visor Interactivo & Calibración de Zonas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pdfFile
                  ? 'Dibuja con el ratón o arrastra/redimensiona las zonas existentes.'
                  : 'Carga un PDF para visualizarlo aquí.'}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200/60 dark:border-zinc-800/80 overflow-auto">
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
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
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
