'use client';

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  HelpCircle,
  X,
  Upload,
  FolderArchive,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

export type ModalNotificationType =
  | 'confirm'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'upload';

export interface ModalNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: React.ReactNode;
  description?: string;
  type?: ModalNotificationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  showCancel?: boolean;
  isLoading?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

export function ModalNotification({
  isOpen,
  onClose,
  title,
  message,
  description,
  type = 'confirm',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  showCancel = true,
  isLoading = false,
  badge,
  icon,
}: ModalNotificationProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Determinar icono y estilos según el tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          defaultIcon: <Trash2 className="w-6 h-6 text-rose-400" />,
          confirmBtn:
            'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 shadow-lg focus:ring-rose-500',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          defaultIcon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          confirmBtn:
            'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-amber-900/40 shadow-lg focus:ring-amber-500',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          defaultIcon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          confirmBtn:
            'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-emerald-900/40 shadow-lg focus:ring-emerald-500',
        };
      case 'info':
        return {
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
          badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          defaultIcon: <Info className="w-6 h-6 text-sky-400" />,
          confirmBtn:
            'bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold shadow-sky-900/40 shadow-lg focus:ring-sky-500',
        };
      case 'upload':
        return {
          iconBg: 'bg-[#c5a059]/15 border-[#c5a059]/30 text-[#dfba73]',
          badgeBg: 'bg-[#c5a059]/15 text-[#dfba73] border-[#c5a059]/30',
          defaultIcon: <Upload className="w-6 h-6 text-[#c5a059]" />,
          confirmBtn:
            'bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:from-[#aa8b48] hover:to-[#efca83] text-zinc-950 font-bold shadow-[#c5a059]/20 shadow-lg focus:ring-[#c5a059]',
        };
      case 'confirm':
      default:
        return {
          iconBg: 'bg-[#c5a059]/15 border-[#c5a059]/30 text-[#dfba73]',
          badgeBg: 'bg-[#c5a059]/15 text-[#dfba73] border-[#c5a059]/30',
          defaultIcon: <HelpCircle className="w-6 h-6 text-[#c5a059]" />,
          confirmBtn:
            'bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] hover:from-[#aa8b48] hover:to-[#efca83] text-zinc-950 font-bold shadow-[#c5a059]/20 shadow-lg focus:ring-[#c5a059]',
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirmClick = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0f1117] border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Cabecera / Banner */}
        <div className="p-5 pb-4 flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${config.iconBg}`}
          >
            {icon || config.defaultIcon}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {title}
              </h3>
              {badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeBg}`}
                >
                  {badge}
                </span>
              )}
            </div>

            {description && (
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Mensaje */}
        {message && (
          <div className="px-5 py-2 text-sm text-zinc-300 leading-relaxed font-normal">
            {typeof message === 'string' ? (
              <p className="whitespace-pre-line">{message}</p>
            ) : (
              message
            )}
          </div>
        )}

        {/* Acciones del Modal */}
        <div className="p-5 pt-4 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-end gap-2.5 mt-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/80 hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm ${config.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook de utilidad para manejar fácilmente confirmaciones y alertas
 */
export function useModalNotification() {
  const [modalState, setModalState] = React.useState<ModalNotificationProps | null>(null);

  const showConfirm = (options: {
    title: string;
    message?: React.ReactNode;
    description?: string;
    type?: ModalNotificationType;
    confirmText?: string;
    cancelText?: string;
    badge?: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    setModalState({
      isOpen: true,
      onClose: () => setModalState(null),
      title: options.title,
      message: options.message,
      description: options.description,
      type: options.type || 'confirm',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      badge: options.badge,
      showCancel: true,
      onConfirm: async () => {
        setModalState((prev) => (prev ? { ...prev, isLoading: true } : null));
        try {
          await options.onConfirm();
        } finally {
          setModalState(null);
        }
      },
    });
  };

  const showAlert = (options: {
    title: string;
    message?: React.ReactNode;
    description?: string;
    type?: ModalNotificationType;
    confirmText?: string;
  }) => {
    setModalState({
      isOpen: true,
      onClose: () => setModalState(null),
      title: options.title,
      message: options.message,
      description: options.description,
      type: options.type || 'info',
      confirmText: options.confirmText || 'Entendido',
      showCancel: false,
      onConfirm: () => setModalState(null),
    });
  };

  const closeModal = () => setModalState(null);

  return {
    modalState,
    showConfirm,
    showAlert,
    closeModal,
    ModalComponent: modalState ? <ModalNotification {...modalState} /> : null,
  };
}
