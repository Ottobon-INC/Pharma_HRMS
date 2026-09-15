import { useState, useCallback, useEffect } from 'react';
import { FieldVisit, FieldVisitStatus } from '../types';
import * as fieldVisitService from '../lib/services/field-visit-service';
import { getCurrentLocationSafe } from '../lib/utils/location-utils';
import { supabase } from '../lib/supabase-client';

export function useFieldVisits(employeeId: string | undefined, sessionId: string | undefined, isLocalMode: boolean) {
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVisits = useCallback(async () => {
    if (isLocalMode || !employeeId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let v = await fieldVisitService.getVisitsForDate(employeeId, today);
      if (v.length === 0) {
        // Fallback: Fetch upcoming visits assigned to this employee
        const { data, error } = await supabase
          .from('pharma_hrms_field_visits')
          .select('*')
          .eq('employee_id', employeeId)
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED')
          .order('scheduled_date', { ascending: true })
          .order('scheduled_start', { ascending: true });
        
        if (!error && data) {
          v = data.map((d: any) => ({
            id: d.id,
            sessionId: d.session_id,
            employeeId: d.employee_id,
            assignedBy: d.assigned_by,
            visitType: d.visit_type,
            title: d.title,
            description: d.description,
            scheduledDate: d.scheduled_date,
            scheduledStart: d.scheduled_start,
            scheduledEnd: d.scheduled_end,
            assignedLatitude: d.assigned_latitude,
            assignedLongitude: d.assigned_longitude,
            assignedAddress: d.assigned_address,
            allowedRadiusMeters: d.allowed_radius_meters,
            priority: d.priority,
            status: d.status,
            startedAt: d.started_at,
            arrivedAt: d.arrived_at,
            completedAt: d.completed_at,
            actualLatitude: d.actual_latitude,
            actualLongitude: d.actual_longitude,
            actualAddress: d.actual_address,
            arrivalDistanceM: d.arrival_distance_m,
            durationMinutes: d.duration_minutes,
            startPhotoUrl: d.start_photo_url,
            proofPhotoUrl: d.proof_photo_url,
            completionNotes: d.completion_notes,
            patientName: d.patient_name,
            clientReference: d.client_reference,
            locationException: d.location_exception
          }));
        }
      }
      setVisits(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [employeeId, isLocalMode]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const updateStatus = async (
    visitId: string, 
    status: FieldVisitStatus, 
    photoData?: string, 
    notes?: string
  ): Promise<{ success: boolean; error?: string; visit?: FieldVisit }> => {
    if (isLocalMode || !employeeId || !sessionId) return { success: false, error: 'Offline or missing session' };
    
    setLoading(true);
    try {
      const loc = await getCurrentLocationSafe();
      if (loc.error && status === 'ARRIVED') {
        // Enforce GPS on arrival
        return { success: false, error: loc.error };
      }

      const updated = await fieldVisitService.updateVisitStatus(
        visitId,
        employeeId,
        status,
        sessionId,
        loc.latitude,
        loc.longitude,
        undefined,
        loc.address,
        photoData,
        notes
      );
      
      setVisits(prev => prev.map(v => v.id === visitId ? updated : v));
      return { success: true, visit: updated };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Failed to update visit status.' };
    } finally {
      setLoading(false);
    }
  };

  const createVisitRequest = async (visit: Partial<FieldVisit>): Promise<{ success: boolean; error?: string }> => {
    if (isLocalMode || !employeeId) return { success: false, error: 'Offline' };
    setLoading(true);
    try {
      await fieldVisitService.createVisit({
        ...visit,
        employeeId,
        sessionId
      });
      await loadVisits();
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Failed to create visit.' };
    } finally {
      setLoading(false);
    }
  };

  return { visits, loading, updateStatus, createVisitRequest, loadVisits };
}
