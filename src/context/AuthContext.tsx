'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const TEST_USERS: (User & { password: string })[] = [
  {
    id: 'usr_admin_01',
    name: 'Carlos Santina (Admin)',
    email: 'admin@santina.com',
    role: 'admin',
    password: 'admin123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'usr_demo_02',
    name: 'Usuario Socio Demo',
    email: 'socio@santina.com',
    role: 'socios',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'usr_demo_03',
    name: 'Cliente Demo',
    email: 'cliente@santina.com',
    role: 'cliente',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  }
];

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'santina_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Comprobar sesión de Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const userRole = (profile?.role || session.user.user_metadata?.role || 'cliente') as User['role'];
          const userName = profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario';

          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: userName,
            role: userRole,
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
          };
          setUser(userData);
          setIsLoading(false);
          return;
        }

        // 2. Si no hay sesión de Supabase, revisar almacenamiento local de pruebas
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error inicializando autenticación:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de estado en Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const userRole = (profile?.role || session.user.user_metadata?.role || 'cliente') as User['role'];
        const userName = profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario';

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: userName,
          role: userRole,
          avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        };
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) {
          setUser(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Intentar inicio de sesión con Supabase Auth (si es formato email)
    if (cleanId.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanId,
        password,
      });

      if (!error && data?.user) {
        // Obtener el perfil de la base de datos
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileErr) {
          console.error('Error al obtener perfil desde Supabase:', profileErr);
        }

        const userRole = (profile?.role || data.user.user_metadata?.role || 'cliente') as User['role'];
        const userName = profile?.name || data.user.user_metadata?.name || cleanId.split('@')[0];

        const userData: User = {
          id: data.user.id,
          email: data.user.email || cleanId,
          name: userName,
          role: userRole,
          avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        };
        setUser(userData);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return { success: true };
      }
    }

    // 2. Si falló en Supabase o es un alias, probar con usuarios locales de prueba
    const matchedUser = TEST_USERS.find(
      (u) =>
        (u.email.toLowerCase() === cleanId || u.email.split('@')[0].toLowerCase() === cleanId) &&
        u.password === password
    );

    if (matchedUser) {
      const userData: User = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        avatar: matchedUser.avatar,
      };
      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error al cerrar sesión en Supabase:', e);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
