import React from 'react';
import { Gift, Calendar, PartyPopper } from 'lucide-react';
import { Employee, Holiday } from '../types';

interface TickerAlertProps {
  employees: Employee[];
  holidayEve?: Holiday | null;
  todayHoliday?: Holiday | null;
}

export default function TickerAlert({ employees, holidayEve, todayHoliday }: TickerAlertProps) {
  // Find birthdays today
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const birthdaysToday = employees.filter(emp => {
    if (!emp.dob) return false;
    const dob = new Date(emp.dob);
    return dob.getMonth() === todayMonth && dob.getDate() === todayDate && emp.status !== 'inactive';
  });

  const messages: Array<{ text: string; type: string; icon: React.ReactNode }> = [];

  // 1. Holiday Today Alert
  if (todayHoliday) {
    messages.push({
      text: `🎉 Today is ${todayHoliday.name} — Happy Holiday!`,
      type: 'todayHoliday',
      icon: <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce" />
    });
  }

  // 2. Holiday Eve Alert (1 day before)
  if (holidayEve) {
    messages.push({
      text: `🗓 Tomorrow is ${holidayEve.name} (${holidayEve.day}) — Official Holiday!`,
      type: 'holidayEve',
      icon: <Calendar className="w-4 h-4 text-emerald-400" />
    });
  }

  // 3. Birthdays
  birthdaysToday.forEach(emp => {
    messages.push({
      text: `Happy Birthday, ${emp.name}! 🎂`,
      type: 'birthday',
      icon: <Gift className="w-4 h-4 text-amber-500" />
    });
  });

  if (messages.length === 0) return null;

  return (
    <div className="w-full bg-slate-900 text-white overflow-hidden relative flex items-center h-10 no-print rounded-2xl mb-6 shadow-sm border border-slate-800">
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-slate-900 to-transparent w-8 pointer-events-none"></div>
      
      <div className="flex whitespace-nowrap animate-marquee items-center gap-12 px-4 text-xs font-bold tracking-wide">
        {/* We repeat the items a few times to create a seamless scrolling effect */}
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            {messages.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {msg.icon}
                <span
                  className={
                    msg.type === 'todayHoliday'
                      ? 'text-amber-300 font-black'
                      : msg.type === 'holidayEve'
                      ? 'text-emerald-300 font-bold'
                      : msg.type === 'birthday'
                      ? 'text-amber-400'
                      : 'text-blue-300'
                  }
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-slate-900 to-transparent w-8 pointer-events-none"></div>
    </div>
  );
}
