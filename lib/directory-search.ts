/**
 * Natural-language directory search.
 *
 * Users on a Bangladeshi local marketplace do not type keywords — they type
 * sentences: "মাসকান্দায় সাশ্রয়ী ফ্যামিলি বাসা", "৫০০০ টাকার মেস",
 * "২ রুম ব্রহ্মপুত্রের কাছে", "WiFi সহ ছাত্রদের জন্য মেস সিট".
 *
 * A naive `title.includes(query)` fails on every one of those. This module
 * turns a free-text query into weighted terms so a single search can match
 * across titles, areas, landmarks, prices, facilities and descriptions:
 *
 *  - Bangla numerals (৫০০০) are normalised to ASCII before any comparison.
 *  - Numeric phrases become `{ value, unit }` pairs, so "৫০০০ টাকা" filters by
 *    price and "২ রুম" filters by bedrooms instead of being dead text.
 *  - Light Bangla stemming strips possessive/plural suffixes (দের, গুলো, টির)
 *    so "ছাত্রদের" still matches a listing that says "ছাত্র".
 *  - Stop-words (জন্য, এর, কাছে, সাথে …) are dropped rather than searched for.
 *
 * Scoring is additive and deliberately simple: a term that appears in a
 * higher-weight field outranks the same term in a lower-weight one, so the
 * title always wins ties.
 */

// ---------------------------------------------------------------------------
// Bangla normalisation
// ---------------------------------------------------------------------------

const BANGLA_DIGIT_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/** Bangla → ASCII digits, and folds away currency signs / separators. */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    if (BANGLA_DIGIT_MAP[ch]) out += BANGLA_DIGIT_MAP[ch];
    else if (ch === '৳' || ch === ',') out += ' ';
    else out += ch;
  }
  return out;
}

export function toLatin(input: string): string {
  return normalizeDigits(input).toLowerCase();
}

/**
 * Words that carry no discriminating power. Without these, a query like
 * "ছাত্রদের জন্য" would demand a listing containing the literal word "জন্য".
 */
const STOP_WORDS = new Set([
  'এর', 'এরা', 'এই', 'ও', 'ওই', 'কোন', 'কোনো', 'জন্য', 'জন্যে', 'কাছে',
  'কাছে', 'সাথে', 'সাথেই', 'থেকে', 'দিয়ে', 'টি', 'টা', 'র', 'একটি', 'একটা',
  'আছে', 'নেই', 'দরকার', 'চাই', 'চায়', 'খুঁজুন', 'খুঁজছি', 'খুঁজতে', 'চাইছি',
  'আমার', 'আমি', 'আমাদের', 'আপনার', 'আপনি', 'থাকলে', 'থাকা', 'হবে', 'হয়েছে',
  'এবং', 'ওরা', 'সব', 'সকল', 'যেকোনো', 'যেকোনো', 'একটু', 'খুব', 'বেশি', 'কম',
  'আমি', 'দরকার', 'থাকে', 'থাকা', 'দরকারি', 'করে', 'করা', 'হবে', 'হয়',
  'for', 'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'with',
  'near', 'for', 'my', 'i', 'need', 'want', 'available',
]);

/**
 * Possessive / plural suffixes that carry no meaning for matching.
 * Order matters — longest first, so "গুলো" wins before "লো".
 */
const BANGLA_SUFFIXES = [
  'গুলোর', 'গুলো', 'গুলি', 'দের', 'টির', 'টার', 'খানার', 'খানা', 'ওরা',
  'আর', 'কে', 'তে', 'রা', 'ই', 'া', 'ি', 'ে',
];

/**
 * Light Bangla stemmer. Removes a single trailing suffix so that
 * "ছাত্রদের" → "ছাত্র" and "বাসাগুলো" → "বাসা". This is a suffix stripper,
 * not a full morphology engine — deliberately conservative, because
 * over-stemming ("রান্না" → "রান্ন") creates false matches.
 */
