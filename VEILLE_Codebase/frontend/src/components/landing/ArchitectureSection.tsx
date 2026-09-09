import React from 'react';
import { motion } from 'framer-motion';

export default function ArchitectureSection() {
  const stack = [
    { label: "React + Vite", type: "FRONTEND" },
    { label: "FastAPI", type: "API GATEWAY" },
    { label: "PostgreSQL", type: "RELATIONAL" },
    { label: "Neo4j", type: "KNOWLEDGE GRAPH" },
    { label: "Redis / Celery", type: "WORKERS" },
    { label: "Kafka", type: "EVENT STREAM" },
    { label: "MinIO", type: "EVIDENCE VAULT" },
    { label: "Gemini / Whisper", type: "AI ENGINES" }
  ];

  return (
    <section className="relative min-h-[60vh] py-20 px-6 max-w-7xl mx-auto border-t border-[#212B3A]/30">
      <div className="text-center mb-16">
        <h2 className="text-[10px] font-mono tracking-[0.3em] text-[#4edea3] uppercase mb-4">
          TECHNICAL ARCHITECTURE
        </h2>
        <h3 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">
          BUILT ON ENTERPRISE FOUNDATIONS
        </h3>
      </div>

      <div className="max-w-4xl mx-auto relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stack.map((tech, i) => (
            <motion.div 
              key={tech.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="bg-[#0A1118] border border-[#212B3A] p-4 flex flex-col items-center justify-center text-center h-24 rounded-sm hover:border-[#4edea3]/50 transition-colors group"
            >
              <span className="text-[8px] font-mono text-[#87929A] mb-2">{tech.type}</span>
              <span className="text-sm font-bold text-white group-hover:text-[#4edea3] transition-colors">{tech.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
