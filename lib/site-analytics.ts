/**
 * First-party website analytics — the client write path.
 *
 * WHAT THIS IS
 * ------------
 * One small module that every tracked surface calls, so the event vocabulary
 * and the payload shape live in exactly one place. It writes to
 * `public.site_events` (see supabase/migrations/20261014000000_website_analytics.sql).
 *
 * To-Let listing engagement still has its own table and per-listing semantics.
 * Route page views also include To-Let detail routes; the admin rollup keeps
 * route views separate from the session-deduplicated listing engagement panel.
 *
 * WHAT EACH EVENT MEANS — and does not
 * ------------------------------------
 *   page_view     a route was opened. Not a person, not a session.
 *   session_start the first page_view in one browser session.
 *   cta_click     a button was pressed. A press is NOT the outcome: pressing
 *                 "কল করুন" does not prove a call connected, and pressing
 *                 "সেবা নিন" does not prove a request was filed.
 *   form_submit   the database CONFIRMED the underlying row. Only ever emitted
 *                 after the insert resolves without an error.
 *
 * PRIVACY
 * -------
 *   * `visitor_id` reuses the opaque `mms_vid` id the To-Let tracker already
 *     stores, so a person is never counted twice across the two systems. It is
 *     a random UUID — never an IP, a user agent, or a fingerprint.
 *   * `session_id` is a random UUID held in `sessionStorage`; closing the tab
 *     ends the session.
 *   * `referrer_host` keeps the hostname only, stripping any path or query
 *     string that could carry a search term.
 *   * No name, phone number, message body or free text is ever sent.
 *
 * FAILURE POLICY
 * --------------
 * Writes are fire-and-forget through a same-origin server endpoint. A tracking
 * failure is logged and never blocks the visitor's action.
 */
'use client';

import { getVisitorId, hasPersistentVisitorId } from './tolet-tracking';

// Reuse the same visitor key the To-Let tracker writes, so the two systems
// agree on who is a repeat visitor. `getVisitorId()` reads it.
const SESSION_KEY = 'mms_sid';
const SESSION_STARTED_KEY = 'mms_session_started';

export type SiteEventType = 'page_view' | 'session_start' | 'cta_click' | 'form_submit';

/** Presses of a button. A press is not a completed action. */
export type CtaClickType =
  | 'get_service'
  | 'call'
  | 'whatsapp'
  | 'contact_request'
  | 'tutor_contact'
  | 'apply'
  | 'other';

/** Confirmed writes. Only emitted after the database accepted the row. */
export type FormSubmitType =
  | 'service_request'
  | 'vehicle_request'
  | 'tutor_request'
  | 'buy_sell_request'
  | 'home_moving_request'
  | 'staff_request'
  | 'contact_message';

export type RouteKind =
  | 'home'
  | 'service'
  | 'tolet'
  | 'post'
  | 'directory'
  | 'auth'
  | 'other';

// ---------------------------------------------------------------------------
// Paths we never track
// ---------------------------------------------------------------------------

/**
 * Admin screens and internal tooling are not website traffic, and auth screens
 * carry a `?next=` path that would write a user's intended destination into the
 * log. Both are excluded.
 */
function isExcludedPath(path: string): boolean {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/news/editor') ||
    path.startsWith('/api') ||
    path.startsWith('/design-system') ||
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password'
  );
}

export function shouldTrackPath(path: string): boolean {
  return Boolean(path) && path.startsWith('/') && !isExcludedPath(path);
}

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

const SERVICE_SLUGS = new Set([
  'kajer-bua',
  'electrician',
  'plumber',
  'basha-paltano',
  'ac-fridge',
]);

const DIRECTORY_ROOTS = new Set([
  'tolet',
  'news',
  'jobs',
  'buy-sell',
  'doctors',
  'doctor',
  'ambulance',
  'police',
  'fire-service',
  'fireservice',
  'emergency-call',
  'blood-donor',
  'coaching',
  'wifi',
  'gari-auto-cng',
  'services',
  'home-tutor',
  'home-moving',
  'how-it-works',
  'about',
  'contact',
  'help',
  'safety',
  'mymensingh',
]);

/**
 * Turns a pathname into the three values the admin rollup groups by. Anything
 * unrecognised becomes `other` rather than guessing, so a page never lands in
 * the wrong ranking.
 */
export function classifyPath(path: string): {
  routeKind: RouteKind;
  contentId: string | null;
  category: string | null;
} {
  if (path === '/') return { routeKind: 'home', contentId: null, category: null };

  const segments = path.split('/').filter(Boolean);
  const first = segments[0] ?? '';

  if ((first === 'news' || first === 'jobs' || first === 'buy-sell') && segments[1] === 'create') {
    return { routeKind: 'other', contentId: null, category: null };
  }
  if (first === 'tolet' && segments[1]) {
    return { routeKind: 'tolet', contentId: segments[1], category: 'tolet' };
  }
  if ((first === 'news' || first === 'jobs' || first === 'buy-sell') && segments[1]) {
    const category = first === 'buy-sell' ? 'buy_sell' : first === 'jobs' ? 'job' : 'news';
    return { routeKind: 'post', contentId: segments[1], category };
  }
  if (SERVICE_SLUGS.has(first)) {
    if (segments.length === 1) return { routeKind: 'service', contentId: first, category: first };
    return { routeKind: 'directory', contentId: segments[1] ?? first, category: first };
  }
  if (DIRECTORY_ROOTS.has(first)) {
    return { routeKind: 'directory', contentId: segments[1] ?? first, category: null };
  }
  if (first === 'profile' || first === 'dashboard') {
    return { routeKind: 'other', contentId: null, category: null };
  }
  return { routeKind: 'other', contentId: null, category: null };
}

