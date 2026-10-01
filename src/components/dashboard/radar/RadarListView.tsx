'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import Link from 'next/link';

interface RadarListViewProps {
  clientes: ClienteRadar[];
  onOpenQuickPeek: (cliente: ClienteRadar) => void;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => Promise<void>;
}

export function RadarListView({
  clientes,
  onOpenQuickPeek,
  onChangeClienteStatus,
}: RadarListViewProps) {
  const [sortField, setSortField] = useState<'progreso' | 'nombre' | 'estado' | 'cita'>('progreso');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: 'progreso' | 'nombre' | 'estado' | 'cita') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedClientes = [...clientes].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'progreso') {
      comparison = a.overallProgress - b.overallProgress;
    } else if (sortField === 'nombre') {
      comparison = a.nombreCompleto.localeCompare(b.nombreCompleto);
    } else if (sortField === 'estado') {
      comparison = (a.estado_cliente || '').localeCompare(b.estado_cliente || '');
    } else if (sortField === 'cita') {
      const da = a.cita?.diasRestantes ?? 999;
      const db = b.cita?.diasRestantes ?? 999;
      comparison = da - db;
    }
    return sortAsc ? comparison : -comparison;
  });

  const openWhatsApp = (e: React.MouseEvent, cliente: ClienteRadar) => {
    e.stopPropagation();
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    const msg = `Hola ${cliente.nombre}, te contactamos de Consultoría Santina.`;
    if (tel) {
      window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
    e.stopPropagation();
    await onChangeClienteStatus(id, e.target.value);
  };

  return (
    <div className="bg-[#0d0e12] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[calc(100vh-330px)] min-h-[460px]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('nombre')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Cliente</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th className="py-2.5 px-3">Asesor</th>
              <th className="py-2.5 px-3">Trámite(s)</th>
              <th
                onClick={() => handleSort('progreso')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Avance Expediente</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('cita')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Próxima Cita</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('estado')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Estado del Cliente</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {sortedClientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No se encontraron clientes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              sortedClientes.map((cliente) => {
                const config = getEstadoClienteConfig(cliente.estado_cliente);
                return (
                  <tr
                    key={cliente.id}
                    onClick={() => onOpenQuickPeek(cliente)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Cliente */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 font-bold text-xs flex items-center justify-center text-zinc-300 shrink-0 group-hover:border-[#c5a059]/60 group-hover:text-[#dfba73]">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate group-hover:text-[#dfba73] transition-colors">
                            {cliente.nombreCompleto}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">
                            {cliente.curp || cliente.nss || 'Sin CURP/NSS'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Asesor */}
                    <td className="py-2 px-3 text-zinc-300">
                      <span className="truncate block max-w-[130px]">
                        {cliente.creado_por_nombre || 'No asignado'}
                      </span>
                    </td>

                    {/* Trámites */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-[170px]">
                        {cliente.tramites.length === 0 ? (
                          <span className="text-[10px] text-zinc-400 italic">Ninguno</span>
                        ) : (
                          cliente.tramites.map((t) => (
                            <span
                              key={t.tipo}
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                t.tipo === 'mejoravit'
                                  ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60'
                                  : 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
                              }`}
                            >
                              {t.tipo === 'mejoravit' ? 'Mejoravit' : 'Retiro'} ({t.completedReqs}/{t.totalReqs})
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Avance */}
                    <td className="py-2 px-3">
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white">{cliente.overallProgress}%</span>
                          {cliente.isPuntoDeSalir && (
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> Listo
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              cliente.overallProgress >= 75
                                ? 'bg-emerald-400'
                                : cliente.overallProgress >= 40
                                ? 'bg-[#c5a059]'
                                : 'bg-zinc-600'
                            }`}
                            style={{ width: `${cliente.overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cita */}
                    <td className="py-2 px-3">
                      {cliente.cita?.fecha ? (
                        <div className="text-[10px]">
                          <p className="font-semibold text-purple-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            {cliente.cita.fecha} {cliente.cita.hora || ''}
                          </p>
                          <p className="text-zinc-400 truncate max-w-[120px]">
                            {cliente.cita.lugar || 'CESI Infonavit'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Sin cita</span>
                      )}
                    </td>

                    {/* Estado con Dropdown */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <select
                          value={(cliente.estado_cliente || 'interesado').toLowerCase()}
                          onChange={(e) => handleStatusChange(e, cliente.id)}
                          className="bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 text-xs font-semibold rounded-lg pl-2 pr-6 py-1 border border-zinc-700 focus:outline-none focus:border-[#c5a059] cursor-pointer appearance-none"
                        >
                          {ESTADOS_CLIENTE.map((est) => (
                            <option key={est.value} value={est.value}>
                              {est.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {cliente.telefono && (
                          <button
                            onClick={(e) => openWhatsApp(e, cliente)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/dashboard/clientes?clienteId=${cliente.id}`}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                          title="Abrir expediente completo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
