import React, { useState } from 'react';
import { Settings, Key, Phone, Globe, Shield, Save } from 'lucide-react';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [zapiInstance, setZapiInstance] = useState(import.meta.env.VITE_ZAPI_INSTANCE_ID || '');
  const [zapiToken, setZapiToken] = useState(import.meta.env.VITE_ZAPI_TOKEN || '');
  const [zapiClientToken, setZapiClientToken] = useState(import.meta.env.VITE_ZAPI_CLIENT_TOKEN || '');
  const [testPhone, setTestPhone] = useState(import.meta.env.VITE_TEST_PHONE || '');
  const [romanceUrl, setRomanceUrl] = useState(import.meta.env.VITE_ROMANCELEADS_API_URL || '');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // In a real app, these would be stored securely
    // Env vars in Vite are build-time only, so show instructions
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Configuración</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Credenciales y parámetros del sistema</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Z-API */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Key size={14} />Credenciales Z-API</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-field">
              <label className="form-label">Instance ID</label>
              <input className="form-input" value={zapiInstance} onChange={e => setZapiInstance(e.target.value)} placeholder="Ej: 3CB04239..." />
            </div>
            <div className="form-field">
              <label className="form-label">Token</label>
              <input className="form-input" type="password" value={zapiToken} onChange={e => setZapiToken(e.target.value)} placeholder="••••••••••••" />
            </div>
            <div className="form-field">
              <label className="form-label">Client Token</label>
              <input className="form-input" type="password" value={zapiClientToken} onChange={e => setZapiClientToken(e.target.value)} placeholder="••••••••••••" />
            </div>
          </div>
        </div>

        {/* RomanceLeads & Test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Globe size={14} />RomanceLeads API</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-field">
                <label className="form-label">URL Base</label>
                <input className="form-input" value={romanceUrl} onChange={e => setRomanceUrl(e.target.value)} placeholder="https://api.v1.romanceleads.io" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><Phone size={14} />Modo Prueba</div>
            </div>
            <div className="card-body">
              <div className="form-field">
                <label className="form-label">Teléfono de Prueba</label>
                <input className="form-input" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="521XXXXXXXXXX" />
                <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>Formato: 52 + 10 dígitos mexicanos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important notice */}
      <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--color-info-bg)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Shield size={16} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13 }}>
            <b>Nota de Seguridad:</b> Los valores reales deben configurarse en el archivo <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>.env</code> en la raíz del proyecto para que sean reconocidos por Vite al compilar. No se almacenan datos sensibles en el navegador.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={14} />
          {saved ? '✅ Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
