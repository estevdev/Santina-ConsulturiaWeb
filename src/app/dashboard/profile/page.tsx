'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Briefcase,
  UserCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  CheckCircle2,
  Loader2,
  Shield,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { Role } from '@/types/auth';

const ROLE_INFO: Record<Role, { label: string; badgeClass: string; icon: any; description: string }> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: ShieldCheck,
    description: 'Acceso total a clientes, plantillas, reportes y gestión de usuarios del sistema',
  },
  socios: {
    label: 'Socio / Asesor',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Briefcase,
    description: 'Gestión de sus propios clientes, expedientes, trámites y generación de PDF Studio',
  },
  cliente: {
    label: 'Cliente',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: UserCheck,
    description: 'Acceso a la consulta y llenado de sus documentos propios',
  },
};

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
];

export default function ProfilePage() {
  const { user, updateUserData } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de datos de usuario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Estados de cambio de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  // Cargar datos extendidos del perfil desde Supabase
  useEffect(() => {
    async function loadExtendedProfile() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.warn('No se pudo cargar el perfil extendido:', err);
      }
    }
    loadExtendedProfile();
  }, [user?.id]);

  // Manejador para Subir Foto/Imagen de Perfil desde archivo local
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5 MB de tamaño.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${cleanFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) {
        console.warn('Error en Supabase Storage, convirtiendo a vista previa local:', uploadErr.message);
        // Fallback: usar FileReader para generar Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setAvatarUrl(dataUrl);
          toast.success('Imagen cargada correctamente');
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setAvatarUrl(publicUrl);
        toast.success('Foto de perfil subida exitosamente');
      }
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      toast.error('Error al procesar la imagen', { description: err.message });
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Generador de Contraseña Segura
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Guardar Cambios del Perfil (Nombre, Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Actualizar en Supabase DB
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatar_url: avatarUrl.trim() || null,
          role: user.role,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // 2. Actualizar estado global de AuthContext
      updateUserData({
        name: name.trim(),
        avatar: avatarUrl.trim() || undefined,
      });

      toast.success('Perfil actualizado correctamente', {
        description: 'Se han guardado tus datos de usuario y foto de perfil.',
      });
    } catch (err: any) {
      console.error('Error guardando perfil:', err);
      toast.error('Error al guardar perfil', {
        description: err.message || 'No se pudieron actualizar los datos.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Actualizar Contraseña Propia
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setIsSavingPassword(true);
    try {
      // Intentar actualizar vía función RPC de cambio de contraseña
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_change_user_password', {
        target_user_id: user.id,
        new_password: newPassword,
      });

      if (rpcErr) {
        // Fallback: intentar actualizar con supabase.auth.updateUser para el usuario en sesión
        const { error: authErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (authErr) {
          throw new Error(authErr.message);
        }
      } else if (rpcData && rpcData.success === false) {
        throw new Error(rpcData.error || 'No se pudo cambiar la contraseña.');
      }

      toast.success('Contraseña de tu cuenta actualizada', {
        description: 'Tu clave de acceso ha sido cambiada de forma segura.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error actualizando contraseña:', err);
      toast.error('Error al actualizar contraseña', {
        description: err.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const userRole = user?.role || 'socios';
  const roleConfig = ROLE_INFO[userRole] || ROLE_INFO.socios;
  const RoleIcon = roleConfig.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Selector de Archivo Oculto para Subir Imagen */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarFileUpload}
        className="hidden"
      />

      {/* Encabezado Principal */}
      <div className="bg-white dark:bg-[#0d0e12] rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#c5a059] text-white rounded-2xl shadow-md shadow-amber-500/20">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              Mi Perfil y Configuración
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administra tu información personal, foto de avatar y contraseña de acceso a la plataforma
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleConfig.badgeClass}`}>
          <RoleIcon className="w-4 h-4" />
          <span>{roleConfig.label}</span>
        </span>
      </div>

      {/* Grid de 2 Columnas: Tarjeta de Vista Previa + Formulario de Ajustes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna 1: Tarjeta de Vista Previa de Cuenta (4 columnas) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm text-center space-y-4">
            {/* Foto de Perfil / Avatar con overlay para subir imagen */}
            <div className="relative inline-block mx-auto group">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 flex items-center justify-center font-bold text-4xl shadow-xl overflow-hidden border-2 border-white dark:border-zinc-800 relative">
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c5a059]" />
                    <span className="text-[10px]">Subiendo...</span>
                  </div>
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  (name || user?.email || 'U').substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Botón rápido para subir sobre la imagen */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#c5a059] hover:bg-[#b08d4b] text-white shadow-lg border-2 border-white dark:border-zinc-900 transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
                title="Subir foto desde tu dispositivo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {name || 'Usuario Santina'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {email || user?.email}
              </p>
            </div>

            {/* Acciones de Foto de Perfil */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#c5a059] border border-[#c5a059]/30 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Subir Foto</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Quitar foto actual"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar</span>
                </button>
              )}
            </div>

            {/* Ficha Informativa del Rol */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <RoleIcon className="w-4 h-4 text-[#c5a059]" />
                <span>Permisos de {roleConfig.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {roleConfig.description}
              </p>
            </div>
          </div>

          {/* Galería de Avatares Preconfigurados */}
          <div className="bg-white dark:bg-[#0d0e12] rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#c5a059]" />
              <span>Avatares Rápidos</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              O elige un avatar prediseñado para tu perfil:
            </p>
            <div className="flex items-center justify-between gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    avatarUrl === url
                      ? 'border-[#c5a059] ring-2 ring-[#c5a059]/30 scale-105'
                      : 'border-slate-200 dark:border-zinc-800 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna 2: Formularios de Edición de Perfil & Seguridad (8 columnas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Datos Personales */}
          <div className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#c5a059]/15 text-[#c5a059]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Información Personal
                  </h3>
                  <p className="text-xs text-slate-400">Actualiza tu nombre de usuario y foto de perfil</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Registrado en la Plataforma)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  El correo electrónico está vinculado a tu cuenta. Para cambiarlo contacta al Administrador.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foto de Perfil / Avatar
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Sube un archivo o pega URL (https://...)"
                      className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                    />
                    <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" /> : <Upload className="w-4 h-4 text-[#c5a059]" />}
                    <span>Seleccionar Archivo</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08d4b] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar Cambios de Perfil</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Cambiar Contraseña Propia */}
          <div className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Seguridad y Cambio de Contraseña
                  </h3>
                  <p className="text-xs text-slate-400">Actualiza la contraseña de tu propia cuenta</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const pwd = generateStrongPassword();
                  setNewPassword(pwd);
                  setConfirmPassword(pwd);
                  setShowNewPassword(true);
                  setShowConfirmPassword(true);
                  navigator.clipboard?.writeText(pwd);
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

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa mínimo 6 caracteres"
                    className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

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
                    placeholder="Confirma la nueva contraseña"
                    className={`w-full bg-slate-50 dark:bg-zinc-800/80 border rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 dark:border-zinc-700 focus:ring-[#c5a059]'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    ⚠️ Las contraseñas no coinciden.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Actualizar Mi Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
