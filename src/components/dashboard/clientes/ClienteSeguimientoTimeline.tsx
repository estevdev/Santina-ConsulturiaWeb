'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  KeyRound,
  FileText,
  Upload,
  Eye,
  FileDown,
  Calendar,
  Share2,
  ExternalLink,
  Sparkles,
  ScanLine,
  UserCheck,
  Camera,
  MessageSquare,
  Copy,
  Check,
  FileCheck,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Building2,
  AlertCircle,
  Files
} from 'lucide-react';
import { Cliente, TramiteMejoravit, TramiteRetiroDesempleo } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { ChecklistRow } from './ChecklistRow';
import { ClienteTramitesState } from './TramitesChecklist';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import { toast } from 'sonner';

interface ClienteSeguimientoTimelineProps {
  selectedCliente: Cliente;
  currentUserRole?: string;
  clienteTramites: ClienteTramitesState;
  docPresets: Preset[];
  uploadingDocKey: string | null;
  generatingAmpliada200: boolean;
  onChangeClienteStatus?: (clienteId: string, newStatus: string) => void;
  onViewDoc: (url: string, title: string) => void;
  onDownloadDoc: (url: string, title: string) => void;
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
  onDownloadOficialesPdf?: () => void;
  onDownloadContratosPdf?: () => void;
  downloadingBundle?: 'oficiales' | 'contratos' | 'ambos' | null;
  isMobile?: boolean;
  onVerifyClientDoc?: (
    tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica',
    tramiteId: string,
    reqKey: string,
    fileUrl: string
  ) => Promise<void>;
  verifyingDocKey?: string | null;
}

