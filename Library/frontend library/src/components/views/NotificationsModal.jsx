import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  Package, 
  CheckCheck,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';

export const NotificationsModal = ({ isOpen, onClose, onNavigateToRequests = () => {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await api.markNotificationRead(n._id || n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'APPROVALS') return n.title.toLowerCase().includes('approv') || n.type === 'SUCCESS';
    if (filter === 'REMINDERS') return n.title.toLowerCase().includes('return') || n.title.toLowerCase().includes('pickup') || n.title.toLowerCase().includes('reminder');
    return true;
  });

  const getNotifIcon = (n) => {
    if (n.type === 'SUCCESS' || n.title.toLowerCase().includes('approv')) {
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
    if (n.title.toLowerCase().includes('reject')) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    if (n.title.toLowerCase().includes('return') || n.title.toLowerCase().includes('pickup')) {
      return <Package className="w-4 h-4 text-blue-600" />;
    }
    return <Clock className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navy Header */}
        <div className="bg-[#0F172A] p-5 sm:p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Robotics Lab Notifications</h2>
              <p className="text-[11px] text-slate-400">Component requests, approvals, rejections &amp; return reminders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar & Actions */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: 'Unread' },
              { id: 'APPROVALS', label: 'Approvals' },
              { id: 'REMINDERS', label: 'Reminders' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === pill.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Notification Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No notifications matching this filter.</p>
            </div>
          ) : (
            filteredNotifs.map(n => {
              const id = n._id || n.id;
              return (
                <div
                  key={id}
                  onClick={() => {
                    handleMarkAsRead(id);
                    if (n.link && onNavigateToRequests) {
                      onClose();
                      onNavigateToRequests();
                    }
                  }}
                  className={`p-3.5 rounded-2xl m-1 transition-all cursor-pointer ${
                    !n.isRead 
                      ? 'bg-blue-50/70 border border-blue-200/80 shadow-xs' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(n)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotificationsModal;

