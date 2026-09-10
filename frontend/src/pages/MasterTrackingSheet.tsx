import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Filter, Download, Search, Calendar, RefreshCw,
  Eye, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { MasterShipmentDetailModal } from '../components/MasterShipmentDetailModal';

export const MasterTrackingSheetPage: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRto, setIsRto] = useState(false);
  const [isDemurrage, setIsDemurrage] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail Modal state
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthsList = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        clientId: selectedClient,
        courierId: selectedCourier,
        month: selectedMonth,
        status: selectedStatus,
        startDate,
        endDate,
        isRto: isRto ? 'true' : undefined,
        isDemurrage: isDemurrage ? 'true' : undefined,
        page,
        limit: 25
      };

      const res = await api.getMasterReport(params);
      if (res && res.data) {
        setShipments(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.total || res.data.length);
        }
      } else {
        // Fallback to demo shipment list
        const fallback = await api.fetch('/shipments');
        setShipments(fallback?.data || []);
      }
    } catch (err: any) {
      console.warn('Error fetching master report:', err);
      // Graceful fallback
      const fallback = await api.fetch('/shipments');
      setShipments(fallback?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [cList, cpList] = await Promise.all([
          api.fetch('/clients'),
          api.fetch('/couriers')
        ]);
        if (Array.isArray(cList)) setClients(cList);
        if (Array.isArray(cpList)) setCouriers(cpList);
      } catch (e) {}
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [page, selectedClient, selectedCourier, selectedMonth, selectedStatus, isRto, isDemurrage]);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    const params = {
      search,
      clientId: selectedClient,
      courierId: selectedCourier,
      month: selectedMonth,
      status: selectedStatus,
      startDate,
      endDate,
      isRto: isRto ? 'true' : undefined,
      isDemurrage: isDemurrage ? 'true' : undefined
    };
    const exportUrl = await api.exportMasterReportUrl(params, format);
    window.open(exportUrl, '_blank');
  };

  const handleRowClick = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Master Tracking Sheet 2026</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Digital operational workbook replacing legacy Excel tracking. Source of truth for operational & courier tracking data.
              </p>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={fetchMasterData}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Field Ownership Legend */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs">
        <span className="font-semibold text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Field Data Ownership Classification:</span>
        </span>
        <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Company-Owned (Booking Records)
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Courier-Owned (Delivery Partner Sheets)
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            System-Calculated (Formulas & Demurrage)
          </span>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Master Report Filters</span>
          </span>
          {(search || selectedClient || selectedCourier || selectedMonth || selectedStatus || isRto || isDemurrage) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedClient('');
                setSelectedCourier('');
                setSelectedMonth('');
                setSelectedStatus('');
                setIsRto(false);
                setIsDemurrage(false);
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative col-span-1 lg:col-span-2">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search AWB, Consignee, Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMasterData()}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Month Selector */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Months (2026)</option>
              {monthsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Clients</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          {/* Courier Filter */}
          <div>
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Couriers</option>
              {couriers.map((cp: any) => (
                <option key={cp.id} value={cp.id}>{cp.courier_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="RTO">RTO</option>
              <option value="NDR">NDR</option>
            </select>
          </div>

        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center space-x-6 pt-2 border-t border-slate-800/60 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={isRto}
              onChange={(e) => setIsRto(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-0"
            />
            <span>RTO Shipments Only</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={isDemurrage}
              onChange={(e) => setIsDemurrage(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
            />
            <span>Demurrage Accrued Only</span>
          </label>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead>
              {/* Header Group Banner */}
              <tr className="bg-slate-950 font-semibold border-b border-slate-800 text-[10px] uppercase tracking-wider text-center">
                <th colSpan={13} className="py-2 bg-blue-950/40 text-blue-300 border-r border-slate-800">
                  Company-Owned Operational Fields (Protected)
                </th>
                <th colSpan={9} className="py-2 bg-emerald-950/40 text-emerald-300 border-r border-slate-800">
                  Courier-Owned Tracking Fields
                </th>
                <th colSpan={5} className="py-2 bg-purple-950/40 text-purple-300">
                  System-Calculated Metrics & Demurrage
                </th>
              </tr>

              {/* Column Names */}
              <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-medium">
                {/* Company Fields */}
                <th className="p-3 border-r border-slate-800 text-blue-300">SR</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">MONTH</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">DATE</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">A/C</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">AWB NO</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">B. WGT</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">AMT</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">CONSIGNOR</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">PICKUP</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">CITY</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">STATE</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">CONSIGNEE</th>
                <th className="p-3 border-r border-slate-800 text-blue-300">INVOICE NO</th>

                {/* Courier Fields */}
                <th className="p-3 border-r border-slate-800 text-emerald-300">STATUS</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">EDD</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">DELIVERED</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">RTO DOCKET</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">1ST ATTEMPT</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">2ND ATTEMPT</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">POD STATUS</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">REMARK</th>
                <th className="p-3 border-r border-slate-800 text-emerald-300">COURIER</th>

                {/* System Fields */}
                <th className="p-3 border-r border-slate-800 text-purple-300">DAYS TO DLY</th>
                <th className="p-3 border-r border-slate-800 text-purple-300">DEMM DAYS</th>
                <th className="p-3 border-r border-slate-800 text-purple-300">RATE</th>
                <th className="p-3 border-r border-slate-800 text-purple-300">TOTAL DEMM</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={27} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading Master Tracking Sheet data...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={27} className="p-8 text-center text-slate-500">
                    No shipments match the selected filters.
                  </td>
                </tr>
              ) : (
                shipments.map((s, idx) => {
                  const bDate = s.booking_date ? new Date(s.booking_date).toLocaleDateString('en-IN') : 'N/A';
                  const dDate = s.delivery_date ? new Date(s.delivery_date).toLocaleDateString('en-IN') : '-';
                  const edd = s.edd_date ? new Date(s.edd_date).toLocaleDateString('en-IN') : '-';
                  const att1 = s.attempt_1_date ? new Date(s.attempt_1_date).toLocaleDateString('en-IN') : '-';
                  const att2 = s.attempt_2_date ? new Date(s.attempt_2_date).toLocaleDateString('en-IN') : '-';

                  return (
                    <tr
                      key={s.id || s.awb_number}
                      className="hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => handleRowClick(s)}
                    >
                      {/* Company Fields */}
                      <td className="p-3 text-slate-400 font-mono">{s.sr_no || idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-300">{s.month_tag || 'JANUARY'}</td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{bDate}</td>
                      <td className="p-3 text-slate-400">{s.ac_code || s.client_id || 'CLI-001'}</td>
                      <td className="p-3 font-mono font-bold text-indigo-400 whitespace-nowrap">{s.awb_number}</td>
                      <td className="p-3 text-slate-300">{s.b_weight || s.chargeable_weight || 1} kg</td>
                      <td className="p-3 text-slate-200">₹{(s.client_charge || s.amt || 0).toLocaleString()}</td>
                      <td className="p-3 text-slate-300 truncate max-w-[120px]">{s.consignor || s.client?.company_name || 'Apex'}</td>
                      <td className="p-3 text-slate-400 truncate max-w-[100px]">{s.pickup_location || s.origin || 'MAHAPE'}</td>
                      <td className="p-3 text-slate-300">{s.city || 'Mumbai'}</td>
                      <td className="p-3 text-slate-400">{s.state || 'MH'}</td>
                      <td className="p-3 text-slate-200 truncate max-w-[120px]">{s.receiver_name || 'Consignee'}</td>
                      <td className="p-3 text-indigo-300 font-mono">{s.invoice_no || s.client_reference_no || 'INV-50578'}</td>

                      {/* Courier Fields */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.internal_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          s.internal_status === 'RTO' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {s.internal_status || 'BOOKED'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{edd}</td>
                      <td className="p-3 text-emerald-400 whitespace-nowrap">{dDate}</td>
                      <td className="p-3 text-rose-400 font-mono">{s.rto_docket || '-'}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{att1}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{att2}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          s.pod_status === 'VERIFIED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.pod_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[120px]">{s.remarks || 'Normal'}</td>
                      <td className="p-3 text-slate-300">{s.courier?.courier_name || 'Delhivery'}</td>

                      {/* System Fields */}
                      <td className="p-3 font-semibold text-purple-300">{s.days_to_deliver || 0}d</td>
                      <td className="p-3 font-semibold text-amber-400">{s.demurrage_days || 0}</td>
                      <td className="p-3 text-slate-400">₹{s.demurrage_rate || 0}</td>
                      <td className="p-3 font-bold text-emerald-400">₹{s.total_demurrage || 0}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(s);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white rounded-lg transition"
                          title="View Master Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {shipments.length} of {totalItems} shipments</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Master Shipment Detail Modal */}
      {selectedShipment && (
        <MasterShipmentDetailModal
          shipment={selectedShipment}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchMasterData}
        />
      )}

    </div>
  );
};

export default MasterTrackingSheetPage;
