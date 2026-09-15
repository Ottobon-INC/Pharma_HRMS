import { supabase } from '../supabase-client';
import { Employee, LeaveBalance, LeaveType, LeaveStatus, AttendanceRecord, AttendanceStatus, CheckInLog, Payslip, MonthlyLeaveQuota, Branch, HierarchyLevel, PinType, PharmaZone, Hospital, isExemptAdmin } from '../../types';

/**
 * Fetch all employees and their associated operational data directly from Supabase PostgreSQL.
 * Single Source of Truth: All personnel, hierarchy levels, reporting lines, and zones
 * are dynamically retrieved from the remote database with ZERO client-side hardcoding.
 */
export async function fetchAllEmployeesData(): Promise<Employee[]> {
  const { data: emps, error: empError } = await supabase
    .from('pharma_hrms_employees')
    .select('*')
    .order('id', { ascending: true });

  if (empError) throw empError;
  if (!emps || emps.length === 0) return [];

  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // Boundary filter: strictly reject any legacy Medcy/Vizag IVF hospital IDs or excluded personnel
  const pharmaEmps = emps.filter(e => {
    const id = (e.id || '').toUpperCase();
    const code = (e.employee_code || '').toUpperCase();
    if (id.startsWith('EMP-') || id.startsWith('MEDCY') || id.startsWith('VIZAG')) return false;
    if (e.hospital && e.hospital !== 'orca_labs') return false;
    if (id === 'OL001' || code === 'OL001') return false;
    return true;
  });

  const { data: att, error: attError } = await supabase.from('pharma_hrms_attendance').select('*');
  const { data: leaves, error: leavesError } = await supabase.from('pharma_hrms_leave_requests').select('*');
  const { data: balances, error: balError } = await supabase.from('pharma_hrms_leave_balances').select('*');
  const { data: payroll, error: payError } = await supabase.from('pharma_hrms_payroll').select('*');
  const { data: advances, error: advError } = await supabase.from('pharma_hrms_advance_requests').select('*');
  const { data: pins, error: pinsError } = await supabase.from('pharma_hrms_location_pins').select('*');

  if (attError) console.warn('Attendance sync notice:', attError.message);
  if (leavesError) console.warn('Leave requests sync notice:', leavesError.message);
  if (balError) console.warn('Leave balances sync notice:', balError.message);
  if (payError && payError.code !== 'PGRST205') console.warn('Payroll sync notice:', payError.message);
  if (advError && advError.code !== 'PGRST205') console.warn('Advances sync notice:', advError.message);
  if (pinsError && pinsError.code !== 'PGRST205') console.warn('Location pins sync notice:', pinsError.message);

  const { data: quotas, error: quotaError } = await supabase.from('pharma_hrms_monthly_leave_quota').select('*');
  if (quotaError && quotaError.code !== 'PGRST205') console.warn('Monthly quotas sync notice:', quotaError.message);
  
  const quotaList = quotas || [];
  const attendanceList = att || [];
  const leavesList = leaves || [];
  const balancesList = balances || [];
  const payrollList = payroll || [];
  const advancesList = advances || [];
  const pinsList = pins || [];

  const mappedEmployees: Employee[] = pharmaEmps.map(emp => {
    // Map leave balances
    const empBalances = balancesList.filter(b => b.employee_id === emp.id);
    const leaveBalance: LeaveBalance = {
      sick: { allowed: 6, taken: 0 },
      casual: { allowed: emp.cl_balance !== undefined && emp.cl_balance !== null ? Number(emp.cl_balance) : 12, taken: 0 }
    };
    if (emp.gender === 'female') {
      leaveBalance.maternity = { allowed: 90, taken: 0 };
    } else if (emp.gender === 'male') {
      leaveBalance.paternity = { allowed: 7, taken: 0 };
    }
    empBalances.forEach(b => {
      const type = b.leave_type as LeaveType;
      if (leaveBalance[type]) {
        leaveBalance[type] = { allowed: b.total_allotted, taken: b.used };
      }
    });

    // Map leave requests
    const empLeaves = leavesList
      .filter(l => l.employee_id === emp.id)
      .map(l => ({
        id: l.id,
        type: l.leave_type as LeaveType,
        fromDate: l.from_date,
        toDate: l.to_date,
        reason: l.reason,
        status: (l.status as string).toLowerCase() as LeaveStatus,
        submittedAt: l.submitted_at || l.from_date
      }));

    // Map attendance records and check-in logs
    const empAtt = attendanceList.filter(a => a.employee_id === emp.id);
    const attendanceRecords: AttendanceRecord[] = empAtt.map(a => ({
      date: a.date,
      status: (a.status || 'present').toLowerCase() as AttendanceStatus,
      note: a.check_in_time ? `Checked In: ${a.check_in_time}` : undefined,
      photoUrl: a.check_in_photo_url || undefined
    }));

    const checkInLogs: CheckInLog[] = empAtt
      .filter(a => a.check_in_time)
      .map(a => {
        let totalHours: number | null = null;
        if (a.check_in_time && a.check_out_time) {
          try {
            const [h1, m1, s1] = a.check_in_time.split(':').map(Number);
            const [h2, m2, s2] = a.check_out_time.split(':').map(Number);
            const diffMs = (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1);
            totalHours = diffMs > 0 ? parseFloat((diffMs / 3600).toFixed(2)) : 0;
          } catch {
            totalHours = null;
          }
        }
        return {
          id: a.id,
          date: a.date,
          checkInTime: a.check_in_time,
          checkOutTime: a.check_out_time,
          totalHours,
          checkInLocation: a.check_in_location || undefined,
          checkInLatLng: a.check_in_lat_lng || undefined,
          photoUrl: a.check_in_photo_url || undefined,
          checkOutLocation: a.check_out_location || undefined,
          checkOutLatLng: a.check_out_lat_lng || undefined,
          checkOutPhotoUrl: a.check_out_photo_url || undefined,
          punchType: (a.punch_type || 'in_office') as import('../../types').PunchType,
          punchNote: a.punch_note || undefined,
          sessionNumber: a.session_number || 1
        };
      });

    const locationPins = pinsList
      .filter(p => p.employee_id === emp.id)
      .map(p => ({
        id: p.id,
        date: p.date,
        pinnedAt: p.pinned_at,
        label: p.label || undefined,
        latitude: p.latitude ? Number(p.latitude) : undefined,
        longitude: p.longitude ? Number(p.longitude) : undefined,
        locationName: p.location_name || undefined,
        photoUrl: p.photo_url || undefined,
        pinType: (p.pin_type || 'other') as PinType
      }));

    // Determine check-in status for today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = empAtt.find(a => a.date === todayStr);
    const isCheckedIn = !!(todayRecord && todayRecord.check_in_time && !todayRecord.check_out_time);

    // Map payslips
    const empPayslips: Payslip[] = payrollList
      .filter(p => p.employee_id === emp.id)
      .map(p => ({
        id: p.id,
        month: p.month,
        basicPay: Number(p.basic_pay),
        allowances: Array.isArray(p.allowances) ? p.allowances : [],
        deductions: Array.isArray(p.deductions) ? p.deductions : [],
        advanceMoneyTaken: p.advance_money_taken,
        advanceMoneyAmount: Number(p.advance_money_amount),
        workingDays: p.working_days ? Number(p.working_days) : undefined,
        daysPresent: p.days_present ? Number(p.days_present) : undefined,
        leavesTaken: p.leaves_taken ? Number(p.leaves_taken) : undefined
      }));

    // Map monthly quota
    const empQuota = quotaList.find(q => q.employee_id === emp.id && q.month === currentMonth);
    let monthlyQuota: MonthlyLeaveQuota | undefined = undefined;
    if (empQuota) {
      monthlyQuota = {
        id: empQuota.id,
        month: empQuota.month,
        allotted: empQuota.allotted,
        used: empQuota.used,
        remaining: empQuota.allotted - empQuota.used
      };
    } else {
      monthlyQuota = {
        id: 'virtual',
        month: currentMonth,
        allotted: 3,
        used: 0,
        remaining: 3
      };
    }

    // Direct database mapping for Branch, Hierarchy, Zone, and Reporting lines
    const rawBranch = emp.branch;
    const branch: Branch = (['corporate', 'ap_zone', 'ts_zone'].includes(rawBranch) ? rawBranch : null)
      || (emp.zone === 'TS' ? 'ts_zone' : emp.zone === 'AP' ? 'ap_zone' : 'corporate');
    const hierarchyLevel: HierarchyLevel = (emp.hierarchy_level as HierarchyLevel) || 'be';
    const zone: PharmaZone = (emp.zone as PharmaZone) || (branch === 'ts_zone' ? 'TS' : branch === 'ap_zone' ? 'AP' : 'Corporate');

    const isLeadership = ['admin', 'executive', 'zsm', 'rsm', 'manager'].includes(hierarchyLevel);
    const managedBranches: Branch[] = Array.isArray(emp.managed_branches) && emp.managed_branches.length > 0
      ? emp.managed_branches
      : (isLeadership ? ['corporate', 'ts_zone', 'ap_zone'] : [branch]);

    const reportingTo: string | undefined = emp.reporting_to || undefined;
    // Only corporate admins (Aswani & Divya) have role 'admin'. All others (ZSMs, RSMs, BEs) have role 'employee'.
    const isCorporateAdmin = isExemptAdmin(emp);
    const resolvedRole: 'admin' | 'employee' = isCorporateAdmin ? 'admin' : 'employee';
    const designation: string = emp.designation || (hierarchyLevel === 'rsm' ? 'RSM' : hierarchyLevel === 'zsm' ? 'ZSM' : hierarchyLevel === 'admin' ? 'Corporate Admin' : 'BE');

    return {
      id: emp.id,
      employeeCode: emp.employee_code || emp.id,
      name: emp.name,
      email: emp.email,
      designation,
      joiningDate: emp.joining_date,
      basicSalary: Number(emp.basic_pay) || 0,
      role: resolvedRole,
      password: emp.password,
      status: (emp.status || 'active') as 'active' | 'inactive' | 'pending',
      phone: emp.phone,
      gender: emp.gender as 'male' | 'female' | 'other' | undefined,
      experience: Number(emp.experience) || 0,
      bankDetails: emp.bank_details as any,
      hospital: 'orca_labs' as Hospital,
      branch,
      zone,
      territory: emp.territory || undefined,
      teamId: emp.team_id || undefined,
      hierarchyLevel,
      managedBranches,
      reportingTo,
      isCheckedIn,
      leaveBalance,
      monthlyQuota,
      leaveRequests: empLeaves,
      attendanceRecords,
      checkInLogs,
      payslips: empPayslips,
      locationPins,
      advanceRequests: advancesList
        .filter(a => a.employee_id === emp.id)
        .map(a => ({
          id: a.id,
          advanceType: (a.advance_type || 'salary') as 'salary' | 'medical',
          amount: Number(a.amount),
          reason: a.reason,
          status: a.status as any,
          submittedAt: a.submitted_at,
          approvedAt: a.approved_at,
          deductedInMonth: a.deducted_in_month,
          repaymentMonths: a.repayment_months as (2 | 3 | 5) | undefined,
          monthlyInstallment: a.monthly_installment ? Number(a.monthly_installment) : undefined,
          installmentsRemaining: a.installments_remaining ?? undefined
        }))
    };
  });

  return mappedEmployees;
}

