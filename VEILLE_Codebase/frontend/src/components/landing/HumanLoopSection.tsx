import React from 'react';
import { motion } from 'framer-motion';

export default function HumanLoopSection() {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center py-24 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight leading-tight">
          AI PROPOSES.<br />
          EVIDENCE SUPPORTS.<br />
          <span className="text-[#4edea3]">INVESTIGATOR DECIDES.</span>
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-2xl bg-[#0F141C] border border-[#212B3A] rounded-sm shadow-2xl overflow-hidden font-mono"
      >
        <div className="bg-[#171D26] px-4 py-3 border-b border-[#212B3A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500 text-[18px]">warning</span>
            <span className="text-xs font-bold text-white tracking-wider">REVIEW QUEUE</span>
          </div>
          <span className="text-[10px] text-[#87929A]">AMBIGUOUS MATCH DETECTED</span>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] text-[#87929A] mb-1">CANDIDATE 1</div>
              <div className="text-sm text-white font-bold">Sharma, Amit</div>
              <div className="text-xs text-[#87929A]">DOB: 1985-04-12</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded-sm mb-2">CONFIDENCE 0.67</span>
              <div className="h-[1px] w-16 bg-yellow-500/50" />
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#87929A] mb-1">CANDIDATE 2</div>
              <div className="text-sm text-white font-bold">A. Sharma</div>
              <div className="text-xs text-[#87929A]">DOB: Unknown</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button className="px-4 py-2 text-xs font-bold text-[#87929A] hover:text-white border border-[#212B3A] hover:border-white transition-all rounded-sm">
              [ REJECT ]
            </button>
            <button className="px-4 py-2 text-xs font-bold text-[#003824] bg-[#4edea3] hover:bg-[#6ffbbe] transition-all rounded-sm shadow-[0_0_15px_rgba(78,222,163,0.3)]">
              [ ACCEPT MATCH ]
            </button>
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-xs font-mono text-[#87929A] max-w-lg text-center leading-relaxed">
        VEILLE provides investigative decision support. Final judgment remains with the investigator. High-confidence links are automated, while ambiguous connections are surfaced for human review.
      </p>

    </section>
  );
}
