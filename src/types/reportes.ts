import { Cliente, EstadoCliente } from './cliente';

export interface StateMetrics {
  id: string; // 'JAL', 'CMX', etc.
  name: string; // 'Jalisco', 'Ciudad de México', etc.
  totalClientes: number;
  percentageOfTotal: number;
  interesados: number;
  enProceso: number;
  docPendiente: number;
  citaProgramada: number;
  terminados: number;
  cancelados: number;
  tramites: {
    retiro: number;
    mejoravit: number;
    altaMedica: number;
    sinTramite: number;
  };
  clientes: Cliente[];
}

export interface OverviewMetrics {
  totalClientes: number;
  activeClientes: number;
  statesCovered: number;
  statesTotal: number;
  nationalCoveragePercent: number;
  totalTerminados: number;
  totalEnProceso: number;
  totalDocPendiente: number;
  totalCitasProgramadas: number;
  totalInteresados: number;
  totalCancelados: number;
  successRate: number; // Terminados / (Terminados + Cancelados || 1)
  totalTramites: number;
  tramitesRetiro: number;
  tramitesMejoravit: number;
  tramitesAltaMedica: number;
}

export interface AdvisorMetrics {
  name: string;
  email?: string;
  totalClients: number;
  terminados: number;
  enProceso: number;
  docPendiente: number;
  citas: number;
  successRate: number;
}

export type TimeRangeFilter = 'all' | '30d' | '90d' | 'year' | 'month';
