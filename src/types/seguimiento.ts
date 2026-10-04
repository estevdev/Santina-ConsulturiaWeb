export interface PasoTimeline {
  id: string;
  titulo: string;
  descripcion: string;
  completado: boolean;
  estadoPaso: 'completado' | 'en_proceso' | 'pendiente';
}

export interface DocumentoRequisito {
  id: string;
  titulo: string;
  descripcion: string;
  obligatorio: boolean;
  subido: boolean;
  archivoUrl: string | null;
  formatosAceptados: string;
  mimePattern: string;
  categoria?: string;
}

export interface ProgresoTramite {
  completados: number;
  total: number;
  porcentaje: number;
}

export interface ProgresoDocumentos {
  subidos: number;
  total: number;
  porcentaje: number;
}

export interface TramiteResultado {
  cliente: {
    nombrePublico: string;
  };
  tramite: {
    id: string;
    folio: string;
    tipo: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';
    tipoNombre: string;
    estado: string;
    observaciones: string | null;
    created_at: string;
    updated_at: string;
  };
  pasos: PasoTimeline[];
  progreso: ProgresoTramite;
  documentos: DocumentoRequisito[];
  progresoDocumentos: ProgresoDocumentos;
}
