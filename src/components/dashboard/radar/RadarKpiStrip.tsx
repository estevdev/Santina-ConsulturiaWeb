'use client';

import React from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';

interface RadarKpiStripProps {
  clientes: ClienteRadar[];
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export function RadarKpiStrip({
  clientes,
  activeStatusFilter,
  onSelectStatusFilter,
}: RadarKpiStripProps) {
  const total = clientes.length;

  const countByStatus = (status: string) => {
    return clientes.filter((c) => (c.estado_cliente || 'interesado').toLowerCase() === status).length;
  };

  const interesadosCount = countByStatus('interesado');
  const docPendienteCount = countByStatus('documentacion_pendiente');
  const enProcesoCount = countByStatus('en_proceso');
  const citaProgramadaCount = countByStatus('cita_programada');
  const terminadosCount = countByStatus('terminado');
  const canceladosCount = countByStatus('cancelado');
  
  // Clientes a punto de salir (near completion)
  const puntoDeSalirCount = clientes.filter((c) => c.isPuntoDeSalir).length;

  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const cards = [
    {
      id: 'todos',
      label: 'Total Activos',
      count: total,
      pct: 100,
      icon: Users,
      borderClass: 'border-zinc-800 hover:border-zinc-700',
      activeClass: 'ring-2 ring-[#c5a059] bg-zinc-900',
      badgeBg: 'bg-zinc-800 text-zinc-300',
      textColor: 'text-white',
    },
    {
      id: 'interesado',
      label: 'Interesados',
      count: interesadosCount,
      pct: getPercent(interesadosCount),
      icon: Users,
      borderClass: 'border-blue-500/20 hover:border-blue-500/40',
      activeClass: 'ring-2 ring-blue-400 bg-blue-950/20',
      badgeBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      textColor: 'text-blue-400',
      barColor: 'bg-blue-500',
    },
    {
      id: 'documentacion_pendiente',
      label: 'Doc. Pendiente',
      count: docPendienteCount,
      pct: getPercent(docPendienteCount),
      icon: AlertTriangle,
      borderClass: 'border-amber-500/20 hover:border-amber-500/40',
      activeClass: 'ring-2 ring-amber-400 bg-amber-950/20',
      badgeBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      textColor: 'text-amber-400',
      barColor: 'bg-amber-500',
    },
    {
      id: 'en_proceso',
      label: 'En Proceso',
      count: enProcesoCount,
      pct: getPercent(enProcesoCount),
      icon: Clock,
      borderClass: 'border-[#c5a059]/30 hover:border-[#c5a059]/60',
      activeClass: 'ring-2 ring-[#c5a059] bg-[#c5a059]/10',
      badgeBg: 'bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40',
      textColor: 'text-[#dfba73]',
      barColor: 'bg-[#c5a059]',
    },
    {
      id: 'cita_programada',
      label: 'Citas Programadas',
      count: citaProgramadaCount,
      pct: getPercent(citaProgramadaCount),
      icon: Calendar,
      borderClass: 'border-purple-500/20 hover:border-purple-500/40',
      activeClass: 'ring-2 ring-purple-400 bg-purple-950/20',
      badgeBg: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      textColor: 'text-purple-300',
      barColor: 'bg-purple-500',
    },
    {
      id: 'punto_de_salir',
      label: '⚡ A Punto de Salir',
      count: puntoDeSalirCount,
      pct: getPercent(puntoDeSalirCount),
      icon: Zap,
      borderClass: 'border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-br from-emerald-950/30 to-transparent',
      activeClass: 'ring-2 ring-emerald-400 bg-emerald-950/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
      textColor: 'text-emerald-300',
      isHighlight: true,
    },
    {
      id: 'terminado',
      label: 'Terminados',
      count: terminadosCount,
      pct: getPercent(terminadosCount),
      icon: CheckCircle2,
      borderClass: 'border-emerald-600/20 hover:border-emerald-600/40',
      activeClass: 'ring-2 ring-emerald-500 bg-emerald-950/20',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      textColor: 'text-emerald-400',
      barColor: 'bg-emerald-600',
    },
  ];

  return (
    <div className="space-y-2">
      {/* KPI Cards Row - Designed for high visual density and 0-scroll overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {cards.map((card) => {
          const isActive = activeStatusFilter === card.id;
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                onSelectStatusFilter(isActive ? 'todos' : card.id);
              }}
              className={`text-left p-2.5 rounded-xl bg-[#0d0e12] border transition-all cursor-pointer select-none group relative overflow-hidden ${
                card.borderClass
              } ${isActive ? card.activeClass : ''}`}
            >
              {card.isHighlight && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              )}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                  {card.label}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${card.badgeBg}`}>
                  {card.pct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${card.textColor}`}>
                  {card.count}
                </span>
                <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Proportional Pipeline Progress Bar - Single glance visual representation */}
      {total > 0 && (
        <div className="bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 flex items-center gap-1 overflow-hidden" title="Distribución proporcional del flujo de clientes">
          <div
            className="h-2 rounded-l-md bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.max(interesadosCount / total * 100, 2)}%` }}
            title={`Interesados: ${interesadosCount} (${getPercent(interesadosCount)}%)`}
          />
          <div
            className="h-2 bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(docPendienteCount / total * 100, 2)}%` }}
            title={`Doc. Pendiente: ${docPendienteCount} (${getPercent(docPendienteCount)}%)`}
          />
          <div
            className="h-2 bg-[#c5a059] transition-all duration-500"
            style={{ width: `${Math.max(enProcesoCount / total * 100, 2)}%` }}
            title={`En Proceso: ${enProcesoCount} (${getPercent(enProcesoCount)}%)`}
          />
          <div
            className="h-2 bg-purple-500 transition-all duration-500"
            style={{ width: `${Math.max(citaProgramadaCount / total * 100, 2)}%` }}
            title={`Citas Programadas: ${citaProgramadaCount} (${getPercent(citaProgramadaCount)}%)`}
          />
          <div
            className="h-2 rounded-r-md bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(terminadosCount / total * 100, 2)}%` }}
            title={`Terminados: ${terminadosCount} (${getPercent(terminadosCount)}%)`}
          />
        </div>
      )}
    </div>
  );
}
