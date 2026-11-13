import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { DollarSign, Layers, PackageCheck, AlertTriangle, TrendingUp, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

export const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading lab analytics...</div>;
  }

  const { summary, requestsSummary, stockDistribution, categoryDistribution, topComponents, lowStockAlerts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#0B132B] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
          <TrendingUp className="w-4 h-4" />
          <span>Real-time Laboratory Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Robotics Lab Analytics & Inventory Reports
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          Database calculations for stock levels, component utilization, borrowing patterns, and reorder alerts.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Component Types */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Items</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {summary.totalComponentTypes}
          </p>
          <p className="text-xs text-slate-400 mt-1">{summary.totalStockUnits} physical units total</p>
        </div>

        {/* Available for Borrowing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Stock</span>
            <PackageCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {summary.availableUnits}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready for student requests</p>
        </div>

        {/* Active Issued Checkouts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently Borrowed</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-2">
            {summary.issuedUnits}
          </p>
          <p className="text-xs text-slate-400 mt-1">{requestsSummary.overdue || 0} overdue returns</p>
        </div>

        {/* Total Lab Valuation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Valuation</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            ${summary.totalValuation.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{summary.totalProjects} active club projects</p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Stock Status Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Physical Stock Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Requested Components */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Most Frequently Requested Components</h3>
          <div className="h-64">
            {topComponents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No request volume data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topComponents} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Category Distribution */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Components Inventory by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Low Stock Alerts Table */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Reorder Alerts ({lowStockAlerts.length})</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {lowStockAlerts.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-500 font-bold mr-2">{item.code}</span>
                  <span className="font-bold text-slate-900">{item.name}</span>
                  <span className="text-slate-400 ml-2">Lab 304 Storage Hub</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-amber-700 bg-amber-50 font-bold">
                    Available: {item.available} (Min Threshold: {item.threshold})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
export default AnalyticsView;
