import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Package, 
  ArrowRight, 
  Calendar, 
  UserCheck, 
  ShieldAlert,
  ArrowLeft,
  Check,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const MyRequestsView = ({ onBackHome = () => {}, onRefreshData = () => {} }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // Component Return Modal State
  const [returningReq, setReturningReq] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnConditions, setReturnConditions] = useState({});
  const [returnNotes, setReturnNotes] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnBanner, setReturnBanner] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getRequests();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this permission request?')) return;
    try {
      const res = await api.cancelRequest(id);
      if (res.success) {
        fetchRequests();
        onRefreshData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openReturnModal = (req) => {
    setReturningReq(req);
    const qtys = {};
    const conds = {};
    (req.items || []).forEach((it) => {
      const remaining = Math.max(
        0,
        (it.issuedQuantity || it.approvedQuantity || it.requestedQuantity || 0) - (it.returnedQuantity || 0)
      );
      qtys[it.component] = remaining;
      conds[it.component] = 'GOOD';
    });
    setReturnQuantities(qtys);
    setReturnConditions(conds);
    setReturnNotes('');
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returningReq) return;
    setProcessingReturn(true);
    try {
      const returnItems = (returningReq.items || [])
        .map((it) => ({
          componentId: it.component,
          returnedQuantity: Number(returnQuantities[it.component] || 0),
          condition: returnConditions[it.component] || 'GOOD',
          notes: returnNotes.trim() || `Returned by ${user?.fullName || 'Student'}`
        }))
        .filter((it) => it.returnedQuantity > 0);

      if (returnItems.length === 0) {
        alert('Please enter at least 1 component quantity to return.');
        setProcessingReturn(false);
        return;
      }

      const res = await api.processReturn(returningReq._id || returningReq.id, returnItems);
      if (res.success) {
        const stockSummary = (res.updatedComponents || [])
          .map((c) => `${c.name}: ${c.availableStock} available`)
          .join(' • ');
        setReturnBanner(
          stockSummary
            ? `Components returned! Inventory stock automatically updated (${stockSummary}).`
            : 'Components returned and inventory stock updated automatically!'
        );
        setReturningReq(null);
        await fetchRequests();
        onRefreshData();
      } else {
        alert(res.message || 'Return failed');
      }
    } catch (err) {
      alert(err.message || 'Error returning components');
    } finally {
      setProcessingReturn(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { label: 'Pending Review', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock };
      case 'AWAITING_INFO':
        return { label: 'Awaiting Info', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: AlertCircle };
      case 'APPROVED':
      case 'READY_FOR_PICKUP':
        return { label: 'Approved by Senior', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle };
      case 'ISSUED':
        return { label: 'Component Assigned', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Package };
      case 'PARTIALLY_RETURNED':
        return { label: 'Partially Returned', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: RotateCcw };
      case 'OVERDUE':
        return { label: 'Return Overdue', color: 'bg-red-50 text-red-800 border-red-200', icon: ShieldAlert };
      case 'RETURNED':
        return { label: 'Component Returned', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CheckCircle };
      case 'REJECTED':
        return { label: 'Request Rejected', color: 'bg-red-50 text-red-800 border-red-200', icon: XCircle };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    }
  };

  // Requirement 7 Filter Logic:
  // All submitted requests | Pending requests | Approved requests | Rejected requests
  const filtered = requests.filter(r => {
    if (activeFilter === 'PENDING') return ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status);
    if (activeFilter === 'APPROVED') return ['APPROVED', 'READY_FOR_PICKUP', 'ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE', 'RETURNED'].includes(r.status);
    if (activeFilter === 'REJECTED') return ['REJECTED', 'CANCELLED'].includes(r.status);
    return true;
  });

  // Requirement 8: Simple 4-step progress timeline
  // 1. Request Sent -> 2. Approved by Senior -> 3. Component Assigned -> 4. Component Returned
  const getTimelineStep = (status) => {
    if (status === 'REJECTED' || status === 'CANCELLED') return 0;
    if (status === 'RETURNED') return 4;
    if (status === 'ISSUED' || status === 'PARTIALLY_RETURNED' || status === 'OVERDUE') return 3;
    if (status === 'APPROVED' || status === 'READY_FOR_PICKUP') return 2;
    return 1; // SUBMITTED or UNDER_REVIEW
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackHome}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Storage Almirah</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Component Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track real-time request progress, senior sign-offs, component assignment, and return components to automatically restock inventory.
          </p>
        </div>

        {/* Filter Pills (Requirement 7: All, Pending, Approved, Rejected) */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: 'Pending Requests' },
            { id: 'APPROVED', label: 'Approved Requests' },
            { id: 'REJECTED', label: 'Rejected Requests' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Automatic Stock Update Confirmation Banner */}
      {returnBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{returnBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setReturnBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Requests Timeline Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading your component requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No requests found in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any requests under the selected filter. Browse the storage almirah to request components!
          </p>
          <button
            onClick={onBackHome}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Open Storage Almirah
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map(req => {
            const badge = getStatusBadge(req.status);
            const StatusIcon = badge.icon;
            const currentStep = getTimelineStep(req.status);
            const isRejected = req.status === 'REJECTED' || req.status === 'CANCELLED';
            const canReturn = ['ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE'].includes(req.status);

            return (
              <div 
                key={req._id || req.id || req.requestCode}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 p-6 shadow-sm space-y-5"
              >
                {/* Top Row: Code, Date, Project, Status */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                        {req.requestCode}
                      </span>
                      <span className="text-xs text-slate-400">
                        Requested on {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{req.projectName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{req.projectPurpose}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    {canReturn && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(req)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return Components</span>
                      </button>
                    )}

                    {['SUBMITTED', 'UNDER_REVIEW'].includes(req.status) && (
                      <button
                        onClick={() => handleCancel(req._id || req.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* =========================================================================
                    REQUIREMENT 8: SIMPLE PROGRESS TIMELINE
                    1. Request Sent
                    2. Approved by Senior
                    3. Component Assigned
                    4. Component Returned
                   ========================================================================= */}
                <div className="py-2 px-2 sm:px-4">
                  {isRejected ? (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="font-bold">This permission request was not approved.</span>
                      </div>
                      <span className="text-[11px] text-red-600">Review senior remarks below</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 4 Step Labels */}
                      <div className="grid grid-cols-4 text-center text-xs">
                        {[
                          { step: 1, label: '1. Request Sent' },
                          { step: 2, label: '2. Approved by Senior' },
                          { step: 3, label: '3. Component Assigned' },
                          { step: 4, label: '4. Component Returned' }
                        ].map(s => {
                          const isDone = currentStep >= s.step;
                          const isCurrent = currentStep === s.step;
                          return (
                            <div key={s.step} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isDone 
                                  ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isDone ? <Check className="w-4 h-4" /> : s.step}
                              </div>
                              <span className={`text-[11px] font-bold mt-1.5 ${
                                isDone ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Timeline Bar connecting the steps */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                          style={{
                            width: currentStep === 1 ? '12%' :
                                   currentStep === 2 ? '42%' :
                                   currentStep === 3 ? '72%' :
                                   currentStep === 4 ? '100%' : '0%'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Requested Components Breakdown (Requirement 7: Assignment & Return Status) */}
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Requested Components &amp; Assignment Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {req.items?.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.componentName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Requested: <strong className="text-slate-700 font-mono">{item.requestedQuantity}</strong>
                            {item.approvedQuantity > 0 && (
                              <span className="text-emerald-700 font-bold ml-1 font-mono">
                                &bull; Approved: {item.approvedQuantity}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Component Assignment Status Badge */}
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                            req.status === 'RETURNED' ? 'bg-slate-200 text-slate-700' :
                            req.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                            req.status === 'APPROVED' || req.status === 'READY_FOR_PICKUP' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'RETURNED' ? 'Returned' :
                             req.status === 'ISSUED' ? 'Assigned & In Use' :
                             req.status === 'APPROVED' || req.status === 'READY_FOR_PICKUP' ? 'Reserved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Footer: Senior Details, Pickup Date & Return Status */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.status === 'REJECTED' ? 'Reviewed by: ' : 'Approved by: '} <strong className="text-slate-800">{
                        (req.approvalHistory && req.approvalHistory.length > 0 && req.approvalHistory[req.approvalHistory.length - 1].approverName)
                        || req.seniorApproverName
                        || 'Senior Lead'
                      }</strong></span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Return Status: <strong className="text-slate-800">{req.status === 'RETURNED' ? 'Returned to Lab' : `Expected by ${new Date(req.expectedReturnDate).toLocaleDateString()}`}</strong></span>
                    </span>
                  </div>

                  {req.approvalHistory && req.approvalHistory.length > 0 && (
                    <div className="text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
                      <span className="font-bold">Senior Remark: </span>
                      <span className="italic">{req.approvalHistory[req.approvalHistory.length - 1].comments}</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RETURN COMPONENTS MODAL (Automatic Stock Restock) */}
      {returningReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0B132B] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Return Components to Smart Almirah</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Request {returningReq.requestCode} &bull; Stock will update automatically upon return
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturningReq(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4 text-xs">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {(returningReq.items || []).map((item) => {
                  const issuedTotal = item.issuedQuantity || item.approvedQuantity || item.requestedQuantity || 0;
                  const alreadyRet = item.returnedQuantity || 0;
                  const remaining = Math.max(0, issuedTotal - alreadyRet);
                  if (remaining <= 0) return null;

                  return (
                    <div
                      key={item.component}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">{item.componentName}</span>
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          Remaining: {remaining}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Return Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={returnQuantities[item.component] ?? remaining}
                            onChange={(e) =>
                              setReturnQuantities({
                                ...returnQuantities,
                                [item.component]: Math.min(remaining, Math.max(0, Number(e.target.value)))
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-center"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Condition</label>
                          <select
                            value={returnConditions[item.component] || 'GOOD'}
                            onChange={(e) =>
                              setReturnConditions({
                                ...returnConditions,
                                [item.component]: e.target.value
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                          >
                            <option value="GOOD">Good (Restock)</option>
                            <option value="DAMAGED">Damaged (Report)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Remarks (Optional)</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Placed back in Smart Almirah in working condition"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturningReq(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReturn}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{processingReturn ? 'Updating Stock...' : 'Confirm Return & Update Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRequestsView;
