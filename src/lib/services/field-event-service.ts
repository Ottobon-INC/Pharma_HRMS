import { supabase } from '../supabase-client';
import { FieldVisitEvent, FieldEventType } from '../../types';

export async function logFieldEvent(
  employeeId: string,
  eventType: FieldEventType,
  visitId?: string,
  sessionId?: string,
  latitude?: number,
  longitude?: number,
  accuracyM?: number,
  address?: string,
  metadata?: Record<string, any>
): Promise<FieldVisitEvent> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visit_events')
    .insert([{
      employee_id: employeeId,
      event_type: eventType,
      visit_id: visitId,
      session_id: sessionId,
      latitude,
      longitude,
      accuracy_m: accuracyM,
      address,
      metadata,
      synced: true // skipping offline for now
    }])
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    visitId: data.visit_id,
    sessionId: data.session_id,
    employeeId: data.employee_id,
    eventType: data.event_type as FieldEventType,
    occurredAt: data.occurred_at,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracyM: data.accuracy_m,
    address: data.address,
    metadata: data.metadata,
    synced: data.synced
  };
}
