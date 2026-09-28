import { Role } from '@/types/auth';
import {
  LayoutDashboard,
  FileEdit,
  Layers,
  Sparkles,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  FolderLock,
  BarChart3,
  LucideIcon
} from 'lucide-react';

export interface NavItemConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  matchExact?: boolean;
  /**
   * Roles permitidos para ver esta opción.
   * Si no se define (o está vacío), todos los roles autenticados tienen acceso.
   */
  roles?: Role[];
}

export interface NavSectionConfig {
  title: string;
  /** Roles que pueden ver esta sección completa */
  roles?: Role[];
  items: NavItemConfig[];
}

/**
 * CONFIGURACIÓN CENTRALIZADA DE NAVEGACIÓN Y PERMISOS DE RUTAS
 * Define de manera simple qué roles ven qué elementos en el sidebar y la app.
 */
export const NAVIGATION_CONFIG: NavSectionConfig[] = [
  {
    title: 'Plataforma',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        matchExact: true,
        // Todos los roles tienen acceso
      },
      {
        name: 'Clientes',
        href: '/dashboard/clientes',
        icon: Users,
        badge: 'Gestión',
        roles: ['admin', 'socios'], // Solo Admin y Socios
      },
      {
        name: 'PDF Studio',
        href: '/dashboard/pdf-preset-studio',
        icon: FileEdit,
        badge: 'Admin',
        roles: ['admin'], // Solo Administradores
      },
    ],
  },
  {
    title: 'Acceso Rápido',
    roles: ['admin'], // Sección completa visible solo para Administradores
    items: [
      {
        name: 'Gestor de Presets',
        href: '/dashboard/pdf-preset-studio?view=list',
        icon: Layers,
        roles: ['admin'],
      },
      {
        name: 'Procesador de PDFs',
        href: '/dashboard/pdf-preset-studio?view=process',
        icon: Sparkles,
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Área Cliente',
    roles: ['cliente'], // Exclusivo para clientes
    items: [
      {
        name: 'Mis Documentos',
        href: '/dashboard/documentos',
        icon: FileText,
        roles: ['cliente'],
      },
    ],
  },
  {
    title: 'Administración',
    roles: ['admin'], // Exclusivo para administradores
    items: [
      {
        name: 'Gestión de Usuarios',
        href: '/dashboard/usuarios',
        icon: Users,
        roles: ['admin'],
      },
      {
        name: 'Reportes y Métricas',
        href: '/dashboard/reportes',
        icon: BarChart3,
        roles: ['admin'],
      },
      {
        name: 'Configuración Global',
        href: '/dashboard/configuracion',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];

/**
 * Helper para verificar si un rol tiene permiso para un ítem o sección.
 */
export function hasRoleAccess(userRole: Role | undefined, allowedRoles?: Role[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Helper para filtrar secciones y opciones visibles para un rol específico.
 */
export function getAuthorizedNavigation(userRole: Role | undefined): NavSectionConfig[] {
  return NAVIGATION_CONFIG
    .filter((section) => hasRoleAccess(userRole, section.roles))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasRoleAccess(userRole, item.roles)),
    }))
    .filter((section) => section.items.length > 0);
}
