import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#020305] border-t border-[#212B3A] pt-16 pb-8 px-6 lg:px-16 text-sm font-mono relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 flex items-center justify-center">
              <img src="/logo.png" alt="VEILLE" className="w-full h-full object-contain opacity-80" />
            </div>
            <span className="font-bold text-lg tracking-[0.2em] text-white">VEILLE</span>
          </div>
          <p className="text-[#87929A] text-xs uppercase tracking-widest mb-6">
            Evidence → Connect → Verify → Investigate
          </p>
        </div>
        
        <div className="flex flex-col gap-3 text-xs text-[#87929A]">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase">Platform</h4>
          <a href="#" className="hover:text-white transition-colors">Approach</a>
          <a href="#" className="hover:text-white transition-colors">Impact</a>
          <a href="#" className="hover:text-white transition-colors">Team</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        
        <div className="flex flex-col gap-3 text-xs text-[#87929A]">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase">Legal</h4>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-[#212B3A]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-[#87929A]">
        <p>© {new Date().getFullYear()} VEILLE. All rights reserved.</p>
        <p className="max-w-xl md:text-right">
          VEILLE is an investigative decision-support platform. It does not determine guilt or replace investigator judgment.
        </p>
      </div>
    </footer>
  );
}

