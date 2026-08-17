import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

interface ZoneMapping {
  id: string;
  state_name: string;
  zone_name: string;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh",
  "Dadra & Nagar Haveli", "Daman & Diu", "Puducherry"
];

const standardZones = ["N1", "N2", "E", "NE", "W1", "W2", "S1", "S2", "C", "DEFAULT"];

export default function Zones() {
  const [zones, setZones] = useState<ZoneMapping[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/zones');
      if (!res.error) setZones(res);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleZoneChange = async (state_name: string, zone_name: string) => {
    try {
      await fetchApi('/zones', {
        method: 'POST',
        body: JSON.stringify({ state_name, zone_name })
      });
      fetchZones(); // Refresh
    } catch (error) {
      alert("Failed to update zone mapping");
    }
  };

  const getZoneForState = (state: string) => {
    return zones.find(z => z.state_name === state)?.zone_name || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">State to Zone Mapping</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Map Indian states to standard pricing zones (N1, N2, etc.) to allow the Rate Engine to calculate correct freight costs.</p>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indianStates.map(state => (
              <div key={state} className="flex justify-between items-center p-3 border border-gray-100 dark:border-slate-700 rounded-md">
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{state}</span>
                <select
                  value={getZoneForState(state)}
                  onChange={(e) => handleZoneChange(state, e.target.value)}
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">-- Select Zone --</option>
                  {standardZones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
