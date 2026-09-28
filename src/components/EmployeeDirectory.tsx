import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Trash2, ArrowLeft, Calendar, Moon, User, Mail, IndianRupee, CalendarDays, Eye, EyeOff, Power, FileText, Printer, X, Building2, ChevronDown, Download, BarChart2, FileSpreadsheet } from 'lucide-react';
import { Language, Employee, LeaveType, Branch, HierarchyLevel, isExemptAdmin, Task } from '../types';
import { translations } from '../translations';
import AttendanceModule from './AttendanceModule';
import LeaveModule from './LeaveModule';
import ExperienceLetter from './ExperienceLetter';
import ExportLeadsModal from './ExportLeadsModal';
import { 
  isUserAdminOrRsm, 
  getWeeklyDateRange, 
  getMonthlyDateRange, 
  calculateEmployeeLeads, 
  downloadLeadsReport 
} from '../lib/services/leads-service';

interface EmployeeDirectoryProps {
  language: Language;
  employees: Employee[];
  currentUser?: Employee;
  allEmployees?: Employee[];
  tasks?: Task[];
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
  currentUser,
  allEmployees,
  tasks = [],
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

 // Leads Export, Calendar & Status State
 const [showExportModal, setShowExportModal] = useState(false);
 const [exportModalPeriod, setExportModalPeriod] = useState<'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'>('this_week');
 const [showExportDropdown, setShowExportDropdown] = useState(false);
 const [isDirectExporting, setIsDirectExporting] = useState(false);
 const [weeklyLeadsSummary, setWeeklyLeadsSummary] = useState<Map<string, { completed: number; ongoing: number; yetToStart: number; total: number; rate: number }>>(new Map());

 const initialWeek = getWeeklyDateRange(0);
 const [calendarRange, setCalendarRange] = useState<{
  startDate: string;
  endDate: string;
  label: string;
  preset: 'this_week' | 'last_week' | 'next_week' | 'this_month' | 'last_month' | 'custom';
 }>({
  startDate: initialWeek.startDate,
  endDate: initialWeek.endDate,
  label: initialWeek.label,
  preset: 'this_week'
 });
 const [customStartInput, setCustomStartInput] = useState(initialWeek.startDate);
 const [customEndInput, setCustomEndInput] = useState(initialWeek.endDate);

 const { isAdmin, isRsm, canExport } = isUserAdminOrRsm(currentUser);

 // Load leads metrics for employees dynamically synced with active calendarRange
 useEffect(() => {
  if (!canExport) return;
  let isMounted = true;
  calculateEmployeeLeads(
   employees, 
   allEmployees || employees, 
   tasks, 
   calendarRange.startDate, 
   calendarRange.endDate, 
   calendarRange.preset === 'custom' ? 'custom' : calendarRange.preset.includes('month') ? 'monthly' : 'weekly', 
   calendarRange.label, 
   currentUser
  )
   .then(items => {
    if (!isMounted) return;
    const map = new Map<string, { completed: number; ongoing: number; yetToStart: number; total: number; rate: number }>();
    items.forEach(it => {
     map.set(it.employeeId, {
      completed: it.completedLeads,
      ongoing: it.ongoingLeads,
      yetToStart: it.yetToStartLeads,
      total: it.totalLeads,
      rate: it.completionRate
     });
    });
    setWeeklyLeadsSummary(map);
   })
   .catch(err => console.warn('Could not compute leads map:', err));

  return () => {
   isMounted = false;
  };
 }, [employees, allEmployees, tasks, canExport, currentUser, calendarRange]);

 const handleSelectTimeframe = (preset: 'this_week' | 'last_week' | 'next_week' | 'this_month' | 'last_month') => {
  let range: { startDate: string; endDate: string; label: string };
  if (preset === 'next_week') {
   range = getWeeklyDateRange(1);
  } else if (preset === 'this_week') {
   range = getWeeklyDateRange(0);
  } else if (preset === 'last_week') {
   range = getWeeklyDateRange(-1);
  } else if (preset === 'this_month') {
   range = getMonthlyDateRange(0);
  } else {
   range = getMonthlyDateRange(-1);
  }
  setCalendarRange({ ...range, preset });
  setShowExportDropdown(false);
 };

