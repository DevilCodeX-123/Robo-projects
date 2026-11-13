import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import { UserCheck } from 'lucide-react';

export default function PendingApprovals({ showAlert, onRefresh }) {
  const [pending, setPending] = useState(storage.getPending());

  const refresh = () => { setPending(storage.getPending()); onRefresh(); };

  const handleApprove = (id) => {
    const result = storage.approveMember(id);
    if (result.success) {
      showAlert(`${result.member.name} approved and added to the roster.`);
      refresh();
    } else {
      showAlert(result.message, 'error');
    }
  };

  const handleDecline = (id) => {
    const person = pending.find(p => p.id === id);
    storage.declineMember(id);
    showAlert(`${person?.name || 'Member'} request declined.`, 'error');
    refresh();
  };

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No pending requests"
        description="New member registrations will appear here for your review."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {pending.length} request{pending.length !== 1 ? 's' : ''} awaiting approval
      </div>
      {pending.map(person => (
        <div key={person.id} className="approval-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'var(--color-yellow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', flexShrink: 0
            }}>{person.name.charAt(0)}</div>
            <div className="approval-details" style={{ flex: 1 }}>
              <span className="approval-name">{person.name}</span>
              <span className="approval-meta">{person.email}</span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                {person.rollNumber && <span className="approval-meta">Roll: {person.rollNumber}</span>}
                {person.clubTag && <span className="approval-meta">Tag: {person.clubTag}</span>}
                {person.branch && <span className="approval-meta">Branch: {person.branch}</span>}
                {person.academicYear && <span className="approval-meta">{person.academicYear}</span>}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Applied {person.registeredAt ? new Date(person.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>
          </div>
          <div className="approval-actions">
            <button className="btn-approve" onClick={() => handleApprove(person.id)}>Approve</button>
            <button className="btn-decline" onClick={() => handleDecline(person.id)}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

