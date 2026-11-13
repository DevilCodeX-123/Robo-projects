import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Users, Search, Pencil, UserX, UserCheck, Eye, Plus } from 'lucide-react';

const YEARS = ['All', '1st yr', '2nd yr', '3rd yr', '4th yr'];
const STATUSES = ['All', 'Active', 'Inactive'];

function MemberProfileModal({ member, team, onClose }) {
  return (
    <Modal title="Member Profile" onClose={onClose} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'var(--color-teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', flexShrink: 0
          }}>
            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: '600' }}>
              {member.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
              {member.clubTag || 'Team Member'}
              {member.isAdmin && (
                <span className="status-pill active" style={{ marginLeft: '8px', fontSize: '11px' }}>
                  Admin
                </span>
              )}
            </p>
            <span className={`status-pill ${member.status?.toLowerCase()}`} style={{ marginTop: '8px', display: 'inline-block' }}>
              {member.status}
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px',
          padding: '16px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '12px'
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Email Address
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{member.email || '—'}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Roll Number
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{member.rollNumber || '—'}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Academic Year
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{member.academicYear || '—'}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Branch / Stream
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{member.branch || '—'}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Assigned Sub-Team
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>{team?.name || 'No team assigned'}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Member Since
            </span>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>
              {member.registeredAt ? new Date(member.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ teams, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    clubTag: '',
    branch: '',
    academicYear: '1st yr',
    teamId: '',
    isAdmin: false,
    password: 'welcome123'
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.rollNumber.trim()) return;
    onSave(form);
  };

  return (
    <Modal title="Add New Club Member" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" className="form-control" placeholder="e.g. Aditi Joshi" value={form.name}
              onChange={e => setF('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Roll Number *</label>
            <input type="text" className="form-control" placeholder="e.g. RC25MECH014" value={form.rollNumber}
              onChange={e => setF('rollNumber', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input type="email" className="form-control" placeholder="aditi@college.edu" value={form.email}
            onChange={e => setF('email', e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Club Role / Tag</label>
            <input type="text" className="form-control" placeholder="e.g. Telemetry & PCB" value={form.clubTag}
              onChange={e => setF('clubTag', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <input type="text" className="form-control" placeholder="e.g. Electronics & Comm." value={form.branch}
              onChange={e => setF('branch', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Academic Year</label>
            <select className="form-control" value={form.academicYear}
              onChange={e => setF('academicYear', e.target.value)}>
              {['1st yr', '2nd yr', '3rd yr', '4th yr'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assigned Team</label>
            <select className="form-control" value={form.teamId}
              onChange={e => setF('teamId', e.target.value)}>
              <option value="">— No team assigned —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Initial Account Password</label>
          <input type="text" className="form-control" value={form.password}
            onChange={e => setF('password', e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" id="isAdminAdd" checked={form.isAdmin}
            onChange={e => setF('isAdmin', e.target.checked)} />
          <label htmlFor="isAdminAdd" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
            Grant Administrator privileges
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Member</button>
        </div>
      </form>
    </Modal>
  );
}

function MemberModal({ member, teams, currentUser, onSave, onClose }) {
  const [form, setForm] = useState({
    name: member.name, email: member.email,
    clubTag: member.clubTag || '', academicYear: member.academicYear || '',
    branch: member.branch || '', rollNumber: member.rollNumber || '',
    teamId: member.teamId || '', status: member.status || 'Active',
    isAdmin: member.isAdmin || false
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title="Edit Member Information" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" className="form-control" value={form.name}
              onChange={e => setF('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Roll Number *</label>
            <input type="text" className="form-control" value={form.rollNumber}
              onChange={e => setF('rollNumber', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input type="email" className="form-control" value={form.email}
            onChange={e => setF('email', e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Club Tag / Role</label>
            <input type="text" className="form-control" value={form.clubTag}
              onChange={e => setF('clubTag', e.target.value)} placeholder="e.g. Firmware, Mech" />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <input type="text" className="form-control" value={form.branch}
              onChange={e => setF('branch', e.target.value)} placeholder="e.g. CSE, ECE" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Academic Year</label>
            <select className="form-control" value={form.academicYear}
              onChange={e => setF('academicYear', e.target.value)}>
              {['', '1st yr', '2nd yr', '3rd yr', '4th yr'].map(y => (
                <option key={y} value={y}>{y || 'Not specified'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status}
              onChange={e => setF('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Assigned Team</label>
          <select className="form-control" value={form.teamId}
            onChange={e => setF('teamId', e.target.value)}>
            <option value="">— No team (Remove from team) —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {currentUser.isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="isAdmin" checked={form.isAdmin}
              onChange={e => setF('isAdmin', e.target.checked)} />
            <label htmlFor="isAdmin" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
              Grant Administrator privileges
            </label>
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MemberDirectory({ currentUser, showAlert, onRefresh }) {
  const [members, setMembers] = useState(storage.getMembers());
  const teams = storage.getTeams();
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');

  const [addingMember, setAddingMember] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [deactivating, setDeactivating] = useState(null);

  const refresh = () => { setMembers(storage.getMembers()); onRefresh(); };

  // Extract unique branches for filter
  const branchList = ['All', ...Array.from(new Set(members.map(m => m.branch).filter(Boolean)))];

  // For non-admin, show Active members primarily
  const displayMembers = currentUser.isAdmin
    ? members
    : members.filter(m => m.status === 'Active');

  const filtered = displayMembers.filter(m => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      m.name?.toLowerCase().includes(q) ||
      m.rollNumber?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.branch?.toLowerCase().includes(q);
    const matchYear = yearFilter === 'All' || m.academicYear === yearFilter;
    const matchBranch = branchFilter === 'All' || m.branch === branchFilter;
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchTeam = teamFilter === 'All' || m.teamId === teamFilter;
    return matchSearch && matchYear && matchBranch && matchStatus && matchTeam;
  });

  const handleAddMember = (formData) => {
    const res = storage.addMemberByAdmin(formData);
    if (res.success) {
      showAlert(`Member "${formData.name}" added to club.`);
      setAddingMember(false);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleSave = (form) => {
    if (!form.name.trim()) { showAlert('Name cannot be empty.', 'error'); return; }
    const result = storage.updateMember(editing.id, form);
    if (result.success) {
      showAlert('Member updated successfully.');
      setEditing(null);
      refresh();
    } else {
      showAlert(result.message, 'error');
    }
  };

  const toggleStatus = (member) => {
    if (member.status === 'Active') {
      // Check if this member is the last active Admin
      if (member.isAdmin) {
        const otherActiveAdmins = members.filter(m => m.isAdmin && m.status === 'Active' && m.id !== member.id);
        if (otherActiveAdmins.length === 0) {
          showAlert('Action blocked: Cannot deactivate the last remaining active Administrator.', 'error');
          return;
        }
      }
      setDeactivating(member);
    } else {
      storage.updateMember(member.id, { status: 'Active' });
      showAlert(`${member.name} reactivated.`);
      refresh();
    }
  };

  const confirmDeactivate = () => {
    const res = storage.updateMember(deactivating.id, { status: 'Inactive' });
    if (res.success) {
      showAlert(`${deactivating.name} deactivated.`);
      setDeactivating(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members yet"
        description="Members will appear here once registrations are approved or added by an administrator."
        action={currentUser.isAdmin ? () => setAddingMember(true) : undefined}
        actionLabel="Add Member"
      />
    );
  }

  return (
    <>
      {/* Search and Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '1 1 500px' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, roll number, or branch…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            {YEARS.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
          </select>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
          >
            {branchList.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
          >
            <option value="All">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {currentUser.isAdmin && (
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          )}
        </div>

        {currentUser.isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setAddingMember(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={15} /> Add Member
          </button>
        )}
      </div>

      {/* Directory Table */}
      <div className="content-box" style={{ padding: '8px' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Roll Number</th>
                <th>Club Tag</th>
                <th>Branch / Year</th>
                <th>Assigned Team</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    No members match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(member => {
                  const team = teams.find(t => t.id === member.teamId);
                  return (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: 'var(--color-teal)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '700', flexShrink: 0
                          }}>
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{member.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500' }}>{member.rollNumber || '—'}</td>
                      <td>{member.clubTag || '—'}</td>
                      <td>{[member.branch, member.academicYear].filter(Boolean).join(' · ') || '—'}</td>
                      <td>
                        {team ? (
                          <span style={{
                            fontSize: '11px', padding: '3px 10px', borderRadius: '50px',
                            backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)',
                            fontWeight: '600'
                          }}>
                            {team.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`status-pill ${member.status?.toLowerCase()}`}>{member.status}</span>
                        {member.isAdmin && (
                          <span className="status-pill active" style={{ marginLeft: '6px', fontSize: '10px' }}>
                            Admin
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => setViewingProfile(member)}
                            title="View Profile Details"
                          >
                            <Eye size={13} />
                          </button>
                          {currentUser.isAdmin && (
                            <>
                              <button
                                className="btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => setEditing(member)}
                                title="Edit Member Information"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => toggleStatus(member)}
                                title={member.status === 'Active' ? 'Deactivate Member' : 'Reactivate Member'}
                              >
                                {member.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Profile Modal */}
      {viewingProfile && (
        <MemberProfileModal
          member={viewingProfile}
          team={teams.find(t => t.id === viewingProfile.teamId)}
          currentUser={currentUser}
          onClose={() => setViewingProfile(null)}
        />
      )}

      {/* Add Member Modal (Admin Only) */}
      {addingMember && (
        <AddMemberModal
          teams={teams}
          onSave={handleAddMember}
          onClose={() => setAddingMember(false)}
        />
      )}

      {/* Edit Modal (Admin Only) */}
      {editing && (
        <MemberModal
          member={editing}
          teams={teams}
          currentUser={currentUser}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Deactivate Confirmation */}
      {deactivating && (
        <ConfirmDialog
          title="Deactivate Member"
          message={`Are you sure you want to deactivate ${deactivating.name}? They will be marked Inactive and won't count towards active members until reactivated.`}
          onConfirm={confirmDeactivate}
          onCancel={() => setDeactivating(null)}
          confirmLabel="Deactivate"
          danger
        />
      )}
    </>
  );
}
