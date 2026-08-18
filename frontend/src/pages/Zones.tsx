import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { MapPin, Search, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface ZoneMapping {
  id?: string;
  state_name: string;
  zone_name: string;
}

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Puducherry", "Andaman & Nicobar Islands", "Lakshadweep"
];

const STANDARD_ZONES = ["N1", "N2", "E", "NE", "W1", "W2", "S1", "S2", "C", "DEFAULT"];

export default function Zones() {
  const [zones, setZones] = useState<ZoneMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [savingState, setSavingState] = useState<string | null>(null);
  const [savedSuccessState, setSavedSuccessState] = useState<string | null>(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/zones');
      if (res && Array.isArray(res)) {
        setZones(res);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleZoneChange = async (state_name: string, zone_name: string) => {
    setSavingState(state_name);
    try {
      await fetchApi('/zones', {
        method: 'POST',
        body: JSON.stringify({ state_name, zone_name })
      });

      setZones(prev => {
        const existing = prev.find(z => z.state_name === state_name);
        if (existing) {
          return prev.map(z => z.state_name === state_name ? { ...z, zone_name } : z);
        }
        return [...prev, { state_name, zone_name }];
      });

      setSavedSuccessState(state_name);
      setTimeout(() => setSavedSuccessState(null), 2000);
    } catch (error) {
      alert("Failed to update zone mapping");
    } finally {
      setSavingState(null);
    }
  };

  const getZoneForState = (state: string) => {
    return zones.find(z => z.state_name === state)?.zone_name || "N1";
  };

  const filteredStates = INDIAN_STATES_AND_UTS.filter(s => 
    s.toLowerCase().includes(search.toLowerCase())
  );

  // Compute summary stats for each zone code
  const zoneCounts = STANDARD_ZONES.reduce((acc, zone) => {
    acc[zone] = INDIAN_STATES_AND_UTS.filter(state => getZoneForState(state) === zone).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Master State to Zone Mapping</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configure pricing zone assignments across all 36 Indian States and Union Territories for the Rate Engine.</p>
        </div>

        <button 
          onClick={fetchZones}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Mappings
        </button>
      </div>

      {/* Zone Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {STANDARD_ZONES.map(z => (
          <div key={`badge-${z}`} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-xs">
            <span className="text-xs font-bold text-slate-400 block">{z}</span>
            <span className="text-lg font-black text-blue-600">{zoneCounts[z] || 0}</span>
            <span className="text-[10px] text-slate-400 block">States</span>
          </div>
        ))}
      </div>

      {/* Main Content Box */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Indian State or Union Territory..." 
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStates.length}</span> of 36 States & Territories
          </div>
        </div>

        {/* State Zone Mapping Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading zone configurations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStates.map(state => {
              const assignedZone = getZoneForState(state);
              const isSaving = savingState === state;
              const isSaved = savedSuccessState === state;

              return (
                <div 
                  key={state} 
                  className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                    isSaved ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">{state}</span>
                    <span className="text-[11px] text-slate-500 flex items-center">
                      {isSaving ? (
                        <span className="text-blue-600 font-semibold flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>
                      ) : isSaved ? (
                        <span className="text-emerald-600 font-semibold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Saved!</span>
                      ) : (
                        `Zone: ${assignedZone}`
                      )}
                    </span>
                  </div>

                  <select
                    value={assignedZone}
                    disabled={isSaving}
                    onChange={(e) => handleZoneChange(state, e.target.value)}
                    className="px-3 py-1.5 text-sm font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    {STANDARD_ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
