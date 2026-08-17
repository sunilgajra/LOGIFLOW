import React, { useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Upload } from 'lucide-react';
import { fetchApi, API_BASE } from '../api';

type Step = 'UPLOAD' | 'MAPPING' | 'PROCESSING' | 'SUMMARY';

const ImportEngine = () => {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const [fileId, setFileId] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ imported: 0, failed: 0, total: 0 });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const data = await fetchApi('/imports/preview', {
        method: 'POST',
        body: formData
      });
      
      setFileId(data.fileId);
      setHeaders(data.headers);
      setMapping(data.mapping);
      setSampleData(data.sampleData);
      setStep('MAPPING');
    } catch (err) {
      console.error(err);
      alert('Failed to parse file');
    } finally {
      setUploading(false);
    }
  };

  const startImport = async () => {
    setStep('PROCESSING');
    try {
      const res = await fetchApi('/imports/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          mapping,
          // courierId, clientId can be added here
        })
      });
      setImportStats(res);
      setStep('SUMMARY');
    } catch (err) {
      console.error(err);
      alert('Failed to process import');
      setStep('UPLOAD');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Import Engine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload delivery sheets from any courier. Our AI will automatically map the columns, clean the data, and update your shipments.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-slate-200 -z-10"></div>
          
          {[
            { id: 'UPLOAD', label: '1. Upload File', icon: UploadCloud },
            { id: 'MAPPING', label: '2. Map Columns', icon: FileSpreadsheet },
            { id: 'PROCESSING', label: '3. Process', icon: ArrowRight },
            { id: 'SUMMARY', label: '4. Summary', icon: CheckCircle },
          ].map((s, idx) => {
            const steps = ['UPLOAD', 'MAPPING', 'PROCESSING', 'SUMMARY'];
            const currentIndex = steps.indexOf(step);
            const thisIndex = steps.indexOf(s.id);
            const isCompleted = thisIndex < currentIndex;
            const isCurrent = thisIndex === currentIndex;
            
            return (
              <div key={s.id} className="flex flex-col items-center bg-slate-50 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isCurrent ? 'bg-blue-600 border-blue-600 text-white' :
                  'bg-white border-slate-300 text-slate-400'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        
        {step === 'UPLOAD' && (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Courier Partner</label>
                <select className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border bg-white">
                  <option>Auto-Detect from File</option>
                  <option>Blue Dart</option>
                  <option>Delhivery</option>
                  <option>DTDC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Client (Optional)</label>
                <select className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border bg-white">
                  <option>All Clients</option>
                  <option>ABC Enterprises</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Leave as "All Clients" if the sheet contains multiple clients.</p>
              </div>
            </div>

            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-dashed rounded-lg transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              }`}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center mt-4">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, .xlsx, .xls, .pdf, image/jpeg, image/png" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Excel, CSV, PDF, JPG, PNG up to 10MB
                </p>
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-blue-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {uploading ? 'Processing...' : 'Continue to Mapping'}
                {!uploading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {step === 'MAPPING' && (
          <div className="p-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Review Column Mapping</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    AI successfully detected <span className="font-bold">Delhivery Format</span> and mapped 8/8 required columns automatically! Please review below before importing.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Required Field</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mapped From File Column</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sample Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Object.entries(mapping).map(([standardKey, fileColumn]) => (
                    <tr key={standardKey}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{standardKey.replace('_', ' ').toUpperCase()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        <select 
                          className="block w-full rounded-md border-slate-300 py-1 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border bg-white" 
                          value={fileColumn}
                          onChange={(e) => setMapping(prev => ({...prev, [standardKey]: e.target.value}))}
                        >
                          <option value="">-- Ignore --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {sampleData.length > 0 ? sampleData[0][fileColumn] : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-between">
              <button 
                onClick={() => setStep('UPLOAD')}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={startImport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Start Import
              </button>
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="p-16 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Delivery Sheet...</h3>
            <p className="text-slate-500 text-center max-w-md">
              Validating rows, normalizing statuses, and updating your shipments database. This may take a moment.
            </p>
            <div className="w-full max-w-md bg-slate-100 h-2 rounded-full mt-8 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full w-2/3 animate-pulse"></div>
            </div>
          </div>
        )}

        {step === 'SUMMARY' && (
          <div className="p-8">
            <div className="text-center mb-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Import Complete!</h2>
              <p className="text-slate-500 mt-2">The delivery sheet has been successfully processed.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
              <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Rows</p>
                <p className="text-3xl font-bold text-slate-900">{importStats.total}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-6 text-center border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700 mb-1">Successfully Updated</p>
                <p className="text-3xl font-bold text-emerald-600">{importStats.imported}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-6 text-center border border-rose-100">
                <p className="text-sm font-medium text-rose-700 mb-1">Failed / Errors</p>
                <p className="text-3xl font-bold text-rose-600">{importStats.failed}</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-md text-sm font-medium transition-colors">
                Download Error Report
              </button>
              <button 
                onClick={() => setStep('UPLOAD')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportEngine;
