import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NewInvestigationModal from './components/NewInvestigationModal';

interface NotificationItem {
  id: string;
  time: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    time: '2 mins ago',
    title: 'Wiretap Intercept Captured',
    message: 'New GSM-PDU wiretap communication packet intercepted for target Falcon.',
    type: 'CRITICAL',
    read: false
  },
  {
    id: 'n-2',
    time: '15 mins ago',
    title: 'Geospatial Sighting Detected',
    message: 'Cell tower Bandra-01 registered burner handset activation.',
    type: 'WARNING',
    read: false
  },
  {
    id: 'n-3',
    time: '1 hour ago',
    title: 'PKI Certificate Verified',
    message: 'mTLS handshake established for AI inference worker cluster.',
    type: 'INFO',
    read: true
  }
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Settings states
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');
  const [selectedAIModel, setSelectedAIModel] = useState('Gemini 1.5 Flash');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('5s');
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Read current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('auth_user') || 'null');
  const isAdmin = (user?.role || '').toUpperCase() === 'HEAD' || (user?.role || '').toUpperCase() === 'ADMIN';

  // State for Administrator Investigator & Case Assignment Modal
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [investigatorList, setInvestigatorList] = useState<any[]>([
    { id: 'inv-1', email: 'investigator@veille.gov.in', name: 'Field Lead Miller', role: 'INVESTIGATOR (LIMITED)', assignedCases: 1, status: 'ACTIVE' },
    { id: 'inv-2', email: 'vance.ops@veille.gov.in', name: 'Forensics Analyst Vance', role: 'INVESTIGATOR (LIMITED)', assignedCases: 0, status: 'ACTIVE' },
    { id: 'inv-3', email: 'admin@veille.gov.in', name: 'Chief Administrator', role: 'ADMINISTRATOR (FULL)', assignedCases: 0, status: 'HEAD' },
  ]);
  const [assignToast, setAssignToast] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: 'dashboard', path: '/dashboard' },
    { id: 'investigator', label: 'Investigator Workspace', icon: 'badge', path: '/case-workspace' },
    { id: 'network', label: 'Network Explorer', icon: 'hub', path: '/network-explorer' },
    { id: 'review', label: 'Review Queue', icon: 'rule', path: '/review-queue' },
    { id: 'evidence', label: 'Evidence Vault', icon: 'inventory_2', path: '/evidence-library' },
    { id: 'geospatial', label: 'Geospatial Radar', icon: 'explore', path: '/geospatial-explorer' },
    { id: 'ai-assistant', label: 'AI Intelligence Assistant', icon: 'smart_toy', path: '/ai-assistant' },
    { id: 'comms', label: 'Comms Intercept', icon: 'phone_in_talk', path: '/communications-intercept' },
    { id: 'pki', label: 'PKI Operations', icon: 'verified_user', path: '/pki-revocation' },
    { id: 'keyvault', label: 'HSM Key Vault', icon: 'lock', path: '/key-vault' },
    { id: 'audit', label: 'Audit Logs', icon: 'history', path: '/audit-logs' },
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAssignCase = (email: string) => {
    setAssignToast(`Case assigned successfully to ${email}. Notification dispatched.`);
    setTimeout(() => setAssignToast(null), 3500);
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
          <div className="w-10 h-10 rounded bg-primary/15 flex items-center justify-center shrink-0 border border-primary/40 overflow-hidden shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <span className="material-symbols-outlined text-[24px] text-primary">security</span>
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
              onClick={() => setIsManageUsersOpen(true)}
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
          <button
            onClick={() => navigate('/system-health')}
            className={`flex items-center gap-3 px-3 py-1.5 rounded duration-200 ease-in-out w-full text-left cursor-pointer text-xs ${isActiveRoute('/system-health') ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>System Health</span>
          </button>
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
        <header className="bg-surface-container text-primary font-headline-sm text-headline-sm font-semibold w-full h-14 flex items-center px-4 border-b border-outline-variant shadow-none sticky top-0 z-40 justify-between select-none">
          <div className="flex items-center gap-6">
            <div 
              onClick={() => navigate('/')}
              className="font-headline-md text-headline-md font-black tracking-wider text-primary flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
              title="Return to VEILLE Landing Page"
            >
              <span className="material-symbols-outlined text-[24px]">shield</span>
              <span>VEILLE // INTELLIGENCE FUSION</span>
            </div>
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
                          !n.read ? 'border-primary/50' : 'border-outline-variant/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${
                            n.type === 'CRITICAL' ? 'text-red-400' : n.type === 'WARNING' ? 'text-amber-400' : 'text-primary'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-outline">{n.time}</span>
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
                    onClick={() => { setShowUserMenu(false); navigate('/case-workspace'); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-variant rounded flex items-center gap-2 text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    Investigator Workspace
                  </button>
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

      {/* Administrator Investigator Management & Case Assignment Modal */}
      {isManageUsersOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-2xl w-full font-mono text-xs space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span>ADMINISTRATOR // RBAC INVESTIGATOR DISPATCH &amp; CASE ASSIGNMENT</span>
              </div>
              <button onClick={() => setIsManageUsersOpen(false)} className="text-outline hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {assignToast && (
              <div className="p-2.5 bg-primary/15 border border-primary/40 text-primary rounded text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{assignToast}</span>
              </div>
            )}

            <div className="text-[11px] text-outline">
              Head of Operations access level: Allocate investigative leads, enforce zero-trust role clearances, and assign dossiers.
            </div>

            <div className="border border-outline-variant rounded divide-y divide-surface-container-high bg-surface-container-lowest overflow-hidden">
              {investigatorList.map((inv) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-xs">{inv.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        inv.status === 'HEAD' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-primary/10 text-primary border border-primary/30'
                      }`}>
                        {inv.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-outline">{inv.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.status !== 'HEAD' && (
                      <button
                        onClick={() => handleAssignCase(inv.email)}
                        className="px-3 py-1 bg-primary text-surface-container-lowest font-bold text-[10px] hover:bg-primary-fixed-dim rounded transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">assignment_ind</span>
                        <span>ASSIGN CASE</span>
                      </button>
                    )}
                    <span className="text-[10px] text-secondary font-bold px-2 py-0.5 bg-surface-container rounded border border-outline-variant">
                      {inv.assignedCases} Active Cases
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
              <span className="text-[10px] text-outline">
                Clearance Level 5 (TS//SCI) Enforced
              </span>
              <button
                onClick={() => setIsManageUsersOpen(false)}
                className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-bold rounded"
              >
                CLOSE DISPATCH PANEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
