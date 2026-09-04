/// <reference types="vite/client" />
import { useEffect } from 'react';

export function useGraphWebSocket(caseId: string | undefined, onUpdate: (payload: any) => void) {
  useEffect(() => {
    if (!caseId) return;

    const token = localStorage.getItem('access_token');
    
    // Determine WS protocol based on current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend host or default to localhost:8000
    const host = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).host 
      : 'localhost:8000';
      
    const wsUrl = `${protocol}//${host}/api/v1/ws/graph/${caseId}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'GRAPH_UPDATED') {
          onUpdate(message.payload);
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WebSocket] Connection error — falling back to polling', err);
    };

    ws.onclose = () => {
      console.info('[WebSocket] Connection closed');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [caseId, onUpdate]);
}
