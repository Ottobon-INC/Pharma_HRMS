import React, { useState } from 'react';
import { CalendarDays, Send, ShieldAlert, CheckCircle, XCircle, Clock, ToggleLeft, ToggleRight, UserCheck } from 'lucide-react';
import { Language, LeaveType, LeaveRequest, LeaveBalance, MonthlyLeaveQuota } from '../types';
import { translations } from '../translations';

interface LeaveModuleProps {
 language: Language;
 leaveBalance: LeaveBalance;
 monthlyQuota: MonthlyLeaveQuota;
 leaveRequests: LeaveRequest[];
 gender?: 'male' | 'female' | 'other';
 onApplyLeave: (type: LeaveType, fromDate: string, toDate: string, reason: string) => Promise<void>;
 onApproveLeave: (id: string) => void;
 onRejectLeave: (id: string) => void;
 onUpdateBalances?: (type: LeaveType, allotted: number, used: number) => void;
}

export default function LeaveModule({
 language,
 leaveBalance,
 monthlyQuota,
 leaveRequests,
 gender,
 onApplyLeave,
 onApproveLeave,
 onRejectLeave,
 onUpdateBalances
}: LeaveModuleProps) {
 const t = translations[language];

 // Local Form state
 const [leaveType, setLeaveType] = useState<LeaveType>('monthly');
 const [fromDate, setFromDate] = useState('');
 const [toDate, setToDate] = useState('');
 const [reason, setReason] = useState('');
 const [errorMsg, setErrorMsg] = useState('');
 const [successMsg, setSuccessMsg] = useState('');

 // Manager Mode state
 const [managerMode, setManagerMode] = useState(false);

 // Form submission handler
 const [showManageModal, setShowManageModal] = useState(false);
 const [manageType, setManageType] = useState<LeaveType>('monthly');
 const [manageAllotted, setManageAllotted] = useState(0);
 const [manageUsed, setManageUsed] = useState(0);

 const openManageModal = (type: LeaveType) => {
  setManageType(type);
  if (type === 'monthly') {
   setManageAllotted(monthlyQuota.allotted);
   setManageUsed(monthlyQuota.used);
  } else {
   setManageAllotted((leaveBalance as any)[type]?.allowed || 0);
   setManageUsed((leaveBalance as any)[type]?.taken || 0);
  }
  setShowManageModal(true);
 };

 const handleSaveManage = (e: React.FormEvent) => {
  e.preventDefault();
  if (onUpdateBalances) {
   onUpdateBalances(manageType, manageAllotted, manageUsed);
  }
  setShowManageModal(false);
 };
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg('');
  setSuccessMsg('');

  if (!fromDate || !toDate) {
   setErrorMsg(language === 'te' ? 'దయచేసి తేదీలను ఎంచుకోండి.' : 'Please select both start and end dates.');
   return;
  }

  if (new Date(fromDate) > new Date(toDate)) {
   setErrorMsg(language === 'te' ? 'చివరి తేదీ, ప్రారంభ తేదీ కంటే ముందు ఉండకూడదు.' : 'To Date cannot be earlier than From Date.');
   return;
  }

  const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  try {
   await onApplyLeave(leaveType, fromDate, toDate, reason);
   setSuccessMsg(language === 'te' ? 'సెలవు అప్లికేషన్ విజయవంతంగా సబ్మిట్ చేయబడింది!' : 'Leave application submitted successfully!');
   setFromDate('');
   setToDate('');
   setReason('');
  } catch (err: any) {
   console.error(err);
   setErrorMsg(err.message || 'Failed to submit leave. Please check your connection.');
  }
 };

 // Status tag styling helper
 const getStatusTag = (status: string) => {
  switch (status) {
   case 'approved':
    return (
     <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/>
      {t.statusApproved}
     </span>
    );
   case 'rejected':
    return (
     <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold border border-rose-100">
      <XCircle className="w-3.5 h-3.5 text-rose-500"/>
      {t.statusRejected}
     </span>
    );
   default:
    return (
     <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold border border-amber-100 animate-pulse">
      <Clock className="w-3.5 h-3.5 text-amber-500"/>
      {t.statusPending}
     </span>
    );
  }
 };

 return (
  <div id="leave-module-root"className="space-y-6">
   
   {/* Top Controls: Leave Title & Manager Mode Toggle */}
   <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
    <div>
     <h2 className="text-xl font-bold font-display text-slate-800">
      {t.leave}
     </h2>
     <p className="text-xs text-slate-400 mt-1">
      {managerMode ? t.managerViewLabel :"Submit and track your formal leave applications"}
     </p>
    </div>

    {/* Manager Mode Toggle */}
    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
     <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"/>
     <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
      {t.roleManager}
     </span>
     <button
      id="manager-mode-toggle"
      onClick={() => {
       setManagerMode(!managerMode);
       setSuccessMsg('');
       setErrorMsg('');
      }}
      className="focus:outline-none cursor-pointer"
     >
      {managerMode ? (
       <ToggleRight className="w-9 h-9 text-teal-600"/>
      ) : (
       <ToggleLeft className="w-9 h-9 text-slate-300"/>
      )}
     </button>
    </div>
   </div>



   {/* Main Content Pane */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

    {/* Manage Balance Modal */}
    {showManageModal && (
     <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-md animate-scaleUp">
       <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-teal-600"/>
        Manage Balance
       </h3>
       
       <form onSubmit={handleSaveManage} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allotted</label>
          <input
           type="number"
           required
           value={manageAllotted}
           onChange={(e) => setManageAllotted(Number(e.target.value))}
           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
          />
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taken</label>
          <input
           type="number"
           required
           value={manageUsed}
           onChange={(e) => setManageUsed(Number(e.target.value))}
           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
          />
         </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
         <button
          type="button"
          onClick={() => setShowManageModal(false)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
         >
          Cancel
         </button>
         <button
          type="submit"
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
         >
          Save
         </button>
        </div>
       </form>
      </div>
     </div>
    )}
    
    {/* LEFT COLUMN: Apply Leave (only visible in Employee Mode) */}
    {!managerMode ? (
     <div id="leave-form-container"className="lg:col-span-5 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
      <h3 className="text-base font-bold font-display text-slate-800 mb-5 flex items-center gap-2">
       <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"/>
       {t.leaveTitle}
      </h3>

      {errorMsg && (
       <div className="mb-4 bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-100 text-sm font-medium">
        {errorMsg}
       </div>
      )}

      {successMsg && (
       <div className="mb-4 bg-emerald-50 text-emerald-700 p-3.5 rounded-xl border border-emerald-100 text-sm font-medium">
        {successMsg}
       </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
         {t.formType}
        </label>
        <select
         id="leave-type-select"
         value={leaveType}
         onChange={(e) => setLeaveType(e.target.value as LeaveType)}
         className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-[#0f766e] font-medium transition-all"
        >
         <option value="monthly">{language === 'te' ? 'నెలవారీ సెలవు కోటా' : 'Monthly Leave Quota'}</option>
         {gender === 'female' && <option value="maternity">{t.leaveMaternity || 'Maternity Leave'}</option>}
         {gender === 'male' && <option value="paternity">{t.leavePaternity || 'Paternity Leave'}</option>}
        </select>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {t.formFrom}
         </label>
         <input
          id="leave-from-date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-[#0f766e] font-mono transition-all"
         />
        </div>
        <div>
         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {t.formTo}
         </label>
         <input
          id="leave-to-date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-[#0f766e] font-mono transition-all"
         />
        </div>
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
         {t.formReason}
        </label>
        <textarea
         id="leave-reason-textarea"
         value={reason}
         onChange={(e) => setReason(e.target.value)}
         placeholder={t.formReasonPlaceholder}
         rows={3}
         className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-[#0f766e] transition-all placeholder:text-slate-400"
        />
       </div>

       <button
        id="submit-leave-btn"
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-teal-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
       >
        <Send className="w-4 h-4"/>
        {t.btnSubmitLeave}
       </button>
      </form>
     </div>
    ) : (
     /* Manager Notification Banner */
     <div className="lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col justify-between">
      <div className="space-y-3">
       <div className="bg-amber-100 text-amber-800 p-3 rounded-xl w-fit">
        <ShieldAlert className="w-6 h-6"/>
       </div>
       <h3 className="text-lg font-bold text-amber-900 font-display">
        {language === 'te' ? 'మేనేజర్ నియంత్రణ ప్యానెల్' : 'Manager Control Panel'}
       </h3>
       <p className="text-sm text-amber-700 leading-relaxed">
        {language === 'te' 
         ? 'మీరు ఉద్యోగుల సెలవు అభ్యర్థనలను ఇక్కడి నుండి ఒకే క్లిక్‌తో ఆమోదించవచ్చు లేదా తిరస్కరించవచ్చు. ఆమోదించిన సెలవులు వెంటనే ఉద్యోగి బ్యాలెన్స్ లో సర్దుబాటు చేయబడతాయి.' 
         : 'You have full authorization to manage leave applications. Approving a request instantly decreases the employee’s balance and logs it on their attendance calendar.'
        }
       </p>
      </div>
      
      <div className="mt-8 pt-4 border-t border-amber-200/50 flex items-center justify-between text-xs text-amber-600 font-semibold">
       <span>Security Clearance Level 1</span>
       <span className="underline">HR-Manual-v4.2</span>
      </div>
     </div>
    )}

    {/* RIGHT COLUMN: History (or Approval list in Manager Mode) */}
    <div className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
     <div className="flex items-center gap-2 mb-6 pb-2">
      <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"/>
      <h3 className="text-lg font-bold font-display text-slate-800">
       {managerMode ? (language === 'te' ? 'ఆమోదం కొరకు అప్లికేషన్లు' : 'Requests Requiring Action') : t.historyTitle}
      </h3>
     </div>

     <div className="space-y-4">
      {leaveRequests.length === 0 ? (
       <div className="text-center py-12 text-slate-400 text-sm">
        {t.noData}
       </div>
      ) : (
       leaveRequests.slice().reverse().map((req) => {
        const leaveTypeName = req.type === 'monthly' 
         ? (language === 'te' ? 'నెలవారీ సెలవు కోటా' : 'Monthly Leave Quota')
         : (t[`leave${req.type.charAt(0).toUpperCase() + req.type.slice(1)}` as keyof typeof t] || req.type);
        const isPending = req.status === 'pending';

        return (
         <div
          key={req.id}
          className={`p-5 rounded-2xl border transition-all duration-300 ${
           isPending 
            ? 'border-amber-100 bg-amber-50/20' 
            : 'border-slate-100 bg-white hover:shadow-md'
          }`}
         >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50">
           <div>
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
             ID: {req.id}
            </span>
            <h4 className="text-sm font-bold text-slate-800 mt-0.5">
             {leaveTypeName}
            </h4>
           </div>
           <div className="self-start sm:self-center">
            {getStatusTag(req.status)}
           </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-500">
           <p>
            <span className="font-semibold text-slate-700">{t.historyHeaderDates}: </span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-medium">
             {req.fromDate}
            </span>
            <span className="mx-2">→</span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-600 font-medium">
             {req.toDate}
            </span>
           </p>
           <p className="italic">
            <span className="font-semibold text-slate-700 not-italic">{t.historyHeaderReason}: </span>
           "{req.reason || 'No details provided'}"
           </p>
           <p className="text-[10px] text-slate-400">
            {t.historyHeaderSubmitted}: {req.submittedAt}
           </p>
          </div>

          {/* Approver actions for Manager Mode */}
          {managerMode && isPending && (
           <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-end gap-2.5">
            <button
             id={`reject-${req.id}`}
             onClick={() => onRejectLeave(req.id)}
             className="flex items-center gap-1 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
             <XCircle className="w-3.5 h-3.5"/>
             {t.btnReject}
            </button>
            <button
             id={`approve-${req.id}`}
             onClick={() => onApproveLeave(req.id)}
             className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
             <CheckCircle className="w-3.5 h-3.5"/>
             {t.btnApprove}
            </button>
           </div>
          )}
         </div>
        );
       })
      )}
     </div>
    </div>

   </div>
  </div>
 );
}
