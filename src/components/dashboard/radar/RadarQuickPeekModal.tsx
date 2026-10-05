'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  Calendar,
  MapPin,
  FileText,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';
import { ESTADOS_CLIENTE, getEstadoClienteConfig } from '@/constants/estadosCliente';
import Link from 'next/link';
import { toast } from 'sonner';

interface RadarQuickPeekModalProps {
  cliente: ClienteRadar | null;
  onClose: () => void;
  onChangeClienteStatus: (clienteId: string, newStatus: string) => Promise<void>;
}

export function RadarQuickPeekModal({
  cliente,
  onClose,
  onChangeClienteStatus,
}: RadarQuickPeekModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!cliente) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openWhatsApp = async () => {
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    const msg = `Hola *${cliente.nombre}*, te contactamos de *Santina Consultoría* respecto a tu expediente. ¿Podrías confirmarnos si tienes alguna duda con tu proceso?`;
    if (!tel) {
      toast.error('El cliente no tiene teléfono guardado');
      return;
    }

    try {
      toast.info(`Enviando WhatsApp a ${cliente.nombre}...`);
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: tel,
          mensaje: msg,
          clienteNombre: cliente.nombre,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar por WhatsApp');
      }
      toast.success(`¡WhatsApp enviado a ${cliente.nombre}!`, {
        description: `Entregado al ${tel} vía WhatsApp Cloud API.`,
      });
    } catch (err: any) {
      console.error(err);
      toast.warning('Aviso de WhatsApp: ' + err.message);
      window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await onChangeClienteStatus(cliente.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const currentStatusConfig = getEstadoClienteConfig(cliente.estado_cliente);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0e0f14] border border-[#c5a059]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 font-bold text-base flex items-center justify-center shadow-lg shadow-[#c5a059]/20 shrink-0">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {cliente.nombreCompleto}
                </h2>
                {cliente.isPuntoDeSalir && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> A punto de salir
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {cliente.creado_por_nombre ? `Asesor asignado: ${cliente.creado_por_nombre}` : 'Sin asesor asignado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/clientes?clienteId=${cliente.id}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#dfba73] text-zinc-950 font-bold text-xs shadow-md shadow-[#c5a059]/20 transition-all"
            >
              <span>Abrir Expediente</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-xs">
          {/* Status Changer Bar */}
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">
                Estado Actual del Cliente
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${currentStatusConfig.badgeClass}`}>
                  {currentStatusConfig.label}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {currentStatusConfig.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-medium">Cambiar a:</span>
              <select
                disabled={isUpdatingStatus}
                value={(cliente.estado_cliente || 'interesado').toLowerCase()}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 hover:border-[#c5a059] text-zinc-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#c5a059] cursor-pointer disabled:opacity-50"
              >
                {ESTADOS_CLIENTE.map((est) => (
                  <option key={est.value} value={est.value}>
                    {est.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact & Identity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone & WhatsApp */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">Teléfono</p>
                  <p className="text-xs font-bold text-white font-mono">
                    {cliente.telefono || 'Sin teléfono'}
                  </p>
                </div>
              </div>
              {cliente.telefono && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(cliente.telefono || '', 'tel')}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    title="Copiar teléfono"
                  >
                    {copiedKey === 'tel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={openWhatsApp}
                    className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}
            </div>

            {/* CURP & NSS */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">CURP:</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {cliente.curp || 'No registrada'}
                  </span>
                  {cliente.curp && (
                    <button
                      onClick={() => copyToClipboard(cliente.curp || '', 'curp')}
                      className="text-zinc-400 hover:text-white"
                      title="Copiar CURP"
                    >
                      {copiedKey === 'curp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">NSS:</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {cliente.nss || 'No registrado'}
                  </span>
                  {cliente.nss && (
                    <button
                      onClick={() => copyToClipboard(cliente.nss || '', 'nss')}
                      className="text-zinc-400 hover:text-white"
                      title="Copiar NSS"
                    >
                      {copiedKey === 'nss' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cita Infonavit Widget if exists */}
          {cliente.cita?.fecha && (
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-200">
                    Cita Infonavit Programada
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  {cliente.cita.estado || 'Confirmada'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400">Fecha y Hora:</span>
                  <p className="font-bold text-white mt-0.5">
                    {cliente.cita.fecha} {cliente.cita.hora ? `a las ${cliente.cita.hora}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">Lugar / CESI:</span>
                  <p className="font-bold text-white mt-0.5 truncate">
                    {cliente.cita.lugar || 'CESI Infonavit'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">Folio:</span>
                  <p className="font-mono font-bold text-zinc-200 mt-0.5">
                    {cliente.cita.folio || 'N/A'}
                  </p>
                </div>
              </div>

              {cliente.cita.comprobanteUrl && (
                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-end">
                  <a
                    href={cliente.cita.comprobanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 font-semibold underline underline-offset-2"
                  >
                    <span>Ver Comprobante de Cita PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Trámites & Requirements Checklist Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <span>Expediente de Trámites</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                {cliente.overallProgress}% avance global
              </span>
            </h3>

            {cliente.tramites.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-400 text-xs">
                Este cliente no tiene trámites formales registrados.
              </div>
            ) : (
              cliente.tramites.map((tr) => (
                <div
                  key={tr.tipo}
                  className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tr.nombre}</span>
                    <span className="text-[10px] font-bold text-[#dfba73]">
                      {tr.completedReqs} de {tr.totalReqs} completados ({tr.progreso}%)
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#c5a059] to-emerald-400 h-full rounded-full"
                      style={{ width: `${tr.progreso}%` }}
                    />
                  </div>

                  {/* Checklist pills */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {tr.completados.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-1 rounded-lg"
                      >
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                    {tr.faltantes.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-1 rounded-lg"
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">Pendiente: {item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes if any */}
          {cliente.notas && (
            <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Notas del Asesor
              </span>
              <p className="whitespace-pre-wrap">{cliente.notas}</p>
            </div>
          )}
        </div>

        {/* Mobile footer action */}
        <div className="p-3 sm:hidden border-t border-zinc-800 bg-zinc-950/80">
          <Link
            href={`/dashboard/clientes?clienteId=${cliente.id}`}
            className="w-full py-2 rounded-xl bg-[#c5a059] hover:bg-[#dfba73] text-zinc-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Abrir Expediente Completo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
