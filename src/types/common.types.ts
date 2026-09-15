export type Language = 'en' | 'te';
export type PunchType = 'in_office' | 'out_of_office';
export type PinType = 'field_visit' | 'doctor_visit' | 'chemist_visit' | 'stockist_visit' | 'hospital_visit' | 'other';
export type RepaymentTimeline = 2 | 3 | 5;

export type Branch = 'corporate' | 'ts_zone' | 'ap_zone' | 'visakhapatnam' | 'vizianagaram';
export type Hospital = 'orca_labs' | 'both' | 'vizag_ivf' | 'medcy_hospitals';
export type HierarchyLevel = 'be' | 'rsm' | 'zsm' | 'executive' | 'admin' | 'employee' | 'team_lead' | 'manager' | 'senior_manager';
export type PharmaZone = 'TS' | 'AP' | 'Corporate';

/**
 * In Pharma HRMS, ONLY the 2 corporate admins (P Aswani and NV Divya Sirisha)
 * are exempt from checking in.
 * All other personnel (ZSMs, RSMs, BEs) MUST check in for attendance.
 */
export function isExemptAdmin(emp?: { id?: string; name?: string; hierarchyLevel?: string; role?: string } | null): boolean {
  if (!emp) return false;
  const id = (emp.id || '').toUpperCase();
  const name = (emp.name || '').toLowerCase();
  
  if (id === 'OL026' || id === 'OL009' || id === 'EMP_ADMIN_01') return true;
  if (name.includes('aswani') || name.includes('divya')) return true;
  return false;
}