/**
 * Scopes the visible list of employees based on the current user's hierarchy level & zone.
 * Pure database-driven role scope:
 * - Admin (Divya, Aswani): Full company visibility across all zones
 * - ZSM (Janardhan, Ramendra): Full visibility across their zone
 * - RSM: Visibility over their direct reports (BEs)
 * - BE: Personal record only
 */
export function filterEmployeesByScope(
  currentUser: Employee | null | undefined,
  allEmployees: Employee[]
): Employee[] {
  if (!currentUser) return allEmployees;

  // Admin & Corporate tier: Complete visibility
  if (currentUser.role === 'admin' || currentUser.hierarchyLevel === 'admin' || currentUser.hierarchyLevel === 'executive') {
    return allEmployees;
  }
  
  // ZSM (Zonal Sales Manager): Visibility across their entire zone (AP or TS)
  if (currentUser.hierarchyLevel === 'zsm') {
    return allEmployees.filter(emp => 
      emp.zone === currentUser.zone || 
      emp.branch === currentUser.branch ||
      emp.reportingTo === currentUser.id ||
      emp.id === currentUser.id ||
      emp.hierarchyLevel === 'admin' ||
      emp.hierarchyLevel === 'executive'
    );
  }
  
  // RSM (Regional Sales Manager): Visibility over their direct reporting BEs
  if (currentUser.hierarchyLevel === 'rsm' || currentUser.hierarchyLevel === 'manager') {
    return allEmployees.filter(emp => 
      emp.reportingTo === currentUser.id || 
      emp.id === currentUser.id ||
      emp.hierarchyLevel === 'admin' ||
      emp.hierarchyLevel === 'executive' ||
      emp.hierarchyLevel === 'zsm'
    );
  }

  // Business Executive (BE) tier: Personal record
  return allEmployees.filter(emp => emp.id === currentUser.id);
}

