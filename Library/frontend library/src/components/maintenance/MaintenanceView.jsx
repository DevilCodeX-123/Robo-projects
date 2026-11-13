import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export const MaintenanceView = () => {
  const [tickets, setTickets] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newTicket, setNewTicket] = useState({
    componentId: '',
    faultDescription: '',
    severity: 'MEDIUM'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        api.getMaintenanceTickets(),
        api.getComponents()
      ]);
      if (tRes.success) setTickets(tRes.tickets);
      if (cRes.success) {
        setComponents(cRes.components);
        if (cRes.components.length > 0) {
          setNewTicket(prev => ({ ...prev, componentId: cRes.components[0]._id || cRes.components[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMaintenanceTicket(newTicket);
      if (res.success) {
        setShowModal(false);
        setNewTicket({ componentId: components[0]?._id || '', faultDescription: '', severity: 'MEDIUM' });
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      const res = await api.updateMaintenanceTicket(ticketId, {
        status: 'RESOLVED',
        repairNotes: 'Inspected, repaired, and recalibrated by laboratory technician.'
      });
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDIUM':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#0B132B] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Wrench className="w-4 h-4" />
            <span>Equipment Maintenance & Health Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Repairs, Fault Triage & Lab Safety
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Report faulty sensors, motor driver burnouts, or broken chassis. Track service records and technician assignments.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Faulty Component</span>
        </button>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No maintenance tickets reported. All equipment is healthy!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map(t => (
            <div key={t._id || t.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-slate-700">{t.ticketCode}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(t.severity)}`}>
                  {t.severity}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.componentName}</h3>
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl">
                  {t.faultDescription}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <p>Reported By: <strong>{t.reportedByName}</strong></p>
                <p>Status: <strong className={t.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}>{t.status}</strong></p>
                {t.repairNotes && <p className="italic text-slate-600">Note: {t.repairNotes}</p>}
              </div>

              {t.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleResolve(t._id || t.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Mark as Repaired & Tested OK
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Report Equipment Fault / Damage</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Component</label>
                <select
                  value={newTicket.componentId}
                  onChange={(e) => setNewTicket({ ...newTicket, componentId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  {components.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.componentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Severity</label>
                <select
                  value={newTicket.severity}
                  onChange={(e) => setNewTicket({ ...newTicket, severity: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="LOW">Low (Cosmetic / minor issue)</option>
                  <option value="MEDIUM">Medium (Intermittent failure)</option>
                  <option value="HIGH">High (Non-functional)</option>
                  <option value="CRITICAL">Critical (Safety hazard / burnt)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fault Description *</label>
                <textarea
                  value={newTicket.faultDescription}
                  onChange={(e) => setNewTicket({ ...newTicket, faultDescription: e.target.value })}
                  rows={3}
                  placeholder="Describe the failure, burnt pins, overheating, or error code..."
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl"
                >
                  Submit Fault Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default MaintenanceView;
