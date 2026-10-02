import React from 'react';
import { ReportesView } from '@/components/dashboard/reportes';

export const metadata = {
  title: 'Reportes y Métricas | Santina Consultoría',
  description: 'Panel ejecutivo de reportes, métricas territoriales y análisis de clientes de Santina Consultoría',
};

export default function ReportesPage() {
  return <ReportesView />;
}
