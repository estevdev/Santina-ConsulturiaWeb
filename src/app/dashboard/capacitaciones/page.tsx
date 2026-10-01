'use client';

import React, { Suspense } from 'react';
import CapacitacionesView from '@/components/dashboard/capacitaciones/CapacitacionesView';

export default function CapacitacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CapacitacionesView />
    </Suspense>
  );
}
