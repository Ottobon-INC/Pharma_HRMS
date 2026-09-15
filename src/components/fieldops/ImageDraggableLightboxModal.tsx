import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move, Maximize2, Download, Camera, User } from 'lucide-react';

export interface ImageLightboxData {
 url?: string;
 title: string;
 employeeName: string;
 employeeId: string;
 time?: string;
 locationName?: string;
 type: 'start' | 'end';
}

interface ImageDraggableLightboxModalProps {
 data: ImageLightboxData;
 onClose: () => void;
}

export const ImageDraggableLightboxModal: React.FC<ImageDraggableLightboxModalProps> = ({
 data,
 onClose
}) => {
 const [zoom, setZoom] = useState(1);
 const [position, setPosition] = useState({ x: 0, y: 0 });
 const [isDragging, setIsDragging] = useState(false);
 const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
 const containerRef = useRef<HTMLDivElement>(null);

 // Close on Escape key
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, [onClose]);

 const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3.5));
 const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.6));
 const handleReset = () => {
  setZoom(1);
  setPosition({ x: 0, y: 0 });
 };

 // Mouse drag handlers
 const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  setDragStart({
   x: e.clientX - position.x,
   y: e.clientY - position.y
  });
 };

 const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging) return;
  setPosition({
   x: e.clientX - dragStart.x,
   y: e.clientY - dragStart.y
  });
 };

 const handleMouseUp = () => {
  setIsDragging(false);
 };

 // Touch drag handlers for mobile devices
 const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 1) {
   setIsDragging(true);
   setDragStart({
    x: e.touches[0].clientX - position.x,
    y: e.touches[0].clientY - position.y
   });
  }
 };

 const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging || e.touches.length !== 1) return;
  setPosition({
   x: e.touches[0].clientX - dragStart.x,
   y: e.touches[0].clientY - dragStart.y
  });
 };

 const handleTouchEnd = () => {
  setIsDragging(false);
 };

 // Strictly use the uploaded employee photo URL
 const displayImage = data.url;

 return (
  <div
   className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 select-none"
   onClick={onClose}
  >
   <div
    className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[85vh] max-h-[780px] flex flex-col shadow-md overflow-hidden relative"
    onClick={e => e.stopPropagation()}
   >
    {/* Top Header */}
    <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
     <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
       data.type === 'start' ? 'bg-teal-600' : 'bg-slate-700'
      }`}>
       <Camera className="w-5 h-5"/>
      </div>
      <div>
       <div className="flex items-center gap-2">
        <h3 className="text-white font-black text-base">{data.title}</h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-teal-400 border border-slate-700">
         {data.type === 'start' ? 'Check-In Photo' : 'Check-Out Photo'}
        </span>
       </div>
       <p className="text-xs text-slate-400 font-medium">
        {data.employeeName} ({data.employeeId}) • <span className="text-slate-300 font-mono">{data.time || 'Today'}</span>
        {data.locationName && ` • ${data.locationName}`}
       </p>
      </div>
     </div>

     <div className="flex items-center gap-2">
      <button
       type="button"
       onClick={onClose}
       className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
      >
       <X className="w-5 h-5"/>
      </button>
     </div>
    </div>

    {/* Floating Zoom & Drag Control Toolbar (only active when photo is available) */}
    {displayImage && (
     <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-700/70 shadow-sm flex items-center gap-3 text-xs text-white">
      <button
       type="button"
       onClick={handleZoomOut}
       disabled={zoom <= 0.6}
       className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
       title="Zoom Out"
      >
       <ZoomOut className="w-4 h-4 text-slate-300"/>
      </button>

      {/* Drag slider for scale */}
      <input
       type="range"
       min="0.6"
       max="3.5"
       step="0.1"
       value={zoom}
       onChange={e => setZoom(parseFloat(e.target.value))}
       className="w-24 sm:w-36 accent-teal-500 cursor-pointer"
       title="Drag slider to enlarge"
      />

      <button
       type="button"
       onClick={handleZoomIn}
       disabled={zoom >= 3.5}
       className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
       title="Zoom In"
      >
       <ZoomIn className="w-4 h-4 text-slate-300"/>
      </button>

      <div className="h-4 w-px bg-slate-700"/>

      <button
       type="button"
       onClick={handleReset}
       className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono font-bold text-[11px] text-teal-400 flex items-center gap-1 transition-colors cursor-pointer"
       title="Reset Zoom & Center"
      >
       <RotateCcw className="w-3 h-3"/>
       <span>{Math.round(zoom * 100)}%</span>
      </button>

      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 border-l border-slate-700 pl-3">
       <Move className="w-3.5 h-3.5 text-teal-400 animate-pulse"/> Drag image to inspect
      </span>
     </div>
    )}

    {/* Image Canvas Viewport */}
    <div
     ref={containerRef}
     className={`flex-1 w-full h-full overflow-hidden relative flex items-center justify-center bg-slate-950/70 ${
      displayImage ? 'cursor-grab active:cursor-grabbing' : ''
     }`}
     onMouseDown={displayImage ? handleMouseDown : undefined}
     onMouseMove={displayImage ? handleMouseMove : undefined}
     onMouseUp={displayImage ? handleMouseUp : undefined}
     onMouseLeave={displayImage ? handleMouseUp : undefined}
     onTouchStart={displayImage ? handleTouchStart : undefined}
     onTouchMove={displayImage ? handleTouchMove : undefined}
     onTouchEnd={displayImage ? handleTouchEnd : undefined}
    >
     {displayImage ? (
      <div
       style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        transition: isDragging ? 'none' : 'transform 0.15s ease-out'
       }}
       className="origin-center pointer-events-none select-none max-w-full max-h-full flex items-center justify-center p-4"
      >
       <img
        src={displayImage}
        alt={data.title}
        className="max-h-[62vh] max-w-[85vw] sm:max-w-2xl object-contain rounded-2xl shadow-md border border-slate-700/60 ring-1 ring-white/10"
        draggable={false}
       />
      </div>
     ) : (
      <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
       <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700">
        <Camera className="w-8 h-8 text-slate-500"/>
       </div>
       <h4 className="text-white font-black text-base">No Photo Uploaded Yet</h4>
       <p className="text-xs text-slate-400 max-w-sm">
        This employee has not captured or uploaded a camera selfie for this punch session yet. Real photos captured via check-in or visit verification will appear here automatically.
       </p>
      </div>
     )}
    </div>

    {/* Footer info bar */}
    <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
     <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${displayImage ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
      <span>{displayImage ? 'Recorded Employee Photo Proof' : 'Awaiting Employee Upload'}</span>
     </div>
     {displayImage && (
      <div className="flex items-center gap-3">
       <a
        href={displayImage}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
       >
        <Maximize2 className="w-3.5 h-3.5"/> Full Resolution
       </a>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};
