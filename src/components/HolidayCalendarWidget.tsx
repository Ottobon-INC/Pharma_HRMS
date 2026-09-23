import React from 'react';
import { Calendar, Sparkles, Sun, Clock, PartyPopper, CheckCircle } from 'lucide-react';
import { Holiday } from '../types';
import { getDaysUntil } from '../lib/services/holiday-service';

export interface HolidayCalendarWidgetProps {
  mode?: 'compact' | 'full';
  holidays: Holiday[];
  todayHoliday: Holiday | null;
  nextHoliday: Holiday | null;
  isLoading?: boolean;
}

export default function HolidayCalendarWidget({
  mode = 'compact',
  holidays,
  todayHoliday,
  nextHoliday,
  isLoading = false
}: HolidayCalendarWidgetProps) {
  const isFull = mode === 'full';

  // Format month and day number from 'YYYY-MM-DD'
  const parseHolidayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return {
        monthShort: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        dayNum: day,
        year
      };
    }
    return { monthShort: '---', dayNum: '--', year: 2026 };
  };

  const getCountdownLabel = (holiday: Holiday) => {
    const days = getDaysUntil(holiday);
    if (days === 0) return { label: 'Today! 🎉', isUrgent: true, isToday: true };
    if (days === 1) return { label: 'Tomorrow', isUrgent: true, isToday: false };
    if (days > 1 && days <= 5) return { label: `In ${days} days`, isUrgent: true, isToday: false };
    if (days > 5) return { label: `In ${days} days`, isUrgent: false, isToday: false };
    return { label: 'Past', isUrgent: false, isToday: false };
  };

  if (isLoading && holidays.length === 0) {
    return (
      <div className={`bg-white shadow-sm border border-slate-100 animate-pulse ${isFull ? 'rounded-[24px] sm:rounded-[32px] p-6 sm:p-8' : 'rounded-3xl p-6 sm:p-8'}`}>
        <div className="h-5 w-40 bg-slate-200 rounded-md mb-4" />
        <div className="h-16 bg-slate-100 rounded-2xl mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-50 rounded-xl" />
          <div className="h-12 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  const nextDays = nextHoliday ? getDaysUntil(nextHoliday) : null;
  const isNextUrgent = nextDays !== null && nextDays >= 0 && nextDays <= 3;

  return (
    <div
      id="holiday-calendar-widget"
      className={`bg-white shadow-sm border border-slate-100 flex flex-col ${
        isFull
          ? 'rounded-[24px] sm:rounded-[32px] p-6 sm:p-8'
          : 'rounded-3xl p-6 sm:p-8'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              Holiday Calendar
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Year 2026 • {holidays.length} Holidays
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-teal-100">
          Official
        </span>
      </div>

      {/* Today is Holiday Alert Banner */}
      {todayHoliday && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/40 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Today's Holiday
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 truncate mt-0.5">
                {todayHoliday.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {todayHoliday.day} • {todayHoliday.type === 'sunday_compensatory' ? 'Compensatory Holiday' : 'Gazetted Holiday'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Upcoming Holiday Highlight Card */}
      {!todayHoliday && nextHoliday && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-teal-50/40 to-slate-50 border border-teal-100/70 relative overflow-hidden group">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Date Box */}
              {(() => {
                const { monthShort, dayNum } = parseHolidayDate(nextHoliday.date);
                return (
                  <div className="w-12 h-13 rounded-xl bg-white border border-teal-200/70 shadow-sm flex flex-col items-center justify-center shrink-0 p-1">
                    <span className="text-[9px] font-black text-teal-600 tracking-wider leading-none">
                      {monthShort}
                    </span>
                    <span className="text-base font-black text-slate-800 leading-tight">
                      {dayNum}
                    </span>
                  </div>
                );
              })()}

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Next Holiday
                </p>
                <h4 className="text-sm font-bold text-slate-800 truncate">
                  {nextHoliday.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {nextHoliday.day}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-tight ${
                  isNextUrgent
                    ? 'bg-amber-500 text-white shadow-sm animate-pulse'
                    : 'bg-white text-teal-700 border border-teal-200 shadow-2xs'
                }`}
              >
                <Clock className="w-3 h-3" />
                {nextDays === 1 ? 'Tomorrow' : nextDays === 0 ? 'Today' : `${nextDays}d away`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Full Holiday List (Always Visible, Inline Scrollable) */}
      <div className="flex-1">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            All Holidays (2026)
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {holidays.filter(h => getDaysUntil(h) >= 0).length} remaining
          </span>
        </div>

        <div
          className={`space-y-2 overflow-y-auto pr-1 ${
            isFull ? 'max-h-[380px]' : 'max-h-[290px]'
          }`}
          style={{ scrollbarWidth: 'thin' }}
        >
          {holidays.map((holiday) => {
            const { monthShort, dayNum } = parseHolidayDate(holiday.date);
            const countdown = getCountdownLabel(holiday);
            const isSundayHoliday = holiday.type === 'sunday_compensatory';
            const isPast = getDaysUntil(holiday) < 0;

            return (
              <div
                key={holiday.id || holiday.date}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  countdown.isToday
                    ? 'bg-amber-50/80 border-amber-200 shadow-xs'
                    : isPast
                    ? 'bg-slate-50/50 border-slate-100 opacity-60'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                {/* Date + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border text-center ${
                      countdown.isToday
                        ? 'bg-amber-500 text-white border-amber-400'
                        : isSundayHoliday
                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                        : isPast
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase leading-none">
                      {monthShort}
                    </span>
                    <span className="text-sm font-black leading-tight">
                      {dayNum}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5
                        className={`text-xs font-bold truncate leading-snug ${
                          countdown.isToday ? 'text-amber-900' : 'text-slate-800'
                        }`}
                      >
                        {holiday.name}
                      </h5>
                      {isSundayHoliday && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          <Sun className="w-2.5 h-2.5 text-amber-500" /> Sunday
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {holiday.day}
                    </p>
                  </div>
                </div>

                {/* Right Badge: Countdown or Past */}
                <div className="shrink-0 text-right">
                  {countdown.isToday ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                      Today!
                    </span>
                  ) : isPast ? (
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3 h-3 text-slate-300" /> Passed
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        countdown.isUrgent
                          ? 'bg-amber-100 text-amber-800 font-black'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {countdown.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
