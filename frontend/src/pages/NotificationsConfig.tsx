import React, { useState } from 'react';
import { MessageSquare, Mail, Bell, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Send, ExternalLink, RefreshCw } from 'lucide-react';

export default function NotificationsConfig() {
  const [channels, setChannels] = useState({
    whatsapp: true,
    email: true,
    sms: false
  });

  const [triggers, setTriggers] = useState({
    BOOKED: true,
    IN_TRANSIT: true,
    OUT_FOR_DELIVERY: true,
    DELIVERED: true,
    NDR_EXCEPTION: true
  });

  const [selectedTemplate, setSelectedTemplate] = useState<'BOOKED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'NDR_EXCEPTION'>('OUT_FOR_DELIVERY');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [saved, setSaved] = useState(false);

  const templates: Record<string, { title: string; text: string }> = {
    BOOKED: {
      title: 'Order Booked / Confirmed',
      text: '🚚 LogiFlow Order Confirmation\n\nHi {{customer_name}}, your shipment (AWB: {{awb_number}}) has been booked with {{courier_name}}.\n\nTrack Order: {{tracking_url}}'
    },
    IN_TRANSIT: {
      title: 'In Transit / Hub Movement Update',
      text: '🚚 LogiFlow Hub Update\n\nHi {{customer_name}}, your package (AWB: {{awb_number}}) has left the origin hub and is IN TRANSIT via {{courier_name}}.\n\nTrack Live: {{tracking_url}}'
    },
    OUT_FOR_DELIVERY: {
      title: 'Out for Delivery Alert',
      text: '📦 LogiFlow Delivery Update\n\nHi {{customer_name}}, your package (AWB: {{awb_number}}) is OUT FOR DELIVERY today via {{courier_name}}. Please keep Cash on Delivery amount ₹{{cod_amount}} ready.\n\nTrack Live: {{tracking_url}}'
    },
    DELIVERED: {
      title: 'Delivered & E-POD Receipt',
      text: '✅ Package Delivered Successfully!\n\nHi {{customer_name}}, your shipment (AWB: {{awb_number}}) has been delivered successfully. Thank you for using LogiFlow Logistics!\n\nView E-POD: {{tracking_url}}'
    },
    NDR_EXCEPTION: {
      title: 'NDR / Delivery Attempt Failed',
      text: '⚠️ Delivery Attempt Notification\n\nHi {{customer_name}}, delivery attempt for your package (AWB: {{awb_number}}) failed due to: Customer Unavailable / Address Issue.\n\nClick here to reschedule delivery: {{tracking_url}}'
    }
  };

  const handleSaveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getTestWhatsAppUrl = () => {
    const currentTpl = templates[selectedTemplate] || templates['OUT_FOR_DELIVERY'];
    const rawText = currentTpl.text
      .replace('{{customer_name}}', 'Rahul Sharma')
      .replace('{{awb_number}}', 'DELH88291034')
      .replace('{{courier_name}}', 'Delhivery Express')
      .replace('{{cod_amount}}', '450')
      .replace('{{tracking_url}}', 'https://logiflow-black.vercel.app/track?awb=DELH88291034');

    const cleanPhone = testPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(rawText)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Bell className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Customer Notifications Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure automated WhatsApp & Email notification triggers for every shipment event.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center cursor-pointer"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {saved ? 'Settings Saved!' : 'Save Notification Rules'}
        </button>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Gateway</h3>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Active (Direct & API)
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={channels.whatsapp}
            onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Email Dispatcher</h3>
              <span className="text-[10px] text-blue-600 font-bold flex items-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Active (HTML Templates)
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={channels.email}
            onChange={e => setChannels({ ...channels, email: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Audit Logging</h3>
              <span className="text-[10px] text-purple-600 font-bold flex items-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Enabled (Database)
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full uppercase">ON</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Event Triggers Matrix */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
            <Bell className="w-4 h-4 mr-2 text-indigo-600" /> Automated Event Triggers
          </h2>

          <div className="space-y-3">
            
            {[
              { id: 'BOOKED', title: 'Order Booked / Confirmed', desc: 'Triggered when shipment is registered in ERP system', color: 'text-blue-600' },
              { id: 'IN_TRANSIT', title: 'In Transit / Hub Update', desc: 'Triggered when package leaves origin hub', color: 'text-indigo-600' },
              { id: 'OUT_FOR_DELIVERY', title: 'Out For Delivery (OFD)', desc: 'Alerts customer on delivery driver dispatch & COD amount', color: 'text-amber-600' },
              { id: 'DELIVERED', title: 'Delivered Successfully', desc: 'Sends E-POD confirmation receipt & thank-you note', color: 'text-emerald-600' },
              { id: 'NDR_EXCEPTION', title: 'NDR / Delivery Attempt Failed', desc: 'Sends reattempt & address update link to customer', color: 'text-rose-600' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedTemplate(item.id as any)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedTemplate === item.id 
                    ? 'border-2 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100'
                }`}
              >
                <div>
                  <h3 className={`text-xs font-black ${item.color}`}>{item.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={triggers[item.id as keyof typeof triggers]}
                  onChange={e => {
                    e.stopPropagation();
                    setTriggers({ ...triggers, [item.id]: e.target.checked });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            ))}

          </div>
        </div>

        {/* Right Column: Live Message Preview */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp Live Chat Preview
            </h2>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
              {templates[selectedTemplate]?.title || 'Message Preview'}
            </span>
          </div>

          {/* Chat Mockup */}
          <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 rounded-2xl shadow-inner min-h-[220px] flex flex-col justify-end">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl rounded-tl-none max-w-[88%] shadow-md space-y-2 text-xs font-sans">
              <p className="whitespace-pre-line text-xs font-medium leading-relaxed">
                {(templates[selectedTemplate]?.text || '')
                  .replace('{{customer_name}}', 'Rahul Sharma')
                  .replace('{{awb_number}}', 'DELH88291034')
                  .replace('{{courier_name}}', 'Delhivery Express')
                  .replace('{{cod_amount}}', '450')
                  .replace('{{tracking_url}}', 'https://logiflow-black.vercel.app/track?awb=DELH88291034')}
              </p>
              <div className="text-[9px] text-slate-400 text-right font-mono">10:42 AM ✓✓</div>
            </div>
          </div>

          {/* Test Trigger Input */}
          <div className="pt-2 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Send Test WhatsApp Message</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="Mobile Number (10 digits)"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold dark:bg-slate-700 dark:text-white"
              />
              <a
                href={getTestWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Launch WhatsApp Web
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
