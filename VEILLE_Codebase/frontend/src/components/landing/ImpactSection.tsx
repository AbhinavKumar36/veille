import React from 'react';
import { motion } from 'framer-motion';

export default function ImpactSection() {
  const impacts = [
    { title: "FASTER", desc: "Investigation discovery", icon: "bolt" },
    { title: "CLEARER", desc: "Relationship intelligence", icon: "share" },
    { title: "SAFER", desc: "Evidence handling", icon: "shield" },
    { title: "HUMAN-CENTRIC", desc: "Decision support", icon: "group" }
  ];

  return (
    <section id="impact" className="relative min-h-[70vh] flex flex-col justify-center py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      
      <div className="text-center mb-24">
        <h2 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-[#87929A] mb-2">
          FROM<br />
          FRAGMENTED RECORDS
        </h2>
        <h3 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-white">
          TO<br />
          CONNECTED<br />
          <span className="text-[#4edea3]">INVESTIGATIONS.</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {impacts.map((impact, i) => (
          <motion.div 
            key={impact.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center p-6 bg-[#0F141C] border border-[#212B3A] rounded-sm"
          >
            <span className="material-symbols-outlined text-[#4edea3] text-[32px] mb-4 opacity-80">{impact.icon}</span>
            <h4 className="text-lg font-bold text-white tracking-widest mb-2 font-mono">{impact.title}</h4>
            <p className="text-xs text-[#87929A] font-mono">{impact.desc}</p>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
