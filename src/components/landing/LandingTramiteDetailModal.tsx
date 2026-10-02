'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import { TramiteInfo } from './tramitesData';

interface LandingTramiteDetailModalProps {
  tramite: TramiteInfo | null;
  onClose: () => void;
  onSelectSimulator?: (tramiteId: string) => void;
}

export function LandingTramiteDetailModal({
  tramite,
  onClose,
  onSelectSimulator,
}: LandingTramiteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'requisitos' | 'pasos' | 'faq'>('requisitos');

  if (!tramite) return null;

  const whatsappMessage = encodeURIComponent(
    `Hola Santina Consultoría, me interesa iniciar mi trámite de "${tramite.titulo}". ¿Podrían asesorarme con mi caso?`
  );
  const whatsappUrl = `https://wa.me/5215555555555?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 dark:bg-[#0d0e12] border border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-b from-black/80 to-transparent border-b border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700/80 p-2.5 flex items-center justify-center shadow-lg shrink-0">
              <img
                src={tramite.icono}
                alt={tramite.titulo}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${tramite.badgeColor}`}>
                  {tramite.badge}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {tramite.entidad}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {tramite.titulo}
              </h2>
              <p className="text-xs sm:text-sm text-[#dfba73] font-medium mt-0.5">
                {tramite.subtitulo}
              </p>
            </div>
          </div>

          {/* Plazo & Beneficio Pills */}
          <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>Tiempo de gestión: <strong>{tramite.tiempoEstimado}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tramite.beneficioPrincipal}</span>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="mt-6 flex border-b border-zinc-800 gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setActiveTab('requisitos')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'requisitos'
                  ? 'border-[#c5a059] text-[#dfba73]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Requisitos & Checklist ({tramite.requisitosDetallados.length})
            </button>
            <button
              onClick={() => setActiveTab('pasos')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'pasos'
                  ? 'border-[#c5a059] text-[#dfba73]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Proceso Paso a Paso
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-[#c5a059] text-[#dfba73]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Preguntas Frecuentes
            </button>
          </div>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: REQUISITOS DETALLADOS */}
          {activeTab === 'requisitos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                {tramite.descripcionCompleta}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tramite.requisitosDetallados.map((req) => (
                  <div
                    key={req.numero}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40 text-[10px] font-black flex items-center justify-center shrink-0">
                          {req.numero}
                        </span>
                        <h4 className="font-bold text-xs text-white">
                          {req.nombre}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed pl-7">
                        {req.descripcion}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-start gap-1.5 pl-2 text-[10px] text-amber-300/90 bg-amber-950/20 p-2 rounded-xl">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span><strong>Tip Santina:</strong> {req.tipAsesor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PASOS DEL PROCESO */}
          {activeTab === 'pasos' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Así es como Santina Consultoría Web gestiona tu trámite desde el primer día:
              </p>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#c5a059]/30">
                {tramite.pasosGestion.map((paso, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#c5a059] text-zinc-950 font-black text-[10px] flex items-center justify-center shadow-md">
                      {idx + 1}
                    </div>
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-[#dfba73] uppercase tracking-wider block">
                        {paso.fase}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">
                        {paso.titulo}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {paso.descripcion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FAQS */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {tramite.preguntasFrecuentes.map((item, idx) => (
                <div key={idx} className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#dfba73] shrink-0" />
                    <span>{item.q}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-2 pl-6 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer del Modal con Acciones */}
        <div className="p-4 sm:p-6 bg-black/90 border-t border-zinc-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            ¿Tienes dudas con tus documentos? Te respondemos de inmediato.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onSelectSimulator && (
              <button
                type="button"
                onClick={() => {
                  onSelectSimulator(tramite.id);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
              >
                Precalificar mi caso
              </button>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Iniciar Asesoría por WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
