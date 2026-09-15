import { supabase } from '../supabase-client';
import { RepaymentTimeline } from '../../types';

export async function submitAdvanceRequest(
  empId: string,
  amount: number,
  reason: string,
  repaymentMonths: RepaymentTimeline = 2,
  type: import('../../types').AdvanceType = 'salary'
): Promise<void> {
  const monthlyInstallment = Math.ceil(amount / repaymentMonths);
  const { error } = await supabase
    .from('pharma_hrms_advance_requests')
    .insert([{
      employee_id: empId,
      amount,
      reason,
      status: 'pending',
      repayment_months: repaymentMonths,
      monthly_installment: monthlyInstallment,
      installments_remaining: repaymentMonths,
      advance_type: type
    }]);

  if (error) throw error;
}

export async function approveAdvance(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_advance_requests')
    .update({ 
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) throw error;
}

export async function rejectAdvance(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_advance_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Called by payroll each time an installment is deducted.
 * Decrements installments_remaining; auto-sets status to 'deducted' when it hits 0.
 */
export async function decrementInstallment(requestId: string): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('pharma_hrms_advance_requests')
    .select('installments_remaining')
    .eq('id', requestId)
    .single();

  if (fetchErr) throw fetchErr;

  const remaining = Math.max(0, (data?.installments_remaining ?? 1) - 1);
  const newStatus = remaining <= 0 ? 'deducted' : 'approved';

  const { error } = await supabase
    .from('pharma_hrms_advance_requests')
    .update({
      installments_remaining: remaining,
      status: newStatus,
      ...(remaining <= 0 ? { deducted_in_month: new Date().toISOString().substring(0, 7) } : {})
    })
    .eq('id', requestId);

  if (error) throw error;
}

