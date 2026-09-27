'use client';

import React from 'react';
import { Search, Users, Edit, User, ChevronRight } from 'lucide-react';
import { Cliente } from '@/types/cliente';

interface ClientesListProps {
  clientes: Cliente[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  selectedCliente: Cliente | null;
  showFullDetails: boolean;
  currentUserRole?: string;
  onSelectCliente: (cliente: Cliente, openDetails: boolean) => void;
  onEditCliente: (cliente: Cliente) => void;
}

export function ClientesList({
  clientes,
  loading,
  search,
  onSearchChange,
  selectedCliente,
  showFullDetails,
  currentUserRole,
  onSelectCliente,
  onEditCliente,
}: ClientesListProps) {
  const filteredClientes = clientes.filter((c) => {
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

  return (
    <div className="lg:col-span-1 bg-white dark:bg-[#0d0e12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col h-[750px]">
      {/* Search bar */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, CURP o NSS..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mr-2" />
            Cargando clientes...
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No hay clientes registrados</p>
            <p className="text-xs text-slate-400 mt-1">Registra uno nuevo con el botón superior.</p>
          </div>
        ) : (
          filteredClientes.map((cliente) => {
            const isSelected = selectedCliente?.id === cliente.id;
            const fullApellidos = [cliente.apellido_paterno, cliente.apellido_materno].filter(Boolean).join(' ') || cliente.apellidos || '';
            return (
              <div
                key={cliente.id}
                onClick={() => onSelectCliente(cliente, false)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800/90 border-[#c5a059]/50 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {cliente.nombre} {fullApellidos}
                  </p>
                  {cliente.telefono ? (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      Tel: {cliente.telefono}
                    </p>
                  ) : cliente.email ? (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {cliente.email}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic mt-0.5">Sin contacto registrado</p>
                  )}
                  {currentUserRole === 'admin' && (
                    <p className="text-[10px] text-[#dfba73] truncate mt-1 flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 text-[#c5a059] shrink-0" />
                      <span className="truncate">
                        Alta por: {cliente.creado_por_nombre || cliente.creado_por_email || 'Sin registrador'}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
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
                    title="Abrir expediente y detalles completos"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected && showFullDetails
                        ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Detalles</span>
                  </button>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#c5a059] translate-x-0.5' : 'text-zinc-500'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
