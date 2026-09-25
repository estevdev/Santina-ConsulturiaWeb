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
    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-300 space-y-2.5 text-xs">
      {/* Fila 1: Fuente, Tamaño e Interlineado */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[110px]">
          <select
            value={zone.fontFamily || 'Helvetica'}
            onChange={(e) =>
              onUpdateZone(zone.id, { fontFamily: e.target.value as FontFamily })
            }
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="Helvetica">Arial / Helvetica (Sans)</option>
            <option value="TimesRoman">Times New Roman (Serif)</option>
            <option value="Courier">Courier (Monospace)</option>
          </select>
        </div>

        <div className="flex items-center gap-1" title="Tamaño de Fuente (pt)">
          <Type className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="number"
            min="6"
            max="72"
            value={zone.fontSize || 12}
            onChange={(e) =>
              onUpdateZone(zone.id, { fontSize: Number(e.target.value) || 12 })
            }
            className="w-12 bg-white border border-slate-300 rounded px-1 py-1 text-xs text-center"
          />
          <span className="text-[10px] text-slate-400">pt</span>
        </div>

        <div className="flex items-center gap-1" title="Espaciado entre renglones (Interlineado)">
          <FoldVertical className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={zone.lineHeight || 1.15}
            onChange={(e) =>
              onUpdateZone(zone.id, { lineHeight: Number(e.target.value) || 1.15 })
            }
            className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700"
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
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-slate-200 pt-2">
        {/* Negrita, Cursiva, Subrayado */}
        <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isBold: !zone.isBold })}
            className={`p-1.5 hover:bg-slate-100 transition-colors ${
              zone.isBold ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600'
            }`}
            title="Negrita"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isItalic: !zone.isItalic })}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              zone.isItalic ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Cursiva"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { isUnderline: !zone.isUnderline })}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              zone.isUnderline ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Subrayado"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alineaciones */}
        <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'left' })}
            className={`p-1.5 hover:bg-slate-100 transition-colors ${
              (zone.alignment || 'left') === 'left' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'center' })}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              zone.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateZone(zone.id, { alignment: 'right' })}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              zone.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colores */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" title="Color de texto">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={zone.color || '#000000'}
              onChange={(e) => onUpdateZone(zone.id, { color: e.target.value })}
              className="w-6 h-6 border border-slate-300 rounded cursor-pointer p-0"
            />
          </div>
          <div className="flex items-center gap-1" title="Color de fondo (parche)">
            <PaintBucket className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={zone.bgColor || '#ffffff'}
              onChange={(e) => onUpdateZone(zone.id, { bgColor: e.target.value })}
              className="w-6 h-6 border border-slate-300 rounded cursor-pointer p-0"
            />
          </div>
          {onDeleteZone && (
            <button
              type="button"
              onClick={() => onDeleteZone(zone.id)}
              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors ml-1"
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
