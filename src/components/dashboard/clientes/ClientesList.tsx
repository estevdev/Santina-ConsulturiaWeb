'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  Edit,
  User,
  ChevronRight,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Filter,
  Plus,
  ChevronDown,
  Check,
  Globe,
} from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';

interface ClientesListProps {
  clientes: Cliente[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  selectedCliente: Cliente | null;
  showFullDetails: boolean;
  currentUserRole?: string;
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectCliente: (cliente: Cliente, openDetails: boolean) => void;
  onEditCliente: (cliente: Cliente) => void;
  onDeleteCliente?: (cliente: Cliente) => void;
  onRestoreCliente?: (cliente: Cliente) => void;
  onPermanentDeleteCliente?: (cliente: Cliente) => void;
  onChangeClienteStatus?: (clienteId: string, newStatus: string) => void;
  papeleraCount?: number;
  onNewCliente?: () => void;
}

export function ClientesList({
  clientes,
  loading,
  search,
  onSearchChange,
  selectedCliente,
  showFullDetails,
  currentUserRole,
  activeStatusFilter,
  onStatusFilterChange,
  onSelectCliente,
  onEditCliente,
  onDeleteCliente,
  onRestoreCliente,
  onPermanentDeleteCliente,
  onChangeClienteStatus,
  papeleraCount = 0,
  onNewCliente,
}: ClientesListProps) {
  const isPapelera = activeStatusFilter === 'papelera';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClientes = clientes.filter((c) => {
    // 1. Filtrado por Papelera vs Activos
    if (isPapelera) {
      if (!c.deleted_at) return false;
    } else {
      if (c.deleted_at) return false;
      if (activeStatusFilter !== 'todos') {
        const clienteStatus = (c.estado_cliente || 'interesado').toLowerCase();
        if (clienteStatus !== activeStatusFilter) return false;
      }
    }

    // 2. Filtrado por Búsqueda de texto
    const q = search.toLowerCase();
    const fullName = `${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''} ${c.apellidos || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.curp && c.curp.toLowerCase().includes(q)) ||
      (c.nss && c.nss.toLowerCase().includes(q))
    );
  });

  const getStatusCount = (statusValue: string) => {
    if (statusValue === 'todos') {
      return clientes.filter((c) => !c.deleted_at).length;
    }
    if (statusValue === 'papelera') {
      return clientes.filter((c) => Boolean(c.deleted_at)).length;
    }
    return clientes.filter((c) => !c.deleted_at && (c.estado_cliente || 'interesado') === statusValue).length;
  };

  const activeConfig =
    activeStatusFilter === 'todos'
      ? { label: 'Todos los Clientes', dotClass: 'bg-[#c5a059]', badgeClass: 'bg-zinc-900 border-zinc-700 text-white' }
      : activeStatusFilter === 'papelera'
      ? { label: 'Papelera de Reciclaje', dotClass: 'bg-rose-500', badgeClass: 'bg-rose-950/70 text-rose-200 border-rose-600/50' }
      : getEstadoClienteConfig(activeStatusFilter);

  return (
    <div className="lg:col-span-1 bg-white dark:bg-[#0d0e12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col h-[750px]">
      {/* Header & Filtros */}
      <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 space-y-3">
        {/* Search bar + Botón Nuevo Cliente */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, CURP o NSS..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {onNewCliente && (
            <button
              type="button"
              onClick={onNewCliente}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#c5a059] hover:bg-[#d5b069] text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
              title="Registrar Nuevo Cliente"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
            </button>
          )}
        </div>

        {/* Desplegable Personalizado de Filtro de Estado */}
        <div className="flex items-center justify-between gap-2 pt-0.5 relative" ref={dropdownRef}>
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Estado:</span>
            </div>

            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer ${
                  activeStatusFilter === 'papelera'
                    ? 'bg-rose-950/40 border-rose-600/60 text-rose-200 hover:bg-rose-950/60'
                    : activeStatusFilter === 'todos'
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-600'
                    : `${activeConfig.badgeClass} hover:opacity-95`
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {activeStatusFilter === 'todos' ? (
                    <Globe className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                  ) : activeStatusFilter === 'papelera' ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${activeConfig.dotClass}`} />
                  )}
                  <span className="truncate">{activeConfig.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono font-bold text-zinc-300">
                    {getStatusCount(activeStatusFilter)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180 text-[#c5a059]' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Menu Flotante Personalizado */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full min-w-[260px] z-50 bg-[#121318]/95 backdrop-blur-md border border-[#c5a059]/40 rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {/* Option: Todos */}
                  <button
                    type="button"
                    onClick={() => {
                      onStatusFilterChange('todos');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeStatusFilter === 'todos'
                        ? 'bg-[#c5a059]/20 text-[#dfba73] font-bold border border-[#c5a059]/40'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Todos los Clientes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                        {getStatusCount('todos')}
                      </span>
                      {activeStatusFilter === 'todos' && <Check className="w-3.5 h-3.5 text-[#dfba73]" />}
                    </div>
                  </button>

                  <div className="my-1 border-t border-zinc-800/80" />

                  {/* Estados del Cliente */}
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Estados de Trámite
                  </div>

                  {ESTADOS_CLIENTE.map((est) => {
                    const isSelected = activeStatusFilter === est.value;
                    const count = getStatusCount(est.value);
                    return (
                      <button
                        key={est.value}
                        type="button"
                        onClick={() => {
                          onStatusFilterChange(est.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? `${est.badgeClass} font-bold ring-1 ring-amber-500/30`
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${est.dotClass}`} />
                          <span className="truncate">{est.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono text-zinc-400">
                            {count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                      </button>
                    );
                  })}

                  {/* Papelera de Reciclaje (Admin) */}
                  {currentUserRole === 'admin' && (
                    <>
                      <div className="my-1 border-t border-zinc-800/80" />
                      <button
                        type="button"
                        onClick={() => {
                          onStatusFilterChange('papelera');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          activeStatusFilter === 'papelera'
                            ? 'bg-rose-950/60 border border-rose-500/60 text-rose-200 font-bold'
                            : 'text-zinc-400 hover:bg-rose-950/30 hover:text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Papelera de Reciclaje</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-950/80 text-rose-300 text-[10px] font-mono font-bold">
                            {getStatusCount('papelera')}
                          </span>
                          {activeStatusFilter === 'papelera' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 shrink-0">
            {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mr-2" />
            Cargando clientes...
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 px-4">
            {isPapelera ? (
              <>
                <Trash2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-300">La papelera está vacía</p>
                <p className="text-xs text-zinc-500 mt-1">No hay clientes eliminados temporalmente.</p>
              </>
            ) : (
              <>
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No hay clientes con este filtro
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {search ? 'Intenta con otro término de búsqueda.' : 'Registra un cliente o cambia el filtro de estado.'}
                </p>
              </>
            )}
          </div>
        ) : (
          filteredClientes.map((cliente) => {
            const isSelected = selectedCliente?.id === cliente.id;
            const fullApellidos = [cliente.apellido_paterno, cliente.apellido_materno].filter(Boolean).join(' ') || cliente.apellidos || '';
            const statusConfig = getEstadoClienteConfig(cliente.estado_cliente);

            return (
              <div
                key={cliente.id}
                onClick={() => onSelectCliente(cliente, false)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isPapelera
                    ? isSelected
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                      : 'bg-zinc-900/40 border-rose-950/40 hover:bg-rose-950/20'
                    : isSelected
                    ? 'bg-zinc-800/90 border-[#c5a059]/50 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">
                      {cliente.nombre} {fullApellidos}
                    </p>
                    {!isPapelera && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                        {statusConfig.label}
                      </span>
                    )}
                    {isPapelera && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        En Papelera
                      </span>
                    )}
                  </div>

                  {cliente.telefono ? (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      📞 {cliente.telefono}
                    </p>
                  ) : cliente.email ? (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      ✉️ {cliente.email}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic mt-0.5">Sin contacto registrado</p>
                  )}

                  {currentUserRole === 'admin' && (
                    <p className="text-[10px] text-[#dfba73] truncate mt-1 flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 text-[#c5a059] shrink-0" />
                      <span className="truncate">
                        Alta: {cliente.creado_por_nombre || cliente.creado_por_email || 'Sin registrador'}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {isPapelera ? (
                    /* Botones de acción en Papelera */
                    <>
                      {onRestoreCliente && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreCliente(cliente);
                          }}
                          title="Restaurar cliente de la papelera"
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      )}
                      {onPermanentDeleteCliente && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDeleteCliente(cliente);
                          }}
                          title="Eliminar permanentemente de la base de datos"
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    /* Botones de acción en Lista Normal */
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCliente(cliente);
                        }}
                        title="Editar información básica del cliente"
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer flex items-center gap-1 border border-zinc-700"
                      >
                        <Edit className="w-3 h-3 text-[#dfba73]" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCliente(cliente, true);
                        }}
                        title="Abrir expediente en Modo Seguimiento"
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected && showFullDetails
                            ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>Seguimiento</span>
                      </button>

                      {currentUserRole === 'admin' && onDeleteCliente && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCliente(cliente);
                          }}
                          title="Mover a la papelera (Eliminar cliente)"
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#c5a059] translate-x-0.5' : 'text-zinc-500'}`} />
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
