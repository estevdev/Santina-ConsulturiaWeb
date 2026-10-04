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
}

export function DocumentViewerModal({ modalData, onClose }: DocumentViewerModalProps) {
  const isImage =
    modalData.url.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)(\?.*)?$/) ||
    !modalData.url.toLowerCase().includes('.pdf');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = modalData.url;
    a.target = '_blank';
    a.download = modalData.title || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#101217] border border-zinc-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#0d0e12]">
          <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#c5a059] shrink-0" />
            <span className="truncate">{modalData.title}</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 bg-[#08080a] flex items-center justify-center overflow-auto p-3">
          {isImage ? (
            <img
              src={modalData.url}
              alt={modalData.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <iframe
              src={modalData.url}
              title={modalData.title}
              className="w-full h-full rounded-xl border border-zinc-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
