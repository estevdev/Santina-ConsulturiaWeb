'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Crear Nueva Plantilla Preset',
      description: 'Define coordenadas de zonas, textos enriquecidos y tipografía para PDFs recurrentes.',
      href: '/dashboard/pdf-preset-studio?action=create',
      icon: PlusCircle,
      gradient: 'from-[#c5a059] to-[#9a7b38]',
      badge: 'Constructor',
    },
    {
      title: 'Procesar & Reemplazar PDF',
      description: 'Carga un documento PDF, selecciona un preset y genera un documento modificado al instante.',
      href: '/dashboard/pdf-preset-studio?action=process',
      icon: Sparkles,
      gradient: 'from-emerald-600 to-teal-600',
      badge: 'Generador',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {actions.map((act, idx) => {
        const Icon = act.icon;
        return (
          <Link
            key={idx}
            href={act.href}
            className="group relative bg-white dark:bg-[#0d0e12] rounded-2xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3.5 rounded-2xl bg-gradient-to-tr ${act.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {act.badge}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#c5a059] dark:group-hover:text-[#c5a059] transition-colors">
                {act.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {act.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center text-xs font-semibold text-[#c5a059] dark:text-[#c5a059] group-hover:text-[#c5a059] dark:group-hover:text-[#c5a059]">
              <span>Acceder ahora</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
