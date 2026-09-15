import React, { useState } from 'react';
import { 
 Building2, 
 Users, 
 CalendarCheck, 
 Clock, 
 MapPin, 
 CheckSquare, 
 ArrowRight,
 TrendingUp,
 Radio,
 Network
} from 'lucide-react';
import { Employee, Language, Task, Branch, isExemptAdmin } from '../types';

interface ExecutiveOverviewProps {
 language: Language;
 currentUser: Employee;
 employees: Employee[];
 tasks?: Task[];
 setActiveTab: (tab: string) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
 currentUser,
 employees,
 tasks = [],
 setActiveTab
}) => {
 const [selectedBranch, setSelectedBranch] = useState<Branch | 'all'>('all');

 const todayStr = new Date().toISOString().split('T')[0];

 // Filter employees according to branch selector
 const displayEmployees = selectedBranch === 'all'
  ? employees
  : employees.filter(e => (e.branch || 'visakhapatnam') === selectedBranch);

 // Branch statistics calculations
 const getBranchStats = (branchName: Branch) => {
  const branchEmps = employees.filter(e => (e.branch || 'visakhapatnam') === branchName && e.role !== 'admin');
  const total = branchEmps.length;
  const checkedIn = branchEmps.filter(e => {
   const todayAtt = e.attendanceRecords?.find(a => a.date === todayStr);
   return e.isCheckedIn || (todayAtt && todayAtt.status === 'present');
  }).length;
  const onLeave = branchEmps.filter(e => {
   const todayAtt = e.attendanceRecords?.find(a => a.date === todayStr);
   return todayAtt && todayAtt.status === 'leave';
  }).length;
  const pendingLeaves = branchEmps.reduce((acc, emp) => {
   return acc + (emp.leaveRequests?.filter(r => r.status === 'pending').length || 0);
  }, 0);
  const fieldOpsActive = branchEmps.filter(e => {
   const todayLog = e.checkInLogs?.find(l => l.date === todayStr);
   return todayLog?.punchType === 'out_of_office' || (e.locationPins && e.locationPins.length > 0);
  }).length;

  return { total, checkedIn, onLeave, pendingLeaves, fieldOpsActive };
 };

 const vizagStats = getBranchStats('visakhapatnam');
 const vizianagaramStats = getBranchStats('vizianagaram');

 const totalStaff = employees.filter(e => !isExemptAdmin(e)).length;
 const totalCheckedIn = employees.filter(e => {
  if (isExemptAdmin(e)) return false;
  const todayAtt = e.attendanceRecords?.find(a => a.date === todayStr);
  return e.isCheckedIn || (todayAtt && todayAtt.status === 'present');
 }).length;
 const totalOnLeave = employees.filter(e => {
  if (isExemptAdmin(e)) return false;
  const todayAtt = e.attendanceRecords?.find(a => a.date === todayStr);
  return todayAtt && todayAtt.status === 'leave';
 }).length;
 const totalPendingLeaves = employees.reduce((acc, emp) => {
  return acc + (emp.leaveRequests?.filter(r => r.status === 'pending').length || 0);
 }, 0);
 const openTasksCount = tasks.filter(t => t.status !== 'completed').length;

 // Recent attendance activity
 const recentCheckIns = employees
  .filter(e => e.role !== 'admin')
  .map(e => {
   const todayLog = e.checkInLogs?.find(l => l.date === todayStr);
   return {
    emp: e,
    checkInTime: todayLog?.checkInTime || (e.isCheckedIn ? 'Active' : null),
    branch: e.branch || 'visakhapatnam',
    status: e.isCheckedIn ? 'Present' : 'Not Checked In'
   };
  })
  .filter(item => item.checkInTime !== null)
  .slice(0, 6);

 return (
  <div className="space-y-6 animate-fadeIn pb-12">
   {/* Top Banner with Executive Credentials */}
   <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
    <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"/>
    
    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
     <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
       <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
        Executive Leadership Console
       </span>
       <span className="bg-teal-600/20 text-teal-200 border border-teal-600/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
        <Radio className="w-2.5 h-2.5 animate-pulse text-teal-300"/>
        Live Multi-Branch Sync
       </span>
      </div>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
       Welcome, {currentUser.name}
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
       Real-time executive intelligence for <strong className="text-teal-300 font-bold">Visakhapatnam</strong> & <strong className="text-teal-300 font-bold">Vizianagaram</strong> clinical facilities.
      </p>
     </div>

     {/* Quick Actions for Executive */}
     <div className="flex items-center gap-2.5 flex-wrap">
      <button
       onClick={() => setActiveTab('orgChart')}
       className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
      >
       <Network className="w-3.5 h-3.5 text-amber-300"/>
       <span>Org Hierarchy</span>
      </button>
      <button
       onClick={() => setActiveTab('leaveApprovals')}
       className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-teal-500/25"
      >
       <CalendarCheck className="w-3.5 h-3.5"/>
       <span>Review Leaves ({totalPendingLeaves})</span>
      </button>
     </div>
    </div>
   </div>

   {/* Global Organization KPI Summary */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
     <div className="flex items-center justify-between text-slate-400">
      <span className="text-[10px] font-bold uppercase tracking-wider">Total Staff</span>
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
       <Users className="w-4 h-4"/>
      </div>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalStaff}</span>
      <span className="text-[10px] text-slate-400 font-bold">Both Branches</span>
     </div>
     <div className="text-[11px] text-slate-500 font-medium">
      Managed by Ravi Kumar
     </div>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
     <div className="flex items-center justify-between text-emerald-600">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present Today</span>
      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
       <CalendarCheck className="w-4 h-4"/>
      </div>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-black text-emerald-600">{totalCheckedIn}</span>
      <span className="text-[10px] text-emerald-600 font-bold">
       {totalStaff > 0 ? `${Math.round((totalCheckedIn / totalStaff) * 100)}%` : '0%'}
      </span>
     </div>
     <div className="text-[11px] text-slate-500 font-medium">
      Active workforce on duty
     </div>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
     <div className="flex items-center justify-between text-amber-500">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Leaves</span>
      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
       <Clock className="w-4 h-4"/>
      </div>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-black text-amber-600">{totalPendingLeaves}</span>
      <span className="text-[10px] text-amber-600 font-bold">Requests</span>
     </div>
     <button 
      onClick={() => setActiveTab('leaveApprovals')}
      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
     >
      <span>Action requests</span>
      <ArrowRight className="w-3 h-3"/>
     </button>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
     <div className="flex items-center justify-between text-indigo-500">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Work Tasks</span>
      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
       <CheckSquare className="w-4 h-4"/>
      </div>
     </div>
     <div className="flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-black text-indigo-600">{openTasksCount}</span>
      <span className="text-[10px] text-indigo-600 font-bold">Pending</span>
     </div>
     <button 
      onClick={() => setActiveTab('adminTasks')}
      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
     >
      <span>Manage assignments</span>
      <ArrowRight className="w-3 h-3"/>
     </button>
    </div>
   </div>

   {/* Side-by-Side Branch Comparison */}
   <div className="space-y-3">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-teal-600"/>
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
       Branch Performance Comparison
      </h2>
     </div>
     <span className="text-[11px] font-bold text-slate-400">
      Reporting Date: {todayStr}
     </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {/* Branch 1: Visakhapatnam */}
     <div className="bg-white rounded-2xl p-6 border-2 border-teal-600/20 shadow-sm space-y-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
       <div>
        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
         Main Center
        </span>
        <h3 className="text-lg font-black text-slate-800 mt-1">Visakhapatnam</h3>
        <p className="text-xs text-slate-400 font-medium">Headquarters & Advanced Clinical Operations</p>
       </div>
       <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-black">
        VZ
       </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
       <div className="bg-slate-50 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Staff</span>
        <span className="text-lg font-black text-slate-800">{vizagStats.total}</span>
       </div>
       <div className="bg-emerald-50/70 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-emerald-700 block">Present</span>
        <span className="text-lg font-black text-emerald-700">{vizagStats.checkedIn}</span>
       </div>
       <div className="bg-amber-50/70 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-amber-700 block">On Leave</span>
        <span className="text-lg font-black text-amber-700">{vizagStats.onLeave}</span>
       </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
       <span className="text-slate-500 font-medium flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-slate-400"/>
        Branch Lead: <strong>R. Ravi Kumar</strong>
       </span>
       <button
        onClick={() => {
         setSelectedBranch('visakhapatnam');
         setActiveTab('attendanceOverview');
        }}
        className="text-teal-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
       >
        <span>View Attendance</span>
        <ArrowRight className="w-3 h-3"/>
       </button>
      </div>
     </div>

     {/* Branch 2: Vizianagaram */}
     <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500/20 shadow-sm space-y-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
       <div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
         Regional Center
        </span>
        <h3 className="text-lg font-black text-slate-800 mt-1">Vizianagaram</h3>
        <p className="text-xs text-slate-400 font-medium">Branch Facility & Outstation Operations</p>
       </div>
       <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black">
        VZM
       </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
       <div className="bg-slate-50 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Staff</span>
        <span className="text-lg font-black text-slate-800">{vizianagaramStats.total}</span>
       </div>
       <div className="bg-emerald-50/70 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-emerald-700 block">Present</span>
        <span className="text-lg font-black text-emerald-700">{vizianagaramStats.checkedIn}</span>
       </div>
       <div className="bg-amber-50/70 p-3 rounded-xl">
        <span className="text-[10px] font-bold uppercase text-amber-700 block">On Leave</span>
        <span className="text-lg font-black text-amber-700">{vizianagaramStats.onLeave}</span>
       </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
       <span className="text-slate-500 font-medium flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-slate-400"/>
        Branch Lead: <strong>R. Ravi Kumar</strong>
       </span>
       <button
        onClick={() => {
         setSelectedBranch('vizianagaram');
         setActiveTab('attendanceOverview');
        }}
        className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
       >
        <span>View Attendance</span>
        <ArrowRight className="w-3 h-3"/>
       </button>
      </div>
     </div>
    </div>
   </div>

   {/* Operational Feed & Quick Module Navigation */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Today's Active Activity Feed */}
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
       <TrendingUp className="w-4 h-4 text-teal-600"/>
       <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
        Live Attendance & Punch Stream
       </h3>
      </div>
      <button
       onClick={() => setActiveTab('attendanceOverview')}
       className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
      >
       Full Log →
      </button>
     </div>

     <div className="divide-y divide-slate-50">
      {recentCheckIns.length === 0 ? (
       <div className="py-8 text-center text-xs text-slate-400 font-medium">
        No active punches recorded for today yet.
       </div>
      ) : (
       recentCheckIns.map(({ emp, checkInTime, branch }) => (
        <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
         <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
           {emp.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
           <h4 className="text-xs font-bold text-slate-800 leading-tight">{emp.name}</h4>
           <p className="text-[10px] text-slate-400">{emp.designation}</p>
          </div>
         </div>

         <div className="flex items-center gap-3 text-right">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
           branch === 'visakhapatnam' 
            ? 'bg-teal-50 text-teal-700 border border-teal-200' 
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
           {branch}
          </span>
          <span className="text-xs font-mono font-bold text-slate-600">
           {checkInTime}
          </span>
         </div>
        </div>
       ))
      )}
     </div>
    </div>

    {/* Executive Action Shortcuts */}
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
     <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
      Executive Controls
     </h3>
     <p className="text-xs text-slate-400 font-medium">
      Directly navigate to any management module with full action capability.
     </p>

     <div className="space-y-2">
      <button
       onClick={() => setActiveTab('orgChart')}
       className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all cursor-pointer group"
      >
       <div className="flex items-center gap-3">
        <Network className="w-4 h-4 text-amber-500"/>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Organizational Tree</span>
       </div>
       <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"/>
      </button>

      <button
       onClick={() => setActiveTab('leaveApprovals')}
       className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all cursor-pointer group"
      >
       <div className="flex items-center gap-3">
        <CalendarCheck className="w-4 h-4 text-emerald-600"/>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Leave Approvals</span>
       </div>
       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
        {totalPendingLeaves} pending
       </span>
      </button>

      <button
       onClick={() => setActiveTab('directory')}
       className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all cursor-pointer group"
      >
       <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-teal-600"/>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Employee Directory</span>
       </div>
       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
        {employees.length} total
       </span>
      </button>

      <button
       onClick={() => setActiveTab('adminTasks')}
       className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all cursor-pointer group"
      >
       <div className="flex items-center gap-3">
        <CheckSquare className="w-4 h-4 text-indigo-600"/>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Work Assignment</span>
       </div>
       <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"/>
      </button>

      <button
       onClick={() => setActiveTab('fieldOps')}
       className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-left transition-all cursor-pointer group"
      >
       <div className="flex items-center gap-3">
        <MapPin className="w-4 h-4 text-rose-500"/>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Field Operations</span>
       </div>
       <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"/>
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default ExecutiveOverview;
