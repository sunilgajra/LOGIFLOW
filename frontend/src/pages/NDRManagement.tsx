import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { AlertTriangle, RefreshCw, PhoneCall, MapPin, XCircle, CheckCircle, Search, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function NDRManagement() {
  const { user } = useAuth();
  const [ndrList, setNdrList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'REATTEMPT' | 'UPDATE_ADDRESS' | 'UPDATE_PHONE' | 'RTO' | null>(null);
  
  const [remarks, setRemarks] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNDR();
  }, []);

  const fetchNDR = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/ndr');
      setNdrList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openActionModal = (shipment: any, action: 'REATTEMPT' | 'UPDATE_ADDRESS' | 'UPDATE_PHONE' | 'RTO') => {
    setSelectedShipment(shipment);
    setActionType(action);
    setRemarks('');
    setNewPhone(shipment.receiver_phone || '');
    setNewAddress(shipment.receiver_address || '');
    setPreferredDate('');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !actionType) return;

    setSubmitting(true);
    try {
      await fetchApi(`/ndr/${selectedShipment.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action: actionType,
          remarks,
          new_phone: newPhone,
          new_address: newAddress,
          preferred_date: preferredDate
        })
      });
      setSelectedShipment(null);
      setActionType(null);
      fetchNDR();
    } catch (err) {
      console.error(err);
      alert('Failed to submit NDR action');
    }
    setSubmitting(false);
  };

  const filteredList = ndrList.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.awb_number || '').toLowerCase().includes(q) ||
      (item.receiver_name || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q) ||
      (item.client?.company_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-8 h-8 text-amber-100" />
            <h1 className="text-2xl font-black tracking-tight">NDR Action Engine</h1>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            Resolve failed delivery attempts, request re-attempts, and reduce RTO costs in real-time.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
          <p className="text-2xl font-black">{ndrList.length}</p>
          <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Pending Exceptions</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search NDR by AWB, Receiver, Client..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button 
          onClick={fetchNDR} 
          className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {/* NDR Shipments Grid */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
          Loading NDR exceptions...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-dashed border-slate-300">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-800">All Clean! No Pending NDR Exceptions.</p>
          <p className="text-sm text-slate-500 mt-1">All delivery attempts are running smoothly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg text-slate-900">{item.awb_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Attempt #{item.delivery_attempt || 1} Failed
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.courier?.courier_name || 'Standard'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Receiver Name & Contact</span>
                    <span className="font-semibold text-slate-800">{item.receiver_name}</span>
                    <span className="block text-xs text-slate-500">{item.receiver_phone || 'No phone'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Destination</span>
                    <span className="font-semibold text-slate-800">{item.city}, {item.state}</span>
                    <span className="block text-xs text-slate-500 truncate max-w-[200px]">{item.receiver_address}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Client / Merchant</span>
                    <span className="font-semibold text-slate-800">{item.client?.company_name || 'Direct'}</span>
                    <span className="block text-xs text-slate-500">
                      {item.updated_at ? format(new Date(item.updated_at), 'dd MMM, hh:mm a') : ''}
                    </span>
                  </div>
                </div>

                {/* Reason Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wide">Last Reported Reason: </span>
                    <span>{item.remarks || item.courier_status || 'Customer unavailable at delivery location'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap lg:flex-col gap-2 min-w-[200px]">
                <button 
                  onClick={() => openActionModal(item, 'REATTEMPT')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Request Re-attempt
                </button>
                <button 
                  onClick={() => openActionModal(item, 'UPDATE_PHONE')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                  Update Phone
                </button>
                <button 
                  onClick={() => openActionModal(item, 'UPDATE_ADDRESS')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Update Address
                </button>
                <button 
                  onClick={() => openActionModal(item, 'RTO')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Authorize RTO
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedShipment && actionType && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {actionType === 'REATTEMPT' && '🔄 Request Re-attempt'}
                {actionType === 'UPDATE_PHONE' && '📞 Update Receiver Phone'}
                {actionType === 'UPDATE_ADDRESS' && '🏠 Update Delivery Address'}
                {actionType === 'RTO' && '🚫 Authorize Return to Origin (RTO)'}
              </h3>
              <button onClick={() => setSelectedShipment(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              AWB: <span className="font-bold text-slate-800">{selectedShipment.awb_number}</span> | Receiver: <span className="font-bold text-slate-800">{selectedShipment.receiver_name}</span>
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === 'UPDATE_PHONE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" 
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              )}

              {actionType === 'UPDATE_ADDRESS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Delivery Address</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={newAddress} 
                    onChange={e => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" 
                    placeholder="Full new street address..."
                  />
                </div>
              )}

              {actionType === 'REATTEMPT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Delivery Date (Optional)</label>
                  <input 
                    type="date" 
                    value={preferredDate} 
                    onChange={e => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks / Instructions for Delivery Agent</label>
                <textarea 
                  rows={2} 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" 
                  placeholder="e.g. Please call before delivery, customer is available after 2 PM..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedShipment(null)} 
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit NDR Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
