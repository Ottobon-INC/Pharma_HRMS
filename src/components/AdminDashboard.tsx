import React, { useState, useEffect } from 'react';
import { ArrowRight, Users, CheckCircle, Clock, AlertCircle, MapPin, ChevronRight, Calendar, Sun, Moon } from 'lucide-react';
import { Language, Employee, LeaveRequest, isExemptAdmin } from '../types';
import { translations } from '../translations';
import TickerAlert from './TickerAlert';

interface AdminDashboardProps {
  language: Language;
  employees: Employee[];
  currentUser?: Employee;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboard({ language, employees, currentUser, setActiveTab }: AdminDashboardProps) {
  const t = translations[language];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); 
    
    return () => clearInterval(timer);
  }, []);

  // Calculate snapshot metrics
  const totalEmployees = employees.length;
  
  // Checking active today
  const checkedInToday = employees.filter(emp => emp.isCheckedIn).length;
  
  const inactiveEmployees = employees.filter(emp => emp.status === 'inactive').length;
  
  // Pending leaves across everyone
  const pendingRequests: { req: LeaveRequest; empName: string; empId: string }[] = [];
  employees.forEach(emp => {
    emp.leaveRequests.forEach(req => {
      if (req.status === 'pending') {
        pendingRequests.push({ req, empName: emp.name, empId: emp.id });
      }
    });
  });
  const pendingCount = pendingRequests.length;

  const localizedText = {
    en: {
      title: "Admin Management Dashboard",
      subtitle: "Orca Labs Pharmaceutical Operations & Field Force Overview",
      summaryCardTitle: "Admin Quick Snapshot",
      quickActionTitle: "Quick Management Actions",
      recentLeavesTitle: "Recent Pending Leaves Requiring Decision",
      allCheckedIn: "View who is active in the directory.",
      actionApprove: "Go to Leave Approvals",
      actionDirectory: "View Directory",
      actionAttendance: "View Company Attendance",
      actionFieldOps: "View Field Operations",
      activeLabel: "Checked In",
      onLeaveLabel: "On Leave",
      absentLabel: "Absent",
    },
    te: {
      title: "Admin Management Dashboard",
      subtitle: "Orca Labs Pharmaceutical Operations & Field Force Overview",
      summaryCardTitle: "Admin Quick Snapshot",
      quickActionTitle: "Quick Management Actions",
      recentLeavesTitle: "Recent Pending Leaves Requiring Decision",
      allCheckedIn: "View who is active in the directory.",
      actionApprove: "Go to Leave Approvals",
      actionDirectory: "View Directory",
      actionAttendance: "View Company Attendance",
      actionFieldOps: "View Field Operations",
      activeLabel: "Checked In",
      onLeaveLabel: "On Leave",
      absentLabel: "Absent",
      inactiveEmployees: "Inactive Staff",
      checkInFeedTitle: "Today's Live Check-In Feed",
      noCheckIns: "No staff checked in yet today.",
    }
  }[language];

  // Get today's date string
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Collect today's check-ins with location
  const todaysCheckIns = employees
    .map(emp => {
      const todayLog = emp.checkInLogs.find(log => log.date === todayStr);
      return {
        emp,
        log: todayLog
      };
    })
    .filter(item => item.log && item.log.checkInTime)
    .sort((a, b) => (b.log!.checkInTime > a.log!.checkInTime ? 1 : -1));

  const currentHour = new Date().getHours();
  let greeting = 'Good Evening';
  let GreetingIcon = Moon;
  let iconColor = 'text-indigo-500';

  if (currentHour < 12) {
    greeting = 'Good Morning';
    GreetingIcon = Sun;
    iconColor = 'text-yellow-500';
  } else if (currentHour < 17) {
    greeting = 'Good Afternoon';
    GreetingIcon = Sun;
    iconColor = 'text-orange-500';
  }

  return (
    <div id="admin-dashboard-container" className="space-y-8 animate-fadeIn pt-4">
      
      {/* Ticker Alerts */}
      <TickerAlert employees={employees} />

      {/* 1. Header: Greeting & Quick Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-2">
        {/* Greeting */}
        <div>
          <p className="text-[14px] text-slate-500 font-medium">Hello, Admin</p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-display font-light text-slate-800 tracking-tight">{greeting}</h2>
            <GreetingIcon className={`${iconColor} w-7 h-7 sm:w-8 sm:h-8`} fill="currentColor" />
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto mt-6 lg:mt-0">
           {/* Employees Pill */}
           <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl sm:rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('directory')}>
             <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
               <Users className="w-5 h-5 text-slate-600" />
             </div>
             <div>
               <p className="text-[11px] text-slate-500 font-medium leading-tight">Total Staff</p>
               <p className="text-lg font-bold text-slate-800 leading-tight">
                 {totalEmployees} <span className="text-[10px] font-normal text-slate-400">active</span>
               </p>
             </div>
           </div>
           
           {/* Attendance Pill */}
           <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl sm:rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('attendanceOverview')}>
             <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
               <CheckCircle className="w-5 h-5 text-slate-600" />
             </div>
             <div>
               <p className="text-[11px] text-slate-500 font-medium leading-tight">Punched In</p>
               <p className="text-lg font-bold text-slate-800 leading-tight">
                 {checkedInToday} <span className="text-[10px] font-normal text-slate-400">/ {totalEmployees}</span>
               </p>
             </div>
           </div>

           {/* Leaves Pill */}
           <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl sm:rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('leaveApprovals')}>
             <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
               <Clock className="w-5 h-5 text-slate-600" />
             </div>
             <div>
               <p className="text-[11px] text-slate-500 font-medium leading-tight">Pending Leaves</p>
               <p className="text-lg font-bold text-slate-800 leading-tight">
                 {pendingCount} <span className="text-[10px] font-normal text-slate-400">requests</span>
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* 2. Check-in Banner */}
      <div className={`rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 ${
        currentUser && !isExemptAdmin(currentUser) && !currentUser?.isCheckedIn
          ? 'bg-amber-50/70 border-amber-200 shadow-amber-50'
          : 'bg-white border-slate-100'
      }`}>
         <div className="flex items-center gap-4 md:pl-2 w-full md:w-auto">
           <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${
             currentUser && !isExemptAdmin(currentUser) && !currentUser?.isCheckedIn
               ? 'border-amber-300 bg-amber-100 text-amber-700'
               : currentUser?.isCheckedIn
                 ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                 : 'border-slate-300 bg-white text-slate-600'
           }`}>
             <Clock className="w-6 h-6" />
           </div>
           <div className="text-left">
             <h4 className="font-bold text-slate-800 text-[15px]">
               {currentUser && !isExemptAdmin(currentUser)
                 ? (currentUser?.isCheckedIn ? "You are Checked In" : "Daily Check-in Required")
                 : "Operations Overview"}
             </h4>
             <p className="text-[13px] text-slate-500 font-medium mt-0.5">
               {currentUser && !isExemptAdmin(currentUser)
                 ? (currentUser?.isCheckedIn ? "Active on field duty today." : "You have not checked in yet today. Punch in to log your attendance & territory presence.")
                 : `Today - ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`}
             </p>
           </div>
         </div>
         <div className="flex items-center gap-3 md:pr-2 w-full md:w-auto">
           {currentUser && !isExemptAdmin(currentUser) && !currentUser?.isCheckedIn ? (
             <button onClick={() => setActiveTab('dashboard')} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-colors cursor-pointer shadow-sm animate-pulse">
               Punch In Now →
             </button>
           ) : (
             <button onClick={() => setActiveTab('directory')} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-colors cursor-pointer shadow-sm">
               View Directory
             </button>
           )}
         </div>
      </div>

      {/* 3. Masonry Grid Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Today's Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
               <MapPin className="text-teal-600 w-5 h-5" /> Today's Punch-Ins
            </h3>
            {todaysCheckIns.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100/50 border-dashed">
                <p className="text-slate-400 text-xs font-medium mb-4">No punch-ins recorded yet today.</p>
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab('attendanceOverview')} className="px-5 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold shadow-sm hover:shadow-md transition-all cursor-pointer">
                    View Attendance
                  </button>
                  <button onClick={() => setActiveTab('leaveApprovals')} className="px-5 py-2 bg-teal-600/10 text-teal-600 rounded-full text-[11px] font-bold shadow-sm hover:bg-teal-600/20 transition-all cursor-pointer">
                    Check Leaves
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysCheckIns.map(({ emp, log }) => (
                  <div key={emp.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 text-teal-700 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{emp.name}</h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> {log!.checkInTime.substring(0, 5)}</p>
                      </div>
                    </div>
                    <div className="text-right max-w-[120px]">
                      <p className="text-[10px] text-slate-400 truncate">{log!.checkInLocation || 'Location unavailable'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Announcements & Approvals */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hero Widget (Purple) */}
          <div className="bg-teal-50 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative group">
            <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-[#e6d8f8] rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
              <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Important Notice</h4>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">Team<br/>Meeting</h2>
              <p className="text-[11px] text-slate-600 mb-6">Check the latest updates.</p>
              <button onClick={() => setActiveTab('messages')} className="bg-white text-slate-800 px-5 py-2 rounded-full text-[11px] font-bold shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">View details</button>
            </div>
          </div>

          {/* Pending Leaves List Widget */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Leave Requests</h3>
              <button onClick={() => setActiveTab('leaveApprovals')} className="text-teal-600 text-xs font-bold cursor-pointer hover:underline">View all</button>
            </div>
            {pendingCount === 0 ? (
               <div className="py-8 text-center text-slate-400 text-xs font-medium">No pending requests</div>
            ) : (
               <div className="space-y-4">
                 {pendingRequests.slice(0, 3).map(({ req, empName }) => (
                   <div key={req.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('leaveApprovals')}>
                     <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                       <Clock className="w-4 h-4" />
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{empName}</p>
                       <p className="text-[11px] text-slate-500">{req.fromDate}</p>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        {/* Column 3: Quick Actions (Time Log Style) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-6">Quick Links</h3>
            
            <div className="flex-1 space-y-3">
               <button onClick={() => setActiveTab('directory')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left border border-transparent cursor-pointer">
                  <span className="text-[13px] font-bold text-slate-700">Employees</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
               </button>
               <button onClick={() => setActiveTab('attendanceOverview')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left border border-transparent cursor-pointer">
                  <span className="text-[13px] font-bold text-slate-700">Attendance</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
               </button>
               <button onClick={() => setActiveTab('adminTasks')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left border border-transparent cursor-pointer">
                  <span className="text-[13px] font-bold text-slate-700">Tasks</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
               </button>
            </div>
            
            <button onClick={() => setActiveTab('adminSettings')} className="w-full mt-6 py-3 border border-dashed border-slate-300 rounded-2xl text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
              Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
