/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HotspotBusiness, HotspotPlan, Voucher, Customer, PaymentRequest, SaaSPlan } from '../types';
import { 
  Wifi, ShieldAlert, ArrowUpRight, TrendingUp, Users,
  Settings, Banknote, ListCollapse, Plus, Search, CheckCircle, XCircle, Trash2, 
  Copy, RefreshCw, Printer, AlertCircle, FileText, Smartphone, Ban, Settings2, Sparkles, Check, CheckCircle2, ChevronRight, Share2, Mail, ExternalLink
} from 'lucide-react';

interface OwnerDashboardProps {
  business: HotspotBusiness;
  onUpdateBusiness: (b: HotspotBusiness) => void;
  resellerUser?: any;
  plans: HotspotPlan[];
  onAddPlan: (p: HotspotPlan) => void;
  onUpdatePlan: (p: HotspotPlan) => void;
  onDeletePlan: (id: string) => void;
  vouchers: Voucher[];
  onAddVoucher: (v: Voucher) => void;
  onUpdateVoucher: (v: Voucher) => void;
  onBulkAddVouchers: (vList: Voucher[]) => void;
  customers: Customer[];
  onUpdateCustomer: (c: Customer) => void;
  onAddCustomer: (c: Customer) => void;
  paymentRequests: PaymentRequest[];
  onApprovePayment: (id: string, code?: string, vchId?: string) => void;
  onRejectPayment: (id: string) => void;
  saasPlans: SaaSPlan[];
  currentSaaSTier: string;
  onUpgradeSaaSTier: (tierId: 'starter' | 'growth' | 'business') => void;
  triggerPrintView: (selected: Voucher[]) => void;
  announcement: string;
  onLogout?: () => void;
}

