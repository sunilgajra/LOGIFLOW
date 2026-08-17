import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api';
import { Package, Truck, CheckCircle, Search, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [awb, setAwb] = useState(searchParams.get('awb') || '');
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTrackingData = async (awbNumber: string) => {
    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const data = await fetchApi(`/public/track/${awbNumber}`);
      setTrackingData(data);
    } catch (err: any) {
      console.error(err);
      setError('Shipment not found. Please check your AWB number and try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (awb.trim()) {
      fetchTrackingData(awb.trim());
    }
  }, []); // Run on mount if awb is in URL

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awb.trim()) return;
    fetchTrackingData(awb.trim());
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'BOOKED': return 1;
      case 'IN_TRANSIT': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      case 'RTO':
      case 'EXCEPTION': return -1;
      default: return 0;
    }
  };

  const renderTimeline = (status: string) => {
    const step = getStatusStep(status);
    
    if (step === -1) {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Delivery Exception</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm">
            There is an issue with your delivery. Please contact customer support for more information.
          </p>
        </div>
      );
    }

    const steps = [
      { num: 1, title: 'Booked', icon: Package },
      { num: 2, title: 'In Transit', icon: Truck },
      { num: 3, title: 'Out for Delivery', icon: MapPin },
      { num: 4, title: 'Delivered', icon: CheckCircle }
    ];

    return (
      <div className="relative mt-8">
        <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded">
          <div 
            className="h-full bg-blue-600 rounded transition-all duration-1000 ease-out" 
            style={{ width: `${(Math.max(0, step - 1) / 3) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const isCompleted = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.title} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 transition-colors duration-500 ${
                  isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className={`mt-3 text-sm font-medium ${isCurrent ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">LogiFlow</span>
          </div>
          <a href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">Back to Home</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Track Your Shipment
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Enter your AWB number below to get real-time status updates on your package.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value.toUpperCase())}
                placeholder="Enter AWB Number (e.g. AWB12345678)"
                className="block w-full pl-12 pr-4 py-4 text-lg border-0 bg-transparent rounded-xl focus:ring-0 focus:outline-none placeholder-slate-400 font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-70 flex items-center"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl max-w-2xl mx-auto text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Tracking Results */}
        {trackingData && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">AWB NUMBER</p>
                <p className="text-2xl font-bold tracking-wider">{trackingData.awb_number}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-slate-400 text-sm font-medium mb-1">CURRENT STATUS</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-100 border border-blue-500/30">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                  <span className="font-semibold text-sm uppercase tracking-wide">{trackingData.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              {renderTimeline(trackingData.status)}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-100">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Shipment Details</h3>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Destination</p>
                      <p className="text-base font-semibold text-slate-900">{trackingData.destination_city}, {trackingData.destination_state}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Booking Date</p>
                      <p className="text-base font-semibold text-slate-900">
                        {trackingData.booking_date ? format(new Date(trackingData.booking_date), 'dd MMM yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Truck className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Courier Partner</p>
                      <p className="text-base font-semibold text-slate-900">{trackingData.courier_name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center mb-4">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-bold text-slate-900">
                      {trackingData.status === 'DELIVERED' ? 'Delivery Info' : 'Expected Delivery'}
                    </h3>
                  </div>

                  {trackingData.status === 'DELIVERED' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Delivered on <span className="font-bold text-slate-900">{trackingData.delivered_at ? format(new Date(trackingData.delivered_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        Received by <span className="font-bold text-slate-900">{trackingData.receiver_name}</span>
                      </p>
                      {trackingData.podSignature && (
                        <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signature</p>
                          <img src={trackingData.podSignature} alt="Signature" className="max-h-24 w-auto object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {trackingData.expected_delivery ? format(new Date(trackingData.expected_delivery), 'dd MMM yyyy') : 'Pending'}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        This date is an estimate based on standard transit times.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} LogiFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;
