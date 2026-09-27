'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400 tracking-wide">Cargando plataforma Santina...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08080a] dark:bg-[#08080a] text-zinc-100 flex transition-colors duration-200">
      {/* Sidebar with Slider/Collapse toggle */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Container adjusting according to sidebar width */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
