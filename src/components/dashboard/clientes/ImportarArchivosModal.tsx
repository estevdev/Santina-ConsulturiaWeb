'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FolderArchive,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FolderOpen,
  PackageOpen,
  Sparkles,
  Trash2,
  User,
  Hash,
  ArrowRight,
  RefreshCw,
  Files,
  Search,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Download,
  Maximize2,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-react';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { ModalNotification } from '@/components/ui/ModalNotification';
import { Cliente } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { generateInmuebleFotosPdf } from '@/utils/inmuebleFotosPdfGenerator';

export interface DocumentCategoryDef {
  key: string;
  label: string;
  badge: string;
  targetTramite?: 'mejoravit' | 'retiro' | 'altaMedica' | 'cliente' | 'ninguno';
  reqKey?: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryDef[] = [
  // Documentos Oficiales
  { key: 'acta_nacimiento', label: '📄 Acta de Nacimiento', badge: 'Acta de Nacimiento', targetTramite: 'mejoravit', reqKey: 'req_acta_nacimiento' },
  { key: 'curp', label: '🏛️ CURP Certificada', badge: 'CURP Certificada', targetTramite: 'cliente', reqKey: 'curp' },
  { key: 'constancia_fiscal', label: '📑 Constancia de Situación Fiscal (SAT)', badge: 'Situación Fiscal (SAT)', targetTramite: 'mejoravit', reqKey: 'req_constancia_situacion_fiscal' },
  { key: 'comprobante_domicilio', label: '🏠 Comprobante de Domicilio (Telmex/CFE/Agua)', badge: 'Comp. Domicilio', targetTramite: 'mejoravit', reqKey: 'req_comprobante_domicilio' },
  { key: 'ine_normal', label: '🆔 INE Normal / Identificación Oficial', badge: 'INE Normal', targetTramite: 'mejoravit', reqKey: 'req_ine_normal' },
  { key: 'ine_ampliada_200', label: '🔍 INE Ampliada al 200%', badge: 'INE Ampliada 200%', targetTramite: 'mejoravit', reqKey: 'req_ine_ampliada_200' },
  
  // Trámite Mejoravit (Infonavit)
  { key: 'estado_cuenta_bancario', label: '🏦 Estado de Cuenta Bancario', badge: 'Edo. Cuenta Bancario', targetTramite: 'mejoravit', reqKey: 'req_estado_cuenta_bancario' },
  { key: 'fotos_inmueble', label: '📸 Fotos del Inmueble (PDF Compilado)', badge: 'Fotos Inmueble PDF', targetTramite: 'mejoravit', reqKey: 'req_fotos_inmueble_5' },
  { key: 'foto_inmueble', label: '🖼️ Foto de la Vivienda (Imagen Individual)', badge: 'Foto Vivienda', targetTramite: 'mejoravit', reqKey: 'fotos_inmueble_urls' },
  { key: 'cita_infonavit', label: '📅 Comprobante de Cita Infonavit', badge: 'Cita Infonavit', targetTramite: 'mejoravit', reqKey: 'comprobante_cita_infonavit' },
  { key: 'tabla_amortizacion', label: '📊 Tabla de Amortización Infonavit', badge: 'Tabla Amortización', targetTramite: 'mejoravit', reqKey: 'tabla_amortizacion' },

  // Formatos Cliente y Contratos (Los que dicen borrador son los ya llenados)
  { key: 'carta_bajo_protesta_borrador', label: '✍️ Carta Bajo Protesta (Llenado / Borrador Listo)', badge: 'Bajo Protesta Llenado', targetTramite: 'cliente', reqKey: 'carta_bajo_protesta' },
  { key: 'carta_bajo_protesta_blanco', label: '📄 Carta Bajo Protesta (Formato en Blanco)', badge: 'Bajo Protesta en Blanco', targetTramite: 'cliente', reqKey: 'carta_bajo_protesta_blanco' },
  { key: 'carta_bajo_protesta', label: '✍️ Carta Bajo Protesta (Oficial Firmada)', badge: 'Bajo Protesta Firmada', targetTramite: 'cliente', reqKey: 'carta_bajo_protesta' },

  { key: 'presupuesto_obra_borrador', label: '📝 Presupuesto de Obra (Llenado / Borrador Listo)', badge: 'Presupuesto Llenado', targetTramite: 'cliente', reqKey: 'presupuesto_obra' },
  { key: 'presupuesto_obra_blanco', label: '📄 Presupuesto de Obra (Formato en Blanco)', badge: 'Presupuesto en Blanco', targetTramite: 'cliente', reqKey: 'presupuesto_obra_blanco' },
  { key: 'presupuesto_obra', label: '📝 Presupuesto de Obra (Oficial Firmado)', badge: 'Presupuesto Firmado', targetTramite: 'cliente', reqKey: 'presupuesto_obra' },

  { key: 'solicitud_inscripcion_borrador', label: '📋 Solicitud de Inscripción (Llenado / Borrador Listo)', badge: 'Solicitud Llenada', targetTramite: 'cliente', reqKey: 'solicitud_inscripcion' },
  { key: 'solicitud_inscripcion_blanco', label: '📄 Solicitud de Inscripción (Formato en Blanco)', badge: 'Solicitud en Blanco', targetTramite: 'cliente', reqKey: 'solicitud_inscripcion_blanco' },
  { key: 'solicitud_inscripcion', label: '📋 Solicitud de Inscripción (Oficial Firmada)', badge: 'Solicitud Firmada', targetTramite: 'cliente', reqKey: 'solicitud_inscripcion' },

  { key: 'contrato_mejoravit', label: '📜 Contrato Mejoravit', badge: 'Contrato Mejoravit', targetTramite: 'cliente', reqKey: 'contrato_mejoravit' },
  { key: 'contrato_retiro', label: '📜 Contrato Retiro por Desempleo', badge: 'Contrato Retiro', targetTramite: 'cliente', reqKey: 'contrato_retiro' },

  // Expedientes y Paquetes
  { key: 'expediente_documentos', label: '🗂️ Expediente Documentos Oficiales', badge: 'Exp. Oficiales', targetTramite: 'cliente', reqKey: 'expediente_documentos' },
  { key: 'expediente_borradores', label: '🗂️ Expediente Borradores (Formatos Llenados)', badge: 'Exp. Llenados', targetTramite: 'cliente', reqKey: 'expediente_borradores' },
  { key: 'expediente_formato_blanco', label: '🗂️ Expediente Formato en Blanco', badge: 'Exp. en Blanco', targetTramite: 'cliente', reqKey: 'expediente_formato_en_blanco' },

  // Trámite Retiro por Desempleo
  { key: 'reporte_semanas_imss', label: '💼 Reporte Semanas Cotizadas IMSS', badge: 'Semanas IMSS', targetTramite: 'retiro', reqKey: 'req_reporte_semanas_imss' },
  { key: 'app_aforemovil', label: '📱 Captura App AforeMóvil Instalada', badge: 'App AforeMóvil', targetTramite: 'retiro', reqKey: 'req_app_aforemovil_instalada' },
  { key: 'registro_aforemovil', label: '📱 Registro AforeMóvil Realizado', badge: 'Registro AforeMóvil', targetTramite: 'retiro', reqKey: 'req_registro_aforemovil_realizado' },
  { key: 'saldo_aforemovil', label: '💰 Saldo Visible AforeMóvil', badge: 'Saldo AforeMóvil', targetTramite: 'retiro', reqKey: 'req_saldo_visible_aforemovil' },
  { key: 'anexo_sindo', label: '📑 Anexo SINDO', badge: 'Anexo SINDO', targetTramite: 'retiro', reqKey: 'req_anexo_sindo' },

  // Trámite Alta Médica IMSS
  { key: 'alta_patronal', label: '🏢 Alta Patronal Vigente IMSS', badge: 'Alta Patronal IMSS', targetTramite: 'altaMedica', reqKey: 'req_alta_patronal_vigente' },
  { key: 'cartilla_salud', label: '🩺 Cartilla Nacional de Salud', badge: 'Cartilla de Salud', targetTramite: 'altaMedica', reqKey: 'req_cartilla_nacional_salud' },
  { key: 'fotografia_infantil', label: '👤 Fotografía Infantil', badge: 'Fotografía Infantil', targetTramite: 'altaMedica', reqKey: 'req_fotografia_infantil' },

  // Archivos Adicionales / Varios
  { key: 'archivo_adicional', label: '📁 Archivo Adicional / Otro', badge: 'Doc. Adicional', targetTramite: 'cliente', reqKey: 'documentos_adicionales' },

  // Omitir (solo cuando el usuario decide excluirlo voluntariamente)
  { key: 'ignorar', label: '🚫 Ignorar (No subir)', badge: 'Ignorado', targetTramite: 'ninguno' },
];

export function classifyFilename(rawFilename: string): string {
  const clean = rawFilename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const ext = rawFilename.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'heic', 'avif'].includes(ext);
  const isPdf = ext === 'pdf';

