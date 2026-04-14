import React, { useEffect, useState } from 'react';
import { getActiveCycles, getConsultants } from '../lib/supabase';
import type { Ciclo, Consultant } from '../lib/supabase';
import { filterTargetConsultants, isWithinCycleDates } from '../lib/rules';
import { useToast } from '../context/ToastContext';
import {
  Zap, Users, AlertCircle, Calendar, Send, Clock,
  Play, CheckCircle, XCircle, Loader, BarChart2, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const EDGE_FUNCTION_URL = 'https://mqbmwzjscyobpvdfkjvh.supabase.co/functions/v1/send-consultant-reminders';

const STATUS_COLORS = ['oklch(65% 0.2 155)', 'oklch(75% 0.18 75)', 'oklch(55% 0.2 25)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-premium p-3 rounded-lg shadow-xl animate-fade-in">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-tighter mb-1">{label}</p>
        <p className="text-sm font-bold text-primary italic">
          {payload[0].value} mensajes
        </p>
      </div>
    );
  }
  return null;
};

interface AutoResult {
  executed?: boolean;
  skipped?: boolean;
  reason?: string;
  date?: string;
  ciclo?: string;
  total?: number;
  success?: number;
  errors?: number;
  error?: string;
}

interface Props {
  onNavigate: (page: 'campaña' | 'historial' | 'ciclos') => void;
}

