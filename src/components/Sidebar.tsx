import React from 'react';
import {
  Zap, LayoutDashboard, Send, Clock, BookOpen, Settings, LogOut, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

export type Page = 'dashboard' | 'campaña' | 'historial' | 'ciclos' | 'consultoras' | 'settings';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  pendingCount: number;
}

const navItems: { id: Page; label: string; icon: React.ElementType; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Principal' },
  { id: 'campaña', label: 'Nueva Campaña', icon: Send },
  { id: 'historial', label: 'Historial', icon: Clock },
  { id: 'ciclos', label: 'Ciclos', icon: BookOpen, section: 'Datos' },
  { id: 'consultoras', label: 'Consultoras', icon: Users },
  { id: 'settings', label: 'Configuración', icon: Settings, section: 'Sistema' },
];

export function Sidebar({ current, onNavigate, pendingCount }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-surface-dim flex flex-col h-full z-20 relative">
      {/* Glow Effect Top */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 blur-3xl rounded-full -z-10" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="size-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20 rotate-3">
          <Zap size={20} className="text-primary-foreground fill-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-none tracking-tight">AutoMensajes</span>
          <span className="text-[10px] text-foreground/40 font-medium uppercase tracking-widest mt-1">Consultoras CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar">
        {navItems.map((item) => (
          <React.Fragment key={item.id}>
            {item.section && (
              <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
                {item.section}
              </div>
            )}
            <button
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                current === item.id 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "text-foreground/60 hover:bg-surface hover:text-foreground"
              )}
            >
              {current === item.id && (
                <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <item.icon 
                size={18} 
                aria-hidden="true"
                className={cn(
                  "transition-colors",
                  current === item.id ? "text-primary" : "text-foreground/40 group-hover:text-foreground/70"
                )} 
              />
              <span className="text-sm">{item.label}</span>
              
              {item.id === 'campaña' && pendingCount > 0 && (
                <Badge variant="success" className="ml-auto h-5 px-1.5 min-w-5 justify-center font-bold animate-pulse-subtle">
                  {pendingCount}
                </Badge>
              )}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface/40 border border-border/30 hover:bg-surface/60 transition-colors cursor-pointer group">
          <div className="size-9 rounded-full bg-gradient-to-tr from-primary to-primary/40 flex items-center justify-center text-primary-foreground font-bold shadow-sm">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">Administrador</span>
            <span className="text-[10px] text-foreground/40 uppercase tracking-tighter">Premium Access</span>
          </div>
          <button 
            className="ml-auto p-1.5 text-foreground/30 hover:text-destructive transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
