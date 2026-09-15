import React, { useState } from 'react';
import { Calendar, Check, X, Moon, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Language, Employee, LeaveRequest, Branch } from '../types';
import { translations } from '../translations';

interface AdminLeaveApprovalsProps {
 language: Language;
 currentUser: Employee;
 employees: Employee[];
 onApproveLeave: (empId: string, reqId: string, approverId: string, note?: string) => void;
 onRejectLeave: (empId: string, reqId: string, approverId: string, note?: string) => void;
}

export default function AdminLeaveApprovals({
 language,
 currentUser,
 employees,
 onApproveLeave,
 onRejectLeave,
}: AdminLeaveApprovalsProps) {
 const t = translations[language];

 // Optional notes per request ID
 const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
 const [leaveBranchFilter, setLeaveBranchFilter] = useState<Branch | 'all'>('all');

 // Determine scoped employees based on current user's hierarchy
 let scopedEmployees = employees;
 if (currentUser.hierarchyLevel === 'team_lead') {
   scopedEmployees = employees.filter(emp => emp.reportingTo === currentUser.id);
 } else if (currentUser.hierarchyLevel === 'senior_manager') {
   scopedEmployees = employees.filter(emp => emp.hospital === currentUser.hospital);
 } else if (currentUser.hierarchyLevel === 'manager') {
    const branches = currentUser.managedBranches && currentUser.managedBranches.length > 0
      ? currentUser.managedBranches
      : (currentUser.branch ? [currentUser.branch] : ['visakhapatnam', 'vizianagaram']);
    scopedEmployees = employees.filter(emp => emp.hospital === currentUser.hospital && branches.includes(emp.branch || 'visakhapatnam'));
 }

 // Compile leave requests across scoped employees, filtered by selected branch
 const pendingRequests: { emp: Employee; req: LeaveRequest }[] = [];
 const processedRequests: { emp: Employee; req: LeaveRequest }[] = [];

 scopedEmployees.forEach(emp => {
  if (leaveBranchFilter !== 'all' && (emp.branch || 'visakhapatnam') !== leaveBranchFilter) {
   return;
  }
  emp.leaveRequests.forEach(req => {
   if (req.status === 'pending') {
    pendingRequests.push({ emp, req });
   } else {
    processedRequests.push({ emp, req });
   }
  });
 });

 // Sort processed requests so recent is first
 processedRequests.sort((a, b) => b.req.submittedAt.localeCompare(a.req.submittedAt));

 const handleNoteChange = (reqId: string, val: string) => {
  setDecisionNotes(prev => ({ ...prev, [reqId]: val }));
 };

 const localizedText = {
  en: {
   title:"Leave Approvals Roster",
   subtitle:"Evaluate pending leave requests and issue formal approvals or rejections.",
   pendingSec:"Applications Requiring Decision",
   processedSec:"Leave Decision History",
   colEmp:"Employee",
   colType:"Type",
   colPeriod:"Leave Period",
   colReason:"Submitted Reason",
   colDecision:"Decision",
   notePlace:"Add optional note (e.g. 'Enjoy your break' or 'Critical milestone overlap')",
   btnApprove:"Approve Leave",
   btnReject:"Reject",
   emptyPending:"Hooray! No pending leave applications require decision.",
   emptyProcessed:"No previous decisions on record yet.",
   badgeDays:"days",
   colNote:"Supervisor Note",
  },
  te: {
   title:"సెలవు అప్లికేషన్ల ఆమోదం",
   subtitle:"సిబ్బంది పంపించిన లీవ్ రిక్వెస్ట్లను ఆమోదించండి లేదా తిరస్కరించండి.",
   pendingSec:"ఆమోదించాల్సిన అప్లికేషన్లు",
   processedSec:"గతంలో తీసుకున్న నిర్ణయాల హిస్టరీ",
   colEmp:"ఉద్యోగి",
   colType:"రకం",
   colPeriod:"సెలవు కాలం",
   colReason:"సెలవుకు గల కారణం",
   colDecision:"నిర్ణయం",
   notePlace:"అడ్మిన్ నోట్ రాయండి (ఐచ్ఛికం)",
   btnApprove:"ఆమోదించండి (Approve)",
   btnReject:"తిరస్కరించండి",
   emptyPending:"ఆమోదించాల్సిన లీవ్ అప్లికేషన్లు ఏవీ లేవు.",
   emptyProcessed:"గతంలో తీసుకున్న నిర్ణయాల సమాచారం లేదు.",
   badgeDays:"రోజులు",
   colNote:"అధికారి నోట్",
  }
 }[language];

 // Helper to calculate days in range
 const calculateDays = (from: string, to: string) => {
  const start = new Date(from);
  const end = new Date(to);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
 };

 return (
  <div id="admin-leaves-container"className="space-y-8 animate-fadeIn">
   
   {/* 1. Title Header & Branch Selector */}
   <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
     <h2 className="text-xl font-bold font-display text-slate-800">
      {localizedText.title}
     </h2>
     <p className="text-xs text-slate-400 mt-1">
      {localizedText.subtitle}
     </p>
    </div>

    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
     <button
      onClick={() => setLeaveBranchFilter('all')}
      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
       leaveBranchFilter === 'all'
        ? 'bg-white text-teal-700 shadow-sm'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      All Branches
     </button>
     <button
      onClick={() => setLeaveBranchFilter('visakhapatnam')}
      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
       leaveBranchFilter === 'visakhapatnam'
        ? 'bg-white text-teal-700 shadow-sm'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      Visakhapatnam
     </button>
     <button
      onClick={() => setLeaveBranchFilter('vizianagaram')}
      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
       leaveBranchFilter === 'vizianagaram'
        ? 'bg-white text-indigo-700 shadow-sm'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      Vizianagaram
     </button>
    </div>
   </div>

   {/* 2. Pending Requests Grid list */}
   <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
     <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"/>
     <h3 className="text-base font-bold text-slate-800">
      {localizedText.pendingSec}
     </h3>
     <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 rounded-full font-bold">
      {pendingRequests.length}
     </span>
    </div>

    {pendingRequests.length === 0 ? (
     <div className="py-12 text-center text-slate-400 text-xs font-medium">
      {localizedText.emptyPending}
     </div>
    ) : (
     <div className="space-y-6">
      {pendingRequests.map(({ emp, req }) => {
       const daysCount = calculateDays(req.fromDate, req.toDate);
       const noteText = decisionNotes[req.id] || '';
       const empBranch = emp.branch || 'visakhapatnam';

       return (
        <div 
         key={req.id} 
         id={`pending-leave-${req.id}`}
         className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col lg:flex-row justify-between gap-6"
        >
         <div className="space-y-4 flex-1">
          {/* User profile row */}
          <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center font-bold text-xs">
            {emp.name.split(' ').map(n => n[0]).join('')}
           </div>
           <div>
            <div className="flex items-center gap-2">
             <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              empBranch === 'visakhapatnam' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
             }`}>
              {empBranch === 'visakhapatnam' ? 'Vizag' : 'Vizianagaram'}
             </span>
            </div>
            <p className="text-[10px] text-slate-400">
               {emp.designation} • ID: {emp.id} 
               {emp.reportingTo ? ` • Reports to: ${employees.find(e => e.id === emp.reportingTo)?.name || 'Unknown'}` : ''}
            </p>
           </div>
          </div>

          {/* Details and period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
           <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{localizedText.colPeriod}</p>
            <p className="font-bold text-slate-700 mt-1 flex items-center gap-1.5">
             <span>{req.fromDate} to {req.toDate}</span>
             <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-black rounded-full">
              {daysCount} {localizedText.badgeDays}
             </span>
            </p>
           </div>

           <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{localizedText.colType}</p>
            <p className="font-bold text-teal-700 mt-1 uppercase">
             {req.type} LEAVE
            </p>
           </div>
          </div>

          <div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{localizedText.colReason}</p>
           <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
           "{req.reason}"
           </p>
          </div>

          {/* Note input field */}
          <div className="space-y-1">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {localizedText.colNote}
           </label>
           <input
            type="text"
            placeholder={localizedText.notePlace}
            value={noteText}
            onChange={(e) => handleNoteChange(req.id, e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
           />
          </div>
         </div>

         {/* Approve / Reject buttons */}
         <div className="flex flex-row lg:flex-col justify-end gap-3 lg:w-44 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200/60 lg:pl-6">
          <button
           onClick={() => onApproveLeave(emp.id, req.id, currentUser.id, noteText)}
           className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer shadow-md shadow-teal-600/10"
          >
           <Check className="w-4 h-4"/>
           <span>{language === 'te' ? 'ఆమోదించు' : 'Approve'}</span>
          </button>
          
          <button
           onClick={() => onRejectLeave(emp.id, req.id, currentUser.id, noteText)}
           className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer"
          >
           <X className="w-4 h-4"/>
           <span>{language === 'te' ? 'తిరస్కరించు' : 'Reject'}</span>
          </button>
         </div>
        </div>
       );
      })}
     </div>
    )}
   </div>

   {/* 3. Decision History list */}
   <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0"/>
     <h3 className="text-base font-bold text-slate-800">
      {localizedText.processedSec}
     </h3>
    </div>

    {processedRequests.length === 0 ? (
     <div className="py-12 text-center text-slate-400 text-xs font-medium">
      {localizedText.emptyProcessed}
     </div>
    ) : (
     <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full text-left border-collapse min-w-[700px]">
       <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
         <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{localizedText.colEmp}</th>
         <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Leave Type</th>
         <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Duration</th>
         <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Submitted At</th>
         <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Status Decision</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-100">
        {processedRequests.map(({ emp, req }) => (
         <tr key={req.id} className="hover:bg-slate-50/50">
          <td className="p-4">
           <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">{emp.name}</span>
            <span className="text-[10px] text-slate-400">({emp.id})</span>
           </div>
          </td>
          <td className="p-4 text-xs font-semibold uppercase text-teal-700">{req.type}</td>
          <td className="p-4 text-xs text-slate-600 font-medium">
           {req.fromDate} to {req.toDate}
          </td>
          <td className="p-4 text-xs text-slate-500 font-mono">{req.submittedAt}</td>
          <td className="p-4 text-right">
           <div className="flex flex-col items-end gap-1">
             <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              req.status === 'approved' 
               ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
               : 'bg-rose-50 text-rose-700 border border-rose-100'
             }`}>
              {req.status}
             </span>
             {req.approvedBy && (
               <span className="text-[9px] text-slate-400">By {employees.find(e => e.id === req.approvedBy)?.name || req.approvedBy}</span>
             )}
             {currentUser.hierarchyLevel === 'senior_manager' && (
                <div className="flex gap-2 mt-2">
                  {req.status !== 'approved' && (
                     <button
                        onClick={() => onApproveLeave(emp.id, req.id, currentUser.id, 'Overridden by Senior Manager')}
                        className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer uppercase underline"
                     >Override & Approve</button>
                  )}
                  {req.status !== 'rejected' && (
                     <button
                        onClick={() => onRejectLeave(emp.id, req.id, currentUser.id, 'Overridden by Senior Manager')}
                        className="text-[9px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer uppercase underline"
                     >Override & Reject</button>
                  )}
                </div>
             )}
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )}
   </div>

  </div>
 );
}
