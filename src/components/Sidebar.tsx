import React from 'react';
import {
  Zap, LayoutDashboard, Send, Clock, BookOpen, Settings, LogOut,
} from 'lucide-react';

export type Page = 'dashboard' | 'campaña' | 'historial' | 'ciclos' | 'consultoras' | 'settings';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  pendingCount: number;
}

const navItems: { id: Page; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, section: 'Principal' },
  { id: 'campaña', label: 'Nueva Campaña', icon: <Send size={16} /> },
  { id: 'historial', label: 'Historial', icon: <Clock size={16} /> },
  { id: 'ciclos', label: 'Ciclos', icon: <BookOpen size={16} />, section: 'Datos' },
  { id: 'consultoras', label: 'Consultoras', icon: <LayoutDashboard size={16} /> },
  { id: 'settings', label: 'Configuración', icon: <Settings size={16} />, section: 'Sistema' },
];

export function Sidebar({ current, onNavigate, pendingCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          AutoMensajes
          <span>Consultoras CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <React.Fragment key={item.id}>
            {item.section && (
              <div className="nav-section-label">{item.section}</div>
            )}
            <button
              className={`nav-item ${current === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'campaña' && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Administrador</div>
            <div className="user-role">Acceso Total</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--color-text-faint)', marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  );
}
