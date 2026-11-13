import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  FileText,
  Plus,
  Minus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  Search,
  Layers,
  UserCheck,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Copy,
  RotateCcw,
  Archive,
  ListPlus
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getDefaultGraphicForCategory } from '../../data/componentAssets';

const CATEGORY_TO_SHELF = {
  'Basic Electronics': 1,
  Passive: 1,
  Semiconductors: 2,
  Microcontrollers: 3,
  Sensors: 4,
  Motors: 5,
  Actuators: 5,
  Cables: 6,
  'Wires & Others': 6,
  Equipment: 7,
  Tools: 7,
  Power: 7
};

const ALMIRAH_CATEGORIES = [
  'Basic Electronics',
  'Semiconductors',
  'Microcontrollers',
  'Sensors',
  'Motors',
  'Cables',
  'Equipment'
];

// Compress uploaded device photo cleanly into a lightweight Data URL for fast DB storage & almirah display
const resizeImageToDataUrl = (file, maxWidth = 480) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const createEmptyBulkRow = () => ({
  id: Math.random().toString(36).slice(2, 9),
  name: '',
  category: 'Basic Electronics',
  shelfIndex: 1,
  availableStock: 10,
  unit: 'pcs',
  whatItDoes: ''
});

export const AdminView = ({ onRefreshData = () => {} }) => {
  const { role, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'requests' | 'users' | 'audit'
  const [users, setUsers] = useState([]);
  const [allComponents, setAllComponents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parts View Mode & Filtering
  const [partsStatusView, setPartsStatusView] = useState('ACTIVE'); // 'ACTIVE' | 'ARCHIVED'
  const [partSearch, setPartSearch] = useState('');
  const [partCategoryFilter, setPartCategoryFilter] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [savedCompId, setSavedCompId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Multi-select Bulk Actions on Parts Table
  const [selectedPartIds, setSelectedPartIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Single Add / Edit Component Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [savingComp, setSavingComp] = useState(false);
  const [modalError, setModalError] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [compFormData, setCompFormData] = useState({
    name: '',
    label: '',
    category: 'Basic Electronics',
    description: '',
    whatItDoes: '',
    totalStock: 20,
    availableStock: 20,
    minThreshold: 5,
    shelfIndex: 1,
    unit: 'pcs',
    imageUrl: ''
  });

  // Bulk Add Multiple Parts Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([
    createEmptyBulkRow(),
    createEmptyBulkRow(),
    createEmptyBulkRow()
  ]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const canManageParts = role === 'ADMIN' || role === 'INVENTORY_MANAGER';

  const showFeedback = (type, message) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compsRes, reqsRes] = await Promise.all([
        api.getComponents({ includeArchived: true }),
        api.getRequests()
      ]);
      if (compsRes.success) setAllComponents(compsRes.components || []);
      if (reqsRes.success) setRequests(reqsRes.requests || []);

      if (role === 'ADMIN') {
        const [usersRes, logsRes] = await Promise.all([
          api.getUsers(),
          api.getAuditLogs()
        ]);
        if (usersRes.success) setUsers(usersRes.users || []);
        if (logsRes.success) setAuditLogs(logsRes.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const activeComponents = useMemo(
    () => allComponents.filter((c) => c.status !== 'ARCHIVED'),
    [allComponents]
  );

  const archivedComponents = useMemo(
    () => allComponents.filter((c) => c.status === 'ARCHIVED'),
    [allComponents]
  );

  const displayedPool = partsStatusView === 'ARCHIVED' ? archivedComponents : activeComponents;

  const filteredComponents = useMemo(() => {
    return displayedPool.filter((comp) => {
      const q = partSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (comp.name || '').toLowerCase().includes(q) ||
        (comp.label || '').toLowerCase().includes(q) ||
        (comp.componentCode || '').toLowerCase().includes(q) ||
        (comp.whatItDoes || comp.description || '').toLowerCase().includes(q);

      const matchesCat =
        partCategoryFilter === 'All' ||
        (comp.category || '').toLowerCase() === partCategoryFilter.toLowerCase();

      const avail = comp.availableStock ?? 0;
      const thresh = comp.minThreshold ?? 5;
      const matchesLow = !showLowStockOnly || avail <= thresh;

      return matchesSearch && matchesCat && matchesLow;
    });
  }, [displayedPool, partSearch, partCategoryFilter, showLowStockOnly]);

  // Dynamic category list for filters (includes any custom categories added later)
  const filterCategories = useMemo(() => {
    const set = new Set(ALMIRAH_CATEGORIES);
    allComponents.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [allComponents]);

  // Inventory Summary Metrics
  const totalPartsCount = activeComponents.length;
  const totalAvailableUnits = activeComponents.reduce((acc, c) => acc + (c.availableStock ?? 0), 0);
  const lowStockCount = activeComponents.filter(
    (c) => (c.availableStock ?? 0) > 0 && (c.availableStock ?? 0) <= (c.minThreshold ?? 5)
  ).length;
  const outOfStockCount = activeComponents.filter((c) => (c.availableStock ?? 0) === 0).length;

  // Inline Quantity Update
  const handleUpdateQuantity = async (comp, newQty) => {
    if (!canManageParts) {
      showFeedback('error', 'Switch to Admin role first to modify part quantities.');
      return;
    }
    const parsedQty = Math.max(0, Number(newQty) || 0);
    const id = comp._id || comp.id;

    try {
      const res = await api.updateComponent(id, {
        totalStock: Math.max(parsedQty, (comp.reservedStock || 0) + (comp.issuedStock || 0) + parsedQty),
        availableStock: parsedQty
      });
      if (res.success) {
        setAllComponents((prev) =>
          prev.map((c) =>
            (c._id || c.id) === id ? { ...c, ...res.component, availableStock: parsedQty } : c
          )
        );
        setSavedCompId(id);
        setTimeout(() => setSavedCompId(null), 1600);
        onRefreshData();
      } else {
        showFeedback('error', res.message || 'Failed to update quantity');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Server error while updating stock');
    }
  };

  // Archive / Permanent Delete
  const handleDeleteComponent = async (id, name, permanent = false) => {
    if (!canManageParts) {
      showFeedback('error', 'Switch to Admin role first to remove parts.');
      return;
    }
    const msg = permanent
      ? `Permanently delete "${name}"? This cannot be undone.`
      : `Move "${name}" to Archived Parts? You can restore it anytime later.`;
    if (!window.confirm(msg)) return;

    try {
      const res = await api.deleteComponent(id, permanent);
      if (res.success) {
        await fetchData();
        setSelectedPartIds((prev) => prev.filter((x) => x !== id));
        showFeedback(
          'success',
          permanent ? `"${name}" permanently deleted.` : `"${name}" moved to Archived Parts.`
        );
        onRefreshData();
      } else {
        showFeedback('error', res.message || 'Action failed');
      }
    } catch (err) {
      showFeedback('error', err.message);
    }
  };

  // Restore Archived Part
  const handleRestoreComponent = async (id, name) => {
    if (!canManageParts) {
      showFeedback('error', 'Switch to Admin role first to restore parts.');
      return;
    }
    try {
      const res = await api.restoreComponent(id);
      if (res.success) {
        await fetchData();
        onRefreshData();
        showFeedback('success', `"${name}" restored to Active Inventory & Smart Almirah!`);
      } else {
        showFeedback('error', res.message || 'Restore failed');
      }
    } catch (err) {
      showFeedback('error', err.message);
    }
  };

  // Multi-select Checkbox Toggles
  const toggleSelectRow = (id) => {
    setSelectedPartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredComponents.map((c) => c._id || c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPartIds.includes(id));
    if (allSelected) {
      setSelectedPartIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedPartIds(Array.from(new Set([...selectedPartIds, ...visibleIds])));
    }
  };

  // Bulk Archive Selected Rows
  const handleBulkArchiveSelected = async () => {
    if (!canManageParts || selectedPartIds.length === 0) return;
    if (!window.confirm(`Archive ${selectedPartIds.length} selected part(s)? You can restore them anytime from Archived Parts.`)) return;

    setBulkBusy(true);
    try {
      await Promise.all(selectedPartIds.map((id) => api.deleteComponent(id, false)));
      setSelectedPartIds([]);
      await fetchData();
      onRefreshData();
      showFeedback('success', 'Selected parts moved to Archived Parts.');
    } catch (err) {
      showFeedback('error', err.message || 'Bulk archive failed');
    } finally {
      setBulkBusy(false);
    }
  };

  // Bulk Restock Selected Rows (+5 units)
  const handleBulkAddStock = async (delta = 5) => {
    if (!canManageParts || selectedPartIds.length === 0) return;
    setBulkBusy(true);
    try {
      const targets = activeComponents.filter((c) => selectedPartIds.includes(c._id || c.id));
      await Promise.all(
        targets.map((c) => {
          const nextAvail = Math.max(0, (c.availableStock ?? 0) + delta);
          return api.updateComponent(c._id || c.id, {
            availableStock: nextAvail,
            totalStock: Math.max(nextAvail, c.totalStock ?? nextAvail)
          });
        })
      );
      await fetchData();
      onRefreshData();
      showFeedback('success', `Added +${delta} stock to ${targets.length} selected part(s).`);
    } catch (err) {
      showFeedback('error', err.message || 'Bulk restock failed');
    } finally {
      setBulkBusy(false);
    }
  };

  // Open Modal to Add Component
  const openAddModal = (preset = null) => {
    setEditingComp(null);
    setModalError('');
    const cat = preset?.category || 'Basic Electronics';
    const isCustom = !ALMIRAH_CATEGORIES.includes(cat);
    setUseCustomCategory(isCustom);
    setCompFormData({
      name: preset ? `${preset.name} (Copy)` : '',
      label: preset ? preset.label || '' : '',
      category: cat,
      description: preset?.description || '',
      whatItDoes: preset?.whatItDoes || preset?.description || '',
      totalStock: preset?.totalStock ?? 20,
      availableStock: preset?.availableStock ?? 20,
      minThreshold: preset?.minThreshold ?? 5,
      shelfIndex: preset?.shelfIndex || CATEGORY_TO_SHELF[cat] || 1,
      unit: preset?.unit || 'pcs',
      imageUrl: ''
    });
    setIsCompModalOpen(true);
  };

  // Open Modal to Edit Component
  const openEditModal = (comp) => {
    setEditingComp(comp);
    setModalError('');
    const cat = comp.category || 'Basic Electronics';
    setUseCustomCategory(!ALMIRAH_CATEGORIES.includes(cat));
    setCompFormData({
      name: comp.name || '',
      label: comp.label || comp.name || '',
      category: cat,
      description: comp.description || '',
      whatItDoes: comp.whatItDoes || comp.description || '',
      totalStock: comp.totalStock ?? comp.availableStock ?? 0,
      availableStock: comp.availableStock ?? comp.totalStock ?? 0,
      minThreshold: comp.minThreshold ?? 5,
      shelfIndex: comp.shelfIndex || comp.location?.shelf || CATEGORY_TO_SHELF[cat] || 1,
      unit: comp.unit || 'pcs',
      imageUrl:
        comp.imageUrl &&
        !comp.imageUrl.includes('photo-1518770660439') &&
        !comp.imageUrl.includes('photo-1544716278')
          ? comp.imageUrl
          : ''
    });
    setIsCompModalOpen(true);
  };

  // Handle Photo File Upload inside Add/Edit Modal
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setCompFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setModalError('Could not process selected image file. Please try a JPG or PNG.');
    }
  };

  // Save Component (Create, Update, or Save & Add Another)
  const submitComponentForm = async (addAnother = false) => {
    if (!canManageParts) {
      setModalError('Please switch to the Admin role first to save changes.');
      return;
    }

    if (!compFormData.name.trim() || !compFormData.category.trim()) {
      setModalError('Part name and category are required.');
      return;
    }

    setModalError('');
    setSavingComp(true);

    const payload = {
      ...compFormData,
      name: compFormData.name.trim(),
      label: compFormData.label.trim() || compFormData.name.trim(),
      category: compFormData.category.trim(),
      whatItDoes: compFormData.whatItDoes.trim() || `${compFormData.name.trim()} laboratory component.`,
      description: compFormData.whatItDoes.trim() || compFormData.description.trim(),
      totalStock: Number(compFormData.totalStock),
      availableStock: Number(compFormData.availableStock),
      minThreshold: Number(compFormData.minThreshold),
      shelfIndex: Number(compFormData.shelfIndex),
      shelf: Number(compFormData.shelfIndex)
    };

    try {
      if (editingComp) {
        const id = editingComp._id || editingComp.id;
        const res = await api.updateComponent(id, payload);
        if (res.success) {
          setIsCompModalOpen(false);
          await fetchData();
          onRefreshData();
          showFeedback('success', `Updated "${payload.name}" successfully.`);
        } else {
          setModalError(res.message || 'Update failed');
        }
      } else {
        const res = await api.createComponent(payload);
        if (res.success) {
          await fetchData();
          onRefreshData();
          showFeedback('success', `Added "${payload.name}" to Smart Almirah & Inventory!`);
          if (addAnother) {
            setCompFormData((prev) => ({
              ...prev,
              name: '',
              label: '',
              whatItDoes: '',
              description: '',
              imageUrl: ''
            }));
          } else {
            setIsCompModalOpen(false);
          }
        } else {
          setModalError(res.message || 'Create failed');
        }
      }
    } catch (err) {
      setModalError(err.message || 'Error communicating with backend server.');
    } finally {
      setSavingComp(false);
    }
  };

  // Bulk Add Multiple Parts Handler
  const handleSaveBulkParts = async (e) => {
    e.preventDefault();
    if (!canManageParts) {
      setBulkError('Please switch to the Admin role first.');
      return;
    }

    const validRows = bulkRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      setBulkError('Please enter at least one part name.');
      return;
    }

    setBulkError('');
    setSavingBulk(true);
    try {
      const res = await api.bulkCreateComponents(
        validRows.map((r) => ({
          name: r.name.trim(),
          label: r.name.trim(),
          category: r.category,
          shelfIndex: Number(r.shelfIndex) || CATEGORY_TO_SHELF[r.category] || 1,
          totalStock: Number(r.availableStock) || 0,
          availableStock: Number(r.availableStock) || 0,
          unit: r.unit || 'pcs',
          whatItDoes: r.whatItDoes.trim() || `${r.name.trim()} robotics club component.`
        }))
      );

      if (res.success) {
        setIsBulkModalOpen(false);
        setBulkRows([createEmptyBulkRow(), createEmptyBulkRow(), createEmptyBulkRow()]);
        await fetchData();
        onRefreshData();
        showFeedback('success', `Added ${res.count} new part(s) to your Smart Almirah & Inventory!`);
      } else {
        setBulkError(res.message || 'Bulk creation failed');
      }
    } catch (err) {
      setBulkError(err.message || 'Server error while saving batch');
    } finally {
      setSavingBulk(false);
    }
  };

  // User Role & Status Handlers
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.toggleUserStatus(userId);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getThumbnail = (comp) => {
    if (
      comp.imageUrl &&
      !comp.imageUrl.includes('photo-1518770660439') &&
      !comp.imageUrl.includes('photo-1544716278')
    ) {
      return comp.imageUrl;
    }
    return getDefaultGraphicForCategory(comp.category);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Top Admin Banner */}
      <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Robotics Club Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Add parts one-by-one or in bulk anytime later, upload photos, customize categories, restore archived parts, and adjust live Smart Almirah quantities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-white/15 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {activeTab === 'components' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setBulkError('');
                  setIsBulkModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-white/20 transition-all cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-emerald-400" />
                <span>Bulk Add Parts</span>
              </button>
              <button
                type="button"
                onClick={() => openAddModal(null)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Part</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Role Switch Helper Banner */}
      {!canManageParts && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-amber-950">
                Admin Access Required to Modify Parts
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Currently signed in as <strong>{role}</strong>. Switch to the Admin role to add, edit, upload images, restore, or remove parts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => switchRole('ADMIN')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shrink-0 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch to Admin Role</span>
          </button>
        </div>
      )}

      {/* Action Feedback Toast Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button type="button" onClick={() => setActionFeedback(null)} className="opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'components', label: 'Parts & Inventory', count: activeComponents.length, icon: Package },
          { id: 'requests', label: 'All Requests', count: requests.length, icon: FileText },
          { id: 'users', label: 'User Directory', count: users.length, icon: Users },
          { id: 'audit', label: 'Security Audit', count: auditLogs.length, icon: ShieldAlert }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PARTS & COMPONENT MANAGEMENT */}
      {activeTab === 'components' && (
        <div className="space-y-5">
          {/* Quick Parts Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Part Types
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalPartsCount}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Total Units Available
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{totalAvailableUnits}</div>
            </div>
            <div
              onClick={() => {
                setPartsStatusView('ACTIVE');
                setShowLowStockOnly((prev) => !prev);
              }}
              className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 shadow-2xs cursor-pointer hover:border-amber-400 transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Low Stock Alerts
              </span>
              <div className="text-2xl font-black text-amber-900 font-mono mt-1">{lowStockCount}</div>
            </div>
            <div
              onClick={() => setPartsStatusView(partsStatusView === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-2xs cursor-pointer hover:border-blue-400 transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Archived / Removed ({outOfStockCount} Out)
              </span>
              <div className="text-2xl font-black text-slate-800 font-mono mt-1 flex items-center justify-between">
                <span>{archivedComponents.length}</span>
                <Archive className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Search, Active/Archived Switch & Filter Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPartsStatusView('ACTIVE');
                    setSelectedPartIds([]);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    partsStatusView === 'ACTIVE'
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Active Parts ({activeComponents.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPartsStatusView('ARCHIVED');
                    setSelectedPartIds([]);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    partsStatusView === 'ARCHIVED'
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archived / Restore ({archivedComponents.length})</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    placeholder="Search part name or code..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-800 w-48 sm:w-56"
                  />
                </div>

                <select
                  value={partCategoryFilter}
                  onChange={(e) => setPartCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Categories</option>
                  {filterCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {partsStatusView === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setShowLowStockOnly((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      showLowStockOnly
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Low Stock
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBulkError('');
                    setIsBulkModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Bulk Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddModal(null)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Part</span>
                </button>
              </div>
            </div>

            {/* Bulk Multi-Select Toolbar (appears when rows are checked) */}
            {selectedPartIds.length > 0 && partsStatusView === 'ACTIVE' && (
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-blue-900">
                  {selectedPartIds.length} part(s) selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => handleBulkAddStock(5)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    +5 Stock to Selected
                  </button>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={handleBulkArchiveSelected}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    Archive Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPartIds([])}
                    className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    {partsStatusView === 'ACTIVE' && (
                      <th className="pl-5 pr-2 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredComponents.length > 0 &&
                            filteredComponents.every((c) => selectedPartIds.includes(c._id || c.id))
                          }
                          onChange={toggleSelectAllVisible}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Select all visible parts"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Part</th>
                    <th className="px-4 py-3">Category &amp; Shelf</th>
                    <th className="px-4 py-3">Available Quantity</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComponents.length === 0 ? (
                    <tr>
                      <td colSpan={partsStatusView === 'ACTIVE' ? 6 : 5} className="px-5 py-10 text-center text-slate-400">
                        {partsStatusView === 'ARCHIVED'
                          ? 'No archived parts. Deleted parts appear here so you can restore them anytime.'
                          : 'No parts match your current search or filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredComponents.map((comp) => {
                      const id = comp._id || comp.id;
                      const avail = comp.availableStock ?? 0;
                      const thresh = comp.minThreshold ?? 5;
                      const isJustSaved = savedCompId === id;
                      const isChecked = selectedPartIds.includes(id);

                      return (
                        <tr
                          key={id}
                          className={`transition-colors ${
                            isChecked ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {partsStatusView === 'ACTIVE' && (
                            <td className="pl-5 pr-2 py-3.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRow(id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                <img
                                  src={getThumbnail(comp)}
                                  alt={comp.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs">{comp.name}</div>
                                <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                  {comp.whatItDoes || comp.description || 'No description'}
                                </div>
                                {comp.componentCode && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {comp.componentCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              {comp.category}
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              <span>
                                Shelf {comp.shelfIndex || comp.location?.shelf || CATEGORY_TO_SHELF[comp.category] || 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {partsStatusView === 'ARCHIVED' ? (
                              <span className="font-mono font-bold text-slate-500">
                                {avail} {comp.unit || 'pcs'}
                              </span>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <div className="inline-flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden">
                                  <button
                                    type="button"
                                    disabled={avail <= 0}
                                    onClick={() => handleUpdateQuantity(comp, avail - 1)}
                                    className="px-2 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                                    title="Decrease quantity by 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    key={`${id}_${avail}`}
                                    type="number"
                                    min="0"
                                    defaultValue={avail}
                                    onBlur={(e) => {
                                      if (Number(e.target.value) !== avail) {
                                        handleUpdateQuantity(comp, e.target.value);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateQuantity(comp, e.currentTarget.value);
                                      }
                                    }}
                                    className="w-14 py-1 bg-white font-mono font-bold text-center text-slate-900 focus:outline-none border-x border-slate-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(comp, avail + 1)}
                                    className="px-2 py-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                    title="Increase quantity by 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[11px] text-slate-500">{comp.unit || 'pcs'}</span>
                                {isJustSaved && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                                    <Check className="w-3 h-3" />
                                    <span>Saved</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {partsStatusView === 'ARCHIVED' ? (
                              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                                Archived
                              </span>
                            ) : avail === 0 ? (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                                Out of Stock
                              </span>
                            ) : avail <= thresh ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                            {partsStatusView === 'ARCHIVED' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestoreComponent(id, comp.name)}
                                  className="px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComponent(id, comp.name, true)}
                                  className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-xl font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Forever</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openAddModal(comp)}
                                  title="Duplicate / Clone part as a new variant"
                                  className="px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Clone</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(comp)}
                                  className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-xl font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComponent(id, comp.name, false)}
                                  className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-xl font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">All Student Component Requests</h3>
            <span className="text-xs text-slate-500">{requests.length} total club requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Request Code</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Requested Components</th>
                  <th className="px-5 py-3">Date &amp; Return</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r._id || r.id || r.requestCode} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{r.requestCode}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{r.userName}</div>
                      <div className="text-[11px] text-slate-400">{r.userEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {r.items?.map((it, idx) => (
                          <div key={idx} className="text-slate-800">
                            <strong>{it.componentName}</strong> (Qty: {it.requestedQuantity})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>Created: {new Date(r.createdAt).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">
                        Due: {new Date(r.expectedReturnDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' || r.status === 'READY_FOR_PICKUP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'ISSUED'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'RETURNED'
                                ? 'bg-slate-200 text-slate-700'
                                : r.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER DIRECTORY & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Registered Members &amp; Access Hierarchy</h3>
            <span className="text-xs text-slate-500">{users.length} registered accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Member Details</th>
                  <th className="px-5 py-3">Department &amp; Year</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                      <span className="font-mono text-[10px] text-blue-600 font-semibold">
                        ID: {u.membershipId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>{u.department}</div>
                      <div className="text-[11px] text-slate-400">
                        {u.academicYear} &bull; {u.teamName}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
                      >
                        <option value="MEMBER">Member (Student)</option>
                        <option value="SENIOR">Senior Approver</option>
                        <option value="INVENTORY_MANAGER">Inventory Manager</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u._id || u.id)}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <Lock className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>{u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT STREAM */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-sm">Security &amp; Administrative Audit Stream</h3>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-xs font-mono">
            {auditLogs.map((log) => (
              <div key={log._id || log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded mr-2 border border-slate-200">
                    {log.action}
                  </span>
                  <span className="text-slate-800 font-semibold">{log.userName}</span>
                  <span className="text-slate-400 text-[11px] ml-2 font-sans">
                    ({log.entityType} ID: {log.entityId || 'N/A'})
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SINGLE ADD / EDIT PART MODAL */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingComp ? 'Edit Part Details & Stock' : 'Add New Part to Smart Almirah'}
                </h3>
                <p className="text-xs text-slate-400">
                  Update details, upload a photo from your device, or save &amp; continue adding parts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCompModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitComponentForm(false);
              }}
              className="p-6 space-y-4 text-xs overflow-y-auto"
            >
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={compFormData.name}
                    onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                    placeholder="e.g. MPU6050 Gyro Sensor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Almirah Box Label <span className="text-slate-400 font-normal">(Short name)</span>
                  </label>
                  <input
                    type="text"
                    value={compFormData.label}
                    onChange={(e) => setCompFormData({ ...compFormData, label: e.target.value })}
                    placeholder="e.g. Gyro Sensor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setUseCustomCategory((prev) => !prev)}
                      className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      {useCustomCategory ? 'Use Preset' : '+ Custom'}
                    </button>
                  </div>
                  {useCustomCategory ? (
                    <input
                      type="text"
                      required
                      value={compFormData.category}
                      onChange={(e) => setCompFormData({ ...compFormData, category: e.target.value })}
                      placeholder="e.g. Batteries & Power"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-semibold"
                    />
                  ) : (
                    <select
                      value={compFormData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCompFormData({
                          ...compFormData,
                          category: newCat,
                          shelfIndex: CATEGORY_TO_SHELF[newCat] || 1
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {ALMIRAH_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Almirah Shelf</label>
                  <select
                    value={compFormData.shelfIndex}
                    onChange={(e) =>
                      setCompFormData({ ...compFormData, shelfIndex: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  >
                    <option value={1}>Shelf 1 (Basic)</option>
                    <option value={2}>Shelf 2 (Semicon)</option>
                    <option value={3}>Shelf 3 (MCU)</option>
                    <option value={4}>Shelf 4 (Sensors)</option>
                    <option value={5}>Shelf 5 (Motors)</option>
                    <option value={6}>Shelf 6 (Cables)</option>
                    <option value={7}>Shelf 7 (Equipment)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={compFormData.unit}
                    onChange={(e) => setCompFormData({ ...compFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="pcs">pcs</option>
                    <option value="packs">packs</option>
                    <option value="sets">sets</option>
                    <option value="kits">kits</option>
                    <option value="meters">meters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={compFormData.availableStock}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCompFormData({
                        ...compFormData,
                        availableStock: val,
                        totalStock: Math.max(val, compFormData.totalStock)
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={compFormData.totalStock}
                    onChange={(e) =>
                      setCompFormData({ ...compFormData, totalStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={compFormData.minThreshold}
                    onChange={(e) =>
                      setCompFormData({ ...compFormData, minThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  What the component does (Main Function) *
                </label>
                <input
                  type="text"
                  required
                  value={compFormData.whatItDoes}
                  onChange={(e) =>
                    setCompFormData({
                      ...compFormData,
                      whatItDoes: e.target.value,
                      description: e.target.value
                    })
                  }
                  placeholder="e.g. Measures angular velocity and acceleration along 3 axes."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Photo Upload from Device OR Image URL */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Component Photo (Upload from Device or Paste URL)</span>
                  </label>
                  {compFormData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setCompFormData({ ...compFormData, imageUrl: '' })}
                      className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      Clear Photo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={compFormData.imageUrl.startsWith('data:') ? '' : compFormData.imageUrl}
                    onChange={(e) => setCompFormData({ ...compFormData, imageUrl: e.target.value })}
                    placeholder={
                      compFormData.imageUrl.startsWith('data:')
                        ? 'Uploaded photo ready (or paste URL to replace)'
                        : 'Or paste image URL (optional)...'
                    }
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />

                  <div className="w-12 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={compFormData.imageUrl || getDefaultGraphicForCategory(compFormData.category)}
                      onError={(e) => {
                        e.currentTarget.src = getDefaultGraphicForCategory(compFormData.category);
                      }}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                {!editingComp && (
                  <button
                    type="button"
                    disabled={savingComp}
                    onClick={() => submitComponentForm(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Save &amp; Add Another
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingComp}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {savingComp ? 'Saving...' : editingComp ? 'Save Part Changes' : 'Add Part to Almirah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADD MULTIPLE PARTS MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ListPlus className="w-5 h-5 text-emerald-400" />
                  <span>Bulk Add Multiple Parts</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Add multiple parts quickly at once whenever you receive or catalog new robotics club stock
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBulkParts} className="p-5 space-y-4 text-xs overflow-y-auto">
              {bulkError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                  {bulkError}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Part Name *</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5 w-20">Qty</th>
                      <th className="px-3 py-2.5 w-24">Unit</th>
                      <th className="px-3 py-2.5">What it Does</th>
                      <th className="px-2 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => {
                              const next = [...bulkRows];
                              next[index].name = e.target.value;
                              setBulkRows(next);
                            }}
                            placeholder={`Part ${index + 1} (e.g. LiPo 3S Battery)`}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.category}
                            onChange={(e) => {
                              const next = [...bulkRows];
                              next[index].category = e.target.value;
                              next[index].shelfIndex = CATEGORY_TO_SHELF[e.target.value] || 1;
                              setBulkRows(next);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            {ALMIRAH_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={row.availableStock}
                            onChange={(e) => {
                              const next = [...bulkRows];
                              next[index].availableStock = Number(e.target.value);
                              setBulkRows(next);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.unit}
                            onChange={(e) => {
                              const next = [...bulkRows];
                              next[index].unit = e.target.value;
                              setBulkRows(next);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <option value="pcs">pcs</option>
                            <option value="packs">packs</option>
                            <option value="sets">sets</option>
                            <option value="kits">kits</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.whatItDoes}
                            onChange={(e) => {
                              const next = [...bulkRows];
                              next[index].whatItDoes = e.target.value;
                              setBulkRows(next);
                            }}
                            placeholder="Short function (optional)"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {bulkRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== index))}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkRows([...bulkRows, createEmptyBulkRow()])}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Row</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBulk}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {savingBulk ? 'Saving Batch...' : 'Save All Parts'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
