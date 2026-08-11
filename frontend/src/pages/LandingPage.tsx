import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">LogiFlow</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#" className="border-blue-500 text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Home</a>
              <a href="#" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Track Package</a>
              <a href="#" className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Services</a>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Go to ERP Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative bg-blue-700 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-blue-700 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Logistics Management</span>{' '}
                  <span className="block text-blue-300 xl:inline">reimagined</span>
                </h1>
                <p className="mt-3 text-base text-blue-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  One Platform. Every Shipment. Track your packages in real-time, import delivery sheets with AI, and manage your entire logistics operation.
                </p>
                <div className="mt-8 sm:mt-12">
                  <form className="sm:flex">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="tracking-number" className="sr-only">Tracking Number</label>
                      <input id="tracking-number" type="text" placeholder="Enter your AWB number..." className="block w-full px-4 py-4 rounded-md text-base text-slate-900 placeholder-slate-500 border-0 shadow-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <button type="submit" className="block w-full py-4 px-6 rounded-md shadow bg-emerald-500 text-white font-medium hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
                        Track Now
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background shape */}
          <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full bg-blue-800 flex items-center justify-center">
                <svg className="w-48 h-48 text-blue-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>&copy; 2026 LogiFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