export default function OwnerDashboard({
  business,
  onUpdateBusiness,
  resellerUser,
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  vouchers,
  onAddVoucher,
  onUpdateVoucher,
  onBulkAddVouchers,
  customers,
  onUpdateCustomer,
  onAddCustomer,
  paymentRequests,
  onApprovePayment,
  onRejectPayment,
  saasPlans,
  currentSaaSTier,
  onUpgradeSaaSTier,
  triggerPrintView,
  announcement,
  onLogout
}: OwnerDashboardProps) {

  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'payments' | 'plans' | 'customers' | 'billing' | 'reports'>('overview');

  // Paystack mock checkout state
  const [showPaystackCheckout, setShowPaystackCheckout] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SaaSPlan | null>(null);
  const [paystackEmail, setPaystackEmail] = useState('johnnybgsu@gmail.com');
  const [paystackCardNo, setPaystackCardNo] = useState('4084 0000 0000 1234');
  const [paystackExpiry, setPaystackExpiry] = useState('12/28');
  const [paystackCvv, setPaystackCvv] = useState('821');
  const [isPayingPaystack, setIsPayingPaystack] = useState(false);
  const [paystackSuccess, setPaystackSuccess] = useState(false);

  // Search filter states
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherFilterStatus, setVoucherFilterStatus] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');

  // Bulk parameters state
  const [bulkQty, setBulkQty] = useState<10 | 50 | 100 | 500>(10);
  const [bulkPlanId, setBulkPlanId] = useState<string>(plans[0]?.id || '');
  const [bulkDeviceLimit, setBulkDeviceLimit] = useState<number>(1);
  const [bulkPrefix, setBulkPrefix] = useState('');

  // Single Manual voucher creators states
  const [showSingleVchModal, setShowSingleVchModal] = useState(false);
  const [singleVPlanId, setSingleVPlanId] = useState(plans[0]?.id || '');
  const [singleVCustomerName, setSingleVCustomerName] = useState('');
  const [singleVCustomerPhone, setSingleVCustomerPhone] = useState('');
  const [singleVCustomerEmail, setSingleVCustomerEmail] = useState('');

  // Single Customer creator states
  const [showAddCustModal, setShowAddCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Setup Plan creators states
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(500);
  const [newPlanGb, setNewPlanGb] = useState(10);
  const [newPlanHours, setNewPlanHours] = useState(24);
  const [newPlanSpeed, setNewPlanSpeed] = useState(5);
  const [newPlanDevices, setNewPlanDevices] = useState(1);
  const [newPlanDesc, setNewPlanDesc] = useState('');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [alertMsgRef, setAlertMsgRef] = useState<string | null>(null);
  const [dispatchFeedback, setDispatchFeedback] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    voucherCode: string;
    planName: string;
    planPrice: number;
    emailStatus: 'Pending' | 'Sent Successfully' | 'API Key Missing (Simulated)' | 'Failed';
  } | null>(null);
  const emailStatus: 'Pending' | 'Sent Successfully' | 'API Key Missing (Simulated)' | 'Failed' = 'Pending';

  // Stats calculation
  const totalApprovalsNeeded = paymentRequests.filter((r) => r.status === 'Awaiting Approval').length;
  
  // Calculate revenue parameters
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const revenueToday = vouchers
    .filter(v => ['active', 'used'].includes(v.status) && v.dateCreated.startsWith(todayStr))
    .reduce((sum, v) => sum + v.planPrice, 0);

  const revenueWeekly = vouchers
    .filter(v => ['active', 'used'].includes(v.status) && v.dateCreated >= sevenDaysAgo)
    .reduce((sum, v) => sum + v.planPrice, 0);

  const revenueMonthly = vouchers
    .filter(v => ['active', 'used'].includes(v.status) && v.dateCreated >= thirtyDaysAgo)
    .reduce((sum, v) => sum + v.planPrice, 0);

  const activeVouchersTodayCount = vouchers.filter((v) => v.status === 'active').length;
  const expiredVouchersTodayCount = vouchers.filter((v) => v.status === 'expired').length;
  const totalVouchersSoldToday = vouchers.filter((v) => v.dateCreated.startsWith(todayStr)).length;

  // Most Popular Plan finder
  const planCounts: { [key: string]: number } = {};
  vouchers.forEach((v) => { planCounts[v.planName] = (planCounts[v.planName] || 0) + 1; });
  let mostPopularPlan = '₦500 Daily Plan';
  let maxCount = 0;
  Object.keys(planCounts).forEach((k) => {
    if (planCounts[k] > maxCount) {
      maxCount = planCounts[k];
      mostPopularPlan = k;
    }
  });

  // Handle Voucher Generates
  const generateRandomCode = (prefix = '') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O, 0, I, 1 for absolute legibility
    const part1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return (prefix ? prefix.toUpperCase() + '-' : '') + `${part1}-${part2}-${part3}`;
  };

  const handleBulkGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = plans.find((p) => p.id === bulkPlanId);
    if (!selectedPlan) return;

    const newVouchers: Voucher[] = [];
    for (let i = 0; i < bulkQty; i++) {
      newVouchers.push({
        id: `v_bulk_${Date.now()}_${i}`,
        code: generateRandomCode(bulkPrefix),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
        status: 'active',
        dateCreated: new Date().toISOString(),
        durationHours: selectedPlan.durationHours,
        dataLimitGb: selectedPlan.dataLimitGb,
        remainingDataGb: selectedPlan.dataLimitGb || 999,
        speedLimitMbps: selectedPlan.speedLimitMbps,
        isMultiDevice: selectedPlan.deviceLimit > 1,
        deviceLimit: selectedPlan.deviceLimit
      });
    }

    onBulkAddVouchers(newVouchers);
    triggerAlert(`Successfully bulk-generated ${bulkQty} vouchers for ${selectedPlan.name}! Ready to select & print slips.`);
  };

  const handleCreateSingleVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const selPlan = plans.find((p) => p.id === singleVPlanId);
    if (!selPlan) return;

    const newV: Voucher = {
      id: `v_single_${Date.now()}`,
      code: generateRandomCode(),
      planId: selPlan.id,
      planName: selPlan.name,
      planPrice: selPlan.price,
      status: 'active',
      dateCreated: new Date().toISOString(),
      durationHours: selPlan.durationHours,
      dataLimitGb: selPlan.dataLimitGb,
      remainingDataGb: selPlan.dataLimitGb || 999,
      speedLimitMbps: selPlan.speedLimitMbps,
      customerName: singleVCustomerName || undefined,
      customerPhone: singleVCustomerPhone || undefined,
      customerEmail: singleVCustomerEmail || undefined,
      isMultiDevice: selPlan.deviceLimit > 1,
      deviceLimit: selPlan.deviceLimit
    };

    onAddVoucher(newV);
    setShowSingleVchModal(false);

    const formattedRecipientName = singleVCustomerName || 'Valued Customer';
    const logContent = `Hello ${formattedRecipientName}\n\nYour Wi-Fi voucher is ready.\n\nPlan: ${selPlan.name}\nVoucher Code: ${newV.code}\nData: ${selPlan.dataLimitGb > 0 ? selPlan.dataLimitGb + ' GB' : 'Unlimited FUP'}\n\nThank you for choosing Starlink Elite Wi-Fi!`;

    triggerAlert(`Voucher ${newV.code} generated successfully!`);
    
    // Clear inputs for next launch
    setSingleVCustomerName('');
    setSingleVCustomerPhone('');
    setSingleVCustomerEmail('');
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName) return;

    const newPlan: HotspotPlan = {
      id: `p_new_${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      dataLimitGb: newPlanGb,
      durationHours: newPlanHours,
      speedLimitMbps: newPlanSpeed,
      deviceLimit: newPlanDevices,
      validityPeriodDays: Math.ceil(newPlanHours / 24),
      autoExpiry: true,
      description: newPlanDesc || `${newPlanGb}GB dynamic fast internet pass valid for ${newPlanHours} hours.`,
      isActive: true
    };

    onAddPlan(newPlan);
    setShowAddPlanModal(false);
    triggerAlert(`Plan "${newPlanName}" created! Customers can select and request it instantly.`);
    
    // Clear state
    setNewPlanName('');
    setNewPlanPrice(500);
    setNewPlanGb(10);
    setNewPlanHours(24);
    setNewPlanSpeed(5);
    setNewPlanDesc('');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newCust: Customer = {
      id: `c_new_${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      whatsapp: newCustPhone,
      totalSpend: 0,
      historyVouchersCount: 0,
      isSuspended: false,
      isBlacklisted: false,
      notes: newCustNotes,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onAddCustomer(newCust);
    setShowAddCustModal(false);
    triggerAlert(`Added new subscriber: ${newCustName}!`);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');
  };

  const handleApprovePayloadPayment = async (req: PaymentRequest) => {
    // 1. Generate high quality secure voucher first
    const associatedPlan = plans.find((p) => p.id === req.planId) || plans[0];
    const generatedVchId = `v_auto_aprv_${Date.now()}`;
    const generatedCode = generateRandomCode();
    
    // 2. Trigger parent approve payments with same code & id
    onApprovePayment(req.id, generatedCode, generatedVchId);

    const generatedVch: Voucher = {
      id: generatedVchId,
      code: generatedCode,
      planId: associatedPlan.id,
      planName: associatedPlan?.name || '₦500 Plan',
      planPrice: associatedPlan?.price || 500,
      status: 'active',
      dateCreated: new Date().toISOString(),
      durationHours: associatedPlan?.durationHours || 24,
      dataLimitGb: associatedPlan?.dataLimitGb || 10,
      remainingDataGb: associatedPlan?.dataLimitGb || 10,
      speedLimitMbps: associatedPlan?.speedLimitMbps || 5,
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      customerEmail: req.customerEmail,
      isMultiDevice: (associatedPlan?.deviceLimit || 1) > 1,
      deviceLimit: associatedPlan?.deviceLimit || 1
    };

    onAddVoucher(generatedVch);

    setDispatchFeedback({
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      customerEmail: req.customerEmail,
      voucherCode: generatedVch.code,
      planName: associatedPlan.name,
      planPrice: associatedPlan.price,
      emailStatus: req.customerEmail ? emailStatus : 'Pending'
    });

    triggerAlert(`Payment approved manually! Secure voucher (${generatedVch.code}) dispatched.`);
  };

  const handleCopy = (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-99999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.warn('Fallback copy failed', err);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const triggerAlert = (msg: string) => {
    setAlertMsgRef(msg);
    setTimeout(() => setAlertMsgRef(null), 4000);
  };

  // Filters
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.code.toLowerCase().includes(voucherSearch.toLowerCase()) || 
                          (v.customerName?.toLowerCase() || '').includes(voucherSearch.toLowerCase()) ||
                          v.planName.toLowerCase().includes(voucherSearch.toLowerCase());
    const matchesFilter = voucherFilterStatus === 'all' ? true : v.status === voucherFilterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div id="owner-dashboard" className="space-y-6">

      {/* Global alert toaster popup inside dashboard context */}
      {alertMsgRef && (
        <div className="fixed top-6 right-6 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 max-w-md animate-fade-in text-xs font-bold font-sans">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{alertMsgRef}</span>
        </div>
      )}

      {/* Announcement Notification Header */}
      {announcement && (
        <div className="bg-amber-50 border border-amber-250/90 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <strong className="font-extrabold uppercase text-[10px] bg-amber-200 border border-amber-300 text-amber-950 px-2.5 py-0.5 rounded-full mr-2">
              SaaS Announcements
            </strong>
            {announcement}
          </div>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-2xl font-bold border border-brand-100">
            {business.logoEmoji || '🛰️'}
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {resellerUser ? (resellerUser.business_name || resellerUser.businessName) : business.businessName} <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase">Growth Subscription</span>
            </h1>
            <p className="text-slate-500 text-[11px] font-bold mt-0.5">
              📧 Username: <strong className="text-slate-800">{resellerUser ? (resellerUser.email_address || resellerUser.emailAddress || resellerUser.email) : 'johnnybgsu@gmail.com'}</strong>
            </p>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              📍 Area: <strong>{resellerUser ? (resellerUser.business_address || resellerUser.businessAddress) : (business.location || 'Lagos Nigeria Area')}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 hover:text-rose-700 font-extrabold rounded-xl text-xs flex items-center gap-1.5 smooth-transition"
            >
              🚪 Sign Out
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('payments'); }} 
            className="relative px-3.5 py-2 hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 smooth-transition"
          >
            💳 Review Payments
            {totalApprovalsNeeded > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9.5px] w-5 h-5 rounded-full flex items-center justify-center border border-white animate-bounce">
                {totalApprovalsNeeded}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowSingleVchModal(true)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-emerald-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 smooth-transition shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Fast Single Voucher
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        
        {/* Rev Daily */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lagos Daily Sales</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <h3 className="text-xl font-extrabold text-slate-900">₦{revenueToday.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-2">vouchers sold: {totalVouchersSoldToday}</p>
        </div>

        {/* Rev Monthly */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Monthly Turnover</p>
          <div className="flex items-baseline mt-1.5">
            <h3 className="text-xl font-extrabold text-brand-700">₦{revenueMonthly.toLocaleString()}</h3>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-2">Active subs: {activeVouchersTodayCount}</p>
        </div>

        {/* Most Popular Plan */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Popular Wi-Fi Plan</p>
          <div className="mt-1.5">
            <h3 className="text-sm font-extrabold text-slate-800 truncate leading-tight uppercase bg-brand-50/50 p-1 rounded border border-brand-100 text-center">
              {mostPopularPlan}
            </h3>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-2">Validity auto-adjust is healthy</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs bar */}
      <div className="border-b border-rose-150 border-slate-200/80 flex flex-wrap gap-4 scrollbar-hidden">
        {[
          { id: 'overview', label: 'Dashboard & Analytics' },
          { id: 'vouchers', label: 'Voucher Hub & Bulks' },
          { id: 'payments', label: `Pending Approvals (${totalApprovalsNeeded})` },
          { id: 'plans', label: 'Internet Plans Manager' },
          { id: 'customers', label: 'Customers CRM' },
          { id: 'billing', label: '💳 Subscription (Paystack)' },
          { id: 'reports', label: 'Reports & Export' }
        ].map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 text-xs font-bold leading-none border-b-2 transition-all ${
                isSel ? 'border-brand-600 text-brand-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTAINER */}
      
      {/* Tab: Overview (Graphic charts & Quick tasks) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Custom SVG Sales Performance Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                    📈 Hotspot Revenue & Sales Trends
                  </h4>
                  <p className="text-[11px] text-slate-400 font-normal">Real-time daily analysis of Starlink customer subscriptions relative to previous weeks.</p>
                </div>
                <span className="text-[10.5px] text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full font-bold">
                  Weekly Average: ₦42,500
                </span>
              </div>

              {/* Handcrafted Animated Responsive SVG Chart */}
              <div className="relative h-64 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                
                {/* SVG Polyline Chart Core */}
                <svg className="absolute inset-x-8 bottom-8 top-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)]" viewBox="0 0 100 50" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#f1f5f9" strokeWidth="0.5" />

                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Smooth Filled polygon */}
                  <path d="M0,50 L0,40 L16,42 L32,25 L48,32 L64,15 L80,18 L100,8 L100,50 Z" fill="url(#chartGrad)" />

                  {/* Core Value Line */}
                  <polyline
                    fill="none"
                    stroke="#047857"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,40 16,42 32,25 48,32 64,15 80,18 100,8"
                  />
                  
                  {/* Interactive Hot points */}
                  <circle cx="16" cy="42" r="1.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                  <circle cx="32" cy="25" r="1.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                  <circle cx="48" cy="32" r="1.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                  <circle cx="64" cy="15" r="1.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                  <circle cx="80" cy="18" r="1.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                  <circle cx="100" cy="8" r="2" fill="#047857" stroke="#ffffff" strokeWidth="1" className="animate-ping" />
                </svg>

                {/* Left Values text tags */}
                <div className="flex flex-col justify-between h-full text-[9px] text-slate-400 font-bold pr-2 z-10 select-none">
                  <span>₦12,000 max</span>
                  <span>₦7,500 avg</span>
                  <span>₦200 min</span>
                </div>

                {/* Bottom week coordinates */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-1.5 px-6 z-10">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Today (Peak Starlink Volume)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight mb-4">
                🚀 Fast Admin Actions
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => setShowSingleVchModal(true)}
                  className="w-full text-left p-3 border border-slate-200 hover:border-brand-500 rounded-xl group hover:bg-brand-50/20 smooth-transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-800 uppercase">Single Voucher Generator</span>
                    <p className="text-[10px] text-slate-400">Instantly generate one client Wi-Fi password slip.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => { setActiveTab('vouchers'); }}
                  className="w-full text-left p-3 border border-slate-200 hover:border-brand-500 rounded-xl group hover:bg-brand-50/20 smooth-transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-800 uppercase">Run Bulk slip generation</span>
                    <p className="text-[10px] text-slate-400">Generate 10 to 500 vouchers in one batch.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="w-full text-left p-3 border border-slate-200 hover:border-brand-500 rounded-xl group hover:bg-brand-50/20 smooth-transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-800 uppercase font-bold">Add Custom Internet Plan</span>
                    <p className="text-[10px] text-slate-400 font-normal">Define a new NGN / data / hour pricing combination.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => setShowAddCustModal(true)}
                  className="w-full text-left p-3 border border-slate-200 hover:border-brand-500 rounded-xl group hover:bg-brand-50/20 smooth-transition flex items-center justify-between"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-800 uppercase">Register New Subscriber</span>
                    <p className="text-[10px] text-slate-400 font-normal font-medium">Capture names, phones, and profile flags manually.</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>
                {/* Quick Stats overview of limits */}
          <div className="bg-gradient-to-r from-emerald-950 to-brand-900 text-brand-100 rounded-2xl p-5 border border-brand-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 items-center">
              <span className="text-xl">🚀</span>
              <div>
                <p className="text-xs text-brand-300 font-bold uppercase tracking-wider">Active SaaS Subscription Dashboard Summary</p>
                <p className="text-xs text-emerald-200 mt-0.5">Using Growth Plan. Includes multiple hotspots support & high volume WhatsApp alerts.</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div>
                <span className="text-brand-300 text-[10px] block uppercase">Vouchers Generated</span>
                <strong className="text-white text-sm">{vouchers.length} / 2,500 this mo</strong>
              </div>

            </div>
          </div>

          {/* SaaS Alert Threshold & Email Settings Box */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-150">
              <span className="text-lg">📧</span>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  SaaS Plan Resource Warning Alerts & Settings
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Receive real-time notifications on your email when your hotspot system nears premium credit thresholds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="adminAlertEmailInput" className="block text-[10px] font-bold text-slate-600 uppercase">
                    Receiver Administrator Alert Email
                  </label>
                  <input
                    id="adminAlertEmailInput"
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={business.adminAlertEmail || ''}
                    onChange={(e) => {
                      onUpdateBusiness({
                        ...business,
                        adminAlertEmail: e.target.value
                      });
                    }}
                    className="w-full text-xs border border-slate-300 hover:border-slate-450 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                  <p className="text-[9.5px] text-slate-400 font-medium">
                    This primary address is where warning reports and weekly limits telemetry logs are dispatched.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-brand-50/45 border border-brand-200/60 rounded-xl">
                  <input
                    id="emailAlertsEnabledCheck"
                    type="checkbox"
                    checked={!!business.emailAlertsEnabled}
                    onChange={(e) => {
                      onUpdateBusiness({
                        ...business,
                        emailAlertsEnabled: e.target.checked
                      });
                      triggerAlert(
                        e.target.checked 
                          ? "📢 Email Warning alerts successfully activated in Firestore Database!" 
                          : "📢 Warning alerts deactivated successfully."
                      );
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div className="cursor-pointer select-none">
                    <label htmlFor="emailAlertsEnabledCheck" className="text-xs font-bold text-slate-800 block cursor-pointer">
                      Activate Limit & Quota Threshold Alerts
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                      Automatically triggers warning dispatch requests when Vouchers generated or WhatsApp Logs credits exceed <strong className="text-brand-800">80%</strong> and <strong className="text-brand-800">95%</strong> thresholds.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs flex gap-2">
                  <span className="text-brand-600">🔔</span>
                  <div>
                    <strong className="text-slate-800 block text-[10.5px]">Seeded Firebase Dispatch Engine:</strong>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Your preferences sync automatically with your cloud document storage on the <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">reseller_profiles</code> collection.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview Column representational content */}
              <div className="md:col-span-5 bg-slate-950 text-slate-100 rounded-xl p-4.5 border border-slate-800 font-mono text-[10.5px] leading-relaxed shadow-lg relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] bg-sky-500/20 text-sky-400 font-black border border-sky-500/30 px-1.5 py-0.5 rounded uppercase">
                  Alert Preview
                </span>
                <p className="text-brand-300 font-bold border-b border-slate-800 pb-1.5 mb-2 uppercase text-[9.5px]">
                  ✉️ Outgoing Resend Dispatch Template
                </p>
                <div className="space-y-1 text-slate-400">
                  <p><span className="text-slate-500">From:</span> alerts@wifisplit.ng</p>
                  <p><span className="text-slate-500">To:</span> <span className="text-white font-bold">{business.adminAlertEmail || 'johnnybgsu@gmail.com'}</span></p>
                  <p><span className="text-slate-500">Subject:</span> [CRITICAL WARNING] Hotspot Quota Usage Limit Warning</p>
                  <div className="border-t border-slate-800/80 my-2 pt-2 text-slate-300 leading-normal">
                    <p>Hello Hotspot Reseller,</p>
                    <p className="mt-1">Your hotspot account <span className="text-brand-300">"{business.businessName || 'Starlink Elite Wi-Fi'}"</span> is approaching its monthly SaaS subscription threshold limits:</p>
                    <ul className="list-disc pl-4 mt-1.5 text-brand-100 space-y-0.5 font-bold">
                      <li>Registered Vouchers: {vouchers.length} / 2,500 plans</li>
                    </ul>
                    <p className="mt-2 text-slate-400 text-[9.5px]">Configure your VITE_RESEND_API_KEY environment secret list to deploy live dispatch notifications to this address.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Vouchers (Hub & Generates) */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Generation Form Column (Bulk) */}
            <div className="md:col-span-5 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                ⚡ Automate Voucher Generation
              </h4>
              <p className="text-[11px] text-slate-500 mb-4 font-normal">
                Generates a secure, non-guessable alphanumeric code (e.g. <code>XQ72-MP41-LK9A</code>) configured in-line with your internet plans.
              </p>

              <form onSubmit={handleBulkGenerate} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Base Plan Formula</label>
                  <select
                    value={bulkPlanId}
                    onChange={(e) => setBulkPlanId(e.target.value)}
                    className="w-full text-xs font-extrabold border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₦{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Batch Vol. Qty</label>
                    <select
                      value={bulkQty}
                      onChange={(e: any) => setBulkQty(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                    >
                      <option value={10}>10 vouchers</option>
                      <option value={50}>50 vouchers</option>
                      <option value={100}>100 vouchers</option>
                      <option value={500}>500 vouchers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Optional Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. YABA"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full mt-4 bg-brand-800 hover:bg-brand-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 smooth-transition shadow-lg shadow-brand-900/10"
                  >
                    Bulk Generate Batch <Plus className="w-4.5 h-4.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* List & Slips Table column */}
            <div className="md:col-span-7 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">
                    📁 Generated Voucher inventory ({filteredVouchers.length})
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filter, extract details, or queue system print outs.</p>
                </div>
                
                <button
                  onClick={() => triggerPrintView(filteredVouchers)}
                  className="px-3.5 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 font-bold hover:bg-brand-100 rounded-lg text-xs flex items-center gap-1.5 smooth-transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Highlighted Slips
                </button>
              </div>

              {/* Search & Filter bar for vouchers */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
                <div className="relative col-span-2 md:col-span-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Code or Customer Name..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="w-full text-[10.5px] border border-slate-200 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={voucherFilterStatus}
                    onChange={(e) => setVoucherFilterStatus(e.target.value)}
                    className="w-full text-[10.5px] border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="all">All States</option>
                    <option value="active">Active</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredVouchers.map((v) => (
                  <div key={v.id} className="border border-slate-100 hover:border-brand-200/60 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50/10 transition-colors flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-extrabold text-slate-800 text-[12px]">{v.code}</code>
                        <button onClick={() => handleCopy(v.code)} className="text-slate-400 hover:text-slate-600">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        <span>Plan: <strong>{v.planName}</strong></span>
                        <span>Price: <strong>₦{v.planPrice}</strong></span>
                        {v.customerPhone && (
                          <span className="text-brand-600 font-semibold truncate max-w-[120px]">
                            📞 {v.customerName || v.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        v.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        v.status === 'used' ? 'bg-indigo-50 text-indigo-700' :
                        v.status === 'expired' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-700'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Tab: Payments (Manual verification queue) */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              💳 Manual Bank Transfer verification queue ({totalApprovalsNeeded} pending)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Review client transaction screenshots or uploaded references. Click APPROVE to spawn voucher PINs.
            </p>
          </div>

          {paymentRequests.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <span className="text-3xl">🎉</span>
              <h5 className="font-bold text-slate-700 mt-2">All payments fully audited!</h5>
              <p className="text-slate-400 text-xs mt-1">When customers submit payment notifications, they appear here instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentRequests.map((req) => (
                <div key={req.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-800 block text-xs">{req.customerName}</strong>
                      <span className="text-slate-400 text-[10px]">{new Date(req.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                      req.status === 'Awaiting Approval' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="p-4 grid grid-cols-12 gap-3 text-xs leading-normal">
                    {/* screenshot preview */}
                    <div className="col-span-5 border border-slate-250 rounded-lg overflow-hidden bg-slate-100 h-28 relative font-bold text-center text-slate-400 flex items-center justify-center">
                      {req.screenshotUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={req.screenshotUrl} 
                          alt="Screenshot validation receipt" 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span>No image</span>
                      )}
                      <span className="absolute bottom-1 bg-black/60 text-white rounded text-[8px] px-1.5">A4 screenshot</span>
                    </div>

                    <div className="col-span-7 space-y-1">
                      <p className="text-slate-400 uppercase text-[9px] tracking-wide font-black">Requested Item</p>
                      <p className="font-extrabold text-slate-800">{req.planName}</p>
                      <p className="font-bold text-brand-700 text-xs">Naira Transfer amount: ₦{req.planPrice}</p>
                      
                      <div className="pt-2">
                        <span className="text-[10px] block text-slate-400 uppercase tracking-wide">Client reported Ref</span>
                        <code className="text-xs bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-bold select-all block break-all">
                          {req.reference}
                        </code>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-400">WhatsApp: <strong>{req.customerPhone}</strong></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2">
                    {req.status === 'Awaiting Approval' ? (
                      <>
                        <button
                          onClick={() => handleApprovePayloadPayment(req)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs smooth-transition shadow-sm flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Payment
                        </button>
                        <button
                          onClick={() => onRejectPayment(req.id)}
                          className="py-2 px-3 border border-slate-250 hover:bg-slate-100 text-rose-600 font-bold rounded-lg text-xs smooth-transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-1 text-xs text-slate-400 italic">
                        Audited reference validated.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab: Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Active Internet Plans Catalog</h4>
              <p className="text-xs text-slate-400">Configure client facing rates, durations, and megabits speed policies.</p>
            </div>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 smooth-transition shadow-lg shadow-brand-900/10"
            >
              <Plus className="w-4.5 h-4.5" /> Define New Plan Formula
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.isActive ? 'Active Plan' : 'Paused / Frozen'}
                    </span>
                    <span className="font-extrabold text-blue-600 text-xs uppercase font-mono">⚡ {p.speedLimitMbps} Mbps</span>
                  </div>

                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-base leading-none">{p.name}</h4>
                  <div className="my-2.5 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">₦{p.price.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px] font-normal">local reseller fees</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal mb-3 font-medium min-h-12 border-b border-slate-50 pb-2">{p.description}</p>
                
                  {/* limits display */}
                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Threshold Quota:</span>
                      <span className="font-bold text-slate-800">{p.dataLimitGb > 0 ? `${p.dataLimitGb} GB` : 'Unlimited Fair Use'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Duration:</span>
                      <span className="font-bold text-slate-800">{p.durationHours} hours ({p.validityPeriodDays} day)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Concurrent Devices Limit:</span>
                      <span className="font-bold text-slate-800">{p.deviceLimit} device account</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-150 flex gap-2">
                  <button
                    onClick={() => {
                      const dup: HotspotPlan = {
                        ...p,
                        id: `p_dup_${Date.now()}`,
                        name: `${p.name} (Copy)`
                      };
                      onAddPlan(dup);
                      triggerAlert(`Duplicated plan "${p.name}"!`);
                    }}
                    className="flex-1 py-1.5 hover:bg-slate-100 border border-slate-250 text-slate-600 rounded-lg text-[10.5px] font-bold smooth-transition"
                  >
                    Duplicate Plan
                  </button>
                  <button
                    onClick={() => onDeletePlan(p.id)}
                    className="p-1 px-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg smooth-transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Customers */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Neighborhood Subscriber Registry</h4>
              <p className="text-xs text-slate-400">Review consumer profiles, check total expenditures, and manage block lists.</p>
            </div>
            
            <button
              onClick={() => setShowAddCustModal(true)}
              className="px-4 py-2 bg-brand-850 bg-slate-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 ml-auto"
            >
              <Plus className="w-4 h-4" /> Add Subscriber Node
            </button>
          </div>

          {/* Search registry */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers phone or details..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none"
            />
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-medium text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="p-4">Customer Name Details</th>
                    <th className="p-4">WhatsApp Contact</th>
                    <th className="p-4">Status & Flag</th>
                    <th className="p-4">Vouchers used</th>
                    <th className="p-4 text-right">Revenue Spent</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-center">CRM Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div>
                          <span className="font-extrabold text-slate-800">{cust.name}</span>
                          <p className="text-[10px] text-slate-400 italic max-w-[180px] truncate">{cust.notes || 'No custom notes.'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-mono">{cust.whatsapp}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          cust.isSuspended ? 'bg-red-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {cust.isSuspended ? 'Suspended' : 'Clear Health'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">{cust.historyVouchersCount} passes</td>
                      <td className="p-4 text-right font-extrabold text-slate-900 border-r border-slate-50">₦{cust.totalSpend.toLocaleString()}</td>
                      <td className="p-4 text-slate-500">{cust.joinedDate || '2026-01-10'}</td>
                      <td className="p-4 flex gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            const updatedCust = {
                              ...cust,
                              isSuspended: !cust.isSuspended
                            };
                            onUpdateCustomer(updatedCust);
                            triggerAlert(`Updated subscriber health profile for ${cust.name}!`);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold hover:opacity-85 ${
                            cust.isSuspended ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {cust.isSuspended ? 'Unsuspend' : 'Suspend 🚫'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Reports, Finance Audit Ledger, & Analytics Export</h4>
              <p className="text-xs text-slate-400">Generate printable PDF ledger lists or excel templates representing cumulative NGN revenue.</p>
            </div>
          <button
              onClick={() => {
                const headers = [
                  "Transaction ID", "Timestamp", "Customer Name",
                  "Contact Number", "Email Address", "Plan Name",
                  "Plan Price (NGN)", "Payment Reference", "Verification Status"
                ];
                const rows = paymentRequests.map(req => [
                  req.id,
                  req.timestamp ? req.timestamp : new Date().toISOString(),
                  `"${(req.customerName || '').replace(/"/g, '""')}"`,
                  `"${req.customerPhone || ''}"`,
                  `"${req.customerEmail || ''}"`,
                  `"${(req.planName || '').replace(/"/g, '""')}"`,
                  req.planPrice,
                  `"${(req.reference || '').replace(/"/g, '""')}"`,
                  req.status
                ]);

                const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `WiFiSplit_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-550/10"
            >
              <FileText className="w-4 h-4" /> Export Financial CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal font-medium text-slate-700">
            <div>
              <h5 className="font-extrabold text-slate-800 uppercase mb-2">reseller growth indices (Cumulative)</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span>Gross Transaction Volume:</span>
                  <strong className="text-slate-950">₦{revenueWeekly.toLocaleString()} (June week 1)</strong>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span>Vouchers Printed count:</span>
                  <strong className="text-slate-950">{vouchers.length} items logged</strong>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span>Failed Delivery Fallbacks:</span>
                  <strong className="text-emerald-700 font-bold">0% failed (High provider health)</strong>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span>Customer retention indices:</span>
                  <strong className="text-teal-700 font-bold">88.2% renewal rates after 24 hrs</strong>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-extrabold text-slate-800 uppercase mb-2">Most Profitable Internet Plan distribution</h5>
              <div className="space-y-2">
                {plans.map((p) => {
                  const itemsCount = vouchers.filter((v) => v.planId === p.id).length;
                  const itemRevenue = itemsCount * p.price;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{p.name}</span>
                        <strong>₦{itemRevenue.toLocaleString()} volume ({itemsCount} printed)</strong>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500" 
                          style={{ width: `${Math.max(5, Math.min(100, (itemsCount / vouchers.length) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SaaS Subscription & Paystack Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Header Billboard */}
          <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-2xl p-6 border border-brand-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 bg-brand-500 text-slate-950 font-black rounded-full text-[10px] uppercase tracking-wider">
                  WiFiSplit Reseller SaaS Account
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">Platform Subscription & Gateway Channels</h3>
                <p className="text-brand-200 text-xs mt-1 leading-normal max-w-xl">
                  Resellers (Starlink hotspot owners) pay a monthly subscription fee to keep their secure voucher portal, printable PDF generators, and WhatsApp notification alerts online.
                </p>
              </div>
              <div className="bg-slate-950/40 border border-brand-700/30 rounded-xl px-4 py-3 text-right">
                <span className="text-[10px] text-brand-300 block uppercase font-bold">Your Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active {currentSaaSTier.toUpperCase()} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {saasPlans.map((plan) => {
              const isActive = plan.id === currentSaaSTier;
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm relative transition-all ${
                    isActive 
                      ? 'ring-2 ring-brand-500 border-brand-500 scale-[1.02] md:-translate-y-1' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Active ribbon */}
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow">
                      ⭐ Current Active Subscription
                    </span>
                  )}

                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{plan.name}</h4>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 font-sans">₦{plan.priceNaira.toLocaleString()}</span>
                      <span className="text-slate-400 text-xs">/ month</span>
                    </div>

                    <p className="text-slate-500 text-[11px] mt-2 font-medium leading-normal border-b border-slate-100 pb-3">
                      Perfect to fuel neighborhood hotspot distribution. Billing processes securely via Paystack.
                    </p>

                    <ul className="mt-4 space-y-2">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-150">
                    {isActive ? (
                      <button 
                        disabled
                        className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 py-2.5 rounded-xl text-xs font-black text-center cursor-default uppercase"
                      >
                        ✓ Subscribed
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedUpgradePlan(plan);
                          setPaystackSuccess(false);
                          setIsPayingPaystack(false);
                          setShowPaystackCheckout(true);
                        }}
                        className="w-full bg-slate-900 text-white hover:bg-slate-950 hover:scale-[1.01] transition-transform py-2.5 rounded-xl text-xs font-bold text-center"
                      >
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure gateway trust notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-extrabold text-slate-800 uppercase text-[10px]">Secure Paystack Checkout Integration</p>
                <p className="text-slate-500">WiFiSplit leverages official Paystack authorization APIs for secure recurring collection channels.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="h-6 w-16 bg-slate-200 rounded flex items-center justify-center font-bold text-[8px] text-slate-500">VISA</span>
              <span className="h-6 w-16 bg-slate-200 rounded flex items-center justify-center font-bold text-[8px] text-slate-400/80">VERVE</span>
              <span className="h-6 w-16 bg-slate-200 rounded flex items-center justify-center font-bold text-[8px] text-brand-605 uppercase font-black text-emerald-600">paystack</span>
            </div>
          </div>
        </div>
      )}

      {/* Paystack Checkout Screen Modal */}
      {showPaystackCheckout && selectedUpgradePlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 font-sans text-slate-800 leading-normal z-50">
            
            {/* Paystack Top Header */}
            <div className="bg-[#3ac58e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-white text-[#3ac58e] font-black flex items-center justify-center text-xs">
                  P
                </span>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-emerald-950">Paystack Checkout</h4>
                  <p className="text-[10px] text-emerald-100">Securing your hotspot platform links</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-widest text-[#0c402b] font-bold block">Amount to Pay</span>
                <span className="text-sm font-black text-white">₦{selectedUpgradePlan.priceNaira.toLocaleString()}.00</span>
              </div>
            </div>

            {paystackSuccess ? (
              /* Success visual states */
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-105 text-[#3ac58e] rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
                  🎉
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Payment Successful!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your platform reseller node has been upgraded to <strong className="text-emerald-600 font-bold">{selectedUpgradePlan.name}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-left text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Transaction ID:</span>
                    <span className="font-bold text-slate-800">PSTK-TXN-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Authorized Key:</span>
                    <span className="font-bold text-slate-800">auth_9982x1z90</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SaaS Period:</span>
                    <span className="font-bold text-slate-800">30 Days (Renew July 12)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onUpgradeSaaSTier(selectedUpgradePlan.id);
                    setShowPaystackCheckout(false);
                  }}
                  className="w-full bg-[#3ac58e] hover:bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  Access Platform upgraded dashboard
                </button>
              </div>
            ) : (
              /* Fields filling forms screen */
              <div className="p-5 space-y-4 text-xs">
                
                {isPayingPaystack ? (
                  /* Emulate payment loading state */
                  <div className="py-12 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-[#3ac58e] border-t-transparent rounded-full animate-spin mx-auto mr-auto" />
                    <div>
                      <h5 className="font-bold text-slate-800">Contacting CBN switch engine...</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">WiFiSplit is authorizing recurring account link details on Paystack. please wait.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Hotspot Owner Email Address</span>
                      <input
                        type="email"
                        value={paystackEmail}
                        onChange={(e) => setPaystackEmail(e.target.value)}
                        placeholder="owner@starlinkwifi.ng"
                        className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#3ac58e]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Debit Card Number</span>
                      <input
                        type="text"
                        value={paystackCardNo}
                        onChange={(e) => setPaystackCardNo(e.target.value)}
                        placeholder="4084 0000 0000 1234"
                        className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#3ac58e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Expiry Month/Yr</span>
                        <input
                          type="text"
                          value={paystackExpiry}
                          onChange={(e) => setPaystackExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Card CVV</span>
                        <input
                          type="password"
                          value={paystackCvv}
                          onChange={(e) => setPaystackCvv(e.target.value)}
                          placeholder="821"
                          maxLength={3}
                          className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-2 text-[10.5px] leading-tight text-slate-500">
                      <span>⚡</span>
                      <p>You are upgrading to <strong>{selectedUpgradePlan.name}</strong>. Enjoy unlimited client capacity and customizable PDF print Slips!</p>
                    </div>

                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowPaystackCheckout(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-2.5 rounded-xl text-center"
                      >
                        Go Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPayingPaystack(true);
                          setTimeout(() => {
                            setIsPayingPaystack(false);
                            setPaystackSuccess(true);
                          }, 2500);
                        }}
                        className="flex-1 bg-[#3ac58e] hover:bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl text-center shadow-md shadow-emerald-100"
                      >
                        Pay ₦{selectedUpgradePlan.priceNaira.toLocaleString()}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS & DIALOG POPUPS ================= */}

      {/* Modal 1: Add Custom Internet Plan */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-black text-slate-800 uppercase">Define New Internet Plan Option</h4>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Plan Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. ₦1,000 Fast Daily booster"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Data Cap (GB - Set 0 for Unlimited)</label>
                  <input
                    type="number"
                    value={newPlanGb}
                    onChange={(e) => setNewPlanGb(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Hour Duration (Validity)</label>
                  <input
                    type="number"
                    value={newPlanHours}
                    onChange={(e) => setNewPlanHours(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Speed Limit Max (Mbps)</label>
                  <input
                    type="number"
                    value={newPlanSpeed}
                    onChange={(e) => setNewPlanSpeed(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="e.g. Excellent high speed internet pass. Safe and seamless."
                  className="w-full border border-slate-200 rounded-lg p-2 h-16 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-800 text-white font-extrabold hover:bg-brand-900 rounded-xl"
                >
                  Build Plan Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Fast Single Voucher Selector */}
      {showSingleVchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                🎫 Generate Single Voucher PIN
              </h4>
              <button onClick={() => setShowSingleVchModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">WiFi Plan formula basis</label>
                <select
                  value={singleVPlanId}
                  onChange={(e) => setSingleVPlanId(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Subscriber Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Babajide Alabi"
                  value={singleVCustomerName}
                  onChange={(e) => setSingleVCustomerName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">WhatsApp phone contacts for alert dispatch (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +234 812 000 0000"
                  value={singleVCustomerPhone}
                  onChange={(e) => setSingleVCustomerPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg font-mono text-slate-700"
                />
                <span className="text-[9.5px] text-slate-400 mt-1 block">If details mapped, the system triggers the dispatch alert securely!</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email address for alert dispatch (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. customer@domain.com"
                  value={singleVCustomerEmail}
                  onChange={(e) => setSingleVCustomerEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg font-mono text-slate-700"
                />
                <span className="text-[9.5px] text-slate-400 mt-1 block">Sends the voucher passcode PIN to subscriber email instantly!</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSingleVchModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-800 text-white hover:bg-brand-900 rounded-xl font-bold"
                >
                  Confirm & Dispatch Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Customer CRM */}
      {showAddCustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-black text-slate-800 uppercase">Register New Subscriber profile</h4>
              <button onClick={() => setShowAddCustModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Subscriber Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Funmi Ayoola"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Phone / WhatsApp Line</label>
                <input
                  type="text"
                  placeholder="e.g. +234 810 000 1111"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">CRM Notes & Hostel Location</label>
                <textarea
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="e.g. resident in Hostel complex C room 4"
                  className="w-full border border-slate-200 p-2.5 h-16 resize-none rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCustModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Voucher Dispatch Feedback Hub */}
      {dispatchFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="text-center pb-4 border-b border-slate-100">
              <span className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xl mx-auto mb-2 font-bold">
                ✓
              </span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Voucher Active & Dispatched!</h3>
              <p className="text-[11px] text-slate-400">Payment received and manual verification completed successfully</p>
            </div>

            <div className="my-4 space-y-3.5">
              {/* Voucher Card details */}
              <div className="p-4 bg-brand-50/20 border border-brand-100 rounded-xl relative overflow-hidden">
                <div className="auto-layout flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] font-black text-brand-900 uppercase">ACCESS CODE PIN</h4>
                    <code className="text-xl font-mono font-black text-brand-600 block tracking-widest mt-1">
                      {dispatchFeedback.voucherCode}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(dispatchFeedback.voucherCode)}
                    className={`px-3 py-1.5 border rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors ${
                      copiedCode === dispatchFeedback.voucherCode
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-brand-50 border-slate-200 hover:border-brand-300 text-slate-600'
                    }`}
                  >
                    {copiedCode === dispatchFeedback.voucherCode ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-brand-100/30 pt-2.5">
                  <div>Subscriber: <strong className="text-slate-800 block">{dispatchFeedback.customerName}</strong></div>
                  <div>Plan Package: <strong className="text-slate-800 block">{dispatchFeedback.planName}</strong></div>
                </div>
              </div>

              {/* Email Delivery Panel */}
              {dispatchFeedback.customerEmail && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✉️ EMAIL TICKET SERVICE:</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        dispatchFeedback.emailStatus === 'Sent Successfully' ? 'bg-emerald-100 text-emerald-800' :
                        dispatchFeedback.emailStatus === 'API Key Missing (Simulated)' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-rose-100 text-rose-850'
                    }`}>
                      {dispatchFeedback.emailStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {dispatchFeedback.emailStatus === 'Sent Successfully' 
                      ? `The beautifully styled e-voucher was dispatched successfully to ${dispatchFeedback.customerEmail} using your Resend Account credentials.`
                      : `Live e-voucher ticket delivery simulation active to: ${dispatchFeedback.customerEmail}. Configure VITE_RESEND_API_KEY in the environment secrets list to trigger live Resend delivery.`
                    }
                  </p>

                  {/* Styled Email Client Box Mock Preview representing what the Resend template looks like */}
                  <div className="border border-slate-250 rounded-lg bg-white p-3 text-[11.5px] text-slate-600 font-sans space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 pb-1.5 mb-2 flex justify-between items-center">
                      <span>Styled Resend HTML Template Preview:</span>
                      <span className="text-brand-600">Premium E-Ticket</span>
                    </div>
                    <div className="p-3 border border-brand-100 bg-brand-50/5 rounded-md">
                      <div className="text-center font-black text-brand-900 border-b border-brand-50 pb-1.5 mb-2 text-xs">
                        ⚡ {business.businessName} Wi-Fi
                      </div>
                      <p>Hello <strong>{dispatchFeedback.customerName}</strong>,</p>
                      <p className="mt-1">Your payment of ₦{dispatchFeedback.planPrice.toLocaleString()} is confirmed. Find your Starlink Access Code PIN:</p>
                      <div className="my-3 p-2 bg-slate-50 border border-dashed border-slate-200 text-center rounded font-mono font-black text-brand-600 text-sm tracking-widest">
                        {dispatchFeedback.voucherCode}
                      </div>
                      <div className="text-[9.5px] text-slate-400">
                        Plan: {dispatchFeedback.planName} | Support line: {business.whatsapp}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDispatchFeedback(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold uppercase transition-all"
              >
                Got it, Close Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