  // 1. Tabla de amortización
  if (clean.includes('tabla amortizacion') || clean.includes('amortizacion')) {
    return 'tabla_amortizacion';
  }

  // 2. Cita Infonavit
  if (clean.includes('cita')) {
    return 'cita_infonavit';
  }

  // 3. Carta bajo protesta (los que dicen borrador son los ya llenados)
  if (clean.includes('bajo protesta') || clean.includes('protesta')) {
    if (clean.includes('borrador') || clean.includes('listo') || clean.includes('llenad')) {
      return 'carta_bajo_protesta_borrador'; // Formato Llenado / Borrador Listo
    }
    if (clean.includes('firmad')) {
      return 'carta_bajo_protesta';
    }
    return 'carta_bajo_protesta_blanco'; // Formato en blanco
  }

  // 4. Presupuesto de obra (los que dicen borrador son los ya llenados)
  if (clean.includes('presupuesto')) {
    if (clean.includes('borrador') || clean.includes('listo') || clean.includes('llenad')) {
      return 'presupuesto_obra_borrador'; // Formato Llenado / Borrador Listo
    }
    if (clean.includes('firmad')) {
      return 'presupuesto_obra';
    }
    return 'presupuesto_obra_blanco'; // Formato en blanco
  }

  // 5. Solicitud de inscripción (los que dicen borrador son los ya llenados)
  if (clean.includes('solicitud') || clean.includes('inscripcion')) {
    if (clean.includes('borrador') || clean.includes('listo') || clean.includes('llenad')) {
      return 'solicitud_inscripcion_borrador'; // Formato Llenado / Borrador Listo
    }
    if (clean.includes('firmad')) {
      return 'solicitud_inscripcion';
    }
    return 'solicitud_inscripcion_blanco'; // Formato en blanco
  }

  // 6. Fotos vivienda / inmueble
  const isViviendaKeywords =
    clean.includes('vivienda') ||
    clean.includes('inmueble') ||
    clean.includes('fachada') ||
    clean.includes('casa') ||
    clean.includes('sala') ||
    clean.includes('comedor') ||
    clean.includes('cocina') ||
    clean.includes('bano') ||
    clean.includes('banio') ||
    clean.includes('recamara') ||
    clean.includes('patio') ||
    clean.includes('cochera') ||
    clean.includes('interior') ||
    clean.includes('exterior') ||
    (clean.includes('foto') && !clean.includes('infantil'));

  if (isViviendaKeywords) {
    if (isPdf) {
      return 'fotos_inmueble'; // PDF compilado de fotos de inmueble
    }
    return 'foto_inmueble'; // Imagen individual de la vivienda
  }

  // 7. Estado de cuenta bancario
  if (
    clean.includes('estado de cuenta') ||
    clean.includes('edo cuenta') ||
    clean.includes('edo cta') ||
    clean.includes('bbva') ||
    clean.includes('bancomer') ||
    clean.includes('banorte') ||
    clean.includes('santander') ||
    clean.includes('bancari')
  ) {
    return 'estado_cuenta_bancario';
  }

  // 8. Expedientes completos
  if (clean.includes('expediente')) {
    if (clean.includes('borrador') || clean.includes('llenad')) return 'expediente_borradores';
    if (clean.includes('documento')) return 'expediente_documentos';
    if (clean.includes('blanco')) return 'expediente_formato_blanco';
    return 'expediente_documentos';
  }

  // 9. Constancia de situación fiscal
  if (clean.includes('constancia') || clean.includes('situacion fiscal') || clean.includes('csf') || clean.includes('sat') || clean.includes('rfc')) {
    return 'constancia_fiscal';
  }

  // 10. CURP
  if (clean.includes('curp') || clean.includes('renapo')) {
    return 'curp';
  }

  // 11. Acta de nacimiento
  if (clean.includes('acta') || clean.includes('nacimiento')) {
    return 'acta_nacimiento';
  }

  // 12. Comprobante de domicilio (Telmex, CFE, Luz, etc.)
  if (
    clean.includes('recibo') ||
    clean.includes('domicilio') ||
    clean.includes('telmex') ||
    clean.includes('cfe') ||
    clean.includes('luz') ||
    clean.includes('agua') ||
    clean.includes('predial') ||
    clean.includes('gas') ||
    clean.includes('totalplay') ||
    clean.includes('izzi') ||
    clean.includes('megacable')
  ) {
    return 'comprobante_domicilio';
  }

  // 13. INE Ampliada 200%
  if (clean.includes('ampliada') || clean.includes('200')) {
    return 'ine_ampliada_200';
  }

  // 14. INE Normal / Identificación
  if (
    clean.includes('ine') ||
    clean.includes('ife') ||
    clean.includes('credencial') ||
    clean.includes('identificacion') ||
    clean.includes('elector')
  ) {
    return 'ine_normal';
  }

  // 15. Semanas cotizadas IMSS
  if (clean.includes('semana') || clean.includes('semanas')) {
    return 'reporte_semanas_imss';
  }

  // 16. AforeMóvil
  if (clean.includes('saldo afore') || clean.includes('saldo visible')) {
    return 'saldo_aforemovil';
  }
  if (clean.includes('registro afore')) {
    return 'registro_aforemovil';
  }
  if (clean.includes('aforemovil') || clean.includes('afore movil') || clean.includes('afore')) {
    return 'app_aforemovil';
  }

  // 17. SINDO
  if (clean.includes('sindo')) {
    return 'anexo_sindo';
  }

  // 18. Alta patronal
  if (clean.includes('patronal') || clean.includes('patron')) {
    return 'alta_patronal';
  }

  // 19. Cartilla de salud
  if (clean.includes('cartilla') || clean.includes('salud')) {
    return 'cartilla_salud';
  }

  // 20. Fotografía infantil
  if (clean.includes('infantil')) {
    return 'fotografia_infantil';
  }

  // 21. Contratos
  if (clean.includes('contrato')) {
    return clean.includes('retiro') ? 'contrato_retiro' : 'contrato_mejoravit';
  }

  // 22. Si es una IMAGEN y no coincidió con ninguna regla previa:
  // Se clasifica como foto de la vivienda para que pueda compilarse automáticamente en el PDF de fotos
  if (isImage) {
    return 'foto_inmueble';
  }

  // 23. Archivos no identificados de cualquier formato:
  // "los archivos no identificados aun asi subelos y relacionalos con el cliente no importa el formato que sean"
  return 'archivo_adicional';
}

export function getMimeTypeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.xml')) return 'application/xml';
  return 'application/octet-stream';
}

export interface ImportItem {
  id: string;
  file: File;
  originalName: string;
  size: number;
  category: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface CategorySearchDropdownProps {
  value: string;
  onChange: (newCategory: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  isImage?: boolean;
}

export function CategorySearchDropdown({
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  isImage = false,
}: CategorySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 280 && rect.top > spaceBelow);
    }
    const nextState = !isOpen;
    setIsOpen(nextState);
    setSearchQuery('');
    if (nextState) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const filteredCategories = useMemo(() => {
    let cats = DOCUMENT_CATEGORIES;
    if (!searchQuery.trim()) {
      if (isImage) {
        // Para imágenes, colocar foto_inmueble al principio para fácil selección
        const fotoInmueble = cats.find((c) => c.key === 'foto_inmueble');
        const otros = cats.filter((c) => c.key !== 'foto_inmueble');
        return fotoInmueble ? [fotoInmueble, ...otros] : cats;
      }
      return cats;
    }
    const cleanQuery = searchQuery
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    return cats.filter((cat) => {
      const cleanLabel = cat.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const cleanBadge = cat.badge
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const cleanKey = cat.key.replace(/_/g, ' ');

      return (
        cleanLabel.includes(cleanQuery) ||
        cleanBadge.includes(cleanQuery) ||
        cleanKey.includes(cleanQuery)
      );
    });
  }, [searchQuery, isImage]);

