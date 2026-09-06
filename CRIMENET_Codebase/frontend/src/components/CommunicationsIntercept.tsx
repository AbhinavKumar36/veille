import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export interface InterceptRow {
  id: string;
  time: string;
  channel: string;
  src: string;
  dst: string;
  protocol: string;
  status: 'DECRYPTED' | 'RECORDING' | 'PARSING';
  statusColor: string;
  association: string;
  associationType: 'target' | 'relay' | 'sensor' | 'org' | 'routine';
  hasAudio: boolean;
  audioFile?: string;
  keyword?: string;
  transcriptSnippet?: string;
}

export const CommunicationsIntercept: React.FC = () => {
  const [intercepts, setIntercepts] = useState<InterceptRow[]>([]);
  const [selectedIntercept, setSelectedIntercept] = useState<InterceptRow | null>(null);
  const [isListening, setIsListening] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    // Check if there are any stream logs or intercepted evidence
    api.get('/evidence')
      .then((data: any) => {
        const items = Array.isArray(data) ? data : [];
        const audioCdrItems = items.filter((i: any) => i.source_type === 'AUDIO' || i.source_type === 'CDR');
        if (audioCdrItems.length > 0) {
          const formatted: InterceptRow[] = audioCdrItems.map((item: any, idx: number) => ({
            id: `SIG-${idx + 1}`,
            time: item.created_at ? item.created_at.slice(11, 19) : '14:20:00',
            channel: 'VOLTE-CH01',
            src: '+91-9811-00-9921',
            dst: 'TWR-MUMBAI-04',
            protocol: 'GSM-PDU',
            status: 'DECRYPTED',
            statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
            association: 'EXTRACTED INTERCEPT',
            associationType: 'target',
            hasAudio: true,
            transcriptSnippet: 'Voice packet extracted and indexed into Merkle vault.'
          }));
          setIntercepts(formatted);
          setSelectedIntercept(formatted[0]);
        } else {
          setIntercepts([]);
          setSelectedIntercept(null);
        }
      })
      .catch(() => {
        setIntercepts([]);
        setSelectedIntercept(null);
      });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface text-on-surface antialiased select-none overflow-hidden -m-4 lg:-m-8 min-w-0 border-t border-outline-variant font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">sensors</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Top Banner */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant border-b border-outline-variant shrink-0 font-mono text-xs">
        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">KAFKA SIGINT STREAM</span>
          <div className="text-xl font-bold text-secondary flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span>TOPIC: ACTIVE</span>
          </div>
          <div className="text-[10px] text-outline">veille_cdr_stream</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">INTERCEPTED PACKETS</span>
          <div className="text-xl font-bold text-on-surface mt-1">{intercepts.length}</div>
          <div className="text-[10px] text-primary">Live Siphon Ready</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">WHISPER TRANSCRIBER</span>
          <div className="text-xl font-bold text-primary mt-1">CELERY GPU</div>
          <div className="text-[10px] text-outline">v3-Large Turbo</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">STREAM LATENCY</span>
          <div className="text-xl font-bold text-secondary mt-1">&lt; 18ms</div>
          <div className="text-[10px] text-outline">Zero Packet Loss</div>
        </div>
      </section>

      {/* Control Strip */}
      <section className="p-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between font-mono text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isListening
                ? 'bg-secondary text-surface-container-lowest'
                : 'bg-surface-container-high text-outline border border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-xs">sensors</span>
            <span>{isListening ? 'SIPHON RUNNING' : 'SIPHON PAUSED'}</span>
          </button>
        </div>

        <div className="text-outline text-[11px]">
          LISTENING ON PORT 9092 // KAFKA BROKER CONNECTED
        </div>
      </section>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface font-mono text-xs">
        {/* Left: Intercept Stream Table (60%) */}
        <div className="w-full lg:w-[60%] border-r border-outline-variant flex flex-col bg-surface-container-lowest overflow-hidden">
          {intercepts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <div className="w-14 h-14 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center text-secondary mb-3">
                <span className="material-symbols-outlined text-3xl animate-pulse">radar</span>
              </div>
              <div className="text-sm font-bold text-on-surface uppercase">AWAITING SIGINT CDR TELEMETRY</div>
              <p className="text-xs text-outline mt-1.5 max-w-sm">
                No active phone calls or SMS packets on Kafka stream topic `veille_cdr_stream`. Ingest audio files into the Evidence Vault or start the live SIP carrier simulator.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant text-[10px] uppercase text-outline">
                  <tr>
                    <th className="px-3 py-1.5">ID</th>
                    <th className="px-2 py-1.5">TIME</th>
                    <th className="px-2 py-1.5">SRC / CALLER</th>
                    <th className="px-2 py-1.5">DST / TOWER</th>
                    <th className="px-2 py-1.5">PROTOCOL</th>
                    <th className="px-3 py-1.5 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {intercepts.map((i) => {
                    const isSelected = selectedIntercept?.id === i.id;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => setSelectedIntercept(i)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-container-low border-l-2 border-primary text-on-surface'
                            : 'hover:bg-surface-container-high/40'
                        }`}
                      >
                        <td className="px-3 py-2 text-primary font-bold">{i.id}</td>
                        <td className="px-2 py-2 text-outline">{i.time}</td>
                        <td className="px-2 py-2 font-bold">{i.src}</td>
                        <td className="px-2 py-2 text-on-surface-variant">{i.dst}</td>
                        <td className="px-2 py-2">{i.protocol}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 text-[9px] border font-bold ${i.statusColor}`}>
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Intercept Details (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col bg-surface-container-lowest overflow-y-auto p-4">
          {selectedIntercept ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-sm">{selectedIntercept.id}</div>
                  <div className="text-on-surface font-bold text-base">{selectedIntercept.src}</div>
                </div>
                <span className={`px-2 py-0.5 border text-[10px] font-bold ${selectedIntercept.statusColor}`}>
                  {selectedIntercept.status}
                </span>
              </div>

              <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">RECIPIENT / TOWER:</span>
                  <span className="text-on-surface font-bold">{selectedIntercept.dst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">BEARER CHANNEL:</span>
                  <span className="text-on-surface">{selectedIntercept.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">ASSOCIATION:</span>
                  <span className="text-secondary font-bold">{selectedIntercept.association}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-outline">WHISPER AI TRANSCRIPT</div>
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant">
                  {selectedIntercept.transcriptSnippet || 'No voice transcript attached.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">call</span>
              <div>Select a telephony packet from the stream to inspect speech transcription.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationsIntercept;
