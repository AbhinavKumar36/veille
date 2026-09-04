import React from 'react';

const ExecutiveDashboard = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Executive Overview</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Global Intelligence Operations & AI Extraction Metrics</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors rounded font-label-caps text-label-caps flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">download</span>
              EXPORT REPORT
            </button>
          </div>
        </div>
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-surface-card border border-outline-variant rounded-lg p-5 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE INVESTIGATIONS</span>
              <span className="material-symbols-outlined text-primary-container">target</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface mt-auto">42</div>
            <div className="mt-2 text-status-warning font-data-code text-data-code flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +3 this week
            </div>
          </div>
          
          {/* KPI 2 */}
          <div className="bg-surface-card border border-outline-variant rounded-lg p-5 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-status-success/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">ENTITIES RESOLVED</span>
              <span className="material-symbols-outlined text-status-success">verified_user</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface mt-auto">1,204</div>
            <div className="mt-2 text-status-success font-data-code text-data-code flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Avg 24h TTRes
            </div>
          </div>
          
          {/* KPI 3 */}
          <div className="bg-surface-card border border-outline-variant rounded-lg p-5 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-status-warning/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">PENDING MERGES</span>
              <span className="material-symbols-outlined text-status-warning">merge_type</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface mt-auto">14</div>
            <div className="mt-2 text-status-critical font-data-code text-data-code flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              5 require review
            </div>
          </div>
          
          {/* KPI 4 */}
          <div className="bg-surface-card border border-outline-variant rounded-lg p-5 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">EXTRACTION PRECISION</span>
              <span className="material-symbols-outlined text-primary-container">precision_manufacturing</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface mt-auto">98.2%</div>
            <div className="mt-2 text-on-surface-variant font-data-code text-data-code flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              Last 10k documents
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
