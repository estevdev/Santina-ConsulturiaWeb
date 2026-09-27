'use client';

import React from 'react';
import { X, Link2, Check, Copy } from 'lucide-react';

export interface ClientDocLinkModalState {
  isOpen: boolean;
  linkUrl: string;
  presetName: string;
  token: string;
  clienteNombre: string;
  clientePhone?: string;
  copied: boolean;
}

interface ClientDocLinkModalProps {
  modalData: ClientDocLinkModalState;
  onClose: () => void;
  onCopy: () => void;
}

export function ClientDocLinkModal({
  modalData,
  onClose,
  onCopy,
}: ClientDocLinkModalProps) {
  if (!modalData.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              <span>Enlace para Documento de Cliente</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparte este link con el cliente para que rellene: <strong>{modalData.presetName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Link Único Generado:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={modalData.linkUrl}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={onCopy}
              className="px-3.5 py-2 bg-[#c5a059] hover:bg-[#d5b069] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
            >
              {modalData.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{modalData.copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl text-xs">
            <span className="text-purple-900 dark:text-purple-200 font-medium">
              Cliente: <strong>{modalData.clienteNombre}</strong>
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
