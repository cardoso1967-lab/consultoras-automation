import React, { useEffect, useState } from 'react';
import { getActiveCycles, getConsultants } from '../lib/supabase';
import type { Ciclo, Consultant } from '../lib/supabase';
import { filterTargetConsultants, isWithinCycleDates } from '../lib/rules';
import { useToast } from '../context/ToastContext';
import {
  Zap, Users, AlertCircle, Calendar, Send, Clock,
  Play, CheckCircle, XCircle, Loader, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = 'https://mqbmwzjscyobpvdfkjvh.supabase.co/functions/v1/send-consultant-reminders';

const STATUS_COLORS = ['#10b981', '#facc15', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 12, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--color-primary-light)', fontWeight: 700, margin: 0 }}>
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
  const pendientes = consultants.filter((c) => c.estatus === 'Pendiente').length;
  const retrasadas = consultants.filter((c) => c.estatus === 'Retrasada').length;
  const activeCycle = cycles[0];
  const cycleOk = activeCycle ? isWithinCycleDates(activeCycle) : false;
  const totalPie = statusData.reduce((acc, curr) => acc + curr.value, 0);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

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
          title: '✅ Automatización ejecutada',
          body: `${data.success} enviados, ${data.errors} errores — ${data.ciclo}`,
        });
      } else if (data.skipped) {
        addToast({ type: 'info', title: '⚠️ Ejecución omitida', body: data.reason });
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={32} style={{ color: 'var(--color-primary)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 12.5, marginBottom: 4 }}>📅 {today}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Centro de Control</h1>
          {cycleOk ? (
            <span className="badge badge-activo">
              <span className="badge-dot" style={{ background: 'var(--color-success)' }} />
              Ciclo Activo
            </span>
          ) : (
            <span className="badge badge-inactivo">Sin Ciclo Activo</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary-glow)', float: 'right' }}>
            <Users size={20} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <div className="stat-label">Consultoras Objetivo</div>
          <div className="stat-value" style={{ color: 'var(--color-primary-light)' }}>{targets.length}</div>
          <div className="stat-delta">Listas para recibir mensaje</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-bg)', float: 'right' }}>
            <Clock size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-label">Pendientes</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{pendientes}</div>
          <div className="stat-delta">Estatus: Pendiente</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-danger-bg)', float: 'right' }}>
            <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="stat-label">Retrasadas</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{retrasadas}</div>
          <div className="stat-delta">Estatus: Retrasada</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-bg)', float: 'right' }}>
            <Calendar size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-label">Ciclos Activos</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{cycleOk ? cycles.length : 0}</div>
          <div className="stat-delta">{activeCycle ? `Ciclo ${activeCycle.numero}` : 'Sin ciclo hoy'}</div>
        </div>
      </div>

      {/* Active Cycle Info */}
      {activeCycle && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">
              <Calendar size={15} style={{ color: 'var(--color-primary-light)' }} />
              Ciclo Activo
            </div>
            <span className={`badge ${cycleOk ? 'badge-activo' : 'badge-retrasada'}`}>
              <span className="badge-dot" style={{ background: cycleOk ? 'var(--color-success)' : 'var(--color-danger)' }} />
              {cycleOk ? 'Dentro de ventana' : 'Fuera de ventana'}
            </span>
          </div>
          <div className="card-body">
            <div className="grid-3">
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginBottom: 4 }}>REGIÓN</div>
                <div style={{ fontWeight: 700 }}>{activeCycle.region}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginBottom: 4 }}>NÚMERO</div>
                <div style={{ fontWeight: 700 }}>{activeCycle.numero}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginBottom: 4 }}>VENTANA</div>
                <div style={{ fontWeight: 700 }}>
                  {new Date(activeCycle.inicio + 'T12:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {' → '}
                  {new Date(activeCycle.fin + 'T12:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        {/* Manual compose */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Send size={14} style={{ color: 'var(--color-primary-light)' }} />Campaña Manual con Editor</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Edita el texto del mensaje, previsualiza en el teléfono y elige modo Prueba o Producción antes de enviar.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('campaña')}>
              <Send size={14} />
              Ir al Compositor
            </button>
          </div>
        </div>

        {/* Auto run */}
        <div className="card" style={{ borderColor: cycleOk ? 'rgba(139,92,246,0.3)' : undefined }}>
          <div className="card-header">
            <div className="card-title">
              <Zap size={14} style={{ color: 'var(--color-warning)' }} />
              Forzar Ejecución Automática
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 99 }}>
              Edge Function
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Ejecuta el mismo motor que corre automáticamente cada día a las 9:00 AM. Usa el mensaje template por defecto y envía a todas las consultoras objetivo.
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} />
              CRON: <code style={{ background: 'var(--color-surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>0 15 * * 1-6</code>
              (9:00 AM CDMX, Lun-Sáb)
            </div>
            <button
              className={`btn ${cycleOk ? 'btn-primary' : 'btn-secondary'}`}
              disabled={runningAuto}
              onClick={() => setShowConfirm(true)}
            >
              {runningAuto
                ? <><Loader size={14} className="btn-spin" />Ejecutando...</>
                : <><Play size={14} />Ejecutar Ahora</>}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        {/* Gráfico de Evolución */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart2 size={14} style={{ color: 'var(--color-primary-light)' }} />
              Evolución de Envíos (Últimos 7 días)
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: 250, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #8b5cf6)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary, #8b5cf6)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="mensajes" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMensajes)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico de Dona */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieChartIcon size={14} style={{ color: 'var(--color-primary-light)' }} />
              Estado de Mensajes
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: 200, width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    itemStyle={{ color: 'var(--color-text)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 24, fontWeight: 'bold' }}>{loading ? '...' : totalPie}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total envíos</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              {statusData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto Result */}
      {autoResult && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {autoResult.executed
                ? <CheckCircle size={15} style={{ color: 'var(--color-success)' }} />
                : autoResult.skipped
                ? <AlertCircle size={15} style={{ color: 'var(--color-warning)' }} />
                : <XCircle size={15} style={{ color: 'var(--color-danger)' }} />}
              Resultado de la Ejecución
            </div>
          </div>
          <div className="card-body">
            {autoResult.executed && (
              <div className="grid-3" style={{ gap: 12 }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-success-bg)', borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>{autoResult.success}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Enviados</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-danger)' }}>{autoResult.errors}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Errores</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{autoResult.total}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total</div>
                </div>
              </div>
            )}
            {autoResult.skipped && (
              <p style={{ color: 'var(--color-warning)', fontSize: 13 }}>⚠️ {autoResult.reason}</p>
            )}
            {autoResult.error && (
              <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>❌ {autoResult.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚡ Confirmar Ejecución Automática</div>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Esto ejecutará la <b>Supabase Edge Function</b> en el servidor, enviando mensajes a <b>{targets.length} consultoras reales</b> usando el template de mensaje por defecto.
              </p>
              {!cycleOk && (
                <p style={{ color: 'var(--color-warning)', fontSize: 13, marginTop: 8 }}>
                  ⚠️ Nota: No hay ciclo activo hoy. La función devolverá "skipped" sin enviar mensajes.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAutoRun}>
                <Play size={14} />
                Sí, ejecutar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
