import React, { useEffect, useState } from 'react';
import { Package, Truck, AlertCircle, PlusCircle, Calculator, BookOpen, HelpCircle, ChevronRight, Info, CheckCircle2, ArrowRight, RefreshCw, Calendar } from 'lucide-react';
import { fetchApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/analytics');
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const userName = user?.first_name ? user.first_name.toUpperCase() : 'POOJA';

  const awaitingPickupCount = data?.awaitingPickup || 2;
  const inTransitCount = data?.inTransit || 111;
  const exceptionsCount = data?.exceptions || 29;

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-800 dark:text-slate-200 max-w-7xl mx-auto">
      
      {/* Top Greeting */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Hi, {userName}
        </h1>
        <button 
          onClick={fetchDashboardData}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Top Main Section: Actions | Shortcuts | Knowledge Base & Rate Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Box: Actions (Awaiting Pickup, In Transit, Exceptions) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Truck className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">Actions</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-1">
            
            {/* Awaiting Pickup (Manifested Orders) */}
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{awaitingPickupCount}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 leading-tight">Awaiting Pickup</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/shipments?status=MANIFESTED')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center cursor-pointer"
              >
                View
              </button>
            </div>

            {/* In Transit */}
            <div className="space-y-3 border-l border-slate-100 dark:border-slate-700 pl-4">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{inTransitCount}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 leading-tight">In Transit</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/shipments?status=IN_TRANSIT')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                View
              </button>
            </div>

            {/* Exceptions */}
            <div className="space-y-3 border-l border-slate-100 dark:border-slate-700 pl-4">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{exceptionsCount}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 leading-tight">Exceptions</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/ndr')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                Act Now
              </button>
            </div>

          </div>
        </div>

        {/* Middle Box: Shortcuts (Create New Order, Create New Pickup) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Package className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">Shortcuts</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            
            <button
              onClick={() => navigate('/dashboard/shipments')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all flex flex-col items-center justify-center text-center space-y-2 group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 text-indigo-600 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Create New Order</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/pickups')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all flex flex-col items-center justify-center text-center space-y-2 group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 text-indigo-600 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Create New Pickup</span>
            </button>

          </div>
        </div>

        {/* Right Cards: Knowledge Base & Rate Calculator */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3">
          
          <div 
            onClick={() => navigate('/dashboard/support')}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center space-x-3 cursor-pointer hover:border-indigo-500 transition-all"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Knowledge Base</h3>
              <p className="text-[10px] text-slate-400">Guides & Help</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/dashboard/calculator')}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center space-x-3 cursor-pointer hover:border-indigo-500 transition-all"
          >
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Rate Calculator</h3>
              <p className="text-[10px] text-slate-400">Check Shipping Rates</p>
            </div>
          </div>

        </div>

      </div>

      {/* Upcoming Pickups Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">Upcoming Pickups</h2>
          </div>
          <button 
            onClick={() => navigate('/dashboard/pickups')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
          >
            View All &gt;
          </button>
        </div>

        {/* Pickup Location Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          
          {/* Card 1: 249402 - PROSTARM INFO */}
          <div className="bg-indigo-50/40 dark:bg-slate-900/60 rounded-2xl p-4 border border-indigo-100 dark:border-slate-700 relative space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  249402 - PROSTARM INFO
                </h3>
                <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium mt-1">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Today</span>
                  <span>·</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">10 AWBs</span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                1st Pickup
              </span>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Out For Pickup
              </span>
            </div>
          </div>

          {/* Card 2: Avenue Supermarts Ltd - Haryana */}
          <div className="bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 relative space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Avenue Supermarts Ltd - Haryana
                </h3>
                <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium mt-1">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Today</span>
                  <span>·</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">2 AWBs</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Out For Pickup
              </span>
            </div>
          </div>

        </div>

        {/* Guidelines Info Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Your pickup will happen during the selected time slot. Check <button onClick={() => navigate('/dashboard/support')} className="text-indigo-600 font-bold hover:underline">guidelines</button> to keep your shipment ready for pickup.
          </span>
        </div>

      </div>

      {/* Floating Help Center Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => navigate('/dashboard/support')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs transition-transform hover:scale-105 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Help Center</span>
        </button>
      </div>

    </div>
  );
}
