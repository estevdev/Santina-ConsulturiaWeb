'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/auth';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import {
  Users,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  X,
  Mail,
  User as UserIcon,
  RefreshCw,
  Sparkles,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

const ROLE_INFO: Record<Role, { label: string; badgeClass: string; icon: any; description: string }> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: ShieldCheck,
    description: 'Acceso total a clientes, plantillas, reportes y gestión de usuarios',
  },
  socios: {
    label: 'Socio / Asesor',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Briefcase,
    description: 'Gestión de clientes, expedientes, checklist de trámites y PDF Studio',
  },
  cliente: {
    label: 'Cliente',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: UserCheck,
    description: 'Acceso únicamente a la consulta y llenado de sus documentos propios',
  },
};

export default function UsuariosView() {
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Form State (Crear / Editar)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('socios');
  const [formPassword, setFormPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Password Change Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Intentar consulta directa con el cliente Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data as UserProfile[]);
      } else {
        // Fallback a API route si hay alguna restricción
        const res = await fetch('/api/admin/usuarios');
        const apiData = await res.json();
        if (res.ok && apiData.profiles) {
          setProfiles(apiData.profiles);
        } else {
          toast.error('Error al cargar usuarios', { description: apiData.error || error?.message });
        }
      }
    } catch (err: any) {
      console.error('Error al obtener lista de usuarios:', err);
      toast.error('Error de conexión', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Suscripción a cambios en tiempo real en la tabla profiles
    const channel = supabase
      .channel('realtime:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrado y búsqueda
  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      const cleanSearch = search.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        (p.name && p.name.toLowerCase().includes(cleanSearch)) ||
        p.email.toLowerCase().includes(cleanSearch);
      return matchesRole && matchesSearch;
    });
  }, [profiles, roleFilter, search]);

  // Contadores
  const counts = useMemo(() => {
    return {
      total: profiles.length,
      admin: profiles.filter((p) => p.role === 'admin').length,
      socios: profiles.filter((p) => p.role === 'socios').length,
      cliente: profiles.filter((p) => p.role === 'cliente').length,
    };
  }, [profiles]);

  // Generador de Contraseñas Seguras
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Manejador de Cambio Rápido de Rol
  const handleQuickRoleChange = async (userId: string, newRole: Role) => {
    const userToUpdate = profiles.find((p) => p.id === userId);
    if (!userToUpdate) return;

    if (userToUpdate.id === currentUser?.id && newRole !== 'admin') {
      const confirmSelf = window.confirm(
        '⚠️ ¿Estás seguro de quitarte el rol de Administrador a ti mismo? Podrías perder acceso a este panel.'
      );
      if (!confirmSelf) return;
    }

    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
        );
        toast.success(`Rol actualizado: ${ROLE_INFO[newRole].label}`, {
          description: `Se asignó el rol a "${userToUpdate.name || userToUpdate.email}".`,
        });
      } else {
        toast.error('Error al actualizar rol', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Error de conexión', { description: err.message });
    }
  };

  // Abrir Modal de Edición
  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormName(u.name || '');
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword('');
  };

  // Abrir Modal de Cambio de Contraseña
  const openPasswordModal = (u: UserProfile) => {
    setChangingPasswordUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsCopiedPassword(false);
  };

  // Manejador para Guardar (Crear o Editar)
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formEmail.includes('@')) {
      toast.error('Ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const res = await fetch('/api/admin/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            name: formName,
            email: formEmail,
            role: formRole,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setProfiles((prev) =>
            prev.map((p) =>
              p.id === editingUser.id
                ? { ...p, name: formName, email: formEmail, role: formRole }
                : p
            )
          );
          toast.success('Usuario actualizado', {
            description: `Se guardaron los datos de "${formName || formEmail}".`,
          });
          setEditingUser(null);
        } else {
          toast.error('Error al actualizar', { description: data.error });
        }
      } else {
        // Crear nuevo usuario
        if (!formPassword || formPassword.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            role: formRole,
            password: formPassword,
          }),
        });
        const data = await res.json();

        if (res.ok && data.profile) {
          setProfiles((prev) => [data.profile, ...prev]);
          toast.success('Usuario registrado', {
            description: `Se creó la cuenta para "${formName || formEmail}".`,
          });
          setIsCreateModalOpen(false);
          setFormName('');
          setFormEmail('');
          setFormPassword('');
          setFormRole('socios');
        } else {
          toast.error('Error al registrar usuario', { description: data.error });
        }
      }
    } catch (err: any) {
      toast.error('Error al procesar solicitud', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador para Cambiar Contraseña
  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: changingPasswordUser.id,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Contraseña actualizada exitosamente', {
          description: `Se cambió la contraseña de acceso para "${changingPasswordUser.name || changingPasswordUser.email}".`,
        });
        setChangingPasswordUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Error al actualizar contraseña', {
          description: data.error || 'No se pudo actualizar la contraseña.',
        });
      }
    } catch (err: any) {
      toast.error('Error de red al actualizar contraseña', { description: err.message });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Manejador para Eliminar Usuario
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      toast.error('No puedes eliminar tu propia cuenta de administrador.');
      setDeletingUser(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/usuarios?id=${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== deletingUser.id));
        toast.success('Usuario eliminado', {
          description: `Se removió el acceso y perfil de "${deletingUser.name || deletingUser.email}".`,
        });
        setDeletingUser(null);
      } else {
        toast.error('Error al eliminar usuario', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Error de red al eliminar', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Acceso Denegado si no es Administrador
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h2 className="text-xl font-bold text-white">Acceso Restringido a Administradores</h2>
          <p className="text-sm text-slate-400">
            Esta sección está reservada para usuarios con privilegios de Administrador. Si necesitas permisos adicionales, contacta al administrador del sistema.
          </p>
        </div>
        <a
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b08d4b] text-white text-xs font-semibold shadow-md transition-colors"
        >
          Volver al Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Encabezado Sub-Navbar */}
      <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#c5a059] text-white rounded-xl shadow-md shadow-amber-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Gestión de Usuarios
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administra accesos, contraseñas, roles y permisos para asesores, socios y administradores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:opacity-50"
            title="Recargar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormName('');
              setFormEmail('');
              setFormPassword('');
              setShowCreatePassword(false);
              setFormRole('socios');
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-amber-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-[#0d0e12] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Usuarios</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{counts.total}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white dark:bg-[#0d0e12] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Administradores</span>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">{counts.admin}</h3>
          </div>
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Socios / Asesores */}
        <div className="bg-white dark:bg-[#0d0e12] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Socios / Asesores</span>
            <h3 className="text-2xl font-bold text-blue-500 mt-1">{counts.socios}</h3>
          </div>
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-2xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white dark:bg-[#0d0e12] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Clientes</span>
            <h3 className="text-2xl font-bold text-emerald-500 mt-1">{counts.cliente}</h3>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filtros de Rol */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'admin'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admins ({counts.admin})</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('socios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'socios'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Socios ({counts.socios})</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('cliente')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'cliente'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Clientes ({counts.cliente})</span>
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista / Tabla de Usuarios */}
      <div className="bg-white dark:bg-[#0d0e12] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin" />
            <p className="text-xs text-slate-400">Cargando usuarios registrados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No se encontraron usuarios
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search ? 'Prueba con otros términos de búsqueda.' : 'Registra el primer usuario usando el botón superior.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 border-b border-slate-100 dark:border-zinc-800 font-medium">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Usuario</th>
                  <th className="py-3.5 px-4 font-semibold">Rol de Acceso</th>
                  <th className="py-3.5 px-4 font-semibold">Acciones</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Permisos</th>
                  <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Fecha de Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredUsers.map((u) => {
                  const roleConfig = ROLE_INFO[u.role] || ROLE_INFO.cliente;
                  const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
                  const initials = (u.name || u.email)
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Usuario Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-zinc-800 dark:to-zinc-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-zinc-700 shadow-2xs flex-shrink-0">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.name || u.email}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {u.name || 'Sin nombre asignado'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Selector Rápido de Rol */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={u.role}
                            onChange={(e) => handleQuickRoleChange(u.id, e.target.value as Role)}
                            className={`text-xs font-semibold py-1 pl-2.5 pr-7 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${roleConfig.badgeClass}`}
                          >
                            <option value="admin" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                              👑 Administrador
                            </option>
                            <option value="socios" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                              💼 Socio / Asesor
                            </option>
                            <option value="cliente" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                              👤 Cliente
                            </option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {/* Cambiar Contraseña */}
                          <button
                            type="button"
                            onClick={() => openPasswordModal(u)}
                            className="p-1.5 hover:bg-amber-500/15 dark:hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                            title="Cambiar contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Editar Usuario */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar Usuario */}
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            disabled={isCurrent}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Permisos Descripción */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs block truncate" title={roleConfig.description}>
                          {roleConfig.description}
                        </span>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Preconfigurado'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Invitar Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#c5a059]/20 text-[#c5a059]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Nuevo Usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Lic. Roberto Gómez"
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@santina.com"
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contraseña Inicial *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateStrongPassword();
                      setFormPassword(pwd);
                      setShowCreatePassword(true);
                      navigator.clipboard?.writeText(pwd);
                      toast.success('Contraseña generada y copiada al portapapeles');
                    }}
                    className="text-[11px] text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar aleatoria</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol y Nivel de Acceso *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('socios')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'socios'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <span className="text-xs block">Socio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'admin'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <span className="text-xs block">Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('cliente')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'cliente'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <span className="text-xs block">Cliente</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Registrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol y Nivel de Acceso
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('socios')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'socios'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <span className="text-xs block">Socio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'admin'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <span className="text-xs block">Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('cliente')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formRole === 'cliente'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <span className="text-xs block">Cliente</span>
                  </button>
                </div>
              </div>

              {/* Acciones Rápidas Complementarias */}
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingUser;
                    setEditingUser(null);
                    openPasswordModal(target);
                  }}
                  className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cambiar contraseña</span>
                </button>

                {editingUser.id !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = editingUser;
                      setEditingUser(null);
                      setDeletingUser(target);
                    }}
                    className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar usuario</span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {changingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cambiar Contraseña
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Establece una nueva clave de acceso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangingPasswordUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tarjeta Resumen del Usuario */}
            <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs shrink-0">
                  {(changingPasswordUser.name || changingPasswordUser.email).substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {changingPasswordUser.name || 'Sin nombre'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {changingPasswordUser.email}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${ROLE_INFO[changingPasswordUser.role]?.badgeClass}`}>
                {ROLE_INFO[changingPasswordUser.role]?.label}
              </span>
            </div>

            {/* Formulario de Contraseña */}
            <form onSubmit={handleSubmitChangePassword} className="space-y-3.5">
              {/* Botón de Generar Contraseña */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nueva Contraseña *
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateStrongPassword();
                    setNewPassword(generated);
                    setConfirmPassword(generated);
                    setShowNewPassword(true);
                    setShowConfirmPassword(true);
                    navigator.clipboard?.writeText(generated);
                    setIsCopiedPassword(true);
                    setTimeout(() => setIsCopiedPassword(false), 2500);
                    toast.success('Contraseña generada y copiada al portapapeles');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#c5a059] hover:underline font-medium cursor-pointer"
                >
                  {isCopiedPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copiada</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generar aleatoria</span>
                    </>
                  )}
                </button>
              </div>

              {/* Input Nueva Contraseña */}
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Input Confirmar Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className={`w-full bg-slate-50 dark:bg-zinc-800/80 border rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 dark:border-zinc-700 focus:ring-[#c5a059]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Las contraseñas no coinciden</span>
                  </p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangingPasswordUser(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPasswordSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Actualizar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Eliminar este Usuario?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta acción eliminará de forma permanente el acceso al sistema y la cuenta de:
              </p>
            </div>

            {/* Ficha del usuario a eliminar */}
            <div className="bg-slate-50 dark:bg-zinc-800/70 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {deletingUser.name || 'Sin nombre'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {deletingUser.email}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${ROLE_INFO[deletingUser.role]?.badgeClass}`}>
                {ROLE_INFO[deletingUser.role]?.label}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 text-center">
              ⚠️ Esta acción no se puede deshacer. Se removerán las sesiones activas y credenciales del usuario.
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
