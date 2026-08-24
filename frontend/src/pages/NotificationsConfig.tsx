import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Bell, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Send, RefreshCw, UserCheck, Phone, CheckSquare } from 'lucide-react';
import { api } from '../api';

export default function NotificationsConfig() {
  const [preferences, setPreferences] = useState({
    whatsapp_enabled: true,
    email_enabled: true,
    booked_enabled: true,
    picked_up_enabled: true,
    in_transit_enabled: true,
    out_for_delivery_enabled: true,
    delivered_enabled: true,
    ndr_enabled: true,
    rto_enabled: true,
    rto_delivered_enabled: true,
    customer_whatsapp_enabled: true,
    client_whatsapp_enabled: false,
    client_email_enabled: true,
    client_whatsapp_number: '+91 9876543210',
    client_email_address: 'merchant@apexlogistics.com',
    operations_email_address: 'ops@apexlogistics.com'
  });

  const [selectedTemplate, setSelectedTemplate] = useState<'BOOKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'NDR' | 'RTO' | 'RTO_DELIVERED'>('OUT_FOR_DELIVERY');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [testEmail, setTestEmail] = useState('merchant@apexlogistics.com');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testWaStatus, setTestWaStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await api.getNotificationPreferences();
      if (data) {
        setPreferences(prev => ({ ...prev, ...data }));
        if (data.client_whatsapp_number) setTestPhone(data.client_whatsapp_number);
        if (data.client_email_address) setTestEmail(data.client_email_address);
      }
    } catch (e) {
      console.error('Failed to load notification preferences', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.saveNotificationPreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save notification rules', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestWhatsApp = async () => {
    setTestWaStatus({ loading: true });
    try {
      const res = await api.sendTestWhatsApp(testPhone);
      if (res && res.success) {
        setTestWaStatus({ loading: false, success: true, message: res.message || 'Test WhatsApp notification sent successfully!' });
      } else {
        setTestWaStatus({ loading: false, success: false, message: res?.error || 'WhatsApp notification service is not configured. Please contact your administrator.' });
      }
    } catch (e: any) {
      setTestWaStatus({ loading: false, success: false, message: e.message || 'WhatsApp notification service is not configured. Please contact your administrator.' });
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus({ loading: true });
    try {
      const res = await api.sendTestEmail(testEmail);
      if (res && res.success) {
        setTestEmailStatus({ loading: false, success: true, message: res.message || 'Test Email notification dispatched successfully!' });
      } else {
        setTestEmailStatus({ loading: false, success: false, message: res?.error || 'Email notification service is not configured. Please contact your administrator.' });
      }
    } catch (e: any) {
      setTestEmailStatus({ loading: false, success: false, message: e.message || 'Email notification service is not configured. Please contact your administrator.' });
    }
  };

  const templates: Record<string, { title: string; text: string }> = {
    BOOKED: {
      title: 'Order Booked / Confirmed',
      text: '🚚 LogiFlow Order Confirmation\n\nHi {{customer_name}}, your shipment (AWB: {{awb}}) has been booked with {{courier_name}}.\n\nTrack Order: {{tracking_url}}'
    },
    PICKED_UP: {
      title: 'Picked Up / Package Dispatched',
      text: '📦 Shipment Picked Up\n\nHi {{customer_name}}, your package (AWB: {{awb}}) has been picked up by {{courier_name}}.\n\nTrack Live: {{tracking_url}}'
    },
    IN_TRANSIT: {
      title: 'In Transit / Hub Movement Update',
      text: '🚚 LogiFlow Hub Update\n\nHi {{customer_name}}, your package (AWB: {{awb}}) is IN TRANSIT via {{courier_name}}.\n\nTrack Live: {{tracking_url}}'
    },
    OUT_FOR_DELIVERY: {
      title: 'Out for Delivery Alert',
      text: '📦 LogiFlow Delivery Update\n\nHi {{customer_name}}, your package (AWB: {{awb}}) is OUT FOR DELIVERY today via {{courier_name}}. Please keep Cash on Delivery amount ₹450 ready.\n\nTrack Live: {{tracking_url}}'
    },
    DELIVERED: {
      title: 'Delivered & E-POD Receipt',
      text: '✅ Package Delivered Successfully!\n\nHi {{customer_name}}, your shipment (AWB: {{awb}}) has been delivered successfully. Thank you for using LogiFlow!\n\nView E-POD: {{tracking_url}}'
    },
    NDR: {
      title: 'NDR / Delivery Attempt Failed',
      text: '⚠️ Delivery Attempt Notification\n\nHi {{customer_name}}, delivery attempt for your package (AWB: {{awb}}) failed.\n\nReason: {{ndr_reason}}\n\nYou may request another delivery attempt or update your delivery info: {{tracking_url}}'
    },
    RTO: {
      title: 'RTO Initiated Notification',
      text: '🔄 Return to Origin (RTO) Initiated\n\nHi {{customer_name}}, your shipment (AWB: {{awb}}) could not be delivered and has been routed for Return to Origin via {{courier_name}}.\n\nTrack Return: {{tracking_url}}'
    },
    RTO_DELIVERED: {
      title: 'RTO Delivered to Merchant',
      text: '🏁 RTO Delivered to Merchant\n\nShipment (AWB: {{awb}}) has been returned and delivered to merchant warehouse.\n\nDetails: {{tracking_url}}'
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Bell className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Notification Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your automated customer & merchant alerts, notification channels, and recipient routing.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center cursor-pointer"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : saveSuccess ? 'Rules Saved!' : 'Save Notification Rules'}
        </button>
      </div>

      {/* 1. Notification Channels */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" /> Notification Channels
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Notifications</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Automated WhatsApp delivery updates for your customers</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.whatsapp_enabled}
                onChange={e => setPreferences({ ...preferences, whatsapp_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Email Notifications</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">HTML email receipts, status alerts, and exception digests</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={e => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. Shipment Event Triggers */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
            <Bell className="w-4 h-4 mr-2 text-indigo-600" /> Shipment Event Triggers
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              { key: 'booked_enabled', id: 'BOOKED', title: 'Order Booked / Confirmed', desc: 'Triggered when shipment is registered in system', color: 'text-blue-600' },
              { key: 'picked_up_enabled', id: 'PICKED_UP', title: 'Picked Up', desc: 'Triggered when package is picked up by courier', color: 'text-indigo-600' },
              { key: 'in_transit_enabled', id: 'IN_TRANSIT', title: 'In Transit', desc: 'Triggered when package moves through hubs', color: 'text-purple-600' },
              { key: 'out_for_delivery_enabled', id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery (OFD)', desc: 'Alerts customer on delivery driver dispatch & COD info', color: 'text-amber-600' },
              { key: 'delivered_enabled', id: 'DELIVERED', title: 'Delivered Successfully', desc: 'Sends E-POD confirmation receipt & thank-you note', color: 'text-emerald-600' },
              { key: 'ndr_enabled', id: 'NDR', title: 'NDR / Delivery Attempt Failed', desc: 'Sends reattempt & address update link to customer', color: 'text-rose-600' },
              { key: 'rto_enabled', id: 'RTO', title: 'RTO Initiated', desc: 'Alerts when undelivered package starts return journey', color: 'text-orange-600' },
              { key: 'rto_delivered_enabled', id: 'RTO_DELIVERED', title: 'RTO Delivered', desc: 'Alerts when returned shipment reaches merchant warehouse', color: 'text-slate-600 dark:text-slate-300' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedTemplate(item.id as any)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedTemplate === item.id 
                    ? 'border-2 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <h3 className={`text-xs font-black ${item.color}`}>{item.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(preferences as any)[item.key]}
                  onChange={e => {
                    e.stopPropagation();
                    setPreferences({ ...preferences, [item.key]: e.target.checked });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Live Message Preview & Recipient Routing */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Chat Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp Live Preview
              </h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                {templates[selectedTemplate]?.title || 'Message Preview'}
              </span>
            </div>

            <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 rounded-2xl shadow-inner min-h-[190px] flex flex-col justify-end">
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl rounded-tl-none max-w-[92%] shadow-md space-y-2 text-xs font-sans">
                <p className="whitespace-pre-line text-xs font-medium leading-relaxed">
                  {(templates[selectedTemplate]?.text || '')
                    .replace('{{customer_name}}', 'Rahul Sharma')
                    .replace('{{awb}}', 'DELH88291034')
                    .replace('{{courier_name}}', 'Delhivery Express')
                    .replace('{{company_name}}', 'LogiFlow Logistics')
                    .replace('{{ndr_reason}}', 'Consignee Phone Unreachable')
                    .replace('{{tracking_url}}', 'https://logiflow-black.vercel.app/track?awb=DELH88291034')}
                </p>
                <div className="text-[9px] text-slate-400 text-right font-mono">10:42 AM ✓✓</div>
              </div>
            </div>
          </div>

          {/* 3. Recipient Management */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <UserCheck className="w-4 h-4 mr-2 text-indigo-600" /> Notification Recipients
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Customer WhatsApp</span>
                  <span className="text-[11px] text-slate-500">Send to shipment consignee phone number</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.customer_whatsapp_enabled}
                  onChange={e => setPreferences({ ...preferences, customer_whatsapp_enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client WhatsApp Number</label>
                <input
                  type="text"
                  value={preferences.client_whatsapp_number || ''}
                  onChange={e => setPreferences({ ...preferences, client_whatsapp_number: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Email Address</label>
                <input
                  type="email"
                  value={preferences.client_email_address || ''}
                  onChange={e => setPreferences({ ...preferences, client_email_address: e.target.value })}
                  placeholder="merchant@company.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Operations Email Address (Optional)</label>
                <input
                  type="email"
                  value={preferences.operations_email_address || ''}
                  onChange={e => setPreferences({ ...preferences, operations_email_address: e.target.value })}
                  placeholder="ops@company.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Test Notifications */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <Send className="w-4 h-4 mr-2 text-indigo-600" /> Test Notifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test WhatsApp */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp Test Recipient</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="Mobile Number (10 digits)"
                className="flex-1 px-3.5 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleSendTestWhatsApp}
                disabled={testWaStatus.loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {testWaStatus.loading ? 'Sending...' : 'Send Test WhatsApp'}
              </button>
            </div>
            {testWaStatus.message && (
              <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center ${testWaStatus.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                {testWaStatus.success ? <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />}
                {testWaStatus.message}
              </div>
            )}
          </div>

          {/* Test Email */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Email Test Recipient</label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Email Address"
                className="flex-1 px-3.5 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={testEmailStatus.loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                {testEmailStatus.loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
            {testEmailStatus.message && (
              <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center ${testEmailStatus.success ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                {testEmailStatus.success ? <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />}
                {testEmailStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
