import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit3, CheckCircle, Package, Search, X, ChevronRight, User, MapPin, Navigation, RefreshCw, Smartphone } from 'lucide-react';
import { fetchApi } from '../api';

export default function DeliveryMode() {
  const [search, setSearch] = useState('');
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'delivering' | 'success'>('idle');
  const [error, setError] = useState('');
  
  // POD State
  const [receivedBy, setReceivedBy] = useState('');
  const [captureMode, setCaptureMode] = useState<'none' | 'signature'>('none');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    loadPendingShipments();
  }, [search]);

  const loadPendingShipments = async () => {
    setLoading(true);
    try {
      let url = '/shipments?limit=25';
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetchApi(url);
      setShipments(res?.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setReceivedBy(shipment.receiver_name || '');
    setStatus('idle');
    setCaptureMode('none');
    setSignatureData(null);
    setPhotoData(null);
    setError('');
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
      setCaptureMode('none');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const submitDelivery = async () => {
    if (!selectedShipment) return;
    setStatus('delivering');
    try {
      await fetchApi(`/shipments/${selectedShipment.awb_number}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          podSignature: signatureData,
          podImageUrl: photoData,
          receivedBy
        })
      });
      setStatus('success');
      loadPendingShipments();
    } catch (err: any) {
      setError(err.message || 'Failed to submit delivery verification');
      setStatus('idle');
    }
  };

  const reset = () => {
    setSelectedShipment(null);
    setStatus('idle');
    setCaptureMode('none');
    setSignatureData(null);
    setPhotoData(null);
    setError('');
  };

  if (selectedShipment) {
    const fullAddress = `${selectedShipment.receiver_address || ''}, ${selectedShipment.city || ''} ${selectedShipment.pincode || ''}`;
    const mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

    return (
      <div className="max-w-md mx-auto min-h-[85vh] flex flex-col pt-2 pb-10 px-2">
        
        {/* Back Link */}
        <div className="mb-3">
          <button onClick={reset} className="text-blue-600 font-bold text-sm flex items-center">
            <ChevronRight className="w-5 h-5 rotate-180 mr-1" /> Back to Assigned Deliveries
          </button>
        </div>

        {/* SUCCESS CONFIRMATION SCREEN */}
        {status === 'success' ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8 text-center flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Delivery Confirmed!</h2>
              <p className="text-sm text-slate-500 mt-1">Proof of Delivery saved for AWB <span className="font-bold text-blue-600">{selectedShipment.awb_number}</span></p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">Received By: <span className="font-bold text-slate-900 dark:text-white">{receivedBy || selectedShipment.receiver_name}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Status: <span className="font-bold text-emerald-600">DELIVERED</span></p>
              <p className="text-slate-600 dark:text-slate-400">Timestamp: <span className="font-bold text-slate-900 dark:text-white">{new Date().toLocaleString()}</span></p>
            </div>

            <button 
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
            >
              Continue Next Delivery
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex-1 flex flex-col space-y-4">
            
            {/* Package Info Header */}
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AWB / Tracking Code</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{selectedShipment.awb_number}</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold rounded-full">
                  {selectedShipment.internal_status}
                </span>
              </div>
            </div>

            {/* Receiver & Address Box */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start">
                <User className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedShipment.receiver_name}</p>
                  {selectedShipment.receiver_phone && (
                    <a href={`tel:${selectedShipment.receiver_phone}`} className="text-xs font-bold text-blue-600 hover:underline">
                      📞 {selectedShipment.receiver_phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{fullAddress}</p>
                </div>
              </div>

              {/* One-Tap GPS Navigation Button */}
              <a 
                href={mapsNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center shadow-xs transition-colors"
              >
                <Navigation className="w-4 h-4 mr-1.5" /> Launch GPS Navigation (Google Maps)
              </a>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Recipient Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Received By (Recipient Name)</label>
              <input 
                type="text" 
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder="Enter recipient's full name"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-medium"
              />
            </div>

            {/* SIGNATURE CAPTURE CANVAS */}
            {captureMode === 'signature' ? (
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Sign Inside Box Below</p>
                  <button onClick={() => setCaptureMode('none')} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 touch-none min-h-[180px] flex justify-center items-center">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={180}
                    className="w-full h-full cursor-crosshair rounded-xl"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button onClick={clearSignature} className="flex-1 py-2 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">Clear</button>
                  <button onClick={saveSignature} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">Save Signature</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Signature Card */}
                  <button 
                    onClick={() => setCaptureMode('signature')}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${signatureData ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}
                  >
                    {signatureData ? (
                      <div className="text-center space-y-1">
                        <img src={signatureData} alt="Signature" className="h-10 max-w-full object-contain mx-auto" />
                        <span className="text-[10px] font-bold text-emerald-600 block">✓ Signature Saved</span>
                      </div>
                    ) : (
                      <>
                        <Edit3 className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Signature</span>
                      </>
                    )}
                  </button>
                  
                  {/* Camera Photo Card */}
                  <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${photoData ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}>
                    {photoData ? (
                      <div className="text-center space-y-1">
                        <img src={photoData} alt="POD Photo" className="h-10 w-10 object-cover rounded mx-auto" />
                        <span className="text-[10px] font-bold text-emerald-600 block">✓ Photo Saved</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Take Photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {/* Final Submit Button */}
                <button 
                  onClick={submitDelivery}
                  disabled={status === 'delivering' || (!signatureData && !photoData)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl flex justify-center items-center text-sm shadow-md transition-all"
                >
                  {status === 'delivering' ? 'Confirming Delivery...' : 'Confirm Delivery (E-POD)'}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-[85vh] flex flex-col pt-2 pb-10 px-2 space-y-4">
      
      {/* Driver Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Driver Delivery App</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">Select an assigned shipment to capture electronic Proof of Delivery (E-POD).</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search AWB or Receiver Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium shadow-2xs dark:text-white"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Shipments List */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-10">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" /> Loading assigned deliveries...
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No Assigned Deliveries</p>
            <p className="text-xs text-slate-500 mt-1">New shipments assigned to you will appear here.</p>
          </div>
        ) : (
          shipments.map((shipment) => (
            <button
              key={shipment.id}
              onClick={() => handleSelectShipment(shipment)}
              className="w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-500 transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{shipment.awb_number}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    shipment.internal_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    {shipment.internal_status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{shipment.receiver_name}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{shipment.city || shipment.state || 'Destination'}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </button>
          ))
        )}
      </div>

    </div>
  );
}
