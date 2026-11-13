import React, { useState, useEffect } from 'react';
import { PackageCheck, RotateCcw, SlidersHorizontal, PlusCircle, Download, Check, AlertTriangle, ShieldCheck, MapPin, Search } from 'lucide-react';
import { api } from '../../services/api';

export const InventoryManagerView = ({ onRefreshData = () => {} }) => {
  const [activeTab, setActiveTab] = useState('issuance'); // 'issuance' | 'returns' | 'ledger' | 'add'
  const [requests, setRequests] = useState([]);
  const [components, setComponents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Dialog state
  const [returnReq, setReturnReq] = useState(null);
  const [returnConditions, setReturnConditions] = useState({}); // { compId: 'GOOD'|'DAMAGED' }
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnNotes, setReturnNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Manual Adjustment state
  const [adjustCompId, setAdjustCompId] = useState('');
  const [deltaAvailable, setDeltaAvailable] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Add Component state
  const [newComp, setNewComp] = useState({
    name: '',
    category: 'Sensors',
    description: '',
    rack: 'A',
    shelf: 1,
    box: '01',
    totalStock: 10,
    unit: 'pcs',
    purchasePrice: 5.0,
    supplier: 'RoboStock Lab'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, compRes, txRes] = await Promise.all([
        api.getRequests(),
        api.getComponents(),
        api.getTransactions()
      ]);
      if (reqRes.success) setRequests(reqRes.requests);
      if (compRes.success) {
        setComponents(compRes.components);
        if (compRes.components.length > 0) {
          setAdjustCompId(compRes.components[0]._id || compRes.components[0].id);
        }
      }
      if (txRes.success) setTransactions(txRes.transactions);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Issuance Action
  const handleConfirmIssuance = async (id) => {
    if (!window.confirm('Confirm that you have physically handed over these components to the student?')) return;
    try {
      setProcessing(true);
      const res = await api.issueRequest(id);
      if (res.success) {
        alert('Components issued successfully!');
        fetchData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Open Return Dialog
  const openReturnModal = (req) => {
    setReturnReq(req);
    const conds = {};
    const qtys = {};
    req.items.forEach(it => {
      conds[it.component] = 'GOOD';
      qtys[it.component] = (it.issuedQuantity || it.approvedQuantity) - (it.returnedQuantity || 0);
    });
    setReturnConditions(conds);
    setReturnQuantities(qtys);
    setReturnNotes('');
  };

  // Submit Return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnReq) return;
    setProcessing(true);
    try {
      const returnItems = returnReq.items.map(it => ({
        componentId: it.component,
        returnedQuantity: Number(returnQuantities[it.component] || 0),
        condition: returnConditions[it.component] || 'GOOD',
        notes: returnNotes
      }));

      const res = await api.processReturn(returnReq._id || returnReq.id, returnItems);
      if (res.success) {
        alert('Return checked into laboratory inventory!');
        setReturnReq(null);
        fetchData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Manual Adjustment
  const handleManualAdjust = async (e) => {
    e.preventDefault();
    if (!adjustCompId || !adjustReason) {
      alert('Please select component and specify audit reason');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.adjustStock({
        componentId: adjustCompId,
        deltaAvailable: Number(deltaAvailable),
        reason: adjustReason
      });
      if (res.success) {
        alert('Stock adjusted and recorded in transaction ledger!');
        setDeltaAvailable(0);
        setAdjustReason('');
        fetchData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Add Component Submit
  const handleCreateComponent = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.createComponent(newComp);
      if (res.success) {
        alert(`Component "${newComp.name}" added to inventory!`);
        setNewComp({
          name: '',
          category: 'Sensors',
          description: '',
          rack: 'A',
          shelf: 1,
          box: '01',
          totalStock: 10,
          unit: 'pcs',
          purchasePrice: 5.0,
          supplier: 'RoboStock Lab'
        });
        setActiveTab('issuance');
        fetchData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Export CSV
  const [exportingCsv, setExportingCsv] = useState(false);
  const handleExportCSV = async () => {
    try {
      setExportingCsv(true);
      await api.exportInventoryCSV();
    } catch (err) {
      alert(err.message || 'Failed to download inventory CSV.');
    } finally {
      setExportingCsv(false);
    }
  };

  const readyPickupRequests = requests.filter(r => r.status === 'READY_FOR_PICKUP' || r.status === 'APPROVED');
  const activeBorrowedRequests = requests.filter(r => ['ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE'].includes(r.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Laboratory Operations & Inventory Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inventory & Fulfillment Center
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Physical equipment checkout, check-in return verification, condition damage inspection, and transaction ledger.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exportingCsv}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shrink-0 disabled:opacity-50"
        >
          <Download className={`w-4 h-4 text-emerald-400 ${exportingCsv ? 'animate-bounce' : ''}`} />
          <span>{exportingCsv ? 'Downloading CSV...' : 'Export Inventory CSV'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'issuance', label: `Ready for Pickup (${readyPickupRequests.length})`, icon: PackageCheck },
          { id: 'returns', label: `Process Returns (${activeBorrowedRequests.length})`, icon: RotateCcw },
          { id: 'ledger', label: 'Stock Ledger & Adjustments', icon: SlidersHorizontal },
          { id: 'add', label: '+ Add New Component', icon: PlusCircle }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Ready for Physical Issuance */}
      {activeTab === 'issuance' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700">Approved Requests Awaiting Physical Pickup</h2>
          {readyPickupRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No approved requests currently waiting for collection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyPickupRequests.map(req => (
                <div key={req._id || req.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {req.requestCode}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Student: {req.userName}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{req.projectName}</h3>
                    <div className="mt-2 space-y-1">
                      {req.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                          <span>{it.componentName}</span>
                          <span className="font-bold text-blue-700">Qty: {it.approvedQuantity || it.requestedQuantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmIssuance(req._id || req.id)}
                    disabled={processing}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Physical Checkout & Handover</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Process Returns */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700">Active Borrowed Equipment Check-in</h2>
          {activeBorrowedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No borrowed components are currently out on loan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBorrowedRequests.map(req => (
                <div key={req._id || req.id} className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {req.requestCode}
                    </span>
                    <span className="text-xs text-slate-500">Borrowed by: {req.userName}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{req.projectName}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Expected Return: {new Date(req.expectedReturnDate).toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {req.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                          <span>{it.componentName}</span>
                          <span>Issued: <strong>{it.issuedQuantity || it.approvedQuantity}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => openReturnModal(req)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Process Lab Return & Inspection</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Inspection Modal */}
      {returnReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              Return Inspection: {returnReq.requestCode}
            </h3>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="space-y-3">
                {returnReq.items?.map(it => (
                  <div key={it.component} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{it.componentName}</span>
                      <span>Total Issued: {it.issuedQuantity}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span>Return Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max={it.issuedQuantity}
                          value={returnQuantities[it.component] || 1}
                          onChange={(e) => setReturnQuantities({
                            ...returnQuantities,
                            [it.component]: Number(e.target.value)
                          })}
                          className="w-16 p-1 border rounded font-bold text-center"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <span>Condition:</span>
                        <select
                          value={returnConditions[it.component] || 'GOOD'}
                          onChange={(e) => setReturnConditions({
                            ...returnConditions,
                            [it.component]: e.target.value
                          })}
                          className="p-1 border rounded font-semibold text-slate-800"
                        >
                          <option value="GOOD">Good / Tested OK</option>
                          <option value="DAMAGED">Damaged / Malfunction</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspection Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes on component health, missing pins or cables..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReturnReq(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  {processing ? 'Processing...' : 'Complete Return Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Stock Ledger & Adjustments */}
      {activeTab === 'ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Manual Stock Adjustment Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Manual Stock Adjustment</h3>
            <p className="text-xs text-slate-500">Record physical count discrepancies with mandatory audit justification.</p>

            <form onSubmit={handleManualAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Component</label>
                <select
                  value={adjustCompId}
                  onChange={(e) => setAdjustCompId(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                >
                  {components.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} (Current: {c.availableStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delta Available (+/-)</label>
                <input
                  type="number"
                  value={deltaAvailable}
                  onChange={(e) => setDeltaAvailable(e.target.value)}
                  placeholder="+5 or -2"
                  className="w-full p-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Physical recount discrepancy during quarterly lab audit"
                  className="w-full p-2 border rounded-xl"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
              >
                Post Ledger Adjustment
              </button>
            </form>
          </div>

          {/* Immutable Transaction History Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Inventory Transaction Ledger ({transactions.length})</h3>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
              {transactions.slice(0, 25).map(tx => (
                <div key={tx._id || tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                      tx.type === 'RECEIPT' ? 'bg-emerald-100 text-emerald-800' :
                      tx.type === 'RESERVATION' ? 'bg-amber-100 text-amber-800' :
                      tx.type === 'ISSUANCE' ? 'bg-blue-100 text-blue-800' :
                      tx.type === 'RETURN' ? 'bg-indigo-100 text-indigo-800' :
                      tx.type === 'DAMAGE' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tx.type}
                    </span>
                    <strong className="text-slate-900">{tx.componentName}</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {tx.reason} &bull; by {tx.userName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: Add New Component */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Add New Component to Lab Catalog</h3>

          <form onSubmit={handleCreateComponent} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Component Name *</label>
                <input
                  type="text"
                  value={newComp.name}
                  onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                  placeholder="e.g. Raspberry Pi Pico W"
                  required
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={newComp.category}
                  onChange={(e) => setNewComp({ ...newComp, category: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                >
                  {['Microcontrollers', 'Sensors', 'Actuators', 'Passive', 'Wires & Others', 'Power', 'Tools'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                value={newComp.description}
                onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                rows={2}
                placeholder="Technical description and pinout notes..."
                className="w-full p-2 border rounded-xl"
              />
            </div>

            {/* Storage Almirah Shelf Allocation */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 flex items-center space-x-1">
                <Box className="w-3.5 h-3.5 text-blue-600" />
                <span>Almirah Placement:</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-blue-800">Almirah Shelf (1-4)</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={newComp.shelf}
                    onChange={(e) => setNewComp({ ...newComp, shelf: Number(e.target.value) })}
                    className="w-full p-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-blue-800">Storage Box Label / Number</label>
                  <input
                    type="text"
                    value={newComp.box}
                    onChange={(e) => setNewComp({ ...newComp, box: e.target.value })}
                    className="w-full p-1.5 border rounded-lg bg-white"
                    placeholder="e.g. Box 01"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Stock</label>
                <input
                  type="number"
                  value={newComp.totalStock}
                  onChange={(e) => setNewComp({ ...newComp, totalStock: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newComp.unit}
                  onChange={(e) => setNewComp({ ...newComp, unit: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newComp.purchasePrice}
                  onChange={(e) => setNewComp({ ...newComp, purchasePrice: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
            >
              Add Component to Catalog
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
export default InventoryManagerView;
