'use client';

import React from 'react';
import {
  Zap,
  ArrowRight,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ClienteRadar } from '@/types/radar';
import Link from 'next/link';
import { toast } from 'sonner';

interface RadarProximosASalirProps {
  clientes: ClienteRadar[];
  onOpenQuickPeek: (cliente: ClienteRadar) => void;
}

export function RadarProximosASalir({
  clientes,
  onOpenQuickPeek,
}: RadarProximosASalirProps) {
  const proximos = clientes.filter((c) => c.isPuntoDeSalir);

  const getInitials = (nombre: string) => {
    return (nombre || 'CL')
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase();
  };

  const openWhatsApp = async (e: React.MouseEvent, cliente: ClienteRadar) => {
    e.stopPropagation();
    const tel = (cliente.telefono || '').replace(/\D/g, '');
    const msg = `Hola *${cliente.nombre}*, te contactamos de *Santina Consultoría* para darte seguimiento a la etapa final de tu trámite. Por favor comunícate con nosotros para coordinar la entrega.`;
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
    }
  };

  if (proximos.length === 0) {
    return (
      <div className="bg-[#0d0e12] border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#c5a059]" />
          <span>No hay clientes en fase crítica de cierre en este momento.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0e12] border border-emerald-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            A Punto de Salir / Próximos a Concluir
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              {proximos.length} listos
            </span>
          </h2>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block">
          Expedientes con requisitos &gt; 75% o cita agendada
        </span>
      </div>

      {/* Compact Horizontal Scroll / Deck (Zero vertical expansion) */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
        {proximos.map((cliente) => {
          const mainTramite = cliente.tramites[0];
          return (
            <div
              key={cliente.id}
              onClick={() => onOpenQuickPeek(cliente)}
              className="min-w-[270px] sm:min-w-[300px] max-w-[340px] bg-zinc-900/90 hover:bg-zinc-800/90 border border-emerald-500/25 hover:border-emerald-400/50 rounded-xl p-2.5 transition-all cursor-pointer shadow-md group shrink-0 flex flex-col justify-between"
            >
              {/* Top: Avatar, Name, Advisor */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {getInitials(cliente.nombreCompleto)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {cliente.nombreCompleto}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {cliente.creado_por_nombre ? `Asesor: ${cliente.creado_por_nombre}` : 'Sin asesor asignado'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {cliente.overallProgress}%
                  </span>
                </div>

                {/* Motivo Badge */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md truncate max-w-full">
                    {cliente.motivoPuntoDeSalir || 'Etapa final'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${cliente.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  {cliente.telefono && (
                    <button
                      onClick={(e) => openWhatsApp(e, cliente)}
                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                      title="Enviar WhatsApp al cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {cliente.cita?.fecha && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      {cliente.cita.fecha}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-emerald-300 font-semibold transition-colors">
                  <span>Ver ficha</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
