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

  // 2. Initialize Leaflet Map with robust unmount cleanup (Issue 14 fix)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [19.0760, 72.8777], // Default Mumbai
          zoom: 11,
          zoomControl: true,
        });

        // Tactical Dark Map Tile Layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }).addTo(map);

        // Tactical Reference Label Layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 16,
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;
      }
    } catch (e) {
      console.error('Leaflet map initialization error:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Fetch Locations for selected case
  useEffect(() => {
    setLoading(true);
    if (!selectedCaseId) {
      setLocations([]);
      setSelectedPin(null);
      setLoading(false);
      return;
    }

    const endpoint = `/geospatial?case_id=${selectedCaseId}`;
    api.get(endpoint)
      .then((data: any) => {
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          setLocations(items);
          setSelectedPin(items[0]);
        } else {
          setLocations([]);
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

  // 4. Update Leaflet Map Markers (without resetting bounds on every pin click)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    try {
      layer.clearLayers();

      if (locations.length === 0) return;

      const latLngs: L.LatLngExpression[] = [];

      locations.forEach((loc) => {
        if (loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng)) {
          latLngs.push([loc.lat, loc.lng]);

          const isSelected = selectedPin?.id === loc.id;
          const color = isSelected ? '#00e5ff' : '#00ff80';

          const iconHtml = `
            <div style="
              background-color: ${color};
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #000;
              box-shadow: 0 0 14px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: #000;"></div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-geo-marker',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(layer);

          // Geofence Circle
          L.circle([loc.lat, loc.lng], {
            radius: 1000,
            color: color,
            weight: 1.5,
            fillOpacity: isSelected ? 0.2 : 0.08,
            dashArray: '4, 4',
          }).addTo(layer);

          marker.on('click', () => {
            setSelectedPin(loc);
          });

          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #000; padding: 2px;">
              <strong>${loc.label}</strong><br/>
              <span style="color: #444;">Type: ${loc.type}</span><br/>
              <span>Coords: ${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°</span>
            </div>
          `);
        }
      });

      // Fit bounds only when locations change, not on pin clicks
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    } catch (e) {
      console.error('Error rendering markers on map:', e);
    }
  }, [locations]);

  // Pan to Pin when selected
  const handleSelectPin = (loc: GeoLocation) => {
    setSelectedPin(loc);
    const map = mapInstanceRef.current;
    if (map && loc.lat && loc.lng) {
      try {
        map.panTo([loc.lat, loc.lng], { animate: true, duration: 0.8 });
      } catch {}
    }
  };

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
    a.download = `VEILLE_GEOSPATIAL_${selectedCaseId || 'DEFAULT'}.kml`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Geospatial KML export completed.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-4 lg:-m-8 bg-surface text-on-surface antialiased select-none overflow-hidden font-sans border-t border-outline-variant">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 text-xs font-mono text-primary flex items-center justify-between animate-fade-in z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Top Banner & Case Selector */}
      <header className="flex flex-wrap justify-between items-center px-4 py-2 border-b border-outline-variant bg-surface-container-lowest z-40 shrink-0 gap-3 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined text-primary text-[20px]">explore</span>
            <span>VEILLE // GEOSPATIAL &amp; CELL TOWER RADAR</span>
          </div>
          <div className="h-4 w-px bg-outline-variant hidden sm:block" />

          {/* Case Dropdown */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-outline">CASE:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-primary px-2.5 py-1 font-mono text-xs focus:outline-none rounded"
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
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-outline">POINTS: <strong className="text-primary">{locations.length}</strong></span>
          <button
            onClick={handleExportKML}
            className="px-3 py-1 bg-surface-container border border-outline-variant hover:border-primary text-primary font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">download</span>
            <span>EXPORT KML</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Map Theater (65%) + Location Pin Dossier (35%) */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-surface">
        {/* Leaflet Map Canvas */}
        <div className="w-full lg:w-[65%] border-r border-outline-variant flex flex-col bg-[#080d1a] relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center text-outline font-mono text-xs">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">progress_activity</span>
              <span>LOADING GEOSPATIAL TELEMETRY...</span>
            </div>
          )}
          <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" />
        </div>

        {/* Location List & Selected Pin Inspector */}
        <div className="w-full lg:w-[35%] flex flex-col bg-surface-container-lowest overflow-y-auto p-4 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <span className="text-outline font-bold text-[10px] uppercase">TRACKED GEOLOCATIONS ({locations.length})</span>
            <span className="text-secondary font-bold text-[10px]">RADAR ACTIVE</span>
          </div>

          {/* Selected Pin Details */}
          {selectedPin && (
            <div className="p-4 bg-surface-container border border-primary/40 rounded space-y-3 shadow-md animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="text-primary font-bold text-sm">{selectedPin.label}</div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/40 text-[9px] font-bold rounded uppercase">
                  {selectedPin.type}
                </span>
              </div>

              <div className="p-2.5 bg-surface-container-lowest border border-outline-variant rounded space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">GPS COORDINATES:</span>
                  <span className="text-on-surface font-bold">{selectedPin.lat.toFixed(4)}° N, {selectedPin.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">TIMESTAMP FIX:</span>
                  <span className="text-secondary">{selectedPin.timestamp}</span>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {selectedPin.details}
              </p>
            </div>
          )}

          {/* Location Pins List */}
          <div className="space-y-2">
            {locations.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center space-y-1.5">
                <span className="material-symbols-outlined text-2xl text-outline">location_off</span>
                <div className="text-xs font-bold text-on-surface uppercase">NO GEOLOCATIONS RECORDED</div>
                <p className="text-[10px] text-outline">
                  No cell tower triangulation or sighting coordinates found for this case.
                </p>
              </div>
            ) : (
              locations.map((loc) => {
                const isSelected = selectedPin?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => handleSelectPin(loc)}
                    className={`p-3 bg-surface-container-low border rounded cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-surface-container text-white shadow-sm' : 'border-outline-variant hover:border-outline text-on-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{loc.label}</span>
                      <span className="text-[9px] text-outline">{loc.timestamp.slice(11, 16)}</span>
                    </div>
                    <div className="text-[10px] text-outline mt-1 truncate">{loc.details}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeospatialExplorer;
