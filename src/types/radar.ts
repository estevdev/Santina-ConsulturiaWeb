import { Cliente, EstadoCliente } from './cliente';

export interface TramiteSummary {
  tipo: 'mejoravit' | 'retiro_desempleo' | 'alta_medica';
  nombre: string;
  estado: string;
  totalReqs: number;
  completedReqs: number;
  progreso: number; // 0 a 100
  faltantes: string[];
  completados: string[];
}

export interface CitaSummary {
  fecha?: string;
  hora?: string;
  lugar?: string;
  folio?: string;
  estado?: 'pendiente' | 'confirmada' | 'asistida' | 'cancelada';
  notas?: string;
  comprobanteUrl?: string;
  diasRestantes?: number;
  esHoy?: boolean;
  esManana?: boolean;
  pasoTexto?: string;
}

export interface ClienteRadar {
  id: string;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  apellidos?: string | null;
  nombreCompleto: string;
  telefono?: string | null;
  email?: string | null;
  curp?: string | null;
  nss?: string | null;
  estado_cliente: EstadoCliente | string;
  creado_por_nombre?: string | null;
  creado_por_email?: string | null;
  created_at?: string;
  updated_at?: string;
  notas?: string | null;
  
  // Trámites consolidados
  tramites: TramiteSummary[];
  tramitesNombres: string[];
  
  // Avance global ponderado
  overallProgress: number; // 0 a 100
  
  // Cita agendada (si existe)
  cita: CitaSummary | null;
  
  // Marcadores de estado crítico
  isPuntoDeSalir: boolean;
  motivoPuntoDeSalir?: string;
  hasCita: boolean;
  tieneFaltantesCriticos: boolean;
  
  // Referencia al objeto original
  clienteOriginal: Cliente;
}

export type RadarViewMode = 'kanban' | 'compact' | 'citas';
