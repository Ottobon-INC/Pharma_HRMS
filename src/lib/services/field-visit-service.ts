import { supabase } from '../supabase-client';
import { FieldVisit, FieldVisitStatus, FieldEventType, FieldVisitType } from '../../types';
import { logFieldEvent } from './field-event-service';
import { addProof } from './field-proof-service';
import { getDistanceMeters } from '../geofence';

function mapVisit(data: any): FieldVisit {
  return {
    id: data.id,
    sessionId: data.session_id,
    employeeId: data.employee_id,
    assignedBy: data.assigned_by,
    visitType: data.visit_type as FieldVisitType,
    title: data.title,
    description: data.description,
    scheduledDate: data.scheduled_date,
    scheduledStart: data.scheduled_start,
    scheduledEnd: data.scheduled_end,
    assignedLatitude: data.assigned_latitude,
    assignedLongitude: data.assigned_longitude,
    assignedAddress: data.assigned_address,
    allowedRadiusMeters: data.allowed_radius_meters,
    priority: data.priority,
    status: data.status as FieldVisitStatus,
    startedAt: data.started_at,
    arrivedAt: data.arrived_at,
    completedAt: data.completed_at,
    actualLatitude: data.actual_latitude,
    actualLongitude: data.actual_longitude,
    actualAddress: data.actual_address,
    arrivalDistanceM: data.arrival_distance_m,
    durationMinutes: data.duration_minutes,
    startPhotoUrl: data.start_photo_url || undefined,
    proofPhotoUrl: data.proof_photo_url,
    completionNotes: data.completion_notes,
    patientName: data.patient_name,
    clientReference: data.client_reference,
    locationException: data.location_exception,
    approvalStatus: (data.approval_status || 'approved') as any,
    approvedBy: data.approved_by || undefined,
    rejectionReason: data.rejection_reason || undefined,
    doctorName: data.doctor_name || undefined,
    clinicName: data.clinic_name || undefined,
    chemistShopName: data.clinic_name || undefined,
    stockistName: data.clinic_name || undefined,
    hospitalName: data.clinic_name || undefined,
    category: data.category || 'doctor',
    productsDetailed: data.products_detailed || [],
    samplesGiven: data.samples_given || [],
    pobAmount: Number(data.pob_amount) || 0,
    area: data.area || undefined,
    timeSlot: data.time_slot || undefined,
    visitPurpose: data.visit_purpose || undefined
  };
}

export async function getVisitsForDate(employeeId: string, date: string): Promise<FieldVisit[]> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('scheduled_date', date)
    .order('scheduled_start', { ascending: true, nullsFirst: true });

  if (error) throw error;
  return (data || []).map(mapVisit);
}

export async function getAllVisitsForDate(date: string): Promise<FieldVisit[]> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .eq('scheduled_date', date);

  if (error) throw error;
  return (data || []).map(mapVisit);
}

