import { AttendanceStatus, PunchType } from '../types';
import * as attendanceService from '../lib/services/attendance-service';
import * as leaveService from '../lib/services/leave-service';
import { supabase } from '../lib/supabase-client';

/** Helper: get GPS position with a configurable timeout and accuracy mode */
function getPosition(enableHighAccuracy: boolean, timeout: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout,
      maximumAge: 60000,
      enableHighAccuracy,
    });
  });
}

export function useAttendance(isLocalMode: boolean, loadData: () => Promise<void>) {
  const toggleCheckIn = async (empId: string, isCurrentlyCheckedIn: boolean, photoData?: string, punchType: PunchType = 'in_office', punchNote?: string) => {

    if (isLocalMode) {
      alert("Attendance can only be recorded in online mode.");
      return;
    }
    
    try {
      let locationStr: string | undefined = undefined;
      let latLngStr: string | undefined = undefined;

      try {
        // Fast-first GPS: try a quick network-based location first (5s),
        // then fall back to high-accuracy GPS (10s) if needed.
        let position: GeolocationPosition | null = null;
        try {
          position = await getPosition(false, 5000);
        } catch {
          position = await getPosition(true, 10000);
        }

        const { latitude, longitude } = position.coords;
        latLngStr = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

        // Reverse geocoding with strict 3-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            const suburb = data.address.suburb || data.address.neighbourhood || '';
            locationStr = [suburb, city, state].filter(Boolean).join(', ');
          }
        } catch {
          locationStr = "Location details unavailable";
        }
      } catch (err: any) {
        console.warn("Could not get location:", err);
        locationStr = isCurrentlyCheckedIn
          ? "Punch-out - Location Unavailable (GPS Failed)"
          : "Location Unavailable (GPS Failed)";
        latLngStr = "0,0";
      }

      if (isCurrentlyCheckedIn) {
        await attendanceService.clockOutEmployee(empId, photoData, locationStr, latLngStr);
        await loadData();
        return { success: true };
      } else {
        await attendanceService.clockInEmployee(empId, locationStr, latLngStr, photoData, punchType, punchNote);
      }
      
      await loadData();
      return { success: true };
    } catch (err: any) {
      console.error("Attendance record error:", err);
      return { success: false, error: err?.message || "Failed to record attendance. Please try again." };
    }
  };

  const updateAttendance = async (empId: string, date: string, status: AttendanceStatus, checkIn?: string, checkOut?: string) => {
    if (isLocalMode) {
      alert("Attendance can only be edited in online mode.");
      return;
    }
    
    await attendanceService.updateAttendanceRecord(empId, date, status, checkIn, checkOut);
    
    // Apply leave penalty if marked absent
    if (status === 'absent') {
      try {
        await leaveService.deductPenaltyLeave(empId, 'casual', 2); // Deduct 2 days from casual leave
      } catch (err) {
        console.warn("Could not deduct leave penalty:", err);
      }
    }
    
    await loadData();
  };

  const forceCloseSession = async (empId: string, date: string, time?: string) => {
    if (isLocalMode) {
      alert("Attendance can only be edited in online mode.");
      return;
    }
    
    const timeStr = time || '18:00:00'; // Default to 6 PM if not provided
    
    // Find active session for that date
    const { data: activeSessions, error: fetchErr } = await supabase
      .from('pharma_hrms_attendance')
      .select('id')
      .eq('employee_id', empId)
      .eq('date', date)
      .is('check_out_time', null);
      
    if (fetchErr || !activeSessions || activeSessions.length === 0) return;
    
    for (const session of activeSessions) {
      await supabase
        .from('pharma_hrms_attendance')
        .update({ check_out_time: timeStr, punch_note: 'Forced close by Admin' })
        .eq('id', session.id);
    }
    
    await loadData();
  };

  return {
    toggleCheckIn,
    updateAttendance,
    forceCloseSession
  };
}
