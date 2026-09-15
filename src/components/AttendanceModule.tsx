import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, XCircle, Moon, HelpCircle } from 'lucide-react';
import { Language, AttendanceRecord, AttendanceStatus } from '../types';
import { translations } from '../translations';

interface AttendanceModuleProps {
 language: Language;
 attendanceRecords: AttendanceRecord[];
}

export default function AttendanceModule({ language, attendanceRecords }: AttendanceModuleProps) {
 const t = translations[language];

 // We use standard Date object to manage the currently displayed month
 const [currentDate, setCurrentDate] = useState(new Date());

 const teluguMonths = [
 "జనవరి","ఫిబ్రవరి","మార్చి","ఏప్రిల్","మే","జూన్", 
 "జూలై","ఆగస్టు","సెప్టెంబర్","అక్టోబర్","నవంబర్","డిసెంబర్"
 ];

 const currentYear = currentDate.getFullYear();
 const currentMonth = currentDate.getMonth();

 const monthNameEN = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
 const monthNameTE = `${teluguMonths[currentMonth]} ${currentYear}`;

 // Go previous / next infinitely
 const handlePrevMonth = () => {
  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
 };

 const handleNextMonth = () => {
  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
 };

 // Filter records for the selected month/year
 const getRecordForDay = (dayNum: number): AttendanceRecord | undefined => {
  const formattedDay = dayNum < 10 ? '0' + dayNum : dayNum;
  const formattedMonth = (currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1);
  const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
  return attendanceRecords.find(r => r.date === dateStr);
 };

 // Total days in the selected month
 const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
 // First day of week index (0 = Sun, 1 = Mon, etc.)
 const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

 // Statistics for this month
 const filteredRecords = attendanceRecords.filter(r => {
  const [yr, mn] = r.date.split('-').map(Number);
  return yr === currentYear && (mn - 1) === currentMonth;
 });

 const stats = {
  present: filteredRecords.filter(r => r.status === 'present').length,
  absent: filteredRecords.filter(r => r.status === 'absent').length,
  halfDay: filteredRecords.filter(r => r.status === 'half-day').length,
  leave: filteredRecords.filter(r => r.status === 'leave').length,
  holiday: filteredRecords.filter(r => r.status === 'holiday').length
 };

 // Build grid arrays
 const daysOfWeekLabels = language === 'te' 
  ? ["ఆది","సోమ","మంగళ","బుధ","గురు","శుక్ర","శని"]
  : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

 const calendarGridCells = [];
 // Empty pre-padding cells
 for (let i = 0; i < firstDayOfWeek; i++) {
  calendarGridCells.push(null);
 }
 // Actual day cells
 for (let d = 1; d <= totalDaysInMonth; d++) {
  calendarGridCells.push(d);
 }

 // Get status color styles
 const getStatusStyles = (status: AttendanceStatus) => {
  switch (status) {
   case 'present':
    return {
     bg: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
     dot: 'bg-emerald-500',
     label: t.statusPresent
    };
   case 'absent':
    return {
     bg: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100',
     dot: 'bg-rose-500',
     label: t.statusAbsent
    };
   case 'half-day':
    return {
     bg: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
     dot: 'bg-amber-500',
     label: t.statusHalfDay
    };
   case 'leave':
    return {
     bg: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
     dot: 'bg-indigo-500',
     label: t.statusLeave
    };
   case 'holiday':
    return {
     bg: 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100/80',
     dot: 'bg-slate-400',
     label: t.statusHoliday
    };
   default:
    return {
     bg: 'bg-white text-slate-400 border-slate-100',
     dot: 'bg-slate-300',
     label: 'Unknown'
    };
  }
 };

 return (
   <div id="attendance-module"className="space-y-6">
    {/* Month Switcher & Statistics Summary */}
    <div id="attendance-summary-card"className="bg-white rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
     
     {/* Month Selector Controls */}
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 mb-5 gap-4">
      <div className="flex items-center gap-2">
       <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"/>
       <h2 className="text-lg sm:text-xl font-bold font-display text-slate-800">
        {language === 'te' ? monthNameTE : monthNameEN}
       </h2>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
       <button
        id="prev-month-btn"
        onClick={handlePrevMonth}
        className="flex-1 sm:flex-none flex justify-center items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
       >
        <ChevronLeft className="w-3.5 h-3.5"/>
        <span className="truncate">{t.prevMonth.split('|')[0].trim()}</span>
       </button>
       <button
        id="next-month-btn"
        onClick={handleNextMonth}
        className="flex-1 sm:flex-none flex justify-center items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
       >
        <span className="truncate">{t.nextMonth.split('|')[0].trim()}</span>
        <ChevronRight className="w-3.5 h-3.5"/>
       </button>
      </div>
     </div>

    {/* 4 Summary Cards */}
    <div id="stats-dashboard-grid"className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
     <div className="bg-emerald-50/40 border border-emerald-50 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className="bg-emerald-100 text-emerald-700 p-2 sm:p-2.5 rounded-xl shrink-0">
       <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5"/>
      </div>
      <div className="min-w-0">
       <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider truncate">{t.summaryPresent}</span>
       <span className="text-xl sm:text-2xl font-black font-mono text-emerald-800">{stats.present}</span>
      </div>
     </div>

     <div className="bg-rose-50/40 border border-rose-50 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className="bg-rose-100 text-rose-700 p-2 sm:p-2.5 rounded-xl shrink-0">
       <XCircle className="w-4 h-4 sm:w-5 sm:h-5"/>
      </div>
      <div className="min-w-0">
       <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider truncate">{t.summaryAbsent}</span>
       <span className="text-xl sm:text-2xl font-black font-mono text-rose-800">{stats.absent}</span>
      </div>
     </div>

     <div className="bg-amber-50/40 border border-amber-50 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className="bg-amber-100 text-amber-700 p-2 sm:p-2.5 rounded-xl shrink-0">
       <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5"/>
      </div>
      <div className="min-w-0">
       <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider truncate">{t.summaryHalf}</span>
       <span className="text-xl sm:text-2xl font-black font-mono text-amber-800">{stats.halfDay}</span>
      </div>
     </div>

     <div className="bg-indigo-50/40 border border-indigo-50 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className="bg-indigo-100 text-indigo-700 p-2 sm:p-2.5 rounded-xl shrink-0">
       <Moon className="w-4 h-4 sm:w-5 sm:h-5"/>
      </div>
      <div className="min-w-0">
       <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider truncate">{t.summaryLeave}</span>
       <span className="text-xl sm:text-2xl font-black font-mono text-indigo-800">{stats.leave}</span>
      </div>
     </div>
    </div>
   </div>

   {/* Interactive Calendar Grid */}
   <div id="attendance-calendar-grid"className="bg-white rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-100">
    <div className="flex items-center gap-2 mb-6 pb-2">
     <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"/>
     <h3 className="text-lg font-bold font-display text-slate-800">
      {t.attendTitle} - {language === 'te' ? monthNameTE : monthNameEN}
     </h3>
    </div>

    {/* Legend */}
    <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-50 text-xs text-slate-500 font-medium">
     <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"/>
      <span>{t.statusPresent}</span>
     </div>
     <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"/>
      <span>{t.statusAbsent}</span>
     </div>
     <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"/>
      <span>{t.statusHalfDay}</span>
     </div>
     <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500"/>
      <span>{t.statusLeave}</span>
     </div>
     <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400"/>
      <span>{t.statusHoliday}</span>
     </div>
    </div>

    {/* The Grid */}
    <div className="grid grid-cols-7 gap-2 md:gap-3">
     {/* Days of Week Headers */}
     {daysOfWeekLabels.map((dayLabel, idx) => (
      <div key={idx} className="text-center text-xs font-semibold text-slate-400 uppercase py-2">
       {dayLabel}
      </div>
     ))}

     {/* Grid Cells */}
     {calendarGridCells.map((cellValue, idx) => {
      if (cellValue === null) {
       return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/30 rounded-xl"/>;
      }

      const record = getRecordForDay(cellValue);
      
      const dateObj = new Date(currentYear, currentMonth, cellValue);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let activeStatus: AttendanceStatus | 'none' = 'none';
      let noteText = record?.note || '';
      
      if (record) {
       activeStatus = record.status;
      } else if (dateObj > today) {
       // Future dates
       activeStatus = 'none';
      } else if (dateObj.getTime() === today.getTime()) {
       // Today, if no record yet, show absent/holiday
       activeStatus = isWeekend ? 'holiday' : 'absent';
       if (isWeekend) noteText = 'Weekend';
      } else {
       // Past dates before launch (before today) with no record should be blank
       activeStatus = 'none';
      }
      
      // If none, don't show any background style
      let styleProps = activeStatus !== 'none' 
       ? getStatusStyles(activeStatus as AttendanceStatus)
       : { bg: 'bg-white text-slate-400 border-slate-50', dot: 'hidden', label: '' };

      return (
       <div
        key={`day-${cellValue}`}
        className={`relative group aspect-square flex flex-col justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer ${styleProps.bg}`}
       >
        {/* Day number */}
        <span className="font-mono text-xs font-bold leading-none">
         {cellValue}
        </span>

        {/* Micro Dot indicator */}
        <span className={`w-1.5 h-1.5 rounded-full ${styleProps.dot} self-end`} />

        {/* Tooltip on Hover / Click */}
        {activeStatus !== 'none' && (
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center bg-slate-800 text-white text-[10px] py-2 px-3 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none transition-all">
          {record?.photoUrl && (
           <img src={record.photoUrl} alt="Check In"className="w-16 h-16 rounded object-cover mb-2 border-2 border-slate-600"/>
          )}
          <p className="font-bold">{styleProps.label}</p>
          {noteText && <p className="opacity-80 mt-0.5">{noteText}</p>}
         </div>
        )}
       </div>
      );
     })}
    </div>
   </div>
  </div>
 );
}