export function stemBangla(word: string): string {
  if (word.length <= 3) return word;
  for (const suffix of BANGLA_SUFFIXES) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Tokenise a query or a searchable field into comparable terms. */
export function tokenize(input: string): string[] {
  return toLatin(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((t) => stemBangla(t))
    .filter((t) => t.length > 0);
}

// ---------------------------------------------------------------------------
// Query parsing — numeric phrases become real filters
// ---------------------------------------------------------------------------

export type QueryUnit = 'money' | 'count';

export interface QueryTerm {
  /** The original text fragment. */
  raw: string;
  /** Normalised searchable text (may be empty for pure-numeric terms). */
  text: string;
  /** Numeric value if the fragment contained a number. */
  value?: number;
  /** What the number refers to. */
  unit?: QueryUnit;
}

const MONEY_WORDS = [
  'টাকা', 'টাকার', 'টা', '৳', 'taka', 'tk', 'taka', 'bdt', 'rupees',
];
const COUNT_WORDS = [
  'রুম', 'room', 'rooms', 'bed', 'beds', 'bedroom', 'bedrooms', 'তলা',
  'floor', 'বাথ', 'bath', 'জন', 'person', 'people', 'seat', 'সিট', 'বছর', 'year',
];

/** "১০ হাজার" / "10k" / "1.5k" → a single number. */
function parseNumberWithScale(raw: string): number | undefined {
  const cleaned = raw.replace(/[০-৯]/g, (d) => BANGLA_DIGIT_MAP[d]).replace(/,/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return undefined;
  const tail = cleaned.slice(match.index! + match[1].length).trim();
  if (/^k$/i.test(tail)) return value * 1000;
  if (/^hazar$/i.test(tail) || /^হাজার/.test(tail)) return value * 1000;
  if (/^lakh$/i.test(tail) || /^লক্ষ/.test(tail)) return value * 100000;
  return value;
}

/**
 * Parse a raw user query into weighted terms.
 *
 * A fragment like "৫০০০ টাকা" yields a single money term (value 5000) rather than
 * three dead tokens, which is what lets a budget constraint work.
 */
export function parseQuery(query: string): QueryTerm[] {
  const terms: QueryTerm[] = [];
  const normalized = toLatin(query);
  if (!normalized.trim()) return terms;

  // Split into fragments that each look like "<number> <unit>" or a bare word.
  const fragments = normalized.split(/[,\n;]+|\s+থেকে\s+|\s+এবং\s+|\s+ও\s+/);

  for (const fragment of fragments) {
    const trimmed = fragment.trim();
    if (!trimmed) continue;

    const hasNumber = /[০-৯0-9]/.test(trimmed);
    if (hasNumber) {
      const value = parseNumberWithScale(trimmed);
      if (value !== undefined) {
        const unitWords = MONEY_WORDS.some((w) => trimmed.includes(w))
          ? ('money' as QueryUnit)
          : COUNT_WORDS.some((w) => trimmed.includes(w))
            ? ('count' as QueryUnit)
            : undefined;

        // Keep the remaining text as a searchable term too, so
        // "৫০০০ মেস" filters by price AND matches "মেস" in the title.
        const leftover = tokenize(trimmed).filter(
          (t) => !/^\d+(\.\d+)?[kখাজার]*$/.test(t) && t.length > 1
        );

        terms.push({ raw: trimmed, text: '', value, unit: unitWords });
        for (const text of leftover) {
          if (!STOP_WORDS.has(text)) terms.push({ raw: text, text });
        }
        continue;
      }
    }

    for (const text of tokenize(trimmed)) {
      if (STOP_WORDS.has(text)) continue;
      terms.push({ raw: text, text });
    }
  }

  return terms;
}

// ---------------------------------------------------------------------------
// Searchable record shape & scoring
// ---------------------------------------------------------------------------

/**
 * A directory record projected into the fields the engine can search.
 * Higher weight = stronger signal. Weights mirror how much a user would
 * expect that field to matter (title beats a passing mention in a description).
 */
export interface SearchableFields {
  title: string;
  subtitle?: string;
  area?: string;
  address?: string;
  priceText?: string;
  tags?: string[];
  description?: string;
  /**
   * Numbers that describe the record: rent, bedrooms, count of items, etc.
   * A "count" query term matches any of these; a "money" term matches the
   * first one, which callers should set to the primary price.
   */
  numbers?: number[];
}

const FIELD_WEIGHTS: Array<{ key: keyof SearchableFields; weight: number }> = [
  { key: 'title', weight: 10 },
  { key: 'subtitle', weight: 6 },
  { key: 'area', weight: 7 },
  { key: 'address', weight: 5 },
  { key: 'priceText', weight: 6 },
  { key: 'tags', weight: 5 },
  { key: 'description', weight: 2 },
];

export interface SearchOptions {
  /**
   * When a money term is present, drop records whose primary price is outside
   * this ratio of the requested amount. Off by default because "৫০০০ টাকা"
   * usually means "around 5000", not "strictly ≤ 5000".
   */
  enforceBudget?: boolean;
  /** Tolerance multiplier for `enforceBudget`. Default 1.5. */
  budgetTolerance?: number;
}

/** A scored, sorted result. */
export interface ScoredResult<T> {
  item: T;
  score: number;
}

/**
 * Score one record against parsed terms. Returns 0 when nothing matched, so
 * callers can filter on `score > 0` to get a real "no results" state.
 */
function scoreRecord(
  fields: SearchableFields,
  terms: QueryTerm[],
  options: SearchOptions
): number {
  if (terms.length === 0) return 1;

  // Pre-tokenise every searchable field once, then reuse across terms.
  const tokenised: Record<string, string[]> = {};
  for (const { key } of FIELD_WEIGHTS) {
    const value = fields[key];
    if (!value) continue;
    if (key === 'tags') {
      tokenised[key] = (value as string[]).flatMap((t) => tokenize(t));
    } else {
      tokenised[key] = tokenize(value as string);
    }
  }

  let score = 0;
  const numbers = fields.numbers ?? [];

  for (const term of terms) {
    if (term.text) {
      let best = 0;
      for (const { key, weight } of FIELD_WEIGHTS) {
        const fieldTokens = tokenised[key];
        if (!fieldTokens) continue;
        const matches = fieldTokens.filter((t) => t === term.text).length;
        const contains = fieldTokens.some((t) => t.includes(term.text));
        if (matches > 0) best = Math.max(best, weight * (1 + Math.log2(matches)));
        else if (contains) best = Math.max(best, weight * 0.5);
      }
      if (best === 0) return 0; // every text term must match somewhere
      score += best;
      continue;
    }

    if (term.value === undefined) return 0;

    if (term.unit === 'count') {
      // A count term ("২ রুম") matches if the record has that exact count, or
      // if it has "4+" and the user asked for 2.
      const wanted = term.value;
      if (numbers.some((n) => n === wanted)) {
        score += 9;
      } else if (numbers.some((n) => n >= wanted && Number.isInteger(n))) {
        score += 5;
      } else {
        return 0;
      }
      continue;
    }

    // Money term. Without an explicit budget constraint, a price match is a
    // bonus rather than a filter — a user typing "৫০০০ টাকা" still expects to
    // see a 4500 taka flat ranked first, not an empty page.
    const primary = numbers[0];
    const requested = term.value;
    if (primary !== undefined && requested !== undefined) {
      const tolerance = options.budgetTolerance ?? 1.5;
      if (options.enforceBudget) {
        if (primary > requested * tolerance) return 0;
        score += 8;
      } else {
        const ratio = primary / requested;
        if (ratio >= 0.7 && ratio <= 1.4) score += 8;
        else if (ratio >= 0.4 && ratio <= 2.2) score += 3;
      }
    }
  }

  return score;
}

/**
 * Search a list of records, returning only genuine matches sorted by relevance.
 * An empty query returns everything in its original order (score 1 each).
 */
export function searchDirectory<T>(
  items: T[],
  query: string,
  project: (item: T) => SearchableFields,
  options: SearchOptions = {}
): T[] {
  const terms = parseQuery(query);
  if (terms.length === 0) return items;

  const scored: ScoredResult<T>[] = [];
  for (const item of items) {
    const score = scoreRecord(project(item), terms, options);
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

/**
 * Suggest a filter value from the query — used to show "আপনি বুঝতে চাচ্ছেন…"
 * chips so the user can see (and correct) how their sentence was interpreted.
 */
export function extractBudgetHint(query: string): number | undefined {
  const term = parseQuery(query).find((t) => t.unit === 'money' && t.value !== undefined);
  return term?.value;
}

export function extractCountHint(query: string): number | undefined {
  const term = parseQuery(query).find((t) => t.unit === 'count' && t.value !== undefined);
  return term?.value;
}
