import React, { useState, useEffect } from 'react';
import { MapPin, Search, QrCode, Layers, Compass, ExternalLink, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';

const RACKS = ['A', 'B', 'C', 'D', 'E'];
const SHELVES = [1, 2, 3];
const BOXES = ['01', '02', '03', '04'];

export const LabLocationVisualizer = ({ onClose }) => {
  const [components, setComponents] = useState([]);
  const [selectedRack, setSelectedRack] = useState('A');
  const [selectedCoord, setSelectedCoord] = useState('(A,1,02)');
  const [searchComp, setSearchComp] = useState('');
  const [printComponent, setPrintComponent] = useState(null);

  useEffect(() => {
    const fetchComps = async () => {
      try {
        const res = await api.getComponents();
        if (res.success) {
          setComponents(res.components);
        }
      } catch (err) {
        console.error('Failed to load components for map:', err);
      }
    };
    fetchComps();
  }, []);

  const componentsAtCoord = (coord) => {
    return components.filter(c => c.location?.coordinates === coord);
  };

  const handleSearchSelect = (comp) => {
    if (comp.location?.rack) setSelectedRack(comp.location.rack);
    if (comp.location?.coordinates) setSelectedCoord(comp.location.coordinates);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-[#0F172A] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>Interactive Laboratory Map & Storage Navigator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lab Storage Hierarchy & QR Tags
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Physical mapping: <span className="font-mono text-emerald-300 font-bold">Lab &rarr; Room 304 &rarr; Rack &rarr; Shelf &rarr; Box &rarr; (Coords)</span>
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            &larr; Back to Dashboard
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Interactive Rack Visualizer */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          
          {/* Rack Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Rack:</span>
              <div className="flex space-x-1.5">
                {RACKS.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRack(r)}
                    className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                      selectedRack === r
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Rack {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              Robotics Lab 304 &bull; Cabinet Section {selectedRack}
            </div>
          </div>

          {/* Shelves & Storage Grid */}
          <div className="space-y-4">
            {SHELVES.map(shelfNum => (
              <div key={shelfNum} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Shelf {shelfNum}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Height: 35cm &bull; ESD Protected</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BOXES.map(boxNum => {
                    const coordString = `(${selectedRack},${shelfNum},${boxNum})`;
                    const compsHere = componentsAtCoord(coordString);
                    const isSelected = selectedCoord === coordString;

                    return (
                      <div
                        key={boxNum}
                        onClick={() => setSelectedCoord(coordString)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                            : compsHere.length > 0
                              ? 'bg-white hover:border-blue-400 text-slate-800 border-slate-200'
                              : 'bg-slate-100/60 text-slate-400 border-slate-200/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                          <span>Box {boxNum}</span>
                          <span className={isSelected ? 'text-blue-200' : 'text-slate-400'}>
                            {coordString}
                          </span>
                        </div>

                        <div className="mt-2 min-h-8">
                          {compsHere.length > 0 ? (
                            <div className="space-y-0.5">
                              {compsHere.map(c => (
                                <p key={c._id || c.id} className="font-bold truncate text-[11px]">
                                  &bull; {c.name}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-[10px] italic ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                              Empty Box
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right: Selected Coordinate Detail & Printable QR Tag */}
        <div className="space-y-6">
          
          {/* Quick Search */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Locate Any Component</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchComp}
                onChange={(e) => setSearchComp(e.target.value)}
                placeholder="Search component..."
                className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl"
              />
            </div>
            {searchComp && (
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {components.filter(c => c.name.toLowerCase().includes(searchComp.toLowerCase())).map(c => (
                  <div
                    key={c._id || c.id}
                    onClick={() => handleSearchSelect(c)}
                    className="py-1.5 hover:bg-slate-50 cursor-pointer flex justify-between"
                  >
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <span className="font-mono font-bold text-blue-600">{c.location?.coordinates}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Inspection Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Selection</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">
                {selectedCoord}
              </span>
            </div>

            {componentsAtCoord(selectedCoord).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No components currently mapped to this exact coordinate.
              </div>
            ) : (
              componentsAtCoord(selectedCoord).map(c => (
                <div key={c._id || c.id} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-slate-50"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500">Category: {c.category}</p>
                      <p className="text-xs font-bold text-emerald-700">Available: {c.availableStock} {c.unit}</p>
                    </div>
                  </div>

                  {/* High Quality Printable QR Code Sticker */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                      <QRCodeSVG
                        value={`ROBO-LAB:${c.componentCode}:${c.location?.coordinates}`}
                        size={120}
                        level="H"
                      />
                    </div>
                    <p className="font-mono font-bold text-xs text-slate-800">{c.componentCode}</p>
                    <p className="text-[11px] font-mono text-slate-500">Coordinates: {selectedCoord}</p>
                    <button
                      onClick={() => window.print()}
                      className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Lab Tag Sticker</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
export default LabLocationVisualizer;