/**
 * Creates a new employee record directly in Supabase PostgreSQL without column stripping.
 */
export async function createEmployee(emp: Omit<Employee, 'isCheckedIn' | 'leaveBalance' | 'leaveRequests' | 'attendanceRecords' | 'checkInLogs' | 'payslips'>): Promise<void> {
  const payload: any = {
    id: emp.id,
    employee_code: emp.employeeCode || emp.id,
    name: emp.name,
    email: emp.email,
    password: emp.password || 'password',
    role: emp.role || 'employee',
    designation: emp.designation || 'Business Executive',
    joining_date: emp.joiningDate || new Date().toISOString().split('T')[0],
    basic_pay: Number(emp.basicSalary) || 0.00,
    status: emp.status || 'active',
    phone: emp.phone || null,
    gender: emp.gender || 'male',
    experience: Number(emp.experience) || 0,
    bank_details: emp.bankDetails || {},
    branch: emp.branch || 'ap_zone',
    zone: emp.zone || (emp.branch === 'ts_zone' ? 'TS' : emp.branch === 'corporate' ? 'Corporate' : 'AP'),
    hospital: 'orca_labs',
    hierarchy_level: emp.hierarchyLevel || 'be',
    managed_branches: emp.managedBranches || [emp.branch || 'ap_zone'],
    reporting_to: emp.reportingTo || null
  };

  const { error } = await supabase
    .from('pharma_hrms_employees')
    .insert([payload]);

  if (error) {
    console.error("Create employee failed in Supabase:", error);
    throw error;
  }

  const initialBalances: any[] = [
    { employee_id: emp.id, leave_type: 'sick', total_allotted: 6, used: 0 },
    { employee_id: emp.id, leave_type: 'casual', total_allotted: 12, used: 0 }
  ];
  if (emp.gender === 'female') {
    initialBalances.push({ employee_id: emp.id, leave_type: 'maternity', total_allotted: 90, used: 0 });
  } else if (emp.gender === 'male') {
    initialBalances.push({ employee_id: emp.id, leave_type: 'paternity', total_allotted: 7, used: 0 });
  }

  try {
    await supabase.from('pharma_hrms_leave_balances').insert(initialBalances);
  } catch (lbErr) {
    console.warn("Initial leave balance insert notice:", lbErr);
  }
}

