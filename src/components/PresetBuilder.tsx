'use client';

import { useState } from 'react';
import { FieldZone, Preset } from '@/types/preset';
import CanvasPdfViewer from './CanvasPdfViewer';
import TypographyToolbar from './TypographyToolbar';
import { ArrowLeft, Save, Tag, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [keywords, setKeywords] = useState(initialPreset?.identifierKeywords?.join(', ') || '');
  const [zones, setZones] = useState<FieldZone[]>(initialPreset?.zones || []);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [showStyleSettings, setShowStyleSettings] = useState<Record<string, boolean>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
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

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el preset');
      return;
    }
    if (zones.length === 0) {
      alert('Por favor dibuja al menos una zona sobre el PDF para modificar');
      return;
    }

    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const presetToSave: Preset = {
      id: initialPreset?.id || `preset-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      identifierKeywords: keywordArray,
      zones: zones,
      createdAt: initialPreset?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(presetToSave);
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {initialPreset ? 'Editar Preset' : 'Crear Nuevo Preset'}
            </h1>
            <p className="text-xs text-slate-500">
              Carga un PDF muestra y arrastra el ratón para definir las áreas editables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Guardar Preset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Configuración del Preset y Zonas */}
        <div className="lg:col-span-4 space-y-6">
          {/* Formulario Preset */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm border-b pb-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Detalles del Preset
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre del Preset *
              </label>
              <input
                type="text"
                placeholder="ej. Factura Proveedores ACME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Palabras clave de auto-detección (separadas por coma)
              </label>
              <input
                type="text"
                placeholder="ej. acme, factura, orden de compra"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Al subir un PDF, si el nombre contiene estas palabras se sugerirá este preset.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Descripción opcional
              </label>
              <textarea
                placeholder="Notas o descripción breve de este formato..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Listado / Edición de Zonas */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                Zonas Definidas ({zones.length})
              </h3>
            </div>

            {zones.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed rounded-lg">
                Dibuja un rectángulo en el PDF para crear la primera zona de edición
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {zones.map((zone) => {
                  const isSelected = zone.id === activeZoneId;
                  const isOpenStyles = showStyleSettings[zone.id] ?? true;

                  return (
                    <div
                      key={zone.id}
                      onClick={() => setActiveZoneId(zone.id)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-400'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) =>
                            handleUpdateZone(zone.id, { name: e.target.value })
                          }
                          className="font-medium text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={() => toggleStyleSettings(zone.id)}
                          className="text-slate-500 hover:text-slate-700 p-1 flex items-center gap-1 text-[11px]"
                        >
                          Tipografía
                          {isOpenStyles ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {isOpenStyles && (
                        <TypographyToolbar
                          zone={zone}
                          onUpdateZone={handleUpdateZone}
                          onDeleteZone={handleDeleteZone}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Visor de PDF para dibujar zonas */}
        <div className="lg:col-span-8 flex flex-col items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[600px]">
          {!pdfFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 rounded-xl w-full my-auto">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                id="preset-pdf-upload"
                className="hidden"
              />
              <label
                htmlFor="preset-pdf-upload"
                className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-6 py-3 rounded-xl transition-colors mb-3 border border-blue-200"
              >
                Cargar PDF de Muestra
              </label>
              <p className="text-xs text-slate-400 max-w-xs">
                Sube un documento PDF de muestra para marcar visualmente las zonas que deseas editar.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Controles de página */}
              <div className="flex justify-between items-center w-full mb-4 pb-3 border-b text-sm">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="preset-pdf-upload"
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    Cambiar PDF
                  </label>
                  <span className="text-xs text-slate-500">
                    Modo Editor: <span className="font-semibold text-blue-600">Arrastra para dibujar / Mover</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 bg-slate-100 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} de {numPages}
                  </span>
                  <button
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="px-2 py-1 bg-slate-100 rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              {/* Visor Interactivo */}
              <CanvasPdfViewer
                pdfFile={pdfFile}
                currentPage={currentPage}
                onNumPagesChange={setNumPages}
                zones={zones}
                activeZoneId={activeZoneId}
                onSelectZone={(id) => setActiveZoneId(id)}
                onAddZone={handleAddZone}
                onUpdateZone={(zone) => handleUpdateZone(zone.id, zone)}
                isEditorMode={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
