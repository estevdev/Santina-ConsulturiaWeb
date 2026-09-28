'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Cliente,
  TipoTramite,
  TramiteMejoravit,
} from '@/types/cliente';
import { Preset } from '@/types/preset';
import { parseIneOcrText, generateIneAmpliada200File } from '@/utils/ineOcrParser';
import { generateInmuebleFotosPdf } from '@/utils/inmuebleFotosPdfGenerator';
import { useAuth } from '@/context/AuthContext';
import { mergePdfAndImageUrls } from '@/utils/pdfMerger';
import { Users, Plus, ShieldCheck, User, Upload } from 'lucide-react';

import {
  ClientesList,
  ClienteQuickView,
  ClienteFullDetails,
  ClienteSeguimientoTimeline,
  ClienteMobileModal,
  TramitesChecklist,
  ClienteFormModal,
  InmuebleFotosModal,
  ManualIneCropModal,
  InfonavitCredsModal,
  ReferenciasModal,
  ShareCredentialsModal,
  DownloadExpedienteModal,
  PreviewPdfModal,
  DocumentViewerModal,
  ClientDocLinkModal,
  FormClienteData,
  FormRetiroData,
  FormMejoravitData,
  FormAltaMedicaData,
  InmuebleFotosModalState,
  ManualIneCropModalState,
  InfonavitCredsModalState,
  ReferenciasModalState,
  ShareCredentialsModalState,
  PreviewPdfModalState,
  DocumentViewerModalState,
  ClientDocLinkModalState,
  ClienteTramitesState,
} from '@/components/dashboard/clientes';

