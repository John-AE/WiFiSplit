import React, { useState } from 'react';
import { Wifi, Key, AlertTriangle, Sparkles, Send, ShieldCheck } from 'lucide-react';

interface ResellerAuthLoginProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export default function ResellerAuthLogin({ onSuccess, onCancel }: ResellerAuthLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
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
    setTimeout(() => {
      // Validate credentials
      if (email.trim().toLowerCase() === 'johnnybgsu@gmail.com' && password.trim() === 'password123') {
        setLoading(false);
        onSuccess(email.trim());
      } else {
        setLoading(false);
        setError('Unauthorized Administrator. Check email or default key (password123).');
      }
    }, 600);
  };

  const handleQuickFill = () => {
    setEmail('johnnybgsu@gmail.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="reseller-auth-card" className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white">
        
        {/* Abstract Dark Theme glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
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

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="reseller-email" className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                Administrator Email ID
              </label>
              <input
                id="reseller-email"
                type="email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-4 py-3 border border-slate-800 rounded-xl text-xs bg-slate-950/80 hover:bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm shadow-amber-500/10 disabled:opacity-50"
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
        </form>

        {/* Demo Fast Account Quickfill box for Owner */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 mt-6 text-left relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Default admin login profile
            </span>
            <button
              onClick={handleQuickFill}
              type="button"
              className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              ⚡ Fill John A Credentials
            </button>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-semibold leading-relaxed">
            <p>Admin name: <span className="text-white">John A</span></p>
            <p>Email target: <span className="text-white">johnnybgsu@gmail.com</span></p>
            <p>Default Password: <span className="text-white font-mono">password123</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
