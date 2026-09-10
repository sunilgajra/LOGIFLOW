import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck,
  RefreshCw, Check, X, Database, Search, PlusCircle, Link, Eye
} from 'lucide-react';
import { api } from '../api';

export const CourierImportPipelinePage: React.FC = () => {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [courierName, setCourierName] = useState<string>('Delhivery');
  const [file, setFile] = useState<File | null>(null);

  // Pipeline execution state
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Preview data from server
  const [previewData, setPreviewData] = useState<any>(null);
  const [commitResult, setCommitResult] = useState<any>(null);

  // Unmatched queue state
  const [unmatchedList, setUnmatchedList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'unmatched'>('preview');

  useEffect(() => {
    const loadCouriers = async () => {
      try {
        const res = await api.fetch('/couriers');
        if (Array.isArray(res)) setCouriers(res);
      } catch (e) {}
    };
    loadCouriers();
    fetchUnmatched();
  }, []);

  const fetchUnmatched = async () => {
    try {
      const res = await api.getUnmatchedCourierShipments();
      if (res && res.data) setUnmatchedList(res.data);
    } catch (e) {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGeneratePreview = async () => {
    if (!file) {
      setError('Please select a courier delivery sheet file (Excel or CSV).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courier_name', courierName);
      if (selectedCourierId) formData.append('courier_id', selectedCourierId);

      const res = await api.previewMasterCourierImport(formData);
      if (res && res.success && res.preview) {
        setPreviewData(res.preview);
        setStep(2);
      } else {
        setError(res?.error || 'Failed to generate preview');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading courier file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.confirmMasterCourierImport(previewData, selectedCourierId);
      if (res && res.success) {
        setCommitResult(res.result);
        setStep(3);
        fetchUnmatched();
      } else {
        setError(res?.error || 'Failed to commit import');
      }
    } catch (err: any) {
      setError(err.message || 'Error committing import');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatchedAction = async (id: string, action: 'MATCH' | 'CREATE' | 'IGNORE', target_awb?: string) => {
    try {
      const res = await api.resolveUnmatchedCourierShipment(id, action, target_awb);
      if (res && res.success) {
        fetchUnmatched();
      }
    } catch (e) {}
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Courier Import Pipeline & Diff Reconciliation</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated AWB matching, company field protection, diff reconciliation preview, and unmatched shipments queue.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setStep(1);
            setFile(null);
            setPreviewData(null);
            setCommitResult(null);
            setError('');
          }}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Import Batch</span>
        </button>
      </div>

      {/* Pipeline Stepper Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</div>
          <span>Upload Sheet</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-700" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</div>
          <span>Preview & Reconciliation Diff</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-700" />
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</div>
          <span>Import Summary & Audit Log</span>
        </div>
      </div>

      {/* Field Protection Policy Banner */}
      <div className="bg-blue-950/40 border border-blue-800/40 p-4 rounded-xl flex items-start space-x-3 text-xs text-blue-200">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-300">Strict Field Protection Policy Enforced:</h4>
          <p className="text-blue-200/80 mt-0.5">
            Courier delivery sheet uploads will update <strong>ONLY courier-owned fields</strong> (Status, EDD, Delivery Date, Attempts, Remarks) and calculate derived system fields. 
            Company-owned fields (Client, Consignor, Invoice, Invoice Amount, Pickup, Items) are <strong>STRICTLY PROTECTED</strong> and will never be overwritten.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD FORM */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100">Step 1: Upload Courier Delivery Sheet</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload monthly or daily courier tracking spreadsheets (Excel .xlsx, .xls or CSV).</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Courier Partner</label>
              <select
                value={selectedCourierId}
                onChange={(e) => {
                  setSelectedCourierId(e.target.value);
                  const found = couriers.find(c => c.id === e.target.value);
                  if (found) setCourierName(found.courier_name);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Custom / Other Courier</option>
                {couriers.map((cp: any) => (
                  <option key={cp.id} value={cp.id}>{cp.courier_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Courier Partner Name Label</label>
              <input
                type="text"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Upload Excel / CSV Sheet</label>
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="courier-file-input"
                />
                <label htmlFor="courier-file-input" className="cursor-pointer space-y-2 block">
                  <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                  {file ? (
                    <p className="text-xs font-semibold text-emerald-400">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                  ) : (
                    <p className="text-xs text-slate-400">Click to browse or drop delivery sheet here (.xlsx, .csv)</p>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={handleGeneratePreview}
              disabled={loading || !file}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing AWB Matching & Diff Engine...</span>
                </>
              ) : (
                <>
                  <span>Generate Reconciliation Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & RECONCILIATION TABLE */}
      {step === 2 && previewData && (
        <div className="space-y-6">

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-slate-400">Total Rows in File</span>
              <p className="text-xl font-bold text-slate-100 mt-1">{previewData.total_rows}</p>
            </div>
            <div className="bg-slate-900 border border-emerald-800/40 p-4 rounded-xl">
              <span className="text-emerald-400 font-medium">Matched AWBs in DB</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{previewData.matched_count}</p>
            </div>
            <div className="bg-slate-900 border border-amber-800/40 p-4 rounded-xl">
              <span className="text-amber-400 font-medium">Unmatched Courier Rows</span>
              <p className="text-xl font-bold text-amber-400 mt-1">{previewData.unmatched_count}</p>
            </div>
            <div className="bg-slate-900 border border-indigo-800/40 p-4 rounded-xl">
              <span className="text-indigo-400 font-medium">Field Diffs to Apply</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{previewData.reconciliation_diffs.length}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2.5 flex items-center space-x-2 border-b-2 transition ${
                activeTab === 'preview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Reconciliation Diff Table ({previewData.reconciliation_diffs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('unmatched')}
              className={`py-2.5 flex items-center space-x-2 border-b-2 transition ${
                activeTab === 'unmatched' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Unmatched Courier Shipments ({previewData.unmatched_count})</span>
            </button>
          </div>

          {/* Diff Table Tab */}
          {activeTab === 'preview' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">Reconciliation Comparison Table</h3>
                <span className="text-[11px] text-slate-400">Review changes before approving database commit</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">AWB NO</th>
                      <th className="p-3">FIELD</th>
                      <th className="p-3">CURRENT VALUE IN DB</th>
                      <th className="p-3">NEW COURIER VALUE</th>
                      <th className="p-3">SOURCE COURIER</th>
                      <th className="p-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {previewData.reconciliation_diffs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No status or date differences found. All courier values match current database state.
                        </td>
                      </tr>
                    ) : (
                      previewData.reconciliation_diffs.map((diff: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-indigo-400">{diff.awb_number}</td>
                          <td className="p-3 font-semibold text-slate-200">{diff.field_label}</td>
                          <td className="p-3 text-slate-400">{diff.current_value || 'Blank'}</td>
                          <td className="p-3 text-emerald-400 font-semibold">{diff.new_value}</td>
                          <td className="p-3 text-slate-300">{previewData.detected_courier}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              UPDATE
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Back to Upload
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Commit Import Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Unmatched Rows Tab */}
          {activeTab === 'unmatched' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-amber-400 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Unmatched Courier Shipments Queue</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  These AWBs were present in the courier delivery sheet but do NOT exist in the company database. They are staged safely for administrator review.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">UNMATCHED AWB</th>
                      <th className="p-3">RAW COURIER STATUS</th>
                      <th className="p-3">DELIVERED DATE</th>
                      <th className="p-3">COURIER REMARK</th>
                      <th className="p-3 text-center">MANUAL RESOLUTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {previewData.unmatched_rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No unmatched courier AWBs in this file.
                        </td>
                      </tr>
                    ) : (
                      previewData.unmatched_rows.map((u: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-amber-400">{u.awb_number}</td>
                          <td className="p-3 text-slate-200">{u.raw_status || 'N/A'}</td>
                          <td className="p-3 text-slate-300">{u.delivered_date || '-'}</td>
                          <td className="p-3 text-slate-400 italic">{u.remark || 'N/A'}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] text-slate-400">Staged for Review</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* STEP 3: COMMIT SUMMARY */}
      {step === 3 && commitResult && (
        <div className="bg-slate-900 border border-emerald-800/40 rounded-xl p-8 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100">Import Committed Successfully!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Database source of truth has been updated with courier tracking data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Matched Shipments Updated:</span>
              <p className="text-lg font-bold text-emerald-400">{commitResult.updatedCount}</p>
            </div>
            <div>
              <span className="text-slate-400">Unmatched Records Staged:</span>
              <p className="text-lg font-bold text-amber-400">{commitResult.unmatchedCreated}</p>
            </div>
          </div>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreviewData(null);
                setCommitResult(null);
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Import Another Sheet
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
