import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TrackingModalProps {
  awbNumber: string;
  onClose: () => void;
}

const TrackingModal: React.FC<TrackingModalProps> = ({ awbNumber, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setData(null);

    fetchApi(`/public/track/${awbNumber}`)
      .then(res => {
        if (!res || res.error || !res.status) {
          setError(res?.error || 'Shipment tracking information unavailable.');
          setData(null);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Shipment tracking information unavailable.');
        setData(null);
        setLoading(false);
      });
  }, [awbNumber]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tracking Details</h3>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{awbNumber}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading tracking data...</div>
          ) : error ? (
            <div className="text-center py-8 text-rose-500">{error}</div>
          ) : (
            <div>
              {/* Summary */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                  <p className="text-xl font-bold text-slate-900">{data?.status || 'BOOKED'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Destination</p>
                  <p className="font-medium text-slate-800">{data?.destination_city || 'N/A'}</p>
                </div>
              </div>

              {/* Timeline */}
              <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Tracking History</h4>
              
              {!data.history || data.history.length === 0 ? (
                <p className="text-slate-500 text-sm">No tracking history available yet.</p>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                  {data.history.map((event: any, idx: number) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={event.id || idx} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white ${isLatest ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                        
                        <div className="ml-2">
                          <p className={`font-semibold ${isLatest ? 'text-blue-700' : 'text-slate-700'}`}>
                            {event.status} {event.location ? `- ${event.location}` : ''}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(event.timestamp), 'dd MMM yyyy, hh:mm a')}
                          </p>
                          {event.raw_status && (
                            <p className="text-xs text-slate-400 mt-1 italic">{event.raw_status}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
