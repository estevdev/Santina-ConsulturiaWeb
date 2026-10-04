'use client';

import React from 'react';
import {
  Sparkles,
  ScanLine,
  UserCheck,
  KeyRound,
  Camera,
  Check,
} from 'lucide-react';
import { Cliente, TramiteRetiroDesempleo, TramiteMejoravit, TramiteAltaMedicaImss } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { ChecklistRow } from './ChecklistRow';
import { DocPresetsSection } from './DocPresetsSection';

export interface ClienteTramitesState {
  retiro?: TramiteRetiroDesempleo[];
  mejoravit?: TramiteMejoravit[];
  altaMedica?: TramiteAltaMedicaImss[];
}

interface TramitesChecklistProps {
  loadingTramites: boolean;
  clienteTramites: ClienteTramitesState;
  selectedCliente: Cliente | null;
  currentUserRole?: string;
  uploadingDocKey: string | null;
  generatingAmpliada200: boolean;
  docPresets: Preset[];
  onViewDoc: (url: string, title: string) => void;
  onDownloadDoc: (url: string, title: string) => void;
  onUploadReqDocument: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, file: File) => Promise<void>;
  onGenerateIneAmpliada200: (trId: string, reqIneNormalUrl?: string | null) => Promise<void>;
  onOpenManualIneCropper: (tramiteId: string, imageUrl: string) => Promise<void>;
  onOpenReferenciasModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onOpenInfonavitCredsModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onOpenInmuebleFotosModal: (tramiteId: string, tr: TramiteMejoravit) => void;
  onGenerateClientDocLink: (preset: Preset, tramiteType: string) => Promise<void>;
  onRemoveDocPreset: (preset: Preset, docKey: string) => Promise<void>;
  onToggleRequirement?: (tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica', tramiteId: string, reqKey: string, currentValue: boolean) => Promise<void>;
  togglingReqKey?: string | null;
}

