import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Truck, Plus } from 'lucide-react';

const Couriers = () => {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/couriers')
      .then(data => {
        setCouriers(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Courier Partners</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Courier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading couriers...</div>
        ) : couriers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Truck className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No couriers found</h3>
            <p className="text-slate-500">Get started by creating a new courier partner.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Courier ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Shipments Handled</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {couriers.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{courier.courier_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{courier.courier_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{courier._count?.shipments || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      {courier.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Couriers;
