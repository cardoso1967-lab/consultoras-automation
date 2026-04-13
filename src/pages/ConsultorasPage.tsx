import React, { useEffect, useState } from 'react';
import { getAllConsultantsRaw } from '../lib/supabase';
import type { Consultant } from '../lib/supabase';
import { RefreshCw, Search } from 'lucide-react';

export function ConsultorasPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = () => {
    setLoading(true);
    getAllConsultantsRaw().then(setConsultants).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = consultants.filter((c) => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.estatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Consultoras</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{consultants.length} registros en Supabase (sólo lectura)</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          <RefreshCw size={13} />Actualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Retrasada">Retrasada</option>
          <option value="Agendado">Agendado</option>
          <option value="Cerrado">Cerrado</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando consultoras...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estatus</th>
                  <th>Situación</th>
                  <th>Teléfono</th>
                  <th>Ciudad</th>
                  <th>Semana</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td>
                      <span className={`badge ${
                        c.estatus === 'Retrasada' ? 'badge-retrasada'
                        : c.estatus === 'Pendiente' ? 'badge-pendiente'
                        : c.estatus === 'Agendado' ? 'badge-activo'
                        : 'badge-inactivo'
                      }`}>{c.estatus}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.situacion === 'Activa' ? 'badge-activo' : 'badge-inactivo'}`}>
                        {c.situacion}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{c.telefono || '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{c.ciudad || '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{c.semana || '—'}</td>
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
