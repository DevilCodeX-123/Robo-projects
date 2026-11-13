import React, { useState } from 'react';
import {
  LayoutDashboard, CalendarCheck, FolderKanban, Users, Package,
  CalendarDays, User, Settings, LogOut, Sun, Moon, Bell
} from 'lucide-react';
import { storage } from '../services/storage';
import NotificationModal from './NotificationModal';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',            Icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance',           Icon: CalendarCheck },
  { id: 'projects',   label: 'Project Management',   Icon: FolderKanban },
  { id: 'members',    label: 'Members Management',   Icon: Users },
  { id: 'inventory',  label: 'Inventory',            Icon: Package },
  { id: 'events',     label: 'Events & Calendar',    Icon: CalendarDays },
];

const ACCOUNT_ITEMS = [
  { id: 'profile',  label: 'My Profile', Icon: User },
  { id: 'settings', label: 'Settings',   Icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, theme, toggleTheme }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [, setNotifTick] = useState(0);

  const notifications = storage.getUserNotifications(currentUser);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand" style={{ paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="brand-title">RC-TEAMS</h2>
              <p className="brand-subtitle">Robotics Club Portal</p>
            </div>
            <button
              onClick={() => setShowNotifs(true)}
              title="Notifications"
              style={{
                position: 'relative',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s',
                marginTop: '4px'
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-peach)',
                  color: 'var(--text-primary)',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '50px',
                  padding: '1px 5px',
                  lineHeight: '1.2',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <nav>
            <p style={{
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--text-secondary)', fontWeight: '700', paddingLeft: '18px', marginBottom: '4px'
            }}>Modules</p>
            <ul className="nav-menu">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <li key={id} className="nav-item">
                  <button
                    className={`nav-button ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={18} /> {label}
                  </button>
                </li>
              ))}
            </ul>

            <p style={{
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--text-secondary)', fontWeight: '700', paddingLeft: '18px',
              marginTop: '20px', marginBottom: '4px'
            }}>Account</p>
            <ul className="nav-menu">
              {ACCOUNT_ITEMS.map(({ id, label, Icon }) => (
                <li key={id} className="nav-item">
                  <button
                    className={`nav-button ${activeTab === id ? 'active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={18} /> {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="profile-info">
              <div className="profile-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="profile-details" style={{ flex: 1, minWidth: 0 }}>
                <span className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name}
                </span>
                <span className="profile-role">
                  {currentUser?.isAdmin ? 'Club Admin' : (currentUser?.clubTag || 'Team Member')}
                </span>
              </div>
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-light)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
            </div>
            <button className="btn-signout" onClick={onLogout}>
              <LogOut size={14} style={{ marginRight: '6px' }} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {showNotifs && (
        <NotificationModal
          currentUser={currentUser}
          onClose={() => setShowNotifs(false)}
          onNavigate={setActiveTab}
          onRefresh={() => setNotifTick(t => t + 1)}
        />
      )}
    </>
  );
}
