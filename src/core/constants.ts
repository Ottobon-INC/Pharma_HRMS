export interface ShiftTemplate {
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  colorClass: string;
}

// Default Shift Timings
export const PREDEFINED_SHIFTS: ShiftTemplate[] = [
  { label: 'Morning Shift', start: '08:00', end: '16:00', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { label: 'General Shift 1', start: '09:00', end: '17:00', colorClass: 'bg-teal-100 text-teal-800 border-teal-200' },
  { label: 'General Shift 2', start: '10:00', end: '18:00', colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { label: 'Afternoon Shift', start: '13:00', end: '20:00', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { label: 'Night Shift', start: '20:00', end: '08:00', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { label: 'Off', start: '00:00', end: '00:00', colorClass: 'bg-slate-100 text-slate-800 border-slate-200' }
];

export const DEFAULT_GEOFENCE_RADIUS_METERS = 100;
