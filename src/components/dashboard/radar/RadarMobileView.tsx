'use client';

import React, { useState } from 'react';
import {
  Radar,
  Search,
  RefreshCw,
  Filter,
  X,
  Phone,
  MessageCircle,
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  User,
  SlidersHorizontal,
  MapPin,
  Copy,
  Check,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';
import { AdvisorOption } from './RadarHeader';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import Link from 'next/link';

interface RadarMobileViewProps {
  clientes: ClienteRadar[];
  allClientes: ClienteRadar[];
  loading: boolean;
  onRefresh: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedAdvisor: string;
  onAdvisorChange: (val: string) => void;
  advisorsList: AdvisorOption[];
  selectedTramite: string;
  onTramiteChange: (val: string) => void;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => Promise<void>;
  lastUpdated: Date | null;
}

export function RadarMobileView({
  clientes,
  allClientes,
  loading,
  onRefresh,
  search,
  onSearchChange,
  selectedAdvisor,
  onAdvisorChange,
  advisorsList,
  selectedTramite,
  onTramiteChange,
  activeStatusFilter,
  onSelectStatusFilter,
  onChangeClienteStatus,
  lastUpdated,
}: RadarMobileViewProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedClienteModal, setSelectedClienteModal] = useState<ClienteRadar | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status Counts calculated from allClientes (unfiltered by status)
  const countByStatus = (status: string) => {
    return allClientes.filter((c) => (c.estado_cliente || 'interesado').toLowerCase() === status).length;
  };

  const totalCount = allClientes.length;
  const listosCount = allClientes.filter((c) => c.isPuntoDeSalir).length;
  const citasCount = allClientes.filter((c) => c.cita && c.cita.fecha).length;
  const interesadosCount = countByStatus('interesado');
  const docPendienteCount = countByStatus('documentacion_pendiente');
  const enProcesoCount = countByStatus('en_proceso');
  const terminadosCount = countByStatus('terminado');

  const statusTabs = [
    { id: 'todos', label: 'Todos', count: totalCount, color: 'text-zinc-200' },
    { id: 'punto_de_salir', label: '⚡ Listos', count: listosCount, color: 'text-emerald-400', isHighlight: true },
    { id: 'citas', label: '📅 Citas', count: citasCount, color: 'text-purple-400' },
    { id: 'documentacion_pendiente', label: 'Doc. Pendiente', count: docPendienteCount, color: 'text-amber-400' },
    { id: 'en_proceso', label: 'En Proceso', count: enProcesoCount, color: 'text-[#dfba73]' },
    { id: 'interesado', label: 'Interesados', count: interesadosCount, color: 'text-blue-400' },
    { id: 'terminado', label: 'Terminados', count: terminadosCount, color: 'text-emerald-500' },
  ];

  // Specific filter for mobile tab
  const displayedClientes = clientes.filter((c) => {
    if (activeStatusFilter === 'citas') {
      return !!c.cita && !!c.cita.fecha;
    }
    return true;
  });

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
    const msg = `Hola ${cliente.nombre}, te contactamos de Consultoría Santina para dar seguimiento a tu trámite.`;
    if (tel) {
      window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const openCall = (e: React.MouseEvent, cliente: ClienteRadar) => {
    e.stopPropagation();
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    if (tel) {
      window.open(`tel:${tel}`, '_self');
    }
  };

  const handleQuickStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
    e.stopPropagation();
    await onChangeClienteStatus(id, e.target.value);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasActiveFilters = selectedAdvisor !== 'todos' || selectedTramite !== 'todos';

  return (
    <div className="space-y-3 pb-8 -mx-1">
      {/* 1. Mobile Sticky-Style Header */}
      <div className="bg-[#0d0e12] border border-zinc-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#c5a059]/25 to-[#dfba73]/10 border border-[#c5a059]/40 flex items-center justify-center text-[#dfba73]">
              <Radar className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Radar Operativo
                </h1>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  360°
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                {displayedClientes.length} {displayedClientes.length === 1 ? 'cliente visible' : 'clientes visibles'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Toggle Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl border transition-colors ${
                showSearch || search
                  ? 'bg-[#c5a059]/15 border-[#c5a059]/40 text-[#dfba73]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Buscar cliente"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Filter Sheet Button */}
            <button
              onClick={() => setShowFilterSheet(true)}
              className={`p-2 rounded-xl border relative transition-colors ${
                hasActiveFilters
                  ? 'bg-[#c5a059] border-[#c5a059] text-zinc-950 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Filtros"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0d0e12]" />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
              title="Refrescar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#c5a059]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {showSearch && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 relative animate-in fade-in slide-in-from-top-2 duration-150">
            <Search className="w-4 h-4 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por nombre, CURP, NSS, asesor..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c5a059]"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Horizontal Scrollable Status Pills (Thumb-Optimized Tab Bar) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 custom-scrollbar -mx-1 select-none">
        {statusTabs.map((tab) => {
          const isActive = activeStatusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 shadow-md shadow-[#c5a059]/20'
                  : tab.isHighlight
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Priority Strip (Urgent Citas or A Punto de Salir Highlights) */}
      {activeStatusFilter === 'todos' && (listosCount > 0 || citasCount > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Quick Listos Button */}
          <button
            onClick={() => onSelectStatusFilter('punto_de_salir')}
            className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-950/50 to-zinc-900 border border-emerald-500/30 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> A Punto de Salir
              </span>
              <span className="text-xs font-black text-white bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                {listosCount}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 truncate">Expedientes &gt; 75% o cita lista</p>
          </button>

          {/* Quick Citas Button */}
          <button
            onClick={() => onSelectStatusFilter('citas')}
            className="p-2.5 rounded-xl bg-gradient-to-br from-purple-950/50 to-zinc-900 border border-purple-500/30 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" /> Citas Agendadas
              </span>
              <span className="text-xs font-black text-white bg-purple-500/20 px-1.5 py-0.2 rounded-md">
                {citasCount}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 truncate">Presenciales Infonavit</p>
          </button>
        </div>
      )}

      {/* 4. Mobile Client Cards Feed */}
      <div className="space-y-2.5">
        {displayedClientes.length === 0 ? (
          <div className="p-8 text-center bg-[#0d0e12] border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-400">
            No se encontraron clientes con el filtro seleccionado.
          </div>
        ) : (
          displayedClientes.map((cliente) => {
            const statusConfig = getEstadoClienteConfig(cliente.estado_cliente);
            return (
              <div
                key={cliente.id}
                onClick={() => setSelectedClienteModal(cliente)}
                className={`bg-[#0d0e12] border rounded-2xl p-3 shadow-md transition-all active:bg-zinc-900/90 relative ${
                  cliente.isPuntoDeSalir
                    ? 'border-emerald-500/35 bg-gradient-to-br from-emerald-950/15 via-[#0d0e12] to-[#0d0e12]'
                    : 'border-zinc-800'
                }`}
              >
                {/* Header: Avatar, Name, Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                      {getInitials(cliente.nombreCompleto)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {cliente.nombreCompleto}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {cliente.creado_por_nombre ? `Asesor: ${cliente.creado_por_nombre}` : 'Sin asesor'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusConfig.badgeClass}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Progress Bar & Badges */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">Avance de Expediente:</span>
                    <span className="font-bold text-white">{cliente.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
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

                {/* Trámites Pills */}
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {cliente.tramites.length === 0 ? (
                    <span className="text-[9px] text-zinc-500 italic">Sin trámites asignados</span>
                  ) : (
                    cliente.tramites.map((tr) => (
                      <span
                        key={tr.tipo}
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                          tr.tipo === 'mejoravit'
                            ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60'
                            : tr.tipo === 'retiro_desempleo'
                            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-200 border border-rose-800/60'
                        }`}
                      >
                        {tr.tipo === 'mejoravit' ? 'Mejoravit' : 'Retiro'} ({tr.completedReqs}/{tr.totalReqs})
                      </span>
                    ))
                  )}

                  {cliente.isPuntoDeSalir && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Listo
                    </span>
                  )}
                </div>

                {/* Cita alert if has cita */}
                {cliente.cita?.fecha && (
                  <div className="mt-2 p-1.5 rounded-lg bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-purple-300 font-semibold truncate">
                      <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                      {cliente.cita.fecha} {cliente.cita.hora ? `(${cliente.cita.hora})` : ''} - {cliente.cita.lugar || 'CESI'}
                    </span>
                    {cliente.cita.esHoy && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        ¡HOY!
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Quick Actions (Call, WhatsApp, Change Status, Open Full) */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                  {/* Status Dropdown */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={(cliente.estado_cliente || 'interesado').toLowerCase()}
                      onChange={(e) => handleQuickStatusChange(e, cliente.id)}
                      className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-[#c5a059] appearance-none pr-5 cursor-pointer"
                    >
                      {ESTADOS_CLIENTE.map((est) => (
                        <option key={est.value} value={est.value}>
                          {est.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {cliente.telefono && (
                      <>
                        <button
                          onClick={(e) => openCall(e, cliente)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
                          title="Llamar"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => openWhatsApp(e, cliente)}
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/dashboard/clientes?clienteId=${cliente.id}`}
                      className="p-1.5 rounded-lg bg-[#c5a059]/20 hover:bg-[#c5a059]/30 border border-[#c5a059]/40 text-[#dfba73]"
                      title="Abrir Expediente"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Mobile Quick Peek Modal (Bottom Sheet Style) */}
      {selectedClienteModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedClienteModal(null)}
        >
          <div
            className="w-full bg-[#0d0e12] border-t border-[#c5a059]/40 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Header */}
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-bold text-white truncate">
                  {selectedClienteModal.nombreCompleto}
                </h2>
                <p className="text-[10px] text-zinc-400 truncate">
                  {selectedClienteModal.creado_por_nombre ? `Asesor: ${selectedClienteModal.creado_por_nombre}` : 'Sin asesor'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClienteModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar text-xs">
              {/* Status Selector */}
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400">Estado actual:</span>
                <select
                  value={(selectedClienteModal.estado_cliente || 'interesado').toLowerCase()}
                  onChange={async (e) => {
                    const newSt = e.target.value;
                    await onChangeClienteStatus(selectedClienteModal.id, newSt);
                    setSelectedClienteModal({ ...selectedClienteModal, estado_cliente: newSt });
                  }}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg px-2 py-1"
                >
                  {ESTADOS_CLIENTE.map((est) => (
                    <option key={est.value} value={est.value}>
                      {est.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Direct Link to Clientes Expediente */}
              <Link
                href={`/dashboard/clientes?clienteId=${selectedClienteModal.id}`}
                className="w-full py-2.5 px-3 rounded-xl bg-[#c5a059] text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#c5a059]/20"
              >
                <span>Abrir Expediente Completo en Clientes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Contact actions */}
              {selectedClienteModal.telefono && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => openCall(e, selectedClienteModal)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Llamar</span>
                  </button>
                  <button
                    onClick={(e) => openWhatsApp(e, selectedClienteModal)}
                    className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}

              {/* CURP & NSS */}
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">CURP:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-white text-[11px]">{selectedClienteModal.curp || 'N/A'}</span>
                    {selectedClienteModal.curp && (
                      <button
                        onClick={() => copyToClipboard(selectedClienteModal.curp || '', 'curp')}
                        className="p-0.5 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === 'curp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">NSS:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-white text-[11px]">{selectedClienteModal.nss || 'N/A'}</span>
                    {selectedClienteModal.nss && (
                      <button
                        onClick={() => copyToClipboard(selectedClienteModal.nss || '', 'nss')}
                        className="p-0.5 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === 'nss' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cita Details if exists */}
              {selectedClienteModal.cita?.fecha && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Cita Infonavit
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 uppercase">
                      {selectedClienteModal.cita.estado}
                    </span>
                  </div>
                  <p className="text-white text-xs mt-1">
                    {selectedClienteModal.cita.fecha} {selectedClienteModal.cita.hora ? `(${selectedClienteModal.cita.hora})` : ''}
                  </p>
                  <p className="text-zinc-400 text-[10px]">{selectedClienteModal.cita.lugar}</p>
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Requisitos del Trámite
                </span>
                {selectedClienteModal.tramites.map((tr) => (
                  <div key={tr.tipo} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tr.nombre}</span>
                      <span className="text-[10px] font-bold text-[#dfba73]">{tr.progreso}%</span>
                    </div>
                    <div className="space-y-1">
                      {tr.completados.map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                      {tr.faltantes.map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-[10px] text-amber-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">Falta: {item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Filter Bottom Sheet */}
      {showFilterSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFilterSheet(false)}
        >
          <div
            className="w-full bg-[#0d0e12] border-t border-zinc-800 rounded-t-3xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Filtros Operativos</h3>
              <button
                onClick={() => {
                  onAdvisorChange('todos');
                  onTramiteChange('todos');
                }}
                className="text-xs text-[#c5a059] font-medium"
              >
                Restablecer
              </button>
            </div>

            {/* Asesor */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400">Filtrar por Asesor:</label>
              <select
                value={selectedAdvisor}
                onChange={(e) => onAdvisorChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-[#c5a059]"
              >
                <option value="todos">Todos los Asesores</option>
                {advisorsList.map((adv) => (
                  <option key={adv.id} value={adv.name}>
                    {adv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trámite */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400">Filtrar por Trámite:</label>
              <select
                value={selectedTramite}
                onChange={(e) => onTramiteChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-[#c5a059]"
              >
                <option value="todos">Todos los Trámites</option>
                <option value="mejoravit">Crédito Mejoravit</option>
                <option value="retiro_desempleo">Retiro AFORE</option>
                <option value="alta_medica">Alta Médica IMSS</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilterSheet(false)}
              className="w-full py-2.5 rounded-xl bg-[#c5a059] text-zinc-950 font-bold text-xs"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
