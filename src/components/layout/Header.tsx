'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, Sparkles, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left side: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
            Santina Hub
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-500">
            &bull; Gestión de Documentos & Plantillas
          </span>
        </div>
      </div>

      {/* Right side: Actions, Theme Toggle & User */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Info Capsule */}
        <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
              {user?.role || 'editor'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </div>
    </header>
  );
}
