'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { Cliente, TramiteRetiroDesempleo, TramiteMejoravit, TramiteAltaMedicaImss } from '@/types/cliente';
import { Users, FileCheck2, Building2, Banknote, HeartPulse, Sparkles, ArrowRight, UserPlus, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
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
          supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(5),
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-stone-900 to-black border border-[#c5a059]/30 text-white p-6 sm:p-8 shadow-2xl shadow-black/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/10 backdrop-blur-md text-xs font-semibold text-[#dfba73] mb-3 border border-[#c5a059]/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>CONSULTORÍA SANTINA &bull; TRÁMITES &bull; ASESORÍA &bull; RESULTADOS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            ¡Bienvenido de nuevo, {user?.name || 'Asesor'}!
          </h1>
          <p className="text-sm text-zinc-300 mt-2 leading-relaxed font-light">
            TU FUTURO, NUESTRA ASESORÍA. Gestiona expedientes, verifica trámites de Retiro por Desempleo, Crédito en Efectivo Mejoravit y Altas Médicas IMSS.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/clientes"
              className="px-4 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold rounded-xl text-xs hover:brightness-110 transition-all shadow-lg shadow-[#c5a059]/20 flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-zinc-950" />
              <span>Ver Expedientes & Clientes</span>
            </Link>
            <Link
              href="/dashboard/clientes"
              className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-amber-200 rounded-xl text-xs font-semibold backdrop-blur-sm transition-all border border-amber-500/20 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Nuevo Cliente</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats de Clientes y Trámites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border border-zinc-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Clientes Registrados
            </span>
            <div className="p-2.5 rounded-xl bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : clientesCount}
          </div>
          <p className="text-xs text-amber-500/80 mt-1 font-medium">Expedientes activos en plataforma</p>
        </div>

        {/* Retiro por Desempleo (Verde IMSS) */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#022c22] to-zinc-950 rounded-2xl p-5 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Retiro por Desempleo
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#032b35] p-1 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-md">
              <img src="/tramite-desempleo.png" alt="AforeMóvil Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : retirosCount}
          </div>
          <p className="text-xs text-emerald-300/80 mt-1 font-medium">Trámites IMSS Afore procesados</p>
        </div>

        {/* Mejoravit Infonavit (Rojo Carmesí) */}
        <div className="bg-gradient-to-br from-[#881337] via-[#4c0519] to-zinc-950 rounded-2xl p-5 border border-rose-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
              Mejoravit Infonavit
            </span>
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-rose-400/30 flex items-center justify-center shrink-0 shadow-md">
              <img src="/tramite-mejoravit.png" alt="Mejoravit Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : mejoravitCount}
          </div>
          <p className="text-xs text-rose-300/80 mt-1 font-medium">Créditos en Efectivo</p>
        </div>

        {/* Alta Médica IMSS */}
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-zinc-950 rounded-2xl p-5 border border-[#c5a059]/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider">
              Alta Médica IMSS
            </span>
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-md">
              <img src="/tramite-imss.png" alt="IMSS Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '...' : altaMedicaCount}
          </div>
          <p className="text-xs text-[#c5a059]/80 mt-1 font-medium">Asignaciones UMF activas</p>
        </div>
      </div>

      {/* Grid: Clientes Recientes + Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0d0e12] rounded-2xl border border-zinc-800 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c5a059]" />
              <h2 className="text-base font-bold text-white">Últimos Clientes Registrados</h2>
            </div>
            <Link
              href="/dashboard/clientes"
              className="text-xs font-semibold text-[#c5a059] hover:text-[#dfba73] flex items-center gap-1 transition-colors"
            >
              <span>Ver todos los expedientes ({clientesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              <div className="w-5 h-5 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando clientes recientes...
            </div>
          ) : recentClientes.length === 0 ? (
            <div className="text-center py-8 px-4 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-300">No hay clientes registrados en la base de datos</p>
              <Link
                href="/dashboard/clientes"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#c5a059]/20"
              >
                <UserPlus className="w-3.5 h-3.5 text-zinc-950" />
                Registrar Primer Cliente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {recentClientes.map((cli) => {
                const fullApellidos = [cli.apellido_paterno, cli.apellido_materno].filter(Boolean).join(' ') || cli.apellidos || '';
                return (
                  <div
                    key={cli.id}
                    className="py-3.5 flex items-center justify-between hover:bg-zinc-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/20 flex items-center justify-center font-bold text-sm">
                        {cli.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {cli.nombre} {fullApellidos}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          {cli.telefono && <span>📞 {cli.telefono}</span>}
                          {cli.estado && <span className="font-semibold text-emerald-400">📍 {cli.estado}</span>}
                          {cli.curp && <span className="font-mono text-[#c5a059]">🆔 {cli.curp}</span>}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/dashboard/clientes"
                      className="px-3 py-1.5 bg-zinc-800/80 text-[#dfba73] hover:bg-zinc-700/80 text-xs font-semibold rounded-xl border border-[#c5a059]/30 transition-colors flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Ver Expediente</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Estado del Servidor & OCR */}
        <div className="bg-[#0d0e12] rounded-2xl border border-zinc-800 shadow-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#c5a059]" />
                <h2 className="text-base font-bold text-white">Servicios & Motor OCR</h2>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Activo
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Escáner OCR & Mapa de Calor</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operativo
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Generación INE Ampliada 200%</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Homografía
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Constancia Oficial CURP</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RENAPO Sync
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">PDF Inmueble (5 Fotos)</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto PDF-Lib
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 bg-zinc-900/60 p-3.5 rounded-xl flex items-center justify-between border border-zinc-800/50">
            <span className="text-xs text-zinc-400 font-medium">Asesor Autenticado:</span>
            <span className="text-xs font-semibold text-[#dfba73]">
              {user?.email || 'Asesor Principal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
