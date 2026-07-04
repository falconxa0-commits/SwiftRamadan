// Google Maps — Location services, geocoding, routing, distance matrix
// Docs: https://developers.google.com/maps/documentation

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const NEXT_PUBLIC_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

export function getMapsApiKey(): string {
  return NEXT_PUBLIC_MAPS_KEY || GOOGLE_MAPS_API_KEY;
}

export function isMapsConfigured(): boolean {
  return !!(NEXT_PUBLIC_MAPS_KEY || GOOGLE_MAPS_API_KEY);
}

// ─── Geocoding ───
export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  area: string;
  city: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] Geocoding skipped: GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${MAPS_BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&region=ng&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components: any[] = result.address_components || [];
      const area = components.find((c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'));
      const city = components.find((c: any) => c.types.includes('locality'));

      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        area: area?.long_name || '',
        city: city?.long_name || 'Lagos',
      };
    }
    return null;
  } catch (error) {
    console.error('[Maps] Geocoding error:', error);
    return null;
  }
}

// ─── Reverse Geocoding ───
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] Reverse geocoding skipped: GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${MAPS_BASE_URL}/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components: any[] = result.address_components || [];
      const area = components.find((c: any) => c.types.includes('sublocality'));
      const city = components.find((c: any) => c.types.includes('locality'));

      return {
        lat,
        lng,
        formattedAddress: result.formatted_address,
        area: area?.long_name || '',
        city: city?.long_name || 'Lagos',
      };
    }
    return null;
  } catch (error) {
    console.error('[Maps] Reverse geocoding error:', error);
    return null;
  }
}

// ─── Distance Matrix ───
export interface DistanceResult {
  distance: { text: string; value: number }; // value in meters
  duration: { text: string; value: number }; // value in seconds
}

export async function getDistanceMatrix(
  origins: string, // "lat,lng" or address
  destinations: string, // "lat,lng" or address
): Promise<DistanceResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] Distance matrix skipped: GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${MAPS_BASE_URL}/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=metric&region=ng&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.rows && data.rows[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance,
        duration: element.duration,
      };
    }
    return null;
  } catch (error) {
    console.error('[Maps] Distance matrix error:', error);
    return null;
  }
}

// ─── Directions ───
export interface DirectionsStep {
  instruction: string;
  distance: string;
  duration: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export interface DirectionsResult {
  distance: string;
  duration: string;
  steps: DirectionsStep[];
  polyline: string; // encoded polyline for map rendering
}

export async function getDirections(
  origin: string,
  destination: string,
): Promise<DirectionsResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] Directions skipped: GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${MAPS_BASE_URL}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&region=ng&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
          distance: step.distance.text,
          duration: step.duration.text,
          startLocation: step.start_location,
          endLocation: step.end_location,
        })),
        polyline: route.overview_polyline?.points || '',
      };
    }
    return null;
  } catch (error) {
    console.error('[Maps] Directions error:', error);
    return null;
  }
}

// ─── Nearby Search (for Iftar Radar) ───
export interface NearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  types: string[];
  openNow: boolean;
}

export async function searchNearbyPlaces({
  lat,
  lng,
  radius = 3000,
  type = 'restaurant',
  keyword,
}: {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
  keyword?: string;
}): Promise<NearbyPlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] Nearby search skipped: GOOGLE_MAPS_API_KEY not configured');
    return [];
  }

  try {
    let url = `${MAPS_BASE_URL}/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.results) {
      return data.results.slice(0, 10).map((place: any) => ({
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating || 0,
        types: place.types || [],
        openNow: place.opening_hours?.open_now || false,
      }));
    }
    return [];
  } catch (error) {
    console.error('[Maps] Nearby search error:', error);
    return [];
  }
}
