'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Edit,
  FileDown,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  User,
  UserCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderArchive,
} from 'lucide-react';
import { Cliente, TramiteMejoravit } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import { formatFolio } from '@/utils/whatsapp';
import { ClienteTramitesState } from './TramitesChecklist';
import { TramitesChecklist } from './TramitesChecklist';

interface ClienteMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCliente: Cliente | null;
  folio?: string;
  currentUserRole?: string;
  clienteTramites: ClienteTramitesState;
  loadingTramites: boolean;
  docPresets: Preset[];
  uploadingDocKey: string | null;
  generatingAmpliada200: boolean;
  downloadingBundle: 'oficiales' | 'contratos' | 'ambos' | null;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => void;
  onDeleteCliente?: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onOpenShareModal: (cliente: Cliente) => void;
  onOpenDownloadModal: () => void;
  onOpenImportModal?: () => void;
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
  onFillDoc?: (preset: Preset, tramiteType: string) => void;
  onSaveQuickCreds?: (nss: string, pass: string) => Promise<void>;
  onUploadTablaAmortizacion?: (file: File) => Promise<void>;
  onSaveCitaInfonavit?: (citaData: {
    fecha: string;
    hora: string;
    lugar: string;
    folio: string;
    estado: 'pendiente' | 'confirmada' | 'asistida' | 'cancelada';
    notas?: string;
  }) => Promise<void>;
  onUploadComprobanteCita?: (file: File) => Promise<void>;
  onDownloadOficialesPdf?: () => void;
  onDownloadContratosPdf?: () => void;
  onToggleRequirement?: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, currentValue: boolean) => Promise<void>;
  togglingReqKey?: string | null;
  onVerifyClientDoc?: (
    tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica',
    tramiteId: string,
    reqKey: string,
    fileUrl: string
  ) => Promise<void>;
  verifyingDocKey?: string | null;
}

