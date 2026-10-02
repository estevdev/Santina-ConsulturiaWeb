'use client';

import React from 'react';
import { OverviewMetrics } from '@/types/reportes';
import {
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileCheck2,
} from 'lucide-react';

interface ReportesKpiStripProps {
  metrics: OverviewMetrics;
}

export function ReportesKpiStrip({ metrics }: ReportesKpiStripProps) {
  const cards = [
    {
      label: 'Cartera Total',
      value: metrics.totalClientes,
      subtext: `${metrics.activeClientes} activos en gestión`,
      icon: Users,
      color: 'gold',
      badge: `${metrics.totalCancelados} cancelados`,
    },
    {
      label: 'Cobertura Nacional',
      value: `${metrics.statesCovered} / ${metrics.statesTotal}`,
      subtext: `${metrics.nationalCoveragePercent}% del territorio nacional`,
      icon: MapPin,
      color: 'blue',
      badge: 'Entidades activas',
    },
    {
      label: 'Trámites Activos',
      value: metrics.totalTramites,
      subtext: `${metrics.tramitesRetiro} Retiros · ${metrics.tramitesMejoravit} Mejoravit · ${metrics.tramitesAltaMedica} IMSS`,
      icon: Briefcase,
      color: 'purple',
      badge: 'Operaciones',
    },
    {
      label: 'Tasa de Éxito',
      value: `${metrics.successRate}%`,
      subtext: `${metrics.totalTerminados} trámites concluidos con éxito`,
      icon: CheckCircle2,
      color: 'emerald',
      badge: 'Efectividad',
    },
    {
      label: 'Doc. Pendiente',
      value: metrics.totalDocPendiente,
      subtext: 'Expedientes por completar',
      icon: AlertTriangle,
      color: 'amber',
      badge: 'Cuello de botella',
    },
    {
      label: 'Citas Programadas',
      value: metrics.totalCitasProgramadas,
      subtext: 'Agendadas ante instituciones',
      icon: Calendar,
      color: 'indigo',
      badge: 'Próximas',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-[#0d0e12] border border-zinc-800/90 shadow-sm hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div
                  className={`p-1.5 rounded-xl ${
                    card.color === 'gold'
                      ? 'bg-[#c5a059]/15 text-[#dfba73]'
                      : card.color === 'emerald'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : card.color === 'amber'
                      ? 'bg-amber-500/15 text-amber-400'
                      : card.color === 'blue'
                      ? 'bg-blue-500/15 text-blue-400'
                      : card.color === 'purple'
                      ? 'bg-purple-500/15 text-purple-300'
                      : 'bg-indigo-500/15 text-indigo-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-2xl font-black text-white tracking-tight">
                {card.value}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-400 leading-tight truncate">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
