'use client';

import React from 'react';
import { OverviewMetrics } from '@/types/reportes';
import { Briefcase, FileText, Home, ShieldPlus, TrendingUp } from 'lucide-react';

interface TramitesDistributionChartProps {
  metrics: OverviewMetrics;
}

export function TramitesDistributionChart({ metrics }: TramitesDistributionChartProps) {
  const total = metrics.totalTramites || 1;

  const tramites = [
    {
      tipo: 'Retiro por Desempleo',
      entidad: 'AFORE / IMSS',
      count: metrics.tramitesRetiro,
      pct: Math.round((metrics.tramitesRetiro / total) * 100),
      icon: Briefcase,
      color: '#c5a059',
      bgColor: 'bg-[#c5a059]/10',
      borderColor: 'border-[#c5a059]/30',
      textColor: 'text-[#dfba73]',
      description: 'Retiro de recursos de la subcuenta de desempleo IMSS',
    },
    {
      tipo: 'Crédito Mejoravit',
      entidad: 'Portal Infonavit',
      count: metrics.tramitesMejoravit,
      pct: Math.round((metrics.tramitesMejoravit / total) * 100),
      icon: Home,
      color: '#a855f7',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      description: 'Crédito para remodelación, referencias y validación fotográfica',
    },
    {
      tipo: 'Alta Médica IMSS',
      entidad: 'Clínica UMF / Patronal',
      count: metrics.tramitesAltaMedica,
      pct: Math.round((metrics.tramitesAltaMedica / total) * 100),
      icon: ShieldPlus,
      color: '#10b981',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      description: 'Asignación de clínica UMF, turno y modalidad de aseguramiento',
    },
  ];

  return (
    <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800/90 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#dfba73]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                Distribución por Tipo de Trámite
              </h3>
              <p className="text-xs text-zinc-400">
                Líneas de servicio activas gestionadas por la consultora.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-white bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
            Total: {metrics.totalTramites} Trámites
          </span>
        </div>

        {/* Proportional Segment Bar */}
        <div className="w-full bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center gap-1 overflow-hidden mb-5">
          {tramites.map((t, idx) => (
            <div
              key={idx}
              className="h-2.5 rounded-sm transition-all duration-500"
              style={{
                width: `${Math.max(t.pct, 3)}%`,
                backgroundColor: t.color,
              }}
              title={`${t.tipo}: ${t.count} (${t.pct}%)`}
            />
          ))}
        </div>

        {/* Vertical Cards Breakdown */}
        <div className="space-y-3">
          {tramites.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${t.bgColor} border ${t.borderColor} ${t.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{t.tipo}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                        {t.entidad}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-white">{t.count}</span>
                  <div className="text-[11px] font-bold text-zinc-400">{t.pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
