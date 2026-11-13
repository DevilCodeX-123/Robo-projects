import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Alert({ alert, onClose }) {
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [alert, onClose]);

  if (!alert) return null;

  const isSuccess = alert.type === 'success';
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 1100,
      backgroundColor: isSuccess ? 'var(--status-active-bg)' : 'var(--status-overdue-bg)',
      color: isSuccess ? 'var(--status-active-text)' : 'var(--status-overdue-text)',
      border: `1px solid ${isSuccess ? 'var(--status-active-border)' : 'var(--status-overdue-border)'}`,
      padding: '14px 18px', borderRadius: '12px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: '500',
      animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
      maxWidth: '400px'
    }}>
      {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span style={{ flex: 1 }}>{alert.message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'inherit', display: 'flex', alignItems: 'center', padding: '2px'
      }}><X size={16} /></button>
    </div>
  );
}

