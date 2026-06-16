/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HotspotBusiness, HotspotPlan, Voucher, Customer, PaymentRequest, SaaSPlan 
} from './types';
import { 
  DefaultBusiness, DefaultPlans, DefaultCustomers, DefaultVouchers, 
  DefaultPaymentRequests,
  loadLocalData, saveLocalData, SaaSPlans 
} from './data';
import SetupWizard from './components/SetupWizard';
import PrintSlips from './components/PrintSlips';
import CustomerPortal from './components/CustomerPortal';
import OwnerDashboard from './components/OwnerDashboard';
import LandingPage from './components/LandingPage';
import ResellerAuthLogin from './components/ResellerAuthLogin';
import SubscriberAuthLogin from './components/SubscriberAuthLogin';

import { 
  Wifi, HelpCircle, Activity, LayoutGrid, Info, ArrowUpRight, 
  RotateCcw, Sparkles, AlertCircle, RefreshCw, Layers, PhoneCall, ShieldAlert, Smartphone
} from 'lucide-react';

export default function App() {
  // 1. Core Persistent States from localStorage (acts as synchronous fast initial load and safe offline fallback)
  const [business, setBusiness] = useState<HotspotBusiness>(() => {
    const loaded = loadLocalData<HotspotBusiness>('business_profile', DefaultBusiness);
    if (!loaded.bankName || loaded.bankName.includes('Moniepoint')) {
      const updated = {
        ...loaded,
        bankName: 'Opay',
        bankAccountNo: '8123456789',
        bankAccountName: 'Yaba Wireless Links',
        paymentInstructions: 'Transfer exact amount to our Opay account. Specify transaction ref. Vouchers auto-generate post manual confirmation!'
      };
      saveLocalData('business_profile', updated);
      return updated;
    }
    return loaded;
  });

  const [plans, setPlans] = useState<HotspotPlan[]>(() => {
    const loaded = loadLocalData<HotspotPlan[]>('plans', []);
    if (loaded.length < 10) {
      saveLocalData('plans', DefaultPlans);
      return DefaultPlans;
    }
    return loaded;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const loaded = loadLocalData<Voucher[]>('vouchers', DefaultVouchers);
    const hasOldPlans = loaded.some(v => v.planId && (v.planId.startsWith('p_') || !v.planId.startsWith('plan_')));
    if (hasOldPlans) {
      saveLocalData('vouchers', DefaultVouchers);
      return DefaultVouchers;
    }
    return loaded;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadLocalData<Customer[]>('customers', DefaultCustomers)
  );

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => 
    loadLocalData<PaymentRequest[]>('payment_requests', DefaultPaymentRequests)
  );

  const [isResellerAuthed, setIsResellerAuthed] = useState<boolean>(() => {
    return loadLocalData<boolean>('is_reseller_authed', false);
  });
  const [resellerUser, setResellerUser] = useState<any>(() => {
    return loadLocalData<any>('reseller_user', null);
  });
  const [isSubscriberAuthed, setIsSubscriberAuthed] = useState<boolean>(() => {
    return loadLocalData<boolean>('is_subscriber_authed', false);
  });

  useEffect(() => {
    saveLocalData('is_reseller_authed', isResellerAuthed);
  }, [isResellerAuthed]);

  useEffect(() => {
    saveLocalData('reseller_user', resellerUser);
  }, [resellerUser]);

  useEffect(() => {
    saveLocalData('is_subscriber_authed', isSubscriberAuthed);
  }, [isSubscriberAuthed]);

  // Multi-state helper UI elements
  const [showWizard, setShowWizard] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showIntegrityGuide, setShowIntegrityGuide] = useState(false);
  const [vouchersToPrint, setVouchersToPrint] = useState<Voucher[]>([]);
  const [deviceMockupView, setDeviceMockupView] = useState(false);
  
  // Live Database Sync Indicator Badge
  const [dbStatusInfo, setDbStatusInfo] = useState<{ status: string; error?: string; neonActive: boolean }>({
    status: 'checking',
    neonActive: false
  });
  const [currentRole, setCurrentRole] = useState<'landing' | 'owner' | 'customer'>('landing');
  const [currentSaaSTier, setCurrentSaaSTier] = useState<'starter' | 'growth' | 'business'>('starter');
  const [announcement, setAnnouncement] = useState('');

  // DB Sync helper API calls
  const updateBusinessApi = async (updatedBiz: HotspotBusiness) => {
    try {
      await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBiz),
      });
    } catch (e) {
      console.warn('API update business failed:', e);
    }
  };

  const savePlanApi = async (p: HotspotPlan) => {
    try {
      await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
    } catch (e) {
      console.warn('API save plan failed:', e);
    }
  };

  const deletePlanApi = async (id: string) => {
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete plan failed:', e);
    }
  };

  const saveCustomerApi = async (c: Customer) => {
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
    } catch (e) {
      console.warn('API save customer failed:', e);
    }
  };

  const submitPaymentRequestApi = async (pay: PaymentRequest) => {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pay),
      });
    } catch (e) {
      console.warn('API submit payment failed:', e);
    }
  };

  const saveVoucherApi = async (vch: Voucher) => {
    try {
      await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vch),
      });
    } catch (e) {
      console.warn('API save voucher failed:', e);
    }
  };

  // Synchronise state on load from Cloud DB if accessible
  useEffect(() => {
    async function loadAllDbData() {
      try {
        const statusRes = await fetch('/api/db-status');
        const ct = statusRes.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) {
          throw new Error('Server returned unparseable text format, the backend might be updating.');
        }
        const statusData = await statusRes.json();
        setDbStatusInfo(statusData);

        if (statusData.neonActive || statusData.firebaseActive) {
          const safeFetchJson = async (url: string) => {
            const r = await fetch(url);
            const rct = r.headers.get('content-type');
            if (!rct || !rct.includes('application/json')) {
              throw new Error(`Endpoint ${url} did not return JSON format.`);
            }
            return r.json();
          };

          const emailParam = resellerUser?.email_address ? `?email=${encodeURIComponent(resellerUser.email_address)}` : '';

          const [bizRes, planRes, vchRes, custRes, payRes] = await Promise.all([
            safeFetchJson(`/api/business${emailParam}`),
            safeFetchJson('/api/plans'),
            safeFetchJson('/api/vouchers'),
            safeFetchJson('/api/customers'),
            safeFetchJson('/api/payments'),
          ]);

          if (bizRes && bizRes.id) setBusiness(bizRes);
          if (planRes && Array.isArray(planRes)) setPlans(planRes);
          if (vchRes && Array.isArray(vchRes)) setVouchers(vchRes);
          if (custRes && Array.isArray(custRes)) setCustomers(custRes);
          if (payRes && Array.isArray(payRes)) setPaymentRequests(payRes);
          console.log('⚡ All components initialized from active online secure database collections.');
        }
      } catch (err) {
        console.warn('⚠️ API server unreachable. Running in stand-alone local localStorage simulation backup modes:', err);
        setDbStatusInfo({ status: 'simulation_standalone', neonActive: false });
      }
    }
    loadAllDbData();
  }, [resellerUser?.email_address]);

  // 3. Save states locally on trigger
  useEffect(() => {
    saveLocalData('business_profile', business);
  }, [business]);

  useEffect(() => {
    saveLocalData('plans', plans);
  }, [plans]);

  useEffect(() => {
    saveLocalData('vouchers', vouchers);
  }, [vouchers]);

  useEffect(() => {
    saveLocalData('customers', customers);
  }, [customers]);

  useEffect(() => {
    saveLocalData('payment_requests', paymentRequests);
  }, [paymentRequests]);


  // 4. State Modification Action bridges
  const handleOnboardingComplete = (newBiz: HotspotBusiness, initialPlan: HotspotPlan) => {
    setBusiness(newBiz);
    updateBusinessApi(newBiz);
    
    // Add plan if non-existent
    if (!plans.some((p) => p.name === initialPlan.name)) {
      setPlans([initialPlan, ...plans]);
      savePlanApi(initialPlan);
    }
    setShowWizard(false);
    
  };

  // Reset Sandbox data entirely
  const handleResetSandbox = () => {
    if (confirm("Are you sure you want to reset all data back to factory demo defaults? This will erase custom vouchers under review.")) {
      localStorage.clear();
      setBusiness(DefaultBusiness);
      setPlans(DefaultPlans);
      setVouchers(DefaultVouchers);
      setCustomers(DefaultCustomers);
      setPaymentRequests(DefaultPaymentRequests);
      setShowWizard(false);
      setShowPrintModal(false);
      alert("Platform database reset back to demo defaults!");
    }
  };

  // Submit payment from Customer screen
  const handleSubmitPaymentRequest = (pReqRaw: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'whatsappDelivered'>) => {
    const freshReq: PaymentRequest = {
      ...pReqRaw,
      id: `req_${Date.now()}`,
      status: 'Awaiting Approval',
      timestamp: new Date().toISOString(),
      whatsappDelivered: false
    };

    setPaymentRequests([freshReq, ...paymentRequests]);
    submitPaymentRequestApi(freshReq);
  };

  // Approve payment from Owner Queue
  const handleApprovePayment = async (id: string, spawnedVoucherCode?: string, spawnedVoucherId?: string) => {
    setPaymentRequests((prev) => 
      prev.map((r) => r.id === id ? { ...r, status: 'Approved' } : r)
    );
    try {
      await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          spawnedVoucherCode: spawnedVoucherCode || `PASS-${Math.floor(1000 + Math.random() * 9000)}`, 
          spawnedVoucherId: spawnedVoucherId || `v_auto_${Date.now()}` 
        })
      });
    } catch (e) {
      console.warn('API approval payload error:', e);
    }
  };

  const handleRejectPayment = async (id: string) => {
    setPaymentRequests((prev) => 
      prev.map((r) => r.id === id ? { ...r, status: 'Rejected' } : r)
    );
    try {
      await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.warn('API rejection failed:', e);
    }
  };

  // Register Printable View trigger
  const handleTriggerPrintSlips = (selected: Voucher[]) => {
    setVouchersToPrint(selected);
    setShowPrintModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-100 font-sans" id="applet-root">
      
      {/* Simulation control panel - Top Toolbar */}
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800 py-3.5 px-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-500 text-slate-950 flex items-center justify-center font-black text-sm tracking-tight select-none shadow-sm filter drop-shadow">
              W
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-black tracking-tight text-white uppercase block">
                  WiFiSplit™ Sandbox
                </span>
                {dbStatusInfo.neonActive ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/35">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                    Neon Live (Pooler)
                  </span>
                ) : (
                  <span 
                    className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[8.5px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase cursor-help select-none"
                    title="No external database connected. Utilizing browser-side local database so you can test features perfectly and independently."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Local Sandbox Storage
                  </span>
                )}
              </div>
              <p className="text-[9.5px] text-slate-400 font-medium">Interactive Multi-Tenant Simulation environment</p>
            </div>
          </div>

          {/* Interactive Role Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <span className="hidden lg:inline-block text-[9px] uppercase tracking-wider text-slate-500 font-black px-2 select-none">
              Navigation Roles:
            </span>

            <button
              id="role-switch-landing"
              onClick={() => { setCurrentRole('landing'); setDeviceMockupView(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                currentRole === 'landing' 
                  ? 'bg-brand-500 text-slate-950 font-black shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              🚀 Landing Page
            </button>
            
            <button
              id="role-switch-owner"
              onClick={() => { setCurrentRole('owner'); setDeviceMockupView(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                currentRole === 'owner' 
                  ? 'bg-brand-500 text-slate-950 font-black shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              🏢 Reseller Admin
            </button>

            <button
              id="role-switch-customer"
              onClick={() => setCurrentRole('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                currentRole === 'customer' 
                  ? 'bg-brand-500 text-slate-950 font-black shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              👤 Subscribers
            </button>
          </div>

          {/* Preset trigger controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIntegrityGuide(true)}
              title="Deployment Integrity & Launch Guide"
              className={`text-[10.5px] px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 border uppercase transition-all ${
                dbStatusInfo.neonActive || dbStatusInfo.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Integrity & Launch
            </button>

            <button
              onClick={() => setShowWizard(true)}
              className="text-[10px] bg-slate-800 border border-slate-700 hover:bg-slate-700/60 text-slate-200 font-bold px-3 py-1.5 rounded-lg smooth-transition"
            >
              ✨ Run Setup Wizard
            </button>

            <button
              onClick={handleResetSandbox}
              title="Reset LocalStorage defaults"
              className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-red-950 hover:text-red-300 rounded-lg text-slate-400 smooth-transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Core Body Container */}
      {currentRole === 'landing' && !showWizard ? (
        <LandingPage
          onEnterReseller={() => { setCurrentRole('owner'); setDeviceMockupView(false); }}
          onEnterSubscriber={() => setCurrentRole('customer')}
          activePlanLimits={{
            starter: '30 Users',
            growth: '100 Users',
            business: '200 Users'
          }}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* Onboarding Setup Wizard display override */}
          {showWizard ? (
            <div className="relative animate-fade-in">
              <div className="flex justify-end pr-2 -mb-6 relative z-10">
                <button
                  onClick={() => setShowWizard(false)}
                  className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10.5px] font-bold hover:bg-slate-950"
                >
                  Close Setup wizard
                </button>
              </div>
              <SetupWizard
                onComplete={handleOnboardingComplete}
                onCancel={() => setShowWizard(false)}
              />
            </div>
          ) : (
            <>
              {/* View layout container */}
              {currentRole === 'owner' && (
                !isResellerAuthed ? (
                  <ResellerAuthLogin 
                    onSuccess={(email, user) => {
                      setIsResellerAuthed(true);
                      if (user) {
                        setResellerUser(user);
                        // Sync business profile states with corresponding name, location, and contact parameters
                        setBusiness(prev => ({
                          ...prev,
                          businessName: user.business_name || user.businessName || prev.businessName,
                          phone: user.whatsapp_number || user.whatsappNumber || prev.phone,
                          whatsapp: user.whatsapp_number || user.whatsappNumber || prev.whatsapp,
                          location: user.business_address || user.businessAddress || prev.locationOpen || prev.location,
                        }));
                      }
                    }} 
                    onCancel={() => setCurrentRole('landing')} 
                  />
                ) : (
                  <OwnerDashboard
                    business={business}
                    resellerUser={resellerUser}
                    onUpdateBusiness={(b) => { setBusiness(b); updateBusinessApi(b); }}
                    plans={plans}
                    onAddPlan={(newP) => { setPlans([newP, ...plans]); savePlanApi(newP); }}
                    onUpdatePlan={(upP) => { setPlans(plans.map((p) => p.id === upP.id ? upP : p)); savePlanApi(upP); }}
                    onDeletePlan={(delId) => { setPlans(plans.filter((p) => p.id !== delId)); deletePlanApi(delId); }}
                    vouchers={vouchers}
                    onAddVoucher={(newV) => { setVouchers([newV, ...vouchers]); saveVoucherApi(newV); }}
                    onUpdateVoucher={(upV) => { setVouchers(vouchers.map((v) => v.id === upV.id ? upV : v)); saveVoucherApi(upV); }}
                    onBulkAddVouchers={(vList) => { setVouchers([...vList, ...vouchers]); vList.forEach(v => saveVoucherApi(v)); }}
                    customers={customers}
                    onUpdateCustomer={(upC) => { setCustomers(customers.map((c) => c.id === upC.id ? upC : c)); saveCustomerApi(upC); }}
                    onAddCustomer={(newC) => { setCustomers([newC, ...customers]); saveCustomerApi(newC); }}
                    paymentRequests={paymentRequests}
                    onApprovePayment={handleApprovePayment}
                    onRejectPayment={handleRejectPayment}
                    saasPlans={SaaSPlans}
                    currentSaaSTier={currentSaaSTier}
                    onUpgradeSaaSTier={setCurrentSaaSTier}
                    announcement={announcement}
                    triggerPrintView={handleTriggerPrintSlips}
                    onLogout={() => { setIsResellerAuthed(false); setResellerUser(null); }}
                  />
                )
              )}

              {currentRole === 'customer' && (
                !isSubscriberAuthed ? (
                  <SubscriberAuthLogin 
                    onSuccess={() => setIsSubscriberAuthed(true)} 
                    onCancel={() => setCurrentRole('landing')} 
                  />
                ) : (
                  <CustomerPortal
                    vouchers={vouchers}
                    plans={plans}
                    business={business}
                    paymentRequests={paymentRequests}
                    onSubmitPaymentRequest={handleSubmitPaymentRequest}
                    onClearHistory={() => {
                      if (confirm("Reset local consumer sandbox vouchers history?")) {
                        setVouchers(DefaultVouchers);
                      }
                    }}
                    onLogout={() => { setIsSubscriberAuthed(false); }}
                  />
                )
              )}


            </>
          )}

        </main>
      )}

      {/* Global Printable Slips Modal Overlay */}
      {showPrintModal && (
        <PrintSlips
          vouchers={vouchersToPrint}
          businessName={business.businessName}
          coverageArea={business.coverageArea}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Production & Data Integrity Help Hub Overlay */}
      {showIntegrityGuide && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="integrity-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <ShieldAlert className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Production Launch & Data Integrity Hub</h3>
                  <p className="text-[10.5px] text-slate-400">Understanding your deployment, hosting environments, and database persistence</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIntegrityGuide(false)}
                className="text-slate-400 hover:text-white font-mono text-sm bg-slate-800/50 hover:bg-slate-800 px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-slate-300 text-xs md:text-sm leading-relaxed">
              
              {/* Box 1: Why you see console errors / offline warning */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <h4 className="font-extrabold text-[11px] md:text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Why do I see "API server unreachable / 404 / fallbacks" in the console?
                </h4>
                <p className="text-[11px] md:text-xs text-slate-300">
                  You are currently accessing this application on a <strong>pure client-side static web hosting domain</strong> (such as <code className="text-amber-200">www.810555.xyz</code>). 
                  Because static hosts only serve pre-rendered HTML/JS bundles and do not run a active background <strong>Node.js server process</strong>, any relative API fetches to <code className="text-amber-200">/api/*</code> 
                  will return standard static host 404 response pages.
                </p>
                <p className="text-[11px] md:text-xs text-slate-400 font-medium bg-slate-950/40 p-2.5 rounded border border-slate-800">
                  💡 <strong>No worries!</strong> The app includes built-in <strong>High-Integrity LocalStorage Database Mirroring</strong>. 
                  If the server is unreachable, the frontend automatically transfers your sessions into your browser's local sandbox data registry. Any accounts, vouchers, 
                  and internet plans you configure are kept safely in your active browser session!
                </p>
              </div>

              {/* Box 2: How Data Integrity is handled in Full-stack mode */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-[11px] md:text-xs uppercase tracking-wider text-white">
                  🛡️ Multi-Tier Server Data Integrity Features
                </h4>
                <p className="text-[11px] md:text-xs text-slate-400">
                  When deployed with its default backend service on a Node.js runtime, the application guarantees extreme transaction safety through the following technologies already built into your codebase:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-tight">1. Relational PostgreSQL Core</span>
                    <p className="text-[9.5px] text-slate-400 leading-snug">
                      Supports direct automated schema builds, unique multi-tenant indexing constraints, and serial auto-increment protection targeting Neon DB pools.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-tight">2. db_sandbox.json Persistence</span>
                    <p className="text-[9.5px] text-slate-400 leading-snug">
                      A background JSON database engine that serializes memories securely into local file-system documents to survive cold-starts and system restarts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 3: 3-Step Public Launch Instructions */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-[11px] md:text-xs uppercase tracking-wider text-brand-400">
                  🚀 Launching for Public & Commercial Use (3 Steps)
                </h4>
                <p className="text-[11px] md:text-xs text-slate-400">
                  To launch this portal commercially supporting hundreds of concurrent customer devices with full data integration:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[11px] md:text-xs pl-2 text-slate-300">
                  <li>
                    <strong>Host as a Dynamic Web Application</strong>: Run the app using containers or Node.js on hosts that support continuous backend execution (e.g., <strong>Google Cloud Run</strong>, Render, Railway, Fly.io, or VPS). <em>Avoid deploying only built static folders (*dist/) to pure-static CDN hosting platforms.</em>
                  </li>
                  <li>
                    <strong>Execute the Integrated Build Pipeline</strong>: Running <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 border border-slate-800 text-[10.5px]">npm run build</code> compiles the Vite asset tree and bundles your Express <code className="text-indigo-300">server.ts</code> securely into a production-optimized CJS Node module in <code className="text-emerald-300">dist/server.cjs</code>.
                  </li>
                  <li>
                    <strong>Connect Database Credentials</strong>: Inject your Postgres secrets through the <code className="text-brand-300">DATABASE_URL</code> environment variable. The backend automatically initializes SQL database schemas on deployment.
                  </li>
                </ol>
              </div>

            </div>

            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <span className="text-slate-500 font-mono text-[10px]">Current Status: {dbStatusInfo.neonActive ? '🟢 Connected Live Backend' : '🟡 Standalone Client Simulation'}</span>
              <button 
                onClick={() => setShowIntegrityGuide(false)}
                className="bg-brand-500 text-slate-950 hover:bg-brand-400 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wide cursor-pointer text-center"
              >
                Understood & Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer Credentials */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 px-4 text-center mt-12 print:hidden text-xs">
        <div className="max-w-7xl mx-auto space-y-1.5 font-medium">
          <p className="text-slate-300 font-extrabold flex items-center justify-center gap-1.5 uppercase tracking-wider">
            📶 WIFISPLIT PLATFORM
          </p>
          <p className="text-[11px]">
            Designed for Starlink neighborhood hotspot resellers, mini-ISPs, cybercafes, and hostel Wi-Fi business operators.
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            © 2026 WiFiSplit Inc. Built for low-bandwidth environments in Sub-Saharan Africa. All connection simulations run server-safe and offline.
          </p>

        </div>
      </footer>

    </div>
  );
}
