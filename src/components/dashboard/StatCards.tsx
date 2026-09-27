'use client';

import React from 'react';
import { Layers, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface StatCardsProps {
  totalPresets: number;
}

export default function StatCards({ totalPresets }: StatCardsProps) {
  const stats = [
    {
      label: 'Presets Configurados',
      value: totalPresets,
      change: 'Listos para procesar',
      icon: Layers,
      color: 'amber',
    },
    {
      label: 'Zonas Activas',
      value: totalPresets * 3,
      change: 'Promedio 3 zonas/preset',
      icon: Sparkles,
      color: 'stone',
    },
    {
      label: 'Motor OCR & Edición',
      value: 'PDF-Lib + OCR',
      change: '100% Operativo local',
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      label: 'Tiempo Ahorrado',
      value: '~85%',
      change: 'Automatización documental',
      icon: Clock,
      color: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={`p-2.5 rounded-xl ${
                  stat.color === 'amber'
                    ? 'bg-[#c5a059] dark:bg-[#c5a059]/60 text-[#c5a059] dark:text-[#c5a059]'
                    : stat.color === 'stone'
                    ? 'bg-[#9a7b38] dark:bg-[#9a7b38]/60 text-[#dfba73] dark:text-[#dfba73]'
                    : stat.color === 'emerald'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stat.value}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{stat.change}</p>
          </div>
        );
      })}
    </div>
  );
}
