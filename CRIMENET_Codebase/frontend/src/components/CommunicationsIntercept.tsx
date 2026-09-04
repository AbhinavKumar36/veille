import React from 'react';

const CommunicationsIntercept = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-surface-dim space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Live Intercept Feed</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Monitoring Target Array: ALPHA-7 (Cellular & IP)</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-surface-container border border-outline-variant rounded font-label-caps text-label-caps text-status-success flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse"></span> RECORDING
          </span>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 grid-rows-6 gap-4 min-h-0 overflow-y-auto pb-4">
        {/* Active Call / Audio Transcript */}
        <div className="col-span-1 lg:col-span-8 row-span-3 bg-surface-elevated border border-outline-variant rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">graphic_eq</span>
              <span className="font-label-caps text-label-caps text-on-surface">ACTIVE TRANSMISSION: ID-99382</span>
            </div>
            <span className="font-data-code text-data-code text-status-warning shadow-[0_0_8px_rgba(255,179,0,0.5)] px-2 py-0.5 rounded bg-surface animate-pulse border border-status-warning/50">ANOMALY DETECTED</span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
            <div className="h-24 w-full bg-surface-container rounded border border-outline-variant overflow-hidden relative shrink-0">
              <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(to right, #333539 1px, transparent 1px), linear-gradient(to bottom, #333539 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
              <div className="absolute inset-0 flex items-end justify-center px-2 gap-1 pb-2">
                <div className="w-1 bg-primary/40 h-[20%]"></div>
                <div className="w-1 bg-primary/60 h-[40%]"></div>
                <div className="w-1 bg-primary h-[80%]"></div>
                <div className="w-1 bg-primary/80 h-[60%]"></div>
                <div className="w-1 bg-primary/30 h-[10%]"></div>
                <div className="w-1 bg-primary/50 h-[30%]"></div>
                <div className="w-1 bg-status-warning h-[90%] shadow-[0_0_8px_#FFB300]"></div>
                <div className="w-1 bg-status-warning h-[100%] shadow-[0_0_8px_#FFB300]"></div>
                <div className="w-1 bg-primary/60 h-[50%]"></div>
                <div className="w-1 bg-primary/40 h-[20%]"></div>
                <div className="w-1 bg-primary/80 h-[70%]"></div>
                <div className="w-1 bg-primary/50 h-[30%]"></div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 font-data-code text-data-code pr-2">
              <div className="flex gap-4 opacity-70">
                <span className="text-on-surface-variant w-16 shrink-0">00:12</span>
                <span className="text-on-primary-container">SRC_A: "Delivery is confirmed for 0300."</span>
              </div>
              <div className="flex gap-4 opacity-70">
                <span className="text-on-surface-variant w-16 shrink-0">00:15</span>
                <span className="text-secondary-fixed">SRC_B: "Understood. Has the route been cleared?"</span>
              </div>
              <div className="flex gap-4 bg-surface-variant/30 p-2 rounded -mx-2">
                <span className="text-status-warning w-16 shrink-0">00:18</span>
                <span className="text-status-warning">SRC_A: [ENCRYPTED BURST - DECODING: "GHOST PROTOCOL ACTIVATED"]</span>
              </div>
              <div className="flex gap-4">
                <span className="text-on-surface-variant w-16 shrink-0">00:22</span>
                <span className="text-secondary-fixed">SRC_B: "Proceeding to secondary rally point."</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call MetaData */}
        <div className="col-span-1 lg:col-span-4 row-span-3 bg-surface-elevated border border-outline-variant rounded-lg flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low">
            <span className="font-label-caps text-label-caps text-on-surface">INTERCEPT METADATA</span>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4 font-data-code text-data-code">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-on-surface-variant block mb-1 text-[10px]">DURATION</span>
                <span className="text-on-surface">00:04:32</span>
              </div>
              <div>
                <span className="text-on-surface-variant block mb-1 text-[10px]">ENCRYPTION</span>
                <span className="text-on-surface">AES-256 (PARTIAL)</span>
              </div>
            </div>
            <div className="h-px w-full bg-outline-variant"></div>
            <div>
              <span className="text-on-surface-variant block mb-1 text-[10px]">TOWER ID / LOCATION</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">cell_tower</span>
                <span className="text-on-surface">TWR-774A (URBAN SEC-4)</span>
              </div>
            </div>
            <div className="h-px w-full bg-outline-variant"></div>
            <div>
              <span className="text-on-surface-variant block mb-1 text-[10px]">LINKED ENTITIES</span>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between bg-surface-container p-2 rounded border border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-data-node-person text-[16px]">person</span>
                    <span className="text-on-surface">UNKNOWN_MALE_1</span>
                  </div>
                  <span className="text-status-warning">0.82 CONF</span>
                </div>
                <div className="flex items-center justify-between bg-surface-container p-2 rounded border border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-data-node-person text-[16px]">person</span>
                    <span className="text-on-surface">ALIAS: "VIPER"</span>
                  </div>
                  <span className="text-primary">0.95 CONF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* High Density IP Traffic Table */}
        <div className="col-span-1 lg:col-span-12 row-span-3 bg-surface-elevated border border-outline-variant rounded-lg flex flex-col overflow-hidden">
          <div className="p-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
            <span className="font-label-caps text-label-caps text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">router</span>
              NETWORK TRAFFIC LOGS
            </span>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-surface-variant text-on-surface font-label-caps text-[10px] rounded border border-outline-variant hover:bg-surface-bright">FILTER: ANOMALIES</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-highest z-10 border-b border-outline-variant">
                <tr className="font-label-caps text-[10px] text-on-surface-variant">
                  <th className="p-2 whitespace-nowrap">TIMESTAMP</th>
                  <th className="p-2 whitespace-nowrap">SOURCE IP</th>
                  <th className="p-2 whitespace-nowrap">DEST IP</th>
                  <th className="p-2 whitespace-nowrap">PROTOCOL</th>
                  <th className="p-2 whitespace-nowrap">BYTES</th>
                  <th className="p-2 whitespace-nowrap">FLAGS</th>
                </tr>
              </thead>
              <tbody className="font-data-code text-[11px] divide-y divide-outline-variant/30 text-on-surface">
                <tr className="hover:bg-surface-container transition-colors">
                  <td className="p-2 text-on-surface-variant">14:22:01.001</td>
                  <td className="p-2">192.168.1.104</td>
                  <td className="p-2">10.0.45.22</td>
                  <td className="p-2 text-primary">TCP</td>
                  <td className="p-2">1,024</td>
                  <td className="p-2 text-on-surface-variant">-</td>
                </tr>
                <tr className="hover:bg-surface-container transition-colors">
                  <td className="p-2 text-on-surface-variant">14:22:01.050</td>
                  <td className="p-2">192.168.1.104</td>
                  <td className="p-2">10.0.45.22</td>
                  <td className="p-2 text-primary">TCP</td>
                  <td className="p-2">512</td>
                  <td className="p-2 text-on-surface-variant">-</td>
                </tr>
                <tr className="bg-error-container/20 hover:bg-error-container/30 transition-colors">
                  <td className="p-2 text-on-surface-variant">14:22:02.112</td>
                  <td className="p-2 text-status-critical">45.22.19.100</td>
                  <td className="p-2">192.168.1.104</td>
                  <td className="p-2 text-status-warning">UDP</td>
                  <td className="p-2 text-status-critical font-bold">14,500</td>
                  <td className="p-2 text-status-critical">[SUSPICIOUS_PAYLOAD]</td>
                </tr>
                <tr className="hover:bg-surface-container transition-colors">
                  <td className="p-2 text-on-surface-variant">14:22:03.000</td>
                  <td className="p-2">10.0.45.22</td>
                  <td className="p-2">8.8.8.8</td>
                  <td className="p-2 text-secondary">DNS</td>
                  <td className="p-2">64</td>
                  <td className="p-2 text-on-surface-variant">-</td>
                </tr>
                <tr className="hover:bg-surface-container transition-colors">
                  <td className="p-2 text-on-surface-variant">14:22:03.500</td>
                  <td className="p-2">192.168.1.104</td>
                  <td className="p-2">44.33.22.11</td>
                  <td className="p-2 text-primary">TCP</td>
                  <td className="p-2">4,096</td>
                  <td className="p-2 text-on-surface-variant">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsIntercept;
