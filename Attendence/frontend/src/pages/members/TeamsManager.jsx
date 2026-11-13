import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { UsersRound, Plus, Pencil, Trash2, X } from 'lucide-react';

function TeamModal({ team, members, onSave, onClose }) {
  const [name, setName] = useState(team?.name || '');
  const [selectedIds, setSelectedIds] = useState(new Set(team?.memberIds || []));

  const toggle = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  return (
    <Modal title={team ? 'Edit Team' : 'Create Team'} onClose={onClose} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Team Name</label>
          <input type="text" className="form-control" placeholder="e.g. Build Team Alpha"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
            Members ({selectedIds.size} selected)
          </p>
          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '10px' }}>
            {members.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                No approved members to assign
              </p>
            ) : members.map(m => (
              <div key={m.id}
                onClick={() => toggle(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: selectedIds.has(m.id) ? 'rgba(28,26,23,0.04)' : 'transparent',
                  transition: 'background 0.15s'
                }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                  border: `2px solid ${selectedIds.has(m.id) ? 'var(--text-primary)' : 'var(--border-light)'}`,
                  backgroundColor: selectedIds.has(m.id) ? 'var(--text-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {selectedIds.has(m.id) && <X size={12} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{m.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.clubTag || m.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            if (!name.trim()) return;
            onSave({ name: name.trim(), memberIds: [...selectedIds] });
          }}>
            {team ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TeamsManager({ showAlert, onRefresh }) {
  const [teams, setTeams] = useState(storage.getTeams());
  const members = storage.getMembers().filter(m => m.status === 'Active');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const refresh = () => { setTeams(storage.getTeams()); onRefresh(); };

  const handleSave = (data) => {
    const allTeams = storage.getTeams();
    let newTeams;
    let updatedMembers = storage.getMembers();

    if (editing) {
      newTeams = allTeams.map(t => t.id === editing.id ? { ...t, ...data } : t);
      // Update member teamIds
      updatedMembers = updatedMembers.map(m => {
        if (data.memberIds.includes(m.id)) return { ...m, teamId: editing.id };
        if (m.teamId === editing.id && !data.memberIds.includes(m.id)) return { ...m, teamId: null };
        return m;
      });
      showAlert('Team updated.');
      setEditing(null);
    } else {
      const newTeam = { id: `team_${Date.now()}`, name: data.name, memberIds: data.memberIds, createdAt: new Date().toISOString() };
      newTeams = [...allTeams, newTeam];
      updatedMembers = updatedMembers.map(m =>
        data.memberIds.includes(m.id) ? { ...m, teamId: newTeam.id } : m
      );
      showAlert('Team created.');
      setCreating(false);
    }

    storage.setTeams(newTeams);
    storage.setMembers(updatedMembers);
    refresh();
  };

  const handleDelete = () => {
    const allTeams = storage.getTeams().filter(t => t.id !== deleting.id);
    storage.setTeams(allTeams);
    // Unassign members
    const updatedMembers = storage.getMembers().map(m =>
      m.teamId === deleting.id ? { ...m, teamId: null } : m
    );
    storage.setMembers(updatedMembers);
    showAlert('Team deleted.', 'error');
    setDeleting(null);
    refresh();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState icon={UsersRound} title="No teams yet"
          description="Create teams to group members for projects and assignments."
          action={() => setCreating(true)} actionLabel="Create First Team" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {teams.map(team => {
            const teamMembers = (team.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
            return (
              <div key={team.id} className="content-box" style={{ gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '600' }}>{team.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => setEditing(team)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => setDeleting(team)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {teamMembers.length === 0 ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No members assigned</span>
                  ) : teamMembers.map(m => (
                    <span key={m.id} style={{
                      fontSize: '12px', padding: '3px 10px',
                      backgroundColor: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '50px', color: 'var(--text-primary)', fontWeight: '500'
                    }}>{m.name}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <TeamModal
          team={editing} members={members}
          onSave={handleSave}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Team"
          message={`Delete "${deleting.name}"? Members will be unassigned but not removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          confirmLabel="Delete Team"
          danger
        />
      )}
    </>
  );
}

