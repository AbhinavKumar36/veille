import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [briefingSubmitted, setBriefingSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('Air-Gapped Sovereign Hardware');
  const [clearance, setClearance] = useState('TS//SCI Eligible');
  const [missionBrief, setMissionBrief] = useState('');

  const handleBriefingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBriefingSubmitted(true);
  };

  const handleConsoleAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface font-sans antialiased selection:bg-primary selection:text-on-primary-fixed min-h-screen w-full overflow-x-hidden">
      {/* ===================================================================== */}
      {/* 1. TACTICAL TOP BAR / COMMAND HEADER                                  */}
      {/* ===================================================================== */}
      <header className="w-full border-b border-outline-variant bg-surface-container-lowest/95 z-50 sticky top-0 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand + Status Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="w-2 h-2 bg-secondary animate-pulse rounded-full"></span>
            <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-primary uppercase flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">visibility</span>
              VEILLE // INTEL-ENGINE
            </span>
          </div>
          <span className="hidden sm:inline-block border border-outline-variant px-1.5 sm:px-2 py-0.5 text-[10px] font-mono text-on-surface-variant whitespace-nowrap">
            TS//SCI CLEARANCE
          </span>
          <span className="hidden lg:inline-block border border-secondary text-secondary bg-secondary/10 px-1.5 sm:px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">
            FIPS 140-3 L4
          </span>
        </div>

        {/* Center: Operational Navigation */}
        <nav className="hidden 2xl:flex items-center gap-5 text-[11px] font-mono tracking-wider">
          <a className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap" href="#architecture">ARCHITECTURE</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap" href="#graph-engine">GRAPH-ENGINE</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap" href="#telemetry">PIPELINE TELEMETRY</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap" href="#enclaves">SECURITY ENCLAVES</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap" href="#case-studies">CASE DOSSIERS</a>
        </nav>

        {/* Right: Telemetry Badges & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a 
            className="hidden md:flex bg-surface-container border border-outline-variant hover:border-primary text-on-surface px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors items-center gap-1.5 whitespace-nowrap" 
            href="#briefing"
          >
            <span className="material-symbols-outlined text-[14px] text-primary">encrypted</span>
            <span>REQUEST BRIEFING</span>
          </a>

          <button
            onClick={handleConsoleAction}
            className="bg-primary hover:bg-primary-fixed text-on-primary font-mono text-[11px] sm:text-xs px-3 sm:px-4 py-2 font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)] cursor-pointer whitespace-nowrap rounded-sm shrink-0"
            title="Access Restricted Operator Console"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">terminal</span>
            <span>{isAuthenticated ? 'OPEN CONSOLE' : 'OPERATOR LOGIN'}</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION & OPERATIONAL THEATER                                 */}
      {/* ===================================================================== */}
      <section className="relative border-b border-outline-variant pt-12 pb-16 px-4 lg:px-8 grid-bg-tactical overflow-hidden">
        {/* Corner Reticles */}
        <div className="absolute top-4 left-4 text-outline-variant font-mono text-[10px] select-none pointer-events-none">+ RETICLE_01 [LAT 38.8951 N / LON 77.0364 W]</div>
        <div className="absolute top-4 right-4 text-outline-variant font-mono text-[10px] select-none pointer-events-none">NODE_CLUSTER: QUANTUM_DEFENSE_L4 +</div>
        
        <div className="max-w-7xl mx-auto">
          {/* Sector Badge */}
          <div className="inline-flex items-center gap-2.5 border border-outline-variant bg-surface-container-low px-3 py-1.5 mb-6 text-[11px] font-mono">
            <span className="w-2 h-2 bg-primary animate-pulse rounded-full"></span>
            <span className="text-primary tracking-widest uppercase font-bold">TACTICAL BIOSECURITY &amp; ADVERSARY GRAPH ENGINE v4.8</span>
            <span className="text-outline-variant">|</span>
            <span className="text-on-surface-variant">OP CERBERUS // CASE-8924</span>
          </div>

          {/* Main Tactical Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-on-background tracking-tight max-w-5xl leading-tight uppercase mb-6 font-sans">
            Autonomous Clinical Intelligence &amp; Adversary Graph Resolution
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant max-w-3xl mb-8 leading-relaxed font-sans">
            Turn petabytes of unstructured SIGINT, bio-pathogen manifests, intercept transcripts, and CDR cell handovers into mathematically rigorous knowledge graphs with sub-second entity resolution.
          </p>

          {/* CTA Buttons & Console Prompt */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button 
              onClick={handleConsoleAction}
              className="bg-primary hover:bg-primary-fixed text-on-primary font-mono text-xs sm:text-sm px-6 py-3.5 tracking-wider font-bold uppercase flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.35)] cursor-pointer rounded-sm"
            >
              <span className="material-symbols-outlined text-[18px]">shield_person</span>
              <span>{isAuthenticated ? 'ENTER VEILLE CONSOLE' : 'AUTHENTICATE OPERATOR CONSOLE'}</span>
            </button>

            <a 
              className="border border-outline-variant hover:border-primary text-on-surface font-mono text-xs sm:text-sm px-6 py-3.5 tracking-wider uppercase flex items-center gap-2 bg-surface-container-low transition-colors rounded-sm" 
              href="#architecture"
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span>INSPECT SYSTEM ARCHITECTURE</span>
            </a>

            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant font-mono text-xs text-outline">
              <span className="text-primary font-bold">QUERY://</span>
              <span className="text-on-surface-variant">resolve_actor(entity="BV-9024", depth=4, algo="louvain")</span>
            </div>
          </div>

          {/* Live Telemetry Ribbon */}
          <div id="telemetry" className="grid grid-cols-2 md:grid-cols-4 border border-outline-variant bg-surface-container-lowest mb-12 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
            <div className="p-4">
              <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Ingestion Velocity</div>
              <div className="font-mono text-xl sm:text-2xl text-primary font-bold">482.9K <span className="text-xs font-normal text-on-surface-variant">msg/sec</span></div>
              <div className="font-mono text-xs text-secondary mt-0.5">▲ +12.4% peak burst</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Resolution Latency</div>
              <div className="font-mono text-xl sm:text-2xl text-secondary font-bold">14.2 <span className="text-xs font-normal text-on-surface-variant">ms (p99)</span></div>
              <div className="font-mono text-xs text-on-surface-variant mt-0.5">Neo4j Cluster + GDS</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Forensic State</div>
              <div className="font-mono text-xl sm:text-2xl text-primary font-bold">PBFT SEALED</div>
              <div className="font-mono text-xs text-on-surface-variant mt-0.5">RFC 3161 Ledger Verif.</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Post-Quantum Layer</div>
              <div className="font-mono text-xl sm:text-2xl text-on-surface font-bold">ML-KEM-1024</div>
              <div className="font-mono text-xs text-secondary mt-0.5">CNSA 2.0 Compliant</div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Interactive Hero Mockup: The VEILLE Intelligence Theater     */}
          {/* ============================================================ */}
          <div className="border border-outline-variant bg-surface-container-low shadow-2xl relative">
            {/* Mockup Top Bar */}
            <div className="min-h-[36px] py-2 bg-surface-container-lowest border-b border-outline-variant flex flex-wrap items-center justify-between px-4 gap-2">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-error rounded-none"></span>
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-none"></span>
                <span className="w-2.5 h-2.5 bg-secondary rounded-none"></span>
                <span className="text-[11px] font-mono text-on-surface-variant tracking-wider">
                  VEILLE WORKSPACE :: EGO-NET #BV-9024 (CROSS-BORDER BIO-AGENT CARRIER)
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-outline">
                <span>GRAPH CENTROID: 0.884</span>
                <span className="text-secondary bg-secondary/10 px-1.5 py-0.5 border border-secondary">VERIFIED SYNDICATE</span>
                <span>SECURE STREAM: ONLINE</span>
              </div>
            </div>

            {/* Inner Tactical Console Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant min-h-[460px]">
              {/* Left Pane: Target Node Dossier */}
              <div className="lg:col-span-3 p-4 bg-surface-container-lowest/80 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant mb-3">
                    <span className="text-xs font-mono text-primary uppercase font-bold">TARGET DOSSIER</span>
                    <span className="text-[10px] font-mono text-error border border-error px-1.5 bg-error/10">THREAT: CRITICAL</span>
                  </div>
                  
                  {/* Biometric & Alias Card */}
                  <div className="p-3 border border-outline-variant bg-surface mb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-surface-container-high border border-outline flex items-center justify-center text-primary font-bold font-mono text-xs">
                        BV9
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface">Dr. Aris Vanev</div>
                        <div className="text-xs font-mono text-outline">BIO-SYNDICATE BROKER</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono space-y-1 text-on-surface-variant">
                      <div className="flex justify-between"><span>CELL HANDOVER:</span> <span className="text-primary">AZIMUTH 214°</span></div>
                      <div className="flex justify-between"><span>CARRIER FREQ:</span> <span className="text-on-surface">1.842 GHz</span></div>
                      <div className="flex justify-between"><span>CO-TRAVEL:</span> <span className="text-secondary">3 BURNERS VERIF.</span></div>
                      <div className="flex justify-between"><span>PATHOGEN SIG:</span> <span className="text-error">BSL-4 ENGINEERED</span></div>
                    </div>
                  </div>

                  {/* Louvain Centrality Metrics */}
                  <div className="border border-outline-variant p-3 bg-surface text-xs font-mono">
                    <div className="text-[10px] text-outline uppercase mb-2">Centrality Calculations</div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1"><span>Betweenness</span><span className="text-primary font-bold">0.942</span></div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden"><div className="bg-primary h-full" style={{ width: '94%' }}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1"><span>PageRank Centrality</span><span className="text-secondary font-bold">0.887</span></div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden"><div className="bg-secondary h-full" style={{ width: '88%' }}></div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleConsoleAction}
                  className="w-full py-2.5 bg-surface-container border border-primary text-primary font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>OPEN ADMISSIBLE DOSSIER</span>
                </button>
              </div>

              {/* Middle Pane: High-Density Interactive Graph Canvas Simulation */}
              <div className="lg:col-span-6 p-4 relative bg-[#090C10] flex flex-col justify-between overflow-hidden gap-4 min-h-[340px]">
                <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="border border-outline-variant bg-surface px-2 py-0.5 text-on-surface">CLUSTER 07 :: EURASIAN VECTORS</span>
                    <span className="text-secondary">● 1,489 NODES / 8,241 EDGES</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 border border-outline-variant text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[16px]">zoom_in</span></button>
                    <button className="p-1 border border-outline-variant text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[16px]">zoom_out</span></button>
                    <button className="p-1 border border-outline-variant text-on-surface-variant hover:text-primary cursor-pointer"><span className="material-symbols-outlined text-[16px]">filter_center_focus</span></button>
                  </div>
                </div>

                {/* SVG Graph Visualizer Graphic */}
                <div className="relative my-4 h-64 flex items-center justify-center">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer Node Links */}
                    <line stroke="#3e484f" strokeDasharray="3 3" strokeWidth="1.5" x1="300" x2="160" y1="130" y2="60"></line>
                    <line stroke="#38BDF8" strokeWidth="2" x1="300" x2="440" y1="130" y2="70"></line>
                    <line stroke="#F43F5E" strokeWidth="2" x1="300" x2="480" y1="130" y2="180"></line>
                    <line stroke="#4edea3" strokeWidth="1.5" x1="300" x2="180" y1="130" y2="200"></line>
                    <line stroke="#3e484f" strokeWidth="1" x1="160" x2="100" y1="60" y2="120"></line>
                    <line stroke="#38BDF8" strokeWidth="1.5" x1="440" x2="520" y1="70" y2="50"></line>
                    <line stroke="#F43F5E" strokeWidth="1" x1="480" x2="550" y1="180" y2="210"></line>
                    <line stroke="#4edea3" strokeWidth="1" x1="180" x2="110" y1="200" y2="230"></line>
                    
                    {/* Reticles & Central Radius Rings */}
                    <circle cx="300" cy="130" r="45" stroke="#38BDF8" strokeOpacity="0.2" strokeWidth="1"></circle>
                    <circle cx="300" cy="130" r="85" stroke="#38BDF8" strokeDasharray="4 4" strokeOpacity="0.1" strokeWidth="1"></circle>
                    
                    {/* Peripheral Nodes */}
                    <circle cx="160" cy="60" fill="#111418" r="10" stroke="#87929a" strokeWidth="1.5"></circle>
                    <text fill="#bdc8d1" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="160" y="40">IMSI-9012 (BURNER)</text>
                    
                    <circle className="animate-pulse" cx="480" cy="180" fill="#93000a" r="14" stroke="#F43F5E" strokeWidth="2"></circle>
                    <text fill="#ffb4ab" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="480" y="210">BIO-SYNTH VECTOR #4</text>
                    
                    <circle cx="440" cy="70" fill="#004965" r="12" stroke="#38BDF8" strokeWidth="2"></circle>
                    <text fill="#c4e7ff" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="440" y="50">TRANSIT COURIER</text>
                    
                    <circle cx="180" cy="200" fill="#00311f" r="9" stroke="#4edea3" strokeWidth="1.5"></circle>
                    <text fill="#6ffbbe" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="180" y="224">SIGINT TAP #88</text>
                    
                    {/* Sub-leaf nodes */}
                    <circle cx="100" cy="120" fill="#1d2024" r="6" stroke="#87929a"></circle>
                    <circle cx="520" cy="50" fill="#1d2024" r="7" stroke="#38BDF8"></circle>
                    <circle cx="550" cy="210" fill="#1d2024" r="6" stroke="#F43F5E"></circle>
                    <circle cx="110" cy="230" fill="#1d2024" r="6" stroke="#4edea3"></circle>
                    
                    {/* Central Primary Target Node */}
                    <circle cx="300" cy="130" fill="#111418" r="18" stroke="#38BDF8" strokeWidth="2.5"></circle>
                    <circle cx="300" cy="130" fill="#38BDF8" r="6"></circle>
                    <text fill="#38BDF8" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" textAnchor="middle" x="300" y="165">TARGET #BV-9024</text>
                  </svg>
                </div>

                {/* Real-time HUD Status Footer */}
                <div className="flex items-center justify-between border-t border-outline-variant pt-2 text-xs font-mono text-outline">
                  <span>ALGORITHM: LOUVAIN MODULARITY [Q=0.74]</span>
                  <span className="text-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                    <span>MERKLE BLOCK #9214-B RESOLVED</span>
                  </span>
                </div>
              </div>

              {/* Right Pane: Real-Time Wiretap & Telemetry Stream */}
              <div className="lg:col-span-3 p-4 bg-surface-container-lowest/90 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant mb-3">
                    <span className="text-xs font-mono text-primary uppercase font-bold">SIGINT STREAM</span>
                    <span className="text-xs font-mono text-secondary">WHISPER-V3 LIVE</span>
                  </div>
                  
                  {/* Stream Intercept Log */}
                  <div className="space-y-2.5 font-mono">
                    <div className="p-2.5 border border-outline-variant bg-surface">
                      <div className="flex justify-between text-outline text-[10px] mb-1">
                        <span>14:02:18.892 Z</span>
                        <span className="text-secondary">CONF: 99.4%</span>
                      </div>
                      <div className="text-on-surface text-xs font-sans">"Sample consignments transferred to cold-chain container 4B..."</div>
                      <div className="mt-1 text-[10px] text-primary">[AUDIO-SIGINT // ENCRYPTED DECODE]</div>
                    </div>
                    <div className="p-2.5 border border-outline-variant bg-surface">
                      <div className="flex justify-between text-outline text-[10px] mb-1">
                        <span>14:02:14.210 Z</span>
                        <span className="text-secondary">TOWER AZ: 214°</span>
                      </div>
                      <div className="text-on-surface text-xs font-sans">Handover triangulated between MCC 284 / MNC 01 / LAC 41829.</div>
                      <div className="mt-1 text-[10px] text-on-surface-variant">[CELL-CDR CO-LOCATION DETECTED]</div>
                    </div>
                    <div className="p-2.5 border border-outline-variant bg-surface">
                      <div className="flex justify-between text-outline text-[10px] mb-1">
                        <span>14:01:58.004 Z</span>
                        <span className="text-error">MERKLE ATTEST</span>
                      </div>
                      <div className="text-on-surface text-xs font-sans">PBFT Root: <span className="font-mono text-[10px] text-outline">0x9f82c...ba12</span></div>
                      <div className="mt-1 text-[10px] text-error">[COURT ADMISSIBLE RFC 3161]</div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-outline-variant text-[11px] font-mono text-outline flex justify-between">
                  <span>PIPELINE: KAFKA 12-BROKER</span>
                  <span className="text-secondary font-bold">ZERO-DROPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. PLATFORM CORE PILLARS (Tactical Bento Grid)                        */}
      {/* ===================================================================== */}
      <section className="py-20 px-4 lg:px-8 border-b border-outline-variant bg-surface-container-lowest" id="graph-engine">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-outline-variant">
            <div>
              <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">// CAPABILITY MATRIX</div>
              <h2 className="text-2xl sm:text-4xl font-black text-on-background uppercase tracking-tight font-sans">
                Four Pillars of Mission-Critical Resolution
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-md mt-4 md:mt-0 font-sans">
              Engineered for high-stakes intelligence agency operational commands where false positives carry geopolitical or clinical catastrophe.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 01 */}
            <div className="bg-surface border border-outline-variant p-6 flex flex-col justify-between hover:border-primary/60 transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-primary font-bold">01 // INGESTION</span>
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">document_scanner</span>
                </div>
                <h3 className="text-base font-bold text-on-surface uppercase mb-3 font-sans">
                  Unstructured Evidence Ingestion
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-sans">
                  High-throughput asynchronous ingestion of seized flash drives, WhatsApp / Signal database dumps, wiretapped GSM audio, and scanned pathogen inventory manifests.
                </p>
                <ul className="text-xs font-mono text-outline space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>Whisper-v3 Multilingual ASR</span></li>
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>Tesseract 5 Neural OCR</span></li>
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>MinIO Encrypted Object Vault</span></li>
                </ul>
              </div>
              <div className="pt-4 border-t border-outline-variant text-xs font-mono text-on-surface-variant flex justify-between">
                <span>BURST RATE: 10GB/S</span>
                <span className="text-secondary font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Pillar 02 */}
            <div className="bg-surface border border-outline-variant p-6 flex flex-col justify-between hover:border-secondary/60 transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-secondary font-bold">02 // TOPOLOGY</span>
                  <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">hub</span>
                </div>
                <h3 className="text-base font-bold text-on-surface uppercase mb-3 font-sans">
                  Mathematical Knowledge Graph
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-sans">
                  Native graph compute executing automated PageRank, Betweenness Centrality, and Louvain community detection to pinpoint shadow ringleaders hiding behind burner chains.
                </p>
                <ul className="text-xs font-mono text-outline space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-secondary">▸</span><span>Neo4j Enterprise Graph Data Science</span></li>
                  <li className="flex items-center gap-2"><span className="text-secondary">▸</span><span>Sub-second 6-hop Traverse</span></li>
                  <li className="flex items-center gap-2"><span className="text-secondary">▸</span><span>Disjoint Component Resolution</span></li>
                </ul>
              </div>
              <div className="pt-4 border-t border-outline-variant text-xs font-mono text-on-surface-variant flex justify-between">
                <span>GRAPH CAPACITY: 100B EDGES</span>
                <span className="text-secondary font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Pillar 03 */}
            <div className="bg-surface border border-outline-variant p-6 flex flex-col justify-between hover:border-primary/60 transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-primary font-bold">03 // GEOSPATIAL</span>
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">cell_tower</span>
                </div>
                <h3 className="text-base font-bold text-on-surface uppercase mb-3 font-sans">
                  Cell Tower &amp; CDR Triangulation
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-sans">
                  Correlate millions of Call Detail Records (CDRs) against antenna azimuth beams to identify co-traveling burner devices and clandestine border crossing vectors.
                </p>
                <ul className="text-xs font-mono text-outline space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>Azimuth Beam Sector Analysis</span></li>
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>Burner Swap Temporal Pairing</span></li>
                  <li className="flex items-center gap-2"><span className="text-primary">▸</span><span>Sub-Meter Precision Inferred Fix</span></li>
                </ul>
              </div>
              <div className="pt-4 border-t border-outline-variant text-xs font-mono text-on-surface-variant flex justify-between">
                <span>GEO VELOCITY: REAL-TIME</span>
                <span className="text-secondary font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Pillar 04 */}
            <div className="bg-surface border border-outline-variant p-6 flex flex-col justify-between hover:border-error/60 transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-error font-bold">04 // ENCLAVES</span>
                  <span className="material-symbols-outlined text-error group-hover:scale-110 transition-transform">lock</span>
                </div>
                <h3 className="text-base font-bold text-on-surface uppercase mb-3 font-sans">
                  Air-Gapped Cryptographic Vaults
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-sans">
                  Maintain evidentiary integrity admissible in international criminal courts. Zero data leaves physical enclave boundary without post-quantum signature verification.
                </p>
                <ul className="text-xs font-mono text-outline space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-error">▸</span><span>ML-KEM-1024 Lattice Encrypted</span></li>
                  <li className="flex items-center gap-2"><span className="text-error">▸</span><span>RFC 3161 Qualified Timestamps</span></li>
                  <li className="flex items-center gap-2"><span className="text-error">▸</span><span>Zero-Knowledge Audit Logs</span></li>
                </ul>
              </div>
              <div className="pt-4 border-t border-outline-variant text-xs font-mono text-on-surface-variant flex justify-between">
                <span>FIPS 140-3: LEVEL 4</span>
                <span className="text-secondary font-bold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. SYSTEM ARCHITECTURE & DISTRIBUTED DATA FLOW                        */}
      {/* ===================================================================== */}
      <section className="py-20 px-4 lg:px-8 border-b border-outline-variant bg-surface" id="architecture">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">// SYSTEM BLUEPRINT</div>
            <h2 className="text-2xl sm:text-4xl font-black text-on-background uppercase tracking-tight font-sans">
              Sub-Second End-to-End Pipeline Topology
            </h2>
            <p className="text-sm text-on-surface-variant max-w-2xl mt-2 font-sans">
              From tactical edge capture to court-admissible Merkle proof, every byte traverses a strictly non-blocking distributed fabric.
            </p>
          </div>

          {/* Architecture Stepper Graphic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Step 1 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-5">
              <div className="text-xs font-mono text-primary mb-2 font-bold">STAGE 01 // INGEST</div>
              <div className="text-base font-bold text-on-surface mb-2 font-sans">Tactical Edge Nodes</div>
              <p className="text-xs text-on-surface-variant mb-4 font-sans leading-relaxed">
                Encrypted wiretaps, cellular taps, drone optical payloads, and hospital laboratory feeds.
              </p>
              <div className="p-2.5 bg-surface border border-outline-variant text-xs font-mono text-outline">
                MTU: 9000 Jumbo Frames<br/>
                TLS 1.3 + ML-KEM-1024
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-5">
              <div className="text-xs font-mono text-secondary mb-2 font-bold">STAGE 02 // STREAM FABRIC</div>
              <div className="text-base font-bold text-on-surface mb-2 font-sans">Kafka Distributed Spine</div>
              <p className="text-xs text-on-surface-variant mb-4 font-sans leading-relaxed">
                12-Broker cluster partitioned by SHA-256 target identifier hashes with zero backpressure.
              </p>
              <div className="p-2.5 bg-surface border border-outline-variant text-xs font-mono text-outline">
                Throughput: 482.9K msg/s<br/>
                Durability: 3x ISR MinIO
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-5">
              <div className="text-xs font-mono text-primary mb-2 font-bold">STAGE 03 // NEURAL INFERENCE</div>
              <div className="text-base font-bold text-on-surface mb-2 font-sans">Celery GPU Mesh</div>
              <p className="text-xs text-on-surface-variant mb-4 font-sans leading-relaxed">
                Parallel A100/H100 clusters performing entity extraction, translation, and bio-vector alignment.
              </p>
              <div className="p-2.5 bg-surface border border-outline-variant text-xs font-mono text-outline">
                Whisper-v3 + BERT-Bio<br/>
                Batch Latency: 4.8ms
              </div>
            </div>

            {/* Step 4 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-5">
              <div className="text-xs font-mono text-secondary mb-2 font-bold">STAGE 04 // PERSISTENCE</div>
              <div className="text-base font-bold text-on-surface mb-2 font-sans">Dual-Lakehouse &amp; Graph</div>
              <p className="text-xs text-on-surface-variant mb-4 font-sans leading-relaxed">
                Neo4j Graph Database paired with PBFT consensus Merkle tree for unalterable evidentiary chain.
              </p>
              <div className="p-2.5 bg-surface border border-outline-variant text-xs font-mono text-outline">
                GDS Topology Resolved<br/>
                RFC 3161 Ledger Signed
              </div>
            </div>
          </div>

          {/* Real-Time Pipeline Metric Console Box */}
          <div className="border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-outline-variant text-xs font-mono mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-secondary animate-pulse rounded-full"></span>
                <span className="text-on-surface font-bold">PIPELINE PERFORMANCE VERIFICATION MONITOR</span>
              </div>
              <div className="text-outline">SYSTEM CLOCK: UTC SYNCHRONIZED [STRATUM 1]</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono text-xs">
              <div>
                <div className="text-outline text-[11px] mb-1">P99 INGEST DELAY</div>
                <div className="text-primary font-bold text-base">3.4 ms</div>
              </div>
              <div>
                <div className="text-outline text-[11px] mb-1">GPU INFERENCE TIME</div>
                <div className="text-on-surface font-bold text-base">6.8 ms</div>
              </div>
              <div>
                <div className="text-outline text-[11px] mb-1">GRAPH SYNC COMMIT</div>
                <div className="text-secondary font-bold text-base">4.0 ms</div>
              </div>
              <div>
                <div className="text-outline text-[11px] mb-1">MERKLE ANCHOR DELAY</div>
                <div className="text-primary font-bold text-base">0.9 ms</div>
              </div>
              <div>
                <div className="text-outline text-[11px] mb-1">TOTAL E2E LATENCY</div>
                <div className="text-secondary font-bold text-base">15.1 ms</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. ENTERPRISE & DEFENSE ACCREDITATIONS                                */}
      {/* ===================================================================== */}
      <section className="py-12 border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-xs font-mono text-outline uppercase tracking-widest">
              STANDARDS &amp; COMPLIANCE VERIFIED FOR DEFENSE &amp; INTELLIGENCE DEPLOYMENTS
            </span>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <div className="border border-outline-variant p-4 bg-surface">
              <div className="text-xs font-mono text-primary font-bold">FIPS 140-3</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">LEVEL 4 PHYSICAL/LOGICAL</div>
            </div>
            <div className="border border-outline-variant p-4 bg-surface">
              <div className="text-xs font-mono text-secondary font-bold">NIST SP 800-57</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">CRYPTO KEY PROTOCOL</div>
            </div>
            <div className="border border-outline-variant p-4 bg-surface">
              <div className="text-xs font-mono text-primary font-bold">CNSA 2.0</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">POST-QUANTUM READY</div>
            </div>
            <div className="border border-outline-variant p-4 bg-surface">
              <div className="text-xs font-mono text-secondary font-bold">ISO/IEC 27037</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">FORENSIC EVIDENCE ADMISSIBLE</div>
            </div>
            <div className="border border-outline-variant p-4 bg-surface">
              <div className="text-xs font-mono text-primary font-bold">RFC 3161</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">PBFT MERKLE ATTESTATION</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. OPERATIONAL IMPACT & CASE DOSSIERS                                 */}
      {/* ===================================================================== */}
      <section className="py-20 px-4 lg:px-8 border-b border-outline-variant bg-surface" id="case-studies">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Case Study Detail */}
            <div className="lg:col-span-7 border border-outline-variant bg-surface-container-lowest p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs font-mono mb-4">
                  <span className="border border-error text-error bg-error/10 px-2 py-0.5 font-bold">DECLASSIFIED SUMMARY</span>
                  <span className="text-outline">CASE DOSSIER // OP CERBERUS</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-on-background uppercase mb-4 font-sans leading-snug">
                  Cross-Border Bio-Syndicate Neutralized via 4-Hop Graph Resolution
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed font-sans">
                  When illicit genetic sequencing lab materials were detected across four maritime transit corridors, conventional investigative methods stalled in a labyrinth of 3,800 burner cell towers and encrypted messaging chatter. VEILLE ingested 4.2TB of unstructured intercepts to reconstruct the syndicate's operational hub within 48 minutes.
                </p>
                <div className="grid grid-cols-3 gap-4 border-t border-b border-outline-variant py-4 mb-6 text-center">
                  <div>
                    <div className="font-mono text-xl sm:text-2xl text-primary font-bold">94%</div>
                    <div className="text-[10px] font-mono text-outline uppercase mt-1">TIME REDUCTION</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl text-secondary font-bold">14,920</div>
                    <div className="text-[10px] font-mono text-outline uppercase mt-1">ENTITIES RESOLVED</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl text-primary font-bold">99.4%</div>
                    <div className="text-[10px] font-mono text-outline uppercase mt-1">BIOMETRIC CONFIDENCE</div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono text-outline flex flex-wrap justify-between items-center gap-2">
                <span>LEGAL OUTCOME: 18 INDICTMENTS ENTERED IN TRIAL</span>
                <span className="text-secondary font-bold">COURT VALIDATED RFC 3161</span>
              </div>
            </div>

            {/* Right: Executive Quote & Operator Clearance */}
            <div className="lg:col-span-5 border border-outline-variant bg-surface-container-low p-6 md:p-8 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-4xl text-primary mb-4 block">format_quote</span>
                <blockquote className="text-base text-on-surface italic mb-8 leading-relaxed font-sans">
                  "VEILLE eliminated three weeks of tedious manual link analysis into under sixty seconds. The ability to defend the mathematical graph in a closed federal court hearing with cryptographic proof changes modern biosecurity operations forever."
                </blockquote>
              </div>
              <div className="border-t border-outline-variant pt-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-high border border-outline flex items-center justify-center font-bold text-primary font-mono text-sm shrink-0">
                  SBD
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface font-sans">Senior Director of Biosecurity Intelligence</div>
                  <div className="text-xs font-mono text-outline">National Homeland Defense Command</div>
                  <div className="text-[11px] font-mono text-secondary mt-0.5 font-bold">VERIFIED CLEARANCE TS//SCI-TK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. FEATURE DEEP-DIVE (Zero-Hallucination Intel Assistant)             */}
      {/* ===================================================================== */}
      <section className="py-20 px-4 lg:px-8 border-b border-outline-variant bg-surface-container-lowest" id="enclaves">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">// ADVANCED MODULE</div>
            <h2 className="text-2xl sm:text-4xl font-black text-on-background uppercase tracking-tight font-sans">
              Strictly-Cited Tactical Intel Assistant
            </h2>
            <p className="text-sm text-on-surface-variant max-w-2xl mt-2 font-sans">
              Zero hallucinations. Every statement generated by the VEILLE reasoning core contains cryptographic citations linked directly to raw intercepts, audio timestamps, or validated ledger records.
            </p>
          </div>

          {/* Interactive Query Demonstration UI */}
          <div className="border border-outline-variant bg-surface">
            <div className="h-11 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-primary font-bold">INTELLIGENCE TERMINAL</span>
                <span className="text-outline">:: LLM REASONER V4.1 [RESTRICTED CITATION MODE]</span>
              </div>
              <span className="text-xs font-mono text-secondary font-bold">PROVENANCE VERIFIED</span>
            </div>

            <div className="p-6 space-y-6">
              {/* User Prompt */}
              <div className="flex items-start gap-3">
                <div className="px-2.5 py-1 bg-surface-container-high border border-outline text-xs font-mono text-primary shrink-0 font-bold">
                  ANALYST
                </div>
                <div className="text-sm text-on-surface font-sans">
                  "Identify any meetings between Dr. Vanev and unverified foreign laboratory agents between October 12 and October 18, cross-referencing cell tower handovers."
                </div>
              </div>

              {/* Assistant Response with Strict Evidence Badges */}
              <div className="flex items-start gap-3 bg-surface-container-lowest p-5 border-l-2 border-primary">
                <div className="px-2.5 py-1 bg-primary text-on-primary text-xs font-mono font-bold shrink-0">
                  VEILLE AI
                </div>
                <div className="space-y-4 text-sm text-on-surface-variant font-sans">
                  <p>
                    Two correlated events were identified with <strong className="text-secondary font-mono">99.8% certainty</strong> matching the queried timeframe:
                  </p>
                  
                  <div className="p-4 border border-outline-variant bg-surface space-y-2 font-mono text-xs">
                    <div className="text-on-surface font-semibold flex flex-wrap items-center justify-between gap-2 font-sans">
                      <span>1. Incident #OCT-14-VANE-01 (Sector 04 Geneva Rail Corridor)</span>
                      <span className="text-primary font-mono font-bold">[CITED: CDR-AZ-4192]</span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-sans leading-relaxed">
                      Target device IMEI-8924 connected to Swisscom Tower #9102 concurrent with unregistered handset IMSI-4091 (attributed to Foreign Actor "Vector-9"). Azimuth intersection confirmed within 45-meter radius.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] bg-surface-container-high px-2 py-0.5 text-outline border border-outline-variant">EVIDENCE HASH: 0x9b24f...c12</span>
                      <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 border border-secondary font-bold">RFC 3161 ATTESTED</span>
                    </div>
                  </div>

                  <div className="p-4 border border-outline-variant bg-surface space-y-2 font-mono text-xs">
                    <div className="text-on-surface font-semibold flex flex-wrap items-center justify-between gap-2 font-sans">
                      <span>2. Audio Intercept Audio-W3-4819 (Recorded Oct 16, 21:04 UTC)</span>
                      <span className="text-primary font-mono font-bold">[CITED: SIGINT-AUDIO-T14]</span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-sans leading-relaxed">
                      Whisper-v3 transcription decoded discussion regarding transfer of dual-use biological centrifuge components. Voiceprint match confidence: 99.4%.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] bg-surface-container-high px-2 py-0.5 text-outline border border-outline-variant">EVIDENCE HASH: 0xaa18c...001</span>
                      <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 border border-secondary font-bold">COURT ADMISSIBLE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. REQUEST SECURE BRIEFING / CONSOLE ACTION                           */}
      {/* ===================================================================== */}
      <section className="py-20 px-4 lg:px-8 border-b border-outline-variant bg-surface" id="briefing">
        <div className="max-w-4xl mx-auto border border-outline-variant bg-surface-container-lowest p-6 md:p-12 relative overflow-hidden">
          {/* Ambient corner marks */}
          <div className="absolute top-3 right-3 text-outline-variant font-mono text-[10px]">SECURE ENCLAVE 01</div>
          
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-primary uppercase tracking-widest font-bold">// CLEARANCE GATED ACCESS</span>
            <h2 className="text-2xl sm:text-4xl font-black text-on-background uppercase tracking-tight mt-2 mb-4 font-sans">
              Request Classified Briefing &amp; Sandbox Access
            </h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto font-sans leading-relaxed">
              Deployable via on-premises air-gapped server racks, AWS GovCloud (US-East), or custom Sovereign Enclave architectures.
            </p>
          </div>

          {briefingSubmitted ? (
            <div className="p-8 bg-secondary/10 border border-secondary text-center space-y-3 animate-fade-in">
              <span className="material-symbols-outlined text-secondary text-5xl">verified_user</span>
              <h3 className="text-base font-mono font-bold text-secondary uppercase">
                ENCRYPTED ACCESS REQUEST DISPATCHED
              </h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto font-sans">
                Briefing query for <span className="font-mono text-primary font-bold">{email}</span> has been securely logged. Clearance verification will proceed through standard SCIF channels.
              </p>
              <button
                onClick={() => setBriefingSubmitted(false)}
                className="text-xs text-primary font-mono uppercase tracking-wider underline cursor-pointer pt-2 inline-block"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form className="space-y-4 max-w-xl mx-auto font-sans" onSubmit={handleBriefingSubmit}>
              <div>
                <label className="block text-xs font-mono text-outline uppercase mb-1.5">
                  Official Government / Institutional Email
                </label>
                <input 
                  className="w-full bg-surface border border-outline-variant text-on-surface font-mono text-xs px-3.5 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-none" 
                  placeholder="investigator@agency.gov or clinical@institute.org" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-outline uppercase mb-1.5">Deployment Tier</label>
                  <select 
                    className="w-full bg-surface border border-outline-variant text-on-surface font-mono text-xs px-3.5 py-2.5 focus:border-primary focus:outline-none rounded-none"
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                  >
                    <option>Air-Gapped Sovereign Hardware</option>
                    <option>AWS GovCloud / Azure Gov</option>
                    <option>Tactical Edge Mobile SCIF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-outline uppercase mb-1.5">Clearance Level</label>
                  <select 
                    className="w-full bg-surface border border-outline-variant text-on-surface font-mono text-xs px-3.5 py-2.5 focus:border-primary focus:outline-none rounded-none"
                    value={clearance}
                    onChange={(e) => setClearance(e.target.value)}
                  >
                    <option>TS//SCI Eligible</option>
                    <option>Secret / NATO Secret</option>
                    <option>Commercial Clinical Biosecurity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-outline uppercase mb-1.5">Operational Mission Brief / Scope</label>
                <textarea 
                  className="w-full bg-surface border border-outline-variant text-on-surface font-mono text-xs px-3.5 py-2.5 focus:border-primary focus:outline-none rounded-none" 
                  placeholder="Specify mission domain: Biosecurity surveillance, CDR adversary mapping, or anti-trafficking SIGINT..." 
                  rows={3}
                  value={missionBrief}
                  onChange={(e) => setMissionBrief(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button 
                  className="w-full bg-primary hover:bg-primary-fixed text-on-primary font-mono text-xs sm:text-sm py-3.5 tracking-widest font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.25)] rounded-sm" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[16px]">encrypted</span>
                  <span>DISPATCH ENCRYPTED ACCESS REQUEST</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-outline">
                  DATA TRANSMISSION PROTECTED UNDER FIPS 140-3 LEVEL 4 POST-QUANTUM KEY PROTOCOL
                </span>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. TACTICAL DEFENSE FOOTER                                            */}
      {/* ===================================================================== */}
      <footer className="bg-surface-container-lowest text-on-surface-variant border-t border-outline-variant pt-12 pb-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-outline-variant">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
              <span className="text-sm font-mono font-bold tracking-wider text-primary uppercase">VEILLE // SYSTEMS</span>
            </div>
            <p className="text-xs text-outline leading-relaxed font-sans">
              High-performance tactical computational intelligence and biometric graph analysis engine for global defense, sovereign governments, and clinical health networks.
            </p>
            <div className="text-xs font-mono text-secondary font-bold">
              SYSTEM STATUS: 100% OPERATIONAL (99.999% SLA)
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <div className="text-xs font-mono text-on-surface uppercase font-bold mb-4">ENGINE ARCHITECTURE</div>
            <ul className="text-xs font-mono space-y-2.5 text-outline">
              <li><a className="hover:text-primary transition-colors" href="#graph-engine">Neo4j Centrality Clusters</a></li>
              <li><a className="hover:text-primary transition-colors" href="#architecture">Kafka Stream Pipeline (12-Broker)</a></li>
              <li><a className="hover:text-primary transition-colors" href="#architecture">Celery A100 GPU Mesh</a></li>
              <li><a className="hover:text-primary transition-colors" href="#enclaves">Whisper-v3 SIGINT Transcriber</a></li>
              <li><a className="hover:text-primary transition-colors" href="#graph-engine">Cell Handover Azimuth Matrix</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <div className="text-xs font-mono text-on-surface uppercase font-bold mb-4">COMPLIANCE &amp; ENCLAVES</div>
            <ul className="text-xs font-mono space-y-2.5 text-outline">
              <li><a className="hover:text-primary transition-colors" href="#enclaves">FIPS 140-3 Level 4 Cryptography</a></li>
              <li><a className="hover:text-primary transition-colors" href="#enclaves">CNSA 2.0 ML-KEM-1024 Specs</a></li>
              <li><a className="hover:text-primary transition-colors" href="#case-studies">RFC 3161 Merkle Chain Verification</a></li>
              <li><a className="hover:text-primary transition-colors" href="#case-studies">ISO/IEC 27037 Court Admissibility</a></li>
              <li><a className="hover:text-primary transition-colors" href="#enclaves">NIST SP 800-57 Key Protocol</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <div className="text-xs font-mono text-on-surface uppercase font-bold mb-4">CLASSIFIED SUPPORT</div>
            <div className="text-xs font-mono text-outline space-y-3">
              <div>
                <div className="text-on-surface font-semibold font-sans">SCIF Direct Line:</div>
                <div className="font-mono text-primary font-bold">SECURE-SIP-8924</div>
              </div>
              <div>
                <div className="text-on-surface font-semibold font-sans">GSA Contract Vehicle:</div>
                <div className="font-mono">GS-35F-0914-VEILLE</div>
              </div>
              <div>
                <div className="text-on-surface font-semibold font-sans">Cage Code:</div>
                <div className="font-mono">8V9X1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-outline gap-4">
          <div>
            © 2026 VEILLE INTELLIGENCE CORP. RESTRICTED DISTRIBUTION. ALL RIGHTS RESERVED.
          </div>
          <div className="flex flex-wrap gap-6">
            <a className="hover:text-primary transition-colors" href="#enclaves">SECURITY CLEARANCE PROTOCOLS</a>
            <a className="hover:text-primary transition-colors" href="#architecture">EVIDENTIARY ARCHITECTURE</a>
            <a className="hover:text-primary transition-colors" href="#enclaves">CRYPTO DISCLOSURE</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
