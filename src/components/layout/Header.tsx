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
    <header className="h-16 bg-[#0d0e12] dark:bg-[#0d0e12] border-b border-zinc-800 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left side: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c5a059]/10 text-[#dfba73] border border-[#c5a059]/30">
            Santina Hub
          </span>
          <span className="hidden sm:inline-block text-xs text-zinc-400">
            &bull; Gestión de Documentos & Plantillas
          </span>
        </div>
      </div>

      {/* Right side: Actions, Theme Toggle & User */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Info Capsule */}
        <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-[11px] text-zinc-400 capitalize">
              {user?.role || 'editor'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-zinc-950 border border-[#c5a059]/40 flex items-center justify-center font-bold text-xs shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-zinc-950" />}
          </div>
        </div>
      </div>
    </header>
  );
}
