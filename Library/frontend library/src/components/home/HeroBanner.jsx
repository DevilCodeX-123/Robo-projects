import React from 'react';
import { Cpu, Zap, Compass, ChevronRight } from 'lucide-react';

export const HeroBanner = ({ onExploreClick }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 lg:p-12 shadow-sm border border-slate-800">
      
      {/* Decorative Technical Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="circuit-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 10 L 40 10 M 10 0 L 10 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-4 tracking-wide uppercase">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Robotics Lab Inventory</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          Find, Request, Build <br />
          <span className="text-blue-400">
            Your Ideas
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
          Explore our electronic components, request permission from seniors and get the exact location in our lab. Build something amazing!
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-2xs transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Catalog</span>
          </button>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400 pl-2">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Real-time Stock</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Lab 304 Central</span>
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Lab Graphic on the right side */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-80 h-48 rounded-xl bg-slate-950 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-mono font-medium text-slate-300">LAB_SYSTEM_STATUS</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">ONLINE</span>
          </div>
          <div className="mt-3 space-y-2 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Racks In Service:</span>
              <span className="text-white">A, B, C, D, E</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Approval Time:</span>
              <span className="text-emerald-400">&lt; 2 hrs</span>
            </div>
            <div className="flex justify-between">
              <span>Active Checkout:</span>
              <span className="text-slate-300">Titan Bot &bull; Maze Solver</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default HeroBanner;
