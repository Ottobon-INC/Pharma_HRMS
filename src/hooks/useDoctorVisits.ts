import { useState, useCallback, useEffect } from 'react';
import { DoctorVisit } from '../types';
import * as doctorVisitService from '../lib/services/doctor-visit-service';

export function useDoctorVisits(employeeId?: string, isLocalMode = false) {
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadVisits = useCallback(async () => {
    if (!employeeId || isLocalMode) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorVisitService.fetchDoctorVisits(employeeId);
      setVisits(data);
    } catch (err) {
      console.error('Failed to load doctor visits', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, isLocalMode]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const addVisit = async (visit: Omit<DoctorVisit, 'id'>) => {
    if (isLocalMode) return;
    try {
      const newVisit = await doctorVisitService.createDoctorVisit(visit);
      setVisits(prev => [...prev, newVisit]);
      return newVisit;
    } catch (err) {
      console.error('Failed to add visit', err);
      throw err;
    }
  };

  const updateVisit = async (id: string, updates: Partial<DoctorVisit>) => {
    if (isLocalMode) return;
    try {
      await doctorVisitService.updateDoctorVisit(id, updates);
      setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (err) {
      console.error('Failed to update visit', err);
      throw err;
    }
  };

  const removeVisit = async (id: string) => {
    if (isLocalMode) return;
    try {
      await doctorVisitService.deleteDoctorVisit(id);
      setVisits(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Failed to remove visit', err);
      throw err;
    }
  };

  const copyVisits = async (fromDate: string, toDate: string) => {
    if (!employeeId || isLocalMode) return;
    try {
      const newVisits = await doctorVisitService.copyVisitsFromDate(employeeId, fromDate, toDate);
      setVisits(prev => [...prev, ...newVisits]);
      return newVisits;
    } catch (err) {
      console.error('Failed to copy visits', err);
      throw err;
    }
  };

  return {
    visits,
    isLoading,
    error,
    refresh: loadVisits,
    addVisit,
    updateVisit,
    removeVisit,
    copyVisits
  };
}
