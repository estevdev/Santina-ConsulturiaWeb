'use client';

import React from 'react';
import {
  X,
  Plus,
  Edit,
  AlertCircle,
  MapPin,
  Search,
  Check,
  Banknote,
  Building2,
  HeartPulse,
} from 'lucide-react';
import { TipoTramite } from '@/types/cliente';
import { ESTADOS_MEXICO } from '@/constants/estadosMexico';
import { ESTADOS_CLIENTE } from '@/constants/estadosCliente';

export interface FormClienteData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono: string;
  email: string;
  estado: string;
  estado_cliente?: string;
  notas: string;
}

export interface FormRetiroData {
  semanas_cotizadas: string;
  ultimo_salario_registrado: string;
  validado_inactivo_imss: boolean;
  req_ine_vigente: boolean;
  req_comprobante_domicilio: boolean;
  req_curp: boolean;
  req_constancia_situacion_fiscal: boolean;
  req_reporte_semanas_imss: boolean;
  req_app_aforemovil_instalada: boolean;
  req_registro_aforemovil_realizado: boolean;
  req_saldo_visible_aforemovil: boolean;
  req_tiene_semanas_descontadas: boolean;
  req_anexo_sindo: boolean;
  observaciones: string;
}

export interface FormMejoravitData {
  req_ine_normal: boolean;
  req_ine_ampliada_200: boolean;
  req_curp_actualizada: boolean;
  req_acta_nacimiento: boolean;
  req_comprobante_domicilio: boolean;
  comprobante_familiar_anexo_acta: boolean;
  req_estado_cuenta_bancario: boolean;
  req_constancia_situacion_fiscal: boolean;
  req_3_referencias_personales: boolean;
  nss_portal_infonavit: string;
  password_portal_infonavit: string;
  req_portal_infonavit_validado: boolean;
  req_fotos_inmueble_5: boolean;
  observaciones: string;
}

