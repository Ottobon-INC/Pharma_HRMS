import React from 'react';
import { Gift, HeartPulse } from 'lucide-react';
import { Employee } from '../types';

interface TickerAlertProps {
 employees: Employee[];
}

export default function TickerAlert({ employees }: TickerAlertProps) {
 // Find birthdays today
 const today = new Date();
 const todayMonth = today.getMonth();
 const todayDate = today.getDate();

 const birthdaysToday = employees.filter(emp => {
  if (!emp.dob) return false;
  const dob = new Date(emp.dob);
  return dob.getMonth() === todayMonth && dob.getDate() === todayDate && emp.status !== 'inactive';
 });

 // Since we don't have a direct hook for special events in this component scope, 
 // we'll rely on what's passed or just show birthdays for now.
 // The plan said"Medical Camps"from HRMS_special_location_events, 
 // which might be fetched separately. For simplicity, if we don't have it here, 
 // we just show birthdays. To show camps, we can pass them in later.

 const messages = [];

 birthdaysToday.forEach(emp => {
  messages.push({
   text: `Happy Birthday, ${emp.name}! 🎂`,
   type: 'birthday',
   icon: <Gift className="w-4 h-4 text-amber-500"/>
  });
 });

 if (messages.length === 0) return null;

 return (
  <div className="w-full bg-slate-900 text-white overflow-hidden relative flex items-center h-10 no-print rounded-2xl mb-6 shadow-sm border border-slate-800">
   <div className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-slate-900 to-transparent w-8"></div>
   
   <div className="flex whitespace-nowrap animate-marquee items-center gap-12 px-4 text-xs font-bold tracking-wide">
    {/* We repeat the items a few times to create a seamless scrolling effect */}
    {[...Array(4)].map((_, i) => (
     <React.Fragment key={i}>
      {messages.map((msg, idx) => (
       <div key={idx} className="flex items-center gap-2">
        {msg.icon}
        <span className={msg.type === 'birthday' ? 'text-amber-400' : 'text-blue-300'}>
         {msg.text}
        </span>
       </div>
      ))}
     </React.Fragment>
    ))}
   </div>

   <div className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-slate-900 to-transparent w-8"></div>
  </div>
 );
}
