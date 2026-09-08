import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();

  const handleConsoleAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#090C10] text-[#E1E2E8] font-sans antialiased selection:bg-[#4edea3] selection:text-[#003824] relative overflow-x-hidden">
      {/* Tactical Ambient Glow — Emerald / Mint (#4edea3) as in DESIGN.md */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-[#4edea3]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[850px] right-1/4 w-[600px] h-[400px] bg-[#00a572]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Tactical Command Header */}
      <header className="w-full border-b border-[#212B3A] bg-[#0F141C]/90 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 h-16 flex items-center justify-between font-mono">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-sm bg-[#4edea3]/15 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.3)]">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider text-white flex items-center gap-2">
              VEILLE
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 tracking-widest uppercase">
                v4.0 PROD
              </span>
            </div>
            <p className="text-[10px] text-[#87929A]">Clinical &amp; Financial Intelligence Fusion</p>
          </div>
        </div>

        {/* Tactical Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs text-[#87929A]">
          <a href="#features" className="hover:text-[#4edea3] transition-colors tracking-wider uppercase font-semibold">CAPABILITIES</a>
          <a href="#graph" className="hover:text-[#4edea3] transition-colors tracking-wider uppercase font-semibold">INVESTIGATION BOARD</a>
          <a href="#pipeline" className="hover:text-[#4edea3] transition-colors tracking-wider uppercase font-semibold">INGESTION ENGINE</a>
          <a href="#security" className="hover:text-[#4edea3] transition-colors tracking-wider uppercase font-semibold">MERKLE SECURITY</a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConsoleAction}
            className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold px-4 py-2 rounded-sm shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:shadow-[0_0_22px_rgba(111,251,190,0.45)] transition-all flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            <span>{isAuthenticated ? 'OPEN CONSOLE' : 'LOGIN'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono font-bold mb-6 tracking-wider uppercase shadow-[0_0_12px_rgba(78,222,163,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
          <span>[MISSION CRITICAL] ADVANCED GRAPH INTELLIGENCE &amp; CRIME FUSION</span>
        </div>

        {/* Primary Headline with Emerald / Mint Gradient */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-5xl mx-auto mb-6">
          Unified Intelligence Fusion &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4edea3] via-[#6ffbbe] to-[#00a572]">
            Complex Criminal Network Analysis
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#87929A] max-w-3xl mx-auto mb-10 leading-relaxed font-sans">
          Transform unstructured police FIR documents, telecom CDR intercepts, forensic ledgers, and financial hawala trails into high-confidence graph relationships powered by Gemini AI and automated entity disambiguation.
        </p>

        {/* CTA Button Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16 font-mono">
          <button
            onClick={handleConsoleAction}
            className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold px-7 py-3.5 rounded-sm shadow-[0_0_24px_rgba(78,222,163,0.35)] hover:shadow-[0_0_30px_rgba(111,251,190,0.5)] transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>{isAuthenticated ? 'ENTER WORKSPACE' : 'LOGIN'}</span>
          </button>
          <a
            href="#features"
            className="bg-[#151B26] hover:bg-[#1D2024] text-[#E1E2E8] hover:text-[#4edea3] border border-[#212B3A] hover:border-[#4edea3]/50 text-xs font-bold px-6 py-3.5 rounded-sm transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            <span>EXPLORE CAPABILITIES</span>
          </a>
        </div>

        {/* Live Operational Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-16 text-left font-mono">
          <div className="bg-[#0F141C]/90 border border-[#212B3A] p-4 rounded-sm hover:border-[#4edea3]/40 transition-colors">
            <div className="text-[10px] text-[#87929A] font-bold uppercase tracking-wider">INGESTION ENGINE</div>
            <div className="text-2xl font-bold text-[#4edea3] mt-1">REAL-TIME</div>
            <div className="text-[10px] text-[#87929A] mt-0.5">Celery &amp; Kafka Outbox Sync</div>
          </div>
          <div className="bg-[#0F141C]/90 border border-[#212B3A] p-4 rounded-sm hover:border-[#4edea3]/40 transition-colors">
            <div className="text-[10px] text-[#87929A] font-bold uppercase tracking-wider">GRAPH ENGINE</div>
            <div className="text-2xl font-bold text-[#6ffbbe] mt-1">NEO4J GDS</div>
            <div className="text-[10px] text-[#87929A] mt-0.5">Sub-second multi-hop traversal</div>
          </div>
          <div className="bg-[#0F141C]/90 border border-[#212B3A] p-4 rounded-sm hover:border-[#4edea3]/40 transition-colors">
            <div className="text-[10px] text-[#87929A] font-bold uppercase tracking-wider">ENTITY RESOLUTION</div>
            <div className="text-2xl font-bold text-[#4edea3] mt-1">AUTOMATED</div>
            <div className="text-[10px] text-[#87929A] mt-0.5">Hybrid similarity &amp; review queue</div>
          </div>
          <div className="bg-[#0F141C]/90 border border-[#212B3A] p-4 rounded-sm hover:border-[#4edea3]/40 transition-colors">
            <div className="text-[10px] text-[#87929A] font-bold uppercase tracking-wider">AI EXTRACTOR</div>
            <div className="text-2xl font-bold text-[#6ffbbe] mt-1">GEMINI 2.5</div>
            <div className="text-[10px] text-[#87929A] mt-0.5">Constrained JSON schema NER</div>
          </div>
        </div>

        {/* Product Terminal & Board Preview */}
        <div id="graph" className="relative rounded-sm border border-[#212B3A] bg-[#0F141C]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-left p-6 sm:p-8 max-w-5xl mx-auto font-mono">
          <div className="flex items-center justify-between pb-4 border-b border-[#212B3A] mb-6">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4edea3]" />
              <span className="text-xs text-[#87929A] ml-2 font-bold tracking-wider uppercase">
                VEILLE // LIVE INVESTIGATION BOARD PREVIEW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#4edea3] bg-[#4edea3]/15 border border-[#4edea3]/30 px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                SYNAPSE GRAPH LIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Case Dossier Mini-Stack */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-sm bg-[#090C10] border border-[#212B3A] hover:border-[#4edea3]/40 transition-colors">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[18px]">folder_open</span>
                  Operation Falcon
                </div>
                <div className="text-[11px] text-[#87929A] mt-1 font-sans">
                  Cross-border Hawala syndicate &amp; foreign exchange layering
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-sm bg-[#151B26] text-[#4edea3] border border-[#212B3A]">
                    18 Entities
                  </span>
                  <span className="px-2 py-0.5 rounded-sm bg-[#151B26] text-[#E1E2E8] border border-[#212B3A]">
                    17 Relations
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-sm bg-[#090C10] border border-[#212B3A] hover:border-[#4edea3]/40 transition-colors">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[18px]">rule</span>
                  Review Queue
                </div>
                <div className="text-[11px] text-[#87929A] mt-1 font-sans">
                  Human-in-the-loop entity disambiguation
                </div>
                <div className="mt-3 text-[10px] text-[#4edea3] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                  <span>Ambiguity resolution online</span>
                </div>
              </div>
            </div>

            {/* Centroid & Telemetry Display */}
            <div className="md:col-span-2 p-4 rounded-sm bg-[#090C10] border border-[#212B3A] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#87929A] mb-3 pb-2 border-b border-[#212B3A]">
                  <span className="font-bold text-white uppercase tracking-wider">LINK TELEMETRY &amp; CENTROID NODES</span>
                  <span className="text-[#4edea3] font-bold">FUSION CONFIDENCE: 96.4%</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-sm bg-[#0F141C] border border-[#212B3A]">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-400 text-[16px]">person</span>
                      <span className="text-white font-bold">Vikram Malhotra (Falcon)</span>
                    </span>
                    <span className="text-red-400 text-[10px] font-bold px-1.5 py-0.5 bg-red-500/10 border border-red-500/30">
                      THREAT 85 // CRITICAL
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-sm bg-[#0F141C] border border-[#212B3A]">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4edea3] text-[16px]">credit_card</span>
                      <span className="text-white font-bold">ACCT_APEX_SHELL ➔ ACCT_PRIYA_CORP</span>
                    </span>
                    <span className="text-[#4edea3] text-[10px] font-bold font-mono">₹14,20,000 INR LAYERED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-sm bg-[#0F141C] border border-[#212B3A]">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-[16px]">phone_in_talk</span>
                      <span className="text-white font-bold">Satellite Burner (+91-9820-11-2233)</span>
                    </span>
                    <span className="text-purple-400 text-[10px] font-bold">INTERCEPT // TWR-DEL-CP-01</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#212B3A] flex items-center justify-between text-xs text-[#87929A]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                  <span>Neo4j Bolt Knowledge Graph Connected</span>
                </span>
                <span className="text-[#4edea3] hover:text-[#6ffbbe] cursor-pointer font-bold uppercase tracking-wider" onClick={handleConsoleAction}>
                  LAUNCH FULL BOARD ➔
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#212B3A]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase font-mono">
            MISSION-CRITICAL CAPABILITIES
          </h2>
          <p className="text-xs sm:text-sm text-[#87929A] mt-2 font-mono">
            Engineered for high-stakes intelligence analysts, law enforcement investigators, and forensic auditors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="bg-[#0F141C] border border-[#212B3A] rounded-sm p-6 hover:border-[#4edea3]/50 transition-all">
            <div className="w-10 h-10 rounded-sm bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Investigation Board</h3>
            <p className="text-xs text-[#87929A] font-sans leading-relaxed">
              Draggable entity cards, directional relationship splines, auto-alignment columns, and an interactive intelligence dossier with 1-click neighbor traversal.
            </p>
          </div>

          <div className="bg-[#0F141C] border border-[#212B3A] rounded-sm p-6 hover:border-[#4edea3]/50 transition-all">
            <div className="w-10 h-10 rounded-sm bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[20px]">radar</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Geospatial Triangulation</h3>
            <p className="text-xs text-[#87929A] font-sans leading-relaxed">
              Clean, watermark-free tactical dark canvas maps with automatic Indian gazetteer coordinate resolution and cell-tower GPS triangulation.
            </p>
          </div>

          <div className="bg-[#0F141C] border border-[#212B3A] rounded-sm p-6 hover:border-[#4edea3]/50 transition-all">
            <div className="w-10 h-10 rounded-sm bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Gemini 2.5 Flash Engine</h3>
            <p className="text-xs text-[#87929A] font-sans leading-relaxed">
              State-of-the-art NLP extractor enforcing strict Pydantic JSON schemas to parse complex FIRs, seized chats, and witness statements with zero hallucinated entity types.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Merkle Auditability */}
      <section id="security" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#212B3A]">
        <div className="bg-[#0F141C] border border-[#212B3A] rounded-sm p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 font-mono">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 text-xs font-bold mb-4 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>FORENSIC CHAIN OF CUSTODY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Immutable Merkle Tree Audit Logging &amp; RBAC
            </h2>
            <p className="text-xs sm:text-sm text-[#87929A] mt-3 leading-relaxed font-sans">
              Every query, evidence ingestion, entity merge, and graph export is immutably sealed with SHA-256 digests in an append-only audit trail with strict role-based access control.
            </p>
          </div>
          <button
            onClick={handleConsoleAction}
            className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-bold px-6 py-3.5 rounded-sm shadow-[0_0_18px_rgba(78,222,163,0.3)] transition-all cursor-pointer shrink-0 uppercase tracking-wider"
          >
            ENTER SECURE TERMINAL
          </button>
        </div>
      </section>

      {/* Terminal Footer */}
      <footer className="w-full border-t border-[#212B3A] bg-[#090C10] px-6 lg:px-12 py-8 text-xs font-mono text-[#87929A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">VEILLE v4.0</span>
            <span>•</span>
            <span>Mission-Critical Crime &amp; Intelligence Fusion Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[#87929A]">
            <button onClick={handleConsoleAction} className="hover:text-[#4edea3] transition-colors cursor-pointer uppercase">
              OPERATOR SIGN IN
            </button>
            <a href="#features" className="hover:text-[#4edea3] transition-colors uppercase">
              CAPABILITIES
            </a>
            <span className="text-[#4edea3]">RESTRICTED OPERATIONAL DISPLAY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
