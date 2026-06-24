import React, { useState } from 'react';
import { Wifi, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface SubscriberAuthLoginProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export default function SubscriberAuthLogin({ onSuccess, onCancel }: SubscriberAuthLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const handleLogin = async (e: React.FormEvent) => {
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
    try {
      const res = await fetch(`${API_BASE}/api/subscriber/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(email.trim());
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscriber/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email.split('@')[0],
          phone: '',
          email,
          password
        })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(email.trim());
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="subscriber-auth-card" className="max-w-md w-full space-y-8 bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        
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
            Log in with your account credentials to manage active passes, buy tickets or request high-speed vouchers.
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
                placeholder="you@example.com"
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
              />
            </div>

            <div>
              <label htmlFor="subscriber-password" className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="subscriber-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {loading ? <span>Loading...</span> : <>Sign In</>}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 text-center mb-2">First time? Register instead</p>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
          >
            Create Subscriber Account
          </button>
        </div>
      </div>
    </div>
  );
}