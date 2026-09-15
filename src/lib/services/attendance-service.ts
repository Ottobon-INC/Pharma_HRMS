import { supabase } from '../supabase-client';
import { AttendanceStatus, PunchType } from '../../types';



export async function clockInEmployee(
  empId: string, 
  location?: string, 
  latLng?: string,
  photoUrl?: string,
  punchType: PunchType = 'in_office',
  punchNote?: string
): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  // Find max session number for today
  const { data: existingSessions, error: sessionErr } = await supabase
    .from('pharma_hrms_attendance')
    .select('session_number')
    .eq('employee_id', empId)
    .eq('date', todayStr);

  if (sessionErr) throw sessionErr;

  let nextSessionNumber = 1;
  if (existingSessions && existingSessions.length > 0) {
    const maxSession = Math.max(...existingSessions.map((s: any) => s.session_number || 1));
    nextSessionNumber = maxSession + 1;
  }

  const payload: any = {
    employee_id: empId, 
    date: todayStr, 
    status: 'Present', 
    check_in_time: timeStr,
    check_in_location: location || null,
    check_in_lat_lng: latLng || null,
    punch_type: punchType,
    punch_note: punchNote || null,
    session_number: nextSessionNumber
  };
  if (photoUrl) payload.check_in_photo_url = photoUrl;

  const { error } = await supabase
    .from('pharma_hrms_attendance')
    .insert([payload]);

  if (error && (error.code === '42703' || error.code === 'PGRST204') && photoUrl) {
    console.warn("check_in_photo_url column missing, falling back to without photo");
    delete payload.check_in_photo_url;
    const retry = await supabase.from('pharma_hrms_attendance').insert([payload]);
    if (retry.error) throw retry.error;
  } else if (error) {
    throw error;
  }
}

export async function clockOutEmployee(
  empId: string, 
  photoUrl?: string,
  location?: string,
  latLng?: string
): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  // Find the most recent active session
  const { data: existingSessions, error: fetchErr } = await supabase
    .from('pharma_hrms_attendance')
    .select('id, session_number, check_out_time')
    .eq('employee_id', empId)
    .eq('date', todayStr)
    .order('session_number', { ascending: false });

  if (fetchErr) throw fetchErr;

  const activeSession = existingSessions?.find(s => s.check_out_time === null);

  if (activeSession) {
    const payload: any = { 
      check_out_time: timeStr
    };
    if (photoUrl) payload.check_out_photo_url = photoUrl;
    if (location) payload.check_out_location = location;
    if (latLng) payload.check_out_lat_lng = latLng;
    
    let { error } = await supabase
      .from('pharma_hrms_attendance')
      .update(payload)
      .eq('id', activeSession.id);

    // Fallback if check_out_location / check_out_lat_lng / check_out_photo_url columns don't exist in remote table schema
    if (error && (error.code === '42703' || error.code === 'PGRST204')) {
      delete payload.check_out_location;
      delete payload.check_out_lat_lng;
      let retry = await supabase
        .from('pharma_hrms_attendance')
        .update(payload)
        .eq('id', activeSession.id);

      if (retry.error && (retry.error.code === '42703' || retry.error.code === 'PGRST204') && payload.check_out_photo_url) {
        delete payload.check_out_photo_url;
        retry = await supabase
          .from('pharma_hrms_attendance')
          .update(payload)
          .eq('id', activeSession.id);
      }
      if (retry.error) throw retry.error;
    } else if (error) {
      throw error;
    }
  } else {
    // If no active session found to clock out, just return or create a new session if needed.
    const { data: allSessions } = await supabase
      .from('pharma_hrms_attendance')
      .select('session_number')
      .eq('employee_id', empId)
      .eq('date', todayStr);
      
    let nextSession = 1;
    if (allSessions && allSessions.length > 0) {
      nextSession = Math.max(...allSessions.map((s: any) => s.session_number || 1)) + 1;
    }
  
    const payload: any = { 
      employee_id: empId, 
      date: todayStr, 
      status: 'Present', 
      check_out_time: timeStr,
      session_number: nextSession
    };
    if (photoUrl) payload.check_out_photo_url = photoUrl;
    if (location) payload.check_out_location = location;
    if (latLng) payload.check_out_lat_lng = latLng;
    
    let { error } = await supabase
      .from('pharma_hrms_attendance')
      .insert([payload]);

    if (error && (error.code === '42703' || error.code === 'PGRST204')) {
      delete payload.check_out_location;
      delete payload.check_out_lat_lng;
      let retry = await supabase.from('pharma_hrms_attendance').insert([payload]);
      if (retry.error && (retry.error.code === '42703' || retry.error.code === 'PGRST204') && payload.check_out_photo_url) {
        delete payload.check_out_photo_url;
        retry = await supabase.from('pharma_hrms_attendance').insert([payload]);
      }
      if (retry.error) throw retry.error;
    } else if (error) {
      throw error;
    }
  }
}

export async function updateAttendanceRecord(
  empId: string,
  date: string,
  status: AttendanceStatus,
  checkIn?: string,
  checkOut?: string
): Promise<void> {
  const { data: existing, error: fetchErr } = await supabase
    .from('pharma_hrms_attendance')
    .select('id')
    .eq('employee_id', empId)
    .eq('date', date)
    .order('session_number', { ascending: true })
    .limit(1);

  if (fetchErr) throw fetchErr;

  const firstSession = existing && existing.length > 0 ? existing[0] : null;

  // Title case for database consistency (Present, Absent, Leave, etc.)
  const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);

  if (firstSession) {
    const { error } = await supabase
      .from('pharma_hrms_attendance')
      .update({ 
        status: dbStatus, 
        check_in_time: checkIn || null, 
        check_out_time: checkOut || null 
      })
      .eq('id', firstSession.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('pharma_hrms_attendance')
      .insert([{ 
        employee_id: empId, 
        date: date, 
        status: dbStatus, 
        check_in_time: checkIn || null, 
        check_out_time: checkOut || null,
        session_number: 1
      }]);
    if (error) throw error;
  }
}

export interface EmployeeCheckInLocation {
  id: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  checkInTime: string;
  checkOutTime: string | null;
  locationName?: string;
  photoUrl?: string;
  punchType?: PunchType;
  punchNote?: string;
  status: string;
}

export async function getTodayCheckInLocations(dateStr?: string): Promise<EmployeeCheckInLocation[]> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('pharma_hrms_attendance')
      .select('id, employee_id, check_in_lat_lng, check_in_time, check_out_time, check_in_location, check_in_photo_url, punch_type, punch_note, status')
      .eq('date', targetDate)
      .not('check_in_lat_lng', 'is', null);

    if (error) {
      console.error('Error fetching check-in locations:', error);
      return [];
    }

    const locations: EmployeeCheckInLocation[] = [];
    for (const row of data || []) {
      if (!row.check_in_lat_lng) continue;
      const parts = row.check_in_lat_lng.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
          locations.push({
            id: row.id,
            employeeId: row.employee_id,
            latitude: lat,
            longitude: lng,
            checkInTime: row.check_in_time,
            checkOutTime: row.check_out_time,
            locationName: row.check_in_location,
            photoUrl: row.check_in_photo_url,
            punchType: row.punch_type,
            punchNote: row.punch_note,
            status: row.status
          });
        }
      }
    }
    return locations;
  } catch (err) {
    console.error('Unexpected error in getTodayCheckInLocations:', err);
    return [];
  }
}

