import React, { useState, useEffect } from 'react';
import { Bot, Home, FileText, LayoutDashboard, LogIn, LogOut, Bell, ChevronDown, Check, ShieldCheck, UserCheck, Wrench, Sparkles, Menu, Layers, Info, Sliders, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  onToggleSidebar = () => {},
  onOpenProfile = () => {},
  onOpenNotifications = () => {},
  onOpenLogin = () => {}
}) => {
  const { user, role, logout, switchRole, demoAccounts } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res.success) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getRoleBadge = (userRole) => {
    const r = String(userRole || '').toUpperCase();
    if (r === 'ADMIN' || r === 'SENIOR') {
      return { label: 'Admin', color: 'bg-slate-800 text-slate-200 border-slate-700' };
    }
    return { label: 'Student', color: 'bg-blue-950/70 text-blue-300 border-blue-800/80' };
  };

  const roleInfo = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Hamburger & Brand Logo & Title */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setCurrentView('home')} 
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-lg tracking-tight">Robotics Club</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Lab v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 tracking-wide">Electronic Components Inventory</p>
              </div>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                currentView === 'home'
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Home</span>
              {currentView === 'home' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('components')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                currentView === 'components'
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Components</span>
              {currentView === 'components' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('my-requests')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                currentView === 'my-requests'
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>My Requests</span>
              {currentView === 'my-requests' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('about')}
              className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                currentView === 'about'
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>About</span>
              {currentView === 'about' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('settings')}
              className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                currentView === 'settings'
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Settings</span>
              {currentView === 'settings' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* Two Primary Panels: Student Dashboard or Admin Dashboard */}
            <button
              onClick={() => {
                if (role === 'ADMIN' || role === 'SENIOR') setCurrentView('management-dashboard');
                else setCurrentView('dashboard');
              }}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                ['dashboard', 'management-dashboard'].includes(currentView)
                  ? 'text-white bg-slate-800/60 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {role === 'ADMIN' || role === 'SENIOR' ? 'Admin Dashboard' : 'Student Dashboard'}
              </span>
              {['dashboard', 'management-dashboard'].includes(currentView) && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            {user ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <span className="font-semibold text-sm">Laboratory Notifications</span>
                    <span className="text-xs text-slate-400">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n._id || n.id}
                          onClick={() => handleMarkAsRead(n._id || n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-blue-50/60 font-medium' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        onOpenNotifications();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                    >
                      View All Notifications &amp; Reminders &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Card with Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-white text-xs font-semibold leading-tight">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {roleInfo.label}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Switcher Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        ID: {user?.membershipId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-200 hover:bg-blue-100 shrink-0"
                    >
                      Profile
                    </button>
                  </div>

                  {/* Quick Switcher: Student & Admin Panels */}
                  <div className="px-3 py-2 bg-slate-50">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ⚡ Switch Panel (Student / Admin)
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {demoAccounts.filter(a => ['MEMBER', 'ADMIN'].includes(a.role)).map(account => (
                        <button
                          key={account.id || account.role}
                          onClick={() => {
                            switchRole(account.id || account.role);
                            setIsDropdownOpen(false);
                            if (account.role === 'ADMIN' || account.role === 'SENIOR') setCurrentView('management-dashboard');
                            else setCurrentView('dashboard');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            (user?.id || user?._id) === account.id
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {account.role === 'MEMBER' ? <Bot className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>{account.fullName}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-mono ${(user?.id || user?._id) === account.id ? 'text-blue-100' : 'text-slate-400'}`}>
                            {account.role === 'MEMBER' ? 'Student' : 'Admin'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-blue-700 font-semibold hover:bg-blue-50 flex items-center space-x-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In with Email &amp; Password</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
export default Navbar;
