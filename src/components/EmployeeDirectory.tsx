import React, { useState, useRef } from 'react';
import { Plus, Edit3, Trash2, ArrowLeft, Calendar, Moon, User, Mail, IndianRupee, CalendarDays, Eye, EyeOff, Power, FileText, Printer, X, Building2 } from 'lucide-react';
import { Language, Employee, LeaveType, Branch, HierarchyLevel, isExemptAdmin } from '../types';
import { translations } from '../translations';
import AttendanceModule from './AttendanceModule';
import LeaveModule from './LeaveModule';
import ExperienceLetter from './ExperienceLetter';

interface EmployeeDirectoryProps {
 language: Language;
 employees: Employee[];
 onAddEmployee: (emp: Partial<Employee>) => void;
 onUpdateEmployee: (id: string, emp: Partial<Employee>) => void;
 onDeleteEmployee: (id: string) => void;
 // Propagate actions on employee's leave
 onApproveEmployeeLeave: (empId: string, reqId: string) => void;
 onRejectEmployeeLeave: (empId: string, reqId: string) => void;
 onApplyEmployeeLeave: (empId: string, type: LeaveType, from: string, to: string, reason: string) => Promise<void>;
 onUpdateLeaveBalances: (empId: string, type: LeaveType, allotted: number, used: number) => void;
}

