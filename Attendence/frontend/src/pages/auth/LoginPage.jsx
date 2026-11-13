import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { ShieldCheck, User } from 'lucide-react';

export default function LoginPage({ onLogin, onSwitchToRegister, showAlert }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMembers = storage.getMembers().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showAlert('Please enter your email and password.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = storage.loginUser(email, password);
      setLoading(false);
      if (result.success) {
        onLogin(result.user);
      } else {
        showAlert(result.message, 'error');
      }
    }, 150);
  };

  const handleQuickLogin = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setLoading(true);
    setTimeout(() => {
      const result = storage.loginUser(demoEmail, demoPw);
      setLoading(false);
      if (result.success) {
        onLogin(result.user);
      } else {
        showAlert(result.message, 'error');
      }
    }, 100);
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">RC-TEAMS</h1>
        <p className="auth-subtitle">ROBOTICS CLUB PORTAL</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email" className="form-control"
            placeholder="you@college.edu"
            value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="email" required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password" className="form-control"
            placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password" required
          />
        </div>
        <button
          type="submit" className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        New member?{' '}
        <button type="button" className="auth-toggle" onClick={onSwitchToRegister}>
          Request Portal Access
        </button>
      </div>

      {hasMembers && (
        <div style={{
          marginTop: '16px',
          padding: '12px 14px',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
            Quick Demo Sign-In
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => handleQuickLogin('admin@rcteams.club', 'admin123')}
            >
              <ShieldCheck size={14} color="var(--status-active-text)" /> Admin Demo
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => handleQuickLogin('member@rcteams.club', 'member123')}
            >
              <User size={14} color="var(--text-secondary)" /> Member Demo
            </button>
          </div>
        </div>
      )}

      {!hasMembers && (
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
            🚀 First Time Setup
          </strong>
          No accounts exist yet. Use "Request Portal Access" to register — your first account will be set up as Admin.
        </div>
      )}
    </div>
  );
}
