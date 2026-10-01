'use client';

import React from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';

interface RadarColumnsViewProps {
  clientes: ClienteRadar[];
  onOpenQuickPeek: (cliente: ClienteRadar) => void;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => Promise<void>;
}

export function RadarColumnsView({
  clientes,
  onOpenQuickPeek,
  onChangeClienteStatus,
}: RadarColumnsViewProps) {
  const columnsConfig = [
    {
      id: 'interesado',
      title: 'Interesados',
      sub: 'Prospectos iniciales',
      dotClass: 'bg-blue-400',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      columnBorder: 'border-blue-500/20',
      columnHeaderBg: 'bg-blue-950/20',
      accentColor: 'text-blue-400',
    },
    {
      id: 'documentacion_pendiente',
      title: 'Doc. Pendiente',
      sub: 'Faltan requisitos',
      dotClass: 'bg-amber-400',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      columnBorder: 'border-amber-500/20',
      columnHeaderBg: 'bg-amber-950/20',
      accentColor: 'text-amber-400',
    },
    {
      id: 'en_proceso',
      title: 'En Proceso',
      sub: 'Gestión activa',
      dotClass: 'bg-[#c5a059]',
      badgeClass: 'bg-[#c5a059]/20 text-[#dfba73] border-[#c5a059]/40',
      columnBorder: 'border-[#c5a059]/30',
      columnHeaderBg: 'bg-[#262015]/40',
      accentColor: 'text-[#dfba73]',
    },
    {
      id: 'cita_programada',
      title: 'Cita Agendada',
      sub: 'Infonavit / Entidad',
      dotClass: 'bg-purple-400',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      columnBorder: 'border-purple-500/20',
      columnHeaderBg: 'bg-purple-950/20',
      accentColor: 'text-purple-300',
    },
    {
      id: 'terminado',
      title: 'Terminados',
      sub: 'Concluidos con éxito',
      dotClass: 'bg-emerald-400',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      columnBorder: 'border-emerald-500/20',
      columnHeaderBg: 'bg-emerald-950/20',
      accentColor: 'text-emerald-400',
    },
  ];

  const getInitials = (nombre: string) => {
    return (nombre || 'CL')
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase();
  };

  const openWhatsApp = (e: React.MouseEvent, cliente: ClienteRadar) => {
    e.stopPropagation();
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    const msg = `Hola ${cliente.nombre}, te contactamos de Consultoría Santina respecto a tu expediente.`;
    if (tel) {
      window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>, clienteId: string) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    await onChangeClienteStatus(clienteId, newStatus);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 h-[calc(100vh-330px)] min-h-[460px]">
      {columnsConfig.map((col) => {
        const columnClients = clientes.filter(
          (c) => (c.estado_cliente || 'interesado').toLowerCase() === col.id
        );
        const count = columnClients.length;
        const total = clientes.length || 1;
        const pct = Math.round((count / total) * 100);

        return (
          <div
            key={col.id}
            className={`flex flex-col bg-[#0d0e12] border ${col.columnBorder} rounded-2xl overflow-hidden shadow-lg h-full`}
          >
            {/* Column Header - Compact */}
            <div className={`p-2.5 border-b border-zinc-800 ${col.columnHeaderBg} shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${col.dotClass} shrink-0`} />
                  <h3 className="text-xs font-bold text-white truncate">{col.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${col.badgeClass}`}>
                    {count}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">({pct}%)</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{col.sub}</p>
            </div>

            {/* Column Body - Independent Vertical Scroll (Keeps page scroll minimal) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {columnClients.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-center p-3 text-zinc-400 text-xs border border-dashed border-zinc-800/80 rounded-xl">
                  <span>Sin clientes en esta fase</span>
                </div>
              ) : (
                columnClients.map((cliente) => {
                  return (
                    <div
                      key={cliente.id}
                      onClick={() => onOpenQuickPeek(cliente)}
                      className={`p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border transition-all cursor-pointer shadow-sm group select-none relative ${
                        cliente.isPuntoDeSalir
                          ? 'border-emerald-500/40 hover:border-emerald-400/70 bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-900'
                          : 'border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Top: Avatar, Name, Progress */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-[11px] flex items-center justify-center shrink-0 group-hover:border-[#c5a059]/60 group-hover:text-[#dfba73] transition-colors">
                            {getInitials(cliente.nombreCompleto)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-[#dfba73] transition-colors leading-tight">
                              {cliente.nombreCompleto}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {cliente.creado_por_nombre || 'Asesor no asignado'}
                            </p>
                          </div>
                        </div>

                        {/* Progress or near-exit tag */}
                        <div className="shrink-0 flex flex-col items-end">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              cliente.overallProgress >= 75
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : cliente.overallProgress >= 40
                                ? 'bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {cliente.overallProgress}%
                          </span>
                        </div>
                      </div>

                      {/* Trámites Badges */}
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {cliente.tramites.length === 0 ? (
                          <span className="text-[9px] text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-800/60">
                            Sin trámite asignado
                          </span>
                        ) : (
                          cliente.tramites.map((tr) => (
                            <span
                              key={tr.tipo}
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                                tr.tipo === 'mejoravit'
                                  ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60'
                                  : tr.tipo === 'retiro_desempleo'
                                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
                                  : 'bg-rose-950/80 text-rose-200 border border-rose-800/60'
                              }`}
                              title={`${tr.nombre} (${tr.completedReqs}/${tr.totalReqs} requisitos)`}
                            >
                              <span className="truncate max-w-[90px] sm:max-w-[110px]">
                                {tr.tipo === 'mejoravit' ? 'Mejoravit' : tr.tipo === 'retiro_desempleo' ? 'Retiro AFORE' : 'Alta IMSS'}
                              </span>
                              <span className="opacity-80">({tr.completedReqs}/{tr.totalReqs})</span>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Faltantes alert if in documentacion_pendiente */}
                      {col.id === 'documentacion_pendiente' && cliente.tramites.length > 0 && cliente.tramites[0].faltantes.length > 0 && (
                        <div className="mt-1.5 text-[9px] text-amber-300/90 bg-amber-950/40 border border-amber-500/25 px-1.5 py-0.5 rounded truncate">
                          Faltan: {cliente.tramites[0].faltantes.slice(0, 2).join(', ')}
                          {cliente.tramites[0].faltantes.length > 2 && ` +${cliente.tramites[0].faltantes.length - 2}`}
                        </div>
                      )}

                      {/* Cita alert if has cita */}
                      {cliente.cita?.fecha && (
                        <div className="mt-1.5 flex items-center justify-between text-[9px] font-semibold text-purple-300 bg-purple-950/50 border border-purple-500/30 px-1.5 py-0.5 rounded">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                            Cita: {cliente.cita.fecha} {cliente.cita.hora || ''}
                          </span>
                          {cliente.cita.esHoy && (
                            <span className="text-rose-400 font-bold animate-pulse">¡HOY!</span>
                          )}
                        </div>
                      )}

                      {/* Bottom row: Quick Status changer & WhatsApp button */}
                      <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between gap-1 text-[10px]">
                        {/* Status Select dropdown right on the card for 0-click updates */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={(cliente.estado_cliente || 'interesado').toLowerCase()}
                            onChange={(e) => handleStatusSelect(e, cliente.id)}
                            className="bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 text-[10px] font-medium rounded-md px-1.5 py-0.5 border border-zinc-700 focus:outline-none focus:border-[#c5a059] cursor-pointer appearance-none pr-4"
                            title="Cambiar estado de cliente directamente"
                          >
                            {ESTADOS_CLIENTE.map((est) => (
                              <option key={est.value} value={est.value}>
                                {est.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 text-zinc-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* WhatsApp / Phone shortcut */}
                        {cliente.telefono && (
                          <button
                            onClick={(e) => openWhatsApp(e, cliente)}
                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            title={`Enviar WhatsApp a ${cliente.telefono}`}
                          >
                            <MessageCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
