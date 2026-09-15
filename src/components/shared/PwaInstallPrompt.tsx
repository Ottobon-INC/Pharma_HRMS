import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
 prompt: () => Promise<void>;
 userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
 const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
 const [showPrompt, setShowPrompt] = useState(false);
 const [isIOS, setIsIOS] = useState(false);
 const [isStandalone, setIsStandalone] = useState(false);
 const [showIosGuide, setShowIosGuide] = useState(false);

 useEffect(() => {
  // Check if already installed / running in standalone mode
  const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches ||
   (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  setIsStandalone(isRunningStandalone);

  if (isRunningStandalone) return;

  // Check if iOS
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  setIsIOS(isIosDevice);

  // Listen for beforeinstallprompt (Android / Chrome / Edge)
  const handleBeforeInstall = (e: Event) => {
   e.preventDefault();
   setDeferredPrompt(e as BeforeInstallPromptEvent);
   // Don't show immediately on first millisecond, wait 3 seconds to avoid disrupting initial login
   const timer = setTimeout(() => {
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (!dismissed) {
     setShowPrompt(true);
    }
   }, 3000);
   return () => clearTimeout(timer);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstall);

  // For iOS, if not dismissed and not standalone, show reminder after a delay
  if (isIosDevice && !isRunningStandalone) {
   const iosDismissed = sessionStorage.getItem('pwa_ios_guide_dismissed');
   if (!iosDismissed) {
    const timer = setTimeout(() => {
     setShowIosGuide(true);
    }, 4000);
    return () => clearTimeout(timer);
   }
  }

  return () => {
   window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  };
 }, []);

 const handleInstallClick = async () => {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
   console.log('User accepted the PWA install prompt');
  }
  setDeferredPrompt(null);
  setShowPrompt(false);
 };

 const handleDismiss = () => {
  setShowPrompt(false);
  sessionStorage.setItem('pwa_prompt_dismissed', 'true');
 };

 const handleDismissIos = () => {
  setShowIosGuide(false);
  sessionStorage.setItem('pwa_ios_guide_dismissed', 'true');
 };

 if (isStandalone) return null;

 return (
  <>
   {/* Android / Chromium / Desktop Install Banner */}
   {showPrompt && deferredPrompt && (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
     <div className="bg-slate-900/95 border border-teal-600/40 rounded-2xl p-4 shadow-md shadow-teal-950/50 flex items-center justify-between gap-4 text-white">
      <div className="flex items-center gap-3">
       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md">
        <Smartphone className="w-6 h-6 text-white"/>
       </div>
       <div>
        <h4 className="font-semibold text-sm text-slate-100">Install Orca Labs Pharma HRMS</h4>
        <p className="text-xs text-slate-400">Install on your device for fast, full-screen mobile access</p>
       </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
       <button
        onClick={handleInstallClick}
        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
       >
        <Download className="w-3.5 h-3.5"/>
        Install
       </button>
       <button
        onClick={handleDismiss}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        title="Dismiss"
       >
        <X className="w-4 h-4"/>
       </button>
      </div>
     </div>
    </div>
   )}

   {/* iOS Safari Add-to-Homescreen Guide */}
   {showIosGuide && isIOS && !showPrompt && (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
     <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-md text-white">
      <div className="flex items-start justify-between gap-3">
       <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
         <Smartphone className="w-5 h-5 text-white"/>
        </div>
        <div>
         <h4 className="font-semibold text-sm text-slate-100">Install Orca Labs Pharma HRMS on iOS</h4>
         <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
          Tap <Share className="w-3.5 h-3.5 text-teal-400 inline"/> in Safari, then select <PlusSquare className="w-3.5 h-3.5 text-teal-400 inline"/> <span className="font-medium text-slate-200">"Add to Home Screen"</span>
         </p>
        </div>
       </div>
       <button
        onClick={handleDismissIos}
        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
       >
        <X className="w-4 h-4"/>
       </button>
      </div>
     </div>
    </div>
   )}
  </>
 );
};
