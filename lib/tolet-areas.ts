/**
 * To-Let-only area additions.
 *
 * =========================================================================
 * WHY THIS FILE EXISTS
 * --------------------
 * The To-Let (বাসা ভাড়া) system needs a handful of neighbourhoods that are
 * NOT part of the general Mymensingh City Corporation area list used by the
 * rest of the site (services, jobs, community posts, home moving, profiles).
 *
 * Those additions live here — and ONLY here — so they are reachable from
 * To-Let forms, filters, search and admin listing management, while every
 * other service keeps its existing, unchanged area list.
 *
 * RULES:
 * 1. Never add these to `lib/locations.ts`'s `MCC_AREAS`. That file is the
 *    site-wide source; To-Let additions must not leak into other services.
 * 2. Do not remove or rename existing To-Let areas — this list is additive.
 * 3. Ids are stable kebab-case strings stored in the database, so a display
 *    name can change without touching rows.
 * 4. Search works in Bangla AND English through the shared engine in
 *    `lib/locations.ts` (`searchAreaList`), so "Senbari" -> "সেনবাড়ি".
 * =========================================================================
 */
import {
  getAllMCCAreas,
  getAreaById,
  getPopularMCCAreas,
  isInsideMCC,
  searchAreaList,
  type AreaSource,
  type MCCArea,
} from './locations';

const SOURCE_NOTE = 'টু-লেট (বাসা ভাড়া) সেবার জন্য সংযোজিত এলাকা';

/**
 * The additional areas that are selectable in To-Let only.
 *
 * `choto-bazar` intentionally reuses the id of the retired global entry so any
 * historical To-Let row that already stored that id keeps resolving — now to a
 * proper, selectable To-Let area instead of a hidden legacy name.
 */
export const TOLET_ONLY_AREAS: MCCArea[] = [
  {
    id: 'senbari',
    nameBn: 'সেনবাড়ি',
    nameEn: 'Senbari',
    aliases: ['senbari', 'sen bari', 'shonbari', 'সেনবাড়ি', 'সেন বাড়ি'],
    prominentLandmarks: ['সেনবাড়ি মোড়'],
    popularFor: 'বাসা ভাড়ার জন্য জনপ্রিয় আবাসিক এলাকা',
    isActive: true,
    sortOrder: 1001,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'boundary-road',
    nameBn: 'বাউন্ডারি রোড',
    nameEn: 'Boundary Road',
    aliases: [
      'boundary road', 'boundary', 'boundaryroad', 'bondary road',
      'বাউন্ডারি রোড', 'বাউন্ডারি', 'বাউন্সারি রোড',
    ],
    prominentLandmarks: ['বাউন্ডারি রোড মোড়'],
    popularFor: 'মূল সড়ক সংলগ্ন ভাড়া বাসার এলাকা',
    isActive: true,
    sortOrder: 1002,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'akua-madrasa-quarter',
    nameBn: 'আকুয়া মাদ্রাসা কোয়ার্টার',
    nameEn: 'Akua Madrasa Quarter',
    aliases: [
      'akua madrasa quarter', 'akua madrasa', 'madrasa quarter', 'akua quarter',
      'আকুয়া মাদ্রাসা কোয়ার্টার', 'আকুয়া মাদ্রাসা', 'মাদ্রাসা কোয়ার্টার',
    ],
    prominentLandmarks: ['আকুয়া মাদ্রাসা'],
    popularFor: 'আকুয়ার মাদ্রাসা সংলগ্ন কোয়ার্টার এলাকা',
    isActive: true,
    sortOrder: 1003,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'hajibari',
    nameBn: 'হাজীবাড়ি',
    nameEn: 'Hajibari',
    aliases: ['hajibari', 'haji bari', 'hazibari', 'হাজীবাড়ি', 'হাজি বাড়ি'],
    prominentLandmarks: ['হাজীবাড়ি মোড়'],
    popularFor: 'শান্ত আবাসিক এলাকা, বাসা ভাড়ার জন্য উপযুক্ত',
    isActive: true,
    sortOrder: 1004,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'golpukur-par',
    nameBn: 'গোলপুকুর পাড়',
    nameEn: 'Golpukur Par',
    aliases: [
      'golpukur par', 'gol pukur par', 'golpukur', 'golpukurpar',
      'গোলপুকুর পাড়', 'গোলপুকুর', 'গোল পুকুর পাড়',
    ],
    prominentLandmarks: ['গোলপুকুর'],
    popularFor: 'পুকুরপাড় সংলগ্ন আবাসিক এলাকা',
    isActive: true,
    sortOrder: 1005,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'choto-bazar',
    nameBn: 'ছোট বাজার',
    nameEn: 'Choto Bazar',
    aliases: [
      'choto bazar', 'chhoto bazar', 'chotobazar', 'small bazar',
      'ছোট বাজার', 'ছোটবাজার',
    ],
    prominentLandmarks: ['ছোট বাজার'],
    popularFor: 'ব্যস্ত বাজার সংলগ্ন ভাড়া বাসার এলাকা',
    isActive: true,
    sortOrder: 1006,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'boro-bazar',
    nameBn: 'বড় বাজার',
    nameEn: 'Boro Bazar',
    aliases: [
      'boro bazar', 'bara bazar', 'borobazar', 'big bazar',
      'বড় বাজার', 'বড়বাজার',
    ],
    prominentLandmarks: ['বড় বাজার'],
    popularFor: 'মূল বাজার সংলগ্ন ভাড়া বাসার এলাকা',
    isActive: true,
    sortOrder: 1007,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'trishal-bus-stand',
    nameBn: 'ত্রিশাল বাস স্ট্যান্ড',
    nameEn: 'Trishal Bus Stand',
    aliases: [
      'trishal bus stand', 'trishal busstand', 'trishal', 'tri shal',
      'ত্রিশাল বাস স্ট্যান্ড', 'ত্রিশাল বাসস্ট্যান্ড', 'ত্রিশাল',
    ],
    prominentLandmarks: ['ত্রিশাল বাস স্ট্যান্ড'],
    popularFor: 'ত্রিশালগামী বাস স্ট্যান্ড সংলগ্ন এলাকা',
    isActive: true,
    sortOrder: 1008,
    sourceNote: SOURCE_NOTE,
  },
  {
    id: 'habun-byapari-mor',
    nameBn: 'হাবুন ব্যাপারী মোড়',
    nameEn: 'Habun Byapari Mor',
    aliases: [
      'habun byapari mor', 'habun byepari mor', 'habun byapari', 'habun mor', 'habun',
      'হাবুন ব্যাপারী মোড়', 'হাবুন ব্যাপারী', 'হাবুন মোড়',
    ],
    prominentLandmarks: ['হাবুন ব্যাপারী মোড়'],
    popularFor: 'মোড় সংলগ্ন আবাসিক ও বাণিজ্যিক এলাকা',
    isActive: true,
    sortOrder: 1009,
    sourceNote: SOURCE_NOTE,
  },
];

