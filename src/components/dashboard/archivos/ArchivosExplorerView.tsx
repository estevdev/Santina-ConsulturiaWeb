'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ClientFolder, ArchivoItem, ArchivosExplorerStats } from '@/types/archivos';
import { ClientFolderCard } from './ClientFolderCard';
import { ArchivoItemCard } from './ArchivoItemCard';
import { ArchivoItemRow } from './ArchivoItemRow';
import { UploadFileModal } from './UploadFileModal';
import { PdfRemoteViewerModal, PdfViewerModalData } from './PdfRemoteViewerModal';
import {
  FolderArchive,
  Folder,
  FolderOpen,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  ShieldCheck,
  FileText,
  Upload,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Users,
  Copy,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  X,
  FileQuestion,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function ArchivosExplorerView() {
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientFolder[]>([]);
  const [stats, setStats] = useState<ArchivosExplorerStats>({
    totalClientes: 0,
    totalArchivos: 0,
    totalAnexados: 0,
    totalAdicionales: 0,
  });

  // Navigation state: null means root (all client folders)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Search & Filtering
  const [globalSearch, setGlobalSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState<'all' | 'anexados' | 'adicionales' | 'vacias'>('all');
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('all');
  const [insideFolderTab, setInsideFolderTab] = useState<'all' | 'anexados' | 'adicionales'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ArchivoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewerData, setViewerData] = useState<PdfViewerModalData | null>(null);

  // Cargar datos
  const fetchArchivos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/archivos');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener archivos');
      }

      setClients(data.clients || []);
      setStats(
        data.stats || {
          totalClientes: (data.clients || []).length,
          totalArchivos: 0,
          totalAnexados: 0,
          totalAdicionales: 0,
        }
      );
    } catch (err: any) {
      console.error('Error fetching archivos:', err);
      toast.error(err.message || 'Error al cargar el explorador de archivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchArchivos();
    }
  }, [user]);

  // Cliente actualmente seleccionado
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Filtrado de clientes para la vista raíz
  const filteredClients = useMemo(() => {
    let list = [...clients];
    const q = globalSearch.trim().toLowerCase();

    if (q) {
      list = list.filter((c) => {
        const matchesName = c.nombreCompleto.toLowerCase().includes(q);
        const matchesNss = c.nss && c.nss.toLowerCase().includes(q);
        const matchesCurp = c.curp && c.curp.toLowerCase().includes(q);
        const matchesFolio = c.folios.some((f) => f.toLowerCase().includes(q));
        const matchesPhone = c.telefono && c.telefono.toLowerCase().includes(q);
        const matchesEmail = c.email && c.email.toLowerCase().includes(q);
        // Búsqueda profunda en nombres de archivos del cliente
        const matchesFiles = c.archivos.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.displayName.toLowerCase().includes(q) ||
            (a.anexadoLabel && a.anexadoLabel.toLowerCase().includes(q))
        );

        return matchesName || matchesNss || matchesCurp || matchesFolio || matchesPhone || matchesEmail || matchesFiles;
      });
    }

    if (folderFilter === 'anexados') {
      list = list.filter((c) => c.totalAnexados > 0);
    } else if (folderFilter === 'adicionales') {
      list = list.filter((c) => c.totalAdicionales > 0);
    } else if (folderFilter === 'vacias') {
      list = list.filter((c) => c.totalArchivos === 0);
    }

    return list;
  }, [clients, globalSearch, folderFilter]);

  // Filtrado de archivos dentro del cliente seleccionado
  const filteredClientFiles = useMemo(() => {
    if (!selectedClient) return [];
    let files = [...selectedClient.archivos];
    const q = globalSearch.trim().toLowerCase();

    if (insideFolderTab === 'anexados') {
      files = files.filter((a) => a.isAnexado);
    } else if (insideFolderTab === 'adicionales') {
      files = files.filter((a) => !a.isAnexado);
    }

    if (selectedSubfolder !== 'all') {
      files = files.filter((a) => a.folder === selectedSubfolder);
    }

    if (q) {
      files = files.filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.displayName.toLowerCase().includes(q) ||
          (a.anexadoLabel && a.anexadoLabel.toLowerCase().includes(q)) ||
          a.folder.toLowerCase().includes(q) ||
          a.extension.toLowerCase().includes(q)
        );
      });
    }

    return files;
  }, [selectedClient, insideFolderTab, selectedSubfolder, globalSearch]);

  // Acción preview
  const handlePreview = (archivo: ArchivoItem) => {
    setViewerData({
      url: archivo.url,
      title: archivo.displayName || archivo.name,
      isPdf: archivo.isPdf,
      isImage: archivo.isImage,
      anexadoLabel: archivo.anexadoLabel,
      isAnexado: archivo.isAnexado,
    });
  };

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Acción eliminar archivo de almacenamiento
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/archivos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileToDelete.path }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar el archivo');
      }

      toast.success(`Archivo "${fileToDelete.name}" eliminado del almacenamiento.`);
      setFileToDelete(null);
      fetchArchivos();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast.error(err.message || 'Error al eliminar el archivo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Acceso restringido para administradores
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          El Explorador de Archivos es un módulo reservado exclusivamente para Administradores de Santina Consultoría.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#c5a059] text-slate-950 font-bold text-xs hover:bg-[#dfba73] transition-colors"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ======================================================== */}
      {/* 1. HEADER & KPI CARDS                                     */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c5a059]/20 to-[#c5a059]/5 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shadow-sm">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Explorador de Archivos
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30">
              Admin
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Navegador centralizado de expedientes y carpetas por cliente con distinción de anexados oficiales.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchArchivos}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#12141a] hover:bg-[#181b22] border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Refrescar archivos del almacenamiento"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c5a059]' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          {/* Toggle View Mode */}
          <div className="flex items-center p-0.5 bg-[#12141a] border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#c5a059] text-slate-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista en Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#c5a059] text-slate-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista en Lista / Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Clientes */}
        <div className="bg-[#12141a]/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Carpetas Clientes</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              {stats.totalClientes}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Archivos Totales */}
        <div className="bg-[#12141a]/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Archivos Totales</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              {stats.totalArchivos}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Anexados Oficiales */}
        <div className="bg-[#0f1715]/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span>Anexados Oficiales</span>
            </p>
            <h3 className="text-xl font-extrabold text-emerald-300 mt-0.5">
              {stats.totalAnexados}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Adicionales / Historial */}
        <div className="bg-[#12141a]/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Adicionales / Historial</p>
            <h3 className="text-xl font-extrabold text-zinc-300 mt-0.5">
              {stats.totalAdicionales}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
            <FileQuestion className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BREADCRUMB & NAVIGATION BAR                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141a] border border-zinc-800 rounded-2xl p-3.5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => {
              setSelectedClientId(null);
              setSelectedSubfolder('all');
              setInsideFolderTab('all');
            }}
            className={`inline-flex items-center gap-1.5 font-bold transition-colors cursor-pointer shrink-0 ${
              !selectedClientId ? 'text-[#c5a059]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Todos los Clientes</span>
          </button>

          {selectedClient && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <div className="inline-flex items-center gap-1.5 font-bold text-white shrink-0 bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                <FolderOpen className="w-4 h-4 text-[#c5a059]" />
                <span className="truncate max-w-[200px]">{selectedClient.nombreCompleto}</span>
                {selectedClient.folio && (
                  <span className="font-mono text-[10px] text-[#dfba73] bg-[#c5a059]/20 px-1.5 py-0.2 rounded border border-[#c5a059]/30">
                    {selectedClient.folio}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={
              selectedClient
                ? 'Buscar archivo en esta carpeta...'
                : 'Buscar por cliente, folio, NSS, CURP, archivo...'
            }
            className="w-full bg-[#161922] border border-zinc-800 text-zinc-200 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-[#c5a059] transition-colors placeholder:text-zinc-500"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VISTA DENTRO DE LA CARPETA DEL CLIENTE                */}
      {/* ======================================================== */}
      {selectedClient ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Back Button & Client Details Banner */}
          <div className="bg-[#12141a] border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId(null);
                    setSelectedSubfolder('all');
                    setInsideFolderTab('all');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Volver a todas las carpetas"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-base font-extrabold text-white">
                      {selectedClient.nombreCompleto}
                    </h2>
                    {selectedClient.folio && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/30">
                        Folio: {selectedClient.folio}
                      </span>
                    )}
                    {selectedClient.nss && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        NSS: {selectedClient.nss}
                      </span>
                    )}
                    {selectedClient.curp && (
                      <span className="font-mono text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
                        CURP: {selectedClient.curp}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    {selectedClient.telefono && <span>📞 {selectedClient.telefono}</span>}
                    {selectedClient.email && <span>✉️ {selectedClient.email}</span>}
                    {selectedClient.tramites.length > 0 && (
                      <span className="text-[#c5a059] font-medium">
                        Trámites: {selectedClient.tramites.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for this client */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/dashboard/clientes`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                  title="Ir al módulo de Clientes"
                >
                  <span>Ver en Clientes</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:from-[#d5b069] hover:to-[#ebc67f] text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Archivo a esta Carpeta</span>
                </button>
              </div>
            </div>

            {/* Quick stats inside this folder */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/80 text-center">
              <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/60">
                <p className="text-[10px] text-zinc-400 font-medium">Total de Archivos</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{selectedClient.totalArchivos}</p>
              </div>
              <div className="bg-emerald-950/25 rounded-xl p-2.5 border border-emerald-500/30">
                <p className="text-[10px] text-emerald-400 font-medium">✓ Anexados al Expediente</p>
                <p className="text-sm font-extrabold text-emerald-300 mt-0.5">{selectedClient.totalAnexados}</p>
              </div>
              <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/60">
                <p className="text-[10px] text-zinc-400 font-medium">Archivos Adicionales</p>
                <p className="text-sm font-extrabold text-zinc-300 mt-0.5">{selectedClient.totalAdicionales}</p>
              </div>
            </div>
          </div>

          {/* Filtering Tabs & Subfolder Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#12141a] border border-zinc-800 rounded-xl shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setInsideFolderTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  insideFolderTab === 'all'
                    ? 'bg-[#c5a059] text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({selectedClient.totalArchivos})
              </button>

              <button
                type="button"
                onClick={() => setInsideFolderTab('anexados')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  insideFolderTab === 'anexados'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anexados Oficiales ({selectedClient.totalAnexados})</span>
              </button>

              <button
                type="button"
                onClick={() => setInsideFolderTab('adicionales')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  insideFolderTab === 'adicionales'
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Adicionales / Historial ({selectedClient.totalAdicionales})
              </button>
            </div>

            {/* Subfolders selector if any exist */}
            {selectedClient.subfolders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Subcarpeta:</span>
                <select
                  value={selectedSubfolder}
                  onChange={(e) => setSelectedSubfolder(e.target.value)}
                  className="bg-[#12141a] border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="all">Todas las subcarpetas</option>
                  {selectedClient.subfolders.map((sf) => (
                    <option key={sf} value={sf}>
                      📁 {sf}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Render Files (Grid or List) */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
              <p className="text-xs text-zinc-400">Cargando archivos del cliente...</p>
            </div>
          ) : filteredClientFiles.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-[#12141a]/60 border border-zinc-800/80 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No se encontraron archivos</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                {globalSearch
                  ? `No hay archivos que coincidan con "${globalSearch}" en esta carpeta.`
                  : 'Esta carpeta aún no tiene archivos registrados o filtrados.'}
              </p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c5a059] text-slate-950 text-xs font-bold rounded-xl"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir el primer archivo</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredClientFiles.map((archivo) => (
                <ArchivoItemCard
                  key={archivo.id}
                  archivo={archivo}
                  onPreview={handlePreview}
                  onDelete={(a) => setFileToDelete(a)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Nombre del Archivo</th>
                      <th className="px-4 py-3">Estatus de Expediente</th>
                      <th className="px-4 py-3">Ubicación / Carpeta</th>
                      <th className="px-4 py-3">Tamaño</th>
                      <th className="px-4 py-3">Fecha de Subida</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientFiles.map((archivo) => (
                      <ArchivoItemRow
                        key={archivo.id}
                        archivo={archivo}
                        onPreview={handlePreview}
                        onDelete={(a) => setFileToDelete(a)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 4. VISTA RAÍZ: TODAS LAS CARPETAS DE CLIENTES            */
        /* ======================================================== */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFolderFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  folderFilter === 'all'
                    ? 'bg-[#c5a059] text-slate-950 shadow-sm'
                    : 'bg-[#12141a] border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todas las Carpetas ({clients.length})
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter('anexados')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  folderFilter === 'anexados'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-[#12141a] border border-zinc-800 text-emerald-400 hover:bg-emerald-950/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Con Archivos Anexados ({clients.filter((c) => c.totalAnexados > 0).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter('adicionales')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  folderFilter === 'adicionales'
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'bg-[#12141a] border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Con Archivos Adicionales ({clients.filter((c) => c.totalAdicionales > 0).length})
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter('vacias')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  folderFilter === 'vacias'
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'bg-[#12141a] border border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Sin Documentos ({clients.filter((c) => c.totalArchivos === 0).length})
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Mostrando <span className="text-zinc-200 font-bold">{filteredClients.length}</span> carpetas de clientes
            </p>
          </div>

          {/* Grid of Client Folders */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
              <p className="text-xs text-zinc-400">Escaneando carpetas de clientes en almacenamiento...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-[#12141a]/60 border border-zinc-800/80 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mb-3">
                <Folder className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No se encontraron carpetas</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                No hay clientes que coincidan con los criterios de búsqueda o filtros seleccionados.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <ClientFolderCard
                  key={client.id}
                  client={client}
                  onOpen={(c) => setSelectedClientId(c.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Carpeta / Nombre del Cliente</th>
                      <th className="px-4 py-3">Folio Principal</th>
                      <th className="px-4 py-3">NSS</th>
                      <th className="px-4 py-3">CURP</th>
                      <th className="px-4 py-3">Trámites</th>
                      <th className="px-4 py-3">Archivos</th>
                      <th className="px-4 py-3">Anexados</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] group-hover:bg-[#c5a059]/25 transition-colors">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-[#dfba73] transition-colors">
                                {client.nombreCompleto}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">{client.id.substring(0, 16)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {client.folio ? (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5a059]/20 text-[#dfba73] border border-[#c5a059]/30">
                              {client.folio}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-300">
                          {client.nss || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                          {client.curp || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {client.tramites.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-white">
                          {client.totalArchivos}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {client.totalAnexados > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{client.totalAnexados}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(client.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/30 text-[#dfba73] text-xs font-bold border border-[#c5a059]/30 transition-colors"
                          >
                            <span>Abrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODALES                                               */}
      {/* ======================================================== */}

      {/* Modal para Subir Archivo Adicional */}
      {selectedClient && (
        <UploadFileModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          clienteId={selectedClient.id}
          clienteNombre={selectedClient.nombreCompleto}
          subfolders={selectedClient.subfolders}
          onFileUploaded={fetchArchivos}
        />
      )}

      {/* Modal de Previsualización (PDF / Imagen) */}
      {viewerData && (
        <PdfRemoteViewerModal
          modalData={viewerData}
          onClose={() => setViewerData(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12141a] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-3.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              ¿Eliminar este archivo del almacenamiento?
            </h3>
            <p className="text-xs text-zinc-400 mb-2">
              Se eliminará permanentemente el archivo:
            </p>
            <p className="text-xs font-mono font-bold text-red-300 bg-red-950/30 border border-red-500/20 rounded-lg p-2 mb-5 truncate">
              {fileToDelete.name}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar Archivo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
