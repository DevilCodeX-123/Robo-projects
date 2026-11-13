import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Layers, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  Check,
  Calendar,
  Phone,
  LogIn,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const SeniorApprovalView = ({ onRefreshData = () => {}, onOpenLogin = () => {} }) => {
  const { user, role, demoAccounts, switchRole } = useAuth();
  const normalizedRole = String(role || user?.role || 'GUEST').toUpperCase();
  const canReview = normalizedRole === 'SENIOR';
  const canOperateInventory = ['SENIOR', 'ADMIN', 'INVENTORY_MANAGER'].includes(normalizedRole);
  const seniorAccounts = (demoAccounts || []).filter(a => String(a.role || '').toUpperCase() === 'SENIOR');
  const [requests, setRequests] = useState([]);
  const [registeredSeniors, setRegisteredSeniors] = useState([]);
  const [selectedSeniorFilter, setSelectedSeniorFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  
  // Review Modal state
  const [actionType, setActionType] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const [reqRes, senRes] = await Promise.all([
        api.getRequests(),
        api.getSeniors()
      ]);
      if (reqRes.success) {
        setRequests(resOrList(reqRes.requests));
      }
      if (senRes.success) {
        setRegisteredSeniors(senRes.seniors || []);
      }
    } catch (err) {
      console.error('Error fetching approval queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const resOrList = (arr) => Array.isArray(arr) ? arr : [];

  useEffect(() => {
    fetchQueue();
  }, [user]);

  const openReviewModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setComments(type === 'APPROVED' ? 'Approved by senior reviewer.' : '');
    setErrorMsg('');
  };

  // 1-Click quick approve without modal
  const handleQuickApprove = async (req) => {
    try {
      setSubmitting(true);
      const res = await api.reviewRequest(req._id || req.id, {
        action: 'APPROVED',
        comments: 'Quick approved by senior lead.'
      });
      if (res.success) {
        await fetchQueue();
        onRefreshData();
      } else {
        alert(res.message || 'Approval failed');
      }
    } catch (err) {
      alert(err.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click quick issue / handover
  const handleQuickIssue = async (req) => {
    if (!window.confirm(`Confirm physical checkout of components for ${req.userName}?`)) return;
    try {
      setSubmitting(true);
      const res = await api.issueRequest(req._id || req.id);
      if (res.success) {
        await fetchQueue();
        onRefreshData();
      } else {
        alert(res.message || 'Issuance failed');
      }
    } catch (err) {
      alert(err.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click return processing
  const handleQuickReturn = async (req) => {
    if (!window.confirm(`Check in and return all components for ${req.userName} in good condition?`)) return;
    try {
      setSubmitting(true);
      const returnItems = req.items.map(it => ({
        componentId: it.component,
        returnedQuantity: it.issuedQuantity || it.approvedQuantity || it.requestedQuantity,
        condition: 'GOOD',
        notes: 'Returned in good condition via Senior Portal check-in.'
      }));
      const res = await api.processReturn(req._id || req.id, returnItems);
      if (res.success) {
        await fetchQueue();
        onRefreshData();
      } else {
        alert(res.message || 'Return check-in failed');
      }
    } catch (err) {
      alert(err.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setErrorMsg('');

    if (actionType === 'REJECTED' && !comments.trim()) {
      setErrorMsg('Please specify a rejection reason for the student.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.reviewRequest(selectedReq._id || selectedReq.id, {
        action: actionType,
        comments: comments.trim()
      });

      if (res.success) {
        setSelectedReq(null);
        await fetchQueue();
        onRefreshData();
      } else {
        setErrorMsg(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const seniorScopedRequests = selectedSeniorFilter === 'ALL'
    ? requests
    : requests.filter(r =>
        String(r.seniorApprover) === String(selectedSeniorFilter) ||
        (r.seniorApproverName && registeredSeniors.some(s => String(s._id || s.id) === String(selectedSeniorFilter) && s.fullName === r.seniorApproverName))
      );

  const pendingRequests = seniorScopedRequests.filter(r => ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status));
  const approvedRequests = seniorScopedRequests.filter(r => ['APPROVED', 'READY_FOR_PICKUP', 'ISSUED', 'RETURNED'].includes(r.status));
  const rejectedRequests = seniorScopedRequests.filter(r => ['REJECTED', 'CANCELLED'].includes(r.status));

  const displayList = 
    activeTab === 'PENDING' ? pendingRequests :
    activeTab === 'APPROVED' ? approvedRequests :
    activeTab === 'REJECTED' ? rejectedRequests : seniorScopedRequests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-[#0F172A] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Senior Authorization &amp; Sign-off Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Senior Approval Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Review incoming student requests routed to registered seniors, inspect requested component names, check request date &amp; time, and approve or reject sign-offs.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-black text-amber-400 font-mono">{pendingRequests.length}</p>
            <p className="text-[11px] text-slate-400 font-medium">Pending Review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Authorization Guard Banner when not logged in as Senior */}
      {!canReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">
                Senior Authorization Required to Approve / Reject
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Currently signed in as <span className="font-bold">{user?.fullName || 'Guest'}</span> ({normalizedRole}). Only registered <span className="font-bold">SENIORS</span> (added through Senior Management) have permission to approve or reject student component requests.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {seniorAccounts.slice(0, 3).map((acc) => (
              <button
                key={acc.id || acc.role}
                type="button"
                onClick={() => switchRole(acc.id || acc.role)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Switch to {acc.fullName} (Senior)
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In as Senior</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Senior Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {[
            { id: 'PENDING', label: 'Incoming Requests', count: pendingRequests.length },
            { id: 'APPROVED', label: 'Approved Requests', count: approvedRequests.length },
            { id: 'REJECTED', label: 'Rejected Requests', count: rejectedRequests.length },
            { id: 'ALL', label: 'All History', count: seniorScopedRequests.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {registeredSeniors.length > 0 && (
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Filter by Senior:</span>
            <select
              value={selectedSeniorFilter}
              onChange={(e) => setSelectedSeniorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Registered Seniors</option>
              {registeredSeniors.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.fullName} ({s.position})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Requests Stream */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading requests queue...</div>
      ) : displayList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No requests in this category</h3>
          <p className="text-xs text-slate-400">There are currently no requests matching the selected approval status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayList.map(req => {
            const isPending = ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(req.status);
            const isApproved = ['APPROVED', 'READY_FOR_PICKUP', 'ISSUED', 'RETURNED'].includes(req.status);

            return (
              <div 
                key={req._id || req.id || req.requestCode}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-sm p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Code, Date & Time */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {req.requestCode}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(req.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Student Name & Assigned Senior */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Student: <strong className="text-slate-900">{req.userName}</strong></span>
                      <span className="text-slate-400 font-normal">({req.userEmail})</span>
                    </div>
                    {req.seniorApproverName && (
                      <div className="flex items-center space-x-2 text-[11px] text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/70 w-fit">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Assigned Senior: <strong>{req.seniorApproverName}</strong></span>
                      </div>
                    )}
                    {req.seniorContact && (
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Senior Phone: <strong className="text-slate-700 font-mono">{req.seniorContact}</strong></span>
                      </div>
                    )}
                    <h3 className="text-sm font-extrabold text-slate-900 pt-1">
                      Project: {req.projectName}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{req.projectPurpose}"
                    </p>
                  </div>

                  {/* Requested Component Names (Requirement 6) */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Requested Component Names ({req.items?.length || 0})
                    </h4>
                    <div className="space-y-1.5">
                      {req.items?.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs"
                        >
                          <span className="font-bold text-slate-900">{item.componentName}</span>
                          <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                            Qty: {item.requestedQuantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Requested Pickup: <strong>{new Date(req.expectedPickupDate).toLocaleDateString()}</strong></span>
                    <span>Expected Return: <strong>{new Date(req.expectedReturnDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Senior Approval Actions (Requirement 6) */}
                <div className="pt-3 border-t border-slate-100">
                  {isPending ? (
                    canReview ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleQuickApprove(req)}
                          disabled={submitting}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>

                        <button
                          onClick={() => openReviewModal(req, 'REJECTED')}
                          disabled={submitting}
                          className="py-2.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Request</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-xs bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-amber-900 font-semibold flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Pending Senior/Admin sign-off</span>
                        </span>
                        <button
                          type="button"
                          onClick={onOpenLogin}
                          className="text-blue-700 hover:text-blue-800 font-bold underline shrink-0 cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-xs">
                      {req.status === 'READY_FOR_PICKUP' || req.status === 'APPROVED' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-500">Status:</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              Approved &bull; Ready for Pickup
                            </span>
                          </div>
                          {canOperateInventory && (
                            <button
                              onClick={() => handleQuickIssue(req)}
                              disabled={submitting}
                              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs transition-all cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Issue Components</span>
                            </button>
                          )}
                        </div>
                      ) : req.status === 'ISSUED' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-500">Status:</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              Component Assigned
                            </span>
                          </div>
                          {canOperateInventory && (
                            <button
                              onClick={() => handleQuickReturn(req)}
                              disabled={submitting}
                              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Process Return</span>
                            </button>
                          )}
                        </div>
                      ) : req.status === 'RETURNED' ? (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500">Status:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            Returned &amp; Restocked
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500">Status:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            Request Rejected
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">{selectedReq.requestCode}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {actionType === 'APPROVED' ? 'Confirm Request Approval' : 'Reject Permission Request'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReq(null)}
                className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  {errorMsg}
                </div>
              )}

              {/* Review Comments / Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Senior Remarks &amp; Feedback {actionType === 'REJECTED' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  required={actionType === 'REJECTED'}
                  placeholder={
                    actionType === 'APPROVED' 
                      ? 'e.g. Approved. Please pick up from Lab 304.' 
                      : 'Please specify reason for rejection...'
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-xl font-bold ${
                    actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {submitting ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeniorApprovalView;
