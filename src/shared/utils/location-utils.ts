export function getPosition(enableHighAccuracy: boolean, timeout: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout,
      maximumAge: 60000,
      enableHighAccuracy,
    });
  });
}

export async function getReverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';
      const suburb = data.address.suburb || data.address.neighbourhood || '';
      return [suburb, city, state].filter(Boolean).join(', ');
    }
  } catch {
    // Ignore fetch errors / timeouts
  }
  return undefined;
}

export async function getCurrentLocationSafe(): Promise<{ latitude?: number; longitude?: number; address?: string; error?: string }> {
  try {
    let position: GeolocationPosition | null = null;
    try {
      position = await getPosition(false, 5000);
    } catch {
      position = await getPosition(true, 10000);
    }

    const { latitude, longitude } = position.coords;
    const address = await getReverseGeocode(latitude, longitude);

    return { latitude, longitude, address: address || "Location details unavailable" };
  } catch (err: any) {
    console.warn("Could not get location:", err);
    let errMsg = "Could not get your GPS location. Please enable location services and try again.";
    if (err?.code === 1) errMsg = "Location access denied. Please allow Location permissions.";
    if (err?.code === 2) errMsg = "Your GPS is turned off. Please enable it in your settings.";
    if (err?.code === 3) errMsg = "Location request timed out. Please move to an open area.";
    return { error: errMsg };
  }
}
