import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 pb-10 px-6 lg:px-16 max-w-7xl mx-auto">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col z-10"
        >
          <div className="flex items-center gap-3 mb-6 opacity-70">
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#4edea3] uppercase">
              EVIDENCE × INTELLIGENCE × IMPACT
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-sans font-bold leading-[1.1] tracking-tight mb-6">
            TURN FRAGMENTED<br />
            EVIDENCE INTO<br />
            <span className="text-[#4edea3]">CLARITY.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#87929A] max-w-lg mb-10 leading-relaxed">
            VEILLE is an AI-powered investigative intelligence platform that fuses multiple data sources, uncovers hidden connections, and helps investigators see the bigger picture.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-16">
            <button 
              onClick={onStart}
              className="group relative flex items-center gap-3 bg-white text-black px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-[#4edea3] transition-all overflow-hidden"
            >
              <span className="relative z-10">Explore Veille</span>
              <span className="material-symbols-outlined text-[18px] relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button className="flex items-center gap-3 px-8 py-4 rounded-sm text-sm font-mono font-bold uppercase tracking-widest text-white border border-[#212B3A] hover:border-[#4edea3]/50 hover:bg-[#4edea3]/5 transition-all">
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              Watch Demo
            </button>
          </div>

          {/* Micro-capabilities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-[#212B3A]/50">
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">hub</span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">Multi-Source</span>
              <span className="text-[10px] font-mono text-[#87929A]">Evidence Fusion</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">psychology</span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">AI-Powered</span>
              <span className="text-[10px] font-mono text-[#87929A]">Relationship Analysis</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">verified_user</span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">Secure &</span>
              <span className="text-[10px] font-mono text-[#87929A]">Auditable</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-[20px]">manage_accounts</span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">Investigator</span>
              <span className="text-[10px] font-mono text-[#87929A]">In Control</span>
            </div>
          </div>
        </motion.div>

        {/* Right side is intentionally empty to let the 3D globe show through */}
        <div className="hidden lg:block relative h-[600px] pointer-events-none">
          {/* We could place absolute HTML floating cards here, but they are requested in the 3D section or as 3D elements.
              The prompt asks for "Right side: 3D Earth... around the globe create floating glass cards".
              We can do the cards here in HTML overlay positioned over the 3D globe! */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-[20%] left-[10%] bg-[#0A1118]/80 backdrop-blur-md border border-[#212B3A] p-3 rounded-sm flex items-start gap-3 w-64 shadow-2xl"
          >
            <div className="w-8 h-8 rounded bg-[#4edea3]/10 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-[#4edea3] text-[16px]">directions_car</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-[#87929A] uppercase tracking-wider mb-1">Entity Match</span>
              <span className="text-xs font-bold text-white leading-tight">Vehicle</span>
              <span className="text-xs font-mono text-[#4edea3]">OD-02-4512</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 bg-[#212B3A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4edea3] w-[92%]"></div>
                </div>
                <span className="text-[8px] font-mono text-[#87929A]">0.92</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute top-[60%] right-[10%] bg-[#0A1118]/80 backdrop-blur-md border border-[#212B3A] p-3 rounded-sm flex items-start gap-3 w-64 shadow-2xl"
          >
            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-blue-400 text-[16px]">account_balance</span>
            </div>
            <div className="flex flex-col w-full">
              <span className="text-[8px] font-mono text-[#87929A] uppercase tracking-wider mb-1">Financial Flow</span>
              <span className="text-xs font-bold text-white leading-tight">A/c XXXX7812</span>
              <span className="text-[10px] text-[#87929A]">Linked to 3 entities</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 bg-[#212B3A] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[99%]"></div>
                </div>
                <span className="text-[8px] font-mono text-[#87929A]">0.99</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
