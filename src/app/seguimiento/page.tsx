'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileSearch,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  BellCheck,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  Unlock,
  FileText,
  User,
  Info,
  LogOut,
  ChevronRight
} from 'lucide-react';

const SESSION_STORAGE_KEY = 'santina_seguimiento_session';

interface PasoTimeline {
  id: string;
  titulo: string;
  descripcion: string;
  completado: boolean;
  estadoPaso: 'completado' | 'en_proceso' | 'pendiente';
}

interface TramiteResultado {
  cliente: {
    nombrePublico: string;
  };
  tramite: {
    id: string;
    folio: string;
    tipo: string;
    tipoNombre: string;
    estado: string;
    observaciones: string | null;
    created_at: string;
    updated_at: string;
  };
  pasos: PasoTimeline[];
  progreso: {
    completados: number;
    total: number;
    porcentaje: number;
  };
}

function SeguimientoContent() {
  const searchParams = useSearchParams();

  const [folio, setFolio] = useState('');
  const [nss, setNss] = useState('');
  const [showNss, setShowNss] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoCheckingSession, setAutoCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<TramiteResultado | null>(null);

  // Estados de Notificaciones Push
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [subscribingPush, setSubscribingPush] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string | null>(null);

  // Copia de enlace
  const [copiedLink, setCopiedLink] = useState(false);

  // Función reutilizable para realizar la consulta a la API
  const ejecutarConsulta = async (targetFolio: string, targetNss: string, isAutoCheck = false) => {
    if (!targetFolio.trim() || !targetNss.trim()) return;

    if (!isAutoCheck) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/seguimiento/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: targetFolio.trim(), nss: targetNss.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al consultar el avance del trámite');
      }

      setResultado(data);

      if (typeof window !== 'undefined' && rememberSession) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            folio: targetFolio.trim(),
            nss: targetNss.trim(),
            timestamp: Date.now(),
          })
        );
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Registro de Service Worker falló:', err);
        });
      }
    } catch (err: any) {
      if (isAutoCheck) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else {
        setError(err.message || 'Ocurrió un error al verificar tus datos.');
      }
      setResultado(null);
    } finally {
      setLoading(false);
      setAutoCheckingSession(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const paramFolio = searchParams.get('folio') || searchParams.get('f');
    const savedSessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    let savedSession: { folio: string; nss: string } | null = null;

    if (savedSessionRaw) {
      try {
        savedSession = JSON.parse(savedSessionRaw);
      } catch (e) {}
    }

    if (paramFolio) {
      setFolio(paramFolio.toUpperCase());
      if (savedSession && savedSession.folio.toUpperCase() === paramFolio.toUpperCase()) {
        setNss(savedSession.nss);
        ejecutarConsulta(paramFolio, savedSession.nss, true);
      } else {
        setAutoCheckingSession(false);
      }
    } else if (savedSession && savedSession.folio && savedSession.nss) {
      setFolio(savedSession.folio.toUpperCase());
      setNss(savedSession.nss);
      ejecutarConsulta(savedSession.folio, savedSession.nss, true);
    } else {
      setAutoCheckingSession(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus('unsupported');
    }
  }, []);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarConsulta(folio, nss, false);
  };

  const cerrarSesion = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setResultado(null);
    setError(null);
    setFolio('');
    setNss('');
  };

  const solicitarPermisoNotificaciones = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }

    setSubscribingPush(true);
    setPushSuccessMsg(null);

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          try {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: undefined
            }).catch(() => null);

            if (sub && resultado?.tramite.id) {
              await fetch('/api/seguimiento/subscribe-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tramiteId: resultado.tramite.id,
                  folio: resultado.tramite.folio,
                  subscription: sub.toJSON()
                })
              });
            }
          } catch (pErr) {
            console.log('PushManager offline:', pErr);
          }

          reg.showNotification('¡Notificaciones Activadas! 🔔', {
            body: `Te avisaremos ante cualquier avance en tu trámite (${resultado?.tramite.folio}).`,
            icon: '/logo.png',
            badge: '/logo.png',
          });
        }
        setPushSuccessMsg('¡Notificaciones activadas con éxito!');
      } else if (permission === 'denied') {
        alert('Las notificaciones están bloqueadas en tu navegador.');
      }
    } catch (err) {
      console.error('Error notificaciones:', err);
    } finally {
      setSubscribingPush(false);
    }
  };

  const copiarEnlaceTramite = () => {
    if (!resultado) return;
    const url = `${window.location.origin}/seguimiento?folio=${resultado.tramite.folio}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'aprobado':
      case 'finalizado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            {estado === 'finalizado' ? 'Finalizado' : 'Aprobado'}
          </span>
        );
      case 'en_proceso':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#c5a059]" />
            En Proceso
          </span>
        );
      case 'documentacion_incompleta':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Docs Pendientes
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            Recibido
          </span>
        );
    }
  };

  if (autoCheckingSession && !resultado) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center p-4">
        <div className="p-3 bg-[#0d0e12] border border-[#c5a059]/40 rounded-2xl shadow-xl mb-4">
          <img
            src="/logo.png"
            alt="Consultoría Santina"
            className="w-12 h-12 object-contain animate-pulse"
          />
        </div>
        <div className="flex items-center gap-2 text-[#dfba73] text-xs font-semibold">
          <Clock className="w-4 h-4 animate-spin text-[#c5a059]" />
          Reanudando sesión...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 selection:bg-[#c5a059]/30 selection:text-[#dfba73]">
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Cabecera Limpia */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0d0e12] border border-[#c5a059]/40 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Consultoría Santina
              </h1>
              <p className="text-[10px] text-[#c5a059] uppercase tracking-wider font-semibold">
                Seguimiento de Trámites
              </p>
            </div>
          </div>

          {resultado && (
            <button
              onClick={cerrarSesion}
              className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/40 transition-colors flex items-center gap-1.5"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANTALLA 1: FORMULARIO DE ACCESO CON FOLIO Y NSS                          */}
        {/* ========================================================================= */}
        {!resultado ? (
          <div className="bg-[#101217] rounded-2xl border border-zinc-800 p-5 sm:p-7 shadow-xl space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-[#c5a059]" />
                Consulta el Estado de tu Trámite
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Ingresa tu Folio y tu NSS asignados por tu asesor.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleConsultar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Número de Folio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value.toUpperCase())}
                    placeholder="Ej. B78AA330"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#c5a059] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Contraseña (Tu NSS - 11 dígitos)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNss ? 'text' : 'password'}
                    required
                    value={nss}
                    onChange={(e) => setNss(e.target.value)}
                    placeholder="Ingresa tu NSS de 11 dígitos"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#c5a059] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNss(!showNss)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
                  >
                    {showNss ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059] border-zinc-700 bg-zinc-900"
                  />
                  <span>Recordar sesión en este dispositivo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 active:scale-[0.99] text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-4 h-4" />
                    Consultar Avance
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-zinc-800 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
              Consulta segura y protegida bajo cifrado.
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* PANTALLA 2: LÍNEA DE TIEMPO DEL TRÁMITE                                 */
          /* ======================================================================= */
          <div className="space-y-4">
            
            {/* Tarjeta de Resumen */}
            <div className="bg-[#101217] rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#c5a059] tracking-wider">
                    Cliente: {resultado.cliente.nombrePublico}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {resultado.tramite.tipoNombre}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      Folio: {resultado.tramite.folio}
                    </span>
                    <button
                      onClick={copiarEnlaceTramite}
                      className="text-[11px] text-zinc-400 hover:text-[#dfba73] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded"
                      title="Copiar enlace"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  {getBadgeEstado(resultado.tramite.estado)}
                </div>
              </div>

              {/* Barra de Progreso */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1.5">
                  <span>Avance General</span>
                  <span className="text-[#dfba73] font-bold">
                    {resultado.progreso.completados}/{resultado.progreso.total} Pasos ({resultado.progreso.porcentaje}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden border border-zinc-700/50">
                  <div
                    className="bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] h-full rounded-full transition-all duration-500"
                    style={{ width: `${resultado.progreso.porcentaje}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Aviso Compacto de Notificaciones Push */}
            {pushStatus !== 'granted' && (
              <div className="bg-[#101217] border border-[#c5a059]/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bell className="w-4 h-4 text-[#c5a059] shrink-0" />
                  <span className="text-zinc-300 truncate">
                    Recibe avisos inmediatos en tu celular ante cualquier avance.
                  </span>
                </div>
                <button
                  onClick={solicitarPermisoNotificaciones}
                  disabled={subscribingPush}
                  className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer disabled:opacity-50 min-h-[34px]"
                >
                  {subscribingPush ? '...' : 'Activar'}
                </button>
              </div>
            )}

            {pushSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pushSuccessMsg}</span>
              </div>
            )}

            {/* Observaciones (Si existen) */}
            {resultado.tramite.observaciones && (
              <div className="bg-[#101217] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 space-y-1">
                <span className="font-bold text-[#dfba73] flex items-center gap-1 text-[11px] uppercase">
                  <Info className="w-3 h-3" /> Nota del Asesor:
                </span>
                <p className="italic text-zinc-300">"{resultado.tramite.observaciones}"</p>
              </div>
            )}

            {/* Línea de Tiempo Simplificada */}
            <div className="bg-[#101217] rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                Línea de Tiempo del Proceso
              </h3>

              <div className="space-y-2.5">
                {resultado.pasos.map((paso, idx) => {
                  const isDone = paso.completado;
                  const isCurrent = paso.estadoPaso === 'en_proceso';

                  return (
                    <div
                      key={paso.id}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isDone
                          ? 'bg-[#0b0c10] border-emerald-500/25'
                          : isCurrent
                          ? 'bg-[#0b0c10] border-[#c5a059]/40 ring-1 ring-[#c5a059]/30'
                          : 'bg-[#0b0c10]/60 border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      {/* Indicador de Estado */}
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-500 text-zinc-950'
                            : isCurrent
                            ? 'bg-[#c5a059] text-zinc-950'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </span>

                      {/* Contenido */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              isDone ? 'text-white' : isCurrent ? 'text-[#dfba73]' : 'text-zinc-400'
                            }`}
                          >
                            {paso.titulo}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isCurrent
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isDone ? 'Listo' : isCurrent ? 'En Proceso' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {paso.descripcion}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
          <div className="flex items-center gap-2.5 text-zinc-400 text-xs">
            <Clock className="w-4 h-4 animate-spin text-[#c5a059]" />
            Cargando portal...
          </div>
        </div>
      }
    >
      <SeguimientoContent />
    </Suspense>
  );
}
