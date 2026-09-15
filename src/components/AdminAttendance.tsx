import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, AlertCircle, ArrowLeft, Users, Check, Moon, HelpCircle, MapPin, Clock, FileWarning, CheckCircle, XCircle } from 'lucide-react';
import { Language, Employee, AttendanceStatus, Branch, isExemptAdmin } from '../types';
import { translations } from '../translations';
import { generateMonthOptions, formatMonth } from '../lib/utils';
import LocationPinTimeline from './LocationPinTimeline';

interface AdminAttendanceProps {
 language: Language;
 employees: Employee[];
 onUpdateAttendance: (empId: string, date: string, status: AttendanceStatus) => void;
 onForceCloseSession?: (empId: string, date: string, time?: string) => void;
}

export default function AdminAttendance({ language, employees, onUpdateAttendance, onForceCloseSession }: AdminAttendanceProps) {
 const t = translations[language];

 // Filters
 const monthOptions = generateMonthOptions(2018, 1);
 const [selectedMonth, setSelectedMonth] = useState(monthOptions[0] || '2026-07');
 const [attendanceBranchFilter, setAttendanceBranchFilter] = useState<Branch | 'all'>('all');
 const [editTarget, setEditTarget] = useState<{empId: string, date: string, status: AttendanceStatus | 'blank'} | null>(null);

 const todayStr = new Date().toISOString().split('T')[0];

 // Live timer for tracking hours today
 const [now, setNow] = useState(new Date());
 useEffect(() => {
  const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
  return () => clearInterval(timer);
 }, []);

 const calculateLiveHours = (emp: Employee) => {
  const todayLogs = emp.checkInLogs?.filter(l => l.date === todayStr) || [];
  if (todayLogs.length === 0) return null;
  
  let totalSecs = 0;
  let isCurrentlyActive = false;
  
  todayLogs.forEach(log => {
   if (log.checkInTime) {
    const [h1, m1, s1] = log.checkInTime.split(':').map(Number);
    const sec1 = h1*3600 + m1*60 + s1;
    let sec2 = 0;
    if (log.checkOutTime) {
     const [h2, m2, s2] = log.checkOutTime.split(':').map(Number);
     sec2 = h2*3600 + m2*60 + s2;
    } else {
     isCurrentlyActive = true;
     sec2 = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    }
    if (sec2 > sec1) {
     totalSecs += (sec2 - sec1);
    }
   }
  });

  if (totalSecs <= 0) return null;

  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  
  return {
   text: `${h}h ${m}m`,
   isActive: isCurrentlyActive
  };
 };

 // Branch/zone-scoped employees
 const filteredEmployees = employees.filter(e => 
  attendanceBranchFilter === 'all' ||
  e.branch === attendanceBranchFilter ||
  (attendanceBranchFilter === 'ap_zone' && (e.zone === 'AP' || e.branch === 'ap_zone')) ||
  (attendanceBranchFilter === 'ts_zone' && (e.zone === 'TS' || e.branch === 'ts_zone')) ||
  (attendanceBranchFilter === 'corporate' && (e.zone === 'Corporate' || e.branch === 'corporate'))
 );

 // Calculate statistics for today across the scoped team (excluding exempt corporate admins)
 const totalEmployees = filteredEmployees.filter(e => !isExemptAdmin(e)).length;
 
 const presentToday = filteredEmployees.filter(e => {
  if (isExemptAdmin(e)) return false;
  const todayRec = e.attendanceRecords?.find(r => r.date === todayStr);
  return e.isCheckedIn || (todayRec && todayRec.status === 'present');
 }).length;

 const leaveToday = filteredEmployees.filter(e => {
  if (isExemptAdmin(e)) return false;
  const todayRec = e.attendanceRecords?.find(r => r.date === todayStr);
  return todayRec && todayRec.status === 'leave';
 }).length;

 const absentToday = Math.max(0, totalEmployees - presentToday - leaveToday);

 // Generate days in the selected month
 const [yearStr, monthStr] = selectedMonth.split('-');
 const year = Number(yearStr);
 const monthIdx = Number(monthStr) - 1; // 0-indexed
 const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

 const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

 const formatDayNum = (dayNum: number) => {
  return `${selectedMonth}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
 };

 const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white',
  absent: 'bg-rose-500 text-white',
  'half-day': 'bg-amber-500 text-white',
  leave: 'bg-blue-500 text-white',
  holiday: 'bg-slate-100 text-slate-400',
  mispunch: 'bg-teal-500 text-white',
  weekoff: 'bg-slate-200 text-slate-500'
 };

 const localizedText = {
  en: {
   title:"Company-Wide Attendance Grid",
   subtitle:"Track staff availability and monthly participation rates across all departments.",
   statsHeader:"Today's Status Board",
   matrixHeader:"Attendance Matrix",
   activeTeam:"Active Team",
   presentToday:"Present Today",
   onLeaveToday:"On Leave Today",
   absentToday:"Absent/No Show",
   employeeCol:"Employee Name",
   legendTitle:"Color Legend",
   legendPresent:"Present",
   legendAbsent:"Absent",
   legendHalf:"Half Day",
   legendLeave:"Approved Leave",
   legendHoliday:"Weekend/Holiday",
  },
  te: {
   title:"కంపెనీ హాజరు నివేదిక",
   subtitle:"ఉద్యోగుల రోజువారీ హాజరు మరియు నెలవారీ హాజరు గ్రిడ్ సమాచారం ఇక్కడ చూడండి.",
   statsHeader:"ఈరోజు హాజరు సారాంశం",
   matrixHeader:"హాజరు గ్రిడ్ వివరాలు",
   activeTeam:"కంపెనీ సిబ్బంది",
   presentToday:"ఈరోజు వచ్చినవారు",
   onLeaveToday:"సెలవులో ఉన్నవారు",
   absentToday:"హాజరుకాని వారు",
   employeeCol:"ఉద్యోగి పేరు",
   legendTitle:"రంగుల వివరణ (Legend)",
   legendPresent:"హాజరయ్యారు",
   legendAbsent:"రాలేదు (Absent)",
   legendHalf:"హాఫ్ డే (Half Day)",
   legendLeave:"సెలవు (Approved Leave)",
   legendHoliday:"వీకెండ్ / సెలవుదినం",
  }
 }[language];

 return (
  <div id="admin-attendance-container"className="space-y-6 animate-fadeIn">
   
   {/* 1. Header */}
   <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
    <div>
     <h2 className="text-xl font-bold font-display text-slate-800">
      {localizedText.title}
     </h2>
     <p className="text-xs text-slate-400 mt-1">
      {localizedText.subtitle}
     </p>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
     {/* Branch Filter Selector */}
     <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
      <button
       onClick={() => setAttendanceBranchFilter('all')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        attendanceBranchFilter === 'all'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       All Territories
      </button>
      <button
       onClick={() => setAttendanceBranchFilter('ap_zone')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        attendanceBranchFilter === 'ap_zone'
         ? 'bg-white text-emerald-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       AP Zone
      </button>
      <button
       onClick={() => setAttendanceBranchFilter('ts_zone')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        attendanceBranchFilter === 'ts_zone'
         ? 'bg-white text-cyan-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       TS Zone
      </button>
      <button
       onClick={() => setAttendanceBranchFilter('corporate')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        attendanceBranchFilter === 'corporate'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       Corporate
      </button>
     </div>

     {/* Month Picker Selector */}
     <div className="flex items-center gap-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
       {t.monthSelector ||"Select Month"}:
      </label>
      <select
       value={selectedMonth}
       onChange={(e) => setSelectedMonth(e.target.value)}
       className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 cursor-pointer"
      >
       {monthOptions.map(month => (
        <option key={month} value={month}>
         {formatMonth(month, language)}
        </option>
       ))}
      </select>
     </div>
    </div>
   </div>

   {/* 2. Today's Dashboard Counters */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
    {/* Total Staff */}
    <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{localizedText.activeTeam}</span>
     <div className="mt-2 flex items-baseline gap-1">
      <span className="text-2xl font-black font-mono text-slate-800">{totalEmployees.toString().padStart(2, '0')}</span>
      <span className="text-xs text-slate-400">{language === 'te' ? 'సిబ్బంది' : 'members'}</span>
     </div>
    </div>

    {/* Present Today */}
    <div className="bg-white border border-emerald-100 rounded-[24px] p-5 shadow-sm">
     <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">{localizedText.presentToday}</span>
     <div className="mt-2 flex items-baseline gap-1">
      <span className="text-2xl font-black font-mono text-emerald-800">{(presentToday).toString().padStart(2, '0')}</span>
      <span className="text-xs text-emerald-500">/ {totalEmployees}</span>
     </div>
    </div>

    {/* Leave Today */}
    <div className="bg-white border border-blue-100 rounded-[24px] p-5 shadow-sm">
     <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">{localizedText.onLeaveToday}</span>
     <div className="mt-2 flex items-baseline gap-1">
      <span className="text-2xl font-black font-mono text-blue-800">{leaveToday.toString().padStart(2, '0')}</span>
      <span className="text-xs text-blue-500">{language === 'te' ? 'సెలవు' : 'leaves'}</span>
     </div>
    </div>

    {/* Absent Today */}
    <div className="bg-white border border-rose-100 rounded-[24px] p-5 shadow-sm">
     <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">{localizedText.absentToday}</span>
     <div className="mt-2 flex items-baseline gap-1">
      <span className="text-2xl font-black font-mono text-rose-800">{absentToday.toString().padStart(2, '0')}</span>
      <span className="text-xs text-rose-500">{language === 'te' ? 'రాలేదు' : 'absent'}</span>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
    {/* 3. The Grand Matrix Roster */}
    <h3 className="text-base font-bold text-slate-800">
     {localizedText.matrixHeader} ({selectedMonth})
    </h3>

    {/* Scrollable table container */}
    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
     <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
      <thead>
       <tr className="bg-slate-50 border-b border-slate-100">
        <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-44">{localizedText.employeeCol}</th>
        {daysArray.map(dayNum => (
         <th key={dayNum} className="p-1 text-[10px] font-bold font-mono text-center text-slate-400 w-7">
          {dayNum.toString().padStart(2, '0')}
         </th>
        ))}
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
       {filteredEmployees
        .filter(emp => !isExemptAdmin(emp))
        .map(emp => {
         const empBranch = emp.branch || 'visakhapatnam';
         return (
         <tr key={emp.id} className="hover:bg-slate-50/50">
          <td className="p-4 truncate">
           <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 leading-none">
             {emp.name}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
             emp.zone === 'AP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : emp.zone === 'TS' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
             {emp.zone ? `${emp.zone} Zone` : 'Corporate'}
            </span>
            {calculateLiveHours(emp) && (
             <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border ${calculateLiveHours(emp)?.isActive ? 'bg-teal-50 text-teal-600 border-teal-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              <Clock className="w-2.5 h-2.5"/>
              {calculateLiveHours(emp)?.text}
             </span>
            )}
           </div>
           <span className="text-[9px] text-slate-400 font-medium font-mono mt-1 block">{emp.id}</span>
          </td>
          
          {daysArray.map(dayNum => {
           const dayStr = formatDayNum(dayNum);
           const rec = emp.attendanceRecords.find(r => r.date === dayStr);
           const status: AttendanceStatus | 'blank' = rec ? rec.status : 'blank';
           
           // Render grid square
           return (
            <td key={dayNum} className="p-1 text-center"onClick={() => setEditTarget({empId: emp.id, date: dayStr, status})}>
             <div 
              className={`w-5 h-5 mx-auto rounded-sm flex items-center justify-center text-[8px] font-bold font-sans cursor-pointer hover:ring-2 hover:ring-teal-400 ${
               status === 'present' ? 'bg-emerald-500 text-white' :
               status === 'absent' ? 'bg-rose-500 text-white' :
               status === 'leave' ? 'bg-blue-500 text-white' :
               status === 'half-day' ? 'bg-amber-500 text-white' :
               status === 'mispunch' ? 'bg-teal-500 text-white' :
               status === 'weekoff' ? 'bg-slate-200 text-slate-500' :
               status === 'holiday' ? 'bg-slate-100 text-slate-400' :
               'bg-slate-50 text-transparent'
              }`}
              title={`${emp.name}: ${dayStr} - ${status.toUpperCase()}`}
             >
              {status === 'present' ? 'P' : 
               status === 'absent' ? 'A' : 
               status === 'leave' ? 'L' : 
               status === 'half-day' ? 'H' : 
               status === 'mispunch' ? 'M' :
               status === 'weekoff' ? 'WO' :
               status === 'holiday' ? 'W' : '-'}
             </div>
            </td>
           );
          })}
         </tr>
         );
        })}
      </tbody>
     </table>
    </div>

    {/* Color Legend */}
    <div className="pt-4 border-t border-slate-50">
     <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{localizedText.legendTitle}</p>
     <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-emerald-500 rounded-xs flex items-center justify-center text-[8px] text-white font-black">P</div>
       <span>{localizedText.legendPresent}</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-rose-500 rounded-xs flex items-center justify-center text-[8px] text-white font-black">A</div>
       <span>{localizedText.legendAbsent}</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-amber-500 rounded-xs flex items-center justify-center text-[8px] text-white font-black">H</div>
       <span>{localizedText.legendHalf}</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-blue-500 rounded-xs flex items-center justify-center text-[8px] text-white font-black">L</div>
       <span>{localizedText.legendLeave}</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-slate-100 rounded-xs flex items-center justify-center text-[8px] text-slate-400 font-black">W</div>
       <span>{localizedText.legendHoliday}</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-teal-500 rounded-xs flex items-center justify-center text-[8px] text-white font-black">M</div>
       <span>Mispunch</span>
      </div>
      <div className="flex items-center gap-2">
       <div className="w-4 h-4 bg-slate-200 rounded-xs flex items-center justify-center text-[8px] text-slate-500 font-black">WO</div>
       <span>Weekoff</span>
      </div>
     </div>
    </div>
   </div>

   {/* Edit Modal */}
   {editTarget && (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"onClick={() => setEditTarget(null)}>
     <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-md animate-scaleUp"onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
       <UserCheck className="w-5 h-5 text-teal-600"/>
       Update Attendance
      </h3>
      
      <p className="text-sm font-semibold text-slate-600 mb-4 border-b pb-2">
       {employees.find(e => e.id === editTarget.empId)?.name} • {editTarget.date}
      </p>

      {(() => {
       const emp = employees.find(e => e.id === editTarget.empId);
       const log = emp?.checkInLogs.find(l => l.date === editTarget.date);
       
       if (!log && !emp?.attendanceRecords.find(r => r.date === editTarget.date)?.photoUrl) return null;
       
       const isMedicalCamp = log?.checkInLocation?.toLowerCase().includes('camp') || log?.checkInLocation?.toLowerCase().includes('health');
       const isOpenSession = log && log.checkInTime && !log.checkOutTime;

       return (
        <div className="mb-4">
         <div className={`grid ${log?.photoUrl && log?.checkOutPhotoUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
          
          {/* PUNCH IN COLUMN */}
          {log?.photoUrl && (
           <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center border border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
             <MapPin className="w-3 h-3 text-teal-600"/> Punch-In
            </p>
            
            <img src={log.photoUrl} alt="Punch-In Proof"className="w-full aspect-square object-cover rounded-xl bg-black shadow-sm mb-2"/>
            
            {log.checkInTime && <p className="text-[10px] text-slate-800 font-black font-mono text-center">{log.checkInTime}</p>}
            
            {log.checkInLocation && (
             <p className={`text-[9px] font-bold text-center mt-1 leading-tight ${isMedicalCamp ? 'text-indigo-600' : 'text-slate-500'}`}>
              {log.checkInLocation}
             </p>
            )}

            {log.punchNote && (
             <div className="mt-2 w-full p-1.5 bg-amber-50 rounded border border-amber-100">
              <p className="text-[9px] text-amber-800 text-center font-medium italic">
               <span className="font-bold">Note:</span> {log.punchNote}
              </p>
             </div>
            )}
           </div>
          )}

          {/* PUNCH OUT COLUMN */}
          {log?.checkOutPhotoUrl && (
           <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center border border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
             <MapPin className="w-3 h-3 text-rose-400"/> Punch-Out
            </p>
            
            <img src={log.checkOutPhotoUrl} alt="Punch-Out Proof"className="w-full aspect-square object-cover rounded-xl bg-black shadow-sm mb-2"/>
            
            {log.checkOutTime && <p className="text-[10px] text-slate-800 font-black font-mono text-center">{log.checkOutTime}</p>}
            
            {log.checkOutLocation && (
             <p className={`text-[9px] font-bold text-center mt-1 leading-tight ${log.checkOutLocation?.toLowerCase().includes('camp') ? 'text-indigo-600' : 'text-slate-500'}`}>
              {log.checkOutLocation}
             </p>
            )}
           </div>
          )}
          
          {/* OPEN SESSION FALLBACK */}
          {isOpenSession && (
           <div className="bg-amber-50 p-3 rounded-xl flex flex-col items-center justify-center border border-amber-100 text-center">
            <AlertCircle className="w-5 h-5 text-amber-500 mb-2"/>
            <p className="text-[10px] text-amber-800 font-bold mb-2">Incomplete Session</p>
            <p className="text-[9px] text-amber-700 leading-tight mb-3">No punch-out recorded.</p>
            {onForceCloseSession && (
             <button
              onClick={() => {
               onForceCloseSession(editTarget.empId, editTarget.date);
               setEditTarget(null);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-colors w-full"
             >
              Force Close (6:00 PM)
             </button>
            )}
           </div>
          )}

          {/* Fallback for old AttendanceRecord photoUrl */}
          {!log?.photoUrl && emp?.attendanceRecords.find(r => r.date === editTarget.date)?.photoUrl && (
           <div className="bg-slate-50 p-2 rounded-xl flex flex-col items-center border border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-center">Photo Proof</p>
            <img src={emp.attendanceRecords.find(r => r.date === editTarget.date)?.photoUrl} alt="Proof"className="w-full max-h-48 object-cover rounded-xl bg-black shadow-sm"/>
           </div>
          )}
         </div>
        </div>
       );
      })()}
      
      <div className="grid grid-cols-2 gap-3 mb-6">
       {(['present', 'absent', 'half-day', 'leave', 'holiday', 'mispunch', 'weekoff'] as AttendanceStatus[]).map(statusOption => (
        <button
         key={statusOption}
         onClick={() => {
          onUpdateAttendance(editTarget.empId, editTarget.date, statusOption);
          setEditTarget(null);
         }}
         className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
          editTarget.status === statusOption 
           ? 'bg-teal-50 border-teal-200 text-teal-700 ring-2 ring-teal-500/20' 
           : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
         }`}
        >
         <span className="text-xs font-bold uppercase tracking-wider">{statusOption}</span>
        </button>
       ))}
      </div>

      <div className="flex justify-end gap-3">
       <button
        onClick={() => setEditTarget(null)}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
       >
        Cancel
       </button>
      </div>
     </div>
    </div>
   )}

  </div>
 );
}
