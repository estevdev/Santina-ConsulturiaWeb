export interface EstadoClienteConfig {
  value: string;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ESTADOS_CLIENTE: EstadoClienteConfig[] = [
  {
    value: 'interesado',
    label: 'Interesado',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
    description: 'Prospecto o cliente interesado en iniciar trámite',
  },
  {
    value: 'en_proceso',
    label: 'En Proceso',
    badgeClass: 'bg-[#c5a059]/20 text-[#dfba73] border-[#c5a059]/40',
    dotClass: 'bg-[#c5a059]',
    description: 'Trámite activo y en gestión por el asesor',
  },
  {
    value: 'documentacion_pendiente',
    label: 'Doc. Pendiente',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
    description: 'Faltan documentos obligatorios del expediente',
  },
  {
    value: 'cita_programada',
    label: 'Cita Programada',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotClass: 'bg-purple-400',
    description: 'Cita agendada ante Infonavit / Institución',
  },
  {
    value: 'terminado',
    label: 'Terminado',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    description: 'Trámite concluido y cobrado con éxito',
  },
  {
    value: 'cancelado',
    label: 'Cancelado',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
    description: 'Cliente no interesado o trámite declinado',
  },
];

export function getEstadoClienteConfig(status?: string | null): EstadoClienteConfig {
  const s = (status || 'interesado').toLowerCase();
  return (
    ESTADOS_CLIENTE.find((c) => c.value === s) || {
      value: s,
      label: status || 'Interesado',
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      dotClass: 'bg-zinc-400',
      description: 'Estado del cliente',
    }
  );
}
