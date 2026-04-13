import React, { useEffect, useState } from 'react';
import { getActiveCycles, getConsultants } from '../lib/supabase';
import type { Ciclo, Consultant } from '../lib/supabase';
import { filterTargetConsultants, isWithinCycleDates, interpolateMessage } from '../lib/rules';
import { runCampaign } from '../lib/zapi';
import type { SendResult } from '../lib/zapi';
import { useToast } from '../context/ToastContext';
import {
  Send, Beaker, Users, MessageSquare, Eye, ChevronDown,
  CheckCircle, XCircle, AlertTriangle, Loader, Phone
} from 'lucide-react';

const DEFAULT_TEMPLATE = `Hola {{nombre}} 👋

Te enviamos un recordatorio sobre tu pedido del ciclo {{ciclo}} de {{region}}.

Tu estado actual es: *{{estatus}}*

⏰ La fecha límite de tu ciclo es el {{fin_ciclo}}.

Si tienes alguna duda, no dudes en contactarnos. ¡Estamos para apoyarte! 💜`;

const VARIABLES = ['{{nombre}}', '{{nombre_completo}}', '{{estatus}}', '{{ciclo}}', '{{region}}', '{{ciudad}}', '{{semana}}', '{{fecha}}', '{{fin_ciclo}}'];

