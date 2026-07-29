/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HotspotBusiness, HotspotPlan } from '../types';
import { Sparkles, Building, Router, Wifi, MessageSquare, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (business: HotspotBusiness, initialPlan: HotspotPlan) => void;
  onCancel?: () => void;
}

export default function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [bizName, setBizName] = useState('My Starlink Neighborhood Wi-Fi');
  const [logoEmoji, setLogoEmoji] = useState('⚡');
  const [phone, setPhone] = useState('+234 812 000 1122');
  const [whatsapp, setWhatsapp] = useState('+234 812 000 1122');
  const [location, setLocation] = useState('Yaba, Lagos');
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'KES' | 'GHS' | 'ZAR'>('NGN');
  const [routerType, setRouterType] = useState<'Starlink' | 'MikroTik' | 'TP-Link' | 'Huawei 4G/5G' | 'Other'>('Starlink');
  const [coverageArea, setCoverageArea] = useState('200m radius centering campus hostel Block B');
  const [bankName, setBankName] = useState('Opay');
  const [bankAccountNo, setBankAccountNo] = useState('8120001122');
  const [bankAccountName, setBankAccountName] = useState('Starlink Neighborhood Wi-Fi');
  
  // Custom plan setup
  const [planName, setPlanName] = useState('₦500 Daily Fast');
  const [planPrice, setPlanPrice] = useState(500);
  const [planDataGb, setPlanDataGb] = useState(5);
  const [planDurationHours, setPlanDurationHours] = useState(24);
  const [planSpeedMbps, setPlanSpeedMbps] = useState(5);

  const [whatsappProvider, setWhatsappProvider] = useState<'Meta Cloud API' | 'Twilio' | 'Termii' | 'UltraMsg'>('Meta Cloud API');

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinish = () => {
    const finalBusiness: HotspotBusiness = {
      id: 'biz_new_' + Date.now(),
      businessName: bizName,
      logoEmoji: logoEmoji,
      logoBgColor: '#059669', // Emerald-600 default
      phone: phone,
      whatsapp: whatsapp,
      location: location,
      currency: currency,
      timezone: 'Africa/Lagos',
      routerType: routerType,
      mikrotikIntegrationEnabled: routerType === 'MikroTik',
      mikrotikHost: '',
      mikrotikApiPort: 8728,
      mikrotikUsername: '',
      mikrotikPassword: '',
      mikrotikApiToken: '',
      mikrotikHotspotName: 'hotspot',
      coverageArea: coverageArea,
      bankName: bankName,
      bankAccountNo: bankAccountNo,
      bankAccountName: bankAccountName,
      paymentInstructions: `Please transfer to our ${bankName} account: ${bankAccountNo} (${bankAccountName}). Send screenshot immediately!`,
      whatsappProvider: whatsappProvider,
      whatsappApiKey: 'w_key_sandbox_' + Math.floor(Math.random() * 899999 + 100000)
    };

    const firstPlan: HotspotPlan = {
      id: 'p_wizard_1',
      name: planName,
      price: planPrice,
      dataLimitGb: planDataGb,
      durationHours: planDurationHours,
      speedLimitMbps: planSpeedMbps,
      deviceLimit: 1,
      validityPeriodDays: Math.ceil(planDurationHours / 24),
      autoExpiry: true,
      description: `Wizard created plan: ${planDataGb}GB for ${planDurationHours} hours limit. Speed cap ${planSpeedMbps}Mbps.`,
      isActive: true,
      isPopular: true
    };

    onComplete(finalBusiness, firstPlan);
  };

  const stepsMeta = [
    { label: 'Business Details', icon: Building },
    { label: 'Internet Setup', icon: Router },
    { label: 'First Internet Plan', icon: Wifi },
    { label: 'WhatsApp Alerts', icon: MessageSquare },
    { label: 'Ready!', icon: Sparkles },
  ];

  return (
    <div id="setup-wizard" className="max-w-3xl mx-auto my-8 bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="bg-brand-900 text-white p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Wifi className="w-56 h-56" />
        </div>
        <div className="relative z-10">
          <span className="px-2.5 py-1 bg-brand-700 text-brand-100 rounded-full text-xs font-semibold uppercase tracking-wider">
            Onboarding Setup Guide
          </span>
          <h2 className="text-2xl font-bold mt-2">Configure WiFiSplit Platform</h2>
          <p className="text-emerald-200 text-sm mt-1 max-w-xl">
            Let's customize your Starlink or local ISP business in Yaba, Benin, or wherever you are in Africa in just 5 quick steps.
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="border-b border-slate-100 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between">
          {stepsMeta.map((sMeta, idx) => {
            const stepNum = idx + 1;
            const IsActive = step === stepNum;
            const IsCompleted = step > stepNum;
            const Icon = sMeta.icon;

            return (
              <div key={idx} className="flex items-center flex-1 last:flex-initial">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    IsCompleted ? 'bg-brand-500 text-white' : IsActive ? 'bg-brand-800 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {IsCompleted ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={`text-xs font-medium hidden md:inline-block ${IsActive ? 'text-brand-900 font-semibold' : 'text-slate-500'}`}>
                    {sMeta.label}
                  </span>
                </div>
                {idx < stepsMeta.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 hidden md:block ${step > stepNum ? 'bg-brand-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps Content Area */}
      <div className="p-8">
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Building className="text-brand-600 w-5 h-5" /> Step 1: Tell Us About Your Business
            </h3>
            <p className="text-sm text-slate-500">Provide basic profile details so clients know who they are paying.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Business Name</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Brand Logo Icon</label>
                <div className="flex gap-2">
                  <select
                    value={logoEmoji}
                    onChange={(e) => setLogoEmoji(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="⚡">⚡ Lightning Bolts</option>
                    <option value="🛰️">🛰️ Starlink Satellite</option>
                    <option value="🚀">🚀 Spaceship Net</option>
                    <option value="🌍">🌍 African Green Tech</option>
                    <option value="📶">📶 Wi-Fi Hotspot Signal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Business Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">WhatsApp Customer Delivery Number</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Physical Location / Town</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Ebute Metta, Lagos"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Preferred Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="NGN">₦ Nigerian Naira (NGN)</option>
                  <option value="KES">KSh Kenyan Shilling (KES)</option>
                  <option value="GHS">GH₵ Ghanaian Cedi (GHS)</option>
                  <option value="USD">$ US Dollars (USD)</option>
                  <option value="ZAR">R South African Rand (ZAR)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h4 className="text-xs font-bold uppercase text-slate-600 mb-2">My Local Bank Target Details (Manual Payments)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Account Name</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Router className="text-brand-600 w-5 h-5" /> Step 2: Choose Your Internet Router Setup
            </h3>
            <p className="text-sm text-slate-500">Tell us what technology powers your local hotspot network. (We support manual voucher delivery to any network!).</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setRouterType('Starlink')}
                className={`border-2 rounded-xl p-4 cursor-pointer text-center hover:border-brand-500 transition-all ${
                  routerType === 'Starlink' ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="text-2xl mb-1">🛰️</div>
                <div className="font-bold text-sm text-slate-800">Starlink SpaceX</div>
                <p className="text-[11px] text-slate-500 mt-1">Excellent speed, standard satellite router setup. Direct simple management.</p>
              </div>

              <div
                onClick={() => setRouterType('MikroTik')}
                className={`border-2 rounded-xl p-4 cursor-pointer text-center hover:border-brand-500 transition-all ${
                  routerType === 'MikroTik' ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="text-2xl mb-1">📟</div>
                <div className="font-bold text-sm text-slate-800">MikroTik RouterOS</div>
                <p className="text-[11px] text-slate-500 mt-1">For automated captive portal syncing. Bridges (Future API support ready!).</p>
              </div>

              <div
                onClick={() => setRouterType('TP-Link')}
                className={`border-2 rounded-xl p-4 cursor-pointer text-center hover:border-brand-500 transition-all ${
                  routerType === 'TP-Link' ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="text-2xl mb-1">🌐</div>
                <div className="font-bold text-sm text-slate-800">TP-Link / Other</div>
                <p className="text-[11px] text-slate-500 mt-1">Generic high-speed router. Manually key generated slips to device accounts.</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Wi-Fi Wireless Coverage Area</label>
              <input
                type="text"
                value={coverageArea}
                onChange={(e) => setCoverageArea(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Unilag Kings Hostel Complex block 1-4"
              />
            </div>

            {routerType === 'MikroTik' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2">
                <span className="text-base">📢</span>
                <div>
                  <strong className="font-semibold block">Captive Portal Bridges Enabled!</strong>
                  WiFiSplit V1 stores voucher management and provides pre-formatted print slips that align with standard MikroTik user-manager profiles (8-symbol codes). Deep synchronizing features will connect soon.
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Wifi className="text-brand-600 w-5 h-5" /> Step 3: Launch Your First Wi-Fi Plan
            </h3>
            <p className="text-sm text-slate-500">Provide pricing options for your clients. Vouchers will instantly adapt to these formulas!</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Plan Price ({currency})</label>
                <input
                  type="number"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data Limit (GB)</label>
                <input
                  type="number"
                  value={planDataGb}
                  onChange={(e) => setPlanDataGb(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Set 0 for unlimited fair use.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Duration Validity Hours</label>
                <select
                  value={planDurationHours}
                  onChange={(e) => setPlanDurationHours(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none"
                >
                  <option value={1}>1 Hour</option>
                  <option value={3}>3 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={168}>168 Hours (1 Week)</option>
                  <option value={720}>720 Hours (30 Days)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Capped Speeds (Mbps)</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={planSpeedMbps}
                  onChange={(e) => setPlanSpeedMbps(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Standard 2 Mbps</span>
                  <span className="font-bold text-brand-600">{planSpeedMbps} Mbps Max Speed Limit</span>
                  <span>Premium 50 Mbps</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <MessageSquare className="text-brand-600 w-5 h-5" /> Step 4: Configure WhatsApp Dispatch Gateway
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Vouchers will be dispatched instantly over WhatsApp upon manual payment approval. Choose the platform gateway abstraction to handle deliveries:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setWhatsappProvider('Meta Cloud API')}
                className={`border-2 rounded-xl p-3.5 cursor-pointer hover:border-brand-500 transition-all ${
                  whatsappProvider === 'Meta Cloud API' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">Meta WhatsApp Cloud API</div>
                <p className="text-xs text-slate-500 mt-1">Official developer API directly hosted by Meta. Free tier (1,000 monthly conversations inclusive!).</p>
              </div>

              <div
                onClick={() => setWhatsappProvider('Termii')}
                className={`border-2 rounded-xl p-3.5 cursor-pointer hover:border-brand-500 transition-all ${
                  whatsappProvider === 'Termii' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">Termii Gateway (Naija Favorite)</div>
                <p className="text-xs text-slate-500 mt-1">Excellent delivery rates across Nigeria and sub-Saharan Africa. High SMS/WhatsApp fallback capability.</p>
              </div>

              <div
                onClick={() => setWhatsappProvider('Twilio')}
                className={`border-2 rounded-xl p-3.5 cursor-pointer hover:border-brand-500 transition-all ${
                  whatsappProvider === 'Twilio' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">Twilio SMS & Messaging</div>
                <p className="text-xs text-slate-500 mt-1">Industry standard global messenger framework. Scalable for unlimited high volume clients.</p>
              </div>

              <div
                onClick={() => setWhatsappProvider('UltraMsg')}
                className={`border-2 rounded-xl p-3.5 cursor-pointer hover:border-brand-500 transition-all ${
                  whatsappProvider === 'UltraMsg' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">UltraMsg Webhook Gateway</div>
                <p className="text-xs text-slate-500 mt-1">Quick instance QR scanning. Links your local phone WhatsApp line to our API endpoints instantly!</p>
              </div>
            </div>

            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex gap-3 text-xs text-brand-800 leading-relaxed">
              <span className="text-base">ℹ️</span>
              <div>
                Our system uses custom voucher message templates (e.g. <code>Hello {"{customer_name}"} Your Wi-Fi client PIN card is code {"{voucher_code}"}</code>).
                We have sandboxed these delivery configurations so they are functional immediately without payment or verification!
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-center py-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Your Wi-Fi Core OS is Configured!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Welcome to the digital "Shopify for internet hotspots". The platform is optimized for Starlink deployment in Yaba.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm mx-auto text-left space-y-2 text-xs text-slate-600">
              <p>🏢 <strong>Business Name:</strong> {bizName}</p>
              <p>📶 <strong>First Plan:</strong> {planName} for ₦{planPrice}</p>
              <p>📡 <strong>Router Mode:</strong> {routerType} ({coverageArea})</p>
              <p>💬 <strong>WhatsApp Engine:</strong> {whatsappProvider} Sandbox</p>
              <p>🏦 <strong>Receiving Account:</strong> {bankName} - {bankAccountNo}</p>
            </div>

            <p className="text-[11px] text-slate-400">You can adjust any parameter or reset the setup anytime from settings.</p>
          </div>
        )}
      </div>

      {/* Button Controls Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-5 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm smooth-transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : onCancel ? (
          <button
            onClick={onCancel}
            className="px-4 py-2 hover:bg-slate-200 text-slate-600 rounded-lg text-sm smooth-transition font-semibold"
          >
            Skip Wizard
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl text-sm smooth-transition shadow-md shadow-brand-900/10"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm smooth-transition shadow-md shadow-brand-600/20"
          >
            Launch My Business Dashboard 🚀
          </button>
        )}
      </div>
    </div>
  );
}
