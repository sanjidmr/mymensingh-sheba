export interface VehicleRouteEstimate {
  distanceKm: number;
  pickupResolved: string;
  destinationResolved: string;
  provider: 'OpenStreetMap / OSRM';
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{ distance: number }>;
}

async function geocode(place: string): Promise<GeocodeResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'bd');
  url.searchParams.set('q', place);
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'bn,en',
      'User-Agent': 'MymensinghSheba/1.0 (https://mymensinghsheba.com/)',
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('স্থান খোঁজার সেবা এখন সাড়া দিচ্ছে না। পরে চেষ্টা করুন।');
  const results = await response.json() as GeocodeResult[];
  const result = results[0];
  if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lon))) {
    throw new Error(`“${place}” নির্ভরযোগ্যভাবে খুঁজে পাওয়া যায়নি। ঠিকানা আরও নির্দিষ্ট করে আবার চেষ্টা করুন।`);
  }
  return result;
}

export async function calculateVehicleRoute(
  pickup: string,
  destination: string
): Promise<VehicleRouteEstimate> {
  const normalizedPickup = pickup.trim();
  const normalizedDestination = destination.trim();
  if (
    normalizedPickup.length < 2 || normalizedPickup.length > 160
    || normalizedDestination.length < 2 || normalizedDestination.length > 160
    || normalizedPickup.toLocaleLowerCase() === normalizedDestination.toLocaleLowerCase()
  ) {
    throw new Error('পিকআপ ও গন্তব্যের দুটি আলাদা, পূর্ণ ঠিকানা লিখুন।');
  }

  const origin = await geocode(normalizedPickup);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const target = await geocode(normalizedDestination);
  const routeUrl = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${target.lon},${target.lat}`
  );
  routeUrl.searchParams.set('overview', 'false');
  routeUrl.searchParams.set('alternatives', 'false');
  routeUrl.searchParams.set('steps', 'false');
  const response = await fetch(routeUrl, {
    headers: { 'User-Agent': 'MymensinghSheba/1.0 (https://mymensinghsheba.com/)' },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('সড়কপথের দূরত্ব সেবা এখন সাড়া দিচ্ছে না। আবার চেষ্টা করুন বা ম্যানুয়াল দূরত্ব দিন।');
  const result = await response.json() as OsrmRouteResponse;
  const meters = result.routes?.[0]?.distance;
  if (result.code !== 'Ok' || typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) {
    throw new Error('এই দুই স্থানের নির্ভরযোগ্য সড়কপথ পাওয়া যায়নি। আবার চেষ্টা করুন বা ম্যানুয়াল দূরত্ব দিন।');
  }
  const distanceKm = Math.round((meters / 1000) * 100) / 100;
  if (distanceKm < 0.1 || distanceKm > 3000) {
    throw new Error('রুটের দূরত্ব গ্রহণযোগ্য সীমার বাইরে। ঠিকানা যাচাই করুন অথবা ম্যানুয়াল দূরত্ব দিন।');
  }
  return {
    distanceKm,
    pickupResolved: origin.display_name,
    destinationResolved: target.display_name,
    provider: 'OpenStreetMap / OSRM',
  };
}
