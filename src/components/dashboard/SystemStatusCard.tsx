'use client';

import React from 'react';
import { Cpu, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SystemStatusCard() {
  const { user } = useAuth();

  const services = [
    { name: 'Motor PDF-Lib (Generación & Render)', status: 'Operativo', ok: true },
    { name: 'Motor OCR Tesseract (Reconocimiento)', status: 'Listo (Local)', ok: true },
    { name: 'Almacenamiento Local (Presets)', status: 'Sincronizado', ok: true },
    { name: 'Autenticación & Sesión', status: `Activa (${user?.role})`, ok: true },
  ];

  return (
    <div className="bg-white dark:bg-[#0d0e12] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#dfba73] dark:text-[#dfba73]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Estado del Sistema</h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En línea
          </span>
        </div>

        <div className="space-y-3">
          {services.map((svc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{svc.name}</span>
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {svc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Sesión iniciada como:</span>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#0d0e12] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {user?.email}
        </span>
      </div>
    </div>
  );
}
