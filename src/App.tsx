import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import type { Page } from './components/Sidebar';
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
  dashboard: { title: '🏠 Centro de Control', sub: 'Resumen del sistema y acciones rápidas' },
  campaña: { title: '📤 Nueva Campaña', sub: 'Componer y enviar mensajes de WhatsApp' },
  historial: { title: '📋 Historial', sub: 'Registro completo de mensajes enviados' },
  ciclos: { title: '📅 Ciclos Operativos', sub: 'Gestión de ventanas de envío' },
  consultoras: { title: '👥 Consultoras', sub: 'Vista de datos de Supabase (sólo lectura)' },
  settings: { title: '⚙️ Configuración', sub: 'Credenciales y parámetros del sistema' },
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
    <div className="app-layout">
      <Sidebar current={page} onNavigate={setPage} pendingCount={pendingCount} />
      <div className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-title">{info.title}</div>
            <div className="topbar-subtitle">{info.sub}</div>
          </div>
          <div className="topbar-actions">
            <div style={{
              fontSize: 12, color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-surface-2)', padding: '6px 12px', borderRadius: 6,
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
              Conectado a Supabase
            </div>
          </div>
        </header>
        {renderPage()}
      </div>
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
