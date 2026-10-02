'use client';

import React from 'react';
import { 
  LandingNavbar, 
  LandingHero, 
  LandingTramitesCatalog, 
  LandingQuickTracker, 
  LandingSimulator, 
  LandingProcessSteps, 
  LandingWhyChooseUs, 
  LandingFaq, 
  LandingContact, 
  LandingFooter 
} from '@/components/landing';
import { MessageCircle } from 'lucide-react';

export default function LandingPage() {
  const whatsappUrl = `https://wa.me/5215555555555?text=${encodeURIComponent(
    'Hola Santina Consultoría, deseo recibir asesoría personalizada sobre los trámites de AFORE, Mejoravit o IMSS.'
  )}`;

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-100 flex flex-col selection:bg-[#c5a059]/30 selection:text-[#fae29c] relative">
      {/* 1. Barra de Navegación Superior */}
      <LandingNavbar />

      {/* 2. Contenedor Principal */}
      <main className="flex-1">
        {/* Hero Section Panorámico */}
        <LandingHero />

        {/* Catálogo Detallado de Todos los Trámites del Sistema */}
        <LandingTramitesCatalog />

        {/* Rastreador de Folio y NSS en Tiempo Real */}
        <LandingQuickTracker />

        {/* Simulador y Precalificador Interactivo */}
        <LandingSimulator />

        {/* Proceso y Metodología en 4 Fases */}
        <LandingProcessSteps />

        {/* Por Qué Elegir Santina: Ventajas y Garantías */}
        <LandingWhyChooseUs />

        {/* Preguntas Frecuentes con Acordeón */}
        <LandingFaq />

        {/* Contacto Directo y Canales Oficiales */}
        <LandingContact />
      </main>

      {/* 3. Footer Corporativo */}
      <LandingFooter />

      {/* 4. Botón Flotante Permanente de WhatsApp */}
      <aside aria-label="Contacto rápido por WhatsApp" className="fixed bottom-6 right-6 z-40">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp a un Asesor de Santina Consultoría"
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <span className="hidden sm:inline-block">¿Dudas? Habla con un Asesor</span>
        </a>
      </aside>
    </div>
  );
}
