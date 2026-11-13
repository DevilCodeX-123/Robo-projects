import React, { useState } from 'react';
import { X, ExternalLink, MapPin, Box, QrCode, Shield, Check, Plus, Minus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../../context/CartContext';

export const ComponentDetailsModal = ({ component, onClose }) => {
  const { addToCart } = useCart();
  const [requestQty, setRequestQty] = useState(1);
  const [showQR, setShowQR] = useState(false);

  if (!component) return null;

  const isAvailable = component.availableStock > 0;

  const handleAdd = () => {
    addToCart(component, requestQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700">
                {component.componentCode || 'CMP-001'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {component.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{component.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center">
              <img
                src={component.imageUrl}
                alt={component.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Quick Specs & Stock Breakdown */}
            <div className="space-y-4">
              
              {/* Storage Almirah Badge */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span>Storage Almirah Hub &bull; Unit 01</span>
                </div>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p><span className="text-blue-700 font-semibold">Location:</span> Robotics Lab 304 Central</p>
                  <p><span className="text-blue-700 font-semibold">Category:</span> {component.category || 'Component'}</p>
                </div>
              </div>

              {/* Stock Inventory Counter */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-medium">Available</p>
                  <p className="text-lg font-bold text-emerald-700">{component.availableStock}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                  <p className="text-[10px] text-amber-600 font-medium">Reserved</p>
                  <p className="text-lg font-bold text-amber-700">{component.reservedStock || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-medium">Issued</p>
                  <p className="text-lg font-bold text-blue-700">{component.issuedStock || 0}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {component.description}
            </p>
          </div>

          {/* Technical Specifications */}
          {component.technicalSpecs && Object.keys(component.technicalSpecs).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Technical Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(component.technicalSpecs).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500">{key}:</span> <span className="font-semibold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code and Datasheet Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {component.datasheetUrl && (
              <a
                href={component.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Manufacturer Datasheet</span>
              </a>
            )}

            <button
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>{showQR ? 'Hide QR Code' : 'View Component QR Tag'}</span>
            </button>
          </div>

          {/* Embedded QR Code View */}
          {showQR && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                <QRCodeSVG
                  value={`ROBO-LAB:${component.componentCode || component._id}:${component.name}`}
                  size={140}
                  level="H"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-500">
                Component Tag: {component.componentCode || 'CMP-001'} &bull; Lab 304
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer / Cart Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-600">Quantity to Request:</span>
            <div className="flex items-center space-x-2 border border-slate-300 rounded-lg bg-white px-2 py-1">
              <button
                onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                className="text-slate-500 hover:text-slate-800 disabled:opacity-40"
                disabled={requestQty <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs w-6 text-center">{requestQty}</span>
              <button
                onClick={() => setRequestQty(Math.min(component.availableStock, requestQty + 1))}
                className="text-slate-500 hover:text-slate-800 disabled:opacity-40"
                disabled={requestQty >= component.availableStock}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all ${
                isAvailable
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add to Request List</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ComponentDetailsModal;
