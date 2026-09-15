import React, { useState, useEffect } from 'react';
import { useFieldDuty } from '../hooks/useFieldDuty';
import { useFieldVisits } from '../hooks/useFieldVisits';
import { Language, FieldVisitStatus, FieldVisit, PinCategory } from '../types';
import { MapPin, Navigation2, CheckCircle2, Plus, Map, Radio, Compass } from 'lucide-react';
import RequestVisitModal from './RequestVisitModal';
import VisitDetailSheet from './VisitDetailSheet';
import { fieldOpsConfig } from '../lib/fieldOpsConfig';
import { DropPinModal } from './fieldops/DropPinModal';
import { useFieldPins } from '../hooks/useFieldPins';
import * as fieldPinService from '../lib/services/field-pin-service';
import { fetchRoute, OsrmRoute } from '../lib/osrm';

interface FieldDutyModuleProps {
 language: Language;
 employeeId: string;
 isLocalMode: boolean;
}

export default function FieldDutyModule({ language, employeeId, isLocalMode }: FieldDutyModuleProps) {
 const { session, loading: sessionLoading, startDuty, endDuty } = useFieldDuty(employeeId, isLocalMode);
 const { visits, loading: visitsLoading, updateStatus: baseUpdateStatus, createVisitRequest } = useFieldVisits(employeeId, session?.id, isLocalMode);
 const [showRequestModal, setShowRequestModal] = useState(false);
 const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
 const [routes, setRoutes] = useState<Record<string, OsrmRoute>>({});

 const [dropPinVisit, setDropPinVisit] = useState<FieldVisit | null>(null);

 // Hook for pins for the current active/navigating visit
 const activeVisitForPins = selectedVisitId || (visits.find(v => v.status === 'EN_ROUTE')?.id);
 const { pins: currentVisitPins, refreshPins } = useFieldPins(activeVisitForPins);

 const isActive = session?.status === 'active';

 // Fetch OSRM driving routes from default/actual position to destination for all visits
 useEffect(() => {
  const fetchAllRoutes = async () => {
   const newRoutes: Record<string, OsrmRoute> = {};
   for (const visit of visits) {
    if (!visit.assignedLatitude || !visit.assignedLongitude) continue;

    const startLat = visit.actualLatitude ?? fieldOpsConfig.defaultCenter[0];
    const startLng = visit.actualLongitude ?? fieldOpsConfig.defaultCenter[1];

    const r = await fetchRoute(startLat, startLng, visit.assignedLatitude, visit.assignedLongitude);
    if (r) {
     newRoutes[visit.id] = r;
    }
   }
   setRoutes(newRoutes);
  };

  if (visits.length > 0) {
   fetchAllRoutes();
  }
 }, [visits]);

 const handleUpdateStatus = async (
  visitId: string,
  status: FieldVisitStatus,
  photoData?: string,
  notes?: string
 ) => {
  return baseUpdateStatus(visitId, status, photoData, notes);
 };

 const handleEndDuty = async () => {
  return endDuty();
 };

 const handleSavePin = async (
  category: PinCategory | string,
  label?: string,
  note?: string
 ): Promise<boolean> => {
  const visitTarget = dropPinVisit || visits.find(v => v.id === selectedVisitId);
  if (!visitTarget) return false;

  const lat = visitTarget.actualLatitude ?? visitTarget.assignedLatitude;
  const lng = visitTarget.actualLongitude ?? visitTarget.assignedLongitude;

  if (!lat || !lng) {
   alert('Could not determine current location to drop pin.');
   return false;
  }

  const created = await fieldPinService.createPin(
   visitTarget.id,
   employeeId,
   lat,
   lng,
   category,
   label,
   note
  );

  if (created) {
   refreshPins();
   return true;
  }
  return false;
 };

 // Status Badge Helper
 const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
   'ASSIGNED': 'bg-slate-100 text-slate-600',
   'EN_ROUTE': 'bg-blue-50 text-blue-600',
   'ARRIVED': 'bg-orange-50 text-orange-600',
   'IN_PROGRESS': 'bg-amber-50 text-amber-600',
   'COMPLETED': 'bg-teal-50 text-teal-600',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
 };

 return (
  <div className="space-y-6 max-w-3xl mx-auto w-full">
   {/* Header Card */}
   <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
    <div>
     <h2 className="text-xl font-black text-slate-800">
      {language === 'te' ? 'ఫీల్డ్ డ్యూటీ' : 'Field Duty'}
     </h2>
     <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
      {session ? (isActive ? 'Duty Active' : 'Duty Completed') : 'Not Started'}
     </p>
    </div>

    <div>
     {!session ? (
      <button
       onClick={startDuty}
       disabled={sessionLoading}
       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20 cursor-pointer"
      >
       <Navigation2 className="w-5 h-5"/> Start Field Duty
      </button>
     ) : isActive ? (
      <button
       onClick={handleEndDuty}
       disabled={sessionLoading}
       className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-rose-600/20 cursor-pointer"
      >
       End Duty
      </button>
     ) : (
      <div className="bg-teal-50 text-teal-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
       <CheckCircle2 className="w-5 h-5"/> Duty Completed
      </div>
     )}
    </div>
   </div>

   {/* Visits List */}
   <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
    <div className="flex justify-between items-center mb-6">
     <h3 className="font-bold text-lg text-slate-800">Today's Visits</h3>
     {isActive && (
      <button
       onClick={() => setShowRequestModal(true)}
       className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
      >
       <Plus className="w-4 h-4"/> Request Visit
      </button>
     )}
    </div>

    {visitsLoading && visits.length === 0 ? (
     <div className="text-center py-10 text-slate-400 font-bold">Loading visits...</div>
    ) : visits.length === 0 ? (
     <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100/50">
      <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
      <p className="text-slate-500 font-medium">No visits scheduled.</p>
     </div>
    ) : (
     <>
      <div className="h-72 mb-6 rounded-2xl overflow-hidden border border-slate-200">
       
      </div>
      <div className="grid gap-4">
       {visits.map(visit => {
        const isCurrentEnRoute = visit.status === 'EN_ROUTE';
        const canDropPin = ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(visit.status);
        const visitRoute = routes[visit.id];

        return (
         <div
          key={visit.id}
          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-teal-600 hover:shadow-md transition-all space-y-3"
         >
          {/* Top Row: Title + Status */}
          <div
           onClick={() => setSelectedVisitId(visit.id)}
           className="flex justify-between items-start cursor-pointer"
          >
           <div>
            <h4 className="font-bold text-slate-800">{visit.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{visit.patientName || visit.visitType.replace('_', ' ')}</p>
            {visit.assignedAddress && (
             <p className="text-[10px] font-medium text-slate-400 mt-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400"/> {visit.assignedAddress}
             </p>
            )}
            {visitRoute && (
             <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
               🚗 {(visitRoute.distanceMeters / 1000).toFixed(1)} km
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
               ⏱ ~{Math.ceil(visitRoute.durationSeconds / 60)} mins
              </span>
             </div>
            )}
           </div>
           <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${getStatusBadge(visit.status)}`}>
             {visit.status}
            </span>
           </div>
          </div>
          {/* Action Buttons (Navigate / Drop Pin / Details) */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">           {/* Drop Location Pin Button */}
           {canDropPin && (
            <button
             type="button"
             onClick={(e) => {
              e.stopPropagation();
              setDropPinVisit(visit);
             }}
             className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-teal-200 cursor-pointer"
            >
             <MapPin className="w-3.5 h-3.5 text-teal-600"/> Drop Pin
            </button>
           )}

           <button
            type="button"
            onClick={() => setSelectedVisitId(visit.id)}
            className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors border border-slate-200 cursor-pointer ml-auto"
           >
            Details
           </button>
          </div>
         </div>
        );
       })}
      </div>
     </>
    )}
   </div>

   {showRequestModal && (
    <RequestVisitModal
     language={language}
     onClose={() => setShowRequestModal(false)}
     onSubmit={createVisitRequest}
    />
   )}

   {selectedVisitId && (
    <VisitDetailSheet
     language={language}
     visit={visits.find(v => v.id === selectedVisitId)!}
     onClose={() => setSelectedVisitId(null)}
     onUpdateStatus={handleUpdateStatus}
    />
   )}


   {/* Standalone Drop Pin Modal */}
   {dropPinVisit && (
    <DropPinModal
     currentLat={dropPinVisit.assignedLatitude ?? fieldOpsConfig.defaultCenter[0]}
     currentLng={dropPinVisit.assignedLongitude ?? fieldOpsConfig.defaultCenter[1]}
     visitTitle={dropPinVisit.title}
     onClose={() => setDropPinVisit(null)}
     onSavePin={handleSavePin}
    />
   )}
  </div>
 );
}
