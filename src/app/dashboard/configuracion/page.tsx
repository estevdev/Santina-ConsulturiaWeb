'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquareText,
  Settings,
  Bell,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Cpu,
} from 'lucide-react';

export default function ConfiguracionGlobalPage() {
  const modulos = [
    {
      id: 'mensajes-automatizados',
      titulo: 'Mensajes Automatizados',
      descripcion:
        'Gestiona y edita los mensajes de WhatsApp que se envían automáticamente al cliente al cambiar de estado, compartir credenciales o solicitar documentos.',
      href: '/dashboard/configuracion/mensajes-automatizados',
      icon: MessageSquareText,
      badge: 'WhatsApp Cloud API',
      estado: 'Activo',
      estadoColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      totalItems: '8 Mensajes configurados',
      destacado: true,
    },
    {
      id: 'notificaciones-push',
      titulo: 'Notificaciones Push Web',
      descripcion:
        'Configuración del servicio de notificaciones web push para alertas instantáneas a clientes en el portal de seguimiento.',
      href: '#',
      icon: Bell,
      badge: 'Web Push Service',
      estado: 'En Línea',
      estadoColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      totalItems: 'Dispositivos registrados',
      destacado: false,
    },
    {
      id: 'credenciales-api',
      titulo: 'Credenciales y APIs Externas',
      descripcion:
        'Revisión de llaves de Supabase, Meta WhatsApp Cloud API y servicios de almacenamiento de expedientes.',
      href: '#',
      icon: ShieldCheck,
      badge: 'Seguridad',
      estado: 'Protegido',
      estadoColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      totalItems: 'Tokens activos',
      destacado: false,
    },
    {
      id: 'presets-documentos',
      titulo: 'Plantillas y Presets PDF',
      descripcion:
        'Configura los formatos dinámicos y contratos generados automáticamente con los datos del solicitante.',
      href: '/dashboard/pdf-preset-studio',
      icon: FileSpreadsheet,
      badge: 'PDF Studio',
      estado: 'Disponible',
      estadoColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      totalItems: 'Acceso directo',
      destacado: false,
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#13141d] to-slate-900 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#dfba73] uppercase tracking-wider">
            <Settings className="w-4 h-4 text-[#c5a059]" />
            <span>Administración del Sistema</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Configuración Global
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Panel centralizado de automatizaciones, canales de comunicación y preferencias de la plataforma de Santina Consultoría.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-zinc-800/60 rounded-2xl border border-zinc-700/60 shrink-0">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">WhatsApp Cloud API</p>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Meta Conectado
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Secciones de Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modulos.map((mod) => {
          const Icon = mod.icon;
          const isLink = mod.href !== '#';

          const content = (
            <div
              className={`h-full p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                mod.destacado
                  ? 'bg-gradient-to-b from-[#14151f] to-[#0d0e12] border-[#c5a059]/40 hover:border-[#c5a059] shadow-lg shadow-[#c5a059]/5 group cursor-pointer'
                  : 'bg-white dark:bg-[#0d0e12] border-slate-200 dark:border-zinc-800/80 hover:border-zinc-700 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      mod.destacado
                        ? 'bg-[#c5a059]/15 border-[#c5a059]/30 text-[#dfba73]'
                        : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${mod.estadoColor}`}>
                      {mod.estado}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/60 px-2 py-1 rounded-lg border border-zinc-700/50">
                      {mod.badge}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {mod.titulo}
                    {mod.destacado && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Principal
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {mod.descripcion}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-zinc-500 font-medium">
                  {mod.totalItems}
                </span>

                {isLink ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#c5a059] group-hover:text-[#dfba73] group-hover:translate-x-0.5 transition-all">
                    Entrar a la pantalla
                    <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="text-zinc-500 text-[11px]">En desarrollo</span>
                )}
              </div>
            </div>
          );

          if (isLink) {
            return (
              <Link key={mod.id} href={mod.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={mod.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