/**
 * The full selectable To-Let list: every active MCC area (unchanged) followed
 * by the To-Let-only additions. Kept as one stable array so the shared search
 * index can be cached by identity.
 */
const TOLET_ALL_AREAS: MCCArea[] = [
  ...getAllMCCAreas({ activeOnly: true }),
  ...TOLET_ONLY_AREAS,
];

/** To-Let-only ids, used to override the retired global `choto-bazar` entry. */
const TOLET_ONLY_BY_ID: Map<string, MCCArea> = new Map(
  TOLET_ONLY_AREAS.map((area) => [area.id, area])
);

/** Every selectable area in the To-Let system (existing + the 9 additions). */
export function getToletAreas(): MCCArea[] {
  return TOLET_ALL_AREAS;
}

/** Popular areas for the To-Let quick-selection chips (unchanged global set). */
export function getPopularToletAreas(): MCCArea[] {
  return getPopularMCCAreas();
}

/** Bangla/English search across the To-Let area list. */
export function searchToletAreas(query: string): MCCArea[] {
  return searchAreaList(query, TOLET_ALL_AREAS);
}

/**
 * Resolve a To-Let area id to a display area. Knows the To-Let-only additions
 * first, then falls back to the global (active + legacy) lookup so historical
 * To-Let rows with retired ids still render a name.
 */
export function getToletAreaById(id: string | null | undefined): MCCArea | undefined {
  if (!id) return undefined;
  return TOLET_ONLY_BY_ID.get(id) ?? getAreaById(id);
}

/**
 * Whether an id is selectable in To-Let: either a To-Let-only addition or a
 * currently active MCC area. Retired global ids return false.
 */
export function isValidToletArea(id: string | null | undefined): boolean {
  if (!id) return false;
  return TOLET_ONLY_BY_ID.has(id) || isInsideMCC(id);
}

/** A scoped area source that points the shared picker/filter UI at To-Let. */
export const TOLET_AREA_SOURCE: AreaSource = {
  all: () => TOLET_ALL_AREAS,
  popular: () => getPopularToletAreas(),
  search: (query) => searchToletAreas(query),
  byId: (id) => getToletAreaById(id),
};
