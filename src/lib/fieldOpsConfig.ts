// Centralized configuration for Field Operations & Live Tracking
// Reads from Vite environment variables with sensible defaults

export interface FieldOpsConfig {
  tileUrl: string;
  tileAttribution: string;
  tileSubdomains: string[];
  defaultCenter: [number, number];
  defaultZoom: number;
  osrmEndpoint: string;
  broadcastIntervalMs: number;
  nominatimEndpoint: string;
  nominatimCountryCodes: string;
}

export const fieldOpsConfig: FieldOpsConfig = {

  // OpenStreetMap standard clean tiles (No watermark, No API key required)
  tileUrl: (import.meta as any).env.VITE_MAP_TILE_URL ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  tileAttribution: (import.meta as any).env.VITE_MAP_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  tileSubdomains: ['a', 'b', 'c'],

  // Default center coordinates [lat, lng]
  defaultCenter: [
    parseFloat((import.meta as any).env.VITE_MAP_DEFAULT_LAT || '17.6868'),
    parseFloat((import.meta as any).env.VITE_MAP_DEFAULT_LNG || '83.2185')
  ],

  defaultZoom: parseInt((import.meta as any).env.VITE_MAP_DEFAULT_ZOOM || '13', 10),

  // OSRM Routing Endpoint (Public demo server - strictly PoC only, self-host before production load)
  osrmEndpoint: (import.meta as any).env.VITE_OSRM_ENDPOINT ||
    'https://router.project-osrm.org',

  // Broadcast interval in milliseconds (default: 10 seconds)
  broadcastIntervalMs: parseInt((import.meta as any).env.VITE_LIVE_BROADCAST_INTERVAL_MS || '10000', 10),

  // Nominatim Address Search / Forward Geocoding Endpoint
  nominatimEndpoint: (import.meta as any).env.VITE_NOMINATIM_ENDPOINT ||
    'https://nominatim.openstreetmap.org',

  // Country code filter for address search (comma separated ISO 3166-1 alpha-2, e.g. 'in')
  nominatimCountryCodes: (import.meta as any).env.VITE_NOMINATIM_COUNTRY_CODES || 'in',
};

