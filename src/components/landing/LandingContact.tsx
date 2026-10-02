'use client';

import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { ESTADOS_MEXICO } from '@/constants/estadosMexico';

export function LandingContact() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [estadoRepublica, setEstadoRepublica] = useState('Ciudad de México');
  const [tramiteInteres, setTramiteInteres] = useState('retiro_desempleo');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          email: email || null,
          estadoRepublica,
          tramiteInteres,
          mensaje: mensaje || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud');
      }

      setEnviado(true);
    } catch (err: any) {
      console.error('Error enviando solicitud:', err);
      setErrorMsg(err.message || 'No se pudo enviar la solicitud. Por favor intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const getWhatsappUrl = () => {
    const tramiteLabels: Record<string, string> = {
      retiro_desempleo: 'Retiro por Desempleo AFORE',
      mejoravit: 'Crédito Mejoravit Infonavit',
      alta_medica_imss: 'Alta Médica IMSS',
      otro: 'Asesoría General',
    };
    const text = encodeURIComponent(
      `Hola Santina Consultoría, mi nombre es ${nombre || 'un cliente'}. Me ubico en ${estadoRepublica} y me interesa el trámite de ${tramiteLabels[tramiteInteres] || 'Asesoría'}. ${mensaje ? `Mensaje: ${mensaje}` : ''}`
    );
    return `https://wa.me/5215555555555?text=${text}`;
  };

  return (
    <section id="contacto" className="py-24 relative bg-slate-950/80 dark:bg-[#07080a] border-t border-zinc-800">
      {/* Glow decorativo */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Atención Inmediata</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Inicia tu Diagnóstico sin Costo
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Ponte en contacto con un asesor certificado de Santina Consultoría Web. Resolveremos todas tus dudas en minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Información de Contacto (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 dark:bg-[#0d0e12] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <span className="text-[10px] font-bold text-[#dfba73] uppercase tracking-wider block">
                Canales Oficiales
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Santina Consultoría Web
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Especialistas en rescate de subcuentas de retiro, créditos de mejoramiento habitacional y vigencia de derechos IMSS.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800/80">
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#dfba73] shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    WhatsApp & Teléfono
                  </span>
                  <a 
                    href="https://wa.me/5215555555555" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white hover:text-[#dfba73] transition-colors"
                  >
                    +52 (55) 5555-5555
                  </a>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Respuestas en menos de 15 minutos</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Horarios de Atención
                  </span>
                  <p className="text-xs font-bold text-white">Lunes a Viernes: 9:00 AM - 7:00 PM</p>
                  <p className="text-xs text-zinc-400">Sábados: 9:00 AM - 2:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Cobertura Geográfica
                  </span>
                  <p className="text-xs font-bold text-white">Atención Nacional en los 32 Estados</p>
                  <p className="text-xs text-zinc-400">Gestión remota digital o citas locales asistidas</p>
                </div>
              </div>

            </div>

            {/* Banner de Seguridad */}
            <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-300 leading-snug">
                Tus datos personales están protegidos por el aviso de privacidad de Santina Consultoría y las leyes mexicanas de protección de datos (LFPDPPP).
              </p>
            </div>

          </div>

          {/* Formulario (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 dark:bg-[#0d0e12] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            
            {enviado ? (
              <div className="py-12 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  ¡Solicitud Enviada con Éxito!
                </h3>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Gracias {nombre}. Un asesor de Santina Consultoría se pondrá en contacto contigo al teléfono proporcionado para revisar tu caso.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <a
                    href={getWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] shadow-md hover:scale-105 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir Chat de WhatsApp Directo</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setEnviado(false);
                      setNombre('');
                      setTelefono('');
                      setEmail('');
                      setMensaje('');
                      setErrorMsg(null);
                    }}
                    className="px-5 py-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 transition-all cursor-pointer"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Roberto Morales"
                      className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all"
                    />
                  </div>

                  {/* Teléfono / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Teléfono / WhatsApp (10 dígitos) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 5512345678"
                      className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Trámite de Interés */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Trámite de Interés *
                    </label>
                    <select
                      value={tramiteInteres}
                      onChange={(e) => setTramiteInteres(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all cursor-pointer"
                    >
                      <option value="retiro_desempleo">Retiro por Desempleo AFORE</option>
                      <option value="mejoravit">Crédito Mejoravit Infonavit</option>
                      <option value="alta_medica_imss">Alta Médica IMSS / Clínica UMF</option>
                      <option value="otro">Asesoría General o Consulta Personalizada</option>
                    </select>
                  </div>

                  {/* Estado de la República */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Estado de Residencia *
                    </label>
                    <select
                      value={estadoRepublica}
                      onChange={(e) => setEstadoRepublica(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all cursor-pointer"
                    >
                      {ESTADOS_MEXICO.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Correo Electrónico Opcional */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all"
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    ¿Tienes alguna duda o detalle sobre tu caso?
                  </label>
                  <textarea
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Cuéntanos brevemente cuánto tiempo llevas sin empleo o qué deseas remodelar..."
                    className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059] transition-all resize-none"
                  />
                </div>

                {/* Mensaje de Error si falla */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Botón de Envío */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 cursor-pointer disabled:opacity-50"
                  >
                    {cargando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Solicitar Diagnóstico Gratuito</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
