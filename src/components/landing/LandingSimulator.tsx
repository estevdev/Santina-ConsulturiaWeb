'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  MessageCircle, 
  ShieldCheck,
  Building2,
  Briefcase,
  Home,
  Stethoscope
} from 'lucide-react';

export function LandingSimulator() {
  const [tramite, setTramite] = useState<'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss'>('retiro_desempleo');
  
  // Respuestas Retiro
  const [diasDesempleo, setDiasDesempleo] = useState<string>('mas_46');
  const [retiroPrevio, setRetiroPrevio] = useState<string>('no');
  const [tieneIne, setTieneIne] = useState<string>('si');

  // Respuestas Mejoravit
  const [trabajoActivo, setTrabajoActivo] = useState<string>('si');
  const [cuentaInfonavit, setCuentaInfonavit] = useState<string>('si');
  const [viviendaPropia, setViviendaPropia] = useState<string>('si');

  // Respuestas IMSS
  const [altaPatronal, setAltaPatronal] = useState<string>('si');
  const [compDomicilio, setCompDomicilio] = useState<string>('si');

  const [calculado, setCalculado] = useState(false);

  // Lógica de Viabilidad
  let esViable = true;
  let mensajeViabilidad = '';
  let requisitosFaltantes: string[] = [];

  if (tramite === 'retiro_desempleo') {
    if (diasDesempleo === 'menos_46') {
      esViable = false;
      requisitosFaltantes.push('Debes cumplir al menos 46 días naturales desde tu fecha de baja ante el IMSS.');
    }
    if (retiroPrevio === 'si') {
      esViable = false;
      requisitosFaltantes.push('Solo se puede retirar una vez cada 5 años (60 meses) de la subcuenta de desempleo.');
    }
    if (tieneIne === 'no') {
      requisitosFaltantes.push('Requieres tu INE vigente a color para la validación biométrica en AforeMóvil.');
    }
    mensajeViabilidad = esViable 
      ? '¡Cumples con el perfil ideal! Puedes acceder a hasta 90 días de tu salario o al 11.5% de tu saldo de AFORE.'
      : 'Tu trámite tiene condiciones pendientes a regularizar antes de ingresar.';
  } else if (tramite === 'mejoravit') {
    if (trabajoActivo === 'no') {
      esViable = false;
      requisitosFaltantes.push('Para Crédito Mejoravit se requiere relación laboral vigente activa cotizando ante el IMSS.');
    }
    if (viviendaPropia === 'no') {
      esViable = false;
      requisitosFaltantes.push('La vivienda debe ser propia o de un familiar directo (padres, hijos o cónyuge).');
    }
    mensajeViabilidad = esViable
      ? '¡Excelente perfil! Puedes obtener crédito de remodelación con tu Subcuenta de Vivienda sin hipotecar tu propiedad.'
      : 'Revisa las condiciones laborales requeridas por Infonavit antes de iniciar.';
  } else {
    if (altaPatronal === 'no') {
      esViable = false;
      requisitosFaltantes.push('Requieres constancia patronal vigente o esquema de aseguramiento voluntario activo.');
    }
    mensajeViabilidad = esViable
      ? '¡Trámite inmediato! Podemos asignar tu Unidad de Medicina Familiar (UMF) y turno en 24 a 48 horas.'
      : 'Se requiere validar tu vigencia de derechos ante el seguro social.';
  }

  const tramiteNombres = {
    retiro_desempleo: 'Retiro por Desempleo AFORE',
    mejoravit: 'Crédito Mejoravit Infonavit',
    alta_medica_imss: 'Alta Médica IMSS / Asignación UMF',
  };

  const generarWhatsAppMensaje = () => {
    let msg = `Hola Santina Consultoría, completé mi precalificación en su web para *${tramiteNombres[tramite]}*.\n`;
    msg += `Resultado: ${esViable ? 'CANDIDATO VIABLE' : 'CASO CON OBSERVACIONES'}\n`;
    if (tramite === 'retiro_desempleo') {
      msg += `- Días sin cotizar: ${diasDesempleo === 'mas_46' ? 'Más de 46 días (Apto)' : 'Menos de 46 días'}\n`;
      msg += `- Retiro en últimos 5 años: ${retiroPrevio === 'no' ? 'No' : 'Sí'}\n`;
      msg += `- INE vigente: ${tieneIne === 'si' ? 'Sí' : 'No'}\n`;
    } else if (tramite === 'mejoravit') {
      msg += `- Empleo activo cotizando: ${trabajoActivo === 'si' ? 'Sí' : 'No'}\n`;
      msg += `- Cuenta Infonavit: ${cuentaInfonavit}\n`;
      msg += `- Vivienda propia/familiar: ${viviendaPropia === 'si' ? 'Sí' : 'No'}\n`;
    } else {
      msg += `- Alta patronal vigente: ${altaPatronal === 'si' ? 'Sí' : 'No'}\n`;
      msg += `- Comprobante domicilio listo: ${compDomicilio === 'si' ? 'Sí' : 'No'}\n`;
    }
    msg += `¿Me pueden asesorar para comenzar mi expediente?`;
    return encodeURIComponent(msg);
  };

  return (
    <section id="simulador" className="py-20 relative bg-slate-900/40 dark:bg-black/60 border-t border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#dfba73] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precalificador Inteligente Gratuito</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Descubre si Eres Candidato en 1 Minuto
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Responde 3 preguntas básicas para evaluar la viabilidad de tu trámite sin compromiso ni costo alguno.
          </p>
        </div>

        {/* Tarjeta del Simulador */}
        <div className="bg-slate-900 dark:bg-[#0d0e12] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto">
          
          {/* Paso 1: Selector de Trámite */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              1. Selecciona el trámite de tu interés:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => { setTramite('retiro_desempleo'); setCalculado(false); }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  tramite === 'retiro_desempleo'
                    ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Briefcase className={`w-5 h-5 mb-2 ${tramite === 'retiro_desempleo' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">Retiro por Desempleo</span>
                <span className="text-[10px] text-zinc-400">AFORE / IMSS</span>
              </button>

              <button
                type="button"
                onClick={() => { setTramite('mejoravit'); setCalculado(false); }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  tramite === 'mejoravit'
                    ? 'bg-purple-950/30 border-purple-500 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Home className={`w-5 h-5 mb-2 ${tramite === 'mejoravit' ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">Crédito Mejoravit</span>
                <span className="text-[10px] text-zinc-400">Portal Infonavit</span>
              </button>

              <button
                type="button"
                onClick={() => { setTramite('alta_medica_imss'); setCalculado(false); }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  tramite === 'alta_medica_imss'
                    ? 'bg-blue-950/30 border-blue-500 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Stethoscope className={`w-5 h-5 mb-2 ${tramite === 'alta_medica_imss' ? 'text-blue-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">Alta Médica IMSS</span>
                <span className="text-[10px] text-zinc-400">Clínica UMF</span>
              </button>
            </div>
          </div>

          {/* Paso 2: Preguntas Dinámicas */}
          <div className="space-y-5 mb-8">
            <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
              2. Responde tus datos actuales:
            </span>

            {/* PREGUNTAS RETIRO POR DESEMPLEO */}
            {tramite === 'retiro_desempleo' && (
              <>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿Cuántos días naturales llevas sin cotizar ante el IMSS?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiasDesempleo('mas_46')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        diasDesempleo === 'mas_46'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Más de 46 días (Recomendado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiasDesempleo('menos_46')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        diasDesempleo === 'menos_46'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Menos de 46 días
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿Has retirado por desempleo en los últimos 5 años (60 meses)?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRetiroPrevio('no')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        retiroPrevio === 'no'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      No, nunca o hace más de 5 años
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetiroPrevio('si')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        retiroPrevio === 'si'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Sí, en los últimos 5 años
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿Cuentas con tu credencial INE vigente a la mano?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTieneIne('si')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        tieneIne === 'si'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Sí, vigente
                    </button>
                    <button
                      type="button"
                      onClick={() => setTieneIne('no')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        tieneIne === 'no'
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#dfba73]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Vencida o extraviada
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PREGUNTAS MEJORAVIT */}
            {tramite === 'mejoravit' && (
              <>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿Tienes relación laboral activa cotizando ante el IMSS?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTrabajoActivo('si')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        trabajoActivo === 'si'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Sí, cotizando con patrón
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrabajoActivo('no')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        trabajoActivo === 'no'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      No, actualmente inactivo
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿La vivienda a remodelar es propia o de familiar directo (padres/cónyuge)?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setViviendaPropia('si')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        viviendaPropia === 'si'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Propia o de familiar con acta
                    </button>
                    <button
                      type="button"
                      onClick={() => setViviendaPropia('no')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        viviendaPropia === 'no'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Rentada / Terceros sin parentesco
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PREGUNTAS ALTA MÉDICA IMSS */}
            {tramite === 'alta_medica_imss' && (
              <>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    ¿Cuentas con alta patronal activa o modalidad de aseguramiento vigente?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAltaPatronal('si')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        altaPatronal === 'si'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Sí, registrado ante IMSS
                    </button>
                    <button
                      type="button"
                      onClick={() => setAltaPatronal('no')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        altaPatronal === 'no'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      No estoy seguro
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Botón de Calcular */}
          {!calculado ? (
            <button
              type="button"
              onClick={() => setCalculado(true)}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver Resultado de Viabilidad</span>
            </button>
          ) : (
            /* Diagnóstico y Salida */
            <div className="p-6 rounded-2xl bg-black/60 border border-zinc-800 space-y-4 animate-fadeIn">
              
              <div className="flex items-start gap-3">
                {esViable ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {esViable ? '¡Diagnóstico Preliminar Favorable!' : 'Atención: Requisitos por Regularizar'}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {mensajeViabilidad}
                  </p>
                </div>
              </div>

              {requisitosFaltantes.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl space-y-1.5 text-xs text-amber-200">
                  <span className="font-bold text-[11px] uppercase tracking-wider block text-amber-400">
                    Puntos clave a considerar:
                  </span>
                  {requisitosFaltantes.map((obs, i) => (
                    <p key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span>•</span>
                      <span>{obs}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Botón WhatsApp con Datos */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/5215555555555?text=${generarWhatsAppMensaje()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-5 rounded-xl font-bold text-xs text-zinc-950 bg-gradient-to-r from-[#fae29c] via-[#dfba73] to-[#c5a059] hover:from-[#dfba73] hover:to-[#b08b47] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar mi Precalificación por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setCalculado(false)}
                  className="py-3 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
