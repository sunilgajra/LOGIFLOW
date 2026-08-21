import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Truck, Search, Plus, X, Calendar, Clock, MapPin, Package, PhoneCall, AlertCircle, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function PickupRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');

  const [showDrawer, setShowDrawer] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State matching Screenshot 2
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('14:00:00 - 18:00:00');
  const [boxCount, setBoxCount] = useState('1');
  const [selectedLrn, setSelectedLrn] = useState('');

  const fetchPickupData = () => {
    setLoading(true);
    Promise.all([
      fetchApi('/pickups'),
      fetchApi('/warehouses')
    ])
      .then(([pickupRes, warehouseRes]) => {
        const pickupList = Array.isArray(pickupRes) ? pickupRes : [];
        const whList = Array.isArray(warehouseRes) ? warehouseRes : [];
        setPickups(pickupList);
        setWarehouses(whList);
        if (whList.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(whList[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPickupData();
  }, []);

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const warehouse = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0] || {
      facility_name: '276001 - PROSTARM INFO, Azamgarh, Uttar Pradesh'
    };

    const facility_name = `${warehouse.facility_name || 'Main Warehouse'}, ${warehouse.city || 'Azamgarh'}, ${warehouse.state || 'UP'}`;

    try {
      await fetchApi('/pickups', {
        method: 'POST',
        body: JSON.stringify({
          warehouse_id: selectedWarehouseId,
          facility_name,
          pickup_date: selectedDate,
          pickup_slot: selectedSlot,
          box_count: parseInt(boxCount) || 1,
          lrn_numbers: selectedLrn
        })
      });
      setShowDrawer(false);
      fetchPickupData();
    } catch (err: any) {
      alert('Failed to create pickup request: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/pickups/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchPickupData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Generate Date Selection Cards for Next 7 Days (Screenshot 2)
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(new Date(), i + 1);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      dayNum: format(d, 'dd'),
      monthShort: format(d, 'MMM').toUpperCase(),
      dayShort: i === 0 ? 'TOM' : format(d, 'EEE').toUpperCase()
    };
  });

  const slots = [
    { time: '14:00:00 - 18:00:00', label: 'Afternoon' },
    { time: '18:00:00 - 21:00:00', label: 'Evening' },
    { time: '06:00:00 - 10:00:00', label: 'Morning' },
    { time: '10:00:00 - 14:00:00', label: 'Midday' }
  ];

  // Filtered Pickups List
  const filteredPickups = pickups.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (locationFilter && !p.facility_name?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = p.pickup_id?.toLowerCase().includes(q);
      const matchFacility = p.facility_name?.toLowerCase().includes(q);
      return matchId || matchFacility;
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Truck className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" /> Pickup Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Create and manage all your domestic pickup requests here.</p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center"
        >
          Create pickup request +
        </button>
      </div>

      {/* Delhivery Style Filters Bar (Search Pickup ID, Pickup date range, Pickup location, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Pickup ID"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <input
            type="text"
            readOnly
            placeholder="Pickup date range ▾"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-500 cursor-pointer font-medium"
            onClick={() => alert('Filter by pickup date range')}
          />
        </div>

        <div>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">Pickup location ▾</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.facility_name}>{w.facility_name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="ALL">Status ▾</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Out for Pickup">Out for Pickup</option>
            <option value="Picked">Picked</option>
            <option value="Not Picked">Not Picked</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Domestic Pickup Requests Table (Matching Screenshot 1) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3.5 flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span>Pickup ID</span>
                </th>
                <th className="px-5 py-3.5">Pickup date & slot</th>
                <th className="px-5 py-3.5">Pickup location</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading domestic pickup requests...</td>
                </tr>
              ) : filteredPickups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No pickup requests found. Click "Create pickup request +" to schedule one.</td>
                </tr>
              ) : (
                filteredPickups.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    
                    {/* Pickup ID */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start space-x-2">
                        <input type="checkbox" className="mt-0.5 rounded border-slate-300" />
                        <div>
                          <p className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">{p.pickup_id}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            {p.escalated && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9px] font-bold rounded">
                                Escalated
                              </span>
                            )}
                            {p.otp_verified && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-bold rounded flex items-center">
                                ✓ OTP Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pickup Date & Slot */}
                    <td className="px-5 py-4 align-top font-medium">
                      <p className="text-slate-900 dark:text-white font-bold">
                        {p.pickup_date ? format(new Date(p.pickup_date), 'dd MMM, yyyy') : '22 Aug, 2026'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.pickup_slot || '02:00 PM - 06:00 PM'}</p>
                    </td>

                    {/* Pickup Location */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-slate-900 dark:text-white uppercase">{p.facility_name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5">{p.warehouse?.address_line || 'Warehouse Facility Address'}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 align-top">
                      <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-full ${
                        p.status === 'Picked' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        p.status === 'Out for Pickup' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        p.status === 'Not Picked' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {p.status || 'Scheduled'}
                      </span>
                    </td>

                    {/* Actions matching Screenshot 1 */}
                    <td className="px-5 py-4 text-right align-top">
                      <div className="flex items-center justify-end space-x-2">
                        {p.status === 'Scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'Cancelled')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold border border-slate-300 dark:border-slate-600"
                          >
                            Cancel pickup
                          </button>
                        )}
                        {p.status === 'Out for Pickup' && (
                          <button
                            onClick={() => alert(`Calling FE Executive at +91 9876543210`)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold border border-slate-300 dark:border-slate-600 flex items-center"
                          >
                            <PhoneCall className="w-3 h-3 mr-1" /> Call Executive
                          </button>
                        )}
                        <button
                          onClick={() => alert(`Ticket raised for Pickup ID #${p.pickup_id}`)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-semibold border border-slate-300 dark:border-slate-600"
                        >
                          Raise a ticket
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Showing 1-{filteredPickups.length} of {filteredPickups.length}</span>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded">1</span>
            <span className="text-slate-400">10 ▾</span>
          </div>
        </div>
      </div>

      {/* CREATE PICKUP REQUEST RIGHT-SIDE DRAWER (Matching Screenshot 2) */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-800 max-w-xl w-full h-full shadow-2xl flex flex-col justify-between text-xs animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Create pickup request</h2>
              <button onClick={() => setShowDrawer(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleCreatePickup} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Pickup Location Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Pickup location <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/warehouses')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center"
                  >
                    Add new pickup location
                  </button>
                </div>
                <select
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-medium text-xs"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.facility_name}, {w.city}, {w.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* LRN Numbers */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">LRN numbers</label>
                <div className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold flex justify-between items-center cursor-pointer">
                  <span>0 LRN ready for pickup</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Pickup Date Interactive Cards (Next 7 Days) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Pickup date <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {next7Days.map(item => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <div
                        key={item.dateStr}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`p-2 rounded-xl text-center cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-800 dark:bg-blue-950 dark:text-blue-200 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-700/50 dark:border-slate-600'
                        }`}
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.dayShort}</p>
                        <p className="text-base font-black my-0.5">{item.dayNum}</p>
                        <p className="text-[9px] font-semibold text-slate-400">{item.monthShort}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pickup Slot Cards */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Pickup slot <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map(s => {
                    const isSelected = selectedSlot === s.time;
                    return (
                      <div
                        key={s.time}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 dark:bg-blue-950 dark:border-blue-500'
                            : 'bg-white border-slate-200 dark:bg-slate-700/50 dark:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Clock className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">{s.time}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Box Count */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Box count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={boxCount}
                  onChange={e => setBoxCount(e.target.value)}
                  placeholder="Enter number of boxes"
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-bold"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  {creating ? 'Creating Pickup Request...' : 'Create pickup'}
                </button>
              </div>

            </form>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
