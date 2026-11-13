import React, { useState, useEffect } from 'react';
import { Bot, Package, Clock, CheckCircle, ShieldAlert, ArrowRight, Compass, Plus, FileText, Archive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const MemberDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableCount: 0,
    pendingCount: 0,
    pickupCount: 0,
    borrowedCount: 0,
    overdueCount: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        const [compRes, reqRes] = await Promise.all([
          api.getComponents(),
          api.getRequests()
        ]);

        if (compRes.success && reqRes.success) {
          const comps = compRes.components;
          const reqs = reqRes.requests;

          const now = new Date();
          let pending = 0;
          let pickup = 0;
          let borrowed = 0;
          let overdue = 0;

          reqs.forEach(r => {
            if (['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status)) pending++;
            else if (r.status === 'READY_FOR_PICKUP' || r.status === 'APPROVED') pickup++;
            else if (r.status === 'ISSUED') {
              borrowed++;
              if (r.expectedReturnDate && new Date(r.expectedReturnDate) < now) {
                overdue++;
              }
            }
          });

          setStats({
            availableCount: comps.filter(c => c.availableStock > 0).length,
            pendingCount: pending,
            pickupCount: pickup,
            borrowedCount: borrowed,
            overdueCount: overdue
          });

          setRecentRequests(reqs.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching member dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            <Bot className="w-4 h-4" />
            <span>Member Workspace & Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Robotics Club Member'}!
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            {user?.department} &bull; {user?.academicYear} &bull; Team: <strong className="text-cyan-300">{user?.teamName}</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Browse & Request</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center space-x-1.5"
          >
            <Archive className="w-4 h-4 text-cyan-400" />
            <span>Storage Almirah</span>
          </button>
        </div>
      </div>

      {/* Real-time Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Available Component Types */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Types</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.availableCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Ready for checkout</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pendingCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting senior check</p>
        </div>

        {/* Ready for Pickup */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Ready for Pickup</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.pickupCount}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Approved &bull; Collect in lab</p>
        </div>

        {/* Currently Borrowed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Currently Borrowed</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.borrowedCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Active equipment in use</p>
        </div>

        {/* Overdue Returns */}
        <div className="bg-white rounded-2xl border border-red-200 bg-red-50/20 p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Overdue Returns</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{stats.overdueCount}</p>
          <p className="text-[10px] text-red-500 mt-0.5">Action required</p>
        </div>

      </div>

      {/* Recent Request Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Component Request Activity</h3>
            <p className="text-xs text-slate-400">Live progression tracking for your recent submissions</p>
          </div>
          <button
            onClick={() => onNavigate('my-requests')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
        ) : recentRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No request activity yet. Head over to the home catalog to request components!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentRequests.map(r => (
              <div key={r._id || r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {r.requestCode}
                    </span>
                    <strong className="text-slate-900">{r.projectName}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {r.items?.length || 0} component(s) &bull; Submitted on {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    r.status === 'READY_FOR_PICKUP' || r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    r.status === 'ISSUED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    r.status === 'RETURNED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default MemberDashboard;
