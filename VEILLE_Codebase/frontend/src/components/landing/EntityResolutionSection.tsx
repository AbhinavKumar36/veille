import React from 'react';
import { motion } from 'framer-motion';

export default function EntityResolutionSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30 overflow-hidden">
      
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Visualization */}
        <div className="relative h-[500px] flex items-center justify-center font-mono">
          {/* Main Entity Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute z-20 bg-[#0F141C] border border-[#4edea3]/50 p-4 rounded-sm shadow-[0_0_30px_rgba(78,222,163,0.15)] w-64"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-[#212B3A] pb-2">
              <span className="material-symbols-outlined text-[#4edea3]">person</span>
              <div>
                <div className="text-[10px] text-[#87929A] tracking-widest">MASTER ENTITY</div>
                <div className="text-sm font-bold text-white">Rahul Kumar</div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-[#87929A]">
              <div className="flex justify-between"><span>PHONE</span><span className="text-white">+91 98*** 1234</span></div>
              <div className="flex justify-between"><span>ORG</span><span className="text-white">Apex Shell</span></div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#212B3A] flex items-center justify-between">
              <span className="text-[10px] text-[#4edea3]">CONFIDENCE 0.92</span>
              <span className="text-[10px] bg-[#4edea3]/20 text-[#4edea3] px-2 py-0.5 rounded-sm font-bold">AUTO MERGE</span>
            </div>
          </motion.div>

          {/* Fragments merging in */}
          <motion.div 
            initial={{ opacity: 0, x: -100, y: -80 }}
            whileInView={{ opacity: 1, x: -120, y: -60 }}
            transition={{ delay: 0.5, duration: 1 }}
            viewport={{ once: true }}
            className="absolute z-10 bg-[#171D26] border border-[#212B3A] p-3 rounded-sm w-48 opacity-50"
          >
            <div className="text-[10px] text-[#87929A] mb-1">FIR RECORD</div>
            <div className="text-xs font-bold text-white">R. Kumar</div>
            <div className="text-[10px] text-[#87929A] mt-1">Apex Shell Corp</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 100, y: 100 }}
            whileInView={{ opacity: 1, x: 100, y: 80 }}
            transition={{ delay: 0.8, duration: 1 }}
            viewport={{ once: true }}
            className="absolute z-10 bg-[#171D26] border border-[#212B3A] p-3 rounded-sm w-48 opacity-50"
          >
            <div className="text-[10px] text-[#87929A] mb-1">CDR LOG</div>
            <div className="text-xs font-bold text-white">Rahul K.</div>
            <div className="text-[10px] text-[#87929A] mt-1">+91 98200 12345</div>
          </motion.div>

          {/* Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              transition={{ delay: 1, duration: 1 }}
              viewport={{ once: true }}
              d="M 150 150 Q 250 200 350 250" 
              stroke="#4edea3" fill="none" strokeWidth="1" strokeDasharray="4 4"
            />
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              transition={{ delay: 1.2, duration: 1 }}
              viewport={{ once: true }}
              d="M 450 350 Q 350 300 250 250" 
              stroke="#4edea3" fill="none" strokeWidth="1" strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* Right Side: Text */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[10px] font-mono tracking-[0.3em] text-[#4edea3] uppercase mb-4">
            ENTITY RESOLUTION
          </h2>
          <h3 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-6">
            SEE PAST THE ALIAS.
          </h3>
          <p className="text-sm text-[#87929A] mb-8 leading-relaxed max-w-md">
            Identities in raw data are messy. Misspellings, abbreviations, and intentional obfuscation fragment your view. VEILLE uses advanced lexical and structural similarity to accurately resolve disparate records into unified master entities.
          </p>

          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3 text-[#87929A]">
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>LEXICAL SIMILARITY (Fuzzy Matching)</span>
            </div>
            <div className="flex items-center gap-3 text-[#87929A]">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </div>
            <div className="flex items-center gap-3 text-[#87929A]">
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>STRUCTURAL SIMILARITY (Shared Neighbors)</span>
            </div>
            <div className="flex items-center gap-3 text-white font-bold pt-2 border-t border-[#212B3A] w-64">
              <span className="material-symbols-outlined text-[#4edea3] text-[16px]">drag_indicator</span>
              <span>= ENTITY MATCH</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
