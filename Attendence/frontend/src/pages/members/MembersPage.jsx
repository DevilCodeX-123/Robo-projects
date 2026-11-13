import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Users, UserCheck, UsersRound, FileSpreadsheet } from 'lucide-react';
import MemberDirectory from './MemberDirectory';
import PendingApprovals from './PendingApprovals';
import TeamsManager from './TeamsManager';
import MemberImportModal from './MemberImportModal';

const TABS = [
  { id: 'directory', label: 'Directory', Icon: Users },
  { id: 'pending',   label: 'Pending Approvals', Icon: UserCheck, adminOnly: true },
  { id: 'teams',     label: 'Teams', Icon: UsersRound, adminOnly: true },
];

export default function MembersPage({ currentUser, showAlert, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('directory');
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);
  const pendingCount = storage.getPending().length;

  const visibleTabs = currentUser.isAdmin ? TABS : TABS.filter(t => !t.adminOnly);

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Members Management</h1>
          <p className="page-subtitle">Directory, approvals, teams and Excel member data.</p>
        </div>
        {currentUser.isAdmin && (
          <button className="btn-secondary" onClick={() => setShowImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={16} /> Import Excel
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="category-pills" style={{ marginTop: '-16px' }}>
        {visibleTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`category-pill ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon size={14} />
            {label}
            {id === 'pending' && pendingCount > 0 && (
              <span style={{
                backgroundColor: 'var(--status-overdue-bg)',
                color: 'var(--status-overdue-text)',
                borderRadius: '50px', padding: '1px 7px', fontSize: '11px', fontWeight: '700'
              }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'directory' && (
        <MemberDirectory
          key={refreshKey} currentUser={currentUser}
          showAlert={showAlert} onRefresh={refresh}
        />
      )}
      {activeTab === 'pending' && currentUser.isAdmin && (
        <PendingApprovals
          key={refreshKey} currentUser={currentUser}
          showAlert={showAlert} onRefresh={refresh}
        />
      )}
      {activeTab === 'teams' && currentUser.isAdmin && (
        <TeamsManager
          key={refreshKey} showAlert={showAlert} onRefresh={refresh}
        />
      )}

      {showImport && (
        <MemberImportModal
          onClose={() => setShowImport(false)}
          showAlert={showAlert}
          onComplete={() => { setShowImport(false); refresh(); }}
        />
      )}
    </>
  );
}

