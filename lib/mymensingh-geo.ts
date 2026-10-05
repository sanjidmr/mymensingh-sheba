/**
 * Mymensingh City Corporation — coarse public coordinates.
 *
 * Why this file exists
 * --------------------
 * `lib/locations.ts` is the authoritative, gazette-sourced list of the 33 MCC
 * wards and their areas, but it deliberately carries no geometry: it is a
 * filter/label system, not a geo index. The listing detail page needs exactly
 * one thing from geography — a human-readable "where is this" map — and that
 * only needs an area centroid, not a polygon.
 *
 * So this file adds the minimum: a centroid per area id, plus the two map
 * URL builders the UI uses. Values are approximate neighbourhood centroids,
 * rounded to ~4 decimal places (≈11 m), which is far finer than the precision
 * a listing address is ever published at. Nothing here is private data, and no
 * listing stores a precise pin: the map marker represents an AREA, never a
 * specific house, which is what keeps a tenant's address from leaking through
 * a screenshot.
 *
 * Areas missing from this map (new ones added later, or areas without a
 * curated centroid) fall back to `MCC_CITY_CENTER`, so the map section always
 * renders instead of collapsing to an empty box.
 */

/** Approximate centre of Mymensingh city / the old Town Hall crossroads. */
export const MCC_CITY_CENTER = { lat: 24.7539, lng: 90.4073 } as const;

export interface MymensinghCoordinate {
  lat: number;
  lng: number;
}

const AREA_COORDINATES: Record<string, MymensinghCoordinate> = {
  // Ward 01–04
  khagdahar: { lat: 24.7431, lng: 90.3942 },
  'baghmara-kda': { lat: 24.7442, lng: 90.4042 },
  baghmara: { lat: 24.7429, lng: 90.4036 },
  krishtopur: { lat: 24.7415, lng: 90.4061 },
  nawmahal: { lat: 24.7568, lng: 90.3946 },
  akua: { lat: 24.7618, lng: 90.3995 },
  'akua-moralpara': { lat: 24.7588, lng: 90.4046 },
  // Ward 08–11 (city core)
  'natun-bazar': { lat: 24.7447, lng: 90.4096 },
  'choto-bazar': { lat: 24.7498, lng: 90.4112 },
  dhopakhola: { lat: 24.7519, lng: 90.4128 },
  balashpur: { lat: 24.7539, lng: 90.4142 },
  'town-hall': { lat: 24.7507, lng: 90.4059 },
  panditpara: { lat: 24.7489, lng: 90.4046 },
  ganginarpar: { lat: 24.7555, lng: 90.4103 },
  kachijhuli: { lat: 24.7496, lng: 90.3985 },
  'nayapara-kachijhuli': { lat: 24.7523, lng: 90.3952 },
  // Ward 13–14 (student belt + medical)
  sankipara: { lat: 24.7467, lng: 90.3946 },
  brahmapalli: { lat: 24.7408, lng: 90.393 },
  charpara: { lat: 24.7606, lng: 90.4075 },
  sehara: { lat: 24.7598, lng: 90.4121 },
  bhatikashor: { lat: 24.7621, lng: 90.421 },
  // Ward 15–16
  'shambhuganj': { lat: 24.7669, lng: 90.4102 },
  maskanda: { lat: 24.7716, lng: 90.4154 },
  kewatkhali: { lat: 24.7573, lng: 90.4187 },
  boyra: { lat: 24.7642, lng: 90.4249 },
};

/** Centroid for an MCC area id, falling back to the city centre. */
export function getAreaCoordinate(areaId: string | null | undefined): MymensinghCoordinate {
  if (!areaId) return MCC_CITY_CENTER;
  return AREA_COORDINATES[areaId] ?? MCC_CITY_CENTER;
}

/** True when we actually have a curated centroid rather than the fallback. */
export function hasAreaCoordinate(areaId: string | null | undefined): boolean {
  return Boolean(areaId && AREA_COORDINATES[areaId]);
}

/**
 * Zoom span (in degrees) used to frame the map around a point. ~0.006° is
 * roughly one neighbourhood — close enough to recognise the area, far enough
 * that the exact lane is not implied.
 */
const MAP_SPAN_DEG = 0.006;

function toFixed6(value: number): string {
  return value.toFixed(6);
}

/** `minLat,minLng,maxLat,maxLng` — the bbox format OSM's embed expects. */
export function buildMapBbox(coord: MymensinghCoordinate): string {
  const { lat, lng } = coord;
  return [
    toFixed6(lat - MAP_SPAN_DEG),
    toFixed6(lng - MAP_SPAN_DEG),
    toFixed6(lat + MAP_SPAN_DEG),
    toFixed6(lng + MAP_SPAN_DEG),
  ].join(',');
}

/**
 * A key-free OpenStreetMap embed. Deliberately not Google Maps: the Google
 * Embed API needs a billing-enabled key, and an <iframe> to a third party is
 * only created once the visitor taps "মানচিত্র দেখুন", so nothing about the
 * visitor's location leaves the page before they ask for it.
 */
export function buildOsmEmbedUrl(coord: MymensinghCoordinate): string {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${buildMapBbox(
    coord
  )}&layer=mapnik&marker=${toFixed6(coord.lat)}%2C${toFixed6(coord.lng)}`;
}

/** Directions search link — opens in any map app, no key, no SDK. */
export function buildGoogleMapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}