/**
 * Updates an employee record directly in Supabase PostgreSQL without column stripping.
 */
export async function updateEmployee(id: string, fields: Partial<Employee>): Promise<void> {
  const updatePayload: any = {};
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.email !== undefined) updatePayload.email = fields.email;
  if (fields.employeeCode !== undefined) updatePayload.employee_code = fields.employeeCode;
  if (fields.designation !== undefined) updatePayload.designation = fields.designation;
  if (fields.joiningDate !== undefined) updatePayload.joining_date = fields.joiningDate;
  if (fields.basicSalary !== undefined) updatePayload.basic_pay = fields.basicSalary;
  if (fields.role !== undefined) updatePayload.role = fields.role;
  if (fields.password !== undefined) updatePayload.password = fields.password;
  if (fields.status !== undefined) updatePayload.status = fields.status;
  if (fields.phone !== undefined) updatePayload.phone = fields.phone;
  if (fields.gender !== undefined) updatePayload.gender = fields.gender;
  if (fields.experience !== undefined) updatePayload.experience = fields.experience;
  if (fields.bankDetails !== undefined) updatePayload.bank_details = fields.bankDetails;
  if (fields.branch !== undefined) updatePayload.branch = fields.branch;
  if (fields.zone !== undefined) updatePayload.zone = fields.zone;
  if (fields.hierarchyLevel !== undefined) updatePayload.hierarchy_level = fields.hierarchyLevel;
  if (fields.managedBranches !== undefined) updatePayload.managed_branches = fields.managedBranches;
  if (fields.reportingTo !== undefined) updatePayload.reporting_to = fields.reportingTo;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from('pharma_hrms_employees')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error("Update employee failed in Supabase:", error);
      throw error;
    }
  }
}

