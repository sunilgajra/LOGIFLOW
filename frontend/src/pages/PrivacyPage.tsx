import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Database, EyeOff, KeyRound, FileCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white tracking-tight">LogiFlow Security & Privacy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="border-b border-slate-800 pb-8 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            Effective Date: January 1, 2026
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Privacy Policy & Data Security Statement</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            At LogiFlow, data protection and multi-tenant security are built directly into our platform architecture. This document outlines how we handle operational data, client privacy, courier credentials, and commercial rate confidentiality.
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-8 text-slate-300">
          
          <section className="bg-slate-850/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-blue-400">
              <Database className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">1. Multi-Tenant Data Isolation</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              LogiFlow is built with strict multi-tenant isolation at the database layer. Every shipment, rate card, client profile, and tracking event is scoped to a unique <code className="text-blue-300 font-mono text-xs">company_id</code>. Tenants cannot access or query operational records belonging to another company.
            </p>
          </section>

          <section className="bg-slate-850/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400">
              <EyeOff className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">2. Client Commercial Data Redaction</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Our API response pipelines enforce server-side commercial data redaction. When client users or customer portals query shipment details, internal cost structures—such as courier purchase costs, margin percentages, gross profit calculations, and provider rate cards—are automatically removed from the JSON payload.
            </p>
          </section>

          <section className="bg-slate-850/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-purple-400">
              <KeyRound className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">3. Courier API Credentials Protection</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Third-party courier API keys (e.g., Delhivery API tokens) are stored securely and never exposed in client-side bundles or public endpoints. All communication with courier gateways happens exclusively over encrypted TLS via server-to-server micro-services.
            </p>
          </section>

          <section className="bg-slate-850/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <FileCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">4. Information We Collect & Use</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
              <li><strong className="text-slate-200">Shipment Details:</strong> Consignee name, shipping address, phone number, pincode, weight, COD amount, and SKU product description required to fulfill courier bookings.</li>
              <li><strong className="text-slate-200">Tracking Scans:</strong> Real-time location and milestone tracking updates received from courier webhooks or polling APIs.</li>
              <li><strong className="text-slate-200">User Account Data:</strong> Name, work email, and role-based access controls (RBAC) to authenticate platform users.</li>
            </ul>
          </section>

          <section className="bg-slate-850/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-cyan-400">
              <Lock className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">5. Public Tracking Privacy Policy</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Public tracking URLs (`/track?awb=...`) only display non-sensitive milestone information required by consignees (status, destination city/state, SLA, tracking history, and POD signature upon delivery). Commercial rate data, sender billing details, and customer internal database IDs are strictly excluded.
            </p>
          </section>

        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          For privacy or security inquiries, contact us at <a href="mailto:privacy@logiflow.app" className="text-blue-400 hover:underline">privacy@logiflow.app</a>.
        </div>
      </main>
    </div>
  );
}