 const handleDirectExport = async (type: 'this_week' | 'last_week' | 'next_week' | 'this_month' | 'last_month' | 'active_calendar' | 'custom') => {
  setShowExportDropdown(false);
  if (!currentUser) return;
  setIsDirectExporting(true);
  try {
   let range: { startDate: string; endDate: string; label: string; periodType: 'weekly' | 'monthly' | 'custom' };
   if (type === 'active_calendar') {
    range = {
     startDate: calendarRange.startDate,
     endDate: calendarRange.endDate,
     label: calendarRange.label,
     periodType: calendarRange.preset === 'custom' ? 'custom' : calendarRange.preset.includes('month') ? 'monthly' : 'weekly'
    };
   } else if (type === 'next_week') {
    range = { ...getWeeklyDateRange(1), periodType: 'weekly' };
   } else if (type === 'this_week') {
    range = { ...getWeeklyDateRange(0), periodType: 'weekly' };
   } else if (type === 'last_week') {
    range = { ...getWeeklyDateRange(-1), periodType: 'weekly' };
   } else if (type === 'this_month') {
    range = { ...getMonthlyDateRange(0), periodType: 'monthly' };
   } else if (type === 'last_month') {
    range = { ...getMonthlyDateRange(-1), periodType: 'monthly' };
   } else {
    range = {
     startDate: customStartInput,
     endDate: customEndInput,
     label: `Custom Period (${customStartInput} to ${customEndInput})`,
     periodType: 'custom'
    };
   }

   const reportItems = await calculateEmployeeLeads(
    employees,
    allEmployees || employees,
    tasks,
    range.startDate,
    range.endDate,
    range.periodType,
    range.label,
    currentUser
   );

   downloadLeadsReport(reportItems, range.label, currentUser);
  } catch (err: any) {
   console.error("Direct export error:", err);
   alert("Failed to export leads report: " + (err?.message || String(err)));
  } finally {
   setIsDirectExporting(false);
  }
 };

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

