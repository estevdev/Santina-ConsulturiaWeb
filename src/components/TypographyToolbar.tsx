'use client';

import React from 'react';
import { FieldZone, FontFamily } from '@/types/preset';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type, 
  PaintBucket, 
  Palette,
  Trash2,
  FoldVertical
} from 'lucide-react';

interface TypographyToolbarProps {
  zone: FieldZone;
  onUpdateZone: (id: string, updated: Partial<FieldZone>) => void;
  onDeleteZone?: (id: string) => void;
}

export default function TypographyToolbar({
  zone,
  onUpdateZone,
  onDeleteZone,
}: TypographyToolbarProps) {
  return (
    <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3 text-xs transition-colors">
      {/* Fila 1: Fuente, Tamaño e Interlineado */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[110px]">
          <select
            value={zone.fontFamily || 'Helvetica'}
            onChange={(e) =>
              onUpdateZone(zone.id, { fontFamily: e.target.value as FontFamily })
            }
            className="w-full bg-white dark:bg-[#0d0e12] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="Helvetica">Arial / Helvetica (Sans)</option>
            <option value="TimesRoman">Times New Roman (Serif)</option>
            <option value="Courier">Courier (Monospace)</option>
          </select>
        </div>

        <div className="flex items-center gap-1" title="Tamaño de Fuente (pt)">
          <Type className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <input
            type="number"
            min="6"
            max="72"
            value={zone.fontSize || 12}
            onChange={(e) =>
              onUpdateZone(zone.id, { fontSize: Number(e.target.value) || 12 })
            }
            className="w-12 bg-white dark:bg-[#0d0e12] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-1 py-1 text-xs text-center"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500">pt</span>
        </div>

        <div className="flex items-center gap-1" title="Espaciado entre renglones (Interlineado)">
          <FoldVertical className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={zone.lineHeight || 1.15}
            onChange={(e) =>
              onUpdateZone(zone.id, { lineHeight: Number(e.target.value) || 1.15 })
            }
            className="bg-white dark:bg-[#0d0e12] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-1.5 py-1 text-xs"
          >
            <option value="0.9">0.9x</option>
            <option value="1.0">1.0x</option>
            <option value="1.15">1.15x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>
      </div>

      {/* Fila 2: Formatos de Texto y Alineación */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-slate-200 dark:border-slate-700 pt-2">
        {/* Negrita, Cursiva, Subrayado */}
        <div className="flex items-center bg-white dark:bg-[#0d0e12] border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isBold: !zone.isBold })}
            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              zone.isBold ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059] font-bold' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Negrita"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isItalic: !zone.isItalic })}
            className={`p-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              zone.isItalic ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059]' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Cursiva"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isUnderline: !zone.isUnderline })}
            className={`p-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              zone.isUnderline ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059]' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Subrayado"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alineaciones */}
        <div className="flex items-center bg-white dark:bg-[#0d0e12] border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'left' })}
            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              (zone.alignment || 'left') === 'left' ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059]' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'center' })}
            className={`p-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              zone.alignment === 'center' ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059]' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'right' })}
            className={`p-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              zone.alignment === 'right' ? 'bg-[#c5a059] dark:bg-[#c5a059] text-[#c5a059] dark:text-[#c5a059]' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colores */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" title="Color de texto">
            <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="color"
              value={zone.color || '#000000'}
              onChange={(e) => onUpdateZone(zone.id, { color: e.target.value })}
              className="w-6 h-6 border border-slate-300 dark:border-slate-700 rounded cursor-pointer p-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1" title="Color de fondo (parche)">
            <PaintBucket className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="color"
              value={zone.bgColor || '#ffffff'}
              onChange={(e) => onUpdateZone(zone.id, { bgColor: e.target.value })}
              className="w-6 h-6 border border-slate-300 dark:border-slate-700 rounded cursor-pointer p-0 bg-transparent"
            />
          </div>
          {onDeleteZone && (
            <button
              type="button"
              onClick={() => onDeleteZone(zone.id)}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition-colors ml-1"
              title="Eliminar zona"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
