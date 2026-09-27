'use client';

import React from 'react';
import { X, UserCheck, Check } from 'lucide-react';

export interface ReferenciasModalState {
  tramiteId: string;
  referencias: { nombre: string; telefono: string; domicilio: string }[];
}

interface ReferenciasModalProps {
  modalData: ReferenciasModalState;
  onClose: () => void;
  onReferenciasChange: (referencias: { nombre: string; telefono: string; domicilio: string }[]) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function ReferenciasModal({
  modalData,
  onClose,
  onReferenciasChange,
  onSubmit,
  saving,
}: ReferenciasModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#dfba73]" />
              <span>8. Captura de 3 Referencias Personales</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ingresa el Nombre, Teléfono y Domicilio completo para las 3 referencias personales requeridas.
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

        <form onSubmit={onSubmit} className="space-y-5">
          {modalData.referencias.map((ref, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="w-5 h-5 rounded-full bg-[#9a7b38] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {idx + 1}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Referencia Personal #{idx + 1} {idx === 2 ? '(Familiar / Parentesco)' : ''}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={ref.nombre}
                    onChange={(e) => {
                      const newRefs = [...modalData.referencias];
                      newRefs[idx].nombre = e.target.value;
                      onReferenciasChange(newRefs);
                    }}
                    placeholder="ej: María Carmen Pérez"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={ref.telefono}
                    onChange={(e) => {
                      const newRefs = [...modalData.referencias];
                      newRefs[idx].telefono = e.target.value;
                      onReferenciasChange(newRefs);
                    }}
                    placeholder="ej: 33 1234 5678"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-stone-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Domicilio Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={ref.domicilio}
                    onChange={(e) => {
                      const newRefs = [...modalData.referencias];
                      newRefs[idx].domicilio = e.target.value;
                      onReferenciasChange(newRefs);
                    }}
                    placeholder="ej: Av. Hidalgo #123, Col. Centro, Guadalajara, Jal."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-stone-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#9a7b38] hover:bg-[#9a7b38] text-white rounded-xl shadow-md shadow-stone-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Referencias</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
