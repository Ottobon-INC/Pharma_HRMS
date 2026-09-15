import { Employee, Payslip } from '../types';
import * as payrollService from '../lib/services/payroll-service';
import { decrementInstallment } from '../lib/services/advance-service';
import { fetchPayrollConfig, defaultPayrollConfig } from '../lib/services/payroll-config-service';
import { computeAttendanceStats } from '../lib/utils/attendance-stats';
import { AttendanceRecord, LeaveRequest } from '../types';

export function usePayroll(isLocalMode: boolean, loadData: () => Promise<void>) {
  const runBulkPayroll = async (employees: Employee[], month: string) => {
    if (isLocalMode) {
      alert("Payroll generation requires an online database connection.");
      return;
    }
    await payrollService.runBulkPayrollForMonth(employees, month);
    await loadData();
  };

  const updatePayslip = async (empId: string, payslip: Payslip) => {
    if (isLocalMode) {
      alert("Payslip updates require an online database connection.");
      return;
    }
    await payrollService.savePayslipToSupabase(empId, payslip);
    await loadData();
  };

  /**
   * Generates a single payslip for a specific employee and month.
   * Uses installment-based advance deduction.
   * approvedAdvances now includes repaymentMonths, monthlyInstallment, installmentsRemaining.
   */
  const generateSinglePayslip = async (
    empId: string,
    month: string,
    basicPay: number,
    hasExisting: boolean,
    approvedAdvances: { id: string; amount: number; repaymentMonths?: number; monthlyInstallment?: number; installmentsRemaining?: number; advanceType?: 'salary' | 'medical' }[],
    attendanceRecords: AttendanceRecord[],
    leaveRequests: LeaveRequest[]
  ) => {
    if (isLocalMode) {
      alert("Payslip updates require an online database connection.");
      return;
    }

    if (hasExisting) {
      const confirmOverride = window.confirm(
        "A payslip already exists for this month. Generating a new one will overwrite any custom edits. Do you want to proceed?"
      );
      if (!confirmOverride) return;
    }

    // Fetch dynamic config from DB (or use defaults on failure)
    const config = await fetchPayrollConfig();

    const tier = payrollService.getTieredAllowances(basicPay, config);
    const hraAmt = tier.hra;
    const medAmt = tier.ma;
    const convAmt = tier.ca;
    const pfAmt = Math.round(basicPay * (config.pf_percent / 100));
    const profTax = config.professional_tax;

    // Installment-based advance deductions only
    const activeAdvances = approvedAdvances.filter(
      a => (a.installmentsRemaining ?? 0) > 0
    );

    let advanceInstallmentTotal = 0;
    const advanceIds: string[] = [];

    const deductionsArr: { nameKey: string; amount: number }[] = [
      { nameKey: 'providentFund', amount: pfAmt },
      { nameKey: 'professionalTax', amount: profTax }
    ];

    for (const adv of activeAdvances) {
      const installment = adv.monthlyInstallment ?? Math.ceil(adv.amount / (adv.repaymentMonths ?? 2));
      advanceInstallmentTotal += installment;
      advanceIds.push(adv.id);
      deductionsArr.push({ 
        nameKey: adv.advanceType === 'medical' ? 'advanceInstallment_medical' : 'advanceInstallment_salary', 
        amount: installment 
      });
    }

    const stats = computeAttendanceStats(month, attendanceRecords, leaveRequests);

    const payslip: Payslip = {
      id: `PS-${month}-${empId.slice(-3)}`,
      month,
      basicPay,
      allowances: [
        { nameKey: 'hra', amount: hraAmt },
        { nameKey: 'medicalAllow', amount: medAmt },
        { nameKey: 'conveyanceAllow', amount: convAmt }
      ],
      deductions: deductionsArr,
      advanceMoneyTaken: advanceInstallmentTotal > 0,
      advanceMoneyAmount: advanceInstallmentTotal,
      workingDays: stats.workingDays,
      daysPresent: stats.daysPresent,
      leavesTaken: stats.leavesTaken
    };

    await payrollService.savePayslipToSupabase(empId, payslip);

    // Decrement installments counter for each active advance
    for (const advId of advanceIds) {
      await decrementInstallment(advId);
    }

    await loadData();
  };

  return {
    runBulkPayroll,
    updatePayslip,
    generateSinglePayslip
  };
}
