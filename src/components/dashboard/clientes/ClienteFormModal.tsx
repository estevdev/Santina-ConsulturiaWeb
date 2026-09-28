'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ShieldCheck,
  User,
  UserCheck,
  ChevronDown,
  Sparkles,
  Briefcase,
  CreditCard,
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
  nss?: string;
  estado: string;
  estado_cliente?: string;
  notas: string;
  creado_por?: string | null;
  creado_por_nombre?: string | null;
  creado_por_email?: string | null;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
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
  currentUserRole?: string;
  currentUserId?: string;
  availableAdvisors?: StaffUser[];
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
  currentUserRole,
  currentUserId,
  availableAdvisors = [],
}: ClienteFormModalProps) {
  const [showAdvisorSelector, setShowAdvisorSelector] = useState(false);
  const [isAdvisorDropdownOpen, setIsAdvisorDropdownOpen] = useState(false);
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState('');
  const [advisorRoleFilter, setAdvisorRoleFilter] = useState<'all' | 'admin' | 'socios'>('all');
  const advisorDropdownRef = useRef<HTMLDivElement>(null);

  // Resetear estados al abrir el modal para que inicie escondido por defecto
  useEffect(() => {
    if (isOpen) {
      setShowAdvisorSelector(false);
      setIsAdvisorDropdownOpen(false);
      setAdvisorSearchQuery('');
    }
  }, [isOpen, editingClienteId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (advisorDropdownRef.current && !advisorDropdownRef.current.contains(event.target as Node)) {
        setIsAdvisorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAdvisor = availableAdvisors.find((a) => a.id === formCliente.creado_por);

  const filteredAdvisors = availableAdvisors.filter((adv) => {
    const q = advisorSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (adv.name && adv.name.toLowerCase().includes(q)) ||
      (adv.email && adv.email.toLowerCase().includes(q)) ||
      (adv.role && adv.role.toLowerCase().includes(q));

    const matchesRole =
      advisorRoleFilter === 'all' ||
      adv.role === advisorRoleFilter ||
      (advisorRoleFilter === 'socios' && adv.role !== 'admin');

    return matchesSearch && matchesRole;
  });

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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Información del Cliente
              </h3>
              {currentUserRole === 'admin' && (
                <span className="text-[10px] font-semibold text-[#c5a059] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Modo Administrador
                </span>
              )}
            </div>

            {/* SELECCIÓN DE ASESOR / ADMINISTRADOR RESPONSABLE (ESCONDIDO POR DEFECTO) */}
            {currentUserRole === 'admin' ? (
              <div className="mb-5 rounded-2xl border border-[#c5a059]/30 bg-gradient-to-br from-[#121318] via-zinc-950 to-[#121318] shadow-lg overflow-hidden transition-all">
                {/* Resumen Compacto siempre visible */}
                <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                      selectedAdvisor?.role === 'admin'
                        ? 'bg-gradient-to-br from-amber-400 via-[#c5a059] to-[#9a7b38] text-zinc-950 border border-amber-300/60'
                        : (formCliente.creado_por || formCliente.creado_por_nombre)
                        ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-zinc-900 text-white border border-emerald-400/40'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>
                      {(formCliente.creado_por || formCliente.creado_por_nombre) ? (
                        ((selectedAdvisor?.name || formCliente.creado_por_nombre || 'A').trim().charAt(0)).toUpperCase()
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Asesor a cargo:
                        </span>
                        <span className="text-xs font-extrabold text-white truncate">
                          {selectedAdvisor?.name || formCliente.creado_por_nombre || 'Sin asignar (General)'}
                        </span>
                        {(selectedAdvisor?.id === currentUserId || formCliente.creado_por === currentUserId) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-[#dfba73] border border-[#c5a059]/40">
                            Tú
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          selectedAdvisor?.role === 'admin'
                            ? 'bg-amber-500/10 text-[#dfba73] border-[#c5a059]/40'
                            : (formCliente.creado_por || formCliente.creado_por_nombre)
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {selectedAdvisor?.role === 'admin'
                            ? '🛡️ Admin'
                            : (formCliente.creado_por || formCliente.creado_por_nombre)
                            ? '💼 Asesor'
                            : 'General'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {selectedAdvisor?.email || formCliente.creado_por_email || 'Ningún asesor asignado'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAdvisorSelector((prev) => !prev);
                      setIsAdvisorDropdownOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#c5a059]/25 to-amber-500/15 hover:brightness-110 text-[#dfba73] hover:text-amber-200 border border-[#c5a059]/50 font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {showAdvisorSelector
                        ? 'Ocultar Selector'
                        : (formCliente.creado_por || formCliente.creado_por_nombre)
                        ? 'Modificar Asesor'
                        : 'Asignar Asesor'}
                    </span>
                  </button>
                </div>

                {/* Apartado Extendido de Búsqueda y Selección (Completamente visible e interactivo en el flujo del modal) */}
                {showAdvisorSelector && (
                  <div className="p-4 border-t border-[#c5a059]/30 bg-zinc-950 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Selecciona o busca el asesor responsable:</span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400">
                        {filteredAdvisors.length} disponible(s)
                      </span>
                    </div>

                    {/* Buscador Integrado */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        autoFocus
                        value={advisorSearchQuery}
                        onChange={(e) => setAdvisorSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, correo o rol..."
                        className="w-full pl-9 pr-8 py-2.5 text-xs bg-zinc-900 border border-zinc-700 focus:border-[#c5a059] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                      />
                      {advisorSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setAdvisorSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filtro Rápido de Roles */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 font-semibold mr-1">Filtrar:</span>
                      <button
                        type="button"
                        onClick={() => setAdvisorRoleFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          advisorRoleFilter === 'all'
                            ? 'bg-[#c5a059] text-zinc-950 shadow-sm'
                            : 'bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-700'
                        }`}
                      >
                        Todos ({availableAdvisors.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvisorRoleFilter('socios')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          advisorRoleFilter === 'socios'
                            ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-700'
                        }`}
                      >
                        Asesores ({availableAdvisors.filter((a) => a.role === 'socios').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvisorRoleFilter('admin')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          advisorRoleFilter === 'admin'
                            ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-700'
                        }`}
                      >
                        Admins ({availableAdvisors.filter((a) => a.role === 'admin').length})
                      </button>
                    </div>

                    {/* Lista Scrolleable de Asesores */}
                    <div className="max-h-56 overflow-y-auto p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                      {/* Opción Sin Asignar */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormCliente({
                            ...formCliente,
                            creado_por: null,
                            creado_por_nombre: null,
                            creado_por_email: null,
                          });
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          !formCliente.creado_por
                            ? 'bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/40 font-bold'
                            : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span>-- Sin Asesor Asignado (Caso General) --</span>
                        </div>
                        {!formCliente.creado_por && <Check className="w-4 h-4 text-[#c5a059] stroke-[3]" />}
                      </button>

                      {filteredAdvisors.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          No se encontró ningún asesor matching &quot;{advisorSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredAdvisors.map((adv) => {
                          const isSelected = formCliente.creado_por === adv.id;
                          const isMe = adv.id === currentUserId;
                          const initial = (adv.name || adv.email || 'A').trim().charAt(0).toUpperCase();

                          return (
                            <button
                              type="button"
                              key={adv.id}
                              onClick={() => {
                                setFormCliente({
                                  ...formCliente,
                                  creado_por: adv.id,
                                  creado_por_nombre: adv.name,
                                  creado_por_email: adv.email,
                                });
                              }}
                              className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#c5a059]/25 to-amber-500/15 border border-[#c5a059]/60 text-white shadow-sm'
                                  : 'hover:bg-zinc-800/90 text-zinc-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                                  adv.role === 'admin'
                                    ? 'bg-gradient-to-br from-amber-400 to-[#9a7b38] text-zinc-950'
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white'
                                }`}>
                                  {initial}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-white truncate max-w-[170px] sm:max-w-[220px]">
                                      {adv.name || adv.email}
                                    </span>
                                    {isMe && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-[#dfba73] border border-[#c5a059]/30">
                                        Tú
                                      </span>
                                    )}
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${
                                      adv.role === 'admin'
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                      {adv.role === 'admin' ? '🛡️ Admin' : '💼 Asesor'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                    {adv.email}
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#c5a059] flex items-center justify-center text-zinc-950 shrink-0 ml-2 shadow-md">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAdvisorSelector(false)}
                        className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        ✓ Listo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              formCliente.creado_por_nombre && (
                <div className="mb-4 p-3 bg-zinc-900/60 border border-[#c5a059]/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c5a059]" />
                    <span>Asesor a cargo:</span>
                    <strong className="text-amber-200">{formCliente.creado_por_nombre}</strong>
                    {formCliente.creado_por_email && (
                      <span className="text-zinc-500 text-[11px]">({formCliente.creado_por_email})</span>
                    )}
                  </span>
                </div>
              )
            )}

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
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#c5a059]" />
                    Número de Seguridad Social (NSS)
                  </span>
                  <span className="text-slate-400 text-[10px] font-normal">Opcional (11 dígitos)</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={formCliente.nss || ''}
                  onChange={(e) => setFormCliente({ ...formCliente, nss: e.target.value.replace(/\D/g, '') })}
                  placeholder="ej: 12345678901"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono tracking-wider"
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
