export type EstadoTramite = 
  | 'pendiente' 
  | 'en_proceso' 
  | 'documentacion_incompleta' 
  | 'aprobado' 
  | 'rechazado' 
  | 'finalizado';

export type TipoTramite = 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';

export interface Cliente {
  id: string;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  apellidos?: string | null;
  curp?: string | null;
  nss?: string | null;
  rfc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  estado?: string | null;
  notas?: string | null;
  ine_frente_url?: string | null;
  ine_reverso_url?: string | null;
  ine_completa_url?: string | null;
  curp_document_url?: string | null;
  documentos_urls?: Record<string, string> | null;
  ine_ocr_raw?: Record<string, any> | null;
  creado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 1. RETIRO POR DESEMPLEO (Basado en imagen 1)
export interface TramiteRetiroDesempleo {
  id: string;
  cliente_id: string;
  estado: EstadoTramite;
  
  // Datos del Cliente en el Trámite
  semanas_cotizadas?: number | null;
  ultimo_salario_registrado?: number | null;
  validado_inactivo_imss: boolean;
  
  // Documentación (Escaneada a color)
  req_ine_vigente: boolean;
  req_comprobante_domicilio: boolean;
  req_curp: boolean;
  req_constancia_situacion_fiscal: boolean;
  req_reporte_semanas_imss: boolean;
  
  // AforeMóvil & SINDO
  req_app_aforemovil_instalada: boolean;
  req_registro_aforemovil_realizado: boolean;
  req_saldo_visible_aforemovil: boolean;
  req_tiene_semanas_descontadas: boolean;
  req_anexo_sindo: boolean;
  
  documentos_urls?: Record<string, string> | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 2. MEJORAVIT INFONAVIT (Basado en imagen 2)
export interface ReferenciaPersonal {
  nombre: string;
  telefono: string;
  parentesco?: string;
  es_beneficiario?: boolean;
}

export interface TramiteMejoravit {
  id: string;
  cliente_id: string;
  estado: EstadoTramite;
  
  // 1. INE Normal (Frente y reverso)
  req_ine_normal: boolean;
  
  // 2. INE Ampliada al 200% (Frente y reverso)
  req_ine_ampliada_200: boolean;
  
  // 3. CURP Actualizada
  req_curp_actualizada: boolean;
  
  // 4. Acta de Nacimiento
  req_acta_nacimiento: boolean;
  
  // 5. Comprobante de Domicilio (Último mes)
  req_comprobante_domicilio: boolean;
  comprobante_familiar_anexo_acta: boolean;
  
  // 6. Estado de Cuenta Bancario (Último mes)
  req_estado_cuenta_bancario: boolean;
  
  // 7. Constancia de Situación Fiscal (SAT)
  req_constancia_situacion_fiscal: boolean;
  
  // 8. 3 Referencias Personales
  req_3_referencias_personales: boolean;
  referencias_detalle?: ReferenciaPersonal[];
  
  // 9. NSS y Contraseña Portal Infonavit
  nss_portal_infonavit?: string | null;
  password_portal_infonavit?: string | null;
  req_portal_infonavit_validado: boolean;
  
  // 10. Fotografías del Inmueble (5 fotos: 3 interiores, 2 exteriores)
  req_fotos_inmueble_5: boolean;
  fotos_inmueble_urls?: string[];
  
  documentos_urls?: Record<string, string> | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 3. ALTA MÉDICA IMSS
export interface TramiteAltaMedicaImss {
  id: string;
  cliente_id: string;
  estado: EstadoTramite;
  clinica_umf_asignada?: string | null;
  turno_preferido?: string | null;
  codigo_postal_clinica?: string | null;
  modalidad_aseguramiento?: string | null;
  
  req_curp_validada: boolean;
  req_comprobante_domicilio_reciente: boolean;
  req_identificacion_oficial: boolean;
  req_fotografia_infantil: boolean;
  req_cartilla_nacional_salud: boolean;
  req_alta_patronal_vigente: boolean;
  
  documentos_urls?: Record<string, string> | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}
