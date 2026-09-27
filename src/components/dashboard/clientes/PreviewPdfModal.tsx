'use client';

import React from 'react';
import { Eye, Printer, X } from 'lucide-react';

export interface PreviewPdfModalState {
  isOpen: boolean;
  title: string;
  pdfBlobUrl: string;
}

interface PreviewPdfModalProps {
  modalData: PreviewPdfModalState;
  onClose: () => void;
}

export function PreviewPdfModal({ modalData, onClose }: PreviewPdfModalProps) {
  if (!modalData.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header del visor */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12141a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {modalData.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visor de expediente interno. Puedes revisar todas las páginas e imprimir directamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const iframe = document.getElementById('internal-pdf-frame') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                } else {
                  window.open(modalData.pdfBlobUrl, '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visualizador iframe embebido */}
        <div className="flex-1 bg-slate-900 relative">
          <iframe
            id="internal-pdf-frame"
            src={modalData.pdfBlobUrl}
            className="w-full h-full border-none"
            title="Visor PDF Interno"
          />
        </div>

        {/* Footer del visor */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#12141a] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Documento generado en memoria (Visor 100% Interno)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
