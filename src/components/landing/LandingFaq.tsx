'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  MessageCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PREGUNTAS_FRECUENTES_GENERALES } from './tramitesData';

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative bg-slate-950 dark:bg-[#08080a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Resolución de Dudas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Todo lo que necesitas saber antes de iniciar tu trámite con absoluta tranquilidad y transparencia.
          </p>
        </div>

        {/* Acordeón de Preguntas */}
        <div className="space-y-3.5">
          {PREGUNTAS_FRECUENTES_GENERALES.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 dark:bg-[#0d0e12] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {item.pregunta}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center bg-zinc-800 text-[#dfba73] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 bg-[#c5a059]/20' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 animate-fadeIn">
                    {item.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Banner de Contacto si tienen más preguntas */}
        <div className="mt-12 text-center p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-bold text-white">
              ¿Tienes una situación particular que no aparece aquí?
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Nuestros asesores atienden consultas de manera personalizada todos los días.
            </p>
          </div>

          <a
            href={`https://wa.me/5215555555555?text=${encodeURIComponent(
              'Hola Santina Consultoría, tengo una duda específica sobre mi trámite.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all shadow-md cursor-pointer shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
}
