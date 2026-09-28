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
  MapPin,
  Share2,
  ExternalLink,
  Sparkles,
  ScanLine,
  UserCheck,
  Camera,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
  Building2,
  Lock,
  Unlock,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Cliente, TramiteMejoravit, TramiteRetiroDesempleo, TramiteAltaMedicaImss } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { ChecklistRow } from './ChecklistRow';
import { ClienteTramitesState } from './TramitesChecklist';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';

interface ClienteSeguimientoTimelineProps {
  selectedCliente: Cliente;
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
}

export function ClienteSeguimientoTimeline({
  selectedCliente,
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
}: ClienteSeguimientoTimelineProps) {
  // Trámite principal (Mejoravit / Infonavit o Retiro)
  const trMejoravit = clienteTramites.mejoravit?.[0];
  const trRetiro = clienteTramites.retiro?.[0];
  const tramiteId = trMejoravit?.id || trRetiro?.id || '';
  const tipoTramiteActual: 'mejoravit' | 'retiro' = trMejoravit ? 'mejoravit' : 'retiro';

  // Estados locales para edición rápida de credenciales en Paso 1
  const [nssInput, setNssInput] = useState(
    selectedCliente.nss || trMejoravit?.nss_portal_infonavit || ''
  );
  const [passwordInput, setPasswordInput] = useState(
    trMejoravit?.password_portal_infonavit || ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState<'nss' | 'pass' | null>(null);

  // Estados locales para gestión de Cita en Paso 4
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

  // URLs de archivos del flujo
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

  // Paso 2: Contrato de Prestación de Servicios (Específicamente "Contrato - Mejoravit")
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

  // Paso 3: Recaudación de Documentación (INE, CURP, Acta, Comprobante, etc.)
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
  const paso3Completo = docsCompletadosCount >= 7; // Mayoría completada

  // Paso 4: Cita con Infonavit
  const paso4Completo = citaEstado === 'confirmada' || citaEstado === 'asistida' || Boolean(comprobanteCitaUrl);

  // Progreso global
  const pasosCompletos = [paso1Completo, paso2Completo, paso3Completo, paso4Completo].filter(Boolean).length;
  const porcentajeGlobal = Math.round((pasosCompletos / 4) * 100);

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

  const handleSendWhatsAppCita = () => {
    const telefono = selectedCliente.telefono?.replace(/\D/g, '') || '';
    const msg = `🗓️ *CONSULTORÍA SANTINA - CITA INFONAVIT*\n\nEstimado(a) *${clienteNombreCompleto}*:\n\nTu cita presencial ante el Infonavit ha sido agendada con éxito:\n\n📍 *Lugar:* ${citaLugar || 'Centro de Servicio Infonavit (CESI)'}\n📅 *Fecha:* ${citaFecha || 'Por confirmar'}\n⏰ *Hora:* ${citaHora || 'Por confirmar'}\n🏷️ *Folio de Cita:* ${citaFolio || 'N/A'}\n\n📋 *DOCUMENTOS OBLIGATORIOS QUE DEBES LLEVAR EN ORIGINAL Y COPIA:*\n• Identificación Oficial (INE) vigente en original.\n• Acta de Nacimiento certificada original.\n• Constancia de Situación Fiscal (SAT) impresa.\n• Tabla de Amortización y Solicitud de Crédito.\n• Comprobante de Domicilio reciente original (no mayor a 3 meses).\n• Comprobante impreso de confirmación de cita.\n\n_Por favor asiste 15 minutos antes de tu horario programado. Si tienes dudas, contáctanos a la brevedad._`;

    if (telefono) {
      const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      setCopiedWpCita(true);
      setTimeout(() => setCopiedWpCita(false), 3000);
      alert('El cliente no tiene teléfono guardado. ¡El mensaje ha sido copiado al portapapeles!');
    }
  };

  const normalIneUrl =
    trMejoravit?.documentos_urls?.req_ine_normal ||
    selectedCliente?.ine_completa_url ||
    selectedCliente?.ine_frente_url;

  const currentStatusConfig = getEstadoClienteConfig(selectedCliente.estado_cliente);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner Superior: Resumen del Trámite & Barra de Progreso */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-950 via-[#121318] to-zinc-900 border border-[#c5a059]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-[#c5a059]/20 text-[#dfba73] text-xs font-black uppercase tracking-wider rounded-xl border border-[#c5a059]/40 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Modo Seguimiento del Asesor
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Folio: <strong className="text-white">{tramiteId ? tramiteId.slice(0, 8).toUpperCase() : 'SIN-FOLIO'}</strong>
              </span>

              {onChangeClienteStatus ? (
                <select
                  value={selectedCliente.estado_cliente || 'interesado'}
                  onChange={(e) => onChangeClienteStatus(selectedCliente.id, e.target.value)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition-all ${currentStatusConfig.badgeClass}`}
                  title="Cambiar estatus del cliente"
                >
                  {ESTADOS_CLIENTE.map((est) => (
                    <option key={est.value} value={est.value} className="bg-zinc-900 text-white">
                      {est.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${currentStatusConfig.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dotClass}`} />
                  {currentStatusConfig.label}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              Flujo de Pasos para Tramitación:{' '}
              <span className="text-[#dfba73]">{clienteNombreCompleto}</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Guía secuencial paso a paso para el asesor. Sigue la línea de tiempo desde la recaudación de credenciales
              y descarga de tabla de amortización, pasando por el contrato y la documentación, hasta la cita con Infonavit.
            </p>
          </div>

          {/* Progreso Visual */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 text-right min-w-[240px] space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-zinc-400">Avance General:</span>
              <span className="text-lg font-black text-[#dfba73]">{porcentajeGlobal}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] h-full transition-all duration-500 rounded-full"
                style={{ width: `${porcentajeGlobal}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-400 text-left font-medium">
              {pasosCompletos} de 4 Macro-Pasos completados
            </div>
          </div>
        </div>

        {/* Mini Stepper Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-6 mt-6 border-t border-zinc-800/80 text-xs">
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            paso1Completo ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              paso1Completo ? 'bg-emerald-500 text-slate-950' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}>
              {paso1Completo ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <div className="truncate">
              <span className="font-bold block truncate">1. Credenciales & Amortización</span>
              <span className="text-[10px] text-zinc-500">{paso1Completo ? 'Completado' : 'Pendiente'}</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            paso2Completo ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              paso2Completo ? 'bg-emerald-500 text-slate-950' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}>
              {paso2Completo ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <div className="truncate">
              <span className="font-bold block truncate">2. Contrato de Servicio</span>
              <span className="text-[10px] text-zinc-500">{paso2Completo ? 'Firmado' : 'Pendiente'}</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            paso3Completo ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              paso3Completo ? 'bg-emerald-500 text-slate-950' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}>
              {paso3Completo ? <Check className="w-3.5 h-3.5" /> : '3'}
            </span>
            <div className="truncate">
              <span className="font-bold block truncate">3. Expediente Oficial</span>
              <span className="text-[10px] text-zinc-500">{docsCompletadosCount}/9 Documentos</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
            paso4Completo ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              paso4Completo ? 'bg-emerald-500 text-slate-950' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}>
              {paso4Completo ? <Check className="w-3.5 h-3.5" /> : '4'}
            </span>
            <div className="truncate">
              <span className="font-bold block truncate">4. Cita con Infonavit</span>
              <span className="text-[10px] text-zinc-500">{citaEstado === 'confirmada' ? 'Agendada' : 'Pendiente'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO INTERACTIVA */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-gradient-to-b before:from-[#c5a059] before:via-zinc-700 before:to-zinc-800">
        
        {/* ========================================================================= */}
        {/* PASO 1: RECAUDAR NSS, CONTRASEÑA DE INFONAVIT Y SUBIR TABLA DE AMORTIZACIÓN */}
        {/* ========================================================================= */}
        <div className="relative flex items-start gap-6 group">
          {/* Nodo Step Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 z-10 transition-all ${
            paso1Completo
              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
              : 'bg-zinc-900 border-[#c5a059] text-[#dfba73]'
          }`}>
            {paso1Completo ? <CheckCircle2 className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
          </div>

          {/* Contenido Card Paso 1 */}
          <div className="flex-1 bg-zinc-900/90 border border-zinc-800 hover:border-[#c5a059]/40 rounded-3xl p-6 shadow-md transition-all space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                    Paso 1 Obligatorio
                  </span>
                  {paso1Completo ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> En espera de datos o archivo
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Recaudar NSS, Contraseña de Infonavit y Sacar Tabla de Amortización
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Una vez dado de alta el cliente, el primer paso es obtener su NSS y Contraseña para entrar a{' '}
                  <strong className="text-zinc-200">Mi Cuenta Infonavit</strong>, precalificar el crédito y descargar la Tabla de Amortización.
                </p>
              </div>

              <a
                href="https://micuenta.infonavit.org.mx/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 border border-red-500/40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Portal Infonavit ↗</span>
              </a>
            </div>

            {/* Grid 2 Bloques: A) Credenciales | B) Subida Tabla de Amortización */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bloque A: Credenciales Portal */}
              <div className="p-4 rounded-2xl bg-[#0d0e12] border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#c5a059]" />
                    Credenciales del Portal Mi Cuenta Infonavit
                  </h4>
                  <button
                    type="button"
                    onClick={handleGuardarCredenciales}
                    disabled={savingCreds}
                    className="px-3 py-1 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingCreds ? 'Guardando...' : 'Guardar Credenciales'}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Campo NSS */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      NSS (Número de Seguridad Social - 11 dígitos):
                    </label>
                    <div className="flex items-center gap-2">
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
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
                        title="Copiar NSS al portapapeles"
                      >
                        {copiedCreds === 'nss' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Contraseña Portal Infonavit:
                    </label>
                    <div className="flex items-center gap-2">
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
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(passwordInput, 'pass')}
                        disabled={!passwordInput}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
                        title="Copiar contraseña"
                      >
                        {copiedCreds === 'pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque B: Subida de Tabla de Amortización */}
              <div className="p-4 rounded-2xl bg-[#0d0e12] border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#c5a059]" />
                      Tabla de Amortización (PDF o Imagen)
                    </h4>
                    {hasTablaAmortizacion && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ Archivo Cargado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Descárgala de Mi Cuenta Infonavit y súbela aquí para anexarla al expediente del cliente.
                  </p>
                </div>

                {hasTablaAmortizacion ? (
                  <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-white text-xs block truncate">
                          Tabla_de_Amortizacion.pdf
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">Disponible en el expediente</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewDoc(tablaAmortizacionUrl, 'Tabla de Amortización - ' + clienteNombreCompleto)}
                        className="px-2.5 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#dfba73] text-[10px] font-bold rounded-lg border border-[#c5a059]/40 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadDoc(tablaAmortizacionUrl, 'Tabla_Amortizacion_' + clienteNombreCompleto)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Bajar</span>
                      </button>
                      <label className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reemplazar</span>
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
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#c5a059]/40 hover:border-[#c5a059] bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group/upload">
                    <Upload className="w-7 h-7 text-[#c5a059] mb-1 group-hover/upload:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-white">
                      Haz clic para subir la Tabla de Amortización
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      Archivos aceptados: PDF, JPG, PNG
                    </span>
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PASO 2: CONTRATO DE PRESTACIÓN DE SERVICIO (PRESET LISTO EN SUPABASE)     */}
        {/* ========================================================================= */}
        <div className="relative flex items-start gap-6 group">
          {/* Nodo Step Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 z-10 transition-all ${
            paso2Completo
              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
              : 'bg-zinc-900 border-[#c5a059] text-[#dfba73]'
          }`}>
            {paso2Completo ? <CheckCircle2 className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
          </div>

          {/* Contenido Card Paso 2 */}
          <div className="flex-1 bg-zinc-900/90 border border-zinc-800 hover:border-[#c5a059]/40 rounded-3xl p-6 shadow-md transition-all space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                    Paso 2
                  </span>
                  {paso2Completo ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Contrato Formalizado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Generar Enlace de Firma para el Cliente
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Hacer el Contrato de Prestación de Servicio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Genera el enlace para que el cliente firme el Contrato de Prestación de Servicios desde su teléfono o descárgalo firmado.
                </p>
              </div>

              {onDownloadContratosPdf && (
                <button
                  type="button"
                  onClick={onDownloadContratosPdf}
                  disabled={downloadingBundle === 'contratos'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Descargar Contrato en PDF</span>
                </button>
              )}
            </div>

            {/* Listado del Contrato de Prestación de Servicio */}
            <div className="space-y-3">
              {listaContratosPaso2.map((preset) => {
                const docKey = `doc_preset_${preset.id}`;
                const existingUrl = selectedCliente?.documentos_urls?.[docKey];
                const hasEmptySample = Boolean(preset.samplePdfUrl);

                return (
                  <div
                    key={preset.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      existingUrl
                        ? 'bg-[#0d0e12] border-emerald-500/30'
                        : 'bg-[#0d0e12] border-[#c5a059]/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        existingUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-[#dfba73]'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate">
                            {preset.name}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 block mt-0.5">
                          {existingUrl ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Llenado y firmado por el cliente
                            </span>
                          ) : (
                            'Formato oficial listo para generar enlace de firma'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Ver Plantilla Vacía */}
                      {hasEmptySample && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(preset.samplePdfUrl!, `Plantilla: ${preset.name}`)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                          title="Previsualizar formato plantilla vacía"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
                          <span>Ver Vacío</span>
                        </button>
                      )}

                      {/* Ver Llenado */}
                      {existingUrl && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(existingUrl, `Llenado: ${preset.name} - ${clienteNombreCompleto}`)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Ver Firmado</span>
                        </button>
                      )}

                      {/* Generar Enlace para Cliente */}
                      {!existingUrl && (
                        <button
                          type="button"
                          onClick={() => onGenerateClientDocLink(preset, tipoTramiteActual)}
                          className="px-4 py-1.5 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Generar Enlace para Cliente</span>
                        </button>
                      )}

                      {/* Quitar para volver a generar */}
                      {existingUrl && (
                        <button
                          type="button"
                          onClick={() => onRemoveDocPreset(preset, docKey)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Reiniciar contrato para enviar nuevo link"
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
        </div>

        {/* ========================================================================= */}
        {/* PASO 3: RECAUDACIÓN DE DOCUMENTACIÓN (INE, COMPROBANTE, ACTA, ETC.)       */}
        {/* ========================================================================= */}
        <div className="relative flex items-start gap-6 group">
          {/* Nodo Step Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 z-10 transition-all ${
            paso3Completo
              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
              : 'bg-zinc-900 border-[#c5a059] text-[#dfba73]'
          }`}>
            {paso3Completo ? <CheckCircle2 className="w-8 h-8" /> : <FileDown className="w-8 h-8" />}
          </div>

          {/* Contenido Card Paso 3 */}
          <div className="flex-1 bg-zinc-900/90 border border-zinc-800 hover:border-[#c5a059]/40 rounded-3xl p-6 shadow-md transition-all space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                    Paso 3
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {docsCompletadosCount} de 9 Requisitos Oficiales Listos
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Recaudación de Documentación del Expediente
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Recopilar INE, Comprobante de Domicilio, Acta de Nacimiento, CURP, Constancia SAT, Estado de Cuenta,
                  3 Referencias y Fotos del Inmueble.
                </p>
              </div>

              {onDownloadOficialesPdf && (
                <button
                  type="button"
                  onClick={onDownloadOficialesPdf}
                  disabled={downloadingBundle === 'oficiales'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar Expediente Completo (1 PDF)</span>
                </button>
              )}
            </div>

            {/* Grid 2 Columnas de Documentos Requeridos */}
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
                  numberTag={1}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_ine_normal`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 2. INE Ampliada 200% */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_ine_ampliada_200"
                  label="2. INE Ampliada al 200%"
                  isCompleted={trMejoravit.req_ine_ampliada_200}
                  existingDocUrl={trMejoravit.documentos_urls?.req_ine_ampliada_200}
                  numberTag={2}
                  extraAction={
                    normalIneUrl ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onGenerateIneAmpliada200(trMejoravit.id, normalIneUrl)}
                          disabled={generatingAmpliada200}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-[#dfba73]" />
                          <span>{generatingAmpliada200 ? 'Procesando...' : 'Generar 200%'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenManualIneCropper(trMejoravit.id, normalIneUrl)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <ScanLine className="w-3 h-3" />
                          <span>Manual</span>
                        </button>
                      </div>
                    ) : null
                  }
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_ine_ampliada_200`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 3. CURP */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_curp_actualizada"
                  label="3. CURP Actualizada"
                  isCompleted={trMejoravit.req_curp_actualizada}
                  existingDocUrl={trMejoravit.documentos_urls?.req_curp_actualizada || selectedCliente?.curp_document_url}
                  numberTag={3}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_curp_actualizada`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 4. Acta de Nacimiento */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_acta_nacimiento"
                  label="4. Acta de Nacimiento"
                  isCompleted={trMejoravit.req_acta_nacimiento}
                  existingDocUrl={trMejoravit.documentos_urls?.req_acta_nacimiento}
                  numberTag={4}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_acta_nacimiento`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 5. Comprobante Domicilio */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_comprobante_domicilio"
                  label="5. Comprobante de Domicilio"
                  isCompleted={trMejoravit.req_comprobante_domicilio}
                  existingDocUrl={trMejoravit.documentos_urls?.req_comprobante_domicilio}
                  numberTag={5}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_comprobante_domicilio`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 6. Estado de Cuenta */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_estado_cuenta_bancario"
                  label="6. Estado de Cuenta Bancario"
                  isCompleted={trMejoravit.req_estado_cuenta_bancario}
                  existingDocUrl={trMejoravit.documentos_urls?.req_estado_cuenta_bancario}
                  numberTag={6}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_estado_cuenta_bancario`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />

                {/* 7. Constancia Situación Fiscal */}
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={trMejoravit.id}
                  reqKey="req_constancia_situacion_fiscal"
                  label="7. Situación Fiscal (SAT / RFC)"
                  isCompleted={trMejoravit.req_constancia_situacion_fiscal}
                  existingDocUrl={trMejoravit.documentos_urls?.req_constancia_situacion_fiscal}
                  numberTag={7}
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_constancia_situacion_fiscal`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
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
                  numberTag={9}
                  extraAction={
                    <button
                      type="button"
                      onClick={() => onOpenInmuebleFotosModal(trMejoravit.id, trMejoravit)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer mr-1"
                    >
                      <Camera className="w-3 h-3 text-[#c5a059]" />
                      <span>{trMejoravit.documentos_urls?.req_fotos_inmueble_5 ? 'Editar 5 Fotos' : 'Subir 5 Fotos'}</span>
                    </button>
                  }
                  isUploading={uploadingDocKey === `${trMejoravit.id}_req_fotos_inmueble_5`}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PASO 4: CITA CON INFONAVIT (COORDINACIÓN Y RECORDATORIO AL CLIENTE)       */}
        {/* ========================================================================= */}
        <div className="relative flex items-start gap-6 group">
          {/* Nodo Step Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 z-10 transition-all ${
            paso4Completo
              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
              : 'bg-zinc-900 border-[#c5a059] text-[#dfba73]'
          }`}>
            {paso4Completo ? <CheckCircle2 className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
          </div>

          {/* Contenido Card Paso 4 */}
          <div className="flex-1 bg-zinc-900/90 border border-zinc-800 hover:border-[#c5a059]/40 rounded-3xl p-6 shadow-md transition-all space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40">
                    Paso 4 Final
                  </span>
                  {citaEstado === 'confirmada' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Cita Agendada y Confirmada
                    </span>
                  ) : citaEstado === 'asistida' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      ★ Cita Realizada / Trámite Finalizado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendiente de Programación ante Infonavit
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Mandar al Cliente a la Cita con Infonavit
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Una vez conformado el expediente oficial y con el contrato listo, se programa la cita del cliente
                  en el Centro de Servicio Infonavit (CESI) y se le envían las instrucciones y documentos que debe llevar.
                </p>
              </div>

              {/* Botón WhatsApp */}
              <button
                type="button"
                onClick={handleSendWhatsAppCita}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{copiedWpCita ? '¡Mensaje Copiado!' : 'Enviar Recordatorio WhatsApp'}</span>
              </button>
            </div>

            {/* Formulario de Cita */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Fecha */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Fecha de la Cita:
                </label>
                <input
                  type="date"
                  value={citaFecha}
                  onChange={(e) => setCitaFecha(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Hora */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Hora de la Cita:
                </label>
                <input
                  type="time"
                  value={citaHora}
                  onChange={(e) => setCitaHora(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Centro de Servicio / CESI */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Centro CESI / Delegación:
                </label>
                <input
                  type="text"
                  value={citaLugar}
                  onChange={(e) => setCitaLugar(e.target.value)}
                  placeholder="Ej. CESI Guadalajara (Av. Vallarta)"
                  className="w-full bg-[#0d0e12] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Folio Cita */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Folio de Cita Infonavit:
                </label>
                <input
                  type="text"
                  value={citaFolio}
                  onChange={(e) => setCitaFolio(e.target.value)}
                  placeholder="Ej. CITA-2026-9812"
                  className="w-full bg-[#0d0e12] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Estado de la Cita */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Estatus de la Cita:
                </label>
                <select
                  value={citaEstado}
                  onChange={(e) => setCitaEstado(e.target.value as any)}
                  className="w-full bg-[#0d0e12] border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="pendiente">⏳ Pendiente de Agendar</option>
                  <option value="confirmada">✓ Cita Agendada y Confirmada</option>
                  <option value="asistida">★ Cita Asistida / Trámite Finalizado</option>
                  <option value="cancelada">✕ Cita Cancelada o Reprogramar</option>
                </select>
              </div>

              {/* Botón Guardar Cita */}
              <div className="flex items-end md:col-span-2">
                <button
                  type="button"
                  onClick={handleGuardarCita}
                  disabled={savingCita}
                  className="w-full py-2 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-xs"
                >
                  {savingCita ? 'Guardando Datos de Cita...' : 'Guardar Información de Cita'}
                </button>
              </div>
            </div>

            {/* Subida de Comprobante de Cita & Checklist de Requisitos Físicos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Subida Comprobante */}
              <div className="p-4 rounded-2xl bg-[#0d0e12] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#c5a059]" />
                    Comprobante Oficial de Cita Infonavit
                  </h4>
                  {comprobanteCitaUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      ✓ Adjuntado
                    </span>
                  )}
                </div>

                {comprobanteCitaUrl ? (
                  <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white text-xs truncate">
                        Confirmacion_Cita_Infonavit.pdf
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewDoc(comprobanteCitaUrl, 'Comprobante de Cita - ' + clienteNombreCompleto)}
                        className="px-2.5 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#dfba73] text-[10px] font-bold rounded-lg border border-[#c5a059]/40 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                      <label className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reemplazar</span>
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
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-zinc-700 hover:border-[#c5a059] bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-[#c5a059] mb-1" />
                    <span className="text-xs font-bold text-white">Subir Comprobante de Cita (PDF o Imagen)</span>
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

              {/* Checklist de lo que debe llevar el cliente */}
              <div className="p-4 rounded-2xl bg-[#0d0e12] border border-zinc-800 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Checklist: Lo que el cliente debe llevar a su cita
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>INE Vigente en Original</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Acta de Nacimiento Original</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Tabla de Amortización</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Contrato / Solicitud Firmada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Comp. Domicilio Reciente</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Comprobante de Cita Impreso</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
