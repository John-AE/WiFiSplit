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
  const [vouchersToPrint, setVouchersToPrint] = useState<Voucher[]>([]);
  const [deviceMockupView, setDeviceMockupView] = useState(false);
  
  // Live Database Sync Indicator Badge
  const [dbStatusInfo, setDbStatusInfo] = useState<{ status: string; error?: string; neonActive: boolean }>({
    status: 'checking',
    neonActive: false
  });

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

        if (statusData.neonActive) {
          const safeFetchJson = async (url: string) => {
            const r = await fetch(url);
            const rct = r.headers.get('content-type');
            if (!rct || !rct.includes('application/json')) {
              throw new Error(`Endpoint ${url} did not return JSON format.`);
            }
            return r.json();
          };

          const [bizRes, planRes, vchRes, custRes, payRes] = await Promise.all([
            safeFetchJson('/api/business'),
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
          console.log('⚡ All components initialized from Neon Postgres secure schemas.');
        }
      } catch (err) {
        console.warn('⚠️ API server unreachable. Running in stand-alone local localStorage simulation backup modes:', err);
        setDbStatusInfo({ status: 'simulation_standalone', neonActive: false });
      }
    }
    loadAllDbData();
  }, []);

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
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                    Sandbox Offline cache
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
