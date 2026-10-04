'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, LogOut, ArrowLeft, UploadCloud } from 'lucide-react';
import { TramiteResultado } from '@/types/seguimiento';
import { SeguimientoAuthCard } from '@/components/seguimiento/SeguimientoAuthCard';
import { SubirDocumentosView } from '@/components/seguimiento/SubirDocumentosView';

const SESSION_STORAGE_KEY = 'santina_seguimiento_session';

function SubirDocumentosContent() {
  const searchParams = useSearchParams();

  const [folio, setFolio] = useState('');
  const [nss, setNss] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoCheckingSession, setAutoCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<TramiteResultado | null>(null);

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
        throw new Error(data.error || 'Error al validar tus credenciales');
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
    } catch (err: any) {
      if (isAutoCheck) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else {
        setError(err.message || 'Ocurrió un error al verificar tus credenciales.');
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

  const handleLogin = (e: React.FormEvent) => {
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
          Verificando sesión...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 selection:bg-[#c5a059]/30 selection:text-[#dfba73]">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Cabecera Limpia */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <Link href={folio ? `/seguimiento?folio=${folio}` : '/seguimiento'} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-[#0d0e12] border border-[#c5a059]/40 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Consultoría Santina
              </h1>
              <p className="text-[10px] text-[#c5a059] uppercase tracking-wider font-semibold">
                Portal de Documentos
              </p>
            </div>
          </Link>

          {resultado && (
            <button
              onClick={cerrarSesion}
              className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>

        {/* Pantalla 1: Formulario de Autenticación con Folio y NSS */}
        {!resultado ? (
          <div className="space-y-4">
            <SeguimientoAuthCard
              folio={folio}
              onFolioChange={setFolio}
              nss={nss}
              onNssChange={setNss}
              rememberSession={rememberSession}
              onRememberSessionChange={setRememberSession}
              onSubmit={handleLogin}
              loading={loading}
              error={error}
              title="Acceso para Subir Documentos"
              subtitle="Ingresa tu Folio y tu NSS asignados por tu asesor para acceder a la carga de tus documentos."
              submitButtonText="Ingresar al Portal de Documentos"
            />

            <div className="text-center pt-2">
              <Link
                href={folio ? `/seguimiento?folio=${folio}` : '/seguimiento'}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#dfba73] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>¿Prefieres ver el avance de tu trámite? Ir a Seguimiento</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Pantalla 2: Vista de Subida de Documentos */
          <SubirDocumentosView
            resultado={resultado}
            folio={folio}
            nss={nss}
            onRefreshData={() => ejecutarConsulta(folio, nss, true)}
          />
        )}

      </div>
    </div>
  );
}

export default function SubirDocumentosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
          <div className="flex items-center gap-2.5 text-zinc-400 text-xs">
            <Clock className="w-4 h-4 animate-spin text-[#c5a059]" />
            Cargando portal de documentos...
          </div>
        </div>
      }
    >
      <SubirDocumentosContent />
    </Suspense>
  );
}
