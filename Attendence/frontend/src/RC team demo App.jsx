import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { runMigration } from './services/migrationService';
import { useAlert } from './hooks/useAlert';
import { useTheme } from './hooks/useTheme';

// Components
import Sidebar from './components/Sidebar';
import Alert from './components/Alert';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OverviewPage from './pages/overview/OverviewPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ProjectsPage from './pages/projects/ProjectsPage';
import MembersPage from './pages/members/MembersPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';

// Icons for Mobile Navigation
import {
    LayoutDashboard, CalendarCheck, FolderKanban, Users, Package,
    User, Settings, LogOut, Sliders
} from 'lucide-react';

export default function App() {
    const [currentUser, setCurrentUser] = useState(() => storage.getActiveUser());
    const [activeTab, setActiveTab] = useState('overview');
    const [isLogin, setIsLogin] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { alert, showAlert, clearAlert } = useAlert();
    const { theme, toggleTheme } = useTheme();

    // Run one-time migration on mount
    useEffect(() => {
        runMigration();
        const user = storage.getActiveUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    const handleLogin = (user) => {
        storage.setActiveUser(user);
        setCurrentUser(user);
        setActiveTab('overview');
        showAlert(`Welcome back, ${user.name}!`);
    };

    const handleLogout = () => {
        storage.clearActiveUser();
        setCurrentUser(null);
        setActiveTab('overview');
        setMobileMenuOpen(false);
        showAlert('Signed out successfully.');
    };

    const handleUserUpdate = (updatedUser) => {
        storage.setActiveUser(updatedUser);
        setCurrentUser(updatedUser);
    };

    // Unauthenticated Flow
    if (!currentUser) {
        return (
            <div className="auth-container">
                <Alert alert={alert} onClose={clearAlert} />
                {isLogin ? (
                    <LoginPage
                        onLogin={handleLogin}
                        onSwitchToRegister={() => setIsLogin(false)}
                        showAlert={showAlert}
                    />
                ) : (
                    <RegisterPage
                        onSwitchToLogin={() => setIsLogin(true)}
                        showAlert={showAlert}
                    />
                )}
            </div>
        );
    }

    // Authenticated Application
    return (
        <div className="app-container">
            <Alert alert={alert} onClose={clearAlert} />

            {/* Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav">
                <button
                    className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                >
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </button>
                <button
                    className={`mobile-nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
                >
                    <CalendarCheck size={20} />
                    <span>Attendance</span>
                </button>
                <button
                    className={`mobile-nav-btn ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
                >
                    <FolderKanban size={20} />
                    <span>Projects</span>
                </button>
                <button
                    className={`mobile-nav-btn ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('members'); setMobileMenuOpen(false); }}
                >
                    <Users size={20} />
                    <span>Members</span>
                </button>
                <button
                    className={`mobile-nav-btn ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Sliders size={20} />
                    <span>More</span>
                </button>
            </div>

            {/* Mobile Drawer Sheet */}
            {mobileMenuOpen && (
                <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drawer-header">
                            <h3>Navigation</h3>
                            <button className="close-drawer" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                        </div>
                        <div className="mobile-drawer-grid">
                            <button
                                className={`drawer-item ${activeTab === 'inventory' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
                            >
                                <Package size={22} />
                                <span>Inventory</span>
                            </button>
                            <button
                                className={`drawer-item ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                            >
                                <User size={22} />
                                <span>My Profile</span>
                            </button>
                            <button
                                className={`drawer-item ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                            >
                                <Settings size={22} />
                                <span>Settings</span>
                            </button>
                        </div>
                        <div className="mobile-drawer-footer">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="profile-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.name}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {currentUser.isAdmin ? 'Admin' : (currentUser.clubTag || 'Member')}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={handleLogout}
                            >
                                <LogOut size={13} /> Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {/* Main Content Area */}
            <main className="main-content">
                {activeTab === 'overview' && (
                    <OverviewPage
                        currentUser={currentUser}
                        setActiveTab={setActiveTab}
                        showAlert={showAlert}
                    />
                )}
                {activeTab === 'attendance' && (
                    <AttendancePage
                        currentUser={currentUser}
                        showAlert={showAlert}
                    />
                )}
                {activeTab === 'projects' && (
                    <ProjectsPage
                        currentUser={currentUser}
                        showAlert={showAlert}
                    />
                )}
                {activeTab === 'members' && (
                    <MembersPage
                        currentUser={currentUser}
                        showAlert={showAlert}
                        onUserUpdate={handleUserUpdate}
                    />
                )}
                {activeTab === 'inventory' && (
                    <InventoryPage
                        currentUser={currentUser}
                        showAlert={showAlert}
                    />
                )}
                {activeTab === 'profile' && (
                    <ProfilePage
                        currentUser={currentUser}
                        showAlert={showAlert}
                        onUserUpdate={handleUserUpdate}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsPage
                        currentUser={currentUser}
                        showAlert={showAlert}
                        onUserUpdate={handleUserUpdate}
                        onLogout={handleLogout}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                )}
            </main>
        </div>
    );
}
