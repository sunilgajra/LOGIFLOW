import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../api';
import { MapPin, Search, CheckCircle, RefreshCw, Wand2, Filter, Info, ShieldCheck } from 'lucide-react';

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

// Default Indian Logistics Standard Presets
const DEFAULT_PRESET_MAP: Record<string, string> = {
  "Delhi": "N1", "Haryana": "N1", "Punjab": "N1", "Uttar Pradesh": "N1", "Chandigarh": "N1",
  "Jammu & Kashmir": "N2", "Ladakh": "N2", "Himachal Pradesh": "N2", "Uttarakhand": "N2",
  "Maharashtra": "W1", "Gujarat": "W1", "Goa": "W1", "Dadra & Nagar Haveli and Daman & Diu": "W1",
  "Rajasthan": "W2",
  "Karnataka": "S1", "Tamil Nadu": "S1", "Telangana": "S1", "Andhra Pradesh": "S1", "Puducherry": "S1",
  "Kerala": "S2", "Lakshadweep": "S2",
  "West Bengal": "E", "Bihar": "E", "Jharkhand": "E", "Odisha": "E", "Andaman & Nicobar Islands": "E",
  "Assam": "NE", "Arunachal Pradesh": "NE", "Manipur": "NE", "Meghalaya": "NE", "Mizoram": "NE", "Nagaland": "NE", "Sikkim": "NE", "Tripura": "NE",
  "Madhya Pradesh": "C", "Chhattisgarh": "C"
};

export default function Zones() {
  const [zones, setZones] = useState<ZoneMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<string | null>(null);
  const [savedSuccessState, setSavedSuccessState] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  const applyIndustryPresets = async () => {
    if (!window.confirm("Apply standard Indian logistics zone mapping presets across all 36 States & Union Territories?")) return;
    
    setLoading(true);
    try {
      const newMappings: ZoneMapping[] = [];
      for (const [state_name, zone_name] of Object.entries(DEFAULT_PRESET_MAP)) {
        await fetchApi('/zones', {
          method: 'POST',
          body: JSON.stringify({ state_name, zone_name })
        });
        newMappings.push({ state_name, zone_name });
      }
      setZones(newMappings);
      showToast("Standard Indian Logistics Zone Mapping Presets Applied!");
    } catch (error) {
      console.error(error);
      alert("Failed to apply presets");
    } finally {
      setLoading(false);
    }
  };

  const getZoneForState = (state: string) => {
    return zones.find(z => z.state_name === state)?.zone_name || DEFAULT_PRESET_MAP[state] || "N1";
  };

  const filteredStates = useMemo(() => {
    return INDIAN_STATES_AND_UTS.filter(state => {
      const matchesSearch = state.toLowerCase().includes(search.toLowerCase());
      const matchesZone = selectedZoneFilter ? getZoneForState(state) === selectedZoneFilter : true;
      return matchesSearch && matchesZone;
    });
  }, [search, selectedZoneFilter, zones]);

  // Compute summary stats for each zone code
  const zoneCounts = useMemo(() => {
    return STANDARD_ZONES.reduce((acc, zone) => {
      acc[zone] = INDIAN_STATES_AND_UTS.filter(state => getZoneForState(state) === zone).length;
      return acc;
    }, {} as Record<string, number>);
  }, [zones]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 font-bold text-xs animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Master State-to-Zone Mapping</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configure pricing zone assignments across all 36 Indian States and Union Territories for the Freight Engine.</p>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={applyIndustryPresets}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4 mr-1.5" /> Apply Indian Industry Presets
          </button>
          <button 
            onClick={fetchZones}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Interactive Zone Summary Filter Badges */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
          <span>Filter States by Master Zone (Click badge to filter):</span>
          {selectedZoneFilter && (
            <button 
              onClick={() => setSelectedZoneFilter(null)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
            >
              Clear Zone Filter ({selectedZoneFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {STANDARD_ZONES.map(z => {
            const isSelected = selectedZoneFilter === z;
            return (
              <button
                key={`badge-${z}`} 
                onClick={() => setSelectedZoneFilter(isSelected ? null : z)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <span className={`text-[10px] font-extrabold block uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{z}</span>
                <span className={`text-lg font-black ${isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>{zoneCounts[z] || 0}</span>
                <span className={`text-[9px] block ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>States</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        
        {/* Search Bar & Filter Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter Indian State or Union Territory..." 
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors font-medium"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStates.length}</span> of 36 States & Territories
          </div>
        </div>

        {/* State Zone Mapping Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading zone configurations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStates.map(state => {
              const assignedZone = getZoneForState(state);
              const isSaving = savingState === state;
              const isSaved = savedSuccessState === state;

              return (
                <div 
                  key={state} 
                  className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                    isSaved ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{state}</span>
                    <span className="text-[11px] text-slate-500 flex items-center mt-0.5">
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
                    className="px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
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
