import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/layout/Navbar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { StorageAlmirah } from './components/almirah/StorageAlmirah';
import { ComponentDetailAndRequestPanel } from './components/almirah/ComponentDetailAndRequestPanel';
import { CategoryFilter } from './components/home/CategoryFilter';
import { ComponentDetailsModal } from './components/modals/ComponentDetailsModal';
import { RequestDrawer } from './components/requests/RequestDrawer';
import { MyRequestsView } from './components/requests/MyRequestsView';
import { MemberDashboard } from './components/dashboard/MemberDashboard';
import { ManagementDashboard } from './components/management/ManagementDashboard';
import { SeniorApprovalView } from './components/senior/SeniorApprovalView';
import { SeniorManagementView } from './components/senior/SeniorManagementView';
import { InventoryManagerView } from './components/inventory/InventoryManagerView';
import { ProjectsView } from './components/projects/ProjectsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AdminView } from './components/admin/AdminView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { AllComponentsView } from './components/inventory/AllComponentsView';
import { AboutView } from './components/views/AboutView';
import { SettingsView } from './components/views/SettingsView';
import { UserProfileModal } from './components/views/UserProfileModal';
import { NotificationsModal } from './components/views/NotificationsModal';
import { LoginModal } from './components/auth/LoginModal';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { api } from './services/api';
import { ALMIRAH_COMPONENTS, getDefaultGraphicForCategory } from './data/componentAssets';
import { 
  Clock, 
  CheckCircle, 
  Layers, 
  ArrowRight, 
  Box, 
  Sparkles,
  Zap,
  LayoutGrid
} from 'lucide-react';

