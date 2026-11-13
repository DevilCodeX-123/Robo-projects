import React from 'react';
import { MapPin, Plus, Check, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ComponentCard = ({ component, onViewDetails }) => {
  const { addToCart, cartItems } = useCart();

  const isAvailable = component.availableStock > 0;
  const inCartItem = cartItems.find(item => (item.component._id || item.component.id) === (component._id || component.id));
  const inCartQty = inCartItem ? inCartItem.quantity : 0;

  const handleRequestClick = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(component, 1);
  };

  return (
    <div 
      onClick={() => onViewDetails(component)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 p-4 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
    >
      {/* Top Image Container */}
      <div>
        <div className="relative aspect-[4/3] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-2 group-hover:bg-blue-50/20 transition-colors">
          <img
            src={component.imageUrl}
            alt={component.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {component.category && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 shadow-xs">
              {component.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
          {component.name}
        </h3>

        {/* Status Indicators: Quantity & Coords */}
        <div className="mt-2 space-y-1.5 text-xs">
          
          {/* Quantity Badge */}
          <div className="flex items-center space-x-2">
            <span 
              className={`w-2 h-2 rounded-full ${
                isAvailable ? 'bg-emerald-500' : 'bg-red-500'
              }`} 
            />
            <span className="font-medium text-slate-700">
              Quantity: <span className={isAvailable ? 'font-bold text-slate-900' : 'text-red-500 font-semibold'}>
                {component.availableStock}
              </span>
              {component.unit && <span className="text-[11px] text-slate-400 ml-1">{component.unit}</span>}
            </span>
          </div>

          {/* Coordinates Tag */}
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span>
              Coords: <span className="font-mono text-slate-800 font-semibold">{component.location?.coordinates || '(A,1,01)'}</span>
            </span>
          </div>

        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-2">
        <button
          onClick={handleRequestClick}
          disabled={!isAvailable}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all ${
            isAvailable
              ? inCartQty > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {inCartQty > 0 ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>In Request List ({inCartQty})</span>
            </>
          ) : isAvailable ? (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Request</span>
            </>
          ) : (
            <span>Out of Stock</span>
          )}
        </button>
      </div>

    </div>
  );
};
export default ComponentCard;