  const currentCat = DOCUMENT_CATEGORIES.find((c) => c.key === value) || {
    key: value,
    label: value,
    badge: value,
  };

  const isIgnored = value === 'ignorar';

  return (
    <div ref={containerRef} className={`relative text-left ${fullWidth ? 'w-full block' : 'inline-block'}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title="Cambiar tipo de archivo"
        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
          fullWidth ? 'w-full' : 'min-w-[210px] max-w-[280px]'
        } justify-between text-left ${
          isIgnored
            ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            : 'bg-zinc-800 text-zinc-100 border-zinc-700 hover:border-[#c5a059]/60 shadow-sm'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className="truncate flex-1">{currentCat.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform ${
            isOpen ? 'rotate-180 text-[#dfba73]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-72 sm:w-80 bg-[#12141c] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
            openUpwards
              ? 'bottom-full mb-1.5 origin-bottom-right'
              : 'top-full mt-1.5 origin-top-right'
          } ${fullWidth ? 'left-0 sm:left-auto right-0' : 'right-0'}`}
        >
          {/* Header con Buscador */}
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/90">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#c5a059] absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tipo de documento..."
                className="w-full pl-8 pr-7 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c5a059] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de opciones filtradas */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-850/50 p-1">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No se encontró &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = cat.key === value;
                const isIgnorar = cat.key === 'ignorar';
                const isSuggestedImage = isImage && cat.key === 'foto_inmueble';

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      onChange(cat.key);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#c5a059]/20 text-[#dfba73] font-bold border border-[#c5a059]/30'
                        : isIgnorar
                        ? 'text-zinc-400 hover:bg-rose-950/30 hover:text-rose-300'
                        : isSuggestedImage
                        ? 'bg-[#c5a059]/10 text-amber-200 hover:bg-[#c5a059]/20 font-semibold'
                        : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="truncate">{cat.label}</span>
                      {isSuggestedImage && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#c5a059]/30 text-[#dfba73] font-bold shrink-0">
                          Foto sugerida
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#dfba73] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Singleton loader de pdfjs para generar miniaturas eficientemente
let pdfjsLibCache: any = null;
async function getPdfjs() {
  if (!pdfjsLibCache) {
    const lib = await import('pdfjs-dist');
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLibCache = lib;
  }
  return pdfjsLibCache;
}

// Miniatura de la primera página para archivos PDF
export const PdfThumbnail = React.memo(function PdfThumbnail({ file }: { file: File }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let renderTask: any = null;
    let pdfDoc: any = null;

    async function generateThumb() {
      try {
        setLoading(true);
        setError(false);
        const pdfjs = await getPdfjs();

        const buffer = await file.arrayBuffer();
        if (!isMounted) return;

        const loadingTask = pdfjs.getDocument({ data: buffer.slice(0) });
        pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        const page = await pdfDoc.getPage(1);
        if (!isMounted) return;

        // Renderizar a alta resolución (mínimo 800px) para máxima nitidez de texto, sellos y firmas
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = Math.max(800, unscaledViewport.width * 1.5);
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('No 2d context');

        // Fondo blanco sólido para evitar artefactos oscuros o transparentes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display',
        });
        await renderTask.promise;

        if (isMounted) {
          const url = canvas.toDataURL('image/jpeg', 0.94);
          setThumbUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('No se pudo generar miniatura para:', file.name, err);
          setError(true);
          setLoading(false);
        }
      }
    }

    generateThumb();

    return () => {
      isMounted = false;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch (_) {}
      }
      if (pdfDoc && pdfDoc.destroy) {
        try {
          pdfDoc.destroy();
        } catch (_) {}
      }
    };
  }, [file]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 gap-2 p-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#c5a059]" />
        <span className="text-[10px] text-zinc-400 font-medium">Generando página 1...</span>
      </div>
    );
  }

  if (error || !thumbUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-3">
        <FileText className="w-10 h-10 text-rose-400/80 mb-1" />
        <span className="text-[10px] text-zinc-400 font-mono text-center">Documento PDF</span>
      </div>
    );
  }

  return (
    <img
      src={thumbUrl}
      alt={file.name}
      className="max-h-full max-w-full object-contain rounded shadow-sm bg-white transition-transform duration-200 group-hover/thumb:scale-[1.03]"
      loading="lazy"
    />
  );
});

// Miniatura para archivos de Imagen
export const ImageThumbnail = React.memo(function ImageThumbnail({ file }: { file: File }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-500">
        <RefreshCw className="w-5 h-5 animate-spin text-[#c5a059]" />
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={file.name}
      className="max-h-full max-w-full object-contain rounded shadow-sm bg-white transition-transform duration-200 group-hover/thumb:scale-[1.03]"
      loading="lazy"
    />
  );
});

// Selector dinámico de miniatura
export function FileThumbnail({ file }: { file: File }) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isImage =
    file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(file.name);

  if (isPdf) {
    return <PdfThumbnail file={file} />;
  }
  if (isImage) {
    return <ImageThumbnail file={file} />;
  }
  const ext = file.name.split('.').pop()?.toUpperCase() || 'DOC';
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-3">
      <FileText className="w-10 h-10 text-[#c5a059] mb-1" />
      <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">{ext}</span>
    </div>
  );
}

// Visor completo de archivo en lightbox sin salir de la página
interface FilePreviewLightboxProps {
  item: ImportItem | null;
  items: ImportItem[];
  onClose: () => void;
  onSelectCategory: (itemId: string, newCategory: string) => void;
  onNavigate: (item: ImportItem) => void;
}

