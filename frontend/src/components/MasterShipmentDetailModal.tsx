import React, { useState } from 'react';
import {
  X, Building2, User, Truck, Clock, ShieldAlert, FileText, Upload,
  CheckCircle2, AlertTriangle, ArrowRight, DollarSign, Calendar, RefreshCw
} from 'lucide-react';
import { api } from '../api';

interface MasterShipmentDetailModalProps {
  shipment: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const MasterShipmentDetailModal: React.FC<MasterShipmentDetailModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'demurrage' | 'pod' | 'timeline'>('details');
  const [podStatus, setPodStatus] = useState<string>(shipment?.pod_status || 'PENDING');
  const [podUrl, setPodUrl] = useState<string>(shipment?.pod_doc_url || '');
  const [updatingPod, setUpdatingPod] = useState(false);
  const [podMsg, setPodMsg] = useState('');

  if (!isOpen || !shipment) return null;

  const handleUpdatePod = async () => {
    try {
      setUpdatingPod(true);
      setPodMsg('');
      const res = await api.updatePodStatus(shipment.id || shipment.awb_number, podStatus, podUrl);
      if (res && res.success) {
        setPodMsg('POD status updated successfully!');
        if (onRefresh) onRefresh();
      } else {
        setPodMsg(res?.error || 'Failed to update POD');
      }
    } catch (e: any) {
      setPodMsg(e.message || 'Error updating POD');
    } finally {
      setUpdatingPod(false);
    }
  };