export function App() {
  const { user, role, loading: authLoading, refreshDemoAccounts } = useAuth();
  const { isRequestModalOpen, setIsRequestModalOpen } = useCart();

  const [currentView, setCurrentView] = useState('home');
  const [dbComponents, setDbComponents] = useState([]);
  const [dbRequests, setDbRequests] = useState([]);
  const [seniorsRefreshKey, setSeniorsRefreshKey] = useState(0);
  const [loadingComps, setLoadingComps] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection States
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeInspectedComponent, setActiveInspectedComponent] = useState(null);
  const [selectedComponents, setSelectedComponents] = useState([]);

  // Modals
  const [detailModalComp, setDetailModalComp] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Fetch components & requests from backend API
  const fetchDashboardData = async () => {
    try {
      setLoadingComps(true);
      const hasToken = Boolean(localStorage.getItem('robo_token'));
      const [compsRes, reqsRes] = await Promise.all([
        api.getComponents(),
        hasToken ? api.getRequests() : Promise.resolve({ success: true, requests: [] })
      ]);
      if (compsRes.success && compsRes.components) {
        setDbComponents(compsRes.components);
      }
      if (reqsRes.success && reqsRes.requests) {
        setDbRequests(reqsRes.requests);
      } else {
        setDbRequests([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingComps(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Merge live backend stock, edits, additions & deletions into Smart Almirah
  const almirahComponents = useMemo(() => {
    const matchedIds = new Set();
    const hasDbLoaded = dbComponents.length > 0;

    const normalizeShelf = (cat = '') => {
      const lower = cat.toLowerCase();
      if (lower.includes('basic') || lower.includes('passive')) return { category: 'Basic Electronics', shelfIndex: 1 };
      if (lower.includes('semi')) return { category: 'Semiconductors', shelfIndex: 2 };
      if (lower.includes('micro')) return { category: 'Microcontrollers', shelfIndex: 3 };
      if (lower.includes('sensor')) return { category: 'Sensors', shelfIndex: 4 };
      if (lower.includes('motor') || lower.includes('actuator')) return { category: 'Motors', shelfIndex: 5 };
      if (lower.includes('cable') || lower.includes('wire')) return { category: 'Cables', shelfIndex: 6 };
      return { category: 'Equipment', shelfIndex: 7 };
    };

    const isCustomImageUrl = (url = '') =>
      Boolean(url) &&
      !url.includes('photo-1518770660439') &&
      !url.includes('photo-1544716278') &&
      !url.includes('images.unsplash.com');

    const mappedAssets = ALMIRAH_COMPONENTS.map(asset => {
      const match = dbComponents.find(c => 
        (asset.matchedDbName && c.name?.toLowerCase().includes(asset.matchedDbName.toLowerCase())) ||
        c.name?.toLowerCase() === asset.name?.toLowerCase() ||
        (asset.label === 'Arduino Uno' && c.name?.toLowerCase().includes('arduino')) ||
        (asset.label === 'Resistors' && c.name?.toLowerCase().includes('resistor')) ||
        (asset.label === 'LEDs' && c.name?.toLowerCase().includes('led')) ||
        (asset.label === 'Ultrasonic Sensor' && c.name?.toLowerCase().includes('ultrasonic')) ||
        (asset.label === 'Servo Motor' && c.name?.toLowerCase().includes('servo')) ||
        (asset.label === 'Jumper Wires' && c.name?.toLowerCase().includes('wire')) ||
        (asset.label === 'Breadboards' && c.name?.toLowerCase().includes('breadboard'))
      );

      if (match) {
        matchedIds.add(String(match._id || match.id));
        const normalizedShelf = normalizeShelf(match.category || asset.category);
        return {
          ...asset,
          _id: match._id || match.id,
          name: match.name || asset.name,
          label: match.label || asset.label,
          category: normalizedShelf.category,
          shelfIndex: match.shelfIndex || normalizedShelf.shelfIndex || asset.shelfIndex,
          whatItDoes: match.whatItDoes || match.description || asset.whatItDoes,
          unit: match.unit || asset.unit,
          photoUrl: isCustomImageUrl(match.imageUrl) ? match.imageUrl : asset.photoUrl,
          availableStock: match.availableStock !== undefined ? match.availableStock : asset.availableStock,
          totalStock: match.totalStock !== undefined ? match.totalStock : asset.totalStock,
          dbRecord: match
        };
      }
      return hasDbLoaded ? null : asset;
    }).filter(Boolean);

    const extraDbComponents = dbComponents
      .filter(c => !matchedIds.has(String(c._id || c.id)))
      .filter(c => !c.name?.toLowerCase().includes('l298n'))
      .map(c => {
        const shelf = normalizeShelf(c.category);
        const graphic = getDefaultGraphicForCategory(shelf.category);
        const customImg = isCustomImageUrl(c.imageUrl) ? c.imageUrl : graphic;
        return {
          key: `db_${c._id || c.id}`,
          _id: c._id || c.id,
          label: c.label || c.name,
          name: c.name,
          category: shelf.category,
          shelfIndex: c.shelfIndex || shelf.shelfIndex,
          whatItDoes: c.whatItDoes || c.description || `${c.name}: Specialized robotics lab component.`,
          availableStock: c.availableStock ?? 0,
          totalStock: c.totalStock ?? 0,
          unit: c.unit || 'pcs',
          photoUrl: customImg,
          fallbackSvg: graphic,
          dbRecord: c
        };
      });

    return [...mappedAssets, ...extraDbComponents];
  }, [dbComponents]);

  // Keep selected components initialized and synchronized with live database IDs & stock
  useEffect(() => {
    if (loadingComps || almirahComponents.length === 0) return;

    const resolveFresh = (item) => {
      if (!item) return null;
      return (
        almirahComponents.find(
          (c) =>
            (c._id && item._id && String(c._id) === String(item._id)) ||
            (c.key && item.key && c.key === item.key) ||
            (c.name && item.name && c.name.toLowerCase() === item.name.toLowerCase()) ||
            (c.matchedDbName &&
              item.matchedDbName &&
              c.matchedDbName.toLowerCase() === item.matchedDbName.toLowerCase())
        ) || null
      );
    };

    if (!selectedComponent) {
      const defaultComp =
        almirahComponents.find((c) => c.key === 'ultrasonic') || almirahComponents[0];
      setSelectedComponent(defaultComp);
      setActiveInspectedComponent(defaultComp);
      setSelectedComponents([defaultComp]);
      return;
    }

    const foundSelected = resolveFresh(selectedComponent);
    if (foundSelected) setSelectedComponent(foundSelected);

    if (activeInspectedComponent) {
      const foundInspected = resolveFresh(activeInspectedComponent);
      if (foundInspected) setActiveInspectedComponent(foundInspected);
    }

    setSelectedComponents((prev) => {
      if (!prev || prev.length === 0) return prev;
      return prev.map((item) => resolveFresh(item) || item);
    });
  }, [almirahComponents, loadingComps]);

  // Handle Multi-Select Toggling
  const handleToggleSelectComponent = (comp) => {
    setSelectedComponents(prev => {
      const exists = prev.some(c => 
        (c._id && c._id === comp._id) || (c.key && c.key === comp.key) || (c.name === comp.name)
      );
      if (exists) {
        const next = prev.filter(c => (c._id ? c._id !== comp._id : c.key !== comp.key && c.name !== comp.name));
        return next;
      } else {
        return [...prev, comp];
      }
    });
  };

  const handleSelectComponent = (comp) => {
    setSelectedComponent(comp);
    setActiveInspectedComponent(comp);
    // If list doesn't have it, add it
    setSelectedComponents(prev => {
      const exists = prev.some(c => 
        (c._id && c._id === comp._id) || (c.key && c.key === comp.key) || (c.name === comp.name)
      );
      if (!exists) {
        return [...prev, comp];
      }
      return prev;
    });
  };

  // Requirement 1 Stat Counters
  const pendingRequestsCount = dbRequests.filter(r => 
    ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status)
  ).length;

  const approvedTodayCount = dbRequests.filter(r => 
    ['APPROVED', 'READY_FOR_PICKUP', 'ISSUED'].includes(r.status)
  ).length;

  const totalStockQuantity = almirahComponents.reduce((acc, c) => acc + (c.availableStock || 0), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide font-mono">Initializing Robotics Club System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. Dark Navy Top Navigation Bar (Requirement 1 & 10) */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Layout Shell: Dark Navy Left Sidebar + Main Content Area */}
      <div className="flex-1 flex min-w-0">
        
        {/* 2. Dark Navy Left Sidebar (Requirement 1 & 10) */}
        <LeftSidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        />

        {/* Centre & Right Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* =========================================================================
              VIEW: HOME (DASHBOARD & DIGITAL ALMIRAH - REQUIREMENTS 1, 2, 3, 4, 5)
             ========================================================================= */}
          {currentView === 'home' && (
            <div className="max-w-[1600px] mx-auto space-y-6">
              
              {/* Welcome Heading & Search Bar (Requirement 1 & 2) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Welcome, {user?.fullName || 'Student'} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Professional Robotics Club Component Management System &bull; Lab 304 Central Repository
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      <span>Lab 304 Storage Hub</span>
                    </span>
                  </div>
                </div>

                {/* =========================================================================
                    REQUIREMENT 1: DASHBOARD STATS METRICS BAR
                    - Pending Requests count
                    - Approved Today count
                    - Components Inventory section
                    - View All Components option
                   ========================================================================= */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2 border-t border-slate-100">
                  
                  {/* Metric 1: Pending Requests count */}
                  <div 
                    onClick={() => setCurrentView('my-requests')}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Pending Requests
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                        {pendingRequestsCount}
                      </span>
                      <span className="text-[11px] text-slate-500">Awaiting sign-off</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metric 2: Approved Today count */}
                  <div 
                    onClick={() => setCurrentView('my-requests')}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Approved Today
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                        {approvedTodayCount}
                      </span>
                      <span className="text-[11px] text-slate-500">Authorized requests</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metric 3: Components Inventory section */}
                  <div 
                    onClick={() => setCurrentView('components')}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Inventory Types
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {almirahComponents.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">types</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {totalStockQuantity} total units
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      <Box className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metric 4: View All Components option */}
                  <div 
                    onClick={() => setCurrentView('components')}
                    className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Catalog Directory
                      </span>
                      <div className="text-sm font-bold text-white mt-1 group-hover:text-blue-300 transition-colors flex items-center space-x-1">
                        <span>View All Components</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-[11px] text-slate-400">Complete laboratory list</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                  </div>

                </div>

                {/* Search Bar & Category Filter Chips (Requirement 1 & 3) */}
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>

              {/* Main Almirah & Right Panel Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Centre-Left Area: Large Realistic Electronics Component Storage Almirah (Requirement 2 & 3) */}
                <div className="xl:col-span-7 2xl:col-span-8">
                  <StorageAlmirah
                    components={almirahComponents}
                    selectedComponent={selectedComponent}
                    activeInspectedComponent={activeInspectedComponent}
                    selectedComponents={selectedComponents}
                    onSelectComponent={handleSelectComponent}
                    onInspectComponent={setActiveInspectedComponent}
                    onToggleSelectComponent={handleToggleSelectComponent}
                    onClearSelection={() => setSelectedComponents([])}
                    onViewAllComponents={() => setCurrentView('components')}
                    onResetFilters={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                  />
                </div>

                {/* Right Side Area: Component Work Feature & Permission Request (Requirements 3, 4, 5) */}
                <div className="xl:col-span-5 2xl:col-span-4">
                  <ComponentDetailAndRequestPanel
                    selectedComponent={activeInspectedComponent || selectedComponent}
                    selectedComponents={selectedComponents}
                    seniorsRefreshKey={seniorsRefreshKey}
                    onRemoveComponent={(comp) => {
                      setSelectedComponents(prev => prev.filter(c => 
                        (c._id ? c._id !== comp._id : c.key !== comp.key && c.name !== comp.name)
                      ));
                    }}
                    onRequestSuccess={() => {
                      fetchDashboardData();
                    }}
                    onNavigateToRequests={() => setCurrentView('my-requests')}
                    onNavigateToSeniorManagement={() => setCurrentView('senior-management')}
                  />
                </div>

              </div>

            </div>
          )}

          {/* VIEW: All Components Catalog Grid (Requirement 1 & 10) */}
          {currentView === 'components' && (
            <AllComponentsView
              components={almirahComponents}
              onSelectComponent={(comp) => {
                handleSelectComponent(comp);
                setCurrentView('home');
              }}
              onBackToAlmirah={() => setCurrentView('home')}
            />
          )}

          {/* VIEW: My Requests with 4-Step Progress Timeline (Requirements 7 & 8) */}
          {currentView === 'my-requests' && (
            <MyRequestsView 
              onBackHome={() => setCurrentView('home')} 
              onRefreshData={fetchDashboardData}
            />
          )}

          {/* VIEW: Senior Management System (Add, Edit, Delete, Search Seniors) */}
          {currentView === 'senior-management' && (
            <SeniorManagementView
              onSeniorsUpdated={() => {
                setSeniorsRefreshKey(k => k + 1);
                refreshDemoAccounts();
                fetchDashboardData();
              }}
            />
          )}

          {/* VIEW: Unified Shared Management Dashboard for Admin and Senior (Requirements 1-5) */}
          {(currentView === 'management-dashboard' || currentView === 'senior-portal' || currentView === 'admin-portal') && (
            <ManagementDashboard
              onRefreshData={fetchDashboardData}
              defaultTab={currentView === 'senior-portal' ? 'requests' : 'overview'}
            />
          )}

          {/* VIEW: About Robotics Lab 304 (Requirement 10) */}
          {currentView === 'about' && (
            <AboutView onBackHome={() => setCurrentView('home')} />
          )}

          {/* VIEW: Settings & Notification Preferences (Requirements 9 & 10) */}
          {currentView === 'settings' && (
            <SettingsView />
          )}

          {/* VIEW: Member Dashboard */}
          {currentView === 'dashboard' && (
            <MemberDashboard onNavigate={(v) => setCurrentView(v)} />
          )}

          {/* VIEW: Inventory Manager Portal */}
          {currentView === 'inventory-portal' && (
            <InventoryManagerView onRefreshData={fetchDashboardData} />
          )}

          {/* VIEW: Club Projects */}
          {currentView === 'projects' && (
            <ProjectsView />
          )}

          {/* VIEW: Analytics & Reports */}
          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {/* VIEW: Equipment Maintenance */}
          {currentView === 'maintenance' && (
            <MaintenanceView />
          )}

        </main>
      </div>

      {/* Component Details Modal (if needed for expanded view) */}
      {detailModalComp && (
        <ComponentDetailsModal
          component={detailModalComp}
          onClose={() => setDetailModalComp(null)}
        />
      )}

      {/* Multi-Component Request Drawer */}
      <RequestDrawer
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
          setCurrentView('my-requests');
        }}
      />

      {/* Requirement 10: User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Requirements 9 & 10: Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onNavigateToRequests={() => {
          setIsNotificationsModalOpen(false);
          setCurrentView('my-requests');
        }}
      />

      {/* Account Login / Registration / Switch Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || (!authLoading && !user)}
        onClose={() => setIsLoginModalOpen(false)}
        allowDismiss={Boolean(user)}
        onAuthSuccess={(loggedUser) => {
          const r = String(loggedUser?.role || '').toUpperCase();
          if (r === 'ADMIN' || r === 'SENIOR') setCurrentView('management-dashboard');
          else setCurrentView('dashboard');
        }}
      />

      {/* Footer */}
      <footer className="bg-[#0F172A] border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">Robotics Club</span>
            <span>&bull; Component Management System &bull; Lab 304 Central</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <button onClick={() => setCurrentView('home')} className="hover:text-white transition-colors">Storage Almirah</button>
            <button onClick={() => setCurrentView('components')} className="hover:text-white transition-colors">Components</button>
            <button onClick={() => setCurrentView('my-requests')} className="hover:text-white transition-colors">My Requests</button>
            <button onClick={() => setCurrentView('about')} className="hover:text-white transition-colors">About</button>
            <button onClick={() => setCurrentView('settings')} className="hover:text-white transition-colors">Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
