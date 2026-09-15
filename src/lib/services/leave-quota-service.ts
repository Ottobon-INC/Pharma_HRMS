import { supabase } from '../supabase-client';
import { MonthlyLeaveQuota } from '../../types';

/**
 * Gets the current month string in YYYY-MM format.
 */
export function getCurrentMonthStr(): string {
  return new Date().toISOString().substring(0, 7);
}

/**
 * Fetches the monthly quota for a specific employee and month.
 * If it doesn't exist, it attempts to initialize it to 3 allotted / 0 used.
 */
export async function getMonthlyQuota(empId: string, month: string = getCurrentMonthStr()): Promise<MonthlyLeaveQuota | null> {
  // Try to fetch existing
  const { data, error } = await supabase
    .from('pharma_hrms_monthly_leave_quota')
    .select('*')
    .eq('employee_id', empId)
    .eq('month', month)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST205') {
      console.warn("Monthly quota notice:", error.message);
    }
    return null;
  }

  if (data) {
    return {
      id: data.id,
      month: data.month,
      allotted: data.allotted,
      used: data.used,
      remaining: data.allotted - data.used
    };
  }

  // If not found, initialize it (default 3 allotted)
  const { data: newData, error: insertError } = await supabase
    .from('pharma_hrms_monthly_leave_quota')
    .insert([{
      employee_id: empId,
      month,
      allotted: 3,
      used: 0
    }])
    .select()
    .single();

  if (insertError) {
    console.error("Error initializing monthly quota:", insertError);
    return null;
  }

  return {
    id: newData.id,
    month: newData.month,
    allotted: newData.allotted,
    used: newData.used,
    remaining: newData.allotted - newData.used
  };
}

/**
 * Increments the 'used' count for an employee's monthly quota.
 */
export async function incrementMonthlyQuotaUsed(empId: string, month: string, days: number): Promise<void> {
  // First ensure it exists
  const quota = await getMonthlyQuota(empId, month);
  if (!quota) return;

  const { error } = await supabase
    .from('pharma_hrms_monthly_leave_quota')
    .update({ used: quota.used + days })
    .eq('id', quota.id);

  if (error) {
    console.error("Error updating monthly quota:", error);
    throw error;
  }
}
