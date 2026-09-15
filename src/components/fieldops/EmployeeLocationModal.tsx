import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, MapPin, Radio, Clock, UserCheck, ExternalLink, Copy, Check, Navigation } from 'lucide-react';
import { Employee } from '../../types';

// Custom animated Radar Pin for Employee Location
const createEmployeeLocationIcon = (isLive: boolean, isCheckedIn: boolean) => {
 const color = isLive ? '#f59e0b' : isCheckedIn ? '#059669' : '#0d9488';
 return L.divIcon({
  className: 'custom-emp-location-icon',
  html: `
   <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
    <div style="position: absolute; width: 44px; height: 44px; background-color: ${color}; border-radius: 50%; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position: absolute; width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; opacity: 0.2;"></div>
    <div style="width: 24px; height: 24px; background-color: ${color}; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px;">
     📍
    </div>
   </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
 });
};

export interface EmployeeLocationData {
 employee: Employee;
 lat: number;
 lng: number;
 locationName: string;
 isLive: boolean;
 isCheckedIn: boolean;
 lastTime: string;
}

interface EmployeeLocationModalProps {
 data: EmployeeLocationData;
 onClose: () => void;
}

export const EmployeeLocationModal: React.FC<EmployeeLocationModalProps> = ({
 data,
 onClose
}) => {
 const [copied, setCopied] = React.useState(false);

 // Close on Escape key
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, [onClose]);

 const copyCoordinates = () => {
  navigator.clipboard.writeText(`${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
 };

 const openGoogleMaps = () => {
  const url = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
 };

 const icon = createEmployeeLocationIcon(data.isLive, data.isCheckedIn);

 return (
  <div
   className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
   onClick={onClose}
  >
   <div
    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
    onClick={e => e.stopPropagation()}
   >
    {/* Header */}
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
     <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-teal-600/20">
       {data.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div>
       <div className="flex items-center gap-2">
        <h3 className="text-slate-800 font-black text-base">{data.employee.name}</h3>
        {data.isLive ? (
         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
          <Radio className="w-2.5 h-2.5 animate-pulse text-amber-600"/> Live GPS
         </span>
        ) : data.isCheckedIn ? (
         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
          <UserCheck className="w-2.5 h-2.5 text-emerald-600"/> On Duty Check-In
         </span>
        ) : (
         <span className="px-2.5 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full">
          Last Known Location
         </span>
        )}
       </div>
       <p className="text-xs text-slate-400 font-medium">
        {data.employee.designation || 'Field Officer'} • ID: <span className="font-mono text-slate-600">{data.employee.id}</span> • Branch: <span className="capitalize text-slate-600">{data.employee.branch || 'Visakhapatnam'}</span>
       </p>
      </div>
     </div>

     <button
      type="button"
      onClick={onClose}
      className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
     >
      <X className="w-5 h-5"/>
     </button>
    </div>

    {/* Map View */}
    <div className="relative w-full h-[400px] bg-slate-100">
     <MapContainer
      center={[data.lat, data.lng]}
      zoom={15}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
     >
      <TileLayer
       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[data.lat, data.lng]} icon={icon}>
       <Popup>
        <div className="p-1 font-sans text-xs">
         <p className="font-bold text-slate-800">{data.employee.name}</p>
         <p className="text-slate-500 mt-0.5">{data.locationName}</p>
         <p className="text-teal-700 font-mono text-[10px] mt-1 font-semibold">
          {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
         </p>
        </div>
       </Popup>
      </Marker>
     </MapContainer>

     {/* Quick Floating Coordinates Chip */}
     <div className="absolute top-3 right-3 z-[1000] bg-white/95 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2 text-xs font-mono text-slate-700">
      <Navigation className="w-3.5 h-3.5 text-teal-600"/>
      <span>{data.lat.toFixed(4)}, {data.lng.toFixed(4)}</span>
      <button
       type="button"
       onClick={copyCoordinates}
       className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
       title="Copy GPS coordinates"
      >
       {copied ? <Check className="w-3.5 h-3.5 text-emerald-600"/> : <Copy className="w-3.5 h-3.5"/>}
      </button>
     </div>
    </div>

    {/* Location Info & Quick Actions Footer */}
    <div className="p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
     <div className="space-y-1">
      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
       <MapPin className="w-4 h-4 text-teal-600 shrink-0"/>
       <span>{data.locationName}</span>
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1.5">
       <Clock className="w-3.5 h-3.5 text-slate-400"/>
       <span>Status timestamp: <strong>{data.lastTime}</strong></span>
       {data.employee.phone && <span>• Phone: <strong className="text-slate-600">{data.employee.phone}</strong></span>}
      </p>
     </div>

     <div className="flex items-center gap-2 w-full sm:w-auto">
      <button
       type="button"
       onClick={openGoogleMaps}
       className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-600/20 cursor-pointer"
      >
       <ExternalLink className="w-4 h-4"/> Open Google Maps
      </button>
      <button
       type="button"
       onClick={onClose}
       className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
      >
       Close
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};
