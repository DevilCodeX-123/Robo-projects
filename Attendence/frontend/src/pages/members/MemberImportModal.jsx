import React, { useState, useRef } from 'react';
import { storage } from '../../services/storage';
import { parseExcelFile, computeMemberImportDiff } from '../../services/excelService';
import Modal from '../../components/Modal';
import { FileSpreadsheet, AlertCircle, Check, ChevronRight } from 'lucide-react';

const STEPS = ['upload', 'preview', 'done'];

export default function MemberImportModal({ onClose, showAlert, onComplete }) {
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) { setError('The file appears to be empty.'); setLoading(false); return; }
      const members = storage.getMembers();
      const pending = storage.getPending();
      const result = computeMemberImportDiff(rows, members, pending);
      setDiff(result);
      setStep('preview');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!diff) return;
    let members = storage.getMembers();
    let pending = storage.getPending();

    // Apply updates
    diff.toUpdate.forEach(({ existing, updates }) => {
      const idx = members.findIndex(m => m.id === existing.id);
      if (idx !== -1) {
        members[idx] = { ...members[idx], ...updates, rollNumber: updates.rollNumber?.toUpperCase() || members[idx].rollNumber };
      }
    });

    // Apply adds
    diff.toAdd.forEach(d => {
      if (autoApprove) {
        const nm = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: d.name, email: d.email,
          clubTag: d.clubTag || '', academicYear: d.academicYear || '',
          branch: d.branch || '', rollNumber: d.rollNumber?.toUpperCase() || '',
          status: 'Active', isAdmin: false, teamId: null,
          approvedAt: new Date().toISOString(),
          registeredAt: new Date().toISOString()
        };
        members.push(nm);
      } else {
        const np = {
          id: `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: d.name, email: d.email,
          clubTag: d.clubTag || '', academicYear: d.academicYear || '',
          branch: d.branch || '', rollNumber: d.rollNumber?.toUpperCase() || '',
          status: 'Pending', registeredAt: new Date().toISOString()
        };
        pending.push(np);
      }
    });

    storage.setMembers(members);
    storage.setPending(pending);
    setStep('done');
  };

  return (
    <Modal title="Import Members from Excel" onClose={onClose} maxWidth="600px">
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '8px' }}>
        {['Upload', 'Preview', 'Done'].map((s, i) => {
          const stepId = STEPS[i];
          const isCurrent = step === stepId;
          const isDone = STEPS.indexOf(step) > i;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: '600',
                color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--status-active-text)' : 'var(--text-secondary)'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  backgroundColor: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--status-active-bg)' : 'var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {isDone ? <Check size={12} color="var(--status-active-text)" /> : <span style={{ color: isCurrent ? '#fff' : 'var(--text-secondary)', fontSize: '11px' }}>{i + 1}</span>}
                </div>
                {s}
              </div>
              {i < 2 && <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)', margin: '0 8px' }} />}
            </div>
          );
        })}
      </div>

      {/* Upload */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="upload-zone" onClick={() => fileRef.current?.click()} style={{ padding: '48px 32px' }}>
            <FileSpreadsheet size={40} color="var(--text-secondary)" />
            <strong style={{ fontSize: '16px' }}>Drop your Excel or CSV file here</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Supports .xlsx, .xls, .csv</span>
            <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              Browse Files
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {error && <div style={{ color: 'var(--status-overdue-text)', fontSize: '13px', display: 'flex', gap: '8px' }}><AlertCircle size={16} /> {error}</div>}
          {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Parsing file…</p>}
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Required columns:</strong> Roll Number, Name, Email<br />
            <strong style={{ color: 'var(--text-primary)' }}>Optional:</strong> Club Tag, Branch, Academic Year<br />
            Existing records matched by Roll Number (Email as fallback) will be updated, not duplicated.
          </div>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && diff && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'To Add', count: diff.toAdd.length, color: 'var(--status-active-bg)', textColor: 'var(--status-active-text)' },
              { label: 'To Update', count: diff.toUpdate.length, color: 'var(--color-yellow)', textColor: 'var(--text-primary)' },
              { label: 'Skipped', count: diff.skipped.length, color: 'var(--bg-sidebar)', textColor: 'var(--text-secondary)' },
              { label: 'Invalid', count: diff.invalid.length, color: 'var(--status-overdue-bg)', textColor: 'var(--status-overdue-text)' },
            ].map(({ label, count, color, textColor }) => (
              <div key={label} style={{ padding: '14px', backgroundColor: color, borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>{count}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: textColor }}>{label}</div>
              </div>
            ))}
          </div>

          {diff.invalid.length > 0 && (
            <div style={{ maxHeight: '100px', overflow: 'auto', backgroundColor: 'var(--status-overdue-bg)', borderRadius: '8px', padding: '10px' }}>
              {diff.invalid.map((inv, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--status-overdue-text)' }}>
                  Row {inv.row}: {inv.errors.join(', ')}
                </div>
              ))}
            </div>
          )}

          {diff.toAdd.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px' }}>
              <input type="checkbox" id="autoApprove" checked={autoApprove}
                onChange={e => setAutoApprove(e.target.checked)} />
              <label htmlFor="autoApprove" style={{ fontSize: '13px', cursor: 'pointer' }}>
                Auto-approve new records (add directly to Active roster instead of Pending)
              </label>
            </div>
          )}

          {(diff.toAdd.length + diff.toUpdate.length) === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No changes to apply. All records already exist and are up to date.
            </p>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Action</th><th>Name</th><th>Roll Number</th><th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.toUpdate.map(({ existing, updates }, i) => (
                    <tr key={`u${i}`}>
                      <td><span style={{ fontSize: '11px', backgroundColor: 'var(--color-yellow)', padding: '2px 8px', borderRadius: '50px' }}>Update</span></td>
                      <td>{updates.name || existing.name}</td>
                      <td>{updates.rollNumber || existing.rollNumber}</td>
                      <td>{updates.email || existing.email}</td>
                    </tr>
                  ))}
                  {diff.toAdd.map((d, i) => (
                    <tr key={`a${i}`}>
                      <td><span style={{ fontSize: '11px', backgroundColor: 'var(--status-active-bg)', color: 'var(--status-active-text)', padding: '2px 8px', borderRadius: '50px' }}>Add</span></td>
                      <td>{d.name}</td>
                      <td>{d.rollNumber}</td>
                      <td>{d.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setStep('upload'); setDiff(null); }}>Back</button>
            {(diff.toAdd.length + diff.toUpdate.length) > 0 && (
              <button className="btn-primary" onClick={handleApply}>
                Apply Import <ChevronRight size={16} />
              </button>
            )}
            {(diff.toAdd.length + diff.toUpdate.length) === 0 && (
              <button className="btn-secondary" onClick={onClose}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && diff && (
        <div style={{ textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--status-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={28} color="var(--status-active-text)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: '600' }}>Import Complete</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
              {diff.toUpdate.length} record{diff.toUpdate.length !== 1 ? 's' : ''} updated · {diff.toAdd.length} {autoApprove ? 'approved' : 'added to pending'}
            </p>
          </div>
          <button className="btn-primary" onClick={onComplete}>Done</button>
        </div>
      )}
    </Modal>
  );
}

