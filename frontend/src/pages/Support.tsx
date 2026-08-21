import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Search, Plus, MessageSquare, X, Mail, CheckCircle2, Clock, RotateCcw, AlertTriangle, ShieldCheck, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED' | 'CLOSED'>('OPEN');
  const [statusFilter, setStatusFilter] = useState('');

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState('');

  // Raise Ticket Form State matching Screenshot 3
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [description, setDescription] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ccEmails, setCcEmails] = useState('');
  const [showCcInput, setShowCcInput] = useState(false);

  const shipmentCategories = [
    {
      name: 'Delay in delivery or return / Delivery instructions (Reattempt, hold, etc.)',
      subCategories: [
        'Delay in delivery to consignee / Reattempt delivery',
        'Hold shipment at delivery hub',
        'Consignee address change request',
        'Re-dispatch return shipment'
      ]
    },
    {
      name: 'Merchant / Seller pickup issues',
      subCategories: [
        'Pickup missed by courier executive',
        'Pickup rescheduled requested',
        'Pickup location address correction'
      ]
    },
    {
      name: 'Shipment not delivered / need POD / Fake remark',
      subCategories: [
        'Request Physical Proof of Delivery (EPOD)',
        'Fake undelivered remark dispute',
        'Non-delivery escalation (NDR)'
      ]
    },
    {
      name: 'Issue with delivered/returned shipment (damage, missing, wrong, partial, etc.)',
      subCategories: [
        'Partial / Short shipment delivered',
        'Damaged content inside shipment box',
        'Wrong item delivered to consignee'
      ]
    },
    {
      name: 'Update shipment details',
      subCategories: [
        'Update appointment date and time',
        'Update phone number of consignee',
        'Update invoice value / e-Way bill reference'
      ]
    },
    {
      name: 'Claims / Finance (disputes, remittance, bank details, etc.)',
      subCategories: [
        'COD Remittance mismatch / delay',
        'Freight charge discrepancy dispute',
        'Claim for lost / destroyed shipment'
      ]
    }
  ];

  const otherCategories = [
    {
      name: 'Tech Support',
      subCategories: ['API Integration Error', 'Dashboard bug / display issue', 'CSV Import error']
    },
    {
      name: 'Account',
      subCategories: ['Billing address update', 'GST / PAN detail update', 'Team user permissions']
    }
  ];

  const fetchTickets = () => {
    setLoading(true);
    fetchApi('/support/tickets')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setTickets(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCategorySelect = (catName: string, defaultSub?: string) => {
    setSelectedCategory(catName);
    if (defaultSub) {
      setSelectedSubCategory(defaultSub);
    } else {
      const found = [...shipmentCategories, ...otherCategories].find(c => c.name === catName);
      setSelectedSubCategory(found?.subCategories[0] || '');
    }
  };

  const handleResetCategories = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setAwbNumber('');
    setDescription('');
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert('Please select an issue category.');
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          category: selectedCategory,
          sub_category: selectedSubCategory,
          awb_number: awbNumber || null,
          description: description || `Issue regarding ${selectedCategory}`,
          cc_emails: ccEmails || null
        })
      });
      setShowRaiseModal(false);
      handleResetCategories();
      fetchTickets();
    } catch (err: any) {
      alert('Failed to submit ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFollowUpModal || !followUpMsg.trim()) return;
    alert(`Follow-up message sent for Ticket #${showFollowUpModal.ticket_id}: "${followUpMsg}"`);
    setFollowUpMsg('');
    setShowFollowUpModal(null);
  };

  // Filtered List by Tab & Search
  const filteredTickets = tickets.filter(t => {
    const statusUpper = (t.status || 'Open').toUpperCase();
    if (activeTab === 'OPEN' && statusUpper !== 'OPEN') return false;
    if (activeTab === 'RESOLVED' && statusUpper !== 'RESOLVED') return false;
    if (activeTab === 'CLOSED' && statusUpper !== 'CLOSED') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTicket = t.ticket_id?.toLowerCase().includes(q);
      const matchAwb = t.awb_number?.toLowerCase().includes(q);
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchUser = t.raised_by?.toLowerCase().includes(q);
      return matchTicket || matchAwb || matchCategory || matchUser;
    }
    return true;
  });

  const openCount = tickets.filter(t => (t.status || 'Open').toUpperCase() === 'OPEN').length;
  const resolvedCount = tickets.filter(t => (t.status || '').toUpperCase() === 'RESOLVED').length;
  const closedCount = tickets.filter(t => (t.status || '').toUpperCase() === 'CLOSED').length;

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Support</h1>
          <a href="#learn" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center font-semibold bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Learn More
          </a>
        </div>

        <button
          onClick={() => { handleResetCategories(); setShowRaiseModal(true); }}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md transition-all flex items-center"
        >
          + Raise a ticket
        </button>
      </div>

      {/* Delhivery Style Status Tabs */}
      <div className="flex items-center space-x-8 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('OPEN')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'OPEN' 
              ? 'text-blue-600 dark:text-blue-400 font-black border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Open</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-extrabold">
            {openCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'RESOLVED' 
              ? 'text-emerald-600 dark:text-emerald-400 font-black border-b-2 border-emerald-600' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Resolved</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-extrabold">
            {resolvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CLOSED')}
          className={`pb-3 flex items-center space-x-2 transition-all relative ${
            activeTab === 'CLOSED' 
              ? 'text-slate-800 dark:text-slate-200 font-black border-b-2 border-slate-700' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <span>Closed</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-extrabold">
            {closedCount}
          </span>
        </button>
      </div>

      {/* Sub-banner Notice matching Screenshot 1 */}
      <p className="text-xs text-slate-500 italic">
        Below tickets are currently being reviewed by our client support agent.
      </p>

      {/* Filter Toolbar */}
      <div className="flex items-center space-x-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ticket ID / LRN"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <input
          type="text"
          readOnly
          placeholder="Date Range ▾"
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-500 cursor-pointer font-semibold"
          onClick={() => alert('Filter support tickets by date range')}
        />

        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
        >
          <option value="">Status ▾</option>
          <option value="Open">Open</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Support Tickets Table (Matching Screenshot 1 & 2) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3.5">TICKET ID & LRN</th>
                <th className="px-5 py-3.5">RAISED BY</th>
                <th className="px-5 py-3.5">CATEGORY - SUB CATEGORY</th>
                <th className="px-5 py-3.5">TICKET CREATED</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5">LAST UPDATE</th>
                <th className="px-5 py-3.5 text-right">SUPPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading support tickets...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No support tickets found for this tab. Click "+ Raise a ticket" to open a new ticket.</td>
                </tr>
              ) : (
                filteredTickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    
                    {/* Ticket ID & LRN */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">{t.ticket_id}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">{t.awb_number || 'General'}</p>
                    </td>

                    {/* Raised By */}
                    <td className="px-5 py-4 align-top font-medium text-slate-700 dark:text-slate-300">
                      {t.raised_by || 'cs@pswarehousing.com'}
                    </td>

                    {/* Category - Sub Category */}
                    <td className="px-5 py-4 align-top max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{t.category}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{t.sub_category || t.description}</p>
                    </td>

                    {/* Ticket Created */}
                    <td className="px-5 py-4 align-top text-slate-500 font-medium">
                      <p>{t.created_at ? format(new Date(t.created_at), 'dd MMM, yyyy') : '18 Aug, 2026'}</p>
                      <p className="text-[10px] text-slate-400">{t.created_at ? format(new Date(t.created_at), 'h:mm a') : '6:05 pm'}</p>
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-4 align-top">
                      <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-extrabold rounded-full ${
                        t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        t.status === 'Closed' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {t.status || 'Open'}
                      </span>
                    </td>

                    {/* Last Update */}
                    <td className="px-5 py-4 align-top text-slate-500 font-medium">
                      <p>{t.last_update ? format(new Date(t.last_update), 'dd MMM, yyyy') : '21 Aug, 2026'}</p>
                      <p className="text-[10px] text-slate-400">{t.last_update ? format(new Date(t.last_update), 'h:mm a') : '4:45 pm'}</p>
                    </td>

                    {/* Support Follow Up */}
                    <td className="px-5 py-4 text-right align-top">
                      <button
                        onClick={() => setShowFollowUpModal(t)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline flex items-center justify-end ml-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> Follow Up
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Showing 1-{filteredTickets.length} of {filteredTickets.length}</span>
          <span>Show 30 per page ▾</span>
        </div>
      </div>

      {/* RAISE A TICKET MODAL (Matching Screenshot 3) */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Raise a ticket</h2>
              <button onClick={() => setShowRaiseModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-5">
              
              {/* Category Pills Container */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Help us understand your issue</h3>

                {/* Shipment Issue Category Pills */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SHIPMENT ISSUE</p>
                  <div className="flex flex-wrap gap-2">
                    {shipmentCategories.map(cat => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleCategorySelect(cat.name, cat.subCategories[0])}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all text-left ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Other Issue Category Pills */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">OTHER ISSUE</p>
                  <div className="flex flex-wrap gap-2">
                    {otherCategories.map(cat => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleCategorySelect(cat.name, cat.subCategories[0])}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Sub-category & Details when category selected */}
              {selectedCategory && (
                <div className="space-y-4 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Category</label>
                    <select
                      value={selectedSubCategory}
                      onChange={e => setSelectedSubCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold bg-white dark:bg-slate-700 dark:text-white"
                    >
                      {[...shipmentCategories, ...otherCategories]
                        .find(c => c.name === selectedCategory)
                        ?.subCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">LRN / AWB Number (Optional)</label>
                    <input
                      type="text"
                      value={awbNumber}
                      onChange={e => setAwbNumber(e.target.value)}
                      placeholder="e.g. 313032596"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Description & Remarks</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Please provide details of your query or issue..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Footer Options matching Screenshot 3 */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={e => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>Email notifications</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCcInput(!showCcInput)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" /> Add more CC emails
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold flex items-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Categories
                </button>
              </div>

              {showCcInput && (
                <div>
                  <input
                    type="text"
                    value={ccEmails}
                    onChange={e => setCcEmails(e.target.value)}
                    placeholder="Enter CC email addresses (comma separated)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedCategory}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting Ticket...' : 'Submit Ticket'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FOLLOW UP MODAL */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Ticket Follow-Up</h3>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400">ID: {showFollowUpModal.ticket_id}</p>
              </div>
              <button onClick={() => setShowFollowUpModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">{showFollowUpModal.category}</p>
              <p className="text-slate-500 text-[11px]">{showFollowUpModal.sub_category}</p>
              {showFollowUpModal.awb_number && (
                <p className="font-mono text-blue-600 text-[10px]">LRN: {showFollowUpModal.awb_number}</p>
              )}
            </div>

            <form onSubmit={handleSendFollowUp} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Add Follow-Up Note / Message</label>
                <textarea
                  rows={3}
                  required
                  value={followUpMsg}
                  onChange={e => setFollowUpMsg(e.target.value)}
                  placeholder="Type your message for the support team..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Follow Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
