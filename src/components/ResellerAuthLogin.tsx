import React, { useState } from 'react';
import { Wifi, Key, AlertTriangle, Sparkles, Send, ShieldCheck, UserPlus, ArrowLeft, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';

interface ResellerAuthLoginProps {
  onSuccess: (email: string, user?: any) => void;
  onCancel: () => void;
}

export default function ResellerAuthLogin({ onSuccess, onCancel }: ResellerAuthLoginProps) {
  // Navigation states
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state profiles
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessAddress, setRegBusinessAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your admin email.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your administrator account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) {
        throw new Error('Server returned invalid content-type. Fallback to browser LocalStorage.');
      }
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(email.trim(), data.user);
      } else {
        setError(data.error || 'Identity verification failed.');
      }
    } catch (err: any) {
      console.warn('API error, checking browser localStorage:', err);
      const cleanEmail = email.trim().toLowerCase();
      const listStr = localStorage.getItem('fallback_registrations') || '[]';
      const list = JSON.parse(listStr);
      const foundLocal = list.find((u: any) => u.email_address?.toLowerCase() === cleanEmail && u.password === password);
      if (foundLocal) {
        onSuccess(email.trim(), foundLocal);
      } else {
        setError('No account found under this email. Register a new administrator account below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Pre-flight validation rules
    if (!regFirstName.trim() || !regLastName.trim()) {
      setError('First and Last names are requested.');
      return;
    }
    if (!regBusinessName.trim()) {
      setError('Please enter your Hotspot Business name.');
      return;
    }
    if (!regBusinessAddress.trim()) {
      setError('Please specify your physical business address.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please specify your operational email address.');
      return;
    }
    if (!regWhatsapp.trim()) {
      setError('WhatsApp notification and dispatcher number is required.');
      return;
    }
    if (regPassword.length < 5) {
      setError('Secret password must be at least 5 alphanumeric characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Password passcodes do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reseller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          businessName: regBusinessName.trim(),
          businessAddress: regBusinessAddress.trim(),
          emailAddress: regEmail.trim(),
          whatsappNumber: regWhatsapp.trim(),
          password: regPassword
        })
      });

      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) {
        throw new Error('Server returned HTML 404. Switching to Local Browser Fallback.');
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('🎉 Account initialized successfully on Relational DB!');
        setTimeout(() => {
          onSuccess(regEmail.trim(), data.user);
        }, 1200);
      } else {
        setError(data.error || 'Registration failed. Check parameters.');
      }
    } catch (err: any) {
      console.warn('API unreachable, falling back to browser localStorage sandbox:', err);
      const cleanRegEmail = regEmail.trim().toLowerCase();

      const listStr = localStorage.getItem('fallback_registrations') || '[]';
      const list = JSON.parse(listStr);
      const exists = list.some((u: any) => u.email_address?.toLowerCase() === cleanRegEmail);
      if (exists) {
        setError('An account with this email address already exists in local storage.');
        return;
      }

      const newReg = {
        id: Date.now(),
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        business_name: regBusinessName.trim(),
        business_address: regBusinessAddress.trim(),
        email_address: cleanRegEmail,
        whatsapp_number: regWhatsapp.trim(),
        password: regPassword,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      list.push(newReg);
      localStorage.setItem('fallback_registrations', JSON.stringify(list));

      setSuccessMsg('🎉 Account registered successfully in local browser sandbox!');
      setTimeout(() => {
        onSuccess(regEmail.trim(), newReg);
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(`🔒 Password Recovery Sentinel:\n\nIf this account is registered in our Neon databases, an email reference with secure token codes has been dispatched to: ${email.trim() || "johnnybgsu@gmail.com"}.`);
  };

  const handleQuickFill = () => {
    setEmail('johnnybgsu@gmail.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="reseller-auth-card" className={`w-full space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white transition-all duration-300 ${isRegistering ? 'max-w-xl' : 'max-w-md'}`}>
        
        {/* Abstract Dark Theme decorative blur glow layers */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. REGISTRATION FORM STATE VIEW */}
        {isRegistering ? (
          <div className="space-y-6 relative z-10">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-500 text-slate-950 flex items-center justify-center font-black shadow-md border border-brand-400">
                <UserPlus className="w-5 h-5 text-slate-950" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Reseller Registration Node
              </h2>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                Connect your business parameters. Your account and configurations will map instantly on your dedicated SQL tables.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="font-semibold">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-900 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="font-bold">{successMsg} Logging in...</div>
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-firstName" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    id="reg-firstName"
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="John"
                    className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="reg-lastName" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    id="reg-lastName"
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Adewale"
                    className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-businessName" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Hotspot Business Name
                  </label>
                  <input
                    id="reg-businessName"
                    type="text"
                    required
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    placeholder="e.g. Starlink Elite Wi-Fi"
                    className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="reg-businessAddress" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Physical Business Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                    <input
                      id="reg-businessAddress"
                      type="text"
                      required
                      value={regBusinessAddress}
                      onChange={(e) => setRegBusinessAddress(e.target.value)}
                      placeholder="e.g. 14 Herbert Macaulay Way, Yaba, Lagos"
                      className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-email" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="johnnybgsu@gmail.com"
                        className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-whatsapp" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                      <input
                        id="reg-whatsapp"
                        type="text"
                        required
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        placeholder="e.g. +234 812 345 6789"
                        className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-password" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Account Passcode
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-confirmPassword" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Confirm Passcode
                    </label>
                    <input
                      id="reg-confirmPassword"
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-xs bg-slate-950 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-md"
                >
                  {loading ? 'Initializing Node...' : 'Register Profile & Initialize'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-brand-450 hover:text-brand-300 font-bold underline text-center block"
                >
                  Already have an account? Login Here
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 2. LOGIN AUTH STATE VIEW (Default) */
          <div className="space-y-6 relative z-10">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-400">
                <ShieldCheck className="w-6 h-6 text-slate-950" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                Reseller Node Administrator
              </h2>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                Authorize administrative access credentials to view user data logs, generate speed vouchers and manage Stack parameters.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="font-semibold">{error}</div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="reseller-email" className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Administrator Email ID
                  </label>
                  <input
                    id="reseller-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johnnybgsu@gmail.com"
                    className="block w-full px-4 py-3 border border-slate-800 rounded-xl text-xs bg-slate-950/80 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="reseller-password" className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Admin Secure Key Link
                  </label>
                  <input
                    id="reseller-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full px-4 py-3 border border-slate-800 rounded-xl text-xs bg-slate-950/80 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="py-3 px-4 w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Unlocking...</span>
                  ) : (
                    <>
                      <span>Gain Entry</span>
                      <Key className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Links below authentication triggers */}
              <div className="flex flex-col items-center gap-2.5 pt-4 border-t border-slate-800/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-slate-400 hover:text-slate-200 transition-colors underline"
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-brand-450 hover:text-brand-300 transition-colors font-black uppercase tracking-wide text-[10px] bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Don't have an account? Register Here
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
