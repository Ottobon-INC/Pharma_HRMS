import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
 const [isOnline, setIsOnline] = useState(navigator.onLine);
 const [showRestored, setShowRestored] = useState(false);

 useEffect(() => {
  const handleOnline = () => {
   setIsOnline(true);
   setShowRestored(true);
   const timer = setTimeout(() => {
    setShowRestored(false);
   }, 3000);
   return () => clearTimeout(timer);
  };

  const handleOffline = () => {
   setIsOnline(false);
   setShowRestored(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
   window.removeEventListener('online', handleOnline);
   window.removeEventListener('offline', handleOffline);
  };
 }, []);

 if (isOnline && !showRestored) return null;

 return (
  <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none">
   {!isOnline ? (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/90 text-slate-950 font-medium text-xs shadow-sm shadow-amber-950/20 border border-amber-400/50">
     <WifiOff className="w-4 h-4 animate-pulse"/>
     <span>You are offline. Showing cached data.</span>
    </div>
   ) : (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/90 text-white font-medium text-xs shadow-sm shadow-emerald-950/20 border border-emerald-400/50">
     <Wifi className="w-4 h-4"/>
     <span>Connection restored</span>
    </div>
   )}
  </div>
 );
};
