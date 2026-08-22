import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Truck, Building2, Search, Filter, Plus, CheckCircle2, AlertTriangle, FileText, Printer, X, MapPin, Key, UserCheck, ChevronRight, Zap, MoreVertical, Package, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function Appointments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'AT_RISK' | 'BOOKED'>('PENDING');
  
  const [consigneeFilter, setConsigneeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [editingShipment, setEditingShipment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [formData, setFormData] = useState({
    po_number: '',
    po_expiry_date: '',
    promised_delivery_date: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_slot: '10:00 AM - 01:00 PM',
    dock_number: 'Dock 04',
    appointment_token: '',
    appointment_status: 'SCHEDULED',
    appointment_notes: ''
  });

  const fetchAppointments = () => {
    setLoading(true);
    fetchApi('/shipments')
      .then(res => {
        const list = res.data || (Array.isArray(res) ? res : []);
        // Seed mock PO numbers for realistic Delhivery B2B view if missing
        const mapped = list.map((s: any, idx: number) => ({
          ...s,
          po_number: s.po_number || (idx % 2 === 0 ? `PO-FLIPKART-${900500 + idx}` : `ORD-${378140 + idx}d9-bfed`),
          po_expiry_date: s.po_expiry_date || new Date(Date.now() + (idx + 2) * 86400000).toISOString(),
          promised_delivery_date: s.promised_delivery_date || new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
          appointment_status: s.appointment_status || (idx % 3 === 0 ? 'CONFIRMED' : idx % 4 === 0 ? 'MISSED' : 'NOT_REQUIRED')
        }));
        setShipments(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleOpenScheduleModal = (shipment: any) => {
    setEditingShipment(shipment);
    setFormData({
      po_number: shipment.po_number || `PO-${Math.floor(100000 + Math.random() * 900000)}`,
      po_expiry_date: shipment.po_expiry_date ? format(new Date(shipment.po_expiry_date), 'yyyy-MM-dd') : format(new Date(Date.now() + 3 * 86400000), 'yyyy-MM-dd'),
      promised_delivery_date: shipment.promised_delivery_date ? format(new Date(shipment.promised_delivery_date), 'yyyy-MM-dd') : format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'),
      appointment_date: shipment.appointment_date ? format(new Date(shipment.appointment_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      appointment_slot: shipment.appointment_slot || '10:00 AM - 01:00 PM',
      dock_number: shipment.dock_number || 'Dock 01',
      appointment_token: shipment.appointment_token || `APT-${Math.floor(100000 + Math.random() * 900000)}`,
      appointment_status: shipment.appointment_status && shipment.appointment_status !== 'NOT_REQUIRED' ? shipment.appointment_status : 'SCHEDULED',
      appointment_notes: shipment.appointment_notes || ''
    });
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    setSaving(true);
    try {
      const res = await fetchApi(`/shipments/${editingShipment.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (res && res.error) {
        alert(res.error);
      } else {
        alert('Appointment slot booked successfully!');
        setEditingShipment(null);
        fetchAppointments();
      }
    } catch (err: any) {
      alert('Failed to save appointment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter list by tab & search criteria
  const filteredShipments = shipments.filter(s => {
    // Filter Tab
    const isBooked = s.appointment_status === 'CONFIRMED' || s.appointment_status === 'SCHEDULED' || s.appointment_status === 'COMPLETED';
    const isAtRisk = s.appointment_status === 'MISSED' || s.internal_status === 'EXCEPTION' || s.internal_status === 'NDR';
    const isPending = !isBooked && !isAtRisk;

    if (activeTab === 'BOOKED' && !isBooked) return false;
    if (activeTab === 'AT_RISK' && !isAtRisk) return false;
    if (activeTab === 'PENDING' && isBooked) return false;

    // Filters
    if (consigneeFilter && !s.receiver_name?.toLowerCase().includes(consigneeFilter.toLowerCase())) return false;
    if (cityFilter && !s.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (statusFilter && s.internal_status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAwb = s.awb_number?.toLowerCase().includes(q);
      const matchClient = s.client?.company_name?.toLowerCase().includes(q);
      const matchReceiver = s.receiver_name?.toLowerCase().includes(q);
      const matchPo = s.po_number?.toLowerCase().includes(q);
      return matchAwb || matchClient || matchReceiver || matchPo;
    }
    return true;
  });

  const pendingCount = shipments.filter(s => s.appointment_status !== 'CONFIRMED' && s.appointment_status !== 'SCHEDULED' && s.appointment_status !== 'COMPLETED' && s.appointment_status !== 'MISSED').length;
  const atRiskCount = shipments.filter(s => s.appointment_status === 'MISSED' || s.internal_status === 'EXCEPTION' || s.internal_status === 'NDR').length;
  const bookedCount = shipments.filter(s => s.appointment_status === 'CONFIRMED' || s.appointment_status === 'SCHEDULED' || s.appointment_status === 'COMPLETED').length;

  return (
    <div className="space-y-5 pb-12 font-sans">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center">
            Manage Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">B2B Quick-Commerce & Warehouse Dock Scheduling Portal</p>
        </div>
      </div>

      {/* Delhivery Style Status Tabs */}
      <div className="flex items-center space-x-6 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'PENDING' 
              ? 'text-rose-600 dark:text-rose-400 font-black border-b-2 border-rose-600' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Pending</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[10px] font-extrabold">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AT_RISK')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'AT_RISK' 
              ? 'text-amber-600 dark:text-amber-400 font-black border-b-2 border-amber-600' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>At risk</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-extrabold">
            {atRiskCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BOOKED')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'BOOKED' 
              ? 'text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Booked</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-extrabold">
            {bookedCount}
          </span>
        </button>
      </div>

      {/* Filter Toolbar (Search LR, Consignee, City, Status, PDD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search LR number"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <select 
            value={consigneeFilter}
            onChange={e => setConsigneeFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">Consignee ▾</option>
            <option value="Flipkart">Flipkart India Pvt Ltd</option>
            <option value="Amazon">Amazon Fulfillment</option>
            <option value="Canteen">Canteen Stores Dept (CSD)</option>
            <option value="Blinkit">Blinkit Commerce</option>
            <option value="Zepto">Zepto Quick Commerce</option>
          </select>
        </div>

        <div>
          <select 
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">City ▾</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bengaluru</option>
            <option value="Gurgaon">Gurgaon</option>
            <option value="Howrah">Howrah</option>
            <option value="Chennai">Chennai</option>
          </select>
        </div>

        <div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">Shipment status ▾</option>
            <option value="IN_TRANSIT">In-transit</option>
            <option value="DELIVERED">At delivery center</option>
            <option value="BOOKED">Booked</option>
          </select>
        </div>

        <div>
          <input 
            type="text" 
            readOnly
            placeholder="PDD date range ▾"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-500 cursor-pointer font-medium"
            onClick={() => alert('Filtering by Promised Delivery Date (PDD) range')}
          />
        </div>
      </div>

      {/* Green Channel Notice Banner */}
      {showBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex justify-between items-start text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-start space-x-2.5">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                <strong>LogiFlow Green Channel</strong> enabled for leading quick-commerce & enterprise consignees like <strong>Blinkit</strong>, <strong>Zepto</strong>, <strong>Swiggy</strong>, <strong>Flipkart</strong>, and <strong>Amazon</strong>.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                We coordinate directly with these consignees to book appointment slots; all we need from you is the Purchase Order (PO) details.
              </p>
            </div>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-emerald-500 hover:text-emerald-800 dark:hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Delhivery-Style Appointment Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3 text-slate-600 dark:text-slate-400">LR Details</th>
                <th className="px-5 py-3 text-slate-600 dark:text-slate-400">Consignee Details</th>
                <th className="px-5 py-3 text-slate-600 dark:text-slate-400">PO Expiry Date / PO Details</th>
                <th className="px-5 py-3 text-slate-600 dark:text-slate-400">Shipment Status</th>
                <th className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading appointment records...</td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No shipments found for this tab.</td>
                </tr>
              ) : (
                filteredShipments.map((s: any) => {
                  const pddDateStr = s.promised_delivery_date ? format(new Date(s.promised_delivery_date), 'dd MMM') : '22 Aug';
                  const isBooked = s.appointment_status === 'CONFIRMED' || s.appointment_status === 'SCHEDULED' || s.appointment_status === 'COMPLETED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      
                      {/* LR Details */}
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">{s.awb_number}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{s.number_of_pieces || 1} {s.number_of_pieces > 1 ? 'Boxes' : 'Box'}</p>
                      </td>

                      {/* Consignee Details */}
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-slate-900 dark:text-white uppercase">{s.receiver_name || 'Flipkart India Private Limited'}</p>
                        <p className="text-[11px] text-slate-500">{s.city || 'Mumbai'}, {s.pincode || '400010'}</p>
                      </td>

                      {/* PO Details */}
                      <td className="px-5 py-4 align-top">
                        <p className="text-slate-500 font-medium text-[11px]">
                          {s.po_expiry_date ? format(new Date(s.po_expiry_date), 'dd MMM yyyy') : 'Unavailable'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {s.po_number || 'ORD-378149d9-bfed-43f4'}
                        </p>
                      </td>

                      {/* Shipment Status & PDD */}
                      <td className="px-5 py-4 align-top">
                        <span className={`px-2.5 py-0.5 inline-block text-[10px] font-bold rounded-full mb-1 ${
                          s.internal_status === 'DELIVERED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {s.internal_status === 'DELIVERED' ? 'At delivery center' : 'In-transit'}
                        </span>
                        <p className="text-[10px] font-semibold text-slate-500">Delivery by {pddDateStr}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right align-top">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenScheduleModal(s)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline flex items-center"
                          >
                            {isBooked ? 'View appointment >' : 'Book appointment >'}
                          </button>
                          <button 
                            onClick={() => setSelectedAppointment(s)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar matching Delhivery */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Showing 1-{filteredShipments.length} of {filteredShipments.length}</span>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded">1</span>
            <span className="text-slate-400">Rows per page 20 ▾</span>
          </div>
        </div>
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Book Consignee Appointment Slot</h3>
                <p className="text-xs text-slate-500 font-mono">LR Number: {editingShipment.awb_number}</p>
              </div>
              <button onClick={() => setEditingShipment(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
              
              {/* PO Details Section */}
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/50 space-y-3">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wide">Purchase Order (PO) Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PO / Order Reference #</label>
                    <input
                      type="text"
                      required
                      value={formData.po_number}
                      onChange={e => setFormData({ ...formData, po_number: e.target.value })}
                      placeholder="e.g. FAGWN08454470"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-mono dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PO Expiry Date</label>
                    <input
                      type="date"
                      value={formData.po_expiry_date}
                      onChange={e => setFormData({ ...formData, po_expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Slot & PDD Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Promised Delivery Date (PDD)</label>
                  <input
                    type="date"
                    value={formData.promised_delivery_date}
                    onChange={e => setFormData({ ...formData, promised_delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-medium dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Appointment Slot Window</label>
                  <select
                    value={formData.appointment_slot}
                    onChange={e => setFormData({ ...formData, appointment_slot: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-bold dark:bg-slate-700 dark:text-white"
                  >
                    <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Morning Dock)</option>
                    <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM (Midday Dock)</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM (Afternoon Dock)</option>
                    <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening Dock)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dock / Bay Assigned</label>
                  <input
                    type="text"
                    value={formData.dock_number}
                    onChange={e => setFormData({ ...formData, dock_number: e.target.value })}
                    placeholder="e.g. Dock 04 / Gate 2"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gate Pass Token</label>
                  <input
                    type="text"
                    value={formData.appointment_token}
                    onChange={e => setFormData({ ...formData, appointment_token: e.target.value })}
                    placeholder="APT-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Appointment Status</label>
                <select
                  value={formData.appointment_status}
                  onChange={e => setFormData({ ...formData, appointment_status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-bold dark:bg-slate-700 dark:text-white"
                >
                  <option value="SCHEDULED">SCHEDULED (Pending Unloading)</option>
                  <option value="CONFIRMED">CONFIRMED (Dock Reserved)</option>
                  <option value="COMPLETED">COMPLETED (Delivered & Received)</option>
                  <option value="MISSED">MISSED / AT RISK (Late Entry)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {saving ? 'Confirming Slot...' : 'Confirm Appointment Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK PASS MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-sm p-4 flex flex-col items-center justify-start print:p-0 print:bg-white print:static">
          
          <div className="sticky top-2 z-20 w-full max-w-[180mm] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex justify-between items-center no-print border border-slate-700/60 mb-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-xs">Warehouse Dock Entry Pass — {selectedAppointment.appointment_token || 'APT-PASS'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print Entry Pass
              </button>
              <button onClick={() => setSelectedAppointment(null)} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-[180mm] max-w-full bg-white text-slate-900 font-sans mx-auto p-6 border border-slate-300 shadow-2xl rounded-2xl print:rounded-none print:border-none print:p-4 print:w-full space-y-4 text-xs">
            <div className="border-2 border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">LOGIFLOW WAREHOUSE DOCK PASS</h2>
                  <p className="text-[10px] text-slate-500 font-semibold">GATE ENTRY PERMIT & SLOTS CONTROL</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white px-3 py-1 text-xs font-mono font-black rounded">{selectedAppointment.appointment_token || 'APT-992014'}</span>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{selectedAppointment.appointment_status || 'SCHEDULED'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">LR NUMBER</p>
                  <p className="font-mono text-sm font-black text-blue-700">{selectedAppointment.awb_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">PO / ORDER NUMBER</p>
                  <p className="font-mono text-sm font-black text-slate-900">{selectedAppointment.po_number || 'PO-FLIPKART-900588'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">ASSIGNED DOCK / BAY</p>
                  <p className="font-mono text-sm font-black text-slate-900">{selectedAppointment.dock_number || 'Dock 01'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">TIME SLOT WINDOW</p>
                  <p className="font-mono font-bold text-slate-900">{selectedAppointment.appointment_slot || '10:00 AM - 01:00 PM'}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <p><strong>Merchant Client:</strong> {selectedAppointment.client?.company_name || 'Apex Logistics'}</p>
                  <p><strong>Consignee Destination:</strong> {selectedAppointment.receiver_name || selectedAppointment.city}</p>
                  <p><strong>Total Boxes:</strong> {selectedAppointment.number_of_pieces || 1} Boxes</p>
                  <p><strong>Total Weight:</strong> {selectedAppointment.actual_weight || 1} kg</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
