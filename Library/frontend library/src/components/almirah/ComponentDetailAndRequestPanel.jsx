import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Plus, 
  Minus, 
  ArrowRight,
  X,
  Lock,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DEMO_PROJECTS } from '../../data/componentAssets';

export const ComponentDetailAndRequestPanel = ({ 
  selectedComponent,
  selectedComponents = [],
  seniorsRefreshKey = 0,
  onRemoveComponent = () => {},
  onQuantityChange = () => {},
  onRequestSuccess = () => {},
  onNavigateToRequests = () => {},
  onNavigateToSeniorManagement = () => {}
}) => {
  const { user } = useAuth();

  // Active component for the Component Work Feature
  const displayComp = selectedComponent || (selectedComponents.length > 0 ? selectedComponents[0] : null);

  // Live Registered Seniors from Backend DB
  const [seniors, setSeniors] = useState([]);
  const [loadingSeniors, setLoadingSeniors] = useState(true);

  // Form State
  const [studentName, setStudentName] = useState(user?.fullName || 'Mittal');
  const [selectedProject, setSelectedProject] = useState(DEMO_PROJECTS[0] || 'Autonomous Maze Solving Robot');
  const [projectPurpose, setProjectPurpose] = useState('');
  const [selectedSeniorId, setSelectedSeniorId] = useState('');
  const [seniorPhone, setSeniorPhone] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // Per-component quantities for multi-item selection
  const [itemQuantities, setItemQuantities] = useState({});

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentRequests, setRecentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch registered seniors from backend API
  const fetchSeniorsList = async () => {
    try {
      setLoadingSeniors(true);
      const res = await api.getSeniors();
      if (res.success) {
        const list = res.seniors || [];
        setSeniors(list);
        if (list.length > 0) {
          setSelectedSeniorId((prevId) => {
            const match = list.find((s) => (s._id || s.id) === prevId);
            const target = match || list[0];
            setSeniorPhone(target.phoneNumber || '');
            return target._id || target.id;
          });
        } else {
          setSelectedSeniorId('');
          setSeniorPhone('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch registered seniors:', err);
    } finally {
      setLoadingSeniors(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSeniorsList();
    }
  }, [user, seniorsRefreshKey]);

  // Sync student name when user changes
  useEffect(() => {
    if (user?.fullName) {
      setStudentName(user.fullName);
    }
  }, [user]);

  // Sync item quantities when selectedComponents or displayComp changes
  useEffect(() => {
    setItemQuantities(prev => {
      const updated = { ...prev };
      const items = selectedComponents.length > 0 ? selectedComponents : (displayComp ? [displayComp] : []);
      items.forEach(comp => {
        const id = comp._id || comp.id || comp.key;
        if (!updated[id]) {
          updated[id] = (comp.key && prev[comp.key]) ? prev[comp.key] : 1;
        }
      });
      return updated;
    });

    if (displayComp && !projectPurpose) {
      setProjectPurpose(`Testing and integration for ${displayComp.name} in club prototype.`);
    }
  }, [selectedComponents, displayComp]);

  // Handle Senior selection change
  const handleSeniorChange = (seniorId) => {
    setSelectedSeniorId(seniorId);
    const senior = seniors.find(s => (s._id || s.id) === seniorId);
    if (senior) {
      setSeniorPhone(senior.phoneNumber || '');
    }
  };

  // Fetch recent student requests
  const fetchStudentRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await api.getRequests();
      if (res.success && res.requests) {
        setRecentRequests(res.requests.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch recent requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user) fetchStudentRequests();
  }, [user]);

  // Get active items to submit
  const activeItems = selectedComponents.length > 0 ? selectedComponents : (displayComp ? [displayComp] : []);

  // Update quantity for a specific component
  const updateQty = (comp, delta) => {
    const id = comp._id || comp.id || comp.key;
    const current = itemQuantities[id] || 1;
    const max = comp.availableStock || 99;
    const nextVal = Math.min(max, Math.max(1, current + delta));
    setItemQuantities(prev => ({ ...prev, [id]: nextVal }));
    if (onQuantityChange) onQuantityChange(comp, nextVal);
  };

  // Form Submission with Duplicate Prevention
  const handleSendRequest = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitSuccess(false);

    if (activeItems.length === 0) {
      setErrorMessage('Please select at least one component from the storage almirah.');
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('Please enter student name.');
      return;
    }

    if (!seniorPhone.trim()) {
      setErrorMessage('Please enter senior phone number.');
      return;
    }

    // Check for stock availability
    for (const item of activeItems) {
      const id = item._id || item.id || item.key;
      const qty = itemQuantities[id] || 1;
      if (qty > (item.availableStock || 999)) {
        setErrorMessage(`Cannot request ${qty} of ${item.name}. Available stock: ${item.availableStock}`);
        return;
      }
    }

    // Duplicate Request Prevention: Check if recent pending request has identical components
    const isDuplicate = recentRequests.some(r => {
      if (r.status !== 'SUBMITTED' && r.status !== 'UNDER_REVIEW') return false;
      const reqCompNames = r.items?.map(it => it.componentName?.toLowerCase()) || [];
      const currentNames = activeItems.map(it => it.name.toLowerCase());
      return currentNames.some(name => reqCompNames.includes(name));
    });

    if (isDuplicate) {
      const proceed = window.confirm(
        'Notice: You already have a pending permission request for one or more of these components. Do you wish to submit an additional request?'
      );
      if (!proceed) return;
    }

    if (seniors.length === 0) {
      setErrorMessage('No seniors are registered yet. Please register a senior in Senior Management first.');
      return;
    }

    const assignedSenior = seniors.find(s => (s._id || s.id) === selectedSeniorId) || seniors[0];

    try {
      setSubmitting(true);

      const itemsPayload = activeItems.map(item => {
        const dbId = item._id || item.id || '';
        const qtyKey = dbId || item.key;
        const qty = itemQuantities[qtyKey] || 1;
        return {
          componentId: dbId,
          componentName: item.name,
          matchedDbName: item.matchedDbName || '',
          quantity: qty
        };
      });

      const payload = {
        items: itemsPayload,
        studentName: studentName.trim(),
        projectName: selectedProject,
        projectPurpose: projectPurpose.trim() || `Permission request by ${studentName}`,
        seniorApproverId: assignedSenior?._id || assignedSenior?.id || '',
        seniorApproverName: assignedSenior?.fullName || '',
        seniorContact: seniorPhone.trim(),
        expectedPickupDate: new Date().toISOString(),
        expectedReturnDate: new Date(expectedReturnDate).toISOString(),
        notes: `Requested by ${studentName} (${seniorPhone}) via Storage Almirah Hub.`
      };

      const res = await api.createRequest(payload);

      if (res.success) {
        try {
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (err) {}

        setSubmitSuccess(true);
        fetchStudentRequests();
        if (onRequestSuccess) onRequestSuccess(res.request);
      } else {
        setErrorMessage(res.message || 'Failed to submit permission request.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeSenior = seniors.find(s => (s._id || s.id) === selectedSeniorId) || seniors[0] || null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { label: 'Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
      case 'APPROVED':
      case 'READY_FOR_PICKUP':
        return { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle };
      case 'ISSUED':
        return { label: 'Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ShieldCheck };
      case 'RETURNED':
        return { label: 'Returned', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: CheckCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          1. COMPONENT WORK FEATURE (STRICT REQUIREMENTS 3 & 4)
          Shows ONLY:
          1. Component Name
          2. Component Image
          3. What the component does (its main function)
          + Availability & quantity as per Requirement 3.
          Strictly NO pinouts, circuit diagrams, or working principles!
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Component Function &amp; Details
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {displayComp?.category || 'Electronic Component'}
          </span>
        </div>

        {displayComp ? (
          <div className="space-y-4">
            {/* Component Image */}
            <div className="relative aspect-[16/10] rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden group">
              <img
                src={displayComp.photoUrl}
                onError={(e) => {
                  if (displayComp.fallbackSvg && e.currentTarget.src !== displayComp.fallbackSvg) {
                    e.currentTarget.src = displayComp.fallbackSvg;
                  }
                }}
                alt={displayComp.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-mono font-bold text-slate-800 border border-slate-200 shadow-xs">
                {displayComp.label}
              </div>
            </div>

            {/* Component Name */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {displayComp.name}
              </h2>
            </div>

            {/* What the component does (Main Function ONLY - Requirement 4) */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/90 shadow-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1">
                What the component does:
              </div>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {displayComp.whatItDoes || `${displayComp.name}: Controls electronic components according to programmed instructions.`}
              </p>
            </div>

            {/* Availability Status & Quantity (Requirement 3) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Availability Status
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${displayComp.availableStock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-bold text-emerald-950">
                    {displayComp.availableStock > 0 ? 'In Stock (Available)' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Available Quantity
                </span>
                <span className="text-sm font-extrabold text-emerald-950 font-mono">
                  {displayComp.availableStock} {displayComp.unit || 'pcs'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs">Click any component box in the almirah to view what it does.</p>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. STUDENT PERMISSION REQUEST SYSTEM (REQUIREMENT 5)
          Form includes:
          - Student Name
          - Automatically displayed selected component names (supports multi-selection)
          - Senior's Phone Number
          - Send Request button
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Student Permission Request
            </h3>
          </div>
          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {activeItems.length} {activeItems.length === 1 ? 'Component' : 'Components'} Selected
          </span>
        </div>

        {submitSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Permission Request Sent to Senior!</p>
              <p className="text-emerald-700 mt-0.5">
                Sent to <strong className="text-emerald-900">{activeSenior?.fullName || 'Senior'}</strong> ({seniorPhone}). Your component request is registered.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
          
          {/* Field: Student Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Student Name
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              placeholder="Enter your student name"
            />
          </div>

          {/* Field: Automatically Displayed Selected Component Names (Requirement 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">
                Selected Component Names
              </label>
              <span className="text-[10px] text-blue-600 font-semibold flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Auto-selected from Almirah</span>
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-400">
                No components selected. Click any box in the Almirah to add it.
              </div>
            ) : (
              <div className="space-y-2">
                {activeItems.map((comp) => {
                  const id = comp._id || comp.id || comp.key;
                  const qty = itemQuantities[id] || 1;

                  return (
                    <div 
                      key={id}
                      className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {comp.name}
                        </span>
                      </div>

                      {/* Quantity Selector + Remove Pill */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQty(comp, -1)}
                            disabled={qty <= 1}
                            className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-bold text-xs text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(comp, 1)}
                            disabled={qty >= (comp.availableStock || 99)}
                            className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {activeItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveComponent(comp)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field: Senior Approver Selection & Senior Phone Number */}
          {loadingSeniors ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400">
              Loading registered seniors...
            </div>
          ) : seniors.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <p className="font-bold">No Registered Seniors Found</p>
              <p className="text-[11px] text-amber-800">
                Add at least one senior in Senior Management so students can route permission requests.
              </p>
              <button
                type="button"
                onClick={onNavigateToSeniorManagement}
                className="px-3 py-1.5 rounded-lg bg-[#0B132B] hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
              >
                Open Senior Management
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Senior Approver
                </label>
                <select
                  value={selectedSeniorId}
                  onChange={(e) => handleSeniorChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs text-xs"
                >
                  {seniors.map((s) => {
                    const sid = s._id || s.id;
                    return (
                      <option key={sid} value={sid}>
                        {s.fullName} ({s.position})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Senior's Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={seniorPhone}
                    onChange={(e) => setSeniorPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs text-xs"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Send Request Action Button */}
          <button
            type="submit"
            disabled={submitting || activeItems.length === 0 || seniors.length === 0}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>Sending Permission Request...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* =========================================================================
          3. SENIOR DETAILS SECTION
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Senior Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToSeniorManagement}
            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Manage Seniors
          </button>
        </div>

        {activeSenior ? (
          <>
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0B132B] text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                {activeSenior.fullName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {activeSenior.fullName}
                </h4>
                <p className="text-xs font-semibold text-amber-600 mt-0.5">
                  {activeSenior.position}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeSenior.department}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800 font-semibold">{activeSenior.phoneNumber}</span>
              </div>
              {activeSenior.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{activeSenior.email}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400">
            No senior selected. Register a senior in Senior Management to display contact details here.
          </div>
        )}
      </div>

      {/* =========================================================================
          4. REQUEST STATUS SECTION
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Request Status
            </h3>
          </div>
          <button
            onClick={onNavigateToRequests}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loadingRequests ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Updating request statuses...
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No active requests. Select components and send a request to track it here.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              const BadgeIcon = badge.icon;
              const itemCount = req.items?.reduce((acc, item) => acc + (item.requestedQuantity || 1), 0) || 1;
              const mainCompName = req.items?.[0]?.componentName || 'Robotics Component';

              return (
                <div 
                  key={req._id || req.id || req.requestCode}
                  onClick={onNavigateToRequests}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {req.requestCode}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 truncate">
                    {mainCompName} {req.items?.length > 1 && `+${req.items.length - 1} more`}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                    <span className="truncate pr-2">Project: {req.projectName}</span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span>Qty: {itemCount}</span>
                      {['ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE'].includes(req.status) && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(`Return components for ${req.requestCode} and restock Almirah?`)) return;
                            try {
                              const returnItems = (req.items || []).map((it) => ({
                                componentId: it.component,
                                returnedQuantity: Math.max(0, (it.issuedQuantity || it.approvedQuantity || it.requestedQuantity) - (it.returnedQuantity || 0)),
                                condition: 'GOOD',
                                notes: 'Quick return from Almirah dashboard'
                              }));
                              const res = await api.processReturn(req._id || req.id, returnItems);
                              if (res.success) {
                                await fetchStudentRequests();
                                if (onRequestSuccess) onRequestSuccess();
                              } else {
                                alert(res.message || 'Return failed');
                              }
                            } catch (err) {
                              alert(err.message || 'Failed to process return');
                            }
                          }}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-2xs cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ComponentDetailAndRequestPanel;
