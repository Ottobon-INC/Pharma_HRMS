import { supabase } from '../supabase-client';
import { Employee, Task, isExemptAdmin } from '../../types';

export interface EmployeeLeadReportItem {
  employeeId: string;
  employeeName: string;
  designation: string;
  hierarchyLevel: string;
  zone: string;
  branch: string;
  reportingToName: string;
  accountStatus: 'active' | 'inactive' | 'pending';
  attendanceStatus: 'Checked In' | 'Checked Out' | 'On Leave' | 'Admin Exempt';
  periodType: 'weekly' | 'monthly' | 'custom';
  periodLabel: string;
  startDate: string;
  endDate: string;
  completedLeads: number;
  ongoingLeads: number;
  yetToStartLeads: number;
  totalLeads: number;
  completionRate: number; // percentage (0 - 100)
}

export interface PeriodOption {
  id: string;
  label: string;
  type: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

/**
 * Computes Monday-Sunday date range with optional offset in weeks.
 */
export function getWeeklyDateRange(weekOffset = 0): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay();
  // Monday is day 1, Sunday is day 0 (make Sunday 7)
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
  
  const monday = new Date(d.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startIso = monday.toISOString().split('T')[0];
  const endIso = sunday.toISOString().split('T')[0];

  const formatStr = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const label = weekOffset === 0 
    ? `This Week (${formatStr(monday)} - ${formatStr(sunday)})`
    : weekOffset === -1
      ? `Last Week (${formatStr(monday)} - ${formatStr(sunday)})`
      : weekOffset === 1
        ? `Next Week (${formatStr(monday)} - ${formatStr(sunday)})`
        : `Week (${formatStr(monday)} - ${formatStr(sunday)})`;

  return { startDate: startIso, endDate: endIso, label };
}

/**
 * Computes 1st to last day of month with optional offset in months.
 */
export function getMonthlyDateRange(monthOffset = 0): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + monthOffset;

  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);

  const startIso = firstDay.toISOString().split('T')[0];
  const endIso = lastDay.toISOString().split('T')[0];

  const monthName = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const label = monthOffset === 0
    ? `Every Month Leads (${monthName})`
    : monthOffset === -1
      ? `Previous Month Leads (${monthName})`
      : `Month (${monthName})`;

  return { startDate: startIso, endDate: endIso, label };
}

/**
 * Checks if current user is an Admin or RSM eligible to view/export leads.
 */
export function isUserAdminOrRsm(user: Employee | null | undefined): { isAdmin: boolean; isRsm: boolean; canExport: boolean } {
  if (!user) return { isAdmin: false, isRsm: false, canExport: false };

  const isAdmin = 
    user.role === 'admin' || 
    user.hierarchyLevel === 'admin' || 
    user.hierarchyLevel === 'executive' || 
    isExemptAdmin(user);

  const isRsm = 
    user.hierarchyLevel === 'rsm' || 
    user.hierarchyLevel === 'manager' ||
    user.hierarchyLevel === 'zsm' || 
    (user.designation ? /rsm|regional\s*sales\s*manager|area\s*sales|zsm/i.test(user.designation) : false);

  return {
    isAdmin,
    isRsm,
    canExport: isAdmin || isRsm
  };
}

/**
 * Strictly filters employees to ONLY field personnel (BEs) who execute leads.
 * Excludes Admins, GMs, ZSMs, RSMs, and Managers.
 * For an RSM: Only includes BEs who report directly to that RSM.
 * For an Admin: Includes all BEs across the organization.
 */
export function filterFieldEmployeesOnly(
  employees: Employee[],
  currentUser?: Employee
): Employee[] {
  return employees.filter(emp => {
    // Exclude all management & leadership
    const isLeadership = 
      emp.role === 'admin' ||
      emp.hierarchyLevel === 'admin' ||
      emp.hierarchyLevel === 'executive' ||
      emp.hierarchyLevel === 'zsm' ||
      emp.hierarchyLevel === 'rsm' ||
      emp.hierarchyLevel === 'manager' ||
      isExemptAdmin(emp) ||
      (emp.designation && /admin|gm|general\s*manager|zsm|rsm|regional\s*sales\s*manager|hr\s*&\s*fin/i.test(emp.designation));

    if (isLeadership) return false;

    // If viewing user is an RSM, only include BEs reporting directly to this RSM
    if (currentUser && (currentUser.hierarchyLevel === 'rsm' || /rsm/i.test(currentUser.designation || ''))) {
      const isMyReport = emp.reportingTo === currentUser.id || emp.reportingTo === currentUser.employeeCode;
      return isMyReport;
    }

    // For Admins/Leadership: include all field BEs
    return true;
  });
}

