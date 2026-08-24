import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white tracking-tight">LogiFlow Terms of Service</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="border-b border-slate-800 pb-8 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            Last Updated: January 2026
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            These Terms govern your use of the LogiFlow Logistics Management & Shipping Intelligence Platform. By accessing or using our services, you agree to comply with these terms.
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" />
              1. Platform Services & Multi-Courier Connectivity
            </h2>
            <p className="text-slate-400">
              LogiFlow provides a multi-tenant software platform for courier partner allocation, shipment booking, AWB inventory management, webhook event processing, NDR management, and commercial billing reconciliation. Courier partners (e.g., Delhivery) operate under their respective service agreements and API terms.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" />
              2. Account Responsibilities & Credentials
            </h2>
            <p className="text-slate-400">
              Users are responsible for maintaining the confidentiality of their portal credentials and API keys. Any shipment created under a tenant account is deemed authorized by that tenant. LogiFlow enforces role-based access control (RBAC) to restrict administrative functions.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" />
              3. Rate Cards & Commercial Billing
            </h2>
            <p className="text-slate-400">
              Commercial calculations—including docket fees, fuel surcharges (FSC), ODA fees, green taxes, GST, and volumetric weights—are calculated according to tenant-configured rate cards. Invoice reconciliation features compare actual courier bills against calculated costs to flag discrepancies.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" />
              4. Prohibited Goods & Compliance
            </h2>
            <p className="text-slate-400">
              Users agree not to book hazardous, illegal, or prohibited materials prohibited under applicable logistics and postal regulations in India.
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          Questions regarding terms? Contact <a href="mailto:support@logiflow.app" className="text-blue-400 hover:underline">support@logiflow.app</a>.
        </div>
      </main>
    </div>
  );
}
