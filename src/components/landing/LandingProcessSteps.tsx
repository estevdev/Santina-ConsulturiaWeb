'use client';

import React from 'react';
import { 
  FileCheck2, 
  Cpu, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Smartphone 
} from 'lucide-react';

export function LandingProcessSteps() {
  const steps = [
    {
      step: '01',
      title: 'Diagnóstico Inicial Gratuito',
      desc: 'Revisamos tu fecha de baja en IMSS, tu saldo en AFORE o tus puntos en Mi Cuenta Infonavit para determinar la viabilidad inmediata sin cobrarte un solo peso por anticipado.',
      icon: ShieldCheck,
      badge: 'Cero Riesgo',
    },
    {
      step: '02',
      title: 'Digitalización y Cotejo de Expediente',
      desc: 'Optimizamos tus documentos, generamos tu ampliación de INE al 200% oficial, cotejamos tus datos personales y firmas el contrato de asesoría directamente desde tu celular.',
      icon: Cpu,
      badge: 'Expediente 100% Listo',
    },
    {
      step: '03',
      title: 'Ingreso Institucional y Citas',
      desc: 'Generamos tu anexo SINDO para la AFORE o programamos tu cita presencial en el CESI de Infonavit con tu expediente impreso y encuadernado listo para ventanilla.',
      icon: Building2,
      badge: 'Acompañamiento 100%',
    },
    {
      step: '04',
      title: 'Dispersión y Cobro Exitoso',
      desc: 'La administradora deposita tus fondos por desempleo en tu cuenta bancaria o recibes tu tarjeta de crédito Mejoravit. Pagas honorarios únicamente por resultado exitoso.',
      icon: CheckCircle2,
      badge: 'Garantía Santina',
    },
  ];

  return (
    <section id="proceso" className="py-24 relative bg-slate-950 dark:bg-[#08080a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Flujo de Trabajo Certificado</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            ¿Cómo Funciona Nuestro Servicio?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Un método estructurado en 4 fases que elimina el 100% de la fricción burocrática y garantiza el éxito de tu trámite.
          </p>
        </div>

        {/* Grid de 4 Pasos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 dark:bg-[#0d0e12] border border-zinc-800 hover:border-[#c5a059]/50 rounded-3xl p-6 sm:p-7 shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#dfba73] to-[#c5a059]">
                      {st.step}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30 uppercase tracking-wider">
                      {st.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-[#dfba73] mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-tight mb-2">
                    {st.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-bold text-[#dfba73]">
                  <span>Paso {idx + 1} de 4</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner Inferior de Garantía */}
        <div className="mt-14 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-[#c5a059]/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#dfba73] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Garantía de Certeza Jurídica Santina
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Todos nuestros trámites se rigen por contratos de prestación de servicios y auditoría previa documental.
              </p>
            </div>
          </div>

          <a
            href="#contacto"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-zinc-950 bg-[#c5a059] hover:bg-[#dfba73] transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Iniciar mi Diagnóstico Gratuito</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
