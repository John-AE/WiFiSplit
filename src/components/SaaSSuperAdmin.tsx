/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TenantHotspotBusiness, SaaSPlan, HotspotBusiness } from '../types';
import { ShieldAlert, Server, Users, CreditCard, MessageSquare, Plus, Search, Radio, Check, X, Megaphone, CheckCircle, Ban, Globe } from 'lucide-react';

interface SaaSSuperAdminProps {
  tenants: TenantHotspotBusiness[];
  saasPlans: SaaSPlan[];
  onUpdateTenants: (newTenants: TenantHotspotBusiness[]) => void;
  onPostAnnouncement: (msg: string) => void;
  announcement: string;
}

export default function SaaSSuperAdmin({
  tenants,
  saasPlans,
  onUpdateTenants,
  onPostAnnouncement,
  announcement
}: SaaSSuperAdminProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '⚠️ SYSTEM UPDATE: General Starlink speed optimizes for Lagos central areas after local satellite calibration on June 15.');
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'apis'>('tenants');

  // API credentials setup simulation
  const [sandboxTermiiKey, setSandboxTermiiKey] = useState('termii_tkn_81a0293047bb91820f782');
  const [sandboxMetaKey, setSandboxMetaKey] = useState('meta_waba_8819074719280172h30d1');
  const [sandboxTwilioKey, setSandboxTwilioKey] = useState('twilio_sid_us_99210aa980cf');

  const filteredTenants = tenants.filter((t) =>
    t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTenantStatus = (tenantId: string) => {
    const updated = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: t.status === 'active' ? ('suspended' as const) : ('active' as const)
        };
      }
      return t;
    });
    onUpdateTenants(updated);
  };

  const handlePublishAnnounce = () => {
    onPostAnnouncement(announcementInput);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // SaaS summary parameters calculate
  const totalFederatedRevenue = tenants.reduce((acc, curr) => acc + curr.totalRevenueNaira, 0);
  const totalActiveVouchers = tenants.reduce((acc, curr) => acc + curr.totalVouchersSold, 0);
  const totalActiveHotspots = tenants.filter(t => t.status === 'active').length;

  return (
    <div id="saas-super-admin" className="space-y-6">
      
      {/* Alert status notification */}
      {showNotification && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white z-50 px-5 py-3 rounded-xl shadow-lg border border-emerald-400 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Broadcasting Announcement system-wide!</span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-8 -translate-y-8">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-brand-500 text-brand-950 rounded-full text-[10px] font-bold uppercase tracking-wider">
                👑 SaaS System Super Admin
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">WiFiSplit Federation</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Control platform settings, inspect reseller business nodes, adjust monetization pricing structures, and view global Nigerian wireless statistics.
            </p>
          </div>
          <div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Platform GTV</p>
              <p className="text-xl font-extrabold text-brand-500 tracking-tight">₦{totalFederatedRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Registered Hotspots</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">Nigeria-wide</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{tenants.length}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {totalActiveHotspots} online, active nodes
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase font-medium">Accumulated Quota sold</span>
            <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded text-[10px] font-bold">Vouchers</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{totalActiveVouchers.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">Across all tenant hotspots</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly SaaS Subscriptions</span>
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">Platform Fees</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">14 Active Business Plans</p>
          <p className="text-xs text-slate-400 mt-2">Avg. ₦35,000 / month GTV share</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Suspended / Abusing Tenants</span>
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">Compliance</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            {tenants.filter((t) => t.status === 'suspended').length} Nodes
          </p>
          <p className="text-xs text-slate-400 mt-2">Suspended for breach of bandwidth limits</p>
        </div>
      </div>

      {/* Broadcast Announcement Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Megaphone className="text-amber-500 w-4 h-4 animate-bounce" /> Broadcast Platform Announcement Banner
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Type an informational alert that will instantly render on all Hotspot Owner Dashboards' top notification banners.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={announcementInput}
            onChange={(e) => setAnnouncementInput(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            placeholder="Announce Starlink discounts or general platform improvements..."
          />
          <button
            onClick={handlePublishAnnounce}
            className="bg-brand-800 hover:bg-brand-900 text-white font-bold px-4 py-2 rounded-lg text-xs smooth-transition shadow-sm"
          >
            Publish Now 📢
          </button>
        </div>
      </div>

      {/* Segment tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        {[
          { id: 'tenants', label: 'Registered Tenant Hotspots', icon: Users },
          { id: 'plans', label: 'Manage SaaS Monetization Pricing', icon: CreditCard },
          { id: 'apis', label: 'Global WhatsApp Dev Tokens', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold leading-none border-b-2 transition-all ${
                isSel ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content 1: tenants */}
      {activeTab === 'tenants' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search business, owner or email..."
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              />
            </div>
            <div className="text-[11px] text-slate-400 font-semibold self-center">
              Displaying {filteredTenants.length} of {tenants.length} total hotspot nodes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="p-4">Owner Business Name</th>
                  <th className="p-4">Tenant Owner</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">SaaS Tier</th>
                  <th className="p-4 text-right">Vouchers Printed</th>
                  <th className="p-4 text-right">Total Local GTV</th>
                  <th className="p-4 text-center">Tenant State</th>
                  <th className="p-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredTenants.map((ten) => (
                  <tr key={ten.id} className="hover:bg-slate-50/70 smooth-transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛰️</span>
                        <div>
                          <p className="font-bold text-slate-800">{ten.businessName}</p>
                          <p className="text-[9.5px] text-slate-400 font-mono">id: {ten.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-slate-800">{ten.ownerName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{ten.ownerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{ten.joinedDate}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ten.planId === 'business' ? 'bg-purple-100 text-purple-700' :
                        ten.planId === 'growth' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ten.planId}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {ten.totalVouchersSold.toLocaleString()} vch
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900">
                      ₦{ten.totalRevenueNaira.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ten.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ten.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {ten.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {ten.status === 'active' ? (
                        <button
                          onClick={() => toggleTenantStatus(ten.id)}
                          className="px-2 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded text-[10px] font-bold tracking-tight smooth-transition"
                        >
                          Suspend Node 🚫
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleTenantStatus(ten.id)}
                          className="px-2 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded text-[10px] font-bold tracking-tight smooth-transition"
                        >
                          Restore Active ✔
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content 2: plans edit */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {saasPlans.map((plan) => (
            <div key={plan.id} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase text-slate-600">
                    SaaS Product SKU
                  </span>
                  <span className="text-xs font-extrabold text-brand-600 uppercase">NGN / year subscription</span>
                </div>
                <h4 className="text-lg font-extrabold text-slate-800">{plan.name}</h4>
                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">₦{(plan.priceNaira).toLocaleString()}</span>
                  <span className="text-xs text-slate-400">/ month billed annually</span>
                </div>
                
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 uppercase font-black tracking-wide">Allocated Threshold Limits:</p>
                  <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                    <li>📡 <strong>Hotspots Limit:</strong> {plan.hotspotsLimit === -1 ? 'Unlimited Locations' : `${plan.hotspotsLimit} Router Node(s)`}</li>
                    <li>👥 <strong>Customers Limit:</strong> {plan.customersLimit === -1 ? 'Unlimited Active' : `${plan.customersLimit} Clients`}</li>
                    <li>🎫 <strong>Vouchers Limit:</strong> {plan.vouchersLimit === -1 ? 'Unlimited /mo' : `${plan.vouchersLimit} Vouchers/mo`}</li>
                    <li>💬 <strong>WhatsApp Credits:</strong> {plan.whatsappCredits.toLocaleString()} / month inclusive</li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <button
                  onClick={() => alert(`Adjust Plan configuration tool for ${plan.name} is saved under model definitions.`)}
                  className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold smooth-transition"
                >
                  Edit Package parameters &limits ⚙️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content 3: apis credentials */}
      {activeTab === 'apis' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Server className="w-5 h-5 text-brand-600" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Global API Gateway Keys</h4>
              <p className="text-xs text-slate-400">Configure Termii or Twilio secrets used automatically by owners who do not provide their custom credentials.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Termii Nigeria Authentication Token</label>
              <input
                type="password"
                value={sandboxTermiiKey}
                onChange={(e) => setSandboxTermiiKey(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Meta WABA API bearer credentials</label>
              <input
                type="password"
                value={sandboxMetaKey}
                onChange={(e) => setSandboxMetaKey(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Twilio Account SID (Default fallback)</label>
              <input
                type="password"
                value={sandboxTwilioKey}
                onChange={(e) => setSandboxTwilioKey(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 flex items-center gap-2 text-xs text-slate-600 leading-normal">
              <span>🤖</span>
              <span>Our abstraction auto-routes messages through these failover triggers if tenant owners exhaust their dedicated credits. Nice & continuous.</span>
            </div>
          </div>

          <div className="border-t border-slate-150 pt-4 flex justify-end">
            <button
              onClick={() => alert('Global sandbox endpoints refreshed.')}
              className="px-4 py-2 bg-brand-800 text-white hover:bg-brand-900 rounded-xl text-xs font-bold smooth-transition"
            >
              Verify Connections and Sync Gateway
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
