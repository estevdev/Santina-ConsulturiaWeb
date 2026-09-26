'use client';

import React, { useState, useEffect } from 'react';
import { Preset } from '@/types/preset';
import { getPresets } from '@/utils/storage';
import { useAuth } from '@/context/AuthContext';
import StatCards from '@/components/dashboard/StatCards';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentPresets from '@/components/dashboard/RecentPresets';
import SystemStatusCard from '@/components/dashboard/SystemStatusCard';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    setPresets(getPresets());
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Panel de Control &bull; Santina Consultoría Web</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ¡Bienvenido de nuevo, {user?.name || 'Usuario'}!
          </h1>
          <p className="text-sm text-blue-100/90 mt-2 leading-relaxed">
            Administra tus plantillas PDF, procesa documentos de forma automatizada y personaliza zonas con OCR de alta precisión.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/pdf-preset-studio"
              className="px-4 py-2.5 bg-white text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-md shadow-black/10 flex items-center gap-2"
            >
              <span>Abrir PDF Studio</span>
            </Link>
            <Link
              href="/dashboard/pdf-preset-studio?action=create"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-all border border-white/20"
            >
              + Nueva Plantilla
            </Link>
          </div>
        </div>

        {/* Decorative circle shapes in background */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats */}
      <StatCards totalPresets={presets.length} />

      {/* Quick Action Cards */}
      <QuickActions />

      {/* Recent Presets & System Status grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPresets presets={presets} />
        </div>
        <div>
          <SystemStatusCard />
        </div>
      </div>
    </div>
  );
}
