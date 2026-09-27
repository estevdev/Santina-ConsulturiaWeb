'use client';

import React from 'react';
import { Eye, Download, X } from 'lucide-react';

export interface DocumentViewerModalState {
  url: string;
  title: string;
}

interface DocumentViewerModalProps {
  modalData: DocumentViewerModalState;
  onClose: () => void;
  onDownload: (url: string, title: string) => void;
}

export function DocumentViewerModal({
  modalData,
  onClose,
  onDownload,
}: DocumentViewerModalProps) {
  const isImage = modalData.url.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/) || !modalData.url.toLowerCase().includes('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d0e12] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-slate-800/80">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#c5a059]" />
            <span>Visualizador: {modalData.title}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(modalData.url, modalData.title)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-2">
          {isImage ? (
            <img src={modalData.url} alt={modalData.title} className="max-h-full max-w-full object-contain rounded-lg" />
          ) : (
            <iframe src={modalData.url} title={modalData.title} className="w-full h-full rounded-lg border-0" />
          )}
        </div>
      </div>
    </div>
  );
}
