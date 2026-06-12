import React, { useState } from 'react';
import { 
  Wifi, Shield, ArrowRight, Zap, Play, CheckCircle2, MessageSquare, 
  HelpCircle, Sparkles, Smartphone, ChevronRight, Layers, FileText,
  Mail, Users, Globe, Lock, Code, Database, RefreshCw, Send, Star
} from 'lucide-react';

interface LandingPageProps {
  onEnterReseller: () => void;
  onEnterSubscriber: () => void;
  onEnterSuperAdmin: () => void;
  activePlanLimits: {
    starter: string;
    growth: string;
    business: string;
  };
}

export default function LandingPage({ 
  onEnterReseller, 
  onEnterSubscriber, 
  onEnterSuperAdmin,
  activePlanLimits
}: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [activeVisualStep, setActiveVisualStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Subscriber Connects",
      desc: "Local hostel occupant or customer connects to your Wi-Fi SSID. A responsive captive portal pops up automatically.",
      element: "Subscriber Portal View",
      color: "from-brand-500 to-sky-500"
    },
    {
      title: "2. Bank Transfer & Submit",
      desc: "Subscribers select their high-speed plan, copy the displayed bank transfer details, and submit their transaction token/ref.",
      element: "Cash Ledger / Review Queue",
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "3. Reseller Approval & Spawning",
      desc: "Owner gets instant notification, taps 'Approve' to verify, which instantly spawns a randomized micro-voucher passcode PIN.",
      element: "Reseller Dashboard Node",
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "4. Automated Broadcast",
      desc: "The Wi-Fi access code PIN is immediately delivered to the subscriber via simulated WhatsApp client or live Resend email integration.",
      element: "WhatsApp & Email Dispatcher",
      color: "from-brand-600 to-indigo-600"
    }
  ];

  const demoFeatures = [
    {
      icon: <Wifi className="w-5 h-5 text-brand-600" />,
      title: "Starlink Optimized",
      desc: "Engineered specifically for low-overhead, high-speed Starlink feeds to maximize Sub-Saharan African hostel & community hotspots."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      title: "WhatsApp Dispatcher",
      desc: "Direct-to-client voucher passcode routing with prefilled wa.me layout to avoid slow manual SMS charges."
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />,
      title: "Manual NGN Verifications",
      desc: "Accept local bank transfers securely without expensive Paystack integration fees up front."
    },
    {
      icon: <Layers className="w-5 h-5 text-purple-600" />,
      title: "Multi-Tenant SaaS Scaling",
      desc: "Allows operators to manage multiple hotspot locations, customize pricing tiers, and track combined sales summaries."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-sky-600" />,
      title: "Captive Portal Engines",
      desc: "Simulated Web-Popup responsive design matching physical router frames for a fully realistic preview proof-of-concept."
    },
    {
      icon: <Mail className="w-5 h-5 text-amber-600" />,
      title: "Resend E-Tickets",
      desc: "Fires beautiful premium Wi-Fi passes directly to subscriber inboxes immediately upon manual approval confirmations."
    }
  ];

  const recommendedSQL = `--- WiFiSplit Relational Database DDL Schema
--- Optimized for Supabase PostgreSQL, Neon, or Cloud SQL PostgreSQL

CREATE TABLE IF NOT EXISTS reseller_profiles (
  id VARCHAR(64) PRIMARY KEY,
  business_name VARCHAR(100) NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL,
  bank_name VARCHAR(50),
  bank_account_no VARCHAR(20),
  bank_account_name VARCHAR(100),
  coverage_area VARCHAR(100),
  whatsapp_provider VARCHAR(50) DEFAULT 'Meta Cloud API',
  whatsapp_api_key TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internet_plans (
  id VARCHAR(64) PRIMARY KEY,
  reseller_id VARCHAR(64) REFERENCES reseller_profiles(id),
  name VARCHAR(50) NOT NULL,
  price_naira NUMERIC(10,2) NOT NULL,
  data_limit_gb NUMERIC(6,2), -- NULL/0 means unlimited
  duration_hours INT NOT NULL,
  speed_limit_mbps INT NOT NULL,
  device_limit INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id VARCHAR(64) PRIMARY KEY,
  reseller_id VARCHAR(64) REFERENCES reseller_profiles(id),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(100),
  plan_id VARCHAR(64) REFERENCES internet_plans(id),
  plan_name VARCHAR(100) NOT NULL,
  plan_price NUMERIC(10,2) NOT NULL,
  bank_reference VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'Awaiting Approval', -- Awaiting Approval, Approved, Rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS active_vouchers (
  id VARCHAR(64) PRIMARY KEY,
  reseller_id VARCHAR(64) REFERENCES reseller_profiles(id),
  payment_request_id VARCHAR(64) REFERENCES payment_requests(id),
  code VARCHAR(16) UNIQUE NOT NULL,
  plan_id VARCHAR(64) REFERENCES internet_plans(id),
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, suspended
  remaining_data_gb NUMERIC(6,2),
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(recommendedSQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased relative overflow-hidden selection:bg-brand-500 selection:text-slate-950">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Landing page header navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-brand-500 text-slate-950 flex items-center justify-center font-black text-lg tracking-tighter shadow-lg shadow-brand-500/20">
              W
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider text-white uppercase">WiFiSplit™</span>
                <span className="text-[9px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full uppercase">SaaS v2.4</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Smart Starlink Monetization Engine</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing Profiles</a>
            <a href="#sql-integration" className="hover:text-white transition-colors">Enterprise DB Schema</a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onEnterSubscriber}
              className="px-3.5 py-1.5 border border-slate-700 hover:border-slate-500 bg-slate-900 rounded-xl text-xs font-bold transition-all text-slate-350"
            >
              👤 Client Portal
            </button>
            <button
              onClick={onEnterReseller}
              className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-brand-500/10 flex items-center gap-1"
            >
              🏢 Launch Admin <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Giant Hero Banner Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center space-y-8">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/25 rounded-full text-brand-400 text-[11px] font-black uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Starlink Captive Portal & Automated NGN Billings
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none max-w-4xl mx-auto">
          Monetize Your Starlink. <br />
          <span className="bg-gradient-to-r from-brand-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Connect Your Neighborhood.
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate self-contained Captive Portal billing framework for Sub-Saharan Africa hotspot resellers. Spawn micro-vouchers, accept NGN Transfers offline, and dispatch passcodes automatically via WhatsApp API.
        </p>

        {/* CTA Pairings */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onEnterReseller}
            className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-2xl text-sm font-black transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 group"
          >
            Launch Reseller Admin Panel 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onEnterSubscriber}
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-sm font-bold border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-brand-400" /> Enter Subscriber Captive Portal
          </button>
        </div>

        {/* Dynamic platform dashboard stats badges */}
        <div className="pt-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-brand-400 font-mono">100%</span>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Starlink Compatible</p>
          </div>
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">&lt; 3s</span>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Voucher Spawning</p>
          </div>
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-indigo-400 font-mono">₦0.00</span>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gateway Surcharge Fees</p>
          </div>
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-purple-400 font-mono">Local</span>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Bank Transfer Ready</p>
          </div>
        </div>

      </section>

      {/* Interactive Flow Visualizer - Concept Map */}
      <section id="workflow" className="py-20 bg-slate-950 px-6 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-brand-500 uppercase tracking-widest block">HOW THE ARCHITECTURE WORKS</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">The Starlink Micro-Billing Ecosystem</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-normal">
              No expensive ISP infrastructure required. A simple lightweight, mobile-first workflow optimized for physical node setups.
            </p>
          </div>

          {/* Interactive Steps Visual Map */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
            {workflowSteps.map((step, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveVisualStep(idx)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  activeVisualStep === idx 
                    ? 'bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/5 scale-[1.02]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`w-8 h-8 rounded-full bg-gradient-to-tr ${step.color} text-slate-950 flex items-center justify-center text-xs font-black`}>
                    0{idx + 1}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-550 border border-slate-800 rounded px-1.5 font-bold">
                    {step.element}
                  </span>
                </div>
                <h3 className="text-xs font-black uppercase text-white tracking-tight mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{step.desc}</p>
                
                {activeVisualStep === idx && (
                  <div className="absolute right-3.5 bottom-3 text-brand-400 animate-bounce">
                    ⚡
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Large Sandbox Flow Preview Area simulating Captive Portal Popup */}
          <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800/80 max-w-4xl mx-auto relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-xl" />
            
            <div className="inline-flex p-1.5 bg-slate-950 rounded-xl border border-slate-805 text-[10px] font-mono font-bold text-slate-400">
              Captive Portal Hook System Simulation
            </div>

            <div className="max-w-md mx-auto p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-brand-400 animate-pulse" />
                  <span className="text-xs font-black text-white">Guest WiFi Captive Login</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {activeVisualStep === 0 && (
                <div className="space-y-2 animate-fade-in text-xs text-slate-450 leading-relaxed">
                  <p className="font-bold text-white">👉 What Subscriber Sees:</p>
                  <p>In the hostel lounge, subscriber selects SSID. They are automatically redirected to <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">WiFiSplit Portal</code>.</p>
                  <div className="p-2.5 bg-brand-500/5 rounded border border-brand-500/10 text-[11px]">
                    "Select a ticket code package: 24-Hour Premium (₦500), 7-Day Ultra (₦2,500), or Monthly Unlimited Cap (₦7,500)."
                  </div>
                </div>
              )}

              {activeVisualStep === 1 && (
                <div className="space-y-2 animate-fade-in text-xs text-slate-450 leading-relaxed">
                  <p className="font-bold text-amber-400">👉 Bank Payment Review Stage:</p>
                  <p>Subscriber displays transaction instructions:</p>
                  <div className="p-3 bg-amber-500/5 rounded border border-amber-500/20 text-[10.5px] space-y-1.5 font-mono text-slate-300">
                    <div>Bank: <strong>Opay</strong></div>
                    <div>Account No: <strong>8123456789</strong></div>
                    <div>Ref Name: <strong>Yaba Wireless Links</strong></div>
                  </div>
                  <p>They proceed by typing their name and bank transfer token/reference and tapping "Submit Verification Request".</p>
                </div>
              )}

              {activeVisualStep === 2 && (
                <div className="space-y-2 animate-fade-in text-xs text-slate-450 leading-relaxed">
                  <p className="font-bold text-emerald-400">👉 Owner's Verification Queue:</p>
                  <p>In the reseller admin panel, a new entry logs automatically into the <strong>"Pending Approvals Ledger"</strong>.</p>
                  <div className="p-2.5 bg-emerald-500/5 rounded border border-emerald-500/15 flex justify-between items-center text-[10.5px]">
                    <div>
                      <strong className="text-white">Emeka Obi (₦500)</strong>
                      <span className="block text-[9.5px] text-slate-500 font-mono">Ref: TRF_9102830198AB</span>
                    </div>
                    <button className="px-2 py-1 bg-emerald-600 font-extrabold rounded text-white text-[9.5px]">
                      Approve Payment & Spawn PIN
                    </button>
                  </div>
                </div>
              )}

              {activeVisualStep === 3 && (
                <div className="space-y-2 animate-fade-in text-xs text-slate-450 leading-relaxed">
                  <p className="font-bold text-brand-400">👉 Voucher Spawned & Dispatched:</p>
                  <p>Instantly, a random code <strong>"WIFI_7392_OP"</strong> is registered. Dispatch alerts initiate:</p>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="text-brand-300">📱 WhatsApp Client Redirect:</p>
                    <p>wa.me Prefilled: "Your payment of ₦500 was confirmed! Your Starlink WiFi Passcode PIN is W-7392"</p>
                  </div>
                </div>
              )}

            </div>

            <div className="flex justify-center gap-3">
              <button 
                onClick={onEnterReseller}
                className="px-5 py-2.5 bg-brand-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 hover:bg-brand-600 transition-colors"
              >
                Go Test This Simulation Flow <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Modern Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-black text-brand-500 uppercase tracking-widest block">ROBUST FEATURES PLATFORM</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Engineered for African Mini-ISP Resellers</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Everything you need to launch, scale, and manage Starlink high-speed internet distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoFeatures.map((feat, i) => (
            <div key={i} className="p-6 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4 text-left hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Relational Database DDL Schema Section (What backend do you recommend?) */}
      <section id="sql-integration" className="py-20 bg-slate-950 px-6 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">REAL WORKSPACE SCALING</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Production Database Integration</h2>
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
              Ready to replace simulated mock data with cloud storage? We strongly recommend deploying a <strong>PostgreSQL instance (on Supabase/Neon)</strong> or <strong>Firebase Firestore (configured with one click inside AI Studio)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Recommendations Side */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-brand-400 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Firebase (NoSQL Recommendation)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  The easiest way to move to cloud production inside Google AI Studio. Fire the `set_up_firebase` workspace integration tool. It immediately pins stable state records with zero server setup overhead.
                </p>
                <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded border border-slate-900">
                  ⚡ Firebase Firestore database with instant deployment rules is supportable!
                </div>
              </div>

              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-purple-400 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Relational SQL Setup (Supabase / Neon)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Copy our custom optimized DDL SQL script shown on the right, create a PostgreSQL database on Supabase or Neon, and paste this script directly into their SQL editor to build all necessary application tables.
                </p>
              </div>

              {/* Secure Login suggestion summary */}
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-sky-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Production Auth Workflow
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  In a real production environment, we deploy individual sign-in pages (via Google Sign-In or Magic Passwordless Links) so subscribers only access their vouchers, and resellers access their ledger dashboard safely without role switchers.
                </p>
              </div>
            </div>

            {/* Right Interactive SQL Editor Display side */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-850 px-4 py-3 rounded-t-2xl">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono text-slate-400 ml-2 font-bold uppercase">WiFiSplit_Schema.sql</span>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  {copiedSQL ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied To Clipboard!
                    </>
                  ) : (
                    <>
                      <Code className="w-3 h-3" /> Copy SQL Code
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 border-t-0 p-4 rounded-b-2xl max-h-[440px] overflow-y-auto scrollbar-thin text-left">
                <pre className="text-slate-350 font-mono text-[10.5px] leading-relaxed overflow-x-auto whitespace-pre">
                  {recommendedSQL}
                </pre>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Subscription Pricing Matrix Profiles */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-6 space-y-12">
        
        <div className="text-center space-y-3">
          <span className="text-xs font-black text-brand-500 uppercase tracking-widest block">FLEXIBLE RESELLER TIER PLANS</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Reseller Nodes Subscription Pricing</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose the membership tier profile that fits your local community hotspot size. Keep track of customer limits directly in client dashboard settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter Plan card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full inline-block">
                Starter Node
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase">Starter Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">₦15,000</span>
                  <span className="text-xs text-slate-500 font-bold">/ Month</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800 pt-4 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Max Hotspot active customers: <strong className="text-white ml-auto">{activePlanLimits.starter}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Monthly vouchers: <strong className="text-white ml-auto">300</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  WhatsApp credits inclusive: <strong className="text-white ml-auto">500</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Manual NGN billing validation
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterReseller}
              className="w-full py-3 bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-white uppercase transition-all"
            >
              Configure Starter Demo Node
            </button>
          </div>

          {/* Growth Plan card */}
          <div className="p-6 bg-slate-900 border-2 border-brand-500 rounded-2xl space-y-6 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-brand-500/5 scale-[1.03]">
            <div className="absolute top-0 right-0 bg-brand-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl font-mono">
              Demo Active
            </div>
            
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black bg-brand-500 text-slate-950 px-2.5 py-1 rounded-full inline-block">
                Most Popular Node
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase">Growth Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">₦35,000</span>
                  <span className="text-xs text-slate-500 font-bold">/ Month</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800 pt-4 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Max Hotspot active customers: <strong className="text-white ml-auto">{activePlanLimits.growth}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Monthly vouchers: <strong className="text-white ml-auto">1,000</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  WhatsApp credits inclusive: <strong className="text-white ml-auto">3,000</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  Up to 3 Hotspot Areas
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterReseller}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black rounded-xl text-xs uppercase transition-all"
            >
              Enter Dashboard Active Demo
            </button>
          </div>

          {/* Business Pro card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full inline-block">
                Enterprise Node
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase">Business Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">₦75,000</span>
                  <span className="text-xs text-slate-500 font-bold">/ Month</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800 pt-4 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  Max Hotspot active customers: <strong className="text-white ml-auto">{activePlanLimits.business}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  Monthly vouchers: <strong className="text-white ml-auto">20,000</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  Hotspot Locations: <strong className="text-white ml-auto">5 Areas</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  Custom Transfer API & Resend email
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterReseller}
              className="w-full py-3 bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-white uppercase transition-all"
            >
              Configure Business Pro Demo
            </button>
          </div>

        </div>

      </section>

      {/* FAQ and Offline Captive Portal clarifications */}
      <section className="py-20 bg-slate-950 px-6 border-t border-slate-800/60 text-left">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-brand-500 uppercase tracking-widest block">HELPFUL DOCUMENTATION</span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight text-center">Frequently Answered Queries</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "For production, how do Subscribers log in without a manual 'role switcher' in the top bar?",
                a: "In production, the subscriber's phone gets absolute auto-redirect by the router (via hotspot protocols) to the localized Captive Portal layout. The subscriber doesn't see a navigation toolbar, role switchers, or general admin. Instead, they see a simple card showing prices, and bank transfer credentials. They get their voucher automatically. Resellers login with standard passwords/Auth in another remote tab entirely."
              },
              {
                q: "What routing hardware is recommended for WiFiSplit deployment?",
                a: "We highly recommend standard MikroTik Routerboards (like the hAP ax2 or hEX series) connected direct to your Starlink Dish. We configure a localized Captive Portal theme inside MikroTik files pointing login queries dynamically to our production API webhook."
              },
              {
                q: "Why are bank transfers validated manually instead of via automatic APIs?",
                a: "In Nigeria, local bank transaction charges can reach up to 1.5% to 2% + ₦100 flat via formal gateways. For ₦500 daily vouchers, this eats up massive profits. Manual transfer review is the preferred high-profit alternative in Sub-Saharan cybercafes, keeping transaction margins at 0.0%!"
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center text-xs font-black uppercase text-white tracking-tight text-left"
                >
                  <span>💬 {faq.q}</span>
                  <span className="text-brand-400 font-mono text-xs">{activeFaq === idx ? '▲' : '▼'}</span>
                </button>
                {(activeFaq === idx || idx === 0) && (
                  <p className="mt-3.5 text-xs text-slate-400 leading-relaxed font-semibold pl-4 border-l border-brand-500/20">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Ultimate CTA Segment */}
      <section className="bg-gradient-to-t from-slate-950 to-slate-900 py-16 px-6 text-center space-y-6 border-t border-slate-800">
        <h3 className="text-xl md:text-2xl font-extrabold text-white">Ready to test the proof-of-concept?</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Switch roles or configure plans using our integrated sandbox layout below.
        </p>
        <div className="flex justify-center gap-3">
          <button 
            onClick={onEnterReseller}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl text-xs font-black uppercase transition-colors shadow-md shadow-brand-500/15"
          >
            Enter Reseller Admin Portal
          </button>
          <button 
            onClick={onEnterSubscriber}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white uppercase transition-colors"
          >
            Enter Subscriber Portal
          </button>
        </div>
      </section>

    </div>
  );
}
