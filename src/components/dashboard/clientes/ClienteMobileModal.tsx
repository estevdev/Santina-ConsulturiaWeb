'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Edit,
  FileDown,
  GitCommit,
  CheckSquare,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  User,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Cliente, TramiteMejoravit } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import { ClienteTramitesState } from './TramitesChecklist';
import { ClienteSeguimientoTimeline } from './ClienteSeguimientoTimeline';
import { TramitesChecklist } from './TramitesChecklist';

interface ClienteMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCliente: Cliente | null;
  currentUserRole?: string;
  clienteTramites: ClienteTramitesState;
  loadingTramites: boolean;
  docPresets: Preset[];
  uploadingDocKey: string | null;
  generatingAmpliada200: boolean;
  downloadingBundle: 'oficiales' | 'contratos' | 'ambos' | null;
  isModoSeguimiento: boolean;
  onToggleModoSeguimiento: () => void;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => void;
  onDeleteCliente?: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onOpenShareModal: (cliente: Cliente) => void;
  onOpenDownloadModal: () => void;
  onViewDoc: (url: string, title: string) => void;
  onDownloadDoc: (url: string, filename: string) => void;
  onUploadReqDocument: (
    tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica',
    tramiteId: string,
    reqKey: string,
    file: File
  ) => Promise<void>;
  onGenerateIneAmpliada200: (trId: string, reqIneNormalUrl?: string | null) => Promise<void>;
  onOpenManualIneCropper: (tramiteId: string, imageUrl: string) => Promise<void>;
  onOpenReferenciasModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onOpenInfonavitCredsModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onOpenInmuebleFotosModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onGenerateClientDocLink: (preset: Preset, tramiteType: string) => Promise<void>;
  onRemoveDocPreset: (preset: Preset, docKey: string) => Promise<void>;
  onSaveQuickCreds: (nss: string, pass: string) => Promise<void>;
  onUploadTablaAmortizacion: (file: File) => Promise<void>;
  onSaveCitaInfonavit: (citaData: {
    fecha: string;
    hora: string;
    lugar: string;
    folio: string;
    estado: 'pendiente' | 'confirmada' | 'asistida' | 'cancelada';
    notas?: string;
  }) => Promise<void>;
  onUploadComprobanteCita: (file: File) => Promise<void>;
  onDownloadOficialesPdf: () => void;
  onDownloadContratosPdf: () => void;
}

