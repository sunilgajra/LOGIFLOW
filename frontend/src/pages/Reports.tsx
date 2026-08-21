import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, RefreshCw, Package, CheckCircle, Clock, AlertTriangle, Truck, MapPin, IndianRupee } from 'lucide-react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  const [clients, setClients] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      loadClients();
    }
  }, [user]);

  useEffect(() => {
    loadMonthlyReport();
  }, [selectedMonth, selectedYear, selectedClient]);

  const loadClients = async () => {
    try {
      const data = await fetchApi('/clients');
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (e) {
      console.error('Failed to load clients list:', e);
    }
  };

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      let query = `/analytics/monthly-report?month=${selectedMonth}&year=${selectedYear}`;
      if (selectedClient) {
        query += `&clientId=${selectedClient}`;
      }
      const data = await fetchApi(query);
      setReportData(data);
    } catch (e) {
      console.error('Failed to load monthly report:', e);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.shipments) return;

    const headers = ['AWB Number', 'Booking Date', 'Recipient', 'City', 'State', 'Status', 'Weight (kg)', 'Client Charge (INR)'];
    const rows = reportData.shipments.map((s: any) => [
      `"${s.awb_number || ''}"`,
      `"${s.booking_date ? new Date(s.booking_date).toLocaleDateString('en-IN') : ''}"`,
      `"${(s.receiver_name || '').replace(/"/g, '""')}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      `"${s.internal_status || ''}"`,
      `"${s.actual_weight || 0}"`,
      `"${s.client_charge || 0}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LogiFlow_Monthly_Report_${reportData.period.monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const metrics = reportData?.metrics || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            Monthly Logistics Performance Reports <FileText className="w-5 h-5 ml-2 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated shipment volume, delivery SLA compliance, and financial summary.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!reportData || loading}
          className="self-start lg:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center shadow-md shadow-emerald-500/20 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" /> Download Monthly CSV Report
        </button>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {user?.role !== 'CLIENT' && (
            <div className="flex items-center space-x-2 ml-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={loadMonthlyReport}
          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
        </button>
      </div>

      {loading || !reportData ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Generating Monthly Logistics Report...</p>
        </div>
      ) : (
        <>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold">Monthly Total Volume</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.totalShipments || 0} pkgs
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Billed in {reportData.period.monthName}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold">Delivery SLA Rate</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.slaRate || '0%'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-bold">{metrics.delivered || 0} successful deliveries</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold">Freight Billed Charges</span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{(metrics.totalFreightCharges || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Total freight & surcharges</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800 p-5 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold">Total Chargeable Weight</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.totalChargeableWeight || 0} kg
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Actual weight: {metrics.totalActualWeight || 0} kg</p>
            </div>
          </div>

          {/* Breakdown & Top Destinations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Shipment Status Breakdown</h2>
              <div className="space-y-4">
                {(reportData.statusBreakdown || []).map((sb: any) => {
                  const pct = metrics.totalShipments > 0 ? Math.round((sb.count / metrics.totalShipments) * 100) : 0;
                  let colorClass = 'bg-blue-600';
                  if (sb.status === 'DELIVERED') colorClass = 'bg-emerald-600';
                  if (sb.status === 'IN_TRANSIT' || sb.status === 'OUT_FOR_DELIVERY') colorClass = 'bg-amber-500';
                  if (sb.status === 'EXCEPTION' || sb.status === 'RTO' || sb.status === 'NDR') colorClass = 'bg-red-500';

                  return (
                    <div key={sb.status} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{sb.status}</span>
                        <span className="text-slate-500">{sb.count} pkgs ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Destinations */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                Top Delivery Cities <MapPin className="w-4 h-4 ml-2 text-red-500" />
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {(reportData.topDestinations || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No destination records available for this month.</p>
                ) : (
                  reportData.topDestinations.map((dest: any, idx: number) => (
                    <div key={dest.city} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{dest.city}</span>
                      </div>
                      <span className="font-mono font-bold text-blue-600">{dest.count} shipments</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Monthly Dispatches Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Monthly Shipment Registry</h2>
              <p className="text-xs text-slate-500">Showing top dispatches logged during {reportData.period.monthName} {selectedYear}.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5 pl-5">AWB Number</th>
                    <th className="p-3.5">Booking Date</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Destination</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-5">Billed Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {(reportData.shipments || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No shipments found for selected period.</td>
                    </tr>
                  ) : (
                    reportData.shipments.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-blue-600">{s.awb_number}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          {s.booking_date ? new Date(s.booking_date).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{s.receiver_name || 'N/A'}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{s.city || 'India'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            s.internal_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                            s.internal_status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {s.internal_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5 font-mono font-bold text-slate-900 dark:text-white">
                          ₹{(s.client_charge || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
