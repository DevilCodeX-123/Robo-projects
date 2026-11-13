import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  FileText,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Lock,
  Unlock,
  Package,
  Wrench,
  Building2,
  Phone,
  Mail,
  GraduationCap,
  Save,
  RefreshCw,
  Award,
  UserPlus,
  Sliders,
  Check,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ManagementDashboard = ({ onRefreshData = () => {}, defaultTab = 'overview' }) => {
  const { user, role, updateUserProfile } = useAuth();
  const normalizedRole = String(role || user?.role || 'SENIOR').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';
  const isSenior = normalizedRole === 'SENIOR';

  // Navigation Tabs: 'overview' | 'components' | 'students' | 'requests' | 'issue-return' | 'seniors' | 'profile'
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Data states
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [seniorsList, setSeniorsList] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilter, setRequestFilter] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED' | 'ALL'

  // Component Modal (Admin only)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [compForm, setCompForm] = useState({
    name: '',
    category: 'Basic Electronics',
    description: '',
    whatItDoes: '',
    totalStock: 10,
    availableStock: 10,
    minThreshold: 3,
    shelfIndex: 1,
    unit: 'pcs',
    imageUrl: ''
  });

  // Student Modal (Admin only)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'Robotics & Automation',
    academicYear: '1st Year',
    teamName: 'Combat Robotics',
    contactNumber: ''
  });

  // Senior Modal (Admin only)
  const [isSeniorModalOpen, setIsSeniorModalOpen] = useState(false);
  const [editingSenior, setEditingSenior] = useState(null);
  const [seniorForm, setSeniorForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    department: 'Electronics & Communication',
    position: 'Hardware Lead',
    password: ''
  });

  // Review Modal (Senior & Admin)
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [reviewComments, setReviewComments] = useState('');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    department: user?.department || '',
    teamName: user?.teamName || ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [compRes, reqRes, userRes, senRes] = await Promise.all([
        api.getComponents({ includeArchived: true }),
        api.getRequests(),
        api.getUsers(),
        api.getSeniors()
      ]);

      if (compRes.success) setComponents(compRes.components || []);
      if (reqRes.success) setRequests(reqRes.requests || []);
      if (userRes.success) setUsersList(userRes.users || []);
      if (senRes.success) setSeniorsList(senRes.seniors || []);
    } catch (err) {
      console.error('Error loading management dashboard data:', err);
      showToast('error', err.message || 'Could not load management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        department: user.department || '',
        teamName: user.teamName || ''
      });
    }
  }, [user]);

  // Derived Metrics
  const activeComponents = useMemo(() => components.filter(c => c.status !== 'ARCHIVED'), [components]);
  const totalStockCount = useMemo(() => activeComponents.reduce((acc, c) => acc + (c.availableStock ?? 0), 0), [activeComponents]);
  const lowStockComponents = useMemo(() => activeComponents.filter(c => (c.availableStock ?? 0) <= (c.minThreshold ?? 3)), [activeComponents]);

  const pendingRequests = useMemo(() => requests.filter(r => ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status)), [requests]);
  const pickupReadyRequests = useMemo(() => requests.filter(r => ['APPROVED', 'READY_FOR_PICKUP'].includes(r.status)), [requests]);
  const issuedRequests = useMemo(() => requests.filter(r => r.status === 'ISSUED'), [requests]);
  const returnedRequests = useMemo(() => requests.filter(r => r.status === 'RETURNED'), [requests]);

  const studentsList = useMemo(() => usersList.filter(u => String(u.role || '').toUpperCase() === 'MEMBER'), [usersList]);

  // Handle Review (Senior & Admin)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      const res = await api.reviewRequest(selectedReq._id || selectedReq.id, {
        action: reviewAction,
        comments: reviewComments.trim() || (reviewAction === 'APPROVED' ? 'Approved by management.' : 'Rejected.')
      });
      if (res.success) {
        showToast('success', `Request ${selectedReq.requestCode} marked as ${reviewAction}.`);
        setSelectedReq(null);
        setReviewComments('');
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Review submission failed.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error submitting review.');
    }
  };

  // 1-Click Quick Approve
  const handleQuickApprove = async (reqDoc) => {
    try {
      const res = await api.reviewRequest(reqDoc._id || reqDoc.id, {
        action: 'APPROVED',
        comments: 'Quick approved by management reviewer.'
      });
      if (res.success) {
        showToast('success', `Request ${reqDoc.requestCode} approved.`);
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Approval failed.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error approving request.');
    }
  };

  // Issue Components
  const handleIssueComponents = async (reqDoc) => {
    if (!window.confirm(`Issue components for ${reqDoc.userName || 'student'}? Stock will be physically checked out.`)) return;
    try {
      const res = await api.issueRequest(reqDoc._id || reqDoc.id);
      if (res.success) {
        showToast('success', `Components issued for request ${reqDoc.requestCode}. Stock updated.`);
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Issuance failed.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error issuing components.');
    }
  };

  // Return Components
  const handleReturnComponents = async (reqDoc) => {
    if (!window.confirm(`Check in returned components for ${reqDoc.userName}? Stock will be restored to storage.`)) return;
    try {
      const returnPayload = (reqDoc.items || []).map(it => ({
        componentId: it.component,
        returnedQuantity: it.issuedQuantity || it.approvedQuantity || it.requestedQuantity || 1,
        condition: 'GOOD',
        notes: 'Returned in good condition via Management Dashboard check-in.'
      }));
      const res = await api.processReturn(reqDoc._id || reqDoc.id, returnPayload);
      if (res.success) {
        showToast('success', `Components returned for ${reqDoc.requestCode}. Stock restored to storage!`);
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Return processing failed.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error processing return.');
    }
  };

  // Admin: Save Component (Add / Edit)
  const handleSaveComponent = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('error', 'Only Administrators have permission to manage components.');
      return;
    }
    try {
      const payload = {
        ...compForm,
        name: compForm.name.trim(),
        label: compForm.name.trim(),
        availableStock: Number(compForm.availableStock) || 0,
        totalStock: Number(compForm.totalStock) || Number(compForm.availableStock) || 0,
        minThreshold: Number(compForm.minThreshold) || 3
      };
      const res = editingComp
        ? await api.updateComponent(editingComp._id || editingComp.id, payload)
        : await api.createComponent(payload);

      if (res.success) {
        showToast('success', editingComp ? `Component "${payload.name}" updated.` : `Component "${payload.name}" created.`);
        setIsCompModalOpen(false);
        setEditingComp(null);
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Failed to save component.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error saving component.');
    }
  };

  // Admin: Delete/Archive Component
  const handleDeleteComponent = async (comp) => {
    if (!isAdmin) return;
    if (!window.confirm(`Archive component "${comp.name}"?`)) return;
    try {
      const res = await api.deleteComponent(comp._id || comp.id);
      if (res.success) {
        showToast('success', `Component "${comp.name}" archived.`);
        await loadAllData();
        onRefreshData();
      } else {
        showToast('error', res.message || 'Failed to archive component.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error archiving component.');
    }
  };

  // Admin: Add Student
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const res = await api.createStudentUser(studentForm);
      if (res.success) {
        showToast('success', `Student account created for "${studentForm.fullName}".`);
        setIsStudentModalOpen(false);
        setStudentForm({
          fullName: '',
          email: '',
          password: '',
          department: 'Robotics & Automation',
          academicYear: '1st Year',
          teamName: 'Combat Robotics',
          contactNumber: ''
        });
        await loadAllData();
      } else {
        showToast('error', res.message || 'Failed to create student account.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error creating student.');
    }
  };

  // Admin: Delete Student
  const handleDeleteStudent = async (stu) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete student account "${stu.fullName}" (${stu.email})?`)) return;
    try {
      const res = await api.deleteUser(stu._id || stu.id);
      if (res.success) {
        showToast('success', `Student "${stu.fullName}" deleted.`);
        await loadAllData();
      } else {
        showToast('error', res.message || 'Failed to delete student.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error deleting student.');
    }
  };

  // Admin: Toggle Student Status
  const handleToggleStudentStatus = async (stu) => {
    if (!isAdmin) return;
    try {
      const res = await api.toggleUserStatus(stu._id || stu.id);
      if (res.success) {
        showToast('success', `Status updated to ${res.user.status}.`);
        await loadAllData();
      } else {
        showToast('error', res.message || 'Failed to toggle status.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error updating status.');
    }
  };

  // Admin: Save Senior
  const handleSaveSenior = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const res = editingSenior
        ? await api.updateSenior(editingSenior._id || editingSenior.id, seniorForm)
        : await api.createSenior(seniorForm);

      if (res.success) {
        showToast('success', editingSenior ? `Senior "${seniorForm.fullName}" updated.` : `Senior "${seniorForm.fullName}" registered.`);
        setIsSeniorModalOpen(false);
        setEditingSenior(null);
        setSeniorForm({
          fullName: '',
          phoneNumber: '',
          email: '',
          department: 'Electronics & Communication',
          position: 'Hardware Lead',
          password: ''
        });
        await loadAllData();
      } else {
        showToast('error', res.message || 'Failed to save senior record.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error saving senior.');
    }
  };

  // Admin: Delete Senior
  const handleDeleteSenior = async (sen) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete senior record "${sen.fullName}"?`)) return;
    try {
      const res = await api.deleteSenior(sen._id || sen.id);
      if (res.success) {
        showToast('success', `Senior "${sen.fullName}" deleted.`);
        await loadAllData();
      } else {
        showToast('error', res.message || 'Failed to delete senior.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error deleting senior.');
    }
  };

  // Profile Save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateUserProfile(profileForm);
      if (res.success) {
        showToast('success', 'Profile details updated successfully.');
      } else {
        showToast('error', res.message || 'Could not update profile.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error updating profile.');
    }
  };

  // Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast('success', 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', res.message || 'Failed to update password.');
      }
    } catch (err) {
      showToast('error', err.message || 'Server error changing password.');
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'components', label: 'Manage Components', icon: Package, badge: activeComponents.length },
    { id: 'students', label: 'Student Details', icon: GraduationCap, badge: studentsList.length },
    { id: 'requests', label: 'Permission Requests', icon: FileText, badge: pendingRequests.length, badgeAlert: pendingRequests.length > 0 },
    { id: 'issue-return', label: 'Issue & Return', icon: Wrench, badge: pickupReadyRequests.length + issuedRequests.length },
    { id: 'seniors', label: 'Manage Seniors', icon: Users, badge: seniorsList.length },
    { id: 'profile', label: 'Profile', icon: ShieldCheck }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      
      {/* Toast Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
        </div>
      )}

      {/* TOP HEADER: SHARED UNIFIED MANAGEMENT DASHBOARD */}
      <div className="bg-[#0F172A] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-blue-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Robotics Club Central Administration &bull; Lab 304</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Administrative console for Robotics Lab leadership and seniors. Manage component inventory &amp; stock, review student requests, issue parts, and manage student and senior records.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
              isAdmin
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isAdmin ? <ShieldAlert className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{isAdmin ? 'System Administrator' : 'Senior Admin'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Signed in as: <strong className="text-white">{user?.fullName || 'Manager'}</strong>
            </span>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[90px]">
            <div className="text-xl font-black text-blue-400 font-mono">{activeComponents.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Parts</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[90px]">
            <div className="text-xl font-black text-amber-400 font-mono">{pendingRequests.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pending</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[90px]">
            <div className="text-xl font-black text-emerald-400 font-mono">{studentsList.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Students</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[90px]">
            <div className="text-xl font-black text-indigo-400 font-mono">{seniorsList.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Seniors</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS: SAME LAYOUT & NAVIGATION FOR BOTH ROLES */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-1.5 flex items-center overflow-x-auto gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.badgeAlert
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: DASHBOARD OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setActiveTab('requests')}
              className="bg-white rounded-3xl p-5 border border-amber-200/90 shadow-xs hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Approvals</span>
                <span className="text-3xl font-black text-amber-950 font-mono mt-1 block">{pendingRequests.length}</span>
                <span className="text-xs text-amber-700 mt-1 flex items-center space-x-1">
                  <span>Review student queue</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('components')}
              className="bg-white rounded-3xl p-5 border border-blue-200/90 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Total Components</span>
                <span className="text-3xl font-black text-blue-950 font-mono mt-1 block">{activeComponents.length}</span>
                <span className="text-xs text-blue-700 mt-1 block">{totalStockCount} units available in stock</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('students')}
              className="bg-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Student Members</span>
                <span className="text-3xl font-black text-emerald-950 font-mono mt-1 block">{studentsList.length}</span>
                <span className="text-xs text-emerald-700 mt-1 block">{isAdmin ? 'Add / Delete enabled' : 'Full directory view'}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('issue-return')}
              className="bg-white rounded-3xl p-5 border border-indigo-200/90 shadow-xs hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">Active Handover / Return</span>
                <span className="text-3xl font-black text-indigo-950 font-mono mt-1 block">{pickupReadyRequests.length + issuedRequests.length}</span>
                <span className="text-xs text-indigo-700 mt-1 block">{issuedRequests.length} borrowed &bull; {pickupReadyRequests.length} ready pickup</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Management Operations Shortcut</h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Administrator role active: You can manage components, add/delete students & seniors, and process requests.'
                  : 'Senior Coordinator role active: You can review & approve requests, issue components, and handle returns.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('requests')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Requests ({pendingRequests.length})</span>
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setEditingComp(null);
                      setCompForm({
                        name: '',
                        category: 'Basic Electronics',
                        description: '',
                        whatItDoes: '',
                        totalStock: 10,
                        availableStock: 10,
                        minThreshold: 3,
                        shelfIndex: 1,
                        unit: 'pcs',
                        imageUrl: ''
                      });
                      setIsCompModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Component</span>
                  </button>
                  <button
                    onClick={() => setIsStudentModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Student</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recent Pending Requests Table Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Recent Student Permission Requests</h3>
                <p className="text-xs text-slate-500">Incoming requests awaiting senior evaluation &amp; sign-off</p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>View All Requests &rarr;</span>
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No requests currently pending review. Great job!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Request Code</th>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Project</th>
                      <th className="px-4 py-2.5">Components</th>
                      <th className="px-4 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingRequests.slice(0, 5).map(reqDoc => (
                      <tr key={reqDoc._id || reqDoc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">{reqDoc.requestCode}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{reqDoc.userName || 'Student'}</td>
                        <td className="px-4 py-3 text-slate-700">{reqDoc.projectName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {(reqDoc.items || []).map(i => `${i.componentName} (x${i.requestedQuantity})`).join(', ')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleQuickApprove(reqDoc)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MANAGE COMPONENTS
          (Admin: Add, Edit, Delete, Adjust Stock | Senior: View, Check Stock)
         ========================================================================= */}
      {activeTab === 'components' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Components Inventory Management</h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Administrator privileges: Add new parts, edit specifications, adjust stock levels, and archive items.'
                  : 'Senior Coordinator view: Check real-time stock availability, pinout specs, and storage coordinates.'}
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={() => {
                  setEditingComp(null);
                  setCompForm({
                    name: '',
                    category: 'Basic Electronics',
                    description: '',
                    whatItDoes: '',
                    totalStock: 10,
                    availableStock: 10,
                    minThreshold: 3,
                    shelfIndex: 1,
                    unit: 'pcs',
                    imageUrl: ''
                  });
                  setIsCompModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Component</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                Stock Modification Managed by Admin
              </span>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components by name, code, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
            />
          </div>

          {/* Components Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeComponents
              .filter(c => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  c.name?.toLowerCase().includes(q) ||
                  c.category?.toLowerCase().includes(q) ||
                  c.componentCode?.toLowerCase().includes(q)
                );
              })
              .map(comp => (
                <div 
                  key={comp._id || comp.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{comp.name}</h4>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {comp.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-black font-mono ${
                          comp.availableStock <= (comp.minThreshold ?? 3) ? 'text-amber-600' : 'text-emerald-700'
                        }`}>
                          {comp.availableStock}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">avail / {comp.totalStock} total</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {comp.whatItDoes || comp.description}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2 text-xs">
                      <button
                        onClick={() => {
                          setEditingComp(comp);
                          setCompForm({
                            name: comp.name || '',
                            category: comp.category || 'Basic Electronics',
                            description: comp.description || '',
                            whatItDoes: comp.whatItDoes || comp.description || '',
                            totalStock: comp.totalStock ?? comp.availableStock ?? 10,
                            availableStock: comp.availableStock ?? 10,
                            minThreshold: comp.minThreshold ?? 3,
                            shelfIndex: comp.shelfIndex || 1,
                            unit: comp.unit || 'pcs',
                            imageUrl: comp.imageUrl || ''
                          });
                          setIsCompModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(comp)}
                        className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STUDENT DETAILS
          (Admin: Add, Delete, Toggle Status | Senior: View all student details)
         ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Student Directory &amp; Details</h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Administrator permissions: Register new student members, delete inactive accounts, and manage account status.'
                  : 'Senior Coordinator view: Access student contact info, branch, and team memberships.'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name, email, department, or membership ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Department &amp; Year</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList
                  .filter(s => {
                    const q = searchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      s.fullName?.toLowerCase().includes(q) ||
                      s.email?.toLowerCase().includes(q) ||
                      s.department?.toLowerCase().includes(q) ||
                      s.membershipId?.toLowerCase().includes(q)
                    );
                  })
                  .map(stu => (
                    <tr key={stu._id || stu.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900">{stu.fullName}</div>
                        <div className="text-[11px] text-slate-500">{stu.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{stu.membershipId || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{stu.department}</div>
                        <div className="text-[10px] text-slate-400">{stu.academicYear || '1st Year'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{stu.contactNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          stu.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {stu.status || 'ACTIVE'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStudentStatus(stu)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold cursor-pointer"
                          >
                            {stu.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Delete</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PERMISSION REQUESTS & APPROVALS
          (Both Senior & Admin can review/approve/reject requests)
         ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Student Permission Requests Queue</h2>
              <p className="text-xs text-slate-500">
                Inspect requested robotics components, check project purpose, and approve or reject sign-offs.
              </p>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
                <button
                  key={st}
                  onClick={() => setRequestFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    requestFilter === st
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {requests
              .filter(r => {
                if (requestFilter === 'PENDING') return ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status);
                if (requestFilter === 'APPROVED') return ['APPROVED', 'READY_FOR_PICKUP', 'ISSUED', 'RETURNED'].includes(r.status);
                if (requestFilter === 'REJECTED') return ['REJECTED', 'CANCELLED'].includes(r.status);
                return true;
              })
              .map(reqDoc => {
                const isPending = ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(reqDoc.status);
                return (
                  <div 
                    key={reqDoc._id || reqDoc.id}
                    className="p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-blue-700">{reqDoc.requestCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : reqDoc.status === 'READY_FOR_PICKUP' || reqDoc.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : reqDoc.status === 'ISSUED'
                              ? 'bg-blue-100 text-blue-800'
                              : reqDoc.status === 'RETURNED'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reqDoc.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          Project: {reqDoc.projectName}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Requested by <strong className="text-slate-900">{reqDoc.userName || 'Student'}</strong> &bull; Assigned Senior: {reqDoc.seniorApproverName || 'Any Senior'}
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        {reqDoc.createdAt ? new Date(reqDoc.createdAt).toLocaleString() : ''}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 mb-1">Purpose / Notes:</p>
                      <p className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-slate-600">{reqDoc.projectPurpose || 'No details provided.'}</p>
                    </div>

                    {/* Requested Components List */}
                    <div className="space-y-1 text-xs">
                      <span className="font-semibold text-slate-900">Components Requested:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(reqDoc.items || []).map((it, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                            {it.componentName} &times; {it.requestedQuantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Approve / Reject Controls */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleQuickApprove(reqDoc)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReq(reqDoc);
                            setReviewAction('REJECTED');
                            setReviewComments('');
                          }}
                          className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ISSUE AND RETURN COMPONENTS
          (Both Senior & Admin can issue approved parts and process returns)
         ========================================================================= */}
      {activeTab === 'issue-return' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Component Checkout &amp; Return Station</h2>
            <p className="text-xs text-slate-500">
              Process physical component handovers (Issuance) and check in returned components with automatic stock restoration.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Ready for Pickup / Issue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready for Handover ({pickupReadyRequests.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Approved by seniors</span>
              </div>

              {pickupReadyRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No requests waiting for component handover.
                </div>
              ) : (
                pickupReadyRequests.map(reqDoc => (
                  <div key={reqDoc._id || reqDoc.id} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-800">{reqDoc.requestCode}</span>
                      <span className="font-bold text-slate-900">{reqDoc.userName}</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {(reqDoc.items || []).map(it => `${it.componentName} (x${it.approvedQuantity || it.requestedQuantity})`).join(', ')}
                    </div>
                    <button
                      onClick={() => handleIssueComponents(reqDoc)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Issue Components to Student</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Right: Issued & Awaiting Return */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-blue-950 flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>Currently Borrowed / Awaiting Return ({issuedRequests.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Restores stock upon return</span>
              </div>

              {issuedRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No components currently checked out.
                </div>
              ) : (
                issuedRequests.map(reqDoc => (
                  <div key={reqDoc._id || reqDoc.id} className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-800">{reqDoc.requestCode}</span>
                      <span className="font-bold text-slate-900">{reqDoc.userName}</span>
                    </div>
                    <div className="text-xs text-slate-700">
                      {(reqDoc.items || []).map(it => `${it.componentName} (x${it.issuedQuantity || it.approvedQuantity || it.requestedQuantity})`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Due: {reqDoc.expectedReturnDate ? new Date(reqDoc.expectedReturnDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <button
                      onClick={() => handleReturnComponents(reqDoc)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Process Return &amp; Restock Inventory</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: SENIOR MANAGEMENT
          (Admin: Add, Edit, Delete | Senior: View colleagues directory)
         ========================================================================= */}
      {activeTab === 'seniors' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Senior Leadership Directory</h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Administrator permissions: Register club seniors, update contact details, and delete records.'
                  : 'Senior Coordinator view: Colleague directory & department roles.'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingSenior(null);
                  setSeniorForm({
                    fullName: '',
                    phoneNumber: '',
                    email: '',
                    department: 'Electronics & Communication',
                    position: 'Hardware Lead',
                    password: ''
                  });
                  setIsSeniorModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Senior</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seniorsList.map(sen => (
              <div key={sen._id || sen.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-white font-black text-sm flex items-center justify-center shrink-0">
                      {sen.fullName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{sen.fullName}</h4>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {sen.position}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-slate-800">{sen.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sen.department}</span>
                  </div>
                  {sen.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sen.email}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2 text-xs">
                    <button
                      onClick={() => {
                        setEditingSenior(sen);
                        setSeniorForm({
                          fullName: sen.fullName || '',
                          phoneNumber: sen.phoneNumber || '',
                          email: sen.email || '',
                          department: sen.department || '',
                          position: sen.position || '',
                          password: ''
                        });
                        setIsSeniorModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold cursor-pointer"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSenior(sen)}
                      className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: PROFILE & PASSWORD
          (Both Senior & Admin can view and update their profile & password)
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center text-lg font-black">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{user?.fullName || 'Manager'}</h3>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Role: {normalizedRole}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department / Branch</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Team / Role</label>
                <input
                  type="text"
                  value={profileForm.teamName}
                  onChange={(e) => setProfileForm({ ...profileForm, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.contactNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-[#0F172A]" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Account Password &amp; Security</h3>
                <p className="text-xs text-slate-500">Update your login password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: REVIEW MODAL, COMPONENT MODAL, STUDENT MODAL, SENIOR MODAL
         ========================================================================= */}

      {/* Review Modal Dialog */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700">{selectedReq.requestCode}</span>
                <h3 className="text-base font-bold text-slate-900">{reviewAction === 'APPROVED' ? 'Approve Request' : 'Reject Request'}</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Comments / Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={reviewAction === 'APPROVED' ? 'e.g. Approved for Line Follower project.' : 'Please provide reason for rejection.'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0F172A]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedReq(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-xl font-bold ${reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
                  Confirm {reviewAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Add / Edit Component Modal */}
      {isCompModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{editingComp ? 'Edit Component' : 'Add New Component'}</h3>
              <button onClick={() => setIsCompModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveComponent} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Component Name *</label>
                <input
                  type="text"
                  required
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  placeholder="e.g. Raspberry Pi 4"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={compForm.category}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Basic Electronics">Basic Electronics</option>
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Microcontrollers">Microcontrollers</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Motors">Motors</option>
                    <option value="Cables">Cables</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={compForm.availableStock}
                    onChange={(e) => setCompForm({ ...compForm, availableStock: Number(e.target.value), totalStock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Function / What It Does</label>
                <textarea
                  rows={2}
                  value={compForm.whatItDoes}
                  onChange={(e) => setCompForm({ ...compForm, whatItDoes: e.target.value })}
                  placeholder="Brief explanation of what the component is used for..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsCompModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold">Save Component</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Add Student Modal */}
      {isStudentModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Student Member</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="e.g. rahul@robotics.club"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={studentForm.contactNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, contactNumber: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password (min 6 chars)</label>
                <input
                  type="password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="Default: password123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">Create Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Add / Edit Senior Modal */}
      {isSeniorModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{editingSenior ? 'Edit Senior' : 'Add Senior'}</h3>
              <button onClick={() => setIsSeniorModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveSenior} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senior Full Name *</label>
                <input
                  type="text"
                  required
                  value={seniorForm.fullName}
                  onChange={(e) => setSeniorForm({ ...seniorForm, fullName: e.target.value })}
                  placeholder="e.g. Aryan Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={seniorForm.phoneNumber}
                  onChange={(e) => setSeniorForm({ ...seniorForm, phoneNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (for Senior login)</label>
                <input
                  type="email"
                  value={seniorForm.email}
                  onChange={(e) => setSeniorForm({ ...seniorForm, email: e.target.value })}
                  placeholder="e.g. aryan@robotics.club"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={seniorForm.department}
                    onChange={(e) => setSeniorForm({ ...seniorForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Position *</label>
                  <input
                    type="text"
                    required
                    value={seniorForm.position}
                    onChange={(e) => setSeniorForm({ ...seniorForm, position: e.target.value })}
                    placeholder="e.g. Tech Lead"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senior Login Password</label>
                <input
                  type="password"
                  value={seniorForm.password}
                  onChange={(e) => setSeniorForm({ ...seniorForm, password: e.target.value })}
                  placeholder="Default: senior123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsSeniorModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold">Save Senior</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagementDashboard;

