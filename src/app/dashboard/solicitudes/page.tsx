import React from 'react';
import { SolicitudesView } from '@/components/dashboard/solicitudes';

export const metadata = {
  title: 'Solicitudes Web | Santina Consultoría',
  description: 'Gestión y seguimiento de solicitudes de diagnóstico gratuito enviadas desde la Landing Page.',
};

export default function SolicitudesPage() {
  return <SolicitudesView />;
}
