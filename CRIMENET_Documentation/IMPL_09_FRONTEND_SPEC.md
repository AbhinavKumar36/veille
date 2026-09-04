# 09 FRONTEND SPECIFICATION

**Status:** IMPLEMENTATION READY — Phase 5, Week 5
**Component:** Interface Engine — React Application
**Phase:** 5 (Frontend Enhancement)

This specification defines the complete frontend implementation contract for VEILLE v4.0. The UI/UX design is already polished; this spec addresses **real API integration**, **error resilience**, **real-time updates**, and **TypeScript migration**.

---

## 1. Current State

| Area | Current | Problem |
|---|---|---|
| API calls | Hardcoded fallback data in components | UI works even when backend is down — makes debugging impossible |
| Error handling | None — blank screens on failure | Investigator has no feedback when something breaks |
| Real-time updates | Manual page refresh required | Uploading FIR doesn't update graph without refresh |
| TypeScript | Pure JavaScript (`.jsx`) | No type safety; runtime errors hard to catch |
| Loading states | None / immediate render | Poor UX on slow connections |

---

## 2. Error Boundary Architecture

### 2.1 Global Error Boundary

Wrap every top-level route component in an `ErrorBoundary`:

```jsx
// src/components/ErrorBoundary.jsx

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to observability system
    console.error('[VEILLE ERROR BOUNDARY]', error, info);
    // TODO: Send to OpenTelemetry error stream
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usage — wrap every route in `App.jsx`:**
```jsx
<ErrorBoundary>
  <NetworkExplorer />
</ErrorBoundary>
```

---

## 3. API Integration Layer

### 3.1 Centralized API Client

Replace all ad-hoc `fetch()` calls with a single, centralized API client:

```js
// src/api/client.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Handle 401 — try refresh, then redirect to login
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      window.location.href = '/login';
      return;
    }
    return request(path, options); // retry with new token
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new APIError(response.status, errorBody.detail || 'Unknown error');
  }

  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
```

### 3.2 Token Refresh on App Load

```jsx
// src/main.jsx — before rendering App

async function initApp() {
  try {
    // Attempt to refresh the access token from httpOnly cookie
    const { access_token } = await api.post('/auth/refresh', {});
    localStorage.setItem('access_token', access_token);
  } catch {
    // No valid refresh token — user must log in
    localStorage.removeItem('access_token');
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}

initApp();
```

This **fixes the page-refresh logout bug**.

---

## 4. Loading States & Skeleton Screens

Every component that fetches data must implement three states: **loading**, **success**, **error**.

### Pattern (apply to all data-fetching components):

```jsx
// Example: NetworkExplorer.jsx

function NetworkExplorer({ caseId }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/graph/${caseId}`)
      .then(setGraphData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) return <GraphSkeleton />;  // Animated skeleton
  if (error)   return <GraphError message={error} onRetry={() => setLoading(true)} />;
  return <ForceGraph data={graphData} />;
}
```

### Skeleton Component:

```jsx
// src/components/skeletons/GraphSkeleton.jsx
// Render 5–8 animated placeholder circles to mimic a graph
```

---

## 5. Real-Time Graph Updates via WebSocket

### 5.1 Architecture

After Phase 3 (Outbox Pattern), the backend publishes a WebSocket event whenever a graph update is committed. The frontend listens and re-fetches the graph data.

```
Postgres Outbox → Celery Beat → Neo4j → FastAPI WebSocket → React Frontend
```

### 5.2 WebSocket Hook

```jsx
// src/hooks/useGraphWebSocket.js

export function useGraphWebSocket(caseId, onUpdate) {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(
      `ws://localhost:8000/ws/graph/${caseId}?token=${token}`
    );

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'GRAPH_UPDATED') {
        onUpdate(message.payload); // Trigger graph re-fetch or incremental update
      }
    };

    ws.onerror = () => console.warn('[WebSocket] Connection error — falling back to polling');
    ws.onclose = () => console.info('[WebSocket] Connection closed');

    return () => ws.close();
  }, [caseId, onUpdate]);
}
```

### 5.3 FastAPI WebSocket Endpoint (Backend Contract)

```python
# backend/api/routers/graph.py

