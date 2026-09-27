'use client';

import React from 'react';
import {
  ArrowLeft,
  UserCheck,
  FileDown,
  User,
  Share2,
  Edit,
  MapPin,
  GitCommit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Cliente, TramiteMejoravit } from '@/types/cliente';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';

interface ClienteFullDetailsProps {
  selectedCliente: Cliente;
  currentUserRole?: string;
  tramiteMejoravit?: TramiteMejoravit;
  downloadingBundle: 'oficiales' | 'contratos' | 'ambos' | null;
  isModoSeguimiento?: boolean;
  onToggleModoSeguimiento?: () => void;
  timelineComponent?: React.ReactNode;
  onChangeClienteStatus?: (clienteId: string, newStatus: string) => void;
  onDeleteCliente?: (cliente: Cliente) => void;
  onBack: () => void;
  onOpenDownloadModal: () => void;
  onOpenShareModal: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onNewCliente?: () => void;
  children: React.ReactNode;
}

export function ClienteFullDetails({
  selectedCliente,
  currentUserRole,
  tramiteMejoravit,
  downloadingBundle,
  isModoSeguimiento = true,
  onToggleModoSeguimiento,
  timelineComponent,
  onChangeClienteStatus,
  onDeleteCliente,
  onBack,
  onOpenDownloadModal,
  onOpenShareModal,
  onEditCliente,
  onNewCliente,
  children,
}: ClienteFullDetailsProps) {
  const currentStatusConfig = getEstadoClienteConfig(selectedCliente.estado_cliente);

  return (
    <div className="bg-white dark:bg-[#0d0e12] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-md p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Barra superior de navegación / regreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-[#c5a059]" />
            <span>← Volver a la Lista de Clientes & Checklist</span>
          </button>

          {onToggleModoSeguimiento && (
            <button
              type="button"
              onClick={onToggleModoSeguimiento}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm border ${
                isModoSeguimiento
                  ? 'bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-slate-950 border-[#dfba73] shadow-md ring-2 ring-[#c5a059]/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-[#9a7b38] dark:text-[#dfba73] border-slate-300 dark:border-[#c5a059]/40'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>{isModoSeguimiento ? 'Ver Checklist Tradicional' : 'Entrar en Modo Seguimiento'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector de Estado del Cliente */}
          {onChangeClienteStatus ? (
            <select
              value={selectedCliente.estado_cliente || 'interesado'}
              onChange={(e) => onChangeClienteStatus(selectedCliente.id, e.target.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${currentStatusConfig.badgeClass}`}
              title="Cambiar estatus del cliente"
            >
              {ESTADOS_CLIENTE.map((est) => (
                <option key={est.value} value={est.value} className="bg-zinc-900 text-white">
                  {est.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${currentStatusConfig.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${currentStatusConfig.dotClass}`} />
              {currentStatusConfig.label}
            </span>
          )}

          <button
            type="button"
            onClick={onOpenDownloadModal}
            disabled={!!downloadingBundle}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c5a059] hover:bg-[#d5b069] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Descargar expediente completo en formato PDF"
          >
            {downloadingBundle ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>Descargar Expediente (2 PDFs)</span>
          </button>

          {onNewCliente && (
            <button
              type="button"
              onClick={onNewCliente}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Registrar un nuevo cliente"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}

          {currentUserRole === 'admin' && onDeleteCliente && (
            <button
              type="button"
              onClick={() => onDeleteCliente(selectedCliente)}
              title="Enviar cliente a la papelera de reciclaje"
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-zinc-800 hover:border-rose-900/50 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. CONTENIDO: LÍNEA DE TIEMPO DE SEGUIMIENTO O CHECKLIST TRADICIONAL */}
      {isModoSeguimiento && timelineComponent ? timelineComponent : children}

      {/* 2. Información del Expediente del Cliente */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 text-[#c5a059] dark:text-[#dfba73] flex items-center justify-center font-bold text-lg border border-[#c5a059]/30">
              <User className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Información del Expediente del Cliente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Datos personales, de contacto y de registro del cliente en el sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenShareModal(selectedCliente)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border border-[#dfba73]"
              title="Compartir folio y contraseña (NSS) para el cliente"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Acceso / Credenciales</span>
            </button>

            <button
              type="button"
              onClick={() => onEditCliente(selectedCliente)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-300 dark:border-slate-600"
            >
              <Edit className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Editar Cliente</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Nombre(s):</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
              {selectedCliente.nombre || 'Sin registrar'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Apellido Paterno:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
              {selectedCliente.apellido_paterno || 'Sin registrar'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Apellido Materno:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
              {selectedCliente.apellido_materno || 'Sin registrar'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Estatus del Cliente:</span>
            <span className={`font-bold text-xs inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-lg border ${currentStatusConfig.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dotClass}`} />
              {currentStatusConfig.label}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">CURP:</span>
            <span className="font-mono font-bold text-sm text-[#c5a059] dark:text-[#dfba73] block mt-0.5">
              {selectedCliente.curp || 'No registrada'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">RFC (SAT):</span>
            <span className="font-mono font-bold text-sm text-amber-500 dark:text-amber-400 block mt-0.5">
              {selectedCliente.rfc || 'No registrado'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">NSS / Portal Infonavit:</span>
            <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
              {selectedCliente.nss || tramiteMejoravit?.nss_portal_infonavit || 'No especificado'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Estado / Ubicación:</span>
            <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {selectedCliente.estado || 'Jalisco'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Teléfono de Contacto:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
              {selectedCliente.telefono ? `📞 ${selectedCliente.telefono}` : 'Sin teléfono'}
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Correo Electrónico:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
              {selectedCliente.email ? `✉️ ${selectedCliente.email}` : 'Sin correo'}
            </span>
          </div>

          {currentUserRole === 'admin' && (
            <div className="p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80 sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Dado de Alta Por (Asesor):</span>
              <span className="font-semibold text-[#c5a059] dark:text-[#dfba73] flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5" />
                {selectedCliente.creado_por_nombre || selectedCliente.creado_por_email || 'Sin registrador'}
                {selectedCliente.creado_por_email && selectedCliente.creado_por_nombre ? ` (${selectedCliente.creado_por_email})` : ''}
              </span>
            </div>
          )}

          {selectedCliente.notas && (
            <div className="sm:col-span-2 lg:col-span-4 p-3.5 bg-white dark:bg-[#0d0e12]/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Notas / Observaciones del Cliente:</span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedCliente.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
