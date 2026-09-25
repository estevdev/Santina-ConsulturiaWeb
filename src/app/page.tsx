'use client';

import { useState, useEffect } from 'react';
import { Preset } from '@/types/preset';
import { getPresets, savePreset, deletePreset } from '@/utils/storage';
import PresetList from '@/components/PresetList';
import PresetBuilder from '@/components/PresetBuilder';
import PdfProcessor from '@/components/PdfProcessor';
import { FileEdit, Layers, Sparkles } from 'lucide-react';

type ViewMode = 'list' | 'create-preset' | 'edit-preset' | 'process-pdf';

export default function Home() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  useEffect(() => {
    setPresets(getPresets());
  }, []);

  const handleSavePreset = (preset: Preset) => {
    savePreset(preset);
    setPresets(getPresets());
    setActiveView('list');
    setSelectedPreset(null);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este preset?')) {
      deletePreset(id);
      setPresets(getPresets());
    }
  };

  const handleEditPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setActiveView('edit-preset');
  };

  const handleUsePreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setActiveView('process-pdf');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => {
              setActiveView('list');
              setSelectedPreset(null);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                PDF Preset Studio
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium border-l pl-2">
                Editor de Plantillas y Zonas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedPreset(null);
                setActiveView('process-pdf');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'process-pdf'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Procesar PDF
            </button>
            <button
              onClick={() => {
                setSelectedPreset(null);
                setActiveView('list');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'list'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Mis Presets ({presets.length})
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'list' && (
          <PresetList
            presets={presets}
            onSelectPreset={handleUsePreset}
            onEditPreset={handleEditPreset}
            onDeletePreset={handleDeletePreset}
            onPresetsChange={setPresets}
            onCreateNew={() => {
              setSelectedPreset(null);
              setActiveView('create-preset');
            }}
          />
        )}

        {(activeView === 'create-preset' || activeView === 'edit-preset') && (
          <PresetBuilder
            initialPreset={selectedPreset}
            onSave={handleSavePreset}
            onCancel={() => {
              setSelectedPreset(null);
              setActiveView('list');
            }}
          />
        )}

        {activeView === 'process-pdf' && (
          <PdfProcessor
            presets={presets}
            initialPreset={selectedPreset}
            onSavePreset={(preset) => {
              savePreset(preset);
              setPresets(getPresets());
            }}
            onBack={() => {
              setSelectedPreset(null);
              setActiveView('list');
            }}
          />
        )}
      </div>
    </main>
  );
}
