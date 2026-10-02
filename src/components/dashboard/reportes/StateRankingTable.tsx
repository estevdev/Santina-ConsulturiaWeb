'use client';

import React from 'react';
import { StateMetrics } from '@/types/reportes';
import { Trophy, MapPin, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface StateRankingTableProps {
  statesMetrics: StateMetrics[];
  onSelectState: (state: StateMetrics) => void;
  totalNationalClients: number;
}

export function StateRankingTable({
  statesMetrics,
  onSelectState,
  totalNationalClients,
}: StateRankingTableProps) {
  // Sort states by total clients descending
  const sortedStates = [...statesMetrics].sort((a, b) => b.totalClientes - a.totalClientes);
  const activeStates = sortedStates.filter((s) => s.totalClientes > 0);
  const topCount = activeStates.length > 0 ? activeStates[0].totalClientes : 1;

  return (
    <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800/90 shadow-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">
              Ranking de Estados con Mayor Cartera
            </h3>
            <p className="text-xs text-zinc-400">
              Concentración territorial y distribución de clientes por entidad federativa.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-400">
          {activeStates.length} Estados con cartera activa
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Participación y Volumen</th>
              <th className="py-3 px-4 text-center">En Proceso</th>
              <th className="py-3 px-4 text-center">Concluidos</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {activeStates.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                  No hay estados con clientes registrados aún.
                </td>
              </tr>
            ) : (
              activeStates.slice(0, 10).map((st, idx) => {
                const pct =
                  totalNationalClients > 0
                    ? Math.round((st.totalClientes / totalNationalClients) * 100)
                    : 0;
                const barWidth = Math.max((st.totalClientes / topCount) * 100, 4);

                return (
                  <tr
                    key={st.id}
                    className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectState(st)}
                  >
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-zinc-950 shadow-sm'
                            : idx === 1
                            ? 'bg-zinc-300 text-zinc-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-[#dfba73] transition-colors">
                          {st.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {st.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 min-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">
                            {st.totalClientes} clientes
                          </span>
                          <span className="text-zinc-400 font-semibold">{pct}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#c5a059] to-[#dfba73] h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#dfba73]">
                        <Clock className="w-3 h-3" />
                        {st.enProceso}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {st.terminados}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectState(st);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-900 group-hover:bg-[#c5a059] group-hover:text-zinc-950 text-zinc-400 border border-zinc-800 group-hover:border-[#dfba73] transition-all inline-flex items-center gap-1 text-xs font-semibold"
                        title="Ver detalle del estado"
                      >
                        <span>Detalle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
