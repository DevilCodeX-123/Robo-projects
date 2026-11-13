import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Package, Search, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, ClipboardList, RotateCcw,
  AlertTriangle, Check, X, Send
} from 'lucide-react';

const CATEGORIES = ['All', 'MCU', 'Actuator', 'Power', 'Sensor', 'Cable', 'Tool', 'Other'];
const REQUEST_STATUSES = ['All', 'Pending', 'Approved', 'Rejected', 'Issued', 'Returned'];

function AddItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'MCU',
    location: item?.location || '',
    description: item?.description || '',
    totalQty: item?.totalQty ?? '',
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={item ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Item Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Arduino Uno R3 / Raspberry Pi 4"
            value={form.name}
            onChange={e => setF('name', e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={form.category}
              onChange={e => setF('category', e.target.value)}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Total Stock Quantity *</label>
            <input
              type="number"
              className="form-control"
              min="0"
              placeholder="0"
              value={form.totalQty}
              onChange={e => setF('totalQty', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Location / Shelf / Bin (optional)</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Cabinet B, Shelf 3, Locker A"
            value={form.location}
            onChange={e => setF('location', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Description / Technical Notes (optional)</label>
          <input
            type="text"
            className="form-control"
            placeholder="Specifications, pinouts, voltage ratings..."
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Request Item Modal (Used by Team Members and Admins)
function RequestItemModal({ item, inventory, projects, onSave, onClose }) {
  const [selectedItemId, setSelectedItemId] = useState(item?.id || (inventory[0]?.id || ''));
  const selectedItem = inventory.find(i => i.id === selectedItemId);
  const avail = selectedItem ? selectedItem.totalQty - selectedItem.issuedQty : 0;

  const [form, setForm] = useState({
    qty: 1,
    purpose: '',
    project: '',
    expectedReturnDate: ''
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    onSave({
      itemId: selectedItem.id,
      qty: form.qty,
      purpose: form.purpose,
      project: form.project,
      expectedReturnDate: form.expectedReturnDate
    });
  };

  return (
    <Modal title="Request Hardware from Inventory" onClose={onClose} maxWidth="520px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Select Hardware Item *</label>
          <select
            className="form-control"
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            disabled={Boolean(item)}
            required
          >
            {inventory.map(i => {
              const free = i.totalQty - i.issuedQty;
              return (
                <option key={i.id} value={i.id} disabled={free <= 0}>
                  {i.name} ({free} of {i.totalQty} available) {free <= 0 ? '— Out of Stock' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{
          padding: '10px 14px',
          backgroundColor: avail <= 2 ? 'var(--status-overdue-bg)' : 'var(--bg-sidebar)',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid var(--border-light)',
          color: avail <= 2 ? 'var(--status-overdue-text)' : 'var(--text-primary)'
        }}>
          Current Available Stock: <strong>{avail} units</strong>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Requested Quantity *</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max={Math.max(1, avail)}
              value={form.qty}
              onChange={e => setF('qty', parseInt(e.target.value) || 1)}
              required
            />
          </div>
          <div className="form-group">
            <label>Expected Return Date</label>
            <input
              type="date"
              className="form-control"
              value={form.expectedReturnDate}
              onChange={e => setF('expectedReturnDate', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Related Club Project (optional)</label>
          <select
            className="form-control"
            value={form.project}
            onChange={e => setF('project', e.target.value)}
          >
            <option value="">— Independent / Lab Experiment —</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Purpose / Use-case Description *</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Explain why this hardware is required, test bench setup, pinouts..."
            value={form.purpose}
            onChange={e => setF('purpose', e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={avail <= 0}>
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Issue Approved Request Modal (Admin Records Actual Issuance)
function IssueApprovedModal({ request, onConfirm, onClose }) {
  const inv = storage.getInventory();
  const item = inv.find(i => i.id === request.itemId);
  const avail = item ? item.totalQty - item.issuedQty : 0;

  const [issuedQty, setIssuedQty] = useState(request.qty);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(request.id, issuedQty, issueDate);
  };

  return (
    <Modal title={`Issue Hardware: ${request.itemName}`} onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px', fontSize: '13px' }}>
          <div>Requested by: <strong>{request.requestedBy}</strong></div>
          <div style={{ marginTop: '4px' }}>Approved by: <strong>{request.approvedBy}</strong> ({new Date(request.approvedAt).toLocaleDateString()})</div>
          <div style={{ marginTop: '4px' }}>Available Stock: <strong>{avail} units</strong></div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Actual Issued Quantity *</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max={avail}
              value={issuedQty}
              onChange={e => setIssuedQty(parseInt(e.target.value) || 1)}
              required
            />
          </div>
          <div className="form-group">
            <label>Issue Date *</label>
            <input
              type="date"
              className="form-control"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          * Confirming issuance will decrease the available club inventory stock by {issuedQty} unit(s).
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={avail < issuedQty}>
            Confirm Hardware Issuance
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Reject Request Modal
function RejectRequestModal({ request, onConfirm, onClose }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(request.id, reason);
  };

  return (
    <Modal title="Decline Hardware Request" onClose={onClose} maxWidth="480px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Decline request for <strong>{request.qty} unit(s) of {request.itemName}</strong> by <strong>{request.requestedBy}</strong>.
        </p>
        <div className="form-group">
          <label>Reason for Rejection *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Hardware reserved for Robocon competition"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--status-overdue-text)' }}>
            Decline Request
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Direct Issue Modal (Admin direct checkout without prior request)
function DirectIssueModal({ item, members, currentUser, onIssue, onClose }) {
  const projects = storage.getProjects();
  const [form, setForm] = useState({
    issuedTo: '',
    issuedToId: '',
    project: '',
    qty: 1,
    issuedDate: new Date().toISOString().split('T')[0],
    returnDate: ''
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const avail = item.totalQty - item.issuedQty;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.issuedTo) return;
    onIssue({ ...form, itemId: item.id, issuedBy: currentUser.name });
  };

  return (
    <Modal title={`Direct Checkout: ${item.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          padding: '10px 14px', backgroundColor: 'var(--bg-sidebar)',
          borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-light)'
        }}>
          Currently Available Stock: <strong>{avail}</strong> of {item.totalQty} units
        </div>
        <div className="form-group">
          <label>Issue To Club Member *</label>
          <select
            className="form-control"
            value={form.issuedToId}
            onChange={e => {
              const m = members.find(m => m.id === e.target.value);
              setForm(f => ({ ...f, issuedToId: e.target.value, issuedTo: m?.name || e.target.value }));
            }}
            required
          >
            <option value="">— Select Member —</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.rollNumber || m.clubTag})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Related Project (optional)</label>
          <select
            className="form-control"
            value={form.project}
            onChange={e => setF('project', e.target.value)}
          >
            <option value="">— No project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Quantity to Issue *</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max={avail}
              value={form.qty}
              onChange={e => setF('qty', parseInt(e.target.value) || 1)}
              required
            />
          </div>
          <div className="form-group">
            <label>Issue Date</label>
            <input
              type="date"
              className="form-control"
              value={form.issuedDate}
              onChange={e => setF('issuedDate', e.target.value)}
            />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Expected Return Date (optional)</label>
          <input
            type="date"
            className="form-control"
            value={form.returnDate}
            onChange={e => setF('returnDate', e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={avail < form.qty}>
            Confirm Direct Issue
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function InventoryPage({ currentUser, showAlert }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'requests' | 'history'
  const [inventory, setInventory] = useState(storage.getInventory());
  const [requests, setRequests] = useState(storage.getInventoryRequests());
  const [issuedHistory, setIssuedHistory] = useState(storage.getIssuedItems());
  const members = storage.getMembers().filter(m => m.status === 'Active');
  const projects = storage.getProjects();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [reqStatusFilter, setReqStatusFilter] = useState('All');

  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [directIssuing, setDirectIssuing] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [requestingItem, setRequestingItem] = useState(null); // specific item or true for open modal
  const [issuingApprovedReq, setIssuingApprovedReq] = useState(null);
  const [rejectingReq, setRejectingReq] = useState(null);

  const refresh = () => {
    setInventory(storage.getInventory());
    setRequests(storage.getInventoryRequests());
    setIssuedHistory(storage.getIssuedItems());
  };

  // Low stock items (available <= 2)
  const lowStockItems = inventory.filter(i => (i.totalQty - i.issuedQty) <= 2 && i.totalQty > 0);

  // Filtered Inventory items
  const filteredInventory = inventory.filter(item => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || item.category === catFilter;
    return matchSearch && matchCat;
  });

  // Filtered Requests
  const visibleRequests = currentUser.isAdmin
    ? requests
    : requests.filter(r => r.requestedById === currentUser.id);

  const filteredRequests = visibleRequests.filter(r => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      r.itemName?.toLowerCase().includes(q) ||
      r.requestedBy?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q);
    const matchStatus = reqStatusFilter === 'All' || r.status === reqStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered History
  const visibleHistory = currentUser.isAdmin
    ? issuedHistory
    : issuedHistory.filter(h => h.issuedToId === currentUser.id);

  const filteredHistory = visibleHistory.filter(h => {
    const q = search.toLowerCase().trim();
    return !q ||
      h.itemName?.toLowerCase().includes(q) ||
      h.issuedTo?.toLowerCase().includes(q) ||
      h.project?.toLowerCase().includes(q);
  });

  // Handlers for Items
  const handleAddItem = (data) => {
    const res = storage.addInventoryItem(data);
    if (!res.success) {
      showAlert(res.message, 'error');
      return;
    }
    showAlert(`"${data.name}" added to inventory.`);
    setAddingItem(false);
    refresh();
  };

  const handleEditItem = (data) => {
    const res = storage.updateInventoryItem(editingItem.id, {
      ...data,
      totalQty: parseInt(data.totalQty)
    });
    if (res.success) {
      showAlert('Item updated.');
      setEditingItem(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleDeleteItem = () => {
    const res = storage.deleteInventoryItem(deletingItem.id);
    if (res.success) {
      showAlert('Item removed from inventory.');
      setDeletingItem(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleStockDelta = (item, delta) => {
    const newQty = item.totalQty + delta;
    if (newQty < item.issuedQty) {
      showAlert(`Cannot reduce stock below currently issued quantity (${item.issuedQty}).`, 'error');
      return;
    }
    storage.updateInventoryItem(item.id, { totalQty: newQty });
    refresh();
  };

  // Handlers for Requests
  const handleCreateRequest = (data) => {
    const res = storage.createInventoryRequest({
      ...data,
      requestedBy: currentUser.name,
      requestedById: currentUser.id
    });
    if (res.success) {
      showAlert('Item request submitted for administrator review.');
      setRequestingItem(null);
      setActiveTab('requests');
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleApproveRequest = (requestId) => {
    const res = storage.approveInventoryRequest(requestId, currentUser.name);
    if (res.success) {
      showAlert('Request approved! Stock is not yet reduced until actual issuance.');
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleConfirmIssueApproved = (requestId, issuedQty, issueDate) => {
    const res = storage.issueFromApprovedRequest(requestId, currentUser.name, issuedQty, issueDate);
    if (res.success) {
      showAlert(`Issued ${issuedQty} unit(s). Inventory stock updated.`);
      setIssuingApprovedReq(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleConfirmReject = (requestId, reason) => {
    const res = storage.rejectInventoryRequest(requestId, currentUser.name, reason);
    if (res.success) {
      showAlert('Request declined.');
      setRejectingReq(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  // Direct Issue
  const handleDirectIssue = (issueData) => {
    const res = storage.issueItem(issueData);
    if (res.success) {
      showAlert(`Issued ${issueData.qty} unit(s) of "${res.record.itemName}" to ${issueData.issuedTo}.`);
      setDirectIssuing(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  // Return item
  const handleReturnItem = (issueId) => {
    const res = storage.returnItem(issueId);
    if (res.success) {
      showAlert('Item marked as returned. Available stock restored.');
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">
            Equipment catalog, stock tracking, member hardware requests, and complete issue/return logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => setRequestingItem(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={15} /> Request Item
          </button>
          {currentUser.isAdmin && (
            <button
              className="btn-primary"
              onClick={() => setAddingItem(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Add Inventory Item
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="category-pills" style={{ marginTop: '-16px' }}>
        <button
          className={`category-pill ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Package size={14} /> Available Inventory ({inventory.length})
        </button>
        <button
          className={`category-pill ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ClipboardList size={14} />
          {currentUser.isAdmin ? 'Item Requests' : 'My Requests'} ({visibleRequests.length})
          {currentUser.isAdmin && pendingRequestsCount > 0 && (
            <span style={{ backgroundColor: 'var(--color-peach)', color: 'var(--text-primary)', borderRadius: '50px', padding: '1px 6px', fontSize: '11px', fontWeight: '700' }}>
              {pendingRequestsCount} new
            </span>
          )}
        </button>
        <button
          className={`category-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCcw size={14} />
          {currentUser.isAdmin ? 'Issue & Return History' : 'My Issued Items'} ({visibleHistory.length})
        </button>
      </div>

      {/* Low Stock Alert Banner (Visible when any stock is low) */}
      {lowStockItems.length > 0 && activeTab === 'items' && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'var(--color-yellow)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#5c4300'
        }}>
          <AlertTriangle size={18} flexShrink={0} />
          <div style={{ flex: 1 }}>
            <strong>Low Stock Alert:</strong> {lowStockItems.map(i => `${i.name} (${i.totalQty - i.issuedQty} left)`).join(' · ')}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 240px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={activeTab === 'items' ? 'Search inventory by name, category, or location…' : 'Search by item or purpose…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'items' && (
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        )}

        {activeTab === 'requests' && (
          <div className="category-pills">
            {REQUEST_STATUSES.map(s => (
              <button
                key={s}
                className={`category-pill ${reqStatusFilter === s ? 'active' : ''}`}
                onClick={() => setReqStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 1. INVENTORY ITEMS LIST ─────────────────────────── */}
      {activeTab === 'items' && (
        <div className="content-box" style={{ padding: '8px' }}>
          {filteredInventory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No inventory items found"
              description="Add microcontrollers, sensors, actuators, and equipment to track your club's inventory."
              action={currentUser.isAdmin ? () => setAddingItem(true) : undefined}
              actionLabel="Add Item"
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Available / Total</th>
                    <th>Shelf / Location</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const avail = item.totalQty - item.issuedQty;
                    const isLow = avail <= 2 && item.totalQty > 0;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                            {isLow && (
                              <span style={{ fontSize: '10px', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue-text)', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' }}>
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '50px',
                            backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-secondary)'
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontWeight: '700',
                              fontSize: '13px',
                              color: avail > 0 ? 'var(--status-active-text)' : 'var(--status-overdue-text)'
                            }}>
                              {avail} available
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              / {item.totalQty} total
                            </span>
                            {currentUser.isAdmin && (
                              <div style={{ display: 'inline-flex', gap: '2px', marginLeft: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(item, 1)}
                                  style={{ border: 'none', background: 'var(--bg-sidebar)', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                                  title="Increase Total Stock"
                                >
                                  <ChevronUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStockDelta(item, -1)}
                                  disabled={item.totalQty <= item.issuedQty}
                                  style={{ border: 'none', background: 'var(--bg-sidebar)', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                                  title="Decrease Total Stock"
                                >
                                  <ChevronDown size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.location || '—'}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setRequestingItem(item)}
                              disabled={avail <= 0}
                              title={avail <= 0 ? 'Out of stock' : 'Submit Item Request'}
                            >
                              <Send size={12} /> Request
                            </button>
                            {currentUser.isAdmin && (
                              <>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => setDirectIssuing(item)}
                                  disabled={avail <= 0}
                                  title="Direct Checkout to Member"
                                >
                                  <ClipboardList size={12} /> Issue
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '12px' }}
                                  onClick={() => setEditingItem(item)}
                                  title="Edit Item"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '12px', color: 'var(--status-overdue-text)' }}
                                  onClick={() => setDeletingItem(item)}
                                  disabled={item.issuedQty > 0}
                                  title={item.issuedQty > 0 ? 'Cannot delete while units are issued' : 'Delete Item'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 2. INVENTORY REQUESTS WORKFLOW ──────────────────── */}
      {activeTab === 'requests' && (
        <div className="content-box" style={{ padding: '8px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Workflow: <strong>Pending</strong> → <strong>Approved</strong> / <strong>Rejected</strong> → <strong>Issued</strong> (Stock decreases) → <strong>Returned</strong>
            </span>
            <button
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => setRequestingItem(true)}
            >
              <Send size={13} style={{ marginRight: '6px' }} /> New Request
            </button>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No inventory requests"
              description="Members can request microcontrollers, sensors, or tools for development projects."
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Requested</th>
                    <th>Requested By</th>
                    <th>Qty</th>
                    <th>Purpose / Project</th>
                    <th>Approval Status</th>
                    <th>Issuance Details</th>
                    {currentUser.isAdmin && <th style={{ textAlign: 'right' }}>Admin Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(r => {
                    const statusColor = {
                      Pending: 'var(--color-yellow)',
                      Approved: 'var(--color-teal)',
                      Rejected: 'var(--status-overdue-bg)',
                      Issued: 'var(--color-blue)',
                      Returned: 'var(--bg-sidebar)'
                    };

                    const statusTextColor = {
                      Pending: '#7a5a00',
                      Approved: 'var(--text-primary)',
                      Rejected: 'var(--status-overdue-text)',
                      Issued: 'var(--text-primary)',
                      Returned: 'var(--text-secondary)'
                    };

                    return (
                      <tr key={r.id}>
                        <td>
                          <strong style={{ fontSize: '14px', display: 'block' }}>{r.itemName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Req: {new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>{r.requestedBy}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{r.qty}</span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>{r.purpose}</p>
                          {r.project && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project: {r.project}</span>}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px',
                            backgroundColor: statusColor[r.status] || 'var(--bg-sidebar)',
                            color: statusTextColor[r.status] || 'var(--text-primary)'
                          }}>
                            {r.status}
                          </span>
                          {r.approvedBy && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Approved by: <strong>{r.approvedBy}</strong> ({new Date(r.approvedAt).toLocaleDateString()})
                            </span>
                          )}
                          {r.rejectedBy && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--status-overdue-text)', marginTop: '4px' }}>
                              Declined by: {r.rejectedBy} {r.rejectionReason ? `(${r.rejectionReason})` : ''}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {r.status === 'Issued' ? (
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>{r.issuedQuantity || r.qty} units issued</strong>
                              <div>Date: {r.issueDate} by {r.issuedBy || 'Admin'}</div>
                              {r.expectedReturnDate && <div>Due: {r.expectedReturnDate}</div>}
                            </div>
                          ) : r.status === 'Returned' ? (
                            <span style={{ color: 'var(--status-active-text)' }}>Returned on {r.returnDate || '—'}</span>
                          ) : r.status === 'Approved' ? (
                            <span style={{ color: '#0d47a1', fontStyle: 'italic' }}>Pending physical issuance</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        {currentUser.isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {r.status === 'Pending' && (
                                <>
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--status-active-text)' }}
                                    onClick={() => handleApproveRequest(r.id)}
                                    title="Approve Request (Stock will not decrease yet)"
                                  >
                                    <Check size={12} style={{ marginRight: '4px' }} /> Approve
                                  </button>
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--status-overdue-text)' }}
                                    onClick={() => setRejectingReq(r)}
                                    title="Decline Request"
                                  >
                                    <X size={12} style={{ marginRight: '4px' }} /> Decline
                                  </button>
                                </>
                              )}
                              {r.status === 'Approved' && (
                                <button
                                  className="btn-primary"
                                  style={{ padding: '5px 12px', fontSize: '12px' }}
                                  onClick={() => setIssuingApprovedReq(r)}
                                  title="Record actual physical issuance to member"
                                >
                                  <ClipboardList size={12} style={{ marginRight: '4px' }} /> Issue Item
                                </button>
                              )}
                              {r.status === 'Issued' && (
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => handleReturnItem(r.id)}
                                  title="Mark returned to inventory"
                                >
                                  <RotateCcw size={12} style={{ marginRight: '4px' }} /> Return
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 3. ISSUE & RETURN HISTORY ───────────────────────── */}
      {activeTab === 'history' && (
        <div className="content-box" style={{ padding: '8px' }}>
          {filteredHistory.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title="No checkout history"
              description={currentUser.isAdmin ? 'Full hardware checkout and return logs will appear here.' : 'Your hardware checkout history will appear here.'}
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Issued To</th>
                    <th>Related Project</th>
                    <th>Issued By</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    {currentUser.isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(rec => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: '600' }}>{rec.itemName}</td>
                      <td>
                        <span className="status-pill longterm" style={{ fontWeight: '700' }}>{rec.qty}</span>
                      </td>
                      <td>{rec.issuedTo}</td>
                      <td>{rec.project || '—'}</td>
                      <td>{rec.issuedBy || 'Admin'}</td>
                      <td>{rec.issuedDate || '—'}</td>
                      <td>
                        {rec.status === 'Active' ? (
                          <span className="status-pill active">
                            Active {rec.returnDate ? `(Due ${rec.returnDate})` : ''}
                          </span>
                        ) : (
                          <span className="status-pill inactive">
                            Returned {rec.returnedAt ? `(${new Date(rec.returnedAt).toLocaleDateString()})` : ''}
                          </span>
                        )}
                      </td>
                      {currentUser.isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          {rec.status === 'Active' ? (
                            <button
                              className="btn-secondary"
                              style={{ padding: '5px 12px', fontSize: '12px' }}
                              onClick={() => handleReturnItem(rec.id)}
                              title="Mark returned"
                            >
                              <RotateCcw size={12} style={{ marginRight: '4px' }} /> Return
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {addingItem && (
        <AddItemModal
          onSave={handleAddItem}
          onClose={() => setAddingItem(false)}
        />
      )}
      {editingItem && (
        <AddItemModal
          item={editingItem}
          onSave={handleEditItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {directIssuing && (
        <DirectIssueModal
          item={directIssuing}
          members={members}
          currentUser={currentUser}
          onIssue={handleDirectIssue}
          onClose={() => setDirectIssuing(null)}
        />
      )}
      {deletingItem && (
        <ConfirmDialog
          title="Delete Inventory Item"
          message={`Are you sure you want to permanently remove "${deletingItem.name}" from inventory?`}
          onConfirm={handleDeleteItem}
          onCancel={() => setDeletingItem(null)}
          confirmLabel="Delete Item"
          danger
        />
      )}
      {requestingItem && (
        <RequestItemModal
          item={typeof requestingItem === 'object' ? requestingItem : null}
          inventory={inventory}
          currentUser={currentUser}
          projects={projects}
          onSave={handleCreateRequest}
          onClose={() => setRequestingItem(null)}
        />
      )}
      {issuingApprovedReq && (
        <IssueApprovedModal
          request={issuingApprovedReq}
          onConfirm={handleConfirmIssueApproved}
          onClose={() => setIssuingApprovedReq(null)}
        />
      )}
      {rejectingReq && (
        <RejectRequestModal
          request={rejectingReq}
          onConfirm={handleConfirmReject}
          onClose={() => setRejectingReq(null)}
        />
      )}
    </>
  );
}
