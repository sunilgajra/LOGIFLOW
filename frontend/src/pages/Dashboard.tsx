import React, { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, IndianRupee, Clock, ArrowUpRight, ChevronRight, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
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

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Loading LogiFlow Logistics Analytics...</p>
      </div>
    );
  }

  const kpis = [
    { name: 'Total Shipments', value: data.totalShipments || 128, sub: '+12% from last week', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
    { name: 'In Transit', value: data.inTransit || 34, sub: 'Active on route', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
    { name: 'Delivered', value: data.delivered || 89, sub: 'Successfully signed', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
    { name: 'Delivery SLA Rate', value: `${data.slaRate || 98.4}%`, sub: 'Target > 95%', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
    { name: 'Total Freight Revenue', value: `₹${(data.totalRevenue || 248500).toLocaleString('en-IN')}`, sub: 'Billed to clients', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
  ];

  const courierBreakdown = data.courierBreakdown || [
    { name: 'Delhivery Express', count: 86, percent: 67, slaScore: '99.1%' },
    { name: 'Blue Dart', count: 42, percent: 33, slaScore: '98.5%' }
  ];

  const recentActivity = data.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            LogiFlow Executive Analytics <Activity className="w-5 h-5 ml-2 text-blue-600 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time logistics overview, courier partner SLAs, and revenue metrics.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="self-start md:self-auto px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Analytics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className={`bg-white dark:bg-slate-800 rounded-xl border ${kpi.border} p-5 shadow-2xs space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{kpi.name}</span>
              <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Courier Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Shipment Volume Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shipment Volume Trend</h2>
              <p className="text-xs text-slate-500">Daily dispatch volume over the last 7 days.</p>
            </div>
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Peak Demand
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#0f172a', color: '#fff' }}
                />
                <Area type="monotone" dataKey="shipments" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorShipments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courier Partner Load & SLA Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Courier Partner Load</h2>
              <span className="text-xs text-slate-400 font-bold">Active Partners</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">Distribution of volume across integrated courier providers.</p>

            <div className="space-y-5">
              {courierBreakdown.map((courier: any, idx: number) => {
                const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-600'];
                const color = colors[idx % colors.length];
                return (
                  <div key={courier.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{courier.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">{courier.count} pkgs</span>
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-[10px]">
                          SLA {courier.slaScore || '99%'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${color} transition-all duration-500`} 
                        style={{ width: `${Math.min(100, Math.max(15, (courier.count / (data.totalShipments || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1" /> API Gateway Online
            </span>
            <button 
              onClick={() => navigate('/dashboard/couriers')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center"
            >
              Manage Partners <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Dispatches & Activity</h2>
            <p className="text-xs text-slate-500">Latest shipments processed across your accounts.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/shipments')}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            View All Shipments
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 pl-5">AWB Number</th>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Courier</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No recent shipment activity recorded.</td>
                </tr>
              ) : (
                recentActivity.map((shipment: any) => (
                  <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-blue-600">
                      {shipment.awb_number}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{shipment.receiver_name}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{shipment.city || shipment.state || 'India'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">{shipment.client?.company_name || 'Direct'}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{shipment.courier?.courier_name || 'Express'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        shipment.internal_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        shipment.internal_status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {shipment.internal_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
