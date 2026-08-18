import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Save, Upload, Building, FileText, Briefcase, CreditCard, CheckCircle, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gst_number: '',
    pan_number: '',
    invoice_prefix: '',
    branding_logo: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    ifsc_code: '',
    support_email: '',
    support_phone: '',
  });

  useEffect(() => {
    fetchApi('/settings/company')
      .then(res => {
        if (res) {
          setFormData({
            name: res.name || '',
            address: res.address || '',
            gst_number: res.gst_number || '',
            pan_number: res.pan_number || '',
            invoice_prefix: res.invoice_prefix || 'INV-',
            branding_logo: res.branding_logo || '',
            bank_name: res.bank_name || '',
            account_name: res.account_name || '',
            account_number: res.account_number || '',
            ifsc_code: res.ifsc_code || '',
            support_email: res.support_email || '',
            support_phone: res.support_phone || '',
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, branding_logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchApi('/settings/company', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (res?.error) {
        alert(res.error);
      } else {
        showToast('Company profile & billing settings saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading company settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 font-bold text-xs animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Company Profile & Billing Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure tax identity, company logo, and bank account details for invoice templates.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center disabled:opacity-60"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Branding & Logo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" /> Corporate Branding
            </h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Logo</label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {formData.branding_logo ? (
                  <div className="space-y-3">
                    <img src={formData.branding_logo} alt="Company Logo" className="max-h-28 mx-auto object-contain" />
                    <label className="cursor-pointer text-xs text-blue-600 hover:underline font-bold block">
                      Change Logo Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium block">Upload PNG/JPG Logo</span>
                    <span className="text-[10px] text-slate-400">Max size: 2MB (Used on invoices & receipts)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Support Contacts */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Support Contact Lines</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> Support Email
                </label>
                <input
                  type="email"
                  name="support_email"
                  value={formData.support_email}
                  onChange={handleInputChange}
                  placeholder="support@company.com"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Support Phone
                </label>
                <input
                  type="text"
                  name="support_phone"
                  value={formData.support_phone}
                  onChange={handleInputChange}
                  placeholder="+91 22 6192 8800"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-mono font-medium"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Business & Bank Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Business Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-indigo-600" /> Business Registration Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-bold"
                  placeholder="e.g. LogiFlow Logistics Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Office Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-medium resize-none"
                  placeholder="Full office address for tax invoices..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white uppercase font-mono font-bold"
                    placeholder="27CCFPB3558P1Z7"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white uppercase font-mono font-bold"
                    placeholder="CCFPB3558P"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account Details for Invoices */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-emerald-600" /> Bank Account Credentials (Invoices & Payouts)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bank account details rendered on generated client billing PDF invoices.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  placeholder="e.g. LogiFlow Logistics Pvt Ltd"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  placeholder="50200088910245"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleInputChange}
                  placeholder="HDFC0000128"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white uppercase font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Invoice Prefix Preferences */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <FileText className="w-4 h-4 mr-2 text-purple-600" /> Invoice Sequence Preferences
            </h2>
            
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                name="invoice_prefix"
                value={formData.invoice_prefix}
                onChange={handleInputChange}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs dark:bg-slate-700 dark:text-white font-mono font-bold uppercase"
                placeholder="INV-"
              />
              <p className="text-[11px] text-slate-400 mt-1">Generates numbers like: <span className="font-mono text-purple-600 font-bold">{formData.invoice_prefix || 'INV-'}20260818-1001</span></p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
