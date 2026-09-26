'use client';

import React, { Suspense } from 'react';
import PdfPresetStudioView from '@/components/pdf-preset-studio/PdfPresetStudioView';

export default function PdfPresetStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PdfPresetStudioView />
    </Suspense>
  );
}
