import { supabase } from '../supabase-client';
import { FieldVisitPin } from '../../types';

export const createPin = async (
  visitId: string,
  employeeId: string,
  latitude: number,
  longitude: number,
  category: string = 'Other',
  label?: string,
  note?: string,
  photoUrl?: string
): Promise<FieldVisitPin | null> => {
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_location_pins')
      .insert([
        {
          visit_id: visitId,
          employee_id: employeeId,
          latitude,
          longitude,
          category,
          label: label?.trim() || null,
          note: note?.trim() || null,
          photo_url: photoUrl || null,
          pinned_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating field visit pin:', error);
      return null;
    }

    return {
      id: data.id,
      visitId: data.visit_id,
      employeeId: data.employee_id,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      category: data.category,
      label: data.label,
      note: data.note,
      photoUrl: data.photo_url,
      pinnedAt: data.pinned_at
    };
  } catch (err) {
    console.error('Unexpected error in createPin:', err);
    return null;
  }
};

export const getPinsForVisit = async (visitId: string): Promise<FieldVisitPin[]> => {
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_location_pins')
      .select('*')
      .eq('visit_id', visitId)
      .order('pinned_at', { ascending: true });

    if (error) {
      console.error('Error fetching pins for visit:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      visitId: row.visit_id,
      employeeId: row.employee_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      category: row.category,
      label: row.label,
      note: row.note,
      photoUrl: row.photo_url,
      pinnedAt: row.pinned_at
    }));
  } catch (err) {
    console.error('Unexpected error in getPinsForVisit:', err);
    return [];
  }
};

export const getPinsForVisits = async (visitIds: string[]): Promise<FieldVisitPin[]> => {
  if (!visitIds || visitIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_location_pins')
      .select('*')
      .in('visit_id', visitIds)
      .order('pinned_at', { ascending: true });

    if (error) {
      console.error('Error fetching pins for visits:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      visitId: row.visit_id,
      employeeId: row.employee_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      category: row.category,
      label: row.label,
      note: row.note,
      photoUrl: row.photo_url,
      pinnedAt: row.pinned_at
    }));
  } catch (err) {
    console.error('Unexpected error in getPinsForVisits:', err);
    return [];
  }
};
