import React from 'react';
import { motion } from 'framer-motion';

export default function DataFusionSection() {
  const sources = [
    "FIR / DOCUMENTS",
    "CDR",
    "FINANCIAL",
    "SURVEILLANCE",
    "LEGAL RECORDS",
    "GEOLOCATION"
  ];
  
  const outputs = [
    "PEOPLE",
    "ORGANIZATIONS",
    "LOCATIONS",
    "ASSETS",
    "EVENTS",
    "RELATIONSHIPS"
  ];

  return (
    <section className="relative min-h-[60vh] py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30 flex flex-col items-center">
      
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left: Sources */}
        <div className="flex flex-col gap-4 w-full md:w-1/3">
          {sources.map((src, i) => (
            <motion.div 
              key={src}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-[#171D26] border border-[#212B3A] p-3 text-xs font-mono text-[#87929A] text-center rounded-sm"
            >
              {src}
            </motion.div>
          ))}
        </div>

        {/* Center: Fusion */}
        <div className="relative w-full md:w-1/3 flex justify-center items-center h-48 md:h-full">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="w-32 h-32 rounded-full border border-[#4edea3] bg-[#0F141C] shadow-[0_0_50px_rgba(78,222,163,0.2)] flex flex-col items-center justify-center relative z-10"
          >
            <span className="font-mono font-bold text-white tracking-widest text-lg">VEILLE</span>
            <span className="text-[8px] font-mono text-[#4edea3] tracking-widest mt-1">FUSION ENGINE</span>
          </motion.div>
          
          {/* Connecting animated data streams (visual representation) */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
            {/* Left lines */}
            <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-full">
               <line x1="0" y1="20%" x2="100%" y2="50%" stroke="#212B3A" strokeWidth="1" />
               <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#212B3A" strokeWidth="1" />
               <line x1="0" y1="80%" x2="100%" y2="50%" stroke="#212B3A" strokeWidth="1" />
            </svg>
            {/* Right lines */}
            <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full">
               <line x1="0" y1="50%" x2="100%" y2="20%" stroke="#212B3A" strokeWidth="1" />
               <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#212B3A" strokeWidth="1" />
               <line x1="0" y1="50%" x2="100%" y2="80%" stroke="#212B3A" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Right: Outputs */}
        <div className="flex flex-col gap-4 w-full md:w-1/3">
          {outputs.map((out, i) => (
            <motion.div 
              key={out}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-[#0F141C] border border-[#212B3A] p-3 text-xs font-mono font-bold text-[#4edea3] text-center rounded-sm tracking-widest uppercase"
            >
              {out}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