     {/* Combined Single Leads Calendar & Export Dropdown (RSM & Admin Only) */}
     {canExport && (
      <div className="relative inline-block text-left">
       <button
        id="btn-export-leads-dropdown"
        onClick={() => setShowExportDropdown(!showExportDropdown)}
        disabled={isDirectExporting}
        className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 hover:from-slate-800 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-slate-900/15 cursor-pointer transition-all active:scale-95 border border-teal-700/30"
        title={language === 'te' ? 'ఉద్యోగుల లీడ్స్ నివేదిక ఎగుమతి మరియు క్యాలెండర్' : 'Export Employee Leads & Select Calendar Range'}
       >
        <FileSpreadsheet className="w-4 h-4 text-teal-300 shrink-0" />
        <div className="flex flex-col items-start text-left leading-tight">
         <span className="font-bold">{language === 'te' ? 'లీడ్స్ ఎగుమతి' : 'Export Leads'}</span>
         <span className="text-[9px] text-teal-300 font-medium">
          {calendarRange.preset === 'custom' ? 'Custom Range' : calendarRange.label.split('(')[0]?.trim()}
         </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
       </button>

       {showExportDropdown && (
        <>
         <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowExportDropdown(false)} 
         />
         
         <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-40 animate-scaleUp">
          {/* Header */}
          <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
           <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
             {language === 'te' ? 'లీడ్స్ ఎగుమతి & క్యాలెండర్' : 'Export Leads & Timeframe'}
            </span>
            <span className="text-[9px] text-slate-400">
             {language === 'te' ? 'ఫీల్డ్ ఉద్యోగుల లీడ్స్ డేటా' : 'Field Representatives Lead Reports'}
            </span>
           </div>
           <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
            {isAdmin ? 'Admin' : 'RSM'}
           </span>
          </div>

          {/* Active Timeframe Direct Export Banner */}
          <div className="p-3 mx-3 my-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200/70 flex items-center justify-between gap-2">
           <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Active Calendar Leads</span>
            <span className="text-xs font-bold text-slate-800 truncate">{calendarRange.label}</span>
           </div>
           <button
            onClick={() => handleDirectExport('active_calendar')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
            title="Download CSV for currently active calendar leads"
           >
            <Download className="w-3.5 h-3.5" />
            <span>Export .CSV</span>
           </button>
          </div>

          {/* Timeframe Presets (Both sides combined: Left = Select Active Calendar, Right = Direct Download CSV) */}
          <div className="px-3 py-1 space-y-1.5">
           <div className="px-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'te' ? 'కాలపరిమితిని ఎంచుకోండి / డౌన్‌లోడ్ చేయండి' : 'Select Timeframe / Quick Export'}
           </div>

           {[
            {
             id: 'this_week',
             title: language === 'te' ? 'ఈ వారం లీడ్స్' : 'This Week Leads',
             subtitle: 'Current Week (Mon - Sun)',
             badge: 'Current'
            },
            {
             id: 'last_week',
             title: language === 'te' ? 'గత వారం లీడ్స్' : 'Last Week Leads',
             subtitle: 'Previous Week (-1 Week)',
             badge: '-1 W'
            },
            {
             id: 'next_week',
             title: language === 'te' ? 'వచ్చే వారం లీడ్స్' : 'Next Week Leads',
             subtitle: 'Upcoming Week (+1 Week)',
             badge: '+1 W'
            },
            {
             id: 'this_month',
             title: language === 'te' ? 'ఈ నెల లీడ్స్ (ప్రతి నెల)' : 'Every Month Leads',
             subtitle: 'Current Month Leads',
             badge: 'Month'
            },
            {
             id: 'last_month',
             title: language === 'te' ? 'గత నెల లీడ్స్' : 'Previous Month Leads',
             subtitle: 'Previous Month Leads',
             badge: '-1 M'
            }
           ].map(opt => {
            const isActive = calendarRange.preset === opt.id;
            return (
             <div
              key={opt.id}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
               isActive 
                ? 'bg-teal-50/80 border-teal-300/80 shadow-xs' 
                : 'bg-white hover:bg-slate-50 border-slate-100'
              }`}
             >
              {/* Left Side: Click to select as active calendar leads ("if we click on the last week the last week leads should be come") */}
              <button
               type="button"
               onClick={() => handleSelectTimeframe(opt.id as any)}
               className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
              >
               <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                isActive ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
               }`}>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
               </div>
               <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                 <span className={`text-xs font-bold truncate ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>
                  {opt.title}
                 </span>
                 <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                  {opt.badge}
                 </span>
                </div>
                <span className="text-[9px] text-slate-400 truncate">{opt.subtitle}</span>
               </div>
              </button>

              {/* Right Side: Quick Export Button for this specific timeframe */}
              <button
               type="button"
               onClick={(e) => {
                e.stopPropagation();
                handleDirectExport(opt.id as any);
               }}
               className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 text-[10px] font-bold transition-all shrink-0 ml-2 cursor-pointer group"
               title={`Export ${opt.title} (.CSV)`}
              >
               <Download className="w-3 h-3 text-slate-500 group-hover:text-white" />
               <span>.CSV</span>
              </button>
             </div>
            );
           })}
          </div>

          {/* Custom Date Range Picker */}
          <div className="px-3 pt-2 mt-2 border-t border-slate-100 space-y-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'te' ? 'కస్టమ్ తేదీ పరిధి' : 'Custom Date Range'}
           </span>
           <div className="grid grid-cols-2 gap-2">
            <div>
             <label className="text-[9px] font-bold text-slate-400 block mb-0.5">From</label>
             <input
              type="date"
              value={customStartInput}
              onChange={(e) => setCustomStartInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
             />
            </div>
            <div>
             <label className="text-[9px] font-bold text-slate-400 block mb-0.5">To</label>
             <input
              type="date"
              value={customEndInput}
              onChange={(e) => setCustomEndInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
             />
            </div>
           </div>
           <div className="grid grid-cols-2 gap-2 pt-1">
            <button
             onClick={() => {
              if (customStartInput && customEndInput) {
               setCalendarRange({
                startDate: customStartInput,
                endDate: customEndInput,
                label: `Custom (${customStartInput} to ${customEndInput})`,
                preset: 'custom'
               });
               setShowExportDropdown(false);
              }
             }}
             className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
            >
             {language === 'te' ? 'పరిధి వర్తింపజేయి' : 'Apply to Table'}
            </button>
            <button
             onClick={() => handleDirectExport('custom')}
             className="py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs"
            >
             <Download className="w-3 h-3" />
             <span>{language === 'te' ? 'ఎగుమతి చేయండి' : 'Export Custom'}</span>
            </button>
           </div>
          </div>

          {/* Preview Modal Trigger */}
          <div className="px-3 pt-2 mt-2 border-t border-slate-100">
           <button
            onClick={() => {
             setShowExportDropdown(false);
             setExportModalPeriod(calendarRange.preset);
             setShowExportModal(true);
            }}
            className="w-full text-center px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
           >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'పూర్తి ప్రివ్యూ & వివరాలు...' : 'Preview Leads & Full Table...'}</span>
           </button>
          </div>

         </div>
        </>
       )}
      </div>
     )}

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
        <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">
         {language === 'te' ? 'ఉద్యోగి స్థితి' : 'Employee Status'}
        </th>
        {canExport && (
         <th className="p-5 text-[10px] font-black uppercase tracking-wider text-teal-700 hidden md:table-cell">
          <div className="flex items-center gap-1.5 flex-wrap">
           <span>{language === 'te' ? 'లీడ్స్ స్థితి' : 'Leads Status'}</span>
           <span className="px-1.5 py-0.5 rounded bg-teal-50 text-[9px] font-mono text-teal-800 border border-teal-200 normal-case font-bold">
            {calendarRange.preset === 'custom' ? 'Custom Range' : calendarRange.label.split('(')[0]?.trim()}
           </span>
          </div>
         </th>
        )}
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

         {/* Employee Status (Account Status) */}
         <td className="p-5 hidden sm:table-cell">
          <div className="flex flex-col gap-1 items-start">
           {/* Account Status Badge */}
           <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
            emp.status === 'inactive' 
             ? 'bg-rose-50 text-rose-700 border-rose-200' 
             : 'bg-emerald-50 text-emerald-700 border-emerald-200'
           }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'inactive' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            {emp.status === 'inactive' ? (language === 'te' ? 'నిష్క్రియం' : 'Inactive') : (language === 'te' ? 'యాక్టివ్' : 'Active')}
           </span>
          </div>
         </td>

         {/* Weekly Leads Status for Admin & RSM */}
         {canExport && (
          <td className="p-5 hidden md:table-cell" onClick={(e) => {
           e.stopPropagation();
           setExportModalPeriod(calendarRange.preset);
           setShowExportModal(true);
          }}>
           {(() => {
            const isLeadership = 
             emp.role === 'admin' ||
             emp.hierarchyLevel === 'admin' ||
             emp.hierarchyLevel === 'executive' ||
             emp.hierarchyLevel === 'zsm' ||
             emp.hierarchyLevel === 'rsm' ||
             emp.hierarchyLevel === 'manager' ||
             isExemptAdmin(emp) ||
             (emp.designation && /admin|gm|general\s*manager|zsm|rsm|regional\s*sales\s*manager|hr\s*&\s*fin/i.test(emp.designation));

            if (isLeadership) {
             return <span className="text-[10px] text-slate-400 italic font-medium">Management</span>;
            }

            if (emp.status === 'inactive') {
             return <span className="text-[10px] text-slate-400 italic">No Active Leads</span>;
            }

            const summary = weeklyLeadsSummary.get(emp.id) || { completed: 0, ongoing: 0, yetToStart: 0, total: 0, rate: 0 };
            return (
             <div className="flex flex-col gap-1.5 items-start hover:opacity-85 transition-opacity cursor-pointer group/lead" title="Click to view full leads performance">
              <div className="flex items-center gap-1.5 flex-wrap">
               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Completed Leads">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {summary.completed} Done
               </span>
               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Ongoing Leads">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {summary.ongoing} Active
               </span>
               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200" title="Yet to Start Leads">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {summary.yetToStart} New
               </span>
              </div>
              <div className="flex items-center gap-2 w-full max-w-[120px]">
               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                 className="h-full bg-teal-600 rounded-full transition-all" 
                 style={{ width: `${Math.min(100, summary.rate)}%` }} 
                />
               </div>
               <span className="text-[9px] font-bold text-slate-500">{summary.rate}%</span>
              </div>
             </div>
            );
           })()}
          </td>
         )}

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

   {/* Export Leads Modal (RSM & Admin Only) */}
   {canExport && currentUser && (
    <ExportLeadsModal
     language={language}
     isOpen={showExportModal}
     onClose={() => setShowExportModal(false)}
     employees={employees}
     allEmployees={allEmployees || employees}
     tasks={tasks}
     currentUser={currentUser}
     initialPeriod={exportModalPeriod}
    />
   )}
  </div>
 );
}
