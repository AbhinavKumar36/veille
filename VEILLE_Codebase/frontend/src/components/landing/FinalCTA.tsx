import React from 'react';
import { motion } from 'framer-motion';

export default function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center py-20 px-6 border-t border-[#212B3A]/30 overflow-hidden">
      
      {/* Abstract Background Graph */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <svg className="w-full h-full max-w-5xl" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path 
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d="M 10 50 Q 30 20 50 50 T 90 50" 
            stroke="#4edea3" fill="none" strokeWidth="0.5" 
          />
          <motion.path 
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
            d="M 20 80 Q 50 10 80 80" 
            stroke="#4edea3" fill="none" strokeWidth="0.5" 
          />
        </svg>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <h2 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight mb-6">
          CONNECT THE EVIDENCE.<br />
          <span className="text-[#4edea3]">REVEAL THE NETWORK.</span>
        </h2>
        
        <p className="text-sm sm:text-base text-[#87929A] font-mono mb-12 max-w-lg leading-relaxed">
          Technology in service of justice.<br />
          Human judgment at the center.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onStart}
            className="bg-[#4edea3] text-[#003824] px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-[#6ffbbe] shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all flex items-center justify-center gap-2"
          >
            Explore VEILLE
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          
          <button className="bg-[#171D26] text-white border border-[#212B3A] px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:border-white transition-all">
            View Platform
          </button>
        </div>
      </div>
      
    </section>
  );
}
