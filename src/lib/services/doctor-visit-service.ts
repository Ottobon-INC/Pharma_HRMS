import { supabase } from '../supabase-client';
import { DoctorVisit } from '../../types';

export async function fetchDoctorVisits(employeeId: string): Promise<DoctorVisit[]> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .eq('employee_id', employeeId)
    .order('visit_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(mapDbVisitToApp);
}

export async function fetchTeamDoctorVisits(teamMemberIds: string[]): Promise<DoctorVisit[]> {
  if (!teamMemberIds.length) return [];
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .in('employee_id', teamMemberIds)
    .order('visit_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(mapDbVisitToApp);
}

export async function createDoctorVisit(visit: Omit<DoctorVisit, 'id'>): Promise<DoctorVisit> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .insert([
      {
        employee_id: visit.employeeId,
        visit_date: visit.visitDate,
        doctor_name: visit.doctorName,
        clinic_name: visit.clinicName,
        area: visit.area,
        time_slot: visit.timeSlot,
        visit_purpose: visit.visitPurpose,
        status: visit.status,
        notes: visit.notes
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return mapDbVisitToApp(data);
}

export async function updateDoctorVisit(id: string, updates: Partial<DoctorVisit>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.visitDate) dbUpdates.visit_date = updates.visitDate;
  if (updates.doctorName) dbUpdates.doctor_name = updates.doctorName;
  if (updates.clinicName) dbUpdates.clinic_name = updates.clinicName;
  if (updates.area) dbUpdates.area = updates.area;
  if (updates.timeSlot) dbUpdates.time_slot = updates.timeSlot;
  if (updates.visitPurpose) dbUpdates.visit_purpose = updates.visitPurpose;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.notes) dbUpdates.notes = updates.notes;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDoctorVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function copyVisitsFromDate(employeeId: string, fromDate: string, toDate: string): Promise<DoctorVisit[]> {
  const { data: sourceVisits, error: fetchError } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('visit_date', fromDate);

  if (fetchError) throw fetchError;
  if (!sourceVisits || sourceVisits.length === 0) return [];

  const newVisits = sourceVisits.map(v => ({
    employee_id: employeeId,
    visit_date: toDate,
    doctor_name: v.doctor_name,
    clinic_name: v.clinic_name,
    area: v.area,
    time_slot: v.time_slot,
    visit_purpose: v.visit_purpose,
    status: 'planned'
  }));

  const { data: insertedData, error: insertError } = await supabase
    .from('pharma_hrms_field_visits')
    .insert(newVisits)
    .select();

  if (insertError) throw insertError;
  return insertedData ? insertedData.map(mapDbVisitToApp) : [];
}

function mapDbVisitToApp(dbVisit: any): DoctorVisit {
  return {
    id: dbVisit.id,
    employeeId: dbVisit.employee_id,
    visitDate: dbVisit.visit_date,
    doctorName: dbVisit.doctor_name,
    clinicName: dbVisit.clinic_name,
    area: dbVisit.area,
    timeSlot: dbVisit.time_slot,
    visitPurpose: dbVisit.visit_purpose,
    status: dbVisit.status,
    notes: dbVisit.notes,
    createdAt: dbVisit.created_at,
    updatedAt: dbVisit.updated_at
  };
}
