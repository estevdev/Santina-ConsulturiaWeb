'use client';

import React from 'react';
import {
  FileCheck2,
  User,
  MapPin,
  Share2,
  Edit,
  UserCheck,
} from 'lucide-react';
import { Cliente } from '@/types/cliente';

interface ClienteQuickViewProps {
  selectedCliente: Cliente | null;
  currentUserRole?: string;
  onOpenShareModal: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onViewFullDetails: () => void;
  children: React.ReactNode;
}

export function ClienteQuickView({
  selectedCliente,
  currentUserRole,
  onOpenShareModal,
  onEditCliente,
  onViewFullDetails,
  children,
}: ClienteQuickViewProps) {
  if (!selectedCliente) {
    return (
      <div className="lg:col-span-2 bg-[#0d0e12] rounded-2xl border border-zinc-800 shadow-sm p-6 h-[750px] overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
          <FileCheck2 className="w-12 h-12 text-zinc-700 mb-3" />
          <p className="text-base font-semibold text-zinc-300">Ningún cliente seleccionado</p>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Selecciona un cliente de la lista para ver el checklist completo de sus documentos y estado de trámites.
          </p>
        </div>
      </div>
    );
  }

  const fullApellidos = [selectedCliente.apellido_paterno, selectedCliente.apellido_materno].filter(Boolean).join(' ') || selectedCliente.apellidos || '';

  return (
    <div className="lg:col-span-2 bg-[#0d0e12] rounded-2xl border border-zinc-800 shadow-sm p-6 h-[750px] overflow-y-auto">
      <div className="space-y-6">
        {/* Header Compacto del Cliente - Vista Checklist Rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              {selectedCliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {selectedCliente.nombre} {fullApellidos}
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30">
                  Checklist
                </span>
                {currentUserRole === 'admin' && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-[#dfba73] border border-[#c5a059]/30 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#c5a059]" />
                    Alta: {selectedCliente.creado_por_nombre || selectedCliente.creado_por_email || 'Sin registrador'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                {selectedCliente.telefono && <span>📞 {selectedCliente.telefono}</span>}
                {selectedCliente.email && <span>✉️ {selectedCliente.email}</span>}
                {selectedCliente.estado && (
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedCliente.estado}
                  </span>
                )}
                {selectedCliente.curp && <span className="font-mono font-semibold text-[#dfba73]">🆔 {selectedCliente.curp}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenShareModal(selectedCliente)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Compartir folio y contraseña (NSS) para el cliente"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Acceso</span>
            </button>

            <button
              type="button"
              onClick={() => onEditCliente(selectedCliente)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-xl border border-zinc-700 transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Editar Datos</span>
            </button>
            <button
              type="button"
              onClick={onViewFullDetails}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#9a7b38] hover:from-[#d5b069] hover:to-[#aa8b48] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>Ver Expediente Completo</span>
            </button>
          </div>
        </div>

        {/* Checklist de Trámites */}
        {children}
      </div>
    </div>
  );
}
