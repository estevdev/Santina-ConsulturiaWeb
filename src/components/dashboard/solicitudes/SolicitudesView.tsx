'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Inbox, 
  Search, 
  RefreshCw, 
  Filter, 
  X, 
  CheckCircle2, 
  Building2, 
  ArrowUpDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { SolicitudContacto, EstadoSolicitud } from '@/types/solicitud';
import { SolicitudesMetrics } from './SolicitudesMetrics';
import { SolicitudCard } from './SolicitudCard';

export function SolicitudesView() {
  const { user } = useAuth();
  const supabase = createClient();

  const [solicitudes, setSolicitudes] = useState<SolicitudContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tramiteFilter, setTramiteFilter] = useState('todos');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch data
  const fetchSolicitudes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/solicitudes');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener solicitudes');
      }

      setSolicitudes(data.solicitudes || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al cargar las solicitudes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: EstadoSolicitud) => {
    try {
      // Optimistic update
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: newStatus } : s))
      );

      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el estado');

      toast.success(`Estado actualizado a: ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar estado');
      fetchSolicitudes(); // Rollback
    }
  };

  // Handle notes update
  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, notas_admin: notes } : s))
      );

      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notas_admin: notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron guardar las notas');

      toast.success('Notas guardadas correctamente');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar notas');
      fetchSolicitudes();
    }
  };

  // Handle Convert to Client
  const handleConvertToClient = async (solicitud: SolicitudContacto) => {
    if (!confirm(`¿Deseas dar de alta a "${solicitud.nombre}" como Cliente formal en la plataforma?`)) {
      return;
    }

    setConvertingId(solicitud.id);
    try {
      // 1. Insert into clientes table
      const { data: newCliente, error: insertError } = await supabase
        .from('clientes')
        .insert({
          nombre: solicitud.nombre,
          telefono: solicitud.telefono,
          email: solicitud.email || null,
          estado: solicitud.estado_republica || null,
          estado_cliente: 'interesado',
          notas: `Origen: Landing Page (${solicitud.tramite_interes}).\n${solicitud.mensaje ? `Consulta: ${solicitud.mensaje}\n` : ''}${solicitud.notas_admin ? `Notas: ${solicitud.notas_admin}` : ''}`,
          creado_por: user?.id || null,
          creado_por_nombre: user?.name || user?.email || null,
          creado_por_email: user?.email || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Error al crear cliente');
      }

      // 2. Update solicitud to 'convertido' with cliente_id
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitud.id,
          estado: 'convertido',
          cliente_id: newCliente.id,
        }),
      });

      if (!res.ok) {
        console.warn('Cliente creado pero no se vinculó a la solicitud');
      }

      // 3. Update local state
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitud.id
            ? { ...s, estado: 'convertido', cliente_id: newCliente.id }
            : s
        )
      );

      toast.success(`¡${solicitud.nombre} fue convertido a Cliente con éxito!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al convertir cliente');
    } finally {
      setConvertingId(null);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud de contacto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSolicitudes((prev) => prev.filter((s) => s.id !== id));

      const res = await fetch(`/api/solicitudes?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar la solicitud');
      toast.success('Solicitud eliminada');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al eliminar');
      fetchSolicitudes();
    }
  };

  // Filtered list
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((s) => {
      // Status filter
      if (statusFilter !== 'todos' && s.estado !== statusFilter) {
        return false;
      }

      // Tramite filter
      if (tramiteFilter !== 'todos' && s.tramite_interes !== tramiteFilter) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = s.nombre.toLowerCase().includes(q);
        const matchesPhone = s.telefono.includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q) || false;
        const matchesEstado = s.estado_republica?.toLowerCase().includes(q) || false;
        const matchesMensaje = s.mensaje?.toLowerCase().includes(q) || false;
        const matchesNotas = s.notas_admin?.toLowerCase().includes(q) || false;

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesEstado && !matchesMensaje && !matchesNotas) {
          return false;
        }
      }

      return true;
    });
  }, [solicitudes, statusFilter, tramiteFilter, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#dfba73]">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Solicitudes Web
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#dfba73]">
                  Landing Page
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prospectos y diagnósticos gratuitos registrados desde el formulario público de la Landing.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {lastRefreshed && (
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
              Actualizado: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchSolicitudes(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#c5a059]' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Refrescar'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <SolicitudesMetrics
        solicitudes={solicitudes}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Search & Filters Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono, correo, estado o notas..."
              className="w-full pl-10 pr-9 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Trámite */}
          <div className="sm:w-64">
            <select
              value={tramiteFilter}
              onChange={(e) => setTramiteFilter(e.target.value)}
              className="w-full py-2 px-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] cursor-pointer"
            >
              <option value="todos">Todos los Trámites</option>
              <option value="retiro_desempleo">Retiro por Desempleo AFORE</option>
              <option value="mejoravit">Crédito Mejoravit</option>
              <option value="alta_medica_imss">Alta Médica IMSS</option>
              <option value="otro">Asesoría / Otro</option>
            </select>
          </div>
        </div>

        {/* Quick summary line */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
          <span>
            Mostrando <strong className="text-white">{filteredSolicitudes.length}</strong> de{' '}
            <strong className="text-zinc-300">{solicitudes.length}</strong> solicitudes
          </span>

          {(statusFilter !== 'todos' || tramiteFilter !== 'todos' || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('todos');
                setTramiteFilter('todos');
                setSearch('');
              }}
              className="text-xs text-[#dfba73] hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse p-6 space-y-4"
            >
              <div className="h-4 bg-zinc-800 rounded w-1/3" />
              <div className="h-6 bg-zinc-800/80 rounded w-2/3" />
              <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredSolicitudes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/30 border border-zinc-800/60 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            No se encontraron solicitudes
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search || statusFilter !== 'todos' || tramiteFilter !== 'todos'
              ? 'Intenta ajustar los filtros de búsqueda o restablecerlos.'
              : 'Aún no se han recibido solicitudes a través del formulario de la landing page.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSolicitudes.map((solicitud) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              onUpdateStatus={handleUpdateStatus}
              onUpdateNotes={handleUpdateNotes}
              onConvertToClient={handleConvertToClient}
              onDelete={handleDelete}
              isConverting={convertingId === solicitud.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
