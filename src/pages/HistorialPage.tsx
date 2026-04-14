import React, { useEffect, useState } from 'react';
import { getLogs } from '../lib/supabase';
import type { SendLog } from '../lib/supabase';
import { CheckCircle, XCircle, RefreshCw, History, Filter, Beaker, CheckCircle2, XCircle2, Zap } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function HistorialPage() {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'test'>('all');

  const fetchLogs = () => {
    setLoading(true);
    getLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((l) => {
    if (filter === 'success') return l.status === 'success' && !l.is_test;
    if (filter === 'error') return l.status === 'error';
    if (filter === 'test') return l.is_test;
    return true;
  });

  const total = logs.length;
  const successCount = logs.filter((l) => l.status === 'success' && !l.is_test).length;
  const errorsCount = logs.filter((l) => l.status === 'error').length;
  const testsCount = logs.filter((l) => l.is_test).length;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Registro de Auditoría</h2>
          <p className="text-sm text-foreground/40 font-medium italic italic">Histórico completo de interacciones vía WhatsApp Bridge</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="glass">
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          Refrescar Logs
        </Button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Envíos', value: total, icon: History, color: 'text-foreground/60' },
          { label: 'Éxitos Reales', value: successCount, icon: CheckCircle2, color: 'text-success' },
          { label: 'Errores', value: errorsCount, icon: XCircle2, color: 'text-destructive' },
          { label: 'Pruebas', value: testsCount, icon: Beaker, color: 'text-primary' },
        ].map((stat, i) => (
          <Card key={i} className="bg-surface/30 border-border/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-1">{stat.label}</span>
              <div className={cn("text-xl font-black", stat.color)}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-dim p-1 rounded-xl w-fit border border-border/50 shadow-inner">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'success', label: 'Éxitos' },
          { id: 'error', label: 'Errores' },
          { id: 'test', label: 'Pruebas' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              filter === f.id 
                ? "bg-surface text-primary shadow-sm" 
                : "text-foreground/40 hover:text-foreground/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border-border/30 bg-surface/20">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="size-16 bg-surface rounded-2xl flex items-center justify-center mx-auto text-foreground/20 border border-border/50">
              <History size={24} />
            </div>
            <p className="text-sm font-medium text-foreground/40 italic">No se encontraron registros para este criterio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Consultora</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Destino</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Marca de Tiempo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Modalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((log) => (
                  <tr key={log.id} className="group hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      {log.status === 'success' ? (
                        <div className="size-7 rounded-full bg-success/10 flex items-center justify-center text-success">
                          <CheckCircle size={16} />
                        </div>
                      ) : (
                        <div className="size-7 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                          <XCircle size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm tracking-tight">{log.consultant_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono opacity-60 bg-surface/40 px-2 py-0.5 rounded border border-border/30">
                        {log.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{format(new Date(log.sent_at), 'dd MMM yyyy', { locale: es })}</span>
                        <span className="text-[10px] opacity-30 font-bold uppercase tracking-tighter">{format(new Date(log.sent_at), 'HH:mm:ss')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.is_test ? (
                        <Badge variant="ghost" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black">🧪 PRUEBA</Badge>
                      ) : (
                        <Badge variant="success" className="bg-success/5 border-success/20 text-[9px] font-black">PRODUCCIÓN</Badge>
                      )}
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
