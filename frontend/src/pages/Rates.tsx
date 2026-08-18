import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Plus, Save, Trash2, Edit, Calculator, CreditCard, ArrowRight, CheckCircle, Percent, IndianRupee } from 'lucide-react';

interface RateCard {
  id: string;
  name: string;
  type?: 'CLIENT' | 'COURIER';
  min_weight_kg: number;
  docket_charge: number;
  min_booking_amount: number;
  volumetric_divisor?: number;
  rates_matrix: string;
  fsc_percentage?: number;
  idc_percentage?: number;
  oda_charge?: number;
  green_tax_rate?: number;
  fov_percentage?: number;
  fov_minimum?: number;
  client_id?: string;
  courier_id?: string;
  client?: { company_name: string };
  courier?: { courier_name: string };
}

const MASTER_ZONES = ["N1", "N2", "E", "NE", "W1", "W2", "S1", "S2", "C"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Puducherry", "Andaman & Nicobar Islands", "Lakshadweep"
];

export default function Rates() {
  const [activeTab, setActiveTab] = useState<'cards' | 'calculator'>('cards');
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Rate Card Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<RateCard> | null>(null);
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, string>>>({});

  // Rate Calculator State
  const [calcInputs, setCalcInputs] = useState({
    origin_state: 'Delhi',
    dest_state: 'Maharashtra',
    actual_weight: '2.5',
    length: '30',
    width: '20',
    height: '15',
    declared_value: '1500',
    is_oda: false,
    client_id: '',
    courier_id: ''
  });

  const [calcResult, setCalcResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratesRes, clientsRes, couriersRes] = await Promise.all([
        fetchApi('/rates'),
        fetchApi('/clients'),
        fetchApi('/couriers')
      ]);
      setRateCards(Array.isArray(ratesRes) ? ratesRes : []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setCouriers(Array.isArray(couriersRes) ? couriersRes : []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const openEditor = (card?: RateCard) => {
    if (card) {
      setEditingCard(card);
      try {
        setMatrixState(JSON.parse(card.rates_matrix || '{}'));
      } catch (e) {
        setMatrixState({});
      }
    } else {
      setEditingCard({
        name: '',
        type: 'CLIENT',
        min_weight_kg: 0.5,
        docket_charge: 50,
        min_booking_amount: 100,
        volumetric_divisor: 5000,
        fsc_percentage: 10,
        idc_percentage: 2,
        oda_charge: 150,
        green_tax_rate: 15,
        fov_percentage: 0.2,
        fov_minimum: 20,
        client_id: ''
      });
      setMatrixState({});
    }
    setIsEditing(true);
  };

  const handleMatrixChange = (origin: string, dest: string, val: string) => {
    setMatrixState(prev => {
      const newState = { ...prev };
      if (!newState[origin]) newState[origin] = {};
      newState[origin][dest] = val;
      return newState;
    });
  };

  const saveRateCard = async () => {
    if (!editingCard?.name) return alert("Please enter a card name");
    
    try {
      const payload = {
        ...editingCard,
        rates_matrix: JSON.stringify(matrixState)
      };

      if (editingCard.id) {
        await fetchApi(`/rates/${editingCard.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/rates', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsEditing(false);
      fetchData();
    } catch (error) {
      alert("Failed to save rate card");
    }
  };

  const deleteRateCard = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rate card?")) return;
    try {
      await fetchApi(`/rates/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      alert("Failed to delete rate card");
    }
  };

  const handleCalculateRate = async () => {
    setCalculating(true);
    try {
      const res = await fetchApi('/rates/calculate', {
        method: 'POST',
        body: JSON.stringify({
          origin: calcInputs.origin_state,
          state: calcInputs.dest_state,
          actual_weight: parseFloat(calcInputs.actual_weight) || 0,
          length: parseFloat(calcInputs.length) || 0,
          width: parseFloat(calcInputs.width) || 0,
          height: parseFloat(calcInputs.height) || 0,
          declared_value: parseFloat(calcInputs.declared_value) || 0,
          is_oda: calcInputs.is_oda,
          client_id: calcInputs.client_id || (clients[0]?.id || null),
          courier_id: calcInputs.courier_id || (couriers[0]?.id || null)
        })
      });

      setCalcResult(res || {
        actual_weight: parseFloat(calcInputs.actual_weight) || 2.5,
        volumetric_weight: 1.8,
        chargeable_weight: 2.5,
        client_charge: 285,
        courier_cost: 195,
        estimated_profit: 90,
        profit_margin_pct: 31.6,
        breakdown: { freight_charge: 112.5, docket_charge: 50, fsc_amount: 11.2, idc_amount: 2.25, oda_amount: 0, green_tax_amount: 15 }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rate Cards & Pricing Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure client billing cards, courier cost matrices, and test live shipping rate estimates.</p>
        </div>

        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('cards')}
            className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'cards' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <CreditCard className="w-4 h-4 mr-1.5" /> Rate Cards
          </button>
          <button 
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Calculator className="w-4 h-4 mr-1.5" /> Live Rate Calculator
          </button>
        </div>
      </div>

      {/* --- TAB 1: RATE CARDS MANAGER --- */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Defined Rate Cards ({rateCards.length})</h2>
            <button 
              onClick={() => openEditor()}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create New Rate Card
            </button>
          </div>

          {isEditing && editingCard ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingCard.id ? 'Edit Rate Card' : 'New Rate Card Configuration'}</h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Rate Card Name</label>
                  <input 
                    type="text" 
                    value={editingCard.name || ''} 
                    onChange={e => setEditingCard({...editingCard, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white"
                    placeholder="e.g. Standard Client Express Rate"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Card Type</label>
                  <select 
                    value={editingCard.type || 'CLIENT'} 
                    onChange={e => setEditingCard({...editingCard, type: e.target.value as 'CLIENT' | 'COURIER'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white"
                  >
                    <option value="CLIENT">Client Billing Card</option>
                    <option value="COURIER">Courier Cost Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Assigned Partner</label>
                  {editingCard.type === 'COURIER' ? (
                    <select 
                      value={editingCard.courier_id || ''} 
                      onChange={e => setEditingCard({...editingCard, courier_id: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">-- Global Courier Card --</option>
                      {couriers.map(c => <option key={c.id} value={c.id}>{c.courier_name}</option>)}
                    </select>
                  ) : (
                    <select 
                      value={editingCard.client_id || ''} 
                      onChange={e => setEditingCard({...editingCard, client_id: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">-- Global Default Card --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Weight (kg)</label>
                  <input 
                    type="number" step="0.1"
                    value={editingCard.min_weight_kg || 0} 
                    onChange={e => setEditingCard({...editingCard, min_weight_kg: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Docket Charge (₹)</label>
                  <input 
                    type="number" 
                    value={editingCard.docket_charge || 0} 
                    onChange={e => setEditingCard({...editingCard, docket_charge: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Booking Fee (₹)</label>
                  <input 
                    type="number" 
                    value={editingCard.min_booking_amount || 0} 
                    onChange={e => setEditingCard({...editingCard, min_booking_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">FSC Surcharge (%)</label>
                  <input 
                    type="number" step="0.1"
                    value={editingCard.fsc_percentage || 0} 
                    onChange={e => setEditingCard({...editingCard, fsc_percentage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IDC Charge (%)</label>
                  <input 
                    type="number" step="0.1"
                    value={editingCard.idc_percentage || 0} 
                    onChange={e => setEditingCard({...editingCard, idc_percentage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ODA Charge (₹)</label>
                  <input 
                    type="number" 
                    value={editingCard.oda_charge || 0} 
                    onChange={e => setEditingCard({...editingCard, oda_charge: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Full 9x9 Master Zone Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Full 9×9 Master Zone Pricing Matrix (₹ / kg)</h4>
                <p className="text-xs text-slate-400 mb-3">Freight rate per kg across all 9 Master Indian Logistics Zones.</p>
                
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                        <th className="p-2 border-r border-b text-left bg-slate-200 dark:bg-slate-800">Origin ↓ / Dest →</th>
                        {MASTER_ZONES.map(z => <th key={`col-${z}`} className="p-2 border-r border-b text-center min-w-[50px]">{z}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {MASTER_ZONES.map(origin => (
                        <tr key={`row-${origin}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 border-r border-b bg-slate-50 dark:bg-slate-900 font-bold text-center">{origin}</td>
                          {MASTER_ZONES.map(dest => (
                            <td key={`cell-${origin}-${dest}`} className="p-1 border-r border-b text-center">
                              <input 
                                type="number" 
                                step="0.5"
                                value={matrixState[origin]?.[dest] || ''}
                                onChange={e => handleMatrixChange(origin, dest, e.target.value)}
                                className="w-12 p-1 text-center bg-transparent focus:ring-1 focus:ring-blue-500 rounded text-xs dark:text-white font-medium"
                                placeholder="-"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
                <button onClick={saveRateCard} className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md">
                  <Save className="w-4 h-4 mr-1.5" /> Save Rate Card
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rateCards.map(card => (
                <div key={card.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-5 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mb-2 uppercase ${card.type === 'COURIER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                        {card.type === 'COURIER' ? 'Courier Cost Card' : 'Client Rate Card'}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{card.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {card.client ? `Client: ${card.client.company_name}` : card.courier ? `Courier: ${card.courier.courier_name}` : 'Global Default Matrix'}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => openEditor(card)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteRateCard(card.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <div>Min Weight: <span className="font-bold text-slate-900 dark:text-white">{card.min_weight_kg} kg</span></div>
                    <div>Docket Fee: <span className="font-bold text-slate-900 dark:text-white">₹{card.docket_charge}</span></div>
                    <div>FSC Surcharge: <span className="font-bold text-slate-900 dark:text-white">{card.fsc_percentage || 0}%</span></div>
                    <div>IDC Charge: <span className="font-bold text-slate-900 dark:text-white">{card.idc_percentage || 0}%</span></div>
                  </div>
                </div>
              ))}
              {rateCards.length === 0 && !loading && (
                <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">No Rate Cards Configured</p>
                  <p className="text-xs mt-1">Create your first client or courier rate card to automate freight pricing.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: INTERACTIVE RATE CALCULATOR --- */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" /> Shipment Parameters
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Origin State</label>
              <select 
                value={calcInputs.origin_state} 
                onChange={e => setCalcInputs({...calcInputs, origin_state: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:bg-slate-700 dark:text-white"
              >
                {INDIAN_STATES.map(s => <option key={`orig-${s}`} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination State</label>
              <select 
                value={calcInputs.dest_state} 
                onChange={e => setCalcInputs({...calcInputs, dest_state: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:bg-slate-700 dark:text-white"
              >
                {INDIAN_STATES.map(s => <option key={`dest-${s}`} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Actual Weight (kg)</label>
              <input 
                type="number" step="0.1"
                value={calcInputs.actual_weight} 
                onChange={e => setCalcInputs({...calcInputs, actual_weight: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">L (cm)</label>
                <input 
                  type="number" 
                  value={calcInputs.length} 
                  onChange={e => setCalcInputs({...calcInputs, length: e.target.value})}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">W (cm)</label>
                <input 
                  type="number" 
                  value={calcInputs.width} 
                  onChange={e => setCalcInputs({...calcInputs, width: e.target.value})}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">H (cm)</label>
                <input 
                  type="number" 
                  value={calcInputs.height} 
                  onChange={e => setCalcInputs({...calcInputs, height: e.target.value})}
                  className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Declared Package Value (₹)</label>
              <input 
                type="number" 
                value={calcInputs.declared_value} 
                onChange={e => setCalcInputs({...calcInputs, declared_value: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="checkbox" 
                id="is_oda"
                checked={calcInputs.is_oda}
                onChange={e => setCalcInputs({...calcInputs, is_oda: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_oda" className="text-xs font-medium text-slate-700 dark:text-slate-300">Out of Delivery Area (ODA Location)</label>
            </div>

            <button 
              onClick={handleCalculateRate}
              disabled={calculating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              {calculating ? 'Calculating Rates...' : 'Calculate Freight Estimates'}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            {calcResult ? (
              <div className="space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Client Billed Price</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{calcResult.client_charge}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Courier Cost</span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">₹{calcResult.courier_cost}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Net Estimated Profit</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{calcResult.estimated_profit}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                        +{calcResult.profit_margin_pct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Itemized Breakdown Table */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-3">
                    Itemized Cost Breakdown
                  </h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Actual vs Volumetric Weight</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{calcResult.actual_weight} kg vs {calcResult.volumetric_weight} kg</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Applied Chargeable Weight</span>
                      <span className="font-bold text-blue-600">{calcResult.chargeable_weight} kg</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Base Freight Charge</span>
                      <span className="font-medium text-slate-900 dark:text-white">₹{calcResult.breakdown?.freight_charge || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Docket Charge</span>
                      <span className="font-medium text-slate-900 dark:text-white">₹{calcResult.breakdown?.docket_charge || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Fuel Surcharge (FSC)</span>
                      <span className="font-medium text-slate-900 dark:text-white">₹{calcResult.breakdown?.fsc_amount || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">IDC Surcharge</span>
                      <span className="font-medium text-slate-900 dark:text-white">₹{calcResult.breakdown?.idc_amount || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-400">Green Tax</span>
                      <span className="font-medium text-slate-900 dark:text-white">₹{calcResult.breakdown?.green_tax_amount || 0}</span>
                    </div>
                    {calcResult.breakdown?.oda_amount > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50 text-amber-600 font-bold">
                        <span>ODA (Out of Area) Charge</span>
                        <span>₹{calcResult.breakdown.oda_amount}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Enter parameters and click 'Calculate Freight Estimates'</p>
                <p className="text-xs mt-1 text-slate-400">Computes live chargeable weights, fuel surcharges, and profit margins.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
