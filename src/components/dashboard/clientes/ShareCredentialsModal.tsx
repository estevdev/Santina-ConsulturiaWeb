'use client';

import React, { useState } from 'react';
import { X, Share2, Smartphone, Check, Copy, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { toast } from 'sonner';
import { formatFolio } from '@/utils/whatsapp';

export interface ShareCredentialsModalState {
  cliente: Cliente;
  folio: string;
  nss: string;
  tramiteNombre: string;
}

interface ShareCredentialsModalProps {
  modalData: ShareCredentialsModalState;
  onClose: () => void;
  copied: boolean;
  onCopy: () => void;
}

export function ShareCredentialsModal({
  modalData,
  onClose,
  copied,
  onCopy,
}: ShareCredentialsModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  const getFormattedShareText = (data: ShareCredentialsModalState) => {
    const cleanFolio = formatFolio(data.folio);
    const url = typeof window !== 'undefined' ? `${window.location.origin}/seguimiento?folio=${cleanFolio}` : `/seguimiento?folio=${cleanFolio}`;
    const nombreCliente = [data.cliente.nombre, data.cliente.apellido_paterno].filter(Boolean).join(' ') || 'Cliente';

    return `📋 *Consultoría Santina - Seguimiento de Trámite*\n\nEstimado(a) *${nombreCliente}*:\nPuedes consultar el avance de tu trámite (*${data.tramiteNombre}*) en tiempo real en nuestro portal web.\n\n🔗 *Enlace directo:*\n${url}\n\n📄 *Número de Folio:* ${cleanFolio}\n🔑 *Contraseña (NSS):* ${data.nss || 'No registrado'}\n\n_Haz clic en el enlace e ingresa tu contraseña para revisar la línea de tiempo de tus avances y recibir notificaciones instantáneas en tu dispositivo._`;
  };

  const shareText = getFormattedShareText(modalData);

  const handleSendOfficialWhatsApp = async () => {
    const phone = modalData.cliente.telefono?.replace(/\D/g, '');
    if (!phone) {
      toast.error('Cliente sin teléfono', {
        description: 'El cliente no tiene un número telefónico registrado para enviar WhatsApp.',
      });
      return;
    }

    try {
      setSendingWa(true);
      const res = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: phone,
          mensaje: shareText,
          clienteNombre: modalData.cliente.nombre,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar mensaje por WhatsApp Cloud API');
      }

      toast.success('¡WhatsApp enviado con éxito!', {
        description: `Se entregó el folio y enlace de seguimiento a ${modalData.cliente.nombre}.`,
        duration: 5000,
      });
      onClose();
    } catch (err: any) {
      console.error('Error enviando WhatsApp oficial:', err);
      toast.warning('Aviso de WhatsApp Cloud API', {
        description: err.message,
        duration: 7000,
      });
    } finally {
      setSendingWa(false);
    }
  };

  const handleOpenWebWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    const phone = (modalData.cliente.telefono || '').replace(/\D/g, '');
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d0e12] border border-[#c5a059]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5 border-b border-[#c5a059]/20 pb-4">
          <div className="p-3 bg-[#c5a059]/15 text-[#dfba73] rounded-2xl border border-[#c5a059]/30 shrink-0">
            <Share2 className="w-6 h-6 text-[#c5a059]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Compartir Acceso al Cliente</h3>
            <p className="text-xs text-zinc-400">Enlace directo y credenciales para seguimiento del proceso</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Recuadro de resumen de credenciales */}
          <div className="bg-[#13141d] p-4 rounded-2xl border border-[#c5a059]/25 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Cliente:</span>
              <span className="text-white font-bold">{modalData.cliente.nombre} {[modalData.cliente.apellido_paterno, modalData.cliente.apellido_materno].filter(Boolean).join(' ')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Trámite:</span>
              <span className="text-[#dfba73] font-bold">{modalData.tramiteNombre}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Número de Folio:</span>
              <span className="font-mono text-[#c5a059] font-bold bg-[#0d0e12] px-2.5 py-0.5 rounded border border-[#c5a059]/30">{formatFolio(modalData.folio)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Contraseña (NSS):</span>
              <span className="font-mono text-emerald-400 font-bold bg-[#0d0e12] px-2.5 py-0.5 rounded border border-emerald-500/30">{modalData.nss}</span>
            </div>
          </div>

          {/* Sección de mensaje para compartir */}
          <div className="bg-[#13141d] p-3.5 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-[#dfba73] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#c5a059]" />
                Copia las credenciales para compartir el mensaje
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] font-semibold text-[#c5a059] hover:text-[#dfba73] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                title="Ver u ocultar el texto del mensaje"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showPreview ? 'Ocultar mensaje' : 'Ver mensaje'}</span>
              </button>
            </div>

            {showPreview && (
              <textarea
                readOnly
                rows={5}
                value={shareText}
                className="w-full p-3 bg-[#0d0e12] text-xs font-mono text-zinc-300 rounded-xl border border-zinc-700/70 focus:outline-none resize-none animate-in fade-in duration-200 mt-2"
              />
            )}
          </div>

          {/* Botones de acción directos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={sendingWa}
              onClick={handleSendOfficialWhatsApp}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="Enviar directamente desde la API oficial de WhatsApp Cloud al cliente"
            >
              {sendingWa ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              <span>{sendingWa ? 'Enviando WhatsApp...' : 'Enviar por WhatsApp (Oficial)'}</span>
            </button>

            <button
              type="button"
              onClick={onCopy}
              className="py-3 px-4 bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-slate-950 hover:brightness-110 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Credenciales'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWebWhatsApp}
              className="py-1 px-2 text-[11px] text-zinc-400 hover:text-[#dfba73] flex items-center justify-center gap-1 cursor-pointer transition-colors sm:col-span-2"
              title="Abrir en WhatsApp Web para chatear manualmente"
            >
              <ExternalLink className="w-3 h-3" />
              <span>O abrir manualmente en WhatsApp Web / Móvil</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/seguimiento?folio=${modalData.folio}`;
                  navigator.share({
                    title: 'Seguimiento de Trámite - Consultoría Santina',
                    text: shareText,
                    url,
                  }).catch(() => {});
                }}
                className="sm:col-span-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#c5a059]" />
                <span>Compartir con otras aplicaciones (Móvil)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
