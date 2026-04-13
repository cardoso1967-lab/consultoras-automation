import React, { useEffect, useState } from 'react';
import { getAllCycles } from '../lib/supabase';
import type { Ciclo } from '../lib/supabase';
import { isWithinCycleDates } from '../lib/rules';
import { Calendar, RefreshCw } from 'lucide-react';

export function CiclosPage() {
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCycles = () => {
    setLoading(true);
    getAllCycles().then(setCycles).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCycles(); }, []);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Ciclos Operativos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            El sistema valida automáticamente si hoy está dentro de la ventana del ciclo antes de permitir envíos.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchCycles}>
          <RefreshCw size={13} />Actualizar
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando ciclos...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Región</th>
                  <th>Número</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Calendly</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => {
                  const active = isWithinCycleDates(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        {active ? (
                          <span className="badge badge-activo pulse-green">
                            <span className="badge-dot" style={{ background: 'var(--color-success)' }} />Activo Hoy
                          </span>
                        ) : (
                          <span className="badge badge-inactivo">Inactivo</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.region}</td>
                      <td>{c.numero}</td>
                      <td>{new Date(c.inicio + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>{new Date(c.fin + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        {c.link_calendly ? (
                          <a href={c.link_calendly} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-light)', fontSize: 12 }}>Ver enlace</a>
                        ) : (
                          <span style={{ color: 'var(--color-text-faint)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
