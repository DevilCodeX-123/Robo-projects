import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Clock, 
  Award, 
  Users, 
  BookOpen, 
  Cpu, 
  Wrench, 
  CheckCircle2,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export const AboutView = ({ onBackHome = () => {} }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#0B132B] rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Robotics Laboratory 304</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            About Robotics Club &amp; Component Hub
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to the central hardware laboratory and digital inventory repository for our university's Robotics &amp; Automation Club.
          </p>
        </div>
      </div>

      {/* Facilities & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Electronics Almirah</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            A state-of-the-art digital cupboard housing 7 specialized shelves: Basic Electronics, Semiconductors, Microcontrollers, Sensors, Motors, Cables, and Equipment.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Senior Sign-off Protocol</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every component request is authenticated by designated senior engineering leads to ensure project feasibility, safety, and inventory accountability.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">4-Step Request Lifecycle</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated tracking from <em>Request Sent</em>, through <em>Approved by Senior</em> and <em>Component Assigned</em>, to full <em>Component Returned</em>.
          </p>
        </div>
      </div>

      {/* Lab Safety Guidelines */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Wrench className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-black text-slate-900">Laboratory 304 Safety &amp; Usage Rules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Always handle sensitive microcontrollers (ESP32, Raspberry Pi) on anti-static workbenches.</span>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Check supply voltages before powering DC and servo motors to prevent coil burnout.</span>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Return borrowed equipment to designated storage bins immediately after project milestones.</span>
          </div>
          <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Report damaged components or low stock levels promptly to the lab inventory manager.</span>
          </div>
        </div>
      </div>

      {/* Lab Contact Info */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>Room 304, Advanced Technology Building, Engineering Campus</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-slate-500" />
            <span>robotics-lab@college.edu</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Phone className="w-4 h-4 text-slate-500" />
            <span>+91 98765 43210</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutView;

