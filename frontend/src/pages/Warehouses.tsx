import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Building2, Search, Plus, Edit, X, MapPin, Phone, Mail, Clock, Calendar, Check, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Warehouses() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    facility_name: '',
    contact_person: '',
    contact_phone: '',
    email: '',
    address_line: '',
    pincode: '',
    city: '',
    state: '',
    default_pickup_slot: '10:00 AM - 01:00 PM',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    return_same_as_pickup: true,
    return_address: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchWarehouses = () => {
    setLoading(true);
    fetchApi('/warehouses')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setWarehouses(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingLocation(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (wh: any) => {
    setEditingLocation(wh);
    setFormData({
      facility_name: wh.facility_name || '',
      contact_person: wh.contact_person || '',
      contact_phone: wh.contact_phone || '',
      email: wh.email || '',
      address_line: wh.address_line || '',
      pincode: wh.pincode || '',
      city: wh.city || '',
      state: wh.state || '',
      default_pickup_slot: wh.default_pickup_slot || '10:00 AM - 01:00 PM',
      working_days: typeof wh.working_days === 'string' ? wh.working_days.split(',') : wh.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      return_same_as_pickup: wh.return_same_as_pickup !== false,
      return_address: wh.return_address || ''
    });
    setShowModal(true);
  };

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => {
      const days = [...prev.working_days];
      if (days.includes(day)) {
        return { ...prev, working_days: days.filter(d => d !== day) };
      } else {
        return { ...prev, working_days: [...days, day] };
      }
    });
  };

  const handlePincodeChange = (pin: string) => {
    setFormData(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6) {
      if (pin.startsWith('40') || pin.startsWith('41')) {
        setFormData(prev => ({ ...prev, city: 'Navi Mumbai', state: 'Maharashtra' }));
      } else if (pin.startsWith('11')) {
        setFormData(prev => ({ ...prev, city: 'Delhi', state: 'Delhi' }));
      } else if (pin.startsWith('56')) {
        setFormData(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
      } else if (pin.startsWith('60')) {
        setFormData(prev => ({ ...prev, city: 'Chennai', state: 'Tamil Nadu' }));
      } else if (pin.startsWith('22')) {
        setFormData(prev => ({ ...prev, city: 'Lucknow', state: 'Uttar Pradesh' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLocation) {
        await fetchApi(`/warehouses/${editingLocation.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/warehouses', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchWarehouses();
    } catch (err: any) {
      alert('Failed to save warehouse location: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter List
  const filteredWarehouses = warehouses.filter(wh => {
    if (statusFilter !== 'ALL' && wh.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = wh.facility_name?.toLowerCase().includes(q);
      const matchCity = wh.city?.toLowerCase().includes(q);
      const matchState = wh.state?.toLowerCase().includes(q);
      return matchName || matchCity || matchState;
    }
    return true;
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Breadcrumb Header */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
        <span>My Facilities</span>
        <span>›</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">Manage Warehouses</span>
      </div>

      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Warehouse Facilities & Inventory</h1>
          <a href="#learn-more" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center font-semibold bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Stock & Docks
          </a>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add New Pickup Location
        </button>
      </div>

      {/* Stock & SKU Capacity KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Total Active Facilities</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{warehouses.length || 4}</p>
          <p className="text-[10px] font-bold text-emerald-600">100% Operational</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Storage Space Allocated</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">45,000 sq ft</p>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '78%' }}></div>
          </div>
          <p className="text-[10px] text-slate-400">78% Storage Utilization</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>SKU Live Inventory</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">1,280 SKUs</p>
          <p className="text-[10px] text-slate-400 font-mono">84,500 Total Stock Units</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Inbound Dock Bays</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">12 Docks</p>
          <p className="text-[10px] text-emerald-600 font-bold">8 Slots Available Today</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center space-x-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by pickup location, city"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
        >
          <option value="ALL">Status ▾</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Delhivery-Style Warehouses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3.5">PICKUP LOCATION</th>
                <th className="px-6 py-3.5">CREATED ON</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">CITY</th>
                <th className="px-6 py-3.5">STATE</th>
                <th className="px-6 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading pickup locations...</td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No pickup warehouse locations registered yet.</td>
                </tr>
              ) : (
                filteredWarehouses.map((wh: any) => (
                  <tr key={wh.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    
                    {/* Facility Name */}
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase">
                      {wh.facility_name}
                      {wh.contact_person && (
                        <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">{wh.contact_person} ({wh.contact_phone})</p>
                      )}
                    </td>

                    {/* Created On */}
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {wh.created_at ? format(new Date(wh.created_at), 'dd MMM, yyyy') : '30 Jul, 2026'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 inline-flex text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {wh.status || 'Active'}
                      </span>
                    </td>

                    {/* City */}
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {wh.city}
                    </td>

                    {/* State */}
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {wh.state}
                    </td>

                    {/* Action Edit */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(wh)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline flex items-center justify-end ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Show 50 per page ▾</span>
          <span>Showing 1-{filteredWarehouses.length} of {filteredWarehouses.length}</span>
        </div>
      </div>

      {/* ADD / EDIT PICKUP LOCATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Address Details Header */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center text-xs">
                  <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> Address Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Facility Name</label>
                    <input
                      type="text"
                      required
                      value={formData.facility_name}
                      onChange={e => setFormData({ ...formData, facility_name: e.target.value })}
                      placeholder="Enter name"
                      className="w-full px-3 py-2 border border-blue-500 dark:border-blue-400 rounded-lg dark:bg-slate-700 dark:text-white font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Please note that facility name cannot be edited after saving</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person Name (Optional)</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Enter contact person name"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pickup Location Contact</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-lg bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-xs">+91</span>
                      <input
                        type="text"
                        required
                        value={formData.contact_phone}
                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="Enter mobile number"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-lg dark:bg-slate-700 dark:text-white font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email ID"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address Line</label>
                  <input
                    type="text"
                    required
                    value={formData.address_line}
                    onChange={e => setFormData({ ...formData, address_line: e.target.value })}
                    placeholder="Enter address"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={e => handlePincodeChange(e.target.value)}
                      placeholder="Enter pincode"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono dark:bg-slate-700 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City & State</label>
                    <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 rounded-lg font-semibold text-slate-700 dark:text-slate-300">
                      {formData.city ? `${formData.city}, ${formData.state}, India` : 'City, State, India'}
                    </div>
                  </div>
                </div>

                {/* Default Pickup Slot */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-600" /> Default Pickup Slot
                  </label>
                  <select
                    value={formData.default_pickup_slot}
                    onChange={e => setFormData({ ...formData, default_pickup_slot: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-bold bg-white dark:bg-slate-700 dark:text-white"
                  >
                    <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                    <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Pickup requests for this location will be scheduled for this slot by default unless you choose to override it.</p>
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center text-xs">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-400" /> Working Days
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {weekDays.map(day => {
                    const isSelected = formData.working_days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-white border-slate-300 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                        <span>{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Return Details */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs">Return Details</h3>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.return_same_as_pickup}
                    onChange={e => setFormData({ ...formData, return_same_as_pickup: e.target.checked })}
                    className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                  />
                  <span>Return address is the same as the pickup address</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-lg shadow-md"
                >
                  {saving ? 'Saving Address...' : 'Add Pickup Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
