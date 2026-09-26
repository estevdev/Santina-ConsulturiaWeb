'use client';

import React from 'react';
import { Preset } from '@/types/preset';
import Link from 'next/link';
import { FileEdit, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface RecentPresetsProps {
  presets: Preset[];
}

export default function RecentPresets({ presets }: RecentPresetsProps) {
  const recentList = presets.slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Plantillas Presets Recientes</h2>
        </div>
        <Link
          href="/dashboard/pdf-preset-studio"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <span>Ver todas ({presets.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {presets.length === 0 ? (
        <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80">
          <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No hay presets registrados aún</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
            Crea tu primera plantilla de zonas en PDF Studio.
          </p>
          <Link
            href="/dashboard/pdf-preset-studio?action=create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <FileEdit className="w-3.5 h-3.5" />
            Crear Preset
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentList.map((preset) => (
            <div
              key={preset.id}
              className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  {preset.zones.length}z
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{preset.name}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {preset.zones.length} zona(s) configurada(s) &bull;{' '}
                    {new Date(preset.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/pdf-preset-studio?presetId=${preset.id}&action=process`}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-800/40"
                  title="Procesar con este preset"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Procesar</span>
                </Link>
                <Link
                  href={`/dashboard/pdf-preset-studio?presetId=${preset.id}&action=edit`}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                  title="Editar preset"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
