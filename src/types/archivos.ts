export interface ArchivoItem {
  id: string;
  name: string;
  displayName: string;
  path: string;
  url: string;
  size: number;
  sizeFormatted: string;
  mimetype: string;
  extension: string;
  isImage: boolean;
  isPdf: boolean;
  createdAt: string;
  updatedAt: string;
  folder: string;
  isAnexado: boolean;
  anexadoKey?: string;
  anexadoLabel?: string;
  tramiteTipo?: string;
}

export interface ClientFolder {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  folio: string;
  folios: string[];
  nss: string;
  curp: string;
  telefono: string;
  email: string;
  tramites: string[];
  createdAt: string;
  totalArchivos: number;
  totalAnexados: number;
  totalAdicionales: number;
  subfolders: string[];
  archivos: ArchivoItem[];
}

export interface ArchivosExplorerStats {
  totalClientes: number;
  totalArchivos: number;
  totalAnexados: number;
  totalAdicionales: number;
}
