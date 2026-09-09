import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NewInvestigationModal from './components/NewInvestigationModal';
import { api } from './api/client';

interface NotificationItem {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  is_read: boolean;
}

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Settings states
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');
  const [selectedAIModel, setSelectedAIModel] = useState('Gemini 1.5 Flash');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('5s');
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Read current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('auth_user') || 'null');
  const isAdmin = (user?.role || '').toUpperCase() === 'HEAD' || (user?.role || '').toUpperCase() === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: 'dashboard', path: '/dashboard' },
    { id: 'investigator', label: 'Investigator Workspace', icon: 'badge', path: '/case-workspace' },
    { id: 'network', label: 'Network Explorer', icon: 'hub', path: '/network-explorer' },
    { id: 'review', label: 'Review Queue', icon: 'rule', path: '/review-queue' },
    { id: 'evidence', label: 'Evidence Vault', icon: 'inventory_2', path: '/evidence-library' },
    { id: 'geospatial', label: 'Geospatial Radar', icon: 'explore', path: '/geospatial-explorer' },
    { id: 'ai-assistant', label: 'AI Intelligence Assistant', icon: 'smart_toy', path: '/ai-assistant' },
    { id: 'comms', label: 'Comms Intercept', icon: 'phone_in_talk', path: '/communications-intercept' },
    ...(isAdmin ? [
      { id: 'pki', label: 'PKI Operations', icon: 'verified_user', path: '/pki-revocation' },
      { id: 'keyvault', label: 'HSM Key Vault', icon: 'lock', path: '/key-vault' },
      { id: 'audit', label: 'Audit Logs', icon: 'history', path: '/audit-logs' },
    ] : [])
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('veille_auth');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCaseCreated = () => {
    window.dispatchEvent(new Event('case-created'));
    navigate('/dashboard');
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/v1/notifications');
      setNotifications(res);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/v1/notifications/read', {});
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="w-[280px] h-full bg-surface-container border-r border-outline-variant flex flex-col justify-between shrink-0 fixed left-0 top-0 bottom-0 z-30 shadow-lg select-none">
        {/* Workspace Brand / Header */}
        <div 
          onClick={() => navigate('/')}
          className="p-4 border-b border-outline-variant flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 transition-colors"
          title="Return to VEILLE Landing Page"
        >
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="VEILLE" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-black text-primary tracking-tight">VEILLE</h1>
            <div className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block mt-0.5 ${
              isAdmin 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                : 'bg-primary/10 text-primary border-primary/30'
            }`}>
              {isAdmin ? 'ADMINISTRATOR (FULL)' : 'INVESTIGATOR (LIMITED)'}
            </div>
          </div>
        </div>
        
        {/* CTA - New Investigation & Admin Management */}
        <div className="p-3 space-y-2 font-mono">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-2 px-3 rounded flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all active:scale-95 duration-200 shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>NEW INVESTIGATION</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-surface-container-high hover:bg-surface-container-highest text-amber-400 border border-amber-500/30 py-1.5 px-3 rounded flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-[11px]"
            >
              <span className="material-symbols-outlined text-[15px]">manage_accounts</span>
              <span>MANAGE INVESTIGATORS</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full py-1 space-y-1 px-3 overflow-y-auto font-sans text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={
                isActiveRoute(item.path)
                  ? "bg-secondary-container text-on-secondary-container font-bold border-l-4 border-primary flex items-center gap-3 px-3 py-2 rounded-r duration-200 ease-in-out w-full text-left cursor-pointer shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant/30 flex items-center gap-3 px-3 py-2 border-l-4 border-transparent duration-200 ease-in-out w-full text-left cursor-pointer hover:text-on-surface"
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto border-t border-outline-variant p-3 space-y-1 bg-surface-container-lowest/50">
          {isAdmin && (
            <button
              onClick={() => navigate('/system-health')}
              className={`flex items-center gap-3 px-3 py-1.5 rounded duration-200 ease-in-out w-full text-left cursor-pointer text-xs ${isActiveRoute('/system-health') ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              <span>System Health</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-1.5 rounded duration-200 ease-in-out w-full text-left text-status-critical/80 hover:text-status-critical hover:bg-status-critical/10 cursor-pointer font-data-code text-xs"
            title="Sign out of VEILLE"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 ml-[280px] flex flex-col relative h-full bg-transparent">
        {/* TopAppBar */}
        <header className="bg-surface-container text-primary font-headline-sm text-headline-sm font-semibold w-full h-14 flex items-center px-4 border-b border-outline-variant shadow-none sticky top-0 z-40 justify-between select-none relative">
          <div></div>
          
          <div 
            onClick={() => navigate('/')}
            className="absolute left-1/2 -translate-x-1/2 font-headline-md text-headline-md font-black tracking-wider text-primary flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
            title="Return to VEILLE Landing Page"
          >
            <img src="/logo.png" alt="VEILLE" className="w-10 h-10 object-contain" />
            <span>VEILLE</span>
          </div>
          
          <div className="flex items-center gap-2 relative">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                  setShowUserMenu(false);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer relative"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>

              {/* Notifications Drawer */}
              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-3 z-50 animate-fade-in font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">notifications</span>
                      <span>TACTICAL ALERTS ({unreadCount})</span>
                    </span>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-outline hover:text-primary cursor-pointer"
                    >
                      MARK ALL READ
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 bg-surface-container-low border rounded space-y-1 ${
                          !n.is_read ? 'border-primary/50' : 'border-outline-variant/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${
                            n.type === 'CRITICAL' ? 'text-red-400' : n.type === 'WARNING' ? 'text-amber-400' : 'text-primary'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-outline">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
                title="System Settings"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>

              {/* Settings Modal */}
              {showSettings && (
                <div className="absolute right-0 top-11 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-4 z-50 animate-fade-in font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                      <span>SYSTEM PREFERENCES</span>
                    </span>
                    <button onClick={() => setShowSettings(false)} className="text-outline hover:text-white">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] uppercase text-outline block mb-1">BACKEND API URI</label>
                      <input
                        type="text"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant px-2.5 py-1 text-on-surface rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-outline block mb-1">DEFAULT AI REASONER</label>
                      <select
                        value={selectedAIModel}
                        onChange={(e) => setSelectedAIModel(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant px-2.5 py-1 text-primary rounded text-xs"
                      >
                        <option value="Gemini 1.5 Flash">Gemini 1.5 Flash (Low-Latency)</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Deep Analysis)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-outline block mb-1">TELEMETRY REFRESH</label>
                      <select
                        value={autoRefreshInterval}
                        onChange={(e) => setAutoRefreshInterval(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant px-2.5 py-1 text-on-surface rounded text-xs"
                      >
                        <option value="1s">1 Second (Live SIGINT)</option>
                        <option value="5s">5 Seconds (Balanced)</option>
                        <option value="30s">30 Seconds (Low Network)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-on-surface">AUDIO RADIO SYNTHESIS</span>
                      <input
                        type="checkbox"
                        checked={soundAlerts}
                        onChange={(e) => setSoundAlerts(e.target.checked)}
                        className="accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant flex justify-end">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-3 py-1 bg-primary text-surface-container-lowest font-bold rounded text-xs cursor-pointer"
                    >
                      SAVE PREFERENCES
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-primary bg-primary-container/20 border border-primary/40 hover:bg-primary-container/40 transition-colors cursor-pointer"
              title="Admin User Profile"
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-11 w-64 bg-surface-container border border-outline-variant rounded-lg shadow-2xl p-2 z-50 animate-fade-in font-mono text-xs">
                <div className="px-3 py-2 border-b border-outline-variant/60">
                  <div className="font-bold text-xs text-on-surface">{user ? (user.email || user.name) : 'Lead Investigator'}</div>
                  <div className="text-[10px] text-secondary font-bold uppercase mt-0.5">
                    CLEARANCE: TS//SCI (LEVEL 5)
                  </div>
                </div>
                <div className="p-1 space-y-1">
                  <button 
                    onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-variant rounded flex items-center gap-2 text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                    Profile & Settings
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => { setShowUserMenu(false); navigate('/pki-revocation'); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-surface-variant rounded flex items-center gap-2 text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        PKI Certificates
                      </button>
                      <button 
                        onClick={() => { setShowUserMenu(false); navigate('/system-health'); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-surface-variant rounded flex items-center gap-2 text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                        System Diagnostics
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-status-critical hover:bg-status-critical/10 rounded flex items-center gap-2 cursor-pointer font-bold border-t border-outline-variant/40 mt-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Scrollable */}
        <main className="flex-1 overflow-y-auto pb-10 relative z-0">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 relative z-10">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-lowest text-status-success font-data-code text-data-code fixed bottom-0 right-0 left-[280px] h-8 flex items-center px-4 border-t border-outline-variant shadow-none w-[calc(100%-280px)] justify-between z-40 select-none text-[11px]">
          <div className="hidden md:block text-on-surface-variant hover:text-primary transition-colors cursor-default">
            © 2026 VEILLE INTELLIGENCE SYSTEM • NATIONAL SECURITY FORENSICS
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              SYSTEM: ONLINE
            </span>
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-default">LATENCY: 14MS</span>
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-default">ZERO-TRUST SECURE</span>
          </div>
        </footer>
      </div>

      {/* New Investigation Modal */}
      <NewInvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />
    </div>
  );
};

export default Layout;
