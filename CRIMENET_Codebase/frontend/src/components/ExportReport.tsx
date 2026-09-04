import React from 'react';

const ExportReport = () => {
  return (
    <div className="flex flex-1 overflow-hidden h-full -mx-4 -mt-4">
      {/* Main Content Area - Center/Left */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8 bg-surface-dim relative">
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{backgroundImage: 'radial-gradient(circle at 50% 0%, #00e5ff 0%, transparent 50%)'}}></div>
        <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10">
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-2">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="font-data-code text-data-code uppercase tracking-wider cursor-pointer hover:text-primary transition-colors">Return to Investigation</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Export Report</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Configure and generate final intelligence package.</p>
          </div>
          
          {/* Case Summary Card */}
          <div className="bg-surface-card border border-outline-variant rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-status-warning"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-label-caps text-label-caps text-status-warning bg-status-warning/10 px-2 py-1 rounded border border-status-warning/20 mb-2 inline-block">HIGH PRIORITY OPERATION</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Operation Nightfall</h2>
                <p className="font-data-code text-data-code text-on-surface-variant mt-1">ID: OP-NF-8832-X</p>
              </div>
              <div className="text-right">
                <span className="font-data-code text-data-code text-on-surface-variant block">Date: 2026-10-27</span>
                <span className="font-data-code text-data-code text-on-surface-variant block">Analyst: J. Doe (ID: 7741)</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Entities Mapped</span>
                <span className="font-headline-sm text-headline-sm text-primary">142</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Connections Identified</span>
                <span className="font-headline-sm text-headline-sm text-data-node-person">389</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Confidence Score</span>
                <span className="font-headline-sm text-headline-sm text-status-success">94.2%</span>
              </div>
            </div>
          </div>

          {/* Intelligence Findings */}
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">policy</span>
              Included Findings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-primary/50 transition-colors flex gap-4 items-start group cursor-pointer">
                <div className="bg-surface-variant p-2 rounded shrink-0">
                  <span className="material-symbols-outlined text-data-node-person">hub</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface group-hover:text-primary transition-colors">Core Network Identified</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Primary distribution ring mapped to 7 key locations in Sector 4.</p>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-primary/50 transition-colors flex gap-4 items-start group cursor-pointer">
                <div className="bg-surface-variant p-2 rounded shrink-0">
                  <span className="material-symbols-outlined text-data-node-event">person_search</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface group-hover:text-primary transition-colors">Key Associate Resolved</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Alias "Shadow" positively identified as Marcus Vance.</p>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-primary/50 transition-colors flex gap-4 items-start group cursor-pointer">
                <div className="bg-surface-variant p-2 rounded shrink-0">
                  <span className="material-symbols-outlined text-status-warning">account_balance</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface group-hover:text-primary transition-colors">Financial Anomalies</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">$4.2M traced through shell corp structural layers.</p>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-primary/50 transition-colors flex gap-4 items-start group cursor-pointer border-dashed flex-col items-center justify-center">
                <div className="text-center text-on-surface-variant group-hover:text-primary transition-colors flex flex-col items-center">
                  <span className="material-symbols-outlined mb-1 block">add_circle</span>
                  <span className="font-data-code text-data-code">Select More Findings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span>
              Export Format
            </h3>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer group">
                <input defaultChecked className="peer sr-only" name="export_format" type="radio" value="pdf" />
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-variant transition-all">
                  <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant peer-checked:text-primary">picture_as_pdf</span>
                  <span className="block font-headline-sm text-headline-sm text-on-surface">Secure PDF</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant mt-1">Watermarked, Encrypted</span>
                </div>
              </label>
              <label className="flex-1 cursor-pointer group">
                <input className="peer sr-only" name="export_format" type="radio" value="csv" />
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-variant transition-all">
                  <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant peer-checked:text-primary">csv</span>
                  <span className="block font-headline-sm text-headline-sm text-on-surface">Data CSV</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant mt-1">Raw Node Metrics</span>
                </div>
              </label>
              <label className="flex-1 cursor-pointer group">
                <input className="peer sr-only" name="export_format" type="radio" value="graph" />
                <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-variant transition-all">
                  <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant peer-checked:text-primary">schema</span>
                  <span className="block font-headline-sm text-headline-sm text-on-surface">Graph Image</span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant mt-1">Hi-Res Visualization</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </main>

      {/* Right Side - Preview & Actions */}
      <aside className="w-[400px] bg-surface-container-highest border-l border-outline-variant flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-outline-variant">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">visibility</span>
            DOCUMENT PREVIEW
          </h3>
        </div>
        
        {/* Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-surface-dim flex items-start justify-center">
          <div className="bg-surface w-full max-w-sm aspect-[1/1.414] shadow-lg rounded-sm border border-outline-variant flex flex-col p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 border-2 border-status-critical text-status-critical font-label-caps text-label-caps px-4 py-1 rotate-12 opacity-80 mix-blend-screen">
              CLASSIFIED
            </div>
            <div className="border-b-2 border-outline-variant pb-4 mb-4 text-center">
              <div className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-widest mb-1">VEILLE COMMAND</div>
              <div className="font-data-code text-data-code text-on-surface-variant text-[10px]">INTELLIGENCE REPORT // CONFIDENTIAL</div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-surface-variant rounded"></div>
                <div className="h-2 w-1/2 bg-surface-variant/50 rounded"></div>
              </div>
              <div className="h-32 w-full bg-surface-variant rounded border border-outline-variant flex items-center justify-center opacity-50">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">hub</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-surface-variant/50 rounded"></div>
                <div className="h-2 w-full bg-surface-variant/50 rounded"></div>
                <div className="h-2 w-5/6 bg-surface-variant/50 rounded"></div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-data-node-person"></div>
                  <div className="h-2 w-1/3 bg-surface-variant/50 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-data-node-event"></div>
                  <div className="h-2 w-1/4 bg-surface-variant/50 rounded"></div>
                </div>
              </div>
            </div>
            <div className="mt-auto border-t border-outline-variant pt-2 flex justify-between items-end">
              <div className="h-6 w-16 bg-surface-variant/30 rounded"></div>
              <div className="font-data-code text-data-code text-[8px] text-on-surface-variant">PAGE 1 OF 7</div>
            </div>
          </div>
        </div>
        
        {/* Action Area */}
        <div className="p-6 bg-surface-container border-t border-outline-variant space-y-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-data-code text-data-code text-on-surface-variant">Est. File Size:</span>
            <span className="font-data-code text-data-code text-on-surface">2.4 MB</span>
          </div>
          <button className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-headline-sm py-3 px-4 rounded transition-colors flex justify-center items-center gap-2">
            <span className="material-symbols-outlined">lock</span>
            GENERATE SECURE EXPORT
          </button>
          <button className="w-full bg-transparent border border-outline-variant hover:bg-surface-variant text-on-surface font-headline-sm text-headline-sm py-3 px-4 rounded transition-colors">
            CANCEL
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ExportReport;
