import React, { useState } from 'react';
import { storage } from '../../services/storage';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import EmptyState from '../../components/EmptyState';

export default function MemberAttendanceView({ currentUser }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchDate, setSearchDate] = useState('');

  const records = storage.getMemberDailyAttendance(currentUser.id);
  const stats = storage.computeMemberAttendanceStats(currentUser.id);

  // Group by Month for monthly summary
  const monthlyMap = {};
  records.forEach(r => {
    const monthKey = r.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { monthKey, present: 0, absent: 0, leave: 0 };
    }
    if (r.status === 'Present') monthlyMap[monthKey].present++;
    else if (r.status === 'Absent') monthlyMap[monthKey].absent++;
    else if (r.status === 'Leave') monthlyMap[monthKey].leave++;
  });

  const monthlySummaries = Object.values(monthlyMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Filter daily history
  const filteredRecords = records.filter(r => {
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchDate = !searchDate || r.date.includes(searchDate);
    return matchStatus && matchDate;
  });

  const pctDisplay = stats.percentage === 'N/A' ? 'N/A' : `${stats.percentage}%`;
  const pctColor = stats.percentage === 'N/A'
    ? 'var(--text-secondary)'
    : stats.percentage >= 75
      ? 'var(--status-active-text)'
      : stats.percentage >= 50
        ? '#a07000'
        : 'var(--status-overdue-text)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Attendance Stats Cards */}
      <div className="metrics-grid">
        <div className="metric-card teal">
          <span className="metric-label">Attendance Percentage</span>
          <span className="metric-value" style={{ color: pctColor }}>
            {pctDisplay}
          </span>
          <span className="metric-trend">
            {stats.eligibleDays > 0
              ? `${stats.presentDays} of ${stats.eligibleDays} eligible days attended`
              : 'No eligible records recorded yet'}
          </span>
        </div>

        <div className="metric-card" style={{ backgroundColor: 'var(--status-active-bg)' }}>
          <span className="metric-label" style={{ color: 'var(--status-active-text)' }}>Present Days</span>
          <span className="metric-value" style={{ color: 'var(--status-active-text)' }}>
            {stats.presentDays}
          </span>
          <span className="metric-trend" style={{ color: 'var(--status-active-text)' }}>
            Full club session attendance
          </span>
        </div>

        <div className="metric-card peach">
          <span className="metric-label">Absent Days</span>
          <span className="metric-value" style={{ color: 'var(--status-overdue-text)' }}>
            {stats.absentDays}
          </span>
          <span className="metric-trend">
            Unexcused absences
          </span>
        </div>

        <div className="metric-card yellow">
          <span className="metric-label">Approved Leave</span>
          <span className="metric-value" style={{ color: '#7a5a00' }}>
            {stats.leaveDays}
          </span>
          <span className="metric-trend">
            Excluded from % denominator
          </span>
        </div>
      </div>

      {/* Monthly Attendance Summary Table */}
      {monthlySummaries.length > 0 && (
        <div className="content-box">
          <h2 className="content-box-title">Monthly Attendance Summary</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-16px', marginBottom: '8px' }}>
            Historical attendance aggregated by calendar month.
          </p>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'center' }}>Present Days</th>
                  <th style={{ textAlign: 'center' }}>Absent Days</th>
                  <th style={{ textAlign: 'center' }}>Leave Days</th>
                  <th style={{ textAlign: 'center' }}>Eligible Days</th>
                  <th style={{ textAlign: 'center' }}>Monthly %</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map(m => {
                  const eligible = m.present + m.absent;
                  const monthPct = eligible > 0 ? `${Math.round((m.present / eligible) * 100)}%` : 'N/A';
                  const dateObj = new Date(`${m.monthKey}-01`);
                  const monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

                  return (
                    <tr key={m.monthKey}>
                      <td style={{ fontWeight: '600' }}>{monthLabel}</td>
                      <td style={{ textAlign: 'center', color: 'var(--status-active-text)', fontWeight: '600' }}>{m.present}</td>
                      <td style={{ textAlign: 'center', color: 'var(--status-overdue-text)', fontWeight: '600' }}>{m.absent}</td>
                      <td style={{ textAlign: 'center', color: '#7a5a00', fontWeight: '600' }}>{m.leave}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{eligible}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700' }}>{monthPct}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Attendance History */}
      <div className="content-box">
        <div className="content-box-header">
          <div>
            <h2 className="content-box-title">Daily Attendance Log</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              One record per calendar day.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ width: '180px' }}>
              <input
                type="date"
                className="search-input"
                value={searchDate}
                onChange={e => setSearchDate(e.target.value)}
                style={{ paddingLeft: '12px' }}
              />
            </div>
            {searchDate && (
              <button className="btn-secondary" onClick={() => setSearchDate('')} style={{ fontSize: '12px', padding: '6px 10px' }}>
                Clear Date
              </button>
            )}
            <div className="category-pills">
              {['All', 'Present', 'Absent', 'Leave'].map(s => (
                <button
                  key={s}
                  className={`category-pill ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records found"
            description={searchDate || statusFilter !== 'All' ? 'No records match your selected filter.' : 'Your daily attendance history will appear here once marked by Club Administration.'}
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Attendance Status</th>
                  <th>Marked At</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const dateObj = new Date(r.date + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                  const pillBg = r.status === 'Present' ? 'var(--status-active-bg)' : r.status === 'Absent' ? 'var(--status-overdue-bg)' : 'var(--color-yellow)';
                  const pillTc = r.status === 'Present' ? 'var(--status-active-text)' : r.status === 'Absent' ? 'var(--status-overdue-text)' : '#7a5a00';

                  return (
                    <tr key={r.attendanceId}>
                      <td style={{ fontWeight: '600' }}>{formattedDate}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{dayName}</td>
                      <td>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '3px 12px',
                          borderRadius: '50px',
                          backgroundColor: pillBg,
                          color: pillTc,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {r.status === 'Present' && <CheckCircle2 size={13} />}
                          {r.status === 'Absent' && <XCircle size={13} />}
                          {r.status === 'Leave' && <Clock size={13} />}
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {r.markedAt ? new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {r.markedBy || 'Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
