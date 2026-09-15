import { useState, useEffect, useCallback } from 'react';
import { FieldVisit, FieldVisitPin } from '../types';
import * as fieldPinService from '../lib/services/field-pin-service';
import { fieldOpsConfig } from '../lib/fieldOpsConfig';

export function useVisitPins(visits: FieldVisit[]) {
  const [pins, setPins] = useState<FieldVisitPin[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPins = useCallback(async () => {
    if (visits.length === 0) {
      setPins([]);
      return;
    }

    setLoading(true);
    try {
      const visitIds = visits.map(v => v.id);
      const fetchedPins = await fieldPinService.getPinsForVisits(visitIds);
      setPins(fetchedPins);
    } catch (err) {
      console.error('Error loading pins for visits:', err);
    } finally {
      setLoading(false);
    }
  }, [visits]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  return {
    pins,
    loading,
    refreshPins: loadPins
  };
}
