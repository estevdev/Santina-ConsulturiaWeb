'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Gift, 
  Clock, 
  Users, 
  Search
} from 'lucide-react';

export function LandingHero() {
  return (
    <>
      {/* ========================================================================= */}
      {/* 1. VISTA DESKTOP / PC (hidden md:block)                                    */}
      {/* 100% INTACTA, EXACTA Y FIDELIDAD VISUAL A LA IMAGEN DE REFERENCIA         */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        <section className="relative pt-16 sm:pt-20 pb-10 overflow-hidden bg-black">
          {/* Banner Panorámico Oficial */}
          <div className="relative w-full min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[580px] flex items-center bg-black overflow-hidden border-b border-[#c5a059]/30 shadow-2xl">
            
            {/* Imagen del Asesor alineada a la derecha exactamente como la imagen de referencia */}
            <img
              src="/banner-dashboard.png"
              alt="Santina Consultoría Banner Oficial"
              className="absolute inset-0 w-full h-full object-cover object-[82%_center] sm:object-[80%_center] md:object-[78%_center] lg:object-[right_center] select-none pointer-events-none filter brightness-95 contrast-105"
            />

            {/* Gradiente izquierdo para contraste y legibilidad absoluta del texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 sm:via-black/80 md:via-black/65 to-transparent pointer-events-none" />

            {/* Gradiente superior suave */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

            {/* Gradiente inferior para integrar las tarjetas de métricas */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

            {/* Glow dorado sutil */}
            <div className="absolute -left-20 top-1/4 w-80 h-80 bg-[#c5a059]/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Contenido Izquierdo Alineado */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-start text-left">
              
              {/* Badge Superior */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#c5a059]/40 shadow-lg mb-4 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">
                  SANTINA CONSULTORÍA WEB OFICIAL
                </span>
                <span className="text-zinc-500">|</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#dfba73]">
                  IMSS · AFORE · Infonavit
                </span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-black tracking-tight text-white leading-[1.14] sm:leading-[1.12] drop-shadow-2xl max-w-2xl lg:max-w-3xl">
                Especialistas en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059]">
                  Retiro por Desempleo,
                </span>
                <br className="hidden sm:inline" /> Crédito Mejoravit y Alta IMSS
              </h1>

              {/* Subtítulo Descriptivo */}
              <p className="mt-4 text-xs sm:text-sm md:text-[15px] text-zinc-300 max-w-xl font-normal leading-relaxed drop-shadow">
                Acompañamiento profesional y gestión integral de expedientes con certeza jurídica.<br className="hidden sm:inline" />
                Auditamos tu documentación y puedes consultar el avance de tu trámite en vivo las 24 horas.
              </p>

              {/* 3 Botones Redondeados en Píldora como en la Referencia */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#tramites"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] shadow-lg shadow-[#c5a059]/25 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Explorar Trámites y Requisitos</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#simulador"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-white bg-black/60 hover:bg-black/80 border border-zinc-700/80 backdrop-blur-md hover:border-[#c5a059]/50 shadow-md transition-all cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-[#dfba73]" />
                  <span>Simular mi Trámite Gratis</span>
                </a>

                <a
                  href="#rastreador"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-zinc-300 hover:text-white bg-black/60 hover:bg-black/80 border border-zinc-700/80 backdrop-blur-md transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  <span>Rastrear Folio</span>
                </a>
              </div>

            </div>

          </div>

          {/* Fila de las 3 Tarjetas de Métricas - Diseño idéntico a la imagen de referencia */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 md:-mt-16 relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              
              {/* Card 1: Efectividad */}
              <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-zinc-800/90 hover:border-[#c5a059]/50 p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center gap-4 transition-all hover:bg-black">
                <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#dfba73] flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                    EFECTIVIDAD
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                    +98.8%
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-tight mt-1">
                    Aprobación sin observaciones
                  </p>
                </div>
              </div>

              {/* Card 2: Rapidez */}
              <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-zinc-800/90 hover:border-[#c5a059]/50 p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center gap-4 transition-all hover:bg-black">
                <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#dfba73] flex items-center justify-center shrink-0 shadow-md">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                    RAPIDEZ
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                    3 a 7 días
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-tight mt-1">
                    Dispersión promedio de fondos
                  </p>
                </div>
              </div>

              {/* Card 3: Presencia */}
              <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-zinc-800/90 hover:border-[#c5a059]/50 p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center gap-4 transition-all hover:bg-black">
                <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#dfba73] flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                    PRESENCIA
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                    32 Estados
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-tight mt-1">
                    Cobertura en toda México
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 2. VISTA MÓVIL DEDICADA (block md:hidden)                                  */}
      {/* Optimización 100% Mobile-First para pantallas táctiles y formato vertical */}
      {/* ========================================================================= */}
      <div className="block md:hidden bg-black text-white pt-20 pb-8 px-4">
        
        {/* Tarjeta de Portada del Asesor Optimizada para Móviles */}
        <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-[#c5a059]/40 shadow-xl mb-5 bg-black">
          <img
            src="/banner-dashboard.png"
            alt="Santina Consultoría Banner Oficial"
            className="w-full h-full object-cover object-[75%_center] filter brightness-95 contrast-105 select-none"
          />
          {/* Fusión con fondo oscuro */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent pointer-events-none" />

          {/* Insignia institucional sobre la imagen */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[#c5a059]/40 text-[10px] font-black text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SANTINA CONSULTORÍA
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40 backdrop-blur-md">
              IMSS · AFORE
            </span>
          </div>
        </div>

        {/* Textos Principales para Móvil */}
        <div className="space-y-3 text-left">
          <h1 className="text-2xl font-black tracking-tight text-white leading-[1.18]">
            Especialistas en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059]">
              Retiro por Desempleo,
            </span><br />
            Crédito Mejoravit y Alta IMSS
          </h1>

          <p className="text-xs text-zinc-300 font-normal leading-relaxed">
            Acompañamiento profesional y gestión integral de expedientes con certeza jurídica. Auditamos tu documentación y puedes consultar el avance de tu trámite en vivo las 24 horas.
          </p>
        </div>

        {/* Botones de Acción Móviles Touch-Friendly */}
        <div className="mt-5 space-y-2.5">
          <a
            href="#tramites"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full font-bold text-xs text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] shadow-lg shadow-[#c5a059]/20 active:scale-[0.98] transition-all"
          >
            <span>Explorar Trámites y Requisitos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="#simulador"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full font-semibold text-[11px] text-white bg-zinc-900 border border-zinc-700/80 active:bg-zinc-800 text-center"
            >
              <Gift className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Simular Gratis</span>
            </a>
            <a
              href="#rastreador"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full font-semibold text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-700/80 active:bg-zinc-800 text-center"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Rastrear Folio</span>
            </a>
          </div>
        </div>

        {/* Las 3 Tarjetas de Métricas para Móviles (sin solapamiento vertical) */}
        <div className="mt-6 space-y-2.5">
          
          <div className="bg-[#0b0c10] border border-zinc-800/90 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg">
            <div className="w-10 h-10 rounded-full border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#dfba73] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                EFECTIVIDAD
              </span>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                +98.8%
              </div>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                Aprobación sin observaciones
              </p>
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-zinc-800/90 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg">
            <div className="w-10 h-10 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                RAPIDEZ
              </span>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                3 a 7 días
              </div>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                Dispersión promedio de fondos
              </p>
            </div>
          </div>

          <div className="bg-[#0b0c10] border border-zinc-800/90 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg">
            <div className="w-10 h-10 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                PRESENCIA
              </span>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                32 Estados
              </div>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                Cobertura en toda México
              </p>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
