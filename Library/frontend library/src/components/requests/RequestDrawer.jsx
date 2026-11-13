import React, { useState, useEffect } from 'react';
import { X, Trash2, Send, Calendar, User, FileText, CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const RequestDrawer = ({ isOpen, onClose, onSuccess }) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const [projectName, setProjectName] = useState('Combat Robowar Titan');
  const [projectPurpose, setProjectPurpose] = useState('');
  const [seniorApproverId, setSeniorApproverId] = useState('');
  const [seniorContact, setSeniorContact] = useState('');
  const [expectedPickupDate, setExpectedPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const [seniorsList, setSeniorsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch available registered seniors and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const seniorRes = await api.getSeniors();
        if (seniorRes.success) {
          const seniors = seniorRes.seniors || [];
          setSeniorsList(seniors);
          if (seniors.length > 0) {
            const firstId = seniors[0]._id || seniors[0].id;
            setSeniorApproverId(firstId);
            setSeniorContact(seniors[0].phoneNumber || '');
          } else {
            setSeniorApproverId('');
            setSeniorContact('');
          }
        }

        const projRes = await api.getProjects();
        if (projRes.success) {
          setProjectsList(projRes.projects);
        }
      } catch (err) {
        console.error('Error fetching seniors/projects:', err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSeniorChange = (e) => {
    const sId = e.target.value;
    setSeniorApproverId(sId);
    const s = seniorsList.find(item => (item._id || item.id) === sId);
    if (s) {
      setSeniorContact(s.phoneNumber || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('Please select at least one component to request.');
      return;
    }

    if (!projectName.trim() || !projectPurpose.trim()) {
      setErrorMsg('Project name and project purpose are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          componentId: item.component._id || item.component.id,
          quantity: item.quantity
        })),
        projectName,
        projectPurpose,
        seniorApproverId,
        seniorContact,
        expectedPickupDate,
        expectedReturnDate,
        notes
      };

      const res = await api.createRequest(payload);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        clearCart();
        onClose();
        if (onSuccess) onSuccess(res.request);
      } else {
        setErrorMsg(res.message || 'Failed to submit request');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">New Component Request</h2>
              <p className="text-xs text-slate-400">Request permission from seniors & reserve equipment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected Components List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selected Components ({cartItems.length})
              </span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                No components added yet. Browse the catalog and click "+ Request".
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map(item => {
                  const compId = item.component._id || item.component.id;
                  return (
                    <div 
                      key={compId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={item.component.imageUrl} 
                          alt={item.component.name} 
                          className="w-10 h-10 object-contain bg-white rounded-lg border border-slate-200 p-1"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.component.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Available: {item.component.availableStock} {item.component.unit || 'pcs'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white px-2 py-0.5 space-x-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(compId, item.quantity - 1)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(compId, item.quantity + 1)}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            disabled={item.quantity >= item.component.availableStock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(compId)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Combat Robowar Titan, Maze Solver, Autonomous Drone"
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Purpose & Justification *
              </label>
              <textarea
                value={projectPurpose}
                onChange={(e) => setProjectPurpose(e.target.value)}
                rows={2}
                placeholder="Explain what circuit or mechanism you are testing with these components..."
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Senior Approver Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Senior / Approver *</span>
              </label>
              <select
                value={seniorApproverId}
                onChange={handleSeniorChange}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {seniorsList.length === 0 ? (
                  <option value="">No registered seniors yet</option>
                ) : (
                  seniorsList.map(s => {
                    const sid = s._id || s.id;
                    return (
                      <option key={sid} value={sid}>
                        {s.fullName} ({s.position || s.department})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senior's Contact / Phone Number
              </label>
              <input
                type="text"
                value={seniorContact}
                onChange={(e) => setSeniorContact(e.target.value)}
                placeholder="+91 98765 XXXXX"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pickup and Return Dates */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Expected Pickup Date *</span>
              </label>
              <input
                type="date"
                value={expectedPickupDate}
                onChange={(e) => setExpectedPickupDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Expected Return Date</span>
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need breadboard with adhesive backing"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

        </form>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || cartItems.length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting Request...' : 'Send Permission Request'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default RequestDrawer;
