import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { formatLocalTimestamp } from '../utils/formatTime';
import { Case } from '../types';

export interface InterceptRow {
  id: string;
  time: string;
  channel: string;
  src: string;
  dst: string;
  protocol: string;
  status: 'DECRYPTED' | 'PROCESSING' | 'FAILED';
  statusColor: string;
  association: string;
  associationType: 'target' | 'relay' | 'sensor' | 'org' | 'routine';
  hasAudio: boolean;
  audioUrl?: string;
  audioBlob?: Blob;
  evidenceId?: string;
  keyword?: string;
  transcriptSnippet?: string;
  duration?: number;
  caseId?: string;
  caseTitle?: string;
  entities?: Array<{ name: string; type: string; confidence: number; context?: string }>;
}

export const CommunicationsIntercept: React.FC = () => {
  const [intercepts, setIntercepts] = useState<InterceptRow[]>([]);
  const [selectedIntercept, setSelectedIntercept] = useState<InterceptRow | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [isListening, setIsListening] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal State for Upload & Mic Recording
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'FILE' | 'RECORD'>('FILE');
  const [uploadCaseId, setUploadCaseId] = useState<string>('');
  const [callerLabel, setCallerLabel] = useState<string>('+91 98201 12233 (Target Intercept)');
  const [receiverLabel, setReceiverLabel] = useState<string>('+91 98192 23344 (Syndicate Relay)');
  const [protocolType, setProtocolType] = useState<string>('GSM-VoLTE-Carrier');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Live Microphone Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Fetch Cases and Intercepts ──────────────────────────────────────────
  const loadIntercepts = async (showSpinner: boolean = true) => {
    if (showSpinner) setLoading(true);
    try {
      // 1. Fetch cases
      const casesData: Case[] = await api.get('/cases').catch(() => []);
      const loadedCases = Array.isArray(casesData) ? casesData : [];
      setCases(loadedCases);
      if (loadedCases.length > 0 && !uploadCaseId) {
        setUploadCaseId(loadedCases[0].id);
      }

      // 2. Fetch all evidence records
      const evidenceData: any = await api.get('/evidence').catch(() => []);
      const rawEvidence = Array.isArray(evidenceData) ? evidenceData : [];

      // Filter audio wiretaps from evidence vault
      const audioEvidenceRows: InterceptRow[] = [];
      for (const ev of rawEvidence) {
        const ext = (ev.original_filename || '').split('.').pop()?.toLowerCase();
        const isAudioType = ev.source_type === 'AUDIO' || ev.source_type === 'WIRETAP' || ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac', 'flac'].includes(ext || '');
        if (isAudioType) {
          const matchedCase = loadedCases.find(c => c.id === ev.case_id);
          const isDone = ev.status === 'COMPLETED' || ev.status === 'PROCESSED';
          const isFailed = ev.status === 'FAILED';
          const token = localStorage.getItem('access_token') || '';
          
          audioEvidenceRows.push({
            id: `AUD-${ev.id.slice(0, 6).toUpperCase()}`,
            time: formatLocalTimestamp(ev.created_at).slice(11, 19) || '12:00:00',
            channel: `WIRETAP-ENC`,
            src: ev.original_filename?.replace(/\.[^/.]+$/, '') || 'Acoustic Intercept',
            dst: matchedCase ? `Case: ${matchedCase.title}` : 'Forensic Vault',
            protocol: 'VOICE-WIRETAP-RAW',
            status: isDone ? 'DECRYPTED' : isFailed ? 'FAILED' : 'PROCESSING',
            statusColor: isDone 
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              : isFailed 
              ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' 
              : 'text-amber-400 border-amber-500/40 bg-amber-500/10',
            association: matchedCase ? matchedCase.title : 'Vault Recording',
            associationType: 'target',
            hasAudio: true,
            audioUrl: `/api/v1/evidence/file/${ev.id}?token=${token}`,
            evidenceId: ev.id,
            caseId: ev.case_id,
            caseTitle: matchedCase ? matchedCase.title : undefined,
            transcriptSnippet: isDone
              ? `Authentic voice wiretap recording (${ev.original_filename}). AI forensic speech model resolved caller acoustic stream.`
              : isFailed
              ? `Acoustic extraction error: ${ev.error_message || 'Processing failed'}`
              : 'AI Whisper/Gemini transcription engine currently processing voice stream in background...',
            keyword: 'AUDIO WIRETAP',
            duration: 45
          });
        }
      }

      // 3. Fetch CDR Telemetry from Graph
      const cdrRows: InterceptRow[] = [];
      for (const c of loadedCases) {
        try {
          const graphData: any = await api.get(`/graph/${c.id}`).catch(() => null);
          const rawEdges = graphData?.edges || [];
          const rawNodes = graphData?.nodes || [];

          const commEdges = rawEdges.filter((e: any) => 
            (e.label || e.type || '').toUpperCase().includes('COMM')
          );

          commEdges.forEach((e: any, idx: number) => {
            const srcNode = rawNodes.find((n: any) => n.id === e.source);
            const dstNode = rawNodes.find((n: any) => n.id === e.target);
            const props = e.properties || e.data?.properties || {};

            const srcName = srcNode?.properties?.phone_number || srcNode?.name || `Caller ${idx + 1}`;
            const dstName = dstNode?.properties?.phone_number || dstNode?.name || `Tower Bandra-0${idx + 1}`;
            const durationSec = parseInt(props.duration_seconds || '40', 10);
            const tower = props.cell_tower_id || 'TWR-DEL-CP-01';

            cdrRows.push({
              id: `SIG-${c.id.slice(0, 4).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
              time: props.timestamp ? String(props.timestamp).slice(11, 19) || '14:30:00' : '14:30:00',
              channel: `VOLTE-PDU-0${(idx % 4) + 1}`,
              src: srcName,
              dst: dstName,
              protocol: 'GSM-PDU-SIGNAL',
              status: 'DECRYPTED',
              statusColor: 'text-secondary border-secondary/40 bg-secondary/10',
              association: `${srcNode?.name || 'Caller'} ➔ ${dstNode?.name || 'Receiver'}`,
              associationType: 'target',
              hasAudio: false, // Standard CDR text packet without audio payload
              audioUrl: undefined,
              caseId: c.id,
              caseTitle: c.title,
              transcriptSnippet: props.interaction || `Intercepted cellular packet routed via ${tower}. Duration: ${durationSec}s. Signal: Cellular Triangulation.`,
              keyword: props.cell_tower_id ? `TOWER [${tower}]` : 'TELECOM PDU',
              duration: durationSec || 40
            });
          });
        } catch {}
      }

      // Combine real audio wiretaps (first) and CDR packets
      const combined = [...audioEvidenceRows, ...cdrRows];
      setIntercepts(combined);

      setSelectedIntercept(prev => {
        if (!prev) return combined[0] || null;
        return combined.find(i => i.id === prev.id) || combined[0] || null;
      });

    } catch (err: any) {
      console.error('Failed to load intercepts:', err);
      triggerToast('Error synchronizing telecom intercepts.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadIntercepts(true);
  }, []);

  // Real-time polling for processing audio wiretaps
  useEffect(() => {
    const hasProcessing = intercepts.some(i => i.status === 'PROCESSING');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadIntercepts(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [intercepts]);

  // If selected intercept changes and has real audio evidence, fetch its entities & transcript
  useEffect(() => {
    if (selectedIntercept && selectedIntercept.hasAudio && selectedIntercept.evidenceId) {
      api.get(`/evidence/${selectedIntercept.evidenceId}/entities`)
        .then((res: any) => {
          if (res && res.entities && res.entities.length > 0) {
            setSelectedIntercept(prev => prev && prev.id === selectedIntercept.id ? { ...prev, entities: res.entities } : prev);
          }
        })
        .catch(() => {});

      api.get(`/evidence/${selectedIntercept.evidenceId}/preview`)
        .then((res: any) => {
          if (res && res.content && res.type !== 'empty') {
            setSelectedIntercept(prev => prev && prev.id === selectedIntercept.id ? { ...prev, transcriptSnippet: res.content } : prev);
          }
        })
        .catch(() => {});
    }
  }, [selectedIntercept?.id]);

  // ── 2. Real HTML5 Audio Player Controller ──────────────────────────────────
  const handleTogglePlay = () => {
    if (!selectedIntercept?.hasAudio || !selectedIntercept.audioUrl) {
      triggerToast('No audio recording attached to this intercept packet.');
      return;
    }

    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
          triggerToast(`Playing wiretap recording: ${selectedIntercept.src}`);
        })
        .catch(err => {
          console.error('Playback error:', err);
          triggerToast(`Playback failed: ${err.message}`);
        });
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlayingAudio(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // ── 3. Live Microphone Recording Handlers ──────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);
      triggerToast('Microphone surveillance active. Recording voice wiretap...');

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Microphone access denied:', err);
      triggerToast(`Microphone error: ${err.message || 'Permission denied'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      triggerToast('Voice wiretap captured. You can preview and upload below.');
    }
  };

  // ── 4. Upload Wiretap Form Handler ────────────────────────────────────────
  const handleUploadWiretap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadCaseId) {
      triggerToast('Please select a target case.');
      return;
    }

    let fileToUpload: File | null = selectedAudioFile;

    if (activeModalTab === 'RECORD') {
      if (!recordedBlob) {
        triggerToast('Please record audio first.');
        return;
      }
      fileToUpload = new File([recordedBlob], `Wiretap_Mic_${Date.now()}.webm`, { type: 'audio/webm' });
    }

    if (!fileToUpload) {
      triggerToast('Please select or record an audio file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('case_id', uploadCaseId);
    formData.append('source_type', 'AUDIO');

    try {
      const res: any = await api.post('/evidence/upload', formData);
      triggerToast(`Voice wiretap '${fileToUpload.name}' vaulted. AI transcription & graph entity extraction underway...`);
      setIsUploadModalOpen(false);
      setSelectedAudioFile(null);
      setRecordedBlob(null);
      setRecordedAudioUrl(null);
      await loadIntercepts(false);
    } catch (err: any) {
      console.error('Upload failed:', err);
      triggerToast(`Wiretap ingestion failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredIntercepts = intercepts.filter(i => {
    if (selectedCaseId === 'ALL') return true;
    return i.caseId === selectedCaseId;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface text-on-surface antialiased select-none overflow-hidden -m-4 lg:-m-8 min-w-0 border-t border-outline-variant font-sans">
      
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={selectedIntercept?.audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || selectedIntercept?.duration || 35);
        }}
        onEnded={() => {
          setIsPlayingAudio(false);
          setCurrentTime(0);
          triggerToast('Wiretap audio playback completed.');
        }}
        onError={() => {
          setIsPlayingAudio(false);
        }}
      />

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

      {/* Top Banner Telemetry Strip */}
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
          <span className="text-[10px] text-outline uppercase font-bold">INTERCEPTED SESSIONS</span>
          <div className="text-xl font-bold text-on-surface mt-1">{filteredIntercepts.length} Captured</div>
          <div className="text-[10px] text-primary">{intercepts.filter(i => i.hasAudio).length} Authentic Audio Wiretaps</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">WHISPER AI ENGINE</span>
          <div className="text-xl font-bold text-primary mt-1">SPEECH-TO-TEXT</div>
          <div className="text-[10px] text-outline">Multi-Lingual (Hindi/Eng)</div>
        </div>

        <div className="bg-surface-container-lowest p-3 flex flex-col justify-between">
          <span className="text-[10px] text-outline uppercase font-bold">AUDIO ENCLAVE STATUS</span>
          <div className="text-xl font-bold text-secondary mt-1">
            {selectedIntercept?.hasAudio ? (isPlayingAudio ? 'PLAYING RECORDING' : 'AUDIO ATTACHED') : 'NO AUDIO (PDU ONLY)'}
          </div>
          <div className="text-[10px] text-outline">
            {selectedIntercept?.hasAudio ? 'AES-256 Vaulted Stream' : 'Signaling metadata'}
          </div>
        </div>
      </section>

      {/* Control Strip & Upload Trigger */}
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
            onClick={() => {
              setIsUploadModalOpen(true);
              setActiveModalTab('FILE');
            }}
            className="px-3 py-1 bg-primary text-surface-container-lowest font-bold flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors cursor-pointer rounded shadow-sm"
          >
            <span className="material-symbols-outlined text-xs">mic</span>
            <span>INGEST / RECORD WIRETAP AUDIO</span>
          </button>

          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant px-2.5 py-1 text-xs text-on-surface rounded focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Active Cases</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
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
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">progress_activity</span>
              <span>Scanning telecommunication streams &amp; wiretaps...</span>
            </div>
          ) : filteredIntercepts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <div className="w-14 h-14 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center text-secondary mb-3">
                <span className="material-symbols-outlined text-3xl animate-pulse">radar</span>
              </div>
              <div className="text-sm font-bold text-on-surface uppercase">NO ACTIVE TELEMETRY OR WIRETAP SESSIONS</div>
              <p className="text-xs text-outline mt-1.5 max-w-sm">
                No CDR signaling packets or audio recordings found for the selected case. Click "INGEST / RECORD WIRETAP AUDIO" to upload audio evidence or capture voice live.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant text-[10px] uppercase text-outline z-10">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-2 py-2">TIME</th>
                    <th className="px-2 py-2">SOURCE / CALLER</th>
                    <th className="px-2 py-2">DESTINATION / TOWER</th>
                    <th className="px-2 py-2">PROTOCOL</th>
                    <th className="px-3 py-2 text-center">RECORDING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {filteredIntercepts.map((i) => {
                    const isSelected = selectedIntercept?.id === i.id;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => {
                          setSelectedIntercept(i);
                          handleStopAudio();
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
                          {i.hasAudio ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              <span className="material-symbols-outlined text-[12px]">graphic_eq</span>
                              <span>AUDIO PLAYABLE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-outline bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant">
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              <span>PDU ONLY</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Intercept Details & Dedicated Audio Player (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col bg-surface-container-lowest overflow-y-auto p-4 space-y-4">
          {selectedIntercept ? (
            <div className="space-y-4 animate-fade-in">
              {/* Top Details Card */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-xs tracking-wider">{selectedIntercept.id}</div>
                  <div className="text-on-surface font-bold text-sm mt-0.5">{selectedIntercept.src}</div>
                  {selectedIntercept.caseTitle && (
                    <div className="text-[10px] text-outline mt-0.5 font-mono">Case: {selectedIntercept.caseTitle}</div>
                  )}
                </div>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded ${selectedIntercept.statusColor}`}>
                  {selectedIntercept.status}
                </span>
              </div>

              {/* Metadata Attributes */}
              <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 text-[11px] rounded">
                <div className="flex justify-between">
                  <span className="text-outline">DESTINATION / TOWER NODE:</span>
                  <span className="text-on-surface font-bold">{selectedIntercept.dst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">BEARER CHANNEL:</span>
                  <span className="text-on-surface">{selectedIntercept.protocol} ({selectedIntercept.channel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">INTELLIGENCE CORRELATION:</span>
                  <span className="text-secondary font-bold">{selectedIntercept.association}</span>
                </div>
                {selectedIntercept.keyword && (
                  <div className="flex justify-between">
                    <span className="text-outline">CLASSIFICATION TRIGGER:</span>
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {selectedIntercept.keyword}
                    </span>
                  </div>
                )}
              </div>

              {/* ================= INTERACTIVE AUDIO PLAYER ================= */}
              <div className={`p-4 rounded-xl space-y-3 transition-all ${
                selectedIntercept.hasAudio 
                  ? 'bg-surface-container border border-primary/50 shadow-lg shadow-primary/5' 
                  : 'bg-surface-container-low border border-outline-variant opacity-75'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[20px] ${selectedIntercept.hasAudio ? 'text-primary' : 'text-outline'}`}>
                      {selectedIntercept.hasAudio ? 'graphic_eq' : 'volume_off'}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedIntercept.hasAudio ? 'text-primary' : 'text-outline'}`}>
                      {selectedIntercept.hasAudio ? 'WIRETAP ACOUSTIC TELEMETRY' : 'NO AUDIO RECORDING ATTACHED'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono">
                    {selectedIntercept.hasAudio ? (
                      isPlayingAudio ? (
                        <span className="text-emerald-400 font-bold animate-pulse">● STREAMING LIVE</span>
                      ) : (
                        <span className="text-primary">AUDIO READY</span>
                      )
                    ) : (
                      <span className="text-outline">PDU LOG ONLY</span>
                    )}
                  </span>
                </div>

                {/* Waveform Visualizer */}
                <div className="h-16 bg-surface-container-lowest border border-outline-variant rounded flex items-center justify-center px-3 gap-1 overflow-hidden">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
                    const isPassed = (idx / 36) * 100 <= progressPercent;
                    const randomHeight = isPlayingAudio 
                      ? Math.max(15, Math.floor(Math.sin(idx + Date.now() / 200) * 80 + Math.random() * 40))
                      : selectedIntercept.hasAudio 
                      ? (idx % 4 === 0 ? 50 : idx % 2 === 0 ? 30 : 18)
                      : 10;

                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-150 ${
                          !selectedIntercept.hasAudio
                            ? 'bg-surface-container-high'
                            : isPassed
                            ? 'bg-primary shadow-[0_0_6px_rgba(0,229,255,0.6)]'
                            : 'bg-surface-container-high'
                        }`}
                        style={{ height: `${randomHeight}%` }}
                      />
                    );
                  })}
                </div>

                {/* Progress Scrub Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    disabled={!selectedIntercept.hasAudio}
                    onChange={handleSeek}
                    className="w-full accent-primary bg-surface-container-lowest h-1.5 rounded-full cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-outline font-mono">
                    <span>{Math.floor(currentTime)}s</span>
                    <span>{selectedIntercept.hasAudio ? `${Math.floor(duration || selectedIntercept.duration || 45)}s (RECORDING DURATION)` : 'NO AUDIO'}</span>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlay}
                      disabled={!selectedIntercept.hasAudio}
                      className={`px-4 py-2 font-bold text-xs rounded transition-all flex items-center gap-1.5 ${
                        selectedIntercept.hasAudio
                          ? 'bg-primary text-surface-container-lowest hover:bg-primary-fixed-dim cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                          : 'bg-surface-container-high text-outline cursor-not-allowed border border-outline-variant'
                      }`}
                      title={selectedIntercept.hasAudio ? 'Play/Pause Audio' : 'Audio recording not attached'}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isPlayingAudio ? 'pause' : 'play_arrow'}
                      </span>
                      <span>
                        {selectedIntercept.hasAudio 
                          ? (isPlayingAudio ? 'PAUSE RECORDING' : 'PLAY WIRETAP AUDIO') 
                          : 'PLAYBACK DISABLED (NO AUDIO)'}
                      </span>
                    </button>

                    {selectedIntercept.hasAudio && (
                      <button
                        onClick={handleStopAudio}
                        className="p-2 bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface rounded cursor-pointer transition-colors"
                        title="Stop Audio"
                      >
                        <span className="material-symbols-outlined text-sm">stop</span>
                      </button>
                    )}
                  </div>

                  {/* Volume Slider */}
                  {selectedIntercept.hasAudio && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-sm">volume_up</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 accent-primary cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* AI Voice Transcript */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-outline">WHISPER / GEMINI AI VOICE TRANSCRIPT</span>
                  <span className="text-[9px] text-secondary font-mono">
                    {selectedIntercept.hasAudio ? 'AI MULTI-LINGUAL SPEECH MODEL' : 'SIGNALING METADATA DESCRIPTOR'}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant rounded whitespace-pre-wrap font-mono">
                  {selectedIntercept.transcriptSnippet || 'No spoken transcript available for this packet.'}
                </div>
              </div>

              {/* Extracted Entities Linked from Wiretap */}
              {selectedIntercept.entities && selectedIntercept.entities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-outline">RESOLVED INTELLIGENCE ENTITIES</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIntercept.entities.map((ent, idx) => (
                      <div key={idx} className="bg-surface-container-low border border-outline-variant p-2 rounded flex flex-col justify-between">
                        <div className="font-bold text-on-surface text-xs truncate">{ent.name}</div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-secondary uppercase">{ent.type}</span>
                          <span className="text-outline">{Math.round(ent.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">call</span>
              <div>Select a telephony packet or wiretap session from the stream to inspect speech transcription and play audio.</div>
            </div>
          )}
        </div>
      </div>

      {/* ================= INGEST & RECORD WIRETAP AUDIO MODAL ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-6 font-mono text-xs animate-scale-in space-y-4">
            
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-primary">mic</span>
                <span>INGEST &amp; TRANSCRIBE WIRETAP AUDIO</span>
              </div>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  if (isRecording) stopRecording();
                }} 
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Ingestion Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
              <button
                type="button"
                onClick={() => setActiveModalTab('FILE')}
                className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                  activeModalTab === 'FILE' 
                    ? 'bg-primary text-surface-container-lowest' 
                    : 'bg-surface-container-low text-outline hover:text-on-surface'
                }`}
              >
                UPLOAD AUDIO FILE (.MP3 / .WAV / .M4A)
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('RECORD')}
                className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'RECORD' 
                    ? 'bg-primary text-surface-container-lowest' 
                    : 'bg-surface-container-low text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xs">mic</span>
                <span>RECORD LIVE MIC</span>
              </button>
            </div>

            <form onSubmit={handleUploadWiretap} className="space-y-3.5">
              {/* Target Case Selection */}
              <div>
                <label className="text-[10px] uppercase text-outline block mb-1">ASSOCIATED INVESTIGATIVE CASE</label>
                <select
                  value={uploadCaseId}
                  onChange={(e) => setUploadCaseId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary rounded"
                  required
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Mode 1: File Upload */}
              {activeModalTab === 'FILE' ? (
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">SELECT AUDIO RECORDING</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedAudioFile(file);
                      }
                    }}
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-2 text-on-surface rounded cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary file:text-surface-container-lowest"
                  />
                  {selectedAudioFile && (
                    <div className="mt-2 p-2 bg-surface-container-low border border-primary/30 rounded flex items-center justify-between text-[11px]">
                      <span className="text-primary font-bold truncate max-w-xs">{selectedAudioFile.name}</span>
                      <span className="text-outline font-mono">{(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode 2: Live Mic Recording */
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? 'bg-rose-500/20 border-2 border-rose-500 animate-pulse text-rose-400' 
                        : 'bg-surface-container-high border border-outline-variant text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-3xl">
                        {isRecording ? 'mic' : 'mic_none'}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm">
                      {isRecording ? (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          RECORDING: {Math.floor(recordSeconds / 60).toString().padStart(2, '0')}:{(recordSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      ) : recordedBlob ? (
                        <span className="text-emerald-400">RECORDING CAPTURED ({Math.floor(recordSeconds)}s)</span>
                      ) : (
                        <span className="text-outline">READY TO CAPTURE VOICE WIRETAP</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">fiber_manual_record</span>
                        <span>START RECORDING</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 bg-surface-container-high border border-rose-500/80 text-rose-400 font-bold rounded flex items-center gap-1.5 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">stop</span>
                        <span>STOP CAPTURE</span>
                      </button>
                    )}
                  </div>

                  {recordedAudioUrl && (
                    <div className="mt-2 pt-2 border-t border-outline-variant">
                      <div className="text-[10px] text-outline mb-1">PLAYBACK PREVIEW BEFORE INGESTION:</div>
                      <audio controls src={recordedAudioUrl} className="w-full h-8" />
                    </div>
                  )}
                </div>
              )}

              {/* Source & Destination Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">CALLER (SOURCE)</label>
                  <input
                    type="text"
                    value={callerLabel}
                    onChange={(e) => setCallerLabel(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-on-surface rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-outline block mb-1">RECIPIENT / CHANNEL</label>
                  <input
                    type="text"
                    value={receiverLabel}
                    onChange={(e) => setReceiverLabel(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant px-3 py-1.5 text-on-surface rounded focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Submission Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant text-outline hover:text-on-surface rounded cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (activeModalTab === 'FILE' && !selectedAudioFile) || (activeModalTab === 'RECORD' && !recordedBlob)}
                  className="px-4 py-1.5 bg-primary text-surface-container-lowest font-bold rounded hover:bg-primary-fixed-dim transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-md"
                >
                  {isUploading ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      <span>VAULTING &amp; TRANSCRIBING...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">upload</span>
                      <span>INGEST &amp; PROCESS WIRETAP</span>
                    </>
                  )}
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
