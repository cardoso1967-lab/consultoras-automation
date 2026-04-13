import React, { useEffect, useState } from 'react';
import { getActiveCycles, getConsultants } from '../lib/supabase';
import type { Ciclo, Consultant } from '../lib/supabase';
import { filterTargetConsultants, isWithinCycleDates } from '../lib/rules';
import { useToast } from '../context/ToastContext';
import {
  Zap, Users, AlertCircle, Calendar, Send, Clock,
  Play, CheckCircle, XCircle, Loader
} from 'lucide-react';

const EDGE_FUNCTION_URL =
  'https://mqbmwzjscyobpvdfkjvh.supabase.co/functions/v1/send-consultant-reminders';

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

  useEffect(() => {
    Promise.all([getActiveCycles(), getConsultants()])
      .then(([c, cs]) => { setCycles(c); setConsultants(cs); })
      .finally(() => setLoading(false));
  }, []);

  const targets = filterTargetConsultants(consultants);
  const pendientes = consultants.filter((c) => c.estatus === 'Pendiente').length;
  const retrasadas = consultants.filter((c) => c.estatus === 'Retrasada').length;
  const activeCycle = cycles[0];
  const cycleOk = activeCycle ? isWithinCycleDates(activeCycle) : false;

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
