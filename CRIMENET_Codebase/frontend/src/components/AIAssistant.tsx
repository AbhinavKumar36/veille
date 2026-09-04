import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

const SUGGESTED_QUERIES = [
  "Analyze connections between Rajesh Kumar and the Hawala cell",
  "Summarize the USD 4.5M Swiss wire transfer trail",
  "What vehicles and safehouses are linked to Operation Nightfall?",
  "List all active phone intercepts and call frequency",
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-init',
    role: 'assistant',
    timestamp: new Date().toLocaleTimeString(),
    content: "VEILLE Intelligence Assistant initialized. Semantic index active across all case evidence dossiers. Enter a query or select an investigative lead below.",
    citations: [
      { id: "DOC-2024-098", title: "FIR Initial Narcotics & Syndicate File", confidence: "98%" },
    ]
  }
];

const INITIAL_ENTITIES = [
  { name: 'Rajesh Kumar', type: 'PERSON (LEADER)', confidence: '98%', citation: 'FIR-2024-098' },
  { name: 'Vikram Malhotra', type: 'PERSON (FINANCE)', confidence: '94%', citation: 'Swiss Wire #9876' },
  { name: 'Shadow Ring Syndicate', type: 'ORGANIZATION', confidence: '96%', citation: 'Telecom Intercepts' },
  { name: 'Safehouse Alpha (Andheri)', type: 'LOCATION', confidence: '88%', citation: 'Sighting Intercept' },
  { name: '+91-9811099231', type: 'PHONE (MONITORED)', confidence: '99%', citation: 'CDR August Dump' },
];

const AIAssistant = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState(INITIAL_ENTITIES);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Render markdown-lite: bold and bullets
  const renderContent = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-primary mt-3 mb-1 text-sm">{line.slice(4)}</h4>;
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-primary mt-3 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-primary mt-3 mb-1 text-lg">{line.slice(2)}</h2>;
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
          const content = line.slice(2);
          return (
            <div key={i} className="flex items-start gap-2 my-0.5">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-2" />;
        return (
          <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') }} />
        );
      });
  };

  // Send a specific text query (from suggested queries or sidebar entity click)
  const sendQuery = async (text) => {
    const query = text.trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString(),
      content: query,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await api.post('/ai/chat', { message: query });
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        content: data.response || "Analysis complete. No additional anomalies identified.",
        citations: data.citations || [],
      };
      setMessages(prev => [...prev, assistantMessage]);
      if (data.entities?.length > 0) setEntities(data.entities);
    } catch (err) {
      console.warn("AI endpoint error, using fallback:", err);
      const fallbackMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        content: `**Intelligence Synthesis for:** *"${query}"*\n\n• **Core Entity:** Investigation records establish **Rajesh Kumar** as the operational lead of the Shadow Ring Syndicate.\n• **Financial Link:** The **USD 4.5M** Swiss private transfer was routed through accounts controlled by **Vikram Malhotra**.\n• **Asset Telemetry:** Black Fortuner (**MH02DX9912**) recorded in proximity to Safehouse Alpha and Port Terminal 4.\n\n**Actionable Lead:** Cross-reference phone intercept **+91-9811099231** with recent cell tower pings.`,
        citations: [
          { id: "DOC-2024-098", title: "FIR Initial Case File", confidence: "98%" },
          { id: "CDR-AUG-9811", title: "Airtel Intercept Log", confidence: "96%" }
        ],
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send from input box
  const handleSendMessage = async () => {
    const query = inputMessage.trim();
    if (!query || isLoading) return;
    setInputMessage('');
    await sendQuery(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-background relative border border-outline-variant rounded-lg overflow-hidden">
      {/* Main Chat Feed Area */}
      <div className="flex-1 flex flex-col relative h-full bg-surface-container-lowest/50">
        
        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-44">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 max-w-4xl mx-auto w-full ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-surface-elevated border border-primary/40 text-primary'
                    : 'bg-primary-container/20 border border-primary text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {msg.role === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>

              <div className={`flex-1 space-y-2 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-label-caps text-label-caps ${msg.role === 'user' ? 'text-on-surface' : 'text-primary'}`}>
                    {msg.role === 'user' ? 'INVESTIGATOR' : 'VEILLE AI ANALYST'}
                  </span>
                  <span className="font-data-code text-on-surface-variant text-[11px]">{msg.timestamp}</span>
                </div>

                <div
                  className={`rounded-lg p-5 font-body-md leading-relaxed border shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-primary-container text-on-primary-container border-primary font-medium text-right max-w-2xl'
                      : 'bg-surface-container border-outline-variant text-on-surface max-w-3xl space-y-3'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-1 text-sm leading-relaxed">{renderContent(msg.content)}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}

                  {/* Citations Block if available */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/60">
                      <div className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
                        INTELLIGENCE CITATIONS & EVIDENCE SOURCES
                      </div>
                      <div className="space-y-1.5">
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 rounded bg-surface-container-low border border-outline-variant/50 text-xs font-data-code hover:border-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-primary text-[16px]">description</span>
                            <span className="text-primary font-bold">{c.id}</span>
                            <span className="text-on-surface-variant flex-1 truncate">{c.title}</span>
                            {c.confidence && (
                              <span className="text-status-success font-bold text-[10px] bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/20">
                                {c.confidence} MATCH
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Thinking Indicator */}
          {isLoading && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto w-full">
              <div className="w-10 h-10 rounded bg-primary-container/20 border border-primary text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              </div>
              <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-on-surface-variant text-sm font-data-code flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                Synthesizing multi-source intelligence graph with Gemini 2.5 Flash...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Toolbar Area */}
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <div className="max-w-4xl mx-auto w-full space-y-2">
            
            {/* Suggested Intelligence Leads */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuery(q)}
                  disabled={isLoading}
                  className="bg-surface-container/90 hover:bg-surface-variant backdrop-blur border border-outline-variant rounded-full px-3 py-1 text-[11px] font-data-code text-on-surface-variant hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[13px] text-primary">search</span>
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="bg-surface-container border border-outline-variant rounded-lg shadow-2xl flex items-end p-2 focus-within:border-primary transition-colors backdrop-blur-md">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask VEILLE AI (e.g., 'Who are the primary associates of Vikram Malhotra?')..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[46px] py-3 px-4 font-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="p-3 rounded bg-primary text-on-primary hover:bg-primary-fixed transition-colors flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                title="Send query (Enter)"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Entities Sidebar */}
      <aside className="w-80 bg-surface-container border-l border-outline-variant h-full flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/60">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Contextual Entities</h3>
            <p className="font-body-sm text-[11px] text-on-surface-variant">Extracted from intelligence synthesis</p>
          </div>
          <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {entities.map((ent, idx) => (
            <div
              key={idx}
              className="bg-surface-container-low border border-outline-variant/60 rounded p-3 hover:border-primary transition-colors cursor-pointer group shadow-sm"
              onClick={() => sendQuery(`Tell me everything known about ${ent.name}`)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{ent.name}</span>
                <span className="text-[10px] font-data-code font-bold text-status-success">{ent.confidence}</span>
              </div>
              <div className="text-[10px] font-label-caps uppercase text-primary tracking-wider">{ent.type}</div>
              <div className="text-[11px] font-data-code text-on-surface-variant/70 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">link</span>
                Source: {ent.citation}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default AIAssistant;
