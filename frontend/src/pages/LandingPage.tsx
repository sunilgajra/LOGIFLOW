import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, Globe, Clock, Package, MapPin, ChevronRight, BarChart3, Users } from 'lucide-react';

const LandingPage = () => {
  const [awb, setAwb] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (awb.trim()) {
      navigate(`/track?awb=${encodeURIComponent(awb.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* --- Navbar --- */}
      <nav className="absolute top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-white tracking-tight">LogiFlow</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-white/90 hover:text-white font-medium transition-colors">Home</a>
              <a href="#services" className="text-white/90 hover:text-white font-medium transition-colors">Services</a>
              <a href="#about" className="text-white/90 hover:text-white font-medium transition-colors">About Us</a>
              <Link to="/track" className="text-white/90 hover:text-white font-medium transition-colors">Track Package</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="bg-white hover:bg-slate-100 text-blue-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
                ERP Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section 
        id="home"
        className="relative h-screen min-h-[700px] flex items-center pt-20"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Logistics Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-transparent"></div>
          <div className="absolute inset-0 bg-slate-900/40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-400 mr-3 animate-pulse"></span>
              <span className="text-blue-100 font-semibold text-sm tracking-wide">AI-Powered Global Logistics</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Deliver <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">faster.</span> <br />
              Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">smarter.</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/90 leading-relaxed mb-10 max-w-2xl font-light">
              Experience the next generation of logistics management. Real-time AI tracking, seamless ERP integrations, and enterprise-grade security for your shipments.
            </p>

            {/* Tracking Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 sm:p-6 rounded-3xl shadow-2xl max-w-2xl transform transition-all hover:-translate-y-1">
              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-6 w-6 text-blue-200" />
                  </div>
                  <input 
                    type="text" 
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                    placeholder="Enter AWB Tracking Number..." 
                    className="block w-full pl-12 pr-4 py-4 rounded-2xl text-lg text-white bg-white/10 border border-white/20 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all font-medium" 
                    required
                  />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center">
                  Track
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-10">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Scroll</span>
          <div className="w-0.5 h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
        </div>
      </section>

      {/* --- Stats Banner --- */}
      <section className="bg-white py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
            <div>
              <p className="text-4xl font-black text-slate-900">10M+</p>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Packages Delivered</p>
            </div>
            <div>
              <p className="text-4xl font-black text-blue-600">99.9%</p>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">On-Time Rate</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900">500+</p>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Enterprise Clients</p>
            </div>
            <div>
              <p className="text-4xl font-black text-emerald-500">24/7</p>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold tracking-wide uppercase mb-3">Why Choose Us</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Logistics built for the modern era</h3>
            <p className="mt-4 text-xl text-slate-600 leading-relaxed">
              We leverage cutting-edge technology to ensure your deliveries are fast, secure, and completely transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Lightning Fast</h4>
              <p className="text-slate-600 leading-relaxed">
                Optimized routing algorithms and a vast network ensure your packages reach their destination in record time.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Secure & Insured</h4>
              <p className="text-slate-600 leading-relaxed">
                Every shipment is tracked and fully insured. Our E-POD system captures signatures and photos upon delivery.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">AI Analytics</h4>
              <p className="text-slate-600 leading-relaxed">
                Import thousands of deliveries instantly using our AI OCR engine, and monitor real-time metrics on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to streamline your shipping?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
            Join hundreds of enterprise clients who trust LogiFlow to handle their critical logistics operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              Contact Sales
            </button>
            <button className="bg-blue-700/50 text-white border border-blue-400 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">LogiFlow</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The next-generation logistics platform empowering businesses to deliver faster and smarter.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Services</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">B2B Shipping</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Last-Mile Delivery</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">E-commerce Fulfillment</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cold Chain</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} LogiFlow Technologies. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
