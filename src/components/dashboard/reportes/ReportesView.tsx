'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Cliente, TramiteMejoravit, TramiteRetiroDesempleo, TramiteAltaMedicaImss } from '@/types/cliente';
import {
  StateMetrics,
  OverviewMetrics,
  AdvisorMetrics,
  TimeRangeFilter,
} from '@/types/reportes';
import { ESTADOS_MEXICO } from '@/constants/estadosMexico';
import { MEXICO_STATES_DATA } from './mexicoStatesMapData';
import { InteractiveMexicoMap } from './InteractiveMexicoMap';
import { StateDetailModal } from './StateDetailModal';
import { ReportesKpiStrip } from './ReportesKpiStrip';
import { StateRankingTable } from './StateRankingTable';
import { TramitesDistributionChart } from './TramitesDistributionChart';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { AdvisorsPerformanceCard } from './AdvisorsPerformanceCard';
import { ReportFiltersBar } from './ReportFiltersBar';
import { BarChart3, TrendingUp, Sparkles, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export function ReportesView() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [clientesRaw, setClientesRaw] = useState<Cliente[]>([]);
  const [tramitesRetiro, setTramitesRetiro] = useState<TramiteRetiroDesempleo[]>([]);
  const [tramitesMejoravit, setTramitesMejoravit] = useState<TramiteMejoravit[]>([]);
  const [tramitesAltaMedica, setTramitesAltaMedica] = useState<TramiteAltaMedicaImss[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters & State selection
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [selectedState, setSelectedState] = useState<StateMetrics | null>(null);

  // Fetch all necessary analytical data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('clientes').select('*').is('deleted_at', null);

      if (user && user.role !== 'admin') {
        const conditions: string[] = [];
        if (user.id) conditions.push(`creado_por.eq.${user.id}`);
        if (user.email) conditions.push(`creado_por_email.eq.${user.email}`);
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      const [clientesRes, retiroRes, mejoravitRes, altaMedicaRes] = await Promise.all([
        query.order('created_at', { ascending: false }),
        supabase.from('tramites_retiro_desempleo').select('*'),
        supabase.from('tramites_mejoravit').select('*'),
        supabase.from('tramites_alta_medica_imss').select('*'),
      ]);

      if (clientesRes.data) setClientesRaw(clientesRes.data);
      if (retiroRes.data) setTramitesRetiro(retiroRes.data);
      if (mejoravitRes.data) setTramitesMejoravit(mejoravitRes.data);
      if (altaMedicaRes.data) setTramitesAltaMedica(altaMedicaRes.data);

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error al cargar datos de reportes:', err);
      toast.error('No se pudieron obtener todos los datos de métricas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply Time Range Filter
  const filteredClientes = useMemo(() => {
    if (timeRange === 'all') return clientesRaw;

    const now = new Date().getTime();
    let cutoff = 0;

    if (timeRange === '30d') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '90d') {
      cutoff = now - 90 * 24 * 60 * 60 * 1000;
    } else if (timeRange === 'year') {
      cutoff = new Date(new Date().getFullYear(), 0, 1).getTime();
    }

    return clientesRaw.filter((c) => {
      if (!c.created_at) return true;
      return new Date(c.created_at).getTime() >= cutoff;
    });
  }, [clientesRaw, timeRange]);

  // Fast Lookup Maps for Trámites by Client ID
  const tramitesByClient = useMemo(() => {
    const map: Record<
      string,
      { retiro?: TramiteRetiroDesempleo; mejoravit?: TramiteMejoravit; altaMedica?: TramiteAltaMedicaImss }
    > = {};

    tramitesRetiro.forEach((t) => {
      if (!map[t.cliente_id]) map[t.cliente_id] = {};
      map[t.cliente_id].retiro = t;
    });

    tramitesMejoravit.forEach((t) => {
      if (!map[t.cliente_id]) map[t.cliente_id] = {};
      map[t.cliente_id].mejoravit = t;
    });

    tramitesAltaMedica.forEach((t) => {
      if (!map[t.cliente_id]) map[t.cliente_id] = {};
      map[t.cliente_id].altaMedica = t;
    });

    return map;
  }, [tramitesRetiro, tramitesMejoravit, tramitesAltaMedica]);

  // Compute Aggregations for each Mexican State
  const statesMetricsMap = useMemo(() => {
    const map: Record<string, StateMetrics> = {};

    // 1. Initialize all 32 Mexican states
    MEXICO_STATES_DATA.forEach((s) => {
      map[s.name] = {
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
      };
    });

    const total = filteredClientes.length;

    // 2. Distribute clients into their assigned states
    filteredClientes.forEach((cli) => {
      // Normalize state name
      let stName = cli.estado?.trim() || 'Jalisco';
      // Find matching state or fallback
      let target = map[stName];
      if (!target) {
        // Try loose matching
        const foundKey = Object.keys(map).find(
          (k) => k.toLowerCase() === stName.toLowerCase()
        );
        if (foundKey) target = map[foundKey];
      }

      if (!target) {
        // Default to Jalisco if unmatched
        target = map['Jalisco'];
      }

      if (target) {
        target.totalClientes += 1;
        target.clientes.push(cli);

        const status = (cli.estado_cliente || 'interesado').toLowerCase();
        if (status === 'interesado') target.interesados += 1;
        else if (status === 'en_proceso') target.enProceso += 1;
        else if (status === 'documentacion_pendiente') target.docPendiente += 1;
        else if (status === 'cita_programada') target.citaProgramada += 1;
        else if (status === 'terminado') target.terminados += 1;
        else if (status === 'cancelado') target.cancelados += 1;

        // Trámite counts
        const tr = tramitesByClient[cli.id];
        if (tr?.retiro) target.tramites.retiro += 1;
        if (tr?.mejoravit) target.tramites.mejoravit += 1;
        if (tr?.altaMedica) target.tramites.altaMedica += 1;
        if (!tr?.retiro && !tr?.mejoravit && !tr?.altaMedica) target.tramites.sinTramite += 1;
      }
    });

    // 3. Calculate percentages
    Object.values(map).forEach((m) => {
      m.percentageOfTotal = total > 0 ? Math.round((m.totalClientes / total) * 100) : 0;
    });

    return map;
  }, [filteredClientes, tramitesByClient]);

  // Overall Global Executive Metrics
  const overviewMetrics = useMemo<OverviewMetrics>(() => {
    const total = filteredClientes.length;
    let interesados = 0;
    let enProceso = 0;
    let docPendiente = 0;
    let citas = 0;
    let terminados = 0;
    let cancelados = 0;

    filteredClientes.forEach((c) => {
      const s = (c.estado_cliente || 'interesado').toLowerCase();
      if (s === 'interesado') interesados += 1;
      else if (s === 'en_proceso') enProceso += 1;
      else if (s === 'documentacion_pendiente') docPendiente += 1;
      else if (s === 'cita_programada') citas += 1;
      else if (s === 'terminado') terminados += 1;
      else if (s === 'cancelado') cancelados += 1;
    });

    const activeClientes = total - cancelados;
    const statesCovered = Object.values(statesMetricsMap).filter((m) => m.totalClientes > 0).length;
    const nationalCoveragePercent = Math.round((statesCovered / 32) * 100);

    const closed = terminados + cancelados;
    const successRate = closed > 0 ? Math.round((terminados / closed) * 100) : 100;

    const filteredClientIds = new Set(filteredClientes.map((c) => c.id));
    const activeRetiros = tramitesRetiro.filter((t) => filteredClientIds.has(t.cliente_id)).length;
    const activeMejoravits = tramitesMejoravit.filter((t) => filteredClientIds.has(t.cliente_id)).length;
    const activeAltas = tramitesAltaMedica.filter((t) => filteredClientIds.has(t.cliente_id)).length;

    return {
      totalClientes: total,
      activeClientes,
      statesCovered,
      statesTotal: 32,
      nationalCoveragePercent,
      totalTerminados: terminados,
      totalEnProceso: enProceso,
      totalDocPendiente: docPendiente,
      totalCitasProgramadas: citas,
      totalInteresados: interesados,
      totalCancelados: cancelados,
      successRate,
      totalTramites: activeRetiros + activeMejoravits + activeAltas,
      tramitesRetiro: activeRetiros,
      tramitesMejoravit: activeMejoravits,
      tramitesAltaMedica: activeAltas,
    };
  }, [filteredClientes, statesMetricsMap, tramitesRetiro, tramitesMejoravit, tramitesAltaMedica]);

  // Advisor Metrics
  const advisorsMetrics = useMemo<AdvisorMetrics[]>(() => {
    const map: Record<string, AdvisorMetrics> = {};

    filteredClientes.forEach((c) => {
      const advName = c.creado_por_nombre || 'Asesor General';
      if (!map[advName]) {
        map[advName] = {
          name: advName,
          email: c.creado_por_email || undefined,
          totalClients: 0,
          terminados: 0,
          enProceso: 0,
          docPendiente: 0,
          citas: 0,
          successRate: 0,
        };
      }

      map[advName].totalClients += 1;
      const s = (c.estado_cliente || 'interesado').toLowerCase();
      if (s === 'terminado') map[advName].terminados += 1;
      else if (s === 'en_proceso') map[advName].enProceso += 1;
      else if (s === 'documentacion_pendiente') map[advName].docPendiente += 1;
      else if (s === 'cita_programada') map[advName].citas += 1;
    });

    Object.values(map).forEach((a) => {
      a.successRate =
        a.totalClients > 0 ? Math.round((a.terminados / a.totalClients) * 100) : 0;
    });

    return Object.values(map);
  }, [filteredClientes]);

  // Export full CSV report of all clients with state & trámites
  const handleExportCsv = () => {
    if (filteredClientes.length === 0) {
      toast.info('No hay clientes en el periodo seleccionado para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Nombre',
      'Apellido Paterno',
      'Apellido Materno',
      'Estado de la República',
      'Estatus del Cliente',
      'NSS',
      'CURP',
      'Teléfono',
      'Email',
      'Asesor Responsable',
      'Trámites Activos',
      'Fecha Registro',
    ];

    const rows = filteredClientes.map((c) => {
      const tr = tramitesByClient[c.id];
      const tramitesList: string[] = [];
      if (tr?.retiro) tramitesList.push('Retiro Desempleo');
      if (tr?.mejoravit) tramitesList.push('Mejoravit');
      if (tr?.altaMedica) tramitesList.push('Alta IMSS');

      return [
        `"${c.id}"`,
        `"${(c.nombre || '').replace(/"/g, '""')}"`,
        `"${(c.apellido_paterno || '').replace(/"/g, '""')}"`,
        `"${(c.apellido_materno || '').replace(/"/g, '""')}"`,
        `"${(c.estado || 'No especificado').replace(/"/g, '""')}"`,
        `"${(c.estado_cliente || 'interesado').replace(/"/g, '""')}"`,
        `"${c.nss || ''}"`,
        `"${c.curp || ''}"`,
        `"${c.telefono || ''}"`,
        `"${c.email || ''}"`,
        `"${(c.creado_por_nombre || 'Asesor').replace(/"/g, '""')}"`,
        `"${tramitesList.join('; ') || 'Sin trámite'}"`,
        `"${c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-clientes-santina-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Reporte exportado exitosamente a formato CSV');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-[#181611] to-zinc-950 border border-zinc-800/90 p-5 sm:p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#dfba73]" />
                Panel Administrativo
              </span>
              <span className="text-xs text-zinc-500 font-medium">Santina Consultoría</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              Reportes & Métricas Estratégicas
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Monitoreo geográfico integral de la República Mexicana, distribución de cartera por entidad federativa, embudo de conversión y rendimiento operativo.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Cobertura Territorial
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#dfba73]">
                {overviewMetrics.nationalCoveragePercent}%
              </span>
              <span className="text-[10px] text-zinc-500 block">
                {overviewMetrics.statesCovered} de 32 estados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar & Period Filters */}
      <ReportFiltersBar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrint}
        onRefresh={fetchData}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* 3. Executive KPI Strip */}
      <ReportesKpiStrip metrics={overviewMetrics} />

      {/* 4. Interactive Geographic Map of Mexico */}
      <section className="space-y-2">
        <InteractiveMexicoMap
          statesMetricsMap={statesMetricsMap}
          selectedStateId={selectedState ? selectedState.id : null}
          onSelectState={(st) => setSelectedState(st)}
          totalNationalClients={overviewMetrics.totalClientes}
        />
      </section>

      {/* 5. Grid: Top States Ranking & Conversion Funnel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StateRankingTable
          statesMetrics={Object.values(statesMetricsMap)}
          onSelectState={(st) => setSelectedState(st)}
          totalNationalClients={overviewMetrics.totalClientes}
        />
        <ConversionFunnelChart metrics={overviewMetrics} />
      </section>

      {/* 6. Grid: Trámites Distribution & Advisors Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TramitesDistributionChart metrics={overviewMetrics} />
        <AdvisorsPerformanceCard advisorsMetrics={advisorsMetrics} />
      </section>

      {/* 7. Modal for State Detail Breakdown */}
      <StateDetailModal
        stateMetrics={selectedState}
        onClose={() => setSelectedState(null)}
        totalNationalClients={overviewMetrics.totalClientes}
      />
    </div>
  );
}
