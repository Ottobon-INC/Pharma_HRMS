import { useState, useEffect, useRef } from 'react';
import { fieldOpsConfig } from '../lib/fieldOpsConfig';

export interface NominatimPlace {
  placeId: number;
  displayName: string;
  name: string;
  suburbOrDistrict?: string;
  cityOrState?: string;
  lat: number;
  lng: number;
  googlePlaceId?: string; // set for Google results, used to resolve coords on selection
}

const GOOGLE_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// ─── Google Places Autocomplete — pure fetch, no SDK ─────────────────────
// Uses the (New) Places API v1 over plain HTTP POST

async function fetchGoogleSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<NominatimPlace[]> {
  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY!,
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ['in'],
        }),
      }
    );

    if (!res.ok) {
      console.warn('Google Places autocomplete failed:', res.status);
      return [];
    }

    const data = await res.json();
    const suggestions = data.suggestions ?? [];

    return suggestions
      .filter((s: any) => s.placePrediction)
      .slice(0, 8)
      .map((s: any, idx: number) => {
        const pred = s.placePrediction;
        const mainText = pred.structuredFormat?.mainText?.text ?? pred.text?.text ?? '';
        const secondaryText = pred.structuredFormat?.secondaryText?.text ?? '';

        return {
          placeId: idx + Date.now(),
          displayName: pred.text?.text ?? mainText,
          name: mainText,
          suburbOrDistrict: secondaryText.split(',')[0]?.trim(),
          cityOrState: secondaryText.split(',').slice(-2, -1)[0]?.trim(),
          lat: 0,
          lng: 0,
          googlePlaceId: pred.placeId,
        } as NominatimPlace;
      });
  } catch (err: any) {
    if (err.name !== 'AbortError') console.warn('Google Places error:', err);
    return [];
  }
}

// ─── Resolve coordinates for ONE selected Google place ────────────────────
// Uses Geocoding API via plain fetch — no SDK

export async function resolveGooglePlaceCoords(
  googlePlaceId: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(googlePlaceId)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

// ─── Direct geocode by address text (for Enter key) ───────────────────────

export async function searchNominatimDirect(query: string): Promise<NominatimPlace | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&components=country:IN&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.[0]) {
          const r = data.results[0];
          const loc = r.geometry.location;
          return {
            placeId: Date.now(),
            displayName: r.formatted_address,
            name: r.formatted_address.split(',')[0],
            lat: loc.lat,
            lng: loc.lng,
          };
        }
      }
    } catch {
      // fall through to Nominatim
    }
  }

  // Nominatim fallback
  try {
    const endpoint = fieldOpsConfig.nominatimEndpoint.replace(/\/+$/, '');
    const url = `${endpoint}/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    const item = data[0];
    return {
      placeId: item.place_id,
      displayName: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  } catch {
    return null;
  }
}

// ─── Nominatim fallback autocomplete ──────────────────────────────────────

async function fetchNominatimSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<NominatimPlace[]> {
  try {
    const endpoint = fieldOpsConfig.nominatimEndpoint.replace(/\/+$/, '');
    const url = `${endpoint}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&countrycodes=in&viewbox=76.0,8.0,88.0,37.0&bounded=0`;
    const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map((item: any) => {
      const addr = item.address || {};
      return {
        placeId: item.place_id,
        displayName: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        suburbOrDistrict: addr.suburb || addr.neighbourhood || addr.county,
        cityOrState: addr.city || addr.town || addr.village || addr.state,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      } as NominatimPlace;
    });
  } catch {
    return [];
  }
}

// ─── Main Hook ─────────────────────────────────────────────────────────────

export function useNominatimSearch(query: string) {
  const [suggestions, setSuggestions] = useState<NominatimPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const results = GOOGLE_API_KEY
          ? await fetchGoogleSuggestions(trimmed, controller.signal)
          : await fetchNominatimSuggestions(trimmed, controller.signal);

        if (!controller.signal.aborted) setSuggestions(results);
      } catch (err: any) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setError(err.message || 'Search failed');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return { suggestions, loading, error, clearSuggestions: () => setSuggestions([]) };
}
