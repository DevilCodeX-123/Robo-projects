import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('robo_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  const refreshDemoAccounts = async () => {
    try {
      const demoRes = await api.getDemoAccounts();
      if (demoRes.success && Array.isArray(demoRes.demoAccounts)) {
        setDemoAccounts(demoRes.demoAccounts);
        return demoRes.demoAccounts;
      }
    } catch (err) {
      console.error('Error refreshing demo accounts:', err);
    }
    return [];
  };

  // Load demo accounts and profile
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accounts = await refreshDemoAccounts();
        const explicitLoggedOut = sessionStorage.getItem('robo_logged_out') === '1';

        // If no user is logged in and user didn't explicitly log out, default to the Student account (Mittal)
        if (!localStorage.getItem('robo_token') && !explicitLoggedOut && accounts.length > 0) {
          const studentDemo = accounts.find(a => String(a.role || '').toUpperCase() === 'MEMBER') || accounts[0];
          localStorage.setItem('robo_token', studentDemo.token);
          localStorage.setItem('robo_demo_user_id', studentDemo.id);
          setToken(studentDemo.token);
          setUser({ ...studentDemo, role: String(studentDemo.role || 'MEMBER').toUpperCase() });
          setLoading(false);
          return;
        }

        if (token) {
          const profileRes = await api.getProfile();
          if (profileRes.success && profileRes.user) {
            setUser({ ...profileRes.user, role: String(profileRes.user.role || 'MEMBER').toUpperCase() });
          } else {
            logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      sessionStorage.removeItem('robo_logged_out');
      localStorage.setItem('robo_token', res.token);
      localStorage.removeItem('robo_demo_user_id');
      const normalizedUser = { ...res.user, role: String(res.user.role || 'MEMBER').toUpperCase() };
      setToken(res.token);
      setUser(normalizedUser);
      await refreshDemoAccounts();
      return { success: true, user: normalizedUser };
    }
    return { success: false, message: res.message };
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      sessionStorage.removeItem('robo_logged_out');
      localStorage.setItem('robo_token', res.token);
      localStorage.removeItem('robo_demo_user_id');
      const normalizedUser = { ...res.user, role: String(res.user.role || 'MEMBER').toUpperCase() };
      setToken(res.token);
      setUser(normalizedUser);
      await refreshDemoAccounts();
      return { success: true, user: normalizedUser };
    }
    return { success: false, message: res.message };
  };

  const logout = () => {
    sessionStorage.setItem('robo_logged_out', '1');
    localStorage.removeItem('robo_token');
    localStorage.removeItem('robo_demo_user_id');
    setToken(null);
    setUser(null);
  };

  const switchRole = (targetRoleOrAccountId) => {
    const account = demoAccounts.find(
      a => a.id === targetRoleOrAccountId || String(a.role || '').toUpperCase() === String(targetRoleOrAccountId || '').toUpperCase()
    );
    if (account) {
      sessionStorage.removeItem('robo_logged_out');
      localStorage.setItem('robo_token', account.token);
      localStorage.setItem('robo_demo_user_id', account.id);
      setToken(account.token);
      setUser({ ...account, role: String(account.role || 'MEMBER').toUpperCase() });
      return account;
    }
    return null;
  };

  const updateUserProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    if (res.success && res.user) {
      const normalizedUser = { ...res.user, role: String(res.user.role || 'MEMBER').toUpperCase() };
      setUser(normalizedUser);
      setDemoAccounts(prev =>
        prev.map(acc => (acc.id === normalizedUser.id ? { ...acc, ...normalizedUser } : acc))
      );
      return { success: true, user: normalizedUser };
    }
    return { success: false, message: res.message || 'Failed to update profile' };
  };

  const updateUserPreferences = async (preferences) => {
    const res = await api.updatePreferences(preferences);
    if (res.success && res.user) {
      const normalizedUser = { ...res.user, role: String(res.user.role || 'MEMBER').toUpperCase() };
      setUser(normalizedUser);
      return { success: true, preferences: res.preferences, user: normalizedUser };
    }
    return { success: false, message: res.message || 'Failed to save preferences' };
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      demoAccounts,
      login,
      register,
      logout,
      switchRole,
      refreshDemoAccounts,
      updateUserProfile,
      updateUserPreferences,
      role: String(user?.role || 'GUEST').toUpperCase()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
