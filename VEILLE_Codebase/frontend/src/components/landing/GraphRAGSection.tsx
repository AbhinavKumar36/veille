import React from 'react';
import { motion } from 'framer-motion';

export default function GraphRAGSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight mb-4">
          ASK THE GRAPH.<br />
          <span className="text-[#4edea3]">NOT JUST THE MODEL.</span>
        </h2>
        <p className="text-sm text-[#87929A] font-mono tracking-widest uppercase">
          EVIDENCE-GROUNDED INVESTIGATIVE SYNTHESIS
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-4 font-mono">
        
        {/* User Query */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="col-span-1 md:col-span-5 bg-[#0F141C] border border-[#212B3A] p-6 rounded-sm shadow-xl flex gap-4 items-start"
        >
          <div className="w-8 h-8 rounded-sm bg-[#4edea3]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#4edea3]">person</span>
          </div>
          <div>
            <div className="text-[10px] text-[#87929A] mb-2 uppercase tracking-widest">Investigative Question</div>
            <p className="text-sm text-white font-sans">
              "What connections exist between this subject and the suspected financial network?"
            </p>
          </div>
        </motion.div>

        {/* Pipeline Steps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="col-span-1 md:col-span-2 bg-[#171D26] border border-[#212B3A] p-4 rounded-sm flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#87929A]">
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            GRAPH RETRIEVAL
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#87929A]">
            <span className="material-symbols-outlined text-[16px]">description</span>
            EVIDENCE CONTEXT
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#87929A]">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            GEMINI 2.5 ENGINE
          </div>
        </motion.div>

        {/* Answer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="col-span-1 md:col-span-3 bg-[#0F141C] border border-[#4edea3]/30 p-6 rounded-sm shadow-[0_0_30px_rgba(78,222,163,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#4edea3]" />
          <div className="text-[10px] text-[#4edea3] mb-4 uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">robot_2</span>
            Grounded Response
          </div>
          <p className="text-sm text-[#87929A] leading-relaxed font-sans">
            The subject is linked to the financial network via <span className="text-white border-b border-[#4edea3]/50 hover:bg-[#4edea3]/20 transition-colors cursor-pointer">Account XXXX7812</span>, which received a transfer of ₹14,00,000 on Oct 12. This account shares a registered address with <span className="text-white border-b border-[#4edea3]/50 hover:bg-[#4edea3]/20 transition-colors cursor-pointer">Apex Shell Corp</span>, matching the location detailed in <span className="text-white border-b border-[#4edea3]/50 hover:bg-[#4edea3]/20 transition-colors cursor-pointer">FIR 2023/041</span>.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
