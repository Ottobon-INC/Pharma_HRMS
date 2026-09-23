import { useState, useEffect, useCallback } from 'react';
import { Holiday } from '../types';
import {
  fetchHolidays,
  getTodayHoliday,
  getNextHoliday,
  getUpcomingHolidays,
  isHolidayEve,
  DEFAULT_HOLIDAYS_2026
} from '../lib/services/holiday-service';

export function useHolidays(year: number = 2026) {
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS_2026);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHolidays(year);
      setHolidays(data);
    } catch (err: any) {
      console.error('Failed to load holidays:', err);
      setError(err?.message || 'Failed to load holidays');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const todayHoliday = getTodayHoliday(holidays);
  const nextHoliday = getNextHoliday(holidays);
  const upcomingHolidays = getUpcomingHolidays(holidays, 10);
  const holidayEve = isHolidayEve(holidays);

  return {
    holidays,
    todayHoliday,
    nextHoliday,
    upcomingHolidays,
    holidayEve,
    isLoading,
    error,
    refreshHolidays: loadHolidays
  };
}
