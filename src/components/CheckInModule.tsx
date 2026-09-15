import React, { useState, useEffect, useRef } from 'react';
import { Clock, ListCollapse, LogIn, LogOut, Camera, X, MapPin, Plus, AlertCircle, Building2, Stethoscope, Coffee, Play, Pause } from 'lucide-react';
import { Language, CheckInLog, PunchType, LocationPin, PinType } from '../types';
import { translations } from '../translations';
import LocationPinTimeline from './LocationPinTimeline';
import { getActiveBreak, startBreak, endBreak, getTodayBreaks, calculateCompletedBreakSeconds, BreakRecord } from '../lib/services/break-service';

interface CheckInModuleProps {
 language: Language;
 employeeId: string;
 isCheckedIn: boolean;
 onToggleCheckIn: (photoData?: string, punchType?: PunchType, punchNote?: string) => Promise<{success: boolean, geoError?: any, error?: string} | void>;
 logs: CheckInLog[];
 todayWorkedSeconds: number;
 pins: LocationPin[];
 onAddPin: (pinType: PinType, label?: string, photoData?: string) => Promise<{ success: boolean; error?: string }>;
}

export default function CheckInModule({
 language,
 employeeId,
 isCheckedIn,
 onToggleCheckIn,
 logs,
 todayWorkedSeconds,
 pins,
 onAddPin
}: CheckInModuleProps) {
 const t = translations[language];
 const [runningSeconds, setRunningSeconds] = useState(0);
 const [isCameraOpen, setIsCameraOpen] = useState(false);
 const [isProcessing, setIsProcessing] = useState(false);
 const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
 // Break tracking states
 const [isOnBreak, setIsOnBreak] = useState(false);
 const [activeBreak, setActiveBreak] = useState<BreakRecord | null>(null);
 const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0);
 const [todayBreaks, setTodayBreaks] = useState<BreakRecord[]>([]);
 const [isBreakLoading, setIsBreakLoading] = useState(false);
 
 // Pin states
 const [isPinModalOpen, setIsPinModalOpen] = useState(false);
 const [pinType, setPinType] = useState<PinType>('field_visit');
 const [pinLabel, setPinLabel] = useState('');
 const [isPinCameraOpen, setIsPinCameraOpen] = useState(false);
 const [isPinning, setIsPinning] = useState(false);

 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const streamRef = useRef<MediaStream | null>(null);

 // BUG FIX: Attach stream via useEffect so video element is guaranteed to be mounted
 useEffect(() => {
  if ((isCameraOpen || isPinCameraOpen) && streamRef.current && videoRef.current) {
   videoRef.current.srcObject = streamRef.current;
  }
 }, [isCameraOpen, isPinCameraOpen]);

 const startCamera = async (isForPin: boolean = false) => {
  try {
   if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API not available. Access the app over HTTPS.");
   }
   let stream: MediaStream;
   try {
    // BUG FIX: Use `ideal` constraint so it works on all Android cameras without NotFoundError
    stream = await navigator.mediaDevices.getUserMedia({ 
     video: { facingMode: { ideal: 'user' } }, 
     audio: false 
    });
   } catch (firstErr: any) {
    if (firstErr.name === 'NotAllowedError') {
     throw firstErr; // Permission denied — can't retry
    }
    // For NotFoundError, OverconstrainedError — retry without constraints
    console.warn("Camera with constraints failed, retrying without:", firstErr);
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   }
   streamRef.current = stream;
   // BUG FIX: Open modal AFTER stream is ready so useEffect attaches srcObject immediately
   if (isForPin) {
    setIsPinCameraOpen(true);
   } else {
    setIsCameraOpen(true);
   }
  } catch (err: any) {
   console.warn("Camera not available:", err.name, err.message);
   const isNoCamera = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';
   const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
   if (isPermissionDenied) {
    alert(language === 'te' ? 'కెమెరా అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్స్‌లో కెమెరా అనుమతి ఇవ్వండి.' : 'Camera permission denied. Please tap the lock icon in the address bar and allow Camera, then reload.');
   } else if (!isNoCamera) {
    alert(language === 'te' ? 'కెమెరా అందుబాటులో లేదు. ఫోటో లేకుండా హాజరు నమోదు చేయబడుతుంది.' : `Camera error: ${err.message}. Proceeding without photo.`);
   }
   // For NotFoundError: silently proceed without photo
   if (isForPin) {
    handlePinSubmit(undefined);
   } else {
    if (isCheckedIn && isOnBreak) {
     await endBreak(employeeId);
     setIsOnBreak(false);
     setActiveBreak(null);
    }
    const result = await onToggleCheckIn(undefined);
    if (result && !result.success && result.error) {
     alert(result.error);
    }
   }
  }
 };

 const stopCamera = () => {
  if (streamRef.current) {
   streamRef.current.getTracks().forEach(track => track.stop());
   streamRef.current = null;
  }
  setIsCameraOpen(false);
  setIsPinCameraOpen(false);
 };

 const handleCaptureAndCheckIn = async () => {
  if (videoRef.current && canvasRef.current) {
   const video = videoRef.current;
   const canvas = canvasRef.current;
   canvas.width = video.videoWidth;
   canvas.height = video.videoHeight;
   const ctx = canvas.getContext('2d');
   if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();

    setIsProcessing(true);
    if (isCheckedIn && isOnBreak) {
     await endBreak(employeeId);
     setIsOnBreak(false);
     setActiveBreak(null);
    }
    const result = await onToggleCheckIn(photoData);
    setIsProcessing(false);

    if (result && !result.success && result.error) {
     alert(result.error);
    }
   }
  }
 };

 const handlePinSubmit = async (photoData?: string) => {
  setIsPinning(true);
  const result = await onAddPin(pinType, pinLabel, photoData);
  setIsPinning(false);
  
  if (result.success) {
   setIsPinModalOpen(false);
   setPinLabel('');
  } else {
   alert(result.error || 'Failed to pin location');
  }
 };

 const handleCaptureAndPin = async () => {
  if (videoRef.current && canvasRef.current) {
   const video = videoRef.current;
   const canvas = canvasRef.current;
   canvas.width = video.videoWidth;
   canvas.height = video.videoHeight;
   const ctx = canvas.getContext('2d');
   if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    await handlePinSubmit(photoData);
   }
  }
 };

 // Fetch initial active break and today breaks
 useEffect(() => {
  let isMounted = true;
  if (employeeId) {
   getActiveBreak(employeeId).then(active => {
    if (isMounted) {
     if (active) {
      setIsOnBreak(true);
      setActiveBreak(active);
     } else {
      setIsOnBreak(false);
      setActiveBreak(null);
     }
    }
   });

   getTodayBreaks(employeeId).then(breaks => {
    if (isMounted) {
     setTodayBreaks(breaks);
    }
   });
  }
  return () => {
   isMounted = false;
  };
 }, [employeeId, isCheckedIn]);

 // Live break timer: tick elapsed break seconds every second while isOnBreak is true
 useEffect(() => {
  let interval: any;
  if (isOnBreak && activeBreak && activeBreak.start_time) {
   const calcBreakElapsed = () => {
    const now = new Date();
    const [h, m, s] = activeBreak.start_time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, s || 0, 0);
    let diffMs = now.getTime() - startDate.getTime();
    if (diffMs < 0) diffMs = 0;
    return Math.floor(diffMs / 1000);
   };

   setBreakElapsedSeconds(calcBreakElapsed());
   interval = setInterval(() => {
    setBreakElapsedSeconds(calcBreakElapsed());
   }, 1000);
  } else {
   setBreakElapsedSeconds(0);
  }
  return () => clearInterval(interval);
 }, [isOnBreak, activeBreak]);

 // Start break handler
 const handleTakeBreak = async () => {
  if (isBreakLoading || !isCheckedIn) return;
  setIsBreakLoading(true);
  try {
   const record = await startBreak(employeeId);
   setActiveBreak(record);
   setIsOnBreak(true);
   const updated = await getTodayBreaks(employeeId);
   setTodayBreaks(updated);
  } catch (err) {
   console.error('Error starting break:', err);
   alert('Failed to pause for break. Please try again.');
  } finally {
   setIsBreakLoading(false);
  }
 };

 // Resume duty handler
 const handleResumeDuty = async () => {
  if (isBreakLoading) return;
  setIsBreakLoading(true);
  try {
   await endBreak(employeeId);
   setIsOnBreak(false);
   setActiveBreak(null);
   const updated = await getTodayBreaks(employeeId);
   setTodayBreaks(updated);
  } catch (err) {
   console.error('Error resuming from break:', err);
   alert('Failed to resume duty. Please try again.');
  } finally {
   setIsBreakLoading(false);
  }
 };

 // Main button click — direct camera punch-in or confirmation punch-out
 const handleMainButtonClick = () => {
  if (isCheckedIn) {
   if (isOnBreak) {
    alert(
     language === 'te'
      ? 'మీరు ప్రస్తుతం విరామంలో ఉన్నారు. దయచేసి పంచ్ అవుట్ చేయడానికి ముందు పనిని పునఃప్రారంభించండి (Resume Duty).'
      : 'You are currently on a break. Please click"Resume Duty"before punching out.'
    );
    return;
   }
   // Punch-out: show confirmation prompt first
   setShowEndShiftConfirm(true);
  } else {
   // Punch-in: open camera directly to capture selfie + location
   startCamera();
  }
 };

 // Live timer
 useEffect(() => {
  let timer: any;
  if (isCheckedIn) {
   const today = new Date().toISOString().split('T')[0];
   const todayLogs = logs.filter(l => l.date === today);
   const activeLog = todayLogs.find(l => l.checkOutTime === null);

   if (activeLog) {
    const calculateElapsed = () => {
     const now = new Date();
     const [h, m, s] = activeLog.checkInTime.split(':').map(Number);
     const checkInDate = new Date();
     checkInDate.setHours(h, m, s, 0);
     let diffMs = now.getTime() - checkInDate.getTime();
     if (diffMs < 0) diffMs = 0;
     return Math.floor(diffMs / 1000);
    };
    setRunningSeconds(calculateElapsed());
    timer = setInterval(() => {
     setRunningSeconds(calculateElapsed());
    }, 1000);
   }
  } else {
   setRunningSeconds(0);
  }
  return () => clearInterval(timer);
 }, [isCheckedIn, logs]);

 const formatTime = (totalSecs: number) => {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 const completedTodaySeconds = logs
  .filter(l => l.date === new Date().toISOString().split('T')[0] && l.checkOutTime !== null)
  .reduce((acc, log) => {
   if (log.checkInTime && log.checkOutTime) {
    const [h1, m1, s1] = log.checkInTime.split(':').map(Number);
    const [h2, m2, s2] = log.checkOutTime.split(':').map(Number);
    const sec1 = h1 * 3600 + m1 * 60 + s1;
    const sec2 = h2 * 3600 + m2 * 60 + s2;
    return acc + (sec2 - sec1);
   }
   return acc;
  }, 0);

 const totalCompletedBreakSeconds = calculateCompletedBreakSeconds(todayBreaks);
 const currentBreakSeconds = isOnBreak ? breakElapsedSeconds : 0;
 const totalBreakSecondsToday = totalCompletedBreakSeconds + currentBreakSeconds;

 const totalSecondsToday = completedTodaySeconds + (isCheckedIn ? runningSeconds : 0);
 const effectiveWorkSeconds = Math.max(0, totalSecondsToday - totalBreakSecondsToday);

 const todayStr = new Date().toISOString().split('T')[0];
 const todayLogs = logs.filter(l => l.date === todayStr);

 const punchTypeBadge = (punchType?: PunchType) => {
  if (!punchType || punchType === 'in_office') {
   return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[9px] font-bold border border-teal-100">
     <Building2 className="w-2.5 h-2.5"/>
     {t.punchTypeInOffice}
    </span>
   );
  }
  return (
   <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[9px] font-bold border border-orange-100">
    <Stethoscope className="w-2.5 h-2.5"/>
    {t.punchTypeOutOfOffice}
   </span>
  );
 };

 return (
  <div id="check-in-module-container"className="space-y-6">
   {/* Upper Status Panel */}
   <div id="status-panel"className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
    <div id="status-text-block"className="space-y-2 text-center md:text-left">
     <span className={`text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-full inline-block ${
      isOnBreak ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'
     }`}>
      {isOnBreak ? (language === 'te' ? 'విరామం స్థితి' : 'Break Status') : t.currentStatusLabel}
     </span>
     <div className="flex items-center justify-center md:justify-start gap-2.5 mt-2">
      <span className={`inline-block w-3 h-3 rounded-full ${
       isOnBreak ? 'bg-amber-500 animate-ping' : isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
      }`} />
      <h2 className="text-2xl font-black text-slate-800">
       {isOnBreak
        ? (language === 'te' ? 'విరామంలో ఉన్నారు' : 'On Break')
        : isCheckedIn ? t.checkedIn : t.checkedOut}
      </h2>
     </div>
     <p className="text-xs text-slate-400">
      {isOnBreak
       ? (language === 'te'
         ? 'మీరు విరామంలో ఉన్నారు. పని ప్రారంభించడానికి"Resume Duty"నొక్కండి.'
         : 'You are on break. Click"Resume Duty"when you return.')
       : isCheckedIn
       ? (language === 'te' ? 'మీరు ఈరోజు పని ప్రారంభించారు. సమయం రికార్డ్ అవుతోంది.' : 'You have initiated your duty. Live clock is active.')
       : (language === 'te' ? 'పని ప్రారంభించడానికి క్రింది బటన్ నొక్కండి.' : 'Verify punch-in to initiate logging.')
      }
     </p>
    </div>

    {/* Live Timer Visual */}
    <div id="live-timer-badge"className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
     <div className={`p-3 rounded-xl ${isOnBreak ? 'bg-amber-100 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
      <Clock className={`w-6 h-6 ${isCheckedIn && !isOnBreak ? 'animate-pulse' : ''}`} />
     </div>
     <div>
      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
       {isOnBreak ? (language === 'te' ? 'పని సమయం (పాజ్ చేయబడింది)' : 'Work Timer (Paused)') : t.workTimerLabel}
      </span>
      <span className="text-3xl font-black font-mono text-slate-800 tracking-tight block">
       {formatTime(effectiveWorkSeconds)}
      </span>
      {isCheckedIn && (
       isOnBreak ? (
        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest block mt-0.5">
         ⏸ Paused (On Break)
        </span>
       ) : (
        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest animate-pulse block mt-0.5">
         ● {t.runningLive}
        </span>
       )
      )}
     </div>
    </div>
   </div>

   {/* Main Punch Button Widget */}
   <div id="button-card"className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-8">
    <div className="max-w-md">
     <h3 className="text-xl font-bold text-slate-800">
      {isOnBreak
       ? (language === 'te' ? 'విరామంలో ఉన్నారు' : 'Currently On A Break')
       : isCheckedIn
       ? (language === 'te' ?"ఈరోజు పని ముగిస్తారా?":"Done for the day?")
       : (language === 'te' ?"హాజరు వేసుకుంటారా?":"Log Your Entry?")
      }
     </h3>
     <p className="text-xs text-slate-400 mt-2 leading-relaxed">
      {isOnBreak
       ? (language === 'te' ? 'విరామం ముగిసిన తర్వాత పనిని ప్రారంభించడానికి Resume నొక్కండి.' : 'Resume duty when you are ready to restart your shift.')
       : isCheckedIn
       ? (language === 'te' ?"పని పూర్తయిన తర్వాత పంచ్ అవుట్ క్లిక్ చేయండి.":"Click below to complete your current shift and log total hours.")
       : (language === 'te' ?"మీ డ్యూటీ టైమ్ కౌంట్ ప్రారంభించడానికి పంచ్ ఇన్ క్లిక్ చేయండి.":"This records your entry time precisely on the cloud server.")
      }
     </p>
    </div>

    {/* Big Punch Button */}
    <button
     id="punch-toggle-btn"
     onClick={handleMainButtonClick}
     disabled={isProcessing || isOnBreak}
     className={`group flex flex-col items-center justify-center w-48 h-48 md:w-52 md:h-52 rounded-full border-[12px] shadow-md transition-all duration-300 active:scale-95 disabled:opacity-60 ${
      isOnBreak
       ? 'border-amber-100 bg-amber-500 shadow-amber-200 text-white cursor-not-allowed opacity-75'
       : isCheckedIn
       ? 'border-rose-50 bg-rose-500 hover:bg-rose-600 shadow-rose-200 text-white cursor-pointer'
       : 'border-teal-50 bg-teal-600 hover:bg-teal-700 shadow-teal-100 text-white cursor-pointer'
     }`}
    >
     {isProcessing ? (
      <span className="text-xs font-bold animate-pulse">Processing...</span>
     ) : isOnBreak ? (
      <>
       <Coffee className="w-10 h-10 mb-2 animate-bounce"/>
       <span className="font-black text-xs uppercase tracking-wider px-3 text-center leading-tight">
        {language === 'te' ? 'విరామంలో ఉన్నారు' : 'On Break'}
       </span>
       <span className="text-[10px] opacity-90 font-mono mt-1">{formatTime(breakElapsedSeconds)}</span>
      </>
     ) : isCheckedIn ? (
      <>
       <LogOut className="w-10 h-10 mb-2 group-hover:-translate-y-0.5 transition-transform"/>
       <span className="font-black text-xs uppercase tracking-wider px-3 text-center leading-tight">
        {t.btnCheckOut}
       </span>
       <span className="text-[10px] opacity-80 mt-1">వెళ్ళిపోండి</span>
      </>
     ) : (
      <>
       <LogIn className="w-10 h-10 mb-2 group-hover:translate-y-0.5 transition-transform"/>
       <span className="font-black text-xs uppercase tracking-wider px-3 text-center leading-tight">
        {t.btnCheckIn}
       </span>
       <span className="text-[10px] opacity-80 mt-1">లోపలికి రండి</span>
      </>
     )}
    </button>

    <p className="text-xs text-slate-400 font-mono">
     Logged using your local timezone: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </p>
    
    {/* Break & Pin Controls */}
    {isCheckedIn && (
     <div className="w-full max-w-md space-y-3">
      {isOnBreak ? (
       /* Active Break Banner & Resume Button */
       <div id="active-break-card"className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
           <Coffee className="w-5 h-5 animate-pulse"/>
          </div>
          <div className="text-left">
           <h4 className="text-sm font-black text-amber-900 leading-tight">
            {language === 'te' ? 'విరామంలో ఉన్నారు' : 'Currently On Break'}
           </h4>
           <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"/>
            {language === 'te' ? 'విరామం నడుస్తోంది' : '☕ Paused on Break'}
           </span>
          </div>
         </div>
         
         <div className="text-right">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">
           Break Time
          </span>
          <span className="font-mono text-lg font-black text-amber-950">
           {formatTime(breakElapsedSeconds)}
          </span>
         </div>
        </div>

        <div className="pt-2">
         <button
          id="resume-duty-btn"
          onClick={handleResumeDuty}
          disabled={isBreakLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
         >
          <Play className="w-5 h-5 fill-current"/>
          <span className="text-sm uppercase tracking-wider">
           {isBreakLoading ? 'Resuming...' : (language === 'te' ? 'పనిని పునఃప్రారంభించండి' : 'Resume Duty')}
          </span>
         </button>
        </div>
       </div>
      ) : (
       /* Take Break & Pin Location Buttons */
       <div className="flex flex-wrap items-center justify-center gap-3">
        <button
         id="take-break-btn"
         onClick={handleTakeBreak}
         disabled={isBreakLoading}
         className="flex-1 min-w-[170px] flex items-center justify-center gap-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3 px-5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
         <Coffee className="w-5 h-5 text-amber-600"/>
         <span>{isBreakLoading ? 'Pausing...' : (language === 'te' ? 'విరామం తీసుకోండి' : 'Take a Break')}</span>
        </button>

        <button
         onClick={() => setIsPinModalOpen(true)}
         className="flex-1 min-w-[170px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-2xl transition-all active:scale-95 cursor-pointer"
        >
         <MapPin className="w-5 h-5 text-rose-500"/>
         <span>{language === 'te' ? 'లొకేషన్ పిన్ చేయండి' : 'Pin Location Now'}</span>
        </button>
       </div>
      )}

      {totalCompletedBreakSeconds > 0 && (
       <p className="text-[11px] text-slate-400 font-medium text-center">
        ☕ Total completed break time today: <span className="font-bold text-slate-600">{formatTime(totalCompletedBreakSeconds)}</span>
       </p>
      )}
     </div>
    )}
   </div>

   {/* Daily Timeline Logs */}
   <div id="logs-timeline"className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
    <div className="flex items-center gap-2 mb-6">
     <ListCollapse className="w-4 h-4 text-teal-600"/>
     <h3 className="text-sm font-bold text-slate-800">
      {t.logTitle}
     </h3>
    </div>

    {todayLogs.length === 0 ? (
     <div className="py-8 text-center text-slate-400 text-xs">
      {t.noData}
     </div>
    ) : (
     <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
       <thead>
        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
         <th className="py-3 px-4">{t.logHeaderTime}</th>
         <th className="py-3 px-4">{t.logInTime}</th>
         <th className="py-3 px-4">{t.logOutTime}</th>
         <th className="py-3 px-4">Type</th>
         <th className="py-3 px-4 text-right">{t.logDuration}</th>
        </tr>
       </thead>
       <tbody>
        {todayLogs.map((log, idx) => {
         let durationStr = t.runningLive;
         if (log.checkOutTime && log.checkInTime) {
          const [h1, m1, s1] = log.checkInTime.split(':').map(Number);
          const [h2, m2, s2] = log.checkOutTime.split(':').map(Number);
          const elapsed = (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1);
          const h = Math.floor(elapsed / 3600);
          const m = Math.floor((elapsed % 3600) / 60);
          const s = elapsed % 60;
          durationStr = `${h}h ${m}m ${s}s`;
         }

         return (
          <tr key={log.id} className="border-b border-slate-50 last:border-b-0 text-slate-700 hover:bg-slate-50/50 transition-colors">
           <td className="py-3 px-4 font-bold text-slate-400">
            Session #{idx + 1}
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center gap-2">
             <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
              <LogIn className="w-3 h-3 text-emerald-500"/>
              {log.checkInTime}
             </span>
             {log.photoUrl && (
              <a href={log.photoUrl} target="_blank"rel="noreferrer">
               <img src={log.photoUrl} className="w-6 h-6 object-cover rounded shadow-sm border border-slate-200 hover:scale-110 transition-transform"title="Punch-in Photo"/>
              </a>
             )}
            </div>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center gap-2">
             {log.checkOutTime ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">
               <LogOut className="w-3 h-3 text-amber-500"/>
               {log.checkOutTime}
              </span>
             ) : (
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold bg-teal-100 text-[#6a2baf] px-2.5 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
               {t.runningLive}
              </span>
             )}
             {log.checkOutPhotoUrl && (
              <a href={log.checkOutPhotoUrl} target="_blank"rel="noreferrer">
               <img src={log.checkOutPhotoUrl} className="w-6 h-6 object-cover rounded shadow-sm border border-slate-200 hover:scale-110 transition-transform"title="Punch-out Photo"/>
              </a>
             )}
            </div>
           </td>
           <td className="py-3 px-4">
            {punchTypeBadge(log.punchType)}
           </td>
           <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
            {durationStr}
           </td>
          </tr>
         );
        })}
       </tbody>
      </table>
     </div>
    )}
   </div>

   {/* Location Pin Timeline */}
   <LocationPinTimeline language={language} pins={pins} />

   {/* Camera Modal */}
   {isCameraOpen && (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-md">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
       <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Camera className="w-5 h-5 text-teal-600"/>
        {language === 'te' ?"ఫోటో తీయండి": `Photo ${isCheckedIn ?"Punch-Out":"Punch-In"}`}
       </h3>
       <button onClick={stopCamera} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
        <X className="w-5 h-5 text-slate-500"/>
       </button>
      </div>

      <div className="relative bg-black aspect-video flex items-center justify-center">
       <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
       />
       <canvas ref={canvasRef} className="hidden"/>
       <div className="absolute inset-0 border-4 border-teal-600/30 m-4 rounded-xl pointer-events-none"></div>
      </div>

      <div className="p-6 flex flex-col items-center">
       <p className="text-xs text-slate-500 mb-4 text-center">
        {language === 'te' ?"హాజరు నమోదు చేయడానికి దయచేసి మీ ఫోటో తీయండి.":"Please capture your photo to record attendance."}
       </p>
       <button
        onClick={handleCaptureAndCheckIn}
        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-teal-500/25 transition-all flex items-center gap-2 w-full justify-center active:scale-95"
       >
        <Camera className="w-5 h-5"/>
        {language === 'te'
         ? (isCheckedIn ?"ఫోటో తీసి పంచ్ అవుట్ చేయండి":"ఫోటో తీసి పంచ్ ఇన్ చేయండి")
         : (isCheckedIn ?"Capture & Punch Out":"Capture & Punch In")
        }
       </button>
      </div>
     </div>
    </div>
   )}

   {/* End Shift Confirmation Modal */}
   {showEndShiftConfirm && (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
     <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-md p-6 text-center">
      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
       <Clock className="w-8 h-8"/>
      </div>
      <h3 className="font-bold text-slate-800 text-lg mb-2">
       {language === 'te' ? 'పని ముగించాలనుకుంటున్నారా?' : 'End Shift Confirmation'}
      </h3>
      <p className="text-xs text-slate-500 mb-6">
       {language === 'te' 
        ? `మీరు ఈరోజు పని చేసిన సమయం: ${formatTime(totalSecondsToday)}. దయచేసి నిర్ధారించండి.` 
        : `You have logged ${formatTime(totalSecondsToday)} today. Are you sure you want to punch out?`}
      </p>
      <div className="flex gap-3">
       <button
        onClick={() => setShowEndShiftConfirm(false)}
        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors uppercase tracking-wider text-xs"
       >
        {language === 'te' ? 'కొనసాగించు' : 'Keep Working'}
       </button>
       <button
        onClick={() => {
         setShowEndShiftConfirm(false);
         startCamera();
        }}
        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors uppercase tracking-wider text-xs"
       >
        {language === 'te' ? 'నిర్ధారించు' : 'Confirm End Shift'}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Pin Location Modal */}
   {isPinModalOpen && (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-md">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
       <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
        <MapPin className="w-4 h-4 text-rose-500"/>
        {language === 'te' ? 'లొకేషన్ పిన్ చేయండి' : 'Pin Current Location'}
       </h3>
       <button onClick={() => setIsPinModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
        <X className="w-5 h-5 text-slate-500"/>
       </button>
      </div>
      <div className="p-6 space-y-4">
       <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
         {language === 'te' ? 'పిన్ రకం' : 'Pin Type'}
        </label>
        <select 
         value={pinType}
         onChange={(e) => setPinType(e.target.value as PinType)}
         className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
         <option value="field_visit">Field Visit / ఫీల్డ్ విజిట్</option>
         <option value="medical_camp">Medical Camp / మెడికల్ క్యాంప్</option>
         <option value="client_site">Client Site / క్లయింట్ సైట్</option>
         <option value="delivery">Delivery / డెలివరీ</option>
         <option value="other">Other / ఇతర</option>
        </select>
       </div>
       
       <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
         {language === 'te' ? 'వివరాలు (ఐచ్ఛికం)' : 'Label (Optional)'}
        </label>
        <input
         type="text"
         value={pinLabel}
         onChange={(e) => setPinLabel(e.target.value)}
         placeholder={language === 'te' ? 'ఉదా: గాజువాక క్యాంప్' : 'e.g. Gajuwaka Medical Camp'}
         className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
       </div>

       <div className="pt-2 flex flex-col gap-3">
        <button
         onClick={() => startCamera(true)}
         disabled={isPinning}
         className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
         <Camera className="w-4 h-4"/>
         {isPinning ? 'Processing...' : (language === 'te' ? 'ఫోటోతో పిన్ చేయండి' : 'Capture Photo & Pin')}
        </button>
        <button
         onClick={() => handlePinSubmit(undefined)}
         disabled={isPinning}
         className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
         {language === 'te' ? 'ఫోటో లేకుండా పిన్ చేయండి' : 'Skip Photo & Pin'}
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* Pin Camera Modal */}
   {isPinCameraOpen && (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-md">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
       <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Camera className="w-5 h-5 text-teal-600"/>
        {language === 'te' ?"పిన్ ఫోటో":"Pin Photo"}
       </h3>
       <button onClick={stopCamera} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
        <X className="w-5 h-5 text-slate-500"/>
       </button>
      </div>

      <div className="relative bg-black aspect-video flex items-center justify-center">
       <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
       />
       <canvas ref={canvasRef} className="hidden"/>
       <div className="absolute inset-0 border-4 border-teal-600/30 m-4 rounded-xl pointer-events-none"></div>
      </div>

      <div className="p-6 flex flex-col items-center">
       <button
        onClick={handleCaptureAndPin}
        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-sm transition-all flex items-center gap-2 w-full justify-center active:scale-95"
       >
        <Camera className="w-5 h-5"/>
        {language === 'te' ?"ఫోటో తీయండి":"Capture & Pin"}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* End Shift Confirmation Modal */}
   {showEndShiftConfirm && (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
     <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-md text-center space-y-4 animate-scaleUp">
      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
       <LogOut className="w-8 h-8"/>
      </div>
      <h3 className="text-xl font-bold text-slate-800">
       {language === 'te' ? 'పని ముగించాలనుకుంటున్నారా?' : 'End your shift?'}
      </h3>
      <p className="text-sm text-slate-500">
       {language === 'te' 
        ? 'మీరు ఇప్పుడు పంచ్ అవుట్ చేస్తే ఈ సెషన్ రికార్డ్ అవుతుంది. నిర్ధారించండి.' 
        : 'Are you sure you want to end your shift? This will clock you out for the current session.'}
      </p>
      <div className="flex gap-3 pt-4">
       <button
        onClick={() => setShowEndShiftConfirm(false)}
        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider"
       >
        {language === 'te' ? 'రద్దు' : 'Cancel'}
       </button>
       <button
        onClick={() => {
         setShowEndShiftConfirm(false);
         startCamera();
        }}
        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors text-xs uppercase tracking-wider shadow-md"
       >
        {language === 'te' ? 'ముగించు' : 'Check Out'}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
