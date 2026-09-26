'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Preset } from '@/types/preset';
import { getPresets, savePreset, deletePreset } from '@/utils/storage';
import PresetList from '@/components/PresetList';
import PresetBuilder from '@/components/PresetBuilder';
import PdfProcessor from '@/components/PdfProcessor';
import { FileEdit, Layers, Sparkles, Plus } from 'lucide-react';

type ViewMode = 'list' | 'create-preset' | 'edit-preset' | 'process-pdf';

export default function PdfPresetStudioView() {
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  useEffect(() => {
    const loaded = getPresets();
    setPresets(loaded);

    // Read initial URL action if any
    const action = searchParams.get('action');
    const presetId = searchParams.get('presetId');

    if (presetId) {
      const found = loaded.find((p) => p.id === presetId);
      if (found) {
        setSelectedPreset(found);
        if (action === 'edit') {
          setActiveView('edit-preset');
          return;
        } else if (action === 'process') {
          setActiveView('process-pdf');
          return;
        }
      }
    }

    if (action === 'create') {
      setSelectedPreset(null);
      setActiveView('create-preset');
    } else if (action === 'process') {
      setSelectedPreset(null);
      setActiveView('process-pdf');
    }
  }, [searchParams]);

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
    <div className="space-y-6">
      {/* Studio Header Sub-Navbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              PDF Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diseño de plantillas de reemplazo de texto, coordenadas y procesamiento
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedPreset(null);
              setActiveView('list');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis Presets</span>
          </button>

          <button
            onClick={() => {
              setSelectedPreset(null);
              setActiveView('create-preset');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'create-preset' || activeView === 'edit-preset'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{activeView === 'edit-preset' ? 'Editando Preset' : 'Nuevo Preset'}</span>
          </button>

          <button
            onClick={() => {
              setActiveView('process-pdf');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'process-pdf'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Procesar PDF</span>
          </button>
        </div>
      </div>

      {/* Dynamic View Panel */}
      {activeView === 'list' && (
        <PresetList
          presets={presets}
          onSelectPreset={handleUsePreset}
          onEditPreset={handleEditPreset}
          onDeletePreset={handleDeletePreset}
          onCreateNew={() => {
            setSelectedPreset(null);
            setActiveView('create-preset');
          }}
          onPresetsChange={(updated) => setPresets(updated)}
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
          onSavePreset={handleSavePreset}
          onBack={() => {
            setSelectedPreset(null);
            setActiveView('list');
          }}
        />
      )}
    </div>
  );
}
