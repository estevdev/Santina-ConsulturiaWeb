'use client';

import React, { useState } from 'react';
import { 
  TRAMITES_SISTEMA, 
  TramiteInfo 
} from './tramitesData';
import { LandingTramiteDetailModal } from './LandingTramiteDetailModal';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  FileCheck2, 
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface LandingTramitesCatalogProps {
  onSelectSimulator?: (tramiteId: string) => void;
}

export function LandingTramitesCatalog({ onSelectSimulator }: LandingTramitesCatalogProps) {
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedTramite, setSelectedTramite] = useState<TramiteInfo | null>(null);

  const filteredTramites = activeFilter === 'todos' 
    ? TRAMITES_SISTEMA 
    : TRAMITES_SISTEMA.filter(t => t.id === activeFilter);

  const getCardBanner = (tramite: TramiteInfo) => {
    if (tramite.id === 'retiro_desempleo') return '/card-desempleo.jpg';
    if (tramite.id === 'mejoravit') return '/card-mejoravit.jpg';
    return '/banner-dashboard.png';
  };

  return (
    <section id="tramites" className="py-24 relative bg-slate-950 dark:bg-[#08080a]">
      {/* Glow ambiental */}
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-[#c5a059]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera de Sección */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-[#c5a059]/40 text-[#dfba73] text-[11px] font-bold uppercase tracking-wider mb-2.5 shadow-md">
            <Layers className="w-3.5 h-3.5 text-[#dfba73]" />
            <span>CATÁLOGO COMPLETO DE SERVICIOS &gt;</span>
          </div>
          <span className="text-[11px] font-extrabold text-[#dfba73] uppercase tracking-widest block mb-1">
            TU TRÁMITE, EN MANOS DE EXPERTOS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Trámites que Gestionamos en el Sistema
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Cada trámite cuenta con acompañamiento jurídico, digitalización de alta definición y verificación estricta para garantizar que tu solicitud no sea rechazada en ventanilla.
          </p>

          {/* Filtros de Categoría */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveFilter('todos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-[#c5a059] text-zinc-950 shadow-md shadow-[#c5a059]/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              Todos los Trámites ({TRAMITES_SISTEMA.length})
            </button>
            <button
              onClick={() => setActiveFilter('retiro_desempleo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'retiro_desempleo'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              Retiro por Desempleo AFORE
            </button>
            <button
              onClick={() => setActiveFilter('mejoravit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'mejoravit'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              Crédito Mejoravit Infonavit
            </button>
            <button
              onClick={() => setActiveFilter('alta_medica_imss')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'alta_medica_imss'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              Alta Médica IMSS
            </button>
          </div>
        </div>

        {/* Tarjetas del Catálogo en 3 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredTramites.map((tr) => (
            <div
              key={tr.id}
              className="bg-slate-900/90 dark:bg-[#0d0e12] border border-zinc-800/90 hover:border-[#c5a059]/40 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Portada Superior de la Tarjeta */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-black">
                  <img
                    src={getCardBanner(tr)}
                    alt={tr.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-[#0d0e12] via-slate-900/40 to-transparent" />

                  {/* Insignias Superiores */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-md backdrop-blur-md uppercase tracking-wider ${tr.badgeColor}`}>
                      {tr.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shadow-lg">
                      <img src={tr.icono} alt="" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Título sobre el Banner */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-semibold text-[#dfba73] uppercase tracking-wider block drop-shadow">
                      {tr.entidad}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                      {tr.titulo}
                    </h3>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {tr.descripcionCorta}
                  </p>

                  {/* Plazo & Beneficio Rápido */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Tiempo Estimado</span>
                      <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#dfba73]" />
                        {tr.tiempoEstimado}
                      </span>
                    </div>
                    <div className="bg-black/40 border border-zinc-800/80 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Modalidad</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        100% Asistido
                      </span>
                    </div>
                  </div>

                  {/* Requisitos Destacados */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Requisitos Clave del Expediente:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {tr.requisitosClave.slice(0, 4).map((rc, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#dfba73] shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-snug font-medium">{rc.titulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Botones de Acción de la Tarjeta */}
              <div className="p-5 sm:p-7 pt-0 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTramite(tr)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-[#c5a059]/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ver Requisitos ({tr.requisitosDetallados.length})</span>
                  <ChevronRight className="w-4 h-4 text-[#dfba73]" />
                </button>

                <a
                  href={`https://wa.me/5215555555555?text=${encodeURIComponent(
                    `Hola Santina Consultoría, deseo iniciar el trámite de "${tr.titulo}". ¿Me pueden apoyar?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#c5a059]/20 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Iniciar Asesoría</span>
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Modal Detallado de Trámite */}
      <LandingTramiteDetailModal
        tramite={selectedTramite}
        onClose={() => setSelectedTramite(null)}
        onSelectSimulator={onSelectSimulator}
      />
    </section>
  );
}