// ---------------------------------------------------------------------------
// Identity and environment (all best-effort, all optional)
// ---------------------------------------------------------------------------

let memorySessionId: string | null = null;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `a-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    if (!memorySessionId) memorySessionId = randomId();
    return memorySessionId;
  }
}

function deviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/** Hostname only — never the full URL, which can carry a search term. */
function referrerHost(): string | null {
  try {
    const raw = document.referrer;
    if (!raw) return null;
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');
    if (!host || host === window.location.hostname) return null;
    return host.slice(0, 200);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Write path
// ---------------------------------------------------------------------------

interface EventPayload {
  eventType: SiteEventType;
  path: string;
  routeKind?: RouteKind;
  contentId?: string | null;
  category?: string | null;
  ctaType?: CtaClickType | FormSubmitType | null;
}

async function writeEvent(payload: EventPayload): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!shouldTrackPath(payload.path)) return;

  try {
    const classified = classifyPath(payload.path);
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventId: randomEventId(),
        eventType: payload.eventType,
        path: payload.path,
        routeKind: payload.routeKind ?? classified.routeKind,
        contentId: payload.contentId ?? classified.contentId,
        category: payload.category ?? classified.category,
        ctaType: payload.ctaType ?? null,
        deviceType: deviceType(),
        referrerHost: referrerHost(),
        visitorId: getVisitorId(),
        identityPersistent: hasPersistentVisitorId(),
        sessionId: getSessionId(),
      }),
    });
    if (!response.ok) {
      console.error('Website analytics event could not be recorded.', {
        eventType: payload.eventType,
        status: response.status,
      });
    }
  } catch (error) {
    console.error('Website analytics event could not be recorded.', error);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let lastActiveVisitorAt = 0;

function randomEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (digit) => {
    const value = Math.floor(Math.random() * 16);
    return (digit === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}

/**
 * Records a page view, and — once per session — a session_start carrying the
 * landing path. Called for the initial load and for every client-side
 * navigation.
 */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  if (!shouldTrackPath(path)) return;
  let firstInSession = false;
  try {
    firstInSession = !window.sessionStorage.getItem(SESSION_STARTED_KEY);
    if (firstInSession) window.sessionStorage.setItem(SESSION_STARTED_KEY, '1');
  } catch {
    firstInSession = true;
  }

  if (firstInSession) {
    void writeEvent({ eventType: 'session_start', path });
  }
  void writeEvent({ eventType: 'page_view', path });
}

/** Records a lightweight heartbeat for the opaque browser visitor id. */
export function trackActiveVisitor(path: string): void {
  if (typeof window === 'undefined' || !shouldTrackPath(path)) return;
  const now = Date.now();
  if (now - lastActiveVisitorAt < 20_000) return;
  lastActiveVisitorAt = now;

  void fetch('/api/analytics/active-visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      visitorId: getVisitorId(),
      identityPersistent: hasPersistentVisitorId(),
    }),
  }).then((response) => {
    if (!response.ok) {
      lastActiveVisitorAt = 0;
      console.error('Active visitor heartbeat could not be recorded.', response.status);
    }
  }).catch((error: unknown) => {
    lastActiveVisitorAt = 0;
    console.error('Active visitor heartbeat could not be recorded.', error);
  });
}

/** A button was pressed. Not proof the action completed. */
export function trackCtaClick(input: {
  ctaType: CtaClickType;
  path?: string;
  contentId?: string | null;
  category?: string | null;
  routeKind?: RouteKind;
}): void {
  if (typeof window === 'undefined') return;
  const path = input.path ?? window.location.pathname;
  void writeEvent({
    eventType: 'cta_click',
    path,
    routeKind: input.routeKind,
    contentId: input.contentId ?? null,
    category: input.category ?? null,
    ctaType: input.ctaType,
  });
}

/**
 * The database confirmed a form's row. Call this ONLY on the success branch of
 * a real await — never on submit, and never on an optimistic success screen.
 */
export function trackFormSubmit(input: {
  ctaType: FormSubmitType;
  path?: string;
  contentId?: string | null;
  category?: string | null;
  routeKind?: RouteKind;
}): void {
  if (typeof window === 'undefined') return;
  const path = input.path ?? window.location.pathname;
  void writeEvent({
    eventType: 'form_submit',
    path,
    routeKind: input.routeKind,
    contentId: input.contentId ?? null,
    category: input.category ?? null,
    ctaType: input.ctaType,
  });
}
