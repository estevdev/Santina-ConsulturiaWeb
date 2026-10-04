'use client';

import React, { Suspense } from 'react';
import { ArchivosExplorerView } from '@/components/dashboard/archivos/ArchivosExplorerView';
import { Loader2 } from 'lucide-react';

export default function ArchivosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin" />
          <p className="text-xs text-zinc-400">Cargando Explorador de Archivos...</p>
        </div>
      }
    >
      <ArchivosExplorerView />
    </Suspense>
  );
}