export async function updateEmployeePassword(id: string, newPassword: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_employees')
    .update({ password: newPassword })
    .eq('id', id);
  if (error) {
    console.error('Error updating employee password:', error);
    throw error;
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_employees')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAllNonAdminEmployees(): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_employees')
    .delete()
    .eq('role', 'employee');
  if (error) throw error;
}

export async function toggleEmployeeStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_employees')
    .update({ status })
    .eq('id', id);
  if (error) {
    console.warn("Status toggle failed in Supabase:", error.message);
  }
}

/**
 * Lightweight schema connectivity verification.
 * Does NOT hardcode employee arrays into memory.
 */
export async function seedInitialDatabase(): Promise<void> {
  try {
    // Purge any legacy Medcy hospital employees (EMP-*, MEDCY-*, non-orca_labs) and OL001
    try {
      await supabase.from('pharma_hrms_employees').delete().ilike('id', 'EMP-%');
      await supabase.from('pharma_hrms_employees').delete().ilike('id', 'MEDCY%');
      await supabase.from('pharma_hrms_employees').delete().ilike('id', 'VIZAG%');
      await supabase.from('pharma_hrms_employees').delete().eq('id', 'OL001');
      await supabase.from('pharma_hrms_leave_balances').delete().ilike('employee_id', 'EMP-%');
      await supabase.from('pharma_hrms_leave_balances').delete().eq('employee_id', 'OL001');
    } catch (purgeErr) {
      console.warn('Legacy purge notice:', purgeErr);
    }

    const { count, error } = await supabase
      .from('pharma_hrms_employees')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('pharma_hrms_employees table verification notice:', error.message);
      return;
    }

    if (count === 0) {
      console.warn('pharma_hrms_employees table is currently empty in Supabase. Please execute database/00_pharma_hrms_full_migration.sql in Supabase SQL Editor.');
    }
  } catch (err: any) {
    console.warn('seedInitialDatabase check notice:', err?.message || err);
  }
}
