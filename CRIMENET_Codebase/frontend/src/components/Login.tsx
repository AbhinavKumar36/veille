import React, { useState } from 'react';
import { api, APIError } from '../api/client';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });

      // Store access token for API calls
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call parent handler with user info
      onLogin(data.user);

    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Authentication failed. Check your credentials.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Network error. Is the VEILLE server running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-on-surface flex items-center justify-center overflow-hidden w-screen">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 opacity-30 z-0 pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 to-background z-0 pointer-events-none"></div>
      
      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-[440px] px-4 md:px-0">
        {/* Header / Logo Area */}
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-wider font-black flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[34px]">visibility</span>
            VEILLE
          </h1>
          <p className="font-label-caps text-label-caps text-status-critical mt-2 uppercase tracking-widest border border-status-critical/30 inline-block px-3 py-1 bg-status-critical/10 rounded-sm">
            Restricted Intelligence System
          </p>
        </div>

        {/* Login Container */}
        <div className="bg-surface-elevated border border-stroke-subtle rounded-lg p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 bg-status-critical/10 border border-status-critical/30 rounded px-4 py-3">
                <span className="material-symbols-outlined text-status-critical text-[18px] mt-0.5 shrink-0">error</span>
                <p className="font-body-sm text-body-sm text-status-critical">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2" htmlFor="email">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Agency Email
              </label>
              <input 
                className="w-full bg-surface-container border border-stroke-subtle rounded font-data-code text-data-code text-primary px-4 py-3 focus:outline-none focus:border-primary-container focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all placeholder:text-on-surface-variant/50" 
                id="email"
                name="email"
                type="email"
                placeholder="admin@veille.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2" htmlFor="password">
                <span className="material-symbols-outlined text-[16px]">password</span>
                Passcode
              </label>
              <input 
                className="w-full bg-surface-container border border-stroke-subtle rounded font-data-code text-data-code text-primary px-4 py-3 focus:outline-none focus:border-primary-container focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all placeholder:text-on-surface-variant/50" 
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            
            <button 
              className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps py-4 rounded font-bold hover:bg-primary-fixed transition-colors flex justify-center items-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  AUTHENTICATE
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Clearance Level Indicator */}
        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            <span className="font-body-sm text-body-sm">Required Clearance:</span>
            <span className="font-data-code text-data-code text-status-warning ml-1">LEVEL 5</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant/50 max-w-xs text-center">
            Unauthorized access attempts are logged and reported to Unit 77 Intelligence.
          </p>
        </div>
      </main>
      
      {/* Footer Information */}
      <footer className="absolute bottom-0 w-full p-4 text-center z-10 border-t border-stroke-subtle bg-surface-container-lowest/80 backdrop-blur-sm">
        <p className="font-data-code text-data-code text-status-success flex items-center justify-center gap-3 opacity-70 hover:opacity-100 transition-opacity cursor-default">
          <span>© 2026 VEILLE COMMAND</span>
          <span className="text-stroke-subtle">•</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lock</span> ENCRYPTION: AES-256</span>
          <span className="text-stroke-subtle">•</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span> SYSTEM: OPTIMAL</span>
        </p>
      </footer>
    </div>
  );
};

export default Login;
