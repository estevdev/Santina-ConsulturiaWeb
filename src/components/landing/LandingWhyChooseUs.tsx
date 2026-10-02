'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Users, 
  Award, 
  Smartphone, 
  XCircle, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { BENEFICIOS_CONSULTORIA } from './tramitesData';

export function LandingWhyChooseUs() {
  const iconMap: Record<string, any> = {
    ShieldCheck,
    Cpu,
    Clock,
    Users,
    Award,
    Smartphone,
  };

  const comparisonRows = [
    {
      criterio: 'Ampliación de INE al 200%',
      tradicional: 'Vueltas a la papelería, riesgo de rechazo por tamaño o corte incorrecto.',
      santina: 'Algoritmo óptico propio que genera la escala y encuadre 200% perfecto al instante.',
    },
    {
      criterio: 'Seguimiento de tu caso',
      tradicional: 'Esperar semanas sin saber si tu trámite avanzó o fue rechazado.',
      santina: 'Portal en tiempo real 24/7 con Folio y NSS, porcentaje y notificaciones.',
    },
    {
      criterio: 'Protección de tus Datos',
      tradicional: 'Envío de documentos a personas desconocidas sin respaldo ni contrato.',
      santina: 'Contrato formal de prestación de servicios, encriptación y aviso de privacidad.',
    },
    {
      criterio: 'Firma y Papeleo',
      tradicional: 'Imprimir decenas de hojas, comprar carpetas y hacer filas eternas.',
      santina: 'Firma electrónica en pantalla desde tu celular con token seguro.',
    },
  ];

  return (
    <section className="py-24 relative bg-slate-900/40 dark:bg-black/40 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>Ventaja Tecnológica y Humana</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            ¿Por Qué Elegir Santina Consultoría?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Combinamos la experiencia de asesores especializados con el software documental más avanzado de México.
          </p>
        </div>

        {/* Grid de 6 Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {BENEFICIOS_CONSULTORIA.map((ben, idx) => {
            const Icon = iconMap[ben.icono] || ShieldCheck;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 dark:bg-[#0d0e12] border border-zinc-800 hover:border-[#c5a059]/50 rounded-3xl p-6 shadow-xl transition-all hover:bg-slate-900 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#dfba73] mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">
                  {ben.titulo}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {ben.descripcion}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tabla Comparativa: Tradicional vs Santina */}
        <div className="max-w-4xl mx-auto bg-slate-900/90 dark:bg-[#0d0e12] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-[#dfba73] uppercase tracking-wider block">
              Diferencia Garantizada
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Gestoría Informal vs. Santina Consultoría Web
            </h3>
          </div>

          <div className="space-y-4">
            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-zinc-800/80"
              >
                {/* Desventaja Tradicional */}
                <div className="flex items-start gap-3 border-b md:border-b-0 md:border-r border-zinc-800/80 pb-3 md:pb-0 md:pr-4">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      Gestor Informal / Trámite Tradicional
                    </span>
                    <p className="text-xs text-zinc-400 mt-1 leading-snug">
                      {row.tradicional}
                    </p>
                  </div>
                </div>

                {/* Ventaja Santina */}
                <div className="flex items-start gap-3 md:pl-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Con Santina Consultoría Web
                    </span>
                    <p className="text-xs text-zinc-200 font-medium mt-1 leading-snug">
                      {row.santina}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
