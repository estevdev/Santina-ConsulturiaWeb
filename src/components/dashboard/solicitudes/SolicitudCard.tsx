'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  UserPlus, 
  Save, 
  FileEdit,
  ExternalLink,
  ChevronDown,
  Building2,
  Clock
} from 'lucide-react';
import { 
  SolicitudContacto, 
  EstadoSolicitud, 
  TRAMITES_NOMBRES, 
  ESTADOS_SOLICITUD_CONFIG 
} from '@/types/solicitud';

interface SolicitudCardProps {
  solicitud: SolicitudContacto;
  onUpdateStatus: (id: string, newStatus: EstadoSolicitud) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onConvertToClient: (solicitud: SolicitudContacto) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isConverting?: boolean;
}

export function SolicitudCard({
  solicitud,
  onUpdateStatus,
  onUpdateNotes,
  onConvertToClient,
  onDelete,
  isConverting = false,
}: SolicitudCardProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(solicitud.notas_admin || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const statusConfig = ESTADOS_SOLICITUD_CONFIG[solicitud.estado] || ESTADOS_SOLICITUD_CONFIG.pendiente;
  const tramiteLabel = TRAMITES_NOMBRES[solicitud.tramite_interes] || solicitud.tramite_interes;

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // WhatsApp pre-filled link
  const getWhatsappUrl = () => {
    const text = encodeURIComponent(
      `Hola ${solicitud.nombre}, te escribo de Santina Consultoría Web en seguimiento a tu solicitud de diagnóstico para ${tramiteLabel}. ¿En qué podemos ayudarte el día de hoy?`
    );
    const cleanPhone = solicitud.telefono.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
    return `https://wa.me/${fullPhone}?text=${text}`;
  };

  const handleStatusSelect = async (newStatus: EstadoSolicitud) => {
    if (newStatus === solicitud.estado) return;
    setChangingStatus(true);
    try {
      await onUpdateStatus(solicitud.id, newStatus);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdateNotes(solicitud.id, notes);
      setEditingNotes(false);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-black/40 flex flex-col justify-between group">
      <div>
        {/* Top Header: Trámite + Status badge + Fecha */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30">
              {tramiteLabel}
            </span>

            {/* Status Dropdown */}
            <div className="relative inline-block">
              <select
                value={solicitud.estado}
                disabled={changingStatus}
                onChange={(e) => handleStatusSelect(e.target.value as EstadoSolicitud)}
                className={`text-xs font-bold px-3 py-1 pr-6 rounded-lg appearance-none cursor-pointer border transition-colors ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} focus:outline-none focus:ring-1 focus:ring-[#c5a059]`}
              >
                <option value="pendiente" className="bg-zinc-900 text-white">Pendiente</option>
                <option value="contactado" className="bg-zinc-900 text-white">Contactado</option>
                <option value="convertido" className="bg-zinc-900 text-white">Convertido</option>
                <option value="descartado" className="bg-zinc-900 text-white">Descartado</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{formatDate(solicitud.created_at)}</span>
          </div>
        </div>

        {/* Prospect Info */}
        <div className="py-4 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#dfba73] transition-colors">
              {solicitud.nombre}
            </h3>
            {solicitud.estado_republica && (
              <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{solicitud.estado_republica}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Phone */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-zinc-200 select-all font-semibold">
                {solicitud.telefono}
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-zinc-300 truncate select-all">
                {solicitud.email || 'No proporcionado'}
              </span>
            </div>
          </div>

          {/* User Message / Query */}
          {solicitud.mensaje && (
            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Consulta / Mensaje:
              </span>
              <p className="italic leading-relaxed">
                "{solicitud.mensaje}"
              </p>
            </div>
          )}

          {/* Admin Notes Section */}
          <div className="pt-2">
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe notas internas sobre el prospecto (ej. ya se le llamó, cita el martes)..."
                  className="w-full text-xs p-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                  rows={2}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotes(solicitud.notas_admin || '');
                      setEditingNotes(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveNotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-950 bg-[#dfba73] hover:bg-[#c5a059] cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Notas Internas:
                  </span>
                  <p className="text-zinc-300 mt-0.5 leading-snug">
                    {solicitud.notas_admin || <span className="text-zinc-400 italic">Sin notas registradas</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  title="Editar notas"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
        {/* Contact Links */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Direct */}
          <a
            href={getWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 transition-all cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          {/* Call direct */}
          <a
            href={`tel:${solicitud.telefono}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-zinc-400" />
            <span>Llamar</span>
          </a>
        </div>

        {/* Conversion & Management */}
        <div className="flex items-center gap-2">
          {solicitud.cliente_id ? (
            <Link
              href="/dashboard/clientes"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ver en Clientes</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled={isConverting}
              onClick={() => onConvertToClient(solicitud)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convertir a Cliente</span>
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(solicitud.id)}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Eliminar solicitud"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