export function CampañaPage() {
  const { addToast } = useToast();
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [isTest, setIsTest] = useState(true);
  const [testPhone, setTestPhone] = useState(import.meta.env.VITE_TEST_PHONE || '');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewConsultant, setPreviewConsultant] = useState<Consultant | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'seleccion'>('editor');

  useEffect(() => {
    Promise.all([getActiveCycles(), getConsultants()])
      .then(([c, cs]) => {
        setCycles(c);
        setConsultants(cs);
        if (cs.length > 0) setPreviewConsultant(cs[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const targets = filterTargetConsultants(consultants);
  const activeCycle = cycles[0];
  const cycleOk = activeCycle ? isWithinCycleDates(activeCycle) : false;
  const previewText = previewConsultant && activeCycle
    ? interpolateMessage(template, previewConsultant, activeCycle)
    : template;

  const handleRun = async () => {
    if (!activeCycle || targets.length === 0) return;
    setShowConfirm(false);
    setRunning(true);
    setResults([]);
    setProgress(0);

    try {
      const res = await runCampaign({
        consultants: isTest ? [targets[0]] : targets,
        ciclo: activeCycle,
        messageTemplate: template,
        isTest,
        testPhone: isTest ? testPhone : undefined,
        onProgress: (result, index, total) => {
          setResults((prev) => [...prev, result]);
          setProgress(Math.round(((index + 1) / total) * 100));
        },
      });

      const successes = res.filter((r) => r.success).length;
      const errors = res.filter((r) => !r.success && !r.skipped).length;
      addToast({
        type: successes > 0 ? 'success' : 'error',
        title: isTest ? '✅ Prueba completada' : `✅ Campaña enviada`,
        body: `${successes} enviados correctamente, ${errors} errores`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error en la campaña', body: String(err) });
    } finally {
      setRunning(false);
    }
  };

  const insertVariable = (v: string) => {
    setTemplate((prev) => prev + v);
  };

  if (loading) return <div className="page-content"><p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p></div>;

  return (
    <div className="page-content">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Nueva Campaña</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          {cycleOk
            ? `Ciclo activo: ${activeCycle?.numero} — ${targets.length} consultoras objetivo`
            : '⚠️ No hay ciclo activo hoy. El envío está bloqueado por la regla de fechas.'}
        </p>
      </div>

      {!cycleOk && (
        <div style={{ background: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>
            La validación de fechas bloqueó el envío (igual que el nodo "Check Dates and Rules" en N8N).
            {activeCycle ? ` Ventana del ciclo: ${activeCycle.inicio} → ${activeCycle.fin}.` : ' No hay ciclo configurado para hoy.'}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left: Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
              ✍️ Editor
            </button>
            <button className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
              👁️ Previsualizar
            </button>
            <button className={`tab-btn ${activeTab === 'seleccion' ? 'active' : ''}`} onClick={() => setActiveTab('seleccion')}>
              👥 Selección ({targets.length})
            </button>
          </div>

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><MessageSquare size={15} />Mensaje</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>INSERTAR VARIABLE</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {VARIABLES.map((v) => (
                      <span key={v} className="chip" onClick={() => insertVariable(v)}>{v}</span>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <textarea
                    className="form-textarea"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    rows={10}
                    placeholder="Escribe tu mensaje aquí..."
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--color-text-faint)', textAlign: 'right' }}>
                    {template.length} caracteres · {template.split('\n').length} líneas
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Eye size={15} />Previsualización</div>
                <select
                  className="form-select"
                  style={{ width: 'auto', fontSize: 12 }}
                  value={previewConsultant?.id || ''}
                  onChange={(e) => setPreviewConsultant(targets.find(c => c.id === e.target.value) || null)}
                >
                  {targets.slice(0, 20).map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="phone-preview">
                  <div className="phone-wapp-header">
                    <div className="phone-wapp-avatar">💬</div>
                    <div>
                      <div className="phone-wapp-name">Cardoso Modas</div>
                      <div className="phone-wapp-status">en línea</div>
                    </div>
                  </div>
                  <div className="phone-wapp-body">
                    <div className="phone-bubble">
                      {previewText}
                      <div className="phone-bubble-time">
                        {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selection Tab */}
          {activeTab === 'seleccion' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Users size={15} />{targets.length} consultoras objetivo</div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Estatus</th>
                      <th>Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.telefono}</td>
                        <td>
                          <span className={`badge ${c.estatus === 'Retrasada' ? 'badge-retrasada' : 'badge-pendiente'}`}>
                            {c.estatus}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{c.ciudad || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results (shown after run) */}
          {results.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Resultados del Envío</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {results.filter(r => r.success).length}/{results.length} exitosos
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {running && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--color-text-muted)' }}>
                      <span>Progreso</span><span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill progress-fill-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
                {results.map((r, i) => (
                  <div key={i} className="log-entry">
                    <span className="log-icon">
                      {r.success
                        ? <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                        : r.skipped
                        ? <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                        : <XCircle size={14} style={{ color: 'var(--color-danger)' }} />}
                    </span>
                    <div className="log-msg">
                      <b>{r.consultant.nombre}</b>
                      {' · '}
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11.5 }}>
                        {r.skipped ? r.skipReason : r.success ? `✓ ${r.phone}` : `✗ ${r.error}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Config & Send */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mode selector */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Beaker size={15} />Modo de Envío</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: isTest ? 'var(--color-primary-glow)' : 'transparent', border: `1px solid ${isTest ? 'rgba(139,92,246,0.3)' : 'var(--color-border)'}`, transition: 'all 0.2s' }}>
                <input type="radio" checked={isTest} onChange={() => setIsTest(true)} style={{ accentColor: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>🧪 Modo Prueba</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>Envía solo a tu número de prueba</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: !isTest ? 'var(--color-danger-bg)' : 'transparent', border: `1px solid ${!isTest ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`, transition: 'all 0.2s' }}>
                <input type="radio" checked={!isTest} onChange={() => setIsTest(false)} style={{ accentColor: 'var(--color-danger)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>🚀 Producción</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>Envía a las {targets.length} consultoras reales</div>
                </div>
              </label>
              {isTest && (
                <div className="form-field">
                  <label className="form-label"><Phone size={12} style={{ display: 'inline' }} /> Número de prueba</label>
                  <input
                    className="form-input"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="521XXXXXXXXXX"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Send button */}
          <button
            className={`btn btn-lg ${isTest ? 'btn-secondary' : 'btn-danger'}`}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={running || (!cycleOk && !isTest) || targets.length === 0}
            onClick={() => isTest ? handleRun() : setShowConfirm(true)}
          >
            {running
              ? <><Loader size={16} className="btn-spin" />Enviando...</>
              : isTest
              ? <><Beaker size={16} />Enviar Prueba</>
              : <><Send size={16} />Lanzar Campaña Real</>}
          </button>

          {!isTest && !cycleOk && (
            <p style={{ fontSize: 12, color: 'var(--color-warning)', textAlign: 'center' }}>
              ⚠️ Deshabilitado: Fuera de ventana del ciclo
            </p>
          )}

          {/* Cycle summary */}
          {activeCycle && (
            <div className="card">
              <div className="card-body" style={{ fontSize: 12.5 }}>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Ciclo Seleccionado</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{activeCycle.region} · {activeCycle.numero}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {activeCycle.inicio} → {activeCycle.fin}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚠️ Confirmar Envío Masivo</div>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Estás a punto de enviar mensajes de WhatsApp vía <b>Z-API</b> a <b>{targets.length} consultoras reales</b> con estatus Pendiente o Retrasada.
              </p>
              <p style={{ color: 'var(--color-warning)', fontSize: 13 }}>
                Esta acción <b>no se puede deshacer</b>. ¿Estás seguro/a?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleRun}>
                <Send size={14} />
                Sí, enviar a {targets.length} personas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
