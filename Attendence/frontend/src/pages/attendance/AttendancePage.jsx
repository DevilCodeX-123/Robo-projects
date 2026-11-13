import React, { useState } from 'react';
import { CalendarCheck, Users, ShieldCheck, UserCheck } from 'lucide-react';
import DailyAttendanceAdmin from './DailyAttendanceAdmin';
import VisitorAttendance from './VisitorAttendance';
import MemberAttendanceView from './MemberAttendanceView';

const ADMIN_TABS = [
  { id: 'daily', label: 'Club Daily Attendance', Icon: CalendarCheck },
  { id: 'visitors', label: 'Visitor Attendance Logs', Icon: Users },
];

export default function AttendancePage({ currentUser, showAlert }) {
  const [activeTab, setActiveTab] = useState('daily');

  // Team Member View: Personal Attendance ONLY
  if (!currentUser?.isAdmin) {
    return (
      <>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Your personal club attendance record and percentage.</p>
          </div>
        </div>

        <MemberAttendanceView currentUser={currentUser} showAlert={showAlert} />
      </>
    );
  }

  // Admin View: Club Daily Attendance & Visitor Logs
  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Daily Attendance Management</h1>
          <p className="page-subtitle">
            Daily-based attendance tracking, corrections, monthly reports, and visitor logs.
          </p>
        </div>
      </div>

      <div className="category-pills" style={{ marginTop: '-16px' }}>
        {ADMIN_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`category-pill ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <DailyAttendanceAdmin currentUser={currentUser} showAlert={showAlert} />
      )}
      {activeTab === 'visitors' && (
        <VisitorAttendance currentUser={currentUser} showAlert={showAlert} />
      )}
    </>
  );
}
