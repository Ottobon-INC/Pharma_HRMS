import { useState, useCallback, useEffect } from 'react';
import { FieldVisitPin, PinCategory } from '../types';
import * as fieldPinService from '../lib/services/field-pin-service';

export function useFieldPins(visitId?: string) {
  const [pins, setPins] = useState<FieldVisitPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPins = useCallback(async () => {
    if (!visitId) {
      setPins([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetched = await fieldPinService.getPinsForVisit(visitId);
      setPins(fetched);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const dropPin = useCallback(
    async (
      employeeId: string,
      latitude: number,
      longitude: number,
      category: PinCategory | string,
      label?: string,
      note?: string,
      photoUrl?: string
    ) => {
      if (!visitId) return null;
      setLoading(true);
      setError(null);
      try {
        const created = await fieldPinService.createPin(
          visitId,
          employeeId,
          latitude,
          longitude,
          category,
          label,
          note,
          photoUrl
        );

        if (created) {
          setPins(prev => [...prev, created]);
          return created;
        } else {
          setError('Could not save location pin');
          return null;
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to drop pin');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [visitId]
  );

  return {
    pins,
    loading,
    error,
    dropPin,
    refreshPins: loadPins
  };
}
