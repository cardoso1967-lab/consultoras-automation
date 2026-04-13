import React, { useEffect, useState } from 'react';
import { getLogs } from '../lib/supabase';
import type { SendLog } from '../lib/supabase';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
  const success = logs.filter((l) => l.status === 'success' && !l.is_test).length;
  const errors = logs.filter((l) => l.status === 'error').length;
  const tests = logs.filter((l) => l.is_test).length;

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Historial de Envíos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Log completo de todos los mensajes enviados</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Stats row */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Registros</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exitosos Reales</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{success}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Errores</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{errors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pruebas</div>
          <div className="stat-value" style={{ color: 'var(--color-info)' }}>{tests}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="tabs" style={{ maxWidth: 400, marginBottom: 16 }}>
        {(['all', 'success', 'error', 'test'] as const).map((f) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : f === 'success' ? '✅ Éxitos' : f === 'error' ? '❌ Errores' : '🧪 Pruebas'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">Sin registros</div>
            <div className="empty-state-text">
              {logs.length === 0
                ? 'Aún no se ha enviado ninguna campaña. La tabla send_logs se creará automáticamente en tu próxima ejecución.'
                : 'No hay registros con este filtro.'}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Consultora</th>
                  <th>Teléfono</th>
                  <th>Ciclo</th>
                  <th>Fecha/Hora</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      {log.status === 'success'
                        ? <CheckCircle size={15} style={{ color: 'var(--color-success)' }} />
                        : <XCircle size={15} style={{ color: 'var(--color-danger)' }} />}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.consultant_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{log.phone}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{log.ciclo_id.slice(0, 8)}...</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {new Date(log.sent_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {log.is_test
                        ? <span className="badge badge-inactivo">🧪 Prueba</span>
                        : <span className="badge badge-activo">Real</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
