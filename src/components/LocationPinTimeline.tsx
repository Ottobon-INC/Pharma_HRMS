import React, { useState } from 'react';
import { LocationPin, Language } from '../types';
import { MapPin, Image as ImageIcon, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
// @ts-ignore
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
 language: Language;
 pins: LocationPin[];
}

export default function LocationPinTimeline({ language, pins }: Props) {
 const [showMap, setShowMap] = useState(false);
 
 if (pins.length === 0) {
  return null;
 }

 const mapCenter = pins.length > 0 && pins[0].latitude && pins[0].longitude
  ? [pins[0].latitude, pins[0].longitude] as [number, number]
  : [17.6868, 83.2185] as [number, number]; // Default Visakhapatnam

 const polylinePositions = pins
  .filter(p => p.latitude && p.longitude)
  .map(p => [p.latitude, p.longitude] as [number, number]);

 return (
  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-4">
   <div className="flex items-center justify-between mb-4">
    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
     <MapPin className="w-4 h-4 text-rose-500"/>
     {language === 'te' ? 'లొకేషన్ పిన్స్' : 'Location Pins'}
    </h4>
    <button 
     onClick={() => setShowMap(!showMap)}
     className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
    >
     {showMap ? <X className="w-3.5 h-3.5"/> : <MapIcon className="w-3.5 h-3.5"/>}
     {showMap ? (language === 'te' ? 'మ్యాప్ మూసివేయి' : 'Close Map') : (language === 'te' ? 'మ్యాప్ చూడండి' : 'View Map Trail')}
    </button>
   </div>

   {showMap && (
    <div className="h-64 rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-inner z-0 relative">
     <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
       pin.latitude && pin.longitude ? (
        <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
         <Popup>
          <div className="text-xs">
           <strong>{pin.pinnedAt}</strong><br/>
           {pin.label || pin.pinType}
          </div>
         </Popup>
        </Marker>
       ) : null
      ))}
      {polylinePositions.length > 1 && (
       <Polyline positions={polylinePositions} color="teal"weight={3} dashArray="5, 10"/>
      )}
     </MapContainer>
    </div>
   )}

   <div className="space-y-3">
    {pins.map((pin, idx) => (
     <div key={pin.id} className="flex items-start gap-3 relative">
      {idx < pins.length - 1 && (
       <div className="absolute left-[11px] top-6 bottom-[-12px] w-0.5 bg-slate-200"></div>
      )}
      
      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border-2 border-white shadow-sm z-10">
       <MapPin className="w-3 h-3"/>
      </div>
      
      <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
       <div>
        <div className="flex items-center gap-2 mb-1">
         <span className="text-xs font-mono font-bold text-slate-800">{pin.pinnedAt}</span>
         <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold uppercase tracking-wider">
          {pin.pinType.replace('_', ' ')}
         </span>
        </div>
        <p className="text-sm text-slate-700 font-medium">
         {pin.label || (language === 'te' ? 'పేరు లేదు' : 'No label')}
        </p>
        {pin.locationName && (
         <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{pin.locationName}</p>
        )}
       </div>
       
       {pin.photoUrl && (
        <a href={pin.photoUrl} target="_blank"rel="noreferrer"className="shrink-0 group">
         <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 group-hover:border-teal-400 transition-colors">
          <img src={pin.photoUrl} alt="Pin Photo"className="w-full h-full object-cover"/>
         </div>
        </a>
       )}
      </div>
     </div>
    ))}
   </div>
  </div>
 );
}
