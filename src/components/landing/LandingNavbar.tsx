'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { 
  Menu, 
  X, 
  Search, 
  ArrowRight, 
  LayoutDashboard, 
  LogIn, 
  FileSearch,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

export function LandingNavbar() {
  const { user, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trámites', href: '#tramites' },
    { name: 'Simulador', href: '#simulador' },
    { name: 'Rastrear Trámite', href: '#rastreador' },
    { name: '¿Cómo Funciona?', href: '#proceso' },
    { name: 'Preguntas', href: '#faq' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/85 dark:bg-black/85 backdrop-blur-xl border-b border-slate-800/80 dark:border-zinc-800/80 shadow-lg shadow-black/30 py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Marca */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Santina Consultoría Web Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(197,160,89,0.35)] group-hover:scale-105 transition-transform"
              />
              <div className="absolute -inset-1 bg-[#c5a059]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Santina
                <span className="text-[#c5a059] font-medium text-xs sm:text-sm px-1.5 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30">
                  Consultoría
                </span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#c5a059] dark:text-[#dfba73] font-semibold tracking-wider uppercase">
                Trámites · Asesoría · Resultados
              </span>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#c5a059] dark:hover:text-[#dfba73] rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Acciones & Botones */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Botón de Rastrear Rápido (Pill) */}
            <a
              href="#rastreador"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-200 hover:text-white bg-black/60 hover:bg-black/90 border border-zinc-700/80 rounded-full transition-all"
            >
              <FileSearch className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Rastrear Folio</span>
            </a>

            {/* Botón de Acceso / Dashboard (Pill) */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] rounded-full shadow-md shadow-[#c5a059]/20 hover:scale-[1.02] transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Panel Asesor</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] rounded-full shadow-md shadow-[#c5a059]/20 hover:scale-[1.02] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Panel Asesor</span>
              </Link>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/95 dark:bg-black/95 backdrop-blur-2xl border-b border-zinc-800 px-4 pt-4 pb-6 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:text-[#dfba73] hover:bg-zinc-800/70 transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2.5">
            <a
              href="#rastreador"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-[#dfba73] bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-xl"
            >
              <FileSearch className="w-4 h-4" />
              <span>Rastrear Avance con Folio y NSS</span>
            </a>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-zinc-950 bg-[#c5a059] rounded-xl shadow-md"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ir al Panel de Asesor</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl"
              >
                <LogIn className="w-4 h-4 text-[#c5a059]" />
                <span>Acceso a Plataforma / Asesores</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
