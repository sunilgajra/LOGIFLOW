import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Package, CheckCircle2, Truck, IndianRupee, FileText, Upload, Users, Key, Plus, ExternalLink, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import TrackingModal from '../components/TrackingModal';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [trackingAwb, setTrackingAwb] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCreating, setLoginCreating] = useState(false);

  const fetchClientData = () => {
    if (!id) return;
    setLoading(true);
    fetchApi(`/clients/${id}`)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const handleAgreementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetchApi(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ agreement_document: reader.result })
          });
          if (res && res.error) {
            alert('Failed to upload agreement: ' + res.error);
          } else {
            fetchClientData();
            alert('Agreement uploaded successfully!');
          }
        } catch (error: any) {
          console.error(error);
          alert('Failed to upload agreement: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [extraCharges, setExtraCharges] = useState({
    tax_mode: 'INTRA_STATE',
    off_loading_charges: 0,
    vehicle_charges: 0,
    insurance_charges: 0,
    rto_charges: 0
  });

  const handleGenerateInvoice = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const res = await fetchApi('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ 
           clientId: id,
           ...extraCharges
        })
      });
      if (res && res.error) {
        alert(res.error);
      } else {
        setShowInvoicePrompt(false);
        if (res && res.invoice_number) {
          setData((prev: any) => ({
            ...prev,
            invoices: [res, ...(prev?.invoices || [])],
            stats: {
              ...(prev?.stats || {}),
              totalBilling: 0
            }
          }));
          setSelectedInvoice(res);
        } else {
          fetchClientData();
        }
      }
    } catch (err: any) {
      alert('Failed to generate invoice: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginCreating(true);
    try {
      const res = await fetchApi(`/clients/${id}/create-login`, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Sub-account login access created successfully!');
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        fetchClientData();
      }
    } catch (err: any) {
      alert('Failed to create login: ' + err.message);
    } finally {
      setLoginCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading client details...</div>;
  }

  if (!data || !data.client) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-bold">Client record not found.</p>
        <button onClick={() => navigate('/dashboard/clients')} className="text-blue-600 hover:underline text-xs font-bold">
          ← Go back to Client Portal
        </button>
      </div>
    );
  }

  const { client, company, stats, recentShipments, invoices } = data;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/dashboard/clients')}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-300 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            {client.company_name}
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {client.status || 'ACTIVE'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Client Account ID: {client.client_id}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contact Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-blue-600" /> Merchant Identity & Contacts
          </h3>
          <div className="space-y-2 text-xs">
            {client.contact_person && (
              <p className="text-slate-700 dark:text-slate-300 flex items-center font-medium">
                <span className="w-6"><Building2 className="w-4 h-4 text-slate-400" /></span>
                {client.contact_person}
              </p>
            )}
            {client.phone && (
              <p className="text-slate-700 dark:text-slate-300 flex items-center font-mono">
                <span className="w-6"><Phone className="w-4 h-4 text-slate-400" /></span>
                {client.phone}
              </p>
            )}
            {client.email && (
              <p className="text-slate-700 dark:text-slate-300 flex items-center font-medium">
                <span className="w-6"><Mail className="w-4 h-4 text-slate-400" /></span>
                {client.email}
              </p>
            )}
            {client.address && (
              <p className="text-slate-700 dark:text-slate-300 flex items-start mt-1">
                <span className="w-6 mt-0.5"><MapPin className="w-4 h-4 text-slate-400" /></span>
                <span className="flex-1">{client.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* Shipment Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Package className="w-4 h-4 mr-1.5 text-indigo-600" /> Shipment Volume Summary
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}`)} 
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 p-2 rounded-xl transition-colors"
            >
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalShipments || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total Booked</p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=DELIVERED`)} 
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 p-2 rounded-xl transition-colors"
            >
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats?.delivered || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Delivered
              </p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=IN_TRANSIT`)} 
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 p-2 rounded-xl transition-colors"
            >
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{stats?.inTransit || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 flex items-center">
                <Truck className="w-3 h-3 mr-1 text-blue-500" /> In Transit
              </p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=EXCEPTION`)} 
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 p-2 rounded-xl transition-colors"
            >
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">{(stats?.totalShipments || 0) - (stats?.delivered || 0) - (stats?.inTransit || 0)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Exceptions</p>
            </div>
          </div>
        </div>

        {/* Billing Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <IndianRupee className="w-4 h-4 mr-1.5 text-emerald-600" /> Billing & Uninvoiced Balance
          </h3>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ₹{(stats?.totalBilling || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Uninvoiced Freight Charges</p>
          </div>
          <div>
            {user?.role !== 'CLIENT' && (
              <button 
                onClick={() => setShowInvoicePrompt(true)}
                disabled={generating || (stats?.totalBilling || 0) === 0}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                {generating ? 'Generating Invoice...' : 'Generate Tax Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Account Portal Access */}
      {user?.role !== 'CLIENT' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Key className="w-4 h-4 mr-2 text-purple-600" /> Client Sub-Account Portal Credentials
            </h3>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Sub-Account Login
            </button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4">
            {client.users && client.users.length > 0 ? (
              <div className="space-y-2">
                {client.users.map((u: any) => (
                  <div key={u.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{u.email}</p>
                      <p className="text-[10px] text-slate-400">Created: {new Date(u.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-[10px] font-extrabold">Active Access</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No portal login credentials assigned to this client yet.</p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Create Portal Login Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agreement & Rate Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
          <FileText className="w-4 h-4 mr-2 text-blue-600" /> Business Agreement & Assigned Rate Cards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Attached SLA / Contract Agreement</h4>
            {client.agreement_document ? (
              <div className="space-y-3">
                {client.agreement_document.startsWith('data:image') ? (
                  <img src={client.agreement_document} alt="Agreement" className="max-h-44 object-contain rounded-xl border border-slate-200 mx-auto" />
                ) : (
                  <a href={client.agreement_document} download="Agreement.pdf" className="text-xs text-blue-600 hover:underline font-bold block">Download Agreement File</a>
                )}
                {user?.role !== 'CLIENT' && (
                  <label className="cursor-pointer text-xs text-blue-600 hover:underline font-bold block">
                    Upload Updated Contract
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAgreementUpload} />
                  </label>
                )}
              </div>
            ) : user?.role !== 'CLIENT' ? (
              <label className="cursor-pointer block py-5 text-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-500 font-medium block">Upload Signed PDF / Scan Agreement</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAgreementUpload} />
              </label>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No agreement uploaded yet.</div>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Active Rate Cards</h4>
            {(!data.rateCards || data.rateCards.length === 0) ? (
               <div className="text-xs text-slate-400 py-4 text-center space-y-2">
                 <p>No custom Rate Card assigned to this client.</p>
                 {user?.role !== 'CLIENT' && (
                   <button onClick={() => navigate('/dashboard/rates')} className="text-blue-600 hover:underline font-bold">Assign in Rate Cards Engine →</button>
                 )}
               </div>
            ) : (
              <div className="space-y-2">
                {data.rateCards.map((rc: any) => (
                  <div key={rc.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex justify-between items-center shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{rc.name}</p>
                      <p className="text-[10px] text-slate-400">Min Weight: {rc.min_weight_kg}kg | Docket: ₹{rc.docket_charge}</p>
                    </div>
                    {user?.role !== 'CLIENT' && (
                      <button onClick={() => navigate('/dashboard/rates')} className="text-xs text-blue-600 hover:underline font-bold">Configure</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Invoices */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Generated Tax Invoices ({invoices?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3">Invoice No</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Shipments</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {!invoices || invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(inv.invoice_date || Date.now()), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{inv.shipment_count}</td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                      ₹{inv.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {inv.status || 'SENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg"
                      >
                        View Tax PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity print:hidden" onClick={() => setSelectedInvoice(null)}>
              <div className="absolute inset-0 bg-slate-900/75"></div>
            </div>
            
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl print:w-full print:max-w-none print:shadow-none print:m-0 print:rounded-none">
              
              {/* Toolbar */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-2xl print:hidden">
                <h3 className="text-sm font-bold text-slate-900">Tax Invoice: {selectedInvoice.invoice_number}</h3>
                <div className="flex space-x-3">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                    Print / Save PDF
                  </button>
                  <button onClick={() => setSelectedInvoice(null)} className="text-slate-600 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-semibold">
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body */}
              <div className="p-8 bg-white text-slate-900 print:p-0 print:text-[10px]">
                <div className="border-2 border-emerald-600 mb-2">
                  <div className="text-center bg-emerald-50 py-1 font-bold border-b-2 border-emerald-600 text-sm">
                    TAX INVOICE
                    <br/>
                    {company?.name || 'LOGIFLOW LOGISTICS PVT LTD'}
                  </div>
                  <div className="text-center text-xs pb-1 font-medium border-b-2 border-emerald-600">
                    {company?.address || '408, 4th Floor, The Ambience Park, Sector 19A, Navi Mumbai 400705'}
                  </div>
                  
                  <div className="grid grid-cols-2 text-xs divide-x-2 divide-emerald-600">
                    <div className="p-2 space-y-1">
                      <p><strong>GST IN:</strong> {company?.gst_number || '27CCFPB3558P1Z7'}</p>
                      <p><strong>PAN:</strong> {company?.pan_number || 'CCFPB3558P'}</p>
                      <p><strong>Tax Payable On Reverse Charge:</strong> No</p>
                      <p><strong>Invoice Serial Number:</strong> {selectedInvoice.invoice_number}</p>
                      <p><strong>Invoice Date:</strong> {format(new Date(selectedInvoice.invoice_date || Date.now()), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <p><strong>Transportation Mode:</strong> AIR AND SURFACE</p>
                      <p><strong>Place Of Supply:</strong> MAHARASHTRA TO PAN INDIA</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 text-xs divide-x-2 divide-emerald-600 border-t-2 border-emerald-600">
                    <div className="p-2 space-y-1">
                      <p className="font-bold underline">Details Of Receiver (Billed To)</p>
                      <p><strong>Name:</strong> {client.company_name}</p>
                      <p><strong>Address:</strong> {client.address}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="font-bold underline">Details Of Consignee (Shipped To)</p>
                      <p><strong>GSTIN:</strong> {client.gst_number || '-'}</p>
                      <p><strong>State:</strong> MAHARASHTRA</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-emerald-600 overflow-x-auto">
                  <table className="w-full text-center text-[10px] divide-y-2 divide-emerald-600">
                    <thead className="bg-emerald-50 font-bold">
                      <tr className="divide-x-2 divide-emerald-600">
                        <th className="p-1">SR NO</th>
                        <th className="p-1">AWB NO</th>
                        <th className="p-1">DATE</th>
                        <th className="p-1">Pickup</th>
                        <th className="p-1">Destination</th>
                        <th className="p-1">QTY</th>
                        <th className="p-1">R.WGT</th>
                        <th className="p-1">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-600 font-medium">
                      {selectedInvoice.shipments?.map((s: any, idx: number) => {
                         const rwgt = Math.max(s.actual_weight || 0, s.volumetric_weight || 0);
                         return (
                        <tr key={s.id} className="divide-x-2 divide-emerald-600">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1">{s.awb_number}</td>
                          <td className="p-1">{s.booking_date ? format(new Date(s.booking_date), 'd-MMM') : '-'}</td>
                          <td className="p-1">{s.origin || '-'}</td>
                          <td className="p-1">{s.city || s.state || '-'}</td>
                          <td className="p-1">{s.number_of_pieces || 1}</td>
                          <td className="p-1">{rwgt.toFixed(2)}</td>
                          <td className="p-1">{s.client_charge ? s.client_charge.toFixed(2) : '0.00'}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end border-2 border-t-0 border-emerald-600 text-xs font-bold divide-x-2 divide-emerald-600">
                   <div className="flex-1 p-2">
                     <p className="text-blue-600 underline mb-2">Bank Account Details:</p>
                     <p>{company?.bank_name || 'HDFC Bank Ltd'}</p>
                     <p>A/C Name: {company?.account_name || 'LogiFlow Logistics Pvt Ltd'}</p>
                     <p>A/C NO: {company?.account_number || '50200088910245'}</p>
                     <p>IFSC CODE: {company?.ifsc_code || 'HDFC0000128'}</p>
                   </div>
                   <div className="w-1/3">
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-emerald-600"><span className="flex-1">Taxable Amount</span><span className="w-24 text-right">{selectedInvoice.taxable_amount?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-emerald-600 bg-emerald-100"><span className="flex-1">Total Tax</span><span className="w-24 text-right">{((selectedInvoice.cgst_amount || 0) + (selectedInvoice.sgst_amount || 0) + (selectedInvoice.igst_amount || 0)).toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 bg-emerald-200 divide-x-2 divide-emerald-600"><span className="flex-1 text-sm">Net Payable Total</span><span className="w-24 text-right text-sm">{selectedInvoice.total_amount?.toFixed(2)}</span></div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Extra Charges Modal */}
      {showInvoicePrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowInvoicePrompt(false)}>
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs"></div>
            </div>
            
            <div className="relative z-10 inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tax Invoice Options</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Tax Type</label>
                  <select 
                    value={extraCharges.tax_mode} 
                    onChange={e => setExtraCharges({...extraCharges, tax_mode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white"
                  >
                    <option value="INTRA_STATE">Intra-State (CGST 9% + SGST 9%)</option>
                    <option value="INTER_STATE">Inter-State (IGST 18%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Off Loading Charges (₹)</label>
                  <input 
                    type="number" 
                    value={extraCharges.off_loading_charges} 
                    onChange={e => setExtraCharges({...extraCharges, off_loading_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vehicle Charges (₹)</label>
                  <input 
                    type="number" 
                    value={extraCharges.vehicle_charges} 
                    onChange={e => setExtraCharges({...extraCharges, vehicle_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Insurance Charges (₹)</label>
                  <input 
                    type="number" 
                    value={extraCharges.insurance_charges} 
                    onChange={e => setExtraCharges({...extraCharges, insurance_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">RTO Charges (₹)</label>
                  <input 
                    type="number" 
                    value={extraCharges.rto_charges} 
                    onChange={e => setExtraCharges({...extraCharges, rto_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button onClick={() => setShowInvoicePrompt(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
                <button onClick={handleGenerateInvoice} disabled={generating} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">
                  {generating ? 'Generating...' : 'Confirm & Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowLoginModal(false)}>
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs"></div>
            </div>
            
            <div className="relative z-10 inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Client Portal Login Access</h3>
              
              <form onSubmit={handleCreateLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:bg-slate-700 dark:text-white"
                    placeholder="client@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
                    placeholder="Enter password"
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loginCreating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {loginCreating ? 'Creating...' : 'Create Login Access'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingAwb && (
        <TrackingModal awbNumber={trackingAwb} onClose={() => setTrackingAwb(null)} />
      )}
    </div>
  );
}