export default function EmployeeDirectory({
 language,
 employees,
 onAddEmployee,
 onUpdateEmployee,
 onDeleteEmployee,
 onApproveEmployeeLeave,
 onRejectEmployeeLeave,
 onApplyEmployeeLeave,
 onUpdateLeaveBalances,
}: EmployeeDirectoryProps) {
 const t = translations[language];

 // UI state
 const [inspectingEmpId, setInspectingEmpId] = useState<string | null>(null);
 const [inspectSubTab, setInspectSubTab] = useState<'attendance' | 'leave' | 'docs'>('attendance');
 const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

 const letterRef = useRef<HTMLDivElement>(null);

 const handlePrintLetter = () => {
  if (letterRef.current) {
   const originalContents = document.body.innerHTML;
   const printContents = letterRef.current.innerHTML;
   document.body.innerHTML = printContents;
   window.print();
   document.body.innerHTML = originalContents;
   window.location.reload(); // Quick reset of the SPA state
  }
 };
 
 // Modal State
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [editTargetId, setEditTargetId] = useState<string | null>(null);
 const [directoryZoneFilter, setDirectoryZoneFilter] = useState<'all' | 'AP' | 'TS' | 'Corporate'>('all');

 // Form State
 const [formName, setFormName] = useState('');
 const [formEmail, setFormEmail] = useState('');
 const [formDesignation, setFormDesignation] = useState('');
 const [formJoiningDate, setFormJoiningDate] = useState('');
 const [formBasicSalary, setFormBasicSalary] = useState(40000);
 const [formRole, setFormRole] = useState<'admin' | 'employee'>('employee');
 const [formPhone, setFormPhone] = useState('');
 const [formPassword, setFormPassword] = useState('');
 const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
 const [formBranch, setFormBranch] = useState<Branch>('ap_zone');
 const [formHierarchyLevel, setFormHierarchyLevel] = useState<HierarchyLevel>('be');
 const [formReportingTo, setFormReportingTo] = useState<string>('');
 const [showPassword, setShowPassword] = useState(false);
 const [formGender, setFormGender] = useState<'male' | 'female' | 'other' | undefined>(undefined);
 const [formExperience, setFormExperience] = useState<number>(0);
 const [formBankAccountNo, setFormBankAccountNo] = useState('');
 const [formBankName, setFormBankName] = useState('');
 const [formBankIfsc, setFormBankIfsc] = useState('');
 const [formBankAccountType, setFormBankAccountType] = useState<'savings' | 'current'>('savings');

 const activeEmployee = employees.find(e => e.id === inspectingEmpId);

 const handleOpenAdd = () => {
  setFormName('');
  setFormEmail('');
  setFormDesignation('');
  setFormJoiningDate(new Date().toISOString().split('T')[0]);
  setFormBasicSalary(45000);
  setFormRole('employee');
  setFormPhone('');
  setFormPassword('');
  setFormStatus('active');
  setFormBranch('ap_zone');
  setFormHierarchyLevel('be');
  setFormReportingTo('');
  setFormGender(undefined);
  setFormExperience(0);
  setFormBankAccountNo('');
  setFormBankName('');
  setFormBankIfsc('');
  setFormBankAccountType('savings');
  setShowAddModal(true);
 };

 const handleOpenEdit = (emp: Employee, e: React.MouseEvent) => {
  e.stopPropagation(); // Avoid inspecting triggers
  setEditTargetId(emp.id);
  setFormName(emp.name);
  setFormEmail(emp.email);
  setFormDesignation(emp.designation);
  setFormJoiningDate(emp.joiningDate);
  setFormBasicSalary(emp.basicSalary || 45000);
  setFormRole(emp.role || 'employee');
  setFormPhone(emp.phone || '');
  setFormPassword(emp.password || '');
  setFormStatus(emp.status || 'active');
  setFormBranch(emp.branch || 'ap_zone');
  setFormHierarchyLevel(emp.hierarchyLevel || 'be');
  setFormReportingTo(emp.reportingTo || '');
  setFormGender(emp.gender || undefined);
  setFormExperience(emp.experience || 0);
  setFormBankAccountNo(emp.bankDetails?.accountNumber || '');
  setFormBankName(emp.bankDetails?.bankName || '');
  setFormBankIfsc(emp.bankDetails?.ifsc || '');
  setFormBankAccountType(emp.bankDetails?.accountType || 'savings');
  setShowEditModal(true);
 };

 // Save New Employee
 const handleAddSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formName || !formEmail || !formDesignation) {
   alert(language === 'te' ? 'దయచేసి అన్ని వివరాలు పూరించండి' : 'Please fill all fields');
   return;
  }
  
  try {
   await onAddEmployee({
    id: `OL${String(employees.length + 1).padStart(3, '0')}`,
    name: formName,
    email: formEmail,
    designation: formDesignation,
    joiningDate: formJoiningDate,
    basicSalary: Number(formBasicSalary),
    role: formHierarchyLevel === 'executive' || formHierarchyLevel === 'admin' ? 'admin' : formRole,
    branch: formBranch,
    hierarchyLevel: formHierarchyLevel,
    reportingTo: formReportingTo || undefined,
    phone: formPhone,
    password: formPassword,
    status: formStatus,
    gender: formGender,
    experience: formExperience,
    bankDetails: {
     accountNumber: formBankAccountNo,
     bankName: formBankName,
     ifsc: formBankIfsc,
     accountType: formBankAccountType
    }
   });
   setShowAddModal(false);
  } catch (error: any) {
   alert("Failed to add employee:"+ (error?.message || error?.details || JSON.stringify(error)));
  }
 };

 // Save Edited Employee
 const handleEditSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!formName || !formEmail || !formDesignation || !editTargetId) return;
  onUpdateEmployee(editTargetId, {
   name: formName,
   email: formEmail,
   designation: formDesignation,
   joiningDate: formJoiningDate,
   basicSalary: Number(formBasicSalary),
   role: formHierarchyLevel === 'executive' || formHierarchyLevel === 'admin' ? 'admin' : formRole,
   branch: formBranch,
   hierarchyLevel: formHierarchyLevel,
   reportingTo: formReportingTo || undefined,
   phone: formPhone,
   password: formPassword,
   status: formStatus,
   gender: formGender,
   experience: formExperience,
   bankDetails: {
    accountNumber: formBankAccountNo,
    bankName: formBankName,
    ifsc: formBankIfsc,
    accountType: formBankAccountType
   }
  });
  setShowEditModal(false);
 };

 const handleToggleStatus = (id: string, name: string, currentStatus: string, e: React.MouseEvent) => {
  e.stopPropagation();
  const isDeactivating = currentStatus !== 'inactive';
  const confirmed = confirm(
   language === 'te' 
    ? (isDeactivating ? `${name} అకౌంట్ నిలిపివేయాలనుకుంటున్నారా?` : `${name} అకౌంట్ తిరిగి యాక్టివేట్ చేయాలనుకుంటున్నారా?`)
    : (isDeactivating ? `Deactivate ${name}'s account? They will not be able to log in.` : `Reactivate ${name}'s account?`)
  );
  if (confirmed) {
   onUpdateEmployee(id, { status: isDeactivating ? 'inactive' : 'active' });
  }
 };

 const handlePermanentDelete = () => {
  if (!editTargetId) return;
  const emp = employees.find(e => e.id === editTargetId);
  if (!emp) return;

  const inputName = prompt(
   language === 'te' 
    ? `శాశ్వతంగా తొలగించడానికి దయచేసి ఉద్యోగి పేరు"${emp.name}"ని టైప్ చేయండి:` 
    : `To permanently delete, please type the employee's name"${emp.name}":`
  );

  if (inputName === emp.name) {
   onDeleteEmployee(editTargetId);
   setShowEditModal(false);
   if (inspectingEmpId === editTargetId) setInspectingEmpId(null);
  } else if (inputName !== null) {
   alert(language === 'te' ? 'పేరు సరిపోలలేదు. తొలగింపు రద్దు చేయబడింది.' : 'Name did not match. Deletion cancelled.');
  }
 };

 // Texts
 const dirText = {
  en: {
   title:"Employee Roster Directory",
   subtitle:"Review operational metrics, roster info, and manage employee profiles.",
   btnNew:"Add New Employee",
   colEmp:"Employee Info",
   colDesignation:"Designation",
   colJoin:"Joining Date",
   colStatus:"Attendance Today",
   colLocation:"Current Location",
   colActions:"Actions",
   addTitle:"Onboard New Employee",
   editTitle:"Modify Employee Profile",
   labelName:"Full Name",
   labelEmail:"Official Email Address",
   labelRole:"Job Designation",
   labelJoin:"Joining Date",
   labelSalary:"Monthly Basic Salary (₹)",
   btnSave:"Save Profile",
   backDir:"Back to Directory List",
   inspecting:"Inspecting Profile:",
   tabAttend:"Attendance Logs",
   tabLeave:"Leave & Balances",
   tabPayroll:"Payslip Portal",
   deleteEmployee:"Remove Employee Profile",
  },
  te: {
   title:"ఉద్యోగుల డైరెక్టరీ",
   subtitle:"హాజరు స్థితి, సెలవుల బ్యాలెన్స్ చూడండి మరియు కంపెనీ ఉద్యోగులను నియమించండి.",
   btnNew:"కొత్త ఉద్యోగిని చేర్చండి",
   colEmp:"ఉద్యోగి వివరాలు",
   colDesignation:"హోదా / Designation",
   colJoin:"చేరిన తేదీ",
   colStatus:"ఈరోజు హాజరు",
   colLocation:"ప్రస్తుత స్థానం",
   colActions:"పనులు / Actions",
   addTitle:"కొత్త ఉద్యోగి నమోదు",
   editTitle:"ఉద్యోగి వివరాలు మార్చండి",
   labelName:"ఉద్యోగి పేరు",
   labelEmail:"ఈమెయిల్ చిరునామా",
   labelRole:"ఉద్యోగ బాధ్యత (Designation)",
   labelJoin:"జాయినింగ్ తేదీ",
   labelSalary:"నెలవారీ బేసిక్ జీతం (₹)",
   btnSave:"వివరాలు సేవ్ చేయండి",
   backDir:"డైరెక్టరీ లిస్ట్‌కు తిరిగి వెళ్ళండి",
   inspecting:"ఉద్యోగి ప్రొఫైల్ పరిశీలన:",
   tabAttend:"హాజరు పట్టిక",
   tabLeave:"సెలవుల నిల్వ",
   tabPayroll:"జీతం రశీదులు",
   tabDocs:"పత్రాలు",
   deleteEmployee:"ఉద్యోగిని తొలగించండి",
  }
 }[language];

 // Helper for determining today's status badge
 const getTodayStatusBadge = (emp: Employee) => {
  // ONLY the 2 corporate admins (Aswani & Divya) are exempt and shown as Admin
  if (isExemptAdmin(emp)) {
   return (
    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-100">
     {language === 'te' ? 'అడ్మిన్' : 'Admin'}
    </span>
   );
  }
  
  if (emp.isCheckedIn) {
   return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
     {t.checkedIn}
    </span>
   );
  }

  // Check if on leave today
  const todayStr = new Date().toISOString().split('T')[0];
  const isLeaveToday = emp.attendanceRecords?.find(r => r.date === todayStr && r.status === 'leave');
  if (isLeaveToday) {
   return (
    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
     {language === 'te' ? 'సెలవు' : 'On Leave'}
    </span>
   );
  }

  // Default checked out
  return (
   <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200/50">
    {language === 'te' ? 'హాజరు కాలేదు' : 'Checked Out'}
   </span>
  );
 };

 // --- INSPECTION MODE PANEL ---
 if (inspectingEmpId && activeEmployee) {
  return (
   <div id="directory-inspect-view"className="space-y-6 animate-fadeIn">
    {/* Inspection Header */}
    <div className="bg-white rounded-[32px] p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
     <div className="flex items-center gap-4">
      <button
       onClick={() => setInspectingEmpId(null)}
       className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-100 transition-all cursor-pointer"
       title={dirText.backDir}
      >
       <ArrowLeft className="w-4 h-4"/>
      </button>
      <div>
       <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">{dirText.inspecting}</p>
       <h2 className="text-xl font-bold font-display text-slate-800">{activeEmployee.name}</h2>
       <p className="text-xs text-slate-400 mt-0.5">{activeEmployee.designation} • {activeEmployee.id} • {activeEmployee.email}</p>
      </div>
     </div>

     <div className="flex w-full md:w-auto bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1">
      <button
       onClick={() => setInspectSubTab('attendance')}
       className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all uppercase cursor-pointer ${
        inspectSubTab === 'attendance' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
      >
       <Calendar className="w-3.5 h-3.5 shrink-0"/>
       <span className="hidden sm:inline">{dirText.tabAttend}</span>
       <span className="sm:hidden">Attendance</span>
      </button>
      <button
       onClick={() => setInspectSubTab('leave')}
       className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all uppercase cursor-pointer ${
        inspectSubTab === 'leave' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
      >
       <Moon className="w-3.5 h-3.5 shrink-0"/>
       <span className="hidden sm:inline">{dirText.tabLeave}</span>
       <span className="sm:hidden">Leaves</span>
      </button>
      <button
       onClick={() => setInspectSubTab('docs')}
       className={`flex-1 md:flex-none flex justify-center items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all uppercase cursor-pointer ${
        inspectSubTab === 'docs' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
       }`}
      >
       <FileText className="w-3.5 h-3.5 shrink-0"/>
       <span className="hidden sm:inline">{language === 'te' ? 'పత్రాలు' : 'Documents'}</span>
       <span className="sm:hidden">Docs</span>
      </button>
     </div>
    </div>

    {/* Render Selected View */}
    <div className="bg-white rounded-[32px] p-1 border border-slate-100 shadow-sm min-h-[400px]">
     {inspectSubTab === 'attendance' && (
      <div className="p-4 sm:p-6">
       <AttendanceModule
        language={language}
        attendanceRecords={activeEmployee.attendanceRecords}
       />
      </div>
     )}

     {inspectSubTab === 'leave' && (
      <div className="p-4 sm:p-6">
       <LeaveModule
        language={language}
        leaveBalance={activeEmployee.leaveBalance}
        monthlyQuota={activeEmployee.monthlyQuota!}
        leaveRequests={activeEmployee.leaveRequests}
        gender={activeEmployee.gender}
        onApplyLeave={(type, from, to, reason) => onApplyEmployeeLeave(activeEmployee.id, type, from, to, reason)}
        onApproveLeave={(reqId) => onApproveEmployeeLeave(activeEmployee.id, reqId)}
        onRejectLeave={(reqId) => onRejectEmployeeLeave(activeEmployee.id, reqId)}
        onUpdateBalances={(type, allotted, used) => onUpdateLeaveBalances(activeEmployee.id, type, allotted, used)}
       />
      </div>
     )}

     {inspectSubTab === 'docs' && (
      <div className="p-4 sm:p-6 flex flex-col items-center">
       <div className="w-full flex justify-end mb-6">
        <button
         onClick={handlePrintLetter}
         className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/15 transition-all"
        >
         <Printer className="w-4 h-4"/>
         {language === 'te' ? 'అనుభవ పత్రాన్ని ముద్రించండి' : 'Print Experience Letter'}
        </button>
       </div>
       <div className="w-full overflow-x-auto bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-200">
        <ExperienceLetter ref={letterRef} employee={activeEmployee} language={language} />
       </div>
      </div>
     )}
    </div>
   </div>
  );
 }

 // --- STANDARD DIRECTORY GRID LIST ---
 return (
  <div id="directory-roster-view"className="space-y-6 animate-fadeIn">
   
   {/* Directory Title Panel & Branch Filter */}
   <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
     <h2 className="text-xl font-bold font-display text-slate-800">
      {dirText.title}
     </h2>
     <p className="text-xs text-slate-400 mt-1">
      {dirText.subtitle}
     </p>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
     <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
      <button
       onClick={() => setDirectoryZoneFilter('all')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        directoryZoneFilter === 'all'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       All ({employees.length})
      </button>
      <button
       onClick={() => setDirectoryZoneFilter('AP')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        directoryZoneFilter === 'AP'
         ? 'bg-white text-emerald-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       AP Zone ({employees.filter(e => e.zone === 'AP' || e.branch === 'ap_zone').length})
      </button>
      <button
       onClick={() => setDirectoryZoneFilter('TS')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        directoryZoneFilter === 'TS'
         ? 'bg-white text-cyan-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       TS Zone ({employees.filter(e => e.zone === 'TS' || e.branch === 'ts_zone').length})
      </button>
      <button
       onClick={() => setDirectoryZoneFilter('Corporate')}
       className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
        directoryZoneFilter === 'Corporate'
         ? 'bg-white text-teal-700 shadow-sm'
         : 'text-slate-500 hover:text-slate-800'
       }`}
      >
       Corporate ({employees.filter(e => e.zone === 'Corporate' || e.branch === 'corporate' || !e.zone).length})
      </button>
     </div>

     <button
      id="btn-add-employee"
      onClick={handleOpenAdd}
      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-600/15 cursor-pointer transition-all active:scale-95"
     >
      <Plus className="w-4 h-4"/>
      <span>{dirText.btnNew}</span>
     </button>
    </div>
   </div>

   {/* Roster Listing Card */}
   <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full text-left border-collapse">
      <thead>
       <tr className="bg-slate-50/50 border-b border-slate-100">
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">{dirText.colEmp}</th>
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">{dirText.colDesignation}</th>
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">{dirText.colJoin}</th>
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">{dirText.colStatus}</th>
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">{dirText.colLocation}</th>
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">{dirText.colActions}</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
       {employees
        .filter(emp => {
         if (directoryZoneFilter === 'all') return true;
         if (directoryZoneFilter === 'AP') return emp.zone === 'AP' || emp.branch === 'ap_zone';
         if (directoryZoneFilter === 'TS') return emp.zone === 'TS' || emp.branch === 'ts_zone';
         if (directoryZoneFilter === 'Corporate') return emp.zone === 'Corporate' || emp.branch === 'corporate' || !emp.zone;
         return true;
        })
        .map((emp) => {
         const isCorporateAdmin = isExemptAdmin(emp);
         const isExec = emp.hierarchyLevel === 'executive' || emp.hierarchyLevel === 'admin';
         const isZsm = emp.hierarchyLevel === 'zsm';
         const isRsm = emp.hierarchyLevel === 'rsm';
         const zoneTag = emp.zone === 'AP' || emp.branch === 'ap_zone'
          ? { label: 'AP Zone', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
          : (emp.zone === 'TS' || emp.branch === 'ts_zone'
              ? { label: 'TS Zone', cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' }
              : { label: 'Corporate', cls: 'bg-teal-50 text-teal-700 border border-teal-200' });

         const manager = emp.reportingTo ? employees.find(m => m.id === emp.reportingTo || m.employeeCode === emp.reportingTo) : null;

         return (
        <tr
         key={emp.id}
         id={`roster-row-${emp.id}`}
         onClick={() => setInspectingEmpId(emp.id)}
         className={`hover:bg-slate-50/50 cursor-pointer transition-all group ${emp.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}
        >
         {/* Name and ID */}
         <td className="p-4 sm:p-5 max-w-[200px] sm:max-w-none">
          <div className="flex items-center gap-3">
           <div className={`min-w-[36px] w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs group-hover:scale-105 transition-all shrink-0 ${
            isCorporateAdmin ? 'bg-teal-100 text-teal-800' : isExec ? 'bg-amber-100 text-amber-800' : isZsm ? 'bg-teal-100 text-teal-800' : isRsm ? 'bg-blue-100 text-blue-800' : emp.status === 'inactive' ? 'bg-slate-200 text-slate-500' : 'bg-teal-50 text-teal-700'
           }`}>
            {emp.name.split(' ').map(n => n[0]).join('')}
           </div>
           <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
             <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors truncate">
              {emp.name}
             </p>
             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${zoneTag.cls}`}>
              {zoneTag.label}
             </span>
             {isCorporateAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
               Admin
              </span>
             )}
             {!isCorporateAdmin && isExec && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
               Exec
              </span>
             )}
             {isZsm && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
               ZSM
              </span>
             )}
             {isRsm && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
               RSM
              </span>
             )}
             {emp.status === 'inactive' && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[8px] rounded uppercase font-bold shrink-0">Inactive</span>}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-1.5 overflow-hidden">
             <span className="truncate block max-w-full">{emp.id} • {emp.email}</span>
             {emp.reportingTo && <span className="text-slate-400 font-medium truncate">↳ Reports to: {manager?.name || emp.reportingTo}</span>}
            </div>
           </div>
          </div>
         </td>

         {/* Designation */}
         <td className="p-5 hidden sm:table-cell">
          <div className="flex flex-col gap-1 items-start">
           <span className="text-xs font-semibold text-slate-600">{emp.designation}</span>
           {((emp.experience && emp.experience >= 1) || new Date(emp.joiningDate) <= new Date(new Date().setFullYear(new Date().getFullYear() - 1))) && (
            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
             {language === 'te' ? 'అడ్వాన్స్‌కు అర్హులు' : 'Advance Eligible'}
            </span>
           )}
          </div>
         </td>

         {/* Joining Date */}
         <td className="p-5 hidden md:table-cell">
          <span className="text-xs text-slate-500 font-mono">{emp.joiningDate}</span>
         </td>

         {/* Attendance status */}
         <td className="p-5 hidden sm:table-cell">
          <div className="flex flex-col gap-2 items-start">
           {getTodayStatusBadge(emp)}
          </div>
         </td>

         {/* Location column */}
         <td className="p-5 hidden lg:table-cell">
          {(() => {
           const todayStr = new Date().toISOString().split('T')[0];
           const todayLog = emp.checkInLogs.find(log => log.date === todayStr);
           
           if (!todayLog) return <span className="text-slate-300">-</span>;

           return (
            <div className="flex flex-col gap-3">
             {todayLog.photoUrl || todayLog.checkInLocation ? (
              <div className="flex items-start gap-2">
               {todayLog.photoUrl && (
                <img 
                 src={todayLog.photoUrl} 
                 title="Check-in Photo"
                 onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl(todayLog.photoUrl!); }}
                 className="w-8 h-8 object-cover rounded border border-slate-200 cursor-pointer hover:ring-2 hover:ring-teal-500 transition-all shrink-0 mt-0.5"
                />
               )}
               {todayLog.checkInLocation && (
                <div className="text-[10px] text-slate-600 font-medium leading-tight flex items-start gap-1">
                 <span className="text-teal-600 shrink-0 mt-0.5">📍</span>
                 <span className={todayLog.checkInLocation.toLowerCase().includes('camp') ? 'text-indigo-600 font-bold' : ''}>
                  {todayLog.checkInLocation}
                 </span>
                </div>
               )}
              </div>
             ) : null}

             {todayLog.checkOutPhotoUrl || todayLog.checkOutLocation ? (
              <div className="flex items-start gap-2">
               {todayLog.checkOutPhotoUrl && (
                <img 
                 src={todayLog.checkOutPhotoUrl} 
                 title="Check-out Photo"
                 onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl(todayLog.checkOutPhotoUrl!); }}
                 className="w-8 h-8 object-cover rounded border border-slate-200 cursor-pointer hover:ring-2 hover:ring-rose-400 transition-all shrink-0 mt-0.5"
                />
               )}
               {todayLog.checkOutLocation && (
                <div className="text-[10px] text-slate-600 font-medium leading-tight flex items-start gap-1">
                 <span className="text-rose-400 shrink-0 mt-0.5">📍</span>
                 <span className={todayLog.checkOutLocation.toLowerCase().includes('camp') ? 'text-indigo-600 font-bold' : ''}>
                  {todayLog.checkOutLocation}
                 </span>
                </div>
               )}
              </div>
             ) : null}

             {!todayLog.checkInLocation && !todayLog.checkOutLocation && !todayLog.photoUrl && <span className="text-slate-300">-</span>}
            </div>
           );
          })()}
         </td>

         {/* Actions */}
         <td className="p-5 text-right"onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
           <button
            onClick={(e) => handleOpenEdit(emp, e)}
            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
            title={dirText.editTitle}
           >
            <Edit3 className="w-3.5 h-3.5"/>
           </button>
           
           {!isCorporateAdmin && (
            <button
             onClick={(e) => handleToggleStatus(emp.id, emp.name, emp.status || 'active', e)}
             className={`p-2 rounded-lg transition-colors cursor-pointer ${
              emp.status === 'inactive' 
               ? 'text-teal-600 hover:bg-teal-50' 
               : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
             }`}
             title={emp.status === 'inactive' ? (language === 'te' ? 'యాక్టివేట్' : 'Reactivate') : (language === 'te' ? 'నిలిపివేయి' : 'Deactivate')}
            >
             <Power className="w-3.5 h-3.5"/>
            </button>
           )}
          </div>
         </td>
        </tr>
       );
      })}
      </tbody>
     </table>
    </div>
   </div>

   {/* --- ADD EMPLOYEE DIALOG MODAL --- */}
   {showAddModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
     <div className="bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-lg shadow-md animate-scaleUp flex flex-col max-h-[90vh] my-auto overflow-hidden border border-slate-100">
      {/* Modal Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
       <h3 className="text-lg font-bold text-slate-800">{dirText.addTitle}</h3>
       <button
        type="button"
        onClick={() => setShowAddModal(false)}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
       >
        <X className="w-5 h-5"/>
       </button>
      </div>
      
      {/* Scrollable Form Body */}
      <form onSubmit={handleAddSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelName}</label>
        <div className="relative">
         <User className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="text"
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelEmail}</label>
        <div className="relative">
         <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="email"
          required
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
         <input
          type="text"
          value={formPhone}
          onChange={(e) => setFormPhone(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
         <div className="relative">
          <input
           type={showPassword ?"text":"password"}
           required
           value={formPassword}
           onChange={(e) => setFormPassword(e.target.value)}
           className="w-full px-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
          />
          <button
           type="button"
           onClick={() => setShowPassword(!showPassword)}
           className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
          >
           {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
          </button>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelRole}</label>
         <input
          type="text"
          required
          value={formDesignation}
          onChange={(e) => setFormDesignation(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelSalary}</label>
         <div className="relative">
          <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
          <input
           type="number"
           required
           value={formBasicSalary}
           onChange={(e) => setFormBasicSalary(Number(e.target.value))}
           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"
          />
         </div>
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelJoin}</label>
        <div className="relative">
         <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="date"
          required
          value={formJoiningDate}
          onChange={(e) => setFormJoiningDate(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"
         />
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</label>
        <select
         value={formGender || ''}
         onChange={(e) => setFormGender(e.target.value as any || undefined)}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        >
         <option value="">Select Gender</option>
         <option value="male">Male</option>
         <option value="female">Female</option>
         <option value="other">Other</option>
        </select>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience (Years)</label>
        <input
         type="number"
         step="0.1"
         required
         value={formExperience}
         onChange={(e) => setFormExperience(Number(e.target.value))}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        />
       </div>

       <div className="pt-2 pb-2 mt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 mb-3">{t.bankDetails || 'Bank Details'}</h4>
        <div className="grid grid-cols-2 gap-4 mb-2">
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankName || 'Bank Name'}</label>
          <input type="text"value={formBankName} onChange={e => setFormBankName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankAccountNo || 'Account No'}</label>
          <input type="text"value={formBankAccountNo} onChange={e => setFormBankAccountNo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankIfsc || 'IFSC Code'}</label>
          <input type="text"value={formBankIfsc} onChange={e => setFormBankIfsc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankAccountType || 'Account Type'}</label>
          <select value={formBankAccountType} onChange={e => setFormBankAccountType(e.target.value as 'savings'|'current')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700">
           <option value="savings">Savings</option>
           <option value="current">Current</option>
          </select>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch Location</label>
         <select
          value={formBranch}
          onChange={(e) => setFormBranch(e.target.value as Branch)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="ap_zone">AP Zone (Andhra Pradesh)</option>
          <option value="ts_zone">TS Zone (Telangana)</option>
          <option value="corporate">Corporate HQ</option>
         </select>
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hierarchy Tier</label>
         <select
          value={formHierarchyLevel}
          onChange={(e) => setFormHierarchyLevel(e.target.value as HierarchyLevel)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="be">Business Executive (BE)</option>
          <option value="rsm">Regional Sales Manager (RSM)</option>
          <option value="zsm">Zonal Sales Manager (ZSM)</option>
          <option value="admin">Corporate Admin</option>
          <option value="executive">General Manager (GM)</option>
         </select>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role</label>
         <select
          value={formRole}
          onChange={(e) => setFormRole(e.target.value as 'admin' | 'employee')}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
         </select>
        </div>
        
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
         <select
          value={formStatus}
          onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
         </select>
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</label>
        <select
         value={formReportingTo}
         onChange={(e) => setFormReportingTo(e.target.value)}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        >
         <option value="">No Direct Manager (Top Leadership)</option>
         {employees.map(m => (
           <option key={m.id} value={m.id}>
             {m.name} ({m.designation || m.hierarchyLevel?.toUpperCase()} • {m.zone || m.branch})
           </option>
         ))}
        </select>
       </div>

       {/* Action Buttons */}
       <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
         type="button"
         onClick={() => setShowAddModal(false)}
         className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
        >
         {t.cancel}
        </button>
        <button
         type="submit"
         className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer shadow-md shadow-teal-600/20"
        >
         {dirText.btnSave}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* --- EDIT EMPLOYEE DIALOG MODAL --- */}
   {showEditModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
     <div className="bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-lg shadow-md animate-scaleUp flex flex-col max-h-[90vh] my-auto overflow-hidden border border-slate-100">
      {/* Modal Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
       <h3 className="text-lg font-bold text-slate-800">{dirText.editTitle}</h3>
       <button
        type="button"
        onClick={() => setShowEditModal(false)}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
       >
        <X className="w-5 h-5"/>
       </button>
      </div>
      
      {/* Scrollable Form Body */}
      <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelName}</label>
        <div className="relative">
         <User className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="text"
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelEmail}</label>
        <div className="relative">
         <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="email"
          required
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
         <input
          type="text"
          value={formPhone}
          onChange={(e) => setFormPhone(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
         <div className="relative">
          <input
           type={showPassword ?"text":"password"}
           required
           value={formPassword}
           onChange={(e) => setFormPassword(e.target.value)}
           className="w-full px-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
          />
          <button
           type="button"
           onClick={() => setShowPassword(!showPassword)}
           className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
          >
           {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
          </button>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelRole}</label>
         <input
          type="text"
          required
          value={formDesignation}
          onChange={(e) => setFormDesignation(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         />
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelSalary}</label>
         <div className="relative">
          <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
          <input
           type="number"
           required
           value={formBasicSalary}
           onChange={(e) => setFormBasicSalary(Number(e.target.value))}
           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"
          />
         </div>
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{dirText.labelJoin}</label>
        <div className="relative">
         <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
         <input
          type="date"
          required
          value={formJoiningDate}
          onChange={(e) => setFormJoiningDate(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"
         />
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</label>
        <select
         value={formGender || ''}
         onChange={(e) => setFormGender(e.target.value as any || undefined)}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        >
         <option value="">Select Gender</option>
         <option value="male">Male</option>
         <option value="female">Female</option>
         <option value="other">Other</option>
        </select>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience (Years)</label>
        <input
         type="number"
         step="0.1"
         required
         value={formExperience}
         onChange={(e) => setFormExperience(Number(e.target.value))}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        />
       </div>

       <div className="pt-2 pb-2 mt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 mb-3">{t.bankDetails || 'Bank Details'}</h4>
        <div className="grid grid-cols-2 gap-4 mb-2">
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankName || 'Bank Name'}</label>
          <input type="text"value={formBankName} onChange={e => setFormBankName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankAccountNo || 'Account No'}</label>
          <input type="text"value={formBankAccountNo} onChange={e => setFormBankAccountNo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankIfsc || 'IFSC Code'}</label>
          <input type="text"value={formBankIfsc} onChange={e => setFormBankIfsc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700 font-mono"/>
         </div>
         <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.bankAccountType || 'Account Type'}</label>
          <select value={formBankAccountType} onChange={e => setFormBankAccountType(e.target.value as 'savings'|'current')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700">
           <option value="savings">Savings</option>
           <option value="current">Current</option>
          </select>
         </div>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch Location</label>
         <select
          value={formBranch}
          onChange={(e) => setFormBranch(e.target.value as Branch)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="ap_zone">AP Zone (Andhra Pradesh)</option>
          <option value="ts_zone">TS Zone (Telangana)</option>
          <option value="corporate">Corporate HQ</option>
         </select>
        </div>

        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hierarchy Tier</label>
         <select
          value={formHierarchyLevel}
          onChange={(e) => setFormHierarchyLevel(e.target.value as HierarchyLevel)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="be">Business Executive (BE)</option>
          <option value="rsm">Regional Sales Manager (RSM)</option>
          <option value="zsm">Zonal Sales Manager (ZSM)</option>
          <option value="admin">Corporate Admin</option>
          <option value="executive">General Manager (GM)</option>
         </select>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role</label>
         <select
          value={formRole}
          onChange={(e) => setFormRole(e.target.value as 'admin' | 'employee')}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
         </select>
        </div>
        
        <div className="space-y-1">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
         <select
          value={formStatus}
          onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
         >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
         </select>
        </div>
       </div>

       <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</label>
        <select
         value={formReportingTo}
         onChange={(e) => setFormReportingTo(e.target.value)}
         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-slate-700"
        >
         <option value="">No Direct Manager (Top Leadership)</option>
         {employees
           .filter(e => e.id !== editTargetId)
           .map(m => (
             <option key={m.id} value={m.id}>
               {m.name} ({m.designation || m.hierarchyLevel?.toUpperCase()} • {m.zone || m.branch})
             </option>
           ))}
        </select>
       </div>

       {/* Action Buttons */}
       <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-100">
        <button
         type="button"
         onClick={handlePermanentDelete}
         className="px-4 py-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
         <Trash2 className="w-4 h-4"/>
         {language === 'te' ? 'శాశ్వతంగా తొలగించండి' : 'Permanent Delete'}
        </button>
        <div className="flex justify-end gap-3">
         <button
          type="button"
          onClick={() => setShowEditModal(false)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
         >
          {t.cancel}
         </button>
         <button
          type="submit"
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer shadow-md shadow-teal-600/20"
         >
          {dirText.btnSave}
         </button>
        </div>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Photo Viewer Modal */}
   {viewingPhotoUrl && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 animate-in fade-in duration-200"onClick={() => setViewingPhotoUrl(null)}>
     <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"onClick={e => e.stopPropagation()}>
      <button 
       onClick={() => setViewingPhotoUrl(null)}
       className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
      >
       <Trash2 className="w-6 h-6 hidden"/>
       <span className="text-xl font-bold px-2 block leading-none">×</span>
      </button>
      <img src={viewingPhotoUrl} alt="Check In Full"className="w-auto h-auto max-w-full max-h-[85vh] rounded-2xl shadow-md object-contain border-4 border-white/10"/>
     </div>
    </div>
   )}
  </div>
 );
}
