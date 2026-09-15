import { useState, useEffect } from 'react';
import { LocationPin, PinType } from '../types';
import * as locationPinService from '../lib/services/location-pin-service';

export function useLocationPins(empId: string | undefined, isLocalMode: boolean) {
  const [pins, setPins] = useState<LocationPin[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPins = async () => {
    if (isLocalMode || !empId) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const fetchedPins = await locationPinService.fetchLocationPins(empId, todayStr);
      setPins(fetchedPins);
    } catch (error) {
      console.error("Error loading location pins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPins();
  }, [empId, isLocalMode]);

  const addPin = async (
    pinType: PinType,
    label?: string,
    photoData?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isLocalMode || !empId) {
      return { success: false, error: "Cannot add pins in local mode." };
    }

    try {
      let locationStr: string | undefined = undefined;
      let lat: number | undefined = undefined;
      let lng: number | undefined = undefined;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            timeout: 20000, // 20 seconds
            maximumAge: 30000, // 30 seconds
            enableHighAccuracy: true
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        // Reverse geocoding
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
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
        } catch (e) {
          console.warn("Reverse geocoding timed out or failed:", e);
          locationStr = "Location details unavailable";
        }
      } catch (err) {
        console.warn("Could not get location:", err);
        // It's okay if they can't get GPS, but we can't save lat/lng.
        // We'll proceed without it, or we could return an error if strictly required.
      }

      await locationPinService.addLocationPin(
        empId,
        pinType,
        label,
        lat,
        lng,
        locationStr,
        photoData
      );

      await loadPins();
      return { success: true };
    } catch (err: any) {
      console.error("Add pin error:", err);
      return { success: false, error: "Failed to pin location. Please try again." };
    }
  };

  return {
    pins,
    addPin,
    loading,
    refreshPins: loadPins
  };
}
