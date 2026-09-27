'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, FileEdit } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#0d0e12] rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 p-8 transition-colors relative">
      {/* Selector de tema en esquina superior */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="text-center mb-8 pt-2">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Consultoría Santina Logo"
            className="w-20 h-20 object-contain filter drop-shadow-[0_0_12px_rgba(197,160,89,0.3)]"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Consultoría Santina</h1>
        <p className="text-xs font-semibold text-[#c5a059] uppercase tracking-widest mt-1">Trámites &bull; Asesoría &bull; Resultados</p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-sm flex items-center gap-2 animate-shake">
          <ShieldCheck className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Usuario o Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu-correo@ejemplo.com"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#c5a059] to-[#9a7b38] hover:from-[#d5b069] hover:to-[#aa8b48] text-zinc-950 font-bold rounded-xl shadow-md shadow-[#c5a059]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
