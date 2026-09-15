import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
 Camera,
 RefreshCw,
 MapPin,
 Clock,
 CheckCircle2,
 AlertCircle,
 Play,
 Square,
 ChevronRight,
 Phone,
 FileText,
 Maximize2,
 Sparkles,
 Navigation,
 Plus
} from 'lucide-react';
import { FieldVisit, Language, Employee } from '../../types';
import * as fieldVisitService from '../../lib/services/field-visit-service';
import { getCurrentLocationSafe } from '../../lib/utils/location-utils';
import { supabase } from '../../lib/supabase-client';
import AssignVisitModal from '../AssignVisitModal';

interface CallPhotoCaptureViewProps {
 language: Language;
 employeeId: string;
 isLocalMode: boolean;
 currentUser?: Employee;
 employees?: Employee[];
}

export const CallPhotoCaptureView: React.FC<CallPhotoCaptureViewProps> = ({
 language,
 employeeId,
 isLocalMode,
 currentUser,
 employees = []
}) => {
 const [visits, setVisits] = useState<FieldVisit[]>([]);
 const [loading, setLoading] = useState(true);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [activeVisit, setActiveVisit] = useState<FieldVisit | null>(null);

 // Camera & Stream State
 const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
 const [isCameraActive, setIsCameraActive] = useState(false);
 const [cameraError, setCameraError] = useState<string | null>(null);
 const videoRef = useRef<HTMLVideoElement>(null);
 const streamRef = useRef<MediaStream | null>(null);

 // Photo & Location Capture State
 const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
 const [captureStage, setCaptureStage] = useState<'idle' | 'start_preview' | 'end_preview'>('idle');
 const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
 const [gpsLoading, setGpsLoading] = useState(false);
 const [notes, setNotes] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);

 // Active call duration timer
 const [durationSeconds, setDurationSeconds] = useState(0);

 // 1. Fetch Today's Visits for Employee
 const loadVisits = useCallback(async () => {
  if (isLocalMode) {
   setLoading(false);
   return;
  }
  try {
   setLoading(true);
   const today = new Date().toISOString().split('T')[0];
   let data = await fieldVisitService.getVisitsForDate(employeeId, today);
   if (data.length === 0) {
    const { data: upcoming, error } = await supabase
     .from('pharma_hrms_field_visits')
     .select('*')
     .eq('employee_id', employeeId)
     .neq('status', 'COMPLETED')
     .neq('status', 'CANCELLED')
     .order('scheduled_date', { ascending: true })
     .order('scheduled_start', { ascending: true });
    
    if (!error && upcoming) {
     data = upcoming.map((d: any) => ({
      id: d.id,
      sessionId: d.session_id,
      employeeId: d.employee_id,
      assignedBy: d.assigned_by,
      visitType: d.visit_type,
      title: d.title,
      description: d.description,
      scheduledDate: d.scheduled_date,
      scheduledStart: d.scheduled_start,
      scheduledEnd: d.scheduled_end,
      assignedLatitude: d.assigned_latitude,
      assignedLongitude: d.assigned_longitude,
      assignedAddress: d.assigned_address,
      allowedRadiusMeters: d.allowed_radius_meters,
      priority: d.priority,
      status: d.status,
      startedAt: d.started_at,
      arrivedAt: d.arrived_at,
      completedAt: d.completed_at,
      actualLatitude: d.actual_latitude,
      actualLongitude: d.actual_longitude,
      actualAddress: d.actual_address,
      arrivalDistanceM: d.arrival_distance_m,
      durationMinutes: d.duration_minutes,
      startPhotoUrl: d.start_photo_url,
      proofPhotoUrl: d.proof_photo_url,
      completionNotes: d.completion_notes,
      patientName: d.patient_name,
      clientReference: d.client_reference,
      locationException: d.location_exception,
      approvalStatus: d.approval_status || 'approved',
      approvedBy: d.approved_by,
      rejectionReason: d.rejection_reason,
      doctorName: d.doctor_name,
      clinicName: d.clinic_name
     }));
    }
   }
   setVisits(data);

   // Check if there is already an in-progress call
   const ongoing = data.find(v => v.status === 'IN_PROGRESS');
   if (ongoing) {
    setActiveVisit(ongoing);
    if (ongoing.startedAt) {
     const startMs = new Date(ongoing.startedAt).getTime();
     const nowMs = Date.now();
     setDurationSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    }
   } else {
    setActiveVisit(null);
   }
  } catch (err) {
   console.error('Failed to load visits:', err);
  } finally {
   setLoading(false);
  }
 }, [employeeId, isLocalMode]);

 useEffect(() => {
  loadVisits();
 }, [loadVisits]);

 // Duration timer ticker
 useEffect(() => {
  let interval: any;
  if (activeVisit && activeVisit.status === 'IN_PROGRESS') {
   interval = setInterval(() => {
    setDurationSeconds(prev => prev + 1);
   }, 1000);
  }
  return () => clearInterval(interval);
 }, [activeVisit]);

 useEffect(() => {
  if (isCameraActive && videoRef.current && streamRef.current) {
   videoRef.current.srcObject = streamRef.current;
  }
 }, [isCameraActive]);

 // 2. Camera Controls
 const startCamera = async (mode: 'user' | 'environment') => {
  stopCamera();
  setCameraError(null);
  try {
   const stream = await navigator.mediaDevices.getUserMedia({
    video: {
     facingMode: mode,
     width: { ideal: 1280 },
     height: { ideal: 720 }
    }
   });
   streamRef.current = stream;
   if (videoRef.current) {
    videoRef.current.srcObject = stream;
   }
   setIsCameraActive(true);
  } catch (err: any) {
   console.error('Camera access error:', err);
   setCameraError('Unable to access camera. Please check camera permissions.');
  }
 };

 const handleUseMockPhoto = () => {
  // Generate a simple mock canvas image
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (ctx) {
   ctx.fillStyle = '#1e293b';
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   ctx.fillStyle = '#94a3b8';
   ctx.font = 'bold 48px monospace';
   ctx.textAlign = 'center';
   ctx.fillText('MOCK DEV PHOTO', canvas.width / 2, canvas.height / 2);
  }
  
  // Add same watermark logic as snapPhoto
  const bannerHeight = 80;
  if (ctx) {
   ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
   ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

   ctx.fillStyle = '#ffffff';
   ctx.font = 'bold 22px monospace';
   ctx.textAlign = 'left';
   const nowStr = new Date().toLocaleString();
   ctx.fillText(`ORCA LABS PHARMA HRMS • ${activeVisit?.title || 'FIELD CALL'}`, 24, canvas.height - 48);

   ctx.fillStyle = '#2dd4bf';
   ctx.font = 'bold 18px monospace';
   const coordsStr = currentLocation
    ? `GPS: ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
    : 'GPS: Location Acquired';
   ctx.fillText(`${nowStr} • ${coordsStr}`, 24, canvas.height - 20);
  }

  setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85));
  stopCamera();
  setCameraError(null);
 };

 const stopCamera = () => {
  if (streamRef.current) {
   streamRef.current.getTracks().forEach(track => track.stop());
   streamRef.current = null;
  }
  setIsCameraActive(false);
 };

 const toggleFacingMode = () => {
  const nextMode = facingMode === 'environment' ? 'user' : 'environment';
  setFacingMode(nextMode);
  startCamera(nextMode);
 };

 // 3. Acquire GPS Location
 const acquireLocation = async () => {
  setGpsLoading(true);
  try {
   const loc = await getCurrentLocationSafe();
   if (loc && loc.latitude !== undefined && loc.longitude !== undefined) {
    setCurrentLocation({
     lat: loc.latitude,
     lng: loc.longitude,
     address: loc.address || undefined
    });
   }
  } catch (e) {
   console.warn('GPS acquisition warning:', e);
  } finally {
   setGpsLoading(false);
  }
 };

 // 4. Snap Photo and Stamp Geo-Watermark on Canvas
 const snapPhoto = () => {
  if (!videoRef.current) return;

  const video = videoRef.current;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Burn-in Geo-Watermark banner at bottom
  const bannerHeight = 80;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  const nowStr = new Date().toLocaleString();
  ctx.fillText(`ORCA LABS PHARMA HRMS • ${activeVisit?.title || 'FIELD CALL'}`, 24, canvas.height - 48);

  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 18px monospace';
  const coordsStr = currentLocation
   ? `GPS: ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
   : 'GPS: Location Acquired';
  ctx.fillText(`${nowStr} • ${coordsStr}`, 24, canvas.height - 20);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  setCapturedPhoto(dataUrl);
  stopCamera();
 };

 // 5. Start Call Action
 const handleInitiateStartCall = async (visit: FieldVisit) => {
  setActiveVisit(visit);
  setCaptureStage('start_preview');
  setCapturedPhoto(null);
  await acquireLocation();
  await startCamera(facingMode);
 };

 const handleConfirmStartCall = async () => {
  if (!activeVisit || !capturedPhoto) return;
  setSubmitting(true);
  try {
   const updated = await fieldVisitService.startCallWithPhoto(
    activeVisit.id,
    employeeId,
    capturedPhoto,
    currentLocation?.lat,
    currentLocation?.lng,
    currentLocation?.address,
    notes
   );

   setActiveVisit(updated);
   setCaptureStage('idle');
   setCapturedPhoto(null);
   setDurationSeconds(0);
   setSuccessMessage('Arrival logged! Proof photo and GPS coordinates recorded for this visit.');
   setTimeout(() => setSuccessMessage(null), 4000);
   await loadVisits();
  } catch (err: any) {
   alert('Failed to record start call photo: ' + err.message);
  } finally {
   setSubmitting(false);
  }
 };

 // 6. End Call Action
 const handleInitiateEndCall = async () => {
  setCaptureStage('end_preview');
  setCapturedPhoto(null);
  await acquireLocation();
  await startCamera(facingMode);
 };

 const handleConfirmEndCall = async () => {
  if (!activeVisit || !capturedPhoto) return;
  if (!notes.trim()) {
   alert('A Visit Departure Summary is required. Please provide a brief summary of the visit.');
   return;
  }
  setSubmitting(true);
  try {
   await fieldVisitService.completeCallWithPhoto(
    activeVisit.id,
    employeeId,
    capturedPhoto,
    currentLocation?.lat,
    currentLocation?.lng,
    notes
   );

   setSuccessMessage('Visit closed! Departure proof and total duration saved successfully.');
   setTimeout(() => setSuccessMessage(null), 4000);
   setActiveVisit(null);
   setCaptureStage('idle');
   setCapturedPhoto(null);
   setNotes('');
   await loadVisits();
  } catch (err: any) {
   alert('Failed to complete call: ' + err.message);
  } finally {
   setSubmitting(false);
  }
 };



 const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hrs = Math.floor(mins / 60);
  return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 };

 return (
  <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
   {/* Header Banner */}
   <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
     <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
       <Camera className="w-5 h-5"/>
      </div>
      <div>
       <h2 className="text-xl font-black text-slate-800">Field Visit Log</h2>
       <p className="text-xs text-slate-400 font-medium">Log your doctor & clinic visits with GPS-verified arrival and departure proof photos</p>
      </div>
     </div>
    </div>

    <button
     type="button"
     onClick={() => setIsAddModalOpen(true)}
     className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-500/20 cursor-pointer shrink-0"
    >
     <Plus className="w-4 h-4" />
     <span>Add Doctor Visit</span>
    </button>
   </div>

   {/* Success Notification Alert */}
   {successMessage && (
    <div className="bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in duration-200 font-bold text-xs">
     <CheckCircle2 className="w-5 h-5"/>
     <span>{successMessage}</span>
    </div>
   )}

   {/* ACTIVE CALL IN-PROGRESS BANNER */}
   {activeVisit && activeVisit.status === 'IN_PROGRESS' && captureStage === 'idle' && (
    <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-[#0f766e] space-y-4">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1">
       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider border border-amber-300/30">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"/>
        Visit In Progress
       </span>
       <h3 className="text-lg font-black text-white">{activeVisit.title}</h3>
       <p className="text-xs text-teal-200">
        Started at: <span className="font-mono font-bold text-white">{activeVisit.startedAt ? new Date(activeVisit.startedAt).toLocaleTimeString() : 'Just now'}</span>
       </p>
      </div>

      {/* Running Stopwatch Timer */}
      <div className="bg-slate-900/60 px-6 py-3 rounded-2xl border border-teal-600/40 text-center">
       <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 block">Duration</span>
       <span className="text-3xl font-black font-mono tracking-tight text-white block mt-0.5">
        {formatTimer(durationSeconds)}
       </span>
      </div>
     </div>

     <div className="pt-3 border-t border-[#0f766e]/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {activeVisit.startPhotoUrl && (
       <div className="flex items-center gap-3">
        <img
         src={activeVisit.startPhotoUrl}
         alt="Start photo proof"
         className="w-12 h-12 rounded-xl object-cover border-2 border-teal-400 shadow-md"
        />
        <div>
         <span className="text-[10px] font-black uppercase text-teal-300 block">Start Photo Verified</span>
         <span className="text-xs text-teal-100 font-medium">GPS location registered</span>
        </div>
       </div>
      )}

      <button
       type="button"
       onClick={handleInitiateEndCall}
       className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-105"
      >
       <Square className="w-4 h-4 fill-slate-950"/>
       Depart & Snap Exit Proof
      </button>
     </div>
    </div>
   )}

   {/* CAMERA CAPTURE / PREVIEW WORKSPACE */}
   {captureStage !== 'idle' && (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-5 animate-in fade-in duration-200">
     <div className="flex items-center justify-between pb-3 border-b border-slate-800">
      <div>
       <h3 className="font-black text-base text-white flex items-center gap-2">
        <Camera className="w-5 h-5 text-teal-400"/>
        {captureStage === 'start_preview' ? 'Snap Arrival Proof' : 'Snap Departure Proof'}
       </h3>
       <p className="text-xs text-slate-400 font-medium mt-0.5">
        {activeVisit?.title} • {captureStage === 'start_preview' ? 'Arrival proof photo for this visit' : 'Departure proof photo for this visit'}
       </p>
      </div>

      <button
       type="button"
       onClick={() => {
        stopCamera();
        setCaptureStage('idle');
        setCapturedPhoto(null);
       }}
       className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
      >
       Cancel
      </button>
     </div>

     {/* Video or Preview Canvas Container */}
     <div className="relative w-full aspect-video max-h-[420px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
      {capturedPhoto ? (
       <div className="relative w-full h-full">
        <img
         src={capturedPhoto}
         alt="Captured preview"
         className="w-full h-full object-contain"
        />
        <div className="absolute top-4 left-4 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
         <CheckCircle2 className="w-3.5 h-3.5"/> Photo Ready with Watermark
        </div>
       </div>
      ) : isCameraActive ? (
       <>
        <video
         ref={videoRef}
         autoPlay
         playsInline
         muted
         className="w-full h-full object-cover"
        />

        {/* Floating Lens Switcher */}
        <button
         type="button"
         onClick={toggleFacingMode}
         className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white shadow-sm border border-slate-700 transition-all cursor-pointer"
         title="Switch Camera (Front/Rear)"
        >
         <RefreshCw className="w-4 h-4 text-teal-400"/>
        </button>

        {/* GPS Status Indicator */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 px-3 py-1.5 rounded-xl text-[11px] font-mono text-teal-300 border border-slate-700 flex items-center gap-1.5">
         <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0"/>
         <span>
          {currentLocation
           ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
           : 'Acquiring GPS coordinates...'}
         </span>
        </div>
       </>
      ) : (
       <div className="text-center p-6 space-y-3">
        {cameraError ? (
         <div className="text-rose-400 text-xs font-bold flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6"/>
          <span>{cameraError}</span>
          {isLocalMode && (
           <button
            type="button"
            onClick={handleUseMockPhoto}
            className="mt-2 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
           >
            Bypass & Use Mock Photo (Dev Mode)
           </button>
          )}
         </div>
        ) : (
         <div className="space-y-2">
          <Camera className="w-8 h-8 text-slate-600 mx-auto"/>
          <p className="text-xs text-slate-400 font-medium">Camera stopped</p>
         </div>
        )}
       </div>
      )}
     </div>

     {/* Action Buttons Toolbar */}
     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      {!capturedPhoto ? (
       <div className="w-full flex justify-center">
        <button
         type="button"
         onClick={snapPhoto}
         disabled={!isCameraActive}
         className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2.5 shadow-sm shadow-teal-500/20 transition-all cursor-pointer hover:scale-105"
        >
         <Camera className="w-5 h-5"/> Capture Proof Photo
        </button>
       </div>
      ) : (
       <div className="w-full space-y-4">
        {/* Notes Input Field */}
        <div>
         <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
           <FileText className="w-3.5 h-3.5 text-teal-400"/>
           {captureStage === 'start_preview' ? 'Visit Arrival Notes (Optional)' : 'Visit Departure Summary *'}
          </span>
          {captureStage === 'end_preview' && (
           <span className="text-[10px] text-rose-400 font-bold">Mandatory to close visit</span>
          )}
         </label>
         <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={
           captureStage === 'start_preview'
            ? 'e.g., Met with Dr. Rao at OPD reception...'
            : 'e.g., Prescribed product samples handed over, discussion concluded (Required)...'
          }
          className="w-full bg-slate-800 border border-slate-700 focus:border-teal-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400/40"
         />
        </div>

        <div className="flex items-center justify-between gap-3">
         <button
          type="button"
          onClick={() => {
           setCapturedPhoto(null);
           startCamera(facingMode);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
         >
          Retake Photo
         </button>

         <button
          type="button"
          disabled={submitting || (captureStage === 'end_preview' && !notes.trim())}
          onClick={captureStage === 'start_preview' ? handleConfirmStartCall : handleConfirmEndCall}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-2 shadow-sm shadow-teal-600/30 transition-all cursor-pointer"
         >
          {submitting ? (
           <span>Uploading Proof...</span>
          ) : captureStage === 'start_preview' ? (
           <>
            <Play className="w-4 h-4 fill-white"/> Confirm Arrival
           </>
          ) : (
           <>
            <CheckCircle2 className="w-4 h-4"/> Confirm Departure &amp; Close Visit
           </>
          )}
         </button>
        </div>
       </div>
      )}
     </div>
    </div>
   )}

   {/* TODAY'S SCHEDULED FIELD CALLS LIST */}
   <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
     <div>
      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
       <Phone className="w-4 h-4 text-teal-600"/>
       Today's Assigned Visits ({visits.length})
      </h3>
      <p className="text-xs text-slate-400 font-medium mt-0.5">
       Select a visit to begin logging your arrival proof
      </p>
     </div>
    </div>

    {loading ? (
     <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
      Loading your assigned calls...
     </div>
    ) : visits.length === 0 ? (
     <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
      <Phone className="w-8 h-8 text-slate-300 mx-auto"/>
      <p className="text-xs text-slate-500 font-bold">No visits assigned for today yet.</p>
     </div>
    ) : (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visits.map(visit => {
       const isOngoing = visit.status === 'IN_PROGRESS';
       const isCompleted = visit.status === 'COMPLETED';

       return (
        <div
         key={visit.id}
         className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
          isOngoing
           ? 'border-teal-600 bg-teal-50/40 shadow-sm'
           : isCompleted
           ? 'border-emerald-200 bg-emerald-50/20'
           : 'border-slate-200 bg-white hover:border-slate-300'
         }`}
        >
         <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
           <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">
            {visit.visitType?.replace('_', ' ')}
           </span>
           <h4 className="text-sm font-black text-slate-800 leading-tight mt-0.5 truncate">{visit.title}</h4>
           {visit.assignedAddress && (
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
             <MapPin className="w-3 h-3 text-slate-400 shrink-0"/>
             <span className="truncate block w-full">{visit.assignedAddress}</span>
            </p>
           )}
          </div>

          <span
           className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
            isCompleted
             ? 'bg-emerald-100 text-emerald-800'
             : isOngoing
             ? 'bg-amber-100 text-amber-800'
             : 'bg-slate-100 text-slate-600'
           }`}
          >
           {visit.status}
          </span>
         </div>

         {/* Start & End Photos comparison if available */}
         {(visit.startPhotoUrl || visit.proofPhotoUrl) && (
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
           <div className="flex items-center gap-2">
            {visit.startPhotoUrl ? (
             <img
              src={visit.startPhotoUrl}
              alt="Start photo"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
             />
            ) : (
             <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <Camera className="w-4 h-4"/>
             </div>
            )}
            <span className="truncate">Start Photo</span>
           </div>

           <div className="flex items-center gap-2 border-l border-slate-100 pl-2">
            {visit.proofPhotoUrl ? (
             <img
              src={visit.proofPhotoUrl}
              alt="End photo"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
             />
            ) : (
             <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <Camera className="w-4 h-4"/>
             </div>
            )}
            <span className="truncate">End Photo</span>
           </div>
          </div>
         )}

         {/* Bottom Action Button */}
         <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
           {visit.scheduledStart || 'Today'}
           {visit.durationMinutes ? ` • ${visit.durationMinutes} mins` : ''}
          </span>

          {isCompleted ? (
           <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5"/> Visit Verified
           </span>
          ) : isOngoing ? (
           <button
            type="button"
            onClick={handleInitiateEndCall}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
           >
            <Square className="w-3 h-3 fill-white"/> Depart & Close Visit
           </button>
          ) : visit.approvalStatus === 'pending' ? (
           <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 cursor-not-allowed" title="Your direct Team Lead must approve this visit before you can start">
            ⏳ Awaiting Lead Approval
           </span>
          ) : visit.approvalStatus === 'rejected' ? (
           <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1" title={visit.rejectionReason || 'Rejected by Lead'}>
            ✗ Rejected by Lead
           </span>
          ) : (
           <div className="flex items-center gap-2">
            <button
             type="button"
             onClick={() => {
              const reason = prompt('Please provide a reason or proposed date for rescheduling:');
              if (reason) {
               fieldVisitService.updateVisitStatus(visit.id, employeeId, 'RESCHEDULE_REQUESTED' as any, undefined, undefined, undefined, undefined, undefined, undefined, reason)
                .then(() => loadVisits())
                .catch(err => alert('Failed to request reschedule: ' + err.message));
              }
             }}
             className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
             Request Reschedule
            </button>
            <button
             type="button"
             onClick={() => handleInitiateStartCall(visit)}
             className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
             <Play className="w-3 h-3 fill-white"/> Arrive & Snap Proof
            </button>
           </div>
          )}
         </div>
        </div>
       );
      })}
     </div>
    )}
   </div>

   {/* Modal to add/plan doctor call */}
   {isAddModalOpen && (
    <AssignVisitModal
      language={language}
      onClose={() => setIsAddModalOpen(false)}
      employees={employees}
      adminId={employeeId}
      currentUser={currentUser}
      targetEmployeeId={employeeId}
      isSelfSchedule={true}
      onVisitCreated={async () => {
        await loadVisits();
      }}
    />
   )}

  </div>
 );
};
