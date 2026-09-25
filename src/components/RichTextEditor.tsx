'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2,
  PaintBucket,
  Palette,
  Type,
  ScanText,
  RefreshCw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  FoldVertical
} from 'lucide-react';
import { FieldZone, RichTextValue } from '@/types/preset';
import { parseTiptapJsonToLines } from '@/utils/richTextParser';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  zone: FieldZone;
  value?: string | RichTextValue;
  onChange: (value: RichTextValue) => void;
  onUpdateZone: (id: string, updated: Partial<FieldZone>) => void;
  onDeleteZone?: (id: string) => void;
  onExtractOcr?: (zone: FieldZone) => void;
  isOcrLoading?: boolean;
}

export default function RichTextEditor({
  zone,
  value,
  onChange,
  onUpdateZone,
  onDeleteZone,
  onExtractOcr,
  isOcrLoading = false,
}: RichTextEditorProps) {
  const [showPositionControls, setShowPositionControls] = useState(false);

  const initialContent = typeof value === 'object' && value?.html 
    ? value.html 
    : (typeof value === 'string' && value ? `<p>${value.replace(/\n/g, '<br/>')}</p>` : '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: zone.alignment || 'left',
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'p-2.5 min-h-[70px] max-h-[160px] overflow-y-auto text-sm focus:outline-none bg-white rounded-b-lg border-t-0',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      const plainText = editor.getText();
      const lines = parseTiptapJsonToLines(
        json, 
        zone.fontFamily || 'Helvetica', 
        zone.fontSize || 12, 
        zone.color || '#000000'
      );
      
      onChange({
        html,
        lines,
        plainText,
      });
    },
  });

  // Mantener alineación y fuentes sincronizadas si cambian desde fuera
  useEffect(() => {
    if (editor && zone.alignment) {
      editor.chain().setTextAlign(zone.alignment).run();
    }
  }, [editor, zone.alignment]);

  // Sincronizar contenido si cambia externamente (ej. al aplicar OCR o cargar preset)
  useEffect(() => {
    if (!editor) return;
    const targetHtml =
      typeof value === 'object' && value?.html
        ? value.html
        : typeof value === 'string' && value
        ? `<p>${value.replace(/\n/g, '<br/>')}</p>`
        : '';

    const currentHtml = editor.getHTML();
    // Solo actualizar si no coincide y el usuario no está activamente editando con foco
    if (targetHtml !== currentHtml && !editor.isFocused) {
      editor.commands.setContent(targetHtml || '');
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const nudge = (dx: number, dy: number) => {
    const newX = Math.max(0, Math.min(100 - zone.width, Math.round((zone.x + dx) * 100) / 100));
    const newY = Math.max(0, Math.min(100 - zone.height, Math.round((zone.y + dy) * 100) / 100));
    onUpdateZone(zone.id, { x: newX, y: newY });
  };

  const resizeNudge = (dw: number, dh: number) => {
    const newW = Math.max(2, Math.min(100 - zone.x, Math.round((zone.width + dw) * 100) / 100));
    const newH = Math.max(1, Math.min(100 - zone.y, Math.round((zone.height + dh) * 100) / 100));
    onUpdateZone(zone.id, { width: newW, height: newH });
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      {/* Barra de herramientas estilo Word */}
      <div className="bg-slate-50 p-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1 select-none">
        
        {/* Fuente y Tamaño */}
        <div className="flex items-center gap-1">
          <select
            value={zone.fontFamily || 'Helvetica'}
            onChange={(e) => {
              const newFamily = e.target.value as any;
              onUpdateZone(zone.id, { fontFamily: newFamily });
              if (editor) {
                const html = editor.getHTML();
                const json = editor.getJSON();
                const plainText = editor.getText();
                const lines = parseTiptapJsonToLines(
                  json,
                  newFamily,
                  zone.fontSize || 12,
                  zone.color || '#000000'
                );
                onChange({ html, lines, plainText });
              }
            }}
            className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700"
          >
            <option value="Helvetica">Arial / Sans</option>
            <option value="TimesRoman">Times New Roman</option>
            <option value="Courier">Courier</option>
          </select>

          <div className="flex items-center gap-0.5" title="Tamaño base de fuente">
            <Type className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <input
              type="number"
              min="6"
              max="72"
              value={zone.fontSize || 12}
              onChange={(e) => {
                const newSize = Number(e.target.value) || 12;
                onUpdateZone(zone.id, { fontSize: newSize });
                if (editor) {
                  const html = editor.getHTML();
                  const json = editor.getJSON();
                  const plainText = editor.getText();
                  const lines = parseTiptapJsonToLines(
                    json,
                    zone.fontFamily || 'Helvetica',
                    newSize,
                    zone.color || '#000000'
                  );
                  onChange({ html, lines, plainText });
                }
              }}
              className="w-11 bg-white border border-slate-300 rounded px-1 py-1 text-xs text-center"
            />
            <span className="text-[10px] text-slate-400">pt</span>
          </div>

          {/* Espaciado entre renglones / Interlineado */}
          <div className="flex items-center gap-0.5" title="Espaciado entre renglones (Interlineado)">
            <FoldVertical className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={zone.lineHeight || 1.15}
              onChange={(e) => {
                const newLineHeight = Number(e.target.value) || 1.15;
                onUpdateZone(zone.id, { lineHeight: newLineHeight });
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700"
            >
              <option value="0.9">0.9x</option>
              <option value="1.0">1.0x (Sencillo)</option>
              <option value="1.15">1.15x (Normal)</option>
              <option value="1.25">1.25x</option>
              <option value="1.35">1.35x</option>
              <option value="1.5">1.5x (1.5)</option>
              <option value="1.75">1.75x</option>
              <option value="2.0">2.0x (Doble)</option>
            </select>
          </div>
        </div>

        {/* Formatos de selección de texto: B, I, U */}
        <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 hover:bg-slate-100 transition-colors ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600'
            }`}
            title="Poner en negrita texto seleccionado (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Poner en cursiva texto seleccionado (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Subrayar texto seleccionado (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alineación */}
        <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setTextAlign('left').run();
              onUpdateZone(zone.id, { alignment: 'left' });
            }}
            className={`p-1.5 hover:bg-slate-100 transition-colors ${
              editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }))
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600'
            }`}
            title="Alinear a la izquierda (Ancla izquierda: texto largo crece a la derecha)"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setTextAlign('center').run();
              onUpdateZone(zone.id, { alignment: 'center' });
            }}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Centrar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setTextAlign('right').run();
              onUpdateZone(zone.id, { alignment: 'right' });
            }}
            className={`p-1.5 border-l border-slate-200 hover:bg-slate-100 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
            }`}
            title="Alinear a la derecha (Ancla derecha: texto largo se recorre hacia la izquierda)"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color de texto y color de fondo de zona */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1" title="Color de las letras (del texto o de toda la zona)">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={zone.color || '#000000'}
              onChange={(e) => {
                const newColor = e.target.value;
                onUpdateZone(zone.id, { color: newColor });
                if (editor) {
                  const { empty } = editor.state.selection;
                  if (empty) {
                    editor.chain().focus().selectAll().setColor(newColor).run();
                  } else {
                    editor.chain().focus().setColor(newColor).run();
                  }
                  const html = editor.getHTML();
                  const json = editor.getJSON();
                  const plainText = editor.getText();
                  const lines = parseTiptapJsonToLines(
                    json,
                    zone.fontFamily || 'Helvetica',
                    zone.fontSize || 12,
                    newColor
                  );
                  onChange({ html, lines, plainText });
                }
              }}
              className="w-5 h-5 border border-slate-300 rounded cursor-pointer p-0"
            />
          </div>

          <div className="flex items-center gap-1" title="Color de fondo (parche para tapar original)">
            <PaintBucket className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={zone.bgColor || '#ffffff'}
              onChange={(e) => onUpdateZone(zone.id, { bgColor: e.target.value })}
              className="w-5 h-5 border border-slate-300 rounded cursor-pointer p-0"
            />
          </div>

          {/* Botón para abrir ajustes de posición / desfase */}
          <button
            type="button"
            onClick={() => setShowPositionControls(!showPositionControls)}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
              showPositionControls
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Ajustar posición y desfase de la zona"
          >
            <Move className="w-3 h-3 text-slate-600" />
            <span>Mover</span>
          </button>

          {onExtractOcr && (
            <button
              type="button"
              onClick={() => onExtractOcr(zone)}
              disabled={isOcrLoading}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
              title="Re-extraer texto de esta zona con OCR"
            >
              {isOcrLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
              ) : (
                <ScanText className="w-3 h-3 text-indigo-600" />
              )}
              <span>OCR</span>
            </button>
          )}

          {onDeleteZone && (
            <button
              type="button"
              onClick={() => onDeleteZone(zone.id)}
              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors ml-0.5 cursor-pointer"
              title="Eliminar zona"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Panel desplegable de Ajuste Fino de Posición y Desfase */}
      {showPositionControls && (
        <div className="bg-amber-50/70 p-2 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-900 text-[11px]">Coordenadas:</span>
            
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300">
              <span className="text-[10px] text-slate-500 font-mono">X:</span>
              <input
                type="number"
                step="0.2"
                value={zone.x}
                onChange={(e) => onUpdateZone(zone.id, { x: Number(e.target.value) || 0 })}
                className="w-12 text-center text-xs font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300">
              <span className="text-[10px] text-slate-500 font-mono">Y:</span>
              <input
                type="number"
                step="0.2"
                value={zone.y}
                onChange={(e) => onUpdateZone(zone.id, { y: Number(e.target.value) || 0 })}
                className="w-12 text-center text-xs font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300" title="Ancho de la zona">
              <span className="text-[10px] text-slate-500 font-mono">Ancho:</span>
              <input
                type="number"
                step="0.5"
                value={zone.width}
                onChange={(e) => onUpdateZone(zone.id, { width: Number(e.target.value) || 2 })}
                className="w-12 text-center text-xs font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300" title="Alto de la zona">
              <span className="text-[10px] text-slate-500 font-mono">Alto:</span>
              <input
                type="number"
                step="0.5"
                value={zone.height}
                onChange={(e) => onUpdateZone(zone.id, { height: Number(e.target.value) || 1 })}
                className="w-12 text-center text-xs font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>

            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300" title="Espaciado entre renglones (Interlineado)">
              <span className="text-[10px] text-slate-500 font-mono">Interlínea:</span>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="4"
                value={zone.lineHeight || 1.15}
                onChange={(e) => onUpdateZone(zone.id, { lineHeight: Number(e.target.value) || 1.15 })}
                className="w-12 text-center text-xs font-mono font-medium focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">x</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded border border-amber-300">
              <span className="text-[10px] font-semibold text-amber-900">Crecer hacia:</span>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign('right').run();
                  onUpdateZone(zone.id, { alignment: 'right' });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  zone.alignment === 'right'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Fija el límite derecho y el texto largo se recorre hacia la izquierda"
              >
                ⬅️ Izquierda (Anclado derecha)
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextAlign('left').run();
                  onUpdateZone(zone.id, { alignment: 'left' });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  (zone.alignment || 'left') === 'left'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Fija el límite izquierdo y el texto largo crece hacia la derecha"
              >
                ➡️ Derecha (Anclado izquierda)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-amber-800">Desplazar:</span>
              <div className="flex items-center bg-white rounded border border-amber-300 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => nudge(-0.2, 0)}
                  className="p-1 hover:bg-amber-100 text-slate-700 transition-colors cursor-pointer"
                  title="Mover a la izquierda (0.2%)"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(0.2, 0)}
                  className="p-1 border-l border-amber-200 hover:bg-amber-100 text-slate-700 transition-colors cursor-pointer"
                  title="Mover a la derecha (0.2%)"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(0, -0.2)}
                  className="p-1 border-l border-amber-200 hover:bg-amber-100 text-slate-700 transition-colors cursor-pointer"
                  title="Mover arriba (0.2%)"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(0, 0.2)}
                  className="p-1 border-l border-amber-200 hover:bg-amber-100 text-slate-700 transition-colors cursor-pointer"
                  title="Mover abajo (0.2%)"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content editable */}
      <div style={{ lineHeight: zone.lineHeight || 1.15 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
