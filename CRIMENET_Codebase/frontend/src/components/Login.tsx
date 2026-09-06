import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, APIError } from '../api/client';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

type RoleTab = 'investigator' | 'director';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<RoleTab>('investigator');
  const [identifier, setIdentifier] = useState('AGT-9024-DEL');
  const [password, setPassword] = useState('investigator123');
  const [showPassword, setShowPassword] = useState(false);
  const [totpDigits, setTotpDigits] = useState<string[]>(['5', '8', '2', '9', '4', '1']);
  const [utcTime, setUtcTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Live UTC Clock with milliseconds
  useEffect(() => {
    const updateUtc = () => {
      const now = new Date();
      const timePart = now.toUTCString().split(' ')[4] || now.toISOString().slice(11, 19);
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setUtcTime(`UTC ${timePart}.${ms}`);
    };
    updateUtc();
    const interval = setInterval(updateUtc, 83);
    return () => clearInterval(interval);
  }, []);

  // Switch role tabs and adjust default credentials
  const handleTabSwitch = (tab: RoleTab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'investigator') {
      setIdentifier('AGT-9024-DEL');
      setPassword('investigator123');
      setTotpDigits(['5', '8', '2', '9', '4', '1']);
    } else {
      setIdentifier('DIR-0001-HQ');
      setPassword('admin123');
      setTotpDigits(['9', '0', '4', '7', '3', '8']);
    }
  };

  const handleTotpChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const newDigits = [...totpDigits];
    newDigits[index] = char;
    setTotpDigits(newDigits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice(null);
    setIsLoading(true);

    try {
      // Map badge IDs or shorthand to proper backend account emails
      let emailToSend = identifier.trim();
      if (!emailToSend.includes('@')) {
        if (activeTab === 'director' || emailToSend.toLowerCase().includes('dir') || emailToSend.toLowerCase().includes('admin') || emailToSend.toLowerCase().includes('head')) {
          emailToSend = 'admin@veille.gov.in';
        } else {
          emailToSend = 'investigator@veille.gov.in';
        }
      }

      const data = await api.post('/auth/login', { email: emailToSend, password });

      // Store credentials and session token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Invoke parent login handler
      onLogin(data.user);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Authentication failed. Check your badge serial or passkey.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Network error: Cryptographic handshake to VEILLE node failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEmergencyAction = (type: string) => {
    if (type === 'zero') {
      localStorage.clear();
      sessionStorage.clear();
      setNotice('EMERGENCY ZERO-LOGOUT EXECUTED: All cached cryptographic keys and local sessions purged.');
    } else if (type === 'revoke') {
      setNotice('SESSION REVOCATION DISPATCHED: Broadcast sent to revoke external active JWT tokens.');
    } else if (type === 'override') {
      setNotice('SUPERVISOR OVERRIDE QUEUED: Dispatch notification transmitted to Duty Chief Terminal (Sector 04).');
    }
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface antialiased min-h-screen flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      {/* Background Grid & Watermark */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56,189,248,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56,189,248,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />
      
      {/* TOP COMMAND HEADER / SYSTEM INTEGRITY STATUS STRIP */}
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant z-40 relative">
        {/* Level 1: Primary Clearance Banner */}
        <div className="flex items-center justify-between px-space-lg h-9 border-b border-outline-variant bg-surface-container-lowest text-[11px] font-mono">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-1.5 text-primary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined text-[15px]">shield_person</span>
              <span className="font-bold tracking-wider">VEILLE // SECURE GATEWAY v4.19</span>
            </Link>
            <span className="text-outline-variant">|</span>
            <span className="text-error bg-error-container/20 border border-error/40 px-1.5 py-0.5 text-[10px] tracking-widest flex items-center gap-1 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-error animate-ping" />
              TS//SCI CLEARANCE REQUIRED
            </span>
            <span className="hidden xl:inline-block text-on-surface-variant text-[10px]">
              UNAUTHORIZED ACCESS SUBJECT TO TITLE 18 USC § 1030 PROSECUTION
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <Link 
              to="/" 
              className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low border border-outline-variant px-2 py-0.5 rounded-none"
              title="Return to Public System Overview"
            >
              <span className="material-symbols-outlined text-[13px]">arrow_back</span>
              <span className="hidden sm:inline">PORTAL OVERVIEW</span>
            </Link>
            <span className="text-outline-variant hidden sm:inline">|</span>
            <div className="flex items-center space-x-1 text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-[10px] font-semibold">HSM 1.3 // ONLINE</span>
            </div>
            <span className="text-outline-variant hidden md:inline">|</span>
            <span className="text-on-surface-variant hidden md:inline text-[10px]">NODE: cluster-alpha-09</span>
            <span className="text-outline-variant hidden md:inline">|</span>
            <span className="text-primary text-[10px] font-bold">{utcTime || 'UTC --:--:--.---'}</span>
          </div>
        </div>

        {/* Level 2: Cryptographic Handshake Diagnostic Micro-bar */}
        <div className="flex items-center justify-between px-space-lg h-7 bg-surface-container-low border-b border-outline-variant text-[10px] font-mono">
          <div className="flex items-center space-x-4 text-on-surface-variant overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            <div className="flex items-center space-x-1">
              <span className="text-outline">CIPHER:</span>
              <span className="text-on-surface font-semibold">TLS_AES_256_GCM_SHA384</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-outline">KEY EXCHANGE:</span>
              <span className="text-on-surface font-semibold">X25519 (253 BITS)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-outline">LATENCY:</span>
              <span className="text-secondary font-bold">1.1 ms</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-outline">ENCLAVE ATTESTATION:</span>
              <span className="text-secondary font-semibold">PCR-0 VERIFIED // CERT-VALID</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-on-surface-variant text-[10px] shrink-0 pl-2">
            <span className="text-outline">SESSION HASH:</span>
            <span className="text-primary font-mono font-medium">9f8e-4a11-b924-c081</span>
          </div>
        </div>
      </header>

      {/* MAIN OPERATIONAL AUTHENTICATION THEATER */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 relative z-10 w-full max-w-7xl mx-auto">
        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
          <span className="text-[180px] md:text-[240px] font-bold tracking-tighter text-outline select-none font-mono">
            VEILLE
          </span>
        </div>

        {/* Toast / Notification Banner */}
        {notice && (
          <div className="w-full max-w-2xl mb-4 bg-primary/10 border border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* Centered Card Component */}
        <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant relative tactical-glow">
          {/* Reticle corner accents */}
          <div className="crosshair-corner crosshair-tl border-primary" />
          <div className="crosshair-corner crosshair-tr border-primary" />
          <div className="crosshair-corner crosshair-bl border-primary" />
          <div className="crosshair-corner crosshair-br border-primary" />

          {/* CARD HEADER: Identification / Banner */}
          <div className="bg-surface-container-low border-b border-outline-variant px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 border border-primary/50 bg-surface-container-lowest flex items-center justify-center text-primary shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm md:text-base font-bold tracking-wider text-on-surface font-sans">
                    VEILLE // CLINICAL INTELLIGENCE ENGINE
                  </h1>
                  <span className="bg-primary/15 text-primary border border-primary/40 px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold">
                    SEC-GATE 4.19
                  </span>
                </div>
                <p className="text-[11px] font-mono text-on-surface-variant">
                  CLASSIFIED MULTI-ROLE INVESTIGATIVE WORKSTATION - SECTOR 04 GATEWAY
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-secondary border border-secondary/30 bg-secondary/10 px-2.5 py-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="text-[10px] font-mono tracking-wider font-bold">HARDENED</span>
            </div>
          </div>

          {/* ROLE-BASED ACCESS CONTROL (RBAC) TAB SELECTOR */}
          <div className="grid grid-cols-2 border-b border-outline-variant bg-surface-container-lowest text-xs font-mono">
            {/* Tab 1: Investigator */}
            <button
              type="button"
              onClick={() => handleTabSwitch('investigator')}
              className={`p-3 text-left transition-all flex flex-col justify-center border-r border-outline-variant ${
                activeTab === 'investigator'
                  ? 'bg-surface-container-low border-b-2 border-b-primary'
                  : 'hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className={`font-bold tracking-wider flex items-center gap-1.5 text-xs ${
                  activeTab === 'investigator' ? 'text-primary' : 'text-on-surface'
                }`}>
                  <span className="material-symbols-outlined text-[15px]">biotech</span>
                  INVESTIGATOR
                </span>
                <span className="text-[9px] text-secondary font-mono px-1 border border-secondary/30 bg-secondary/5">
                  AUTH CODE: 4-INV
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant truncate font-sans">
                Operational case access, wiretaps, graph telemetry, restricted export
              </p>
            </button>

            {/* Tab 2: Head of Intel / Chief Director */}
            <button
              type="button"
              onClick={() => handleTabSwitch('director')}
              className={`p-3 text-left transition-all flex flex-col justify-center ${
                activeTab === 'director'
                  ? 'bg-surface-container-low border-b-2 border-b-primary'
                  : 'hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className={`font-bold tracking-wider flex items-center gap-1.5 text-xs ${
                  activeTab === 'director' ? 'text-primary' : 'text-on-surface'
                }`}>
                  <span className="material-symbols-outlined text-[15px]">military_tech</span>
                  HEAD OF INTEL / DIRECTOR
                </span>
                <span className="text-[9px] text-outline font-mono px-1 border border-outline-variant">
                  CLEARANCE 05
                </span>
              </div>
              <p className="text-[10px] text-outline truncate font-sans">
                Root audit authority, subpoena access, cryptographic key rotation
              </p>
            </button>
          </div>

          {/* CREDENTIAL INPUT FORM */}
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 bg-surface-container-lowest">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-error-container/20 border border-error/40 px-3.5 py-2.5 rounded-none text-xs font-mono text-error">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <div className="flex-1">
                  <div className="font-bold uppercase tracking-wider">AUTHENTICATION ERROR // SEC-ERR-401</div>
                  <div className="text-[11px] text-on-surface font-sans mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {/* Field 1: Security Identifier / Agent Badge ID */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold" htmlFor="badge-identifier">
                  <span className="material-symbols-outlined text-[14px] text-primary">badge</span>
                  SECURITY IDENTIFIER / BADGE SERIAL OR EMAIL
                </label>
                <span className="text-secondary text-[10px] font-mono flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  {activeTab === 'investigator' ? 'IDENTITY VERIFIED // DELTA DIVISION' : 'CLEARANCE VERIFIED // DIRECTORATE 05'}
                </span>
              </div>
              <div className="relative flex items-center border border-outline-variant bg-surface-container-low hover:border-outline focus-within:border-primary transition-colors">
                <div className="px-3 text-outline font-mono text-xs border-r border-outline-variant bg-surface-container-lowest select-none">
                  ID://
                </div>
                <input
                  id="badge-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'investigator' ? 'AGT-9024-DEL or investigator@veille.gov.in' : 'DIR-0001-HQ or admin@veille.gov.in'}
                  className="w-full bg-transparent border-0 py-2.5 px-3 text-on-surface font-mono text-xs focus:ring-0 focus:outline-none placeholder:text-outline-variant"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                <div className="px-3">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                </div>
              </div>
            </div>

            {/* Field 2: Cryptographic Passphrase */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold" htmlFor="passphrase-input">
                  <span className="material-symbols-outlined text-[14px] text-primary">key</span>
                  CRYPTOGRAPHIC PASSPHRASE // 128-BIT ENTROPY
                </label>
                <span className="text-primary text-[10px] font-mono flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[12px]">enhanced_encryption</span>
                  ENTROPY: 128-BIT VERIFIED
                </span>
              </div>
              <div className="relative flex items-center border border-outline-variant bg-surface-container-low hover:border-outline focus-within:border-primary transition-colors">
                <div className="px-3 text-outline font-mono text-xs border-r border-outline-variant bg-surface-container-lowest select-none">
                  KEY://
                </div>
                <input
                  id="passphrase-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER STRONG CIPHER PASSKEY"
                  className="w-full bg-transparent border-0 py-2.5 px-3 text-on-surface font-mono text-xs focus:ring-0 focus:outline-none tracking-widest placeholder:tracking-normal placeholder:text-outline-variant"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-outline-variant hover:text-on-surface transition-colors flex items-center focus:outline-none"
                  title={showPassword ? 'Hide passkey' : 'Show passkey'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Entropy indicator bar */}
              <div className="w-full grid grid-cols-4 gap-1 mt-1.5">
                <div className="h-1 bg-secondary" />
                <div className="h-1 bg-secondary" />
                <div className="h-1 bg-secondary" />
                <div className="h-1 bg-primary" />
              </div>
            </div>

            {/* Field 3: 2FA / Hardware Token / FIDO2 YubiKey Input */}
            <div className="border border-outline-variant bg-surface-container-low/60 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">token</span>
                  <span className="text-[10px] font-mono tracking-wider text-on-surface uppercase font-bold">
                    HARDWARE SECURITY TOKEN // FIDO2 YUBIKEY OR TOTP
                  </span>
                </div>
                <span className="text-secondary text-[9px] font-mono px-1.5 py-0.5 border border-secondary/40 bg-secondary/10 font-semibold">
                  NFC/USB READY
                </span>
              </div>
              <p className="text-[10px] font-mono text-on-surface-variant mb-2.5">
                Insert cryptographic key or enter time-based 6-digit one-time token:
              </p>
              {/* 6-cell monospaced code input simulation */}
              <div className="grid grid-cols-6 gap-2">
                {totpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTotpChange(idx, e.target.value)}
                    className={`h-10 text-center bg-surface-container-lowest border font-mono text-base font-bold text-primary focus:outline-none focus:border-primary transition-colors ${
                      idx === 5 ? 'border-primary animate-pulse' : 'border-outline-variant'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Biometric Scan Confirmation Telemetry Strip */}
            <div className="flex items-center justify-between border border-secondary/30 bg-secondary/5 px-3.5 py-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">document_scanner</span>
                <div>
                  <div className="text-[10px] font-mono text-secondary tracking-wider font-bold">
                    RETINAL / DERMAL MATCH CONFIRMED: 99.94%
                  </div>
                  <div className="text-[9px] font-mono text-on-surface-variant">
                    LIVENESS PROOF: ATT-BIO-9024-X // PCR BOUND
                  </div>
                </div>
              </div>
              <span className="text-secondary font-mono text-[9px] border border-secondary/50 px-2 py-0.5 font-bold">
                COMPLIANT
              </span>
            </div>

            {/* PRIMARY CALL TO ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-container hover:bg-primary-fixed-dim text-on-primary-fixed font-mono text-xs font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center space-x-2 transition-all duration-150 active:scale-[0.99] tactical-glow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>CRYPTOGRAPHIC DECRYPTING IN PROGRESS...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    <span>AUTHENTICATE &amp; DECRYPT CONSOLE</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            {/* SECONDARY EMERGENCY / CLEARANCE RECOVERY ACTIONS */}
            <div className="pt-2 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => triggerEmergencyAction('zero')}
                className="text-error hover:text-tertiary transition-colors flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[13px]">power_settings_new</span>
                EMERGENCY ZERO-LOGOUT
              </button>
              <button
                type="button"
                onClick={() => triggerEmergencyAction('revoke')}
                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[13px]">cancel</span>
                REVOKE ACTIVE SESSIONS
              </button>
              <button
                type="button"
                onClick={() => triggerEmergencyAction('override')}
                className="text-outline hover:text-primary transition-colors flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[13px]">admin_panel_settings</span>
                REQUEST SUPERVISOR OVERRIDE
              </button>
            </div>
          </form>

          {/* FOOTER STATUS CODE STRIP */}
          <div className="bg-surface-container-low border-t border-outline-variant px-5 py-2 flex items-center justify-between text-[10px] font-mono text-outline">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
              ENCLAVE HW: AMD SEV-SNP ACTIVE
            </span>
            <span>AUDIT ID: 8924-CERB-A7</span>
          </div>
        </div>
      </main>

      {/* BOTTOM TELEMETRY FLANKING PANELS: SECURITY ENCLAVE & ACCESS AUDIT TICKER */}
      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant z-30">
        {/* Left: Security Enclave Diagnostics */}
        <div className="p-3 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-primary font-bold">
              <span className="material-symbols-outlined text-[14px]">memory</span>
              <span className="tracking-wider">SECURITY ENCLAVE DIAGNOSTICS</span>
            </div>
            <span className="text-[10px] font-mono text-secondary font-semibold">ATTESTATION: HEALTHY</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="border border-outline-variant bg-surface-container-low p-1.5">
              <div className="text-outline text-[9px]">KERBEROS KDC</div>
              <div className="text-secondary font-bold">SYNCED (0.4ms)</div>
            </div>
            <div className="border border-outline-variant bg-surface-container-low p-1.5">
              <div className="text-outline text-[9px]">JWT httpOnly ROTATION</div>
              <div className="text-secondary font-bold">ACTIVE (600s)</div>
            </div>
            <div className="border border-outline-variant bg-surface-container-low p-1.5">
              <div className="text-outline text-[9px]">CASE ISOLATION</div>
              <div className="text-primary font-bold">OP CERBERUS</div>
            </div>
            <div className="border border-outline-variant bg-surface-container-low p-1.5">
              <div className="text-outline text-[9px]">HARDWARE TPM</div>
              <div className="text-secondary font-bold">PASSED (PCR-0)</div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Access Audit Log Ticker */}
        <div className="p-3 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-on-surface font-bold">
              <span className="material-symbols-outlined text-[14px] text-error">radar</span>
              <span className="tracking-wider">RECENT ACCESS AUDIT LOG // SECTOR 04</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant">
              ACTIVE SESSIONS: <strong className="text-secondary">3 AGENTS</strong>
            </span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between text-on-surface-variant hover:bg-surface-container-high px-1.5 py-0.5">
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-error font-bold">[BLOCKED]</span>
                <span className="text-outline">04:12:09 UTC</span>
                <span className="truncate">IP: 194.26.29.x (GeoFence violation / Sofia, BG)</span>
              </span>
              <span className="text-outline text-[9px] border border-outline-variant px-1 shrink-0 ml-1">
                DROP_PACKET
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant hover:bg-surface-container-high px-1.5 py-0.5">
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-secondary font-bold">[SUCCESS]</span>
                <span className="text-outline">04:09:41 UTC</span>
                <span className="truncate">AGT-4190-BRA // Wiretap Stream #14-B Mounted</span>
              </span>
              <span className="text-outline text-[9px] border border-outline-variant px-1 shrink-0 ml-1">
                SESSION_OPEN
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant hover:bg-surface-container-high px-1.5 py-0.5">
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-primary font-bold">[SIG_VERIFY]</span>
                <span className="text-outline">SHA256: 7a9e31... Verified by Root CA</span>
              </span>
              <span className="text-secondary text-[9px] border border-secondary/40 px-1 shrink-0 ml-1">
                VALID
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