export default function ClientesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isModoSeguimiento, setIsModoSeguimiento] = useState(true);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('todos');
  const [clientesTramitesMap, setClientesTramitesMap] = useState<Record<string, string[]>>({});

  // Form State Cliente
  const [formCliente, setFormCliente] = useState<FormClienteData>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    email: '',
    estado: 'Jalisco',
    estado_cliente: 'interesado',
    notas: '',
  });

  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const [isEstadoDropdownOpen, setIsEstadoDropdownOpen] = useState(false);

  // Modales
  const [inmuebleFotosModal, setInmuebleFotosModal] = useState<InmuebleFotosModalState | null>(null);
  const [savingFotosPdf, setSavingFotosPdf] = useState(false);

  const [manualIneCropModal, setManualIneCropModal] = useState<ManualIneCropModalState | null>(null);
  const [processingManualCrop, setProcessingManualCrop] = useState(false);

  const [infonavitCredsModal, setInfonavitCredsModal] = useState<InfonavitCredsModalState | null>(null);
  const [savingInfonavitCreds, setSavingInfonavitCreds] = useState(false);

  const [referenciasModal, setReferenciasModal] = useState<ReferenciasModalState | null>(null);
  const [savingReferencias, setSavingReferencias] = useState(false);

  const [shareModalCliente, setShareModalCliente] = useState<ShareCredentialsModalState | null>(null);
  const [copiedShareMsg, setCopiedShareMsg] = useState(false);

  const [clienteTramites, setClienteTramites] = useState<ClienteTramitesState>({});
  const [loadingTramites, setLoadingTramites] = useState(false);

  const [crearTramiteInicial, setCrearTramiteInicial] = useState(false);
  const [tipoTramiteInicial, setTipoTramiteInicial] = useState<TipoTramite>('retiro_desempleo');

  // Form Retiro por Desempleo
  const [formRetiro, setFormRetiro] = useState<FormRetiroData>({
    semanas_cotizadas: '',
    ultimo_salario_registrado: '',
    validado_inactivo_imss: false,
    req_ine_vigente: false,
    req_comprobante_domicilio: false,
    req_curp: false,
    req_constancia_situacion_fiscal: false,
    req_reporte_semanas_imss: false,
    req_app_aforemovil_instalada: false,
    req_registro_aforemovil_realizado: false,
    req_saldo_visible_aforemovil: false,
    req_tiene_semanas_descontadas: false,
    req_anexo_sindo: false,
    observaciones: '',
  });

  // Form Mejoravit
  const [formMejoravit, setFormMejoravit] = useState<FormMejoravitData>({
    req_ine_normal: false,
    req_ine_ampliada_200: false,
    req_curp_actualizada: false,
    req_acta_nacimiento: false,
    req_comprobante_domicilio: false,
    comprobante_familiar_anexo_acta: false,
    req_estado_cuenta_bancario: false,
    req_constancia_situacion_fiscal: false,
    req_3_referencias_personales: false,
    nss_portal_infonavit: '',
    password_portal_infonavit: '',
    req_portal_infonavit_validado: false,
    req_fotos_inmueble_5: false,
    observaciones: '',
  });

  // Form Alta Médica IMSS
  const [formAltaMedica, setFormAltaMedica] = useState<FormAltaMedicaData>({
    clinica_umf_asignada: '',
    turno_preferido: 'Matutino',
    codigo_postal_clinica: '',
    modalidad_aseguramiento: 'Modalidad 10 (Trabajador)',
    req_curp_validada: false,
    req_comprobante_domicilio_reciente: false,
    req_identificacion_oficial: false,
    req_fotografia_infantil: false,
    req_cartilla_nacional_salud: false,
    req_alta_patronal_vigente: false,
    observaciones: '',
  });

  const [saving, setSaving] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [downloadExpedienteModalOpen, setDownloadExpedienteModalOpen] = useState(false);
  const [previewPdfModal, setPreviewPdfModal] = useState<PreviewPdfModalState | null>(null);

  const [localNetworkIp, setLocalNetworkIp] = useState<string>('');
  const [docPresets, setDocPresets] = useState<Preset[]>([]);
  const [clientDocModal, setClientDocModal] = useState<ClientDocLinkModalState | null>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [modalViewerDoc, setModalViewerDoc] = useState<DocumentViewerModalState | null>(null);
  const [generatingAmpliada200, setGeneratingAmpliada200] = useState<boolean>(false);
  const [downloadingBundle, setDownloadingBundle] = useState<'oficiales' | 'contratos' | 'ambos' | null>(null);

  useEffect(() => {
    async function loadDocPresets() {
      try {
        const { data } = await supabase
          .from('pdf_presets')
          .select('*')
          .eq('preset_type', 'client_document');
        if (data) {
          setDocPresets(
            data.map((r: any) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              presetType: r.preset_type,
              targetTramiteType: r.target_tramite_type,
              samplePdfUrl: r.sample_pdf_url,
              identifierKeywords: r.identifier_keywords || [],
              zones: r.zones || [],
              createdAt: r.created_at || Date.now(),
              updatedAt: r.updated_at || Date.now(),
            }))
          );
        }
      } catch (e) {
        console.error('Error cargando doc presets:', e);
      }
    }
    loadDocPresets();
  }, []);

  useEffect(() => {
    fetch('/api/system/local-ip')
      .then((r) => r.json())
      .then((d) => {
        if (d.localIp && d.localIp !== 'localhost') {
          setLocalNetworkIp(d.localIp);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [user]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      let query = supabase.from('clientes').select('*');

      if (user && user.role !== 'admin') {
        const conditions: string[] = [];
        if (user.id) conditions.push(`creado_por.eq.${user.id}`);
        if (user.email) conditions.push(`creado_por_email.eq.${user.email}`);
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      const [clientesRes, retiroRes, mejoravitRes, altaMedicaRes] = await Promise.all([
        query.order('created_at', { ascending: false }),
        supabase.from('tramites_retiro_desempleo').select('id, cliente_id'),
        supabase.from('tramites_mejoravit').select('id, cliente_id'),
        supabase.from('tramites_alta_medica_imss').select('id, cliente_id'),
      ]);

      if (clientesRes.error) {
        console.warn('Error fetching clientes:', clientesRes.error.message);
      } else if (clientesRes.data) {
        setClientes(clientesRes.data);
      }

      const tMap: Record<string, string[]> = {};
      (retiroRes.data || []).forEach((t: any) => {
        if (t.cliente_id) {
          if (!tMap[t.cliente_id]) tMap[t.cliente_id] = [];
          if (!tMap[t.cliente_id].includes('retiro_desempleo')) tMap[t.cliente_id].push('retiro_desempleo');
        }
      });
      (mejoravitRes.data || []).forEach((t: any) => {
        if (t.cliente_id) {
          if (!tMap[t.cliente_id]) tMap[t.cliente_id] = [];
          if (!tMap[t.cliente_id].includes('mejoravit')) tMap[t.cliente_id].push('mejoravit');
        }
      });
      (altaMedicaRes.data || []).forEach((t: any) => {
        if (t.cliente_id) {
          if (!tMap[t.cliente_id]) tMap[t.cliente_id] = [];
          if (!tMap[t.cliente_id].includes('alta_medica')) tMap[t.cliente_id].push('alta_medica');
        }
      });
      setClientesTramitesMap(tMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTramites = async (clienteId: string) => {
    setLoadingTramites(true);
    try {
      const [retiroRes, mejoravitRes, altaMedicaRes] = await Promise.all([
        supabase.from('tramites_retiro_desempleo').select('*').eq('cliente_id', clienteId),
        supabase.from('tramites_mejoravit').select('*').eq('cliente_id', clienteId),
        supabase.from('tramites_alta_medica_imss').select('*').eq('cliente_id', clienteId),
      ]);

      setClienteTramites({
        retiro: retiroRes.data || [],
        mejoravit: mejoravitRes.data || [],
        altaMedica: altaMedicaRes.data || [],
      });
    } catch (e) {
      console.error('Error fetching tramites:', e);
    } finally {
      setLoadingTramites(false);
    }
  };

  const handleSelectCliente = async (cliente: Cliente, openDetails: boolean = false) => {
    setSelectedCliente(cliente);
    setShowFullDetails(openDetails);
    setIsModoSeguimiento(true);
    setIsMobileModalOpen(true);
    await fetchTramites(cliente.id);
  };

  const openShareCredentialsModal = (cli: Cliente) => {
    const trRetiro = clienteTramites.retiro?.[0];
    const trMejoravit = clienteTramites.mejoravit?.[0];
    const trAltaMedica = clienteTramites.altaMedica?.[0];
    const tr = trRetiro || trMejoravit || trAltaMedica;
    const folioCode = tr ? tr.id.substring(0, 8).toUpperCase() : (cli.id || '').substring(0, 8).toUpperCase();
    const tramiteNombre = trRetiro
      ? 'Retiro por Desempleo AFORE'
      : trMejoravit
      ? 'Crédito Mejoravit Infonavit'
      : trAltaMedica
      ? 'Alta Médica IMSS'
      : 'Trámite General';
    const nssVal = cli.nss || trMejoravit?.nss_portal_infonavit || 'No registrado';

    setShareModalCliente({
      cliente: cli,
      folio: folioCode,
      nss: nssVal,
      tramiteNombre,
    });
  };

  const handleEditCliente = (cli: Cliente) => {
    setEditingClienteId(cli.id);
    setFormCliente({
      nombre: cli.nombre || '',
      apellido_paterno: cli.apellido_paterno || '',
      apellido_materno: cli.apellido_materno || '',
      telefono: cli.telefono || '',
      email: cli.email || '',
      estado: cli.estado || 'Jalisco',
      estado_cliente: cli.estado_cliente || 'interesado',
      notas: cli.notas || '',
    });
    setCrearTramiteInicial(false);
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleUpdateEstadoCliente = async (clienteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ estado_cliente: newStatus })
        .eq('id', clienteId);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) => (c.id === clienteId ? { ...c, estado_cliente: newStatus as any } : c))
      );

      if (selectedCliente && selectedCliente.id === clienteId) {
        setSelectedCliente((prev) => (prev ? { ...prev, estado_cliente: newStatus as any } : null));
      }

      setFeedbackMsg({ type: 'success', text: `Estado del cliente actualizado a "${newStatus}".` });
    } catch (err: any) {
      console.error('Error actualizando estado del cliente:', err);
      setFeedbackMsg({ type: 'error', text: `Error al actualizar estado: ${err.message || 'Error desconocido'}` });
    }
  };

  const handleSoftDeleteCliente = async (cliente: Cliente) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden enviar clientes a la papelera.');
      return;
    }
    const confirmed = window.confirm(
      `¿Estás seguro de enviar a "${cliente.nombre} ${cliente.apellido_paterno || ''}" a la papelera de reciclaje?\nPodrás restaurarlo o eliminarlo permanentemente después.`
    );
    if (!confirmed) return;

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('clientes')
        .update({ deleted_at: nowIso })
        .eq('id', cliente.id);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, deleted_at: nowIso } : c))
      );

      if (selectedCliente?.id === cliente.id) {
        setSelectedCliente(null);
        setShowFullDetails(false);
      }

      setFeedbackMsg({
        type: 'success',
        text: `El cliente "${cliente.nombre}" ha sido movido a la papelera.`,
      });
    } catch (err: any) {
      console.error('Error al enviar cliente a la papelera:', err);
      setFeedbackMsg({ type: 'error', text: `Error al mover a papelera: ${err.message || 'Error desconocido'}` });
    }
  };

  const handleRestoreCliente = async (cliente: Cliente) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden restaurar clientes.');
      return;
    }
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ deleted_at: null })
        .eq('id', cliente.id);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, deleted_at: null } : c))
      );

      if (selectedCliente?.id === cliente.id) {
        setSelectedCliente((prev) => (prev ? { ...prev, deleted_at: null } : null));
      }

      setFeedbackMsg({
        type: 'success',
        text: `El cliente "${cliente.nombre}" ha sido restaurado exitosamente.`,
      });
    } catch (err: any) {
      console.error('Error al restaurar cliente:', err);
      setFeedbackMsg({ type: 'error', text: `Error al restaurar: ${err.message || 'Error desconocido'}` });
    }
  };

  const handlePermanentDeleteCliente = async (cliente: Cliente) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden eliminar clientes definitivamente.');
      return;
    }
    const confirmed = window.confirm(
      `⚠️ ¡ADVERTENCIA DE ELIMINACIÓN PERMANENTE!\n\n¿Estás completamente seguro de borrar a "${cliente.nombre} ${cliente.apellido_paterno || ''}" y todos sus trámites y expedientes?\n\nEsta acción NO se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await Promise.all([
        supabase.from('tramites_retiro_desempleo').delete().eq('cliente_id', cliente.id),
        supabase.from('tramites_mejoravit').delete().eq('cliente_id', cliente.id),
        supabase.from('tramites_alta_medica_imss').delete().eq('cliente_id', cliente.id),
      ]);

      const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
      if (error) throw error;

      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));

      if (selectedCliente?.id === cliente.id) {
        setSelectedCliente(null);
        setShowFullDetails(false);
      }

      setFeedbackMsg({
        type: 'success',
        text: `El cliente "${cliente.nombre}" ha sido eliminado permanentemente de la base de datos.`,
      });
    } catch (err: any) {
      console.error('Error al borrar permanentemente:', err);
      setFeedbackMsg({ type: 'error', text: `Error al eliminar cliente: ${err.message || 'Error desconocido'}` });
    }
  };

  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg(null);

    const pat = formCliente.apellido_paterno.trim();
    const mat = formCliente.apellido_materno.trim();

    if (!pat && !mat) {
      setFeedbackMsg({ type: 'error', text: 'Debes ingresar al menos un apellido (paterno o materno).' });
      setSaving(false);
      return;
    }

    const fullApellidos = [pat, mat].filter(Boolean).join(' ');

    try {
      if (editingClienteId) {
        const { data: updatedData, error: updateErr } = await supabase
          .from('clientes')
          .update({
            nombre: formCliente.nombre.trim(),
            apellido_paterno: pat || null,
            apellido_materno: mat || null,
            apellidos: fullApellidos,
            telefono: formCliente.telefono.trim() || null,
            email: formCliente.email.trim() || null,
            estado: formCliente.estado || 'Jalisco',
            estado_cliente: formCliente.estado_cliente || 'interesado',
            notas: formCliente.notas.trim() || null,
          })
          .eq('id', editingClienteId)
          .select()
          .single();

        if (updateErr) throw new Error(updateErr.message);

        setFeedbackMsg({ type: 'success', text: 'Información del cliente actualizada correctamente.' });
        if (selectedCliente && selectedCliente.id === editingClienteId && updatedData) {
          setSelectedCliente(updatedData);
        }
      } else {
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .insert([{
            nombre: formCliente.nombre.trim(),
            apellido_paterno: pat || null,
            apellido_materno: mat || null,
            apellidos: fullApellidos,
            telefono: formCliente.telefono.trim() || null,
            email: formCliente.email.trim() || null,
            estado: formCliente.estado || 'Jalisco',
            estado_cliente: formCliente.estado_cliente || 'interesado',
            notas: formCliente.notas.trim() || null,
            creado_por: user?.id || null,
            creado_por_nombre: user?.name || null,
            creado_por_email: user?.email || null,
          }])
          .select()
          .single();

        if (clienteError) {
          throw new Error(clienteError.message);
        }

        if (crearTramiteInicial && clienteData) {
          const clienteId = clienteData.id;

          if (tipoTramiteInicial === 'retiro_desempleo') {
            await supabase.from('tramites_retiro_desempleo').insert([{
              cliente_id: clienteId,
              semanas_cotizadas: formRetiro.semanas_cotizadas ? parseInt(formRetiro.semanas_cotizadas) : null,
              ultimo_salario_registrado: formRetiro.ultimo_salario_registrado ? parseFloat(formRetiro.ultimo_salario_registrado) : null,
              validado_inactivo_imss: formRetiro.validado_inactivo_imss,
              req_ine_vigente: formRetiro.req_ine_vigente,
              req_comprobante_domicilio: formRetiro.req_comprobante_domicilio,
              req_curp: formRetiro.req_curp,
              req_constancia_situacion_fiscal: formRetiro.req_constancia_situacion_fiscal,
              req_reporte_semanas_imss: formRetiro.req_reporte_semanas_imss,
              req_app_aforemovil_instalada: formRetiro.req_app_aforemovil_instalada,
              req_registro_aforemovil_realizado: formRetiro.req_registro_aforemovil_realizado,
              req_saldo_visible_aforemovil: formRetiro.req_saldo_visible_aforemovil,
              req_tiene_semanas_descontadas: formRetiro.req_tiene_semanas_descontadas,
              req_anexo_sindo: formRetiro.req_anexo_sindo,
              observaciones: formRetiro.observaciones || null,
            }]);
          } else if (tipoTramiteInicial === 'mejoravit') {
            await supabase.from('tramites_mejoravit').insert([{
              cliente_id: clienteId,
              req_ine_normal: formMejoravit.req_ine_normal,
              req_ine_ampliada_200: formMejoravit.req_ine_ampliada_200,
              req_curp_actualizada: formMejoravit.req_curp_actualizada,
              req_acta_nacimiento: formMejoravit.req_acta_nacimiento,
              req_comprobante_domicilio: formMejoravit.req_comprobante_domicilio,
              comprobante_familiar_anexo_acta: formMejoravit.comprobante_familiar_anexo_acta,
              req_estado_cuenta_bancario: formMejoravit.req_estado_cuenta_bancario,
              req_constancia_situacion_fiscal: formMejoravit.req_constancia_situacion_fiscal,
              req_3_referencias_personales: formMejoravit.req_3_referencias_personales,
              nss_portal_infonavit: formMejoravit.nss_portal_infonavit || null,
              password_portal_infonavit: formMejoravit.password_portal_infonavit || null,
              req_portal_infonavit_validado: formMejoravit.req_portal_infonavit_validado,
              req_fotos_inmueble_5: formMejoravit.req_fotos_inmueble_5,
              observaciones: formMejoravit.observaciones || null,
            }]);
          } else if (tipoTramiteInicial === 'alta_medica_imss') {
            await supabase.from('tramites_alta_medica_imss').insert([{
              cliente_id: clienteId,
              clinica_umf_asignada: formAltaMedica.clinica_umf_asignada || null,
              turno_preferido: formAltaMedica.turno_preferido,
              codigo_postal_clinica: formAltaMedica.codigo_postal_clinica || null,
              modalidad_aseguramiento: formAltaMedica.modalidad_aseguramiento,
              req_curp_validada: formAltaMedica.req_curp_validada,
              req_comprobante_domicilio_reciente: formAltaMedica.req_comprobante_domicilio_reciente,
              req_identificacion_oficial: formAltaMedica.req_identificacion_oficial,
              req_fotografia_infantil: formAltaMedica.req_fotografia_infantil,
              req_cartilla_nacional_salud: formAltaMedica.req_cartilla_nacional_salud,
              req_alta_patronal_vigente: formAltaMedica.req_alta_patronal_vigente,
              observaciones: formAltaMedica.observaciones || null,
            }]);
          }
        }
        setFeedbackMsg({ type: 'success', text: 'Cliente registrado exitosamente.' });
      }

      setIsModalOpen(false);
      setEditingClienteId(null);
      setFormCliente({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        telefono: '',
        email: '',
        estado: 'Jalisco',
        notas: '',
      });
      fetchClientes();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al guardar cliente' });
    } finally {
      setSaving(false);
    }
  };

  const openManualIneCropper = async (tramiteId: string, imageUrl: string) => {
    let w = 1000;
    let h = 1400;

    try {
      if (imageUrl.toLowerCase().includes('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const resp = await fetch(imageUrl);
        const buffer = await resp.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const page = await doc.getPage(1);
        const vp = page.getViewport({ scale: 2.0 });
        w = vp.width;
        h = vp.height;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        w = img.naturalWidth || img.width || 1000;
        h = img.naturalHeight || img.height || 1400;
      }
    } catch {}

    const halfH = h / 2;
    const cardW = Math.round(w * 0.8);
    const cardH = Math.round(cardW / 1.585);
    const marginX = Math.round((w - cardW) / 2);

    const frenteY = Math.round((halfH - cardH) / 2);
    const defaultFrente = [
      { x: marginX, y: frenteY },
      { x: marginX + cardW, y: frenteY },
      { x: marginX + cardW, y: frenteY + cardH },
      { x: marginX, y: frenteY + cardH },
    ];

    const reversoY = Math.round(halfH + (halfH - cardH) / 2);
    const defaultReverso = [
      { x: marginX, y: reversoY },
      { x: marginX + cardW, y: reversoY },
      { x: marginX + cardW, y: reversoY + cardH },
      { x: marginX, y: reversoY + cardH },
    ];

    setManualIneCropModal({
      tramiteId,
      imageUrl,
      step: 'frente',
      frentePoints: defaultFrente,
      reversoPoints: defaultReverso,
    });
  };

  const handleDownloadInline = async (url: string, title: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = url.split('.').pop()?.split('?')[0] || 'pdf';
      link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getOficialesDocumentUrls = () => {
    if (!selectedCliente) return [];

    const trMejoravit = clienteTramites.mejoravit?.[0];
    const trRetiro = clienteTramites.retiro?.[0];
    const trAltaMedica = clienteTramites.altaMedica?.[0];

    const docs = {
      ...(trMejoravit?.documentos_urls || {}),
      ...(trRetiro?.documentos_urls || {}),
      ...(trAltaMedica?.documentos_urls || {}),
    };

    const items: { label: string; url: string }[] = [];

    const ineUrl = selectedCliente.ine_completa_url || docs.req_ine_normal || docs.req_ine_vigente || selectedCliente.ine_frente_url;
    if (ineUrl) items.push({ label: '1. INE', url: ineUrl });
    if (selectedCliente.ine_reverso_url && !selectedCliente.ine_completa_url && !docs.req_ine_normal) {
      items.push({ label: '1. INE Reverso', url: selectedCliente.ine_reverso_url });
    }

    const curpUrl = selectedCliente.curp_document_url || docs.req_curp_actualizada || docs.req_curp || docs.req_curp_validada;
    if (curpUrl) items.push({ label: '2. CURP', url: curpUrl });

    const actaUrl = docs.req_acta_nacimiento;
    if (actaUrl) items.push({ label: '3. Acta de Nacimiento', url: actaUrl });

    const edoCuentaUrl = docs.req_estado_cuenta_bancario;
    if (edoCuentaUrl) items.push({ label: '4. Estado de Cuenta Bancario', url: edoCuentaUrl });

    const rfcUrl = docs.req_constancia_situacion_fiscal;
    if (rfcUrl) items.push({ label: '5. RFC (Situación Fiscal SAT)', url: rfcUrl });

    const domicilioUrl = docs.req_comprobante_domicilio || docs.req_comprobante_domicilio_reciente;
    if (domicilioUrl) items.push({ label: '6. Comprobante de Domicilio', url: domicilioUrl });

    const fotosUrl = docs.req_fotos_inmueble_5;
    if (fotosUrl) items.push({ label: '7. Fotos de Inmueble', url: fotosUrl });

    return items;
  };

  const getContratosPresetsUrls = async () => {
    if (!selectedCliente) return [];

    const items: { label: string; url: string }[] = [];

    try {
      const { data: links } = await supabase
        .from('client_document_links')
        .select('*, pdf_presets(*)')
        .eq('cliente_id', selectedCliente.id);

      if (links && links.length > 0) {
        for (const link of links) {
          const pdfUrl = link.generated_pdf_url || link.pdf_presets?.sample_pdf_url;
          const presetName = link.pdf_presets?.name || 'Contrato / Formato Presupuesto';
          if (pdfUrl && !items.some((i) => i.url === pdfUrl)) {
            items.push({ label: presetName, url: pdfUrl });
          }
        }
      }
    } catch (e) {
      console.warn('Error obteniendo client_document_links:', e);
    }

    if (selectedCliente.documentos_urls) {
      for (const [key, val] of Object.entries(selectedCliente.documentos_urls)) {
        if (key.startsWith('doc_preset_') && typeof val === 'string' && val) {
          const presetId = key.replace('doc_preset_', '');
          const matchingPreset = docPresets.find((p) => p.id === presetId);
          const name = matchingPreset?.name || 'Formato / Carta Bajo Protesta';
          if (!items.some((i) => i.url === val)) {
            items.push({ label: name, url: val });
          }
        }
      }
    }

    for (const preset of docPresets) {
      if (preset.samplePdfUrl && !items.some((i) => i.label.toLowerCase().includes(preset.name.toLowerCase()) || i.url === preset.samplePdfUrl)) {
        items.push({ label: preset.name, url: preset.samplePdfUrl });
      }
    }

    return items;
  };

  const handlePreviewPdf = async (type: 'oficiales' | 'contratos') => {
    if (!selectedCliente) return;

    if (type === 'oficiales') {
      const items = getOficialesDocumentUrls();
      if (items.length === 0) {
        alert('Aún no se ha subido ningún documento oficial en este expediente (INE, CURP, Acta, Edo. Cuenta, RFC, Domicilio, Fotos).');
        return;
      }
      setDownloadingBundle('oficiales');
      setFeedbackMsg({ type: 'success', text: `Consolidando ${items.length} documentos oficiales para previsualización...` });
      try {
        const urls = items.map((i) => i.url);
        const pdfBytes = await mergePdfAndImageUrls(urls);
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewPdfModal({
          isOpen: true,
          title: `Previsualización - Documentos Oficiales (${selectedCliente.nombre || 'Cliente'})`,
          pdfBlobUrl: blobUrl,
        });
        setFeedbackMsg({ type: 'success', text: '¡Previsualización de Documentos Oficiales lista!' });
      } catch (err: any) {
        console.error('Error al previsualizar documentos oficiales:', err);
        setFeedbackMsg({ type: 'error', text: `Error al previsualizar: ${err.message || 'Error desconocido'}` });
      } finally {
        setDownloadingBundle(null);
      }
    } else {
      setDownloadingBundle('contratos');
      setFeedbackMsg({ type: 'success', text: 'Obteniendo contratos y formatos para previsualizar...' });
      try {
        const items = await getContratosPresetsUrls();
        if (items.length === 0) {
          alert('No se encontraron contratos o formatos presets en Supabase para este cliente.');
          setDownloadingBundle(null);
          return;
        }
        const urls = items.map((i) => i.url);
        const pdfBytes = await mergePdfAndImageUrls(urls);
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewPdfModal({
          isOpen: true,
          title: `Previsualización - Contratos y Formatos (${selectedCliente.nombre || 'Cliente'})`,
          pdfBlobUrl: blobUrl,
        });
        setFeedbackMsg({ type: 'success', text: '¡Previsualización de Contratos y Formatos lista!' });
      } catch (err: any) {
        console.error('Error al previsualizar contratos:', err);
        setFeedbackMsg({ type: 'error', text: `Error al previsualizar: ${err.message || 'Error desconocido'}` });
      } finally {
        setDownloadingBundle(null);
      }
    }
  };

  const handleDownloadOficialesPdf = async () => {
    if (!selectedCliente) return;
    const items = getOficialesDocumentUrls();
    if (items.length === 0) {
      alert('Aún no se ha subido ningún documento oficial en este expediente (INE, CURP, Acta, Edo. Cuenta, RFC, Domicilio, Fotos).');
      return;
    }

    setDownloadingBundle('oficiales');
    setFeedbackMsg({ type: 'success', text: `Consolidando ${items.length} documentos oficiales en 1 solo PDF...` });

    try {
      const urls = items.map((i) => i.url);
      const pdfBytes = await mergePdfAndImageUrls(urls);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanNombre = [selectedCliente.nombre, selectedCliente.apellido_paterno].filter(Boolean).join('_') || 'Cliente';
      link.href = blobUrl;
      link.download = `Documentos_Oficiales_${cleanNombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setFeedbackMsg({ type: 'success', text: '¡PDF de Documentos Oficiales descargado exitosamente!' });
    } catch (err: any) {
      console.error('Error al unificar documentos oficiales:', err);
      setFeedbackMsg({ type: 'error', text: `Error al unificar documentos oficiales: ${err.message || 'Error desconocido'}` });
    } finally {
      setDownloadingBundle(null);
    }
  };

  const handleDownloadContratosPdf = async () => {
    if (!selectedCliente) return;
    setDownloadingBundle('contratos');
    setFeedbackMsg({ type: 'success', text: 'Obteniendo contratos, cartas y formatos de Supabase para unificar...' });

    try {
      const items = await getContratosPresetsUrls();
      if (items.length === 0) {
        alert('No se encontraron contratos o formatos presets en Supabase para este cliente.');
        setDownloadingBundle(null);
        return;
      }

      const urls = items.map((i) => i.url);
      const pdfBytes = await mergePdfAndImageUrls(urls);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanNombre = [selectedCliente.nombre, selectedCliente.apellido_paterno].filter(Boolean).join('_') || 'Cliente';
      link.href = blobUrl;
      link.download = `Contratos_y_Formatos_${cleanNombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setFeedbackMsg({ type: 'success', text: '¡PDF de Contratos y Formatos (Presets) descargado exitosamente!' });
    } catch (err: any) {
      console.error('Error al unificar contratos:', err);
      setFeedbackMsg({ type: 'error', text: `Error al unificar contratos: ${err.message || 'Error desconocido'}` });
    } finally {
      setDownloadingBundle(null);
    }
  };

  const handleDownloadExpedienteCompleto = async () => {
    setDownloadingBundle('ambos');
    setFeedbackMsg({ type: 'success', text: 'Generando y descargando los 2 archivos PDF del expediente completo...' });
    await handleDownloadOficialesPdf();
    await handleDownloadContratosPdf();
    setDownloadingBundle(null);
  };

  const handleGenerateIneAmpliada200 = async (trId: string, reqIneNormalUrl?: string | null) => {
    const ineSourceUrl = reqIneNormalUrl || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url;
    if (!ineSourceUrl) {
      setFeedbackMsg({ type: 'error', text: 'Primero debes subir o escanear la INE Normal (requisito 1).' });
      return;
    }

    setGeneratingAmpliada200(true);
    setFeedbackMsg({ type: 'success', text: 'Detectando ambas caras con mapa de calor y generando INE Ampliada al 200%...' });

    try {
      const generatedFile = await generateIneAmpliada200File(ineSourceUrl);
      await handleUploadReqDocument('mejoravit', trId, 'req_ine_ampliada_200', generatedFile);
      setFeedbackMsg({ type: 'success', text: '¡INE Ampliada al 200% generada con mapa de calor y adjuntada exitosamente!' });
    } catch (err: any) {
      console.error('Error generando INE ampliada al 200%:', err);
      setFeedbackMsg({ type: 'error', text: `Error al generar INE ampliada: ${err.message || 'Error desconocido'}` });
    } finally {
      setGeneratingAmpliada200(false);
    }
  };

  const handleUploadReqDocument = async (
    tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica',
    tramiteId: string,
    reqKey: string,
    file: File
  ) => {
    if (!selectedCliente) return;
    setUploadingDocKey(`${tramiteId}_${reqKey}`);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${selectedCliente.id}/${tramiteTipo}/${tramiteId}/${reqKey}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('ine_documents')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('ine_documents')
        .getPublicUrl(filePath);

      let currentTramite: any = null;
      let table = '';
      if (tramiteTipo === 'retiro') {
        currentTramite = clienteTramites.retiro?.find((t) => t.id === tramiteId);
        table = 'tramites_retiro_desempleo';
      } else if (tramiteTipo === 'mejoravit') {
        currentTramite = clienteTramites.mejoravit?.find((t) => t.id === tramiteId);
        table = 'tramites_mejoravit';
      } else if (tramiteTipo === 'altaMedica') {
        currentTramite = clienteTramites.altaMedica?.find((t) => t.id === tramiteId);
        table = 'tramites_alta_medica_imss';
      }

      const currentDocs = currentTramite?.documentos_urls || {};
      const updatedDocs = { ...currentDocs, [reqKey]: publicUrl };

      const updatePayload: Record<string, any> = {
        [reqKey]: true,
        documentos_urls: updatedDocs,
      };

      const { error: updateErr } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', tramiteId);

      if (updateErr) throw updateErr;

      let ocrMessage = '';
      try {
        const { runOcrWithHeatmap } = await import('@/utils/ineOcrParser');
        const ocrRes = await runOcrWithHeatmap(file);
        const parsed = parseIneOcrText(ocrRes.frontText, ocrRes.backText);
        const fullText = (ocrRes.frontText + ' ' + ocrRes.backText).toUpperCase();

        let extractedCurp = parsed.curp;
        if (!extractedCurp) {
          const curpMatch = fullText.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
          if (curpMatch) {
            extractedCurp = curpMatch[0];
          }
        }

        let extractedRfc: string | null = null;
        const rfcContextMatch = fullText.match(/R\.?F\.?C\.?:?\s*([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})/);
        if (rfcContextMatch) {
          extractedRfc = rfcContextMatch[1];
        } else {
          const allRfcMatches = fullText.match(/[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}/g);
          if (allRfcMatches) {
            const validRfc = allRfcMatches.find((r) => !extractedCurp || !extractedCurp.startsWith(r.slice(0, 10)));
            extractedRfc = validRfc || allRfcMatches[0];
          }
        }

        const clientUpdates: Record<string, any> = {};
        if (extractedCurp) {
          clientUpdates.curp = extractedCurp;
          ocrMessage = `CURP: ${extractedCurp}`;
        }
        if (extractedRfc) {
          clientUpdates.rfc = extractedRfc;
          ocrMessage = ocrMessage ? `${ocrMessage} | RFC: ${extractedRfc}` : `RFC: ${extractedRfc}`;
        }
        if (parsed.nombre && (!selectedCliente.nombre || selectedCliente.nombre === 'Sin nombre')) {
          clientUpdates.nombre = parsed.nombre;
        }
        if (parsed.apellido_paterno && !selectedCliente.apellido_paterno) {
          clientUpdates.apellido_paterno = parsed.apellido_paterno;
        }
        if (parsed.apellido_materno && !selectedCliente.apellido_materno) {
          clientUpdates.apellido_materno = parsed.apellido_materno;
        }

        if (Object.keys(clientUpdates).length > 0) {
          const fullAps = [
            clientUpdates.apellido_paterno || selectedCliente.apellido_paterno,
            clientUpdates.apellido_materno || selectedCliente.apellido_materno,
          ].filter(Boolean).join(' ');
          if (fullAps) clientUpdates.apellidos = fullAps;

          const { data: updatedCli } = await supabase
            .from('clientes')
            .update(clientUpdates)
            .eq('id', selectedCliente.id)
            .select()
            .single();

          if (updatedCli) {
            setSelectedCliente(updatedCli);
            fetchClientes();
          }
        }
      } catch (ocrErr) {
        console.warn('Advertencia en OCR automático:', ocrErr);
      }

      setFeedbackMsg({
        type: 'success',
        text: `Documento subido correctamente. ${ocrMessage ? `✨ OCR detectó -> ${ocrMessage}` : ''}`,
      });

      await fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error uploading requirement document:', err);
      setFeedbackMsg({ type: 'error', text: `Error al subir el documento: ${err.message || 'Error desconocido'}` });
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleUploadCurpPdf = async (file: File) => {
    if (!selectedCliente) return;
    setFeedbackMsg({ type: 'success', text: 'Subiendo constancia original de RENAPO al Storage...' });
    try {
      const curpVal = selectedCliente.curp || 'RENAPO';
      const storagePath = `${selectedCliente.id}/curp_oficial_${curpVal}_${Date.now()}.pdf`;

      const { error: uploadErr } = await supabase.storage
        .from('ine_documents')
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('ine_documents')
        .getPublicUrl(storagePath);

      await supabase
        .from('clientes')
        .update({
          curp_document_url: publicUrl,
        })
        .eq('id', selectedCliente.id);

      await Promise.all([
        supabase.from('tramites_retiro_desempleo').update({ req_curp: true }).eq('cliente_id', selectedCliente.id),
        supabase.from('tramites_mejoravit').update({ req_curp_actualizada: true }).eq('cliente_id', selectedCliente.id),
        supabase.from('tramites_alta_medica_imss').update({ req_curp_validada: true }).eq('cliente_id', selectedCliente.id),
      ]);

      setSelectedCliente((prev) => prev ? { ...prev, curp_document_url: publicUrl } : null);
      setFeedbackMsg({ type: 'success', text: '¡Constancia original de RENAPO guardada y anexada al expediente!' });
      fetchClientes();
      fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error subiendo CURP PDF:', err);
      setFeedbackMsg({ type: 'error', text: `Error al subir: ${err.message}` });
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingPdf(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsDraggingPdf(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingPdf(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && selectedCliente) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          handleUploadCurpPdf(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [selectedCliente]);

  const handleGenerateClientDocLink = async (preset: Preset, tramiteType: string) => {
    if (!selectedCliente) return;

    try {
      const token = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { error } = await supabase.from('client_document_links').insert([
        {
          preset_id: preset.id,
          cliente_id: selectedCliente.id,
          tramite_type: tramiteType,
          token: token,
          status: 'pending',
        },
      ]);

      if (error) {
        console.error('Error guardando client_document_link:', error);
        alert('Error al generar enlace de documento para cliente.');
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      let linkUrl = `${origin}/llenar-documento/${token}`;
      if ((origin.includes('localhost') || origin.includes('127.0.0.1')) && localNetworkIp) {
        const port = window.location.port ? `:${window.location.port}` : '';
        linkUrl = `${window.location.protocol}//${localNetworkIp}${port}/llenar-documento/${token}`;
      }

      const fullNombre = [selectedCliente.nombre, selectedCliente.apellido_paterno, selectedCliente.apellido_materno]
        .filter(Boolean)
        .join(' ');

      setClientDocModal({
        isOpen: true,
        linkUrl,
        presetName: preset.name,
        token,
        clienteNombre: fullNombre || 'Cliente',
        clientePhone: selectedCliente.telefono || undefined,
        copied: false,
      });
    } catch (err: any) {
      console.error(err);
      alert('Error al generar link.');
    }
  };

  const handleRemoveDocPreset = async (preset: Preset, docKey: string) => {
    const confirmDelete = window.confirm(
      `⚠️ ATENCIÓN: El contrato "${preset.name}" ya fue completado por el cliente.\n\n` +
      `Si eliminas el documento del expediente, la versión anterior NO se borrará de la base de datos (quedará archivada como historial), pero podrás VOLVER A GENERAR un nuevo link para que el cliente lo rellene nuevamente.\n\n` +
      `¿Deseas continuar y habilitar la opción de nuevo link?`
    );

    if (confirmDelete && selectedCliente) {
      try {
        const currentDocs = { ...(selectedCliente.documentos_urls || {}) };
        delete currentDocs[docKey];

        const { error } = await supabase
          .from('clientes')
          .update({ documentos_urls: currentDocs })
          .eq('id', selectedCliente.id);

        if (error) throw error;

        setSelectedCliente({
          ...selectedCliente,
          documentos_urls: currentDocs,
        });

        setFeedbackMsg({
          type: 'success',
          text: `Se ha quitado "${preset.name}" del expediente. Ya puedes generar un nuevo link para el cliente.`,
        });
      } catch (err: any) {
        console.error('Error al quitar documento:', err);
        alert(`Error: ${err.message || 'No se pudo actualizar'}`);
      }
    }
  };

  // Handler para guardar credenciales rápidas de Infonavit desde Modo Seguimiento
  const handleSaveQuickCreds = async (nss: string, pass: string) => {
    if (!selectedCliente) return;
    try {
      const hasCreds = Boolean(nss.trim() && pass.trim());
      const trMejoravit = clienteTramites.mejoravit?.[0];

      // Actualizar cliente (NSS)
      await supabase
        .from('clientes')
        .update({ nss: nss.trim() })
        .eq('id', selectedCliente.id);

      // Actualizar trámite mejoravit si existe
      if (trMejoravit) {
        await supabase
          .from('tramites_mejoravit')
          .update({
            nss_portal_infonavit: nss.trim() || null,
            password_portal_infonavit: pass.trim() || null,
            req_portal_infonavit_validado: hasCreds,
          })
          .eq('id', trMejoravit.id);
      }

      setFeedbackMsg({
        type: 'success',
        text: '¡Credenciales de Mi Cuenta Infonavit guardadas correctamente!',
      });
      await fetchTramites(selectedCliente.id);
      setSelectedCliente((prev) => (prev ? { ...prev, nss: nss.trim() } : prev));
    } catch (err: any) {
      console.error('Error al guardar credenciales rápidas:', err);
      setFeedbackMsg({
        type: 'error',
        text: `Error al guardar credenciales: ${err.message || 'Error desconocido'}`,
      });
    }
  };

  // Handler para subir Tabla de Amortización
  const handleUploadTablaAmortizacion = async (file: File) => {
    if (!selectedCliente) return;
    setUploadingDocKey('tabla_amortizacion');
    setFeedbackMsg({ type: 'success', text: 'Subiendo archivo de Tabla de Amortización...' });
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `${selectedCliente.id}/tabla_amortizacion_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('ine_documents')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('ine_documents')
        .getPublicUrl(filePath);

      // Actualizar en cliente documentos_urls
      const currentClientDocs = { ...(selectedCliente.documentos_urls || {}) };
      currentClientDocs.tabla_amortizacion = publicUrl;

      await supabase
        .from('clientes')
        .update({ documentos_urls: currentClientDocs })
        .eq('id', selectedCliente.id);

      // Actualizar en tramite mejoravit si existe
      const trMejoravit = clienteTramites.mejoravit?.[0];
      if (trMejoravit) {
        const currentTramiteDocs = { ...(trMejoravit.documentos_urls || {}) };
        currentTramiteDocs.tabla_amortizacion = publicUrl;
        await supabase
          .from('tramites_mejoravit')
          .update({ documentos_urls: currentTramiteDocs })
          .eq('id', trMejoravit.id);
      }

      setSelectedCliente({
        ...selectedCliente,
        documentos_urls: currentClientDocs,
      });

      setFeedbackMsg({
        type: 'success',
        text: '¡Tabla de Amortización subida y adjuntada al expediente exitosamente!',
      });
      await fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error al subir tabla de amortización:', err);
      setFeedbackMsg({
        type: 'error',
        text: `Error al subir tabla de amortización: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Handler para guardar datos de la Cita con Infonavit
  const handleSaveCitaInfonavit = async (citaData: {
    fecha: string;
    hora: string;
    lugar: string;
    folio: string;
    estado: 'pendiente' | 'confirmada' | 'asistida' | 'cancelada';
    notas?: string;
  }) => {
    if (!selectedCliente) return;
    try {
      const currentClientDocs = { ...(selectedCliente.documentos_urls || {}) };
      const currentCita = currentClientDocs.cita_infonavit || {};
      currentClientDocs.cita_infonavit = {
        ...currentCita,
        ...citaData,
      };

      await supabase
        .from('clientes')
        .update({ documentos_urls: currentClientDocs })
        .eq('id', selectedCliente.id);

      const trMejoravit = clienteTramites.mejoravit?.[0];
      if (trMejoravit) {
        const currentTramiteDocs = { ...(trMejoravit.documentos_urls || {}) };
        const currentTrCita = currentTramiteDocs.cita_infonavit || {};
        currentTramiteDocs.cita_infonavit = {
          ...currentTrCita,
          ...citaData,
        };
        await supabase
          .from('tramites_mejoravit')
          .update({ documentos_urls: currentTramiteDocs })
          .eq('id', trMejoravit.id);
      }

      setSelectedCliente({
        ...selectedCliente,
        documentos_urls: currentClientDocs,
      });

      setFeedbackMsg({
        type: 'success',
        text: '¡Información de la Cita con Infonavit guardada exitosamente!',
      });
      await fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error al guardar cita:', err);
      throw err;
    }
  };

  // Handler para subir comprobante oficial de Cita Infonavit
  const handleUploadComprobanteCita = async (file: File) => {
    if (!selectedCliente) return;
    setUploadingDocKey('comprobante_cita_infonavit');
    setFeedbackMsg({ type: 'success', text: 'Subiendo comprobante oficial de cita...' });
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `${selectedCliente.id}/comprobante_cita_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('ine_documents')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('ine_documents')
        .getPublicUrl(filePath);

      const currentClientDocs = { ...(selectedCliente.documentos_urls || {}) };
      currentClientDocs.comprobante_cita_infonavit = publicUrl;

      await supabase
        .from('clientes')
        .update({ documentos_urls: currentClientDocs })
        .eq('id', selectedCliente.id);

      const trMejoravit = clienteTramites.mejoravit?.[0];
      if (trMejoravit) {
        const currentTramiteDocs = { ...(trMejoravit.documentos_urls || {}) };
        currentTramiteDocs.comprobante_cita_infonavit = publicUrl;
        await supabase
          .from('tramites_mejoravit')
          .update({ documentos_urls: currentTramiteDocs })
          .eq('id', trMejoravit.id);
      }

      setSelectedCliente({
        ...selectedCliente,
        documentos_urls: currentClientDocs,
      });

      setFeedbackMsg({
        type: 'success',
        text: '¡Comprobante de cita con Infonavit adjuntado exitosamente!',
      });
      await fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error al subir comprobante de cita:', err);
      setFeedbackMsg({
        type: 'error',
        text: `Error al subir comprobante de cita: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setUploadingDocKey(null);
    }
  };

  const papeleraCount = clientes.filter((c) => Boolean(c.deleted_at)).length;

  return (
    <div className="space-y-6">
      {/* Main Content Layout */}
      {showFullDetails && selectedCliente ? (
        <ClienteFullDetails
          selectedCliente={selectedCliente}
          currentUserRole={user?.role}
          tramiteMejoravit={clienteTramites.mejoravit?.[0]}
          downloadingBundle={downloadingBundle}
          isModoSeguimiento={isModoSeguimiento}
          onToggleModoSeguimiento={() => setIsModoSeguimiento(!isModoSeguimiento)}
          onChangeClienteStatus={handleUpdateEstadoCliente}
          onDeleteCliente={handleSoftDeleteCliente}
          onNewCliente={() => {
            setFeedbackMsg(null);
            setIsModalOpen(true);
          }}
          timelineComponent={
            <ClienteSeguimientoTimeline
              selectedCliente={selectedCliente}
              clienteTramites={clienteTramites}
              docPresets={docPresets}
              uploadingDocKey={uploadingDocKey}
              generatingAmpliada200={generatingAmpliada200}
              onChangeClienteStatus={handleUpdateEstadoCliente}
              onViewDoc={(url, title) => setModalViewerDoc({ url, title })}
              onDownloadDoc={handleDownloadInline}
              onUploadReqDocument={handleUploadReqDocument}
              onGenerateIneAmpliada200={handleGenerateIneAmpliada200}
              onOpenManualIneCropper={openManualIneCropper}
              onOpenReferenciasModal={(tramiteId, tr) => {
                const existingRefs = tr.referencias_detalle || [];
                const initialRefs = [0, 1, 2].map((idx) => ({
                  nombre: existingRefs[idx]?.nombre || '',
                  telefono: existingRefs[idx]?.telefono || '',
                  domicilio: existingRefs[idx]?.domicilio || '',
                }));
                setReferenciasModal({
                  tramiteId,
                  referencias: initialRefs,
                });
              }}
              onOpenInfonavitCredsModal={(tramiteId, tr) => {
                setInfonavitCredsModal({
                  tramiteId,
                  nss: tr.nss_portal_infonavit || selectedCliente?.nss || '',
                  password: tr.password_portal_infonavit || '',
                });
              }}
              onOpenInmuebleFotosModal={(tramiteId, tr) => {
                setInmuebleFotosModal({
                  tramiteId,
                  existingPdfUrl: tr.documentos_urls?.req_fotos_inmueble_5,
                  fotos: [],
                });
              }}
              onGenerateClientDocLink={handleGenerateClientDocLink}
              onRemoveDocPreset={handleRemoveDocPreset}
              onSaveQuickCreds={handleSaveQuickCreds}
              onUploadTablaAmortizacion={handleUploadTablaAmortizacion}
              onSaveCitaInfonavit={handleSaveCitaInfonavit}
              onUploadComprobanteCita={handleUploadComprobanteCita}
              onDownloadOficialesPdf={handleDownloadOficialesPdf}
              onDownloadContratosPdf={handleDownloadContratosPdf}
              downloadingBundle={downloadingBundle}
            />
          }
          onBack={() => {
            setShowFullDetails(false);
            setIsModoSeguimiento(false);
          }}
          onOpenDownloadModal={() => setDownloadExpedienteModalOpen(true)}
          onOpenShareModal={openShareCredentialsModal}
          onEditCliente={handleEditCliente}
        >
          <TramitesChecklist
            loadingTramites={loadingTramites}
            clienteTramites={clienteTramites}
            selectedCliente={selectedCliente}
            uploadingDocKey={uploadingDocKey}
            generatingAmpliada200={generatingAmpliada200}
            docPresets={docPresets}
            onViewDoc={(url, title) => setModalViewerDoc({ url, title })}
            onDownloadDoc={handleDownloadInline}
            onUploadReqDocument={handleUploadReqDocument}
            onGenerateIneAmpliada200={handleGenerateIneAmpliada200}
            onOpenManualIneCropper={openManualIneCropper}
            onOpenReferenciasModal={(tramiteId, tr) => {
              const existingRefs = tr.referencias_detalle || [];
              const initialRefs = [0, 1, 2].map((idx) => ({
                nombre: existingRefs[idx]?.nombre || '',
                telefono: existingRefs[idx]?.telefono || '',
                domicilio: existingRefs[idx]?.domicilio || '',
              }));
              setReferenciasModal({
                tramiteId,
                referencias: initialRefs,
              });
            }}
            onOpenInfonavitCredsModal={(tramiteId, tr) => {
              setInfonavitCredsModal({
                tramiteId,
                nss: tr.nss_portal_infonavit || selectedCliente?.nss || '',
                password: tr.password_portal_infonavit || '',
              });
            }}
            onOpenInmuebleFotosModal={(tramiteId, tr) => {
              setInmuebleFotosModal({
                tramiteId,
                existingPdfUrl: tr.documentos_urls?.req_fotos_inmueble_5,
                fotos: [],
              });
            }}
            onGenerateClientDocLink={handleGenerateClientDocLink}
            onRemoveDocPreset={handleRemoveDocPreset}
          />
        </ClienteFullDetails>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClientesList
            clientes={clientes}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            selectedCliente={selectedCliente}
            showFullDetails={showFullDetails}
            currentUserRole={user?.role}
            activeStatusFilter={activeStatusFilter}
            onStatusFilterChange={setActiveStatusFilter}
            onSelectCliente={handleSelectCliente}
            onEditCliente={handleEditCliente}
            onDeleteCliente={handleSoftDeleteCliente}
            onRestoreCliente={handleRestoreCliente}
            onPermanentDeleteCliente={handlePermanentDeleteCliente}
            onChangeClienteStatus={handleUpdateEstadoCliente}
            papeleraCount={papeleraCount}
            clientesTramitesMap={clientesTramitesMap}
            onNewCliente={() => {
              setFeedbackMsg(null);
              setIsModalOpen(true);
            }}
          />

          <ClienteQuickView
            selectedCliente={selectedCliente}
            currentUserRole={user?.role}
            onOpenShareModal={openShareCredentialsModal}
            onEditCliente={handleEditCliente}
            onChangeClienteStatus={handleUpdateEstadoCliente}
            onDeleteCliente={handleSoftDeleteCliente}
            onViewFullDetails={() => {
              setShowFullDetails(true);
              setIsModoSeguimiento(true);
            }}
            onEnterModoSeguimiento={() => {
              setShowFullDetails(true);
              setIsModoSeguimiento(true);
            }}
          >
            <TramitesChecklist
              loadingTramites={loadingTramites}
              clienteTramites={clienteTramites}
              selectedCliente={selectedCliente}
              uploadingDocKey={uploadingDocKey}
              generatingAmpliada200={generatingAmpliada200}
              docPresets={docPresets}
              onViewDoc={(url, title) => setModalViewerDoc({ url, title })}
              onDownloadDoc={handleDownloadInline}
              onUploadReqDocument={handleUploadReqDocument}
              onGenerateIneAmpliada200={handleGenerateIneAmpliada200}
              onOpenManualIneCropper={openManualIneCropper}
              onOpenReferenciasModal={(tramiteId, tr) => {
                const existingRefs = tr.referencias_detalle || [];
                const initialRefs = [0, 1, 2].map((idx) => ({
                  nombre: existingRefs[idx]?.nombre || '',
                  telefono: existingRefs[idx]?.telefono || '',
                  domicilio: existingRefs[idx]?.domicilio || '',
                }));
                setReferenciasModal({
                  tramiteId,
                  referencias: initialRefs,
                });
              }}
              onOpenInfonavitCredsModal={(tramiteId, tr) => {
                setInfonavitCredsModal({
                  tramiteId,
                  nss: tr.nss_portal_infonavit || selectedCliente?.nss || '',
                  password: tr.password_portal_infonavit || '',
                });
              }}
              onOpenInmuebleFotosModal={(tramiteId, tr) => {
                setInmuebleFotosModal({
                  tramiteId,
                  existingPdfUrl: tr.documentos_urls?.req_fotos_inmueble_5,
                  fotos: [],
                });
              }}
              onGenerateClientDocLink={handleGenerateClientDocLink}
              onRemoveDocPreset={handleRemoveDocPreset}
            />
          </ClienteQuickView>
        </div>
      )}

      {/* Formulario Modal Cliente */}
      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClienteId(null);
        }}
        editingClienteId={editingClienteId}
        feedbackMsg={feedbackMsg}
        saving={saving}
        formCliente={formCliente}
        setFormCliente={setFormCliente}
        estadoSearchQuery={estadoSearchQuery}
        setEstadoSearchQuery={setEstadoSearchQuery}
        isEstadoDropdownOpen={isEstadoDropdownOpen}
        setIsEstadoDropdownOpen={setIsEstadoDropdownOpen}
        crearTramiteInicial={crearTramiteInicial}
        setCrearTramiteInicial={setCrearTramiteInicial}
        tipoTramiteInicial={tipoTramiteInicial}
        setTipoTramiteInicial={setTipoTramiteInicial}
        formRetiro={formRetiro}
        setFormRetiro={setFormRetiro}
        formMejoravit={formMejoravit}
        setFormMejoravit={setFormMejoravit}
        formAltaMedica={formAltaMedica}
        setFormAltaMedica={setFormAltaMedica}
        onSubmit={handleSubmitCliente}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingPdf && (
        <div className="fixed inset-0 z-50 bg-[#c5a059]/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-4 border-dashed border-emerald-400 text-white pointer-events-none transition-all">
          <div className="p-6 bg-[#0d0e12]/90 border border-emerald-500/40 rounded-3xl backdrop-blur-md flex flex-col items-center text-center max-w-md shadow-2xl animate-pulse">
            <Upload className="w-16 h-16 mb-3 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-bold text-white">Suelta la Constancia de CURP aquí</h3>
            <p className="text-xs text-slate-300 mt-2">
              Se guardará automáticamente en el Storage y se anexará al expediente de{' '}
              <strong>{selectedCliente?.nombre || 'este cliente'}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Visualizador de Documentos Inline */}
      {modalViewerDoc && (
        <DocumentViewerModal
          modalData={modalViewerDoc}
          onClose={() => setModalViewerDoc(null)}
          onDownload={handleDownloadInline}
        />
      )}

      {/* Modal Fotos Inmueble */}
      {inmuebleFotosModal && (
        <InmuebleFotosModal
          modalData={inmuebleFotosModal}
          onClose={() => setInmuebleFotosModal(null)}
          onFotosChange={(fotos) => setInmuebleFotosModal({ ...inmuebleFotosModal, fotos })}
          onGeneratePdf={async () => {
            if (!inmuebleFotosModal || !selectedCliente) return;
            const validFotos = inmuebleFotosModal.fotos.filter(Boolean);
            if (validFotos.length === 0) {
              alert('Debes seleccionar al menos 1 foto.');
              return;
            }

            setSavingFotosPdf(true);
            try {
              const pdfFile = await generateInmuebleFotosPdf(validFotos, `fotos_inmueble_${selectedCliente.id}.pdf`);
              await handleUploadReqDocument('mejoravit', inmuebleFotosModal.tramiteId, 'req_fotos_inmueble_5', pdfFile);

              setFeedbackMsg({
                type: 'success',
                text: `¡PDF de Fotos del Inmueble (${validFotos.length} imágenes) generado y adjuntado al expediente exitosamente!`,
              });
              setInmuebleFotosModal(null);
            } catch (err: any) {
              console.error('Error al generar PDF de Fotos:', err);
              setFeedbackMsg({
                type: 'error',
                text: `Error al generar PDF de fotos: ${err.message || 'Error desconocido'}`,
              });
            } finally {
              setSavingFotosPdf(false);
            }
          }}
          saving={savingFotosPdf}
        />
      )}

      {/* Modal Marcado Manual INE */}
      {manualIneCropModal && (
        <ManualIneCropModal
          modalData={manualIneCropModal}
          onClose={() => setManualIneCropModal(null)}
          onPointsChange={(step, points) => {
            if (step === 'frente') {
              setManualIneCropModal({ ...manualIneCropModal, frentePoints: points });
            } else {
              setManualIneCropModal({ ...manualIneCropModal, reversoPoints: points });
            }
          }}
          onStepChange={(step) => setManualIneCropModal({ ...manualIneCropModal, step })}
          onConfirm={async () => {
            if (manualIneCropModal.frentePoints.length < 4 || manualIneCropModal.reversoPoints.length < 4) return;
            setProcessingManualCrop(true);
            try {
              const generatedFile = await generateIneAmpliada200File(manualIneCropModal.imageUrl, {
                frente: manualIneCropModal.frentePoints as any,
                reverso: manualIneCropModal.reversoPoints as any,
              });
              await handleUploadReqDocument('mejoravit', manualIneCropModal.tramiteId, 'req_ine_ampliada_200', generatedFile);
              setFeedbackMsg({
                type: 'success',
                text: '¡INE Ampliada al 200% generada con tus 4 puntos marcados y adjuntada exitosamente!',
              });
              setManualIneCropModal(null);
            } catch (err: any) {
              console.error('Error al generar INE manual al 200%:', err);
              setFeedbackMsg({
                type: 'error',
                text: `Error al generar INE ampliada manual: ${err.message || 'Error desconocido'}`,
              });
            } finally {
              setProcessingManualCrop(false);
            }
          }}
          processing={processingManualCrop}
        />
      )}

      {/* Modal Infonavit Creds */}
      {infonavitCredsModal && (
        <InfonavitCredsModal
          modalData={infonavitCredsModal}
          onClose={() => setInfonavitCredsModal(null)}
          onNssChange={(nss) => setInfonavitCredsModal({ ...infonavitCredsModal, nss })}
          onPasswordChange={(password) => setInfonavitCredsModal({ ...infonavitCredsModal, password })}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedCliente || !infonavitCredsModal) return;
            setSavingInfonavitCreds(true);
            try {
              const hasCreds = !!(infonavitCredsModal.nss.trim() && infonavitCredsModal.password.trim());

              const { error: updateErr } = await supabase
                .from('tramites_mejoravit')
                .update({
                  nss_portal_infonavit: infonavitCredsModal.nss.trim() || null,
                  password_portal_infonavit: infonavitCredsModal.password.trim() || null,
                  req_portal_infonavit_validado: hasCreds,
                })
                .eq('id', infonavitCredsModal.tramiteId);

              if (updateErr) throw updateErr;

              setFeedbackMsg({
                type: 'success',
                text: '¡Credenciales del Portal Infonavit guardadas exitosamente!',
              });
              await fetchTramites(selectedCliente.id);
              setInfonavitCredsModal(null);
            } catch (err: any) {
              console.error('Error al guardar credenciales Infonavit:', err);
              setFeedbackMsg({
                type: 'error',
                text: `Error al guardar credenciales: ${err.message || 'Error desconocido'}`,
              });
            } finally {
              setSavingInfonavitCreds(false);
            }
          }}
          saving={savingInfonavitCreds}
        />
      )}

      {/* Modal Referencias */}
      {referenciasModal && (
        <ReferenciasModal
          modalData={referenciasModal}
          onClose={() => setReferenciasModal(null)}
          onReferenciasChange={(referencias) => setReferenciasModal({ ...referenciasModal, referencias })}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedCliente || !referenciasModal) return;
            setSavingReferencias(true);
            try {
              const validRefs = referenciasModal.referencias.filter(
                (r) => r.nombre.trim() !== ''
              );
              const isCompleted = validRefs.length >= 3;

              const { error: updateErr } = await supabase
                .from('tramites_mejoravit')
                .update({
                  referencias_detalle: referenciasModal.referencias,
                  req_3_referencias_personales: isCompleted,
                })
                .eq('id', referenciasModal.tramiteId);

              if (updateErr) throw updateErr;

              setFeedbackMsg({
                type: 'success',
                text: '¡Las 3 Referencias Personales se han guardado exitosamente!',
              });
              await fetchTramites(selectedCliente.id);
              setReferenciasModal(null);
            } catch (err: any) {
              console.error('Error al guardar referencias personales:', err);
              setFeedbackMsg({
                type: 'error',
                text: `Error al guardar referencias: ${err.message || 'Error desconocido'}`,
              });
            } finally {
              setSavingReferencias(false);
            }
          }}
          saving={savingReferencias}
        />
      )}

      {/* Modal Compartir Credenciales */}
      {shareModalCliente && (
        <ShareCredentialsModal
          modalData={shareModalCliente}
          onClose={() => setShareModalCliente(null)}
          copied={copiedShareMsg}
          onCopy={() => {
            const url = `${window.location.origin}/seguimiento?folio=${shareModalCliente.folio}`;
            const nombreCliente = [shareModalCliente.cliente.nombre, shareModalCliente.cliente.apellido_paterno].filter(Boolean).join(' ') || 'Cliente';
            const msg = `📋 *Consultoría Santina - Seguimiento de Trámite*\n\nEstimado(a) *${nombreCliente}*:\nPuedes consultar el avance de tu trámite (*${shareModalCliente.tramiteNombre}*) en tiempo real en nuestro portal web.\n\n🔗 *Enlace directo:*\n${url}\n\n📄 *Número de Folio:* ${shareModalCliente.folio}\n🔑 *Contraseña (NSS):* ${shareModalCliente.nss}\n\n_Haz clic en el enlace e ingresa tu contraseña para revisar la línea de tiempo de tus avances y recibir notificaciones instantáneas en tu dispositivo._`;
            navigator.clipboard.writeText(msg);
            setCopiedShareMsg(true);
            setTimeout(() => setCopiedShareMsg(false), 3000);
          }}
        />
      )}

      {/* Modal Descargar Expediente Completo */}
      <DownloadExpedienteModal
        isOpen={downloadExpedienteModalOpen}
        onClose={() => setDownloadExpedienteModalOpen(false)}
        cliente={selectedCliente}
        downloadingBundle={downloadingBundle}
        onPreviewOficiales={() => handlePreviewPdf('oficiales')}
        onDownloadOficiales={handleDownloadOficialesPdf}
        onPreviewContratos={() => handlePreviewPdf('contratos')}
        onDownloadContratos={handleDownloadContratosPdf}
        onDownloadCompleto={handleDownloadExpedienteCompleto}
      />

      {/* Modal Visor de PDF e Impresión */}
      {previewPdfModal && (
        <PreviewPdfModal
          modalData={previewPdfModal}
          onClose={() => {
            if (previewPdfModal.pdfBlobUrl) URL.revokeObjectURL(previewPdfModal.pdfBlobUrl);
            setPreviewPdfModal(null);
          }}
        />
      )}

      {/* Modal Link de Documento Especial para Cliente */}
      {clientDocModal && (
        <ClientDocLinkModal
          modalData={clientDocModal}
          onClose={() => setClientDocModal(null)}
          onCopy={() => {
            navigator.clipboard.writeText(clientDocModal.linkUrl);
            setClientDocModal({ ...clientDocModal, copied: true });
            setTimeout(() => {
              setClientDocModal((prev) => prev ? { ...prev, copied: false } : null);
            }, 2500);
          }}
        />
      )}
      {/* Modal Especial para Dispositivos Móviles */}
      <ClienteMobileModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        selectedCliente={selectedCliente}
        currentUserRole={user?.role}
        clienteTramites={clienteTramites}
        loadingTramites={loadingTramites}
        docPresets={docPresets}
        uploadingDocKey={uploadingDocKey}
        generatingAmpliada200={generatingAmpliada200}
        downloadingBundle={downloadingBundle}
        isModoSeguimiento={isModoSeguimiento}
        onToggleModoSeguimiento={() => setIsModoSeguimiento(!isModoSeguimiento)}
        onChangeClienteStatus={handleUpdateEstadoCliente}
        onDeleteCliente={handleSoftDeleteCliente}
        onEditCliente={handleEditCliente}
        onOpenShareModal={openShareCredentialsModal}
        onOpenDownloadModal={() => setDownloadExpedienteModalOpen(true)}
        onViewDoc={(url, title) => setModalViewerDoc({ url, title })}
        onDownloadDoc={handleDownloadInline}
        onUploadReqDocument={handleUploadReqDocument}
        onGenerateIneAmpliada200={handleGenerateIneAmpliada200}
        onOpenManualIneCropper={openManualIneCropper}
        onOpenReferenciasModal={(tramiteId, tr) => {
          const existingRefs = tr.referencias_detalle || [];
          const initialRefs = [0, 1, 2].map((idx) => ({
            nombre: existingRefs[idx]?.nombre || '',
            telefono: existingRefs[idx]?.telefono || '',
            domicilio: existingRefs[idx]?.domicilio || '',
          }));
          setReferenciasModal({
            tramiteId,
            referencias: initialRefs,
          });
        }}
        onOpenInfonavitCredsModal={(tramiteId, tr) => {
          setInfonavitCredsModal({
            tramiteId,
            nss: tr.nss_portal_infonavit || selectedCliente?.nss || '',
            password: tr.password_portal_infonavit || '',
          });
        }}
        onOpenInmuebleFotosModal={(tramiteId, tr) => {
          setInmuebleFotosModal({
            tramiteId,
            existingPdfUrl: tr.documentos_urls?.req_fotos_inmueble_5,
            fotos: [],
          });
        }}
        onGenerateClientDocLink={handleGenerateClientDocLink}
        onRemoveDocPreset={handleRemoveDocPreset}
        onSaveQuickCreds={handleSaveQuickCreds}
        onUploadTablaAmortizacion={handleUploadTablaAmortizacion}
        onSaveCitaInfonavit={handleSaveCitaInfonavit}
        onUploadComprobanteCita={handleUploadComprobanteCita}
        onDownloadOficialesPdf={handleDownloadOficialesPdf}
        onDownloadContratosPdf={handleDownloadContratosPdf}
      />
    </div>
  );
}
