import React from 'react';
import { Send, CheckCircle2, User, MapPin, ArrowRight, Layers, Compass } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const RightSidebar = ({ onGoToRequest, onOpenLocationVisualizer }) => {
  const { cartItems } = useCart();

  return (
    <aside className="space-y-6">
      
      {/* 1. Request a Component CTA Card */}
      <div className="bg-gradient-to-b from-blue-50/90 to-sky-50/60 rounded-2xl border border-blue-100 p-5 shadow-xs">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Send className="w-5 h-5 -translate-y-0.5 translate-x-0.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Request a Component</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Select a component, enter senior's number and send a permission request.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={onGoToRequest}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <span>Go to Request Page</span>
            <ArrowRight className="w-4 h-4" />
            {cartItems.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-blue-800 text-white rounded-full text-[10px]">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. How It Works? Stepper Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4">How It Works?</h3>

        <div className="space-y-5">
          
          {/* Step 1 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Select Component</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Choose the component from the list.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Enter Senior's Number</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Add the senior's contact and quantity.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Send Request</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Wait for senior's approval.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Get Location</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">After approval, component will be highlighted with coordinates.</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Example Location Format Card */}
      <div 
        onClick={onOpenLocationVisualizer}
        className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-xs hover:border-emerald-300 cursor-pointer transition-all group"
      >
        <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold mb-2">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span>Example Location Format</span>
        </div>

        <div className="mt-2 text-xs font-mono text-emerald-950/80 space-y-1">
          <p className="text-[11px]">Rack: <span className="font-bold">A</span> | Shelf: <span className="font-bold">2</span> | Box: <span className="font-bold">04</span></p>
          <p className="font-bold text-emerald-700 text-sm">
            Coordinates: (A, 2, 04)
          </p>
        </div>

        <p className="mt-2 text-[10px] text-emerald-700/80 group-hover:text-emerald-800 flex items-center space-x-1">
          <Compass className="w-3 h-3" />
          <span>Click to view interactive 3D Lab Map &rarr;</span>
        </p>
      </div>

    </aside>
  );
};
export default RightSidebar;
