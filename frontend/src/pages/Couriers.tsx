import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Truck, Plus, X, FileText, ChevronRight, Edit2, Trash2, Save, ArrowLeft, Download } from 'lucide-react';

const emptyRateCard = {
  name: '',
  type: 'COURIER',
  min_weight_kg: '',
  docket_charge: '',
  min_booking_amount: '',
  volumetric_divisor: '5000',
  fov_percentage: '',
  fov_minimum: '',
  fsc_percentage: '',
  idc_percentage: '',
  oda_charge: '',
  green_tax_rate: '',
  rates_matrix: '{}',
};

const Couriers = () => {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'ratecard'>('details');

  // Courier form
  const [formData, setFormData] = useState({
    courier_id: '',
    courier_name: '',
    tracking_url_format: '',
    api_key: '',
    api_secret: ''
  });
  const [saving, setSaving] = useState(false);

  // Edit courier details
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  // Rate card state
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [rcLoading, setRcLoading] = useState(false);
  const [editingRc, setEditingRc] = useState<any | null>(null);
  const [rcForm, setRcForm] = useState<any>(emptyRateCard);
  const [rcSaving, setRcSaving] = useState(false);
  const [showRcForm, setShowRcForm] = useState(false);

  // Zones for rate matrix display
  const [zones, setZones] = useState<string[]>([]);

  const fetchCouriers = () => {
    setLoading(true);
    fetchApi('/couriers')
      .then(data => {
        setCouriers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCouriers();
    fetchApi('/zones').then((z: any[]) => {
      const uniqueZones = [...new Set(z.map((z: any) => z.zone_name))].sort();
      setZones(uniqueZones);
    }).catch(console.error);
  }, []);

  const fetchRateCards = (courierId: string) => {
    setRcLoading(true);
    fetchApi('/rates').then((all: any[]) => {
      setRateCards(all.filter(r => r.courier_id === courierId && r.type === 'COURIER'));
      setRcLoading(false);
    }).catch(console.error);
  };

  const handleSelectCourier = (courier: any) => {
    setSelectedCourier(courier);
    setActiveTab('details');
    setEditMode(false);
    fetchRateCards(courier.id);
  };

  const openEdit = () => {
    let apiCreds = { api_key: '', api_secret: '', client_id: '', webhook_url: '' };
    try {
      if (selectedCourier.api_credentials) {
        apiCreds = JSON.parse(selectedCourier.api_credentials);
      }
    } catch (e) {}

    setEditForm({
      courier_name: selectedCourier.courier_name || '',
      contact_person: selectedCourier.contact_person || '',
      phone: selectedCourier.phone || '',
      email: selectedCourier.email || '',
      account_number: selectedCourier.account_number || '',
      gst_number: selectedCourier.gst_number || '',
      billing_cycle: selectedCourier.billing_cycle || '',
      status: selectedCourier.status || 'ACTIVE',
      notes: selectedCourier.notes || '',
      agreement_document: selectedCourier.agreement_document || '',
      api_key: apiCreds.api_key || '',
      api_secret: apiCreds.api_secret || '',
      client_id: apiCreds.client_id || '',
      webhook_url: apiCreds.webhook_url || '',
    });
    setEditMode(true);
  };

  const handleAgreementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setEditForm((prev: any) => ({ ...prev, agreement_document: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const api_credentials = JSON.stringify({
        api_key: editForm.api_key || '',
        api_secret: editForm.api_secret || '',
        client_id: editForm.client_id || '',
        webhook_url: editForm.webhook_url || '',
      });

      const payload = {
        ...editForm,
        api_credentials
      };

      await fetchApi(`/couriers/${selectedCourier.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setSelectedCourier({ ...selectedCourier, ...payload });
      setEditMode(false);
      fetchCouriers();
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    }
    setEditSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/couriers', {
        method: 'POST',
        body: JSON.stringify({ ...formData, status: 'ACTIVE' })
      });
      setIsModalOpen(false);
      setFormData({ courier_id: '', courier_name: '', tracking_url_format: '', api_key: '', api_secret: '' });
      fetchCouriers();
    } catch (err) {
      console.error(err);
      alert('Failed to add courier');
    }
    setSaving(false);
  };

  const openNewRateCard = () => {
    setEditingRc(null);
    setRcForm({ ...emptyRateCard, courier_id: selectedCourier?.id });
    setShowRcForm(true);
  };

  const openEditRateCard = (rc: any) => {
    setEditingRc(rc);
    // Parse matrix for editing
    let matrixStr = rc.rates_matrix || '{}';
    setRcForm({
      name: rc.name,
      type: 'COURIER',
      min_weight_kg: rc.min_weight_kg || '',
      docket_charge: rc.docket_charge || '',
      min_booking_amount: rc.min_booking_amount || '',
      volumetric_divisor: rc.volumetric_divisor || '5000',
      fov_percentage: rc.fov_percentage || '',
      fov_minimum: rc.fov_minimum || '',
      fsc_percentage: rc.fsc_percentage || '',
      idc_percentage: rc.idc_percentage || '',
      oda_charge: rc.oda_charge || '',
      green_tax_rate: rc.green_tax_rate || '',
      rates_matrix: matrixStr,
    });
    setShowRcForm(true);
  };

  const handleRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRcSaving(true);
    try {
      const payload = {
        ...rcForm,
        type: 'COURIER',
        courier_id: selectedCourier?.id,
        rates_matrix: typeof rcForm.rates_matrix === 'string' ? rcForm.rates_matrix : JSON.stringify(rcForm.rates_matrix),
      };

      if (editingRc) {
        await fetchApi(`/rates/${editingRc.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/rates', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowRcForm(false);
      setEditingRc(null);
      fetchRateCards(selectedCourier.id);
    } catch (err) {
      console.error(err);
      alert('Failed to save rate card');
    }
    setRcSaving(false);
  };

  const deleteRateCard = async (id: string) => {
    if (!confirm('Delete this rate card?')) return;
    await fetchApi(`/rates/${id}`, { method: 'DELETE' });
    fetchRateCards(selectedCourier.id);
  };

  // Rate matrix editor: zones x zones grid
  const parseMatrix = (str: string) => {
    try { return JSON.parse(str || '{}'); } catch { return {}; }
  };

  const updateMatrixCell = (origin: string, dest: string, value: string) => {
    const matrix = parseMatrix(rcForm.rates_matrix);
    if (!matrix[origin]) matrix[origin] = {};
    matrix[origin][dest] = value === '' ? undefined : parseFloat(value);
    if (matrix[origin][dest] === undefined) delete matrix[origin][dest];
    setRcForm({ ...rcForm, rates_matrix: JSON.stringify(matrix) });
  };

  const getMatrixCell = (origin: string, dest: string) => {
    const matrix = parseMatrix(rcForm.rates_matrix);
    return matrix[origin]?.[dest] ?? '';
  };

  if (selectedCourier) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedCourier(null); setShowRcForm(false); }}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedCourier.courier_name}</h1>
              <p className="text-sm text-slate-500">ID: {selectedCourier.courier_id} · {selectedCourier.status}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            {(['details', 'ratecard'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab === 'details' ? '📋 Details' : '💰 Rate Cards (What they charge us)'}
              </button>
            ))}
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-xl border border-slate-200">
            {!editMode ? (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Courier Details</h3>
                  <button onClick={openEdit}
                    className="flex items-center gap-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Courier Code', value: selectedCourier.courier_id },
                      { label: 'Name', value: selectedCourier.courier_name },
                      { label: 'Status', value: selectedCourier.status },
                      { label: 'Contact Person', value: selectedCourier.contact_person || '—' },
                      { label: 'Phone', value: selectedCourier.phone || '—' },
                      { label: 'Email', value: selectedCourier.email || '—' },
                      { label: 'Account Number', value: selectedCourier.account_number || '—' },
                      { label: 'GST Number', value: selectedCourier.gst_number || '—' },
                      { label: 'Billing Cycle', value: selectedCourier.billing_cycle || '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedCourier.notes && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-slate-700">{selectedCourier.notes}</p>
                    </div>
                  )}

                  {/* API Credentials View */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">🔑 API Keys & Integration Credentials</p>
                    {selectedCourier.api_credentials ? (
                      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                        {(() => {
                          let creds: any = {};
                          try { creds = JSON.parse(selectedCourier.api_credentials); } catch { creds = {}; }
                          return (
                            <>
                              <div><span className="text-slate-400">API Key / Token:</span> <span className="text-emerald-400 font-bold">{creds.api_key ? '••••••••••••••••' : 'Not Set'}</span></div>
                              <div><span className="text-slate-400">API Secret:</span> <span className="text-amber-400 font-bold">{creds.api_secret ? '••••••••••••••••' : 'Not Set'}</span></div>
                              <div><span className="text-slate-400">Client ID / Account Code:</span> <span className="text-blue-400 font-bold">{creds.client_id || 'Not Set'}</span></div>
                              <div><span className="text-slate-400">Webhook URL:</span> <span className="text-slate-300">{creds.webhook_url || '/api/webhooks/delhivery'}</span></div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 flex justify-between items-center">
                        <span>No API credentials configured for this courier partner.</span>
                        <button onClick={openEdit} className="text-indigo-600 font-medium hover:underline">Add API Key</button>
                      </div>
                    )}
                  </div>

                  {/* Agreement Document */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Agreement Document</p>
                    {selectedCourier.agreement_document ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
                          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Agreement on file</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Document uploaded</p>
                          </div>
                        </div>
                        <a
                          href={selectedCourier.agreement_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          download="courier_agreement"
                          className="flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 px-4 py-3 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" /> View / Download
                        </a>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No agreement document uploaded.</p>
                        <button onClick={openEdit} className="mt-2 text-xs text-indigo-600 hover:underline">Click Edit to upload one</button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSaveDetails}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                  <h3 className="font-semibold text-slate-900">Edit Courier Details</h3>
                  <button type="button" onClick={() => setEditMode(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">

                  {/* Basic Info */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Courier Name <span className="text-red-500">*</span></label>
                        <input required type="text" value={editForm.courier_name}
                          onChange={e => setEditForm({...editForm, courier_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select value={editForm.status}
                          onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                        <input type="text" value={editForm.contact_person}
                          onChange={e => setEditForm({...editForm, contact_person: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="text" value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={editForm.email}
                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                        <input type="text" value={editForm.account_number}
                          onChange={e => setEditForm({...editForm, account_number: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                        <input type="text" value={editForm.gst_number}
                          onChange={e => setEditForm({...editForm, gst_number: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                        <select value={editForm.billing_cycle}
                          onChange={e => setEditForm({...editForm, billing_cycle: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value="">-- Select --</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="BIWEEKLY">Bi-Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Remarks</label>
                        <textarea rows={2} value={editForm.notes}
                          onChange={e => setEditForm({...editForm, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
                      </div>
                    </div>
                  </div>

                  {/* API & Webhook Credentials */}
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">🔑 API Keys & Integration Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Key / Token</label>
                        <input type="password" value={editForm.api_key}
                          onChange={e => setEditForm({...editForm, api_key: e.target.value})}
                          placeholder="e.g. live_delhivery_token_xxxxx"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Secret / License Key</label>
                        <input type="password" value={editForm.api_secret}
                          onChange={e => setEditForm({...editForm, api_secret: e.target.value})}
                          placeholder="Secret Key"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Code / Client ID</label>
                        <input type="text" value={editForm.client_id}
                          onChange={e => setEditForm({...editForm, client_id: e.target.value})}
                          placeholder="e.g. DELH_MUMB_001"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Webhook Callback URL</label>
                        <input type="text" value={editForm.webhook_url}
                          onChange={e => setEditForm({...editForm, webhook_url: e.target.value})}
                          placeholder="https://your-domain.com/api/webhooks/delhivery"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Agreement Document Upload */}
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Agreement Document</h4>
                    <p className="text-xs text-slate-500 mb-3">Upload a PDF, JPG, or PNG (max 5MB). Stored securely.</p>
                    <div className="flex items-start gap-4">
                      <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50">
                        <FileText className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600">Click to upload agreement</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 5MB</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAgreementUpload} className="hidden" />
                      </label>
                    </div>
                    {editForm.agreement_document && (
                      <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">Document ready to save</span>
                        <button type="button" onClick={() => setEditForm({...editForm, agreement_document: ''})}
                          className="ml-auto text-xs text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    )}
                  </div>

                </div>
                <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100">Cancel</button>
                  <button type="submit" disabled={editSaving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60">
                    <Save className="w-4 h-4" />
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Rate Cards Tab */}
        {activeTab === 'ratecard' && (
          <div className="space-y-4">
            {!showRcForm && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-600">
                    These are the rates <strong>{selectedCourier.courier_name}</strong> charges your company. 
                    Used to calculate your <span className="text-emerald-600 font-semibold">profit margin</span> on each shipment.
                  </p>
                  <button onClick={openNewRateCard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Rate Card
                  </button>
                </div>

                {rcLoading ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">Loading...</div>
                ) : rateCards.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-medium text-slate-900">No rate card yet</h3>
                    <p className="text-sm text-slate-500 mt-1">Add the rate agreement you have with {selectedCourier.courier_name}.</p>
                    <button onClick={openNewRateCard} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Add Rate Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rateCards.map(rc => {
                      const matrix = parseMatrix(rc.rates_matrix);
                      const zoneKeys = Object.keys(matrix);
                      return (
                        <div key={rc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <div className="flex justify-between items-center px-5 py-4 bg-slate-50 border-b border-slate-200">
                            <div>
                              <h3 className="font-semibold text-slate-900">{rc.name}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">Courier Rate Card</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEditRateCard(rc)}
                                className="text-xs bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => deleteRateCard(rc.id)}
                                className="text-xs bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {[
                                { label: 'Docket Charge', value: `₹${rc.docket_charge}` },
                                { label: 'Min Weight', value: `${rc.min_weight_kg} kg` },
                                { label: 'Min Booking', value: `₹${rc.min_booking_amount}` },
                                { label: 'Vol. Divisor', value: rc.volumetric_divisor },
                                { label: 'FSC %', value: `${rc.fsc_percentage}%` },
                                { label: 'IDC %', value: `${rc.idc_percentage}%` },
                                { label: 'ODA Charge', value: `₹${rc.oda_charge}` },
                                { label: 'FOV %', value: `${rc.fov_percentage}%` },
                              ].map(f => (
                                <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                                  <p className="text-xs text-slate-500">{f.label}</p>
                                  <p className="font-semibold text-slate-800 mt-0.5">{f.value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Rate Matrix preview */}
                            {zoneKeys.length > 0 && (
                              <div className="overflow-x-auto">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Rate Matrix (₹/kg)</p>
                                <table className="text-xs border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left">Origin ↓ Dest →</th>
                                      {Object.keys(matrix[zoneKeys[0]] || {}).map(d => (
                                        <th key={d} className="border border-slate-200 bg-slate-100 px-3 py-2">{d}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {zoneKeys.map(origin => (
                                      <tr key={origin}>
                                        <td className="border border-slate-200 bg-slate-50 px-3 py-2 font-medium">{origin}</td>
                                        {Object.keys(matrix[origin] || {}).map(dest => (
                                          <td key={dest} className="border border-slate-200 px-3 py-2 text-center">
                                            ₹{matrix[origin][dest]}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Rate Card Form */}
            {showRcForm && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                  <h3 className="font-bold text-slate-900">{editingRc ? 'Edit Rate Card' : 'New Rate Card'}</h3>
                  <button onClick={() => setShowRcForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleRcSubmit}>
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rate Card Name <span className="text-red-500">*</span></label>
                      <input required type="text" value={rcForm.name}
                        onChange={e => setRcForm({ ...rcForm, name: e.target.value })}
                        placeholder="e.g. Delhivery Standard 2024"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Base Charges</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { key: 'docket_charge', label: 'Docket Charge (₹)', placeholder: '0' },
                          { key: 'min_weight_kg', label: 'Min Weight (kg)', placeholder: '0.5' },
                          { key: 'min_booking_amount', label: 'Min Booking (₹)', placeholder: '0' },
                          { key: 'volumetric_divisor', label: 'Vol. Divisor', placeholder: '5000' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                            <input type="number" step="0.01" value={rcForm[f.key]} placeholder={f.placeholder}
                              onChange={e => setRcForm({ ...rcForm, [f.key]: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Surcharges & Taxes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { key: 'fsc_percentage', label: 'FSC %', placeholder: '0' },
                          { key: 'idc_percentage', label: 'IDC %', placeholder: '0' },
                          { key: 'oda_charge', label: 'ODA Flat (₹)', placeholder: '0' },
                          { key: 'green_tax_rate', label: 'Green Tax (₹)', placeholder: '0' },
                          { key: 'fov_percentage', label: 'FOV %', placeholder: '0' },
                          { key: 'fov_minimum', label: 'FOV Min (₹)', placeholder: '0' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                            <input type="number" step="0.01" value={rcForm[f.key]} placeholder={f.placeholder}
                              onChange={e => setRcForm({ ...rcForm, [f.key]: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rate Matrix */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Rate Matrix (₹/kg)</h4>
                      <p className="text-xs text-slate-500 mb-3">Enter rate per kg for each origin → destination zone pair. Leave blank if no rate.</p>
                      {zones.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                          No zones configured yet. Go to <strong>Zone Mapping</strong> to set up zones first.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="text-sm border-collapse min-w-full">
                            <thead>
                              <tr>
                                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-semibold">Origin ↓ / Dest →</th>
                                {zones.map(z => (
                                  <th key={z} className="border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold">{z}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {zones.map(origin => (
                                <tr key={origin}>
                                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold">{origin}</td>
                                  {zones.map(dest => (
                                    <td key={dest} className="border border-slate-300 p-1">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={getMatrixCell(origin, dest)}
                                        onChange={e => updateMatrixCell(origin, dest, e.target.value)}
                                        placeholder="—"
                                        className="w-16 px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-indigo-400 rounded text-center bg-transparent"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end gap-3">
                    <button type="button" onClick={() => setShowRcForm(false)}
                      className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100">Cancel</button>
                    <button type="submit" disabled={rcSaving}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60">
                      <Save className="w-4 h-4" />
                      {rcSaving ? 'Saving...' : 'Save Rate Card'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Courier Partners</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Courier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading couriers...</div>
        ) : couriers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Truck className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No couriers found</h3>
            <p className="text-slate-500">Get started by creating a new courier partner.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Courier ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate Cards</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Shipments Handled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {couriers.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleSelectCourier(courier)}>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">{courier.courier_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-indigo-600" />
                      </div>
                      {courier.courier_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                      {courier.rateCards?.filter((r: any) => r.type === 'COURIER').length || 0} rate cards
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{courier._count?.shipments || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${courier.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {courier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Courier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-xl">
                  <div className="flex justify-between items-start mb-5">
                    <h3 className="text-lg leading-6 font-bold text-slate-900">Add New Courier</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Courier Code (e.g., BLUEDART)</label>
                      <input required type="text" value={formData.courier_id} onChange={e => setFormData({ ...formData, courier_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Courier Name</label>
                      <input required type="text" value={formData.courier_name} onChange={e => setFormData({ ...formData, courier_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tracking URL Format</label>
                      <input type="text" placeholder="https://tracking.com?awb={AWB}" value={formData.tracking_url_format} onChange={e => setFormData({ ...formData, tracking_url_format: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <input type="text" value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Secret</label>
                        <input type="password" value={formData.api_secret} onChange={e => setFormData({ ...formData, api_secret: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-slate-200">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save Courier'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Couriers;
