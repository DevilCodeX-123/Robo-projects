import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 32px', gap: '16px',
      textAlign: 'center'
    }}>
      {Icon && (
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={28} color="var(--text-secondary)" />
        </div>
      )}
      <div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '340px' }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <button className="btn-primary" onClick={action} style={{ marginTop: '8px' }}>
          {actionLabel || 'Add'}
        </button>
      )}
    </div>
  );
}

