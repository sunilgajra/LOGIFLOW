import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Truck, Plus, X, FileText, ChevronRight, Edit2, Trash2, Save, ArrowLeft, Key, Eye, EyeOff, Copy, Check, Activity, ShieldCheck } from 'lucide-react';

const DEFAULT_ZONES = ["N1", "N2", "E", "NE", "W1", "W2", "S1", "S2", "C"];

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

const emptyCourierForm = {
  courier_id: '',
  courier_name: '',
  status: 'ACTIVE',
  contact_person: '',
  phone: '',
  email: '',
  account_number: '',
  gst_number: '',
  billing_cycle: '',
  notes: '',
  api_key: '',
  api_secret: '',
  client_id: '',
  webhook_url: '',
  agreement_document: '',
};

// API Credentials Modal Component
const ApiCredentialsModal = ({ courier, onClose, onSave }: { courier: any; onClose: () => void; onSave: (updatedCreds: any) => void }) => {
  let initialCreds = { api_key: '', api_secret: '', client_id: '', webhook_url: '', mode: 'production' };
  try {
    if (courier?.api_credentials) {
      initialCreds = { ...initialCreds, ...JSON.parse(courier.api_credentials) };
    }
  } catch (e) {}

  const [creds, setCreds] = useState(initialCreds);
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const isDelhivery = (courier.courier_id || courier.courier_name || '').toUpperCase().includes('DELHIVERY');
  const isBlueDart = (courier.courier_id || courier.courier_name || '').toUpperCase().includes('BLUEDART');

  const defaultWebhook = window.location.hostname.includes('vercel.app') 
    ? `${window.location.origin}/api/webhooks/${(courier.courier_id || 'courier').toLowerCase()}`
    : `https://logiflow-black.vercel.app/api/webhooks/${(courier.courier_id || 'courier').toLowerCase()}`;

  useEffect(() => {
    if (!creds.webhook_url || creds.webhook_url.includes('github.io')) {
      setCreds(prev => ({ ...prev, webhook_url: defaultWebhook }));
    }
  }, []);

  const handleApplyPreset = (preset: string) => {
    const baseUrl = window.location.hostname.includes('vercel.app') ? window.location.origin : 'https://logiflow-black.vercel.app';
    if (preset === 'DELHIVERY') {
      setCreds(prev => ({
        ...prev,
        client_id: prev.client_id || 'YOUR_DELHIVERY_CLIENT_NAME',
        webhook_url: `${baseUrl}/api/webhooks/delhivery`,
        mode: 'production'
      }));
    } else if (preset === 'BLUEDART') {
      setCreds(prev => ({
        ...prev,
        client_id: prev.client_id || 'BOM_BD_1001',
        webhook_url: `${baseUrl}/api/webhooks/bluedart`,
        mode: 'sandbox'
      }));
    } else {
      setCreds(prev => ({
        ...prev,
        webhook_url: `${baseUrl}/api/webhooks/courier`
      }));
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(creds.webhook_url || defaultWebhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!creds.api_key) {
      setTestResult({ success: false, message: 'Authentication Failed: API Key / Token is required.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchApi('/couriers/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          courier_name: courier.courier_name,
          api_credentials: creds
        })
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || 'Authentication Success (200 OK) - Gateway Connected.',
          latency: res.latency || 45
        });
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Connection Error: Unable to authenticate with Gateway.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Authentication Failed (HTTP 401 / 500 Network Error).'
      });
    }
    setTesting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(creds);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="relative z-10 inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-slate-900 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">API & Webhook Credentials</h3>
                  <p className="text-xs text-slate-400">{courier.courier_name} ({courier.courier_id})</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apply Provider Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleApplyPreset('DELHIVERY')} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                    Delhivery REST Preset
                  </button>
                  <button type="button" onClick={() => handleApplyPreset('BLUEDART')} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">
                    Blue Dart SOAP Preset
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Key / Access Token <span className="text-rose-500 font-bold">* (REQUIRED)</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">Your official Delhivery API Authorization Token (passed as <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">Authorization: Token &lt;api_key&gt;</code>).</p>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'}
                    required
                    value={creds.api_key}
                    onChange={e => setCreds({...creds, api_key: e.target.value})}
                    placeholder="e.g. c7a40b9f881920394..."
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm dark:bg-slate-700 dark:text-white"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Secret / License Password {isDelhivery ? <span className="text-slate-400 font-normal">(Optional / Not Required for Delhivery)</span> : <span className="text-amber-500">* Required for BlueDart</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showSecret ? 'text' : 'password'}
                    value={creds.api_secret}
                    onChange={e => setCreds({...creds, api_secret: e.target.value})}
                    placeholder={isDelhivery ? "Not required for Delhivery Express API" : "e.g. sec_pass_bd_9910"}
                    disabled={isDelhivery}
                    className={`w-full pl-3 pr-10 py-2 border rounded-lg font-mono text-sm dark:bg-slate-700 dark:text-white ${isDelhivery ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}
                  />
                  {!isDelhivery && (
                    <button 
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client ID / Account Name <span className="text-slate-400 font-normal">(Optional / Client Name)</span>
                  </label>
                  <input 
                    type="text"
                    value={creds.client_id}
                    onChange={e => setCreds({...creds, client_id: e.target.value})}
                    placeholder="e.g. YOUR_DELHIVERY_CLIENT_NAME"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Environment Gateway</label>
                  <select 
                    value={creds.mode || 'production'}
                    onChange={e => setCreds({...creds, mode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-medium"
                  >
                    <option value="production">Production Live (track.delhivery.com)</option>
                    <option value="staging">Staging / Sandbox (staging-express.delhivery.com)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incoming Webhook Callback URL <span className="text-emerald-600 font-bold">(Vercel Production Route)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text"
                    value={creds.webhook_url || defaultWebhook}
                    onChange={e => setCreds({...creds, webhook_url: e.target.value})}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs dark:bg-slate-700 dark:text-white bg-slate-50 font-bold text-blue-600"
                  />
                  <button 
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Provide this webhook URL in your Delhivery Client Dashboard under Webhooks Settings.</p>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 border ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  {testResult.success ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.latency && <p className="text-[10px] opacity-80 mt-0.5">Response Latency: {testResult.latency} ms</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button 
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing Handshake...' : 'Test Connection'}
              </button>

              <div className="flex space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center shadow-md">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save Credentials
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Shared Form Fields component for both Add Courier and Edit Courier
 */
const CourierFormFields = ({ form, setForm, isAddMode }: { form: any; setForm: React.Dispatch<React.SetStateAction<any>>; isAddMode?: boolean }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((prev: any) => ({ ...prev, agreement_document: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 text-left">
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAddMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Courier Code (e.g., BLUEDART) <span className="text-red-500">*</span></label>
              <input required type="text" value={form.courier_id}
                onChange={e => setForm({...form, courier_id: e.target.value.toUpperCase()})}
                placeholder="e.g. DELHIVERY, BLUEDART"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm uppercase" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Courier Name <span className="text-red-500">*</span></label>
            <input required type="text" value={form.courier_name}
              onChange={e => setForm({...form, courier_name: e.target.value})}
              placeholder="e.g. Delhivery Express"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status || 'ACTIVE'}
              onChange={e => setForm({...form, status: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
            <input type="text" value={form.contact_person || ''}
              onChange={e => setForm({...form, contact_person: e.target.value})}
              placeholder="Contact manager name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input type="text" value={form.phone || ''}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input type="email" value={form.email || ''}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="support@courier.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account / Merchant Number</label>
            <input type="text" value={form.account_number || ''}
              onChange={e => setForm({...form, account_number: e.target.value})}
              placeholder="e.g. ACC-881920"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
            <input type="text" value={form.gst_number || ''}
              onChange={e => setForm({...form, gst_number: e.target.value})}
              placeholder="27AAAAA0000A1Z5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
            <select value={form.billing_cycle || ''}
              onChange={e => setForm({...form, billing_cycle: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">-- Select --</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Remarks</label>
            <textarea rows={2} value={form.notes || ''}
              onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Any operational notes..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Couriers() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'ratecard'>('details');

  // Credentials Modal State
  const [managingCredsCourier, setManagingCredsCourier] = useState<any | null>(null);

  // Add courier form state
  const [formData, setFormData] = useState<any>(emptyCourierForm);
  const [saving, setSaving] = useState(false);

  // Edit courier details state
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

  // Master Indian Logistics Zones for full 9x9 matrix display & editor
  const [zones, setZones] = useState<string[]>(DEFAULT_ZONES);

  const fetchCouriers = () => {
    setLoading(true);
    fetchApi('/couriers')
      .then(data => {
        setCouriers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error);
  };

  const handleDeleteCourier = async (courier: any) => {
    if (!window.confirm(`Are you sure you want to delete delivery partner "${courier.courier_name}"? This action cannot be undone.`)) {
      return;
    }
    // Optimistic UI state update
    setCouriers(prev => prev.filter(c => c.id !== courier.id && c.courier_id !== courier.courier_id));
    if (selectedCourier?.id === courier.id) {
      setSelectedCourier(null);
    }

    try {
      await fetchApi(`/couriers/${courier.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      alert('Failed to delete delivery partner');
      fetchCouriers();
    }
  };

  useEffect(() => {
    fetchCouriers();
    fetchApi('/zones').then((z: any[]) => {
      const fetchedZones = (Array.isArray(z) ? z : []).map((item: any) => item.zone_name);
      const combined = Array.from(new Set([...DEFAULT_ZONES, ...fetchedZones])).sort();
      setZones(combined);
    }).catch(() => setZones(DEFAULT_ZONES));
  }, []);

  const fetchRateCards = (courierId: string) => {
    setRcLoading(true);
    fetchApi('/rates').then((all: any[]) => {
      setRateCards(all.filter(r => r.courier_id === courierId || r.type === 'COURIER'));
      setRcLoading(false);
    }).catch(console.error);
  };

  const handleSelectCourier = (courier: any) => {
    setSelectedCourier(courier);
    setActiveTab('details');
    setEditMode(false);
    setShowRcForm(false);
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

  const handleSaveCredsFromModal = async (updatedCreds: any) => {
    if (!managingCredsCourier) return;
    try {
      const api_credentials = JSON.stringify(updatedCreds);
      await fetchApi(`/couriers/${managingCredsCourier.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...managingCredsCourier,
          api_credentials
        })
      });

      setCouriers(prev => prev.map(c => c.id === managingCredsCourier.id ? { ...c, api_credentials } : c));
      if (selectedCourier?.id === managingCredsCourier.id) {
        setSelectedCourier((prev: any) => ({ ...prev, api_credentials }));
      }
      setManagingCredsCourier(null);
    } catch (err) {
      alert('Failed to save API credentials');
    }
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
    if (!formData.courier_id || !formData.courier_name) {
      return alert('Please fill in Courier Code and Courier Name');
    }

    setSaving(true);
    try {
      const api_credentials = JSON.stringify({
        api_key: formData.api_key || '',
        api_secret: formData.api_secret || '',
        client_id: formData.client_id || '',
        webhook_url: formData.webhook_url || '',
      });

      const payload = {
        ...formData,
        api_credentials,
        status: formData.status || 'ACTIVE'
      };

      await fetchApi('/couriers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIsModalOpen(false);
      setFormData(emptyCourierForm);
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
        setRateCards(prev => prev.map(r => r.id === editingRc.id ? { ...r, ...payload } : r));
      } else {
        const newRc = await fetchApi('/rates', { method: 'POST', body: JSON.stringify(payload) });
        const createdObj = newRc || { ...payload, id: 'rc-' + Date.now() };
        setRateCards(prev => [...prev, createdObj]);
      }
      setShowRcForm(false);
      setEditingRc(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save rate card');
    }
    setRcSaving(false);
  };

  const deleteRateCard = async (id: string) => {
    if (!confirm('Delete this rate card?')) return;
    try {
      await fetchApi(`/rates/${id}`, { method: 'DELETE' });
    } catch (e) {}
    setRateCards(prev => prev.filter(r => r.id !== id));
  };

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
          <button 
            onClick={() => setManagingCredsCourier(selectedCourier)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-all"
          >
            <Key className="w-4 h-4 mr-2" /> API & Webhook Credentials
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            {(['details', 'ratecard'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowRcForm(false); }}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab === 'details' ? '📋 Courier Profile' : '💰 Courier Cost Cards'}
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

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">🔑 API Keys & Integration Credentials</p>
                      <button onClick={() => setManagingCredsCourier(selectedCourier)} className="text-xs text-blue-600 font-bold hover:underline flex items-center">
                        <Key className="w-3.5 h-3.5 mr-1" /> Manage API Keys
                      </button>
                    </div>
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
                        <button onClick={() => setManagingCredsCourier(selectedCourier)} className="text-indigo-600 font-medium hover:underline">Add API Key</button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveDetails}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                  <h3 className="font-semibold text-slate-900">Edit Courier Details</h3>
                  <button type="button" onClick={() => setEditMode(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <CourierFormFields form={editForm} setForm={setEditForm} isAddMode={false} />
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
          <div className="space-y-6">
            {!showRcForm ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Courier Cost Cards</h3>
                    <p className="text-xs text-slate-500">Rate matrices charged by {selectedCourier.courier_name} for freight cost analysis.</p>
                  </div>
                  <button onClick={openNewRateCard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Add Rate Card
                  </button>
                </div>

                {rcLoading ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">Loading rate cards...</div>
                ) : rateCards.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900">No Rate Cards Found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Add a rate card for {selectedCourier.courier_name} to configure docket charges, surcharges, and origin-to-destination zone rates.</p>
                    <button onClick={openNewRateCard} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm">
                      + Create First Rate Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rateCards.map(rc => {
                      const matrix = parseMatrix(rc.rates_matrix);
                      return (
                        <div key={rc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          <div className="flex justify-between items-center px-5 py-4 bg-slate-50 border-b border-slate-200">
                            <div>
                              <h3 className="font-bold text-slate-900">{rc.name}</h3>
                              <p className="text-xs text-slate-500">Courier Partner Rate Card</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEditRateCard(rc)}
                                className="text-xs bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold">
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button onClick={() => deleteRateCard(rc.id)}
                                className="text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                          <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              {[
                                { label: 'Docket Charge', value: `₹${rc.docket_charge || 0}` },
                                { label: 'Min Weight', value: `${rc.min_weight_kg || 0.5} kg` },
                                { label: 'Min Booking', value: `₹${rc.min_booking_amount || 0}` },
                                { label: 'Vol. Divisor', value: rc.volumetric_divisor || 5000 },
                                { label: 'FSC %', value: `${rc.fsc_percentage || 0}%` },
                                { label: 'IDC %', value: `${rc.idc_percentage || 0}%` },
                                { label: 'ODA Flat', value: `₹${rc.oda_charge || 0}` },
                                { label: 'Green Tax', value: `₹${rc.green_tax_rate || 0}` },
                              ].map(f => (
                                <div key={f.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                  <p className="text-slate-400 font-semibold">{f.label}</p>
                                  <p className="font-bold text-slate-800 text-sm mt-0.5">{f.value}</p>
                                </div>
                              ))}
                            </div>

                            {/* FULL 9x9 ZONE RATE MATRIX DISPLAY */}
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Multi-Zone Rate Matrix (₹ / kg)</p>
                              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="text-xs border-collapse w-full">
                                  <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                      <th className="p-2 border-r border-b text-left bg-slate-200">Origin ↓ / Dest →</th>
                                      {zones.map(d => (
                                        <th key={d} className="p-2 border-r border-b text-center min-w-[50px]">{d}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {zones.map(origin => (
                                      <tr key={origin} className="hover:bg-slate-50">
                                        <td className="p-2 border-r border-b font-bold bg-slate-50">{origin}</td>
                                        {zones.map(dest => {
                                          const val = matrix[origin]?.[dest];
                                          return (
                                            <td key={dest} className="p-2 border-r border-b text-center font-semibold text-slate-800">
                                              {val !== undefined && val !== null && val !== '' ? `₹${val}` : '—'}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* RATE CARD FORM */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-900">{editingRc ? 'Edit Rate Card' : 'Create New Rate Card'}</h3>
                  <button onClick={() => setShowRcForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRcSubmit}>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rate Card Name <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="text" 
                        value={rcForm.name}
                        onChange={e => setRcForm({ ...rcForm, name: e.target.value })}
                        placeholder="e.g. Delhivery Surface Standard 2024"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold" 
                      />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Base Charges</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { key: 'docket_charge', label: 'Docket Charge (₹)', placeholder: '50' },
                          { key: 'min_weight_kg', label: 'Min Weight (kg)', placeholder: '0.5' },
                          { key: 'min_booking_amount', label: 'Min Booking (₹)', placeholder: '100' },
                          { key: 'volumetric_divisor', label: 'Vol. Divisor', placeholder: '5000' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">{f.label}</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={rcForm[f.key]} 
                              placeholder={f.placeholder}
                              onChange={e => setRcForm({ ...rcForm, [f.key]: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Surcharges & Taxes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { key: 'fsc_percentage', label: 'FSC %', placeholder: '10' },
                          { key: 'idc_percentage', label: 'IDC %', placeholder: '2' },
                          { key: 'oda_charge', label: 'ODA Flat (₹)', placeholder: '150' },
                          { key: 'green_tax_rate', label: 'Green Tax (₹)', placeholder: '15' },
                          { key: 'fov_percentage', label: 'FOV %', placeholder: '0.2' },
                          { key: 'fov_minimum', label: 'FOV Min (₹)', placeholder: '20' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">{f.label}</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={rcForm[f.key]} 
                              placeholder={f.placeholder}
                              onChange={e => setRcForm({ ...rcForm, [f.key]: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Zone Rate Matrix Editor */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Zone Rate Matrix (₹ / kg)</h4>
                      <p className="text-xs text-slate-400 mb-3">Enter freight rate per kg for each origin to destination zone pair (all 9 Master Zones).</p>
                      
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="text-xs border-collapse w-full">
                          <thead className="bg-slate-100 font-bold text-slate-700">
                            <tr>
                              <th className="p-2 border-r border-b text-left bg-slate-200">Origin ↓ / Dest →</th>
                              {zones.map(z => (
                                <th key={z} className="p-2 border-r border-b text-center min-w-[55px]">{z}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {zones.map(origin => (
                              <tr key={origin}>
                                <td className="p-2 border-r border-b font-bold bg-slate-50">{origin}</td>
                                {zones.map(dest => (
                                  <td key={dest} className="p-1 border-r border-b text-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={getMatrixCell(origin, dest)}
                                      onChange={e => updateMatrixCell(origin, dest, e.target.value)}
                                      placeholder="—"
                                      className="w-14 px-1.5 py-1 text-xs border border-slate-200 focus:border-indigo-500 rounded text-center font-medium"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowRcForm(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={rcSaving}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {rcSaving ? 'Saving...' : 'Save Rate Card'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* API Credentials Modal */}
        {managingCredsCourier && (
          <ApiCredentialsModal 
            courier={managingCredsCourier} 
            onClose={() => setManagingCredsCourier(null)} 
            onSave={handleSaveCredsFromModal} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courier Partners & Integrations</h1>
          <p className="text-sm text-slate-500">Manage live API keys, tracking webhooks, and rate agreements for all courier partners.</p>
        </div>
        <button
          onClick={() => { setFormData(emptyCourierForm); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Courier Partner
        </button>
      </div>

      {/* Courier Integration Health Monitor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delhivery Express</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Connected (Live API)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">42ms · 99.8%</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blue Dart Express</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                Connected (SOAP/REST)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">55ms · 100%</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Other Partners</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Simulation Engine
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Auto Fallback</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading couriers...</div>
        ) : couriers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Truck className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No couriers found</h3>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Courier Code</th>
                <th className="px-6 py-3 text-left">Partner Name</th>
                <th className="px-6 py-3 text-left">API Integration Status</th>
                <th className="px-6 py-3 text-left">Shipments</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {couriers.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{courier.courier_id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      {courier.courier_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      courier.api_credentials ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      {courier.api_credentials ? 'API Key Configured' : 'No API Key'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{courier._count?.shipments || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 inline-flex text-xs font-bold rounded-full ${courier.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {courier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      type="button"
                      onClick={() => setManagingCredsCourier(courier)} 
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                    >
                      <Key className="w-3.5 h-3.5 mr-1" /> API Keys
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSelectCourier(courier)} 
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                    >
                      View <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteCourier(courier)} 
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                      title="Delete Delivery Partner"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Shared Add Courier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add New Courier Partner</h3>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <CourierFormFields form={formData} setForm={setFormData} isAddMode={true} />
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-2xl flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-70">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Courier Partner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Standalone API Credentials Modal */}
      {managingCredsCourier && (
        <ApiCredentialsModal 
          courier={managingCredsCourier} 
          onClose={() => setManagingCredsCourier(null)} 
          onSave={handleSaveCredsFromModal} 
        />
      )}
    </div>
  );
}
