import React, { useState } from 'react';
import {
  Box,
  Cpu,
  Layers,
  Wrench,
  Cable,
  Radio,
  Zap,
  Check,
  Plus,
  Lightbulb,
  DoorOpen,
  Lock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const StorageAlmirah = ({
  components = [],
  selectedComponent = null,
  selectedComponents = [],
  onSelectComponent = () => {},
  onToggleSelectComponent = () => {},
  onClearSelection = () => {},
  activeInspectedComponent = null,
  onInspectComponent = () => {},
  onViewAllComponents = () => {},
  onResetFilters = () => {},
  searchQuery = '',
  selectedCategory = 'All'
}) => {
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [ledLightOn, setLedLightOn] = useState(true);

  const currentInspected = activeInspectedComponent || selectedComponent;
  const currentSelectedList =
    selectedComponents.length > 0
      ? selectedComponents
      : selectedComponent
        ? [selectedComponent]
        : [];

  // 7 Realistic laboratory shelves matching all required robotics categories
  const shelves = [
    {
      index: 1,
      title: 'BASIC ELECTRONICS',
      category: 'Basic Electronics',
      icon: Zap,
      accent: 'text-amber-400'
    },
    {
      index: 2,
      title: 'SEMICONDUCTORS',
      category: 'Semiconductors',
      icon: Cpu,
      accent: 'text-sky-400'
    },
    {
      index: 3,
      title: 'MICROCONTROLLERS',
      category: 'Microcontrollers',
      icon: Box,
      accent: 'text-blue-400'
    },
    {
      index: 4,
      title: 'SENSORS',
      category: 'Sensors',
      icon: Radio,
      accent: 'text-emerald-400'
    },
    {
      index: 5,
      title: 'MOTORS',
      category: 'Motors',
      icon: Layers,
      accent: 'text-orange-400'
    },
    {
      index: 6,
      title: 'CABLES',
      category: 'Cables',
      icon: Cable,
      accent: 'text-indigo-400'
    },
    {
      index: 7,
      title: 'TOOLS & EQUIPMENT',
      category: 'Equipment',
      icon: Wrench,
      accent: 'text-slate-300'
    }
  ];

  const isMatchedByFilter = (comp) => {
    if (!comp) return false;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (comp.name || '').toLowerCase().includes(q) ||
      (comp.label || '').toLowerCase().includes(q) ||
      (comp.category || '').toLowerCase().includes(q) ||
      (comp.whatItDoes || '').toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All' ||
      (comp.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  };

  const isSelected = (comp) =>
    currentSelectedList.some(
      (c) =>
        (c.key && comp.key && c.key === comp.key) ||
        (c._id && comp._id && c._id === comp._id) ||
        c.name === comp.name
    );

  const isInspected = (comp) => {
    if (!currentInspected) return false;
    return (
      (currentInspected.key && comp.key && currentInspected.key === comp.key) ||
      (currentInspected._id && comp._id && currentInspected._id === comp._id) ||
      currentInspected.name === comp.name
    );
  };

  const visibleShelves = shelves.filter((shelf) => {
    if (
      selectedCategory !== 'All' &&
      selectedCategory.toLowerCase() !== shelf.category.toLowerCase()
    ) {
      return false;
    }
    const shelfComps = components.filter(
      (c) =>
        (c.category || '').toLowerCase() === shelf.category.toLowerCase() ||
        c.shelfIndex === shelf.index
    );
    if (!searchQuery.trim()) return shelfComps.length > 0;
    return shelfComps.some((c) => isMatchedByFilter(c));
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
      {/* =========================================================================
          TOP HEADER BAR: "Components Inventory" + Smart Almirah Controls + View All
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Components Inventory
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Smart Digital Almirah</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Click any transparent storage box to inspect function or multi-select for request
            </p>
          </div>
        </div>

        {/* Interactive Smart Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedComponents.length > 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
              <span>{selectedComponents.length} selected</span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[10px] text-blue-600 hover:text-blue-900 underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setLedLightOn((prev) => !prev)}
            title="Toggle Almirah Cabinet LED Light"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              ledLightOn
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${ledLightOn ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{ledLightOn ? 'LED On' : 'LED Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDoorsOpen((prev) => !prev)}
            title="Open / Close Smart Almirah Doors"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              doorsOpen
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-900 text-white border-slate-900'
            }`}
          >
            {doorsOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{doorsOpen ? 'Close Doors' : 'Open Almirah'}</span>
          </button>

          <button
            type="button"
            onClick={onViewAllComponents}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          PHYSICAL CUPBOARD SHELL WITH OPEN WOODEN DOORS & DARK STEEL CHASSIS
         ========================================================================= */}
      <div className="relative flex items-stretch justify-center pt-1 pb-4">
        {/* LEFT OPEN INDUSTRIAL CABINET DOOR (visible on desktop when doors are open) */}
        <div
          className={`hidden md:flex flex-col justify-between w-9 lg:w-12 shrink-0 rounded-l-xl border-2 border-slate-700 shadow-xl transition-all duration-500 origin-right relative overflow-hidden ${
            doorsOpen ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 border-0 overflow-hidden'
          }`}
          style={{
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)'
          }}
        >
          {/* Bevel */}
          <div className="m-1.5 flex-1 rounded-md border border-slate-600/50 bg-black/10 shadow-inner flex items-center justify-end pr-1">
            {/* Matte Aluminum Pull Handle */}
            <div className="w-1.5 h-16 rounded-full bg-slate-300 border border-slate-500 shadow-md" />
          </div>
          {/* Door Hinges */}
          <div className="absolute top-8 right-0 w-2 h-5 bg-slate-600 rounded-l-sm border-y border-slate-500" />
          <div className="absolute bottom-8 right-0 w-2 h-5 bg-slate-600 rounded-l-sm border-y border-slate-500" />
        </div>

        {/* MAIN STEEL ALMIRAH CABINET BODY */}
        <div className="flex-1 min-w-0 relative">
          <div className="relative rounded-xl md:rounded-none bg-slate-950 border-[5px] border-slate-800 shadow-2xl overflow-hidden">
            {/* Top Interior LED Cabinet Light Strip */}
            <div
              className={`h-2 w-full transition-all duration-500 ${
                ledLightOn
                  ? 'bg-gradient-to-r from-slate-200/90 via-white to-slate-200/90 shadow-[0_2px_12px_rgba(255,255,255,0.35)]'
                  : 'bg-slate-800'
              }`}
            />

            {/* Closed Doors Overlay (when user clicks "Close Doors") */}
            {!doorsOpen ? (
              <div
                className="min-h-[460px] flex flex-col items-center justify-center p-8 text-center relative"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #1e293b 0px, #334155 48%, #0f172a 50%, #334155 52%, #1e293b 100%)'
                }}
              >
                <div className="absolute inset-y-4 left-4 right-[51%] border-2 border-slate-600/30 rounded-lg pointer-events-none" />
                <div className="absolute inset-y-4 left-[51%] right-4 border-2 border-slate-600/30 rounded-lg pointer-events-none" />

                <div className="relative z-10 bg-slate-900/95 text-white p-6 rounded-2xl border border-slate-700 shadow-2xl max-w-sm space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center mx-auto text-blue-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black tracking-wide">
                    Smart Almirah Doors Closed
                  </h3>
                  <p className="text-xs text-slate-300">
                    Unit 01 &bull; 7 Categorized Electronics Shelves Secured
                  </p>
                  <button
                    type="button"
                    onClick={() => setDoorsOpen(true)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>Open Almirah Doors</span>
                  </button>
                </div>
              </div>
            ) : (
              /* OPEN INTERIOR SHELVES & TRANSPARENT PLASTIC STORAGE BINS */
              <div
                className={`p-3 sm:p-4 lg:p-5 space-y-5 relative transition-all duration-500 ${
                  ledLightOn ? 'bg-slate-900/90' : 'bg-slate-950'
                }`}
              >
                {/* Left & Right Internal Shelf Peg Rails */}
                <div className="hidden sm:block absolute inset-y-0 left-1 w-1.5 border-r border-slate-700/60 bg-slate-900/60 pointer-events-none" />
                <div className="hidden sm:block absolute inset-y-0 right-1 w-1.5 border-l border-slate-700/60 bg-slate-900/60 pointer-events-none" />

                {visibleShelves.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <p className="text-sm font-bold text-slate-300">
                      No components found matching "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Search &amp; Filters</span>
                    </button>
                  </div>
                ) : (
                  visibleShelves.map((shelf) => {
                    const shelfComps = components
                      .filter(
                        (c) =>
                          (c.category || '').toLowerCase() === shelf.category.toLowerCase() ||
                          c.shelfIndex === shelf.index
                      )
                      .filter((c) => (!searchQuery.trim() ? true : isMatchedByFilter(c)));

                    const ShelfIcon = shelf.icon;

                    return (
                      <div key={shelf.index} className="space-y-2.5">
                        {/* Shelf Category Divider Strip */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                              <ShelfIcon className={`w-3 h-3 ${shelf.accent}`} />
                            </span>
                            <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase font-mono">
                              {shelf.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {shelfComps.length} {shelfComps.length === 1 ? 'box' : 'boxes'}
                          </span>
                        </div>

                        {/* Transparent Plastic Storage Boxes Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3 relative z-10 px-0.5">
                          {shelfComps.map((comp) => {
                            const selected = isSelected(comp);
                            const inspected = isInspected(comp);
                            const qty = comp.availableStock ?? 0;

                            return (
                              <div
                                key={comp.key || comp._id || comp.name}
                                onClick={() => {
                                  onInspectComponent(comp);
                                  onSelectComponent(comp);
                                }}
                                title={`${comp.name} — ${qty} ${comp.unit || 'pcs'} available`}
                                className={`group relative rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between overflow-hidden select-none ${
                                  inspected
                                    ? 'ring-2 ring-blue-500 border border-blue-500 bg-slate-900 shadow-md -translate-y-0.5'
                                    : selected
                                      ? 'ring-2 ring-emerald-500 border border-emerald-500 bg-slate-900 shadow-md -translate-y-0.5'
                                      : 'border border-slate-700/80 bg-slate-900/90 hover:border-slate-500 hover:bg-slate-850 shadow-2xs'
                                }`}
                              >
                                {/* Molded Plastic Box Top Rim Lip */}
                                <div className="h-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between px-2">
                                  <div className="w-8 h-0.5 rounded-full bg-slate-600 mx-auto" />
                                </div>

                                {/* Top Badges: Stock Qty Pill + Multi-Select Toggle */}
                                <div className="px-2 pt-1.5 flex items-center justify-between gap-1 z-10">
                                  <span
                                    className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold border backdrop-blur-xs ${
                                      qty > 3
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                        : qty > 0
                                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                          : 'bg-red-950/85 text-red-300 border-red-500/40'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        qty > 3 ? 'bg-emerald-400' : qty > 0 ? 'bg-amber-400' : 'bg-red-400'
                                      }`}
                                    />
                                    <span>{qty}</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleSelectComponent(comp);
                                      onInspectComponent(comp);
                                    }}
                                    aria-label={`Toggle select ${comp.label || comp.name}`}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                                      selected
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-900/70 text-slate-300 hover:bg-blue-600 hover:text-white border border-white/20'
                                    }`}
                                  >
                                    {selected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                  </button>
                                </div>

                                {/* Component Graphic Inside Transparent Box */}
                                <div className="px-2.5 py-1.5 flex-1 flex items-center justify-center">
                                  <div className="w-full aspect-[16/10] rounded-lg bg-white/90 p-1.5 shadow-inner border border-white/60 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                    <img
                                      src={comp.photoUrl}
                                      onError={(e) => {
                                        if (comp.fallbackSvg && e.currentTarget.src !== comp.fallbackSvg) {
                                          e.currentTarget.src = comp.fallbackSvg;
                                        }
                                      }}
                                      alt={comp.name}
                                      className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                                    />
                                  </div>
                                </div>

                                {/* Front Printed Bin Sticker Label (matches reference image) */}
                                <div className="px-2 pb-2 pt-0.5">
                                  <div className="bg-white rounded-md px-2 py-1 border border-slate-300 shadow-2xs text-center">
                                    <div className="text-[11px] font-extrabold text-slate-900 tracking-tight truncate group-hover:text-blue-700 transition-colors">
                                      {comp.label || comp.name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Heavy-Duty Steel & Wood-Trimmed Shelf Plank */}
                        <div className="h-3 rounded-xs bg-gradient-to-r from-[#2c3442] via-[#4a5568] to-[#2c3442] border-t border-slate-400/50 shadow-[0_6px_12px_rgba(0,0,0,0.65)] relative flex items-center justify-between px-4">
                          <div className="h-0.5 w-14 bg-white/15 rounded-full" />
                          <div className="h-0.5 w-20 bg-white/15 rounded-full" />
                          <div className="h-0.5 w-14 bg-white/15 rounded-full" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Sturdy Cabinet Legs / Base */}
          <div className="flex items-center justify-between px-4">
            <div className="w-8 h-2.5 rounded-b-md bg-slate-800 border-x border-b border-slate-700 shadow-md" />
            <div className="text-[10px] font-mono text-slate-400 pt-1">
              Lab 304 Smart Digital Almirah &bull; {components.length} Compartments
            </div>
            <div className="w-8 h-2.5 rounded-b-md bg-slate-800 border-x border-b border-slate-700 shadow-md" />
          </div>
        </div>

        {/* RIGHT OPEN WOODEN CABINET DOOR (visible on desktop when doors are open) */}
        <div
          className={`hidden md:flex flex-col justify-between w-9 lg:w-12 shrink-0 rounded-r-xl border-2 border-[#7c4a21] shadow-xl transition-all duration-500 origin-left relative overflow-hidden ${
            doorsOpen ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 border-0 overflow-hidden'
          }`}
          style={{
            background: 'linear-gradient(225deg, #c98c50 0%, #b37338 45%, #8f5623 100%)'
          }}
        >
          {/* Wood panel bevel */}
          <div className="m-1.5 flex-1 rounded-md border border-[#e0a870]/40 bg-black/5 shadow-inner flex items-center justify-start pl-1">
            {/* Silver Metal Pull Handle */}
            <div className="w-1.5 h-16 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 border border-slate-700 shadow-md" />
          </div>
          {/* Door Hinges */}
          <div className="absolute top-8 left-0 w-2 h-5 bg-slate-700 rounded-r-sm border-y border-slate-500" />
          <div className="absolute bottom-8 left-0 w-2 h-5 bg-slate-700 rounded-r-sm border-y border-slate-500" />
        </div>
      </div>
    </div>
  );
};

export default StorageAlmirah;
