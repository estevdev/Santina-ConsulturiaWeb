'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedNavigation } from '@/config/navigation';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  X,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});

  // Obtiene únicamente las secciones e ítems a los que el rol actual tiene acceso
  const authorizedSections = React.useMemo(() => {
    return getAuthorizedNavigation(user?.role);
  }, [user?.role]);

  const toggleExpand = (href: string, currentlyExpanded: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [href]: !currentlyExpanded }));
  };

  const isLinkActive = (href: string, matchExact?: boolean) => {
    if (matchExact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d0e12] dark:bg-[#0d0e12] text-zinc-200 select-none border-r border-zinc-800/80">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <img
            src="/logo.png"
            alt="Santina Logo"
            className="w-8 h-8 object-contain shrink-0 filter drop-shadow-[0_0_8px_rgba(197,160,89,0.3)] group-hover:scale-105 transition-transform"
          />
          {isOpen && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-base tracking-tight truncate">
                Santina
              </span>
              <span className="text-[10px] text-[#c5a059] font-semibold tracking-widest uppercase truncate">
                Consultoría Web
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {authorizedSections.map((section) => (
          <div key={section.title}>
            {isOpen && (
              <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const active = isLinkActive(item.href, item.matchExact);
                const Icon = item.icon;
                const isExpanded = expandedParents[item.href] ?? (pathname.startsWith(item.href));

                if (hasChildren && isOpen) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                            active
                              ? 'bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold shadow-md shadow-[#c5a059]/20'
                              : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-amber-400'}`} />
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  active
                                    ? 'bg-zinc-950/20 text-zinc-950'
                                    : 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(item.href, isExpanded, e)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer shrink-0"
                          title={isExpanded ? 'Contraer submenú' : 'Expandir submenú'}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#c5a059]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isExpanded && item.children && (
                        <div className="pl-5 pt-0.5 pb-1 space-y-1 border-l border-[#c5a059]/30 ml-5 my-0.5 animate-in fade-in duration-150">
                          {item.children.map((child) => {
                            const childActive = pathname === child.href;
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onMobileClose}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                                  childActive
                                    ? 'bg-[#c5a059]/20 text-[#dfba73] font-bold border border-[#c5a059]/40 shadow-sm'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                              >
                                <ChildIcon
                                  className={`w-4 h-4 shrink-0 ${
                                    childActive ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-amber-400'
                                  }`}
                                />
                                <span className="truncate">{child.name}</span>
                                {child.badge && (
                                  <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#c5a059]/15 text-[#dfba73] border border-[#c5a059]/30">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-gradient-to-r from-[#c5a059] to-[#9a7b38] text-zinc-950 font-bold shadow-md shadow-[#c5a059]/20'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                    title={!isOpen ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-amber-400'}`} />
                    {isOpen && (
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              active
                                ? 'bg-zinc-950/20 text-zinc-950'
                                : 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile & Collapse Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 shrink-0 space-y-2">
        {/* User Card */}
        <Link
          href="/dashboard/profile"
          onClick={onMobileClose}
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-[#c5a059]/40 transition-all cursor-pointer group ${
            !isOpen && 'justify-center'
          }`}
          title={isOpen ? 'Ir a mi perfil y configuración' : `${user?.name || 'Usuario'} - Perfil`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#c5a059] to-[#dfba73] flex items-center justify-center text-zinc-950 font-bold text-sm shrink-0 shadow-sm overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          {isOpen && (
            <div className="flex-1 truncate">
              <div className="flex items-center gap-1.5 min-w-0">
                <Settings className="w-3.5 h-3.5 text-[#c5a059] group-hover:rotate-45 transition-transform shrink-0" />
                <p className="text-xs font-semibold text-white group-hover:text-[#dfba73] transition-colors truncate leading-tight">
                  {user?.name || 'Usuario'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium">
                  {user?.role || 'editor'}
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 p-2 rounded-lg transition-colors flex-1 ${
              !isOpen && 'justify-center'
            }`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isOpen && <span>Cerrar Sesión</span>}
          </button>

          {/* Desktop Toggle Collapse (Sliderbar toggle) */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            title={isOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with Transitioning Width */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out border-r border-zinc-800 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
