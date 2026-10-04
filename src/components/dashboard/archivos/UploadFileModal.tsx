'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNombre: string;
  subfolders: string[];
  onFileUploaded: () => void;
}

export function UploadFileModal({
  isOpen,
  onClose,
  clienteId,
  clienteNombre,
  subfolders,
  onFileUploaded,
}: UploadFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolder, setTargetFolder] = useState<string>('archivos_adicionales');
  const [customFolder, setCustomFolder] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo para subir.');
      return;
    }

    const folderToUse = targetFolder === '__custom__' ? (customFolder.trim() || 'archivos_adicionales') : targetFolder;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clienteId', clienteId);
      formData.append('folder', folderToUse);

      const res = await fetch('/api/admin/archivos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al subir el archivo');
      }

      toast.success(`Archivo "${selectedFile.name}" subido exitosamente a la carpeta del cliente.`);
      setSelectedFile(null);
      onFileUploaded();
      onClose();
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast.error(err.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12141a] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Subir Archivo al Cliente</h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs">{clienteNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Destino Subcarpeta */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Carpeta de Destino:</label>
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              className="w-full bg-[#181b22] border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#c5a059] transition-colors"
            >
              <option value="archivos_adicionales">archivos_adicionales (General)</option>
              <option value="importados">importados (Expediente Externo)</option>
              {subfolders
                .filter((sf) => sf !== 'Raíz' && sf !== 'archivos_adicionales' && sf !== 'importados')
                .map((sf) => (
                  <option key={sf} value={sf}>
                    {sf}
                  </option>
                ))}
              <option value="__custom__">+ Nueva subcarpeta personalizada...</option>
            </select>

            {targetFolder === '__custom__' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva subcarpeta..."
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  className="w-full bg-[#181b22] border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            )}
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
              isDragOver
                ? 'border-[#c5a059] bg-[#c5a059]/10'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-sm">{selectedFile.name}</p>
                  <p className="text-[11px] text-zinc-400">{formatFileSize(selectedFile.size)}</p>
                </div>
                <span className="text-[10px] text-[#c5a059] font-medium underline mt-1">
                  Hacer clic para seleccionar otro archivo
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    Arrastra tu archivo aquí o haz clic para explorar
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Admite PDF, imágenes JPG/PNG o cualquier formato documental
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:from-[#d5b069] hover:to-[#ebc67f] text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Subir al Explorador</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
