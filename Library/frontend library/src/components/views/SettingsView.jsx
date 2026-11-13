import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Sliders,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const SettingsView = () => {
  const { user, updateUserPreferences } = useAuth();

  // Notification Settings State (synced with backend preferences)
  const [newRequestNotif, setNewRequestNotif] = useState(true);
  const [approvalNotif, setApprovalNotif] = useState(true);
  const [rejectionNotif, setRejectionNotif] = useState(true);
  const [pendingReminder, setPendingReminder] = useState(true);
  const [returnReminderDays, setReturnReminderDays] = useState(2);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [prefsError, setPrefsError] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  useEffect(() => {
    const prefs = user?.preferences;
    if (prefs) {
      setNewRequestNotif(prefs.newRequestNotif !== false);
      setApprovalNotif(prefs.approvalNotif !== false);
      setRejectionNotif(prefs.rejectionNotif !== false);
      setPendingReminder(prefs.pendingReminder !== false);
      setReturnReminderDays(Number(prefs.returnReminderDays) || 2);
      setSmsAlerts(prefs.smsAlerts !== false);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setPrefsError('');
    setSavedSuccess('');
    setSavingPrefs(true);
    try {
      const res = await updateUserPreferences({
        newRequestNotif,
        approvalNotif,
        rejectionNotif,
        pendingReminder,
        returnReminderDays,
        smsAlerts
      });
      if (res.success) {
        setSavedSuccess('Settings updated and saved to your account!');
        setTimeout(() => setSavedSuccess(''), 4000);
      } else {
        setPrefsError(res.message || 'Could not save preferences.');
      }
    } catch (err) {
      setPrefsError(err.message || 'Server error saving preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordFeedback({ type: 'success', text: res.message || 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordFeedback({ type: 'error', text: res.message || 'Could not update password.' });
      }
    } catch (err) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Server error updating password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Header Banner */}
      <div className="bg-[#0B132B] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-1">
            <Sliders className="w-4 h-4" />
            <span>Preferences &amp; Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            System &amp; Alert Settings
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage your component return reminders, approval alerts, and notification preferences.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{savedSuccess}</span>
        </div>
      )}

      {prefsError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-bold">{prefsError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Notification System Settings (Requirement 9) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Notification System Alerts (Requirement 9)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live In-App</span>
          </div>

          <div className="space-y-4">
            
            {/* New Request Notifications */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">New Request Notifications</p>
                <p className="text-[11px] text-slate-500">Receive alerts when you submit a new component permission request.</p>
              </div>
              <input
                type="checkbox"
                checked={newRequestNotif}
                onChange={(e) => setNewRequestNotif(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Approval Notifications */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">Approval Notifications</p>
                <p className="text-[11px] text-slate-500">Get notified immediately when a senior approves your component request.</p>
              </div>
              <input
                type="checkbox"
                checked={approvalNotif}
                onChange={(e) => setApprovalNotif(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Rejection Notifications */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">Rejection Notifications</p>
                <p className="text-[11px] text-slate-500">Receive senior feedback remarks if a component request is declined or adjusted.</p>
              </div>
              <input
                type="checkbox"
                checked={rejectionNotif}
                onChange={(e) => setRejectionNotif(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Pending Request Notifications */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">Pending Request Notifications</p>
                <p className="text-[11px] text-slate-500">Alerts when requests remain pending in the review queue for more than 24 hours.</p>
              </div>
              <input
                type="checkbox"
                checked={pendingReminder}
                onChange={(e) => setPendingReminder(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Component Return Reminders */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-950">Component Return Reminders</p>
                  <p className="text-[11px] text-amber-700">Days prior to return deadline to dispatch automated alert:</p>
                </div>
                <select
                  value={returnReminderDays}
                  onChange={(e) => setReturnReminderDays(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-xs text-amber-900 shadow-xs"
                >
                  <option value={1}>1 Day Before</option>
                  <option value={2}>2 Days Before</option>
                  <option value={3}>3 Days Before</option>
                </select>
              </div>
            </div>

            {/* Senior SMS / WhatsApp Delivery */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Senior Mobile Dispatch</p>
                  <p className="text-[11px] text-slate-500">Directly dispatch notification alerts to senior's registered phone number.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPrefs || !user}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>

      </form>

      {/* Change Password Card */}
      {user && (
        <form onSubmit={handlePasswordChange} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-[#0B132B]" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Account Security &amp; Password</h2>
              <p className="text-[11px] text-slate-500">Update your login password ({user.email})</p>
            </div>
          </div>

          {passwordFeedback && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {passwordFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 bg-[#0B132B] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};

export default SettingsView;

