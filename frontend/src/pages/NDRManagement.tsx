import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { AlertTriangle, RefreshCw, PhoneCall, MapPin, XCircle, CheckCircle, Search, ShieldAlert, Clock, ArrowRight, ShieldCheck, Check } from 'lucide-react';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

      // Remove or update item locally
      setNdrList(prev => prev.filter(item => item.id !== selectedShipment.id));
      showToast(`NDR Action '${actionType}' submitted successfully for AWB ${selectedShipment.awb_number}!`);
      
      setSelectedShipment(null);
      setActionType(null);
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

  const highRiskCount = ndrList.filter(i => (i.delivery_attempt || 1) >= 2).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 font-bold text-xs animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">NDR Action Engine Desk</h1>
              <p className="text-slate-400 text-xs mt-0.5">Automated exception management, customer outreach, and RTO prevention.</p>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchNDR} 
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center border border-slate-700 transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Exceptions
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pending NDR Exceptions</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{ndrList.length}</span>
            <span className="text-[11px] text-slate-400">Action Required</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">High Risk RTO (Attempt #2+)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{highRiskCount}</span>
            <span className="text-[11px] text-rose-500 font-bold">Critical</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Avg Resolution SLA</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">4.2 hrs</span>
            <span className="text-[11px] text-slate-400">Target &lt; 12 hrs</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">NDR Recovery Rate</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">84.6%</span>
            <span className="text-[11px] text-emerald-600 font-bold">Saved from RTO</span>
          </div>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search NDR by AWB, Receiver, City, Client..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* NDR Shipments Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 p-12 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700">
          Loading NDR exception queue...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 text-center text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">All Clear! No Pending NDR Exceptions.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All shipment delivery attempts are progressing smoothly without active holds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              
              {/* Left Info */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-white">{item.awb_number}</span>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center border ${
                    (item.delivery_attempt || 1) >= 2 
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Attempt #{item.delivery_attempt || 1} Failed
                  </span>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {item.courier?.courier_name || 'Delhivery Express'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.receiver_name}</span>
                    <span className="block font-mono text-slate-500 mt-0.5">{item.receiver_phone || 'No phone'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.city}, {item.state}</span>
                    <span className="block text-slate-500 truncate max-w-[200px] mt-0.5">{item.receiver_address}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Partner</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.client?.company_name || 'Direct'}</span>
                    <span className="block text-slate-400 mt-0.5">
                      {item.updated_at ? format(new Date(item.updated_at), 'dd MMM, hh:mm a') : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Reason Banner */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider">Reported Failure Reason: </span>
                    <span className="font-semibold">{item.remarks || item.courier_status || 'Customer premises closed upon arrival'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-col gap-2 min-w-[210px]">
                <button 
                  onClick={() => openActionModal(item, 'REATTEMPT')}
                  className="flex items-center justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Request Re-attempt
                </button>
                <button 
                  onClick={() => openActionModal(item, 'UPDATE_PHONE')}
                  className="flex items-center justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                  Update Phone
                </button>
                <button 
                  onClick={() => openActionModal(item, 'UPDATE_ADDRESS')}
                  className="flex items-center justify-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Update Address
                </button>
                <button 
                  onClick={() => openActionModal(item, 'RTO')}
                  className="flex items-center justify-center px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                {actionType === 'REATTEMPT' && '🔄 Schedule Re-attempt'}
                {actionType === 'UPDATE_PHONE' && '📞 Update Receiver Phone'}
                {actionType === 'UPDATE_ADDRESS' && '🏠 Update Delivery Address'}
                {actionType === 'RTO' && '🚫 Authorize Return to Origin (RTO)'}
              </h3>
              <button onClick={() => setSelectedShipment(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><span className="text-slate-400">AWB Number:</span> <span className="font-mono font-bold text-blue-600">{selectedShipment.awb_number}</span></p>
              <p><span className="text-slate-400">Recipient:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{selectedShipment.receiver_name}</span></p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === 'UPDATE_PHONE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">New Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500" 
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              )}

              {actionType === 'UPDATE_ADDRESS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">New Delivery Address</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={newAddress} 
                    onChange={e => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-amber-500" 
                    placeholder="Full new street address with landmark..."
                  />
                </div>
              )}

              {actionType === 'REATTEMPT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Preferred Delivery Date</label>
                  <input 
                    type="date" 
                    value={preferredDate} 
                    onChange={e => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Remarks for Courier Partner Agent</label>
                <textarea 
                  rows={2} 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-amber-500" 
                  placeholder="e.g. Customer will be available after 3 PM, please call before delivery..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedShipment(null)} 
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
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
