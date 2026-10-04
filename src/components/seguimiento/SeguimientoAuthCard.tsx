'use client';

import React, { useState } from 'react';
import {
  FileSearch,
  FileText,
  Lock,
  Unlock,
  Clock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface SeguimientoAuthCardProps {
  folio: string;
  onFolioChange: (val: string) => void;
  nss: string;
  onNssChange: (val: string) => void;
  rememberSession: boolean;
  onRememberSessionChange: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
}

export function SeguimientoAuthCard({
  folio,
  onFolioChange,
  nss,
  onNssChange,
  rememberSession,
  onRememberSessionChange,
  onSubmit,
  loading,
  error,
  title = 'Consulta el Estado de tu Trámite',
  subtitle = 'Ingresa tu Folio y tu NSS asignados por tu asesor para acceder a tu expediente.',
  submitButtonText = 'Acceder a mi Trámite',
}: SeguimientoAuthCardProps) {
  const [showNss, setShowNss] = useState(false);

  return (
    <div className="bg-[#101217] rounded-2xl border border-zinc-800 p-5 sm:p-7 shadow-xl space-y-5">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#c5a059]" />
          {title}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
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
              onChange={(e) => onFolioChange(e.target.value.toUpperCase())}
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
              onChange={(e) => onNssChange(e.target.value)}
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
          <p className="text-[11px] text-zinc-500 mt-1">
            Por seguridad de tus datos personales, tu NSS actúa como clave de autenticación.
          </p>
        </div>

        <div className="flex items-center pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => onRememberSessionChange(e.target.checked)}
              className="w-4 h-4 rounded text-[#c5a059] focus:ring-[#c5a059] border-zinc-700 bg-zinc-900"
            />
            <span>Recordar sesión en este dispositivo</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 active:scale-[0.99] text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Verificando credenciales...
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" />
              {submitButtonText}
            </>
          )}
        </button>
      </form>

      <div className="pt-3 border-t border-zinc-800 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
        Acceso encriptado y protegido conforme a la ley de privacidad.
      </div>
    </div>
  );
}
