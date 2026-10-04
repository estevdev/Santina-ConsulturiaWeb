'use client';

import React from 'react';
import { ClientFolder } from '@/types/archivos';
import {
  Folder,
  FolderOpen,
  ShieldCheck,
  FileText,
  User,
  ArrowRight,
  Hash,
  CreditCard,
  Briefcase,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClientFolderCardProps {
  client: ClientFolder;
  onOpen: (client: ClientFolder) => void;
}

export function ClientFolderCard({ client, onOpen }: ClientFolderCardProps) {
  const copyFolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.folio) {
      navigator.clipboard.writeText(client.folio);
      toast.success(`Folio ${client.folio} copiado`);
    }
  };

  const copyNss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.nss) {
      navigator.clipboard.writeText(client.nss);
      toast.success(`NSS ${client.nss} copiado`);
    }
  };

  const annexedRatio =
    client.totalArchivos > 0
      ? Math.round((client.totalAnexados / client.totalArchivos) * 100)
      : 0;

  return (
    <div
      onClick={() => onOpen(client)}
      className="group relative flex flex-col justify-between bg-[#12141a] hover:bg-[#151821] border border-zinc-800/80 hover:border-[#c5a059]/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-[#c5a059]/5"
    >
      {/* Top row: Folder Icon + Badges */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c5a059]/20 to-[#c5a059]/5 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] group-hover:scale-105 group-hover:bg-[#c5a059]/25 transition-all shadow-md shadow-[#c5a059]/10">
            <Folder className="w-6 h-6 group-hover:hidden" />
            <FolderOpen className="w-6 h-6 hidden group-hover:block text-[#dfba73]" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {client.folio && (
              <button
                type="button"
                onClick={copyFolio}
                title="Copiar folio"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30 hover:bg-[#c5a059]/30 transition-colors"
              >
                <span>Folio: {client.folio}</span>
                <Copy className="w-2.5 h-2.5 opacity-60" />
              </button>
            )}

            {client.nss && (
              <button
                type="button"
                onClick={copyNss}
                title="Copiar NSS"
                className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700 transition-colors"
              >
                <span>NSS: {client.nss}</span>
              </button>
            )}
          </div>
        </div>

        {/* Client Name */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-white group-hover:text-[#dfba73] transition-colors line-clamp-1">
            {client.nombreCompleto}
          </h3>
          {client.curp && (
            <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
              CURP: {client.curp}
            </p>
          )}
        </div>

        {/* Trámites Tags */}
        {client.tramites.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-4">
            {client.tramites.map((t) => (
              <span
                key={t}
                className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Area: Files breakdown & action */}
      <div className="pt-3 border-t border-zinc-800/70">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-zinc-400 font-medium">
            {client.totalArchivos}{' '}
            <span className="text-[11px] text-zinc-500">
              {client.totalArchivos === 1 ? 'archivo' : 'archivos'}
            </span>
          </span>

          <div className="flex items-center gap-2">
            {client.totalAnexados > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{client.totalAnexados} anexados</span>
              </span>
            )}
            {client.totalAdicionales > 0 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                +{client.totalAdicionales} adicionales
              </span>
            )}
          </div>
        </div>

        {/* Progress Mini Bar */}
        {client.totalArchivos > 0 ? (
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${annexedRatio}%` }}
              title={`${annexedRatio}% Anexados`}
            />
            <div
              className="bg-zinc-600 transition-all duration-300"
              style={{ width: `${100 - annexedRatio}%` }}
              title="Adicionales"
            />
          </div>
        ) : (
          <p className="text-[10px] text-zinc-600 italic">Carpeta vacía sin documentos</p>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-[#c5a059] font-bold group-hover:translate-x-0.5 transition-transform">
          <span>Explorar Carpeta</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
