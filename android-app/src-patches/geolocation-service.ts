/**
 * Orca Labs Pharma HRMS — Native Geolocation Service
 *
 * Bridges @capacitor/geolocation for Android with the existing
 * navigator.geolocation used by FieldDutyModule & DashboardSnapshot.
 *
 * Place: src/lib/services/geolocation-service.ts (in the PARENT web project)
 */

import { Geolocation } from '@capacitor/geolocation';
import { isAndroid } from './platform';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Get current position — high accuracy.
 * Used by: DashboardSnapshot pin drop, FieldDutyModule start tracking.
 */
export async function getCurrentGeoPosition(): Promise<GeoPosition> {
  if (isAndroid()) {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };
  }

  // Web fallback
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Watch position — continuous updates.
 * Used by: FieldDutyModule live tracking, LocationPinTimeline.
 * Returns a cleanup function to stop watching.
 */
export function watchGeoPosition(
  callback: (pos: GeoPosition) => void,
  onError?: (err: any) => void
): () => void {
  if (isAndroid()) {
    let watchId: string | null = null;
    Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos: any, err: any) => {
        if (err) { onError?.(err); return; }
        if (pos) {
          callback({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        }
      }
    ).then((id: string) => { watchId = id; });

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }

  // Web fallback
  const id = navigator.geolocation.watchPosition(
    (pos) => callback({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    }),
    onError,
    { enableHighAccuracy: true }
  );
  return () => navigator.geolocation.clearWatch(id);
}
