import React from 'react';
import { storage } from '../services/storage';
import Modal from './Modal';
import { Bell, CheckCheck, FolderKanban, Package, CalendarCheck, CalendarDays, Megaphone, Info } from 'lucide-react';

export default function NotificationModal({ currentUser, onClose, onNavigate, onRefresh }) {
  const notifications = storage.getUserNotifications(currentUser);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAll = () => {
    storage.markAllNotificationsRead(currentUser);
    if (onRefresh) onRefresh();
  };

  const handleClickItem = (notif) => {
    storage.markNotificationRead(notif.id, currentUser.id);
    if (onRefresh) onRefresh();
    if (notif.link) {
      onNavigate(notif.link);
      onClose();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task':
      case 'project':
        return <FolderKanban size={16} color="var(--color-blue)" />;
      case 'inventory':
        return <Package size={16} color="var(--color-peach)" />;
      case 'attendance':
        return <CalendarCheck size={16} color="var(--color-teal)" />;
      case 'event':
        return <CalendarDays size={16} color="var(--color-yellow)" />;
      case 'announcement':
        return <Megaphone size={16} color="var(--status-overdue-text)" />;
      default:
        return <Info size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <Modal title="Club Notifications & Alerts" onClose={onClose} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: '12px', borderBottom: '1px solid var(--border-light)'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </span>
          {unreadCount > 0 && (
            <button
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleMarkAll}
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: '500' }}>No notifications yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                You will receive alerts here when tasks are assigned, requests are updated, or club announcements are posted.
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: n.isRead ? 'var(--bg-card)' : 'var(--bg-sidebar)',
                  border: `1px solid ${n.isRead ? 'var(--border-light)' : 'var(--text-primary)'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s, transform 0.15s'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px',
                  border: '1px solid var(--border-light)'
                }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: n.isRead ? '600' : '700', color: 'var(--text-primary)' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: 'var(--color-peach)', flexShrink: 0, marginTop: '6px'
                  }} />
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

