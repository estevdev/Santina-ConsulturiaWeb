'use client';

import React from 'react';
import { TimeRangeFilter } from '@/types/reportes';
import {
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Filter,
  BarChart3,
} from 'lucide-react';

interface ReportFiltersBarProps {
  timeRange: TimeRangeFilter;
  onTimeRangeChange: (range: TimeRangeFilter) => void;
  onExportCsv: () => void;
  onPrintReport: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
}

export function ReportFiltersBar({
  timeRange,
  onTimeRangeChange,
  onExportCsv,
  onPrintReport,
  onRefresh,
  loading,
  lastUpdated,
}: ReportFiltersBarProps) {
  const timePresets: { id: TimeRangeFilter; label: string }[] = [
    { id: 'all', label: 'Histórico Completo' },
    { id: '30d', label: 'Últimos 30 Días' },
    { id: '90d', label: 'Último Trimestre' },
    { id: 'year', label: 'Año en Curso' },
  ];

  return (
    <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
      {/* Time Range Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-400 mr-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
          Periodo:
        </span>
        {timePresets.map((preset) => {
          const isActive = timeRange === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onTimeRangeChange(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold shadow-md shadow-[#c5a059]/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Action Buttons: Export CSV, Print, Refresh */}
      <div className="flex items-center gap-2">
        {lastUpdated && (
          <span className="text-[11px] text-zinc-500 hidden xl:inline">
            Actualizado: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#c5a059]' : ''}`} />
        </button>

        <button
          onClick={onExportCsv}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#c5a059]/40 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          title="Descargar reporte detallado de clientes y estados en archivo CSV"
        >
          <Download className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Exportar CSV</span>
        </button>

        <button
          onClick={onPrintReport}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          title="Imprimir o guardar como PDF"
        >
          <Printer className="w-3.5 h-3.5 text-zinc-400" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
}