export async function createVisit(visit: Partial<FieldVisit>): Promise<FieldVisit> {
  const { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .insert([{
      employee_id: visit.employeeId,
      session_id: visit.sessionId,
      assigned_by: visit.assignedBy,
      visit_type: visit.visitType || 'DOCTOR_VISIT',
      title: visit.title,
      description: visit.description,
      scheduled_date: visit.scheduledDate,
      scheduled_start: visit.scheduledStart,
      scheduled_end: visit.scheduledEnd,
      assigned_latitude: visit.assignedLatitude,
      assigned_longitude: visit.assignedLongitude,
      assigned_address: visit.assignedAddress,
      allowed_radius_meters: visit.allowedRadiusMeters || 150,
      priority: visit.priority || 'normal',
      patient_name: visit.patientName,
      client_reference: visit.clientReference,
      status: visit.status || 'ASSIGNED',
      approval_status: visit.approvalStatus || 'approved',
      approved_by: visit.approvedBy || null,
      rejection_reason: visit.rejectionReason || null,
      doctor_name: visit.doctorName || null,
      clinic_name: visit.clinicName || null,
      category: visit.category || 'doctor',
      products_detailed: visit.productsDetailed || [],
      samples_given: visit.samplesGiven || [],
      pob_amount: visit.pobAmount || 0,
      area: visit.area || null,
      time_slot: visit.timeSlot || null,
      visit_purpose: visit.visitPurpose || null
    }])
    .select()
    .single();

  if (error) throw error;
  return mapVisit(data);
}

export async function bulkCreateVisits(visits: Partial<FieldVisit>[]): Promise<void> {
  const payload = visits.map(visit => ({
    employee_id: visit.employeeId,
    assigned_by: visit.assignedBy,
    visit_type: visit.visitType || 'DOCTOR_VISIT',
    title: visit.title,
    description: visit.description,
    scheduled_date: visit.scheduledDate,
    scheduled_start: visit.scheduledStart,
    assigned_address: visit.assignedAddress,
    status: 'ASSIGNED',
    priority: 'normal',
    allowed_radius_meters: 500
  }));

  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .insert(payload);

  if (error) throw error;

  // Also mirror into HRMS_tasks so it displays in the Work Assignment panel
  try {
    const taskPayload = visits.map(v => ({
      title: v.title || 'Doctor Field Visit',
      description: `${v.title || 'Field Visit'} at ${v.assignedAddress || 'Hospital'}. ${v.description || ''}`.trim(),
      priority: 'medium',
      status: 'in_progress',
      due_date: v.scheduledDate,
      assigned_to: v.employeeId,
      created_by: v.assignedBy
    }));

    await supabase.from('pharma_hrms_tasks').insert(taskPayload);
  } catch (tErr) {
    console.warn('Could not mirror bulk visits to HRMS_tasks:', tErr);
  }
}

export async function updateVisitStatus(
  visitId: string,
  employeeId: string,
  status: FieldVisitStatus,
  sessionId?: string,
  latitude?: number,
  longitude?: number,
  accuracyM?: number,
  address?: string,
  photoData?: string,
  notes?: string
): Promise<FieldVisit> {
  // Fetch existing visit first
  const { data: existing, error: fetchErr } = await supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .eq('id', visitId)
    .single();

  if (fetchErr) throw fetchErr;

  let updatePayload: any = { status };
  let eventType: FieldEventType;
  let metadata: Record<string, any> = {};

  const now = new Date().toISOString();

  switch (status) {
    case 'EN_ROUTE':
      updatePayload.started_at = now;
      eventType = 'VISIT_EN_ROUTE';
      break;

    case 'ARRIVED':
      updatePayload.arrived_at = now;
      eventType = 'VISIT_ARRIVED';
      updatePayload.actual_latitude = latitude;
      updatePayload.actual_longitude = longitude;
      updatePayload.actual_address = address;
      
      // Calculate distance if assigned location exists
      if (existing.assigned_latitude && existing.assigned_longitude && latitude && longitude) {
        const dist = getDistanceMeters(
          latitude, longitude,
          existing.assigned_latitude, existing.assigned_longitude
        );
        updatePayload.arrival_distance_m = Math.round(dist);
        metadata.distance_m = Math.round(dist);

        if (dist > (existing.allowed_radius_meters || 150)) {
          updatePayload.location_exception = true;
          metadata.exception = 'LOCATION_MISMATCH';
        }
      }
      break;

    case 'COMPLETED':
      updatePayload.completed_at = now;
      eventType = 'VISIT_COMPLETED';
      if (notes) updatePayload.completion_notes = notes;
      
      // Handle photo proof
      if (photoData) {
        updatePayload.proof_photo_url = photoData; // Store base64 directly for now
        await addProof(visitId, 'photo', photoData, latitude, longitude);
      }
      
      // Calculate duration
      if (existing.arrived_at) {
        const arrTime = new Date(existing.arrived_at).getTime();
        const compTime = new Date(now).getTime();
        updatePayload.duration_minutes = Math.round((compTime - arrTime) / 60000);
      }
      break;

    case 'CANCELLED':
      eventType = 'VISIT_CANCELLED';
      if (notes) metadata.cancel_reason = notes;
      break;

    case 'MISSED':
      eventType = 'VISIT_MISSED';
      break;
      
    case 'IN_PROGRESS':
      eventType = 'VISIT_IN_PROGRESS';
      if (!existing.started_at) updatePayload.started_at = now;
      if (latitude && longitude) {
        updatePayload.actual_latitude = latitude;
        updatePayload.actual_longitude = longitude;
      }
      if (address) updatePayload.actual_address = address;
      if (photoData) {
        updatePayload.start_photo_url = photoData;
        await addProof(visitId, 'photo', photoData, latitude, longitude);
      }
      break;

    default:
      eventType = 'VISIT_EN_ROUTE'; // fallback
  }

  let { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .update(updatePayload)
    .eq('id', visitId)
    .select();

  // Gracefully fallback if newer columns do not exist on legacy table
  if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('start_photo_url') || error.message?.includes('proof_photo_url') || error.message?.includes('completion_notes'))) {
    let shouldRetry = false;
    if (updatePayload.start_photo_url !== undefined) {
      delete updatePayload.start_photo_url;
      shouldRetry = true;
    }
    if (updatePayload.proof_photo_url !== undefined) {
      delete updatePayload.proof_photo_url;
      shouldRetry = true;
    }
    if (updatePayload.completion_notes !== undefined) {
      delete updatePayload.completion_notes;
      shouldRetry = true;
    }
    
    if (shouldRetry) {
      const retry = await supabase
        .from('pharma_hrms_field_visits')
        .update(updatePayload)
        .eq('id', visitId)
        .select();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) throw error;

  // Log event
  await logFieldEvent(employeeId, eventType, visitId, sessionId, latitude, longitude, accuracyM, address, metadata);

  // Additional explicit event for location exception
  if (updatePayload.location_exception) {
     await logFieldEvent(employeeId, 'LOCATION_EXCEPTION', visitId, sessionId, latitude, longitude, accuracyM, address, metadata);
  }

  // If update returned 0 rows (e.g. due to RLS on RETURNING clause), fallback to merging existing
  const updatedData = data && data.length > 0 ? data[0] : { ...existing, ...updatePayload };
  
  return mapVisit(updatedData);
}

export async function startCallWithPhoto(
  visitId: string,
  employeeId: string,
  photoData: string,
  latitude?: number,
  longitude?: number,
  address?: string,
  notes?: string
): Promise<FieldVisit> {
  return updateVisitStatus(
    visitId,
    employeeId,
    'IN_PROGRESS',
    undefined,
    latitude,
    longitude,
    10,
    address,
    photoData,
    notes
  );
}

export async function completeCallWithPhoto(
  visitId: string,
  employeeId: string,
  photoData: string,
  latitude?: number,
  longitude?: number,
  notes?: string
): Promise<FieldVisit> {
  return updateVisitStatus(
    visitId,
    employeeId,
    'COMPLETED',
    undefined,
    latitude,
    longitude,
    10,
    undefined, // address
    photoData,
    notes
  );
}

export async function createAdHocCall(
  employeeId: string,
  title: string,
  startPhotoData: string,
  latitude?: number,
  longitude?: number,
  address?: string
): Promise<FieldVisit> {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const payload: any = {
    employee_id: employeeId,
    title,
    visit_type: 'DOCTOR_VISIT',
    scheduled_date: today,
    scheduled_start: nowTime,
    status: 'IN_PROGRESS',
    started_at: new Date().toISOString(),
    start_photo_url: startPhotoData,
    actual_latitude: latitude,
    actual_longitude: longitude,
    actual_address: address,
    priority: 'normal',
    allowed_radius_meters: 500,
    location_exception: false
  };

  let { data, error } = await supabase
    .from('pharma_hrms_field_visits')
    .insert([payload])
    .select()
    .single();

  if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('start_photo_url')) && payload.start_photo_url !== undefined) {
    delete payload.start_photo_url;
    const retry = await supabase
      .from('pharma_hrms_field_visits')
      .insert([payload])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;

  if (data?.id && startPhotoData) {
    await addProof(data.id, 'photo', startPhotoData, latitude, longitude);
  }

  return mapVisit(data);
}

export async function approveFieldVisit(visitId: string, approverId: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .update({
      approval_status: 'approved',
      approved_by: approverId,
      rejection_reason: null
    })
    .eq('id', visitId);

  if (error) throw error;
}

export async function rejectFieldVisit(visitId: string, approverId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .update({
      approval_status: 'rejected',
      approved_by: approverId,
      rejection_reason: reason || null
    })
    .eq('id', visitId);

  if (error) throw error;
}

export async function getTeamVisits(teamMemberIds: string[], date?: string): Promise<FieldVisit[]> {
  if (!teamMemberIds.length) return [];
  let query = supabase
    .from('pharma_hrms_field_visits')
    .select('*')
    .in('employee_id', teamMemberIds);

  if (date) {
    query = query.eq('scheduled_date', date);
  }

  const { data, error } = await query
    .order('scheduled_date', { ascending: false })
    .order('scheduled_start', { ascending: true, nullsFirst: true });

  if (error) throw error;
  return (data || []).map(mapVisit);
}

export async function deleteVisit(visitId: string): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_visits')
    .delete()
    .eq('id', visitId);

  if (error) throw error;
}

