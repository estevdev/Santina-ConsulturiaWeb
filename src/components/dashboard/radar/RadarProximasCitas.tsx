'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';

interface RadarProximasCitasProps {
  clientes: ClienteRadar[];
  onOpenQuickPeek: (cliente: ClienteRadar) => void;
}

export function RadarProximasCitas({
  clientes,
  onOpenQuickPeek,
}: RadarProximasCitasProps) {
  // Filter clients with citas and sort them
  const clientesConCita = clientes
    .filter((c) => c.cita && c.cita.fecha)
    .sort((a, b) => {
      const da = a.cita?.diasRestantes ?? 999;
      const db = b.cita?.diasRestantes ?? 999;
      return da - db;
    });

  const openWhatsAppCita = (e: React.MouseEvent, cliente: ClienteRadar) => {
    e.stopPropagation();
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    const cita = cliente.cita;
    const msg = `🗓️ *CONSULTORÍA SANTINA - RECORDATORIO DE CITA*\n\nEstimado(a) *${cliente.nombreCompleto}*:\n\nTe recordamos tu cita agendada:\n📅 *Fecha:* ${cita?.fecha || 'Por confirmar'}\n⏰ *Hora:* ${cita?.hora || 'Por confirmar'}\n📍 *Lugar:* ${cita?.lugar || 'Oficina / CESI'}\n🏷️ *Folio:* ${cita?.folio || 'N/A'}\n\nPor favor asiste puntual con tus documentos originales. Si requieres apoyo, avísanos con anticipación.`;
    if (tel) {
      window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const getCitaBadge = (dias?: number, esHoy?: boolean, esManana?: boolean) => {
    if (esHoy) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          ¡HOY!
        </span>
      );
    }
    if (esManana) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          MAÑANA
        </span>
      );
    }
    if (dias !== undefined) {
      if (dias < 0) {
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            Realizada / Pasada
          </span>
        );
      }
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          En {dias} días
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
        Programada
      </span>
    );
  };

  if (clientesConCita.length === 0) {
    return (
      <div className="bg-[#0d0e12] border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>No hay citas programadas actualmente en el sistema.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0e12] border border-purple-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -left-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            Próximas Citas en Agenda
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
              {clientesConCita.length} agendadas
            </span>
          </h2>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block">
          Citas presenciales Infonavit e instituciones
        </span>
      </div>

      {/* Compact Horizontal Carousel / Deck */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
        {clientesConCita.map((cliente) => {
          const cita = cliente.cita!;
          return (
            <div
              key={cliente.id}
              onClick={() => onOpenQuickPeek(cliente)}
              className="min-w-[270px] sm:min-w-[300px] max-w-[340px] bg-zinc-900/90 hover:bg-zinc-800/90 border border-purple-500/25 hover:border-purple-400/50 rounded-xl p-2.5 transition-all cursor-pointer shadow-md group shrink-0 flex flex-col justify-between"
            >
              <div>
                {/* Top line: Date tag & countdown */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>{cita.fecha || 'Fecha por confirmar'}</span>
                    {cita.hora && (
                      <span className="text-[11px] text-zinc-400 font-normal">
                        ({cita.hora})
                      </span>
                    )}
                  </div>
                  {getCitaBadge(cita.diasRestantes, cita.esHoy, cita.esManana)}
                </div>

                {/* Client name & advisor */}
                <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                  {cliente.nombreCompleto}
                </p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {cliente.creado_por_nombre ? `Asesor: ${cliente.creado_por_nombre}` : 'Sin asesor'}
                </p>

                {/* Location / Folio */}
                <div className="mt-2 text-[10px] text-zinc-300 bg-zinc-800/70 p-1.5 rounded-lg border border-zinc-700/60 space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">{cita.lugar || 'Centro de Servicio Infonavit'}</span>
                  </div>
                  {cita.folio && (
                    <p className="text-zinc-400 truncate pl-4">Folio: {cita.folio}</p>
                  )}
                </div>
              </div>

              {/* Bottom line: WhatsApp & View */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {cliente.telefono && (
                    <button
                      onClick={(e) => openWhatsAppCita(e, cliente)}
                      className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      title="Enviar recordatorio de cita por WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-400" />
                      Recordar cita
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-zinc-400 group-hover:text-purple-300 font-semibold transition-colors">
                  <span>Ver detalle</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
