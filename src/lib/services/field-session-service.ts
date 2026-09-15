import { supabase } from '../supabase-client';
import { FieldSession } from '../../types';
import { logFieldEvent } from './field-event-service';

export async function getActiveSession(employeeId: string, date: string): Promise<FieldSession | null> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('session_date', date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    employeeId: data.employee_id,
    sessionDate: data.session_date,
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    startLatitude: data.start_latitude,
    startLongitude: data.start_longitude,
    startAddress: data.start_address,
    endLatitude: data.end_latitude,
    endLongitude: data.end_longitude,
    endAddress: data.end_address,
    notes: data.notes
  };
}

export async function startSession(
  employeeId: string, 
  latitude?: number, 
  longitude?: number, 
  address?: string,
  accuracyM?: number
): Promise<FieldSession> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if session already exists
  let existing = await getActiveSession(employeeId, today);
  if (existing) {
    if (existing.status === 'active') return existing;
    throw new Error('Session for today is already closed or cancelled.');
  }

  const { data, error } = await supabase
    .from('pharma_hrms_field_sessions')
    .insert([{
      employee_id: employeeId,
      session_date: today,
      status: 'active',
      start_latitude: latitude,
      start_longitude: longitude,
      start_address: address
    }])
    .select()
    .single();

  if (error) throw error;

  await logFieldEvent(employeeId, 'FIELD_DUTY_STARTED', undefined, data.id, latitude, longitude, accuracyM, address);

  return {
    id: data.id,
    employeeId: data.employee_id,
    sessionDate: data.session_date,
    status: data.status,
    startedAt: data.started_at,
    startLatitude: data.start_latitude,
    startLongitude: data.start_longitude,
    startAddress: data.start_address
  };
}

export async function endSession(
  sessionId: string, 
  employeeId: string,
  latitude?: number, 
  longitude?: number, 
  address?: string,
  accuracyM?: number
): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      end_latitude: latitude,
      end_longitude: longitude,
      end_address: address
    })
    .eq('id', sessionId)
    .eq('employee_id', employeeId);

  if (error) throw error;

  await logFieldEvent(employeeId, 'FIELD_DUTY_ENDED', undefined, sessionId, latitude, longitude, accuracyM, address);
}
