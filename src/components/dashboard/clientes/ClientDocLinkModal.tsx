'use client';

import React, { useState } from 'react';
import { X, Link2, Check, Copy, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  const [sendingWa, setSendingWa] = useState(false);

  if (!modalData.isOpen) return null;

  const handleSendWhatsAppLink = async () => {
    const phone = modalData.clientePhone?.replace(/\D/g, '');
    if (!phone) {
      toast.error('Cliente sin teléfono', {
        description: 'No hay un número registrado para enviar este enlace directamente por WhatsApp.',
      });
      return;
    }

    const msg = `Hola *${modalData.clienteNombre}*, tu asesor de *Santina Consultoría* te ha generado un enlace seguro para completar tu documento digital *${modalData.presetName}*:\n\n🔗 ${modalData.linkUrl}\n\n_Por favor ábrelo desde tu celular para verificar y completar tu información._`;

    try {
      setSendingWa(true);
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: phone,
          mensaje: msg,
          clienteNombre: modalData.clienteNombre,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar enlace por WhatsApp');
      }

      toast.success('¡Enlace enviado por WhatsApp oficial!', {
        description: `Se entregó a ${modalData.clienteNombre} (${phone}).`,
        duration: 5000,
      });
      onClose();
    } catch (err: any) {
      console.error('Error enviando enlace:', err);
      toast.warning('Aviso de WhatsApp', {
        description: err.message,
        duration: 7000,
      });
    } finally {
      setSendingWa(false);
    }
  };

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

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl text-xs flex items-center justify-between">
            <span className="text-purple-900 dark:text-purple-200 font-medium">
              Cliente: <strong>{modalData.clienteNombre}</strong>
              {modalData.clientePhone && (
                <span className="ml-2 text-zinc-400 font-mono text-[11px]">({modalData.clientePhone})</span>
              )}
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          {modalData.clientePhone && (
            <button
              type="button"
              disabled={sendingWa}
              onClick={handleSendWhatsAppLink}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Enviar directamente por WhatsApp Cloud API al teléfono del cliente"
            >
              {sendingWa ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              <span>{sendingWa ? 'Enviando...' : 'Enviar por WhatsApp (Oficial)'}</span>
            </button>
          )}

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
