import React, { useState } from 'react';

export default function AiUploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Point this to your backend running on 5000 or whichever port
      const response = await fetch('http://localhost:5000/api/imports/ai-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                AI Magic Upload
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Upload your messy delivery sheets (CSV, Excel, PDF). Our AI will extract tracking numbers, addresses, and details automatically.
                </p>
              </div>
            </div>
          </div>
          
          {!result && (
            <div className="mt-5 sm:mt-6">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
              >
                {isUploading ? 'Analyzing Document with AI...' : 'Upload & Process'}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-5 sm:mt-6">
              <div className="bg-green-50 p-4 rounded-md mb-4 text-left">
                <h4 className="text-green-800 font-medium">{result.message}</h4>
                <p className="text-green-600 text-sm mt-1">Check your dashboard to view the imported shipments.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
