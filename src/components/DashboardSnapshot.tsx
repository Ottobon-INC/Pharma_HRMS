import React, { useState, useRef, useEffect } from"react";
import { Camera, X, MapPin, AlertCircle, Coffee, Play } from"lucide-react";
import { Language, CheckInLog, AttendanceRecord, LeaveBalance, Employee } from"../types";
import { translations } from"../translations";
import LocationPinTimeline from"./LocationPinTimeline";
import TickerAlert from"./TickerAlert";
import { getActiveBreak, startBreak, endBreak } from"../lib/services/break-service";

interface DashboardSnapshotProps {
 language: Language;
 currentUser: Employee;
 isCheckedIn: boolean;
 logs: CheckInLog[];
 attendanceRecords: AttendanceRecord[];
 leaveBalance: LeaveBalance;
 setActiveTab: (tab: string) => void;
 onToggleCheckIn: (photoData?: string, punchType?: import("../types").PunchType, punchNote?: string) => Promise<{success: boolean, geoError?: any, error?: string} | void>;
 pins: import("../types").LocationPin[];
 onAddPin: (pinType: import("../types").PinType, label?: string, photoData?: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DashboardSnapshot({ language, currentUser, isCheckedIn, logs, attendanceRecords, leaveBalance, setActiveTab, onToggleCheckIn, pins, onAddPin }: DashboardSnapshotProps) {
 const t = translations[language];

 const [isCameraOpen, setIsCameraOpen] = useState(false);
 const [isPinCameraOpen, setIsPinCameraOpen] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const [isProcessing, setIsProcessing] = useState(false);
 const [punchType, setPunchType] = useState<import("../types").PunchType>("in_office");
 const [punchNote, setPunchNote] = useState("");
 const [isPinModalOpen, setIsPinModalOpen] = useState(false);
 const [pinType, setPinType] = useState<import("../types").PinType>("field_visit");
 const [pinLabel, setPinLabel] = useState("");
 const [isPinning, setIsPinning] = useState(false);
 const [isOnBreak, setIsOnBreak] = useState(false);
 const [isBreakLoading, setIsBreakLoading] = useState(false);

 useEffect(() => {
  let isMounted = true;
  if (currentUser?.id) {
   getActiveBreak(currentUser.id).then(brk => {
    if (isMounted) setIsOnBreak(Boolean(brk));
   });
  }
  return () => { isMounted = false; };
 }, [currentUser?.id, isCheckedIn]);

 const handleTakeBreak = async () => {
  if (isBreakLoading || !isCheckedIn) return;
  setIsBreakLoading(true);
  try {
   await startBreak(currentUser.id);
   setIsOnBreak(true);
  } catch (err) {
   console.error("Error starting break:", err);
   alert("Failed to pause for break. Please try again.");
  } finally {
   setIsBreakLoading(false);
  }
 };

 const handleResumeDuty = async () => {
  if (isBreakLoading) return;
  setIsBreakLoading(true);
  try {
   await endBreak(currentUser.id);
   setIsOnBreak(false);
  } catch (err) {
   console.error("Error resuming duty:", err);
   alert("Failed to resume duty. Please try again.");
  } finally {
   setIsBreakLoading(false);
  }
 };

 // Attach stream using useEffect so the video DOM element is guaranteed to be mounted
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
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal:"user"} }, audio: false });
   } catch (firstErr: any) {
    if (firstErr.name ==="NotAllowedError") throw firstErr;
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   }
   streamRef.current = stream;
   isForPin ? setIsPinCameraOpen(true) : setIsCameraOpen(true);
  } catch (err: any) {
   console.warn("Camera not available:", err.name, err.message);
   const isNoCamera = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';
   const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
   if (isPermissionDenied) {
    alert(language === 'te' ? 'కెమెరా అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్స్‌లో కెమెరా అనుమతి ఇవ్వండి.' : 'Camera permission denied. Please allow Camera access in your browser address bar and reload.');
   } else if (!isNoCamera) {
    alert(language === 'te' ? 'కెమెరా అందుబాటులో లేదు. ఫోటో లేకుండా ముందుకు వెళ్తాము.' : `Camera error: ${err.message}. Proceeding without photo.`);
   }
   isForPin ? handlePinSubmit(undefined) : proceedWithCheckIn(undefined);
  }
 };

 const stopCamera = () => {
  streamRef.current?.getTracks().forEach(t => t.stop());
  streamRef.current = null;
  setIsCameraOpen(false);
  setIsPinCameraOpen(false);
 };

 const proceedWithCheckIn = async (photoData?: string) => {
  setIsProcessing(true);
  const result = await onToggleCheckIn(photoData, punchType, punchNote);
  setIsProcessing(false);
  if (result && !result.success && result.error) {
   alert(result.error);
  }
 };

 const handleCaptureAndCheckIn = async () => {
  if (!videoRef.current || !canvasRef.current) return;
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const MAX_WIDTH = 480;
  let w = video.videoWidth, h = video.videoHeight;
  if (w > MAX_WIDTH) { h = Math.floor(h * (MAX_WIDTH / w)); w = MAX_WIDTH; }
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, w, h);
  const photoData = canvas.toDataURL("image/jpeg", 0.6);
  stopCamera();
  await proceedWithCheckIn(photoData);
 };

 const handlePinSubmit = async (photoData?: string) => {
  setIsPinning(true);
  const result = await onAddPin(pinType, pinLabel, photoData);
  setIsPinning(false);
  if (result.success) { setIsPinModalOpen(false); setPinLabel(""); }
  else alert(result.error ||"Failed to pin location");
 };

 const handleCaptureAndPin = async () => {
  if (!videoRef.current || !canvasRef.current) return;
  const video = videoRef.current;
  const canvas = canvasRef.current;
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const photoData = canvas.toDataURL("image/jpeg", 0.7);
  stopCamera();
  await handlePinSubmit(photoData);
 };

 const todayStr = new Date().toISOString().split("T")[0];
 const todayLogs = logs.filter(l => l.date === todayStr);
 const latestCheckIn = todayLogs[todayLogs.length - 1];
 const hasCheckedOutToday = !!(latestCheckIn && latestCheckIn.checkOutTime !== null);
 const currentMonthStr = new Date().toISOString().substring(0, 7);
 const presentDays = attendanceRecords.filter(r => r.date.startsWith(currentMonthStr) && r.status ==="present").length;
 const todayWorkedSecs = logs.filter(l => l.date === todayStr && l.checkOutTime !== null).reduce((acc, log) => {
  if (log.checkInTime && log.checkOutTime) {
   const [h1,m1,s1] = log.checkInTime.split(":").map(Number);
   const [h2,m2,s2] = log.checkOutTime.split(":").map(Number);
   return acc + ((h2*3600+m2*60+s2)-(h1*3600+m1*60+s1));
  } return acc;
 }, 0);
 const todayWorkedHrs = (todayWorkedSecs / 3600).toFixed(2);

 return (
  <div id="dashboard-snapshot-container"className="space-y-6 sm:space-y-8 animate-fadeIn">
   <TickerAlert employees={[currentUser]} />

      {/* 1. Header & Quick Stats Row */}
   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div>
     <h2 className="text-3xl font-black text-slate-800 tracking-tight">
      Hello, {currentUser.name.split(' ')[0]}
     </h2>
     <p className="text-sm font-medium text-slate-500 mt-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</p>
    </div>
    <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
     {/* Leaves Balance Pill */}
     <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl sm:rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer shrink-0" onClick={() => setActiveTab('leave')}>
      <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
       <Coffee className="w-5 h-5 text-slate-600" />
      </div>
      <div>
       <p className="text-[11px] text-slate-500 font-medium leading-tight">Leave Balance</p>
       <p className="text-lg font-bold text-slate-800 leading-tight">
        {Math.max(0, (leaveBalance.casual.allowed - leaveBalance.casual.taken) + (leaveBalance.sick.allowed - leaveBalance.sick.taken))} <span className="text-[10px] font-normal text-slate-400">days</span>
       </p>
      </div>
     </div>
    </div>
   </div>

   {/* 2. Check-in Banner */}
   <div className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
    <div className="flex items-center gap-4 md:pl-2 w-full md:w-auto">
     <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${isOnBreak ? 'border-amber-200 bg-amber-50 text-amber-600' : isCheckedIn ? 'border-teal-200 bg-teal-50 text-teal-600' : 'border-slate-300 bg-white text-slate-600'}`}>
      {isOnBreak ? <Coffee className="w-6 h-6 animate-pulse" /> : <Play className={`w-6 h-6 ${isCheckedIn ? 'animate-pulse' : ''}`} />}
     </div>
     <div className="text-left">
      <h4 className="font-bold text-slate-800 text-[15px]">
       {isOnBreak ? (language === 'te' ? 'విరామంలో ఉన్నారు' : 'On Break') : isCheckedIn ? t.checkedIn : t.checkedOut}
      </h4>
      <p className="text-[13px] text-slate-500 font-medium mt-0.5">
       {isOnBreak ? (language === 'te' ? 'మీరు విరామంలో ఉన్నారు.' : 'Shift paused.') : isCheckedIn ? `Since ${latestCheckIn?.checkInTime || ''}` : `Today - ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`}
      </p>
     </div>
    </div>
    <div className="flex items-center gap-3 w-full md:w-auto">
     {isCheckedIn && !isOnBreak && (
      <button onClick={handleTakeBreak} disabled={isBreakLoading} className="flex-1 md:flex-none px-6 py-3.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full text-sm font-semibold transition-colors cursor-pointer shadow-sm border border-amber-200">
       Take Break
      </button>
     )}
     {isOnBreak && (
      <button onClick={handleResumeDuty} disabled={isBreakLoading} className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full text-sm font-semibold transition-colors cursor-pointer shadow-sm border border-emerald-200">
       Resume Duty
      </button>
     )}
     {isCheckedIn && (
      <button onClick={()=>setIsPinModalOpen(true)} className="flex-1 md:flex-none px-6 py-3.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-full text-sm font-semibold transition-colors cursor-pointer shadow-sm border border-slate-200 flex items-center justify-center gap-2">
       <MapPin className="w-4 h-4 text-rose-500"/>
       Pin
      </button>
     )}
     <button onClick={hasCheckedOutToday ? undefined : isOnBreak ? handleResumeDuty : () => startCamera(false)} disabled={hasCheckedOutToday || isProcessing || isBreakLoading} className={`flex-1 md:flex-none px-8 py-3.5 rounded-full text-sm font-semibold transition-colors shadow-sm ${hasCheckedOutToday ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : isCheckedIn ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer' : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'}`}>
      {isProcessing ? "Processing..." : hasCheckedOutToday ? "Completed" : isCheckedIn ? "Punch Out" : "Punch In"}
     </button>
    </div>
   </div>

   {pins.filter(p=>p.date===todayStr).length>0 && (<div className="w-full"><LocationPinTimeline language={language} pins={pins.filter(p=>p.date===todayStr)}/></div>)}

   {/* 3. Masonry Grid Style Layout */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    
    {/* Column 1: Attendance & Leaves */}
    <div className="lg:col-span-6 space-y-6">
     {/* Attendance Summary */}
     <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
       <span className="flex items-center gap-2"><Play className="text-teal-600 w-5 h-5" /> {language==="te"?"హాజరు సారాంశం":"Attendance Summary"}</span>
       <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-1 rounded">This Month</span>
      </h3>
      <div className="flex justify-between items-end gap-2.5 h-24 my-4">
       {[40,70,55,80,65].map((h,i)=>(<div key={i} className="flex-1 bg-slate-100 rounded-t-lg hover:bg-slate-200 transition-colors"style={{height:`${h}%`}}/>))}
       <div className="flex-1 bg-teal-600 rounded-t-lg h-full shadow-md shadow-teal-500/20"/>
      </div>
      <p className="text-[13px] text-slate-500 mt-6 leading-relaxed font-medium">{language==="te"?`ఈ నెలలో మీరు ${presentDays} రోజులు పనికి హాజరయ్యారు.`:`You have been recorded present for ${presentDays} days this month.`}</p>
      <button onClick={()=>setActiveTab("attendance")} className="mt-4 text-[13px] font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer">{language==="te"?"హాజరు షీట్ చూడండి":"View Full Sheet"}</button>
     </div>

     {/* Leave Portal */}
     <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
       <Coffee className="text-teal-600 w-5 h-5" /> Leave Portal
      </h3>
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors group" onClick={()=>setActiveTab("leave")}>
       <div>
        <p className="font-bold text-sm text-slate-800">Apply for Leave</p>
        <p className="text-slate-500 mt-0.5 text-xs">{t.btnSubmitLeave || 'Submit Application'}</p>
       </div>
       <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-all text-teal-600 font-bold">
        →
       </div>
      </div>
     </div>
    </div>

    {/* Column 2: Field Operations & Visits */}
    <div className="lg:col-span-6 space-y-6">
     {/* Field Operations */}
     <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
       <span className="flex items-center gap-2"><MapPin className="text-teal-600 w-5 h-5" /> Field Operations</span>
       <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-1 rounded">Field Duty</span>
      </h3>
      <div className="py-2 mb-4">
       <p className="text-[13px] font-medium text-slate-500 mb-1">Today's Assigned Route</p>
       <p className="text-xl font-black text-slate-800 tracking-tight">Active GPS Telemetry</p>
      </div>
      <button onClick={()=>setActiveTab("fieldDuty")} className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[13px] font-bold transition-all active:scale-95 cursor-pointer text-center shadow-sm">Open Field Navigation</button>
     </div>

     {/* Field Visits */}
     <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
       <span className="flex items-center gap-2"><Camera className="text-teal-600 w-5 h-5" /> Field Visits</span>
       <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-1 rounded">Photo Proof</span>
      </h3>
      <div className="py-2 mb-4">
       <p className="text-[13px] font-medium text-slate-500 mb-1">Doctor & Clinic Visits</p>
       <p className="text-xl font-black text-slate-800 tracking-tight">GPS-Verified Proof Photos</p>
      </div>
      <button onClick={()=>setActiveTab("callCapture")} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[13px] font-bold transition-all active:scale-95 cursor-pointer text-center shadow-sm">Start Field Visit Log</button>
     </div>
    </div>

   </div>

   {/* Camera Modal — Punch In/Out */}

   {isCameraOpen&&(
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-md">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
       <h3 className="font-bold text-slate-800 flex items-center gap-2"><Camera className="w-5 h-5 text-teal-600"/>{language==="te"?"ఫోటో తీయండి":isCheckedIn?"Photo Punch-Out":"Photo Punch-In"}</h3>
       <button onClick={stopCamera} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
      </div>
      <div className="relative bg-black aspect-video"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/><canvas ref={canvasRef} className="hidden"/><div className="absolute inset-0 border-4 border-teal-600/30 m-4 rounded-xl pointer-events-none"/></div>
      <div className="p-6 flex flex-col items-center gap-4">
       {!isCheckedIn&&(<div className="w-full"><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.selectPunchType||"Punch Category"}</label><div className="grid grid-cols-2 gap-3">{(["in_office","out_of_office"] as const).map(pt=>(<button key={pt} onClick={()=>setPunchType(pt)} className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all ${punchType===pt?"border-teal-600 bg-teal-50 text-teal-700":"border-slate-100 bg-white text-slate-500 hover:border-slate-200"}`}>{pt==="in_office"?(t.punchTypeInOffice||"In Office"):(t.punchTypeOutOfOffice||"Medical Camp")}</button>))}</div></div>)}
       {punchType==="out_of_office"&&!isCheckedIn&&(<div className="w-full"><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{language==="te"?"లొకేషన్ నోట్":"Location Note (Required)"}</label><input type="text"value={punchNote} onChange={e=>setPunchNote(e.target.value)} placeholder={language==="te"?"మీరు ఎక్కడ ఉన్నారో రాయండి...":"e.g. Medical Camp, Field Visit..."} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"/></div>)}
       <p className="text-xs text-slate-500 text-center">{language==="te"?"హాజరు నమోదు చేయడానికి దయచేసి మీ ఫోటో తీయండి.":"Please capture your photo to record attendance."}</p>
       <button onClick={()=>{if(punchType==="out_of_office"&&!isCheckedIn&&!punchNote.trim()){alert(language==="te"?"దయచేసి ఒక నోట్ రాయండి.":"Please enter a location note.");return;}handleCaptureAndCheckIn();}} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-sm transition-all flex items-center gap-2 w-full justify-center active:scale-95"><Camera className="w-5 h-5"/>{language==="te"?(isCheckedIn?"ఫోటో తీసి పంచ్ అవుట్ చేయండి":"ఫోటో తీసి పంచ్ ఇన్ చేయండి"):(isCheckedIn?"Capture & Punch Out":"Capture & Punch In")}</button>
      </div>
     </div>
    </div>
   )}

   {/* Camera Modal — Pin Location */}
   {isPinCameraOpen&&(
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-md">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Camera className="w-5 h-5 text-teal-600"/>{language==="te"?"పిన్ ఫోటో":"Pin Photo"}</h3><button onClick={stopCamera} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button></div>
      <div className="relative bg-black aspect-video"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/><canvas ref={canvasRef} className="hidden"/><div className="absolute inset-0 border-4 border-teal-600/30 m-4 rounded-xl pointer-events-none"/></div>
      <div className="p-6"><button onClick={handleCaptureAndPin} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-sm transition-all flex items-center gap-2 w-full justify-center active:scale-95"><Camera className="w-5 h-5"/>{language==="te"?"ఫోటో తీయండి":"Capture & Pin"}</button></div>
     </div>
    </div>
   )}

   {/* Pin Location Modal */}
   {isPinModalOpen&&(
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
     <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-md">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500"/>{language==="te"?"లొకేషన్ పిన్ చేయండి":"Pin Current Location"}</h3><button onClick={()=>setIsPinModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button></div>
      <div className="p-6 space-y-4">
       <div><label className="block text-xs font-bold text-slate-700 mb-2">{language==="te"?"పిన్ రకం":"Pin Type"}</label><select value={pinType} onChange={e=>setPinType(e.target.value as import("../types").PinType)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"><option value="field_visit">Field Visit / ఫీల్డ్ విజిట్</option><option value="medical_camp">Medical Camp / మెడికల్ క్యాంప్</option><option value="client_site">Client Site / క్లయింట్ సైట్</option><option value="delivery">Delivery / డెలివరీ</option><option value="other">Other / ఇతర</option></select></div>
       <div><label className="block text-xs font-bold text-slate-700 mb-2">{language==="te"?"వివరాలు (ఐచ్ఛికం)":"Label (Optional)"}</label><input type="text"value={pinLabel} onChange={e=>setPinLabel(e.target.value)} placeholder={language==="te"?"ఉదా: గాజువాక క్యాంప్":"e.g. Gajuwaka Medical Camp"} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"/></div>
       <div className="pt-2 flex flex-col gap-3">
        <button onClick={()=>startCamera(true)} disabled={isPinning} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Camera className="w-4 h-4"/>{isPinning?"Processing...":(language==="te"?"ఫోటోతో పిన్ చేయండి":"Capture Photo & Pin")}</button>
        <button onClick={()=>handlePinSubmit(undefined)} disabled={isPinning} className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">{language==="te"?"ఫోటో లేకుండా పిన్ చేయండి":"Skip Photo & Pin"}</button>
       </div>
      </div>
     </div>
    </div>
   )}

  </div>
 );
}
