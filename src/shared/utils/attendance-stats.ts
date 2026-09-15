import { AttendanceRecord, LeaveRequest } from '../../types';

export function computeAttendanceStats(
  month: string, 
  attendanceRecords: AttendanceRecord[], 
  leaveRequests: LeaveRequest[]
) {
  // month is YYYY-MM
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;

  // 7-day working week, so workingDays = days in month
  const workingDays = new Date(year, m + 1, 0).getDate();

  let daysPresent = 0;
  let paidLeaves = 0;
  let lopDays = 0;
  let leavesTaken = 0;

  const processedDays = new Set<string>();

  // Step 1: Count attendance records within the month
  attendanceRecords.forEach(record => {
    if (record.date.startsWith(month)) {
      processedDays.add(record.date);
      if (record.status === 'present') {
        daysPresent += 1;
      } else if (record.status === 'half-day') {
        daysPresent += 0.5;
        lopDays += 0.5;
        leavesTaken += 0.5;
      } else if (record.status === 'leave') {
        // Attendance row explicitly marked as leave (paid)
        paidLeaves += 1;
        leavesTaken += 1;
      } else if (record.status === 'absent') {
        lopDays += 1;
        leavesTaken += 1;
      }
    }
  });

  // Step 2: Add approved leave requests (these are always paid leaves)
  leaveRequests.forEach(req => {
    if (req.status === 'approved') {
      const start = new Date(req.fromDate);
      const end = new Date(req.toDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // Only count if not already accounted for by an attendance record
        if (dStr.startsWith(month) && !processedDays.has(dStr)) {
          paidLeaves += 1;
          leavesTaken += 1;
          processedDays.add(dStr);
        }
      }
    }
  });

  if (daysPresent < 0) daysPresent = 0;

  const hasData = processedDays.size > 0 || leaveRequests.some(r =>
    r.status === 'approved' &&
    (r.fromDate.startsWith(month) || r.toDate.startsWith(month))
  );

  return { workingDays, daysPresent, leavesTaken, paidLeaves, lopDays, hasData };
}
