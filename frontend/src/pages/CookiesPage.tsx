import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Cookie className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white tracking-tight">LogiFlow Cookie Policy</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="border-b border-slate-800 pb-8 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            Effective Date: January 2026
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Cookie Policy</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            This Cookie Policy explains how LogiFlow uses cookies and similar session storage technologies to maintain secure authentication and essential application functionality.
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          
          <div className="bg-slate-850/50 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2" />
              Essential Authentication & Session Cookies
            </h2>
            <p className="text-slate-400">
              LogiFlow uses secure JWT tokens and local session storage strictly for authenticating logged-in users, enforcing multi-tenant access controls, and persisting UI theme preferences. We do not use intrusive third-party tracking cookies or sell user behavioral data to advertising networks.
            </p>
          </div>

          <div className="bg-slate-850/50 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-white">Types of Cookies Used</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Strictly Necessary Cookies:</strong> Required to maintain active ERP/Client portal authentication sessions.</li>
              <li><strong className="text-slate-200">Security Tokens:</strong> Used to prevent Cross-Site Request Forgery (CSRF) and unauthorized API access.</li>
              <li><strong className="text-slate-200">Preferences:</strong> Stores local user interface preferences such as table column states and dark mode.</li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          Questions? Contact <a href="mailto:privacy@logiflow.app" className="text-blue-400 hover:underline">privacy@logiflow.app</a>.
        </div>
      </main>
    </div>
  );
}
