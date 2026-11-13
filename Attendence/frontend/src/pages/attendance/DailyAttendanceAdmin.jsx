import React, { useState, useRef } from 'react';
import { storage } from '../../services/storage';
import { exportToExcel, parseExcelFile } from '../../services/excelService';
import Modal from '../../components/Modal';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, Search,
  Calendar, Download, Upload, History, UserCheck, AlertCircle, FileSpreadsheet
} from 'lucide-react';

const YEARS = ['All', '1st yr', '2nd yr', '3rd yr', '4th yr'];

function AttendanceCorrectionModal({ member, record, onSave, onClose }) {
  const [status, setStatus] = useState(record?.status || 'Present');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(status, reason);
  };

  return (
    <Modal title={`Correct Attendance: ${member.name}`} onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Roll Number: {member.rollNumber} · Date: {record?.date}</span>
        </div>

        <div className="form-group">
          <label>Corrected Status *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['Present', 'Absent', 'Leave'].map(s => (
              <button
                key={s}
                type="button"
                className={`btn-secondary ${status === s ? 'active' : ''}`}
                onClick={() => setStatus(s)}
                style={{
                  padding: '10px',
                  fontWeight: '700',
                  borderColor: status === s ? 'var(--text-primary)' : 'var(--border-light)',
                  backgroundColor: status === s ? (s === 'Present' ? 'var(--status-active-bg)' : s === 'Absent' ? 'var(--status-overdue-bg)' : 'var(--color-yellow)') : 'transparent',
                  color: status === s ? (s === 'Present' ? 'var(--status-active-text)' : s === 'Absent' ? 'var(--status-overdue-text)' : '#7a5a00') : 'var(--text-primary)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Correction Reason / Note</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Student arrived late with faculty permission"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {record?.history?.length > 0 && (
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', fontSize: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Correction Audit Trail ({record.history.length})
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {record.history.map((h, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                  <span>Changed from <strong>{h.fromStatus}</strong> to <strong>{h.toStatus}</strong> by {h.updatedBy}</span>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {new Date(h.updatedAt).toLocaleString()} {h.reason ? `· "${h.reason}"` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save Correction</button>
        </div>
      </form>
    </Modal>
  );
}

// Excel Import for Daily Attendance
function AttendanceImportModal({ onClose, onComplete, showAlert, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setError('');
    setLoading(true);
    try {
      const rows = await parseExcelFile(selectedFile);
      if (!rows.length) {
        setError('Excel file is empty.');
        setLoading(false);
        return;
      }

      const members = storage.getMembers();
      let importedCount = 0;
      const todayStr = new Date().toISOString().split('T')[0];

      rows.forEach(row => {
        // Look for roll number or name
        const rn = String(row['Roll Number'] || row['rollNumber'] || row['Roll No'] || row['Roll'] || '').trim().toUpperCase();
        const name = String(row['Name'] || row['Student Name'] || '').trim().toLowerCase();
        const dateVal = String(row['Date'] || row['Attendance Date'] || todayStr).trim();
        const statusVal = String(row['Status'] || row['Attendance'] || '').trim().toUpperCase();

        const member = members.find(m =>
          (rn && m.rollNumber?.toUpperCase() === rn) ||
          (name && m.name.toLowerCase() === name)
        );

        if (member) {
          let normalizedStatus = 'Present';
          if (statusVal === 'A' || statusVal === 'ABSENT' || statusVal === '0') normalizedStatus = 'Absent';
          else if (statusVal === 'L' || statusVal === 'LEAVE') normalizedStatus = 'Leave';

          storage.markDailyAttendance({
            memberId: member.id,
            date: dateVal,
            status: normalizedStatus,
            markedBy: `${currentUser.name} (Excel Import)`,
            reason: 'Batch imported from Excel'
          });
          importedCount++;
        }
      });

      showAlert(`Successfully imported daily attendance records (${importedCount} processed).`);
      onComplete();
    } catch (e) {
      setError(e.message || 'Failed to parse Excel file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Import Daily Attendance" onClose={onClose} maxWidth="500px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="upload-zone" onClick={() => fileRef.current?.click()} style={{ padding: '36px 24px' }}>
          <FileSpreadsheet size={36} color="var(--text-secondary)" />
          <strong>Select Excel or CSV Attendance File</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Supports columns: Roll Number, Name, Date, Status (P / A / L)</span>
          <button type="button" className="btn-secondary" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Browse Files</button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

        {error && (
          <div style={{ color: 'var(--status-overdue-text)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Processing records…</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

export default function DailyAttendanceAdmin({ currentUser, showAlert }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'monthly'
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [correcting, setCorrecting] = useState(null); // { member, record }
  const [showImport, setShowImport] = useState(false);
  const [, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  const activeMembers = storage.getMembers().filter(m => m.status === 'Active');
  const branches = ['All', ...Array.from(new Set(activeMembers.map(m => m.branch).filter(Boolean)))];

  const dateRecords = storage.getDailyAttendanceByDate(selectedDate);
  const recordMap = {};
  dateRecords.forEach(r => { recordMap[r.memberId] = r; });

  // Daily Summary Stats
  const presentCount = dateRecords.filter(r => r.status === 'Present').length;
  const absentCount = dateRecords.filter(r => r.status === 'Absent').length;
  const leaveCount = dateRecords.filter(r => r.status === 'Leave').length;
  const totalMarked = dateRecords.length;
  const unmarkedCount = Math.max(0, activeMembers.length - totalMarked);
  const eligibleMarked = presentCount + absentCount;
  const attendanceRate = eligibleMarked > 0 ? `${Math.round((presentCount / eligibleMarked) * 100)}%` : 'N/A';

  // Quick mark status
  const handleMarkStatus = (memberId, status) => {
    storage.markDailyAttendance({
      memberId,
      date: selectedDate,
      status,
      markedBy: currentUser.name
    });
    refresh();
  };

  const handleMarkAllPresent = () => {
    const unmarkedMembers = activeMembers.filter(m => !recordMap[m.id]);
    unmarkedMembers.forEach(m => {
      storage.markDailyAttendance({
        memberId: m.id,
        date: selectedDate,
        status: 'Present',
        markedBy: currentUser.name
      });
    });
    showAlert(`Marked ${unmarkedMembers.length} unmarked members as Present.`);
    refresh();
  };

  const handleSaveCorrection = (status, reason) => {
    if (!correcting) return;
    storage.markDailyAttendance({
      memberId: correcting.member.id,
      date: selectedDate,
      status,
      markedBy: currentUser.name,
      reason
    });
    showAlert(`Attendance record corrected for ${correcting.member.name}.`);
    setCorrecting(null);
    refresh();
  };

  // Export Daily or Monthly to Excel
  const handleExportDaily = () => {
    const data = activeMembers.map(m => {
      const rec = recordMap[m.id];
      return {
        'Date': selectedDate,
        'Roll Number': m.rollNumber,
        'Name': m.name,
        'Branch': m.branch,
        'Year': m.academicYear,
        'Status': rec ? rec.status : 'Unmarked',
        'Marked At': rec?.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : '',
        'Marked By': rec?.markedBy || ''
      };
    });
    exportToExcel(data, `Attendance_${selectedDate}`);
    showAlert(`Exported attendance for ${selectedDate}.`);
  };

  const handleExportMonthly = () => {
    const data = activeMembers.map(m => {
      const stats = storage.computeMemberAttendanceStats(m.id);
      return {
        'Roll Number': m.rollNumber,
        'Name': m.name,
        'Branch': m.branch,
        'Year': m.academicYear,
        'Total Present Days': stats.presentDays,
        'Total Absent Days': stats.absentDays,
        'Total Leave Days': stats.leaveDays,
        'Eligible Days': stats.eligibleDays,
        'Attendance Percentage': stats.percentage === 'N/A' ? 'N/A' : `${stats.percentage}%`
      };
    });
    exportToExcel(data, `Monthly_Attendance_Report_${new Date().toISOString().slice(0, 7)}`);
    showAlert('Monthly attendance report exported to Excel.');
  };

  // Filter members list for table
  const filteredMembers = activeMembers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.rollNumber?.toLowerCase().includes(q);
    const matchYear = yearFilter === 'All' || m.academicYear === yearFilter;
    const matchBranch = branchFilter === 'All' || m.branch === branchFilter;

    const rec = recordMap[m.id];
    const statusVal = rec ? rec.status : 'Unmarked';
    const matchStatus = statusFilter === 'All' || statusVal === statusFilter;

    return matchSearch && matchYear && matchBranch && matchStatus;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View Switcher: Daily vs Monthly Report */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="category-pills" style={{ margin: 0 }}>
          <button
            className={`category-pill ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarCheck size={14} /> Daily Attendance Marker
          </button>
          <button
            className={`category-pill ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar size={14} /> Monthly Cumulative Reports
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Upload size={14} /> Import Excel
          </button>
          <button
            className="btn-secondary"
            onClick={viewMode === 'daily' ? handleExportDaily : handleExportMonthly}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Download size={14} /> Export to Excel
          </button>
        </div>
      </div>

      {/* ── DAILY ATTENDANCE MARKER VIEW ────────────────────── */}
      {viewMode === 'daily' && (
        <>
          {/* Date Selector & Quick Actions Strip */}
          <div className="content-box" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Selected Attendance Date:
                </label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 'auto', fontWeight: '600', padding: '6px 12px' }}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
                <button
                  type="button"
                  className={`btn-secondary ${selectedDate === todayStr ? 'active' : ''}`}
                  onClick={() => setSelectedDate(todayStr)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${selectedDate === yesterdayStr ? 'active' : ''}`}
                  onClick={() => setSelectedDate(yesterdayStr)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Yesterday
                </button>
              </div>

              {unmarkedCount > 0 && (
                <button
                  className="btn-primary"
                  onClick={handleMarkAllPresent}
                  style={{ fontSize: '13px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserCheck size={14} /> Mark Remaining ({unmarkedCount}) as Present
                </button>
              )}
            </div>
          </div>

          {/* Daily Summary Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card teal">
              <span className="metric-label">Active Members</span>
              <span className="metric-value">{activeMembers.length}</span>
              <span className="metric-trend">{totalMarked} marked · {unmarkedCount} pending</span>
            </div>
            <div className="metric-card" style={{ backgroundColor: 'var(--status-active-bg)' }}>
              <span className="metric-label" style={{ color: 'var(--status-active-text)' }}>Present</span>
              <span className="metric-value" style={{ color: 'var(--status-active-text)' }}>{presentCount}</span>
              <span className="metric-trend" style={{ color: 'var(--status-active-text)' }}>Daily Attendance Rate: {attendanceRate}</span>
            </div>
            <div className="metric-card peach">
              <span className="metric-label">Absent</span>
              <span className="metric-value" style={{ color: 'var(--status-overdue-text)' }}>{absentCount}</span>
              <span className="metric-trend">Unexcused</span>
            </div>
            <div className="metric-card yellow">
              <span className="metric-label">Leave</span>
              <span className="metric-value" style={{ color: '#7a5a00' }}>{leaveCount}</span>
              <span className="metric-trend">Excluded from rate denominator</span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div className="search-input-wrapper" style={{ flex: '1 1 240px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search member name or roll number…"
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
              {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Unmarked">Unmarked</option>
            </select>
          </div>

          {/* Members Attendance Table */}
          <div className="content-box" style={{ padding: '8px' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Member Name</th>
                    <th>Branch / Year</th>
                    <th style={{ textAlign: 'center' }}>Daily Status</th>
                    <th style={{ textAlign: 'center' }}>Direct Mark / Toggle</th>
                    <th>Marked At / By</th>
                    <th style={{ textAlign: 'right' }}>Correct</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No active members match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(m => {
                      const rec = recordMap[m.id];
                      const status = rec?.status || 'Unmarked';

                      const pillBg = status === 'Present' ? 'var(--status-active-bg)' : status === 'Absent' ? 'var(--status-overdue-bg)' : status === 'Leave' ? 'var(--color-yellow)' : 'var(--bg-sidebar)';
                      const pillTc = status === 'Present' ? 'var(--status-active-text)' : status === 'Absent' ? 'var(--status-overdue-text)' : status === 'Leave' ? '#7a5a00' : 'var(--text-secondary)';

                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: '600' }}>{m.rollNumber || '—'}</td>
                          <td>
                            <strong style={{ display: 'block', fontSize: '14px' }}>{m.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.clubTag || 'Team Member'}</span>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {m.branch || '—'} {m.academicYear ? `· ${m.academicYear}` : ''}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '3px 12px',
                              borderRadius: '50px',
                              backgroundColor: pillBg,
                              color: pillTc,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {status === 'Present' && <CheckCircle2 size={12} />}
                              {status === 'Absent' && <XCircle size={12} />}
                              {status === 'Leave' && <Clock size={12} />}
                              {status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'var(--bg-sidebar)', padding: '3px', borderRadius: '50px', border: '1px solid var(--border-light)' }}>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(m.id, 'Present')}
                                style={{
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '50px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  backgroundColor: status === 'Present' ? 'var(--status-active-bg)' : 'transparent',
                                  color: status === 'Present' ? 'var(--status-active-text)' : 'var(--text-secondary)',
                                  transition: 'all 0.15s'
                                }}
                                title="Mark Present"
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(m.id, 'Absent')}
                                style={{
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '50px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  backgroundColor: status === 'Absent' ? 'var(--status-overdue-bg)' : 'transparent',
                                  color: status === 'Absent' ? 'var(--status-overdue-text)' : 'var(--text-secondary)',
                                  transition: 'all 0.15s'
                                }}
                                title="Mark Absent"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(m.id, 'Leave')}
                                style={{
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '50px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  backgroundColor: status === 'Leave' ? 'var(--color-yellow)' : 'transparent',
                                  color: status === 'Leave' ? '#7a5a00' : 'var(--text-secondary)',
                                  transition: 'all 0.15s'
                                }}
                                title="Mark Approved Leave"
                              >
                                L
                              </button>
                            </div>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {rec ? (
                              <div>
                                <span>{rec.markedBy || 'Admin'}</span>
                                {rec.updatedBy && <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-peach-hover)' }}>Edited by {rec.updatedBy}</span>}
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Pending mark</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setCorrecting({ member: m, record: rec })}
                              title="Audit Trail & Detailed Correction"
                            >
                              <History size={12} /> Correct
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MONTHLY CUMULATIVE REPORTS VIEW ─────────────────── */}
      {viewMode === 'monthly' && (
        <div className="content-box">
          <div className="content-box-header">
            <div>
              <h2 className="content-box-title">Cumulative Member Attendance Reports</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Total Present, Absent, Leave days and attendance percentages calculated strictly per calendar date.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Member Name</th>
                  <th>Branch / Year</th>
                  <th style={{ textAlign: 'center' }}>Present Days</th>
                  <th style={{ textAlign: 'center' }}>Absent Days</th>
                  <th style={{ textAlign: 'center' }}>Leave Days</th>
                  <th style={{ textAlign: 'center' }}>Eligible Days</th>
                  <th style={{ textAlign: 'center' }}>Overall %</th>
                  <th style={{ textAlign: 'center' }}>Status Tier</th>
                </tr>
              </thead>
              <tbody>
                {activeMembers.map(m => {
                  const stats = storage.computeMemberAttendanceStats(m.id);
                  const pct = stats.percentage;
                  const pctColor = pct === 'N/A' ? 'var(--text-secondary)' : pct >= 75 ? 'var(--status-active-text)' : pct >= 50 ? '#a07000' : 'var(--status-overdue-text)';

                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: '600' }}>{m.rollNumber || '—'}</td>
                      <td>
                        <strong>{m.name}</strong>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {m.branch || '—'} · {m.academicYear || '—'}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--status-active-text)', fontWeight: '700' }}>
                        {stats.presentDays}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--status-overdue-text)', fontWeight: '700' }}>
                        {stats.absentDays}
                      </td>
                      <td style={{ textAlign: 'center', color: '#7a5a00', fontWeight: '700' }}>
                        {stats.leaveDays}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {stats.eligibleDays}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', color: pctColor }}>
                        {pct === 'N/A' ? 'N/A' : `${pct}%`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {pct === 'N/A' ? (
                          <span className="status-pill inactive">No Data</span>
                        ) : pct >= 75 ? (
                          <span className="status-pill active">Good (≥75%)</span>
                        ) : pct >= 50 ? (
                          <span className="status-pill" style={{ backgroundColor: 'var(--color-yellow)', color: '#7a5a00' }}>Average</span>
                        ) : (
                          <span className="status-pill overdue">Critical (&lt;50%)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correcting && (
        <AttendanceCorrectionModal
          member={correcting.member}
          record={correcting.record}
          onSave={handleSaveCorrection}
          onClose={() => setCorrecting(null)}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <AttendanceImportModal
          onClose={() => setShowImport(false)}
          onComplete={() => { setShowImport(false); refresh(); }}
          showAlert={showAlert}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
