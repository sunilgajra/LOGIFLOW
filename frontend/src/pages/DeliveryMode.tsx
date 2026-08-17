import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit3, CheckCircle, Package, Search, X, ChevronRight, User, MapPin } from 'lucide-react';
import { fetchApi } from '../api';

const DeliveryMode = () => {
  const [search, setSearch] = useState('');
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'delivering' | 'success'>('idle');
  const [error, setError] = useState('');
  
  // POD state
  const [captureMode, setCaptureMode] = useState<'none' | 'signature' | 'photo'>('none');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    loadPendingShipments();
  }, [search]);

  const loadPendingShipments = async () => {
    setLoading(true);
    try {
      let url = '/shipments?limit=20';
      if (search) {
        url += `&search=${search}`;
      }
      const res = await fetchApi(url);
      // Show all shipments including DELIVERED
      setShipments(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setStatus('idle');
    setCaptureMode('none');
    setSignatureData(null);
    setPhotoData(null);
    setError('');
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
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

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900
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
        setCaptureMode('none');
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
          podImageUrl: photoData
        })
      });
      setStatus('success');
      loadPendingShipments();
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery status');
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
    return (
      <div className="max-w-md mx-auto min-h-[80vh] flex flex-col pt-4 pb-10">
        <div className="mb-4 px-2">
          <button onClick={reset} className="text-blue-600 font-medium flex items-center">
            <ChevronRight className="w-5 h-5 rotate-180 mr-1" /> Back to List
          </button>
        </div>

        {status === 'success' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delivery Confirmed!</h2>
            <p className="text-slate-500 mb-8">AWB {selectedShipment.awb_number} has been successfully delivered.</p>
            <button 
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
            >
              Continue Deliveries
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col mx-2">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tracking / AWB</p>
                  <p className="text-lg font-bold text-slate-900">{selectedShipment.awb_number}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 mt-4 border border-slate-100">
                <div className="flex items-start mb-2">
                  <User className="w-5 h-5 text-slate-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedShipment.receiver_name}</p>
                    {selectedShipment.receiver_phone && (
                      <p className="text-sm text-slate-600">{selectedShipment.receiver_phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start mb-4">
                  <MapPin className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">
                      {selectedShipment.receiver_address || 'No address provided'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedShipment.city} {selectedShipment.pincode ? `- ${selectedShipment.pincode}` : ''}
                    </p>
                  </div>
                </div>

                {/* Google Maps Embed */}
                {selectedShipment.receiver_address && (
                  <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${selectedShipment.receiver_address}, ${selectedShipment.city} ${selectedShipment.pincode || ''}`
                      )}&output=embed`}
                    ></iframe>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {captureMode === 'signature' && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-slate-700">Draw Signature</p>
                  <button onClick={() => setCaptureMode('none')} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="border-2 border-slate-200 rounded-lg bg-slate-50 flex-1 relative mb-4 touch-none min-h-[200px]">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={200}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex space-x-3 mt-auto">
                  <button onClick={clearSignature} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium">Clear</button>
                  <button onClick={saveSignature} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-medium">Save</button>
                </div>
              </div>
            )}

            {captureMode === 'none' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button 
                    onClick={() => setCaptureMode('signature')}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-colors ${signatureData ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'}`}
                  >
                    {signatureData ? <CheckCircle className="w-8 h-8 text-blue-500 mb-2" /> : <Edit3 className="w-8 h-8 text-slate-400 mb-2" />}
                    <span className="text-sm font-medium text-slate-700 text-center">{signatureData ? 'Signature Saved' : 'Add Signature'}</span>
                  </button>
                  
                  <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${photoData ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'}`}>
                    {photoData ? <CheckCircle className="w-8 h-8 text-blue-500 mb-2" /> : <Camera className="w-8 h-8 text-slate-400 mb-2" />}
                    <span className="text-sm font-medium text-slate-700 text-center">{photoData ? 'Photo Saved' : 'Take Photo'}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button 
                    onClick={submitDelivery}
                    disabled={!signatureData && !photoData}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex justify-center items-center"
                  >
                    {status === 'delivering' ? 'Saving...' : 'Complete Delivery'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col pt-4 pb-10">
      <div className="mb-6 px-2">
        <h1 className="text-2xl font-bold text-slate-900">Assigned Deliveries</h1>
        <p className="text-slate-500 text-sm">Select a shipment to capture E-POD</p>
      </div>

      <div className="px-2 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search AWB or Receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-md shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      <div className="flex-1 px-2 space-y-3 overflow-y-auto pb-20">
        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading shipments...</p>
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No deliveries found.</p>
          </div>
        ) : (
          shipments.map((shipment) => (
            <button
              key={shipment.id}
              onClick={() => handleSelectShipment(shipment)}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition-all flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-slate-900">{shipment.awb_number}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {shipment.internal_status}
                  </span>
                </div>
                <div className="flex items-center text-sm text-slate-600 mt-2">
                  <User className="w-4 h-4 mr-1 text-slate-400" />
                  <span className="truncate max-w-[200px]">{shipment.receiver_name}</span>
                </div>
                {shipment.client?.company_name && (
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    Client: {shipment.client.company_name}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryMode;