/**
 * Calculates lead metrics (Completed, Ongoing, Yet to Start) strictly from database records.
 * STRICT DATABASE POLICY:
 * If no records exist in DB for the selected timeframe, returns 0.
 * No assumptions, baseline generation, or mock numbers are used.
 */
export async function calculateEmployeeLeads(
  employees: Employee[],
  allEmployees: Employee[],
  tasks: Task[] = [],
  startDate: string,
  endDate: string,
  periodType: 'weekly' | 'monthly' | 'custom' = 'weekly',
  periodLabel?: string,
  currentUser?: Employee
): Promise<EmployeeLeadReportItem[]> {
  const employeesMap = new Map<string, Employee>();
  allEmployees.forEach(e => employeesMap.set(e.id, e));

  // Filter to only BEs / field personnel under this RSM or under Admin
  const targetEmployees = filterFieldEmployeesOnly(employees, currentUser);

  // 1. Fetch real field visits from Supabase for this date window
  let dbVisits: any[] = [];
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_field_visits')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate);

    if (!error && Array.isArray(data)) {
      dbVisits = data;
    }
  } catch (err) {
    console.warn("Could not query pharma_hrms_field_visits:", err);
  }

  // 2. Fetch real doctor list submissions from Supabase for this date window
  let dbDoctorSubmissions: any[] = [];
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_doctor_list_submissions')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (!error && Array.isArray(data)) {
      dbDoctorSubmissions = data;
    }
  } catch (err) {
    console.warn("Could not query pharma_hrms_doctor_list_submissions:", err);
  }

  // Group DB visits by employee
  const visitsByEmp = new Map<string, any[]>();
  dbVisits.forEach(v => {
    const empId = v.employee_id;
    if (!visitsByEmp.has(empId)) visitsByEmp.set(empId, []);
    visitsByEmp.get(empId)!.push(v);
  });

  // Group DB doctor submissions by employee
  const docsByEmp = new Map<string, any[]>();
  dbDoctorSubmissions.forEach(d => {
    const empId = d.employee_id;
    if (!docsByEmp.has(empId)) docsByEmp.set(empId, []);
    docsByEmp.get(empId)!.push(d);
  });

  // Group tasks by employee within date range
  const tasksByEmp = new Map<string, Task[]>();
  tasks.forEach(t => {
    const rawDate = t.taskDate || t.dueDate || t.createdAt?.split('T')[0];
    if (rawDate && rawDate >= startDate && rawDate <= endDate && t.assignedTo) {
      if (!tasksByEmp.has(t.assignedTo)) tasksByEmp.set(t.assignedTo, []);
      tasksByEmp.get(t.assignedTo)!.push(t);
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return targetEmployees.map(emp => {
    const empVisits = visitsByEmp.get(emp.id) || [];
    const empTasks = tasksByEmp.get(emp.id) || [];
    const empDocs = docsByEmp.get(emp.id) || [];

    let completedLeads = 0;
    let ongoingLeads = 0;
    let yetToStartLeads = 0;

    // Aggregate from field visits
    empVisits.forEach(v => {
      const s = (v.status || '').toUpperCase();
      if (s === 'COMPLETED') {
        completedLeads += 1;
      } else if (['IN_PROGRESS', 'EN_ROUTE', 'ARRIVED'].includes(s)) {
        ongoingLeads += 1;
      } else {
        yetToStartLeads += 1;
      }
    });

    // Incorporate tasks if any
    empTasks.forEach(t => {
      if (t.status === 'completed') {
        completedLeads += 1;
      } else if (t.status === 'in_progress') {
        ongoingLeads += 1;
      } else {
        yetToStartLeads += 1;
      }
    });

    // Incorporate doctor submissions if any
    empDocs.forEach(d => {
      if (d.status === 'approved') {
        completedLeads += 1;
      } else if (d.status === 'pending') {
        ongoingLeads += 1;
      } else {
        yetToStartLeads += 1;
      }
    });

    // STRICT DATABASE DATA: If employee has 0 records in DB, lead counts remain strictly 0
    const totalLeads = completedLeads + ongoingLeads + yetToStartLeads;
    const completionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 1000) / 10 : 0;

    // Determine attendance status
    let attendanceStatus: 'Checked In' | 'Checked Out' | 'On Leave' | 'Admin Exempt' = 'Checked Out';
    if (isExemptAdmin(emp)) {
      attendanceStatus = 'Admin Exempt';
    } else if (emp.isCheckedIn) {
      attendanceStatus = 'Checked In';
    } else {
      const isLeaveToday = emp.attendanceRecords?.some(r => r.date === todayStr && r.status === 'leave');
      if (isLeaveToday) {
        attendanceStatus = 'On Leave';
      }
    }

    const manager = emp.reportingTo ? employeesMap.get(emp.reportingTo) : null;
    const reportingToName = manager ? manager.name : (emp.reportingTo || '-');

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      hierarchyLevel: (emp.hierarchyLevel || 'be').toUpperCase(),
      zone: emp.zone || (emp.branch === 'ap_zone' ? 'AP' : emp.branch === 'ts_zone' ? 'TS' : 'Corporate'),
      branch: emp.branch || 'Corporate',
      reportingToName,
      accountStatus: emp.status || 'active',
      attendanceStatus,
      periodType,
      periodLabel: periodLabel || `${startDate} to ${endDate}`,
      startDate,
      endDate,
      completedLeads,
      ongoingLeads,
      yetToStartLeads,
      totalLeads,
      completionRate
    };
  });
}

