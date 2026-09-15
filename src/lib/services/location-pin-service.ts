import { supabase } from '../supabase-client';
import { LocationPin, PinType } from '../../types';

export async function addLocationPin(
  empId: string,
  pinType: PinType,
  label?: string,
  latitude?: number,
  longitude?: number,
  locationName?: string,
  photoUrl?: string
): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  const payload: any = {
    employee_id: empId,
    date: todayStr,
    pinned_at: timeStr,
    pin_type: pinType,
  };

  if (label) payload.label = label;
  if (latitude !== undefined) payload.latitude = latitude;
  if (longitude !== undefined) payload.longitude = longitude;
  if (locationName) payload.location_name = locationName;
  if (photoUrl) payload.photo_url = photoUrl;

  const { error } = await supabase
    .from('pharma_hrms_location_pins')
    .insert([payload]);

  if (error) {
    throw error;
  }
}

export async function fetchLocationPins(empId: string, date: string): Promise<LocationPin[]> {
  const { data, error } = await supabase
    .from('pharma_hrms_location_pins')
    .select('*')
    .eq('employee_id', empId)
    .eq('date', date)
    .order('pinned_at', { ascending: true });

  if (error) {
    console.error("Error fetching location pins:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    pinnedAt: row.pinned_at,
    label: row.label,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    photoUrl: row.photo_url,
    pinType: row.pin_type as PinType,
  }));
}

export async function fetchAllPinsForDate(date: string): Promise<LocationPin[]> {
  const { data, error } = await supabase
    .from('pharma_hrms_location_pins')
    .select('*')
    .eq('date', date)
    .order('pinned_at', { ascending: true });

  if (error) {
    console.error("Error fetching all location pins:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    pinnedAt: row.pinned_at,
    label: row.label,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    photoUrl: row.photo_url,
    pinType: row.pin_type as PinType,
  }));
}
