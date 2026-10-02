'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowUp, 
  ShieldCheck, 
  FileSearch, 
  LogIn, 
  LayoutDashboard,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function LandingFooter() {
  const { isAuthenticated } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-zinc-400 border-t border-zinc-800/80 pt-16 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Fila Principal de Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800/80">
          
          {/* Columna Marca (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Santina Consultoría Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(197,160,89,0.3)]"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Santina Consultoría Web
                </span>
                <span className="text-[10px] text-[#dfba73] font-bold tracking-widest uppercase">
                  Trámites · Asesoría · Resultados
                </span>
              </div>
            </Link>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Firma líder especializada en consultoría jurídica y gestión integral de trámites ante IMSS, AFORE e Infonavit con seguimiento en tiempo real.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-zinc-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Expedientes 100% Auditados</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#dfba73]" />
                <span>32 Estados de Cobertura</span>
              </div>
            </div>
          </div>

          {/* Columna Trámites */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Trámites Oficiales
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#tramites" className="hover:text-[#dfba73] transition-colors">
                  Retiro por Desempleo AFORE
                </a>
              </li>
              <li>
                <a href="#tramites" className="hover:text-[#dfba73] transition-colors">
                  Crédito Mejoravit Infonavit
                </a>
              </li>
              <li>
                <a href="#tramites" className="hover:text-[#dfba73] transition-colors">
                  Alta Médica IMSS / UMF
                </a>
              </li>
              <li>
                <a href="#tramites" className="hover:text-[#dfba73] transition-colors">
                  Ampliación INE 200% Oficial
                </a>
              </li>
              <li>
                <a href="#tramites" className="hover:text-[#dfba73] transition-colors">
                  Generación de Anexo SINDO
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Servicios & Plataforma */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Plataforma & Herramientas
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#rastreador" className="hover:text-[#dfba73] transition-colors flex items-center gap-1.5">
                  <FileSearch className="w-3 h-3 text-[#c5a059]" />
                  <span>Rastrear mi Folio</span>
                </a>
              </li>
              <li>
                <a href="#simulador" className="hover:text-[#dfba73] transition-colors">
                  Precalificador Interactivo
                </a>
              </li>
              <li>
                <Link href="/seguimiento" className="hover:text-[#dfba73] transition-colors">
                  Portal Cliente de Notificaciones
                </Link>
              </li>
              <li>
                <a href="#proceso" className="hover:text-[#dfba73] transition-colors">
                  Metodología en 4 Fases
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#dfba73] transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Acceso & Legal */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Acceso Institucional
            </span>
            <ul className="space-y-2 text-xs">
              {isAuthenticated ? (
                <li>
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-1.5 text-[#dfba73] hover:underline font-bold"
                  >
                    <LayoutDashboard className="w-3 h-3" />
                    <span>Entrar a mi Panel de Asesor</span>
                  </Link>
                </li>
              ) : (
                <li>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 text-[#dfba73] hover:underline font-bold"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Acceso Asesores / Socios</span>
                  </Link>
                </li>
              )}
              <li className="pt-2 text-zinc-500">
                Aviso de Privacidad (LFPDPPP)
              </li>
              <li className="text-zinc-500">
                Términos y Condiciones de Asesoría
              </li>
              <li className="text-zinc-500">
                Políticas de Seguridad de Datos
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer Institucional y Derechos */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p className="max-w-2xl text-center md:text-left leading-relaxed">
            <strong>Aviso de Independencia:</strong> Santina Consultoría Web es una firma de asesoría profesional y soluciones tecnológicas privadas. No pertenecemos formalmente ni sustituimos al IMSS, Infonavit o CONSAR. Asesoramos, auditamos y preparamos el expediente del derechohabiente conforme a las leyes vigentes para la correcta gestión de sus derechos.
          </p>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#dfba73]" />
            <span>Volver arriba</span>
          </button>
        </div>

        <div className="mt-6 text-center text-[10px] text-zinc-600">
          &copy; {new Date().getFullYear()} Santina Consultoría Web. Todos los derechos reservados.
        </div>

      </div>
    </footer>
  );
}
