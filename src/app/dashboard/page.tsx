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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistema Integral de Gestión &bull; Santina Consultoría Web</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ¡Bienvenido de nuevo, {user?.name || 'Asesor'}!
          </h1>
          <p className="text-sm text-blue-100/90 mt-2 leading-relaxed">
            Administra los expedientes de tus clientes, gestiona el checklist de trámites oficiales (Retiro por Desempleo, Mejoravit e IMSS) y procesa credenciales INE con OCR inteligente.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/clientes"
              className="px-4 py-2.5 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-md flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Ver Expedientes & Clientes</span>
            </Link>
            <Link
              href="/dashboard/clientes"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-all border border-white/20 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Cliente</span>
            </Link>
          </div>
        </div>

        {/* Decorative circle shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats de Clientes y Trámites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Clientes Registrados
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : clientesCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Expedientes activos en plataforma</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Retiro por Desempleo
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : retirosCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Trámites Afore procesados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mejoravit Infonavit
            </span>
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : mejoravitCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Expedientes de 10 requisitos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Alta Médica IMSS
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : altaMedicaCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Asignaciones UMF activas</p>
        </div>
      </div>

      {/* Grid: Clientes Recientes + Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos Clientes Registrados</h2>
            </div>
            <Link
              href="/dashboard/clientes"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>Ver todos los expedientes ({clientesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando clientes recientes...
            </div>
          ) : recentClientes.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No hay clientes registrados en la base de datos</p>
              <Link
                href="/dashboard/clientes"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Registrar Primer Cliente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentClientes.map((cli) => {
                const fullApellidos = [cli.apellido_paterno, cli.apellido_materno].filter(Boolean).join(' ') || cli.apellidos || '';
                return (
                  <div
                    key={cli.id}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                        {cli.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cli.nombre} {fullApellidos}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {cli.telefono && <span>📞 {cli.telefono}</span>}
                          {cli.estado && <span className="font-semibold text-emerald-600 dark:text-emerald-400">📍 {cli.estado}</span>}
                          {cli.curp && <span className="font-mono text-blue-600 dark:text-blue-400">🆔 {cli.curp}</span>}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/dashboard/clientes"
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold rounded-xl border border-blue-200/60 dark:border-blue-800 transition-colors flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Ver Expediente</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Estado del Servidor & OCR */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Servicios & Motor OCR</h2>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Activo
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Escáner OCR & Mapa de Calor</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operativo
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Generación INE Ampliada 200%</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Homografía
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Constancia Oficial CURP</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RENAPO Sync
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400">PDF Inmueble (5 Fotos)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto PDF-Lib
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-800/50 p-3.5 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Asesor Autenticado:</span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {user?.email || 'Asesor Principal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