export function TramitesChecklist({
  loadingTramites,
  clienteTramites,
  selectedCliente,
  currentUserRole,
  uploadingDocKey,
  generatingAmpliada200,
  docPresets,
  onViewDoc,
  onDownloadDoc,
  onUploadReqDocument,
  onGenerateIneAmpliada200,
  onOpenManualIneCropper,
  onOpenReferenciasModal,
  onOpenInfonavitCredsModal,
  onOpenInmuebleFotosModal,
  onGenerateClientDocLink,
  onRemoveDocPreset,
  onToggleRequirement,
  togglingReqKey,
}: TramitesChecklistProps) {
  const isAdmin = currentUserRole === 'admin';
  if (loadingTramites) {
    return (
      <div className="flex items-center justify-center p-4 text-xs text-slate-400">
        <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin mr-2" />
        Cargando expediente...
      </div>
    );
  }

  const hasTramites =
    (clienteTramites.retiro && clienteTramites.retiro.length > 0) ||
    (clienteTramites.mejoravit && clienteTramites.mejoravit.length > 0) ||
    (clienteTramites.altaMedica && clienteTramites.altaMedica.length > 0);

  if (!hasTramites) {
    return (
      <div className="p-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 text-xs">
        Este cliente aún no cuenta con trámites registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. RETIRO POR DESEMPLEO */}
      {clienteTramites.retiro && clienteTramites.retiro.length > 0 && (
        clienteTramites.retiro.map((tr) => (
          <div key={tr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <img src="/tramite-desempleo.png" alt="AforeMóvil Logo" className="w-6 h-6 object-contain rounded" />
                <span className="font-bold text-xs text-white">
                  Retiro por Desempleo (AforeMóvil)
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30 uppercase font-bold tracking-wider">
                {tr.estado}
              </span>
            </div>

            {/* Datos Compactos */}
            <div className="flex items-center justify-between gap-2 text-[11px] bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-800/80">
              <div>
                <span className="text-zinc-400 font-medium mr-1">Semanas:</span>
                <span className="font-semibold text-zinc-200">{tr.semanas_cotizadas || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-medium mr-1">Salario:</span>
                <span className="font-semibold text-zinc-200">${tr.ultimo_salario_registrado || '0.00'}</span>
              </div>
              <div>
                <span className={`font-semibold text-[10px] ${tr.validado_inactivo_imss ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {tr.validado_inactivo_imss ? '✓ Inactivo IMSS' : '⏳ Pendiente IMSS'}
                </span>
              </div>
            </div>

            {/* Grid 2 Columnas para Requisitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_ine_vigente"
                label="INE Vigente"
                isCompleted={tr.req_ine_vigente}
                existingDocUrl={tr.documentos_urls?.req_ine_vigente || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url}
                isUploading={uploadingDocKey === `${tr.id}_req_ine_vigente`}
                isToggling={togglingReqKey === `${tr.id}_req_ine_vigente`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_app_aforemovil_instalada"
                label="App AforeMóvil"
                isCompleted={tr.req_app_aforemovil_instalada}
                existingDocUrl={tr.documentos_urls?.req_app_aforemovil_instalada}
                isUploading={uploadingDocKey === `${tr.id}_req_app_aforemovil_instalada`}
                isToggling={togglingReqKey === `${tr.id}_req_app_aforemovil_instalada`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_comprobante_domicilio"
                label="Comp. Domicilio"
                isCompleted={tr.req_comprobante_domicilio}
                existingDocUrl={tr.documentos_urls?.req_comprobante_domicilio}
                isUploading={uploadingDocKey === `${tr.id}_req_comprobante_domicilio`}
                isToggling={togglingReqKey === `${tr.id}_req_comprobante_domicilio`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_registro_aforemovil_realizado"
                label="Registro AforeMóvil"
                isCompleted={tr.req_registro_aforemovil_realizado}
                existingDocUrl={tr.documentos_urls?.req_registro_aforemovil_realizado}
                isUploading={uploadingDocKey === `${tr.id}_req_registro_aforemovil_realizado`}
                isToggling={togglingReqKey === `${tr.id}_req_registro_aforemovil_realizado`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_curp"
                label="CURP Certificada"
                isCompleted={tr.req_curp}
                existingDocUrl={tr.documentos_urls?.req_curp || selectedCliente?.curp_document_url}
                isUploading={uploadingDocKey === `${tr.id}_req_curp`}
                isToggling={togglingReqKey === `${tr.id}_req_curp`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_saldo_visible_aforemovil"
                label="Saldo AforeMóvil"
                isCompleted={tr.req_saldo_visible_aforemovil}
                existingDocUrl={tr.documentos_urls?.req_saldo_visible_aforemovil}
                isUploading={uploadingDocKey === `${tr.id}_req_saldo_visible_aforemovil`}
                isToggling={togglingReqKey === `${tr.id}_req_saldo_visible_aforemovil`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_constancia_situacion_fiscal"
                label="Situación Fiscal (SAT)"
                isCompleted={tr.req_constancia_situacion_fiscal}
                existingDocUrl={tr.documentos_urls?.req_constancia_situacion_fiscal}
                isUploading={uploadingDocKey === `${tr.id}_req_constancia_situacion_fiscal`}
                isToggling={togglingReqKey === `${tr.id}_req_constancia_situacion_fiscal`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_anexo_sindo"
                label="Anexo SINDO"
                isCompleted={tr.req_anexo_sindo}
                existingDocUrl={tr.documentos_urls?.req_anexo_sindo}
                isUploading={uploadingDocKey === `${tr.id}_req_anexo_sindo`}
                isToggling={togglingReqKey === `${tr.id}_req_anexo_sindo`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="retiro"
                tramiteId={tr.id}
                reqKey="req_reporte_semanas_imss"
                label="Reporte Semanas IMSS"
                isCompleted={tr.req_reporte_semanas_imss}
                existingDocUrl={tr.documentos_urls?.req_reporte_semanas_imss}
                isUploading={uploadingDocKey === `${tr.id}_req_reporte_semanas_imss`}
                isToggling={togglingReqKey === `${tr.id}_req_reporte_semanas_imss`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
            </div>

            <DocPresetsSection
              tramiteType="retiro_desempleo"
              docPresets={docPresets}
              selectedCliente={selectedCliente}
              isAdmin={isAdmin}
              onGenerateLink={onGenerateClientDocLink}
              onRemoveDoc={onRemoveDocPreset}
              onViewDoc={onViewDoc}
            />
          </div>
        ))
      )}

      {/* 2. MEJORAVIT INFONAVIT */}
      {clienteTramites.mejoravit && clienteTramites.mejoravit.length > 0 && (
        clienteTramites.mejoravit.map((tr) => {
          const normalIneUrl = tr.documentos_urls?.req_ine_normal || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url;
          const btnGetIne200 = normalIneUrl && isAdmin ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onGenerateIneAmpliada200(tr.id, normalIneUrl)}
                disabled={generatingAmpliada200}
                title="Detectar mapa de calor y generar ampliada al 200% desde la INE Normal"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingAmpliada200 ? (
                  <div className="w-3 h-3 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#dfba73]" />
                )}
                <span>{generatingAmpliada200 ? 'Procesando...' : 'Generar 200%'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenManualIneCropper(tr.id, normalIneUrl)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg shadow-sm transition-all cursor-pointer"
                title="Marcar manualmente los 4 puntos de la frontal y trasera"
              >
                <ScanLine className="w-3 h-3" />
                <span>Manual</span>
              </button>
            </div>
          ) : null;

          const isInfonavitDone = Boolean(tr.req_portal_infonavit_validado || (tr.nss_portal_infonavit && tr.password_portal_infonavit));

          return (
            <div key={tr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <img src="/tramite-mejoravit.png" alt="Mejoravit Logo" className="w-6 h-6 object-contain rounded bg-white p-0.5" />
                  <span className="font-bold text-xs text-white">
                    Expediente Mejoravit (Infonavit)
                  </span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30 uppercase font-bold tracking-wider">
                  {tr.estado}
                </span>
              </div>

              {/* Grid 2 Columnas para 10 Requisitos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_ine_normal"
                  label="1. INE Normal"
                  isCompleted={tr.req_ine_normal}
                  existingDocUrl={tr.documentos_urls?.req_ine_normal || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url}
                  numberTag={1}
                  isUploading={uploadingDocKey === `${tr.id}_req_ine_normal`}
                  isToggling={togglingReqKey === `${tr.id}_req_ine_normal`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_estado_cuenta_bancario"
                  label="6. Edo. Cuenta Bancario"
                  isCompleted={tr.req_estado_cuenta_bancario}
                  existingDocUrl={tr.documentos_urls?.req_estado_cuenta_bancario}
                  numberTag={6}
                  isUploading={uploadingDocKey === `${tr.id}_req_estado_cuenta_bancario`}
                  isToggling={togglingReqKey === `${tr.id}_req_estado_cuenta_bancario`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_ine_ampliada_200"
                  label="2. INE Ampliada 200%"
                  isCompleted={tr.req_ine_ampliada_200}
                  existingDocUrl={tr.documentos_urls?.req_ine_ampliada_200}
                  numberTag={2}
                  extraAction={btnGetIne200}
                  isUploading={uploadingDocKey === `${tr.id}_req_ine_ampliada_200`}
                  isToggling={togglingReqKey === `${tr.id}_req_ine_ampliada_200`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_constancia_situacion_fiscal"
                  label="7. Situación Fiscal (SAT)"
                  isCompleted={tr.req_constancia_situacion_fiscal}
                  existingDocUrl={tr.documentos_urls?.req_constancia_situacion_fiscal}
                  numberTag={7}
                  isUploading={uploadingDocKey === `${tr.id}_req_constancia_situacion_fiscal`}
                  isToggling={togglingReqKey === `${tr.id}_req_constancia_situacion_fiscal`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />
                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_curp_actualizada"
                  label="3. CURP Actualizada"
                  isCompleted={tr.req_curp_actualizada}
                  existingDocUrl={tr.documentos_urls?.req_curp_actualizada || selectedCliente?.curp_document_url}
                  numberTag={3}
                  isUploading={uploadingDocKey === `${tr.id}_req_curp_actualizada`}
                  isToggling={togglingReqKey === `${tr.id}_req_curp_actualizada`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />

                {/* 8. 3 Referencias Personales */}
                {(() => {
                  const isRefsDone = Boolean(
                    tr.req_3_referencias_personales ||
                    (tr.referencias_detalle && tr.referencias_detalle.filter((r) => r.nombre.trim()).length >= 3)
                  );
                  const isTogglingRef = togglingReqKey === `${tr.id}_req_3_referencias_personales`;
                  return (
                    <div
                      className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
                        isRefsDone
                          ? 'bg-zinc-900/90 border-[#c5a059]/30 text-white'
                          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div
                        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer select-none group/item"
                        onClick={() => {
                          if (onToggleRequirement && !isTogglingRef) {
                            onToggleRequirement('mejoravit', tr.id, 'req_3_referencias_personales', isRefsDone);
                          }
                        }}
                        title={
                          onToggleRequirement
                            ? isRefsDone
                              ? 'Requisito completado (clic para desmarcar)'
                              : 'Requisito pendiente (clic para marcar como completado)'
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleRequirement && !isTogglingRef) {
                              onToggleRequirement('mejoravit', tr.id, 'req_3_referencias_personales', isRefsDone);
                            }
                          }}
                          disabled={!onToggleRequirement || isTogglingRef}
                          title={
                            isRefsDone
                              ? 'Requisito completado (clic para desmarcar)'
                              : 'Requisito pendiente (clic para marcar como completado)'
                          }
                          className="flex items-center justify-center shrink-0 rounded-md transition-all gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span
                            className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 transition-colors ${
                              isRefsDone
                                ? 'bg-[#c5a059] text-zinc-950'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            8
                          </span>
                          {isTogglingRef ? (
                            <div className="w-3.5 h-3.5 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : isRefsDone ? (
                            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/30 group-hover/item:border-emerald-400 transition-all shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded bg-zinc-800/80 border border-zinc-600/80 flex items-center justify-center text-transparent group-hover/item:border-[#c5a059] group-hover/item:text-[#c5a059]/60 transition-all">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                        </button>
                        <span className={`font-semibold truncate leading-tight group-hover/item:text-white transition-colors ${
                          isRefsDone ? 'text-white' : 'text-zinc-300'
                        }`}>
                          8. 3 Referencias Personales
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenReferenciasModal(tr.id, tr)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
                            isRefsDone
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30'
                              : 'bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{isRefsDone ? 'Ver / Editar' : 'Ingresar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_acta_nacimiento"
                  label="4. Acta de Nacimiento"
                  isCompleted={tr.req_acta_nacimiento}
                  existingDocUrl={tr.documentos_urls?.req_acta_nacimiento}
                  numberTag={4}
                  isUploading={uploadingDocKey === `${tr.id}_req_acta_nacimiento`}
                  isToggling={togglingReqKey === `${tr.id}_req_acta_nacimiento`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />

                {/* 9. Credenciales Infonavit */}
                {(() => {
                  const isTogglingInf = togglingReqKey === `${tr.id}_req_portal_infonavit_validado`;
                  return (
                    <div
                      className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
                        isInfonavitDone
                          ? 'bg-zinc-900/90 border-[#c5a059]/30 text-white'
                          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div
                        className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer select-none group/item"
                        onClick={() => {
                          if (onToggleRequirement && !isTogglingInf) {
                            onToggleRequirement('mejoravit', tr.id, 'req_portal_infonavit_validado', isInfonavitDone);
                          }
                        }}
                        title={
                          onToggleRequirement
                            ? isInfonavitDone
                              ? 'Requisito completado (clic para desmarcar)'
                              : 'Requisito pendiente (clic para marcar como completado)'
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleRequirement && !isTogglingInf) {
                              onToggleRequirement('mejoravit', tr.id, 'req_portal_infonavit_validado', isInfonavitDone);
                            }
                          }}
                          disabled={!onToggleRequirement || isTogglingInf}
                          title={
                            isInfonavitDone
                              ? 'Requisito completado (clic para desmarcar)'
                              : 'Requisito pendiente (clic para marcar como completado)'
                          }
                          className="flex items-center justify-center shrink-0 rounded-md transition-all gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span
                            className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 transition-colors ${
                              isInfonavitDone
                                ? 'bg-[#c5a059] text-zinc-950'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            9
                          </span>
                          {isTogglingInf ? (
                            <div className="w-3.5 h-3.5 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : isInfonavitDone ? (
                            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/30 group-hover/item:border-emerald-400 transition-all shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded bg-zinc-800/80 border border-zinc-600/80 flex items-center justify-center text-transparent group-hover/item:border-[#c5a059] group-hover/item:text-[#c5a059]/60 transition-all">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                        </button>
                        <div className="flex flex-col truncate">
                          <span className={`font-semibold truncate leading-tight group-hover/item:text-white transition-colors ${
                            isInfonavitDone ? 'text-white' : 'text-zinc-300'
                          }`}>
                            9. Credenciales Infonavit
                          </span>
                          {(tr.nss_portal_infonavit || tr.password_portal_infonavit) && (
                            <span className="text-[10px] text-[#dfba73] font-mono">
                              NSS: {tr.nss_portal_infonavit || '---'} | Pass: ••••••••
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenInfonavitCredsModal(tr.id, tr)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
                          isInfonavitDone
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30'
                            : 'bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950'
                        }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{isInfonavitDone ? 'Ver / Editar' : 'Ingresar Datos'}</span>
                      </button>
                    </div>
                  );
                })()}

                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_comprobante_domicilio"
                  label="5. Comp. Domicilio"
                  isCompleted={tr.req_comprobante_domicilio}
                  existingDocUrl={tr.documentos_urls?.req_comprobante_domicilio}
                  numberTag={5}
                  isUploading={uploadingDocKey === `${tr.id}_req_comprobante_domicilio`}
                  isToggling={togglingReqKey === `${tr.id}_req_comprobante_domicilio`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />

                <ChecklistRow
                  tramiteTipo="mejoravit"
                  tramiteId={tr.id}
                  reqKey="req_fotos_inmueble_5"
                  label="10. Fotos Inmueble (5)"
                  isCompleted={tr.req_fotos_inmueble_5}
                  existingDocUrl={tr.documentos_urls?.req_fotos_inmueble_5}
                  numberTag={10}
                  extraAction={
                    isAdmin ? (
                      <button
                        type="button"
                        onClick={() => onOpenInmuebleFotosModal(tr.id, tr)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-[#dfba73] border border-[#c5a059]/30 rounded-lg shadow-sm transition-all cursor-pointer mr-1"
                        title="Subir y ordenar hasta 5 fotos para generar el PDF automáticamente"
                      >
                        <Camera className="w-3 h-3 text-[#c5a059]" />
                        <span>{tr.documentos_urls?.req_fotos_inmueble_5 ? 'Editar 5 Fotos' : 'Subir 5 Fotos'}</span>
                      </button>
                    ) : null
                  }
                  isUploading={uploadingDocKey === `${tr.id}_req_fotos_inmueble_5`}
                  isToggling={togglingReqKey === `${tr.id}_req_fotos_inmueble_5`}
                  isAdmin={isAdmin}
                  onViewDoc={onViewDoc}
                  onDownloadDoc={onDownloadDoc}
                  onUploadFile={onUploadReqDocument}
                  onToggleCheck={onToggleRequirement}
                />
              </div>

              <DocPresetsSection
                tramiteType="mejoravit"
                docPresets={docPresets}
                selectedCliente={selectedCliente}
                isAdmin={isAdmin}
                onGenerateLink={onGenerateClientDocLink}
                onRemoveDoc={onRemoveDocPreset}
                onViewDoc={onViewDoc}
              />
            </div>
          );
        })
      )}

      {/* 3. ALTA MÉDICA IMSS */}
      {clienteTramites.altaMedica && clienteTramites.altaMedica.length > 0 && (
        clienteTramites.altaMedica.map((tr) => (
          <div key={tr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <img src="/tramite-imss.png" alt="IMSS Logo" className="w-6 h-6 object-contain rounded bg-white p-0.5" />
                <span className="font-bold text-xs text-white">
                  Alta Médica IMSS ({tr.clinica_umf_asignada || 'UMF'})
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30 uppercase font-bold tracking-wider">
                {tr.estado}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_curp_validada"
                label="CURP Validada"
                isCompleted={tr.req_curp_validada}
                existingDocUrl={tr.documentos_urls?.req_curp_validada || selectedCliente?.curp_document_url}
                isUploading={uploadingDocKey === `${tr.id}_req_curp_validada`}
                isToggling={togglingReqKey === `${tr.id}_req_curp_validada`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_comprobante_domicilio_reciente"
                label="Comp. Domicilio Reciente"
                isCompleted={tr.req_comprobante_domicilio_reciente}
                existingDocUrl={tr.documentos_urls?.req_comprobante_domicilio_reciente}
                isUploading={uploadingDocKey === `${tr.id}_req_comprobante_domicilio_reciente`}
                isToggling={togglingReqKey === `${tr.id}_req_comprobante_domicilio_reciente`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_identificacion_oficial"
                label="Identificación Oficial"
                isCompleted={tr.req_identificacion_oficial}
                existingDocUrl={tr.documentos_urls?.req_identificacion_oficial || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url}
                isUploading={uploadingDocKey === `${tr.id}_req_identificacion_oficial`}
                isToggling={togglingReqKey === `${tr.id}_req_identificacion_oficial`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_fotografia_infantil"
                label="Fotografía Infantil"
                isCompleted={tr.req_fotografia_infantil}
                existingDocUrl={tr.documentos_urls?.req_fotografia_infantil}
                isUploading={uploadingDocKey === `${tr.id}_req_fotografia_infantil`}
                isToggling={togglingReqKey === `${tr.id}_req_fotografia_infantil`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_cartilla_nacional_salud"
                label="Cartilla de Salud"
                isCompleted={tr.req_cartilla_nacional_salud}
                existingDocUrl={tr.documentos_urls?.req_cartilla_nacional_salud}
                isUploading={uploadingDocKey === `${tr.id}_req_cartilla_nacional_salud`}
                isToggling={togglingReqKey === `${tr.id}_req_cartilla_nacional_salud`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
              <ChecklistRow
                tramiteTipo="altaMedica"
                tramiteId={tr.id}
                reqKey="req_alta_patronal_vigente"
                label="Alta Patronal Vigente"
                isCompleted={tr.req_alta_patronal_vigente}
                existingDocUrl={tr.documentos_urls?.req_alta_patronal_vigente}
                isUploading={uploadingDocKey === `${tr.id}_req_alta_patronal_vigente`}
                isToggling={togglingReqKey === `${tr.id}_req_alta_patronal_vigente`}
                isAdmin={isAdmin}
                onViewDoc={onViewDoc}
                onDownloadDoc={onDownloadDoc}
                onUploadFile={onUploadReqDocument}
                onToggleCheck={onToggleRequirement}
              />
            </div>

            <DocPresetsSection
              tramiteType="alta_medica_imss"
              docPresets={docPresets}
              selectedCliente={selectedCliente}
              isAdmin={isAdmin}
              onGenerateLink={onGenerateClientDocLink}
              onRemoveDoc={onRemoveDocPreset}
              onViewDoc={onViewDoc}
            />
          </div>
        ))
      )}
    </div>
  );
}
