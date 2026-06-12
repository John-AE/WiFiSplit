/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Voucher, HotspotPlan, PaymentRequest, HotspotBusiness } from '../types';
import { Wifi, Timer, RotateCcw, Send, ShoppingBag, Sparkles, CheckCircle2, Copy, Trash2, ArrowUpRight, MessageCircle, RefreshCw, Smartphone } from 'lucide-react';

interface CustomerPortalProps {
  vouchers: Voucher[];
  plans: HotspotPlan[];
  business: HotspotBusiness;
  paymentRequests: PaymentRequest[];
  onSubmitPaymentRequest: (req: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'whatsappDelivered'>) => void;
  onClearHistory?: () => void;
}

export default function CustomerPortal({
  vouchers,
  plans,
  business,
  paymentRequests,
  onSubmitPaymentRequest,
  onClearHistory
}: CustomerPortalProps) {
  // Toggle select plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRef, setUserRef] = useState('');
  const [uploadedScrenshotNum, setUploadedScreenshotNum] = useState<any>(null);
  
  // App states
  const [searchCode, setSearchCode] = useState('');
  const [searchedVoucher, setSearchedVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSimulationConnecting, setIsSimulationConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [currentPing, setCurrentPing] = useState(18); // ms
  const [speedDownload, setSpeedDownload] = useState(24.5); // Mbps

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto fluctuating pings simulator
  useEffect(() => {
    const int = setInterval(() => {
      setCurrentPing((p) => Math.max(12, Math.min(45, p + Math.floor(Math.random() * 7) - 3)));
      setSpeedDownload((s) => Math.max(12, Math.min(38, s + Math.random() * 4 - 2)));
    }, 4000);
    return () => clearInterval(int);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!userName.trim()) return setErrorMessage('Please fill in your name.');
    if (!userPhone.trim()) return setErrorMessage('Provide your active WhatsApp phone number log.');
    if (!userRef.trim()) return setErrorMessage('Please insert the bank payment Reference/OPay token.');

    onSubmitPaymentRequest({
      customerName: userName,
      customerPhone: userPhone,
      planId: selectedPlanId,
      planName: selectedPlan?.name || '₦500 Plan',
      planPrice: selectedPlan?.price || 500,
      reference: userRef,
      screenshotUrl: 'https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?q=80&w=400&fit=crop' // simulated screenshot
    });

    setSuccessMessage(`Payment reference submitted to ${business.businessName}! Check manual verification queue shortly.`);
    // reset form some values
    setUserRef('');
    setUploadedScreenshotNum(null);
  };

  // Find dynamic statistics for clients currently active vouchers
  const myActiveVouchers = vouchers.filter(v => v.status === 'active' && v.remainingDataGb > 0);

  return (
    <div id="customer-portal" className="max-w-4xl mx-auto space-y-6">
      
      {/* Simulation state top bar */}
      <div className="bg-emerald-900 text-white rounded-2xl p-4 md:p-6 shadow-xl border border-brand-800 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none pr-6">
          <Wifi className="w-48 h-48" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              isConnected ? 'bg-emerald-500 text-emerald-950 animate-pulse' : 'bg-rose-500 text-white'
            }`}>
              ⚡
            </div>
            <div>
              <p className="text-xs text-brand-200 font-extrabold uppercase tracking-widest">Subscriber Connection App</p>
              <h3 className="text-xl font-extrabold tracking-tight">
                {isConnected ? 'Connected to Hotspot' : 'Offline / Interrupted'}
              </h3>
              <p className="text-emerald-200 text-xs mt-0.5">
                Powered by <strong className="font-bold underline">{business.businessName}</strong> ({business.location})
              </p>
            </div>
          </div>

          <div className="flex gap-4 font-mono text-center">
            <div className="bg-brand-950/40 rounded-xl px-3.5 py-2 border border-brand-800">
              <span className="block text-[9px] text-brand-300 uppercase tracking-wide">PING Lateny</span>
              <span className="text-base font-bold text-brand-200">{currentPing} ms</span>
            </div>
            <div className="bg-brand-950/40 rounded-xl px-3.5 py-2 border border-brand-800">
              <span className="block text-[9px] text-brand-300 uppercase tracking-wide">Starlink speed</span>
              <span className="text-base font-bold text-emerald-300">{speedDownload.toFixed(1)} Mb/s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: My Active Vouchers */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
                🔑 My Wireless Voucher Passports ({myActiveVouchers.length})
              </h4>
              <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                Active & Unexpired
              </span>
            </div>

            {myActiveVouchers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 text-xs">No active internet vouchers found for you yet.</p>
                <p className="text-slate-500 text-xs mt-1">Select a pricing model plan package below and transfer to launch!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myActiveVouchers.map((voucher) => {
                  const percentLeft = (voucher.remainingDataGb / voucher.dataLimitGb) * 100;
                  return (
                    <div key={voucher.id} className="border border-brand-100 rounded-xl p-4 bg-brand-50/20 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 font-bold font-mono text-[38px] text-brand-600 select-none pointer-events-none uppercase mr-4 -mt-2">
                        {voucher.remainingDataGb > 0 ? 'LIVE' : 'USED'}
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-none">{voucher.planName}</p>
                          <span className="text-[9px] text-slate-400">Generated: {new Date(voucher.dateCreated).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className="p-1 px-2.5 bg-white border border-slate-200 hover:border-brand-500 rounded text-[10px] font-bold text-slate-600 flex items-center gap-1 smooth-transition"
                          >
                            {copiedCode === voucher.code ? <span className="text-brand-600">Copied!</span> : <> <Copy className="w-3 h-3" /> Copy Code </>}
                          </button>
                        </div>
                      </div>

                      {/* Code string visualizer */}
                      <div className="bg-white border border-brand-100 rounded-lg p-2.5 text-center my-3">
                        <span className="text-[9px] font-bold text-slate-400 tracking-widest block uppercase">Wi-Fi ROUTER ACCESS PIN</span>
                        <code className="text-base font-extrabold text-brand-900 tracking-wider font-mono">{voucher.code}</code>
                      </div>

                      {/* Quota slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Data Consumed:</span>
                          <strong>{(voucher.dataLimitGb - voucher.remainingDataGb).toFixed(1)} GB / {voucher.dataLimitGb} GB</strong>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${Math.max(1, Math.min(100, percentLeft))}%` }}
                          />
                        </div>
                      </div>

                      {/* Expiry timers */}
                      <div className="mt-3 flex justify-between items-center text-[10.5px] text-slate-500 border-t border-brand-100/50 pt-2 bg-slate-50/10">
                        <span>Speed Limit: <strong>⚡ {voucher.speedLimitMbps} Mbps</strong></span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Timer className="w-3.5 h-3.5 text-brand-600" />
                          Auto-expires: <strong className="font-bold text-slate-800">Countdown Active</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cumulative History Log */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-3">
              <h5 className="text-xs font-extrabold text-slate-700 uppercase">My Vouchers History Archive</h5>
              {onClearHistory && (
                <button onClick={onClearHistory} className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-bold">
                  <Trash2 className="w-3.5 h-3.5" /> Reset Demo Vouchers
                </button>
              )}
            </div>

            <div className="space-y-2">
              {vouchers.map((v) => (
                <div key={v.id} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/40 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-700">{v.planName}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{v.code}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                      v.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      v.status === 'expired' ? 'bg-slate-100 text-slate-500' :
                      v.status === 'used' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-700'
                    }`}>
                      {v.status}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(v.dateCreated).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Buying a new path & manuals screenshot submission */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <span className="absolute right-0 top-0 bg-brand-500 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
              Naira Manual Flow
            </span>
            <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 mb-3">
              <ShoppingBag className="text-brand-500 w-4 h-4" /> Request Internet Voucher
            </h4>
            
            <p className="text-xs text-slate-500 leading-normal mb-4">
              Our Wi-Fi platform doesn't store automatic credit cards. Direct manual transfer keeps billing safe and accessible!
            </p>

            {/* Error / Success Alerts */}
            {errorMessage && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 mb-4">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 mb-4">{successMessage}</div>}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              
              {/* Plan dropdown selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">1. Select Target Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full text-xs font-extrabold border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{p.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bank Account Instruction Template */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider flex items-center gap-1">
                  🏦 Direct Bank Target Account:
                </span>
                <p className="font-bold text-slate-800 leading-tight">Bank: {business.bankName}</p>
                <div className="flex justify-between items-center bg-white border border-slate-150 p-2 rounded-lg my-1.5">
                  <span className="font-mono font-extrabold text-slate-900 select-all">{business.bankAccountNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(business.bankAccountNo)}
                    className="text-[9px] text-brand-600 hover:underline font-bold"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10.5px]">Name: <strong>{business.bankAccountName}</strong></p>
                <p className="text-[10px] text-slate-400 font-medium">Transfer exact amount to verify instantly.</p>
              </div>

              {/* Form elements */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kolawole Davies"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Your WhatsApp Number (Delivery)</label>
                <input
                  type="text"
                  placeholder="e.g. +234 812 345 6789"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Transfer Bank Reference/Token</label>
                <input
                  type="text"
                  placeholder="e.g. REF-MP-90182C or OPAY-REF"
                  value={userRef}
                  onChange={(e) => setUserRef(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Upload Bank Transfer Screenshot</label>
                <div className="border border-dashed border-slate-200 bg-slate-50 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-100">
                  <span className="text-xl">📸</span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-1">Click to attach confirmation file</span>
                  <span className="text-[9px] text-slate-400">supports JPG, PNG up to 10MB</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-brand-800 hover:bg-brand-900 text-white font-bold py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 smooth-transition shadow-lg shadow-brand-900/10"
              >
                Request Voucher Code Delivery <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Support Card */}
          <div className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-5 border border-slate-250 flex items-center justify-between text-xs transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400">Having network issues?</span>
              <h5 className="font-bold text-slate-800 mt-0.5">Need immediate assistance?</h5>
              <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                <span>💬 WhatsApp Support:</span>
                <strong className="text-brand-700 underline font-extrabold">{business.whatsapp}</strong>
              </p>
            </div>
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\+/g, '').replace(/ /g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 filter drop-shadow smooth-transition"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
            </a>
          </div>

          {/* List of customer payment request limits status */}
          {paymentRequests.length > 0 && (
            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">My Pendings/Requests logs:</span>
              {paymentRequests.map((req) => (
                <div key={req.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-800">{req.planName}</span>
                    <p className="text-[9.5px] text-slate-400">Ref: {req.reference}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'Awaiting Approval' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
