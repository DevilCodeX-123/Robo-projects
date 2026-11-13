import React, { useState, useEffect } from 'react';
import {
  Mail,
  BadgeCheck,
  Layers,
  X,
  Phone,
  Building,
  GraduationCap,
  Edit,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, role, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    membershipId: '',
    department: '',
    academicYear: '',
    teamName: '',
    contactNumber: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.fullName || 'User',
        email: user.email || '',
        membershipId: user.membershipId || '',
        department: user.department || '',
        academicYear: user.academicYear || '',
        teamName: user.teamName || '',
        contactNumber: user.contactNumber || ''
      });
      setIsEditing(false);
      setFeedback(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await updateUserProfile(formData);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Your profile details have been saved!' });
        setIsEditing(false);
      } else {
        setFeedback({ type: 'error', text: res.message || 'Could not update profile.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Server error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navy Header Card */}
        <div className="bg-[#0B132B] p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold mb-1">
                <BadgeCheck className="w-3 h-3" />
                <span>{role || 'MEMBER'}</span>
              </div>
              <h2 className="text-xl font-black leading-tight text-white">
                {user?.fullName || 'User'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {user?.membershipId || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-xl border font-semibold flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Membership / Roll ID</label>
                  <input
                    type="text"
                    value={formData.membershipId}
                    onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Branch</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Team / Project Group</label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save My Details'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{user?.email || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {user?.contactNumber || 'Not set'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>Department:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{user?.department || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Academic Year:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{user?.academicYear || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Active Team:</span>
                  </span>
                  <span className="font-semibold text-blue-700">{user?.teamName || 'Not set'}</span>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit My Details</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors text-xs cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
