import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fieldOpsConfig } from '../../lib/fieldOpsConfig';
import { fetchRoute, OsrmRoute } from '../../lib/osrm';
import { Navigation, MapPin, Building2, UserCheck, Loader2 } from 'lucide-react';

// Custom Map Bounds Auto-Fitter
function BoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
 const map = useMap();
 useEffect(() => {
  if (bounds) {
   map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
  }
 }, [bounds, map]);
 return null;
}

// Origin Marker Icon (HQ or Staff Check-in location)
const createOriginIcon = (isCheckIn: boolean, label: string) => {
 return L.divIcon({
  className: 'custom-origin-icon',
  html: `
   <div style="position: relative; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 34px; height: 34px; background-color: ${isCheckIn ? '#10b981' : '#0284c7'}; border-radius: 50%; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="width: 28px; height: 28px; background-color: ${isCheckIn ? '#059669' : '#0369a1'}; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; font-size: 11px;">
     ${isCheckIn ? '👤' : '🏢'}
    </div>
   </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
 });
};

// Destination Waypoint Icon (GTA V Style GPS Marker)
const createDestinationIcon = () => {
 return L.divIcon({
  className: 'custom-dest-icon',
  html: `
   <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0d9488, #0f766e); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(13,148,136,0.5); display: flex; align-items: center; justify-content: center;">
     <div style="transform: rotate(45deg); color: #ffffff; font-size: 12px;">📍</div>
    </div>
   </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
 });
};

interface ModalPreviewMapProps {
 originLat: number;
 originLng: number;
 originLabel: string;
 isOriginCheckIn: boolean;
 destLat: number;
 destLng: number;
 destLabel: string;
}

export const ModalPreviewMap: React.FC<ModalPreviewMapProps> = ({
 originLat,
 originLng,
 originLabel,
 isOriginCheckIn,
 destLat,
 destLng,
 destLabel
}) => {
 const [route, setRoute] = useState<OsrmRoute | null>(null);
 const [loadingRoute, setLoadingRoute] = useState(false);

 useEffect(() => {
  let isCancelled = false;

  async function loadRoute() {
   if (!originLat || !originLng || !destLat || !destLng) return;
   setLoadingRoute(true);
   try {
    const fetched = await fetchRoute(originLat, originLng, destLat, destLng);
    if (!isCancelled) {
     setRoute(fetched);
    }
   } catch (err) {
    console.error('Failed to preview route:', err);
   } finally {
    if (!isCancelled) setLoadingRoute(false);
   }
  }

  loadRoute();

  return () => {
   isCancelled = true;
  };
 }, [originLat, originLng, destLat, destLng]);

 const bounds: L.LatLngBoundsExpression = [
  [originLat, originLng],
  [destLat, destLng]
 ];

 return (
  <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex flex-col">
   <MapContainer
    center={[destLat, destLng]}
    zoom={13}
    scrollWheelZoom={false}
    className="w-full h-full"
    style={{ height: '100%', minHeight: '300px', width: '100%' }}
   >
    <TileLayer
     attribution={fieldOpsConfig.tileAttribution}
     url={fieldOpsConfig.tileUrl}
     subdomains={fieldOpsConfig.tileSubdomains}
    />

    <BoundsFitter bounds={bounds} />

    {/* Origin Marker */}
    <Marker
     position={[originLat, originLng]}
     icon={createOriginIcon(isOriginCheckIn, originLabel)}
    >
     <Popup>
      <div className="text-xs p-1">
       <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">
        {isOriginCheckIn ? 'Agent Start Location' : 'Office Headquarters'}
       </span>
       <strong className="text-slate-800 text-xs">{originLabel}</strong>
      </div>
     </Popup>
    </Marker>

    {/* Destination Marker */}
    <Marker
     position={[destLat, destLng]}
     icon={createDestinationIcon()}
    >
     <Popup>
      <div className="text-xs p-1">
       <span className="font-bold text-[9px] uppercase tracking-wider text-teal-600 block">
        Target Destination
       </span>
       <strong className="text-slate-800 text-xs">{destLabel}</strong>
      </div>
     </Popup>
    </Marker>

    {/* GTA-V Style Glowing Multi-Layer Polyline */}
    {route && route.polylineCoords && route.polylineCoords.length > 0 && (
     <>
      {/* Outer Glow / Casing */}
      <Polyline
       positions={route.polylineCoords}
       pathOptions={{
        color: '#0f172a',
        weight: 7,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
       }}
      />
      {/* Inner Vibrant Road Line */}
      <Polyline
       positions={route.polylineCoords}
       pathOptions={{
        color: '#0ea5e9', // Bright Sky Blue (GTA V Minimap style)
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
       }}
      />
     </>
    )}
   </MapContainer>

   {/* Floating Info Overlay (Distance, Duration & Origin Badge) */}
   <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5 z-[1000] pointer-events-none">
    {/* Origin Indicator */}
    <div className="self-start bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
     {isOriginCheckIn ? (
      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0"/>
     ) : (
      <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0"/>
     )}
     <span className="truncate max-w-[200px]">From: {originLabel}</span>
    </div>

    {/* Route Stats Badge */}
    {loadingRoute ? (
     <div className="self-start bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400"/>
      <span>Calculating road path...</span>
     </div>
    ) : route ? (
     <div className="self-start bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm border border-slate-700/50">
      <span className="flex items-center gap-1 text-teal-400">
       <Navigation className="w-3.5 h-3.5"/>
       {(route.distanceMeters / 1000).toFixed(1)} km
      </span>
      <span className="text-slate-400">|</span>
      <span className="text-amber-300">
       ~{Math.ceil(route.durationSeconds / 60)} mins
      </span>
     </div>
    ) : null}
   </div>
  </div>
 );
};
