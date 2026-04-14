import React, { useEffect, useState } from 'react';
import { getAllConsultantsRaw } from '../lib/supabase';
import type { Consultant } from '../lib/supabase';
import { RefreshCw, Search, Filter, SlidersHorizontal, UserPlus, MoreHorizontal, Phone, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

export function ConsultorasPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = () => {
    setLoading(true);
    getAllConsultantsRaw()
      .then(setConsultants)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = consultants.filter((c) => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.estatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Directorio de Consultoras</h2>
          <p className="text-sm text-foreground/40 font-medium">{consultants.length} registros sincronizados con Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="glass">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button variant="premium" size="sm">
            <UserPlus size={14} />
            Nueva Consultora
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="bg-surface/30 backdrop-blur-md border-border/40">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por nombre, localidad o ID…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={18} aria-hidden="true" />}
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              aria-label="Buscar consultoras"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-border/50 hidden lg:block mx-2" />
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {['all', 'Pendiente', 'Retrasada', 'Agendado', 'Cerrado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    filterStatus === status 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface/50 text-foreground/40 border-border/50 hover:border-primary/30"
                  )}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="icon" className="shrink-0">
              <SlidersHorizontal size={18} className="text-foreground/40" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Container */}
      <Card className="overflow-hidden border-border/30 bg-surface/20">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="size-20 bg-surface rounded-full flex items-center justify-center mx-auto text-foreground/20 border border-border/50">
              <Search size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No se encontraron resultados</h3>
              <p className="text-sm text-foreground/40">Intenta ajustar los filtros de búsqueda</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterStatus('all'); }}>
              Limpiar Filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Información Consultora</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Estado Operativo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Ubicación</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Ciclo</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-primary/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-surface-bright border border-border/50 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {c.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{c.nombre}</span>
                          <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-tighter">ID: {c.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge 
                          variant={
                            c.estatus === 'Retrasada' ? 'destructive' :
                            c.estatus === 'Pendiente' ? 'warning' :
                            c.estatus === 'Agendado' ? 'success' : 'ghost'
                          } 
                          className="w-fit"
                        >
                          {c.estatus}
                        </Badge>
                        <span className="text-[10px] font-bold opacity-30 flex items-center gap-1">
                          <div className={cn("size-1 rounded-full", c.situacion === 'Activa' ? "bg-success" : "bg-foreground/20")} />
                          {c.situacion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <Phone size={14} className="opacity-40" />
                        <span className="text-xs font-mono">{c.telefono || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <MapPin size={14} className="opacity-40" />
                        <span className="text-xs font-medium">{c.ciudad || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="px-2 py-1 bg-surface-bright/50 border border-border/50 rounded-md inline-block">
                        <span className="text-[10px] font-black tracking-widest leading-none">S{c.semana || '--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-surface text-foreground/30 hover:text-foreground transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
