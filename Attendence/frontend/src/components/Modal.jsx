import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = '500px' }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div className="modal-content" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 className="content-box-title" style={{ marginBottom: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

