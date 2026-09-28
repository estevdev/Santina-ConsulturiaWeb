'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { Cliente } from '@/types/cliente';
import { 
  Users, 
  FileText, 
  Home, 
  Stethoscope, 
  Layers, 
  Plus, 
  ChevronRight, 
  Clock, 
  LayoutGrid, 
  TrendingUp, 
  Sliders, 
  Calendar 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [clientesCount, setClientesCount] = useState(0);
  const [retirosCount, setRetirosCount] = useState(0);
  const [mejoravitCount, setMejoravitCount] = useState(0);
  const [altaMedicaCount, setAltaMedicaCount] = useState(0);
  const [recentClientes, setRecentClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [cliRes, retRes, mejRes, altaRes, recCliRes] = await Promise.all([
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
          supabase.from('tramites_retiro_desempleo').select('id', { count: 'exact', head: true }),
          supabase.from('tramites_mejoravit').select('id', { count: 'exact', head: true }),
          supabase.from('tramites_alta_medica_imss').select('id', { count: 'exact', head: true }),
          supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(4),
        ]);

        setClientesCount(cliRes.count || 0);
        setRetirosCount(retRes.count || 0);
        setMejoravitCount(mejRes.count || 0);
        setAltaMedicaCount(altaRes.count || 0);
        setRecentClientes((recCliRes.data as Cliente[]) || []);
      } catch (err) {
        console.error('Error cargando métricas de dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-3 sm:space-y-3.5 pb-4 -mt-16">
      {/* Hero Banner Panorámico Oficial a lo ancho completo (+10% adicional) */}
      <div className="relative w-full h-[285px] sm:h-[325px] md:h-[365px] lg:h-[410px] xl:h-[430px] overflow-hidden bg-black border-b border-[#c5a059]/30 shadow-2xl">
        <img 
          src="/banner-dashboard.png" 
          alt="Consultoría Santina Banner Oficial" 
          className="w-full h-full object-cover object-[center_35%] block select-none"
        />
        {/* Degradado superior para proteger la legibilidad del header transparente */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none" />
        {/* Degradado inferior suave para integrar las tarjetas traslúcidas */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
        {/* Glow sutil dorado decorativo */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#c5a059]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#c5a059]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Contenedor Principal Ajustado a Escala de Pantalla Completa */}
      <div className="px-3 sm:px-4 lg:px-6 space-y-3 sm:space-y-3.5 max-w-[1700px] mx-auto">

        {/* 1. Fila Superior: 4 Tarjetas de Métricas Traslúcidas e Incrustadas sobre el Banner */}
        <div className="-mt-18 sm:-mt-22 md:-mt-28 relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Card 1: Clientes Registrados */}
          <div className="backdrop-blur-xl bg-black/55 dark:bg-black/55 rounded-xl p-2.5 sm:p-3 border border-[#c5a059]/40 shadow-xl shadow-black/80 flex items-center justify-between transition-all hover:bg-black/70 hover:border-[#dfba73]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#262015]/80 backdrop-blur-md border border-[#c5a059]/40 flex items-center justify-center text-[#dfba73] shrink-0 shadow-md">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-300 leading-tight drop-shadow-sm">Clientes Registrados</p>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-0.5 drop-shadow-md">
                  {loading ? '...' : clientesCount}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">Expedientes activos</p>
              </div>
            </div>
          </div>

          {/* Card 2: Retiro por Desempleo */}
          <div className="backdrop-blur-xl bg-[#062619]/55 dark:bg-[#062619]/55 rounded-xl p-2.5 sm:p-3 border border-emerald-500/40 shadow-xl shadow-black/80 flex items-center justify-between relative overflow-hidden transition-all hover:bg-[#062619]/70 hover:border-emerald-400">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b3323]/80 backdrop-blur-md border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-md">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-200 leading-tight drop-shadow-sm">Retiro por Desempleo</p>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-0.5 drop-shadow-md">
                  {loading ? '...' : retirosCount}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-emerald-300/80 font-medium">Trámites IMSS procesados</p>
              </div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-md border border-emerald-400/30 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/tramite-imss.png" alt="IMSS" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Card 3: Mejoravit Infonavit */}
          <div className="backdrop-blur-xl bg-[#300c16]/55 dark:bg-[#300c16]/55 rounded-xl p-2.5 sm:p-3 border border-rose-500/40 shadow-xl shadow-black/80 flex items-center justify-between relative overflow-hidden transition-all hover:bg-[#300c16]/70 hover:border-rose-400">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#360e19]/80 backdrop-blur-md border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0 shadow-md">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-rose-200 leading-tight drop-shadow-sm">Mejoravit Infonavit</p>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-0.5 drop-shadow-md">
                  {loading ? '...' : mejoravitCount}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-rose-300/80 font-medium">Créditos en efectivo</p>
              </div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-md border border-rose-400/30 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/tramite-mejoravit.png" alt="INFONAVIT" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Card 4: Alta Médica IMSS */}
          <div className="backdrop-blur-xl bg-[#0a1e3d]/55 dark:bg-[#0a1e3d]/55 rounded-xl p-2.5 sm:p-3 border border-blue-500/40 shadow-xl shadow-black/80 flex items-center justify-between relative overflow-hidden transition-all hover:bg-[#0a1e3d]/70 hover:border-blue-400">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0f2952]/80 backdrop-blur-md border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-md">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-blue-200 leading-tight drop-shadow-sm">Alta Médica IMSS</p>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-0.5 drop-shadow-md">
                  {loading ? '...' : altaMedicaCount}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-blue-300/80 font-medium">Asignaciones UMF activas</p>
              </div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-md border border-blue-400/30 p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/tramite-imss.png" alt="IMSS" className="w-full h-full object-contain" />
            </div>
          </div>

        </div>

        {/* 2. Sección Principal: Columna Izquierda (8 cols) + Columna Derecha (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
          
          {/* Columna Izquierda (8 columnas) */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-3.5">
            
            {/* Card: Tipos de Trámite */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#dfba73]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">Tipos de Trámite</h2>
                    <p className="text-[10px] text-zinc-400">Selecciona el trámite para gestionar clientes, documentos y seguimiento</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/clientes"
                  className="px-3 py-1.5 bg-[#dfba73] hover:bg-[#c5a059] text-zinc-950 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-sm shrink-0"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Nuevo Cliente</span>
                </Link>
              </div>

              {/* 3 Tarjetas Visuales de Servicios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                {/* 1. Retiro por Desempleo IMSS / AFORE */}
                <Link
                  href="/dashboard/clientes"
                  className="group relative rounded-xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-[#064e3b]/85 via-[#022c22]/95 to-black p-3 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] shadow-md hover:border-emerald-400/80 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md p-1 border border-emerald-400/30 flex items-center justify-center shadow-sm">
                      <img src="/tramite-desempleo.png" alt="IMSS" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-2">
                    <h3 className="text-xs font-bold text-white leading-tight">
                      Retiro por Desempleo <span className="text-emerald-300">IMSS/AFORE</span>
                    </h3>
                    <p className="text-[10px] font-semibold text-emerald-200 mt-0.5">
                      Hasta <span className="text-white font-bold">$35,193</span> en efectivo
                    </p>
                    <p className="text-[9px] text-zinc-300/80 mt-0.5 line-clamp-1 leading-tight">
                      Gestiona expedientes y consulta estatus.
                    </p>
                    <div className="mt-1.5 flex justify-end">
                      <span className="w-5 h-5 rounded-full bg-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-[10px] group-hover:scale-110 group-hover:bg-amber-300 transition-all shadow-sm">
                        <ChevronRight className="w-3 h-3 text-zinc-950" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 2. Crédito en Efectivo Mejoravit */}
                <Link
                  href="/dashboard/clientes"
                  className="group relative rounded-xl overflow-hidden border border-rose-500/30 bg-gradient-to-b from-[#881337]/85 via-[#4c0519]/95 to-black p-3 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] shadow-md hover:border-rose-400/80 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md p-1 border border-rose-400/30 flex items-center justify-center shadow-md">
                      <img src="/tramite-mejoravit.png" alt="Infonavit" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-2">
                    <h3 className="text-xs font-bold text-white leading-tight">
                      Crédito en Efectivo <span className="text-rose-300">Mejoravit</span>
                    </h3>
                    <p className="text-[10px] font-semibold text-rose-200 mt-0.5">
                      Desde <span className="text-white font-bold">$20k</span> a <span className="text-white font-bold">$169k</span>
                    </p>
                    <p className="text-[9px] text-zinc-300/80 mt-0.5 line-clamp-1 leading-tight">
                      Administra expedientes y contratos.
                    </p>
                    <div className="mt-1.5 flex justify-end">
                      <span className="w-5 h-5 rounded-full bg-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-[10px] group-hover:scale-110 group-hover:bg-amber-300 transition-all shadow-sm">
                        <ChevronRight className="w-3 h-3 text-zinc-950" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 3. Alta Médica IMSS */}
                <Link
                  href="/dashboard/clientes"
                  className="group relative rounded-xl overflow-hidden border border-blue-500/30 bg-gradient-to-b from-[#1e3a8a]/85 via-[#172554]/95 to-black p-3 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] shadow-md hover:border-blue-400/80 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md p-1 border border-blue-400/30 flex items-center justify-center shadow-md">
                      <img src="/tramite-imss.png" alt="IMSS" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-2">
                    <h3 className="text-xs font-bold text-white leading-tight">
                      Alta Médica <span className="text-blue-300">IMSS</span>
                    </h3>
                    <p className="text-[10px] font-semibold text-blue-200 mt-0.5">
                      Asignaciones y vigencias UMF
                    </p>
                    <p className="text-[9px] text-zinc-300/80 mt-0.5 line-clamp-1 leading-tight">
                      Control de altas y seguimiento.
                    </p>
                    <div className="mt-1.5 flex justify-end">
                      <span className="w-5 h-5 rounded-full bg-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-[10px] group-hover:scale-110 group-hover:bg-amber-300 transition-all shadow-sm">
                        <ChevronRight className="w-3 h-3 text-zinc-950" />
                      </span>
                    </div>
                  </div>
                </Link>

              </div>
            </div>

            {/* Card: Actividad Reciente */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#dfba73]" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">Actividad Reciente</h3>
                </div>
                <Link href="/dashboard/clientes" className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors">
                  Ver toda la actividad
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-zinc-400 border-b border-zinc-800/60 font-medium">
                      <th className="pb-1.5 font-medium">Fecha</th>
                      <th className="pb-1.5 font-medium">Cliente</th>
                      <th className="pb-1.5 font-medium">Trámite</th>
                      <th className="pb-1.5 font-medium">Actividad</th>
                      <th className="pb-1.5 font-medium text-right">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                    {recentClientes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-2.5 text-center text-[11px] text-zinc-500">
                          No hay actividad registrada
                        </td>
                      </tr>
                    ) : (
                      recentClientes.slice(0, 3).map((cli) => {
                        const fullApellidos = [cli.apellido_paterno, cli.apellido_materno].filter(Boolean).join(' ') || cli.apellidos || '';
                        const dateStr = cli.created_at ? new Date(cli.created_at).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '27/09/2026 10:25';
                        return (
                          <tr key={cli.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-2 text-zinc-400 text-[10px] font-mono whitespace-nowrap">{dateStr}</td>
                            <td className="py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[9px] text-zinc-300">
                                  {cli.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-white text-[11px]">{cli.nombre} {fullApellidos}</span>
                              </div>
                            </td>
                            <td className="py-2 text-zinc-300 text-[11px] whitespace-nowrap">Retiro por Desempleo</td>
                            <td className="py-2 text-zinc-400 text-[11px] whitespace-nowrap">Expediente creado</td>
                            <td className="py-2 text-right whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                En proceso
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Columna Derecha (4 columnas) */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-3.5">
            
            {/* Card 1: Expedientes Recientes */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">Expedientes Recientes</h3>
                <Link href="/dashboard/clientes" className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors">
                  Ver todos
                </Link>
              </div>

              {recentClientes.length === 0 ? (
                <p className="text-[11px] text-zinc-500 py-2.5 text-center">No hay expedientes recientes</p>
              ) : (
                <div className="space-y-2">
                  {recentClientes.slice(0, 3).map((cli, idx) => {
                    const fullApellidos = [cli.apellido_paterno, cli.apellido_materno].filter(Boolean).join(' ') || cli.apellidos || '';
                    const statusList = [
                      { label: 'En proceso', style: 'bg-amber-400/20 text-amber-300 border-amber-400/30', tramite: 'Retiro por Desempleo', color: 'bg-emerald-400' },
                      { label: 'Documentación', style: 'bg-amber-200/20 text-amber-200 border-amber-200/30', tramite: 'Mejoravit Infonavit', color: 'bg-rose-400' },
                      { label: 'En revisión', style: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30', tramite: 'Alta Médica IMSS', color: 'bg-blue-400' },
                    ];
                    const st = statusList[idx % statusList.length];

                    return (
                      <div key={cli.id} className="p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/60 transition-all flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[11px] text-zinc-200 shrink-0">
                            {cli.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <h4 className="text-[11px] font-bold text-white truncate">
                              {cli.nombre} {fullApellidos}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${st.color} shrink-0`} />
                              <span className="truncate">{st.tramite}</span>
                              {cli.estado && <span className="text-zinc-500 truncate">&bull; 📍 {cli.estado}</span>}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 ${st.style}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 2: Servicios & Herramientas */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 shadow-md">
              <h3 className="text-xs sm:text-sm font-bold text-white mb-2">Servicios & Herramientas</h3>
              <div className="grid grid-cols-4 gap-1.5">
                <Link
                  href="/dashboard/pdf-preset-studio"
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-[#c5a059]/40 transition-all text-center group shadow-sm"
                >
                  <FileText className="w-4 h-4 text-zinc-400 group-hover:text-[#dfba73] mb-1 transition-colors" />
                  <span className="text-[9px] font-medium text-zinc-300 group-hover:text-white leading-tight">Gestor PDF</span>
                </Link>
                <Link
                  href="/dashboard/pdf-preset-studio"
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-[#c5a059]/40 transition-all text-center group shadow-sm"
                >
                  <LayoutGrid className="w-4 h-4 text-zinc-400 group-hover:text-[#dfba73] mb-1 transition-colors" />
                  <span className="text-[9px] font-medium text-zinc-300 group-hover:text-white leading-tight">Plantillas</span>
                </Link>
                <Link
                  href="/dashboard/clientes"
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-[#c5a059]/40 transition-all text-center group shadow-sm"
                >
                  <TrendingUp className="w-4 h-4 text-zinc-400 group-hover:text-[#dfba73] mb-1 transition-colors" />
                  <span className="text-[9px] font-medium text-zinc-300 group-hover:text-white leading-tight">Reportes</span>
                </Link>
                <Link
                  href="/dashboard/clientes"
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-[#c5a059]/40 transition-all text-center group shadow-sm"
                >
                  <Sliders className="w-4 h-4 text-zinc-400 group-hover:text-[#dfba73] mb-1 transition-colors" />
                  <span className="text-[9px] font-medium text-zinc-300 group-hover:text-white leading-tight">Procesos</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Calendario de Hoy */}
            <div className="bg-[#0b0c10] border border-zinc-800/90 rounded-xl p-2.5 sm:p-3 shadow-md">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80 mb-2">
                <h3 className="text-xs font-bold text-white">Calendario de Hoy</h3>
                <Link href="/dashboard/clientes" className="text-[10px] font-medium text-sky-400 hover:text-sky-300 transition-colors">
                  Ver calendario
                </Link>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                  <Calendar className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-white">No hay citas para hoy</h4>
                  <p className="text-[9px] text-zinc-400">Agrega nuevas citas para llevar control.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
