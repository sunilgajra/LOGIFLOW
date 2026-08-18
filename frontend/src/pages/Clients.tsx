import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { Users, Plus, X, Search, Building2, Mail, Phone, Package, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
    pan_number: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    fetchApi('/clients')
      .then(data => {
        setClients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.client_id?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_person?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const handleOpenNew = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ client_id: '', company_name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '', pan_number: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (client: any) => {
    setIsEditing(true);
    setEditingId(client.id);
    setFormData({
      client_id: client.client_id || '',
      company_name: client.company_name || '',
      contact_person: client.contact_person || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      gst_number: client.gst_number || '',
      pan_number: client.pan_number || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await fetchApi(`/clients/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/clients', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      alert('Failed to save client');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Client Portal & Sub-Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage merchant accounts, sub-account login access, and client billing agreements.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Merchant Client
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Active Clients</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{clients.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sub-Account Logins</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {clients.filter(c => c.users?.length > 0 || c.email).length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Active Shipments</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {clients.reduce((acc, c) => acc + (c._count?.shipments || 0), 0)}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter clients by ID, Company Name, Contact Person, or Email..."
          className="w-full bg-transparent border-none text-xs dark:text-white focus:outline-none placeholder-slate-400 font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 px-2">Clear</button>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading client records...</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No clients found</h3>
            <p className="text-xs text-slate-500">Get started by onboarding a new merchant client.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3">Client ID</th>
                <th className="px-6 py-3">Company Name</th>
                <th className="px-6 py-3">Contact Person</th>
                <th className="px-6 py-3 text-center">Shipments</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">{client.client_id}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                      className="text-left hover:text-blue-600 transition-colors group"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:underline flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {client.company_name}
                      </div>
                      {client.address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{client.address}</div>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{client.contact_person || '-'}</div>
                    <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                      <Mail className="w-3 h-3 mr-1 text-slate-400" />
                      {client.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-xs font-mono">
                      {client._count?.shipments || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {client.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleEdit(client)} 
                      className="text-slate-600 hover:text-slate-800 dark:text-slate-400 font-semibold px-2 py-1"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs"></div>
            </div>
            
            <div className="relative z-10 inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle max-w-lg w-full p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Client Record' : 'Onboard New Merchant Client'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Client ID (e.g. CLI-003)</label>
                    <input required type="text" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold dark:bg-slate-700 dark:text-white" placeholder="CLI-003" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Company Registered Name</label>
                    <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white" placeholder="e.g. Apex Traders Pvt Ltd" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Contact Person</label>
                    <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white" placeholder="Contact name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white" placeholder="client@company.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white font-mono" placeholder="+91 9876543210" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number</label>
                      <input type="text" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold uppercase dark:bg-slate-700 dark:text-white" placeholder="27XXXXX..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number</label>
                      <input type="text" value={formData.pan_number} onChange={e => setFormData({...formData, pan_number: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold uppercase dark:bg-slate-700 dark:text-white" placeholder="ABCDE1234F" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Address</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white resize-none" placeholder="Full office address..." />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
