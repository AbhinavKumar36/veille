import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { tryRefreshToken } from './api/client';
import Layout from './Layout';
import Dashboard from './Dashboard';
import NetworkExplorer from './components/NetworkExplorer';
import ReviewQueue from './components/ReviewQueue';
import GeospatialExplorer from './components/GeospatialExplorer';
import EvidenceLibrary from './components/EvidenceLibrary';
import Login from './components/Login';
import SystemHealth from './components/SystemHealth';
import AIAssistant from './components/AIAssistant';
import AuditLogs from './components/AuditLogs';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import CommunicationsIntercept from './components/CommunicationsIntercept';
import ExportReport from './components/ExportReport';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const localAuth = localStorage.getItem('veille_auth') === 'true';
      
      let isValidToken = false;
      if (token && localAuth) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            isValidToken = true;
          }
        } catch {}
      }

      if (isValidToken) {
        setIsAuthenticated(true);
      } else if (localAuth) {
        // Silent refresh attempt if token is missing or expired, but we think we are logged in
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('veille_auth');
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('veille_auth');
      }
      setAuthChecked(true);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('veille_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('veille_auth');
    setIsAuthenticated(false);
  };

  // Full-screen spinner while validating token — prevents dashboard flash
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
          <span className="font-label-caps tracking-widest text-on-surface-variant">INITIALIZING VEILLE...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="network-explorer" element={<ErrorBoundary><NetworkExplorer /></ErrorBoundary>} />
          <Route path="review-queue" element={<ErrorBoundary><ReviewQueue /></ErrorBoundary>} />
          <Route path="evidence-library" element={<ErrorBoundary><EvidenceLibrary /></ErrorBoundary>} />
          <Route path="geospatial-explorer" element={<ErrorBoundary><GeospatialExplorer /></ErrorBoundary>} />
          <Route path="system-health" element={<ErrorBoundary><SystemHealth /></ErrorBoundary>} />
          <Route path="ai-assistant" element={<ErrorBoundary><AIAssistant /></ErrorBoundary>} />
          <Route path="audit-logs" element={<ErrorBoundary><AuditLogs /></ErrorBoundary>} />
          <Route path="executive-dashboard" element={<ErrorBoundary><ExecutiveDashboard /></ErrorBoundary>} />
          <Route path="communications-intercept" element={<ErrorBoundary><CommunicationsIntercept /></ErrorBoundary>} />
          <Route path="export-report" element={<ErrorBoundary><ExportReport /></ErrorBoundary>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
