'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Capacitacion,
  CreateCapacitacionInput,
} from '@/types/capacitacion';
import { createClient } from '@/utils/supabase/client';
import CapacitacionCard from './CapacitacionCard';
import CapacitacionPlayerModal from './CapacitacionPlayerModal';
import CapacitacionFormModal from './CapacitacionFormModal';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Video,
  FileText,
  ExternalLink,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CapacitacionesView() {
  const { user } = useAuth();
  const supabase = createClient();

  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [sortBy, setSortBy] = useState<'recientes' | 'alfabetico'>('recientes');

  // Modals state
  const [activePlayerCapacitacion, setActivePlayerCapacitacion] = useState<Capacitacion | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCapacitacion, setEditingCapacitacion] = useState<Capacitacion | null>(null);
  const [deletingCapacitacion, setDeletingCapacitacion] = useState<Capacitacion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'socios' || !user;

  // Load capacitaciones from Supabase
  const fetchCapacitaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('capacitaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar capacitaciones de Supabase:', error);
        toast.error('Error al cargar capacitaciones', { description: error.message });
        return;
      }

      setCapacitaciones((data as Capacitacion[]) || []);
    } catch (err: any) {
      console.error('Excepción al cargar capacitaciones:', err);
      toast.error('Error al obtener datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacitaciones();
  }, []);

  // Save / Update Capacitacion
  const handleSave = async (data: CreateCapacitacionInput, id?: string): Promise<boolean> => {
    try {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('capacitaciones')
          .update({
            titulo: data.titulo,
            descripcion: data.descripcion || null,
            categoria: data.categoria || 'General',
            duracion: data.duracion || null,
            video_url: data.video_url,
            video_tipo: data.video_tipo || 'url',
            archivos_adjuntos: data.archivos_adjuntos || [],
            links: data.links || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Capacitación actualizada correctamente');
      } else {
        // Create new
        const { error } = await supabase.from('capacitaciones').insert({
          titulo: data.titulo,
          descripcion: data.descripcion || null,
          categoria: data.categoria || 'General',
          duracion: data.duracion || null,
          video_url: data.video_url,
          video_tipo: data.video_tipo || 'url',
          archivos_adjuntos: data.archivos_adjuntos || [],
          links: data.links || [],
          creado_por: user?.id || null,
          creado_por_nombre: user?.name || user?.email || 'Admin',
        });

        if (error) throw error;
        toast.success('Capacitación creada exitosamente');
      }

      await fetchCapacitaciones();
      return true;
    } catch (err: any) {
      console.error('Error al guardar capacitación:', err);
      toast.error('Error al guardar capacitación', { description: err.message });
      return false;
    }
  };

  // Delete Capacitacion
  const handleDeleteConfirm = async () => {
    if (!deletingCapacitacion) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('capacitaciones')
        .delete()
        .eq('id', deletingCapacitacion.id);

      if (error) throw error;

      toast.success('Capacitación eliminada');
      setDeletingCapacitacion(null);
      await fetchCapacitaciones();
    } catch (err: any) {
      console.error('Error al eliminar capacitación:', err);
      toast.error('Error al eliminar capacitación', { description: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    capacitaciones.forEach((c) => {
      if (c.categoria?.trim()) set.add(c.categoria.trim());
    });
    return Array.from(set);
  }, [capacitaciones]);

  // Filtered & Sorted list
  const filteredCapacitaciones = useMemo(() => {
    return capacitaciones
      .filter((item) => {
        // Category filter
        if (selectedCategoria !== 'todas' && item.categoria !== selectedCategoria) {
          return false;
        }

        // Search query
        if (!search.trim()) return true;
        const q = search.toLowerCase();

        const matchTitle = item.titulo?.toLowerCase().includes(q);
        const matchDesc = item.descripcion?.toLowerCase().includes(q);
        const matchCat = item.categoria?.toLowerCase().includes(q);
        const matchAdjuntos = item.archivos_adjuntos?.some(
          (a) => a.nombre?.toLowerCase().includes(q) || a.nota?.toLowerCase().includes(q)
        );
        const matchLinks = item.links?.some(
          (l) => l.titulo?.toLowerCase().includes(q) || l.nota?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q)
        );

        return matchTitle || matchDesc || matchCat || matchAdjuntos || matchLinks;
      })
      .sort((a, b) => {
        if (sortBy === 'alfabetico') {
          return a.titulo.localeCompare(b.titulo);
        }
        // Recientes por defecto
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [capacitaciones, search, selectedCategoria, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalVideos = capacitaciones.length;
    const totalAdjuntos = capacitaciones.reduce(
      (acc, c) => acc + (c.archivos_adjuntos?.length || 0),
      0
    );
    const totalLinks = capacitaciones.reduce((acc, c) => acc + (c.links?.length || 0), 0);
    const totalConNotas = capacitaciones.filter(
      (c) =>
        c.archivos_adjuntos?.some((a) => !!a.nota?.trim()) ||
        c.links?.some((l) => !!l.nota?.trim())
    ).length;

    return { totalVideos, totalAdjuntos, totalLinks, totalConNotas };
  }, [capacitaciones]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Campus Digital Santina</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Capacitaciones y Formación
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Videos explicativos de procedimientos, manuales de trámites con notas aclaratorias,
              y enlaces a plataformas oficiales para el equipo de consultoría.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchCapacitaciones}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors disabled:opacity-50"
              title="Actualizar biblioteca"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {canManage && (
              <button
                onClick={() => {
                  setEditingCapacitacion(null);
                  setIsFormModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#c5a059] to-[#9a7b38] hover:from-[#d8b368] hover:to-[#b08e45] text-zinc-950 text-sm font-bold shadow-lg shadow-[#c5a059]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Capacitación</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#c5a059] shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stats.totalVideos}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Videos Activos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stats.totalAdjuntos}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Archivos Adjuntos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stats.totalLinks}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Enlaces Útiles</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stats.totalConNotas}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Recursos con Notas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción, notas o archivos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-white text-xs placeholder:text-zinc-500 outline-none transition-all"
          />
        </div>

        {/* Categories scroll / select */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategoria('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoria === 'todas'
                ? 'bg-[#c5a059] text-zinc-950 shadow-md shadow-[#c5a059]/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Todas ({capacitaciones.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoria === cat
                  ? 'bg-[#c5a059] text-zinc-950 shadow-md shadow-[#c5a059]/20'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500">Orden:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:border-[#c5a059] outline-none cursor-pointer"
          >
            <option value="recientes">Más recientes</option>
            <option value="alfabetico">Alfabético (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Capacitaciones */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#c5a059]" />
          <p className="text-xs font-medium">Cargando biblioteca de capacitaciones...</p>
        </div>
      ) : filteredCapacitaciones.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-[#c5a059]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No se encontraron capacitaciones</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {search || selectedCategoria !== 'todas'
                ? 'No hay capacitaciones que coincidan con los filtros aplicados. Intenta con otros términos.'
                : 'Aún no se han publicado capacitaciones. Puedes subir el primer video formativo con sus documentos y notas.'}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingCapacitacion(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a059] hover:bg-[#dfba73] text-zinc-950 text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Subir primera capacitación</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapacitaciones.map((item) => (
            <CapacitacionCard
              key={item.id}
              capacitacion={item}
              canManage={canManage}
              onPlay={(selected) => setActivePlayerCapacitacion(selected)}
              onEdit={(selected) => {
                setEditingCapacitacion(selected);
                setIsFormModalOpen(true);
              }}
              onDelete={(selected) => setDeletingCapacitacion(selected)}
            />
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <CapacitacionPlayerModal
        capacitacion={activePlayerCapacitacion}
        onClose={() => setActivePlayerCapacitacion(null)}
      />

      {/* Create / Edit Modal */}
      <CapacitacionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCapacitacion(null);
        }}
        onSave={handleSave}
        initialData={editingCapacitacion}
      />

      {/* Delete Confirmation Modal */}
      {deletingCapacitacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar capacitación?</h3>
                <p className="text-xs text-zinc-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
              Estás a punto de eliminar: <span className="font-bold text-white">{deletingCapacitacion.titulo}</span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingCapacitacion(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
