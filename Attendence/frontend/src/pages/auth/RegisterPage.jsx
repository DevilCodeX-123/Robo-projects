import React, { useState } from 'react';
import { storage } from '../../services/storage';

const YEARS = ['1st yr', '2nd yr', '3rd yr', '4th yr'];

export default function RegisterPage({ onSwitchToLogin, showAlert }) {
  const [form, setForm] = useState({
    name: '', email: '', clubTag: '',
    academicYear: '1st yr', branch: '', rollNumber: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const isFirstUser = storage.getMembers().length === 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.rollNumber || !form.password) {
      showAlert('Please fill in all required fields.', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showAlert('Passwords do not match.', 'error');
      return;
    }
    if (form.password.length < 6) {
      showAlert('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      // First user becomes admin directly
      if (isFirstUser) {
        const result = storage.createAdminAccount(form);
        if (result.success) {
          showAlert('Admin account created! You can now sign in.', 'success');
          onSwitchToLogin();
        } else {
          showAlert(result.message, 'error');
        }
        return;
      }

      const result = storage.registerUser(form);
      if (result.success) {
        showAlert(result.message, 'success');
        onSwitchToLogin();
      } else {
        showAlert(result.message, 'error');
      }
    }, 150);
  };

  return (
    <div className="auth-card" style={{ maxWidth: '480px' }}>
      <div className="auth-header">
        <h1 className="auth-title">RC-TEAMS</h1>
        <p className="auth-subtitle">
          {isFirstUser ? 'CREATE ADMIN ACCOUNT' : 'REQUEST PORTAL ACCESS'}
        </p>
      </div>

      {isFirstUser && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'var(--color-teal)',
          borderRadius: '10px',
          fontSize: '13px', color: 'var(--text-primary)',
          fontWeight: '500', lineHeight: '1.5'
        }}>
          👋 Welcome! This is the first account — it will be created with Admin privileges.
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" className="form-control" placeholder="Shiyual Panchal"
            value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" className="form-control" placeholder="you@college.edu"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Roll Number *</label>
            <input type="text" className="form-control" placeholder="21CS001"
              value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Club Tag / Role *</label>
            <input type="text" className="form-control" placeholder="e.g. Firmware, CAD"
              value={form.clubTag} onChange={e => set('clubTag', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <input type="text" className="form-control" placeholder="e.g. CSE, ECE"
              value={form.branch} onChange={e => set('branch', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Academic Year</label>
          <select className="form-control" value={form.academicYear}
            onChange={e => set('academicYear', e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password *</label>
            <input type="password" className="form-control" placeholder="Min 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input type="password" className="form-control" placeholder="••••••••"
              value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
          disabled={loading}>
          {loading ? 'Submitting…' : (isFirstUser ? 'Create Admin Account' : 'Submit Access Request')}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Already have access?{' '}
        <button type="button" className="auth-toggle" onClick={onSwitchToLogin}>
          Sign In Here
        </button>
      </div>
    </div>
  );
}