export function ClienteSeguimientoTimeline({
  selectedCliente,
  currentUserRole,
  clienteTramites,
  docPresets,
  uploadingDocKey,
  generatingAmpliada200,
  onChangeClienteStatus,
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
  downloadingBundle,
  onVerifyClientDoc,
  verifyingDocKey,
}: ClienteSeguimientoTimelineProps) {
  const isAdmin = currentUserRole === 'admin';
  const trMejoravit = clienteTramites.mejoravit?.[0];
  const trRetiro = clienteTramites.retiro?.[0];
  const tramiteId = trMejoravit?.id || trRetiro?.id || '';
  const tipoTramiteActual: 'mejoravit' | 'retiro' = trMejoravit ? 'mejoravit' : 'retiro';

  const getPendingClientDoc = (docUrls: any, reqKey: string) => {
    const pendingInTramite = docUrls?.documentos_seguimiento_cliente?.[reqKey];
    if (pendingInTramite && pendingInTramite.estado === 'pendiente') {
      return pendingInTramite;
    }
    const pendingInCliente = (selectedCliente?.documentos_urls as any)?.documentos_seguimiento_cliente?.[reqKey];
    if (pendingInCliente && pendingInCliente.estado === 'pendiente') {
      return pendingInCliente;
    }
    return null;
  };

  // Estados locales para Paso 1 (Credenciales)
  const [nssInput, setNssInput] = useState(
    selectedCliente.nss || trMejoravit?.nss_portal_infonavit || ''
  );
  const [passwordInput, setPasswordInput] = useState(
    trMejoravit?.password_portal_infonavit || ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState<'nss' | 'pass' | null>(null);

  // Estados locales para Paso 4 (Cita)
  const existingCita =
    (trMejoravit?.documentos_urls as any)?.cita_infonavit ||
    (selectedCliente?.documentos_urls as any)?.cita_infonavit ||
    {};

  const [citaFecha, setCitaFecha] = useState(existingCita.fecha || '');
  const [citaHora, setCitaHora] = useState(existingCita.hora || '');
  const [citaLugar, setCitaLugar] = useState(existingCita.lugar || 'CESI Guadalajara (Av. Vallarta)');
  const [citaFolio, setCitaFolio] = useState(existingCita.folio || '');
  const [citaEstado, setCitaEstado] = useState<'pendiente' | 'confirmada' | 'asistida' | 'cancelada'>(
    existingCita.estado || 'pendiente'
  );
  const [citaNotas, setCitaNotas] = useState(existingCita.notas || '');
  const [savingCita, setSavingCita] = useState(false);
  const [copiedWpCita, setCopiedWpCita] = useState(false);
  const [showChecklistFisico, setShowChecklistFisico] = useState(false);

  // URLs de archivos
  const tablaAmortizacionUrl =
    (trMejoravit?.documentos_urls as any)?.tabla_amortizacion ||
    (selectedCliente.documentos_urls as any)?.tabla_amortizacion;

  const comprobanteCitaUrl =
    (trMejoravit?.documentos_urls as any)?.comprobante_cita_infonavit ||
    (selectedCliente.documentos_urls as any)?.comprobante_cita_infonavit;

  // Evaluar estados de los 4 macro pasos
  // Paso 1: NSS + Contraseña + Tabla Amortización
  const hasNss = Boolean(selectedCliente.nss || trMejoravit?.nss_portal_infonavit);
  const hasPass = Boolean(trMejoravit?.password_portal_infonavit);
  const hasTablaAmortizacion = Boolean(tablaAmortizacionUrl);
  const paso1Completo = (hasNss && hasPass && hasTablaAmortizacion) || (trMejoravit?.req_portal_infonavit_validado && hasTablaAmortizacion);

  // Paso 2: Contrato
  const presetsContrato = docPresets.filter((p) => {
    const nameLower = p.name.toLowerCase();
    if (trMejoravit) {
      return nameLower.includes('contrato') && nameLower.includes('mejoravit');
    }
    return nameLower.includes('contrato');
  });

  const contratoPrincipalPreset = presetsContrato[0] || docPresets.find((p) => p.name.toLowerCase().includes('contrato'));
  const listaContratosPaso2 = contratoPrincipalPreset ? [contratoPrincipalPreset] : [];

  const contratoPrincipalUrl = contratoPrincipalPreset
    ? selectedCliente.documentos_urls?.[`doc_preset_${contratoPrincipalPreset.id}`]
    : null;

  const paso2Completo = Boolean(contratoPrincipalUrl);

  // Paso 3: Documentación
  const reqDocs = [
    Boolean(trMejoravit?.req_ine_normal || selectedCliente.ine_completa_url || selectedCliente.ine_frente_url),
    Boolean(trMejoravit?.req_ine_ampliada_200),
    Boolean(trMejoravit?.req_curp_actualizada || selectedCliente.curp_document_url),
    Boolean(trMejoravit?.req_acta_nacimiento),
    Boolean(trMejoravit?.req_comprobante_domicilio),
    Boolean(trMejoravit?.req_estado_cuenta_bancario),
    Boolean(trMejoravit?.req_constancia_situacion_fiscal),
    Boolean(trMejoravit?.req_3_referencias_personales || (trMejoravit?.referencias_detalle && trMejoravit.referencias_detalle.length >= 3)),
    Boolean(trMejoravit?.req_fotos_inmueble_5 || (trMejoravit?.documentos_urls as any)?.req_fotos_inmueble_5),
  ];
  const docsCompletadosCount = reqDocs.filter(Boolean).length;
  const paso3Completo = docsCompletadosCount >= 7;

  // Paso 4: Cita con Infonavit
  const paso4Completo = citaEstado === 'confirmada' || citaEstado === 'asistida' || Boolean(comprobanteCitaUrl);

  // Progreso global
  const pasosCompletos = [paso1Completo, paso2Completo, paso3Completo, paso4Completo].filter(Boolean).length;
  const porcentajeGlobal = Math.round((pasosCompletos / 4) * 100);

  // Determinación de paso inicial activo (primer paso incompleto)
  const defaultStep = !paso1Completo ? 1 : !paso2Completo ? 2 : !paso3Completo ? 3 : 4;
  const [activeStep, setActiveStep] = useState<number>(defaultStep);
  const [viewMode, setViewMode] = useState<'stepper' | 'all'>('stepper');

  // Handlers
  const handleGuardarCredenciales = async () => {
    if (!nssInput.trim()) {
      alert('Por favor ingresa el NSS.');
      return;
    }
    setSavingCreds(true);
    try {
      await onSaveQuickCreds(nssInput.trim(), passwordInput.trim());
    } finally {
      setSavingCreds(false);
    }
  };

  const handleCopy = (text: string, type: 'nss' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopiedCreds(type);
    setTimeout(() => setCopiedCreds(null), 2000);
  };

  const handleGuardarCita = async () => {
    setSavingCita(true);
    try {
      await onSaveCitaInfonavit({
        fecha: citaFecha,
        hora: citaHora,
        lugar: citaLugar,
        folio: citaFolio,
        estado: citaEstado,
        notas: citaNotas,
      });
      alert('¡Datos de la cita guardados exitosamente!');
    } catch (err: any) {
      alert(`Error al guardar la cita: ${err.message || 'Error'}`);
    } finally {
      setSavingCita(false);
    }
  };

  const clienteNombreCompleto = [
    selectedCliente.nombre,
    selectedCliente.apellido_paterno,
    selectedCliente.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ') || 'Cliente';

  const [sendingWpCita, setSendingWpCita] = useState(false);

  const handleSendWhatsAppCita = async () => {
    const telefono = selectedCliente.telefono?.replace(/\D/g, '') || '';
    const msg = `🗓️ *CONSULTORÍA SANTINA - CITA INFONAVIT*\n\nEstimado(a) *${clienteNombreCompleto}*:\n\nTu cita presencial ante el Infonavit ha sido agendada con éxito:\n\n📍 *Lugar:* ${citaLugar || 'Centro de Servicio Infonavit (CESI)'}\n📅 *Fecha:* ${citaFecha || 'Por confirmar'}\n⏰ *Hora:* ${citaHora || 'Por confirmar'}\n🏷️ *Folio de Cita:* ${citaFolio || 'N/A'}\n\n📋 *DOCUMENTOS OBLIGATORIOS QUE DEBES LLEVAR EN ORIGINAL Y COPIA:*\n• Identificación Oficial (INE) vigente en original.\n• Acta de Nacimiento certificada original.\n• Constancia de Situación Fiscal (SAT) impresa.\n• Tabla de Amortización y Solicitud de Crédito.\n• Comprobante de Domicilio reciente original (no mayor a 3 meses).\n• Comprobante impreso de confirmación de cita.\n\n_Por favor asiste 15 minutos antes de tu horario programado. Si tienes dudas, contáctanos a la brevedad._`;

    if (!telefono) {
      navigator.clipboard.writeText(msg);
      setCopiedWpCita(true);
      setTimeout(() => setCopiedWpCita(false), 3000);
      toast.info('Cliente sin teléfono guardado. Mensaje copiado al portapapeles.');
      return;
    }

    try {
      setSendingWpCita(true);
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono,
          mensaje: msg,
          clienteNombre: clienteNombreCompleto,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar por WhatsApp Cloud API');
      }

      toast.success('¡Recordatorio de cita enviado!', {
        description: `Se entregó el recordatorio por WhatsApp oficial a ${clienteNombreCompleto}.`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Error enviando cita por WhatsApp:', err);
      toast.warning('Aviso de WhatsApp', {
        description: err.message,
        duration: 7000,
      });
      // Abrir en web como alternativa si falla
      const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } finally {
      setSendingWpCita(false);
    }
  };

  const normalIneUrl =
    trMejoravit?.documentos_urls?.req_ine_normal ||
    selectedCliente?.ine_completa_url ||
    selectedCliente?.ine_frente_url;

  // Configuración de los 4 pasos para Stepper
  const stepsConfig = [
    {
      num: 1,
      title: 'Credenciales',
      subtitle: 'NSS & Amortización',
      isCompleted: paso1Completo,
      icon: KeyRound,
    },
    {
      num: 2,
      title: 'Contrato',
      subtitle: 'Firma de Servicio',
      isCompleted: paso2Completo,
      icon: FileText,
    },
    {
      num: 3,
      title: 'Expediente',
      subtitle: `${docsCompletadosCount}/9 Documentos`,
      isCompleted: paso3Completo,
      icon: Files,
    },
    {
      num: 4,
      title: 'Cita Infonavit',
      subtitle: citaEstado === 'confirmada' ? 'Confirmada' : 'Programación',
      isCompleted: paso4Completo,
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR EJECUTIVA: Progreso & Navegación Minimalista             */}
      {/* ========================================================================= */}
      <div className="bg-[#101217] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        {/* Fila 1: Resumen y Progreso General */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#c5a059]/15 text-[#dfba73] flex items-center justify-center shrink-0 border border-[#c5a059]/30">
              <Building2 className="w-4 h-4 text-[#c5a059]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white truncate">
                  Seguimiento de Trámite
                </span>
                {tramiteId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                    Folio: {tramiteId.slice(0, 8).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {clienteNombreCompleto} • {tipoTramiteActual === 'mejoravit' ? 'Mejoravit / Infonavit' : 'Retiro Desempleo'}
              </p>
            </div>
          </div>

          {/* Medidor de Avance & Selector de Vista Desktop */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <div className="text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                <span className="text-zinc-400 font-normal text-[11px]">Progreso:</span>
                <span className="text-[#dfba73]">{porcentajeGlobal}%</span>
                <span className="text-[11px] text-zinc-500 font-normal">({pasosCompletos}/4)</span>
              </div>
              <div className="w-28 sm:w-36 bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mt-1 border border-zinc-700/50">
                <div
                  className="bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] h-full rounded-full transition-all duration-300"
                  style={{ width: `${porcentajeGlobal}%` }}
                />
              </div>
            </div>

            {/* Alternador de Vista (Solo en Desktop) */}
            <div className="hidden lg:flex items-center bg-zinc-900 rounded-xl p-0.5 border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('stepper')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'stepper'
                    ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Paso a Paso
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ver Todo
              </button>
            </div>
          </div>
        </div>

        {/* Fila 2: Stepper Tabs Interactivos (1, 2, 3, 4) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 pt-3">
          {stepsConfig.map((s) => {
            const isActive = activeStep === s.num;
            const Icon = s.icon;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  setActiveStep(s.num);
                  if (viewMode === 'all') setViewMode('stepper');
                }}
                className={`relative p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#c5a059]/15 to-[#dfba73]/10 border-[#c5a059] shadow-md ring-1 ring-[#c5a059]/40'
                    : s.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                {/* Badge con Icono o Checkmark */}
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    s.isCompleted
                      ? 'bg-emerald-500 text-zinc-950'
                      : isActive
                      ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {s.isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </span>

                {/* Texto del Paso */}
                <div className="min-w-0 text-center sm:text-left flex-1">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold truncate leading-tight ${
                      isActive ? 'text-white' : s.isCompleted ? 'text-emerald-300' : 'text-zinc-300'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="hidden sm:block text-[10px] text-zinc-500 truncate mt-0.5">
                    {s.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO PRINCIPAL: PASO A PASO ENFOCADO O VISTA COMPLETA             */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* PASO 1: NSS, CONTRASEÑA Y TABLA DE AMORTIZACIÓN                           */}
      {/* ------------------------------------------------------------------------- */}
      {(viewMode === 'all' || activeStep === 1) && (
        <div className="bg-[#101217] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          {/* Cabecera del Paso 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                paso1Completo ? 'bg-emerald-500 text-zinc-950' : 'bg-[#c5a059] text-zinc-950'
              }`}>
                {paso1Completo ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Credenciales & Tabla de Amortización
                  </h3>
                  {paso1Completo ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Completado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Acceso a Mi Cuenta Infonavit para precalificar crédito y anexar la Tabla de Amortización.
                </p>
              </div>
            </div>

            <a
              href="https://micuenta.infonavit.org.mx/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer shrink-0 border border-red-500/30 min-h-[40px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Portal Infonavit ↗</span>
            </a>
          </div>

          {/* Formulario en 2 Columnas Responsivas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Bloque A: Credenciales */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
                  Credenciales de Acceso
                </span>
                <button
                  type="button"
                  onClick={handleGuardarCredenciales}
                  disabled={savingCreds}
                  className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 min-h-[34px] flex items-center gap-1"
                >
                  {savingCreds ? 'Guardando...' : 'Guardar Credenciales'}
                </button>
              </div>

              {/* NSS */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  NSS (11 dígitos):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nssInput}
                    onChange={(e) => setNssInput(e.target.value)}
                    placeholder="Ej. 04018505174"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(nssInput, 'nss')}
                    disabled={!nssInput}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Copiar NSS"
                  >
                    {copiedCreds === 'nss' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Contraseña Portal Infonavit:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña del portal..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title={showPassword ? 'Ocultar' : 'Ver'}
                  >
                    {showPassword ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(passwordInput, 'pass')}
                    disabled={!passwordInput}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Copiar contraseña"
                  >
                    {copiedCreds === 'pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bloque B: Tabla de Amortización */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                    Tabla de Amortización
                  </span>
                  {hasTablaAmortizacion && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Cargada
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Anexa el documento descargado de Mi Cuenta Infonavit para el expediente.
                </p>
              </div>

              {hasTablaAmortizacion ? (
                <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white text-xs truncate">
                      Tabla_de_Amortizacion.pdf
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewDoc(tablaAmortizacionUrl, 'Tabla de Amortización - ' + clienteNombreCompleto)}
                      className="p-2 sm:px-2.5 sm:py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#dfba73] text-[11px] font-bold rounded-lg border border-[#c5a059]/40 flex items-center gap-1 cursor-pointer"
                      title="Ver documento"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadDoc(tablaAmortizacionUrl, 'Tabla_Amortizacion_' + clienteNombreCompleto)}
                      className="p-2 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                      title="Descargar documento"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bajar</span>
                    </button>
                    {isAdmin && (
                      <label className="p-2 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer" title="Reemplazar archivo">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cambiar</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadTablaAmortizacion(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : isAdmin ? (
                <label className="border-2 border-dashed border-[#c5a059]/40 hover:border-[#c5a059] bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                  <Upload className="w-6 h-6 text-[#c5a059] mb-1" />
                  <span className="text-xs font-bold text-white">Subir Tabla de Amortización</span>
                  <span className="text-[10px] text-zinc-500">PDF, JPG o PNG</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadTablaAmortizacion(file);
                    }}
                  />
                </label>
              ) : (
                <div className="border border-dashed border-zinc-800 bg-zinc-900/40 rounded-xl p-3 text-center text-zinc-500 text-xs">
                  (Pendiente de subir por un Administrador)
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* PASO 2: CONTRATO DE PRESTACIÓN DE SERVICIO                                */}
      {/* ------------------------------------------------------------------------- */}
      {(viewMode === 'all' || activeStep === 2) && (
        <div className="bg-[#101217] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          {/* Cabecera del Paso 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                paso2Completo ? 'bg-emerald-500 text-zinc-950' : 'bg-[#c5a059] text-zinc-950'
              }`}>
                {paso2Completo ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Contrato de Prestación de Servicio
                  </h3>
                  {paso2Completo ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Firmado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pendiente de Firma
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Genera el enlace para que el cliente firme digitalmente el contrato desde su celular.
                </p>
              </div>
            </div>

            {onDownloadContratosPdf && (
              <button
                type="button"
                onClick={onDownloadContratosPdf}
                disabled={downloadingBundle === 'contratos'}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50 min-h-[40px]"
              >
                <FileDown className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Descargar en PDF</span>
              </button>
            )}
          </div>

          {/* Tarjeta de Contrato */}
          <div className="space-y-3">
            {listaContratosPaso2.map((preset) => {
              const docKey = `doc_preset_${preset.id}`;
              const existingUrl = selectedCliente?.documentos_urls?.[docKey];
              const hasEmptySample = Boolean(preset.samplePdfUrl);

              return (
                <div
                  key={preset.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    existingUrl
                      ? 'bg-[#0b0c10] border-emerald-500/30'
                      : 'bg-[#0b0c10] border-[#c5a059]/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      existingUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-[#dfba73]'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white text-xs sm:text-sm block truncate">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {existingUrl ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Llenado y firmado por el cliente
                          </span>
                        ) : (
                          'Listo para generar enlace de firma'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {hasEmptySample && (
                      <button
                        type="button"
                        onClick={() => onViewDoc(preset.samplePdfUrl!, `Plantilla: ${preset.name}`)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                        title="Ver formato vacío"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Plantilla</span>
                      </button>
                    )}

                    {existingUrl && (
                      <button
                        type="button"
                        onClick={() => onViewDoc(existingUrl, `Firmado: ${preset.name} - ${clienteNombreCompleto}`)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Ver Firmado</span>
                      </button>
                    )}

                    {!existingUrl && (
                      <button
                        type="button"
                        onClick={() => onGenerateClientDocLink(preset, tipoTramiteActual)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generar Enlace para Cliente</span>
                      </button>
                    )}

                    {existingUrl && isAdmin && (
                      <button
                        type="button"
                        onClick={() => onRemoveDocPreset(preset, docKey)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Reiniciar contrato para nuevo link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* PASO 3: RECAUDACIÓN DE DOCUMENTACIÓN (EXPEDIENTE OFICIAL)                  */}
      {/* ------------------------------------------------------------------------- */}
      {(viewMode === 'all' || activeStep === 3) && (
        <div className="bg-[#101217] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          {/* Cabecera del Paso 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                paso3Completo ? 'bg-emerald-500 text-zinc-950' : 'bg-[#c5a059] text-zinc-950'
              }`}>
                {paso3Completo ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Expediente Oficial del Trámite
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {docsCompletadosCount} de 9 Requisitos Listos
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Recauda los documentos de identidad, comprobantes y referencias oficiales.
                </p>
              </div>
            </div>

            {onDownloadOficialesPdf && (
              <button
                type="button"
                onClick={onDownloadOficialesPdf}
                disabled={downloadingBundle === 'oficiales'}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50 min-h-[40px]"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Descargar Expediente Completo (1 PDF)</span>
              </button>
            )}
          </div>

          {/* Grid de Requisitos Oficiales */}
          {trMejoravit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* 1. INE Normal */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_ine_normal"
                label="1. INE Normal (Frente y Reverso)"
                isCompleted={trMejoravit.req_ine_normal}
                existingDocUrl={trMejoravit.documentos_urls?.req_ine_normal || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_ine_normal')}
                numberTag={1}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_ine_normal`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_ine_normal`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 2. INE Ampliada 200% */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_ine_ampliada_200"
                label="2. INE Ampliada al 200%"
                isCompleted={trMejoravit.req_ine_ampliada_200}
                existingDocUrl={trMejoravit.documentos_urls?.req_ine_ampliada_200}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_ine_ampliada_200')}
                numberTag={2}
                extraAction={
                  normalIneUrl && isAdmin ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onGenerateIneAmpliada200(trMejoravit.id, normalIneUrl)}
                        disabled={generatingAmpliada200}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-[#dfba73]" />
                        <span>{generatingAmpliada200 ? '...' : 'Auto 200%'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenManualIneCropper(trMejoravit.id, normalIneUrl)}
                        className="inline-flex items-center gap-1 px-1.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg shadow-sm transition-all cursor-pointer"
                        title="Recorte manual"
                      >
                        <ScanLine className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null
                }
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_ine_ampliada_200`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_ine_ampliada_200`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 3. CURP */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_curp_actualizada"
                label="3. CURP Actualizada"
                isCompleted={trMejoravit.req_curp_actualizada}
                existingDocUrl={trMejoravit.documentos_urls?.req_curp_actualizada || selectedCliente?.curp_document_url}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_curp_actualizada')}
                numberTag={3}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_curp_actualizada`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_curp_actualizada`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 4. Acta de Nacimiento */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_acta_nacimiento"
                label="4. Acta de Nacimiento"
                isCompleted={trMejoravit.req_acta_nacimiento}
                existingDocUrl={trMejoravit.documentos_urls?.req_acta_nacimiento}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_acta_nacimiento')}
                numberTag={4}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_acta_nacimiento`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_acta_nacimiento`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 5. Comprobante Domicilio */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_comprobante_domicilio"
                label="5. Comprobante de Domicilio"
                isCompleted={trMejoravit.req_comprobante_domicilio}
                existingDocUrl={trMejoravit.documentos_urls?.req_comprobante_domicilio}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_comprobante_domicilio')}
                numberTag={5}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_comprobante_domicilio`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_comprobante_domicilio`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 6. Estado de Cuenta */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_estado_cuenta_bancario"
                label="6. Estado de Cuenta Bancario"
                isCompleted={trMejoravit.req_estado_cuenta_bancario}
                existingDocUrl={trMejoravit.documentos_urls?.req_estado_cuenta_bancario}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_estado_cuenta_bancario')}
                numberTag={6}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_estado_cuenta_bancario`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_estado_cuenta_bancario`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 7. Constancia Situación Fiscal */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_constancia_situacion_fiscal"
                label="7. Situación Fiscal (SAT / RFC)"
                isCompleted={trMejoravit.req_constancia_situacion_fiscal}
                existingDocUrl={trMejoravit.documentos_urls?.req_constancia_situacion_fiscal}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_constancia_situacion_fiscal')}
                numberTag={7}
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_constancia_situacion_fiscal`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_constancia_situacion_fiscal`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />

              {/* 8. 3 Referencias Personales */}
              {(() => {
                const isRefsDone = Boolean(
                  trMejoravit.req_3_referencias_personales ||
                  (trMejoravit.referencias_detalle && trMejoravit.referencias_detalle.filter((r) => r.nombre.trim()).length >= 3)
                );
                return (
                  <div
                    className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
                      isRefsDone
                        ? 'bg-zinc-900/90 border-[#c5a059]/30 text-white'
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${
                          isRefsDone
                            ? 'bg-[#c5a059] text-zinc-950'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        8
                      </span>
                      <span className="font-semibold truncate leading-tight">
                        8. 3 Referencias Personales
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenReferenciasModal(trMejoravit.id, trMejoravit)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
                          isRefsDone
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30'
                            : 'bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isRefsDone ? 'Ver / Editar' : 'Ingresar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 9. Fotos Inmueble (5 fotos) */}
              <ChecklistRow
                tramiteTipo="mejoravit"
                tramiteId={trMejoravit.id}
                reqKey="req_fotos_inmueble_5"
                label="9. Fotografías del Inmueble (5 fotos)"
                isCompleted={trMejoravit.req_fotos_inmueble_5}
                existingDocUrl={trMejoravit.documentos_urls?.req_fotos_inmueble_5}
                clientUploadPending={getPendingClientDoc(trMejoravit.documentos_urls, 'req_fotos_inmueble_5')}
                numberTag={9}
                extraAction={
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={() => onOpenInmuebleFotosModal(trMejoravit.id, trMejoravit)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer mr-1"
                    >
                      <Camera className="w-3 h-3 text-[#c5a059]" />
                      <span>{trMejoravit.documentos_urls?.req_fotos_inmueble_5 ? '5 Fotos' : 'Subir'}</span>
                    </button>
                  ) : null
                }
                isUploading={uploadingDocKey === `${trMejoravit.id}_req_fotos_inmueble_5`}
                isVerifying={verifyingDocKey === `${trMejoravit.id}_req_fotos_inmueble_5`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onVerifyClientDoc={onVerifyClientDoc}
              />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* PASO 4: CITA CON INFONAVIT (COORDINACIÓN Y RECORDATORIO)                  */}
      {/* ------------------------------------------------------------------------- */}
      {(viewMode === 'all' || activeStep === 4) && (
        <div className="bg-[#101217] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          {/* Cabecera del Paso 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                paso4Completo ? 'bg-emerald-500 text-zinc-950' : 'bg-[#c5a059] text-zinc-950'
              }`}>
                {paso4Completo ? <Check className="w-4 h-4 stroke-[3]" /> : '4'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Cita con Infonavit (CESI)
                  </h3>
                  {citaEstado === 'confirmada' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Confirmada
                    </span>
                  ) : citaEstado === 'asistida' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      ★ Finalizada
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Agenda la cita presencial y envía el recordatorio oficial con requisitos al cliente.
                </p>
              </div>
            </div>

            {/* Botón WhatsApp */}
            <button
              type="button"
              disabled={sendingWpCita}
              onClick={handleSendWhatsAppCita}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 min-h-[40px] disabled:opacity-50"
              title="Enviar recordatorio oficial por WhatsApp Cloud API al cliente"
            >
              {sendingWpCita ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>{sendingWpCita ? 'Enviando...' : copiedWpCita ? '¡Mensaje Copiado!' : 'Recordatorio WhatsApp (Oficial)'}</span>
            </button>
          </div>

          {/* Formulario Compacto de Cita */}
          <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            {/* Selector Rápido de Estatus */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Estatus de la Cita:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'pendiente', label: '⏳ Pendiente', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
                  { id: 'confirmada', label: '✓ Confirmada', activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
                  { id: 'asistida', label: '★ Asistida', activeClass: 'bg-purple-500/20 border-purple-500/50 text-purple-300' },
                  { id: 'cancelada', label: '✕ Cancelada', activeClass: 'bg-rose-500/20 border-rose-500/50 text-rose-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCitaEstado(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      citaEstado === item.id
                        ? `${item.activeClass} font-bold shadow-sm`
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Cita en Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs pt-1">
              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Fecha:
                </label>
                <input
                  type="date"
                  value={citaFecha}
                  onChange={(e) => setCitaFecha(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Hora:
                </label>
                <input
                  type="time"
                  value={citaHora}
                  onChange={(e) => setCitaHora(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Centro CESI */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Centro CESI / Lugar:
                </label>
                <input
                  type="text"
                  value={citaLugar}
                  onChange={(e) => setCitaLugar(e.target.value)}
                  placeholder="Ej. CESI Guadalajara"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Folio */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Folio de Cita:
                </label>
                <input
                  type="text"
                  value={citaFolio}
                  onChange={(e) => setCitaFolio(e.target.value)}
                  placeholder="Ej. CITA-2026-9812"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Guardar Cita */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleGuardarCita}
                disabled={savingCita}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-xs min-h-[38px]"
              >
                {savingCita ? 'Guardando Cita...' : 'Guardar Información de Cita'}
              </button>
            </div>
          </div>

          {/* Subida de Comprobante & Requisitos Físicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            {/* Comprobante de Cita */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                  Comprobante Oficial de Cita
                </span>
                {comprobanteCitaUrl && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    ✓ Adjunto
                  </span>
                )}
              </div>

              {comprobanteCitaUrl ? (
                <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                  <span className="font-semibold text-white text-xs truncate">
                    Confirmacion_Cita_Infonavit.pdf
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewDoc(comprobanteCitaUrl, 'Comprobante de Cita - ' + clienteNombreCompleto)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#dfba73] text-[11px] font-bold rounded-lg border border-[#c5a059]/40 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    {isAdmin && (
                      <label className="p-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cambiar</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadComprobanteCita(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : isAdmin ? (
                <label className="border border-dashed border-zinc-700 hover:border-[#c5a059] bg-zinc-900/40 rounded-xl p-2.5 flex items-center justify-center gap-2 text-center cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-[#c5a059]" />
                  <span className="text-xs font-semibold text-white">Subir Comprobante (PDF/JPG)</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadComprobanteCita(file);
                    }}
                  />
                </label>
              ) : (
                <div className="border border-dashed border-zinc-800 bg-zinc-900/40 rounded-xl p-2.5 text-center text-zinc-500 text-xs">
                  (Pendiente de adjuntar por Admin)
                </div>
              )}
            </div>

            {/* Checklist de Documentos Físicos (Colapsable en móvil) */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowChecklistFisico(!showChecklistFisico)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Documentos Físicos a Llevar (Original y Copia)
                </span>
                <span className="text-zinc-400 text-xs sm:hidden">
                  {showChecklistFisico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <div className={`grid grid-cols-2 gap-1 text-[11px] text-zinc-300 ${
                showChecklistFisico ? 'block' : 'hidden sm:grid'
              }`}>
                <span>• INE Vigente</span>
                <span>• Acta de Nacimiento</span>
                <span>• Tabla Amortización</span>
                <span>• Contrato / Solicitud</span>
                <span>• Comp. Domicilio</span>
                <span>• Comprobante de Cita</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BARRA INFERIOR DE NAVEGACIÓN MÓVIL (Paso Anterior / Siguiente)          */}
      {/* ========================================================================= */}
      {viewMode === 'stepper' && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition-all cursor-pointer min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Paso Anterior</span>
          </button>

          <span className="text-xs font-bold text-zinc-400 sm:hidden">
            Paso {activeStep} de 4
          </span>

          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
            disabled={activeStep === 4}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d5b069] disabled:opacity-40 text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            <span>Siguiente Paso</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