/**
 * Formats and downloads an Excel-compatible CSV leads report with BOM, metadata, and summary rows.
 */
export function downloadLeadsReport(
  reportItems: EmployeeLeadReportItem[],
  periodLabel: string,
  currentUser: Employee
): void {
  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Calculate totals
  const totalEmployees = reportItems.length;
  const sumCompleted = reportItems.reduce((acc, r) => acc + r.completedLeads, 0);
  const sumOngoing = reportItems.reduce((acc, r) => acc + r.ongoingLeads, 0);
  const sumYetToStart = reportItems.reduce((acc, r) => acc + r.yetToStartLeads, 0);
  const sumTotal = reportItems.reduce((acc, r) => acc + r.totalLeads, 0);
  const avgCompletionRate = sumTotal > 0 ? (sumCompleted / sumTotal * 100).toFixed(1) : '0.0';

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [
    `"ORCA LABS PHARMA HRMS - EMPLOYEE LEADS PERFORMANCE REPORT"`,
    `"Timeframe / Period:",${escapeCsv(periodLabel)}`,
    `"Generated By:",${escapeCsv(`${currentUser.name} (${currentUser.designation || currentUser.role})`)},"Generated At:",${escapeCsv(generatedAt)}`,
    `"Summary:",${escapeCsv(`Total Personnel: ${totalEmployees} | Total Leads: ${sumTotal} | Completed: ${sumCompleted} | Ongoing: ${sumOngoing} | Yet to Start: ${sumYetToStart} | Overall Completion: ${avgCompletionRate}%`)}`,
    ``, // blank line
    // Column Headers (Without Attendance Days)
    [
      'Employee ID',
      'Employee Name',
      'Designation',
      'Hierarchy Level',
      'Zone',
      'Reporting Manager',
      'Employee Account Status',
      'Completed Leads',
      'Ongoing Leads',
      'Yet to Start Leads',
      'Total Leads',
      'Completion Rate (%)'
    ].map(escapeCsv).join(','),
  ];

  // Data Rows
  reportItems.forEach(item => {
    const row = [
      item.employeeId,
      item.employeeName,
      item.designation,
      item.hierarchyLevel,
      item.zone,
      item.reportingToName,
      item.accountStatus.toUpperCase(),
      item.completedLeads,
      item.ongoingLeads,
      item.yetToStartLeads,
      item.totalLeads,
      `${item.completionRate}%`
    ].map(escapeCsv).join(',');
    rows.push(row);
  });

  // Summary Row
  rows.push(
    [
      'TOTALS / SUMMARY',
      `${totalEmployees} Employees`,
      '',
      '',
      '',
      '',
      '',
      sumCompleted,
      sumOngoing,
      sumYetToStart,
      sumTotal,
      `${avgCompletionRate}%`
    ].map(escapeCsv).join(',')
  );

  // UTF-8 BOM so Excel opens with proper character rendering
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `OrcaLabs_Leads_Report_${cleanLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
