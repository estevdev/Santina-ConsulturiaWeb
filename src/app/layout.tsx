import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Preset Editor',
  description: 'Edita zonas específicas en documentos PDF utilizando presets guardados',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased bg-slate-50">{children}</body>
    </html>
  );
}
