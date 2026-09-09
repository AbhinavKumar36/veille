import React, { useState } from 'react';
import Scene3D from './landing/Scene3D';
import HeroSection from './landing/HeroSection';
import ProblemSection from './landing/ProblemSection';
import PipelineSection from './landing/PipelineSection';
import EntityResolutionSection from './landing/EntityResolutionSection';
import HumanLoopSection from './landing/HumanLoopSection';
import GraphRAGSection from './landing/GraphRAGSection';
import DataFusionSection from './landing/DataFusionSection';
import SecuritySection from './landing/SecuritySection';
import ImpactSection from './landing/ImpactSection';
import ArchitectureSection from './landing/ArchitectureSection';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';
import Login from './Login';
import { motion, useScroll } from 'framer-motion';

interface LandingPageProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

export default function LandingPage({ isAuthenticated, onLogin }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative min-h-screen bg-[#020305] text-white font-sans selection:bg-[#4edea3]/30">
      {/* 3D Background Canvas */}
      <Scene3D />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#020305]/60 border-b border-[#212B3A]/30 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="VEILLE" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(78,222,163,0.5)]" />
          </div>
          <span className="font-mono font-bold text-lg tracking-[0.2em] text-white">VEILLE</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-mono tracking-wider text-[#87929A]">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#platform" className="hover:text-white transition-colors">Platform</a>
          <a href="#approach" className="hover:text-white transition-colors">Approach</a>
          <a href="#impact" className="hover:text-white transition-colors">Impact</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="text-xs font-mono tracking-widest text-[#87929A] hover:text-white transition-colors uppercase"
          >
            Sign In
          </button>
          <button 
            onClick={() => setShowLoginModal(true)}
            className="group flex items-center gap-2 bg-white text-black px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-[#4edea3] transition-all"
          >
            Get Started
            <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </nav>

      {/* Main Content Overlay */}
      <main className="relative z-10 w-full overflow-hidden">
        <HeroSection onStart={() => setShowLoginModal(true)} />
        <ProblemSection />
        <PipelineSection />
        <EntityResolutionSection />
        <HumanLoopSection />
        <GraphRAGSection />
        <DataFusionSection />
        <SecuritySection />
        <ImpactSection />
        <ArchitectureSection />
        <FinalCTA onStart={() => setShowLoginModal(true)} />
      </main>

      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
          <div className="relative w-full max-w-md mx-auto">
            <div className="shadow-[0_0_50px_rgba(78,222,163,0.1)] border border-[#212B3A] rounded-sm overflow-hidden bg-[#0F141C]">
               <Login onLogin={onLogin} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

