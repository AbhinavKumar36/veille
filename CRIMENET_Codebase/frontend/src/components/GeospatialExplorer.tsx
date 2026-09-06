import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';

export interface GeoLocation {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: string;
  timestamp: string;
  details: string;
}

export const GeospatialExplorer: React.FC = () => {
  const [cases, setCases] = useState<Array<{ id: string; title: string; case_number: string }>>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [selectedPin, setSelectedPin] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Cases
  useEffect(() => {
    api.get('/cases')
      .then((data: any) => {
        const caseList = Array.isArray(data) ? data : (data?.cases || []);
        setCases(caseList);
        if (caseList.length > 0) {
          setSelectedCaseId(caseList[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.0760, 72.8777], // Default India / Mumbai
        zoom: 6,
        zoomControl: true,
      });

      // Tactical Dark Map Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup if container is unmounted
    };
  }, []);

  // 3. Fetch Locations for selected case
  useEffect(() => {
    setLoading(true);
    const endpoint = selectedCaseId ? `/geospatial?case_id=${selectedCaseId}` : '/geospatial';
    api.get(endpoint)
      .then((data: any) => {
        const items = Array.isArray(data) ? data : [];
        setLocations(items);
        if (items.length > 0) {
          setSelectedPin(items[0]);
        } else {
          setSelectedPin(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load locations:', err);
        setLocations([]);
        setSelectedPin(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCaseId]);

  // 4. Update Leaflet Map Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (locations.length === 0) {
      return;
    }

    const latLngs: L.LatLngExpression[] = [];

    locations.forEach((loc) => {
      if (loc.lat && loc.lng) {
        latLngs.push([loc.lat, loc.lng]);

        // Custom HTML Marker Icon
        const isSelected = selectedPin?.id === loc.id;
        const iconHtml = `
          <div style="
            background-color: ${isSelected ? '#00e5ff' : '#00ff80'};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #000;
            box-shadow: 0 0 12px ${isSelected ? '#00e5ff' : '#00ff80'};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 4px; height: 4px; border-radius: 50%; background: #000;"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-geo-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(layer);

        // Triangulation / Geofence Circle
        L.circle([loc.lat, loc.lng], {
          radius: 1200,
          color: isSelected ? '#00e5ff' : '#00ff80',
          weight: 1,
          fillOpacity: 0.1,
          dashArray: '4, 4',
        }).addTo(layer);

        marker.on('click', () => {
          setSelectedPin(loc);
        });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; color: #000;">
            <strong>${loc.label}</strong><br/>
            <span>Type: ${loc.type.toUpperCase()}</span><br/>
            <span>Coords: ${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°</span>
          </div>
        `);
      }
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [locations, selectedPin]);

  const handleExportKML = () => {
    if (locations.length === 0) {
      triggerToast('No geospatial coordinate points to export.');
      return;
    }
    const placemarks = locations.map(l => `
    <Placemark>
      <name>${l.label}</name>
      <description>${l.details}</description>
      <Point><coordinates>${l.lng},${l.lat},0</coordinates></Point>
    </Placemark>`).join('');

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>VEILLE_GEOSPATIAL_EXPORT.kml</name>
    ${placemarks}
  </Document>
</kml>`;
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEILLE_GEOSPATIAL_${Date.now()}.kml`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('KML Track Exported successfully.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-surface text-on-surface antialiased select-none overflow-hidden -m-4 lg:-m-8 min-w-0 border-t border-outline-variant font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Top Header Controls */}
      <section className="border-b border-outline-variant bg-surface-container-lowest px-4 py-2 flex flex-wrap items-center justify-between gap-y-2 z-20 shrink-0 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-primary font-bold uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">explore</span>
            GEOSPATIAL INTELLIGENCE &amp; CELL TRIANGULATION
          </span>
          <span className="text-outline">|</span>
          <span className="text-outline">CASE:</span>
          {cases.length > 0 ? (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-primary px-2 py-0.5 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-outline italic">NO ACTIVE CASES</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-secondary font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>MAP ENGINE: LIVE (OSM / CARTO DARK)</span>
          </div>
          <button
            onClick={handleExportKML}
            className="border border-outline-variant px-2.5 py-1 text-on-surface hover:border-primary bg-surface-container-low flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">file_download</span>
            <span>EXPORT KML</span>
          </button>
        </div>
      </section>

      {/* Main Dual Theater */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {/* Interactive Leaflet Map (65%) */}
        <div className="w-full lg:w-[65%] border-r border-outline-variant flex flex-col relative overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Overlay when 0 points exist */}
          {!loading && locations.length === 0 && (
            <div className="absolute top-4 left-4 z-20 bg-surface-container/90 border border-outline-variant p-3 max-w-sm rounded font-mono text-xs shadow-lg backdrop-blur-xs">
              <div className="flex items-center gap-2 text-secondary font-bold mb-1">
                <span className="material-symbols-outlined text-sm">my_location</span>
                <span>NO TARGET COORDINATES FOUND</span>
              </div>
              <p className="text-[11px] text-outline leading-relaxed">
                This case has no geo-tagged locations or cell tower pings in Neo4j. Ingest CDR telephony logs or FIR reports with coordinates to plot spatial paths.
              </p>
            </div>
          )}
        </div>

        {/* Right Telemetry Details Drawer (35%) */}
        <div className="w-full lg:w-[35%] flex flex-col bg-surface-container-lowest overflow-y-auto p-4 font-mono text-xs">
          {selectedPin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <div>
                  <div className="text-primary font-bold text-sm">{selectedPin.label}</div>
                  <div className="text-outline text-[11px]">{selectedPin.type.toUpperCase()}</div>
                </div>
                <span className="px-2 py-0.5 border border-secondary text-secondary text-[10px] font-bold">
                  GEO-LOCATED
                </span>
              </div>

              <div className="p-3 bg-surface-container-low border border-outline-variant space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">LATITUDE:</span>
                  <span className="text-on-surface font-bold">{selectedPin.lat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">LONGITUDE:</span>
                  <span className="text-on-surface font-bold">{selectedPin.lng}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">LAST TELEMETRY FIX:</span>
                  <span className="text-secondary font-bold">{selectedPin.timestamp || 'REAL-TIME'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-outline">LOCATION SURVEILLANCE DETAILS</div>
                <div className="p-3 bg-surface-container-low border border-outline-variant text-[11px] leading-relaxed text-on-surface-variant">
                  {selectedPin.details || 'No intelligence notes attached to this location node.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-2">map</span>
              <div>Select a target pin on the interactive map to inspect coordinate details.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeospatialExplorer;
