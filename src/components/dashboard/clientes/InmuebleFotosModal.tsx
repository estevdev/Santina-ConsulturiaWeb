'use client';

import React from 'react';
import { X, Camera, Upload, FileText } from 'lucide-react';

export interface InmuebleFotosModalState {
  tramiteId: string;
  existingPdfUrl?: string;
  fotos: string[]; // Lista de DataURLs o URLs
}

interface InmuebleFotosModalProps {
  modalData: InmuebleFotosModalState;
  onClose: () => void;
  onFotosChange: (fotos: string[]) => void;
  onGeneratePdf: () => Promise<void>;
  saving: boolean;
}

export function InmuebleFotosModal({
  modalData,
  onClose,
  onFotosChange,
  onGeneratePdf,
  saving,
}: InmuebleFotosModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#dfba73]" />
              Fotografías del Inmueble (Hasta 5 Imágenes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              El sistema empaquetará las imágenes en un PDF oficial de 2 imágenes por hoja (ocupando la mitad de cada hoja).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Acciones Globales */}
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Imágenes cargadas: <strong className="text-[#dfba73]">{modalData.fotos.length} / 5</strong>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Reemplazar / Agregar todas */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{modalData.fotos.length > 0 ? 'Cambiar Todas las Fotos' : 'Cargar Fotos (Selección múltiple)'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 5);
                  if (files.length === 0) return;
                  const promises = files.map((f) => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => resolve(ev.target?.result as string);
                      reader.readAsDataURL(f);
                    });
                  });
                  Promise.all(promises).then((dataUrls) => {
                    onFotosChange(dataUrls);
                  });
                }}
              />
            </label>

            {modalData.fotos.length > 0 && (
              <button
                type="button"
                onClick={() => onFotosChange([])}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Vaciar Lista
              </button>
            )}
          </div>
        </div>

        {/* Grid de 5 Fotos con Miniaturas, Reordenación y Cambiar Individual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4].map((idx) => {
            const fotoSrc = modalData.fotos[idx];
            const isInteriores = idx < 3;
            const slotLabel = isInteriores ? `Foto ${idx + 1} (Interior)` : `Foto ${idx + 1} (Exterior)`;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 relative transition-all ${
                  fotoSrc
                    ? 'bg-white dark:bg-slate-800 border-stone-200 dark:border-stone-900/60 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0d0e12] border-dashed border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>{slotLabel}</span>
                  {fotoSrc && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#9a7b38] text-[#dfba73]">
                      Posición {idx + 1}
                    </span>
                  )}
                </div>

                {fotoSrc ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-950 flex items-center justify-center group">
                    <img src={fotoSrc} alt={`Foto ${idx + 1}`} className="object-contain h-36 w-full" />
                  </div>
                ) : (
                  <div className="h-36 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
                    <Camera className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                    <span className="text-[11px]">Sin foto {idx + 1}</span>
                  </div>
                )}

                {/* Controles por ranura: Mover a la izquierda/derecha y Cambiar foto individual */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1">
                    {/* Mover Izquierda / Arriba */}
                    <button
                      type="button"
                      disabled={!fotoSrc || idx === 0}
                      onClick={() => {
                        const newFotos = [...modalData.fotos];
                        const temp = newFotos[idx];
                        newFotos[idx] = newFotos[idx - 1];
                        newFotos[idx - 1] = temp;
                        onFotosChange(newFotos);
                      }}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Mover foto a la posición anterior"
                    >
                      ←
                    </button>
                    {/* Mover Derecha / Abajo */}
                    <button
                      type="button"
                      disabled={!fotoSrc || idx === modalData.fotos.length - 1}
                      onClick={() => {
                        const newFotos = [...modalData.fotos];
                        const temp = newFotos[idx];
                        newFotos[idx] = newFotos[idx + 1];
                        newFotos[idx + 1] = temp;
                        onFotosChange(newFotos);
                      }}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Mover foto a la posición siguiente"
                    >
                      →
                    </button>
                  </div>

                  {/* Cambiar foto individual */}
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-[#9a7b38] text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3 h-3 text-[#dfba73]" />
                    <span>{fotoSrc ? 'Cambiar' : 'Subir'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const newFotos = [...modalData.fotos];
                            newFotos[idx] = ev.target?.result as string;
                            onFotosChange(newFotos);
                          };
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acciones de Confirmación y Generación de PDF */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || modalData.fotos.filter(Boolean).length === 0}
            onClick={onGeneratePdf}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-stone-600 to-amber-600 hover:from-stone-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-stone-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando PDF y Guardando...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generar PDF (2 Fotos por Hoja) & Guardar en Expediente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
