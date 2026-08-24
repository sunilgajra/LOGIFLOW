import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Truck, ShieldCheck, Zap, Globe, Clock, MapPin, ChevronRight, 
  BarChart3, Users, CheckCircle2, ArrowRight, RefreshCw, AlertTriangle, 
  Layers, Lock, Database, FileText, HelpCircle, Mail, Phone, Building2, 
  Send, Menu, X, ChevronDown, Check, ArrowUpRight, Scale, SlidersHorizontal, 
  Bell, CheckCircle, XCircle, ArrowRightCircle, DollarSign, Calculator, Eye, Activity
} from 'lucide-react';
import { fetchApi } from '../api';

// --- HERO LOGISTICS VISUALIZATION SUB-COMPONENT ---
function HeroLogisticsVisualization() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Sequence Steps
  const sequence = [
    {
      stage: 'ORDER CREATED',
      awb: 'DELH88291034',
      status: 'BOOKED',
      statusBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      route: 'Mumbai (BOM) → Delhi (DEL)',
      courier: 'Pending Allocation',
      details: 'Consignee: Vikram Mehta | Weight: 1.5 kg',
      nodeIndex: 0
    },
    {
      stage: 'SMART ALLOCATION',
      awb: 'DELH88291034',
      status: 'ALLOCATING',
      statusBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      route: 'Evaluating Rate & SLA Rules...',
      courier: 'Selected: Delhivery B2C (Lowest Cost / SLA)',
      details: 'Rule: Lowest Cost + Serviced Pincode 110001',
      nodeIndex: 1
    },
    {
      stage: 'BOOKED & WAYBILL RESERVED',
      awb: 'DELH88291034',
      status: 'BOOKED',
      statusBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      route: 'Mumbai → Delhi Transit Hub',
      courier: 'Delhivery Express',
      details: 'Waybill Allocated | PDF 4R Label Generated',
      nodeIndex: 2
    },
    {
      stage: 'IN TRANSIT',
      awb: 'DELH88291034',
      status: 'IN TRANSIT',
      statusBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      route: 'Delhi Sorting Hub Scan',
      courier: 'Delhivery Express',
      details: 'Webhook Scan: Ingested at Hub 04:15 PM',
      nodeIndex: 3
    },
    {
      stage: 'NDR EXCEPTION DETECTED',
      awb: 'DELH88291034',
      status: 'NDR EXCEPTION',
      statusBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      route: 'Attempt Failed: Consignee Unavailable',
      courier: 'Delhivery Express',
      details: 'Code: NDR_EX | Auto-flagged in NDR Action Desk',
      nodeIndex: 4
    },
    {
      stage: 'NDR ACTION DESK',
      awb: 'DELH88291034',
      status: 'RE-ATTEMPT',
      statusBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      route: 'Action Dispatched to Courier API',
      courier: 'Delhivery API Confirmed',
      details: 'REATTEMPT Scheduled for Next Morning Slot',
      nodeIndex: 4
    },
    {
      stage: 'OUT FOR DELIVERY',
      awb: 'DELH88291034',
      status: 'OUT FOR DELIVERY',
      statusBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      route: 'Gurgaon Delivery Executive Assigned',
      courier: 'Delhivery Express',
      details: 'OTP Verification Sent to Recipient',
      nodeIndex: 5
    },
    {
      stage: 'DELIVERED & E-POD',
      awb: 'DELH88291034',
      status: 'DELIVERED',
      statusBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      route: 'Delivered to Recipient (Vikram Mehta)',
      courier: 'Delhivery Express',
      details: 'E-POD Signed & Timestamp Locked',
      nodeIndex: 6
    },
    {
      stage: 'COMMERCIAL RECONCILIATION',
      awb: 'DELH88291034',
      status: 'RECONCILED',
      statusBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      route: 'Billing Reconciliation Complete',
      courier: 'Delhivery Express',
      details: 'Client ₹188.80 - Courier ₹118.00 = Margin ₹70.80 (37.5%)',
      nodeIndex: 6
    }
  ];

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sequence Timer Loop
  useEffect(() => {
    if (isReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % sequence.length);
    }, 2400);

    return () => clearInterval(timer);
  }, [isReducedMotion, sequence.length]);

  const activeSeq = sequence[currentStep];

  return (
    <div className="relative w-full max-w-xl mx-auto font-sans">
      
      {/* Background Command Center Container */}
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Command Center Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
              LIVE SHIPMENT FLOW ENGINE
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold rounded-full">
            SAMPLE DEMO DATA
          </span>
        </div>

        {/* Network Node Graphic Visual (SVG) */}
        <div className="relative h-28 w-full bg-slate-950/80 rounded-2xl border border-slate-850 p-4 flex items-center justify-between overflow-hidden">
          
          {/* Connecting SVG Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M 40,56 Q 160,20 280,56 T 520,56" 
              fill="none" 
              stroke="#1e293b" 
              strokeWidth="2" 
              strokeDasharray="4 4" 
            />
            <path 
              d="M 40,56 Q 160,20 280,56 T 520,56" 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2" 
              strokeDasharray="8 8" 
              className={isReducedMotion ? "" : "animate-pulse"}
            />
          </svg>

          {/* Node Points */}
          {[
            { name: 'BOM', label: 'Mumbai' },
            { name: 'AMD', label: 'Ahmedabad' },
            { name: 'DEL', label: 'Delhi Hub' },
            { name: 'GGN', label: 'Gurgaon' }
          ].map((node, i) => {
            const isActiveNode = activeSeq.nodeIndex === i;
            return (
              <div 
                key={node.name} 
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                  isActiveNode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/20 scale-110' 
                    : 'bg-slate-850 text-slate-400 border border-slate-750 group-hover:border-blue-400'
                }`}>
                  {node.name}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">{node.label}</span>
              </div>
            );
          })}

        </div>

        {/* Hover Node Details Tooltip */}
        {hoveredNode !== null && (
          <div className="p-3 bg-blue-950/60 border border-blue-800/60 rounded-xl text-xs text-blue-200 font-mono">
            Node: {[ 'Mumbai Origin Hub', 'Ahmedabad Transit Hub', 'Delhi Sorting Center', 'Gurgaon Consignee Hub' ][hoveredNode]} | Routing Engine Active
          </div>
        )}

        {/* MAIN FLOATING SHIPMENT CARD */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">AWB NUMBER</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-[9px] text-slate-400 font-mono rounded">DEMO DATA</span>
              </div>
              <p className="text-xl font-mono font-extrabold text-blue-400">{activeSeq.awb}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${activeSeq.statusBg}`}>
              {activeSeq.status}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">CURRENT STAGE</span>
            <p className="text-sm font-extrabold text-white">{activeSeq.stage}</p>
            <p className="text-xs text-slate-400">{activeSeq.route}</p>
          </div>

          {/* Courier Allocation / Details Box */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Carrier Allocation:</span>
              <span className="text-emerald-400 font-bold">{activeSeq.courier}</span>
            </div>
            <p className="text-slate-400 text-[11px] font-mono">{activeSeq.details}</p>
          </div>

          {/* Candidate Couriers Comparison Snippet at Allocation Stage */}
          {currentStep === 1 && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                Illustrative Allocation Comparison
              </span>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-emerald-400">✓ Delhivery B2C</span>
                <span className="font-mono text-emerald-400 font-bold">Lowest Cost / 2 Days (Selected)</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Blue Dart Express</span>
                <span className="font-mono">Higher Rate / 2 Days</span>
              </div>
            </div>
          )}

          {/* NDR Action Desk Snippet at NDR Stage */}
          {(currentStep === 4 || currentStep === 5) && (
            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 space-y-2 text-[11px]">
              <span className="text-amber-300 font-bold uppercase tracking-wider block text-[10px]">
                NDR Action Desk Triggered
              </span>
              <div className="flex items-center space-x-2 font-mono">
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold">REATTEMPT</span>
                <span className="text-amber-200">Scheduled with Recipient</span>
              </div>
            </div>
          )}

          {/* Commercial Reconciliation Snippet at Final Stage */}
          {currentStep === 8 && (
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 space-y-1.5 text-[11px]">
              <span className="text-emerald-300 font-bold uppercase tracking-wider block text-[10px]">
                Pure Decimal Commercial Reconciliation
              </span>
              <div className="flex justify-between font-mono font-bold text-emerald-400">
                <span>Client Charge ₹188.80 - Courier Cost ₹118.00</span>
                <span>Profit ₹70.80 (37.5%)</span>
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Micro Floating Cards */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300 text-[11px] font-semibold truncate">Courier Allocated</span>
          </div>

          <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 flex items-center space-x-2">
            <Truck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-slate-300 text-[11px] font-semibold truncate">Tracking Webhooks</span>
          </div>

          <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-slate-300 text-[11px] font-semibold truncate">NDR Desk Actions</span>
          </div>

          <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 flex items-center space-x-2">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-slate-300 text-[11px] font-semibold truncate">Margin Analytics</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  // Mobile Menu Drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tracking Widget State
  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  // Lifecycle Interactive Active Step state
  const [activeLifecycleStep, setActiveLifecycleStep] = useState(0);

  // Interactive Client Dashboard Preview Tab state
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'ndr' | 'commercials' | 'calculator'>('overview');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact / Demo Request Form State
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
        setContactSuccess(res.message || 'Thank you! Our sales & logistics team will contact you within 24 hours.');
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

  // 6 Lifecycle Steps Data
  const lifecycleSteps = [
    {
      num: "01",
      title: "Client & Rate Card Setup",
      subtitle: "Multi-Tenant Client Onboarding",
      desc: "Configure client profiles, version-controlled rate cards, minimum weights, docket fees, FSC %, zone matrices, and role-based portal access.",
      icon: Users,
      highlight: "Enforces multi-tenant data boundary & client-side rate card redaction"
    },
    {
      num: "02",
      title: "Smart Courier Allocation",
      subtitle: "Automated Carrier Routing",
      desc: "Evaluates eligible courier partners based on pincode serviceability, SLA transit days, total courier cost, COD availability, and business rules.",
      icon: SlidersHorizontal,
      highlight: "Selects optimal courier partner before reserving waybill stock"
    },
    {
      num: "03",
      title: "Booking, AWBs & Live Tracking",
      subtitle: "Shipment Lifecycle Execution",
      desc: "Reserves AWB waybills, generates PDF thermal labels, schedules pickup requests, and ingests live courier status webhooks with timestamp protection.",
      icon: Truck,
      highlight: "Delhivery B2C Integration — Available & UAT Verified"
    },
    {
      num: "04",
      title: "NDR & Exception Desk",
      subtitle: "Turn Exceptions into Deliveries",
      desc: "Automatically records undelivered scans (NDR_EX), dispatches customer notifications, and submits REATTEMPT, UPDATE_ADDRESS, or RTO actions.",
      icon: RefreshCw,
      highlight: "Direct courier API dispatches for reattempts and address updates"
    },
    {
      num: "05",
      title: "Billing & Invoice Audit",
      subtitle: "Courier Invoice Reconciliation",
      desc: "Compares courier purchase bills against expected charges, identifies weight discrepancies, audit ODA/FSC surcharges, and generates client invoices.",
      icon: FileText,
      highlight: "Automatic variance detection on deadweight vs volumetric weight"
    },
    {
      num: "06",
      title: "Profitability & Margin Analytics",
      subtitle: "True Logistics Cost Intelligence",
      desc: "Calculates real-time gross profit (Client Selling Charge - Courier Purchase Cost) per shipment, client, and shipping zone without manual spreadsheets.",
      icon: BarChart3,
      highlight: "Pure decimal arithmetic ensuring zero floating-point calculation drift"
    }
  ];

  // LogiFlow vs Traditional Comparison Data
  const comparisonItems = [
    {
      feature: "Courier Integration Architecture",
      traditional: "Locked to single courier portal or fragile ad-hoc scripts",
      logiflow: "Unified multi-courier provider layer (Delhivery live UAT, extensible)"
    },
    {
      feature: "Carrier Allocation Logic",
      traditional: "Manual selection or static guesswork by dispatch staff",
      logiflow: "Smart rule engine: cost, SLA, serviceability, COD, weight slabs"
    },
    {
      feature: "NDR Exception Handling",
      traditional: "Manual email follow-ups & delayed customer updates",
      logiflow: "Automated NDR Action Desk with direct courier API dispatches"
    },
    {
      feature: "Client Billing & Cost Visibility",
      traditional: "Single rate assumption; hidden courier surcharge surprises",
      logiflow: "Dual rate cards (Client Selling vs Courier Cost) & gross profit analysis"
    },
    {
      feature: "Courier Invoice Reconciliation",
      traditional: "Manual spreadsheet auditing; weight overcharges missed",
      logiflow: "Automated bill reconciliation engine highlighting weight & cost variances"
    },
    {
      feature: "Tenant Data Security",
      traditional: "Shared portal accounts; risk of internal cost leakage",
      logiflow: "Strict multi-tenant DB isolation & server-side commercial data redaction"
    }
  ];

  // FAQ Items
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
            <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold">
              <a href="#home" className="text-slate-300 hover:text-white transition-colors">Home</a>
              <a href="#lifecycle" className="text-slate-300 hover:text-white transition-colors">Lifecycle</a>
              <a href="#comparison" className="text-slate-300 hover:text-white transition-colors">Why LogiFlow</a>
              <a href="#solutions" className="text-slate-300 hover:text-white transition-colors">Solutions</a>
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#couriers" className="text-slate-300 hover:text-white transition-colors">Couriers</a>
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
              <a href="#lifecycle" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Product Lifecycle</a>
              <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Why LogiFlow</a>
              <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Solutions</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Features</a>
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


      {/* --- HERO SECTION WITH 2-COLUMN GRID & LIVE ANIMATION --- */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
        
        {/* Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT COLUMN: Positioning, Headline & Tracking Widget */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Delhivery Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 animate-pulse"></span>
                <span className="text-emerald-300 font-bold text-xs sm:text-sm tracking-wide">
                  Delhivery B2C Integration — Available &amp; UAT Verified
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Deliver <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">faster.</span> <br />
                Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">smarter.</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                One platform to manage courier allocation, shipment tracking, NDR operations, and commercial reconciliation.
              </p>

              {/* CTA Hierarchy Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#contact"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-7 py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  REQUEST A DEMO
                </a>

                <a 
                  href="#tracking-section"
                  className="w-full sm:w-auto bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 px-7 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center"
                >
                  <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                  TRACK A SHIPMENT
                </a>
              </div>

              {/* INTERACTIVE PUBLIC TRACKING WIDGET */}
              <div id="tracking-section" className="pt-4 max-w-xl mx-auto lg:mx-0">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Public Tracking Lookup</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">Real-Time Search</span>
                  </div>

                  <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        value={trackingAwb}
                        onChange={(e) => setTrackingAwb(e.target.value.toUpperCase())}
                        placeholder="Enter AWB (e.g. DELH88291034)" 
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-750 text-white font-mono text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={trackingLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center shadow-md"
                    >
                      {trackingLoading ? 'Searching...' : 'Track'}
                      {!trackingLoading && <ChevronRight className="w-4 h-4 ml-1" />}
                    </button>
                  </form>

                  {/* Sample AWB Chips */}
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-slate-500 font-medium">Sample AWBs:</span>
                    {sampleAwbs.map(sample => (
                      <button 
                        key={sample} 
                        type="button"
                        onClick={() => handleQuickSampleTrack(sample)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-blue-300 font-mono font-bold rounded border border-slate-700 transition-colors"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>

                  {/* Error Alert */}
                  {trackingError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-rose-400 flex-shrink-0" />
                      {trackingError}
                    </div>
                  )}

                  {/* Tracking Result Display */}
                  {trackingResult && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">AWB NUMBER</span>
                          <p className="text-base font-mono font-extrabold text-blue-400">{trackingResult.awb_number}</p>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold rounded-full">
                          {String(trackingResult.status).replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Recipient</span>
                          <span className="font-bold text-slate-200">{trackingResult.receiver_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Destination</span>
                          <span className="font-bold text-slate-200">{trackingResult.destination_city}, {trackingResult.destination_state}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Premium Hero Live Logistics Visualization */}
            <div className="lg:col-span-5">
              <HeroLogisticsVisualization />
            </div>

          </div>

        </div>
      </section>


      {/* --- VERIFIED CAPABILITY BANNER --- */}
      <section className="bg-slate-900 py-10 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-center text-blue-400 mb-1">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-base font-extrabold text-white">Multi-Courier</p>
              <p className="text-xs text-slate-400 font-medium">Allocation Engine</p>
            </div>

            <div className="p-3 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-base font-extrabold text-white">Real-Time</p>
              <p className="text-xs text-slate-400 font-medium">Milestone Tracking</p>
            </div>

            <div className="p-3 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <RefreshCw className="w-5 h-5" />
              </div>
              <p className="text-base font-extrabold text-white">Automated NDR</p>
              <p className="text-xs text-slate-400 font-medium">Action Desk</p>
            </div>

            <div className="p-3 space-y-1 border-l border-slate-800">
              <div className="flex items-center justify-center text-purple-400 mb-1">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-base font-extrabold text-white">Commercial</p>
              <p className="text-xs text-slate-400 font-medium">Billing &amp; Reconciliation</p>
            </div>

          </div>
        </div>
      </section>


      {/* --- COMPLETE PRODUCT LIFECYCLE INTERACTIVE SECTION --- */}
      <section id="lifecycle" className="py-24 bg-slate-950 relative border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              The LogiFlow Core Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              End-to-End Shipping &amp; Intelligence Lifecycle
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Explore how LogiFlow manages every stage of logistics operations—from initial client rate cards to final commercial profitability.
            </p>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {lifecycleSteps.map((step, idx) => {
              const IconComp = step.icon;
              const isActive = activeLifecycleStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveLifecycleStep(idx)}
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-600/30 scale-105 z-10' 
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-blue-100' : 'text-blue-400'}`}>{step.num}</span>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-tight block">{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Lifecycle Step Detail Showcase Card */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-mono font-extrabold text-blue-400">
                    {lifecycleSteps[activeLifecycleStep].num}
                  </span>
                  <div>
                    <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">
                      {lifecycleSteps[activeLifecycleStep].subtitle}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {lifecycleSteps[activeLifecycleStep].title}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  {lifecycleSteps[activeLifecycleStep].desc}
                </p>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-emerald-300">
                    {lifecycleSteps[activeLifecycleStep].highlight}
                  </span>
                </div>
              </div>

              {/* Lifecycle Stage Visual Representation */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850 text-slate-400 font-bold">
                  <span>SYSTEM SCENARIO STAGE</span>
                  <span className="text-blue-400">STAGE {lifecycleSteps[activeLifecycleStep].num} OF 06</span>
                </div>

                {activeLifecycleStep === 0 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Tenant Scoping</span>
                      <span className="text-emerald-400 font-bold">company_id Scoped</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Rate Card Matrix</span>
                      <span className="text-blue-300">Base ₹150 + 10% FSC</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Client Access Role</span>
                      <span className="text-purple-300">RBAC (Redacted Internal Costs)</span>
                    </div>
                  </div>
                )}

                {activeLifecycleStep === 1 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Pincode Serviceability</span>
                      <span className="text-emerald-400 font-bold">110001 (Serviced)</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Delhivery B2C SLA</span>
                      <span className="text-blue-300">2 Transit Days</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Allocation Decision</span>
                      <span className="text-emerald-300 font-bold">Delhivery Selected (Least Cost)</span>
                    </div>
                  </div>
                )}

                {activeLifecycleStep === 2 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Reserved Waybill AWB</span>
                      <span className="text-blue-400 font-bold">DELH88291034</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Label Format</span>
                      <span className="text-slate-200">PDF 4R Shipping Label</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Webhook Status</span>
                      <span className="text-emerald-400 font-bold">IN_TRANSIT (Hub Scan)</span>
                    </div>
                  </div>
                )}

                {activeLifecycleStep === 3 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">NDR Exception Code</span>
                      <span className="text-amber-400 font-bold">NDR_EX (Consignee Unavailable)</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Action Submitted</span>
                      <span className="text-blue-300">REATTEMPT Requested</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Courier Dispatch</span>
                      <span className="text-emerald-400 font-bold">CONFIRMED (Delhivery API)</span>
                    </div>
                  </div>
                )}

                {activeLifecycleStep === 4 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Expected Courier Charge</span>
                      <span className="text-slate-200">₹118.00</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Uploaded Vendor Bill</span>
                      <span className="text-rose-400 font-bold">₹138.00 (Overcharge)</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Reconciliation Result</span>
                      <span className="text-amber-300 font-bold">+₹20.00 Weight Discrepancy</span>
                    </div>
                  </div>
                )}

                {activeLifecycleStep === 5 && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Client Total Revenue</span>
                      <span className="text-blue-400 font-bold">₹188.80</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl flex justify-between">
                      <span className="text-slate-400">Actual Courier Cost</span>
                      <span className="text-amber-400 font-bold">₹118.00</span>
                    </div>
                    <div className="p-3 bg-emerald-950 border border-emerald-800/60 rounded-xl flex justify-between font-bold text-emerald-400">
                      <span>Net Profit Margin</span>
                      <span>₹70.80 (37.5%)</span>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>


      {/* --- LOGIFLOW VS TRADITIONAL PORTALS COMPARISON SECTION --- */}
      <section id="comparison" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Platform Differentiation</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why LogiFlow vs Traditional Single-Courier Portals
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Traditional courier portals lock you into single-carrier silos. LogiFlow provides unified multi-courier intelligence, automated NDR dispatches, and true cost reconciliation.
            </p>
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 shadow-2xl bg-slate-950">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-5 w-1/3">Feature / Capability</th>
                  <th className="p-5 w-1/3 text-slate-400">Traditional Single-Courier Portal</th>
                  <th className="p-5 w-1/3 text-blue-400 bg-blue-950/20 border-l border-slate-800">LogiFlow Logistics Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-medium">
                {comparisonItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-5 font-bold text-white">{item.feature}</td>
                    <td className="p-5 text-slate-400 flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>{item.traditional}</span>
                    </td>
                    <td className="p-5 text-slate-200 bg-blue-950/10 border-l border-slate-800 flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-white">{item.logiflow}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>


      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="py-24 bg-slate-950 relative border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Tailored Capability</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Solutions for modern logistics operations
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed for merchants, D2C brands, and logistics providers managing multi-courier dispatches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">1. E-Commerce Shipping</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Create and manage customer shipments across courier partners with standardized AWBs, labels, and pickup scheduling.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">2. Multi-Courier Management</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Connect and manage multiple courier partners from one unified platform without fragmented dashboard logins.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">3. Last-Mile Delivery</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Monitor shipments from initial dispatch through out-for-delivery scans and electronic proof of delivery (E-POD).
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">4. NDR Management</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Manage failed delivery attempts, reattempts, address/phone corrections, and authorization of RTOs cleanly.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">5. Shipment Tracking</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Track shipment status history in real time via standardized status codes and automated event normalization.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">6. Billing &amp; Reconciliation</h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
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
              <h4 className="text-lg font-bold text-white">NDR &amp; RTO Action Desk</h4>
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


      {/* --- COURIER NETWORK SECTION --- */}
      <section id="couriers" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Integrations</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Connect the courier partners that power your business
            </h3>
            <p className="text-slate-400 text-sm">
              LogiFlow features a modular courier integration layer for seamless API dispatches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
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

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
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

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
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
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto text-center space-y-6">
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
      <section id="ndr" className="py-24 bg-slate-900 border-t border-slate-800">
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
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">NDR Resolution Pipeline</span>
              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-amber-300">
                  <span>1. NDR Scan Detected</span>
                  <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Undelivered</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-blue-300">
                  <span>2. Action Desk Processing</span>
                  <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">Action Required</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-purple-300">
                  <span>3. Courier API Dispatch</span>
                  <span className="font-mono text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">REATTEMPT</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-emerald-300">
                  <span>4. Final Status Reconciliation</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">DELIVERED</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* --- COMMERCIAL INTELLIGENCE SECTION --- */}
      <section id="commercials" className="py-24 bg-slate-950 border-t border-slate-800">
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
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6">
              <h4 className="text-xl font-bold text-white">Client Charge vs Courier Purchase Cost</h4>
              
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
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

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
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
                <h4 className="text-lg font-bold text-white">Rate-Card Versioning &amp; Chargeable Weight</h4>
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
      <section className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-blue-500 font-bold text-xs uppercase tracking-widest">Architecture Security</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Truthful, enterprise-grade data protection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Database className="w-6 h-6 text-blue-400" />
              <h4 className="text-lg font-bold text-white">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL database queries are strictly scoped by company ID, enforcing 100% boundary isolation across tenants.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Users className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">Role-Based Access Control</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distinct permissions for SUPER_ADMIN, ADMIN, OPERATIONS, ACCOUNTS, and CLIENT role accounts.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <Lock className="w-6 h-6 text-purple-400" />
              <h4 className="text-lg font-bold text-white">API Key Encrypted Storage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Courier API credentials are key-encrypted server-side and never sent to client browsers or public endpoints.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <h4 className="text-lg font-bold text-white">Commercial Data Redaction</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server-side middleware automatically strips internal courier costs and margin data from client-facing responses.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <FileText className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg font-bold text-white">Audit Logging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immutable ApiLog records capture HTTP status codes, correlation IDs, and operational dispatch metadata.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <RefreshCw className="w-6 h-6 text-rose-400" />
              <h4 className="text-lg font-bold text-white">Idempotent Event Handling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Composite database unique constraints prevent duplicate webhook dispatches and race conditions.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* --- CLIENT PORTAL INTERACTIVE PREVIEW SECTION --- */}
      <section className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Portal Preview</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Client Dashboard Experience
            </h3>
            <p className="text-slate-400 text-sm">
              Explore the clean, functional UI available to merchant client teams inside LogiFlow.
            </p>
          </div>

          {/* Tab Switcher Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => setActiveDashboardTab('overview')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center ${
                activeDashboardTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Shipments Overview
            </button>

            <button 
              onClick={() => setActiveDashboardTab('ndr')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center ${
                activeDashboardTab === 'ndr' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              NDR Action Desk
            </button>

            <button 
              onClick={() => setActiveDashboardTab('commercials')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center ${
                activeDashboardTab === 'commercials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Profit Margin Analysis
            </button>

            <button 
              onClick={() => setActiveDashboardTab('calculator')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center ${
                activeDashboardTab === 'calculator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Rate Calculator
            </button>
          </div>

          {/* Interactive Mockup Container */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-w-5xl mx-auto font-sans">
            
            {/* Dashboard Mockup Topbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Apex E-Commerce Hub</span>
                  <span className="text-[10px] text-slate-500 block">Tenant ID: TENANT-882103 (Demo Client Role)</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-750">Role: CLIENT</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">+ Book Shipment</span>
              </div>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeDashboardTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Shipments</span>
                    <p className="text-xl font-bold text-white">1,248</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">In Transit</span>
                    <p className="text-xl font-bold text-blue-400">312</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">NDR Exception</span>
                    <p className="text-xl font-bold text-amber-400">14</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Delivered</span>
                    <p className="text-xl font-bold text-emerald-400">922</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">AWB Number</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Courier</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                      <tr>
                        <td className="p-3 font-mono text-blue-400 font-bold">DELH88291034</td>
                        <td className="p-3">Vikram Mehta</td>
                        <td className="p-3">Gurgaon, HR</td>
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
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NDR */}
            {activeDashboardTab === 'ndr' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-bold">14 Active Delivery Exceptions Require Action</span>
                  </div>
                  <span className="text-[10px] text-amber-400 uppercase font-mono">Action Desk Priority</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-850">
                    <span>AWB: DELH99102455 (Rahul Kapoor - Noida)</span>
                    <span className="text-amber-400 font-bold">NDR_EX: Consignee Unavailable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-sans font-bold text-xs">Request Reattempt</button>
                    <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-sans font-semibold text-xs">Update Address/Phone</button>
                    <button className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg font-sans font-semibold text-xs">Authorize RTO</button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Commercials */}
            {activeDashboardTab === 'commercials' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between text-slate-300 pb-2 border-b border-slate-850 font-bold">
                    <span>COMMERCIAL BREAKDOWN (SAMPLE SHIPMENT)</span>
                    <span className="text-blue-400">ZONE B (REGIONAL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client Total Selling Charge:</span>
                    <span className="text-blue-400 font-bold">₹188.80</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Courier Total Purchase Cost:</span>
                    <span className="text-amber-400 font-bold">₹118.00</span>
                  </div>
                  <div className="flex justify-between p-3 bg-emerald-950/40 rounded-xl text-emerald-400 font-bold">
                    <span>Calculated Gross Margin:</span>
                    <span>₹70.80 (37.5%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Calculator */}
            {activeDashboardTab === 'calculator' && (
              <div className="space-y-4 text-xs font-semibold">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Courier Rate Card Quote Calculator</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-500 block text-[10px]">Origin Pincode</span>
                      <span className="text-white font-mono font-bold">110001 (Delhi)</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-500 block text-[10px]">Destination Pincode</span>
                      <span className="text-white font-mono font-bold">400001 (Mumbai)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl flex justify-between items-center">
                    <span className="text-slate-300">Estimated Rate (Delhivery B2C 1.5kg):</span>
                    <span className="text-blue-400 font-mono font-bold text-sm">₹188.80 GST incl.</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>


      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Frequently Asked Questions</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything you need to know about LogiFlow
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden transition-colors"
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
      <section id="contact" className="py-24 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                Get In Touch
              </div>
              <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to simplify your logistics operations?
              </h3>
              <p className="text-slate-300 text-base leading-relaxed">
                Connect with our logistics &amp; engineering team to discuss multi-courier volume, custom rate cards, and platform onboarding.
              </p>

              <div className="space-y-4 pt-4 text-sm text-slate-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-900 text-blue-400 rounded-xl flex items-center justify-center border border-slate-800">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">Sales &amp; Demo Inquiries</span>
                    <span className="font-bold text-white">sales@logiflow.app</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-900 text-blue-400 rounded-xl flex items-center justify-center border border-slate-800">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">Platform Operation</span>
                    <span className="font-bold text-white">Logistics &amp; Technology Center, India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
              
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">Monthly Volume</label>
                    <select 
                      value={contactForm.monthlyVolume}
                      onChange={(e) => setContactForm({ ...contactForm, monthlyVolume: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">Message / Shipping Requirements</label>
                  <textarea 
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your shipping volume and courier requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={contactLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {contactLoading ? 'Submitting Request...' : 'Submit Demo Request'}
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
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product Lifecycle</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#lifecycle" className="hover:text-white transition-colors">Client Rate Cards</a></li>
                <li><a href="#lifecycle" className="hover:text-white transition-colors">Carrier Allocation Engine</a></li>
                <li><a href="#tracking-section" className="hover:text-white transition-colors">Live Tracking &amp; Webhooks</a></li>
                <li><a href="#ndr" className="hover:text-white transition-colors">NDR Action Desk</a></li>
                <li><a href="#commercials" className="hover:text-white transition-colors">Invoice Reconciliation</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company &amp; Platform</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#comparison" className="hover:text-white transition-colors">Why LogiFlow</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#couriers" className="hover:text-white transition-colors">Courier Network</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Sales</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">ERP Login</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal &amp; Security</h5>
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