export function FilePreviewLightbox({
  item,
  items,
  onClose,
  onSelectCategory,
  onNavigate,
}: FilePreviewLightboxProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!item?.file) {
      setBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(item.file);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item?.file]);

  const currentIndex = item ? items.findIndex((it) => it.id === item.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = () => {
    if (hasPrev) onNavigate(items[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onNavigate(items[currentIndex + 1]);
  };

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (hasPrev) handlePrev();
      } else if (e.key === 'ArrowRight') {
        if (hasNext) handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, hasPrev, hasNext, currentIndex]);

  if (!item) return null;

  const lower = item.originalName.toLowerCase();
  const isPdf = lower.endsWith('.pdf');
  const isImage =
    item.file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(item.originalName);
  const catDef = DOCUMENT_CATEGORIES.find((c) => c.key === item.category);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = item.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0e1017] border border-zinc-700/80 rounded-3xl w-full h-[96vh] max-w-[1750px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header de la vista completa */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Lado izquierdo: Información del archivo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30 flex items-center justify-center font-bold shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-[#c5a059]" />
              ) : (
                <ImageIcon className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {currentIndex + 1} de {items.length}
                </span>
                <h4 className="text-sm font-bold text-white truncate max-w-md sm:max-w-lg" title={item.originalName}>
                  {item.originalName}
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono flex items-center gap-2">
                <span>{(item.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="text-[#dfba73] font-sans font-medium">
                  {catDef?.badge || 'Sin clasificar'}
                </span>
              </p>
            </div>
          </div>

          {/* Centro: Controles de Navegación Anterior / Siguiente */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Archivo anterior (tecla ←)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Archivo siguiente (tecla →)"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lado derecho: Reclasificar documento, Descargar, Cerrar */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="hidden lg:inline text-zinc-400 font-medium">Destino:</span>
              <CategorySearchDropdown
                value={item.category}
                onChange={(newCat) => onSelectCategory(item.id, newCat)}
                disabled={item.status === 'success' || item.status === 'uploading'}
                isImage={isImage}
              />
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Descargar este archivo"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Cerrar visor completo (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visor de Contenido Integrado */}
        <div className="flex-1 min-h-0 bg-zinc-950 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
          {blobUrl ? (
            isPdf ? (
              <iframe
                src={blobUrl}
                className="w-full h-full border-0 rounded-2xl bg-zinc-900 shadow-2xl"
                title={item.originalName}
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={blobUrl}
                  alt={item.originalName}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-zinc-800"
                />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <FileText className="w-16 h-16 text-[#c5a059] mx-auto" />
                <p className="text-sm text-zinc-300">
                  Vista previa en línea no disponible para este formato.
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-[#c5a059] text-zinc-950 font-bold text-xs"
                >
                  Descargar archivo
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
              <RefreshCw className="w-7 h-7 animate-spin text-[#c5a059]" />
              <span className="text-xs text-zinc-400">Cargando documento...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImportarArchivosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  allClientes?: Cliente[];
  docPresets?: Preset[];
  onSuccess?: () => void;
}

export function ImportarArchivosModal({
  isOpen,
  onClose,
  cliente,
  allClientes = [],
  docPresets = [],
  onSuccess,
}: ImportarArchivosModalProps) {
  const supabase = createClient();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [confirmUploadOpen, setConfirmUploadOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [selectedClienteId, setSelectedClienteId] = useState<string>(cliente?.id || '');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [showIgnored, setShowIgnored] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename: string }>({
    current: 0,
    total: 0,
    filename: '',
  });
  const [previewingItem, setPreviewingItem] = useState<ImportItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sincronizar cliente actual cuando abre
  React.useEffect(() => {
    if (cliente?.id) {
      setSelectedClienteId(cliente.id);
    } else if (allClientes.length > 0 && !selectedClienteId) {
      setSelectedClienteId(allClientes[0].id);
    }
  }, [cliente, allClientes]);

  const currentTargetCliente = allClientes.find((c) => c.id === selectedClienteId) || cliente;

  // Procesar lista de archivos
  const processFiles = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((f) => {
      const lower = f.name.toLowerCase();
      return (
        !f.name.startsWith('.') &&
        !f.name.startsWith('__MACOSX') &&
        !lower.endsWith('.ds_store') &&
        !lower.endsWith('thumbs.db')
      );
    });

    if (validFiles.length === 0) {
      toast.warning('No se encontraron archivos válidos en la selección.');
      return;
    }

    const newItems: ImportItem[] = validFiles.map((file, idx) => {
      const category = classifyFilename(file.name);
      return {
        id: `${Date.now()}_${idx}_${Math.random()}`,
        file,
        originalName: file.name,
        size: file.size,
        category,
        status: 'pending',
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    toast.success(`Se agregaron ${newItems.length} archivo(s) para clasificación.`);
  };

  // Manejador para Carpeta
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // Manejador para Selección Múltiple de Archivos (sin advertencia nativa de carpetas)
  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    if (filesInputRef.current) filesInputRef.current.value = '';
  };

  // Manejador para ZIP
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const extracted: File[] = [];

      for (const [relativePath, entry] of Object.entries(zip.files)) {
        if (
          entry.dir ||
          relativePath.startsWith('__MACOSX/') ||
          relativePath.includes('/.DS_Store') ||
          relativePath.endsWith('Thumbs.db')
        ) {
          continue;
        }

        const blob = await entry.async('blob');
        const filename = relativePath.split('/').pop() || entry.name;
        const mimeType = getMimeTypeFromFilename(filename);

        extracted.push(new File([blob], filename, { type: mimeType }));
      }

      processFiles(extracted);
    } catch (err: any) {
      console.error('Error al descomprimir ZIP:', err);
      toast.error('Error al leer el archivo ZIP: ' + (err.message || 'Archivo corrupto o no válido'));
    } finally {
      setIsExtracting(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // Drag & drop recursivo para carpetas y archivos (evita diálogos nativos del navegador)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // 1. Verificar si se soltó un archivo ZIP
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const zipFile = droppedFiles.find((f) => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
      setIsExtracting(true);
      try {
        const zip = await JSZip.loadAsync(zipFile);
        const extracted: File[] = [];
        for (const [relativePath, entry] of Object.entries(zip.files)) {
          if (
            entry.dir ||
            relativePath.startsWith('__MACOSX/') ||
            relativePath.includes('/.DS_Store') ||
            relativePath.endsWith('Thumbs.db')
          ) {
            continue;
          }
          const blob = await entry.async('blob');
          const filename = relativePath.split('/').pop() || entry.name;
          const mimeType = getMimeTypeFromFilename(filename);
          extracted.push(new File([blob], filename, { type: mimeType }));
        }
        processFiles(extracted);
      } catch (err: any) {
        toast.error('Error al extraer ZIP: ' + err.message);
      } finally {
        setIsExtracting(false);
      }
      return;
    }

    // 2. Extraer recursivamente si se soltó una carpeta arrastrada directamente
    const itemsList = e.dataTransfer.items;
    if (itemsList && itemsList.length > 0) {
      try {
        const extractedFiles: File[] = [];

        async function readEntry(entry: any) {
          if (!entry) return;
          if (entry.isFile) {
            const f = await new Promise<File>((resolve, reject) => {
              entry.file(resolve, reject);
            });
            extractedFiles.push(f);
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const readEntriesBatch = (): Promise<any[]> => {
              return new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
              });
            };
            let entries = await readEntriesBatch();
            while (entries && entries.length > 0) {
              for (const child of entries) {
                await readEntry(child);
              }
              entries = await readEntriesBatch();
            }
          }
        }

        const entries: any[] = [];
        for (let i = 0; i < itemsList.length; i++) {
          const it = itemsList[i];
          if (it.webkitGetAsEntry) {
            const entry = it.webkitGetAsEntry();
            if (entry) entries.push(entry);
          }
        }

        if (entries.length > 0) {
          setIsExtracting(true);
          for (const entry of entries) {
            await readEntry(entry);
          }
          setIsExtracting(false);
          if (extractedFiles.length > 0) {
            processFiles(extractedFiles);
            return;
          }
        }
      } catch (err) {
        console.warn('Error leyendo carpetas arrastradas:', err);
        setIsExtracting(false);
      }
    }

    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  // Cambiar categoría de un elemento
  const handleCategoryChange = (id: string, newCategory: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item))
    );
    if (previewingItem?.id === id) {
      setPreviewingItem((prev) => (prev ? { ...prev, category: newCategory } : null));
    }
  };

  // Eliminar elemento de la lista
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (previewingItem?.id === id) {
      setPreviewingItem(null);
    }
  };

  // Limpiar lista con confirmación modal
  const handleClearAll = () => {
    if (items.length === 0) return;
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = () => {
    setItems([]);
    setPreviewingItem(null);
    setConfirmClearOpen(false);
  };

  // Solicitar confirmación antes de importar
  const handlePromptImport = () => {
    if (!currentTargetCliente) {
      toast.error('Debes seleccionar o tener un cliente activo para importar los archivos.');
      return;
    }

    const itemsToUpload = items.filter((it) => it.category !== 'ignorar' && it.status !== 'success');
    if (itemsToUpload.length === 0) {
      toast.warning('No hay archivos pendientes para subir (o todos están en estado Ignorar).');
      return;
    }

    setConfirmUploadOpen(true);
  };

  // Ejecutar importación masiva a Supabase
  const handleExecuteImport = async () => {
    setConfirmUploadOpen(false);
    if (!currentTargetCliente) {
      toast.error('Debes seleccionar o tener un cliente activo para importar los archivos.');
      return;
    }

    const itemsToUpload = items.filter((it) => it.category !== 'ignorar' && it.status !== 'success');
    if (itemsToUpload.length === 0) {
      toast.warning('No hay archivos pendientes para subir (o todos están en estado Ignorar).');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: itemsToUpload.length, filename: '' });

    try {
      // 1. Obtener los trámites actuales del cliente
      const [retiroRes, mejoravitRes, altaMedicaRes] = await Promise.all([
        supabase.from('tramites_retiro_desempleo').select('*').eq('cliente_id', currentTargetCliente.id),
        supabase.from('tramites_mejoravit').select('*').eq('cliente_id', currentTargetCliente.id),
        supabase.from('tramites_alta_medica_imss').select('*').eq('cliente_id', currentTargetCliente.id),
      ]);

      let trRetiro = retiroRes.data?.[0];
      let trMejoravit = mejoravitRes.data?.[0];
      let trAltaMedica = altaMedicaRes.data?.[0];

      // Acumuladores de actualizaciones
      let clientDocs = { ...(currentTargetCliente.documentos_urls || {}) };
      let clientUpdates: Record<string, any> = {};

      let mejoravitDocs = trMejoravit ? { ...(trMejoravit.documentos_urls || {}) } : {};
      let mejoravitUpdates: Record<string, any> = {};

      let retiroDocs = trRetiro ? { ...(trRetiro.documentos_urls || {}) } : {};
      let retiroUpdates: Record<string, any> = {};

      let altaMedicaDocs = trAltaMedica ? { ...(trAltaMedica.documentos_urls || {}) } : {};
      let altaMedicaUpdates: Record<string, any> = {};

      let uploadedSuccessCount = 0;

      // 1.5. Compilación automática del PDF de Fotos de la Vivienda si no se subió directamente
      const directFotosPdfItem = itemsToUpload.find(
        (it) => it.category === 'fotos_inmueble' && it.originalName.toLowerCase().endsWith('.pdf')
      );
      const fotoInmuebleItems = itemsToUpload.filter((it) => it.category === 'foto_inmueble');

      if (!directFotosPdfItem && fotoInmuebleItems.length > 0) {
        try {
          setUploadProgress({
            current: 0,
            total: itemsToUpload.length,
            filename: `Compilando PDF con ${fotoInmuebleItems.length} foto(s) de la vivienda...`,
          });

          // Convertir cada imagen a DataURL
          const dataUrls: string[] = await Promise.all(
            fotoInmuebleItems.map((item) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(item.file);
              });
            })
          );

          // Generar el archivo PDF consolidado
          const generatedPdf = await generateInmuebleFotosPdf(
            dataUrls,
            `fotos_inmueble_${currentTargetCliente.id}.pdf`
          );

          // Subir a Storage en bucket 'ine_documents'
          const compiledPdfPath = `${currentTargetCliente.id}/importados/${Date.now()}_fotos_inmueble_compilado.pdf`;
          const { error: pdfUploadErr } = await supabase.storage
            .from('ine_documents')
            .upload(compiledPdfPath, generatedPdf, { upsert: true });

          if (!pdfUploadErr) {
            const { data: { publicUrl: compiledPdfUrl } } = supabase.storage
              .from('ine_documents')
              .getPublicUrl(compiledPdfPath);

            clientDocs.req_fotos_inmueble_5 = compiledPdfUrl;
            if (trMejoravit) {
              mejoravitDocs.req_fotos_inmueble_5 = compiledPdfUrl;
              mejoravitUpdates.req_fotos_inmueble_5 = true;
            }
          }
        } catch (pdfCompileErr: any) {
          console.error('Error al generar PDF de fotos de vivienda:', pdfCompileErr);
          toast.warning('No se pudo compilar el PDF de fotos automáticamente: ' + (pdfCompileErr.message || 'Error'));
        }
      }

      // 2. Iterar y subir cada archivo
      for (let i = 0; i < itemsToUpload.length; i++) {
        const item = itemsToUpload[i];
        setUploadProgress({ current: i + 1, total: itemsToUpload.length, filename: item.originalName });

        // Marcar como subiendo en la UI
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading' } : it))
        );

        try {
          const ext = item.file.name.split('.').pop() || 'pdf';
          const cleanName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `${currentTargetCliente.id}/importados/${Date.now()}_${cleanName}`;

          const { error: uploadErr } = await supabase.storage
            .from('ine_documents')
            .upload(filePath, item.file, { upsert: true });

          if (uploadErr) throw uploadErr;

          const { data: { publicUrl } } = supabase.storage
            .from('ine_documents')
            .getPublicUrl(filePath);

          // Asignar según la categoría
          const cat = item.category;

          if (cat === 'acta_nacimiento') {
            clientDocs.req_acta_nacimiento = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_acta_nacimiento = publicUrl;
              mejoravitUpdates.req_acta_nacimiento = true;
            }
          } else if (cat === 'curp') {
            clientUpdates.curp_document_url = publicUrl;
            clientDocs.curp = publicUrl;
            if (trRetiro) retiroUpdates.req_curp = true;
            if (trMejoravit) mejoravitUpdates.req_curp_actualizada = true;
            if (trAltaMedica) altaMedicaUpdates.req_curp_validada = true;
          } else if (cat === 'constancia_fiscal') {
            clientDocs.req_constancia_situacion_fiscal = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_constancia_situacion_fiscal = publicUrl;
              mejoravitUpdates.req_constancia_situacion_fiscal = true;
            }
            if (trRetiro) {
              retiroDocs.req_constancia_situacion_fiscal = publicUrl;
              retiroUpdates.req_constancia_situacion_fiscal = true;
            }
          } else if (cat === 'comprobante_domicilio') {
            clientDocs.req_comprobante_domicilio = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_comprobante_domicilio = publicUrl;
              mejoravitUpdates.req_comprobante_domicilio = true;
            }
            if (trRetiro) {
              retiroDocs.req_comprobante_domicilio = publicUrl;
              retiroUpdates.req_comprobante_domicilio = true;
            }
            if (trAltaMedica) {
              altaMedicaDocs.req_comprobante_domicilio_reciente = publicUrl;
              altaMedicaUpdates.req_comprobante_domicilio_reciente = true;
            }
          } else if (cat === 'ine_normal') {
            clientUpdates.ine_completa_url = publicUrl;
            clientUpdates.ine_frente_url = publicUrl;
            clientDocs.req_ine_normal = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_ine_normal = publicUrl;
              mejoravitUpdates.req_ine_normal = true;
            }
            if (trRetiro) {
              retiroDocs.req_ine_vigente = publicUrl;
              retiroUpdates.req_ine_vigente = true;
            }
            if (trAltaMedica) {
              altaMedicaDocs.req_identificacion_oficial = publicUrl;
              altaMedicaUpdates.req_identificacion_oficial = true;
            }
          } else if (cat === 'ine_ampliada_200') {
            clientDocs.req_ine_ampliada_200 = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_ine_ampliada_200 = publicUrl;
              mejoravitUpdates.req_ine_ampliada_200 = true;
            }
          } else if (cat === 'estado_cuenta_bancario') {
            clientDocs.req_estado_cuenta_bancario = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_estado_cuenta_bancario = publicUrl;
              mejoravitUpdates.req_estado_cuenta_bancario = true;
            }
          } else if (cat === 'fotos_inmueble') {
            clientDocs.req_fotos_inmueble_5 = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.req_fotos_inmueble_5 = publicUrl;
              mejoravitUpdates.req_fotos_inmueble_5 = true;
            }
          } else if (cat === 'foto_inmueble') {
            if (!Array.isArray(clientDocs.fotos_inmueble_urls)) {
              clientDocs.fotos_inmueble_urls = [];
            }
            if (!clientDocs.fotos_inmueble_urls.includes(publicUrl)) {
              clientDocs.fotos_inmueble_urls.push(publicUrl);
            }
            if (trMejoravit) {
              if (!Array.isArray(mejoravitDocs.fotos_inmueble_urls)) {
                mejoravitDocs.fotos_inmueble_urls = [];
              }
              if (!mejoravitDocs.fotos_inmueble_urls.includes(publicUrl)) {
                mejoravitDocs.fotos_inmueble_urls.push(publicUrl);
              }
            }
          } else if (cat === 'cita_infonavit') {
            clientDocs.comprobante_cita_infonavit = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.comprobante_cita_infonavit = publicUrl;
            }
          } else if (cat === 'tabla_amortizacion') {
            clientDocs.tabla_amortizacion = publicUrl;
            if (trMejoravit) {
              mejoravitDocs.tabla_amortizacion = publicUrl;
            }
          } else if (
            cat === 'carta_bajo_protesta' ||
            cat === 'carta_bajo_protesta_borrador' ||
            cat === 'carta_bajo_protesta_blanco'
          ) {
            clientDocs[cat] = publicUrl;
            // Los que digan borrador o sean firmados son los que están ya llenados y se asignan al preset
            if (cat === 'carta_bajo_protesta_borrador' || cat === 'carta_bajo_protesta') {
              clientDocs.carta_bajo_protesta = publicUrl;
              clientDocs.carta_bajo_protesta_borrador = publicUrl;
              clientDocs.carta_bajo_protesta_llenado = publicUrl;
              const matchingPreset = docPresets.find((p) => p.name.toLowerCase().includes('bajo protesta'));
              if (matchingPreset) {
                clientDocs[`doc_preset_${matchingPreset.id}`] = publicUrl;
              }
            }
          } else if (
            cat === 'presupuesto_obra' ||
            cat === 'presupuesto_obra_borrador' ||
            cat === 'presupuesto_obra_blanco'
          ) {
            clientDocs[cat] = publicUrl;
            if (cat === 'presupuesto_obra_borrador' || cat === 'presupuesto_obra') {
              clientDocs.presupuesto_obra = publicUrl;
              clientDocs.presupuesto_obra_borrador = publicUrl;
              clientDocs.presupuesto_obra_llenado = publicUrl;
              const matchingPreset = docPresets.find((p) => p.name.toLowerCase().includes('presupuesto'));
              if (matchingPreset) {
                clientDocs[`doc_preset_${matchingPreset.id}`] = publicUrl;
              }
            }
          } else if (
            cat === 'solicitud_inscripcion' ||
            cat === 'solicitud_inscripcion_borrador' ||
            cat === 'solicitud_inscripcion_blanco'
          ) {
            clientDocs[cat] = publicUrl;
            if (cat === 'solicitud_inscripcion_borrador' || cat === 'solicitud_inscripcion') {
              clientDocs.solicitud_inscripcion = publicUrl;
              clientDocs.solicitud_inscripcion_borrador = publicUrl;
              clientDocs.solicitud_inscripcion_llenado = publicUrl;
              const matchingPreset = docPresets.find((p) => p.name.toLowerCase().includes('solicitud'));
              if (matchingPreset) {
                clientDocs[`doc_preset_${matchingPreset.id}`] = publicUrl;
              }
            }
          } else if (cat === 'contrato_mejoravit') {
            clientDocs.contrato_mejoravit = publicUrl;
            const matchingPreset = docPresets.find((p) => p.name.toLowerCase().includes('contrato') && p.targetTramiteType === 'mejoravit');
            if (matchingPreset) clientDocs[`doc_preset_${matchingPreset.id}`] = publicUrl;
          } else if (cat === 'contrato_retiro') {
            clientDocs.contrato_retiro = publicUrl;
            const matchingPreset = docPresets.find((p) => p.name.toLowerCase().includes('contrato') && p.targetTramiteType === 'retiro_desempleo');
            if (matchingPreset) clientDocs[`doc_preset_${matchingPreset.id}`] = publicUrl;
          } else if (
            cat === 'expediente_documentos' ||
            cat === 'expediente_borradores' ||
            cat === 'expediente_formato_blanco'
          ) {
            clientDocs[cat] = publicUrl;
          } else if (cat === 'reporte_semanas_imss') {
            clientDocs.reporte_semanas_imss = publicUrl;
            if (trRetiro) {
              retiroDocs.req_reporte_semanas_imss = publicUrl;
              retiroUpdates.req_reporte_semanas_imss = true;
            }
          } else if (cat === 'app_aforemovil') {
            clientDocs.app_aforemovil = publicUrl;
            if (trRetiro) {
              retiroDocs.req_app_aforemovil_instalada = publicUrl;
              retiroUpdates.req_app_aforemovil_instalada = true;
            }
          } else if (cat === 'registro_aforemovil') {
            clientDocs.registro_aforemovil = publicUrl;
            if (trRetiro) {
              retiroDocs.req_registro_aforemovil_realizado = publicUrl;
              retiroUpdates.req_registro_aforemovil_realizado = true;
            }
          } else if (cat === 'saldo_aforemovil') {
            clientDocs.saldo_aforemovil = publicUrl;
            if (trRetiro) {
              retiroDocs.req_saldo_visible_aforemovil = publicUrl;
              retiroUpdates.req_saldo_visible_aforemovil = true;
            }
          } else if (cat === 'anexo_sindo') {
            clientDocs.anexo_sindo = publicUrl;
            if (trRetiro) {
              retiroDocs.req_anexo_sindo = publicUrl;
              retiroUpdates.req_anexo_sindo = true;
            }
          } else if (cat === 'alta_patronal') {
            clientDocs.alta_patronal = publicUrl;
            if (trAltaMedica) {
              altaMedicaDocs.req_alta_patronal_vigente = publicUrl;
              altaMedicaUpdates.req_alta_patronal_vigente = true;
            }
          } else if (cat === 'cartilla_salud') {
            clientDocs.cartilla_salud = publicUrl;
            if (trAltaMedica) {
              altaMedicaDocs.req_cartilla_nacional_salud = publicUrl;
              altaMedicaUpdates.req_cartilla_nacional_salud = true;
            }
          } else if (cat === 'fotografia_infantil') {
            clientDocs.fotografia_infantil = publicUrl;
            if (trAltaMedica) {
              altaMedicaDocs.req_fotografia_infantil = publicUrl;
              altaMedicaUpdates.req_fotografia_infantil = true;
            }
          } else if (cat === 'archivo_adicional') {
            if (!Array.isArray(clientDocs.documentos_adicionales)) {
              clientDocs.documentos_adicionales = [];
            }
            clientDocs.documentos_adicionales.push({
              id: item.id,
              nombre: item.originalName,
              url: publicUrl,
              tipo: item.file.type || 'archivo',
              tamano: item.file.size,
              subido_en: new Date().toISOString(),
            });
            const safeName = item.originalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            clientDocs[`doc_extra_${safeName}`] = publicUrl;
          } else {
            // Cualquier otro archivo no clasificado explícitamente se vincula al cliente
            clientDocs[cat] = publicUrl;
          }

          uploadedSuccessCount++;
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: 'success' } : it))
          );
        } catch (err: any) {
          console.error(`Error al subir ${item.originalName}:`, err);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'error', error: err.message || 'Error en subida' }
                : it
            )
          );
        }
      }

      // 3. Guardar cambios consolidados en base de datos
      // A. Cliente (siempre se actualiza su expediente central)
      await supabase
        .from('clientes')
        .update({
          ...clientUpdates,
          documentos_urls: clientDocs,
        })
        .eq('id', currentTargetCliente.id);

      // B. Trámite Mejoravit (solo se actualiza si el cliente ya cuenta con este trámite registrado)
      if (trMejoravit && (Object.keys(mejoravitUpdates).length > 0 || Object.keys(mejoravitDocs).length > 0)) {
        await supabase
          .from('tramites_mejoravit')
          .update({
            ...mejoravitUpdates,
            documentos_urls: mejoravitDocs,
          })
          .eq('id', trMejoravit.id);
      }

      // C. Trámite Retiro (solo se actualiza si el cliente ya cuenta con este trámite registrado)
      if (trRetiro && (Object.keys(retiroUpdates).length > 0 || Object.keys(retiroDocs).length > 0)) {
        await supabase
          .from('tramites_retiro_desempleo')
          .update({
            ...retiroUpdates,
            documentos_urls: retiroDocs,
          })
          .eq('id', trRetiro.id);
      }

      // D. Trámite Alta Médica (solo se actualiza si el cliente ya cuenta con este trámite registrado)
      if (trAltaMedica && (Object.keys(altaMedicaUpdates).length > 0 || Object.keys(altaMedicaDocs).length > 0)) {
        await supabase
          .from('tramites_alta_medica_imss')
          .update({
            ...altaMedicaUpdates,
            documentos_urls: altaMedicaDocs,
          })
          .eq('id', trAltaMedica.id);
      }

      toast.success(
        `¡${uploadedSuccessCount} de ${itemsToUpload.length} archivos importados y organizados con éxito!`
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error general durante la importación:', err);
      toast.error('Ocurrió un error al guardar en la base de datos: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = items.filter((it) => it.category !== 'ignorar' && it.status !== 'success').length;
  const successCount = items.filter((it) => it.status === 'success').length;
  const ignoredCount = items.filter((it) => it.category === 'ignorar').length;

  const displayedItems = useMemo(() => {
    if (showIgnored) return items;
    return items.filter((it) => it.category !== 'ignorar');
  }, [items, showIgnored]);

  const imageItems = useMemo(() => {
    return items.filter(
      (it) =>
        it.file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(it.originalName)
    );
  }, [items]);

  const fotoInmuebleItems = useMemo(() => {
    return items.filter((it) => it.category === 'foto_inmueble');
  }, [items]);

  const hasDirectFotosPdf = useMemo(() => {
    return items.some(
      (it) => it.category === 'fotos_inmueble' && it.originalName.toLowerCase().endsWith('.pdf')
    );
  }, [items]);

  const nonFotoImagesCount = useMemo(() => {
    return imageItems.filter((it) => it.category !== 'foto_inmueble').length;
  }, [imageItems]);

  const handleMarkAllImagesAsVivienda = () => {
    setItems((prev) =>
      prev.map((it) => {
        const isImg =
          it.file.type.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(it.originalName);
        if (isImg && it.category !== 'foto_inmueble') {
          return { ...it, category: 'foto_inmueble' };
        }
        return it;
      })
    );
    toast.success(`Se marcaron ${imageItems.length} imágenes como Fotos de la Vivienda.`);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
        items.length > 0 ? 'p-2 sm:p-3' : 'p-3 sm:p-5'
      } animate-in fade-in duration-200`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          setPreviewingItem(null);
          onClose();
        }
      }}
    >
      <div
        className={`bg-[#0d0e12] border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all ${
          items.length > 0
            ? 'w-[98vw] max-w-[1780px] h-[95vh] max-h-[96vh]'
            : 'w-full max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-zinc-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <FolderArchive className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Importar Expediente Digital
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30">
                  Carpeta o ZIP
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Selecciona una carpeta o archivo .zip para clasificar y anexar automáticamente todos los documentos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreviewingItem(null);
              onClose();
            }}
            disabled={isUploading}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Cliente Destino */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-semibold text-zinc-300">Cliente Destino:</span>
            {allClientes.length > 0 ? (
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                disabled={isUploading}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:outline-none focus:border-[#c5a059] cursor-pointer max-w-[280px] truncate"
              >
                {allClientes.map((c) => {
                  const fullAps = [c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') || c.apellidos || '';
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {fullAps} (Folio: {c.id.substring(0, 8).toUpperCase()})
                    </option>
                  );
                })}
              </select>
            ) : currentTargetCliente ? (
              <span className="font-bold text-white">
                {currentTargetCliente.nombre} (Folio: {currentTargetCliente.id.substring(0, 8).toUpperCase()})
              </span>
            ) : (
              <span className="text-amber-400">Ningún cliente seleccionado</span>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-zinc-400">
                Total: <strong className="text-white">{items.length}</strong> archivos
              </span>
              {successCount > 0 && (
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 font-bold">
                  ✓ {successCount} subidos
                </span>
              )}
              {ignoredCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowIgnored(!showIgnored)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                    showIgnored
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                  title={showIgnored ? 'Ocultar archivos ignorados' : 'Mostrar archivos ignorados'}
                >
                  {showIgnored ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-zinc-400" />}
                  <span>{ignoredCount} ignorados</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Zona de Arrastre y Selección de Fuentes */}
          {items.length > 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`px-4 py-2.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                dragOver
                  ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#c5a059]" />
                <span className="text-xs font-medium text-zinc-300">
                  Arrastra más archivos aquí o añade desde:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:from-[#aa8b48] hover:to-[#efca83] text-zinc-950 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all">
                  <Files className="w-3.5 h-3.5 text-zinc-950" />
                  <span>+ Archivos</span>
                  <input
                    ref={filesInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelect}
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] hover:text-white border border-zinc-700 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all">
                  <FolderOpen className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>+ Carpeta</span>
                  <input
                    ref={folderInputRef}
                    type="file"
                    // @ts-expect-error webkitdirectory is standard in all modern browsers
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={handleFolderSelect}
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] hover:text-white border border-zinc-700 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all">
                  <PackageOpen className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>+ .ZIP</span>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={handleZipSelect}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                  title="Quitar todos los archivos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                dragOver
                  ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
              }`}
            >
              {isExtracting ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <RefreshCw className="w-10 h-10 text-[#dfba73] animate-spin mb-3" />
                  <h4 className="text-base font-bold text-white">Extrayendo y clasificando archivos...</h4>
                  <p className="text-xs text-zinc-400 mt-1">Por favor espera un momento.</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 text-[#dfba73] flex items-center justify-center mb-4 shadow-inner">
                    <Upload className="w-7 h-7 text-[#c5a059]" />
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Arrastra aquí tu carpeta o archivo .ZIP
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1.5 max-w-md leading-relaxed">
                    El sistema analizará el nombre de cada archivo para sugerir su destino correspondiente (Acta, CURP, Cita, Estado de Cuenta, Fotos, etc.).
                  </p>

                  {/* Botones de Selección */}
                  <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:from-[#aa8b48] hover:to-[#efca83] text-zinc-950 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all">
                      <Files className="w-4 h-4 text-zinc-950" />
                      <span>Seleccionar Archivos</span>
                      <input
                        ref={filesInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFilesSelect}
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] hover:text-white border border-zinc-700 hover:border-[#c5a059]/50 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all">
                      <FolderOpen className="w-4 h-4 text-[#c5a059]" />
                      <span>Seleccionar Carpeta</span>
                      <input
                        ref={folderInputRef}
                        type="file"
                        // @ts-expect-error webkitdirectory is standard in all modern browsers
                        webkitdirectory=""
                        directory=""
                        multiple
                        className="hidden"
                        onChange={handleFolderSelect}
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] hover:text-white border border-zinc-700 hover:border-[#c5a059]/50 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all">
                      <PackageOpen className="w-4 h-4 text-[#c5a059]" />
                      <span>Archivo .ZIP</span>
                      <input
                        ref={zipInputRef}
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        onChange={handleZipSelect}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Barra de Progreso de Subida */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-[#c5a059]/40 space-y-2 shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#dfba73] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Subiendo archivo {uploadProgress.current} de {uploadProgress.total}...
                </span>
                <span className="font-mono text-zinc-300">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#9a7b38] to-[#dfba73] h-full transition-all duration-300"
                  style={{
                    width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 font-mono truncate">
                {uploadProgress.filename}
              </p>
            </div>
          )}

          {/* Tabla de Archivos Detectados para Revisión */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#dfba73]" />
                    Clasificación de Archivos ({displayedItems.length}
                    {!showIgnored && ignoredCount > 0 ? ` de ${items.length}` : ''})
                  </h4>

                  {ignoredCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowIgnored(!showIgnored)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                        showIgnored
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                      title={showIgnored ? 'Ocultar archivos ignorados' : 'Mostrar archivos ignorados'}
                    >
                      {showIgnored ? (
                        <>
                          <EyeOff className="w-3 h-3 text-zinc-400" />
                          <span>Ocultar ignorados ({ignoredCount})</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Mostrar ignorados ({ignoredCount})</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Botón rápido para marcar imágenes detectadas como fotos de vivienda */}
                  {imageItems.length > 0 && nonFotoImagesCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllImagesAsVivienda}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#c5a059]/15 text-[#dfba73] hover:bg-[#c5a059]/25 border border-[#c5a059]/30 transition-all cursor-pointer shadow-sm"
                      title="Marcar todas las imágenes detectadas como fotos de vivienda"
                    >
                      <Camera className="w-3 h-3 text-[#c5a059]" />
                      <span>Marcar imágenes como Fotos Vivienda ({imageItems.length})</span>
                    </button>
                  )}

                  {/* Indicador de compilación automática de PDF para fotos de inmueble */}
                  {fotoInmuebleItems.length > 0 && !hasDirectFotosPdf && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                      title="Al subir, estas fotos se compilarán en un solo PDF consolidado de Fotos de Vivienda y se asignarán al expediente del cliente"
                    >
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      <span>✨ Se generará PDF automático ({fotoInmuebleItems.length} foto{fotoInmuebleItems.length > 1 ? 's' : ''})</span>
                    </span>
                  )}

                  {hasDirectFotosPdf && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-800/60"
                      title="Se detectó un PDF de fotos cargado directamente; se priorizará ese archivo"
                    >
                      <FileCheck className="w-3 h-3 text-cyan-400" />
                      <span>PDF Directo de Fotos detectado</span>
                    </span>
                  )}
                </div>

                {/* Alternador de Vista (Cuadrícula 5xX vs Lista) */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 hidden md:inline">
                    Haz clic en cualquier archivo para verlo completo
                  </span>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Vista en tabla de 5 x X con página 1"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cuadrícula 5xX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-[#c5a059] text-zinc-950 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Vista en lista compacta"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {displayedItems.length === 0 && ignoredCount > 0 && !showIgnored ? (
                <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center flex flex-col items-center justify-center">
                  <EyeOff className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-xs font-bold text-zinc-300">
                    Todos los archivos detectados ({ignoredCount}) están en estado &quot;Ignorar&quot;
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Están ocultos para mayor comodidad. Puedes mostrarlos para reclasificarlos si lo deseas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowIgnored(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] text-xs font-semibold border border-zinc-700 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mostrar {ignoredCount} archivos ignorados</span>
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* TABLA DE 5 X X (CUADRÍCULA DE DOCUMENTOS) */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 pb-2">
                  {displayedItems.map((item, idx) => {
                    const catDef = DOCUMENT_CATEGORIES.find((c) => c.key === item.category);
                    const isIgnored = item.category === 'ignorar';
                    const isSuccess = item.status === 'success';
                    const isUploadingThis = item.status === 'uploading';
                    const isError = item.status === 'error';
                    const lower = item.originalName.toLowerCase();
                    const isPdf = lower.endsWith('.pdf');
                    const isImage =
                      item.file.type.startsWith('image/') ||
                      /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(item.originalName);

                    return (
                      <div
                        key={item.id}
                        className={`group/card rounded-2xl border p-3 flex flex-col gap-2.5 transition-all duration-200 ${
                          isSuccess
                            ? 'bg-emerald-950/20 border-emerald-800/60 ring-1 ring-emerald-500/30'
                            : isError
                            ? 'bg-rose-950/20 border-rose-800/60 ring-1 ring-rose-500/30'
                            : isIgnored
                            ? 'bg-zinc-950/40 border-zinc-800/60 opacity-65 hover:opacity-100'
                            : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-md'
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isPdf
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : isImage
                                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC'}
                            </span>
                            {isSuccess && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Subido
                              </span>
                            )}
                            {isUploadingThis && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#c5a059]/20 text-[#dfba73] flex items-center gap-1 animate-pulse">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Subiendo...
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewingItem(item)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Ver documento completo"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            {!isSuccess && !isUploading && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Eliminar de la lista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Vista previa miniatura (Página 1) interactiva con tamaño optimizado para 5xX */}
                        <div
                          onClick={() => setPreviewingItem(item)}
                          className="relative h-44 sm:h-52 w-full rounded-xl overflow-hidden bg-zinc-950/80 border border-zinc-800/80 cursor-pointer shadow-inner flex items-center justify-center group/thumb p-2"
                        >
                          <FileThumbnail file={item.file} />

                          {/* Indicador de página 1 */}
                          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/75 text-zinc-300 border border-white/10 backdrop-blur-sm pointer-events-none">
                            Pág. 1
                          </span>

                          {/* Capa de Hover: Clic para ver completo */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 backdrop-blur-[2px] p-2 text-center">
                            <div className="w-8 h-8 rounded-full bg-[#c5a059] text-zinc-950 flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform">
                              <Eye className="w-4 h-4 text-zinc-950 font-bold" />
                            </div>
                            <span className="text-[11px] font-bold text-white bg-black/85 px-2.5 py-0.5 rounded-full border border-white/10 shadow-md">
                              Ver completo
                            </span>
                          </div>
                        </div>

                        {/* Datos del archivo */}
                        <div className="space-y-1">
                          <p className="font-semibold text-white truncate text-xs" title={item.originalName}>
                            {item.originalName}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                            <span>{(item.size / 1024).toFixed(1)} KB</span>
                            <span className="text-[#dfba73] font-sans font-medium truncate max-w-[150px] text-right">
                              {catDef?.badge || 'Sin clasificar'}
                            </span>
                          </div>
                          {item.error && (
                            <p className="text-[10px] text-rose-400 truncate">
                              Error: {item.error}
                            </p>
                          )}
                        </div>

                        {/* Selector de categoría con buscador */}
                        <div className="pt-1 mt-auto">
                          <CategorySearchDropdown
                            value={item.category}
                            onChange={(newCat) => handleCategoryChange(item.id, newCat)}
                            disabled={isUploading || isSuccess}
                            isImage={isImage}
                            fullWidth
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* VISTA EN LISTA CLÁSICA */
                <div className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-950/60">
                  {displayedItems.map((item, idx) => {
                    const catDef = DOCUMENT_CATEGORIES.find((c) => c.key === item.category);
                    const isIgnored = item.category === 'ignorar';
                    const isSuccess = item.status === 'success';
                    const isUploadingThis = item.status === 'uploading';
                    const isError = item.status === 'error';
                    const isImage =
                      item.file.type.startsWith('image/') ||
                      /\.(jpg|jpeg|png|webp|bmp|tiff|heic|avif)$/i.test(item.originalName);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors text-xs ${
                          isSuccess
                            ? 'bg-emerald-950/20'
                            : isError
                            ? 'bg-rose-950/30'
                            : isIgnored
                            ? 'opacity-60 bg-zinc-900/30'
                            : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        {/* Información del archivo */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setPreviewingItem(item)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border cursor-pointer transition-transform hover:scale-105 ${
                              isSuccess
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : isError
                                ? 'bg-rose-950 text-rose-400 border-rose-800'
                                : isIgnored
                                ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                                : 'bg-[#c5a059]/15 text-[#dfba73] border-[#c5a059]/30 hover:bg-[#c5a059]/30'
                            }`}
                            title="Clic para ver documento completo"
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isUploadingThis ? (
                              <RefreshCw className="w-4 h-4 text-[#dfba73] animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => setPreviewingItem(item)}
                              className="font-semibold text-white truncate text-xs leading-snug hover:text-[#dfba73] transition-colors text-left block max-w-full cursor-pointer"
                              title={item.originalName}
                            >
                              {item.originalName}
                            </button>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                              <span>{(item.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="text-[#dfba73] font-sans font-medium">
                                {catDef?.badge || 'Sin clasificar'}
                              </span>
                              {item.error && (
                                <span className="text-rose-400 font-sans">
                                  ({item.error})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Selector de Destino & Acciones con Buscador */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setPreviewingItem(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Ver documento completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <CategorySearchDropdown
                            value={item.category}
                            onChange={(newCat) => handleCategoryChange(item.id, newCat)}
                            disabled={isUploading || isSuccess}
                            isImage={isImage}
                          />

                          {!isSuccess && !isUploading && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              title="Quitar de la lista"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones Finales */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            {items.length === 0 ? (
              <span>Selecciona una carpeta o ZIP para comenzar.</span>
            ) : isUploading ? (
              <span className="text-[#dfba73] font-semibold animate-pulse">
                Subiendo y organizando expediente en tiempo real...
              </span>
            ) : successCount > 0 && pendingCount === 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                ¡Todos los archivos han sido importados con éxito!
              </span>
            ) : (
              <span>
                Listos para subir: <strong className="text-white">{pendingCount}</strong> de {items.length} archivos.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setPreviewingItem(null);
                onClose();
              }}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 flex-1 sm:flex-none justify-center"
            >
              {successCount > 0 ? 'Cerrar' : 'Cancelar'}
            </button>

            {items.length > 0 && pendingCount > 0 && (
              <button
                type="button"
                onClick={handlePromptImport}
                disabled={isUploading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:from-[#aa8b48] hover:to-[#efca83] text-zinc-950 text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50 flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-zinc-950" />
                    <span>Importar y Guardar ({pendingCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación Personalizado para Carga */}
      <ModalNotification
        isOpen={confirmUploadOpen}
        onClose={() => setConfirmUploadOpen(false)}
        type="upload"
        title={`¿Deseas cargar ${pendingCount} archivos al expediente?`}
        badge="Expediente Digital"
        description={`Esta acción subirá y organizará todos los archivos clasificados para ${
          currentTargetCliente
            ? `${currentTargetCliente.nombre} ${currentTargetCliente.apellido_paterno || ''}`.trim()
            : 'el cliente seleccionado'
        }.`}
        message={
          <div className="space-y-2 text-xs text-zinc-300">
            <p>
              Se subirán <strong>{pendingCount} archivos</strong> y se actualizarán automáticamente los requisitos correspondientes en el checklist.
            </p>
            {ignoredCount > 0 && (
              <p className="text-zinc-400">
                ({ignoredCount} archivo{ignoredCount > 1 ? 's' : ''} en estado &quot;Ignorar&quot; no se subirán).
              </p>
            )}
          </div>
        }
        confirmText="Cargar Archivos"
        cancelText="Cancelar"
        onConfirm={handleExecuteImport}
      />

      {/* Modal de Confirmación para Vaciar Lista */}
      <ModalNotification
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        type="danger"
        title="¿Deseas vaciar la lista de archivos?"
        description="Se quitarán todos los archivos que tienes en la lista de clasificación."
        confirmText="Vaciar Lista"
        cancelText="Cancelar"
        onConfirm={handleConfirmClear}
      />

      {/* Visor Completo de Documento (Lightbox sin salir de la página) */}
      <FilePreviewLightbox
        item={previewingItem}
        items={displayedItems}
        onClose={() => setPreviewingItem(null)}
        onSelectCategory={handleCategoryChange}
        onNavigate={(targetItem) => setPreviewingItem(targetItem)}
      />
    </div>
  );
}
