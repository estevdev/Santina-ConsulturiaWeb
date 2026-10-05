import { Role } from '@/types/auth';
import {
  LayoutDashboard,
  FileEdit,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  FolderLock,
  BarChart3,
  Radar,
  GraduationCap,
  Inbox,
  FolderArchive,
  MessageSquareText,
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
  /** Sub-opciones / pantallas secundarias asociadas */
  children?: NavItemConfig[];
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
        name: 'Radar de Clientes',
        href: '/dashboard/radar',
        icon: Radar,
        badge: '360°',
        roles: ['admin', 'socios'], // Solo Admin y Socios
      },
      {
        name: 'Clientes',
        href: '/dashboard/clientes',
        icon: Users,
        badge: 'Gestión',
        roles: ['admin', 'socios'], // Solo Admin y Socios
      },
      {
        name: 'Solicitudes Web',
        href: '/dashboard/solicitudes',
        icon: Inbox,
        badge: 'Landing',
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
    title: 'Capacitaciones',
    roles: ['admin', 'socios'],
    items: [
      {
        name: 'Capacitaciones',
        href: '/dashboard/capacitaciones',
        icon: GraduationCap,
        badge: 'Videos',
        roles: ['admin', 'socios'],
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
    roles: ['admin', 'socios'], // Exclusivo para administradores y socios de dirección
    items: [
      {
        name: 'Explorador de Archivos',
        href: '/dashboard/archivos',
        icon: FolderArchive,
        badge: 'Admin',
        roles: ['admin'],
      },
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
        badge: 'KPIs',
        roles: ['admin', 'socios'],
      },
      {
        name: 'Configuración Global',
        href: '/dashboard/configuracion',
        icon: Settings,
        roles: ['admin'],
        children: [
          {
            name: 'Mensajes Automatizados',
            href: '/dashboard/configuracion/mensajes-automatizados',
            icon: MessageSquareText,
            badge: 'WhatsApp',
            roles: ['admin'],
          },
        ],
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
      items: section.items
        .filter((item) => hasRoleAccess(userRole, item.roles))
        .map((item) => ({
          ...item,
          children: item.children
            ? item.children.filter((ch) => hasRoleAccess(userRole, ch.roles))
            : undefined,
        })),
    }))
    .filter((section) => section.items.length > 0);
}
