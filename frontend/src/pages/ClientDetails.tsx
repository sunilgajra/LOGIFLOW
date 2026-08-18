import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Package, CheckCircle2, Truck, IndianRupee, FileText, Upload, Users, Key, Plus, Printer, X } from 'lucide-react';
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
      
      {/* Printable CSS Page Rule */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center space-x-4 no-print">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4 no-print">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4 no-print">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 overflow-hidden no-print">
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
                        View Standard A4 PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STANDARD A4 TAX INVOICE MODAL & PRINT CONTAINER */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="relative w-full max-w-[215mm] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden print-full-page print:rounded-none print:shadow-none my-6">
            
            {/* Screen Action Toolbar */}
            <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center no-print">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Standard A4 Tax Invoice Preview — {selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center"
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print / Save A4 PDF
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Standard A4 Printable Invoice Sheet (210mm x 297mm) */}
            <div className="w-[210mm] max-w-full min-h-[297mm] bg-white text-slate-900 font-sans mx-auto p-8 border border-slate-200 print:border-none print:p-4 print:w-full space-y-4 text-xs">
              
              {/* Header Box */}
              <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
                
                {/* Title Banner */}
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center border-b-2 border-slate-800">
                  <div>
                    {company?.branding_logo ? (
                      <img src={company.branding_logo} alt="Company Logo" className="max-h-10 object-contain mb-1" />
                    ) : null}
                    <h2 className="text-base font-black tracking-wide uppercase">{company?.name || 'LOGIFLOW LOGISTICS PRIVATE LIMITED'}</h2>
                    <p className="text-[10px] text-slate-300">{company?.address || '408, 4th Floor, Ambience Park, Sector 19A, Vashi, Navi Mumbai, MH 400705'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded">TAX INVOICE</span>
                    <p className="text-[11px] font-mono font-bold mt-1 text-slate-200">Invoice #: {selectedInvoice.invoice_number}</p>
                  </div>
                </div>

                {/* Company GSTIN & Document Meta Grid */}
                <div className="grid grid-cols-2 text-[11px] divide-x border-b border-slate-800">
                  <div className="p-2.5 space-y-1 bg-slate-50">
                    <p><strong className="text-slate-700">GSTIN:</strong> <span className="font-mono font-bold uppercase">{company?.gst_number || '27CCFPB3558P1Z7'}</span></p>
                    <p><strong className="text-slate-700">PAN:</strong> <span className="font-mono font-bold uppercase">{company?.pan_number || 'CCFPB3558P'}</span></p>
                    <p><strong className="text-slate-700">State Code:</strong> <span className="font-bold">27 (Maharashtra)</span></p>
                    <p><strong className="text-slate-700">Reverse Charge:</strong> <span className="font-bold">NO</span></p>
                  </div>
                  <div className="p-2.5 space-y-1 bg-slate-50">
                    <p><strong className="text-slate-700">Invoice Date:</strong> <span className="font-bold">{format(new Date(selectedInvoice.invoice_date || Date.now()), 'dd/MM/yyyy')}</span></p>
                    <p><strong className="text-slate-700">Due Date:</strong> <span className="font-bold">{format(new Date(selectedInvoice.due_date || Date.now()), 'dd/MM/yyyy')}</span></p>
                    <p><strong className="text-slate-700">Transport Mode:</strong> <span className="font-bold">EXPRESS SURFACE / AIR</span></p>
                    <p><strong className="text-slate-700">Place of Supply:</strong> <span className="font-bold">MAHARASHTRA TO PAN INDIA</span></p>
                  </div>
                </div>

                {/* Receiver (Billed To) & Consignee Grid */}
                <div className="grid grid-cols-2 text-[11px] divide-x">
                  <div className="p-3 space-y-1">
                    <p className="font-extrabold uppercase text-blue-700 text-[10px] tracking-wider mb-1">BILLED TO (RECEIVER)</p>
                    <p className="font-bold text-sm text-slate-900">{client.company_name}</p>
                    <p className="text-slate-600 leading-tight">{client.address || 'Registered Merchant Office Address'}</p>
                    <p><strong className="text-slate-700">GSTIN:</strong> <span className="font-mono font-bold">{client.gst_number || 'UNREGISTERED'}</span></p>
                    <p><strong className="text-slate-700">PAN:</strong> <span className="font-mono font-bold">{client.pan_number || '-'}</span></p>
                    <p><strong className="text-slate-700">Contact:</strong> {client.contact_person} ({client.phone || client.email})</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-extrabold uppercase text-indigo-700 text-[10px] tracking-wider mb-1">SHIPPED TO (CONSIGNEE)</p>
                    <p className="font-bold text-slate-900">{client.company_name}</p>
                    <p className="text-slate-600 leading-tight">{client.address || 'Same as Billed Address'}</p>
                    <p><strong className="text-slate-700">State:</strong> MAHARASHTRA</p>
                    <p><strong className="text-slate-700">Dispatch Hub:</strong> WEST ZONE LOGISTICS HUB</p>
                  </div>
                </div>

              </div>

              {/* Itemized Shipment Manifest Table */}
              <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-center text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider">
                      <th className="p-1.5 border-r border-slate-700">#</th>
                      <th className="p-1.5 border-r border-slate-700">AWB NUMBER</th>
                      <th className="p-1.5 border-r border-slate-700">DATE</th>
                      <th className="p-1.5 border-r border-slate-700">ORIGIN</th>
                      <th className="p-1.5 border-r border-slate-700">DESTINATION</th>
                      <th className="p-1.5 border-r border-slate-700">PCS</th>
                      <th className="p-1.5 border-r border-slate-700">WEIGHT (KG)</th>
                      <th className="p-1.5 border-r border-slate-700">FREIGHT (₹)</th>
                      <th className="p-1.5">TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-medium">
                    {selectedInvoice.shipments?.map((s: any, idx: number) => {
                      const rwgt = Math.max(s.actual_weight || 0, s.volumetric_weight || 0);
                      const freight = (s.client_charge || 0) - (s.green_tax_amount || 0) - (s.oda_amount || 0);
                      return (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-1.5 border-r border-slate-300">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-900">{s.awb_number}</td>
                          <td className="p-1.5 border-r border-slate-300">{s.booking_date ? format(new Date(s.booking_date), 'dd-MMM-yyyy') : '-'}</td>
                          <td className="p-1.5 border-r border-slate-300">{s.origin || 'MH'}</td>
                          <td className="p-1.5 border-r border-slate-300">{s.city || s.state || '-'}</td>
                          <td className="p-1.5 border-r border-slate-300">{s.number_of_pieces || 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-bold">{rwgt.toFixed(2)}</td>
                          <td className="p-1.5 border-r border-slate-300">{freight > 0 ? freight.toFixed(2) : (s.client_charge || 0).toFixed(2)}</td>
                          <td className="p-1.5 font-bold text-slate-900">₹{(s.client_charge || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & Bank Details Footer */}
              <div className="border-2 border-slate-800 rounded-lg overflow-hidden grid grid-cols-2 divide-x divide-slate-800">
                
                {/* Left Side: Bank Details & Stamp */}
                <div className="p-3 space-y-3 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <p className="font-extrabold uppercase text-blue-700 text-[10px] tracking-wider mb-1">REMITTANCE BANK ACCOUNT DETAILS</p>
                    <div className="space-y-0.5 text-[11px]">
                      <p><strong className="text-slate-700">Bank Name:</strong> {company?.bank_name || 'HDFC Bank Ltd'}</p>
                      <p><strong className="text-slate-700">Account Name:</strong> {company?.account_name || 'LogiFlow Logistics Pvt Ltd'}</p>
                      <p><strong className="text-slate-700">Account Number:</strong> <span className="font-mono font-bold">{company?.account_number || '50200088910245'}</span></p>
                      <p><strong className="text-slate-700">IFSC Code:</strong> <span className="font-mono font-bold uppercase">{company?.ifsc_code || 'HDFC0000128'}</span></p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-300">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">FOR {company?.name || 'LOGIFLOW LOGISTICS PVT LTD'}</p>
                    <div className="h-8 border-b border-dashed border-slate-400"></div>
                    <p className="text-[9px] text-center font-bold text-slate-600 mt-1 uppercase">AUTHORIZED SIGNATORY</p>
                  </div>
                </div>

                {/* Right Side: Tax Breakdown Table */}
                <div className="text-[11px] divide-y divide-slate-300">
                  <div className="flex justify-between p-2">
                    <span className="text-slate-600">Freight Subtotal</span>
                    <span className="font-bold">₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.off_loading_charges > 0 && (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">Off Loading Charges</span>
                      <span className="font-bold">₹{selectedInvoice.off_loading_charges.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.vehicle_charges > 0 && (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">Vehicle Charges</span>
                      <span className="font-bold">₹{selectedInvoice.vehicle_charges.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.insurance_charges > 0 && (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">Insurance Charges</span>
                      <span className="font-bold">₹{selectedInvoice.insurance_charges.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.rto_charges > 0 && (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">RTO Charges</span>
                      <span className="font-bold">₹{selectedInvoice.rto_charges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 bg-slate-100 font-bold">
                    <span>Taxable Value</span>
                    <span>₹{selectedInvoice.taxable_amount?.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.igst_amount > 0 ? (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">IGST (18%)</span>
                      <span className="font-bold">₹{selectedInvoice.igst_amount?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between p-2">
                        <span className="text-slate-600">CGST (9%)</span>
                        <span className="font-bold">₹{(selectedInvoice.cgst_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span className="text-slate-600">SGST (9%)</span>
                        <span className="font-bold">₹{(selectedInvoice.sgst_amount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {selectedInvoice.round_off !== 0 && (
                    <div className="flex justify-between p-2">
                      <span className="text-slate-600">Round Off</span>
                      <span className="font-bold">₹{(selectedInvoice.round_off || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 bg-slate-900 text-white font-black text-xs">
                    <span>NET PAYABLE AMOUNT</span>
                    <span>₹{selectedInvoice.total_amount?.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Notice */}
              <div className="text-[9px] text-slate-500 text-center pt-2">
                This is a computer-generated Tax Invoice issued under Indian GST Rules 2017. No signature required if electronically transmitted.
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Generate Invoice Extra Charges Modal */}
      {showInvoicePrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
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
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
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
