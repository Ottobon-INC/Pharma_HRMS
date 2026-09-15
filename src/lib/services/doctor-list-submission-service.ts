import { supabase } from '../supabase-client';

export interface DoctorListSubmission {
  id: string;
  employeeId: string;
  doctorName: string;
  specialization?: string;
  clinicHospitalName?: string;
  area?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  potential?: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function submitDoctor(submission: {
  employeeId: string;
  doctorName: string;
  specialization?: string;
  clinicHospitalName?: string;
  area?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  potential?: 'high' | 'medium' | 'low';
  notes?: string;
  status?: 'pending' | 'approved';
}): Promise<DoctorListSubmission> {
  const { data, error } = await supabase
    .from('pharma_hrms_doctor_list_submissions')
    .insert([{
      employee_id: submission.employeeId,
      doctor_name: submission.doctorName,
      specialization: submission.specialization || null,
      clinic_hospital_name: submission.clinicHospitalName || null,
      area: submission.area || null,
      city: submission.city || null,
      state: submission.state || null,
      phone: submission.phone || null,
      email: submission.email || null,
      preferred_time: submission.preferredTime || null,
      potential: submission.potential || 'medium',
      status: submission.status || 'pending',
      notes: submission.notes || null,
      submitted_by: submission.employeeId
    }])
    .select()
    .single();

  if (error) throw error;
  return mapDbToSubmission(data);
}

export async function fetchDoctorListSubmissions(employeeId?: string, status?: string): Promise<DoctorListSubmission[]> {
  let query = supabase
    .from('pharma_hrms_doctor_list_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching doctor list submissions:', error);
    return [];
  }

  return (data || []).map(mapDbToSubmission);
}

export async function fetchTeamDoctorListSubmissions(teamMemberIds: string[], status?: string): Promise<DoctorListSubmission[]> {
  if (!teamMemberIds.length) return [];

  let query = supabase
    .from('pharma_hrms_doctor_list_submissions')
    .select('*')
    .in('employee_id', teamMemberIds)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching team doctor list submissions:', error);
    return [];
  }

  return (data || []).map(mapDbToSubmission);
}

export async function approveDoctorSubmission(submissionId: string, approvedBy: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_doctor_list_submissions')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  if (error) throw error;
}

export async function rejectDoctorSubmission(submissionId: string, rejectionReason: string, rejectedBy: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_doctor_list_submissions')
    .update({
      status: 'rejected',
      approved_by: rejectedBy,
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  if (error) throw error;
}

function mapDbToSubmission(item: any): DoctorListSubmission {
  return {
    id: item.id,
    employeeId: item.employee_id,
    doctorName: item.doctor_name,
    specialization: item.specialization,
    clinicHospitalName: item.clinic_hospital_name,
    area: item.area,
    city: item.city,
    state: item.state,
    phone: item.phone,
    email: item.email,
    preferredTime: item.preferred_time,
    potential: item.potential,
    status: item.status,
    submittedBy: item.submitted_by,
    approvedBy: item.approved_by,
    rejectionReason: item.rejection_reason,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}
