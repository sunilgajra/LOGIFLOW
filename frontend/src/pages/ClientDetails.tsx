import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Package, CheckCircle2, Truck, IndianRupee, FileText, Upload, Users } from 'lucide-react';
import { format } from 'date-fns';
import TrackingModal from '../components/TrackingModal';

const ClientDetails = () => {
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      if (res.error) {
        alert(res.error);
      } else {
        alert('Invoice generated successfully!');
        fetchClientData(); // Refresh data
        setShowInvoicePrompt(false);
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
      if (res.error) {
        alert(res.error);
      } else {
        alert('Login access created successfully!');
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
      <div className="p-8 text-center">
        <p className="text-rose-500 mb-4">Client not found.</p>
        <button onClick={() => navigate('/dashboard/clients')} className="text-blue-600 hover:underline">
          Go back to clients
        </button>
      </div>
    );
  }

  const { client, company, stats, recentShipments, invoices } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/dashboard/clients')}
          className="p-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            {client.company_name}
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {client.status}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Client ID: {client.client_id}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <Building2 className="w-4 h-4 mr-2" /> Contact Info
          </h3>
          <div className="space-y-3">
            {client.contact_person && (
              <p className="text-sm text-slate-700 flex items-center">
                <span className="w-6"><Building2 className="w-4 h-4 text-slate-400" /></span>
                {client.contact_person}
              </p>
            )}
            {client.phone && (
              <p className="text-sm text-slate-700 flex items-center">
                <span className="w-6"><Phone className="w-4 h-4 text-slate-400" /></span>
                {client.phone}
              </p>
            )}
            {client.email && (
              <p className="text-sm text-slate-700 flex items-center">
                <span className="w-6"><Mail className="w-4 h-4 text-slate-400" /></span>
                {client.email}
              </p>
            )}
            {client.address && (
              <p className="text-sm text-slate-700 flex items-start mt-2">
                <span className="w-6 mt-0.5"><MapPin className="w-4 h-4 text-slate-400" /></span>
                <span className="flex-1">{client.address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <Package className="w-4 h-4 mr-2" /> Shipment Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}`)} 
              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-3xl font-bold text-slate-900">{stats.totalShipments}</p>
              <p className="text-xs text-slate-500 uppercase mt-1">Total Shipments</p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=DELIVERED`)} 
              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-3xl font-bold text-emerald-600">{stats.delivered}</p>
              <p className="text-xs text-slate-500 uppercase mt-1 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Delivered
              </p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=IN_TRANSIT`)} 
              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-xl font-bold text-blue-600">{stats.inTransit}</p>
              <p className="text-xs text-slate-500 uppercase mt-1 flex items-center">
                <Truck className="w-3 h-3 mr-1 text-blue-500" /> In Transit
              </p>
            </div>
            <div 
              onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}&status=EXCEPTION`)} 
              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-xl font-bold text-rose-600">{stats.totalShipments - stats.delivered - stats.inTransit}</p>
              <p className="text-xs text-slate-500 uppercase mt-1">Exceptions/Other</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <IndianRupee className="w-4 h-4 mr-2" /> Billing Overview
          </h3>
          <div className="mt-4">
            <p className="text-4xl font-black text-slate-900">
              ₹{stats.totalBilling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-500 mt-2">Total Uninvoiced Amount</p>
          </div>
          <div className="mt-6">
            {user?.role !== 'CLIENT' && (
              <button 
                onClick={() => setShowInvoicePrompt(true)}
                disabled={generating || stats.totalBilling === 0}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md text-sm font-medium transition-colors"
              >
                {generating ? 'Generating...' : 'Generate Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agreement & Rate Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-6 mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-slate-500" /> Agreement & Rate Cards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h4 className="font-semibold text-slate-800 mb-2">Attached Agreement</h4>
            {client.agreement_document ? (
              <div className="space-y-4">
                {client.agreement_document.startsWith('data:image') ? (
                  <img src={client.agreement_document} alt="Agreement" className="max-h-48 object-contain rounded" />
                ) : (
                  <a href={client.agreement_document} download="Agreement.pdf" className="text-blue-600 hover:underline">Download Agreement</a>
                )}
                {user?.role !== 'CLIENT' && (
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium block">
                    Upload New Agreement
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAgreementUpload} />
                  </label>
                )}
              </div>
            ) : user?.role !== 'CLIENT' ? (
              <label className="cursor-pointer block py-4 text-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-100">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-sm text-slate-500">Upload Signed Agreement</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAgreementUpload} />
              </label>
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">No agreement uploaded yet.</div>
            )}
          </div>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h4 className="font-semibold text-slate-800 mb-2">Active Rate Cards</h4>
            {(!data.rateCards || data.rateCards.length === 0) ? (
               <div className="text-sm text-slate-500 py-4 text-center">
                 No Rate Card assigned to this client. 
                 <br />
                 {user?.role !== 'CLIENT' && (
                   <button onClick={() => navigate('/dashboard/rates')} className="text-blue-600 hover:underline mt-1">Assign in Rate Cards Engine</button>
                 )}
               </div>
            ) : (
              <div className="space-y-3 mt-3">
                {data.rateCards.map((rc: any) => (
                  <div key={rc.id} className="bg-white border border-slate-200 p-3 rounded flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{rc.name}</p>
                      <p className="text-xs text-slate-500">Min Weight: {rc.min_weight_kg}kg | Docket: ₹{rc.docket_charge}</p>
                    </div>
                    {user?.role !== 'CLIENT' && (
                      <button onClick={() => navigate('/dashboard/rates')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portal Access */}
      {user?.role !== 'CLIENT' && (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-slate-500" /> Client Portal Access
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          {client.users && client.users.length > 0 ? (
            <div>
              <p className="text-sm text-slate-700 font-medium mb-3">Active Login Accounts:</p>
              <div className="space-y-2">
                {client.users.map((u: any) => (
                  <div key={u.id} className="flex justify-between items-center bg-white p-3 border rounded shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{u.email}</p>
                      <p className="text-xs text-slate-500">Created: {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Active</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Another Login
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-3">This client does not have portal access yet.</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Create Login Access
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Recent Shipments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Shipments</h2>
          <button onClick={() => navigate(`/dashboard/shipments?clientId=${client.id}`)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">AWB No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {!data.recentShipments || data.recentShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No shipments found for this client.</td>
                </tr>
              ) : (
                data.recentShipments.slice(0, 10).map((ship: any) => (
                  <tr key={ship.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <button onClick={() => setTrackingAwb(ship.awb_number)} className="hover:text-blue-800 hover:underline">
                        {ship.awb_number}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {ship.booking_date ? format(new Date(ship.booking_date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{ship.receiver_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{ship.city || ship.state}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{ship.actual_weight || ship.volumetric_weight} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ship.internal_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        ship.internal_status === 'IN_TRANSIT' || ship.internal_status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                        ship.internal_status === 'EXCEPTION' || ship.internal_status === 'RTO' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ship.internal_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Generated Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Shipments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {!invoices || invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{inv.invoice_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(inv.invoice_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{inv.shipment_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      ₹{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                      >
                        View PDF
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
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen print:hidden">&#8203;</span>
            
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl print:w-full print:max-w-none print:shadow-none print:m-0 print:rounded-none">
              
              {/* Toolbar */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-xl print:hidden">
                <h3 className="text-lg font-bold text-slate-900">Invoice: {selectedInvoice.invoice_number}</h3>
                <div className="flex space-x-3">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Print / Save PDF
                  </button>
                  <button onClick={() => setSelectedInvoice(null)} className="text-slate-500 hover:text-slate-700 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium">
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body */}
              <div className="p-8 bg-white text-slate-900 print:p-0 print:text-[10px]">
                {/* Header Section */}
                <div className="border-2 border-green-600 mb-2">
                  <div className="text-center bg-green-50 py-1 font-bold border-b-2 border-green-600 text-sm">
                    TAX INVOICE
                    <br/>
                    {company?.name || 'ROYALE EXPRESS AND LOGISTICS'}
                  </div>
                  <div className="text-center text-xs pb-1 font-medium border-b-2 border-green-600">
                    {company?.address || '408, 4th Floor, The Ambience Park, Sector 19A, Navi Mumbai 400705'}
                  </div>
                  
                  <div className="grid grid-cols-2 text-xs divide-x-2 divide-green-600">
                    <div className="p-2 space-y-1">
                      <p><strong>GST IN:</strong> {company?.gst_number || '27CCFPB3558P1Z7'}</p>
                      <p><strong>PAN:</strong> {company?.pan_number || 'CCFPB3558P'}</p>
                      <p><strong>Tax Is Payable On Reverse Charge:</strong> No</p>
                      <p><strong>Invoice Serial Number:</strong> {selectedInvoice.invoice_number}</p>
                      <p><strong>Invoice Date:</strong> {format(new Date(selectedInvoice.invoice_date), 'dd/MM/yyyy')}</p>
                      <p><strong>Due Date:</strong> {format(new Date(selectedInvoice.due_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <p><strong>Transportation Mode:</strong> AIR AND SURFACE</p>
                      <p><strong>Veh No.</strong></p>
                      <p><strong>Date And Time Of Supply:</strong> {format(new Date(selectedInvoice.invoice_date), 'MMMM yyyy')}</p>
                      <p><strong>Place Of Supply:</strong> MAHARASHTRA TO PAN INDIA</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 text-xs divide-x-2 divide-green-600 border-t-2 border-green-600">
                    <div className="p-2 space-y-1">
                      <p className="font-bold underline">Details Of Receiver (Billed To)</p>
                      <p><strong>Name:</strong> {client.company_name}</p>
                      <p><strong>Address:</strong> {client.address}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="font-bold underline">Details Of Consignee (Shipped To)</p>
                      <p><strong>GSTIN:</strong> {client.gst_number}</p>
                      <p><strong>State:</strong> MAHARASHTRA</p>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="border-2 border-green-600 overflow-x-auto">
                  <table className="w-full text-center text-[10px] divide-y-2 divide-green-600">
                    <thead className="bg-green-50 font-bold">
                      <tr className="divide-x-2 divide-green-600">
                        <th className="p-1">SR NO</th>
                        <th className="p-1">AWB NO</th>
                        <th className="p-1">DATE</th>
                        <th className="p-1">Pickup</th>
                        <th className="p-1">Destination</th>
                        <th className="p-1">Inv No.</th>
                        <th className="p-1">QTY</th>
                        <th className="p-1">R.WGT</th>
                        <th className="p-1">Rate</th>
                        <th className="p-1">Green Tax</th>
                        <th className="p-1">ODA Amt</th>
                        <th className="p-1">FOV</th>
                        <th className="p-1">DOC</th>
                        <th className="p-1">Total A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-600 font-medium">
                      {selectedInvoice.shipments?.map((s: any, idx: number) => {
                         const rwgt = Math.max(s.actual_weight || 0, s.volumetric_weight || 0);
                         return (
                        <tr key={s.id} className="divide-x-2 divide-green-600">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1">{s.awb_number}</td>
                          <td className="p-1">{s.booking_date ? format(new Date(s.booking_date), 'd-MMM') : '-'}</td>
                          <td className="p-1">{s.origin || '-'}</td>
                          <td className="p-1">{s.city || s.state || '-'}</td>
                          <td className="p-1">{s.client_reference_no || '-'}</td>
                          <td className="p-1">{s.number_of_pieces || 1}</td>
                          <td className="p-1">{rwgt.toFixed(2)}</td>
                          <td className="p-1">-</td>
                          <td className="p-1">{s.green_tax_amount ? s.green_tax_amount.toFixed(2) : '-'}</td>
                          <td className="p-1">{s.oda_amount ? s.oda_amount.toFixed(2) : '-'}</td>
                          <td className="p-1">-</td>
                          <td className="p-1">-</td>
                          <td className="p-1">{s.client_charge ? s.client_charge.toFixed(2) : '0.00'}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div className="flex justify-end border-2 border-t-0 border-green-600 text-xs font-bold divide-x-2 divide-green-600">
                   <div className="flex-1 p-2">
                     <p className="text-blue-600 underline mb-2">Bank Details:</p>
                     <p>Kotak Mahindra Bank</p>
                     <p>AC NO- 9769505021</p>
                     <p>IFSC CODE: KKBK0000069</p>
                   </div>
                   <div className="w-1/3">
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">Total</span><span className="w-24 text-right">{selectedInvoice.subtotal?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">Off Loading</span><span className="w-24 text-right">{selectedInvoice.off_loading_charges?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">Vehicle Charges</span><span className="w-24 text-right">{selectedInvoice.vehicle_charges?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">Insurance Charges</span><span className="w-24 text-right">{selectedInvoice.insurance_charges?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">FSC Charge</span><span className="w-24 text-right">{selectedInvoice.total_fsc?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">IDC Charges</span><span className="w-24 text-right">{selectedInvoice.total_idc?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">RTO Charges</span><span className="w-24 text-right">{selectedInvoice.rto_charges?.toFixed(2) || '-'}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600 bg-green-100"><span className="flex-1">Sub Total</span><span className="w-24 text-right">{selectedInvoice.taxable_amount?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">CGST</span><span className="w-24 text-right">{selectedInvoice.cgst_amount?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">SGST</span><span className="w-24 text-right">{selectedInvoice.sgst_amount?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 border-b divide-x-2 divide-green-600"><span className="flex-1">Round off</span><span className="w-24 text-right">{selectedInvoice.round_off?.toFixed(2)}</span></div>
                     <div className="flex justify-between p-1 bg-green-200 divide-x-2 divide-green-600"><span className="flex-1 text-sm">Net Total</span><span className="w-24 text-right text-sm">{selectedInvoice.total_amount?.toFixed(2)}</span></div>
                   </div>
                </div>

                <div className="border-2 border-t-0 border-green-600 p-2 text-xs font-bold">
                   AMOUNT: Rs. {selectedInvoice.total_amount} Only
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
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Invoice Charges</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Off Loading Charges (Rs)</label>
                  <input 
                    type="number" 
                    value={extraCharges.off_loading_charges} 
                    onChange={e => setExtraCharges({...extraCharges, off_loading_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Charges (Rs)</label>
                  <input 
                    type="number" 
                    value={extraCharges.vehicle_charges} 
                    onChange={e => setExtraCharges({...extraCharges, vehicle_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Charges (Rs)</label>
                  <input 
                    type="number" 
                    value={extraCharges.insurance_charges} 
                    onChange={e => setExtraCharges({...extraCharges, insurance_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RTO Charges (Rs)</label>
                  <input 
                    type="number" 
                    value={extraCharges.rto_charges} 
                    onChange={e => setExtraCharges({...extraCharges, rto_charges: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setShowInvoicePrompt(false)} className="px-4 py-2 text-gray-600 border rounded-md">Cancel</button>
                <button onClick={handleGenerateInvoice} disabled={generating} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                  {generating ? 'Generating...' : 'Confirm & Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Create Client Login</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateLogin} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="client@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter a secure password"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loginCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loginCreating ? 'Creating...' : 'Create Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingAwb && (
        <TrackingModal awbNumber={trackingAwb} onClose={() => setTrackingAwb(null)} />
      )}
    </div>
  );
};

export default ClientDetails;
