import React, { useState } from 'react';
import { storage } from '../../services/storage';
import Modal from '../../components/Modal';
import { Pencil, Check } from 'lucide-react';

const YEARS = ['1st yr', '2nd yr', '3rd yr', '4th yr'];
const Field = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>{value || '—'}</span>
  </div>
);

export default function ProfilePage({ currentUser, showAlert, onUserUpdate }) {
  const members = storage.getMembers();
  const teams = storage.getTeams();

  const member = members.find(m => m.id === currentUser.id) || currentUser;
  const team = teams.find(t => t.id === member.teamId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: member.name, clubTag: member.clubTag || '',
    academicYear: member.academicYear || '', branch: member.branch || '',
    teamId: member.teamId || ''
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) {
      showAlert('Name cannot be empty.', 'error');
      return;
    }
    const result = storage.updateMember(member.id, form);
    if (result.success) {
      const updated = { ...currentUser, ...form };
      onUserUpdate(updated);
      setEditing(false);
      showAlert('Profile updated.');
    } else {
      showAlert(result.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your member information and club details.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(true)}>
          <Pencil size={16} /> Edit Profile
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
        {/* Avatar + name card */}
        <div className="content-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'var(--color-teal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)',
              flexShrink: 0
            }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>
                {member.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                {member.clubTag || 'Team Member'}
                {member.isAdmin && (
                  <span className="status-pill active" style={{ marginLeft: '10px', fontSize: '11px' }}>Admin</span>
                )}
              </p>
              <span className={`status-pill ${member.status?.toLowerCase()}`} style={{ marginTop: '8px', display: 'inline-block', fontSize: '11px' }}>
                {member.status}
              </span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="content-box">
          <h2 className="content-box-title">Member Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <Field label="Full Name" value={member.name} />
            <Field label="Email Address" value={member.email} />
            <Field label="Roll Number" value={member.rollNumber} />
            <Field label="Club Tag / Role" value={member.clubTag} />
            <Field label="Academic Year" value={member.academicYear} />
            <Field label="Branch" value={member.branch} />
            <Field label="Assigned Team" value={team?.name} />
            <Field label="Member Since" value={member.registeredAt ? new Date(member.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-control" value={form.name}
                onChange={e => setF('name', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Club Tag / Role</label>
                <input type="text" className="form-control" value={form.clubTag}
                  onChange={e => setF('clubTag', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input type="text" className="form-control" value={form.branch}
                  onChange={e => setF('branch', e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: currentUser.isAdmin ? '16px' : 0 }}>
              <label>Academic Year</label>
              <select className="form-control" value={form.academicYear}
                onChange={e => setF('academicYear', e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {currentUser.isAdmin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Assigned Team</label>
                <select className="form-control" value={form.teamId || ''}
                  onChange={e => setF('teamId', e.target.value)}>
                  <option value="">— No team —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                <Check size={16} /> Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

