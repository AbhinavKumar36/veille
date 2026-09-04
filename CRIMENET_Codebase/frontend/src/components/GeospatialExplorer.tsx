import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';

// Custom Glowing Tactical Pin Marker Factory
const createTacticalIcon = (type, label) => {
  const colors = {
    sighting: { bg: '#ef4444', border: '#b91c1c', icon: 'visibility' },
    event: { bg: '#f59e0b', border: '#d97706', icon: 'warning' },
    location: { bg: '#00e5ff', border: '#0891b2', icon: 'shield' },
    intercept: { bg: '#10b981', border: '#059669', icon: 'cell_tower' },
    default: { bg: '#a855f7', border: '#7e22ce', icon: 'place' },
  };

  const style = colors[type?.toLowerCase()] || colors.default;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${style.bg};
        border: 2px solid ${style.border};
        box-shadow: 0 0 14px ${style.bg};
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <span class="material-symbols-outlined" style="font-size: 18px; color: #ffffff; line-height: 1; user-select: none;">${style.icon}</span>
        <div style="
          position: absolute;
          bottom: -22px;
          white-space: nowrap;
          background: rgba(15, 23, 42, 0.9);
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const DEFAULT_LOCATIONS = [
  { id: '1', lat: 19.1136, lng: 72.8697, label: 'Rajesh Kumar Sighting (Andheri East)', type: 'sighting', timestamp: '2026-09-01 14:32:00', details: 'Target seen entering commercial basement in Black Fortuner.' },
  { id: '2', lat: 19.0760, lng: 72.8777, label: 'Shadow Ring Meeting Point (Bandra)', type: 'event', timestamp: '2026-08-28 21:00:00', details: 'Intercepted encrypted transmission pin.' },
  { id: '3', lat: 19.0330, lng: 73.0297, label: 'Port Terminal 4 Smuggling Drop', type: 'location', timestamp: '2026-08-15 03:15:00', details: 'Container #IN-9022 flagged for unauthorized offloading.' },
  { id: '4', lat: 18.9220, lng: 72.8347, label: 'Hawala Financial Hub (Colaba)', type: 'intercept', timestamp: '2026-08-22 11:20:00', details: 'High-frequency transactions tied to Swiss account #9876.' },
];

const GeospatialExplorer = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const polylineRef = useRef(null);

  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Fetch locations from backend API
  useEffect(() => {
    api.get('/geospatial')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data);
        }
      })
      .catch((err) => {
        console.warn("Using fallback geospatial data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Initialize Direct Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.0760, 72.8777],
        zoom: 11,
        zoomControl: true,
      });

      // ESRI Dark Gray Canvas - No API key required, no watermarks
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }).addTo(map);

      // Detailed labels overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 16,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Use ResizeObserver to invalidateSize whenever container resizes
      const ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(mapContainerRef.current);

      // Also invalidate after a short delay for initial flex layout
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Polyline when filtered locations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const filtered = filterType === 'ALL'
      ? locations
      : locations.filter(l => l.type?.toLowerCase() === filterType.toLowerCase());

    if (filtered.length === 0) return;

    const latLngs = [];

    filtered.forEach((loc) => {
      const latLng = [loc.lat, loc.lng];
      latLngs.push(latLng);

      const marker = L.marker(latLng, {
        icon: createTacticalIcon(loc.type, loc.label),
      });

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(148,163,184,0.3); padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #00e5ff; text-transform: uppercase;">${loc.type || 'LOCATION'}</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #94a3b8;">${loc.timestamp || 'RECENT'}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: bold; color: #f8fafc; margin: 0 0 4px 0;">${loc.label}</h4>
          ${loc.details ? `<p style="font-size: 11px; color: #cbd5e1; line-height: 1.4; margin: 0 0 6px 0;">${loc.details}</p>` : ''}
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #00daf3;">
            GPS: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'tactical-popup',
      });

      layerGroup.addLayer(marker);
    });

    // Draw tactical connection polyline
    if (latLngs.length > 1) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#00e5ff',
        weight: 2.5,
        dashArray: '6, 8',
        opacity: 0.8,
      }).addTo(map);
    }

    // Auto fit bounds
    try {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    } catch (e) {
      // Ignore bounds error if single point
    }
  }, [locations, filterType]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container/80 p-4 rounded-lg border border-outline-variant/60 backdrop-blur-md shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]">map</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Geospatial Intelligence</h2>
          </div>
          <p className="text-on-surface-variant font-body-sm mt-1">Tactical GIS tracking, sighting heatmaps & intercept telemetry</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
            {['ALL', 'SIGHTING', 'EVENT', 'LOCATION', 'INTERCEPT'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-label-caps rounded transition-colors cursor-pointer ${
                  filterType === t
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 w-full rounded-lg border border-outline-variant overflow-hidden relative shadow-2xl bg-[#111318]" style={{ minHeight: '500px', height: '100%' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', minHeight: '500px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Tactical Telemetry Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-2 rounded text-xs font-data-code text-on-surface-variant flex items-center gap-3 pointer-events-none shadow-xl">
          <span className="flex items-center gap-1.5 text-status-success">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span> GPS ACTIVE
          </span>
          <span className="text-outline-variant">|</span>
          <span>PLOTTED: {filterType === 'ALL' ? locations.length : locations.filter(l => l.type?.toLowerCase() === filterType.toLowerCase()).length} NODES</span>
        </div>
      </div>
    </div>
  );
};

export default GeospatialExplorer;
