import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Truck, ShieldCheck, Zap, Globe, Clock, MapPin, ChevronRight, 
  BarChart3, Users, CheckCircle2, ArrowRight, RefreshCw, AlertTriangle, 
  Layers, Lock, Database, FileText, HelpCircle, Mail, Phone, Building2, 
  Send, Menu, X, ChevronDown, Check, ArrowUpRight, Scale, SlidersHorizontal, Bell
} from 'lucide-react';
import { fetchApi } from '../api';

export default function LandingPage() {
  const navigate = useNavigate();

  // Navigation Mobile Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tracking Widget State
  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact / Enquiry Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    monthlyVolume: '1,000 - 5,000 shipments',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  // Quick Tracking Samples
  const sampleAwbs = ['DELH88291034', 'BLUED99102451'];

  // Handle Public Tracking Submission
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAwb = trackingAwb.trim().toUpperCase();
    
    if (!cleanAwb) {
      setTrackingError('Please enter a valid AWB or tracking number.');
      setTrackingResult(null);
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResult(null);

    try {
      const data = await fetchApi(`/public/track/${encodeURIComponent(cleanAwb)}`);
      if (!data || data.error) {
        setTrackingError(data?.error || 'Shipment not found. Please check your AWB number.');
      } else {
        setTrackingResult(data);
      }
    } catch (err: any) {
      setTrackingError('Unable to retrieve tracking details. Please verify your AWB.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleQuickSampleTrack = async (sample: string) => {
    setTrackingAwb(sample);
    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResult(null);

    try {
      const data = await fetchApi(`/public/track/${encodeURIComponent(sample)}`);
      if (!data || data.error) {
        setTrackingError(data?.error || 'Shipment not found. Please check your AWB number.');
      } else {
        setTrackingResult(data);
      }
    } catch (err: any) {
      setTrackingError('Unable to retrieve tracking details. Please verify your AWB.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Handle Contact Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess(null);

    if (!contactForm.name.trim()) {
      setContactError('Please enter your full name.');
      return;
    }
    if (!contactForm.company.trim()) {
      setContactError('Please enter your company name.');
      return;
    }
    if (!contactForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      setContactError('Please enter a valid business email address.');
      return;
    }
    if (!contactForm.phone.trim() || !/^\+?\d{7,15}$/.test(contactForm.phone.replace(/[\s-]/g, ''))) {
      setContactError('Please enter a valid phone number.');
      return;
    }

    setContactLoading(true);

    try {
      const res = await fetchApi('/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      if (res && res.success) {
        setContactSuccess(res.message || 'Thank you! Our sales team will reach out within 24 hours.');
        setContactForm({
          name: '',
          company: '',
          email: '',
          phone: '',
          monthlyVolume: '1,000 - 5,000 shipments',
          message: ''
        });
      } else {
        setContactError(res?.error || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      setContactError('Failed to send message. Please try again later.');
    } finally {
      setContactLoading(false);
    }
  };

  // FAQ Questions
  const faqs = [
    {
      q: "What is LogiFlow?",
      a: "LogiFlow is a comprehensive Logistics Management & Shipping Intelligence Platform that connects merchants and enterprise logisticians with multiple courier partners, automating courier allocation, tracking, NDR actions, and commercial invoice reconciliation."
    },
    {
      q: "Which courier partners can I use?",
      a: "LogiFlow features full support for Delhivery B2C logistics (including booking, waybill inventory reservation, label generation, pickup scheduling, tracking, and NDR dispatches). Additional courier integrations such as Blue Dart are planned for our unified integration engine."
    },
    {
      q: "Can I manage multiple courier accounts?",
      a: "Yes. LogiFlow supports multi-account configuration under tenant control, allowing you to manage API keys, rate cards, and courier allocations across different regional hubs or business units."
    },
    {
      q: "Can I track shipments in real time?",
      a: "LogiFlow tracks shipment milestones through automated webhook event processing and background tracking sync jobs, updating internal status codes (BOOKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, NDR, RTO)."
    },
    {
      q: "Does LogiFlow support NDR and RTO management?",
      a: "Yes. LogiFlow includes a dedicated NDR Action Desk for recording undelivered scans, submitting reattempts, requesting address/phone updates, and authorizing Return To Origin (RTO)."
    },
    {
      q: "Can I configure my own client rate cards?",
      a: "Yes. You can define version-controlled client rate cards based on minimum weights, docket fees, fuel surcharges (FSC), ODA fees, green taxes, and zone matrices."
    },
    {
      q: "Can I compare courier purchase costs against client selling rates?",
      a: "LogiFlow maintains separate commercial models for Client Charges (Selling Rate) and Courier Costs (Purchase Cost), allowing real-time gross margin and profit percentage calculation."
    },
    {
      q: "Can I reconcile courier invoices for billing variances?",
      a: "LogiFlow includes a commercial bill reconciliation engine that compares uploaded courier bills against expected charges to detect weight discrepancies and overcharges."
    },
    {
      q: "Can clients access their own dedicated portal?",
      a: "Yes. LogiFlow supports multi-tenant role-based access control (RBAC), allowing client users to view their shipments, create orders, monitor NDRs, and view invoices."
    },
    {
      q: "How does LogiFlow protect sensitive commercial data?",
      a: "LogiFlow enforces strict server-side commercial data redaction. When client role users query endpoints, internal courier purchase costs, rate cards, margin percentages, and API credentials are automatically stripped."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-blue-600 selection:text-white overflow-x-hidden">

      {/* --- Sticky Header / Navbar --- */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            
            {/* Brand Logo */}
            <a href="#home" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Logi<span className="text-blue-500">Flow</span>
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold">
              <a href="#home" className="text-slate-300 hover:text-white transition-colors">Home</a>
              <a href="#solutions" className="text-slate-300 hover:text-white transition-colors">Solutions</a>
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#couriers" className="text-slate-300 hover:text-white transition-colors">Courier Network</a>
              <a href="#ndr" className="text-slate-300 hover:text-white transition-colors">NDR Desk</a>
              <a href="#commercials" className="text-slate-300 hover:text-white transition-colors">Commercials</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Header CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <a 
                href="#tracking-section" 
                className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-850 transition-all flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                Track Shipment
              </a>
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center"
              >
                ERP Login
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-4 pb-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-base font-medium">
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Home</a>
              <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Solutions</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">How It Works</a>
              <a href="#couriers" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Courier Network</a>
              <a href="#ndr" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">NDR Action Desk</a>
              <a href="#commercials" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Commercial Intelligence</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Contact Sales</a>
            </nav>
            <div className="pt-4 border-t border-slate-800 flex flex-col space-y-3">
              <a 
                href="#tracking-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-slate-800 text-slate-200 rounded-xl font-semibold text-sm"
              >
                Track Shipment
              </a>
              <Link 
                to="/login" 
                className="w-full text-center py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md"
              >
                ERP Login
              </Link>
            </div>
          </div>
        )}
      </header>


      {/* --- HERO SECTION --- */}
      <section id="home" className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle Background Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Category Tag Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-2.5 animate-pulse"></span>
              <span className="text-blue-300 font-semibold text-xs sm:text-sm tracking-wide">
                Logistics Management & Shipping Intelligence Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Deliver <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">faster.</span> <br />
              Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">smarter.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Manage shipments, courier allocation, tracking, NDR, billing and logistics operations from one powerful platform.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-base shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                Start Managing Shipments
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a 
                href="#tracking-section"
                className="w-full sm:w-auto bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 px-8 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                Track a Shipment
              </a>
            </div>

          </div>

          {/* --- INTERACTIVE PUBLIC TRACKING WIDGET --- */}
          <div id="tracking-section" className="mt-16 max-w-3xl mx-auto">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Track Shipment Live</h3>
                </div>
                <span className="text-xs text-slate-400">Public Tracking Portal</span>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={trackingAwb}
                    onChange={(e) => setTrackingAwb(e.target.value.toUpperCase())}
                    placeholder="Enter AWB Tracking Number (e.g. DELH88291034)" 
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-750 text-white font-mono text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={trackingLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {trackingLoading ? 'Searching...' : 'Track Shipment'}
                  {!trackingLoading && <ChevronRight className="w-4 h-4 ml-1" />}
                </button>
              </form>

              {/* Sample AWB Chips */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Try Sample AWBs:</span>
                {sampleAwbs.map(sample => (
                  <button 
                    key={sample} 
                    type="button"
                    onClick={() => handleQuickSampleTrack(sample)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-blue-300 font-mono font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {trackingError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-rose-400 flex-shrink-0" />
                  {trackingError}
                </div>
              )}

              {/* Tracking Result Box */}
              {trackingResult && (
                <div className="mt-4 p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tracking Number</span>
                      <p className="text-lg font-mono font-extrabold text-blue-400">{trackingResult.awb_number}</p>
                      <p className="text-xs text-slate-400">Courier: <span className="font-bold text-white">{trackingResult.courier_name}</span></p>
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-full inline-flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        {String(trackingResult.status).replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Recipient</span>
                      <span className="font-bold text-slate-200">{trackingResult.receiver_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Destination</span>
                      <span className="font-bold text-slate-200">{trackingResult.destination_city}, {trackingResult.destination_state}</span>
                    </div>
                  </div>

                  {/* History Timeline */}
                  {trackingResult.history && trackingResult.history.length > 0 && (
                    <div className="pt-3 border-t border-slate-850 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recent Status Events</span>
                      <div className="space-y-2">
                        {trackingResult.history.slice(0, 3).map((evt: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="font-semibold text-slate-300">{evt.details || evt.status}</span>
                            <span className="text-slate-500 text-[10px]">{evt.location || 'Hub'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </section>


      {/* --- VERIFIED CAPABILITY METRICS BANNER --- */}
      <section className="bg-slate-900 py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-center text-blue-400 mb-2">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-lg font-extrabold text-white">Multi-Courier</p>
              <p className="text-xs text-slate-400 font-medium">Allocation Engine</p>
            </div>

            <div className="p-4 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-emerald-400 mb-2">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-lg font-extrabold text-white">Real-Time</p>
              <p className="text-xs text-slate-400 font-medium">Milestone Tracking</p>
            </div>

            <div className="p-4 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-amber-400 mb-2">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="text-lg font-extrabold text-white">Automated NDR</p>
              <p className="text-xs text-slate-400 font-medium">Action Desk</p>
            </div>

            <div className="p-4 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-purple-400 mb-2">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-lg font-extrabold text-white">Commercial</p>
              <p className="text-xs text-slate-400 font-medium">Billing & Reconciliation</p>
            </div>

          </div>
        </div>
      </section>


      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Tailored Capability</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Solutions for modern logistics operations
            </h3>
            <p className="text-slate-400 text-base leading-relaxed">
              Designed for merchants, D2C brands, and logistics providers managing multi-courier dispatches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">1. E-Commerce Shipping</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Create and manage customer shipments across courier partners with standardized AWBs, labels, and pickup scheduling.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">2. Multi-Courier Management</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect and manage multiple courier partners from one unified platform without fragmented dashboard logins.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">3. Last-Mile Delivery</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Monitor shipments from initial dispatch through out-for-delivery scans and electronic proof of delivery (E-POD).
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">4. NDR Management</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Manage failed delivery attempts, reattempts, address/phone corrections, and authorization of RTOs cleanly.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">5. Shipment Tracking</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track shipment status history in real time via standardized status codes and automated event normalization.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">6. Billing & Reconciliation</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Compare client selling charges against courier purchase costs to identify invoice overcharges and weight variances.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* --- CORE PLATFORM FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Platform Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Enterprise logistics engine under the hood
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <SlidersHorizontal className="w-6 h-6 text-blue-400" />
              <h4 className="text-lg font-bold text-white">Smart Courier Allocation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates courier cost, SLA days, pincode serviceability, COD capability, weight thresholds, and preferred rules.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Package className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">Shipment Lifecycle</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                End-to-end booking, waybill inventory pool allocation, PDF label printing, and pickup request generation.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Clock className="w-6 h-6 text-cyan-400" />
              <h4 className="text-lg font-bold text-white">Real-Time Tracking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Webhook-driven tracking updates with timestamp protection against out-of-order event regressions.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <RefreshCw className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg font-bold text-white">NDR & RTO Action Desk</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Actionable workflow for reattempts, phone corrections, address updates, and formal RTO authorization.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Scale className="w-6 h-6 text-purple-400" />
              <h4 className="text-lg font-bold text-white">Commercial Rate Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual rate cards (Client Selling vs Courier Cost), versioning, chargeable weight, docket fees, FSC, and GST.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Bell className="w-6 h-6 text-rose-400" />
              <h4 className="text-lg font-bold text-white">Automated Notifications</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurable triggers for tracking milestones, delivery confirmations, and NDR exception dispatches.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              4 simple steps to optimized dispatches
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative space-y-4">
              <span className="text-4xl font-black text-blue-500/30">01</span>
              <h4 className="text-xl font-bold text-white">Create Shipment</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Enter shipment weight, dimensions, pickup location, and consignee details via manual form or bulk import engine.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative space-y-4">
              <span className="text-4xl font-black text-blue-500/30">02</span>
              <h4 className="text-xl font-bold text-white">Smart Courier Allocation</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                LogiFlow evaluates eligible courier partners based on serviceability, SLA days, total cost, and business rules.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative space-y-4">
              <span className="text-4xl font-black text-blue-500/30">03</span>
              <h4 className="text-xl font-bold text-white">Track & Manage</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monitor live tracking events, receive automated notifications, and handle delivery exceptions in the NDR desk.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative space-y-4">
              <span className="text-4xl font-black text-blue-500/30">04</span>
              <h4 className="text-xl font-bold text-white">Reconcile & Analyze</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Compare courier invoices against calculated costs, audit weight variances, and analyze net profit margins.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* --- COURIER NETWORK SECTION --- */}
      <section id="couriers" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Integrations</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Connect the courier partners that power your business
            </h3>
            <p className="text-slate-400 text-sm">
              LogiFlow features a modular courier integration layer for seamless API dispatches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Delhivery B2C</h4>
              <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
                Available / UAT Verified
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full integration for CMU booking, waybill inventory management, shipping labels, pickup scheduling, tracking scans, and NDR action dispatches.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Blue Dart</h4>
              <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-full">
                Integration Planned
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Engine architecture prepared for Blue Dart express AWB booking, pickup requests, and tracking status normalization.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Custom Courier API</h4>
              <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-full">
                Extensible Architecture
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standardized <code className="text-blue-300 font-mono">ICourierProvider</code> interface allows rapid onboarding of custom logistics APIs.
              </p>
            </div>

          </div>

          {/* Integration Diagram Visual */}
          <div className="mt-16 bg-slate-950 p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto text-center space-y-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unified Integration Layer Architecture</span>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-mono font-bold">
              <div className="p-3 bg-blue-600/20 text-blue-300 border border-blue-500/40 rounded-xl">LogiFlow Core Engine</div>
              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />
              <div className="p-3 bg-slate-850 text-slate-200 border border-slate-750 rounded-xl">Courier Integration Layer (ICourierProvider)</div>
              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />
              <div className="flex gap-2">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">Delhivery</span>
                <span className="p-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg">Blue Dart</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* --- NDR / EXCEPTION MANAGEMENT SECTION --- */}
      <section id="ndr" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                NDR Exception Management
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Turn delivery exceptions into successful deliveries
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                LogiFlow provides an NDR Action Desk that captures undelivered scans instantly and enables operational actions before packages are returned to origin (RTO).
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>NDR Detection:</strong> Automatic classification of failed attempts (NDR_EX, consignee unavailable, address incomplete).</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Action Desk Submissions:</strong> Submit REATTEMPT, UPDATE_ADDRESS, or UPDATE_PHONE directly to courier APIs.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>RTO Prevention:</strong> Authorize Return to Origin (RTO) only when reattempts are exhausted or requested by customer.</span>
                </div>
              </div>
            </div>

            {/* Pipeline Visual Card */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">NDR Resolution Pipeline</span>
              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-amber-300">
                  <span>1. NDR Scan Detected</span>
                  <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Undelivered</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-blue-300">
                  <span>2. Action Desk Processing</span>
                  <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">Action Required</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-purple-300">
                  <span>3. Courier API Dispatch</span>
                  <span className="font-mono text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">REATTEMPT</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-emerald-300">
                  <span>4. Final Status Reconciliation</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">DELIVERED</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* --- COMMERCIAL INTELLIGENCE SECTION --- */}
      <section id="commercials" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Financial Oversight</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Know your true shipping cost
            </h3>
            <p className="text-slate-400 text-sm">
              Keep client selling rates and courier purchase costs strictly separated for transparent margin analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Rates Comparison Card */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-6">
              <h4 className="text-xl font-bold text-white">Client Charge vs Courier Purchase Cost</h4>
              
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">CLIENT SELLING CHARGE (Example)</span>
                  <div className="flex justify-between text-slate-200">
                    <span>Base Freight (1.5 kg Zone B)</span>
                    <span>₹150.00</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Docket Charge + FSC (10%)</span>
                    <span>₹38.80</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-400 pt-2 border-t border-slate-800">
                    <span>Client Total Charge</span>
                    <span>₹188.80</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">COURIER PURCHASE COST (Example)</span>
                  <div className="flex justify-between text-slate-200">
                    <span>Forward Courier Cost</span>
                    <span>₹100.00</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>GST (18%)</span>
                    <span>₹18.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-400 pt-2 border-t border-slate-800">
                    <span>Courier Total Cost</span>
                    <span>₹118.00</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800/60 flex justify-between font-bold text-emerald-400">
                  <span>Gross Profit Margin (₹188.80 - ₹118.00)</span>
                  <span>₹70.80 (37.5%)</span>
                </div>
              </div>
            </div>

            {/* Commercial Feature Breakdown */}
            <div className="space-y-6 flex flex-col justify-center">
              
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Rate-Card Versioning & Chargeable Weight</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically calculates chargeable weight as the maximum of actual weight and volumetric weight (<code className="text-blue-300 font-mono">L x W x H / divisor</code>).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Zone Mapping Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maps origin and destination pincodes into standard zones (Local, Regional, National, Metro) to apply correct slab pricing.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Courier Bill Reconciliation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload vendor courier invoices to automatically reconcile expected vs actual charges, highlighting weight overcharges and cost variances.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* --- PLATFORM SECURITY SECTION --- */}
      <section className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Architecture Security</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Truthful, enterprise-grade data protection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Database className="w-6 h-6 text-blue-400" />
              <h4 className="text-lg font-bold text-white">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL database queries are strictly scoped by company ID, enforcing 100% boundary isolation across tenants.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Users className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">Role-Based Access Control</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distinct permissions for SUPER_ADMIN, ADMIN, OPERATIONS, ACCOUNTS, and CLIENT role accounts.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Lock className="w-6 h-6 text-purple-400" />
              <h4 className="text-lg font-bold text-white">API Key Encrypted Storage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Courier API credentials are key-encrypted server-side and never sent to client browsers or public endpoints.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <h4 className="text-lg font-bold text-white">Commercial Data Redaction</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server-side middleware automatically strips internal courier costs and margin data from client-facing responses.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <FileText className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg font-bold text-white">Audit Logging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immutable ApiLog records capture HTTP status codes, correlation IDs, and operational dispatch metadata.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
              <RefreshCw className="w-6 h-6 text-rose-400" />
              <h4 className="text-lg font-bold text-white">Idempotent Event Handling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Composite database unique constraints prevent duplicate webhook dispatches and race conditions.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* --- CLIENT PORTAL PREVIEW SECTION --- */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Portal Preview</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Powerful dashboard experience for client teams
            </h3>
            <p className="text-slate-400 text-sm">
              An intuitive interface designed for dispatch oversight, tracking, rate calculation, and invoice management.
            </p>
          </div>

          {/* Clean Dashboard Visual Mockup */}
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-w-5xl mx-auto font-sans">
            
            {/* Dashboard Header Bar Mockup */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">LogiFlow Merchant Portal</span>
                  <span className="text-[10px] text-slate-500 block">Company: Apex Merchant Hub (Demo)</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="px-3 py-1 bg-slate-850 text-slate-300 rounded-lg border border-slate-800">Client Role</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">New Booking</span>
              </div>
            </div>

            {/* KPI Cards Mockup */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Booked</span>
                <p className="text-xl font-bold text-white">1,248</p>
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">In Transit</span>
                <p className="text-xl font-bold text-blue-400">312</p>
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">NDR Action Req</span>
                <p className="text-xl font-bold text-amber-400">14</p>
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Delivered SLA</span>
                <p className="text-xl font-bold text-emerald-400">922</p>
              </div>
            </div>

            {/* Mock Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-850">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-850">
                  <tr>
                    <th className="p-3">AWB</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Courier</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                  <tr>
                    <td className="p-3 font-mono text-blue-400 font-bold">DELH88291034</td>
                    <td className="p-3">Vikram Mehta</td>
                    <td className="p-3">Gurgaon, Haryana</td>
                    <td className="p-3">Delhivery</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">DELIVERED</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-blue-400 font-bold">DELH99102455</td>
                    <td className="p-3">Rahul Kapoor</td>
                    <td className="p-3">Noida, UP</td>
                    <td className="p-3">Delhivery</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">NDR</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-blue-400 font-bold">DELH77192011</td>
                    <td className="p-3">Anita Sharma</td>
                    <td className="p-3">Mumbai, MH</td>
                    <td className="p-3">Delhivery</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-bold">IN_TRANSIT</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </section>


      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Frequently Asked Questions</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything you need to know about LogiFlow
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center space-x-4 focus:outline-none"
                >
                  <span className="text-base font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-850 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* --- CONTACT / SALES ENQUIRY SECTION --- */}
      <section id="contact" className="py-24 bg-slate-900 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                Get In Touch
              </div>
              <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to simplify your logistics operations?
              </h3>
              <p className="text-slate-300 text-base leading-relaxed">
                Connect with our team to discuss your multi-courier shipping volume, courier integrations, and custom rate requirements.
              </p>

              <div className="space-y-4 pt-4 text-sm text-slate-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-800 text-blue-400 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">Sales Email</span>
                    <span className="font-bold text-white">sales@logiflow.app</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-800 text-blue-400 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">Headquarters</span>
                    <span className="font-bold text-white">Logistics & Technology Center, India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
              
              <h4 className="text-xl font-bold text-white">Request a Demo &amp; Consultation</h4>

              {contactSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400 flex-shrink-0" />
                  {contactSuccess}
                </div>
              )}

              {contactError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-rose-400 flex-shrink-0" />
                  {contactError}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold">
                
                <div>
                  <label className="block text-slate-400 mb-1.5">Full Name *</label>
                  <input 
                    type="text" 
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">Company Name *</label>
                    <input 
                      type="text" 
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="e.g. Apex E-Commerce"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">Monthly Volume</label>
                    <select 
                      value={contactForm.monthlyVolume}
                      onChange={(e) => setContactForm({ ...contactForm, monthlyVolume: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Under 1,000 shipments">Under 1,000 shipments</option>
                      <option value="1,000 - 5,000 shipments">1,000 - 5,000 shipments</option>
                      <option value="5,000 - 20,000 shipments">5,000 - 20,000 shipments</option>
                      <option value="20,000+ shipments">20,000+ shipments</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">Business Email *</label>
                    <input 
                      type="email" 
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="e.g. vikram@apex.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Message / Requirements</label>
                  <textarea 
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your current courier setup and shipping goals..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={contactLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {contactLoading ? 'Submitting Enquiry...' : 'Submit Sales Enquiry'}
                  {!contactLoading && <Send className="w-4 h-4 ml-2" />}
                </button>

              </form>

            </div>

          </div>

        </div>
      </section>


      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 py-16 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            
            <div className="space-y-4 col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">LogiFlow</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Logistics Management &amp; Shipping Intelligence Platform for modern e-commerce and enterprise dispatches.
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Shipment Management</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Courier Allocation Engine</a></li>
                <li><a href="#tracking-section" className="hover:text-white transition-colors">Live Tracking</a></li>
                <li><a href="#ndr" className="hover:text-white transition-colors">NDR &amp; RTO Action Desk</a></li>
                <li><a href="#commercials" className="hover:text-white transition-colors">Billing &amp; Reconciliation</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company &amp; Resources</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#couriers" className="hover:text-white transition-colors">Courier Network</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Sales</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">ERP Login</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal &amp; Privacy</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <p>&copy; 2026 LogiFlow. All rights reserved.</p>
            <p>Built for Enterprise Multi-Courier Logistics</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
