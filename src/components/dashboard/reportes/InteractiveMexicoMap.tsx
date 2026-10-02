'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  MEXICO_STATES_DATA,
  MEXICO_MAP_VIEWBOX,
  MexicoStatePath,
} from './mexicoStatesMapData';
import { StateMetrics } from '@/types/reportes';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface InteractiveMexicoMapProps {
  statesMetricsMap: Record<string, StateMetrics>;
  selectedStateId: string | null;
  onSelectState: (state: StateMetrics | null) => void;
  statusFilter?: string;
  totalNationalClients: number;
}

export function InteractiveMexicoMap({
  statesMetricsMap,
  selectedStateId,
  onSelectState,
  statusFilter = 'todos',
  totalNationalClients,
}: InteractiveMexicoMapProps) {
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredState, setHoveredState] = useState<MexicoStatePath | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Maximum clients in any single state for relative choropleth scaling
  const maxClientsInAState = useMemo(() => {
    let max = 1;
    Object.values(statesMetricsMap).forEach((m) => {
      if (m.totalClientes > max) max = m.totalClientes;
    });
    return max;
  }, [statesMetricsMap]);

  // Color generator for heatmap based on client density
  const getStateColors = (stateName: string, isSelected: boolean, isHovered: boolean) => {
    const metrics = statesMetricsMap[stateName];
    const count = metrics ? metrics.totalClientes : 0;

    if (isSelected) {
      return {
        fill: '#dfba73',
        stroke: '#fef08a',
        strokeWidth: 2.5,
        opacity: 1,
        filter: 'drop-shadow(0 0 10px rgba(223, 186, 115, 0.7))',
      };
    }

    if (isHovered) {
      return {
        fill: count > 0 ? '#c5a059' : '#3f3f46',
        stroke: '#ffffff',
        strokeWidth: 2,
        opacity: 1,
        filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))',
      };
    }

    if (count === 0) {
      return {
        fill: '#18181b', // dark zinc
        stroke: '#27272a',
        strokeWidth: 0.8,
        opacity: 0.85,
        filter: 'none',
      };
    }

    // Gradient based on density relative to maximum
    const ratio = Math.min(count / maxClientsInAState, 1);
    if (ratio > 0.7) {
      return {
        fill: '#d4af37', // Gold vibrant
        stroke: '#fef08a',
        strokeWidth: 1.4,
        opacity: 0.95,
        filter: 'drop-shadow(0 0 4px rgba(197, 160, 89, 0.3))',
      };
    } else if (ratio > 0.4) {
      return {
        fill: '#b8923a',
        stroke: '#dfba73',
        strokeWidth: 1.2,
        opacity: 0.9,
        filter: 'none',
      };
    } else if (ratio > 0.15) {
      return {
        fill: '#856627',
        stroke: '#a17a2d',
        strokeWidth: 1.0,
        opacity: 0.85,
        filter: 'none',
      };
    } else {
      return {
        fill: '#524019',
        stroke: '#73571f',
        strokeWidth: 0.9,
        opacity: 0.8,
        filter: 'none',
      };
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.8));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Hover position tracking
  const handleMouseMove = (e: React.MouseEvent, stateItem: MexicoStatePath) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredState(stateItem);
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
    setTooltipPos(null);
  };

  // Filtered states list for quick navigation dropdown
  const filteredStatesForSearch = useMemo(() => {
    if (!searchQuery.trim()) return MEXICO_STATES_DATA;
    return MEXICO_STATES_DATA.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // States with clients list
  const activeStatesCount = useMemo(() => {
    return Object.values(statesMetricsMap).filter((m) => m.totalClientes > 0).length;
  }, [statesMetricsMap]);

  return (
    <div className="bg-[#0d0e12] dark:bg-[#0d0e12] rounded-2xl border border-zinc-800/90 shadow-xl overflow-hidden flex flex-col">
      {/* Top Bar: Title & Search & Interactive Filters */}
      <div className="p-4 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">
                  Mapa Geográfico de la República Mexicana
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                  {activeStatesCount} / 32 Estados con Clientes
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Interactúa con cada entidad federativa para inspeccionar cartera, trámites y clientes asignados.
              </p>
            </div>
          </div>
        </div>

        {/* Search & State Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c5a059] transition-all"
            />
          </div>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showLabels
                ? 'bg-[#c5a059]/15 text-[#dfba73] border-[#c5a059]/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Mostrar u ocultar conteos numéricos en el mapa"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insignias</span>
          </button>

          {/* Quick Zoom Tools */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Acercar mapa (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Alejar mapa (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Restablecer vista"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[460px] max-h-[580px] w-full bg-[#0a0a0d] overflow-hidden select-none flex items-center justify-center p-2"
      >
        {/* Subtle Map Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG Map Container */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox={MEXICO_MAP_VIEWBOX}
            className="w-full h-full max-h-[540px] drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))' }}
          >
            {/* Draw All 32 State Vector Paths */}
            {MEXICO_STATES_DATA.map((stateItem) => {
              const isSelected = selectedStateId === stateItem.id;
              const isHovered = hoveredState?.id === stateItem.id;
              const styles = getStateColors(stateItem.name, isSelected, isHovered);
              const metrics = statesMetricsMap[stateItem.name];
              const clientCount = metrics ? metrics.totalClientes : 0;

              return (
                <g key={stateItem.id} className="cursor-pointer group">
                  <path
                    id={`state-${stateItem.id}`}
                    d={stateItem.d}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeWidth={styles.strokeWidth}
                    opacity={styles.opacity}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: styles.filter,
                    }}
                    onClick={() => {
                      if (metrics) {
                        onSelectState(isSelected ? null : metrics);
                      } else {
                        // Empty state placeholder
                        onSelectState({
                          id: stateItem.id,
                          name: stateItem.name,
                          totalClientes: 0,
                          percentageOfTotal: 0,
                          interesados: 0,
                          enProceso: 0,
                          docPendiente: 0,
                          citaProgramada: 0,
                          terminados: 0,
                          cancelados: 0,
                          tramites: { retiro: 0, mejoravit: 0, altaMedica: 0, sinTramite: 0 },
                          clientes: [],
                        });
                      }
                    }}
                    onMouseMove={(e) => handleMouseMove(e, stateItem)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Marker badge over state center if it has clients and labels are active */}
                  {showLabels && clientCount > 0 && (
                    <g
                      transform={`translate(${stateItem.center.x}, ${stateItem.center.y})`}
                      className="pointer-events-none"
                    >
                      {/* Badge Glow Aura */}
                      <circle
                        r={clientCount > 9 ? 13 : 11}
                        fill="#000000"
                        opacity={0.7}
                        className="filter drop-shadow-md"
                      />
                      <circle
                        r={clientCount > 9 ? 11 : 9.5}
                        fill={isSelected ? '#dfba73' : '#c5a059'}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                      <text
                        textAnchor="middle"
                        dy=".35em"
                        fill="#09090b"
                        fontSize={clientCount > 99 ? '9px' : '10px'}
                        fontWeight="800"
                        fontFamily="system-ui, sans-serif"
                      >
                        {clientCount}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Tooltip */}
        {hoveredState && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-75 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
            }}
          >
            <div className="bg-zinc-950/95 backdrop-blur-md border border-[#c5a059]/40 rounded-xl p-3 shadow-2xl text-left min-w-[210px] text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
                <span className="font-bold text-white text-sm tracking-tight">
                  {hoveredState.name}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {hoveredState.id}
                </span>
              </div>

              {(() => {
                const met = statesMetricsMap[hoveredState.name];
                const count = met ? met.totalClientes : 0;
                const pct = totalNationalClients > 0
                  ? Math.round((count / totalNationalClients) * 100)
                  : 0;

                if (count === 0) {
                  return (
                    <div className="text-zinc-500 py-1 text-center">
                      <p className="text-[11px]">Sin clientes asignados aún</p>
                      <span className="text-[10px] text-[#c5a059]">Clic para ver estado</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Total Cartera:</span>
                      <span className="font-bold text-white text-sm">
                        {count} <span className="text-[10px] text-[#c5a059]">({pct}%)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-zinc-900">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Terminados: {met.terminados}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#dfba73]">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>En Proceso: {met.enProceso}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>Doc. Pend: {met.docPendiente}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <span>Citas: {met.citaProgramada}</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Retiro: {met.tramites.retiro}</span>
                      <span>Mejoravit: {met.tramites.mejoravit}</span>
                      <span>IMSS: {met.tramites.altaMedica}</span>
                    </div>

                    <p className="text-[10px] text-[#c5a059] font-medium text-center pt-1 animate-pulse">
                      Haz clic para abrir detalle completo
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Bottom Floating Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-zinc-950/85 backdrop-blur-md p-2 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 flex flex-wrap items-center gap-3 shadow-lg">
          <span className="font-bold text-zinc-200 uppercase tracking-wider text-[9px]">
            Densidad de Clientes:
          </span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#18181b] border border-zinc-700" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#524019] border border-[#73571f]" />
            <span>1 - 2</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#856627] border border-[#a17a2d]" />
            <span>3 - 6</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#b8923a] border border-[#dfba73]" />
            <span>7 - 15</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#d4af37] border border-[#fef08a]" />
            <span>16+</span>
          </div>
        </div>

        {/* Selected State Toast/Indicator in top left corner */}
        {selectedStateId && (
          <div className="absolute top-3 left-3 z-10 bg-[#c5a059]/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#c5a059]/40 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#dfba73] animate-ping" />
            <span className="text-xs font-bold text-[#dfba73]">
              Estado Seleccionado: {MEXICO_STATES_DATA.find((s) => s.id === selectedStateId)?.name}
            </span>
            <button
              onClick={() => onSelectState(null)}
              className="text-[10px] text-zinc-400 hover:text-white underline ml-1 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Quick State Pills Strip for immediate click access to any state */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
            Acceso Rápido por Estado ({filteredStatesForSearch.length})
          </span>
          <span className="text-[10px] text-zinc-500">
            Selecciona un estado para ver sus métricas específicas
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredStatesForSearch.map((s) => {
            const met = statesMetricsMap[s.name];
            const count = met ? met.totalClientes : 0;
            const isSelected = selectedStateId === s.id;

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (met) {
                    onSelectState(isSelected ? null : met);
                  } else {
                    onSelectState({
                      id: s.id,
                      name: s.name,
                      totalClientes: 0,
                      percentageOfTotal: 0,
                      interesados: 0,
                      enProceso: 0,
                      docPendiente: 0,
                      citaProgramada: 0,
                      terminados: 0,
                      cancelados: 0,
                      tramites: { retiro: 0, mejoravit: 0, altaMedica: 0, sinTramite: 0 },
                      clientes: [],
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? 'bg-[#c5a059] text-zinc-950 font-bold border-[#dfba73] shadow-md shadow-[#c5a059]/20'
                    : count > 0
                    ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-[#c5a059]/30 hover:border-[#c5a059]'
                    : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                <span>{s.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-zinc-950 text-[#dfba73]'
                        : 'bg-[#c5a059]/20 text-[#dfba73]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
