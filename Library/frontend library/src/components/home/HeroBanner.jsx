import React from 'react';
import { Cpu, Zap, Compass, ChevronRight } from 'lucide-react';

export const HeroBanner = ({ onExploreClick }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0D1F4D] to-[#0A1128] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
      
      {/* Decorative Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="circuit-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 10 10 L 30 10 L 40 20 L 70 20 M 20 40 L 40 40 L 50 50 L 70 50 M 10 70 L 30 70 L 40 60 L 70 60" fill="none" stroke="#60a5fa" strokeWidth="1" />
            <circle cx="10" cy="10" r="2" fill="#60a5fa" />
            <circle cx="70" cy="20" r="2" fill="#60a5fa" />
            <circle cx="20" cy="40" r="2" fill="#60a5fa" />
            <circle cx="70" cy="50" r="2" fill="#60a5fa" />
            <circle cx="10" cy="70" r="2" fill="#60a5fa" />
            <circle cx="70" cy="60" r="2" fill="#60a5fa" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
      </div>

      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4 tracking-wide uppercase">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Robotics Lab Inventory</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          Find, Request, Build <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Your Ideas
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
          Explore our electronic components, request permission from seniors and get the exact location in our lab. Build something amazing!
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Catalog</span>
          </button>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400 pl-2">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Stock</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Coordinate Tagged</span>
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Lab Graphic on the right side */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-80 h-48 rounded-xl bg-gradient-to-tr from-slate-900/90 to-blue-950/80 border border-slate-700/60 p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-medium text-slate-200">LAB_SYSTEM_STATUS</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">ONLINE</span>
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
              <span className="text-cyan-300">Titan Bot &bull; Maze Solver</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default HeroBanner;
