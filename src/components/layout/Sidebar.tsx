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
  FileText,
  X,
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

  // Obtiene únicamente las secciones e ítems a los que el rol actual tiene acceso
  const authorizedSections = getAuthorizedNavigation(user?.role);

  const isLinkActive = (href: string, matchExact?: boolean) => {
    if (matchExact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-base tracking-tight truncate">
                Santina
              </span>
              <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase truncate">
                Consultoría Web
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {authorizedSections.map((section) => (
          <div key={section.title}>
            {isOpen && (
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isLinkActive(item.href, item.matchExact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                    title={!isOpen ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {isOpen && (
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
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
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0 space-y-2">
        {/* User Card */}
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 ${
            !isOpen && 'justify-center'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          {isOpen && (
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || 'Usuario'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  {user?.role || 'editor'}
                </span>
              </div>
            </div>
          )}
        </div>

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
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
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
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out border-r border-slate-800 ${
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
