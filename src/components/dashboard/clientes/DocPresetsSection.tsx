'use client';

import React from 'react';
import {
  FileText,
  Eye,
  FileCheck2,
  XCircle,
  Link2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Preset } from '@/types/preset';
import { Cliente } from '@/types/cliente';

interface DocPresetsSectionProps {
  tramiteType: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';
  docPresets: Preset[];
  selectedCliente: Cliente | null;
  onGenerateLink: (preset: Preset, tramiteType: string) => void;
  onRemoveDoc: (preset: Preset, docKey: string) => Promise<void>;
  onViewDoc?: (url: string, title: string) => void;
}

export function DocPresetsSection({
  tramiteType,
  docPresets,
  selectedCliente,
  onGenerateLink,
  onRemoveDoc,
  onViewDoc,
}: DocPresetsSectionProps) {
  const matching = docPresets.filter(
    (p) => p.targetTramiteType === 'todos' || p.targetTramiteType === tramiteType
  );

  if (matching.length === 0) return null;

  const clienteNombre = [selectedCliente?.nombre, selectedCliente?.apellido_paterno].filter(Boolean).join(' ') || 'Cliente';

  return (
    <div className="mt-2 pt-2 border-t border-[#c5a059]/20 space-y-1.5">
      {/* Header Ultracompacto */}
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-[#dfba73] flex items-center gap-1.5 uppercase tracking-wide">
          <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
          Formatos Cliente ({matching.length}):
        </h4>
      </div>

      {/* Lista Ultracompacta en Filas */}
      <div className="space-y-1.5">
        {matching.map((preset) => {
          const docKey = `doc_preset_${preset.id}`;
          const existingUrl = selectedCliente?.documentos_urls?.[docKey];
          const hasEmptySample = Boolean(preset.samplePdfUrl);

          return (
            <div
              key={preset.id}
              className="p-2 px-3 rounded-xl border border-zinc-800 bg-[#0d0e12] hover:border-[#c5a059]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all"
            >
              {/* Nombre y Estado en 1 sola línea */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {existingUrl ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
                <span className="font-semibold text-white truncate text-xs">
                  {preset.name}
                </span>
                {existingUrl ? (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/30">
                    Llenado
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-zinc-500 font-medium">
                    (Pendiente)
                  </span>
                )}
              </div>

              {/* Botonera ultracompacta en fila */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {/* Ver Vacío (Plantilla) */}
                {hasEmptySample && (
                  <button
                    type="button"
                    onClick={() => onViewDoc?.(preset.samplePdfUrl!, `Plantilla Vacía: ${preset.name}`)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                    title="Previsualizar formato plantilla vacía dentro de la página"
                  >
                    <Eye className="w-3 h-3 text-[#c5a059]" />
                    <span>Ver Vacío</span>
                  </button>
                )}

                {/* Ver Llenado por Cliente */}
                {existingUrl && (
                  <button
                    type="button"
                    onClick={() => onViewDoc?.(existingUrl, `Formato Llenado: ${preset.name} - ${clienteNombre}`)}
                    className="px-2 py-1 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#dfba73] text-[10px] font-bold rounded-lg border border-[#c5a059]/40 flex items-center gap-1 cursor-pointer"
                    title="Previsualizar documento completado dentro de la página"
                  >
                    <FileCheck2 className="w-3 h-3 text-[#c5a059]" />
                    <span>Ver Llenado</span>
                  </button>
                )}

                {/* Generar Link Cliente */}
                {!existingUrl && (
                  <button
                    type="button"
                    onClick={() => onGenerateLink(preset, tramiteType)}
                    className="px-2.5 py-1 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:brightness-110 text-slate-950 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Generar Link</span>
                  </button>
                )}

                {/* Eliminar del expediente */}
                {existingUrl && (
                  <button
                    type="button"
                    onClick={() => onRemoveDoc(preset, docKey)}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Quitar contrato del expediente para volver a generar enlace"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
