import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, APIError } from '../api/client';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeRole, setActiveRole] = useState<'investigator' | 'admin'>('admin');
  const [email, setEmail] = useState('admin@veille.gov.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectRole = (role: 'investigator' | 'admin') => {
    setActiveRole(role);
    setError('');
    if (role === 'investigator') {
      setEmail('investigator@veille.gov.in');
      setPassword('investigator123');
    } else {
      setEmail('admin@veille.gov.in');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let emailToSend = email.trim();
      if (!emailToSend.includes('@')) {
        if (activeRole === 'admin' || emailToSend.toLowerCase().includes('admin') || emailToSend.toLowerCase().includes('head')) {
          emailToSend = 'admin@veille.gov.in';
        } else {
          emailToSend = 'investigator@veille.gov.in';
        }
      }

      const data = await api.post('/auth/login', { email: emailToSend, password });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('veille_auth', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Invalid authorization credentials.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to authenticate with secure terminal. Verify backend daemon.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#090C10] text-[#E1E2E8] flex flex-col relative overflow-hidden font-sans select-none antialiased">
      {/* Tactical Ambient Glow — Emerald / Mint (#4edea3) as in DESIGN.md */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#4edea3]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#00a572]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Tactical Command Header */}


      {/* Main Authentication Terminal Card */}
      <main className="flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-[#0F141C]/95 border border-[#212B3A] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] p-6 sm:p-8 rounded-sm">
          {/* Card Title & Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-28 h-28 mb-4">
              <img src="/logo.png" alt="VEILLE" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wider uppercase font-mono">
              OPERATOR AUTHENTICATION
            </h2>
            <p className="text-[11px] font-mono text-[#87929A] mt-1">
              Select accredited clearance profile or enter credentials
            </p>
          </div>

          {/* 1-Click Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#090C10] border border-[#212B3A] rounded-sm mb-5 font-mono text-xs">
            <button
              type="button"
              onClick={() => selectRole('admin')}
              className={`flex items-center justify-center gap-2 py-2 px-3 transition-all rounded-sm cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-[#4edea3] text-[#003824] font-bold shadow-[0_0_12px_rgba(78,222,163,0.35)]'
                  : 'text-[#87929A] hover:text-[#E1E2E8] hover:bg-[#151B26]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span className="tracking-wider uppercase text-[11px]">ADMINISTRATOR</span>
            </button>
            <button
              type="button"
              onClick={() => selectRole('investigator')}
              className={`flex items-center justify-center gap-2 py-2 px-3 transition-all rounded-sm cursor-pointer ${
                activeRole === 'investigator'
                  ? 'bg-[#4edea3] text-[#003824] font-bold shadow-[0_0_12px_rgba(78,222,163,0.35)]'
                  : 'text-[#87929A] hover:text-[#E1E2E8] hover:bg-[#151B26]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">fingerprint</span>
              <span className="tracking-wider uppercase text-[11px]">INVESTIGATOR</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-400">gpp_bad</span>
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-[10px] font-bold text-[#87929A] uppercase tracking-wider mb-1" htmlFor="email-input">
                GOVERNMENT IDENTIFIER / EMAIL
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#87929A] material-symbols-outlined text-[16px]">badge</span>
                <input
                  id="email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@veille.gov.in"
                  className="w-full bg-[#090C10] border border-[#212B3A] text-xs text-[#E1E2E8] py-2.5 pl-9 pr-3 rounded-sm placeholder-[#475569] focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 transition-colors"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-[#87929A] uppercase tracking-wider" htmlFor="password-input">
                  SECURITY PASSPHRASE
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#4edea3] hover:text-[#6ffbbe] transition-colors uppercase font-bold"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#87929A] material-symbols-outlined text-[16px]">password</span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090C10] border border-[#212B3A] text-xs text-[#E1E2E8] py-2.5 pl-9 pr-10 rounded-sm placeholder-[#475569] focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 transition-colors"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-mono font-bold text-xs py-3 px-4 rounded-sm shadow-[0_0_18px_rgba(78,222,163,0.3)] hover:shadow-[0_0_24px_rgba(111,251,190,0.45)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>    </div>
  );
};

export default Login;
