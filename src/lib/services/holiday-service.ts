import { supabase } from '../supabase-client';
import { Holiday } from '../../types';

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [
  { id: 'h-1', date: '2026-01-14', day: 'Wednesday', name: 'Bhogi', type: 'gazetted', year: 2026 },
  { id: 'h-2', date: '2026-01-15', day: 'Thursday', name: 'Sankranthi', type: 'gazetted', year: 2026 },
  { id: 'h-3', date: '2026-01-16', day: 'Friday', name: 'Kanuma', type: 'gazetted', year: 2026 },
  { id: 'h-4', date: '2026-01-17', day: 'Saturday', name: 'Mukanuma', type: 'gazetted', year: 2026 },
  { id: 'h-5', date: '2026-01-26', day: 'Monday', name: 'Republic Day', type: 'gazetted', year: 2026 },
  { id: 'h-6', date: '2026-02-16', day: 'Wednesday', name: 'Shivarathri Next Day', type: 'gazetted', year: 2026 },
  { id: 'h-7', date: '2026-03-19', day: 'Thursday', name: 'Ugadi', type: 'gazetted', year: 2026 },
  { id: 'h-8', date: '2026-03-27', day: 'Friday', name: 'Sri Rama Navami', type: 'gazetted', year: 2026 },
  { id: 'h-9', date: '2026-05-01', day: 'Thursday', name: 'May Day', type: 'gazetted', year: 2026 },
  { id: 'h-10', date: '2026-08-15', day: 'Saturday', name: 'Independence Day', type: 'gazetted', year: 2026 },
  { id: 'h-11', date: '2026-09-14', day: 'Monday', name: 'Ganesh Puja', type: 'gazetted', year: 2026 },
  { id: 'h-12', date: '2026-10-02', day: 'Friday', name: 'Gandhi Jayanthi', type: 'gazetted', year: 2026 },
  { id: 'h-13', date: '2026-10-20', day: 'Tuesday', name: 'Dasara', type: 'gazetted', year: 2026 },
  { id: 'h-14', date: '2026-11-12', day: 'Thursday', name: 'Nagula Chavathi', type: 'gazetted', year: 2026 },
  { id: 'h-15', date: '2026-12-25', day: 'Friday', name: 'Christmas', type: 'gazetted', year: 2026 },
  { id: 'h-16', date: '2026-11-08', day: 'Sunday', name: 'Deepavali', type: 'sunday_compensatory', year: 2026 }
];

export async function fetchHolidays(year: number = 2026): Promise<Holiday[]> {
  try {
    let { data, error } = await supabase
      .from('HRMS_holidays')
      .select('*')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) {
      // Try alternate table name if prefixed
      const resAlt = await supabase
        .from('pharma_hrms_holidays')
        .select('*')
        .eq('year', year)
        .order('date', { ascending: true });

      if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
        data = resAlt.data;
        error = null;
      }
    }

    if (error || !data || data.length === 0) {
      return DEFAULT_HOLIDAYS_2026.filter(h => h.year === year);
    }

    return data.map((item: any) => ({
      id: item.id || `h-${item.date}`,
      date: item.date,
      day: item.day,
      name: item.name,
      type: item.type as 'gazetted' | 'sunday_compensatory',
      year: item.year || year
    }));
  } catch (err) {
    console.warn('Error loading holidays for Pharma HRMS, using local dataset:', err);
    return DEFAULT_HOLIDAYS_2026.filter(h => h.year === year);
  }
}

/**
 * Format Date as YYYY-MM-DD in local time
 */
export function formatLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if today is an official holiday
 */
export function getTodayHoliday(holidays: Holiday[], referenceDate: Date = new Date()): Holiday | null {
  const todayStr = formatLocalDateStr(referenceDate);
  return holidays.find(h => h.date === todayStr) || null;
}

/**
 * Checks if tomorrow is an official holiday (holiday eve)
 */
export function isHolidayEve(holidays: Holiday[], referenceDate: Date = new Date()): Holiday | null {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDateStr(tomorrow);
  return holidays.find(h => h.date === tomorrowStr) || null;
}

/**
 * Gets upcoming holidays on or after today, sorted chronologically
 */
export function getUpcomingHolidays(holidays: Holiday[], limit: number = 5, referenceDate: Date = new Date()): Holiday[] {
  const todayStr = formatLocalDateStr(referenceDate);
  return [...holidays]
    .filter(h => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/**
 * Gets the single next upcoming holiday
 */
export function getNextHoliday(holidays: Holiday[], referenceDate: Date = new Date()): Holiday | null {
  const upcoming = getUpcomingHolidays(holidays, 1, referenceDate);
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Calculates number of calendar days between referenceDate and a holiday
 */
export function getDaysUntil(holiday: Holiday, referenceDate: Date = new Date()): number {
  const todayStr = formatLocalDateStr(referenceDate);
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [hy, hm, hd] = holiday.date.split('-').map(Number);

  const tDate = new Date(ty, tm - 1, td);
  const hDate = new Date(hy, hm - 1, hd);

  const diffTime = hDate.getTime() - tDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
