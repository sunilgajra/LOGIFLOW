import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api';
import { Package, Truck, CheckCircle, Search, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [awb, setAwb] = useState(searchParams.get('awb') || '');
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sampleAwbs = ['DELH88291034', 'BLUED99102451'];

  const fetchTrackingData = async (awbNumber: string) => {
    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const data = await fetchApi(`/public/track/${awbNumber}`);
      if (!data) throw new Error('Shipment not found');
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
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awb.trim()) return;
    fetchTrackingData(awb.trim());
  };

  const handleQuickSearch = (code: string) => {
    setAwb(code);
    fetchTrackingData(code);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'BOOKED': return 1;
      case 'IN_TRANSIT': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      case 'RTO':
      case 'EXCEPTION': return -1;
      default: return 2;
    }
  };

  const renderProgressStepper = (status: string) => {
    const step = getStatusStep(status);
    
    if (step === -1) {
      return (
        <div className="flex flex-col items-center py-6 bg-rose-50 rounded-xl p-4 border border-rose-200">
          <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
          <h3 className="text-base font-bold text-rose-900">Delivery Exception / NDR Alert</h3>
          <p className="text-xs text-rose-700 text-center max-w-sm mt-1">
            Package delivery issue encountered. Please contact support or your merchant.
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
      <div className="relative my-6">
        <div className="absolute top-6 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-700" 
            style={{ width: `${(Math.max(0, step - 1) / 3) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((s) => {
            const isCompleted = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.title} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md z-10 transition-colors ${
                  isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className={`mt-2 text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-500'}`}>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
      
      {/* Navbar Header */}
      <header className="bg-white dark:bg-slate-800 shadow-xs border-b border-slate-200 dark:border-slate-700 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">LogiFlow Track</span>
          </div>
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Back to Home</a>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Track Your Package Live
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Get real-time milestone updates, estimated delivery SLA, and electronic proof of delivery (E-POD).
          </p>

          {/* Quick Demo AWB Chips */}
          <div className="flex justify-center items-center space-x-2 pt-2">
            <span className="text-xs text-slate-400 font-medium">Try Sample AWBs:</span>
            {sampleAwbs.map(sample => (
              <button 
                key={sample}
                onClick={() => handleQuickSearch(sample)}
                className="px-2.5 py-1 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-full font-mono text-xs font-bold border border-blue-200 dark:border-slate-700 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Card */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value.toUpperCase())}
                placeholder="Enter AWB Tracking Number..."
                className="w-full pl-12 pr-4 py-3 border-0 bg-transparent text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-70 flex items-center shadow-md"
            >
              {loading ? 'Searching...' : 'Track Package'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </button>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 p-4 rounded-xl max-w-xl mx-auto text-center text-xs font-bold">
            {error}
          </div>
        )}

        {/* TRACKING RESULTS CARD */}
        {trackingData && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden space-y-6">
            
            {/* Dark Header Banner */}
            <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tracking Number (AWB)</span>
                <p className="text-2xl font-black font-mono text-blue-400">{trackingData.awb_number}</p>
                <p className="text-xs text-slate-300 mt-1">Courier: <span className="font-bold text-white">{trackingData.courier_name}</span></p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold rounded-full inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  {trackingData.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Progress Stepper Bar */}
              {renderProgressStepper(trackingData.status)}

              {/* Grid: Details & E-POD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                
                {/* Shipment Details Box */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Shipment Overview</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-blue-600 mr-2.5 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold block">Destination</span>
                        <span className="font-bold text-slate-900 dark:text-white">{trackingData.destination_city}, {trackingData.destination_state}</span>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="w-4 h-4 text-purple-600 mr-2.5 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold block">Booking Date</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {trackingData.booking_date ? format(new Date(trackingData.booking_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Truck className="w-4 h-4 text-emerald-600 mr-2.5 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold block">Recipient</span>
                        <span className="font-bold text-slate-900 dark:text-white">{trackingData.receiver_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Info & E-POD Card */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center text-blue-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {trackingData.status === 'DELIVERED' ? 'Proof of Delivery (E-POD)' : 'Estimated SLA Delivery'}
                    </h3>
                  </div>

                  {trackingData.status === 'DELIVERED' ? (
                    <div className="space-y-3 text-xs">
                      <p className="text-slate-600 dark:text-slate-300">
                        Delivered on <span className="font-bold text-slate-900 dark:text-white">{trackingData.delivered_at ? format(new Date(trackingData.delivered_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Signed By: <span className="font-bold text-slate-900 dark:text-white">{trackingData.receiver_name}</span>
                      </p>
                      {trackingData.podSignature && (
                        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Digital Signature E-POD</span>
                          <img src={trackingData.podSignature} alt="Digital Signature" className="h-14 max-w-full object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-extrabold text-blue-600">
                        {trackingData.expected_delivery ? format(new Date(trackingData.expected_delivery), 'dd MMM yyyy') : 'Pending SLA'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Estimated arrival date based on courier transit network.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* VERTICAL MILESTONE TIMELINE */}
              {trackingData.history && trackingData.history.length > 0 && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Milestone Tracking History
                  </h3>

                  <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-slate-700">
                    {trackingData.history.map((event: any, idx: number) => (
                      <div key={idx} className="relative flex items-start space-x-3">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 flex-shrink-0 mt-1 z-10 ${
                          idx === trackingData.history.length - 1 ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40' : 'bg-slate-400'
                        }`} />
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{event.location || 'Sorting Hub'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {event.timestamp ? format(new Date(event.timestamp), 'dd MMM, hh:mm a') : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center">
                            <CornerDownRight className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" /> {event.details || event.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} LogiFlow ERP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