export function ClienteMobileModal({
  isOpen,
  onClose,
  selectedCliente,
  folio,
  currentUserRole,
  clienteTramites,
  loadingTramites,
  docPresets,
  uploadingDocKey,
  generatingAmpliada200,
  downloadingBundle,
  onChangeClienteStatus,
  onDeleteCliente,
  onEditCliente,
  onOpenShareModal,
  onOpenDownloadModal,
  onOpenImportModal,
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
  onFillDoc,
  onSaveQuickCreds,
  onUploadTablaAmortizacion,
  onSaveCitaInfonavit,
  onUploadComprobanteCita,
  onDownloadOficialesPdf,
  onDownloadContratosPdf,
  onToggleRequirement,
  togglingReqKey,
  onVerifyClientDoc,
  verifyingDocKey,
}: ClienteMobileModalProps) {
  if (!isOpen || !selectedCliente) return null;

  const fullApellidos = [selectedCliente.apellido_paterno, selectedCliente.apellido_materno].filter(Boolean).join(' ') || selectedCliente.apellidos || '';
  const nombreCompleto = `${selectedCliente.nombre} ${fullApellidos}`.trim();
  const clientFolio = formatFolio(folio || selectedCliente.id);
  const currentStatusConfig = getEstadoClienteConfig(selectedCliente.estado_cliente);
  const [showContactDetails, setShowContactDetails] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden bg-black/85 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-[95vh] w-full bg-[#0d0e12] border-t border-zinc-800 rounded-t-[28px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Barra superior de arrastre / Handle */}
        <div className="pt-2 pb-0.5 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-zinc-700/60 rounded-full" />
        </div>

        {/* Cabecera del Modal Móvil */}
        <div className="px-3.5 py-2.5 border-b border-zinc-800/80 shrink-0 space-y-2 bg-zinc-950/70">
          {/* Fila 1: Avatar + Nombre + Folio + Estado + Botón Cerrar */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                {selectedCliente.nombre.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-white leading-tight truncate">
                    {nombreCompleto}
                  </h3>

                  {clientFolio && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30 font-bold" title="Folio">
                      FOLIO: {clientFolio}
                    </span>
                  )}

                  {/* Selector de Estado */}
                  {onChangeClienteStatus ? (
                    <select
                      value={selectedCliente.estado_cliente || 'interesado'}
                      onChange={(e) => onChangeClienteStatus(selectedCliente.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border focus:outline-none cursor-pointer transition-all ${currentStatusConfig.badgeClass}`}
                      title="Cambiar estatus del cliente"
                    >
                      {ESTADOS_CLIENTE.map((est) => (
                        <option key={est.value} value={est.value} className="bg-zinc-900 text-white">
                          {est.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${currentStatusConfig.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dotClass}`} />
                      {currentStatusConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Barra Compacta de Datos Rápidos (Teléfono, NSS y Toggle de Más Datos) */}
          <div className="flex items-center justify-between gap-2 text-xs bg-zinc-900/60 px-2.5 py-1.5 rounded-xl border border-zinc-800/60">
            <div className="flex items-center gap-2.5 truncate text-[11px]">
              {selectedCliente.telefono && (
                <a
                  href={`tel:${selectedCliente.telefono}`}
                  className="flex items-center gap-1 text-zinc-300 hover:text-[#dfba73]"
                >
                  <Phone className="w-3 h-3 text-[#c5a059]" />
                  <span>{selectedCliente.telefono}</span>
                </a>
              )}
              {selectedCliente.nss && (
                <span className="font-mono text-zinc-400">
                  NSS: {selectedCliente.nss}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowContactDetails(!showContactDetails)}
              className="text-[10px] text-[#dfba73] hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>{showContactDetails ? 'Menos info' : 'Más info'}</span>
              {showContactDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Desplegable de Datos Completos de Contacto (Oculto por defecto para ahorrar espacio) */}
          {showContactDetails && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 animate-in fade-in duration-150">
              {selectedCliente.email && (
                <a
                  href={`mailto:${selectedCliente.email}`}
                  className="flex items-center gap-1 text-zinc-300 hover:text-white truncate max-w-[200px]"
                >
                  <Mail className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{selectedCliente.email}</span>
                </a>
              )}
              {selectedCliente.estado && (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedCliente.estado}</span>
                </span>
              )}
              {selectedCliente.curp && (
                <span className="font-mono text-[#dfba73] flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-[#c5a059]" />
                  <span>{selectedCliente.curp}</span>
                </span>
              )}
              {currentUserRole === 'admin' && (selectedCliente.creado_por_nombre || selectedCliente.creado_por_email) && (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 w-full pt-1 border-t border-zinc-800">
                  <User className="w-3 h-3 text-[#c5a059]" />
                  Alta: {selectedCliente.creado_por_nombre || selectedCliente.creado_por_email}
                </span>
              )}
            </div>
          )}

          {/* Fila 3: Acciones Rápidas (Compartir, Editar, Expediente, Eliminar) */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onOpenShareModal(selectedCliente)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer min-h-[34px] flex-1 truncate"
                title="Compartir folio y contraseña (NSS)"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Compartir</span>
              </button>

              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-all cursor-pointer min-h-[34px] flex-1 truncate"
                  title="Importar Carpeta o ZIP de documentos"
                >
                  <FolderArchive className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">Importar</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenDownloadModal}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#dfba73] text-xs font-semibold rounded-xl border border-[#c5a059]/30 transition-all cursor-pointer min-h-[34px] flex-1 truncate"
                title="Descargar Expediente PDF"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">PDFs</span>
              </button>

              <button
                type="button"
                onClick={() => onEditCliente(selectedCliente)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 hover:border-[#c5a059]/50 transition-all cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center shrink-0 shadow-sm"
                title="Editar datos del cliente"
              >
                <Edit className="w-4 h-4 text-[#dfba73]" />
                <span className="sr-only">Editar Datos</span>
              </button>
            </div>

            {currentUserRole === 'admin' && onDeleteCliente && (
              <button
                type="button"
                onClick={() => onDeleteCliente(selectedCliente)}
                title="Enviar a papelera"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-zinc-800 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-contain">
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
              onFillDoc={onFillDoc}
              onToggleRequirement={onToggleRequirement}
              togglingReqKey={togglingReqKey}
              onVerifyClientDoc={onVerifyClientDoc}
              verifyingDocKey={verifyingDocKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
