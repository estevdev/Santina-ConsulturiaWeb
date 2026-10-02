'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  FileSearch, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface QuickTrackerResult {
  cliente: {
    nombrePublico: string;
  };
  tramite: {
    id: string;
    tipoNombre: string;
    estado: string;
    updated_at: string;
  };
  progreso: {
    completados: number;
    total: number;
    porcentaje: number;
  };
  pasos: Array<{
    id: string;
    titulo: string;
    completado: boolean;
    estadoPaso: string;
  }>;
}

export function LandingQuickTracker() {
  const router = useRouter();
  const [folio, setFolio] = useState('');
  const [nss, setNss] = useState('');
  const [showNss, setShowNss] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickTrackerResult | null>(null);

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio.trim() || !nss.trim()) {
      setError('Por favor ingresa tanto tu Folio como tu Número de Seguridad Social (NSS).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/seguimiento/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: folio.trim(), nss: nss.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se localizó el trámite con los datos proporcionados.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la base de datos de trámites.');
    } finally {
      setLoading(false);
    }
  };

  const handleIrAlPortalCompleto = () => {
    router.push(`/seguimiento?folio=${encodeURIComponent(folio.trim())}&nss=${encodeURIComponent(nss.trim())}`);
  };

  return (
    <section id="rastreador" className="py-20 relative bg-slate-950/90 dark:bg-[#090a0d] border-t border-b border-zinc-800/80">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera de la Sección */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <FileSearch className="w-3.5 h-3.5" />
            <span>Portal de Consulta en Vivo</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Rastrea el Avance de tu Trámite 24/7
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            ¿Ya eres cliente de Santina Consultoría? Ingresa tu Folio y tu NSS para conocer en tiempo real la validación de tus documentos y la fecha estimada de tu cita o cobro.
          </p>
        </div>

        {/* Tarjeta del Formulario de Búsqueda */}
        <div className="bg-slate-900/90 dark:bg-[#0d0e12] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 max-w-3xl mx-auto">
          
          <form onSubmit={handleConsultar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Campo Folio */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Número de Folio
                </label>
                <div className="relative">
                  <FileSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    placeholder="Ej. e4b8c9d1 o UUID completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">El código que te proporcionó tu asesor por WhatsApp</p>
              </div>

              {/* Campo NSS */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Número de Seguridad Social (NSS)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showNss ? 'text' : 'password'}
                    required
                    maxLength={11}
                    value={nss}
                    onChange={(e) => setNss(e.target.value)}
                    placeholder="11 dígitos de tu NSS"
                    className="w-full pl-10 pr-10 py-2.5 bg-black/60 border border-zinc-700/80 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNss(!showNss)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showNss ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Funciona como tu llave de autenticación segura</p>
              </div>

            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de Enviar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Consultando expediente...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar Estatus del Trámite</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/seguimiento')}
                className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-all text-center cursor-pointer"
              >
                Ir a pantalla completa
              </button>
            </div>
          </form>

          {/* Resultado de Consulta en Vivo */}
          {result && (
            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/50 p-4 rounded-2xl border border-[#c5a059]/30">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Cliente Registrado
                  </span>
                  <div className="text-base font-extrabold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#dfba73]" />
                    <span>{result.cliente.nombrePublico}</span>
                  </div>
                  <span className="text-xs text-zinc-300 font-medium mt-0.5 block">
                    {result.tramite.tipoNombre}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Estatus Actual
                  </span>
                  <span className="inline-block mt-0.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40 tracking-wider">
                    {result.tramite.estado.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2">
                  <span>Avance General del Trámite</span>
                  <span className="text-[#dfba73]">{result.progreso.porcentaje}% ({result.progreso.completados}/{result.progreso.total} requisitos)</span>
                </div>
                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#dfba73] to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.progreso.porcentaje}%` }}
                  />
                </div>
              </div>

              {/* Resumen de Pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {result.pasos.slice(0, 4).map((p) => (
                  <div 
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      p.completado
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                        : p.estadoPaso === 'en_proceso'
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-zinc-900/30 border-zinc-800/60 text-zinc-400'
                    }`}
                  >
                    <span className="truncate font-medium">{p.titulo}</span>
                    <span className="shrink-0 text-[10px] font-bold">
                      {p.completado ? '✓ Listo' : p.estadoPaso === 'en_proceso' ? '⏳ En revisión' : '○ Pendiente'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón para ver seguimiento completo con notificaciones */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleIrAlPortalCompleto}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Ver Expediente Completo, Citas y Notificaciones Push</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#dfba73]" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