export interface FormAltaMedicaData {
  clinica_umf_asignada: string;
  turno_preferido: string;
  codigo_postal_clinica: string;
  modalidad_aseguramiento: string;
  req_curp_validada: boolean;
  req_comprobante_domicilio_reciente: boolean;
  req_identificacion_oficial: boolean;
  req_fotografia_infantil: boolean;
  req_cartilla_nacional_salud: boolean;
  req_alta_patronal_vigente: boolean;
  observaciones: string;
}

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClienteId: string | null;
  feedbackMsg: { type: 'success' | 'error'; text: string } | null;
  saving: boolean;
  formCliente: FormClienteData;
  setFormCliente: React.Dispatch<React.SetStateAction<FormClienteData>>;
  estadoSearchQuery: string;
  setEstadoSearchQuery: (q: string) => void;
  isEstadoDropdownOpen: boolean;
  setIsEstadoDropdownOpen: (open: boolean) => void;
  crearTramiteInicial: boolean;
  setCrearTramiteInicial: (crear: boolean) => void;
  tipoTramiteInicial: TipoTramite;
  setTipoTramiteInicial: (t: TipoTramite) => void;
  formRetiro: FormRetiroData;
  setFormRetiro: React.Dispatch<React.SetStateAction<FormRetiroData>>;
  formMejoravit: FormMejoravitData;
  setFormMejoravit: React.Dispatch<React.SetStateAction<FormMejoravitData>>;
  formAltaMedica: FormAltaMedicaData;
  setFormAltaMedica: React.Dispatch<React.SetStateAction<FormAltaMedicaData>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ClienteFormModal({
  isOpen,
  onClose,
  editingClienteId,
  feedbackMsg,
  saving,
  formCliente,
  setFormCliente,
  estadoSearchQuery,
  setEstadoSearchQuery,
  isEstadoDropdownOpen,
  setIsEstadoDropdownOpen,
  crearTramiteInicial,
  setCrearTramiteInicial,
  tipoTramiteInicial,
  setTipoTramiteInicial,
  formRetiro,
  setFormRetiro,
  formMejoravit,
  setFormMejoravit,
  formAltaMedica,
  setFormAltaMedica,
  onSubmit,
}: ClienteFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {editingClienteId ? <Edit className="w-5 h-5 text-[#dfba73]" /> : <Plus className="w-5 h-5 text-[#c5a059]" />}
            {editingClienteId ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente & Expediente'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackMsg && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${feedbackMsg.type === 'error' ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          {/* Información Básica */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Información del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre(s) *</label>
                <input
                  type="text"
                  required
                  value={formCliente.nombre}
                  onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                  placeholder="ej: Juan Carlos"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Apellido Paterno <span className="text-slate-400 text-[10px] font-normal">(o materno)</span>
                </label>
                <input
                  type="text"
                  value={formCliente.apellido_paterno}
                  onChange={(e) => setFormCliente({ ...formCliente, apellido_paterno: e.target.value })}
                  placeholder="ej: Hernández"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Apellido Materno <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formCliente.apellido_materno}
                  onChange={(e) => setFormCliente({ ...formCliente, apellido_materno: e.target.value })}
                  placeholder="ej: López"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={formCliente.telefono}
                  onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                  placeholder="ej: 55 1234 5678"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={formCliente.email}
                  onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* CAMPO ESTADO DE LA REPÚBLICA */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                  Ubicación (Estado) *
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={formCliente.estado}
                    onFocus={() => setIsEstadoDropdownOpen(true)}
                    onChange={(e) => {
                      setFormCliente({ ...formCliente, estado: e.target.value });
                      setEstadoSearchQuery(e.target.value);
                      setIsEstadoDropdownOpen(true);
                    }}
                    placeholder="Buscar estado..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                  />
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {isEstadoDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 text-xs">
                    {ESTADOS_MEXICO.filter((st) =>
                      st.toLowerCase().includes((estadoSearchQuery || formCliente.estado).toLowerCase())
                    ).length === 0 ? (
                      <div className="p-2 text-slate-400 italic text-center">No se encontró ningún estado matching</div>
                    ) : (
                      ESTADOS_MEXICO.filter((st) =>
                        st.toLowerCase().includes((estadoSearchQuery || formCliente.estado).toLowerCase())
                      ).map((st) => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => {
                            setFormCliente({ ...formCliente, estado: st });
                            setEstadoSearchQuery(st);
                            setIsEstadoDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            formCliente.estado === st
                              ? 'bg-[#c5a059]/10 text-[#c5a059] dark:text-[#dfba73]'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{st}</span>
                          {formCliente.estado === st && <Check className="w-3.5 h-3.5 text-[#c5a059]" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* CAMPO ESTADO / ESTATUS DEL CLIENTE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estatus del Cliente *
                </label>
                <select
                  value={formCliente.estado_cliente || 'interesado'}
                  onChange={(e) => setFormCliente({ ...formCliente, estado_cliente: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                >
                  {ESTADOS_CLIENTE.map((est) => (
                    <option key={est.value} value={est.value}>
                      {est.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observaciones <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formCliente.notas}
                  onChange={(e) => setFormCliente({ ...formCliente, notas: e.target.value })}
                  placeholder="Agrega anotaciones o detalles relevantes del cliente..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Trámite Inicial y Checklist */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crearTramiteInicial}
                  onChange={(e) => setCrearTramiteInicial(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c5a059] focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {editingClienteId ? 'Agregar o Cambiar Trámite / Checklist' : 'Asignar Trámite Inicial y Checklist de Documentos'}
                </span>
              </label>
            </div>

            {crearTramiteInicial && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Selector de Tipo de Trámite */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoTramiteInicial('retiro_desempleo')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      tipoTramiteInicial === 'retiro_desempleo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Retiro Desempleo
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoTramiteInicial('mejoravit')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      tipoTramiteInicial === 'mejoravit'
                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Mejoravit Infonavit
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoTramiteInicial('alta_medica_imss')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      tipoTramiteInicial === 'alta_medica_imss'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                    Alta Médica IMSS
                  </button>
                </div>

                {/* Checklist RETIRO POR DESEMPLEO */}
                {tipoTramiteInicial === 'retiro_desempleo' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Semanas Cotizadas</label>
                        <input
                          type="number"
                          value={formRetiro.semanas_cotizadas}
                          onChange={(e) => setFormRetiro({ ...formRetiro, semanas_cotizadas: e.target.value })}
                          placeholder="ej: 250"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Último Salario Registrado</label>
                        <input
                          type="number"
                          value={formRetiro.ultimo_salario_registrado}
                          onChange={(e) => setFormRetiro({ ...formRetiro, ultimo_salario_registrado: e.target.value })}
                          placeholder="$ 0.00"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formRetiro.validado_inactivo_imss}
                        onChange={(e) => setFormRetiro({ ...formRetiro, validado_inactivo_imss: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Validaste que se encuentra INACTIVO ante el IMSS
                      </span>
                    </label>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Documentación (Escaneada a color):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_ine_vigente}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_ine_vigente: e.target.checked })}
                          />
                          <span>INE vigente</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_app_aforemovil_instalada}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_app_aforemovil_instalada: e.target.checked })}
                          />
                          <span>App AforeMóvil instalada</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_comprobante_domicilio}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_comprobante_domicilio: e.target.checked })}
                          />
                          <span>Comprobante de domicilio</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_registro_aforemovil_realizado}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_registro_aforemovil_realizado: e.target.checked })}
                          />
                          <span>Registro en AforeMóvil realizado</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_curp}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_curp: e.target.checked })}
                          />
                          <span>CURP</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_saldo_visible_aforemovil}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_saldo_visible_aforemovil: e.target.checked })}
                          />
                          <span>Saldo visible en AforeMóvil</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_constancia_situacion_fiscal}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_constancia_situacion_fiscal: e.target.checked })}
                          />
                          <span>Constancia de Situación Fiscal</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_anexo_sindo}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_anexo_sindo: e.target.checked })}
                          />
                          <span>Si tiene semanas descontadas: ANEXAR SINDO</span>
                        </label>
                        <label className="flex items-center gap-2 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={formRetiro.req_reporte_semanas_imss}
                            onChange={(e) => setFormRetiro({ ...formRetiro, req_reporte_semanas_imss: e.target.checked })}
                          />
                          <span>Semanas cotizadas (Reporte del IMSS)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checklist MEJORAVIT */}
                {tipoTramiteInicial === 'mejoravit' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Lista de 10 Documentos Requeridos:
                      </p>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_ine_normal}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_ine_normal: e.target.checked })}
                          />
                          <span><strong>1. INE Normal:</strong> Frente y reverso</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_ine_ampliada_200}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_ine_ampliada_200: e.target.checked })}
                          />
                          <span><strong>2. INE Ampliada al 200%:</strong> Frente y reverso</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_curp_actualizada}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_curp_actualizada: e.target.checked })}
                          />
                          <span><strong>3. CURP Actualizada</strong></span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_acta_nacimiento}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_acta_nacimiento: e.target.checked })}
                          />
                          <span><strong>4. Acta de Nacimiento</strong></span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_comprobante_domicilio}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_comprobante_domicilio: e.target.checked })}
                          />
                          <span><strong>5. Comprobante de Domicilio (Último mes):</strong> Descargado de app/portal</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_estado_cuenta_bancario}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_estado_cuenta_bancario: e.target.checked })}
                          />
                          <span><strong>6. Estado de Cuenta Bancario (Último mes):</strong> Sin abreviaturas</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_constancia_situacion_fiscal}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_constancia_situacion_fiscal: e.target.checked })}
                          />
                          <span><strong>7. Constancia de Situación Fiscal (SAT)</strong></span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_3_referencias_personales}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_3_referencias_personales: e.target.checked })}
                          />
                          <span><strong>8. 3 Referencias Personales:</strong> Nombre, teléfono y última con parentesco</span>
                        </label>

                        <div className="p-2.5 bg-slate-50 dark:bg-[#0d0e12] rounded-lg border border-slate-200 dark:border-zinc-800 space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formMejoravit.req_portal_infonavit_validado}
                              onChange={(e) => setFormMejoravit({ ...formMejoravit, req_portal_infonavit_validado: e.target.checked })}
                            />
                            <span><strong>9. Acceso al Portal Infonavit:</strong></span>
                          </label>
                          <div className="grid grid-cols-2 gap-2 pl-6">
                            <input
                              type="text"
                              value={formMejoravit.password_portal_infonavit}
                              onChange={(e) => setFormMejoravit({ ...formMejoravit, password_portal_infonavit: e.target.value })}
                              placeholder="Contraseña Portal Infonavit"
                              className="w-full px-2 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formMejoravit.req_fotos_inmueble_5}
                            onChange={(e) => setFormMejoravit({ ...formMejoravit, req_fotos_inmueble_5: e.target.checked })}
                          />
                          <span><strong>10. Fotografías del Inmueble:</strong> 5 fotos (3 interiores / 2 exteriores)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checklist ALTA MÉDICA IMSS */}
                {tipoTramiteInicial === 'alta_medica_imss' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Clínica / UMF Asignada</label>
                        <input
                          type="text"
                          value={formAltaMedica.clinica_umf_asignada}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, clinica_umf_asignada: e.target.value })}
                          placeholder="ej: UMF No. 34"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno</label>
                        <select
                          value={formAltaMedica.turno_preferido}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, turno_preferido: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          <option value="Matutino">Matutino</option>
                          <option value="Vespertino">Vespertino</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formAltaMedica.req_curp_validada}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_curp_validada: e.target.checked })}
                        />
                        <span>CURP Validada ante RENAPO</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formAltaMedica.req_comprobante_domicilio_reciente}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_comprobante_domicilio_reciente: e.target.checked })}
                        />
                        <span>Comprobante de Domicilio no mayor a 3 meses</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formAltaMedica.req_identificacion_oficial}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_identificacion_oficial: e.target.checked })}
                        />
                        <span>Identificación Oficial Vigente</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formAltaMedica.req_cartilla_nacional_salud}
                          onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_cartilla_nacional_salud: e.target.checked })}
                        />
                        <span>Cartilla Nacional de Salud</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-[#c5a059] hover:bg-[#d5b069] text-white rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : editingClienteId ? 'Guardar Cambios' : 'Registrar Cliente & Expediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
