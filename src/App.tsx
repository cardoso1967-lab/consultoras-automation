import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { Page } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { ToastProvider } from './context/ToastContext';
import { DashboardPage } from './pages/DashboardPage';
import { CampañaPage } from './pages/CampañaPage';
import { HistorialPage } from './pages/HistorialPage';
import { CiclosPage } from './pages/CiclosPage';
import { ConsultorasPage } from './pages/ConsultorasPage';
import { SettingsPage } from './pages/SettingsPage';
import { getConsultants } from './lib/supabase';
import { filterTargetConsultants } from './lib/rules';

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: 'Centro de Control', sub: 'Resumen del sistema y acciones rápidas' },
  campaña: { title: 'Nueva Campaña', sub: 'Componer y enviar mensajes de WhatsApp' },
  historial: { title: 'Historial', sub: 'Registro completo de mensajes enviados' },
  ciclos: { title: 'Ciclos Operativos', sub: 'Gestión de ventanas de envío' },
  consultoras: { title: 'Consultoras', sub: 'Vista de datos de Supabase' },
  settings: { title: 'Configuración', sub: 'Credenciales y parámetros del sistema' },
};

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getConsultants()
      .then((cs) => setPendingCount(filterTargetConsultants(cs).length))
      .catch(() => {});
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage onNavigate={(p) => setPage(p)} />;
      case 'campaña': return <CampañaPage />;
      case 'historial': return <HistorialPage />;
      case 'ciclos': return <CiclosPage />;
      case 'consultoras': return <ConsultorasPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  const info = PAGE_TITLES[page];

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      <Sidebar current={page} onNavigate={setPage} pendingCount={pendingCount} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header title={info.title} subtitle={info.sub} />
        
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          {renderPage()}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
