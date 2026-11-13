import React from 'react';
import { 
  Archive, 
  FileText, 
  LayoutDashboard, 
  UserCheck, 
  Wrench, 
  FolderKanban, 
  BarChart3, 
  ShieldCheck, 
  Info,
  Sliders,
  User,
  Bell,
  LogOut,
  Layers,
  ChevronRight,
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LeftSidebar = ({ 
  currentView, 
  setCurrentView, 
  isOpen = false, 
  onClose = () => {},
  onOpenProfile = () => {},
  onOpenNotifications = () => {}
}) => {
  const { user, role, logout } = useAuth();

  // Requirement 10: Navigation Menu must include:
  // Home, Components, My Requests, About, Settings, User Profile, Notifications, Logout
  const mainNavItems = [
    {
      id: 'home',
      label: 'Home',
      sublabel: 'Storage Almirah Hub',
      icon: Archive
    },
    {
      id: 'components',
      label: 'Components',
      sublabel: 'All Inventory Catalog',
      icon: Layers
    },
    {
      id: 'my-requests',
      label: 'My Requests',
      sublabel: 'Status & Timeline',
      icon: FileText
    },
    {
      id: 'about',
      label: 'About',
      sublabel: 'Lab 304 Facilities',
      icon: Info
    },
    {
      id: 'settings',
      label: 'Settings',
      sublabel: 'Reminders & Alerts',
      icon: Sliders
    }
  ];

  // Admin Panel (Only two panels in system: Student & Admin)
  const isManagementRole = role === 'ADMIN' || role === 'SENIOR';
  const portalItems = [];

  if (isManagementRole) {
    portalItems.push({
      id: 'management-dashboard',
      label: 'Admin Dashboard',
      badge: 'Admin',
      icon: ShieldCheck,
      badgeColor: 'bg-slate-800 text-slate-200 border-slate-700'
    });
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="p-4 space-y-5 overflow-y-auto">
          
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 lg:hidden">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Navigation Menu</span>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN MENU (Requirement 10) */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Navigation
              </span>
              <span className="text-[10px] text-blue-400 font-mono">Lab 304</span>
            </div>

            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`} />
                      <div className="text-left truncate">
                        <div className="truncate">{item.label}</div>
                      </div>
                    </div>

                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}

              {/* Requirement 10: Notifications Button */}
              <button
                onClick={() => {
                  onOpenNotifications();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <Bell className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-400 transition-transform group-hover:scale-110" />
                  <span>Notifications</span>
                </div>
              </button>

              {/* Requirement 10: User Profile Button */}
              <button
                onClick={() => {
                  onOpenProfile();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <User className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-400 transition-transform group-hover:scale-110" />
                  <span>User Profile</span>
                </div>
              </button>
            </nav>
          </div>

          {/* PRIVILEGED ADMIN PANEL */}
          {portalItems.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Admin Panel
                </span>
              </div>

              <nav className="space-y-1">
                {portalItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id || (item.id === 'management-dashboard' && ['management-dashboard', 'senior-portal', 'admin-portal'].includes(currentView));

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono shrink-0 ${
                          isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Quick Laboratory Status Panel */}
          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-white">Lab 304 Operational</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Open
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Hours: 9:00 AM – 7:00 PM &bull; Central Electronics Storage
            </p>
          </div>

        </div>

        {/* User Card & Logout at Bottom of Sidebar (Requirement 10) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
          <div 
            onClick={onOpenProfile}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {user?.fullName || 'Student'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight">
                {user?.membershipId || 'ROBO-2026-042'}
              </div>
            </div>
          </div>

          {/* Requirement 10: Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default LeftSidebar;
