'use client';

import React from 'react';
import { X, ScanLine, Sparkles } from 'lucide-react';
import { ManualPointsCanvas } from './ManualPointsCanvas';

export interface ManualIneCropModalState {
  tramiteId: string;
  imageUrl: string;
  step: 'frente' | 'reverso';
  frentePoints: { x: number; y: number }[];
  reversoPoints: { x: number; y: number }[];
}

interface ManualIneCropModalProps {
  modalData: ManualIneCropModalState;
  onClose: () => void;
  onPointsChange: (step: 'frente' | 'reverso', points: { x: number; y: number }[]) => void;
  onStepChange: (step: 'frente' | 'reverso') => void;
  onConfirm: () => void;
  processing: boolean;
}

export function ManualIneCropModal({
  modalData,
  onClose,
  onPointsChange,
  onStepChange,
  onConfirm,
  processing,
}: ManualIneCropModalProps) {
  const currentPoints = modalData.step === 'frente' ? modalData.frentePoints : modalData.reversoPoints;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 my-6 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#c5a059]" />
              <span>
                Marcar 4 Puntos de la INE ({modalData.step === 'frente' ? '1. Cara FRONTAL' : '2. Cara TRASERA'})
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en las 4 esquinas de la cara en orden: Top-Left (arriba izq), Top-Right (arriba der), Bottom-Right (abajo der), Bottom-Left (abajo izq).
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

        {/* Barra de progreso de los 4 puntos */}
        <div className="flex items-center justify-between p-3 bg-[#c5a059]/10 dark:bg-slate-800 rounded-2xl border border-[#c5a059] dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#c5a059] uppercase tracking-wide">
              Puntos marcados ({modalData.step === 'frente' ? 'Frontal' : 'Trasera'}):
            </span>
            <span className="font-mono font-bold text-[#c5a059] dark:text-[#dfba73] text-sm">
              {currentPoints.length} / 4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPointsChange(modalData.step, [])}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reiniciar Puntos
            </button>
            {modalData.step === 'reverso' && (
              <button
                type="button"
                onClick={() => onStepChange('frente')}
                className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ← Volver a Frontal
              </button>
            )}
          </div>
        </div>

        {/* Contenedor Canvas Interactivo con Marcado de Puntos */}
        <div className="flex-1 bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center p-2 min-h-[420px]">
          <ManualPointsCanvas
            imageUrl={modalData.imageUrl}
            points={currentPoints}
            onPointsChange={(updatedPts) => onPointsChange(modalData.step, updatedPts)}
          />
        </div>

        {/* Botones de Paso / Confirmación */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>

          {modalData.step === 'frente' ? (
            <button
              type="button"
              disabled={modalData.frentePoints.length < 4}
              onClick={() => onStepChange('reverso')}
              className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d5b069] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              Siguiente: Marcar 4 Puntos de la Trasera →
            </button>
          ) : (
            <button
              type="button"
              disabled={modalData.reversoPoints.length < 4 || processing}
              onClick={onConfirm}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando INE Ampliada al 200%...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar INE Ampliada al 200% con Puntos Marcados</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
