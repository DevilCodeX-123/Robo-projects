import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Phone,
  Mail,
  Building2,
  Award,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  department: '',
  position: '',
  password: ''
};

export const SeniorManagementView = ({ onSeniorsUpdated = () => {} }) => {
  const { role } = useAuth();
  const canManageSeniors = ['SENIOR', 'ADMIN'].includes(String(role || '').toUpperCase());
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Form State (Add / Edit)
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // View Details Modal
  const [detailSenior, setDetailSenior] = useState(null);

  const fetchSeniors = async () => {
    try {
      setLoading(true);
      const res = await api.getSeniors();
      if (res.success) {
        setSeniors(res.seniors || []);
      } else {
        setErrorMsg(res.message || 'Failed to load registered seniors.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not connect to backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, []);

  const filteredSeniors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return seniors;
    return seniors.filter(
      (s) =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.phoneNumber || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.position || '').toLowerCase().includes(q)
    );
  }, [seniors, searchQuery]);

  const validatePhoneClient = (phone) => {
    const trimmed = String(phone || '').trim();
    if (!/^\+?[\d\s\-()]{10,20}$/.test(trimmed)) {
      return 'Please enter a valid phone number (10 to 15 digits, e.g. +91 98765 43210).';
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return 'Phone number must contain between 10 and 15 digits.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Senior Full Name is required.');
      return;
    }
    const phoneErr = validatePhoneClient(formData.phoneNumber);
    if (phoneErr) {
      setErrorMsg(phoneErr);
      return;
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address or leave it blank.');
      return;
    }
    if (!formData.department.trim()) {
      setErrorMsg('Department / Branch is required.');
      return;
    }
    if (!formData.position.trim()) {
      setErrorMsg('Position / Role is required.');
      return;
    }
    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      setErrorMsg('Login password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        position: formData.position.trim(),
        ...(formData.password ? { password: formData.password } : {})
      };

      const res = editingId
        ? await api.updateSenior(editingId, payload)
        : await api.createSenior(payload);

      if (res.success) {
        const linkedNotice = res.linkedAccount
          ? ` Senior login (${res.linkedAccount.email}) activated with SENIOR role.`
          : '';
        setSuccessMsg(
          editingId
            ? `Senior "${payload.fullName}" updated successfully.${linkedNotice}`
            : `Senior "${payload.fullName}" registered and saved to database!${linkedNotice}`
        );
        setFormData(INITIAL_FORM);
        setEditingId(null);
        await fetchSeniors();
        onSeniorsUpdated();
      } else {
        setErrorMsg(res.message || 'Failed to save senior record.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error while saving senior.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (senior) => {
    setErrorMsg('');
    setSuccessMsg('');
    setEditingId(senior._id || senior.id);
    setFormData({
      fullName: senior.fullName || '',
      phoneNumber: senior.phoneNumber || '',
      email: senior.email || '',
      department: senior.department || '',
      position: senior.position || '',
      password: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setErrorMsg('');
  };

  const handleDeleteClick = async (senior) => {
    const id = senior._id || senior.id;
    if (!window.confirm(`Delete registered senior "${senior.fullName}"?`)) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.deleteSenior(id);
      if (res.success) {
        setSuccessMsg(`Deleted senior "${senior.fullName}".`);
        if (editingId === id) {
          handleCancelEdit();
        }
        await fetchSeniors();
        onSeniorsUpdated();
      } else {
        setErrorMsg(res.message || 'Failed to delete senior.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error while deleting senior.');
    }
  };

  const departmentCount = new Set(seniors.map((s) => (s.department || '').trim()).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Top Navy Banner */}
      <div className="bg-[#0B132B] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 font-mono">
            <Users className="w-4 h-4" />
            <span>Club Leadership Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Senior Management
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Register robotics club seniors, manage contact &amp; department details, and connect them directly to the student component permission request system.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
            <div className="text-2xl font-black text-blue-400 font-mono">{seniors.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Registered Seniors</div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
            <div className="text-2xl font-black text-emerald-400 font-mono">{departmentCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Departments</div>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid: Add/Edit Senior Form + Registered Senior List */}
      {!canManageSeniors && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 font-medium">
          Signed in as Student / Viewer ({role || 'GUEST'}). You can browse registered seniors here; only <span className="font-bold">SENIOR</span> or <span className="font-bold">ADMIN</span> accounts can add, edit, or delete senior records.
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: ADD / EDIT SENIOR FORM */}
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#0B132B] text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  {editingId ? 'Edit Senior Details' : 'Add New Senior'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Stored permanently in database
                </p>
              </div>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Senior Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rohan Deshmukh"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rohan@robotics.club"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Department / Branch *
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Electronics & Communication"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Position / Role *
              </label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g. Hardware Tech Lead"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Portal Login Password <span className="text-slate-400 font-normal">(optional, sets SENIOR login)</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 chars (defaults to senior123 with email)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !canManageSeniors}
              className="w-full py-3 px-4 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{!canManageSeniors ? 'Senior/Admin Required' : submitting ? 'Saving...' : editingId ? 'Update Senior' : 'Save Senior'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: REGISTERED SENIORS LIST (CARDS OR TABLE + SEARCH) */}
        <div className="xl:col-span-8 space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search seniors by name, phone, department, or role..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0B132B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={fetchSeniors}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Refresh senior directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty or Loading State */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center text-xs text-slate-400">
              Loading registered seniors...
            </div>
          ) : filteredSeniors.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center space-y-2.5">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">
                {searchQuery ? `No seniors matching "${searchQuery}"` : 'No Seniors Registered Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery
                  ? 'Try clearing your search query.'
                  : 'Use the Add New Senior form on the left to register your club seniors. Registered seniors will automatically appear in the Permission Request dropdown.'}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSeniors.map((senior) => {
                const id = senior._id || senior.id;
                return (
                  <div
                    key={id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#0B132B] text-white font-black text-base flex items-center justify-center shrink-0">
                            {senior.fullName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                              {senior.fullName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                {senior.position}
                              </span>
                              {senior.linkedUserId ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  SENIOR Login Linked
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                                  Directory Only
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-800">{senior.phoneNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{senior.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDetailSenior(senior)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      {canManageSeniors && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditClick(senior)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(senior)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Senior Name</th>
                      <th className="px-5 py-3">Phone Number</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSeniors.map((senior) => {
                      const id = senior._id || senior.id;
                      return (
                        <tr key={id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3.5 font-extrabold text-slate-900">
                            {senior.fullName}
                            {senior.email && (
                              <div className="text-[11px] text-slate-400 font-normal">{senior.email}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                            {senior.phoneNumber}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">{senior.department}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              {senior.position}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailSenior(senior)}
                              className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg font-bold inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            {canManageSeniors && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(senior)}
                                  className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(senior)}
                                  className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW SENIOR DETAILS MODAL */}
      {detailSenior && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setDetailSenior(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-base">
                  {detailSenior.fullName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 className="text-base font-bold">{detailSenior.fullName}</h3>
                  <p className="text-xs text-blue-300">{detailSenior.position}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailSenior(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Phone Number</span>
                <span className="font-mono font-extrabold text-slate-900">{detailSenior.phoneNumber}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Email Address</span>
                <span className="font-semibold text-slate-900">
                  {detailSenior.email || 'Not provided'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Department / Branch</span>
                <span className="font-semibold text-slate-900">{detailSenior.department}</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailSenior;
                    setDetailSenior(null);
                    handleEditClick(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Edit Senior
                </button>
                <button
                  type="button"
                  onClick={() => setDetailSenior(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeniorManagementView;

