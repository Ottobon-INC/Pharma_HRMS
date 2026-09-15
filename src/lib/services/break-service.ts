import { supabase } from '../supabase-client';

export interface BreakRecord {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  created_at?: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'hrms_active_break_';

function getLocalActiveBreak(employeeId: string): BreakRecord | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${employeeId}`);
    if (!raw) return null;
    const parsed: BreakRecord = JSON.parse(raw);
    const todayStr = new Date().toISOString().split('T')[0];
    if (parsed.date === todayStr && !parsed.end_time) {
      return parsed;
    }
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${employeeId}`);
  } catch (e) {
    console.warn('Error reading local active break:', e);
  }
  return null;
}

function setLocalActiveBreak(employeeId: string, record: BreakRecord | null) {
  try {
    if (record) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${employeeId}`, JSON.stringify(record));
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${employeeId}`);
    }
  } catch (e) {
    console.warn('Error saving local active break:', e);
  }
}

/**
 * Fetch the currently open break session for today (where end_time is null).
 */
export async function getActiveBreak(employeeId: string): Promise<BreakRecord | null> {
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('pharma_hrms_breaks')
      .select('id, employee_id, date, start_time, end_time, created_at')
      .eq('employee_id', employeeId)
      .eq('date', todayStr)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1);

    if (error) {
      // Table might not exist or schema cache not loaded yet (PGRST205)
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return getLocalActiveBreak(employeeId);
      }
      console.warn('Could not query HRMS_breaks from remote, checking local fallback:', error.message);
      return getLocalActiveBreak(employeeId);
    }

    if (data && data.length > 0) {
      setLocalActiveBreak(employeeId, data[0]);
      return data[0] as BreakRecord;
    } else {
      setLocalActiveBreak(employeeId, null);
      return null;
    }
  } catch (err) {
    console.warn('Unexpected error in getActiveBreak:', err);
    return getLocalActiveBreak(employeeId);
  }
}

/**
 * Start a break session: records start_time and sets active break state.
 */
export async function startBreak(employeeId: string): Promise<BreakRecord> {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  const fallbackRecord: BreakRecord = {
    id: `local-brk-${Date.now()}`,
    employee_id: employeeId,
    date: todayStr,
    start_time: timeStr,
    end_time: null,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('pharma_hrms_breaks')
      .insert([
        {
          employee_id: employeeId,
          date: todayStr,
          start_time: timeStr,
          end_time: null
        }
      ])
      .select()
      .single();

    if (error) {
      console.warn('Notice saving break to remote Supabase (using local session fallback):', error.message);
      setLocalActiveBreak(employeeId, fallbackRecord);
      return fallbackRecord;
    }

    setLocalActiveBreak(employeeId, data as BreakRecord);
    return data as BreakRecord;
  } catch (err) {
    console.warn('Unexpected error in startBreak, using local session fallback:', err);
    setLocalActiveBreak(employeeId, fallbackRecord);
    return fallbackRecord;
  }
}

/**
 * End an active break session: records end_time.
 */
export async function endBreak(employeeId: string): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  setLocalActiveBreak(employeeId, null);

  try {
    const { error } = await supabase
      .from('pharma_hrms_breaks')
      .update({ end_time: timeStr })
      .eq('employee_id', employeeId)
      .eq('date', todayStr)
      .is('end_time', null);

    if (error) {
      console.warn('Notice ending break on remote Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error in endBreak:', err);
  }
}

/**
 * Get all break records for an employee for today.
 */
export async function getTodayBreaks(employeeId: string): Promise<BreakRecord[]> {
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('pharma_hrms_breaks')
      .select('id, employee_id, date, start_time, end_time, created_at')
      .eq('employee_id', employeeId)
      .eq('date', todayStr)
      .order('start_time', { ascending: true });

    if (error) {
      const active = getLocalActiveBreak(employeeId);
      return active ? [active] : [];
    }

    return (data as BreakRecord[]) || [];
  } catch (err) {
    const active = getLocalActiveBreak(employeeId);
    return active ? [active] : [];
  }
}

/**
 * Calculates total completed break seconds for today.
 */
export function calculateCompletedBreakSeconds(breaks: BreakRecord[]): number {
  return breaks.reduce((acc, brk) => {
    if (brk.start_time && brk.end_time) {
      const [h1, m1, s1] = brk.start_time.split(':').map(Number);
      const [h2, m2, s2] = brk.end_time.split(':').map(Number);
      const sec1 = h1 * 3600 + m1 * 60 + (s1 || 0);
      const sec2 = h2 * 3600 + m2 * 60 + (s2 || 0);
      const diff = sec2 - sec1;
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0);
}
