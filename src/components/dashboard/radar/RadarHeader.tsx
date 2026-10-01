'use client';

import React from 'react';
import {
  Radar,
  Search,
  RefreshCw,
  Columns,
  ListFilter,
  CalendarDays,
  UserCheck,
  Briefcase,
  X,
} from 'lucide-react';
import { RadarViewMode } from '@/types/radar';

export interface AdvisorOption {
  id: string;
  name: string;
  email: string;
}

interface RadarHeaderProps {
  totalClientes: number;
  loading: boolean;
  onRefresh: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedAdvisor: string;
  onAdvisorChange: (val: string) => void;
  advisorsList: AdvisorOption[];
  selectedTramite: string;
  onTramiteChange: (val: string) => void;
  viewMode: RadarViewMode;
  onViewModeChange: (mode: RadarViewMode) => void;
  lastUpdated: Date | null;
}

export function RadarHeader({
  totalClientes,
  loading,
  onRefresh,
  search,
  onSearchChange,
  selectedAdvisor,
  onAdvisorChange,
  advisorsList,
  selectedTramite,
  onTramiteChange,
  viewMode,
  onViewModeChange,
  lastUpdated,
}: RadarHeaderProps) {
  const formatTime = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#0d0e12] border border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c5a059]/20 to-[#dfba73]/10 border border-[#c5a059]/40 flex items-center justify-center text-[#dfba73] shadow-md shadow-[#c5a059]/10 shrink-0">
            <Radar className="w-5 h-5 text-[#dfba73] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Radar de Clientes
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  360° En Vivo
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>{totalClientes} {totalClientes === 1 ? 'cliente activo' : 'clientes activos'}</span>
              {lastUpdated && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-[11px] text-zinc-400">Actualizado {formatTime(lastUpdated)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Filters & Actions Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, CURP..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#c5a059] transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Advisor */}
          <div className="relative shrink-0">
            <select
              value={selectedAdvisor}
              onChange={(e) => onAdvisorChange(e.target.value)}
              className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#c5a059] cursor-pointer"
              title="Filtrar por Asesor"
            >
              <option value="todos">Todos los Asesores</option>
              {advisorsList.map((adv) => (
                <option key={adv.id} value={adv.name}>
                  {adv.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Tramite */}
          <div className="relative shrink-0">
            <select
              value={selectedTramite}
              onChange={(e) => onTramiteChange(e.target.value)}
              className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#c5a059] cursor-pointer"
              title="Filtrar por Trámite"
            >
              <option value="todos">Todos los Trámites</option>
              <option value="mejoravit">Crédito Mejoravit</option>
              <option value="retiro_desempleo">Retiro AFORE</option>
              <option value="alta_medica">Alta Médica IMSS</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Columnas / Matriz de Estados"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'compact'
                  ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Lista Ejecutiva"
            >
              <ListFilter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('citas')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'citas'
                  ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Agenda de Citas"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:text-white transition-all disabled:opacity-50 shrink-0"
            title="Refrescar datos en vivo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#c5a059]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
