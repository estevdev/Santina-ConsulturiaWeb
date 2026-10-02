'use client';

import React from 'react';
import { AdvisorMetrics } from '@/types/reportes';
import { UserCheck, CheckCircle2, Clock, Calendar, AlertTriangle, Award } from 'lucide-react';

interface AdvisorsPerformanceCardProps {
  advisorsMetrics: AdvisorMetrics[];
}

export function AdvisorsPerformanceCard({ advisorsMetrics }: AdvisorsPerformanceCardProps) {
  // Sort advisors by total clients managed descending
  const sorted = [...advisorsMetrics].sort((a, b) => b.totalClients - a.totalClients);

  return (
    <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800/90 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#dfba73]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                Rendimiento por Asesor y Equipo
              </h3>
              <p className="text-xs text-zinc-400">
                Productividad, cartera gestionada y trámites concluidos por cada asesor.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {sorted.length} Asesores activos
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No hay asesores asignados a clientes registrados aún.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((adv, idx) => {
              const initials = adv.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AS';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] flex items-center justify-center text-zinc-950 font-black text-xs shadow-md shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{adv.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Líder
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {adv.email || 'Asesor comercial'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-center sm:text-right">
                      <span className="font-black text-white text-base">{adv.totalClients}</span>
                      <p className="text-[10px] text-zinc-500">Cartera total</p>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="font-black text-[#dfba73] text-base">{adv.enProceso}</span>
                      <p className="text-[10px] text-zinc-500">En gestión</p>
                    </div>

                    <div className="text-center sm:text-right">
                      <span className="font-black text-emerald-400 text-base">{adv.terminados}</span>
                      <p className="text-[10px] text-emerald-400/80 font-semibold">{adv.successRate}% éxito</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
