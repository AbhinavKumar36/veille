import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ProblemSection() {
  const { scrollYProgress } = useScroll();
  
  const evidenceTypes = [
    { label: "FIR", x: -100, y: -100, delay: 0 },
    { label: "CDR", x: 100, y: -80, delay: 0.1 },
    { label: "FINANCIAL", x: -120, y: 50, delay: 0.2 },
    { label: "DOCUMENTS", x: 130, y: 40, delay: 0.3 },
    { label: "SURVEILLANCE", x: -40, y: 120, delay: 0.4 },
    { label: "GEOLOCATION", x: 60, y: 140, delay: 0.5 },
  ];

  return (
    <section id="problem" className="relative min-h-[80vh] flex flex-col items-center justify-center py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-24 z-10"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight mb-4">
          THE PROBLEM IS NOT<br />
          ABSENCE OF DATA.
        </h2>
        <h3 className="text-2xl sm:text-3xl font-mono text-[#4edea3] tracking-widest uppercase">
          IT'S FRAGMENTATION.
        </h3>
      </motion.div>

      <div className="relative w-full max-w-3xl h-[400px] flex items-center justify-center">
        {/* Center Node */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          viewport={{ once: true }}
          className="absolute z-20 w-32 h-32 rounded-full bg-[#0F141C] border border-[#4edea3]/50 shadow-[0_0_50px_rgba(78,222,163,0.15)] flex items-center justify-center"
        >
          <div className="text-center">
            <span className="material-symbols-outlined text-[#4edea3] text-[32px] mb-1">hub</span>
            <div className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">CONNECTED<br/>INTELLIGENCE</div>
          </div>
        </motion.div>

        {/* Orbiting Evidence */}
        {evidenceTypes.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: item.x * 2, y: item.y * 2 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.5, delay: item.delay, type: "spring", bounce: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="absolute z-10"
            style={{ 
              transform: "translate(" + item.x + "px, " + item.y + "px)"
            }}
          >
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171D26]/80 backdrop-blur-sm border border-[#212B3A] px-4 py-2 rounded-sm"
              style={{ transform: "translate(" + item.x + "px, " + item.y + "px)" }}
            >
              <span className="text-[10px] font-mono tracking-widest text-[#87929A] whitespace-nowrap">{item.label}</span>
            </div>
            
            {/* Connecting line that appears after they converge */}
            <motion.svg 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.3 }}
              transition={{ delay: 1.5 + item.delay, duration: 1 }}
              viewport={{ once: true }}
              className="absolute left-1/2 top-1/2 pointer-events-none" 
              style={{ overflow: 'visible' }}
            >
              <line 
                x1={item.x} y1={item.y} 
                x2="0" y2="0" 
                stroke="#4edea3" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
            </motion.svg>
          </motion.div>
        ))}
      </div>
      
    </section>
  );
}