export function DashboardPage({ onNavigate }: Props) {
  const { addToast } = useToast();
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAuto, setRunningAuto] = useState(false);
  const [autoResult, setAutoResult] = useState<AutoResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Datos para gráficos
  const [weeklyData, setWeeklyData] = useState<{name: string, mensajes: number}[]>([]);
  const [statusData, setStatusData] = useState<{name: string, value: number}[]>([
    { name: 'Entregados', value: 0 },
    { name: 'Pendientes', value: 0 },
    { name: 'Fallidos', value: 0 }
  ]);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    Promise.all([getActiveCycles(), getConsultants()])
      .then(([c, cs]) => { setCycles(c); setConsultants(cs); })
      .finally(() => setLoading(false));

    const fetchLogs = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const startDate = subDays(new Date(), 6);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('send_logs')
        .select('status, sent_at, is_test')
        .gte('sent_at', startDate.toISOString());

      if (!error && data) {
        let entregados = 0;
        let fallidos = 0;
        let pendientes = 0;
        let totalHoy = 0;

        const daysMap: Record<string, number> = {};
        for(let i=6; i>=0; i--) {
           const d = format(subDays(new Date(), i), 'E', { locale: es });
           daysMap[d.charAt(0).toUpperCase() + d.slice(1)] = 0;
        }

        data.forEach(log => {
           if (log.is_test) return;

           if (log.status === 'success') entregados++;
           else if (log.status === 'error') fallidos++;
           else pendientes++;

           if (log.sent_at) {
              const logDate = new Date(log.sent_at);
              if (logDate >= todayStart) {
                totalHoy++;
              }
              const dayStr = format(logDate, 'E', { locale: es });
              const capitalized = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
              if (daysMap[capitalized] !== undefined) {
                 daysMap[capitalized]++;
              }
           }
        });

        const newWeekly = Object.keys(daysMap).map(k => ({ name: k, mensajes: daysMap[k] }));

        setWeeklyData(newWeekly);
        setStatusData([
          { name: 'Entregados', value: entregados },
          { name: 'Pendientes', value: pendientes },
          { name: 'Fallidos', value: fallidos },
        ]);
        setTotalToday(totalHoy);
      }
    };
    fetchLogs();
  }, []);

  const targets = filterTargetConsultants(consultants);
  const pendientesCount = consultants.filter((c) => c.estatus === 'Pendiente').length;
  const retrasadasCount = consultants.filter((c) => c.estatus === 'Retrasada').length;
  const activeCycle = cycles[0];
  const cycleOk = activeCycle ? isWithinCycleDates(activeCycle) : false;
  const totalPie = statusData.reduce((acc, curr) => acc + curr.value, 0);

  const handleAutoRun = async () => {
    setShowConfirm(false);
    setRunningAuto(true);
    setAutoResult(null);
    try {
      const res = await fetch(EDGE_FUNCTION_URL, { method: 'POST' });
      const data: AutoResult = await res.json();
      setAutoResult(data);
      if (data.executed) {
        addToast({
          type: 'success',
          title: 'Automatización ejecutada',
          body: `${data.success} enviados, ${data.errors} errores`,
        });
      } else if (data.skipped) {
        addToast({ type: 'info', title: 'Ejecución omitida', body: data.reason });
      } else {
        addToast({ type: 'error', title: 'Error', body: data.error });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error de red', body: String(err) });
    } finally {
      setRunningAuto(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          <CardHeader className="p-5 pb-2">
            <CardDescription className="uppercase tracking-widest text-[10px] font-bold">Total Objetivo</CardDescription>
            <CardTitle className="text-3xl font-black text-primary flex items-baseline gap-2">
              {targets.length}
              <span className="text-xs font-medium text-foreground/40 italic">consultoras</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-1.5 text-success font-bold text-xs mt-2">
              <ArrowUpRight size={14} />
              <span>12% este ciclo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-warning/50 transition-all">
          <CardHeader className="p-5 pb-2">
            <CardDescription className="uppercase tracking-widest text-[10px] font-bold">Pendientes</CardDescription>
            <CardTitle className="text-3xl font-black text-warning flex items-baseline gap-2">
              {pendientesCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-1.5 text-foreground/40 font-bold text-xs mt-2">
              <Clock size={14} />
              <span>Esperando envío</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-destructive/50 transition-all">
          <CardHeader className="p-5 pb-2">
            <CardDescription className="uppercase tracking-widest text-[10px] font-bold">Retrasadas</CardDescription>
            <CardTitle className="text-3xl font-black text-destructive flex items-baseline gap-2">
              {retrasadasCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-1.5 text-destructive font-bold text-xs mt-2">
              <AlertCircle size={14} />
              <span>Acción requerida</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:border-success/50 transition-all">
          <CardHeader className="p-5 pb-2">
            <CardDescription className="uppercase tracking-widest text-[10px] font-bold">Envíos Hoy</CardDescription>
            <CardTitle className="text-3xl font-black text-success flex items-baseline gap-2">
              {totalToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-1.5 text-success font-bold text-xs mt-2">
              <Activity size={14} />
              <span>Actividad en tiempo real</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cycle Pulse Indicator (The Signature) */}
      <Card className="border-border/30 bg-gradient-to-br from-surface to-surface-dim shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative size-32 md:size-40 flex items-center justify-center shrink-0">
              {/* Outer Ring */}
              <div className={cn(
                "absolute inset-0 rounded-full border-4 opacity-10",
                cycleOk ? "border-success" : "border-destructive animate-pulse"
              )} />
              {/* Animated Inner Ring */}
              <div className={cn(
                "absolute inset-2 rounded-full border-2 border-dashed opacity-20 animate-spin-slow",
                cycleOk ? "border-success" : "border-destructive"
              )} />
              {/* Center Info */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Ciclo</span>
                <span className="text-4xl font-black leading-none">{activeCycle?.numero || '--'}</span>
                <Badge variant={cycleOk ? "success" : "destructive"} className="mt-2 text-[8px] px-2">
                  {cycleOk ? "OPERATIVO" : "FUERA DE VENTANA"}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-6 w-full text-center md:text-left">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Estado de la Ventana Operativa</h3>
                <p className="text-sm text-foreground/50">Región: <span className="text-foreground font-semibold">{activeCycle?.region || 'No definida'}</span></p>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-bright/30 border border-border/50">
                  <Calendar size={18} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold opacity-40 leading-none">Inicia</span>
                    <span className="text-xs font-bold">{activeCycle ? format(new Date(activeCycle.inicio + 'T12:00:00Z'), 'dd MMM', { locale: es }) : '--'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-bright/30 border border-border/50">
                  <Play size={18} className="text-success" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold opacity-40 leading-none">Finaliza</span>
                    <span className="text-xs font-bold">{activeCycle ? format(new Date(activeCycle.fin + 'T12:00:00Z'), 'dd MMM', { locale: es }) : '--'}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Sutil */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40 px-1">
                  <span>Progreso del Ciclo</span>
                  <span>{cycleOk ? 'En Curso' : 'Esperando'}</span>
                </div>
                <div className="h-2 w-full bg-surface-bright rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      cycleOk ? "bg-primary w-2/3 shadow-[0_0_12px_var(--color-primary)]" : "bg-destructive w-full"
                    )} 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Button variant="premium" className="w-full shadow-lg" onClick={() => onNavigate('campaña')}>
                <Send size={16} aria-hidden="true" /> Ir al Compositor
              </Button>
              <Button 
                variant="outline" 
                className="w-full glass shadow-sm"
                onClick={() => setShowConfirm(true)}
                disabled={runningAuto}
              >
                {runningAuto ? <Loader size={16} className="animate-spin" aria-hidden="true" /> : <Zap size={16} className="text-warning fill-warning/20" aria-hidden="true" />}
                Forzar Ejecución
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-surface/50 border-border/30 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <BarChart2 size={16} className="text-primary" />
                Flujo de Mensajería
              </CardTitle>
              <CardDescription>Últimos 7 días de actividad</CardDescription>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={20} />
            </div>
          </CardHeader>
          <CardContent className="h-[280px] w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(55% 0.25 285)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="oklch(55% 0.25 285)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'oklch(55% 0.25 285)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="mensajes" 
                  stroke="oklch(55% 0.25 285)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPrimary)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface/50 border-border/30 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon size={16} className="text-primary" />
                Estado Global
              </CardTitle>
              <CardDescription>Distribución histórica de registros</CardDescription>
            </div>
            <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center text-success font-black text-xs">
              {Math.round((statusData[0].value / (totalPie || 1)) * 100)}%
            </div>
          </CardHeader>
          <CardContent className="h-[280px] w-full relative flex flex-col items-center justify-center">
            <div className="size-full absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', background: 'var(--color-surface)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pointer-events-none mt-[-20px] mb-8 text-center">
              <div className="text-4xl font-black">{loading ? '…' : totalPie}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-40">Total Registros</div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-auto pb-4">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} />
                  <span className="text-[10px] font-bold opacity-60 uppercase">{entry.name}</span>
                  <span className="text-[10px] font-black">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Overlay Premium */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
          <Card className="w-full max-w-lg relative z-10 glass-premium shadow-2xl animate-slide-in-up border-primary/20">
            <CardHeader className="pb-4">
              <div className="size-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning mb-4">
                <Zap size={24} className="fill-warning/20" />
              </div>
              <CardTitle className="text-2xl">Confirmar Ejecución Automática</CardTitle>
              <CardDescription className="text-base mt-2">
                Esta acción activará el motor de mensajería en el servidor. Se enviarán notificaciones reales a <span className="text-primary font-bold">{targets.length} consultoras</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <AlertCircle className="text-primary shrink-0 mt-0.5" size={18} />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-primary/80">Reglas de Envío Activas</p>
                  <ul className="list-disc list-inside text-foreground/60 space-y-1 text-xs">
                    <li>Se utiliza la plantilla predefinida en configuración.</li>
                    <li>Sólo se envía a consultoras con estatus habilitado.</li>
                    <li>Sincronización automática con WhatsApp vía Bridge.</li>
                  </ul>
                </div>
              </div>
              {!cycleOk && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-3 animate-pulse">
                  <XCircle size={18} />
                  Nota: No hay ciclo operativo hoy. El proceso se omitirá.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-4 pt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>Desechar</Button>
              <Button variant="premium" className="flex-1" onClick={handleAutoRun}>Inciar Proceso</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
