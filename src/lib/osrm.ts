import { fieldOpsConfig } from './fieldOpsConfig';

export interface OsrmRoute {
  distanceMeters: number;
  durationSeconds: number;
  polylineCoords: [number, number][]; // [[lat, lng], ...] formatted for Leaflet
}

function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Fetches a road-following driving route and ETA between two coordinates using OSRM.
 * Falls back to direct geodesic route if OSRM service is unavailable.
 */
export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<OsrmRoute | null> {
  if (!fromLat || !fromLng || !toLat || !toLng) return null;

  try {
    const endpoint = fieldOpsConfig.osrmEndpoint.replace(/\/+$/, '');
    const url = `${endpoint}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const coordinates: [number, number][] = (primaryRoute.geometry?.coordinates || []).map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number] // [lng, lat] -> [lat, lng]
        );

        if (coordinates.length > 0) {
          return {
            distanceMeters: primaryRoute.distance || 0,
            durationSeconds: primaryRoute.duration || 0,
            polylineCoords: coordinates
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch OSRM route from server, using direct line fallback:', err);
  }

  // Graceful fallback: straight direct line with estimated road distance (+20% factor) and ~30 km/h average speed
  const dist = calculateHaversineMeters(fromLat, fromLng, toLat, toLng) * 1.2;
  return {
    distanceMeters: Math.round(dist),
    durationSeconds: Math.max(60, Math.round(dist / 8.33)), // avg 30 km/h
    polylineCoords: [
      [fromLat, fromLng],
      [toLat, toLng]
    ]
  };
}
