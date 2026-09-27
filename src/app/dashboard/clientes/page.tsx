'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Cliente, TipoTramite, TramiteRetiroDesempleo, TramiteMejoravit, TramiteAltaMedicaImss } from '@/types/cliente';
import { Preset } from '@/types/preset';
import { runOcrWithHeatmap, parseIneOcrText, generateIneAmpliada200File, IneParsedData } from '@/utils/ineOcrParser';
import { generateAndUploadOfficialCurpPdf } from '@/utils/curpPdfGenerator';
import { ESTADOS_MEXICO } from '@/constants/estadosMexico';
import {
  Users,
  Plus,
  Search,
  FileText,
  Building2,
  HeartPulse,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Smartphone,
  Camera,
  KeyRound,
  FileCheck2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  ScanLine,
  Eye,
  ExternalLink,
  Check,
  Download,
  FileDown,
  Copy,
  Link2,
  Share2,
  ArrowLeft,
  User,
  UserCheck,
  Edit,
  MapPin
} from 'lucide-react';

import { generateInmuebleFotosPdf } from '@/utils/inmuebleFotosPdfGenerator';

export default function ClientesPage() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);

  // Form State Cliente
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    email: '',
    estado: 'Jalisco',
    notas: '',
  });

  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const [isEstadoDropdownOpen, setIsEstadoDropdownOpen] = useState(false);

  // Modal de Gestión de 5 Fotos del Inmueble (Mejoravit)
  const [inmuebleFotosModal, setInmuebleFotosModal] = useState<{
    tramiteId: string;
    existingPdfUrl?: string;
    fotos: string[]; // Lista de DataURLs o URLs
  } | null>(null);
  const [savingFotosPdf, setSavingFotosPdf] = useState(false);

  // Modal de Marcado Manual de 4 Puntos para INE Frontal y Trasera
  const [manualIneCropModal, setManualIneCropModal] = useState<{
    tramiteId: string;
    imageUrl: string;
    step: 'frente' | 'reverso';
    frentePoints: { x: number; y: number }[];
    reversoPoints: { x: number; y: number }[];
  } | null>(null);
  const [processingManualCrop, setProcessingManualCrop] = useState(false);

  // Modal de Credenciales Portal Infonavit (Requisito 9)
  const [infonavitCredsModal, setInfonavitCredsModal] = useState<{
    tramiteId: string;
    nss: string;
    password: string;
  } | null>(null);
  const [savingInfonavitCreds, setSavingInfonavitCreds] = useState(false);

  const openManualIneCropper = async (tramiteId: string, imageUrl: string) => {
    // Calcular puntos iniciales por defecto (subcuadro centrado en la mitad superior e inferior)
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

    // Frontal: centrado en la mitad superior
    const frenteY = Math.round((halfH - cardH) / 2);
    const defaultFrente = [
      { x: marginX, y: frenteY },
      { x: marginX + cardW, y: frenteY },
      { x: marginX + cardW, y: frenteY + cardH },
      { x: marginX, y: frenteY + cardH },
    ];

    // Trasera: centrado en la mitad inferior
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
  const [clienteTramites, setClienteTramites] = useState<{
    retiro?: TramiteRetiroDesempleo[];
    mejoravit?: TramiteMejoravit[];
    altaMedica?: TramiteAltaMedicaImss[];
  }>({});
  const [loadingTramites, setLoadingTramites] = useState(false);



  const [crearTramiteInicial, setCrearTramiteInicial] = useState(false);
  const [tipoTramiteInicial, setTipoTramiteInicial] = useState<TipoTramite>('retiro_desempleo');

  // Form Retiro por Desempleo (Exacto a Imagen 1)
  const [formRetiro, setFormRetiro] = useState({
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

  // Form Mejoravit (Exacto a 10 puntos de Imagen 2)
  const [formMejoravit, setFormMejoravit] = useState({
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
  const [formAltaMedica, setFormAltaMedica] = useState({
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

  // Estado de subida de INE y OCR
  const [ineUploadMode, setIneUploadMode] = useState<'single' | 'dual'>('single'); // 'single': 1 hoja con ambos lados, 'dual': frente y reverso por separado
  const [ineCompletaFile, setIneCompletaFile] = useState<File | null>(null);
  const [ineCompletaPreview, setIneCompletaPreview] = useState<string | null>(null);
  const [ineFrenteFile, setIneFrenteFile] = useState<File | null>(null);
  const [ineReversoFile, setIneReversoFile] = useState<File | null>(null);
  const [ineFrentePreview, setIneFrentePreview] = useState<string | null>(null);
  const [ineReversoPreview, setIneReversoPreview] = useState<string | null>(null);
  const [processingOcr, setProcessingOcr] = useState(false);
  const [ocrSuccessData, setOcrSuccessData] = useState<IneParsedData | null>(null);
  const [ocrStatusMsg, setOcrStatusMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [downloadingCurp, setDownloadingCurp] = useState(false);
  const [waitingCurpDownload, setWaitingCurpDownload] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [copiedScanLink, setCopiedScanLink] = useState(false);
  const [curpSuccessMsg, setCurpSuccessMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [localNetworkIp, setLocalNetworkIp] = useState<string>('');

  // Presets de Documentos para Cliente
  const [docPresets, setDocPresets] = useState<Preset[]>([]);
  const [clientDocModal, setClientDocModal] = useState<{
    isOpen: boolean;
    linkUrl: string;
    presetName: string;
    token: string;
    clienteNombre: string;
    clientePhone?: string;
    copied: boolean;
  } | null>(null);

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

  const handleShareDocLinkWhatsApp = () => {
    if (!clientDocModal) return;
    const msg = `Hola ${clientDocModal.clienteNombre}, te comparto el siguiente enlace oficial para rellenar tu documento (${clientDocModal.presetName}):\n\n👉 ${clientDocModal.linkUrl}\n\n¡Gracias!`;
    const cleanPhone = clientDocModal.clientePhone ? clientDocModal.clientePhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '52' + cleanPhone : cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

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

  const getClientScanLink = (cliId?: string) => {
    const id = cliId || selectedCliente?.id;
    if (!id || typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if ((origin.includes('localhost') || origin.includes('127.0.0.1')) && localNetworkIp) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${localNetworkIp}${port}/scan-ine/${id}`;
    }
    return `${origin}/scan-ine/${id}`;
  };

  const handleCopyScanLink = (cliId?: string) => {
    const link = getClientScanLink(cliId);
    if (!link) return;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedScanLink(true);
    setFeedbackMsg({ type: 'success', text: '¡Enlace de escaneo copiado! Puedes enviárselo a tu cliente.' });
    setTimeout(() => setCopiedScanLink(false), 3000);
  };

  const handleShareWhatsAppScanLink = (cliente?: Cliente) => {
    const cli = cliente || selectedCliente;
    if (!cli) return;
    const link = getClientScanLink(cli.id);
    const nombreCli = cli.nombre || 'estimado cliente';
    const msg = `Hola ${nombreCli}, te comparto tu enlace oficial y seguro para escanear tu Credencial de Elector (INE) por ambos lados con la cámara de tu celular y completar tu expediente:\n\n👉 ${link}\n\nSolo te tomará 1 minuto. ¡Gracias!`;
    const cleanPhone = cli.telefono ? cli.telefono.replace(/\D/g, '') : '';
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '52' + cleanPhone : cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadCurpOfficial = async (curpOverride?: string) => {
    if (!selectedCliente) return;
    const targetCurp = curpOverride || selectedCliente.curp || ocrSuccessData?.curp;
    if (!targetCurp) {
      alert('No se ha detectado o registrado ninguna CURP.');
      return;
    }

    setDownloadingCurp(true);
    setCurpSuccessMsg('Generando constancia certificada de CURP y guardando en Storage...');
    try {
      const { publicUrl, pdfBlob } = await generateAndUploadOfficialCurpPdf({
        clienteId: selectedCliente.id,
        curp: targetCurp,
        nombre: selectedCliente.nombre || ocrSuccessData?.nombre,
        apellidoPaterno: selectedCliente.apellido_paterno || ocrSuccessData?.apellido_paterno,
        apellidoMaterno: selectedCliente.apellido_materno || ocrSuccessData?.apellido_materno,
        fechaNacimiento: ocrSuccessData?.fecha_nacimiento,
        sexo: ocrSuccessData?.sexo,
        entidad: 'JALISCO',
      });

      setSelectedCliente((prev) => prev ? { ...prev, curp: targetCurp, curp_document_url: publicUrl } : null);
      setCurpSuccessMsg('¡Constancia certificada de CURP guardada en el expediente!');

      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `CURP_Certificada_${targetCurp}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      fetchClientes();
      fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error al generar CURP:', err);
      setCurpSuccessMsg(`Error: ${err.message}`);
    } finally {
      setDownloadingCurp(false);
    }
  };

  const handleOpenGobMxCurp = (curpToCopy?: string) => {
    const curp = curpToCopy || selectedCliente?.curp || ocrSuccessData?.curp || '';
    if (curp) {
      navigator.clipboard.writeText(curp).catch(() => {});
      setCurpSuccessMsg(`¡CURP (${curp}) copiada al portapapeles! Pégala en el portal oficial de RENAPO.`);
    }
    setWaitingCurpDownload(true);
    window.open('https://www.gob.mx/curp/', '_blank');
  };

  const handleUploadCurpPdf = async (file: File) => {
    if (!selectedCliente) return;
    setDownloadingCurp(true);
    setCurpSuccessMsg('Subiendo constancia original de RENAPO al Storage...');
    try {
      const curpVal = selectedCliente.curp || ocrSuccessData?.curp || 'RENAPO';
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
          ...(selectedCliente.curp ? {} : ocrSuccessData?.curp ? { curp: ocrSuccessData.curp } : {}),
        })
        .eq('id', selectedCliente.id);

      await Promise.all([
        supabase.from('tramites_retiro_desempleo').update({ req_curp: true }).eq('cliente_id', selectedCliente.id),
        supabase.from('tramites_mejoravit').update({ req_curp_actualizada: true }).eq('cliente_id', selectedCliente.id),
        supabase.from('tramites_alta_medica_imss').update({ req_curp_validada: true }).eq('cliente_id', selectedCliente.id),
      ]);

      setSelectedCliente((prev) => prev ? { ...prev, curp_document_url: publicUrl } : null);
      setCurpSuccessMsg('¡Constancia original de RENAPO guardada y anexada al expediente!');
      setWaitingCurpDownload(false);
      fetchClientes();
      fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error subiendo CURP PDF:', err);
      setCurpSuccessMsg(`Error al subir: ${err.message}`);
    } finally {
      setDownloadingCurp(false);
    }
  };

  // Listener global para capturar arrastre de archivos (Drag & Drop) y pegado (Ctrl+V) de la CURP
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

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items && selectedCliente) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
              handleUploadCurpPdf(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedCliente, ocrSuccessData]);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching clientes:', error.message);
      } else if (data) {
        setClientes(data);
      }
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
        retiro: (retiroRes.data as TramiteRetiroDesempleo[]) || [],
        mejoravit: (mejoravitRes.data as TramiteMejoravit[]) || [],
        altaMedica: (altaMedicaRes.data as TramiteAltaMedicaImss[]) || [],
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
    setIneCompletaFile(null);
    setIneFrenteFile(null);
    setIneReversoFile(null);
    setIneCompletaPreview(cliente.ine_completa_url || null);
    setIneFrentePreview(cliente.ine_frente_url || null);
    setIneReversoPreview(cliente.ine_reverso_url || null);
    if (cliente.ine_completa_url && !cliente.ine_frente_url) {
      setIneUploadMode('single');
    }
    setOcrSuccessData(cliente.ine_ocr_raw ? (cliente.ine_ocr_raw as IneParsedData) : null);
    setOcrStatusMsg(null);
    setCurpSuccessMsg(null);
    await fetchTramites(cliente.id);
  };

  // Función para subir archivos a Supabase Storage y aplicar OCR
  const handleUploadAndOcrIne = async () => {
    if (!selectedCliente) return;

    if (ineUploadMode === 'single' && !ineCompletaFile) {
      setOcrStatusMsg('Por favor selecciona el archivo con la hoja completa del INE (ambos lados).');
      return;
    }

    if (ineUploadMode === 'dual' && !ineFrenteFile && !ineReversoFile) {
      setOcrStatusMsg('Por favor selecciona al menos la imagen del Frente o Reverso del INE.');
      return;
    }

    setProcessingOcr(true);
    setOcrStatusMsg('Iniciando procesamiento y subida al Storage...');

    try {
      let completaUrl = selectedCliente.ine_completa_url || '';
      let frenteUrl = selectedCliente.ine_frente_url || '';
      let reversoUrl = selectedCliente.ine_reverso_url || '';
      let frontText = '';
      let backText = '';

      if (ineUploadMode === 'single' && ineCompletaFile) {
        // Modo 1: Un solo archivo con ambos lados
        setOcrStatusMsg('Subiendo hoja completa del INE al Storage...');
        const ext = ineCompletaFile.name.split('.').pop() || 'png';
        const filePath = `${selectedCliente.id}/ine_completa_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('ine_documents')
          .upload(filePath, ineCompletaFile, { upsert: true });

        if (uploadErr) {
          console.warn('Storage upload error:', uploadErr.message);
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('ine_documents')
            .getPublicUrl(filePath);
          completaUrl = publicUrl;
        }

        setOcrStatusMsg('Detectando credenciales mediante Mapa de Calor & procesando OCR...');
        const res = await runOcrWithHeatmap(ineCompletaFile);
        frontText = res.frontText;
        backText = res.backText;
      } else {
        // Modo 2: Dos archivos separados (frente y reverso)
        if (ineFrenteFile) {
          setOcrStatusMsg('Subiendo INE Frente al Storage...');
          const frenteExt = ineFrenteFile.name.split('.').pop() || 'png';
          const frentePath = `${selectedCliente.id}/ine_frente_${Date.now()}.${frenteExt}`;
          
          const { data: uploadFrente, error: uploadFrenteErr } = await supabase.storage
            .from('ine_documents')
            .upload(frentePath, ineFrenteFile, { upsert: true });

          if (uploadFrenteErr) {
            console.warn('Storage upload error:', uploadFrenteErr.message);
          } else if (uploadFrente) {
            const { data: { publicUrl } } = supabase.storage
              .from('ine_documents')
              .getPublicUrl(frentePath);
            frenteUrl = publicUrl;
          }

          setOcrStatusMsg('Analizando texto OCR del Frente con Mapa de Calor...');
          const resFrente = await runOcrWithHeatmap(ineFrenteFile);
          frontText = resFrente.frontText;
        }

        if (ineReversoFile) {
          setOcrStatusMsg('Subiendo INE Reverso al Storage...');
          const reversoExt = ineReversoFile.name.split('.').pop() || 'png';
          const reversoPath = `${selectedCliente.id}/ine_reverso_${Date.now()}.${reversoExt}`;

          const { data: uploadRev, error: uploadRevErr } = await supabase.storage
            .from('ine_documents')
            .upload(reversoPath, ineReversoFile, { upsert: true });

          if (uploadRevErr) {
            console.warn('Storage upload error:', uploadRevErr.message);
          } else if (uploadRev) {
            const { data: { publicUrl } } = supabase.storage
              .from('ine_documents')
              .getPublicUrl(reversoPath);
            reversoUrl = publicUrl;
          }

          setOcrStatusMsg('Analizando texto OCR del Reverso con Mapa de Calor...');
          const resReverso = await runOcrWithHeatmap(ineReversoFile);
          backText = resReverso.frontText || resReverso.backText;
        }
      }

      // 3. Parsear texto detectado del INE
      setOcrStatusMsg('Estructurando datos detectados...');
      const parsedData = parseIneOcrText(frontText, backText);
      setOcrSuccessData(parsedData);

      // 4. Actualizar registro del Cliente en la base de datos
      const updatePayload: Record<string, any> = {
        ine_completa_url: completaUrl || selectedCliente.ine_completa_url,
        ine_frente_url: frenteUrl || selectedCliente.ine_frente_url,
        ine_reverso_url: reversoUrl || selectedCliente.ine_reverso_url,
        ine_ocr_raw: parsedData,
      };

      if (parsedData.curp && !selectedCliente.curp) {
        updatePayload.curp = parsedData.curp;
      }
      if (parsedData.nombre && !selectedCliente.nombre) {
        updatePayload.nombre = parsedData.nombre;
      }
      if (parsedData.apellido_paterno && !selectedCliente.apellido_paterno) {
        updatePayload.apellido_paterno = parsedData.apellido_paterno;
      }
      if (parsedData.apellido_materno && !selectedCliente.apellido_materno) {
        updatePayload.apellido_materno = parsedData.apellido_materno;
      }

      const { data: updatedCli, error: updateCliErr } = await supabase
        .from('clientes')
        .update(updatePayload)
        .eq('id', selectedCliente.id)
        .select()
        .single();

      if (updateCliErr) {
        console.error('Error actualizando cliente con datos OCR:', updateCliErr);
      } else if (updatedCli) {
        setSelectedCliente(updatedCli);
      }

      // 5. Autocompletar y marcar los requisitos de INE como verificados en sus trámites activos
      if (clienteTramites.retiro && clienteTramites.retiro.length > 0) {
        for (const tr of clienteTramites.retiro) {
          await supabase
            .from('tramites_retiro_desempleo')
            .update({
              req_ine_vigente: true,
              req_curp: !!parsedData.curp,
            })
            .eq('id', tr.id);
        }
      }

      if (clienteTramites.mejoravit && clienteTramites.mejoravit.length > 0) {
        for (const tr of clienteTramites.mejoravit) {
          await supabase
            .from('tramites_mejoravit')
            .update({
              req_ine_normal: true,
              req_ine_ampliada_200: true,
              req_curp_actualizada: !!parsedData.curp,
            })
            .eq('id', tr.id);
        }
      }

      if (clienteTramites.altaMedica && clienteTramites.altaMedica.length > 0) {
        for (const tr of clienteTramites.altaMedica) {
          await supabase
            .from('tramites_alta_medica_imss')
            .update({
              req_identificacion_oficial: true,
              req_curp_validada: !!parsedData.curp,
            })
            .eq('id', tr.id);
        }
      }

      // Recargar trámites para reflejar los checks
      if (selectedCliente) {
        const [r1, r2, r3] = await Promise.all([
          supabase.from('tramites_retiro_desempleo').select('*').eq('cliente_id', selectedCliente.id),
          supabase.from('tramites_mejoravit').select('*').eq('cliente_id', selectedCliente.id),
          supabase.from('tramites_alta_medica_imss').select('*').eq('cliente_id', selectedCliente.id),
        ]);
        setClienteTramites({
          retiro: (r1.data as TramiteRetiroDesempleo[]) || [],
          mejoravit: (r2.data as TramiteMejoravit[]) || [],
          altaMedica: (r3.data as TramiteAltaMedicaImss[]) || [],
        });
      }

      setOcrStatusMsg('¡INE procesada, guardada y vinculada exitosamente con OCR!');
      fetchClientes();
    } catch (err: any) {
      console.error(err);
      setOcrStatusMsg(`Error en OCR/Storage: ${err.message || 'Error desconocido'}`);
    } finally {
      setProcessingOcr(false);
    }
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
      notas: cli.notas || '',
    });
    setCrearTramiteInicial(false);
    setFeedbackMsg(null);
    setIsModalOpen(true);
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
        // Modo Edición
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
        // Modo Creación
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
            notas: formCliente.notas.trim() || null,
          }])
          .select()
          .single();

        if (clienteError) {
          throw new Error(clienteError.message);
        }

        // 2. Trámite Inicial Opcional
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

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    const fullName = `${c.nombre} ${c.apellido_paterno || ''} ${c.apellido_materno || ''} ${c.apellidos || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [modalViewerDoc, setModalViewerDoc] = useState<{ url: string; title: string } | null>(null);
  const [generatingAmpliada200, setGeneratingAmpliada200] = useState<boolean>(false);

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

      setFeedbackMsg({ type: 'success', text: 'Documento subido y requisito marcado como completado.' });
      await fetchTramites(selectedCliente.id);
    } catch (err: any) {
      console.error('Error uploading requirement document:', err);
      setFeedbackMsg({ type: 'error', text: `Error al subir el documento: ${err.message || 'Error desconocido'}` });
    } finally {
      setUploadingDocKey(null);
    }
  };

  const renderChecklistRow = (
    tramiteTipo: 'retiro' | 'mejoravit' | 'altaMedica',
    tramiteId: string,
    reqKey: string,
    label: string,
    isCompleted: boolean,
    existingDocUrl?: string | null,
    numberTag?: number,
    extraAction?: React.ReactNode
  ) => {
    const isUploading = uploadingDocKey === `${tramiteId}_${reqKey}`;
    const docUrl =
      existingDocUrl ||
      (tramiteTipo === 'retiro' && reqKey === 'req_curp' ? selectedCliente?.curp_document_url : null) ||
      ((reqKey === 'req_ine_vigente' || reqKey === 'req_ine_normal')
        ? selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url
        : null);
    const completed = isCompleted || !!docUrl;

    return (
      <div
        key={reqKey}
        className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
          completed
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-100'
            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {numberTag ? (
            <span
              className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${
                completed ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {numberTag}
            </span>
          ) : completed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="font-semibold truncate leading-tight">{label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {extraAction}

          {docUrl ? (
            <>
              {/* Visualizar en Modal Inline (sin salir de la página) */}
              <button
                type="button"
                onClick={() => setModalViewerDoc({ url: docUrl, title: label })}
                title="Visualizar documento aquí mismo"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-md transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Ver</span>
              </button>

              {/* Descargar Inline (sin abrir pestaña nueva) */}
              <button
                type="button"
                onClick={() => handleDownloadInline(docUrl, label)}
                title="Descargar documento"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Descargar</span>
              </button>

              {/* Cambiar / Reemplazar */}
              <label
                title="Cambiar o reemplazar archivo"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                )}
                <span>{isUploading ? '...' : 'Cambiar'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadReqDocument(tramiteTipo, tramiteId, reqKey, f);
                  }}
                />
              </label>
            </>
          ) : (
            /* Subir Archivo */
            <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all cursor-pointer">
              {isUploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadReqDocument(tramiteTipo, tramiteId, reqKey, f);
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  const renderDocPresetsForTramite = (tramiteType: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss') => {
    const matching = docPresets.filter(
      (p) => p.targetTramiteType === 'todos' || p.targetTramiteType === tramiteType
    );

    if (matching.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          Documentos / Formatos para Cliente ({matching.length}):
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {matching.map((preset) => {
            const docKey = `doc_preset_${preset.id}`;
            const existingUrl = selectedCliente?.documentos_urls?.[docKey];

            return (
              <div
                key={preset.id}
                className="p-2.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-xs text-purple-900 dark:text-purple-200 block">
                    {preset.name}
                  </span>
                  {preset.description && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                      {preset.description}
                    </span>
                  )}
                </div>

                {existingUrl ? (
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-purple-200/50 dark:border-purple-900/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Llenado por Cliente
                    </span>
                    <a
                      href={existingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Ver PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGenerateClientDocLink(preset, tramiteType)}
                    className="w-full py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Generar Link Cliente</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTramitesChecklist = () => (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Tabla de Expediente & Requisitos
      </h3>

      {loadingTramites ? (
        <div className="flex items-center justify-center p-4 text-xs text-slate-400">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
          Cargando expediente...
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. RETIRO POR DESEMPLEO (Tabla Compacta 2 Columnas) */}
          {clienteTramites.retiro && clienteTramites.retiro.length > 0 && (
            clienteTramites.retiro.map((tr) => (
              <div key={tr.id} className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-emerald-300">
                      Retiro por Desempleo
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 uppercase font-semibold">
                    {tr.estado}
                  </span>
                </div>

                {/* Datos Compactos */}
                <div className="flex items-center justify-between gap-2 text-[11px] bg-white/80 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <div>
                    <span className="text-slate-400 font-medium mr-1">Semanas:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{tr.semanas_cotizadas || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium mr-1">Salario:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">${tr.ultimo_salario_registrado || '0.00'}</span>
                  </div>
                  <div>
                    <span className={`font-semibold text-[10px] ${tr.validado_inactivo_imss ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {tr.validado_inactivo_imss ? '✓ Inactivo IMSS' : '⏳ Pendiente IMSS'}
                    </span>
                  </div>
                </div>

                {/* Grid 2 Columnas para Requisitos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {renderChecklistRow('retiro', tr.id, 'req_ine_vigente', 'INE Vigente', tr.req_ine_vigente, tr.documentos_urls?.req_ine_vigente)}
                  {renderChecklistRow('retiro', tr.id, 'req_app_aforemovil_instalada', 'App AforeMóvil', tr.req_app_aforemovil_instalada, tr.documentos_urls?.req_app_aforemovil_instalada)}
                  {renderChecklistRow('retiro', tr.id, 'req_comprobante_domicilio', 'Comp. Domicilio', tr.req_comprobante_domicilio, tr.documentos_urls?.req_comprobante_domicilio)}
                  {renderChecklistRow('retiro', tr.id, 'req_registro_aforemovil_realizado', 'Registro AforeMóvil', tr.req_registro_aforemovil_realizado, tr.documentos_urls?.req_registro_aforemovil_realizado)}
                  {renderChecklistRow('retiro', tr.id, 'req_curp', 'CURP Certificada', tr.req_curp, tr.documentos_urls?.req_curp)}
                  {renderChecklistRow('retiro', tr.id, 'req_saldo_visible_aforemovil', 'Saldo AforeMóvil', tr.req_saldo_visible_aforemovil, tr.documentos_urls?.req_saldo_visible_aforemovil)}
                  {renderChecklistRow('retiro', tr.id, 'req_constancia_situacion_fiscal', 'Situación Fiscal (SAT)', tr.req_constancia_situacion_fiscal, tr.documentos_urls?.req_constancia_situacion_fiscal)}
                  {renderChecklistRow('retiro', tr.id, 'req_anexo_sindo', 'Anexo SINDO', tr.req_anexo_sindo, tr.documentos_urls?.req_anexo_sindo)}
                  {renderChecklistRow('retiro', tr.id, 'req_reporte_semanas_imss', 'Reporte Semanas IMSS', tr.req_reporte_semanas_imss, tr.documentos_urls?.req_reporte_semanas_imss)}
                </div>

                {renderDocPresetsForTramite('retiro_desempleo')}
              </div>
            ))
          )}

          {/* 2. MEJORAVIT INFONAVIT (Tabla Compacta 2 Columnas) */}
          {clienteTramites.mejoravit && clienteTramites.mejoravit.length > 0 && (
            clienteTramites.mejoravit.map((tr) => {
              const normalIneUrl = tr.documentos_urls?.req_ine_normal || selectedCliente?.ine_completa_url || selectedCliente?.ine_frente_url;
              const btnGetIne200 = normalIneUrl ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateIneAmpliada200(tr.id, normalIneUrl)}
                    disabled={generatingAmpliada200}
                    title="Detectar mapa de calor y generar ampliada al 200% desde la INE Normal"
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {generatingAmpliada200 ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-200" />
                    )}
                    <span>{generatingAmpliada200 ? 'Procesando...' : 'Generar 200%'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openManualIneCropper(tr.id, normalIneUrl)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all cursor-pointer"
                    title="Marcar manualmente los 4 puntos de la frontal y trasera"
                  >
                    <ScanLine className="w-3 h-3" />
                    <span>Manual</span>
                  </button>
                </div>
              ) : null;

              return (
                <div key={tr.id} className="p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-red-200/60 dark:border-red-900/40">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-red-600" />
                      <span className="font-bold text-xs text-slate-900 dark:text-red-300">
                        Expediente Mejoravit (Infonavit)
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 uppercase font-semibold">
                      {tr.estado}
                    </span>
                  </div>

                  {/* Grid 2 Columnas para 10 Requisitos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {renderChecklistRow('mejoravit', tr.id, 'req_ine_normal', '1. INE Normal', tr.req_ine_normal, tr.documentos_urls?.req_ine_normal, 1)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_estado_cuenta_bancario', '6. Edo. Cuenta Bancario', tr.req_estado_cuenta_bancario, tr.documentos_urls?.req_estado_cuenta_bancario, 6)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_ine_ampliada_200', '2. INE Ampliada 200%', tr.req_ine_ampliada_200, tr.documentos_urls?.req_ine_ampliada_200, 2, btnGetIne200)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_constancia_situacion_fiscal', '7. Situación Fiscal (SAT)', tr.req_constancia_situacion_fiscal, tr.documentos_urls?.req_constancia_situacion_fiscal, 7)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_curp_actualizada', '3. CURP Actualizada', tr.req_curp_actualizada, tr.documentos_urls?.req_curp_actualizada, 3)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_3_referencias_personales', '8. 3 Referencias Personales', tr.req_3_referencias_personales, tr.documentos_urls?.req_3_referencias_personales, 8)}
                    {renderChecklistRow('mejoravit', tr.id, 'req_acta_nacimiento', '4. Acta de Nacimiento', tr.req_acta_nacimiento, tr.documentos_urls?.req_acta_nacimiento, 4)}

                    {/* 9. Credenciales Infonavit (Modal de Captura de NSS y Contraseña) */}
                    <div
                      className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-1.5 transition-all text-[11px] min-h-[36px] ${
                        tr.req_portal_infonavit_validado || (tr.nss_portal_infonavit && tr.password_portal_infonavit)
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-100'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${
                            tr.req_portal_infonavit_validado || (tr.nss_portal_infonavit && tr.password_portal_infonavit)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          9
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold truncate leading-tight">9. Credenciales Infonavit</span>
                          {(tr.nss_portal_infonavit || tr.password_portal_infonavit) && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                              NSS: {tr.nss_portal_infonavit || '---'} | Pass: ••••••••
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInfonavitCredsModal({
                            tramiteId: tr.id,
                            nss: tr.nss_portal_infonavit || selectedCliente?.nss || '',
                            password: tr.password_portal_infonavit || '',
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md shadow-sm transition-all cursor-pointer ${
                          tr.nss_portal_infonavit && tr.password_portal_infonavit
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{tr.nss_portal_infonavit && tr.password_portal_infonavit ? 'Ver / Editar' : 'Ingresar Datos'}</span>
                      </button>
                    </div>
                    {renderChecklistRow('mejoravit', tr.id, 'req_comprobante_domicilio', '5. Comp. Domicilio', tr.req_comprobante_domicilio, tr.documentos_urls?.req_comprobante_domicilio, 5)}
                    {renderChecklistRow(
                      'mejoravit',
                      tr.id,
                      'req_fotos_inmueble_5',
                      '10. Fotos Inmueble (5)',
                      tr.req_fotos_inmueble_5,
                      tr.documentos_urls?.req_fotos_inmueble_5,
                      10,
                      <button
                        type="button"
                        onClick={() => {
                          setInmuebleFotosModal({
                            tramiteId: tr.id,
                            existingPdfUrl: tr.documentos_urls?.req_fotos_inmueble_5,
                            fotos: [],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-all cursor-pointer mr-1"
                        title="Subir y ordenar hasta 5 fotos para generar el PDF automáticamente"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{tr.documentos_urls?.req_fotos_inmueble_5 ? 'Editar 5 Fotos' : 'Subir 5 Fotos'}</span>
                      </button>
                    )}
                  </div>

                  {renderDocPresetsForTramite('mejoravit')}
                </div>
              );
            })
          )}

          {/* 3. ALTA MÉDICA IMSS (Tabla Compacta 2 Columnas) */}
          {clienteTramites.altaMedica && clienteTramites.altaMedica.length > 0 && (
            clienteTramites.altaMedica.map((tr) => (
              <div key={tr.id} className="p-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/20 dark:bg-sky-950/20 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/60 dark:border-sky-900/40">
                  <div className="flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-sky-300">
                      Alta Médica IMSS ({tr.clinica_umf_asignada || 'UMF'})
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 uppercase font-semibold">
                    {tr.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {renderChecklistRow('altaMedica', tr.id, 'req_curp_validada', 'CURP Validada', tr.req_curp_validada, tr.documentos_urls?.req_curp_validada)}
                  {renderChecklistRow('altaMedica', tr.id, 'req_comprobante_domicilio_reciente', 'Comp. Domicilio Reciente', tr.req_comprobante_domicilio_reciente, tr.documentos_urls?.req_comprobante_domicilio_reciente)}
                  {renderChecklistRow('altaMedica', tr.id, 'req_identificacion_oficial', 'Identificación Oficial', tr.req_identificacion_oficial, tr.documentos_urls?.req_identificacion_oficial)}
                  {renderChecklistRow('altaMedica', tr.id, 'req_fotografia_infantil', 'Fotografía Infantil', tr.req_fotografia_infantil, tr.documentos_urls?.req_fotografia_infantil)}
                  {renderChecklistRow('altaMedica', tr.id, 'req_cartilla_nacional_salud', 'Cartilla de Salud', tr.req_cartilla_nacional_salud, tr.documentos_urls?.req_cartilla_nacional_salud)}
                  {renderChecklistRow('altaMedica', tr.id, 'req_alta_patronal_vigente', 'Alta Patronal Vigente', tr.req_alta_patronal_vigente, tr.documentos_urls?.req_alta_patronal_vigente)}
                </div>

                {renderDocPresetsForTramite('alta_medica_imss')}
              </div>
            ))
          )}

          {(!clienteTramites.retiro?.length && !clienteTramites.mejoravit?.length && !clienteTramites.altaMedica?.length) && (
            <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              Este cliente aún no cuenta con trámites registrados.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Gestión de Clientes & Expedientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Checklist de requisitos oficiales para Retiro por Desempleo, Mejoravit Infonavit y Alta Médica IMSS.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedbackMsg(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Main Content Layout */}
      {showFullDetails && selectedCliente ? (
        /* VISTA COMPLETA (OCUPA TODO EL ANCHO DE LA PÁGINA - EXPEDIENTE DETALLADO) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
          {/* Barra superior de navegación / regreso */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowFullDetails(false)}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>← Volver a la Lista de Clientes & Checklist</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Expediente Completo
              </span>
              <button
                type="button"
                onClick={() => handleShareWhatsAppScanLink(selectedCliente)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                title="Enviar link de escaneo por WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Link por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 1. PRIMER ELEMENTO QUE SALE AL ENTRAR AL EXPEDIENTE: EL CHECKLIST DE DOCUMENTOS REQUERIDOS */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
            {renderTramitesChecklist()}
          </div>

          {/* 2. INE Upload & OCR Module */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Credencial de Elector (INE) & Extracción OCR
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Captura o sube la credencial del cliente para extraer sus datos oficiales y generar el expediente en PDF.
                  </p>
                </div>
              </div>
            </div>

            {/* BANNER: ESCANEO GUIADO PARA EL CLIENTE DESDE SU CELULAR */}
            <div className="p-4 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 rounded-2xl border border-blue-200/80 dark:border-blue-800/80 space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Escaneo Asistido con Cámara para el Cliente
                      {selectedCliente.ine_completa_url ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-700">
                          ✓ INE Recibido y Validado
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-md">
                          ⏳ Pendiente de Escaneo
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      El cliente abre el link en su celular, enfoca el frente y reverso con el marco guía y el sistema valida los datos automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyScanLink()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {copiedScanLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScanLink ? '¡Enlace Copiado!' : 'Copiar Link de Escaneo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsAppScanLink()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  title="Enviar mensaje con el link al WhatsApp del cliente"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <a
                  href={getClientScanLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Abrir Escáner de Prueba</span>
                </a>

                {selectedCliente.ine_completa_url && (
                  <a
                    href={selectedCliente.ine_completa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold rounded-xl transition-all ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver PDF Generado (Ambas Caras)</span>
                  </a>
                )}
              </div>
            </div>

            {/* Separador o Subida Manual */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                O Carga Manual desde el Panel de Asesor:
              </span>
            </div>

            {/* Modalidad de Subida: 1 Hoja Completa vs 2 Fotos Separadas */}
            <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-900 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setIneUploadMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ineUploadMode === 'single'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1 Hoja (Ambos Lados)
              </button>
              <button
                type="button"
                onClick={() => setIneUploadMode('dual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ineUploadMode === 'dual'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2 Archivos (Frente y Reverso)
              </button>
            </div>

            {/* MODO 1: Una Sola Hoja con Ambos Lados */}
            {ineUploadMode === 'single' ? (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Hoja de INE Completa (Frente y Reverso en el mismo documento o foto)
                </span>

                {ineCompletaPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 flex items-center justify-center bg-slate-950">
                    <img src={ineCompletaPreview} alt="INE Completa" className="object-contain max-h-56 w-full" />
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1.5 text-slate-400" />
                    <span>Sin archivo de hoja completa cargado</span>
                  </div>
                )}

                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 rounded-xl transition-all">
                    <Upload className="w-4 h-4" />
                    {ineCompletaFile ? ineCompletaFile.name : 'Seleccionar Archivo (Foto / Escaneo / PDF)'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setIneCompletaFile(f);
                          setIneCompletaPreview(URL.createObjectURL(f));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              /* MODO 2: Dos Archivos Separados (Frente y Reverso) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Frente */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      1. INE Frente
                    </span>
                    {ineFrentePreview ? (
                      <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 flex items-center justify-center bg-slate-950">
                        <img src={ineFrentePreview} alt="INE Frente" className="object-contain max-h-36 w-full" />
                      </div>
                    ) : (
                      <div className="h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs mb-2">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                        <span>Sin imagen del frente</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {ineFrenteFile ? ineFrenteFile.name.slice(0, 18) + '...' : 'Seleccionar Frente'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setIneFrenteFile(f);
                            setIneFrentePreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Reverso */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      2. INE Reverso
                    </span>
                    {ineReversoPreview ? (
                      <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 flex items-center justify-center bg-slate-950">
                        <img src={ineReversoPreview} alt="INE Reverso" className="object-contain max-h-36 w-full" />
                      </div>
                    ) : (
                      <div className="h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs mb-2">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                        <span>Sin imagen del reverso</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {ineReversoFile ? ineReversoFile.name.slice(0, 18) + '...' : 'Seleccionar Reverso'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setIneReversoFile(f);
                            setIneReversoPreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Procesamiento OCR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleUploadAndOcrIne}
                disabled={
                  processingOcr ||
                  (ineUploadMode === 'single' ? !ineCompletaFile : (!ineFrenteFile && !ineReversoFile))
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {processingOcr ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando OCR & Guardando...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Guardar en Storage & Extraer Datos OCR</span>
                  </>
                )}
              </button>

              {ocrStatusMsg && (
                <p className={`text-xs ${ocrStatusMsg.includes('Error') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400 font-medium'}`}>
                  {ocrStatusMsg}
                </p>
              )}
            </div>

            {/* Resultados OCR Detectados */}
            {ocrSuccessData && (
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs space-y-3">
                <p className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Datos Detectados por OCR:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Nombre Completo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {[ocrSuccessData.nombre, ocrSuccessData.apellido_paterno, ocrSuccessData.apellido_materno].filter(Boolean).join(' ') || 'No identificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">CURP Extraída:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{ocrSuccessData.curp || 'No identificada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Clave Elector:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{ocrSuccessData.clave_elector || 'No identificada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vigencia / Sección:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ocrSuccessData.vigencia ? `Vig. ${ocrSuccessData.vigencia}` : ''} {ocrSuccessData.seccion ? `Sec. ${ocrSuccessData.seccion}` : 'No identificada'}
                    </span>
                  </div>
                  {ocrSuccessData.fecha_nacimiento && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nacimiento / Sexo:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {ocrSuccessData.fecha_nacimiento} ({ocrSuccessData.sexo || 'N/A'})
                      </span>
                    </div>
                  )}
                </div>

                {ocrSuccessData.curp && (
                  <div className="pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-blue-900 dark:text-blue-200">
                      Constancia de CURP Oficial:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenGobMxCurp(ocrSuccessData.curp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Obtener Original en RENAPO (gob.mx)</span>
                      </button>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Adjuntar PDF Original</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCurpPdf(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {ocrSuccessData.raw_text && (
                  <details className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px]">
                    <summary className="text-blue-600 dark:text-blue-400 cursor-pointer font-medium hover:underline">
                      Ver texto OCR plano extraído
                    </summary>
                    <pre className="mt-1 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {ocrSuccessData.raw_text}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* 3. Client Info Header Card & Detalle General */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCliente.nombre} {[selectedCliente.apellido_paterno, selectedCliente.apellido_materno].filter(Boolean).join(' ') || selectedCliente.apellidos || ''}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {selectedCliente.curp ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg">
                      CURP: {selectedCliente.curp}
                    </span>
                  ) : null}

                  {/* 1. Botón para abrir RENAPO oficial y copiar la CURP */}
                  {(selectedCliente.curp || ocrSuccessData?.curp) && (
                    <button
                      type="button"
                      onClick={() => handleOpenGobMxCurp()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                      title="Copia la CURP al portapapeles y abre el portal oficial gob.mx/curp"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Obtener Original en RENAPO (gob.mx)</span>
                    </button>
                  )}

                  {/* 2. Botón para subir y guardar el PDF original descargado de RENAPO */}
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Adjuntar PDF Original RENAPO</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadCurpPdf(f);
                      }}
                    />
                  </label>

                  {/* 3. Ver PDF guardado en el expediente */}
                  {selectedCliente.curp_document_url && (
                    <a
                      href={selectedCliente.curp_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Ver Constancia PDF</span>
                    </a>
                  )}

                  {/* 4. Alternativa: Generar PDF Certificado en el sistema */}
                  {(selectedCliente.curp || ocrSuccessData?.curp) && (
                    <button
                      type="button"
                      onClick={() => handleDownloadCurpOfficial()}
                      disabled={downloadingCurp}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
                      title="Generar constancia local con formato oficial"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Generar PDF</span>
                    </button>
                  )}
                </div>

                {/* Banner de Escucha Activa al abrir gob.mx */}
                {waitingCurpDownload && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                        <strong>Escuchando descarga:</strong> Descarga la CURP en gob.mx y arrastra el archivo PDF a cualquier parte de esta ventana (o presiona <strong>Ctrl + V</strong>) para anexarla al instante.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] rounded-lg cursor-pointer font-semibold transition-colors">
                        <span>Seleccionar Archivo</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCurpPdf(f);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setWaitingCurpDownload(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {curpSuccessMsg && (
                  <p className={`text-[11px] mt-1.5 ${curpSuccessMsg.includes('Error') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
                    {curpSuccessMsg}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Teléfono:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedCliente.telefono || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Correo Electrónico:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedCliente.email || 'No especificado'}</span>
              </div>
              {selectedCliente.notas && (
                <div className="sm:col-span-2 lg:col-span-3 p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-medium mb-1">Notas / Observaciones:</span>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedCliente.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA HABITUAL: LISTA DE CLIENTES (IZQ) + CHECKLIST RÁPIDO (DER) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado de Clientes */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[750px]">
            {/* Search bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, CURP o NSS..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Cargando clientes...
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No hay clientes registrados</p>
                  <p className="text-xs text-slate-400 mt-1">Registra uno nuevo con el botón superior.</p>
                </div>
              ) : (
                filteredClientes.map((cliente) => {
                  const isSelected = selectedCliente?.id === cliente.id;
                  const fullApellidos = [cliente.apellido_paterno, cliente.apellido_materno].filter(Boolean).join(' ') || cliente.apellidos || '';
                  return (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente, false)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {cliente.nombre} {fullApellidos}
                        </p>
                        {cliente.telefono ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Tel: {cliente.telefono}
                          </p>
                        ) : cliente.email ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {cliente.email}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">Sin contacto registrado</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCliente(cliente);
                          }}
                          title="Editar información básica del cliente"
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3 text-indigo-500" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCliente(cliente, true);
                          }}
                          title="Abrir expediente y detalles completos"
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected && showFullDetails
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-200/80 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <User className="w-3 h-3" />
                          <span>Detalles</span>
                        </button>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detalle y Trámites del Cliente Seleccionado (Vista Checklist Rápida) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-[750px] overflow-y-auto">
            {!selectedCliente ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Ningún cliente seleccionado</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecciona un cliente de la lista para ver el checklist completo de sus documentos y estado de trámites.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Compacto del Cliente - Vista Checklist Rápida */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 border border-blue-200/70 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-blue-500/20">
                      {selectedCliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedCliente.nombre} {[selectedCliente.apellido_paterno, selectedCliente.apellido_materno].filter(Boolean).join(' ') || selectedCliente.apellidos || ''}
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          Checklist
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedCliente.telefono && <span>📞 {selectedCliente.telefono}</span>}
                        {selectedCliente.email && <span>✉️ {selectedCliente.email}</span>}
                        {selectedCliente.estado && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedCliente.estado}
                          </span>
                        )}
                        {selectedCliente.curp && <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">🆔 {selectedCliente.curp}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditCliente(selectedCliente)}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Editar Datos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFullDetails(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Ver Expediente Completo</span>
                    </button>
                  </div>
                </div>

                {/* Checklist de Trámites */}
                {renderTramitesChecklist()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Registro / Edición Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingClienteId ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editingClienteId ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente & Expediente'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClienteId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && (
              <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${feedbackMsg.type === 'error' ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCliente} className="space-y-6 pt-4">
              {/* Información Básica */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  1. Información del Cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre(s) *</label>
                    <input
                      type="text"
                      required
                      value={formCliente.nombre}
                      onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                      placeholder="ej: Juan Carlos"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Apellido Paterno <span className="text-slate-400 text-[10px] font-normal">(o materno)</span>
                    </label>
                    <input
                      type="text"
                      value={formCliente.apellido_paterno}
                      onChange={(e) => setFormCliente({ ...formCliente, apellido_paterno: e.target.value })}
                      placeholder="ej: Hernández"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Apellido Materno <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formCliente.apellido_materno}
                      onChange={(e) => setFormCliente({ ...formCliente, apellido_materno: e.target.value })}
                      placeholder="ej: López"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formCliente.telefono}
                      onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                      placeholder="ej: 55 1234 5678"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={formCliente.email}
                      onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* NUEVO CAMPO: ESTADO DE LA REPÚBLICA MEXICANA CON BUSCADOR */}
                  <div className="sm:col-span-2 relative">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Estado de la República Mexicana *
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={formCliente.estado}
                        onFocus={() => setIsEstadoDropdownOpen(true)}
                        onChange={(e) => {
                          setFormCliente({ ...formCliente, estado: e.target.value });
                          setEstadoSearchQuery(e.target.value);
                          setIsEstadoDropdownOpen(true);
                        }}
                        placeholder="Buscar estado de México..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                      />
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {isEstadoDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 text-xs">
                        {ESTADOS_MEXICO.filter((st) =>
                          st.toLowerCase().includes((estadoSearchQuery || formCliente.estado).toLowerCase())
                        ).length === 0 ? (
                          <div className="p-2 text-slate-400 italic text-center">No se encontró ningún estado matching</div>
                        ) : (
                          ESTADOS_MEXICO.filter((st) =>
                            st.toLowerCase().includes((estadoSearchQuery || formCliente.estado).toLowerCase())
                          ).map((st) => (
                            <button
                              type="button"
                              key={st}
                              onClick={() => {
                                setFormCliente({ ...formCliente, estado: st });
                                setEstadoSearchQuery(st);
                                setIsEstadoDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                                formCliente.estado === st
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{st}</span>
                              {formCliente.estado === st && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notas / Observaciones <span className="text-slate-400 text-[10px] font-normal">(opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formCliente.notas}
                      onChange={(e) => setFormCliente({ ...formCliente, notas: e.target.value })}
                      placeholder="Agrega anotaciones o detalles relevantes del cliente..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Trámite Inicial y Checklist */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crearTramiteInicial}
                      onChange={(e) => setCrearTramiteInicial(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {editingClienteId ? 'Agregar o Cambiar Trámite / Checklist' : 'Asignar Trámite Inicial y Checklist de Documentos'}
                    </span>
                  </label>
                </div>

                {crearTramiteInicial && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    {/* Selector de Tipo de Trámite */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoTramiteInicial('retiro_desempleo')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tipoTramiteInicial === 'retiro_desempleo'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        Retiro Desempleo
                      </button>

                      <button
                        type="button"
                        onClick={() => setTipoTramiteInicial('mejoravit')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tipoTramiteInicial === 'mejoravit'
                            ? 'bg-red-600 text-white border-red-600 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        Mejoravit Infonavit
                      </button>

                      <button
                        type="button"
                        onClick={() => setTipoTramiteInicial('alta_medica_imss')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tipoTramiteInicial === 'alta_medica_imss'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <HeartPulse className="w-4 h-4" />
                        Alta Médica IMSS
                      </button>
                    </div>

                    {/* Form Checklist RETIRO POR DESEMPLEO (Imagen 1) */}
                    {tipoTramiteInicial === 'retiro_desempleo' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Semanas Cotizadas</label>
                            <input
                              type="number"
                              value={formRetiro.semanas_cotizadas}
                              onChange={(e) => setFormRetiro({ ...formRetiro, semanas_cotizadas: e.target.value })}
                              placeholder="ej: 250"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Último Salario Registrado</label>
                            <input
                              type="number"
                              value={formRetiro.ultimo_salario_registrado}
                              onChange={(e) => setFormRetiro({ ...formRetiro, ultimo_salario_registrado: e.target.value })}
                              placeholder="$ 0.00"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formRetiro.validado_inactivo_imss}
                            onChange={(e) => setFormRetiro({ ...formRetiro, validado_inactivo_imss: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Validaste que se encuentra INACTIVO ante el IMSS
                          </span>
                        </label>

                        {/* Checklist Documentación Escaneada a Color */}
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                            Documentación (Escaneada a color):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_ine_vigente}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_ine_vigente: e.target.checked })}
                              />
                              <span>INE vigente</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_app_aforemovil_instalada}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_app_aforemovil_instalada: e.target.checked })}
                              />
                              <span>App AforeMóvil instalada</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_comprobante_domicilio}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_comprobante_domicilio: e.target.checked })}
                              />
                              <span>Comprobante de domicilio</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_registro_aforemovil_realizado}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_registro_aforemovil_realizado: e.target.checked })}
                              />
                              <span>Registro en AforeMóvil realizado</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_curp}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_curp: e.target.checked })}
                              />
                              <span>CURP</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_saldo_visible_aforemovil}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_saldo_visible_aforemovil: e.target.checked })}
                              />
                              <span>Saldo visible en AforeMóvil</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_constancia_situacion_fiscal}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_constancia_situacion_fiscal: e.target.checked })}
                              />
                              <span>Constancia de Situación Fiscal</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_anexo_sindo}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_anexo_sindo: e.target.checked })}
                              />
                              <span>Si tiene semanas descontadas: ANEXAR SINDO</span>
                            </label>
                            <label className="flex items-center gap-2 sm:col-span-2">
                              <input
                                type="checkbox"
                                checked={formRetiro.req_reporte_semanas_imss}
                                onChange={(e) => setFormRetiro({ ...formRetiro, req_reporte_semanas_imss: e.target.checked })}
                              />
                              <span>Semanas cotizadas (Reporte del IMSS)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Checklist MEJORAVIT (10 Puntos Imagen 2) */}
                    {tipoTramiteInicial === 'mejoravit' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                            Lista de 10 Documentos Requeridos:
                          </p>

                          <div className="space-y-2 text-xs">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_ine_normal}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_ine_normal: e.target.checked })}
                              />
                              <span><strong>1. INE Normal:</strong> Frente y reverso</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_ine_ampliada_200}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_ine_ampliada_200: e.target.checked })}
                              />
                              <span><strong>2. INE Ampliada al 200%:</strong> Frente y reverso</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_curp_actualizada}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_curp_actualizada: e.target.checked })}
                              />
                              <span><strong>3. CURP Actualizada</strong></span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_acta_nacimiento}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_acta_nacimiento: e.target.checked })}
                              />
                              <span><strong>4. Acta de Nacimiento</strong></span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_comprobante_domicilio}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_comprobante_domicilio: e.target.checked })}
                              />
                              <span><strong>5. Comprobante de Domicilio (Último mes):</strong> Descargado de app/portal</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_estado_cuenta_bancario}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_estado_cuenta_bancario: e.target.checked })}
                              />
                              <span><strong>6. Estado de Cuenta Bancario (Último mes):</strong> Sin abreviaturas</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_constancia_situacion_fiscal}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_constancia_situacion_fiscal: e.target.checked })}
                              />
                              <span><strong>7. Constancia de Situación Fiscal (SAT)</strong></span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_3_referencias_personales}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_3_referencias_personales: e.target.checked })}
                              />
                              <span><strong>8. 3 Referencias Personales:</strong> Nombre, teléfono y última con parentesco</span>
                            </label>

                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formMejoravit.req_portal_infonavit_validado}
                                  onChange={(e) => setFormMejoravit({ ...formMejoravit, req_portal_infonavit_validado: e.target.checked })}
                                />
                                <span><strong>9. Acceso al Portal Infonavit:</strong></span>
                              </label>
                              <div className="grid grid-cols-2 gap-2 pl-6">
                                <input
                                  type="text"
                                  value={formMejoravit.password_portal_infonavit}
                                  onChange={(e) => setFormMejoravit({ ...formMejoravit, password_portal_infonavit: e.target.value })}
                                  placeholder="Contraseña Portal Infonavit"
                                  className="w-full px-2 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formMejoravit.req_fotos_inmueble_5}
                                onChange={(e) => setFormMejoravit({ ...formMejoravit, req_fotos_inmueble_5: e.target.checked })}
                              />
                              <span><strong>10. Fotografías del Inmueble:</strong> 5 fotos (3 interiores / 2 exteriores)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Checklist Alta Médica IMSS */}
                    {tipoTramiteInicial === 'alta_medica_imss' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Clínica / UMF Asignada</label>
                            <input
                              type="text"
                              value={formAltaMedica.clinica_umf_asignada}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, clinica_umf_asignada: e.target.value })}
                              placeholder="ej: UMF No. 34"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno</label>
                            <select
                              value={formAltaMedica.turno_preferido}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, turno_preferido: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                            >
                              <option value="Matutino">Matutino</option>
                              <option value="Vespertino">Vespertino</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formAltaMedica.req_curp_validada}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_curp_validada: e.target.checked })}
                            />
                            <span>CURP Validada ante RENAPO</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formAltaMedica.req_comprobante_domicilio_reciente}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_comprobante_domicilio_reciente: e.target.checked })}
                            />
                            <span>Comprobante de Domicilio no mayor a 3 meses</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formAltaMedica.req_identificacion_oficial}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_identificacion_oficial: e.target.checked })}
                            />
                            <span>Identificación Oficial Vigente</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formAltaMedica.req_cartilla_nacional_salud}
                              onChange={(e) => setFormAltaMedica({ ...formAltaMedica, req_cartilla_nacional_salud: e.target.checked })}
                            />
                            <span>Cartilla Nacional de Salud</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Guardar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Registrar Cliente & Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay Global de Arrastre de PDF (Drag & Drop desde la barra de descargas) */}
      {isDraggingPdf && (
        <div className="fixed inset-0 z-50 bg-blue-900/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-4 border-dashed border-emerald-400 text-white pointer-events-none transition-all">
          <div className="p-6 bg-slate-900/90 border border-emerald-500/40 rounded-3xl backdrop-blur-md flex flex-col items-center text-center max-w-md shadow-2xl animate-pulse">
            <Upload className="w-16 h-16 mb-3 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-bold text-white">Suelta la Constancia de CURP aquí</h3>
            <p className="text-xs text-slate-300 mt-2">
              Se guardará automáticamente en el Storage y se anexará al expediente de{' '}
              <strong>{selectedCliente?.nombre || 'este cliente'}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Modal Visualizador de Documentos Inline (Misma Página) */}
      {modalViewerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Visualizador: {modalViewerDoc.title}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInline(modalViewerDoc.url, modalViewerDoc.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalViewerDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-2">
              {modalViewerDoc.url.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/) || !modalViewerDoc.url.toLowerCase().includes('.pdf') ? (
                <img src={modalViewerDoc.url} alt={modalViewerDoc.title} className="max-h-full max-w-full object-contain rounded-lg" />
              ) : (
                <iframe src={modalViewerDoc.url} title={modalViewerDoc.title} className="w-full h-full rounded-lg border-0" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Fotos Inmueble (5) - Carga, Reordenación y Generación de PDF */}
      {inmuebleFotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  Fotografías del Inmueble (Hasta 5 Imágenes)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  El sistema empaquetará las imágenes en un PDF oficial de 2 imágenes por hoja (ocupando la mitad de cada hoja).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInmuebleFotosModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Acciones Globales */}
            <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Imágenes cargadas: <strong className="text-indigo-600 dark:text-indigo-400">{inmuebleFotosModal.fotos.length} / 5</strong>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Reemplazar / Agregar todas */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{inmuebleFotosModal.fotos.length > 0 ? 'Cambiar Todas las Fotos' : 'Cargar Fotos (Selección múltiple)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      if (files.length === 0) return;
                      const promises = files.map((f) => {
                        return new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => resolve(ev.target?.result as string);
                          reader.readAsDataURL(f);
                        });
                      });
                      Promise.all(promises).then((dataUrls) => {
                        setInmuebleFotosModal({
                          ...inmuebleFotosModal,
                          fotos: dataUrls,
                        });
                      });
                    }}
                  />
                </label>

                {inmuebleFotosModal.fotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInmuebleFotosModal({ ...inmuebleFotosModal, fotos: [] })}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Vaciar Lista
                  </button>
                )}
              </div>
            </div>

            {/* Grid de 5 Fotos con Miniaturas, Reordenación y Cambiar Individual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4].map((idx) => {
                const fotoSrc = inmuebleFotosModal.fotos[idx];
                const isInteriores = idx < 3;
                const slotLabel = isInteriores ? `Foto ${idx + 1} (Interior)` : `Foto ${idx + 1} (Exterior)`;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 relative transition-all ${
                      fotoSrc
                        ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>{slotLabel}</span>
                      {fotoSrc && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Posición {idx + 1}
                        </span>
                      )}
                    </div>

                    {fotoSrc ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-950 flex items-center justify-center group">
                        <img src={fotoSrc} alt={`Foto ${idx + 1}`} className="object-contain h-36 w-full" />
                      </div>
                    ) : (
                      <div className="h-36 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs space-y-1">
                        <Camera className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                        <span className="text-[11px]">Sin foto {idx + 1}</span>
                      </div>
                    )}

                    {/* Controles por ranura: Mover a la izquierda/derecha y Cambiar foto individual */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-1">
                        {/* Mover Izquierda / Arriba */}
                        <button
                          type="button"
                          disabled={!fotoSrc || idx === 0}
                          onClick={() => {
                            const newFotos = [...inmuebleFotosModal.fotos];
                            const temp = newFotos[idx];
                            newFotos[idx] = newFotos[idx - 1];
                            newFotos[idx - 1] = temp;
                            setInmuebleFotosModal({ ...inmuebleFotosModal, fotos: newFotos });
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Mover foto a la posición anterior"
                        >
                          ←
                        </button>
                        {/* Mover Derecha / Abajo */}
                        <button
                          type="button"
                          disabled={!fotoSrc || idx === inmuebleFotosModal.fotos.length - 1}
                          onClick={() => {
                            const newFotos = [...inmuebleFotosModal.fotos];
                            const temp = newFotos[idx];
                            newFotos[idx] = newFotos[idx + 1];
                            newFotos[idx + 1] = temp;
                            setInmuebleFotosModal({ ...inmuebleFotosModal, fotos: newFotos });
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Mover foto a la posición siguiente"
                        >
                          →
                        </button>
                      </div>

                      {/* Cambiar foto individual */}
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-3 h-3 text-indigo-500" />
                        <span>{fotoSrc ? 'Cambiar' : 'Subir'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const newFotos = [...inmuebleFotosModal.fotos];
                                newFotos[idx] = ev.target?.result as string;
                                setInmuebleFotosModal({ ...inmuebleFotosModal, fotos: newFotos });
                              };
                              reader.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones de Confirmación y Generación de PDF */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInmuebleFotosModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingFotosPdf || inmuebleFotosModal.fotos.filter(Boolean).length === 0}
                onClick={async () => {
                  if (!inmuebleFotosModal || !selectedCliente) return;
                  const validFotos = inmuebleFotosModal.fotos.filter(Boolean);
                  if (validFotos.length === 0) {
                    alert('Debes seleccionar al menos 1 foto.');
                    return;
                  }

                  setSavingFotosPdf(true);
                  try {
                    // Generar PDF con 2 imagenes por hoja
                    const pdfFile = await generateInmuebleFotosPdf(validFotos, `fotos_inmueble_${selectedCliente.id}.pdf`);
                    
                    // Subir PDF al Storage y actualizar la base de datos
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingFotosPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando PDF y Guardando...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generar PDF (2 Fotos por Hoja) & Guardar en Expediente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Marcado Manual de 4 Puntos INE (Frontal y Trasera) */}
      {manualIneCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 my-6 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                  <span>
                    Marcar 4 Puntos de la INE ({manualIneCropModal.step === 'frente' ? '1. Cara FRONTAL' : '2. Cara TRASERA'})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Haz clic en las 4 esquinas de la cara en orden: Top-Left (arriba izq), Top-Right (arriba der), Bottom-Right (abajo der), Bottom-Left (abajo izq).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualIneCropModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de progreso de los 4 puntos */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                  Puntos marcados ({manualIneCropModal.step === 'frente' ? 'Frontal' : 'Trasera'}):
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {manualIneCropModal.step === 'frente' ? manualIneCropModal.frentePoints.length : manualIneCropModal.reversoPoints.length} / 4
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (manualIneCropModal.step === 'frente') {
                      setManualIneCropModal({ ...manualIneCropModal, frentePoints: [] });
                    } else {
                      setManualIneCropModal({ ...manualIneCropModal, reversoPoints: [] });
                    }
                  }}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Reiniciar Puntos
                </button>
                {manualIneCropModal.step === 'reverso' && (
                  <button
                    type="button"
                    onClick={() => setManualIneCropModal({ ...manualIneCropModal, step: 'frente' })}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    ← Volver a Frontal
                  </button>
                )}
              </div>
            </div>

            {/* Contenedor Canvas Interactivo con Marcado de Puntos */}
            <div className="flex-1 bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center p-2 min-h-[420px]">
              <ManualPointsCanvas
                imageUrl={manualIneCropModal.imageUrl}
                points={manualIneCropModal.step === 'frente' ? manualIneCropModal.frentePoints : manualIneCropModal.reversoPoints}
                onPointsChange={(updatedPts) => {
                  if (manualIneCropModal.step === 'frente') {
                    setManualIneCropModal({ ...manualIneCropModal, frentePoints: updatedPts });
                  } else {
                    setManualIneCropModal({ ...manualIneCropModal, reversoPoints: updatedPts });
                  }
                }}
              />
            </div>

            {/* Botones de Paso / Confirmación */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setManualIneCropModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              {manualIneCropModal.step === 'frente' ? (
                <button
                  type="button"
                  disabled={manualIneCropModal.frentePoints.length < 4}
                  onClick={() => setManualIneCropModal({ ...manualIneCropModal, step: 'reverso' })}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-40 transition-all cursor-pointer"
                >
                  Siguiente: Marcar 4 Puntos de la Trasera →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={manualIneCropModal.reversoPoints.length < 4 || processingManualCrop}
                  onClick={async () => {
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {processingManualCrop ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generando INE Ampliada al 200%...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar INE Ampliada al 200% con Puntos Marcados</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Captura de Credenciales Infonavit (NSS y Contraseña) */}
      {infonavitCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-red-600" />
                  <span>Credenciales del Portal Infonavit</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingresa el Número de Seguro Social (NSS) y Contraseña del cliente para validar el portal de Infonavit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfonavitCredsModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
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
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Seguro Social (NSS) *
                </label>
                <input
                  type="text"
                  required
                  value={infonavitCredsModal.nss}
                  onChange={(e) => setInfonavitCredsModal({ ...infonavitCredsModal, nss: e.target.value })}
                  placeholder="ej: 12345678901"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Portal Mi Cuenta Infonavit *
                </label>
                <input
                  type="text"
                  required
                  value={infonavitCredsModal.password}
                  onChange={(e) => setInfonavitCredsModal({ ...infonavitCredsModal, password: e.target.value })}
                  placeholder="Ingresa la contraseña del portal..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInfonavitCredsModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingInfonavitCreds}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingInfonavitCreds ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Credenciales</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generar Link de Documento Especial para Cliente */}
      {clientDocModal && clientDocModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-purple-600" />
                  <span>Enlace para Documento de Cliente</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparte este link con el cliente para que rellene: <strong>{clientDocModal.presetName}</strong>
                </p>
              </div>
              <button
                onClick={() => setClientDocModal(null)}
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
                  value={clientDocModal.linkUrl}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(clientDocModal.linkUrl);
                    setClientDocModal({ ...clientDocModal, copied: true });
                    setTimeout(() => {
                      if (clientDocModal) setClientDocModal({ ...clientDocModal, copied: false });
                    }, 2500);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  {clientDocModal.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{clientDocModal.copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <span className="text-purple-900 dark:text-purple-200 font-medium">
                  Cliente: <strong>{clientDocModal.clienteNombre}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleShareDocLinkWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setClientDocModal(null)}
                className="px-5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente Canvas Interactivo para arrastrar (Drag & Drop) los 4 puntos de ajuste
 */
function ManualPointsCanvas({
  imageUrl,
  points,
  onPointsChange,
}: {
  imageUrl: string;
  points: { x: number; y: number }[];
  onPointsChange: (pts: { x: number; y: number }[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialPointsOnDrag, setInitialPointsOnDrag] = useState<{ x: number; y: number }[] | null>(null);

  useEffect(() => {
    const isPdf = imageUrl.toLowerCase().includes('.pdf');
    if (isPdf) {
      import('pdfjs-dist').then(async (pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const resp = await fetch(imageUrl);
        const buffer = await resp.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const c = document.createElement('canvas');
        c.width = viewport.width;
        c.height = viewport.height;
        const ctx = c.getContext('2d')!;
        await (page as any).render({ canvasContext: ctx, canvas: c, viewport }).promise;
        const img = new Image();
        img.src = c.toDataURL();
        img.onload = () => setImgObj(img);
      });
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => setImgObj(img);
    }
  }, [imageUrl]);

  // Calcular el centro de los 4 puntos
  const getCenterPoint = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length < 4) return { x: 0, y: 0 };
    const avgX = Math.round((pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4);
    const avgY = Math.round((pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4);
    return { x: avgX, y: avgY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgObj.naturalWidth || imgObj.width;
    canvas.height = imgObj.naturalHeight || imgObj.height;

    ctx.drawImage(imgObj, 0, 0);

    // Dibujar polígono entre puntos
    if (points && points.length === 4) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 250));
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const pointNames = ['1 (Top-Left)', '2 (Top-Right)', '3 (Bottom-Right)', '4 (Bottom-Left)'];

      // Dibujar los 4 puntos de las esquinas
      points.forEach((pt, idx) => {
        const radius = Math.max(10, Math.round(canvas.width / 120));
        ctx.fillStyle = activePointIndex === idx ? '#F59E0B' : '#EF4444';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(2, Math.round(canvas.width / 300));
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(13, Math.round(canvas.width / 65))}px sans-serif`;
        ctx.fillText(pointNames[idx], pt.x + radius + 4, pt.y + 4);
      });

      // Dibujar Tirador Central (Mover Todo)
      const center = getCenterPoint(points);
      const centerRadius = Math.max(14, Math.round(canvas.width / 90));
      ctx.fillStyle = activePointIndex === 99 ? '#10B981' : '#6366F1';
      ctx.beginPath();
      ctx.arc(center.x, center.y, centerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 250));
      ctx.stroke();

      // Cruz central en el punto para indicar movimiento global
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.x - centerRadius / 2, center.y);
      ctx.lineTo(center.x + centerRadius / 2, center.y);
      ctx.moveTo(center.x, center.y - centerRadius / 2);
      ctx.lineTo(center.x, center.y + centerRadius / 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(14, Math.round(canvas.width / 60))}px sans-serif`;
      ctx.fillText('❖ Mover Cuadro Completo', center.x + centerRadius + 6, center.y + 5);
    }
  }, [imgObj, points, activePointIndex]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !points || points.length < 4) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const canvasW = canvasRef.current.width;
    const clickThreshold = Math.max(30, Math.round(canvasW / 30));

    // 1. Probar si se hizo clic en el Tirador Central (Mover Todo)
    const center = getCenterPoint(points);
    const centerDist = Math.hypot(center.x - x, center.y - y);
    if (centerDist < clickThreshold * 1.5) {
      setActivePointIndex(99); // 99 es el código para Mover Todo
      setDragStartPos({ x, y });
      setInitialPointsOnDrag([...points]);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2. Probar si se hizo clic en alguna de las 4 esquinas
    let foundIdx: number | null = null;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.hypot(pt.x - x, pt.y - y);
      if (dist < clickThreshold && dist < minDist) {
        minDist = dist;
        foundIdx = idx;
      }
    });

    if (foundIdx !== null) {
      setActivePointIndex(foundIdx);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex === null || !points) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Mover todo el cuadro
    if (activePointIndex === 99 && dragStartPos && initialPointsOnDrag) {
      const deltaX = x - dragStartPos.x;
      const deltaY = y - dragStartPos.y;

      const updated = initialPointsOnDrag.map((pt) => ({
        x: pt.x + deltaX,
        y: pt.y + deltaY,
      }));
      onPointsChange(updated);
      return;
    }

    // Mover una esquina individual
    const updated = [...points];
    updated[activePointIndex] = { x, y };
    onPointsChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex !== null) {
      setActivePointIndex(null);
      setDragStartPos(null);
      setInitialPointsOnDrag(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="max-h-[70vh] max-w-full object-contain cursor-grab active:cursor-grabbing rounded-lg shadow-xl touch-none"
    />
  );
}

