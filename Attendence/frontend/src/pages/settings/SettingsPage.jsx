import React, { useState } from 'react';
import { Moon, Sun, Key, Trash2 } from 'lucide-react';
import { storage } from '../../services/storage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function SettingsPage({ currentUser, showAlert, onUserUpdate, onLogout, theme, toggleTheme }) {
  const [pwForm, setPwForm] = useState({ currentPw: '', newEmail: currentUser.email, newPw: '', confirmPw: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const setF = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (!pwForm.currentPw) {
      showAlert('Enter your current password to make changes.', 'error');
      return;
    }
    // Verify current password
    const creds = storage.getCredentials();
    const el = currentUser.email.toLowerCase();
    if (!creds[el] || creds[el].password !== pwForm.currentPw) {
      showAlert('Current password is incorrect.', 'error');
      return;
    }
    if (pwForm.newPw && pwForm.newPw !== pwForm.confirmPw) {
      showAlert('New passwords do not match.', 'error');
      return;
    }
    if (pwForm.newPw && pwForm.newPw.length < 6) {
      showAlert('New password must be at least 6 characters.', 'error');
      return;
    }

    const result = storage.updateCredentials(
      currentUser.email,
      pwForm.newEmail || currentUser.email,
      pwForm.newPw || pwForm.currentPw
    );

    if (result.success) {
      onUserUpdate(result.user);
      setPwForm({ currentPw: '', newEmail: result.user?.email || pwForm.newEmail, newPw: '', confirmPw: '' });
      showAlert('Credentials updated successfully.');
    } else {
      showAlert(result.message, 'error');
    }
  };

  const handleClearData = () => {
    storage.clearAllData();
    showAlert('All data cleared. Reloading…', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Appearance, account credentials and data management.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>

        {/* Appearance */}
        <div className="content-box">
          <h2 className="content-box-title">Appearance</h2>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0', borderBottom: '1px solid var(--border-light)'
          }}>
            <div>
              <p style={{ fontWeight: '600', fontSize: '15px' }}>Theme</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Choose between light and dark mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 20px', borderRadius: '50px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-sidebar)',
                cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                color: 'var(--text-primary)', transition: 'all 0.2s'
              }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="content-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Key size={20} color="var(--text-secondary)" />
            <h2 className="content-box-title" style={{ marginBottom: 0 }}>Account Credentials</h2>
          </div>
          <form onSubmit={handleSaveCredentials}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control"
                value={pwForm.newEmail}
                onChange={e => setF('newEmail', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Current Password *</label>
              <input type="password" className="form-control"
                placeholder="Enter current password to save changes"
                value={pwForm.currentPw}
                onChange={e => setF('currentPw', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password (optional)</label>
                <input type="password" className="form-control"
                  placeholder="Leave blank to keep current"
                  value={pwForm.newPw}
                  onChange={e => setF('newPw', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" className="form-control"
                  placeholder="••••••••"
                  value={pwForm.confirmPw}
                  onChange={e => setF('confirmPw', e.target.value)}
                  disabled={!pwForm.newPw} />
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '8px' }}>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>

        {/* Danger Zone — Admin only */}
        {currentUser.isAdmin && (
          <div className="content-box" style={{ borderColor: 'var(--status-overdue-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trash2 size={20} color="var(--status-overdue-text)" />
              <h2 className="content-box-title" style={{ marginBottom: 0, color: 'var(--status-overdue-text)' }}>
                Danger Zone
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>Clear All Data</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Permanently remove all members, inventory, projects and attendance records.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowClearConfirm(true)}
                style={{ backgroundColor: 'var(--status-overdue-text)', flexShrink: 0 }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Clear All Data"
          message="This will permanently delete all members, inventory, projects, attendance records and credentials. This cannot be undone. Are you sure?"
          onConfirm={handleClearData}
          onCancel={() => setShowClearConfirm(false)}
          confirmLabel="Yes, Clear Everything"
          danger
        />
      )}
    </>
  );
}

