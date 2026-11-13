import React, { useState, useRef } from 'react';
import { storage } from '../../services/storage';
import {
  parseExcelFile, computeTeamAttImportDiff, exportToExcel
} from '../../services/excelService';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { CalendarCheck, Upload, Download, Search, ChevronRight, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';

function ImportModal({ onClose, onComplete, showAlert }) {
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError(''); setLoading(true);
    try {
      const rows = await parseExcelFile(file);
      if (!rows.length) { setError('File is empty.'); setLoading(false); return; }
      const existing = storage.getTeamAttendance();
      const result = computeTeamAttImportDiff(rows, existing);
      setDiff(result);
      setStep('preview');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleApply = () => {
    let records = storage.getTeamAttendance();
    diff.toUpdate.forEach(({ existing, updates }) => {
      const idx = records.findIndex(r => r.id === existing.id);
      if (idx !== -1) {
        records[idx] = {
          ...records[idx], ...updates,
          rollNumber: updates.rollNumber?.toUpperCase() || records[idx].rollNumber,
          sessions: { ...records[idx].sessions, ...updates.sessions },
          importedAt: new Date().toISOString()
        };
      }
    });
    diff.toAdd.forEach(d => {
      records.push({ id: `ta_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...d, rollNumber: d.rollNumber?.toUpperCase(), importedAt: new Date().toISOString() });
    });
    storage.setTeamAttendance(records);
    setStep('done');
  };

  return (
    <Modal title="Import Team Attendance" onClose={onClose} maxWidth="560px">
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="upload-zone" onClick={() => fileRef.current?.click()} style={{ padding: '48px 32px' }}>
            <FileSpreadsheet size={40} color="var(--text-secondary)" />
            <strong>Drop attendance Excel file here</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Supports .xlsx, .xls, .csv</span>
            <button className="btn-secondary" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Browse</button>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {error && <div style={{ color: 'var(--status-overdue-text)', fontSize: '13px', display: 'flex', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}
          {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Parsing…</p>}
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Required:</strong> Roll Number, Name<br />
            <strong style={{ color: 'var(--text-primary)' }}>Session columns:</strong> P (present), A (absent), L (leave)<br />
            Date columns with P/A/L values are automatically detected.
          </div>
        </div>
      )}

      {step === 'preview' && diff && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'To Add', count: diff.toAdd.length, color: 'var(--status-active-bg)', tc: 'var(--status-active-text)' },
              { label: 'To Update', count: diff.toUpdate.length, color: 'var(--color-yellow)', tc: 'var(--text-primary)' },
              { label: 'Invalid', count: diff.invalid.length, color: 'var(--status-overdue-bg)', tc: 'var(--status-overdue-text)' },
            ].map(({ label, count, color, tc }) => (
              <div key={label} style={{ padding: '14px', backgroundColor: color, borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: tc }}>{count}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: tc }}>{label}</div>
              </div>
            ))}
          </div>
          {diff.invalid.map((inv, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--status-overdue-text)' }}>Row {inv.row}: {inv.errors.join(', ')}</div>
          ))}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setStep('upload'); setDiff(null); }}>Back</button>
            {diff.toAdd.length + diff.toUpdate.length > 0 && (
              <button className="btn-primary" onClick={handleApply}>Apply <ChevronRight size={16} /></button>
            )}
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--status-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="var(--status-active-text)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: '600' }}>Import Complete</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{diff.toAdd.length} added · {diff.toUpdate.length} updated</p>
          </div>
          <button className="btn-primary" onClick={onComplete}>Done</button>
        </div>
      )}
    </Modal>
  );
}

function AttendanceChart({ records }) {
  if (!records.length) return null;

  // Compute per-member overall attendance %
  const memberStats = records.map(r => {
    const sessions = Object.values(r.sessions || {});
    const total = sessions.length;
    const present = sessions.filter(v => v === 'P').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: r.name?.split(' ')[0] || r.rollNumber, pct, total };
  }).filter(s => s.total > 0).slice(0, 20);

  if (!memberStats.length) return null;

  return (
    <div className="content-box">
      <h2 className="content-box-title">Attendance Overview</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-16px' }}>
        Percentage of sessions attended per member (top 20)
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={memberStats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} unit="%" />
          <Tooltip
            formatter={(v) => [`${v}%`, 'Attendance']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {memberStats.map((entry, i) => (
              <Cell key={i} fill={entry.pct >= 75 ? '#9ce2d6' : entry.pct >= 50 ? '#fcdb6d' : '#ffb7b2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#9ce2d6', borderRadius: '2px', display: 'inline-block' }} /> ≥75% (Good)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#fcdb6d', borderRadius: '2px', display: 'inline-block' }} /> 50–74%</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', backgroundColor: '#ffb7b2', borderRadius: '2px', display: 'inline-block' }} /> &lt;50% (Low)</span>
      </div>
    </div>
  );
}

export default function TeamAttendance({ currentUser, showAlert }) {
  const [records, setRecords] = useState(storage.getTeamAttendance());
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = () => setRecords(storage.getTeamAttendance());

  const filtered = records.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute all session keys across all records
  const allSessions = [...new Set(records.flatMap(r => Object.keys(r.sessions || {})))].sort();

  const handleExport = () => {
    const data = records.map(r => ({
      'Roll Number': r.rollNumber, 'Name': r.name,
      'Branch': r.branch, 'Year': r.academicYear,
      ...r.sessions
    }));
    exportToExcel(data, 'team_attendance');
    showAlert('Exported successfully.');
  };

  if (!records.length) {
    return (
      <>
        <EmptyState
          icon={CalendarCheck}
          title="No attendance data yet"
          description="Import an Excel file to get started. Roll Number and Name are required columns."
          action={currentUser.isAdmin ? () => setShowImport(true) : undefined}
          actionLabel="Import Excel"
        />
        {showImport && <ImportModal onClose={() => setShowImport(false)} onComplete={() => { setShowImport(false); refresh(); }} showAlert={showAlert} />}
      </>
    );
  }

  return (
    <>
      <AttendanceChart records={records} />

      <div className="content-box" style={{ padding: '8px' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input" placeholder="Search by name or roll number…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentUser.isAdmin && (
              <button className="btn-secondary" onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={15} /> Import
              </button>
            )}
            <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Year</th>
                {allSessions.slice(0, 8).map(s => <th key={s} style={{ textAlign: 'center', minWidth: '60px' }}>{s}</th>)}
                <th style={{ textAlign: 'center' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sessions = Object.values(r.sessions || {});
                const total = sessions.length;
                const present = sessions.filter(v => v === 'P').length;
                const pct = total > 0 ? Math.round((present / total) * 100) : null;
                const pctColor = pct === null ? 'var(--text-secondary)' : pct >= 75 ? 'var(--status-active-text)' : pct >= 50 ? '#a07000' : 'var(--status-overdue-text)';

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600' }}>{r.rollNumber}</td>
                    <td>{r.name}</td>
                    <td>{r.branch || '—'}</td>
                    <td>{r.academicYear || '—'}</td>
                    {allSessions.slice(0, 8).map(s => {
                      const v = r.sessions?.[s];
                      const bg = v === 'P' ? 'var(--status-active-bg)' : v === 'A' ? 'var(--status-overdue-bg)' : v === 'L' ? 'var(--color-yellow)' : 'transparent';
                      const tc = v === 'P' ? 'var(--status-active-text)' : v === 'A' ? 'var(--status-overdue-text)' : v === 'L' ? '#7a5a00' : 'var(--text-secondary)';
                      return (
                        <td key={s} style={{ textAlign: 'center' }}>
                          {v ? <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: bg, color: tc, padding: '2px 8px', borderRadius: '50px' }}>{v}</span> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: '700', color: pctColor }}>
                      {pct !== null ? `${pct}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onComplete={() => { setShowImport(false); refresh(); }} showAlert={showAlert} />}
    </>
  );
}

