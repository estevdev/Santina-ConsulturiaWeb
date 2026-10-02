export type EstadoSolicitud = 'pendiente' | 'contactado' | 'convertido' | 'descartado';

export interface SolicitudContacto {
  id: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  estado_republica?: string | null;
  tramite_interes: string;
  mensaje?: string | null;
  estado: EstadoSolicitud;
  notas_admin?: string | null;
  cliente_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export const TRAMITES_NOMBRES: Record<string, string> = {
  retiro_desempleo: 'Retiro por Desempleo AFORE',
  mejoravit: 'Crédito Mejoravit Infonavit',
  alta_medica_imss: 'Alta Médica IMSS / Clínica',
  otro: 'Asesoría Personalizada / General',
};

export const ESTADOS_SOLICITUD_CONFIG: Record<
  EstadoSolicitud,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  pendiente: {
    label: 'Pendiente',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  contactado: {
    label: 'Contactado',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  convertido: {
    label: 'Convertido a Cliente',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  descartado: {
    label: 'Descartado',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
};
