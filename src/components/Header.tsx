import React, { useEffect, useState } from 'react';
import { Search, Bell, Globe, Command, Moon, Sun } from 'lucide-react';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Inicializar el estado basado en la clase del documento si existe, 
    // pero forzamos dark por defecto e indicación del usuario
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="h-20 border-b border-border/50 bg-background/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-foreground/50 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="hidden md:flex w-72 lg:w-96 relative group">
          <Input 
            placeholder="Buscar consultoras, ciclos…" 
            icon={<Search size={18} aria-hidden="true" />}
            className="bg-surface/50 border-border/50 focus:bg-surface transition-all"
            aria-label="Buscar en el sistema"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-surface text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">
            <Command size={10} aria-hidden="true" /> K
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3">
          <button 
            className="p-2 rounded-lg hover:bg-surface text-foreground/50 hover:text-foreground transition-colors relative"
            aria-label="Ver notificaciones"
          >
            <Bell size={20} aria-hidden="true" />
            <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-background" />
          </button>
          
          <div className="h-6 w-px bg-border/50 mx-1" aria-hidden="true" />

          <Badge variant="ghost" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/10 border-success/20 text-success hover:bg-success/20 transition-all cursor-default">
            <div className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Supabase Online</span>
          </Badge>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="hidden sm:flex p-2 rounded-lg hover:bg-surface text-foreground/50 hover:text-foreground transition-colors"
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
