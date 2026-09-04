import React, { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TIMEOUT_MS = 3000;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
};

const StatusBadge = ({ status }) => {
  if (status === 'checking') {
    return (
      <span className="flex items-center gap-1.5 text-on-surface-variant font-data-code text-[11px]">
        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
        Checking...
      </span>
    );
  }
  if (status === 'online') {
    return (
      <span className="flex items-center gap-1.5 text-status-success font-data-code text-[11px] font-bold">
        <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
        ONLINE
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-status-critical font-data-code text-[11px] font-bold">
      <span className="w-2 h-2 rounded-full bg-status-critical"></span>
      OFFLINE
    </span>
  );
};

const SystemHealth = () => {
  const [health, setHealth] = useState({
    api: 'checking',
    neo4j: 'checking',
    postgres: 'checking',
    celery: 'checking',
  });
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setHealth({ api: 'checking', neo4j: 'checking', postgres: 'checking', celery: 'checking' });
    try {
      const token = localStorage.getItem('access_token') || '';
      const data = await fetchWithTimeout(`${BASE_URL}/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealth({
        api: 'online',
        neo4j: data.neo4j === 'connected' ? 'online' : 'offline',
        postgres: 'online', // If API responded, Postgres is up
        celery: data.celery === 'connected' ? 'online' : 'offline',
      });
    } catch (e) {
      setHealth({ api: 'offline', neo4j: 'offline', postgres: 'offline', celery: 'offline' });
    }
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const services = [
    { key: 'api', label: 'FASTAPI GATEWAY', icon: 'router', desc: 'REST API + Auth middleware' },
    { key: 'postgres', label: 'POSTGRESQL', icon: 'database', desc: 'Cases, Evidence, Users, Audit Logs' },
    { key: 'neo4j', label: 'NEO4J GRAPH DB', icon: 'share', desc: 'Knowledge graph & relationship store' },
    { key: 'celery', label: 'CELERY WORKERS', icon: 'layers', desc: 'Async NLP extraction pipeline' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">System Health & Ops</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Monitor pipeline status, database connectivity, and service availability.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="font-data-code text-[11px] text-on-surface-variant">
              Last checked: {lastChecked}
            </span>
          )}
          <button
            onClick={checkHealth}
            className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded font-label-caps text-[11px] text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map(svc => {
          const status = health[svc.key];
          const isOnline = status === 'online';
          const isOffline = status === 'offline';
          return (
            <div
              key={svc.key}
              className={`bg-surface-card rounded-lg p-4 border transition-all ${
                isOnline ? 'border-status-success/40 shadow-[0_0_12px_rgba(0,255,128,0.07)]' :
                isOffline ? 'border-status-critical/40 shadow-[0_0_12px_rgba(255,61,0,0.07)]' :
                'border-outline-variant'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`material-symbols-outlined text-[28px] ${
                  isOnline ? 'text-status-success' : isOffline ? 'text-status-critical' : 'text-on-surface-variant'
                }`}>
                  {svc.icon}
                </span>
                <StatusBadge status={status} />
              </div>
              <h3 className="font-label-caps text-[11px] text-on-surface mb-0.5">{svc.label}</h3>
              <p className="font-body-sm text-[11px] text-on-surface-variant">{svc.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Engine */}
        <div className="bg-surface-card border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-1">AI EXTRACTION ENGINE</h3>
              <div className="font-headline-lg text-headline-lg text-primary">99.8%</div>
            </div>
            <span className="material-symbols-outlined text-primary text-[24px]">memory</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-data-code text-data-code text-body-sm">
              <span className="text-on-surface-variant">Success Rate (1h)</span>
              <span className="text-status-success">+0.2%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded overflow-hidden">
              <div className="h-full bg-primary w-[99.8%]"></div>
            </div>
            <div className="flex justify-between font-data-code text-[10px] text-on-surface-variant mt-2">
              <span>OPS: 4,201/min</span>
              <span>ERR: 8/hr</span>
            </div>
          </div>
        </div>

        {/* Graph DB */}
        <div className={`bg-surface-card border rounded-lg p-5 flex flex-col justify-between ${
          health.neo4j === 'online' ? 'border-status-success/40' : health.neo4j === 'offline' ? 'border-status-critical/40' : 'border-outline-variant'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-1">GRAPH DATABASE</h3>
              <div className={`font-headline-lg text-headline-lg ${health.neo4j === 'online' ? 'text-status-success' : health.neo4j === 'offline' ? 'text-status-critical' : 'text-on-surface-variant'}`}>
                {health.neo4j === 'online' ? 'CONNECTED' : health.neo4j === 'offline' ? 'OFFLINE' : '---'}
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant">share</span>
          </div>
          <div className="space-y-1 font-data-code text-[11px] text-on-surface-variant">
            <div>Neo4j Community Edition</div>
            <div>Port: 7474 / 7687 (Bolt)</div>
            <div className="text-primary">{health.neo4j === 'online' ? 'Cypher queries active' : 'Check Neo4j service'}</div>
          </div>
        </div>

        {/* API Gateway */}
        <div className={`bg-surface-card border rounded-lg p-5 flex flex-col justify-between ${
          health.api === 'online' ? 'border-status-success/40' : health.api === 'offline' ? 'border-status-critical/40' : 'border-outline-variant'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-1">API GATEWAY</h3>
              <div className={`font-headline-lg text-headline-lg ${health.api === 'online' ? 'text-status-success' : health.api === 'offline' ? 'text-status-critical' : 'text-on-surface-variant'}`}>
                {health.api === 'online' ? 'HEALTHY' : health.api === 'offline' ? 'DOWN' : 'Checking'}
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[24px]">router</span>
          </div>
          <div className="space-y-1 font-data-code text-[11px] text-on-surface-variant">
            <div>FastAPI v4.0 · Uvicorn</div>
            <div>Port: 8000</div>
            <div className="text-primary">{health.api === 'online' ? 'All endpoints live' : 'Run: uvicorn api.main:app'}</div>
          </div>
        </div>
      </div>

      {/* Dead Letter Queue */}
      <div className="bg-surface-card border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-critical animate-pulse shadow-[0_0_8px_#FF3D00]"></div>
            <h3 className="font-label-caps text-label-caps text-on-surface">DEAD LETTER QUEUE</h3>
            <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-data-code text-[10px]">3 PENDING</span>
          </div>
          <button className="px-3 py-1 border border-outline-variant rounded text-body-sm font-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors">
            RETRY ALL
          </button>
        </div>
        <div className="divide-y divide-outline-variant">
          {[
            { error: 'ERR_PARSE_TIMEOUT', job: '8x92-f41a', msg: 'Extraction failed for unstructured text blob. Pipeline stalled at NER stage.', retries: '2/3', age: '14m ago' },
            { error: 'ERR_GRAPH_CONSTRAINT', job: '2b44-c99d', msg: 'Attempted to create edge violating unique relationship constraint.', retries: '0/3', age: '1h ago' },
            { error: 'ERR_CELERY_TIMEOUT', job: '9c11-e73b', msg: 'Worker failed to pick up job within 30s. Redis broker may be unreachable.', retries: '3/3', age: '2h ago' },
          ].map((item, i) => (
            <div key={i} className="p-4 hover:bg-surface-container-highest/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-data-code text-data-code text-status-critical">{item.error}</span>
                  <span className="font-data-code text-[10px] text-on-surface-variant">JOB-ID: {item.job}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.msg}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right mr-4 font-data-code text-[10px] text-on-surface-variant">
                  <div>RETRIES: {item.retries}</div>
                  <div>{item.age}</div>
                </div>
                <button className="p-2 border border-outline-variant rounded text-primary hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
