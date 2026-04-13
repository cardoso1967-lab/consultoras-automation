import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />,
    error: <XCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />,
    info: <Info size={18} style={{ color: 'var(--color-info)', flexShrink: 0 }} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <div style={{ flex: 1 }}>
            <div className="toast-title">{t.title}</div>
            {t.body && <div className="toast-body">{t.body}</div>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
