'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquareText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Smartphone,
  Info,
  Clock,
  Layers,
  Power,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlantillaMensaje {
  id: string;
  nombre: string;
  descripcion_caso: string;
  categoria: string;
  canal: string;
  mensaje: string;
  activo: boolean;
  variables_disponibles: string[];
  updated_at?: string;
}

export default function MensajesAutomatizadosPage() {
  const [plantillas, setPlantillas] = useState<PlantillaMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'todos' | 'estado_cliente' | 'acceso_portal' | 'documentos'>('todos');

  // Modal de edición y simulador
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaMensaje | null>(null);
  const [editedMensaje, setEditedMensaje] = useState('');
  const [editedActivo, setEditedActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal / panel de prueba de envío
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingPlantilla, setTestingPlantilla] = useState<PlantillaMensaje | null>(null);
  const [testPhone, setTestPhone] = useState('7811041608');
  const [sendingTest, setSendingTest] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar plantillas desde el servidor
  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/configuracion/mensajes');
      const data = await res.json();
      if (data.plantillas) {
        setPlantillas(data.plantillas);
      }
    } catch (err: any) {
      console.error('Error cargando plantillas:', err);
      toast.error('Error al cargar plantillas de mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantillas();
  }, []);

  // Abrir modal de edición
  const handleOpenEdit = (p: PlantillaMensaje) => {
    setSelectedPlantilla(p);
    setEditedMensaje(p.mensaje);
    setEditedActivo(p.activo);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setSelectedPlantilla(null);
  };

  // Insertar variable en el cursor del textarea
  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) {
      setEditedMensaje((prev) => prev + ` ${variable}`);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = editedMensaje;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setEditedMensaje(before + variable + after);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 50);
  };

  // Guardar cambios en la plantilla
  const handleSavePlantilla = async () => {
    if (!selectedPlantilla) return;
    try {
      setSaving(true);
      const res = await fetch('/api/configuracion/mensajes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlantilla.id,
          mensaje: editedMensaje,
          activo: editedActivo,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al guardar la plantilla');
      }

      toast.success('Plantilla guardada correctamente', {
        description: `Los cambios para "${selectedPlantilla.nombre}" ya están activos.`,
      });

      // Actualizar estado local
      setPlantillas((prev) =>
        prev.map((item) => (item.id === selectedPlantilla.id ? { ...item, mensaje: editedMensaje, activo: editedActivo } : item))
      );

      handleCloseEdit();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      toast.error('No se pudo guardar la plantilla', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Toggle rápido de activar/desactivar directamente en la tarjeta
  const handleToggleActivo = async (p: PlantillaMensaje, e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevoEstado = !p.activo;

    // Actualización optimista
    setPlantillas((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, activo: nuevoEstado } : item))
    );

    try {
      const res = await fetch('/api/configuracion/mensajes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          activo: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error);
      }
      toast.success(nuevoEstado ? 'Mensaje activado' : 'Mensaje pausado', {
        description: `"${p.nombre}" ${nuevoEstado ? 'se enviará automáticamente.' : 'ya no se enviará automáticamente.'}`,
      });
    } catch (err: any) {
      // Revertir en caso de error
      setPlantillas((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, activo: p.activo } : item))
      );
      toast.error('Error al cambiar estatus', { description: err.message });
    }
  };

  // Abrir modal de prueba
  const handleOpenTest = (p: PlantillaMensaje, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingPlantilla(p);
    setTestModalOpen(true);
  };

  // Enviar mensaje de prueba real
  const handleSendTestMessage = async () => {
    if (!testingPlantilla || !testPhone) {
      toast.warning('Ingresa un número telefónico para la prueba');
      return;
    }

    try {
      setSendingTest(true);
      const res = await fetch('/api/configuracion/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: testingPlantilla.id,
          telefonoPrueba: testPhone,
          mensajeCustom: selectedPlantilla?.id === testingPlantilla.id ? editedMensaje : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo en el envío de WhatsApp');
      }

      toast.success('¡WhatsApp de prueba enviado con éxito!', {
        description: `Entregado al número ${testPhone} (ID: ${data.messageId?.substring(0, 20)}...)`,
        duration: 5000,
      });
      setTestModalOpen(false);
    } catch (err: any) {
      console.error('Error enviando prueba:', err);
      toast.error('Error al enviar WhatsApp de prueba', {
        description: err.message,
        duration: 7000,
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Función para simular el reemplazo de variables en la vista previa de WhatsApp
  const renderSimulatedPreview = (text: string) => {
    return text
      .replace(/\{\{nombre\}\}/g, 'Daniel')
      .replace(/\{\{tramite\}\}/g, 'Crédito Mejoravit')
      .replace(/\{\{folio\}\}/g, 'FOL-7892')
      .replace(/\{\{estado\}\}/g, 'En Proceso')
      .replace(/\{\{observaciones\}\}/g, 'Documentación pendiente de validar')
      .replace(/\{\{nss\}\}/g, '12345678901')
      .replace(/\{\{enlace\}\}/g, 'https://santina.estev.dev/seguimiento?folio=FOL-7892')
      .replace(/\{\{documento\}\}/g, 'Contrato de Servicios');
  };

  // Formateador simple de WhatsApp (negritas *texto* a <b> y cursivas _texto_ a <i>)
  const formatWhatsAppTextToHtml = (raw: string) => {
    const safe = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Negritas *texto*
    let formatted = safe.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    // Cursivas _texto_
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  };

  // Filtrado de plantillas
  const filteredPlantillas = plantillas.filter((p) => {
    if (activeTab === 'todos') return true;
    return p.categoria === activeTab;
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Barra de Navegación Superior / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/configuracion"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200 transition-all cursor-pointer"
            title="Volver a Configuración Global"
          >
            <ArrowLeft className="w-4 h-4 text-[#c5a059]" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#dfba73]">
              <Link href="/dashboard/configuracion" className="hover:underline">
                Configuración Global
              </Link>
              <span>/</span>
              <span className="text-zinc-400">Mensajes Automatizados</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <MessageSquareText className="w-6 h-6 text-[#c5a059]" />
              <span>Mensajes Automatizados</span>
            </h1>
          </div>
        </div>

        {/* Indicador de WhatsApp Cloud API Conectado */}
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 rounded-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <p className="font-bold text-emerald-400 leading-none">WhatsApp Cloud API Conectada</p>
            <p className="text-[11px] text-zinc-400 leading-none mt-1">
              Phone ID: <span className="font-mono text-white">1311175445411360</span>
            </p>
          </div>
        </div>
      </div>

      {/* Banner Explicativo */}
      <div className="p-5 bg-gradient-to-r from-[#14151f] via-[#101118] to-[#14151f] rounded-3xl border border-[#c5a059]/30 shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-[#c5a059]/15 rounded-xl border border-[#c5a059]/30 text-[#dfba73] shrink-0">
            <Info className="w-5 h-5 text-[#c5a059]" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-white text-sm">
              Control y Personalización de Comunicaciones con el Cliente
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              En esta sección puedes revisar y editar los textos exactos de cada mensaje que se envía al cliente de manera automática. Cada tarjeta explica <strong>en qué caso específico se dispara</strong> el mensaje y te permite previsualizar y probar el envío en vivo a tu WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-[#c5a059] text-zinc-950 shadow-md'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Todos los Mensajes ({plantillas.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('estado_cliente')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'estado_cliente'
              ? 'bg-[#c5a059] text-zinc-950 shadow-md'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Estados del Trámite ({plantillas.filter((p) => p.categoria === 'estado_cliente').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('acceso_portal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'acceso_portal'
              ? 'bg-[#c5a059] text-zinc-950 shadow-md'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Acceso al Portal y Credenciales ({plantillas.filter((p) => p.categoria === 'acceso_portal').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documentos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'documentos'
              ? 'bg-[#c5a059] text-zinc-950 shadow-md'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Documentación ({plantillas.filter((p) => p.categoria === 'documentos').length})
        </button>
      </div>

      {/* Lista de Mensajes Automatizados */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">Cargando catálogo de mensajes automatizados...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPlantillas.map((plantilla) => {
            const previewText = renderSimulatedPreview(plantilla.mensaje);

            return (
              <div
                key={plantilla.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  plantilla.activo
                    ? 'bg-[#0d0e12] border-zinc-800 hover:border-[#c5a059]/50 shadow-sm'
                    : 'bg-[#0d0e12]/60 border-zinc-800/50 opacity-75'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {plantilla.nombre}
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        ID: <span className="font-mono text-[#c5a059]">{plantilla.id}</span>
                      </span>
                    </div>

                    {/* Switch de activación */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleActivo(plantilla, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        plantilla.activo
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                      title={plantilla.activo ? 'Clic para pausar envío automático' : 'Clic para activar envío'}
                    >
                      <Power className="w-3 h-3" />
                      <span>{plantilla.activo ? 'Activo' : 'Pausado'}</span>
                    </button>
                  </div>

                  {/* Bloque: ¿EN QUÉ CASO SE MANDA? */}
                  <div className="p-3 bg-[#13141d] rounded-2xl border border-[#c5a059]/25 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#dfba73]">
                      <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>¿Cuándo se envía este mensaje?</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {plantilla.descripcion_caso}
                    </p>
                  </div>

                  {/* Vista previa del mensaje */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Mensaje Actual (Plantilla):
                    </label>
                    <div className="p-3.5 bg-[#161722] rounded-2xl border border-zinc-800 text-xs text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                      {plantilla.mensaje}
                    </div>
                  </div>

                  {/* Variables disponibles */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                      Variables dinámicas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(plantilla.variables_disponibles || []).map((v) => (
                        <span
                          key={v}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800 text-amber-300 font-mono text-[11px] border border-zinc-700"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => handleOpenTest(plantilla, e)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer border border-zinc-700"
                    title="Enviar este mensaje como prueba a tu WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Probar Envío</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(plantilla)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#c5a059] hover:bg-[#d5b069] text-zinc-950 transition-all shadow-md cursor-pointer ml-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Mensaje</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN Y SIMULADOR DE WHATSAPP EN TIEMPO REAL                   */}
      {/* ========================================================================= */}
      {selectedPlantilla && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0d0e12] border border-[#c5a059]/40 rounded-3xl w-full max-w-4xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#c5a059]/15 text-[#dfba73] rounded-2xl border border-[#c5a059]/30">
                  <Edit3 className="w-5 h-5 text-[#c5a059]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Editar: {selectedPlantilla.nombre}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Modifica el texto y revisa en tiempo real cómo lo verá el cliente en su WhatsApp.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido en 2 columnas: Editor y Simulador */}
            <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Columna Izquierda: Editor */}
              <div className="space-y-4">
                <div className="p-3 bg-[#13141d] rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-[#dfba73] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Caso de Uso
                  </span>
                  <p className="text-xs text-zinc-300">
                    {selectedPlantilla.descripcion_caso}
                  </p>
                </div>

                {/* Barra de variables insertables */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-semibold">Haz clic para insertar variable:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedPlantilla.variables_disponibles || []).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-[#c5a059]/20 hover:text-[#dfba73] hover:border-[#c5a059]/40 text-amber-300 text-xs font-mono rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                        title={`Insertar ${v}`}
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea del mensaje */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Texto del Mensaje:</span>
                    <span className="text-[11px] font-normal text-zinc-400">
                      Usa *texto* para negrita y _texto_ para cursiva
                    </span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={editedMensaje}
                    onChange={(e) => setEditedMensaje(e.target.value)}
                    className="w-full p-4 bg-[#14151f] text-xs font-mono text-zinc-200 rounded-2xl border border-zinc-700 focus:border-[#c5a059] focus:outline-none resize-none leading-relaxed"
                    placeholder="Escribe el mensaje aquí..."
                  />
                  <div className="flex justify-between items-center text-[11px] text-zinc-500">
                    <span>{editedMensaje.length} caracteres</span>
                    <span>Canal: WhatsApp Cloud API</span>
                  </div>
                </div>

                {/* Switch de activación en el modal */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                  <div className="text-xs">
                    <p className="font-bold text-white">Estado del Envío Automático</p>
                    <p className="text-[11px] text-zinc-400">Si está pausado, el sistema no mandará este mensaje.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditedActivo(!editedActivo)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editedActivo
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {editedActivo ? 'Activo' : 'Pausado'}
                  </button>
                </div>
              </div>

              {/* Columna Derecha: SIMULADOR DE WHATSAPP EN VIVO */}
              <div className="space-y-2 flex flex-col">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#c5a059]" />
                  Vista Previa en Vivo (Simulador WhatsApp)
                </span>

                {/* Teléfono simulado */}
                <div className="flex-1 bg-[#0b141a] rounded-3xl border border-zinc-700/80 overflow-hidden shadow-xl flex flex-col min-h-[380px]">
                  {/* Barra superior de WhatsApp */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-zinc-800 text-white">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-xs text-white shadow-sm">
                      S
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold truncate">Santina Consultoría</p>
                      <p className="text-[10px] text-[#00a884]">cuenta oficial de empresa</p>
                    </div>
                  </div>

                  {/* Cuerpo del chat */}
                  <div className="flex-1 p-4 bg-[#0b141a] bg-opacity-95 flex flex-col justify-end space-y-2 overflow-y-auto">
                    {/* Burbuja de mensaje */}
                    <div className="max-w-[90%] bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none shadow-md space-y-1 self-end text-xs leading-relaxed animate-in fade-in duration-100">
                      <div
                        className="prose-sm text-zinc-100 font-sans break-words"
                        dangerouslySetInnerHTML={{
                          __html: formatWhatsAppTextToHtml(renderSimulatedPreview(editedMensaje)),
                        }}
                      />
                      <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-300 pt-1">
                        <span>10:30 a. m.</span>
                        {/* Doble palomita azul */}
                        <div className="flex -space-x-1 text-[#53bdeb]">
                          <Check className="w-3 h-3" />
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra inferior simulada */}
                  <div className="bg-[#202c33] px-3 py-2 flex items-center text-zinc-400 text-xs">
                    <span className="text-[11px] text-zinc-500 italic">Mensaje generado automáticamente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-5 sm:p-6 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-900/40 rounded-b-3xl">
              <button
                type="button"
                onClick={() => handleOpenTest(selectedPlantilla)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Probar este texto en vivo</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSavePlantilla}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#9a7b38] via-[#c5a059] to-[#dfba73] text-zinc-950 hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA PROBAR ENVÍO REAL A UN TELÉFONO                               */}
      {/* ========================================================================= */}
      {testModalOpen && testingPlantilla && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-[#c5a059]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setTestModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-zinc-800 pb-4">
              <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Probar Envío por WhatsApp</h3>
                <p className="text-xs text-zinc-400">Verifica la entrega en tiempo real en tu teléfono</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#13141d] rounded-2xl border border-zinc-800 text-xs text-zinc-300">
                <span className="font-bold text-white block mb-0.5">Plantilla:</span>
                <span className="text-[#dfba73] font-medium">{testingPlantilla.nombre}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white">
                  Número de WhatsApp Receptor (10 dígitos en México):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                    +52
                  </span>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="7811041608"
                    className="w-full pl-12 pr-4 py-2.5 bg-[#14151f] text-sm font-mono text-white rounded-xl border border-zinc-700 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Se enviará a través de la cuenta oficial de WhatsApp Cloud API.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={handleSendTestMessage}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingTest ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{sendingTest ? 'Enviando...' : 'Enviar Mensaje Ahora'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