export function ClienteMobileModal({
  isOpen,
  onClose,
  selectedCliente,
  currentUserRole,
  clienteTramites,
  loadingTramites,
  docPresets,
  uploadingDocKey,
  generatingAmpliada200,
  downloadingBundle,
  isModoSeguimiento,
  onToggleModoSeguimiento,
  onChangeClienteStatus,
  onDeleteCliente,
  onEditCliente,
  onOpenShareModal,
  onOpenDownloadModal,
  onViewDoc,
  onDownloadDoc,
  onUploadReqDocument,
  onGenerateIneAmpliada200,
  onOpenManualIneCropper,
  onOpenReferenciasModal,
  onOpenInfonavitCredsModal,
  onOpenInmuebleFotosModal,
  onGenerateClientDocLink,
  onRemoveDocPreset,
  onSaveQuickCreds,
  onUploadTablaAmortizacion,
  onSaveCitaInfonavit,
  onUploadComprobanteCita,
  onDownloadOficialesPdf,
  onDownloadContratosPdf,
}: ClienteMobileModalProps) {
  if (!isOpen || !selectedCliente) return null;

  const fullApellidos = [selectedCliente.apellido_paterno, selectedCliente.apellido_materno].filter(Boolean).join(' ') || selectedCliente.apellidos || '';
  const nombreCompleto = `${selectedCliente.nombre} ${fullApellidos}`.trim();
  const currentStatusConfig = getEstadoClienteConfig(selectedCliente.estado_cliente);

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden bg-black/85 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-[95vh] w-full bg-[#0d0e12] border-t border-zinc-800 rounded-t-[28px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Barra superior de arrastre / Handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-zinc-700/70 rounded-full" />
        </div>

        {/* Cabecera del Modal Móvil (Información exacta del lado derecho de PC) */}
        <div className="px-4 py-3 border-b border-zinc-800/80 shrink-0 space-y-3 bg-zinc-950/60">
          {/* Fila 1: Avatar + Nombre + Botón Cerrar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-base shrink-0 shadow-md">
                {selectedCliente.nombre.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white leading-tight">
                    {nombreCompleto}
                  </h3>

                  {/* Selector de Estado */}
                  {onChangeClienteStatus ? (
                    <select
                      value={selectedCliente.estado_cliente || 'interesado'}
                      onChange={(e) => onChangeClienteStatus(selectedCliente.id, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${currentStatusConfig.badgeClass}`}
                      title="Cambiar estatus del cliente"
                    >
                      {ESTADOS_CLIENTE.map((est) => (
                        <option key={est.value} value={est.value} className="bg-zinc-900 text-white">
                          {est.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${currentStatusConfig.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dotClass}`} />
                      {currentStatusConfig.label}
                    </span>
                  )}
                </div>

                {currentUserRole === 'admin' && (
                  <div className="text-[10px] font-medium text-[#dfba73] flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-[#c5a059]" />
                    Alta: {selectedCliente.creado_por_nombre || selectedCliente.creado_por_email || 'Sin registrador'}
                  </div>
                )}
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fila 2: Datos de Contacto y Documentos (Teléfono, Email, Estado, CURP, NSS) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            {selectedCliente.telefono && (
              <a
                href={`tel:${selectedCliente.telefono}`}
                className="flex items-center gap-1 text-zinc-300 hover:text-[#dfba73] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{selectedCliente.telefono}</span>
              </a>
            )}
            {selectedCliente.email && (
              <a
                href={`mailto:${selectedCliente.email}`}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors truncate max-w-[190px]"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span className="truncate">{selectedCliente.email}</span>
              </a>
            )}
            {selectedCliente.estado && (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedCliente.estado}</span>
              </span>
            )}
            {selectedCliente.curp && (
              <span className="font-mono font-semibold text-[#dfba73] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{selectedCliente.curp}</span>
              </span>
            )}
            {selectedCliente.nss && (
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                NSS: {selectedCliente.nss}
              </span>
            )}
          </div>

          {/* Fila 3: Botones de Acción (Compartir Acceso, Editar, Expediente, Eliminar) */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenShareModal(selectedCliente)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                title="Compartir folio y contraseña (NSS) para el cliente"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir Acceso</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCliente(selectedCliente)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-xl border border-zinc-700 transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-[#dfba73]" />
                <span>Editar Datos</span>
              </button>

              <button
                type="button"
                onClick={onOpenDownloadModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#dfba73] text-xs font-semibold rounded-xl border border-[#c5a059]/30 transition-all cursor-pointer"
                title="Descargar Expediente Completo en PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Expediente PDF</span>
              </button>
            </div>

            {currentUserRole === 'admin' && onDeleteCliente && (
              <button
                type="button"
                onClick={() => onDeleteCliente(selectedCliente)}
                title="Enviar cliente a la papelera"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-zinc-800 hover:border-rose-900/50 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Fila 4: Pestañas de Navegación (Checklist de Trámites vs Modo Seguimiento) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                if (isModoSeguimiento) onToggleModoSeguimiento();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isModoSeguimiento
                  ? 'bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-zinc-950 shadow-md ring-1 ring-[#dfba73]/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist de Trámites</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isModoSeguimiento) onToggleModoSeguimiento();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isModoSeguimiento
                  ? 'bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-zinc-950 shadow-md ring-1 ring-[#dfba73]/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Modo Seguimiento</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
          {!isModoSeguimiento ? (
            /* Checklist de Trámites (Vista exacta del lado derecho de PC) */
            <div className="space-y-4">
              <TramitesChecklist
                loadingTramites={loadingTramites}
                clienteTramites={clienteTramites}
                selectedCliente={selectedCliente}
                currentUserRole={currentUserRole}
                uploadingDocKey={uploadingDocKey}
                generatingAmpliada200={generatingAmpliada200}
                docPresets={docPresets}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadReqDocument={onUploadReqDocument}
                onGenerateIneAmpliada200={onGenerateIneAmpliada200}
                onOpenManualIneCropper={onOpenManualIneCropper}
                onOpenReferenciasModal={onOpenReferenciasModal}
                onOpenInfonavitCredsModal={onOpenInfonavitCredsModal}
                onOpenInmuebleFotosModal={onOpenInmuebleFotosModal}
                onGenerateClientDocLink={onGenerateClientDocLink}
                onRemoveDocPreset={onRemoveDocPreset}
              />
            </div>
          ) : (
            /* Modo Seguimiento (Línea de Tiempo con los 4 hitos) */
            <ClienteSeguimientoTimeline
              selectedCliente={selectedCliente}
              currentUserRole={currentUserRole}
              clienteTramites={clienteTramites}
              docPresets={docPresets}
              uploadingDocKey={uploadingDocKey}
              generatingAmpliada200={generatingAmpliada200}
              onChangeClienteStatus={onChangeClienteStatus}
              onViewDoc={onViewDoc}
              onDownloadDoc={onDownloadDoc}
              onUploadReqDocument={onUploadReqDocument}
              onGenerateIneAmpliada200={onGenerateIneAmpliada200}
              onOpenManualIneCropper={onOpenManualIneCropper}
              onOpenReferenciasModal={onOpenReferenciasModal}
              onOpenInfonavitCredsModal={onOpenInfonavitCredsModal}
              onOpenInmuebleFotosModal={onOpenInmuebleFotosModal}
              onGenerateClientDocLink={onGenerateClientDocLink}
              onRemoveDocPreset={onRemoveDocPreset}
              onSaveQuickCreds={onSaveQuickCreds}
              onUploadTablaAmortizacion={onUploadTablaAmortizacion}
              onSaveCitaInfonavit={onSaveCitaInfonavit}
              onUploadComprobanteCita={onUploadComprobanteCita}
              onDownloadOficialesPdf={onDownloadOficialesPdf}
              onDownloadContratosPdf={onDownloadContratosPdf}
              downloadingBundle={downloadingBundle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