@router.websocket("/ws/graph/{case_id}")
async def graph_ws(websocket: WebSocket, case_id: str, token: str):
    user = verify_token(token)  # Validate JWT from query param
    await websocket.accept()
    
    # Subscribe to Redis pub/sub channel for this case
    async for message in redis_pubsub.subscribe(f"graph_updates:{case_id}"):
        await websocket.send_json({
            "type": "GRAPH_UPDATED",
            "payload": message
        })
```

---

## 6. Explicit Error States (All Components)

Every component must handle these error cases explicitly:

| Error | Display |
|---|---|
| API 404 (case not found) | "Case not found. It may have been archived." |
| API 500 (server error) | "Server error. Please try again or contact support." |
| Network offline | "Unable to connect. Check your network connection." |
| API 403 (forbidden) | "You don't have permission to view this case." |
| Empty state (no data yet) | "No data yet. Upload evidence to get started." |

**Never show a blank screen.** Every error state must offer a **retry button**.

---

## 7. TypeScript Migration Plan

Migration is done **incrementally** — component by component, starting with `src/components/`.

### Phase 5A (MVP scope — `src/components/`)
Convert these files first (highest-risk, most shared):

| File | Priority |
|---|---|
| `Login.jsx` → `Login.tsx` | High (auth flow) |
| `Layout.jsx` → `Layout.tsx` | High (shared) |
| `ErrorBoundary.jsx` → `ErrorBoundary.tsx` | High (new) |
| `ReviewQueue.jsx` → `ReviewQueue.tsx` | Medium |
| `AuditLogs.jsx` → `AuditLogs.tsx` | Medium |

### Shared Types (`src/types/index.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  role: 'INVESTIGATOR' | 'SUPERVISOR' | 'AUDITOR' | 'ADMIN';
}

export interface Case {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  primary_investigator_id: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: 'Person' | 'Phone' | 'Account' | 'Vehicle' | 'Organization' | 'Location' | 'Event';
  name: string;
  case_id: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
  type: 'ASSOCIATED_WITH' | 'OWNS' | 'COMMUNICATES_WITH' | 'LOCATED_AT' | 'PARTICIPATED_IN';
  confidence: number;
  source_evidence_id: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### `tsconfig.json` additions:

```json
{
  "compilerOptions": {
    "strict": true,
    "allowJs": true,        // Allow gradual migration — JS files still work
    "checkJs": false,       // Don't type-check .jsx files until migrated
    "jsx": "react-jsx"
  }
}
```

---

## 8. Component Completion Matrix

| Component | Current State | Phase 5 Target |
|---|---|---|
| `Login.jsx` | ✅ UI done | Fix: call real auth API; fix refresh token |
| `Layout.jsx` | ✅ UI done | No change needed |
| `NetworkExplorer` / `CustomNode.jsx` | ⚠️ Hardcoded data | → Real `/api/graph/{case_id}` + WebSocket |
| `Ingestion.jsx` | ⚠️ Simulated only | → Real file upload to `/api/evidence/upload` |
| `ReviewQueue.jsx` | ⚠️ Hardcoded items | → Real `/api/review-queue` + POST merge |
| `AuditLogs.jsx` | ⚠️ Hardcoded logs | → Real `/api/audit-logs` with pagination |
| All components | ❌ No error states | → Add loading skeleton + error state |

---

## 9. Frontend Checklist (Definition of Done)

- [ ] `ErrorBoundary` wraps every top-level route; crashed component shows error UI, not blank
- [ ] Page refresh does NOT log the user out
- [ ] Network Explorer shows real Neo4j data (verify by checking network tab in DevTools)
- [ ] Uploading a FIR updates the Network Explorer graph live (no manual refresh needed)
- [ ] All components show loading skeleton during API fetch
- [ ] All components show an error message with retry button on API failure
- [ ] `src/components/` directory builds with zero TypeScript errors (`npx tsc --noEmit`)
