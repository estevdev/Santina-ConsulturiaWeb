'use client';

import React from 'react';
import { OverviewMetrics } from '@/types/reportes';
import { Filter, CheckCircle2, Clock, Calendar, AlertTriangle, XCircle, ArrowDown } from 'lucide-react';

interface ConversionFunnelChartProps {
  metrics: OverviewMetrics;
}

export function ConversionFunnelChart({ metrics }: ConversionFunnelChartProps) {
  const total = metrics.totalClientes || 1;

  const funnelSteps = [
    {
      label: '1. Interesados',
      count: metrics.totalInteresados,
      pct: Math.round((metrics.totalInteresados / total) * 100),
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      icon: Filter,
      desc: 'Prospectos captados en primer contacto',
    },
    {
      label: '2. Doc. Pendiente',
      count: metrics.totalDocPendiente,
      pct: Math.round((metrics.totalDocPendiente / total) * 100),
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      icon: AlertTriangle,
      desc: 'Expediente en recopilación documental',
    },
    {
      label: '3. En Proceso',
      count: metrics.totalEnProceso,
      pct: Math.round((metrics.totalEnProceso / total) * 100),
      color: 'bg-[#c5a059]',
      textColor: 'text-[#dfba73]',
      borderColor: 'border-[#c5a059]/30',
      icon: Clock,
      desc: 'Trámite en validación institucional',
    },
    {
      label: '4. Citas Programadas',
      count: metrics.totalCitasProgramadas,
      pct: Math.round((metrics.totalCitasProgramadas / total) * 100),
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      icon: Calendar,
      desc: 'Cita oficial agendada ante la institución',
    },
    {
      label: '5. Terminados con Éxito',
      count: metrics.totalTerminados,
      pct: Math.round((metrics.totalTerminados / total) * 100),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      icon: CheckCircle2,
      desc: 'Trámite cobrado y concluido exitosamente',
    },
  ];

  return (
    <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800/90 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                Embudo de Conversión & Flujo de Trámites
              </h3>
              <p className="text-xs text-zinc-400">
                Paso a paso del cliente desde prospecto hasta conclusión exitosa.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400">
              Tasa de Éxito: {metrics.successRate}%
            </span>
          </div>
        </div>

        {/* Funnel Progress Steps */}
        <div className="space-y-2.5">
          {funnelSteps.map((step, idx) => {
            const Icon = step.icon;
            // Width scaling: min 20% to max 100%
            const barWidth = Math.max(step.pct, 8);

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${step.textColor}`} />
                    <span className="font-bold text-white">{step.label}</span>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      — {step.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{step.count}</span>
                    <span className="text-[11px] text-zinc-400 font-semibold w-8 text-right">
                      {step.pct}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                  <div
                    className={`${step.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fallout / Cancelados Footer note */}
      <div className="mt-5 p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-400">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>
            Clientes Cancelados / Descartados: <strong>{metrics.totalCancelados}</strong>
          </span>
        </div>
        <span className="text-[11px] text-rose-400/80 font-medium">
          {Math.round((metrics.totalCancelados / total) * 100)}% tasa de deserción
        </span>
      </div>
    </div>
  );
}
