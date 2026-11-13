import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { exportToExcel } from '../../services/excelService';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { Users, Plus, Search, Download, Calendar, Mail, Phone, CheckCircle2 } from 'lucide-react';

function AddVisitorModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0]
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    onSave(form);
  };

  return (
    <Modal title="Record Visitor Attendance" onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Visitor Full Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Dr. K. Ramanathan"
            value={form.name}
            onChange={e => setF('name', e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="visitor@domain.com"
              value={form.email}
              onChange={e => setF('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setF('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Date of Visit *</label>
          <input
            type="date"
            className="form-control"
            value={form.date}
            onChange={e => setF('date', e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Purpose of Visit</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Guest Lecture, Lab Audit, Alumni Project Review"
            value={form.purpose}
            onChange={e => setF('purpose', e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Record Visit</button>
        </div>
      </form>
    </Modal>
  );
}

export default function VisitorAttendance({ currentUser, showAlert }) {
  const [records, setRecords] = useState(storage.getVisitorAttendance());
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = () => setRecords(storage.getVisitorAttendance());

  const handleAdd = (data) => {
    storage.addVisitorAttendance({
      ...data,
      recordedBy: currentUser.name
    });
    showAlert(`Recorded visitor attendance for ${data.name}.`);
    setAdding(false);
    refresh();
  };

  const handleExport = () => {
    const data = records.map(r => ({
      'Visitor Name': r.name,
      'Date of Visit': r.date,
      'Purpose': r.purpose,
      'Email': r.email || '—',
      'Phone': r.phone || '—',
      'Recorded By': r.recordedBy || 'Admin',
      'Logged At': r.recordedAt ? new Date(r.recordedAt).toLocaleString() : ''
    }));
    exportToExcel(data, `Visitor_Attendance_${new Date().toISOString().split('T')[0]}`);
    showAlert('Visitor attendance exported to Excel.');
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.purpose?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 240px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search visitors by name or purpose…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Download size={14} /> Export Excel
          </button>
          <button className="btn-primary" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Plus size={14} /> Record Visitor
          </button>
        </div>
      </div>

      <div className="content-box" style={{ padding: '8px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No visitor logs recorded"
            description="Use 'Record Visitor' to log faculty, alumni, or guest visits to the robotics lab."
            action={() => setAdding(true)}
            actionLabel="Record First Visitor"
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Date of Visit</th>
                  <th>Purpose</th>
                  <th>Contact Email / Phone</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600' }}>{r.name}</td>
                    <td>{r.date}</td>
                    <td>{r.purpose || 'General Lab Visit'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {r.email && <div><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{r.email}</div>}
                      {r.phone && <div><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{r.phone}</div>}
                      {!r.email && !r.phone && '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {r.recordedBy || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddVisitorModal
          onSave={handleAdd}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
