import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NewInvestigationModal from './components/NewInvestigationModal';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Read current user from localStorage
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null');

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: 'dashboard', path: '/dashboard' },
    { id: 'network', label: 'Network Explorer', icon: 'hub', path: '/network-explorer' },
    { id: 'review', label: 'Review Queue', icon: 'rule', path: '/review-queue' },
    { id: 'evidence', label: 'Evidence Library', icon: 'inventory_2', path: '/evidence-library' },
    { id: 'geospatial', label: 'Geospatial Explorer', icon: 'explore', path: '/geospatial-explorer' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: 'smart_toy', path: '/ai-assistant' },
    { id: 'comms', label: 'Comms Intercept', icon: 'phone_in_talk', path: '/communications-intercept' },
    { id: 'pki', label: 'PKI Revocation', icon: 'key_off', path: '/pki-revocation' },
    { id: 'keyvault', label: 'HSM Key Vault', icon: 'lock', path: '/key-vault' },
    { id: 'audit', label: 'Audit Logs', icon: 'history', path: '/audit-logs' },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

  const handleCaseCreated = () => {
    window.dispatchEvent(new Event('case-created'));
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="w-[280px] h-full bg-surface-container border-r border-outline-variant flex flex-col justify-between shrink-0 fixed left-0 top-0 bottom-0 z-30 shadow-lg">
        {/* Workspace Brand / Header */}
        <div 
          onClick={() => navigate('/')}
          className="p-4 border-b border-outline-variant flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 transition-colors"
          title="Return to VEILLE Landing Page"
        >
          <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant overflow-hidden">
            <span className="material-symbols-outlined text-[24px] text-primary">shield_person</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-black text-primary tracking-tight">Intelligence Fusion</h1>
            <div className="text-on-surface-variant font-data-code text-[10px] uppercase">
              {user ? `Operator ${user.role}` : 'Operator 0921-X'}
            </div>
          </div>
        </div>
        
        {/* CTA - New Investigation */}
        <div className="p-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-3 px-4 rounded flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all active:scale-95 duration-200 shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            NEW INVESTIGATION
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full py-2 space-y-1.5 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={
                isActiveRoute(item.path)
                  ? "bg-secondary-container text-on-secondary-container font-bold border-l-4 border-primary flex items-center gap-3 px-3 py-2.5 rounded-r duration-200 ease-in-out w-full text-left cursor-pointer"
                  : "text-on-surface-variant hover:bg-surface-variant/30 flex items-center gap-3 px-3 py-2.5 border-l-4 border-transparent duration-200 ease-in-out w-full text-left cursor-pointer hover:text-on-surface"
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto border-t border-outline-variant p-3 space-y-1 bg-surface-container-lowest/50">
          <button
            onClick={() => navigate('/system-health')}
            className={`flex items-center gap-3 px-3 py-2 rounded duration-200 ease-in-out w-full text-left cursor-pointer ${isActiveRoute('/system-health') ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            System Health
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded duration-200 ease-in-out w-full text-left text-status-critical/80 hover:text-status-critical hover:bg-status-critical/10 cursor-pointer font-data-code text-xs"
            title="Sign out of VEILLE"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 ml-[280px] flex flex-col relative h-full bg-transparent">
        {/* TopAppBar */}
        <header className="bg-surface-container text-primary font-headline-sm text-headline-sm font-semibold w-full h-16 flex items-center px-4 border-b border-outline-variant shadow-none sticky top-0 z-40 justify-between">
          <div className="flex items-center gap-6">
            <div 
              onClick={() => navigate('/')}
              className="font-headline-md text-headline-md font-black tracking-wider text-primary flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
              title="Return to VEILLE Landing Page"
            >
              <span className="material-symbols-outlined text-[26px]">visibility</span>
              VEILLE
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer active:scale-95" title="Notifications">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer active:scale-95" title="Settings">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary-container/20 border border-primary/40 hover:bg-primary-container/40 transition-colors cursor-pointer active:scale-95"
              title="Admin User Profile"
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-surface-container border border-outline-variant rounded-lg shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-outline-variant/60">
                  <div className="font-bold text-xs text-on-surface">{user ? user.email : 'Unknown User'}</div>
                  <div className="text-[10px] font-data-code text-status-success uppercase">ROLE: {user ? user.role : 'UNKNOWN'} {user?.role === 'HEAD' ? '(CLEARANCE 5)' : '(CLEARANCE 3)'}</div>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => { setShowUserMenu(false); navigate('/system-health'); }}
                    className="w-full text-left px-3 py-2 text-xs font-body-md hover:bg-surface-variant rounded flex items-center gap-2 text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                    System Diagnostics
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-body-md text-status-critical hover:bg-status-critical/10 rounded flex items-center gap-2 cursor-pointer font-data-code"
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
        <main className="flex-1 overflow-y-auto pb-12 relative z-0">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 relative z-10">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-lowest text-status-success font-data-code text-data-code fixed bottom-0 right-0 left-[280px] h-8 flex items-center px-4 border-t border-outline-variant shadow-none w-[calc(100%-280px)] justify-between z-40">
          <div className="hidden md:block text-on-surface-variant hover:text-primary transition-colors cursor-default">
            © 2026 VEILLE INTELLIGENCE SYSTEM • SECURE TERMINAL
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              SYSTEM: ONLINE
            </span>
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-default">LATENCY: 24MS</span>
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-default">ENCRYPTION: AES-256</span>
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
