import React, { useEffect, useState } from 'react';
import { getAllCycles } from '../lib/supabase';
import type { Ciclo } from '../lib/supabase';
import { isWithinCycleDates } from '../lib/rules';
import { Calendar, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CiclosPage() {
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCycles = () => {
    setLoading(true);
    getAllCycles()
      .then(setCycles)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCycles(); }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Cronograma de Ciclos</h2>
          <p className="text-sm text-foreground/40 font-medium italic">Gestión de ventanas operativas y enlaces de agendamiento</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCycles} disabled={loading} className="glass">
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          Actualizar Calendario
        </Button>
      </div>

      <Card className="overflow-hidden border-border/30 bg-surface/20">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Región / Base</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">ID Ciclo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Ventana Temporal</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {cycles.map((c) => {
                  const active = isWithinCycleDates(c);
                  return (
                    <tr key={c.id} className={cn(
                      "group transition-colors",
                      active ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-surface/40"
                    )}>
                      <td className="px-6 py-5">
                        {active ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="animate-pulse-subtle">ACTIVO HOY</Badge>
                          </div>
                        ) : (
                          <Badge variant="ghost" className="opacity-40">INACTIVO</Badge>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-8 rounded-lg flex items-center justify-center border",
                            active ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface-bright border-border/50 text-foreground/20"
                          )}>
                            <Globe size={16} />
                          </div>
                          <span className="font-bold tracking-tight">{c.region}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono font-bold px-2 py-1 bg-surface-bright/50 rounded border border-border/20">
                          {c.numero}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 text-xs font-semibold text-foreground/60">
                          <span className="px-2 py-0.5 rounded bg-surface/40">
                            {format(new Date(c.inicio + 'T12:00:00Z'), 'dd MMM yyyy', { locale: es })}
                          </span>
                          <span className="opacity-20">→</span>
                          <span className="px-2 py-0.5 rounded bg-surface/40">
                            {format(new Date(c.fin + 'T12:00:00Z'), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {c.link_calendly ? (
                          <a 
                            href={c.link_calendly} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/5 transition-all"
                          >
                            Calendly <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold opacity-20 uppercase tracking-tighter">Sin enlace</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {!loading && cycles.length === 0 && (
        <div className="p-12 text-center bg-surface/10 rounded-2xl border border-dashed border-border">
          <Calendar className="mx-auto mb-4 text-foreground/20" size={40} />
          <p className="text-sm font-medium text-foreground/40 italic">No se encontraron ciclos definidos en la base de datos.</p>
        </div>
      )}
    </div>
  );
}
