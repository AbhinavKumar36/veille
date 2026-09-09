import React from 'react';
import { motion } from 'framer-motion';

export default function SecuritySection() {
  const features = [
    "JWT AUTHENTICATION",
    "RBAC",
    "ARGON2",
    "CASE ISOLATION",
    "AUDIT LOGGING",
    "SHA-256 INTEGRITY",
    "PROVENANCE"
  ];

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      <div className="w-full text-center">
        <h2 className="text-[10px] font-mono tracking-[0.3em] text-[#4edea3] uppercase mb-4">
          CRYPTOGRAPHIC EVIDENCE INTEGRITY
        </h2>
        <h3 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight mb-16">
          BUILT FOR<br />
          EVIDENCE YOU CAN TRUST.
        </h3>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto mb-16">
          {features.map((feature, i) => (
            <motion.div 
              key={feature}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="px-4 py-2 border border-[#212B3A] rounded-sm text-xs font-mono font-bold text-[#87929A] uppercase tracking-widest bg-[#0F141C]"
            >
              {feature}
            </motion.div>
          ))}
        </div>

        {/* Future Architecture block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex flex-col items-center"
        >
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#212B3A] to-transparent mb-4" />
          <div className="text-[10px] font-mono text-[#4edea3]/50 tracking-widest uppercase border border-[#4edea3]/20 px-3 py-1 rounded-sm">
            FUTURE EXTENSIBILITY: PERMISSIONED LEDGER FOR CROSS-AGENCY VERIFICATION
          </div>
        </motion.div>
      </div>
    </section>
  );
}
