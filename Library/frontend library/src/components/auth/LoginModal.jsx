import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  UserCheck,
  Wrench,
  Bot,
  LogIn,
  UserPlus,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginModal = ({ isOpen, onClose, allowDismiss = true, onAuthSuccess = () => {} }) => {
  const { login, register, switchRole, demoAccounts } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Robotics & Automation');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
              department: department.trim()
            });

      if (res.success) {
        setPassword('');
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSwitch = (account) => {
    const switched = switchRole(account.id || account.role);
    if (switched) {
      onAuthSuccess(switched);
      onClose();
    }
  };

  const getRoleBadge = (roleName) => {
    const r = String(roleName || '').toUpperCase();
    if (r === 'ADMIN' || r === 'SENIOR') return { label: 'Admin', icon: ShieldCheck, color: 'bg-purple-50 text-purple-700 border-purple-200' };
    return { label: 'Student', icon: Bot, color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
      onClick={() => allowDismiss && onClose()}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RoboStock Portal Auth</span>
            </div>
            <h2 className="text-lg font-extrabold mt-0.5">
              {mode === 'login' ? 'Sign In to Robotics Club' : 'Register Student Account'}
            </h2>
          </div>
          {allowDismiss && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              aria-label="Close sign in dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                mode === 'login' ? 'bg-white text-[#0B132B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                mode === 'register' ? 'bg-white text-[#0B132B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Student Sign Up</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Branch</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Electronics & Communication"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aryan@robotics.club"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (demo: password123)"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Student Account'}
              </span>
            </button>
          </form>

          {demoAccounts.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Panel Switch (Student / Admin)
              </p>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {demoAccounts.filter(acc => ['MEMBER', 'ADMIN'].includes(acc.role)).map((acc) => {
                  const badge = getRoleBadge(acc.role);
                  const BadgeIcon = badge.icon;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickSwitch(acc)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">{acc.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 shrink-0 ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
