'use client';

import React from 'react';
import { UserCheck, ExternalLink, XCircle, Link2 } from 'lucide-react';
import { Preset } from '@/types/preset';
import { Cliente } from '@/types/cliente';

interface DocPresetsSectionProps {
  tramiteType: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';
  docPresets: Preset[];
  selectedCliente: Cliente | null;
  onGenerateLink: (preset: Preset, tramiteType: string) => void;
  onRemoveDoc: (preset: Preset, docKey: string) => Promise<void>;
}

export function DocPresetsSection({
  tramiteType,
  docPresets,
  selectedCliente,
  onGenerateLink,
  onRemoveDoc,
}: DocPresetsSectionProps) {
  const matching = docPresets.filter(
    (p) => p.targetTramiteType === 'todos' || p.targetTramiteType === tramiteType
  );

  if (matching.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-zinc-800/60 space-y-2">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5" />
        Documentos / Formatos para Cliente ({matching.length}):
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {matching.map((preset) => {
          const docKey = `doc_preset_${preset.id}`;
          const existingUrl = selectedCliente?.documentos_urls?.[docKey];

          return (
            <div
              key={preset.id}
              className="p-2.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col justify-between gap-2"
            >
              <div>
                <span className="font-semibold text-xs text-purple-900 dark:text-purple-200 block">
                  {preset.name}
                </span>
                {preset.description && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                    {preset.description}
                  </span>
                )}
              </div>

              {existingUrl ? (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-purple-200/50 dark:border-purple-900/40">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Llenado por Cliente
                    </span>
                    <a
                      href={existingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-[#c5a059] dark:text-[#dfba73] hover:underline flex items-center gap-1"
                    >
                      Ver PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-dashed border-purple-200/40 dark:border-purple-900/30">
                    <button
                      type="button"
                      onClick={() => onRemoveDoc(preset, docKey)}
                      className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Quitar contrato del expediente para volver a generar enlace"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Eliminar del expediente (volver a generar link)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onGenerateLink(preset, tramiteType)}
                  className="w-full py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Generar Link Cliente</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
