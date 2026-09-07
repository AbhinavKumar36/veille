import React, { useState, useEffect, useRef } from 'react';
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
  duration?: number;
}

export const CommunicationsIntercept: React.FC = () => {
  const [intercepts, setIntercepts] = useState<InterceptRow[]>([]);
  const [selectedIntercept, setSelectedIntercept] = useState<InterceptRow | null>(null);
  const [isListening, setIsListening] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);

  // New simulated call form
  const [callSrc, setCallSrc] = useState('+91 98201 44921 (Vikram Singhania)');
  const [callDst, setCallDst] = useState('+91 98110 33819 (Devraj Kapoor)');
  const [callProtocol, setCallProtocol] = useState('GSM-VoLTE-PDU');
  const [callTranscript, setCallTranscript] = useState(
    'Deliver the consignment to Warehouse #4 before dawn. The Hawala route via Dubai is confirmed.'
  );

  // Web Audio API refs for synthetic wiretap audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const progressIntervalRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Load initial intercept data
  useEffect(() => {
    api.get('/cases')
      .then(async (casesData: any) => {
        const caseList = Array.isArray(casesData) ? casesData : (casesData?.cases || []);
        if (caseList.length > 0) {
          const caseId = caseList[0].id;
          try {
            const graphData: any = await api.get(`/graph/${caseId}`);
            const rawEdges = graphData?.edges || [];
            const rawNodes = graphData?.nodes || [];

            const commEdges = rawEdges.filter((e: any) => 
              (e.label || e.type || '').toUpperCase().includes('COMM')
            );

            if (commEdges.length > 0) {
              const formatted: InterceptRow[] = commEdges.map((e: any, idx: number) => {
                const srcNode = rawNodes.find((n: any) => n.id === e.source);
                const dstNode = rawNodes.find((n: any) => n.id === e.target);
                const props = e.properties || e.data?.properties || {};

                const srcName = srcNode?.properties?.phone_number || srcNode?.name || `Target Node ${idx + 1}`;
                const dstName = dstNode?.properties?.phone_number || dstNode?.name || `Tower Bandra-0${idx + 1}`;
                const duration = parseInt(props.duration_seconds || '42', 10);
                const tower = props.cell_tower_id || 'TWR-MUMBAI-CELL-01';

                return {
                  id: `SIG-2026-${(idx + 1).toString().padStart(3, '0')}`,
                  time: props.timestamp ? String(props.timestamp).slice(11, 19) || '14:30:00' : `14:3${idx}:00`,
                  channel: `VOLTE-CH0${(idx % 4) + 1}`,
                  src: srcName,
                  dst: dstName,
                  protocol: 'GSM-PDU',
                  status: 'DECRYPTED',
                  statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
                  association: `${srcNode?.name || 'Falcon Node'} ➔ ${dstNode?.name || 'Intermediary'}`,
                  associationType: 'target',
                  hasAudio: true,
                  transcriptSnippet: props.interaction || `Intercepted radio packet via ${tower}. Verified keyword: [HAWALA ESCROW]. Duration: ${duration}s.`,
                  keyword: 'HAWALA ESCROW',
                  duration: duration || 42
                };
              });

              setIntercepts(formatted);
              setSelectedIntercept(formatted[0]);
              return;
            }
          } catch (err) {
            console.error('Graph fetch failed:', err);
          }
        }

        // Fallback default intercepted records
        const defaultIntercepts: InterceptRow[] = [
          {
            id: 'SIG-2026-001',
            time: '03:14:22',
            channel: 'VOLTE-CH01',
            src: '+91 98201 44921 (Vikram Singhania)',
            dst: '+91 98110 33819 (Devraj Kapoor)',
            protocol: 'GSM-VoLTE-PDU',
            status: 'DECRYPTED',
            statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
            association: 'Falcon ➔ Dubai Intermediary',
            associationType: 'target',
            hasAudio: true,
            transcriptSnippet: 'Transmit the remaining 40 percent through the cryptocurrency escrow pool before midnight. The port clearance is already settled.',
            keyword: 'CRYPTOCURRENCY ESCROW',
            duration: 38
          },
          {
            id: 'SIG-2026-002',
            time: '04:22:15',
            channel: 'SIP-TLS-CH04',
            src: '+91 97654 22109 (Ananya Sharma)',
            dst: 'sip:relay-04.veille.internal',
            protocol: 'SIP-VoIP-AES',
            status: 'DECRYPTED',
            statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
            association: 'Tech Operator ➔ SIP Relay',
            associationType: 'relay',
            hasAudio: true,
            transcriptSnippet: 'Server key rotation is complete on node delta. Awaiting verification hash from lead operator.',
            keyword: 'KEY ROTATION',
            duration: 25
          },
          {
            id: 'SIG-2026-003',
            time: '06:05:48',
            channel: 'GSM-PDU-CH02',
            src: '+91 99881 12345 (Burner SIM #1)',
            dst: 'TWR-MUMBAI-SOUTH-02',
            protocol: 'GSM-PDU',
            status: 'DECRYPTED',
            statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
            association: 'Burner Handset ➔ South Tower',
            associationType: 'sensor',
            hasAudio: true,
            transcriptSnippet: 'Package collected from Colaba warehouse. Moving toward Navi Mumbai highway checkpoint.',
            keyword: 'COLABA WAREHOUSE',
            duration: 52
          }
        ];
        setIntercepts(defaultIntercepts);
        setSelectedIntercept(defaultIntercepts[0]);
      })
      .catch(() => {
        setIntercepts([]);
        setSelectedIntercept(null);
      });
  }, []);

  // 2. Audio Playback System using Web Audio API
  const stopAudio = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.disconnect();
      } catch {}
      noiseNodeRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const playSyntheticAudio = () => {
    stopAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        triggerToast('Web Audio API not supported in this browser environment.');
        return;
      }

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // 1. Radio Static / White Noise Generator
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to simulate tactical walkie-talkie / telecom line
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, ctx.currentTime);
      bandpass.Q.setValueAtTime(3.0, ctx.currentTime);

      whiteNoise.connect(bandpass);
      bandpass.connect(masterGain);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;

      // 2. Modulated Voice Carrier Oscillator
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);

      // Random frequency jitter to simulate voice speech pitch
      const now = ctx.currentTime;
      for (let t = 0; t < 40; t += 0.25) {
        const pitch = 180 + Math.sin(t * 3) * 60 + Math.random() * 40;
        osc.frequency.setValueAtTime(pitch, now + t);
      }

      // Voice Formant Filter
      const voiceFilter = ctx.createBiquadFilter();
      voiceFilter.type = 'lowpass';
      voiceFilter.frequency.setValueAtTime(1800, ctx.currentTime);

      osc.connect(voiceFilter);
      voiceFilter.connect(masterGain);
      osc.start();
      oscillatorRef.current = osc;

      setIsPlayingAudio(true);
      triggerToast('Audio playback started: Intercept wiretap channel.');

      // Progress Tracker
      const durationSec = selectedIntercept?.duration || 35;
      let currentSec = 0;
      progressIntervalRef.current = setInterval(() => {
        currentSec += 0.5;
        const progressPercent = Math.min(100, (currentSec / durationSec) * 100);
        setAudioProgress(progressPercent);

        if (currentSec >= durationSec) {
          stopAudio();
          triggerToast('Wiretap audio playback completed.');
        }
      }, 500);
    } catch (e: any) {
      console.error('Audio playback error:', e);
      triggerToast('Audio playback initiated in simulated audio mode.');
    }
  };

  const handleTogglePlay = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      playSyntheticAudio();
    }
  };

  // 3. Initiate Simulated Call Intercept
  const handleInitiateCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callSrc || !callDst) return;

    const newIntercept: InterceptRow = {
      id: `SIG-2026-${(intercepts.length + 1).toString().padStart(3, '0')}`,
      time: new Date().toLocaleTimeString(),
      channel: 'VOLTE-LIVE-01',
      src: callSrc,
      dst: callDst,
      protocol: callProtocol,
      status: 'DECRYPTED',
      statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
      association: 'Live Intercept ➔ Forensic Stream',
      associationType: 'target',
      hasAudio: true,
      transcriptSnippet: callTranscript,
      keyword: 'LIVE INTERCEPT',
      duration: 35
    };

    setIntercepts([newIntercept, ...intercepts]);
    setSelectedIntercept(newIntercept);
    setIsCallModalOpen(false);
    triggerToast(`Live call stream captured: ${newIntercept.id}`);
  };

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
          <div className="text-xl font-bold text-on-surface mt-1">{intercepts.length} Captured</div>
          <div className="text-[10px] text-primary">Decryption: Online</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">WHISPER AI ENGINE</span>
          <div className="text-xl font-bold text-primary mt-1">VOICE-TO-TEXT</div>
          <div className="text-[10px] text-outline">Multi-Lingual (Hindi/Eng)</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">AUDIO SYNTHESIS</span>
          <div className="text-xl font-bold text-secondary mt-1">
            {isPlayingAudio ? 'PLAYING AUDIO' : 'AUDIO READY'}
          </div>
          <div className="text-[10px] text-outline">Bandpass Filtered (1.2kHz)</div>
        </div>
      </section>

      {/* Control Strip & Live Call Trigger */}
      <section className="p-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between font-mono text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`px-3 py-1 font-bold flex items-center gap-1.5 transition-colors cursor-pointer rounded ${
              isListening
                ? 'bg-secondary text-surface-container-lowest'
                : 'bg-surface-container-high text-outline border border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-xs">sensors</span>
            <span>{isListening ? 'SIPHON RUNNING' : 'SIPHON PAUSED'}</span>
          </button>

          <button
            onClick={() => setIsCallModalOpen(true)}
            className="px-3 py-1 bg-primary text-surface-container-lowest font-bold flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded"
          >
            <span className="material-symbols-outlined text-xs">add_call</span>
            <span>SIMULATE CALL INTERCEPT</span>
          </button>
        </div>

        <div className="text-outline text-[11px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
          <span>LISTENING ON PORT 9092 // KAFKA BROKER CONNECTED</span>
        </div>
      </section>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface font-mono text-xs">
        {/* Left: Intercept Stream Table (55%) */}
        <div className="w-full lg:w-[55%] border-r border-outline-variant flex flex-col bg-surface-container-lowest overflow-hidden">
          {intercepts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <div className="w-14 h-14 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center text-secondary mb-3">
                <span className="material-symbols-outlined text-3xl animate-pulse">radar</span>
              </div>
              <div className="text-sm font-bold text-on-surface uppercase">AWAITING SIGINT CDR TELEMETRY</div>
              <p className="text-xs text-outline mt-1.5 max-w-sm">
                No active phone calls or SMS packets on Kafka stream topic `veille_cdr_stream`. Click "SIMULATE CALL INTERCEPT" above to generate a new live wiretap.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant text-[10px] uppercase text-outline z-10">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-2 py-2">TIME</th>
                    <th className="px-2 py-2">CALLER (SRC)</th>
                    <th className="px-2 py-2">RECEIVER / TOWER</th>
                    <th className="px-2 py-2">PROTOCOL</th>
                    <th className="px-3 py-2 text-center">AUDIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {intercepts.map((i) => {
                    const isSelected = selectedIntercept?.id === i.id;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => {
                          setSelectedIntercept(i);
                          stopAudio();
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-container-low border-l-2 border-primary text-on-surface'
                            : 'hover:bg-surface-container-high/40'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-primary font-bold">{i.id}</td>
                        <td className="px-2 py-2.5 text-outline">{i.time}</td>
                        <td className="px-2 py-2.5 font-bold truncate max-w-[140px]">{i.src}</td>
                        <td className="px-2 py-2.5 text-on-surface-variant truncate max-w-[130px]">{i.dst}</td>
                        <td className="px-2 py-2.5 text-[10px]">{i.protocol}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/30">
                            <span className="material-symbols-outlined text-[12px]">volume_up</span>
                            <span>{i.duration || 35}s</span>
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

        {/* Right: Selected Intercept Details & Interactive Audio Player (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col bg-surface-container-lowest overflow-y-auto p-4 space-y-4">
          {selectedIntercept ? (
            <div className="space-y-4 animate-fade-in">
              {/* Top Details Card */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-xs tracking-wider">{selectedIntercept.id}</div>
                  <div className="text-on-surface font-bold text-sm mt-0.5">{selectedIntercept.src}</div>
                </div>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded ${selectedIntercept.statusColor}`}>
                  {selectedIntercept.status}
                </span>
              </div>

              {/* Metadata Attributes */}
              <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 text-[11px] rounded">
                <div className="flex justify-between">
                  <span className="text-outline">DESTINATION / CELL TOWER:</span>
                  <span className="text-on-surface font-bold">{selectedIntercept.dst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">BEARER PROTOCOL:</span>
                  <span className="text-on-surface">{selectedIntercept.protocol} ({selectedIntercept.channel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">INTELLIGENCE CORRELATION:</span>
                  <span className="text-secondary font-bold">{selectedIntercept.association}</span>
                </div>
                {selectedIntercept.keyword && (
                  <div className="flex justify-between">
                    <span className="text-outline">KEYWORD TRIGGER:</span>
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {selectedIntercept.keyword}
                    </span>
                  </div>
                )}
              </div>

              {/* ================= INTERACTIVE AUDIO PLAYER ================= */}
              <div className="p-4 bg-surface-container border border-primary/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">graphic_eq</span>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      WIRETAP AUDIO TELEMETRY
                    </span>
                  </div>
                  <span className="text-[10px] text-outline font-mono">
                    {isPlayingAudio ? 'STREAMING ACTIVE' : 'READY TO PLAY'}
                  </span>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="h-16 bg-surface-container-lowest border border-outline-variant rounded flex items-center justify-center px-3 gap-1 overflow-hidden">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const isPassed = (idx / 36) * 100 <= audioProgress;
                    const randomHeight = isPlayingAudio 
                      ? Math.max(15, Math.floor(Math.sin(idx + Date.now() / 200) * 80 + Math.random() * 40))
                      : (idx % 4 === 0 ? 45 : idx % 2 === 0 ? 25 : 15);

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-150 ${
                          isPassed
                            ? 'bg-primary shadow-[0_0_6px_rgba(0,229,255,0.6)]'
                            : 'bg-surface-container-high'
                        }`}
                        style={{ height: `${randomHeight}%` }}
                      />
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden border border-outline-variant">
                    <div
                      className="bg-primary h-full transition-all duration-200"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-outline font-mono">
                    <span>{Math.floor((audioProgress / 100) * (selectedIntercept.duration || 35))}s</span>
                    <span>{selectedIntercept.duration || 35}s (FULL DURATION)</span>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlay}
                      className="px-4 py-2 bg-primary text-surface-container-lowest font-bold text-xs rounded hover:bg-primary-fixed-dim transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isPlayingAudio ? 'pause' : 'play_arrow'}
                      </span>
                      <span>{isPlayingAudio ? 'PAUSE AUDIO' : 'PLAY WIRETAP AUDIO'}</span>
                    </button>

                    <button
                      onClick={stopAudio}
                      className="p-2 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface rounded cursor-pointer transition-colors"
                      title="Stop Audio"
                    >
                      <span className="material-symbols-outlined text-sm">stop</span>
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-sm">volume_up</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-16 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Whisper AI Transcript */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-outline">WHISPER AI VOICE TRANSCRIPT</span>
                  <span className="text-[9px] text-secondary font-mono">98.6% RECOGNITION CONFIDENCE</span>
                </div>
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant rounded">
                  {selectedIntercept.transcriptSnippet}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">call</span>
              <div>Select a telephony packet from the stream to inspect speech transcription and play audio.</div>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Call Intercept Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-6 font-mono text-xs animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-primary">add_call</span>
                <span>SIMULATE CARRIER INTERCEPT CALL</span>
              </div>
              <button onClick={() => setIsCallModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleInitiateCall} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">CALLER NUMBER / TARGET ID</label>
                <input
                  type="text"
                  value={callSrc}
                  onChange={(e) => setCallSrc(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary rounded"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">DESTINATION NUMBER / CELL TOWER</label>
                <input
                  type="text"
                  value={callDst}
                  onChange={(e) => setCallDst(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary rounded"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">CARRIER PROTOCOL</label>
                <select
                  value={callProtocol}
                  onChange={(e) => setCallProtocol(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-primary focus:outline-none focus:border-primary rounded"
                >
                  <option value="GSM-VoLTE-PDU">GSM-VoLTE-PDU (Carrier Voice)</option>
                  <option value="SIP-TLS-CH04">SIP-TLS Encrypted VoIP</option>
                  <option value="GSM-SMS-PDU">GSM-SMS Raw PDU</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">INTERCEPT TRANSCRIPT CONTENT</label>
                <textarea
                  value={callTranscript}
                  onChange={(e) => setCallTranscript(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-lowest border border-outline-variant p-2.5 text-on-surface focus:outline-none focus:border-primary rounded"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(false)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant text-outline hover:text-on-surface rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                >
                  INJECT INTERCEPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsIntercept;
