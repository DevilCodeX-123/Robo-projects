import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Box, 
  Sparkles,
  Zap
} from 'lucide-react';

export const AllComponentsView = ({ 
  components = [], 
  onSelectComponent = () => {}, 
  onBackToAlmirah = () => {} 
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('ALL');

  const categories = [
    'All',
    'Basic Electronics',
    'Semiconductors',
    'Microcontrollers',
    'Sensors',
    'Motors',
    'Cables',
    'Equipment'
  ];

  const filteredComponents = components.filter(comp => {
    const matchesSearch = !search.trim() || 
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.label.toLowerCase().includes(search.toLowerCase()) ||
      comp.category.toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCategory === 'All' || 
      comp.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStock = 
      stockFilter === 'ALL' ? true :
      stockFilter === 'IN_STOCK' ? comp.availableStock > 5 :
      stockFilter === 'LOW_STOCK' ? (comp.availableStock > 0 && comp.availableStock <= 5) :
      stockFilter === 'OUT_OF_STOCK' ? comp.availableStock === 0 : true;

    return matchesSearch && matchesCat && matchesStock;
  });

  const totalItemsCount = components.reduce((acc, c) => acc + (c.availableStock || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      
      {/* Top Header Banner */}
      <div className="bg-[#0F172A] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBackToAlmirah}
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-400 hover:text-blue-300 mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Smart Digital Almirah</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
              Lab 304 Central Inventory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Complete Robotics Components Directory
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Browse all 24 standard laboratory components, real-time stock counters, function specifications, and storage positions.
          </p>
        </div>

        {/* Stats Counters */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
            <div className="text-2xl font-black text-blue-400 font-mono">{components.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Unique Types</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
            <div className="text-2xl font-black text-emerald-400 font-mono">{totalItemsCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Total Quantity</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components by name (e.g. Resistor, Servo, Ultrasonic, Arduino)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center space-x-1.5 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Stock' },
              { id: 'IN_STOCK', label: 'Available (>5)' },
              { id: 'LOW_STOCK', label: 'Low Stock (1-5)' },
              { id: 'OUT_OF_STOCK', label: 'Out of Stock' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStockFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  stockFilter === pill.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredComponents.map((comp) => {
          const isOutOfStock = comp.availableStock === 0;
          const isLowStock = comp.availableStock > 0 && comp.availableStock <= 5;

          return (
            <div
              key={comp.key || comp._id || comp.name}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Photo Frame */}
                <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden mb-4">
                  <img
                    src={comp.photoUrl}
                    onError={(e) => {
                      if (comp.fallbackSvg && e.currentTarget.src !== comp.fallbackSvg) {
                        e.currentTarget.src = comp.fallbackSvg;
                      }
                    }}
                    alt={comp.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-xs font-mono">
                    Shelf {comp.shelfIndex || 1}
                  </span>
                  <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                    isOutOfStock ? 'bg-red-50 text-red-700 border-red-200' :
                    isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {comp.availableStock} {comp.unit || 'pcs'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                    {comp.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {comp.name}
                  </h3>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 mt-2">
                    <strong className="text-slate-800 font-semibold block text-[10px] uppercase text-blue-700 mb-0.5">Function:</strong>
                    {comp.whatItDoes || `${comp.name}: Controls electronic components according to programmed instructions.`}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onSelectComponent(comp);
                    onBackToAlmirah();
                  }}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect in Almirah</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredComponents.length === 0 && (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No matching components found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search terms or category filter to view components.
          </p>
        </div>
      )}

    </div>
  );
};

export default AllComponentsView;

