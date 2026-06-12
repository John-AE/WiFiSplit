/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HotspotBusiness, HotspotPlan, Voucher, Customer, ActiveSession, 
  TenantHotspotBusiness, PaymentRequest, WhatsAppMessageLog, SaaSPlan 
} from './types';
import { 
  DefaultBusiness, DefaultPlans, DefaultCustomers, DefaultVouchers, 
  DefaultSessions, DefaultPaymentRequests, DefaultSuperTenants, DefaultMessageLogs, 
  loadLocalData, saveLocalData, SaaSPlans 
} from './data';
import SetupWizard from './components/SetupWizard';
import PrintSlips from './components/PrintSlips';
import SaaSSuperAdmin from './components/SaaSSuperAdmin';
import CustomerPortal from './components/CustomerPortal';
import OwnerDashboard from './components/OwnerDashboard';
import LandingPage from './components/LandingPage';

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

  const [sessions, setSessions] = useState<ActiveSession[]>(() => 
    loadLocalData<ActiveSession[]>('sessions', DefaultSessions)
  );

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => 
    loadLocalData<PaymentRequest[]>('payment_requests', DefaultPaymentRequests)
  );

  const [tenants, setTenants] = useState<TenantHotspotBusiness[]>(() => 
    loadLocalData<TenantHotspotBusiness[]>('tenants', DefaultSuperTenants)
  );

  const [messageLogs, setMessageLogs] = useState<WhatsAppMessageLog[]>(() => 
    loadLocalData<WhatsAppMessageLog[]>('message_logs', DefaultMessageLogs)
  );

  const [announcement, setAnnouncement] = useState<string>(() => 
    loadLocalData<string>('saas_announcement', '📢 ANNOUNCEMENT: Starlink latency optimization scheduled for all West-African nodes on June 15, expected to shave ping down by an average of 10ms!')
  );

  const [currentSaaSTier, setCurrentSaaSTier] = useState<'starter' | 'growth' | 'business'>(() => 
    loadLocalData<'starter' | 'growth' | 'business'>('saas_tier', 'growth')
  );

  // 2. Active Session Testing Role
  const [currentRole, setCurrentRole] = useState<'landing' | 'owner' | 'customer' | 'super'>('landing');

  // Multi-state helper UI elements
  const [showWizard, setShowWizard] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [vouchersToPrint, setVouchersToPrint] = useState<Voucher[]>([]);
  const [deviceMockupView, setDeviceMockupView] = useState(false);
  
  // Admin passcode modal state
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

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

  const saveMsgLogApi = async (log: WhatsAppMessageLog) => {
    try {
      await fetch('/api/message-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (e) {
      console.warn('API save message log failed:', e);
    }
  };

  const disconnectSessionApi = async (id: string) => {
    try {
      await fetch('/api/sessions/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.warn('API disconnect session failed:', e);
    }
  };

  const postAnnouncementApi = async (content: string) => {
    try {
      await fetch('/api/operator/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement: content }),
      });
    } catch (e) {
      console.warn('API post announcement failed:', e);
    }
  };

  const upgradeSaaSTierApi = async (tier: string) => {
    try {
      await fetch('/api/operator/saas-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saasTier: tier }),
      });
    } catch (e) {
      console.warn('API upgrade SaaS level failed:', e);
    }
  };

  // Synchronise state on load from Cloud DB if accessible
  useEffect(() => {
    async function loadAllDbData() {
      try {
        const statusRes = await fetch('/api/db-status');
        const statusData = await statusRes.json();
        setDbStatusInfo(statusData);

        if (statusData.neonActive) {
          const [bizRes, planRes, vchRes, custRes, payRes, logRes, opRes] = await Promise.all([
            fetch('/api/business').then(r => r.json()),
            fetch('/api/plans').then(r => r.json()),
            fetch('/api/vouchers').then(r => r.json()),
            fetch('/api/customers').then(r => r.json()),
            fetch('/api/payments').then(r => r.json()),
            fetch('/api/message-logs').then(r => r.json()),
            fetch('/api/operator').then(r => r.json())
          ]);

          if (bizRes && bizRes.id) setBusiness(bizRes);
          if (planRes && Array.isArray(planRes)) setPlans(planRes);
          if (vchRes && Array.isArray(vchRes)) setVouchers(vchRes);
          if (custRes && Array.isArray(custRes)) setCustomers(custRes);
          if (payRes && Array.isArray(payRes)) setPaymentRequests(payRes);
          if (logRes && Array.isArray(logRes)) setMessageLogs(logRes);
          if (opRes) {
            if (opRes.announcement) setAnnouncement(opRes.announcement);
            if (opRes.saasTier) setCurrentSaaSTier(opRes.saasTier);
          }
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
    saveLocalData('sessions', sessions);
  }, [sessions]);

  useEffect(() => {
    saveLocalData('payment_requests', paymentRequests);
  }, [paymentRequests]);

  useEffect(() => {
    saveLocalData('tenants', tenants);
  }, [tenants]);

  useEffect(() => {
    saveLocalData('message_logs', messageLogs);
  }, [messageLogs]);

  useEffect(() => {
    saveLocalData('saas_announcement', announcement);
  }, [announcement]);

  useEffect(() => {
    saveLocalData('saas_tier', currentSaaSTier);
  }, [currentSaaSTier]);


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
    
    // Auto add setup business to tenant log list
    const isPresent = tenants.some(t => t.businessName.toLowerCase() === newBiz.businessName.toLowerCase());
    if (!isPresent) {
      const newTenant: TenantHotspotBusiness = {
        id: newBiz.id,
        businessName: newBiz.businessName,
        ownerEmail: 'johnnybgsu@gmail.com',
        ownerName: 'Johnny BGSU',
        joinedDate: new Date().toISOString().split('T')[0],
        planId: 'growth',
        status: 'active',
        totalVouchersSold: 1,
        totalRevenueNaira: initialPlan.price
      };
      setTenants([newTenant, ...tenants]);
    }
  };

  // Reset Sandbox data entirely
  const handleResetSandbox = () => {
    if (confirm("Are you sure you want to reset all data back to factory demo defaults? This will erase custom vouchers under review.")) {
      localStorage.clear();
      setBusiness(DefaultBusiness);
      setPlans(DefaultPlans);
      setVouchers(DefaultVouchers);
      setCustomers(DefaultCustomers);
      setSessions(DefaultSessions);
      setPaymentRequests(DefaultPaymentRequests);
      setTenants(DefaultSuperTenants);
      setMessageLogs(DefaultMessageLogs);
      setAnnouncement('📢 ANNOUNCEMENT: Starlink latency optimization scheduled for all West-African nodes on June 15, expected to shave ping down by an average of 10ms!');
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

            {currentRole === 'super' && (
              <button
                id="role-switch-super"
                onClick={() => { setCurrentRole('super'); setDeviceMockupView(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-purple-600 text-white font-black shadow-sm"
              >
                👑 SaaS Owner
              </button>
            )}
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
          onEnterSuperAdmin={() => setCurrentRole('super')}
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
                <OwnerDashboard
                  business={business}
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
                  sessions={sessions}
                  onDisconnectSession={(delId) => { setSessions(sessions.filter((s) => s.id !== delId)); disconnectSessionApi(delId); }}
                  paymentRequests={paymentRequests}
                  onApprovePayment={handleApprovePayment}
                  onRejectPayment={handleRejectPayment}
                  messageLogs={messageLogs}
                  onAddMessageLog={(newLog) => { setMessageLogs([newLog, ...messageLogs]); saveMsgLogApi(newLog); }}
                  saasPlans={SaaSPlans}
                  currentSaaSTier={currentSaaSTier}
                  onUpgradeSaaSTier={(tier) => { setCurrentSaaSTier(tier); upgradeSaaSTierApi(tier); }}
                  triggerPrintView={handleTriggerPrintSlips}
                  announcement={announcement}
                />
              )}

              {currentRole === 'customer' && (
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
                />
              )}

              {currentRole === 'super' && (
                <SaaSSuperAdmin
                  tenants={tenants}
                  saasPlans={SaaSPlans}
                  onUpdateTenants={setTenants}
                  onPostAnnouncement={(newAnn) => { setAnnouncement(newAnn); postAnnouncementApi(newAnn); }}
                  announcement={announcement}
                />
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
          <div className="pt-2">
            {currentRole === 'super' ? (
              <button 
                onClick={() => { setCurrentRole('owner'); alert('Exited SaaS Owner session. Reset to Reseller Admin.'); }}
                className="text-amber-400 hover:text-amber-300 text-[10px] font-mono transition-colors focus:outline-none bg-slate-950 px-3 py-1 rounded border border-amber-500/30"
              >
                🔒 EXIT_SUPER_SaaS_ADMIN_SESSION
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAdminPasscode('');
                  setAdminLoginError('');
                  setShowAdminLoginModal(true);
                }}
                className="text-slate-600 hover:text-brand-400 text-[10px] font-mono transition-colors focus:outline-none"
              >
                🔐 SYSTEM_SaaS_OPERATOR_ACCESS
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Hidden Admin Login Gateway Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-slate-100 font-sans">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-purple-950/50 rounded-full border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto text-xl animate-pulse">
                🛡️
              </div>
              <h3 className="text-base font-extrabold text-white">WiFiSplit SaaS Gateway</h3>
              <p className="text-xs text-slate-400">Authenticating core platform subscription controller</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">SaaS Admin Passcode</label>
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminLoginError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Trigger login
                      if (adminPasscode === 'admin123') {
                        setCurrentRole('super');
                        setShowAdminLoginModal(false);
                        setAdminPasscode('');
                      } else {
                        setAdminLoginError('ERR_INVALID_PASSCODE: Please verify credentials and retry.');
                      }
                    }
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center font-mono text-sm tracking-widest text-brand-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {adminLoginError && (
                <p className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2 rounded text-center leading-normal">
                  ⚠️ {adminLoginError}
                </p>
              )}

              <p className="text-[10px] text-slate-500 text-center font-mono">
                💡 Hint: Type <code className="text-purple-300 font-bold bg-slate-950 px-1 py-0.5 rounded">admin123</code> to access SaaS Owner deck
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAdminLoginModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (adminPasscode === 'admin123') {
                      setCurrentRole('super');
                      setShowAdminLoginModal(false);
                      setAdminPasscode('');
                    } else {
                      setAdminLoginError('ERR_INVALID_PASSCODE: Please verify credentials and retry.');
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  Authorize 🔑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
