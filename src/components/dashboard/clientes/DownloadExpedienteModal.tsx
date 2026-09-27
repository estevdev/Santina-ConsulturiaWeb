'use client';

import React from 'react';
import { X, FileDown, FileCheck2, FileText, Sparkles, Eye, Download } from 'lucide-react';
import { Cliente } from '@/types/cliente';

interface DownloadExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  downloadingBundle: 'oficiales' | 'contratos' | 'ambos' | null;
  onPreviewOficiales: () => Promise<void>;
  onDownloadOficiales: () => Promise<void>;
  onPreviewContratos: () => Promise<void>;
  onDownloadContratos: () => Promise<void>;
  onDownloadCompleto: () => Promise<void>;
}

export function DownloadExpedienteModal({
  isOpen,
  onClose,
  cliente,
  downloadingBundle,
  onPreviewOficiales,
  onDownloadOficiales,
  onPreviewContratos,
  onDownloadContratos,
  onDownloadCompleto,
}: DownloadExpedienteModalProps) {
  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f1117] border border-[#c5a059]/30 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c5a059]/20 to-[#9a7b38]/10 text-[#dfba73] flex items-center justify-center font-bold text-lg border border-[#c5a059]/30 shadow-inner">
              <FileDown className="w-5 h-5 text-[#dfba73]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Descargar Expediente Completo
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Expediente oficial de <strong className="text-zinc-200">{cliente.nombre || 'el cliente'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {/* Opción 1: PDF 1 - Documentos Oficiales */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  1. PDF Documentos Oficiales del Cliente
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Consolida: <strong className="text-zinc-300">INE, CURP, Acta, Edo. Cuenta, RFC, Domicilio y Fotos de Inmueble.</strong>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shrink-0">
                PDF 1
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onPreviewOficiales}
                disabled={!!downloadingBundle}
                className="flex-1 py-2.5 px-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/60 cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Previsualizar / Imprimir</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await onDownloadOficiales();
                  onClose();
                }}
                disabled={!!downloadingBundle}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950"
              >
                {downloadingBundle === 'oficiales' ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar PDF 1</span>
              </button>
            </div>
          </div>

          {/* Opción 2: PDF 2 - Contratos & Formatos */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#c5a059]/40 transition-all space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#dfba73] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#c5a059]" />
                  2. PDF Contratos & Formatos (Presets)
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Consolida: <strong className="text-zinc-300">Cartas Bajo Protesta, Presupuesto de Obra y Solicitud de Inscripción.</strong>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-[#dfba73] border border-[#c5a059]/40 shrink-0">
                PDF 2
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onPreviewContratos}
                disabled={!!downloadingBundle}
                className="flex-1 py-2.5 px-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/60 cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-[#dfba73]" />
                <span>Previsualizar / Imprimir</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await onDownloadContratos();
                  onClose();
                }}
                disabled={!!downloadingBundle}
                className="flex-1 py-2.5 px-3 bg-[#c5a059] hover:bg-[#d5b069] disabled:opacity-50 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40"
              >
                {downloadingBundle === 'contratos' ? (
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar PDF 2</span>
              </button>
            </div>
          </div>

          {/* Opción 3: Ambos PDFs */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-[#c5a059]/30 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#dfba73] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c5a059]" />
                  Descargar Expediente Completo (Ambos PDFs)
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Descarga automática en 1-Clic de ambos documentos unificados.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30 shrink-0">
                2 PDFs
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await onDownloadCompleto();
                onClose();
              }}
              disabled={!!downloadingBundle}
              className="w-full py-2.5 px-3 bg-[#c5a059] hover:bg-[#d5b069] disabled:opacity-50 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/30"
            >
              {downloadingBundle === 'ambos' ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-zinc-950" />
              )}
              <span>Descargar Ambos PDFs (Expediente Completo)</span>
            </button>
          </div>
        </div>

        <div className="pt-3 flex justify-end border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
