'use client';

import React, { useState } from 'react';
import { StateMetrics } from '@/types/reportes';
import { Cliente } from '@/types/cliente';
import { getEstadoClienteConfig } from '@/constants/estadosCliente';
import Link from 'next/link';
import {
  X,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
  Search,
  FileText,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

interface StateDetailModalProps {
  stateMetrics: StateMetrics | null;
  onClose: () => void;
  totalNationalClients: number;
}

export function StateDetailModal({
  stateMetrics,
  onClose,
  totalNationalClients,
}: StateDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  if (!stateMetrics) return null;

  const pct =
    totalNationalClients > 0
      ? Math.round((stateMetrics.totalClientes / totalNationalClients) * 100)
      : 0;

  const successRate =
    stateMetrics.totalClientes > 0
      ? Math.round((stateMetrics.terminados / stateMetrics.totalClientes) * 100)
      : 0;

  const filteredClients = stateMetrics.clientes.filter((c) => {
    // 1. Status filter
    if (filterStatus !== 'todos') {
      const s = (c.estado_cliente || 'interesado').toLowerCase();
      if (s !== filterStatus) return false;
    }
    // 2. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.toLowerCase();
      const nss = (c.nss || '').toLowerCase();
      const curp = (c.curp || '').toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      const adv = (c.creado_por_nombre || '').toLowerCase();
      return (
        name.includes(q) ||
        nss.includes(q) ||
        curp.includes(q) ||
        tel.includes(q) ||
        adv.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#0e0f14] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-[#c5a059]/20">
              {stateMetrics.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {stateMetrics.name}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                  {pct}% del Total Nacional
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Desglose analítico de cartera, trámites y clientes activos en esta entidad federativa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Total Clientes</span>
                <Users className="w-4 h-4 text-[#dfba73]" />
              </div>
              <div className="text-2xl font-black text-white">{stateMetrics.totalClientes}</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">{pct}% de la cartera en México</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">En Proceso Activo</span>
                <Clock className="w-4 h-4 text-[#c5a059]" />
              </div>
              <div className="text-2xl font-black text-[#dfba73]">{stateMetrics.enProceso}</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Gestiones en curso</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Terminados / Éxito</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{stateMetrics.terminados}</div>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">{successRate}% tasa de conclusión</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Citas / Doc. Pend.</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300">
                {stateMetrics.citaProgramada} <span className="text-xs text-zinc-500 font-normal">citas</span>
              </div>
              <p className="text-[10px] text-amber-400 mt-0.5">
                {stateMetrics.docPendiente} con doc. pendiente
              </p>
            </div>
          </div>

          {/* Trámites breakdown in this state */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#c5a059]" />
              Distribución de Trámites en {stateMetrics.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium">Retiro por Desempleo</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">{stateMetrics.tramites.retiro}</span>
                  <span className="text-[11px] text-[#dfba73]">AFORE IMSS</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium">Crédito Mejoravit</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">{stateMetrics.tramites.mejoravit}</span>
                  <span className="text-[11px] text-purple-400">Infonavit</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium">Alta Médica IMSS</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">{stateMetrics.tramites.altaMedica}</span>
                  <span className="text-[11px] text-emerald-400">Clínica / Patronal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client List Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#c5a059]" />
                  Clientes Registrados en {stateMetrics.name} ({filteredClients.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Selecciona cualquier cliente para abrir su expediente o dar seguimiento.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="interesado">Interesados</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="documentacion_pendiente">Doc. Pendiente</option>
                  <option value="cita_programada">Cita Programada</option>
                  <option value="terminado">Terminados</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {stateMetrics.totalClientes === 0 ? (
              <div className="p-8 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sin clientes en {stateMetrics.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Actualmente no hay clientes asignados a esta entidad federativa. Puedes dar de alta un nuevo cliente y asignarle este estado.
                  </p>
                </div>
                <Link
                  href="/dashboard/clientes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold text-xs shadow-md shadow-[#c5a059]/20 hover:scale-[1.02] transition-transform"
                >
                  Ir a Gestión de Clientes
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-6 text-center bg-zinc-900/20 rounded-xl border border-zinc-800 text-zinc-400 text-xs">
                No se encontraron clientes que coincidan con la búsqueda o el filtro seleccionado.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                {filteredClients.map((cli) => {
                  const cfg = getEstadoClienteConfig(cli.estado_cliente);
                  const fullName = `${cli.nombre || ''} ${cli.apellido_paterno || ''} ${cli.apellido_materno || ''}`.trim();

                  return (
                    <div
                      key={cli.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {fullName || 'Cliente Sin Nombre'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                          {cli.nss && (
                            <span>
                              <strong className="text-zinc-500">NSS:</strong> {cli.nss}
                            </span>
                          )}
                          {cli.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              {cli.telefono}
                            </span>
                          )}
                          {cli.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-zinc-500" />
                              {cli.email}
                            </span>
                          )}
                          {cli.creado_por_nombre && (
                            <span className="flex items-center gap-1 text-[#dfba73]">
                              <UserCheck className="w-3 h-3" />
                              Asesor: {cli.creado_por_nombre}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/clientes?clienteId=${cli.id}`}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                          title="Abrir expediente del cliente en el panel de gestión"
                        >
                          <span>Expediente</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400">
            Total en {stateMetrics.name}: <strong className="text-white">{stateMetrics.totalClientes} clientes</strong>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/clientes"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
            >
              Ver Todos los Clientes
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
