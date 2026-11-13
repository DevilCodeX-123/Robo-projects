import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: danger ? 'var(--status-overdue-bg)' : 'var(--color-yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertTriangle size={20} color={danger ? 'var(--status-overdue-text)' : 'var(--text-primary)'} />
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.5', paddingTop: '8px' }}>
            {message}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            style={danger ? { backgroundColor: 'var(--status-overdue-text)' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

