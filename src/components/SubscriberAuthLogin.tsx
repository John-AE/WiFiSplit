import React, { useState } from 'react';
import { Wifi, ShieldAlert, Sparkles, Check, Send } from 'lucide-react';

interface SubscriberAuthLoginProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export default function SubscriberAuthLogin({ onSuccess, onCancel }: SubscriberAuthLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Validate credentials
      if (email.trim().toLowerCase() === 'johnamaka2@gmail.com' && password.trim() === 'password123') {
        setLoading(false);
        onSuccess(email.trim());
      } else {
        setLoading(false);
        setError('Invalid subscriber credentials. Check email or password123.');
      }
    }, 600);
  };

  const handleQuickFill = () => {
    setEmail('johnamaka2@gmail.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="subscriber-auth-card" className="max-w-md w-full space-y-8 bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        
        {/* Abstract Deco background orb */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-brand-50 rounded-full blur-3xl pointer-events-none opacity-80" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-emerald-50 rounded-full blur-3xl pointer-events-none opacity-80" />

        <div className="text-center space-y-3 relative z-10">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-500 text-slate-950 flex items-center justify-center font-black shadow-md border border-brand-400">
            <Wifi className="w-6 h-6 text-brand-950" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Subscriber Client Portal
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
            Log in with your hotspot credentials to manage active passes, buy tickets or request high-speed vouchers.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-semibold">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="subscriber-email" className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="subscriber-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="johnamaka2@gmail.com"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
              />
            </div>

            <div>
              <label htmlFor="subscriber-password" className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Portal Password
              </label>
              <input
                id="subscriber-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 w-1/3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm shadow-brand-500/10 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Account Quickfill box */}
        <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 mt-6 text-left relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Default Sandbox Accounts
            </span>
            <button
              onClick={handleQuickFill}
              type="button"
              className="text-[10px] font-extrabold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors"
            >
              ⚡ Fill John B Credentials
            </button>
          </div>
          <div className="text-[11px] text-slate-500 space-y-1 font-semibold leading-relaxed">
            <p>Name: <span className="text-slate-800">John B</span></p>
            <p>Email: <span className="text-slate-800">johnamaka2@gmail.com</span></p>
            <p>Default Password: <span className="text-slate-800 font-mono">password123</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
