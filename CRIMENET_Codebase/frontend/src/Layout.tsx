import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import NewInvestigationModal from './components/NewInvestigationModal';

const Layout = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('veille_auth');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const navItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'executive_dashboard', path: '/executive-dashboard', label: 'Executive Dashboard', icon: 'monitoring' },
    { id: 'network_explorer', path: '/network-explorer', label: 'Network Explorer', icon: 'hub' },
    { id: 'review_queue', path: '/review-queue', label: 'Review Queue', icon: 'rule' },
    { id: 'evidence_library', path: '/evidence-library', label: 'Evidence Library', icon: 'library_books' },
    { id: 'geospatial_explorer', path: '/geospatial-explorer', label: 'Geospatial Explorer', icon: 'map' },
    { id: 'audit_logs', path: '/audit-logs', label: 'Audit Logs', icon: 'history_edu' },
    { id: 'ai_intel_assistant', path: '/ai-assistant', label: 'AI Intel Assistant', icon: 'robot_2' },
    { id: 'communications_intercept', path: '/communications-intercept', label: 'Live Intercept Feed', icon: 'graphic_eq' },
    { id: 'export_report', path: '/export-report', label: 'Export Report', icon: 'picture_as_pdf' },
  ];

  const isActiveRoute = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  return (
    <div className="bg-background text-on-surface font-body-md h-screen w-screen overflow-hidden flex selection:bg-primary selection:text-on-primary">
      {/* SideNavBar */}
      <aside className="bg-surface-container-low text-primary font-label-caps text-label-caps fixed left-0 top-0 h-full w-[280px] flex flex-col border-r border-outline-variant shadow-none z-50">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant overflow-hidden">
            <span className="material-symbols-outlined text-[24px]">shield_person</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-black text-primary tracking-tight">Intelligence Fusion</h1>
            <div className="text-on-surface-variant font-data-code text-[10px] uppercase">Operator 0921-X</div>
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
            <div className="font-headline-md text-headline-md font-black tracking-wider text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[26px]">visibility</span>
              VEILLE
            </div>
            <div className="hidden md:flex items-center gap-2 text-on-surface-variant font-data-code text-data-code">
              <span className="px-2 py-1 bg-surface-variant/50 rounded text-on-surface-variant opacity-75 border border-outline-variant/30">Case: 2026-ALPHA-09</span>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>
              <span className="px-2 py-1 bg-surface-variant/50 rounded text-status-critical opacity-90 border border-outline-variant/30">Priority: High</span>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>
              <span className="px-2 py-1 bg-surface-variant/50 rounded text-status-success opacity-90 border border-outline-variant/30">Status: Active</span>
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
                  <div className="font-bold text-xs text-on-surface">admin@veille.gov.in</div>
                  <div className="text-[10px] font-data-code text-status-success uppercase">ROLE: ADMIN (CLEARANCE 5)</div>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/audit-logs'); }}
                  className="w-full text-left px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-variant rounded flex items-center gap-2 cursor-pointer mt-1"
                >
                  <span className="material-symbols-outlined text-[16px]">history_edu</span> Audit Logs
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-status-critical hover:bg-status-critical/10 rounded flex items-center gap-2 cursor-pointer mt-1 font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span> Sign Out / Switch User
                </button>
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
      />
    </div>
  );
};

export default Layout;
