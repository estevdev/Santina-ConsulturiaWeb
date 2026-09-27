'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700/80 border border-slate-700 shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#dfba73] transition-transform -rotate-12 hover:rotate-0" />
        )}
      </div>
      {showLabel && (
        <span className="font-medium">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
}
