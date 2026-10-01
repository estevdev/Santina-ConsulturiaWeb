export interface CapacitacionAdjunto {
  id: string;
  nombre: string;
  url: string;
  tamano?: number; // Tamaño en bytes
  tipo?: string;   // Tipo MIME o extensión
  nota?: string;   // Nota explicativa opcional para el archivo
}

export interface CapacitacionLink {
  id: string;
  titulo?: string;
  url: string;
  nota?: string;   // Nota explicativa opcional para el link
}

export type VideoProvider = 'upload' | 'youtube' | 'vimeo' | 'drive' | 'loom' | 'direct' | 'external';

export interface Capacitacion {
  id: string;
  titulo: string;
  descripcion?: string | null;
  video_url: string;
  video_tipo?: VideoProvider;
  archivos_adjuntos: CapacitacionAdjunto[];
  links: CapacitacionLink[];
  categoria?: string;
  duracion?: string;
  orden?: number;
  creado_por?: string | null;
  creado_por_nombre?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCapacitacionInput {
  titulo: string;
  descripcion?: string;
  video_url: string;
  video_tipo?: VideoProvider;
  archivos_adjuntos?: CapacitacionAdjunto[];
  links?: CapacitacionLink[];
  categoria?: string;
  duracion?: string;
  orden?: number;
}

export interface UpdateCapacitacionInput extends Partial<CreateCapacitacionInput> {
  id: string;
}
