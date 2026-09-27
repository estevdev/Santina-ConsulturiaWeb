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
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Lock,
  FileText,
  User,
  Info,
  LogOut
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

      // Guardar sesión en localStorage si el usuario seleccionó recordar
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

      // Registrar Service Worker para Notificaciones de fondo
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Registro de Service Worker falló:', err);
        });
      }
    } catch (err: any) {
      if (isAutoCheck) {
        // Si falló el auto-logeo por credenciales desactualizadas, limpiar sesión guardada
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

  // Cargar sesión guardada en localStorage o desde parámetros URL al iniciar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const paramFolio = searchParams.get('folio') || searchParams.get('f');

    // Intentar leer la sesión guardada
    const savedSessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    let savedSession: { folio: string; nss: string } | null = null;

    if (savedSessionRaw) {
      try {
        savedSession = JSON.parse(savedSessionRaw);
      } catch (e) {}
    }

    if (paramFolio) {
      setFolio(paramFolio.toUpperCase());
      // Si el folio coincide con la sesión guardada, autologear
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

  // Verificar soporte de notificaciones
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
      alert('Tu navegador no soporta notificaciones de escritorio o móvil.');
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
            console.log('Suscripción PushManager no activa en entorno local:', pErr);
          }

          reg.showNotification('¡Notificaciones Activadas! 🔔', {
            body: `Te notificaremos inmediatamente cada que haya avances en tu trámite (Folio: ${resultado?.tramite.folio}).`,
            icon: '/logo.png',
            badge: '/logo.png',
          });
        } else {
          new Notification('¡Notificaciones Activadas! 🔔', {
            body: `Te notificaremos cada que haya cambios en tu trámite con folio ${resultado?.tramite.folio}.`,
            icon: '/logo.png'
          });
        }

        setPushSuccessMsg('¡Notificaciones configuradas exitosamente! Recibirás avisos en tiempo real.');
      } else if (permission === 'denied') {
        alert('Las notificaciones han sido bloqueadas en la configuración de tu navegador.');
      }
    } catch (err) {
      console.error('Error al activar notificaciones:', err);
    } finally {
      setSubscribingPush(false);
    }
  };

  const copiarEnlaceTramite = () => {
    if (!resultado) return;
    const url = `${window.location.origin}/seguimiento?folio=${resultado.tramite.folio}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'aprobado':
      case 'finalizado':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#c5a059]" />
            {estado === 'finalizado' ? 'Trámite Finalizado' : 'Aprobado'}
          </span>
        );
      case 'en_proceso':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            En Proceso de Gestión
          </span>
        );
      case 'documentacion_incompleta':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-900/40 text-amber-200 border border-amber-600/50">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Documentación Pendiente
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            En Espera / Recibido
          </span>
        );
    }
  };

  // Si se está verificando la sesión guardada automáticamente al entrar
  if (autoCheckingSession && !resultado) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center p-4">
        <div className="relative p-3 bg-[#0d0e12] border border-[#c5a059]/40 rounded-2xl shadow-2xl mb-4">
          <img
            src="/logo.png"
            alt="Consultoría Santina Logo"
            className="w-16 h-16 object-contain filter drop-shadow-[0_0_12px_rgba(197,160,89,0.4)] animate-pulse"
          />
        </div>
        <div className="flex items-center gap-2.5 text-[#dfba73] text-sm font-semibold">
          <Clock className="w-5 h-5 animate-spin text-[#c5a059]" />
          Reanudando sesión de trámite...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-100 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#c5a059]/30 selection:text-[#dfba73]">
      {/* Resplandores oscuros y dorados de fondo */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#9a7b38]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container Principal */}
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Banner Superior Institucional con Logo en Dorado */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative p-3 bg-[#0d0e12] border border-[#c5a059]/40 rounded-2xl shadow-2xl flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Consultoría Santina Logo"
                className="w-14 sm:w-16 h-14 sm:h-16 object-contain filter drop-shadow-[0_0_12px_rgba(197,160,89,0.4)]"
              />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#9a7b38] bg-clip-text text-transparent">
            Consultoría Santina
          </h1>
          <p className="text-xs font-semibold text-[#c5a059] uppercase tracking-widest mt-1">
            Portal de Seguimiento de Trámites
          </p>
        </div>

        {/* PANTALLA 1: FORMULARIO DE ACCESO CON FOLIO Y NSS */}
        {!resultado ? (
          <div className="bg-[#0d0e12] rounded-3xl shadow-2xl border border-[#c5a059]/25 p-5 sm:p-10 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 rounded-bl-full pointer-events-none" />

            <div className="border-b border-[#c5a059]/15 pb-5 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <FileSearch className="w-5 sm:w-6 h-5 sm:h-6 text-[#c5a059]" />
                Consulta el Estado de tu Trámite
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                Ingresa tu número de folio asignado y tu Número de Seguridad Social (NSS) para acceder directamente a tu línea de tiempo.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-300 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleConsultar} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#dfba73] mb-2">
                  Número de Folio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value.toUpperCase())}
                    placeholder="Ej. B78AA330 o tu ID de trámite"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#c5a059]/30 bg-[#13141c] text-white focus:ring-2 focus:ring-[#c5a059] focus:border-[#c5a059] text-base sm:text-sm tracking-wide font-mono transition-all placeholder:text-zinc-600"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Número de folio proporcionado por tu asesor de Santina Consultoría.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#dfba73] mb-2">
                  Contraseña (Número de Seguridad Social - NSS)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={nss}
                    onChange={(e) => setNss(e.target.value)}
                    placeholder="Ingresa los 11 dígitos de tu NSS"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#c5a059]/30 bg-[#13141c] text-white focus:ring-2 focus:ring-[#c5a059] focus:border-[#c5a059] text-base sm:text-sm tracking-widest transition-all placeholder:text-zinc-600"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Tu NSS actúa como clave de autenticación para asegurar la privacidad de tu trámite.
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059] border-zinc-700 bg-[#13141c]"
                  />
                  <span>Mantener mi sesión iniciada en este dispositivo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 active:scale-[0.99] text-slate-950 font-extrabold text-sm shadow-xl shadow-[#c5a059]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Verificando Datos...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5" />
                    Consultar Avance de Trámite
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#c5a059]/15 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
              Información cifrada bajo los estándares de privacidad de Consultoría Santina.
            </div>
          </div>
        ) : (
          /* PANTALLA 2: VISTA DE SEGUIMIENTO EN LÍNEA DE TIEMPO */
          <div className="space-y-6">
            {/* Header del Trámite Encontrado */}
            <div className="bg-[#0d0e12] rounded-3xl shadow-2xl border border-[#c5a059]/30 p-5 sm:p-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c5a059]/15 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#c5a059] uppercase tracking-widest mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    Cliente: {resultado.cliente.nombrePublico}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {resultado.tramite.tipoNombre}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-xs font-mono font-bold bg-[#13141c] text-[#dfba73] px-3 py-1.5 rounded-xl border border-[#c5a059]/30">
                      Folio: {resultado.tramite.folio}
                    </span>
                    <button
                      onClick={copiarEnlaceTramite}
                      className="text-xs text-zinc-400 hover:text-[#dfba73] flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-[#181924] border border-transparent hover:border-[#c5a059]/20"
                      title="Copiar enlace directo de seguimiento"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#c5a059]" />
                          <span className="text-[#c5a059]">¡Enlace copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Enlace
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div>{getBadgeEstado(resultado.tramite.estado)}</div>
                  {resultado.tramite.updated_at && (
                    <span className="text-[11px] text-zinc-400">
                      Última actualización: {new Date(resultado.tramite.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="pt-6">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-300 mb-2.5">
                  <span className="uppercase tracking-wider text-zinc-400">Progreso del Trámite</span>
                  <span className="text-[#dfba73] font-mono">
                    {resultado.progreso.completados} / {resultado.progreso.total} Pasos ({resultado.progreso.porcentaje}%)
                  </span>
                </div>
                <div className="w-full bg-[#14151e] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#c5a059]/20 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                    style={{ width: `${resultado.progreso.porcentaje}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BANNER DE NOTIFICACIONES PUSH */}
            <div className="bg-gradient-to-r from-[#0d0e12] via-[#161722] to-[#0d0e12] rounded-3xl p-5 sm:p-6 shadow-xl border border-[#c5a059]/35 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#c5a059]/15 text-[#dfba73] rounded-2xl border border-[#c5a059]/30 shrink-0">
                    <Bell className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      Notificaciones en Tiempo Real
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-md">
                      Autoriza notificaciones para recibir alertas automáticas en tu dispositivo cada vez que Santina Consultoría actualice un paso de tu proceso.
                    </p>
                  </div>
                </div>

                <div>
                  {pushStatus === 'granted' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/50 text-xs font-bold shadow-[0_0_12px_rgba(197,160,89,0.15)]">
                      <BellCheck className="w-4 h-4 text-[#c5a059]" />
                      Notificaciones Activas
                    </div>
                  ) : (
                    <button
                      onClick={solicitarPermisoNotificaciones}
                      disabled={subscribingPush}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 min-h-[44px]"
                    >
                      {subscribingPush ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Activando...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Activar Notificaciones
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {pushSuccessMsg && (
                <div className="mt-4 pt-4 border-t border-[#c5a059]/20 text-xs text-[#dfba73] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />
                  {pushSuccessMsg}
                </div>
              )}
            </div>

            {/* OBSERVACIONES DEL ASESOR (Si existen) */}
            {resultado.tramite.observaciones && (
              <div className="bg-[#14151f] border border-[#c5a059]/30 rounded-3xl p-5 sm:p-6 text-zinc-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 text-[#dfba73]">
                  <Info className="w-4 h-4 text-[#c5a059]" />
                  Notas de tu Asesor
                </div>
                <p className="text-sm italic font-medium leading-relaxed text-zinc-300">
                  "{resultado.tramite.observaciones}"
                </p>
              </div>
            )}

            {/* SECCIÓN LÍNEA DE TIEMPO (TIMELINE) */}
            <div className="bg-[#0d0e12] rounded-3xl shadow-2xl border border-[#c5a059]/25 p-5 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2.5 border-b border-[#c5a059]/15 pb-4">
                <Clock className="w-5 h-5 text-[#c5a059]" />
                Línea de Tiempo del Trámite
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-7 sm:space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#c5a059]/20">
                {resultado.pasos.map((paso, idx) => {
                  const isDone = paso.completado;
                  const isCurrent = paso.estadoPaso === 'en_proceso';

                  return (
                    <div key={paso.id} className="relative flex items-start group">
                      {/* Nodo del Timeline */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-gradient-to-br from-[#9a7b38] to-[#c5a059] text-slate-950 shadow-md shadow-[#c5a059]/30 ring-4 ring-[#c5a059]/15'
                            : isCurrent
                            ? 'bg-[#181a26] text-[#dfba73] border-2 border-[#c5a059] shadow-lg shadow-[#c5a059]/25 ring-4 ring-[#c5a059]/20 animate-pulse'
                            : 'bg-[#12131b] text-zinc-600 border border-zinc-800'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-slate-950 font-bold" />
                        ) : isCurrent ? (
                          <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#c5a059]" />
                        ) : (
                          <span className="text-xs font-semibold font-mono">{idx + 1}</span>
                        )}
                      </div>

                      {/* Contenido del Paso */}
                      <div className="ml-3 sm:ml-4 w-full bg-[#12131c] rounded-2xl p-4 sm:p-5 border border-[#c5a059]/15 hover:border-[#c5a059]/40 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4
                            className={`font-semibold text-sm sm:text-base ${
                              isDone
                                ? 'text-white'
                                : isCurrent
                                ? 'text-[#dfba73]'
                                : 'text-zinc-400'
                            }`}
                          >
                            {paso.titulo}
                          </h4>
                          <div>
                            {isDone ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/30">
                                Completado
                              </span>
                            ) : isCurrent ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                En Revisión Actual
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {paso.descripcion}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN PARA CERRAR SESIÓN / CONSULTAR OTRO FOLIO */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={cerrarSesion}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-[#c5a059]/30 bg-[#0d0e12] text-[#dfba73] hover:bg-[#161722] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg min-h-[44px]"
              >
                <LogOut className="w-4 h-4 text-[#c5a059]" />
                Cerrar Sesión de Consulta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <Clock className="w-5 h-5 animate-spin text-[#c5a059]" />
          Cargando portal de seguimiento...
        </div>
      </div>
    }>
      <SeguimientoContent />
    </Suspense>
  );
}
