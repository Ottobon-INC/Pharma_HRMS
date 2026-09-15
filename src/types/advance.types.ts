import { RepaymentTimeline } from './common.types';

export type AdvanceStatus = 'pending' | 'approved' | 'rejected' | 'deducted';
export type AdvanceType = 'salary' | 'medical';

export interface AdvanceRequest {
  id: string;
  advanceType?: AdvanceType;
  amount: number;
  reason: string;
  status: AdvanceStatus;
  submittedAt: string; // ISO date string
  approvedAt?: string;
  deductedInMonth?: string; // YYYY-MM
  repaymentMonths?: RepaymentTimeline; // 2 | 3 | 5
  monthlyInstallment?: number; // amount / repaymentMonths
  installmentsRemaining?: number; // countdown: starts at repaymentMonths, decrements each payroll
}
