'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Cliente, TramiteMejoravit, TramiteRetiroDesempleo, TramiteAltaMedicaImss } from '@/types/cliente';
import { ClienteRadar, RadarViewMode } from '@/types/radar';
import { processRadarClients } from '@/utils/radarProcessor';
import { toast } from 'sonner';

import {
  RadarHeader,
  AdvisorOption,
  RadarKpiStrip,
  RadarProximosASalir,
  RadarProximasCitas,
  RadarColumnsView,
  RadarListView,
  RadarQuickPeekModal,
} from '@/components/dashboard/radar';

export default function RadarPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [clientesRaw, setClientesRaw] = useState<Cliente[]>([]);
  const [tramitesRetiro, setTramitesRetiro] = useState<TramiteRetiroDesempleo[]>([]);
  const [tramitesMejoravit, setTramitesMejoravit] = useState<TramiteMejoravit[]>([]);
  const [tramitesAltaMedica, setTramitesAltaMedica] = useState<TramiteAltaMedicaImss[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters & View State
  const [search, setSearch] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('todos');
  const [selectedTramite, setSelectedTramite] = useState('todos');
  const [activeStatusFilter, setActiveStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<RadarViewMode>('kanban');
  const [quickPeekCliente, setQuickPeekCliente] = useState<ClienteRadar | null>(null);

  const fetchRadarData = useCallback(async () => {
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

      const [clientesRes, retiroRes, mejoravitRes, altaMedicaRes, profilesRes] = await Promise.all([
        query.order('created_at', { ascending: false }),
        supabase.from('tramites_retiro_desempleo').select('*'),
        supabase.from('tramites_mejoravit').select('*'),
        supabase.from('tramites_alta_medica_imss').select('*'),
        supabase.from('profiles').select('id, name, email, role').order('name', { ascending: true }),
      ]);

      if (clientesRes.data) {
        setClientesRaw(clientesRes.data);
      }
      if (retiroRes.data) {
        setTramitesRetiro(retiroRes.data);
      }
      if (mejoravitRes.data) {
        setTramitesMejoravit(mejoravitRes.data);
      }
      if (altaMedicaRes.data) {
        setTramitesAltaMedica(altaMedicaRes.data);
      }
      if (profilesRes.data) {
        const staff = profilesRes.data.filter((p: any) => p.role === 'admin' || p.role === 'socios');
        setAdvisors(
          (staff.length > 0 ? staff : profilesRes.data).map((p: any) => ({
            id: p.id,
            name: p.name || p.email,
            email: p.email,
          }))
        );
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al cargar datos del Radar:', err);
      toast.error('No se pudieron actualizar los datos del radar.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRadarData();
  }, [fetchRadarData]);

  // Process all clients into rich radar models
  const processedRadarClientes = useMemo(() => {
    return processRadarClients(clientesRaw, tramitesRetiro, tramitesMejoravit, tramitesAltaMedica);
  }, [clientesRaw, tramitesRetiro, tramitesMejoravit, tramitesAltaMedica]);

  // Apply Search & Advisor & Tramite Filters
  const filteredClientes = useMemo(() => {
    return processedRadarClientes.filter((c) => {
      // 1. Advisor filter
      if (selectedAdvisor !== 'todos') {
        const advisorName = (c.creado_por_nombre || '').toLowerCase();
        if (advisorName !== selectedAdvisor.toLowerCase()) return false;
      }

      // 2. Tramite filter
      if (selectedTramite !== 'todos') {
        const hasTramite = c.tramites.some((t) => t.tipo === selectedTramite);
        if (!hasTramite) return false;
      }

      // 3. Status filter
      if (activeStatusFilter !== 'todos') {
        if (activeStatusFilter === 'punto_de_salir') {
          if (!c.isPuntoDeSalir) return false;
        } else {
          const clientStatus = (c.estado_cliente || 'interesado').toLowerCase();
          if (clientStatus !== activeStatusFilter) return false;
        }
      }

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName = c.nombreCompleto.toLowerCase();
        const curp = (c.curp || '').toLowerCase();
        const nss = (c.nss || '').toLowerCase();
        const tel = (c.telefono || '').toLowerCase();
        const adv = (c.creado_por_nombre || '').toLowerCase();
        const match =
          fullName.includes(q) ||
          curp.includes(q) ||
          nss.includes(q) ||
          tel.includes(q) ||
          adv.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [processedRadarClientes, selectedAdvisor, selectedTramite, activeStatusFilter, search]);

  // Status Change Handler
  const handleChangeClienteStatus = async (clienteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ estado_cliente: newStatus })
        .eq('id', clienteId);

      if (error) {
        toast.error('Error al actualizar estado: ' + error.message);
        return;
      }

      // Optimistic update
      setClientesRaw((prev) =>
        prev.map((c) => (c.id === clienteId ? { ...c, estado_cliente: newStatus } : c))
      );

      // Also update open quick peek if active
      if (quickPeekCliente && quickPeekCliente.id === clienteId) {
        setQuickPeekCliente((prev) => (prev ? { ...prev, estado_cliente: newStatus } : null));
      }

      toast.success('Estado actualizado correctamente');
    } catch (err: any) {
      console.error(err);
      toast.error('Error inesperado al guardar el estado');
    }
  };

  return (
    <div className="space-y-3 pb-4">
      {/* 1. Header Toolbar */}
      <RadarHeader
        totalClientes={filteredClientes.length}
        loading={loading}
        onRefresh={fetchRadarData}
        search={search}
        onSearchChange={setSearch}
        selectedAdvisor={selectedAdvisor}
        onAdvisorChange={setSelectedAdvisor}
        advisorsList={advisors}
        selectedTramite={selectedTramite}
        onTramiteChange={setSelectedTramite}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        lastUpdated={lastUpdated}
      />

      {/* 2. Compact KPI & Pipeline Strip */}
      <RadarKpiStrip
        clientes={processedRadarClientes}
        activeStatusFilter={activeStatusFilter}
        onSelectStatusFilter={setActiveStatusFilter}
      />

      {/* 3. Operational Highlights: A Punto de Salir & Próximas Citas (Side by side on large screens) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <RadarProximosASalir
          clientes={filteredClientes}
          onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
        />
        <RadarProximasCitas
          clientes={filteredClientes}
          onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
        />
      </div>

      {/* 4. Main Body: Kanban Columns or Compact List or Dedicated Citas */}
      {viewMode === 'kanban' && (
        <RadarColumnsView
          clientes={filteredClientes}
          onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
          onChangeClienteStatus={handleChangeClienteStatus}
        />
      )}

      {viewMode === 'compact' && (
        <RadarListView
          clientes={filteredClientes}
          onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
          onChangeClienteStatus={handleChangeClienteStatus}
        />
      )}

      {viewMode === 'citas' && (
        <div className="space-y-3">
          <RadarProximasCitas
            clientes={filteredClientes}
            onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
          />
          <RadarListView
            clientes={filteredClientes.filter((c) => c.cita && c.cita.fecha)}
            onOpenQuickPeek={(cli) => setQuickPeekCliente(cli)}
            onChangeClienteStatus={handleChangeClienteStatus}
          />
        </div>
      )}

      {/* 5. Quick Peek Modal (Slide-over overlay without page refresh) */}
      <RadarQuickPeekModal
        cliente={quickPeekCliente}
        onClose={() => setQuickPeekCliente(null)}
        onChangeClienteStatus={handleChangeClienteStatus}
      />
    </div>
  );
}
