import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Plus, Save, Trash2, Edit } from 'lucide-react';

interface RateCard {
  id: string;
  name: string;
  min_weight_kg: number;
  docket_charge: number;
  min_booking_amount: number;
  rates_matrix: string;
  fsc_percentage?: number;
  idc_percentage?: number;
  oda_charge?: number;
  green_tax_rate?: number;
  client_id?: string;
  client?: { company_name: string };
}

export default function Rates() {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<RateCard> | null>(null);
  
  // Matrix editor state
  const [zones] = useState(["N1", "N2", "E", "NE", "W1", "W2", "S1", "S2", "C"]);
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratesRes, clientsRes] = await Promise.all([
        fetchApi('/rates'),
        fetchApi('/clients')
      ]);
      setRateCards(ratesRes || []);
      setClients(clientsRes || []);
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
        min_weight_kg: 20,
        docket_charge: 50,
        min_booking_amount: 350,
        fsc_percentage: 10,
        idc_percentage: 0,
        oda_charge: 770,
        green_tax_rate: 100,
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
    if (!editingCard?.name) return alert("Please enter a name");
    
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
    if (!window.confirm("Are you sure?")) return;
    try {
      await fetchApi(`/rates/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      alert("Failed to delete rate card");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rate Cards Engine</h1>
        <button 
          onClick={() => openEditor()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> New Rate Card
        </button>
      </div>

      {isEditing && editingCard ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{editingCard.id ? 'Edit Rate Card' : 'New Rate Card'}</h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Name</label>
              <input 
                type="text" 
                value={editingCard.name} 
                onChange={e => setEditingCard({...editingCard, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="e.g. Standard PROSTARM Rates"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Client (Optional)</label>
              <select 
                value={editingCard.client_id || ''} 
                onChange={e => setEditingCard({...editingCard, client_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="">-- No Client (Default Card) --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Weight (Kg)</label>
              <input 
                type="number" 
                value={editingCard.min_weight_kg} 
                onChange={e => setEditingCard({...editingCard, min_weight_kg: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Docket Charge (Rs)</label>
              <input 
                type="number" 
                value={editingCard.docket_charge} 
                onChange={e => setEditingCard({...editingCard, docket_charge: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Booking (Rs)</label>
              <input 
                type="number" 
                value={editingCard.min_booking_amount} 
                onChange={e => setEditingCard({...editingCard, min_booking_amount: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FSC Surcharge (%)</label>
              <input 
                type="number" 
                value={editingCard.fsc_percentage} 
                onChange={e => setEditingCard({...editingCard, fsc_percentage: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IDC Charge (%)</label>
              <input 
                type="number" 
                value={editingCard.idc_percentage} 
                onChange={e => setEditingCard({...editingCard, idc_percentage: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard ODA Fee (Rs)</label>
              <input 
                type="number" 
                value={editingCard.oda_charge} 
                onChange={e => setEditingCard({...editingCard, oda_charge: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Green Tax (Rs / shpmt)</label>
              <input 
                type="number" 
                value={editingCard.green_tax_rate} 
                onChange={e => setEditingCard({...editingCard, green_tax_rate: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Rates Matrix (Rs per Kg)</h3>
          <p className="text-sm text-gray-500 mb-4">Leave cells blank if the route is not applicable. Rows = Origin, Columns = Destination.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 font-medium">Origin \ Dest</th>
                  {zones.map(z => <th key={`col-${z}`} className="border p-2 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 font-medium">{z}</th>)}
                </tr>
              </thead>
              <tbody>
                {zones.map(origin => (
                  <tr key={`row-${origin}`}>
                    <td className="border p-2 bg-gray-50 dark:bg-slate-900 font-medium text-center text-gray-700 dark:text-gray-300">{origin}</td>
                    {zones.map(dest => (
                      <td key={`cell-${origin}-${dest}`} className="border p-1">
                        <input 
                          type="number" 
                          step="0.01"
                          value={matrixState[origin]?.[dest] || ''}
                          onChange={e => handleMatrixChange(origin, dest, e.target.value)}
                          className="w-full h-full p-1 text-center bg-transparent focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          placeholder="-"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
             <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</button>
             <button onClick={saveRateCard} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
               <Save className="w-4 h-4 mr-2" /> Save Rate Card
             </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rateCards.map(card => (
            <div key={card.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{card.name}</h3>
                  <p className="text-sm text-gray-500">{card.client ? `Client: ${card.client.company_name}` : 'Default Global Card'}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openEditor(card)} className="text-indigo-600 hover:text-indigo-800"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteRateCard(card.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between"><span>Min Weight:</span> <span className="font-medium text-gray-900 dark:text-white">{card.min_weight_kg} kg</span></div>
                <div className="flex justify-between"><span>Docket Charge:</span> <span className="font-medium text-gray-900 dark:text-white">Rs {card.docket_charge}</span></div>
                <div className="flex justify-between"><span>Min Booking:</span> <span className="font-medium text-gray-900 dark:text-white">Rs {card.min_booking_amount}</span></div>
              </div>
            </div>
          ))}
          {rateCards.length === 0 && !loading && (
             <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
                No Rate Cards defined yet. Create your first rate card to automate billing!
             </div>
          )}
        </div>
      )}
    </div>
  );
}