  const formattedDate = (d: any) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return String(d);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold rounded-md">
              AWB: {shipment.awb_number}
            </div>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              shipment.internal_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              shipment.internal_status === 'RTO' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {shipment.internal_status || 'BOOKED'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6 space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Shipment Details</span>
          </button>

          <button
            onClick={() => setActiveTab('demurrage')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'demurrage'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Demurrage Module</span>
          </button>

          <button
            onClick={() => setActiveTab('pod')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'pod'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>POD Document</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Event Timeline</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: MASTER SHIPMENT DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">

              {/* Ownership Legend Banner */}
              <div className="flex flex-wrap items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">Data Ownership Badges:</span>
                <div className="flex space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Company-Owned
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Courier-Owned
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    System-Calculated
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. COMPANY INFORMATION */}
                <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
                    <h3 className="text-sm font-semibold text-blue-400 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>Company Information</span>
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded">Company-Owned</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Client / Company</span>
                      <p className="font-medium text-slate-200">{shipment.client?.company_name || shipment.consignor || 'LOGIFLOW'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">A/C Code</span>
                      <p className="font-medium text-slate-200">{shipment.ac_code || shipment.client_id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Consignor / Shipper</span>
                      <p className="font-medium text-slate-200">{shipment.consignor || shipment.sender_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pickup Facility</span>
                      <p className="font-medium text-slate-200">{shipment.pickup_location || shipment.origin || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Invoice Number</span>
                      <p className="font-medium text-indigo-400 font-mono">{shipment.invoice_no || shipment.client_reference_no || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Invoice Amount</span>
                      <p className="font-medium text-slate-200">₹{(shipment.invoice_amt || shipment.declared_value || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Weight (Billed / Chargeable)</span>
                      <p className="font-medium text-slate-200">{shipment.b_weight || shipment.chargeable_weight || 0} kg</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Quantity / Pieces</span>
                      <p className="font-medium text-slate-200">{shipment.qty || shipment.number_of_pieces || 1} Pcs</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Service & Zone</span>
                      <p className="font-medium text-slate-200">{shipment.service_type || 'EXPRESS'} ({shipment.client_zone || 'Zone A'})</p>
                    </div>
                    <div>
                      <span className="text-slate-400">ROV Type</span>
                      <p className="font-medium text-slate-200">{shipment.rov_type || 'STANDARD'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. CONSIGNEE INFORMATION */}
                <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
                    <h3 className="text-sm font-semibold text-blue-400 flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span>Consignee Details</span>
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded">Company-Owned</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Consignee Name</span>
                      <p className="font-medium text-slate-200">{shipment.receiver_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact Phone</span>
                      <p className="font-medium text-slate-200">{shipment.receiver_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Destination City</span>
                      <p className="font-medium text-slate-200">{shipment.city || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">State</span>
                      <p className="font-medium text-slate-200">{shipment.state || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pincode</span>
                      <p className="font-medium text-slate-200">{shipment.pincode || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Delivery Address</span>
                      <p className="font-medium text-slate-200">{shipment.receiver_address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. COURIER INFORMATION */}
                <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-900/30">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span>Courier Partner Information</span>
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded">Courier-Owned</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Courier Partner</span>
                      <p className="font-medium text-slate-200">{shipment.courier?.courier_name || 'Delhivery'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">AWB Number</span>
                      <p className="font-medium text-emerald-400 font-mono">{shipment.awb_number}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Courier Status</span>
                      <p className="font-medium text-slate-200">{shipment.courier_status || shipment.internal_status}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">EDD Date</span>
                      <p className="font-medium text-slate-200">{formattedDate(shipment.edd_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Delivered Date</span>
                      <p className="font-medium text-emerald-400">{formattedDate(shipment.delivery_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">RTO Date / Docket</span>
                      <p className="font-medium text-rose-400">{shipment.rto_docket || formattedDate(shipment.rto_date)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Courier Remarks</span>
                      <p className="font-medium text-slate-300 italic">{shipment.remarks || 'No courier remarks'}</p>
                    </div>
                  </div>
                </div>

                {/* 4. DELIVERY PERFORMANCE */}
                <div className="bg-slate-950 border border-purple-900/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                    <h3 className="text-sm font-semibold text-purple-400 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Delivery Performance</span>
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded">System / Attempts</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Transit Days</span>
                      <p className="font-medium text-slate-200">{shipment.transit_days || 0} Days</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Days to Deliver</span>
                      <p className="font-medium text-purple-300 font-bold">{shipment.days_to_deliver || 0} Days</p>
                    </div>
                    <div>
                      <span className="text-slate-400">1st Attempt Date</span>
                      <p className="font-medium text-slate-200">{formattedDate(shipment.attempt_1_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">2nd Attempt Date</span>
                      <p className="font-medium text-slate-200">{formattedDate(shipment.attempt_2_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">3rd Attempt Date</span>
                      <p className="font-medium text-slate-200">{formattedDate(shipment.attempt_3_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Appointment Date</span>
                      <p className="font-medium text-indigo-300">{formattedDate(shipment.appointment_date_a || shipment.appointment_date)}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DEMURRAGE MODULE */}
          {activeTab === 'demurrage' && (
            <div className="space-y-6 bg-slate-950 border border-amber-900/40 p-6 rounded-xl">
              <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-amber-400 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <span>Demurrage Calculation Module</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Holding charges accrued for shipments stored beyond the demurrage free period.
                  </p>
                </div>
                <span className="text-xs uppercase font-bold text-amber-400 bg-amber-900/40 px-3 py-1 rounded-full border border-amber-500/30">
                  System-Calculated
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Demurrage Free Days</span>
                  <p className="text-xl font-bold text-slate-100 mt-1">{shipment.demurrage_free_days || 3} Days</p>
                </div>

                <div className="bg-slate-900 border border-amber-800/40 p-4 rounded-xl">
                  <span className="text-xs text-amber-400 font-medium">Demurrage Days Held</span>
                  <p className="text-xl font-bold text-amber-400 mt-1">{shipment.demurrage_days || 0} Days</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Applicable Rate / Day</span>
                  <p className="text-xl font-bold text-slate-100 mt-1">₹{Number(shipment.demurrage_rate || 0).toLocaleString()}</p>
                </div>

                <div className="bg-slate-900 border border-emerald-800/40 p-4 rounded-xl">
                  <span className="text-xs text-emerald-400 font-medium">Total Demurrage (incl. GST)</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">₹{Number(shipment.total_demurrage || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <h4 className="font-semibold text-slate-300">Demurrage Calculation Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-400">
                  <div>Base Demurrage Amount: <span className="text-slate-200 font-medium">₹{Number(shipment.demurrage_amount || 0).toLocaleString()}</span></div>
                  <div>Configured GST (%): <span className="text-slate-200 font-medium">{shipment.demurrage_gst_pct || 18}%</span></div>
                  <div>GST Charge Amount: <span className="text-slate-200 font-medium">₹{Number(shipment.demurrage_gst_amount || 0).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POD DOCUMENT */}
          {activeTab === 'pod' && (
            <div className="space-y-6 bg-slate-950 border border-blue-900/40 p-6 rounded-xl">
              <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-blue-400 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Proof of Delivery (POD) Management</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload, verify, and view proof of delivery files associated with AWB {shipment.awb_number}.
                  </p>
                </div>
              </div>

              {podMsg && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-xs">
                  {podMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">POD Status</label>
                    <select
                      value={podStatus}
                      onChange={(e) => setPodStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="VERIFIED">VERIFIED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">POD Document / Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/pod-document.pdf"
                      value={podUrl}
                      onChange={(e) => setPodUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleUpdatePod}
                    disabled={updatingPod}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{updatingPod ? 'Updating POD...' : 'Save POD Details'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  {podUrl || shipment.pod_doc_url ? (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                      <p className="text-xs font-medium text-slate-200">POD File Attached</p>
                      <a
                        href={podUrl || shipment.pod_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:underline font-semibold"
                      >
                        <span>View / Download POD File</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-500">
                      <FileText className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-xs">No POD Document Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVENT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 bg-slate-950 border border-purple-900/40 p-6 rounded-xl">
              <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                <h3 className="text-base font-semibold text-purple-400 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span>Chronological Shipment Timeline</span>
                </h3>
              </div>

              {shipment.shipment_events && shipment.shipment_events.length > 0 ? (
                <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pl-6">
                  {shipment.shipment_events.map((evt: any, idx: number) => (
                    <div key={evt.id || idx} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-4 border-slate-950" />
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300">{evt.event_type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formattedDate(evt.event_date)}</span>
                        </div>
                        <p className="text-xs text-slate-300">{evt.description || 'Event registered'}</p>
                        <div className="text-[10px] text-slate-500 flex space-x-3 pt-1">
                          <span>Source: {evt.source || 'COURIER'}</span>
                          {evt.courier && <span>Courier: {evt.courier}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No discrete shipment events logged yet. Status history will populate automatically as courier delivery sheets are imported.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Close Detail View
          </button>
        </div>

      </div>
    </div>
  );
};
