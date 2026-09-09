import React from 'react';
import { motion } from 'framer-motion';

const stages = [
  { id: "INGEST", desc: "Bring evidence from multiple sources into a unified investigative workspace." },
  { id: "EXTRACT", desc: "Identify people, organizations, locations, assets and events." },
  { id: "RESOLVE", desc: "Determine when records refer to the same real-world entity." },
  { id: "CONNECT", desc: "Build a relationship graph across evidence sources." },
  { id: "VERIFY", desc: "Route ambiguity to human review and preserve provenance." },
  { id: "INVESTIGATE", desc: "Use graph-grounded AI to surface relevant connections." }
];

export default function PipelineSection() {
  return (
    <section id="approach" className="relative min-h-screen py-24 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      
      <div className="mb-16">
        <h2 className="text-[10px] font-mono tracking-[0.3em] text-[#4edea3] uppercase mb-4">
          THE VEILLE PIPELINE
        </h2>
        <h3 className="text-3xl font-sans font-bold">
          HOW WE BUILD INTELLIGENCE.
        </h3>
      </div>

      <div className="relative">
        {/* Vertical line for mobile, horizontal for desktop */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-[#212B3A] md:hidden" />
        
        <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10">
          {stages.map((stage, index) => (
            <motion.div 
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex md:flex-col gap-6 md:gap-4 relative group"
            >
              {/* Node */}
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#0F141C] border border-[#212B3A] group-hover:border-[#4edea3] group-hover:shadow-[0_0_15px_rgba(78,222,163,0.3)] transition-all flex items-center justify-center z-10 relative">
                <div className="w-2 h-2 rounded-full bg-[#87929A] group-hover:bg-[#4edea3] transition-colors" />
                
                {/* Horizontal line for desktop */}
                {index < stages.length - 1 && (
                  <div className="hidden md:block absolute left-8 top-1/2 -translate-y-1/2 h-[1px] w-[calc(100vw/6)] lg:w-[150px] bg-[#212B3A] -z-10 group-hover:bg-gradient-to-r group-hover:from-[#4edea3]/50 group-hover:to-transparent transition-all" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex flex-col pt-1 md:pt-0">
                <h4 className="text-sm font-mono font-bold tracking-wider text-white mb-2 group-hover:text-[#4edea3] transition-colors">
                  {stage.id}
                </h4>
                <p className="text-xs text-[#87929A] leading-relaxed max-w-[200px]">
                  {stage.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </section>
  );
}
