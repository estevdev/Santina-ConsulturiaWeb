'use client';

import React from 'react';
import { 
  Inbox, 
  Clock, 
  PhoneCall, 
  UserCheck, 
  UserX,
  AlertCircle
} from 'lucide-react';
import { SolicitudContacto, EstadoSolicitud } from '@/types/solicitud';

interface SolicitudesMetricsProps {
  solicitudes: SolicitudContacto[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function SolicitudesMetrics({
  solicitudes,
  activeFilter,
  onFilterChange,
}: SolicitudesMetricsProps) {
  const total = solicitudes.length;
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const contactados = solicitudes.filter((s) => s.estado === 'contactado').length;
  const convertidos = solicitudes.filter((s) => s.estado === 'convertido').length;
  const descartados = solicitudes.filter((s) => s.estado === 'descartado').length;

  const cards = [
    {
      id: 'todos',
      label: 'Total Solicitudes',
      count: total,
      icon: Inbox,
      color: 'text-white',
      accentColor: 'text-[#c5a059]',
      bgGlow: 'from-[#c5a059]/10 to-transparent',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'pendiente',
      label: 'Nuevas / Pendientes',
      count: pendientes,
      icon: Clock,
      color: 'text-amber-400',
      accentColor: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: pendientes > 0 ? 'border-amber-500/40 ring-1 ring-amber-500/30' : 'border-zinc-800',
      badgeAlert: pendientes > 0 ? '¡Por atender!' : undefined,
    },
    {
      id: 'contactado',
      label: 'En Seguimiento',
      count: contactados,
      icon: PhoneCall,
      color: 'text-blue-400',
      accentColor: 'text-blue-400',
      bgGlow: 'from-blue-500/10 to-transparent',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'convertido',
      label: 'Convertidos a Cliente',
      count: convertidos,
      icon: UserCheck,
      color: 'text-emerald-400',
      accentColor: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'descartado',
      label: 'Descartados',
      count: descartados,
      icon: UserX,
      color: 'text-zinc-400',
      accentColor: 'text-zinc-400',
      bgGlow: 'from-zinc-500/10 to-transparent',
      borderColor: 'border-zinc-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(card.id)}
            className={`relative p-4 rounded-2xl bg-zinc-900/70 border text-left transition-all cursor-pointer overflow-hidden group ${
              isActive
                ? 'ring-2 ring-[#c5a059] border-transparent shadow-lg shadow-[#c5a059]/10 bg-zinc-900'
                : `${card.borderColor} hover:border-zinc-700 hover:bg-zinc-900/90`
            }`}
          >
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} opacity-30 group-hover:opacity-50 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg bg-zinc-800/80 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tracking-tight">
                  {card.count}
                </span>
                {total > 0 && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {Math.round((card.count / total) * 100)}%
                  </span>
                )}
              </div>

              {card.badgeAlert && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 animate-pulse">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>{card.badgeAlert}</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
