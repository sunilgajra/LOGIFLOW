import React from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { name: 'Total Shipments', value: '45,231', change: '+12%', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'In Transit', value: '1,204', change: '+4%', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Delivered (This Month)', value: '12,492', change: '+18%', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Exceptions / RTO', value: '184', change: '-2%', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className="text-sm text-slate-500">Last updated: Just now</div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              <p className={`text-xs mt-1 font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change} from last month
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview - Placeholder for Recharts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Revenue & Profit Overview</h2>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View Details</button>
          </div>
          <div className="h-72 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
            <p className="text-slate-400 font-medium">Chart visualization coming soon (Phase 4)</p>
          </div>
        </div>

        {/* Courier Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Courier Performance</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Blue Dart</span>
                <span className="text-emerald-600 font-medium">96% Delivery Rate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Delhivery</span>
                <span className="text-emerald-600 font-medium">92% Delivery Rate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">DHL</span>
                <span className="text-emerald-600 font-medium">98% Delivery Rate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
