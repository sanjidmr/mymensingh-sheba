# Admin Step 11 — Website Analytics and CTA Tracking

## What this adds

Before this step the only engagement the platform stored was To-Let listing
events. There was no first-party record of website traffic — page views, unique
visitors, sessions, trends, referrers, device mix, landing pages, or the presses
of the "সেবা নিন" and other conversion buttons. `/admin/analytics` (Step 10)
could therefore describe the platform's stored records but not its audience.

This step adds a real, database-backed website analytics system end to end:

- a new append-only table `public.site_events` for site-wide events;
- a small browser write path that detects initial loads and client-side App
  Router navigation without duplicating events;
- instrumentation of the real CTAs that already exist in the codebase;
- a new admin screen `/admin/analytics/website` that reads one aggregated
  database function and shows no raw event rows.

## Data model — `public.site_events`

One row per visitor action, `event_type` in:

| event_type      | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `page_view`     | a route was opened (initial load or client-side navigation)     |
| `session_start` | the first `page_view` of one browser session (the landing page) |
| `cta_click`     | an important button was pressed                                 |
| `form_submit`   | the database CONFIRMED the underlying request row              |

Columns: `path` (pathname only), `route_kind`, `content_id`, `category`,
`cta_type`, `device_type`, `referrer_host` (hostname only), `visitor_id`,
`session_id`, `is_new_visitor`, `user_id`, `created_at`.

Deliberate choices:

- `visitor_id` reuses the existing opaque `mms_vid` key from
  `lib/tolet-tracking.ts`, so a person is never counted twice across the two
  systems. `session_id` is a separate random id held in `sessionStorage`.
- `visitor_id` / `session_id` are random UUIDs. No IP address, user-agent
  string, fingerprint, full referrer URL, name, phone number, message body, or
  free text is ever stored.
- `created_at` is stamped server-side by a `BEFORE INSERT` trigger; a
  client-supplied time is discarded, so history cannot be backdated.
- RLS: `anon` and `authenticated` may `INSERT` (a visitor may only attribute a
  row to their own `user_id`); only admins may `SELECT`. There is no `UPDATE` or
  `DELETE` policy — the log is append-only through the API.
- A `BEFORE INSERT` throttle rejects a visitor that has already written 120
  events in 60 seconds, using the `(visitor_id, created_at DESC)` index with a
  bounded `OFFSET` scan.
- Column `CHECK` constraints enforce the event/CTA vocabulary, path shape and
  length limits, and the id formats, so a forged payload cannot invent a metric
  pair the dashboard would misread.

## Aggregation — `public.get_website_analytics(...)`

A single `SECURITY DEFINER`, `STABLE`, admin-gated function returns one JSON
document (totals, daily/weekly/monthly series, top pages, landing pages, top
content, top service categories, CTA breakdown, "সেবা নিন" ranking, devices,
referrers, To-Let rollup, and confirmed requests). Aggregation happens in
Postgres; the browser never receives raw events.

Definitions kept strictly apart:

- **page view** — one `page_view` event.
- **session** — one distinct `session_id` seen in range.
- **visitor** — one distinct `visitor_id` seen in range.
- **new** — a visitor whose first-ever event falls inside the range;
  **returning** = unique visitors − new visitors.

Day boundaries use `Asia/Dhaka`, matching the dates the console prints.

To-Let figures are read from the existing `tolet_listing_events` table (never
copied into `site_events`), so the two systems cannot disagree about a listing's
buttons. `call_click` is a button press and is labelled "কল বাটন চাপা হয়েছে",
never "মোট ফোনকল". Confirmed requests are read from `service_requests` and
`vehicle_requests`, not from the click log.

## Client instrumentation

- `lib/site-analytics.ts` — the single write path. It classifies a pathname into
  `route_kind` / `content_id` / `category`, derives device type from viewport
  width and referrer host from `document.referrer`, and reuses `getVisitorId()`.
  It is fire-and-forget: a failed or unconfigured send never blocks the user.
- `components/analytics/PageViewTracker.tsx`, mounted in `app/layout.tsx`,
  records the initial load and each client-side navigation via `usePathname()`.
  A module-level guard absorbs React Strict Mode's double effect and remounts.
  `/admin`, `/api`, `/design-system` and the auth screens are excluded.
- `form_submit` is emitted **only** on the success branch of a real `await`:
  `ServiceRequestFormCard`, `VehicleServiceRequest`, `TutorRequestForm`,
  `MovingRequestWizard`, and `StaffRequestForm`.
- `cta_click` is emitted from `ServiceRequestHero` ("সেবা নিন"), `SellerCard`
  (call / WhatsApp / contact request), and `TutorCtaBar` (tutor contact).
- `createServiceRequest` in `lib/auth-context.tsx` now returns
  `{ success, error }` and only records the request after the insert succeeds;
  its three callers now surface a real failure instead of an optimistic success.

## Admin screen

`/admin/analytics/website` is linked in the Business & Analytics navigation
group. It shows the totals, today's figures, daily/weekly/monthly trends, top
pages and landing pages, top content (with To-Let rows linking to
`/admin/tolet/[id]`), top service categories, the "সেবা নিন" button ranking and
click-through rate, CTA clicks and confirmed submissions, device split,
referrers, the To-Let engagement table (rows link to the admin record), and
confirmed service/vehicle requests. Filters: date range, category, route, and
event type. Empty and error states are honest; nothing is fabricated.

## Files changed

- Added `supabase/migrations/20261014000000_website_analytics.sql`
- Added `lib/site-analytics.ts`
- Added `lib/admin/website-analytics.ts`
- Added `components/analytics/PageViewTracker.tsx`
- Added `components/service-request/ServiceHeroCta.tsx`
- Added `app/admin/analytics/website/page.tsx`
- Added `docs/ADMIN_STEP11.md`
- Updated `app/layout.tsx`, `lib/admin/nav.ts`, `lib/auth-context.tsx`
- Updated `components/service-request/ServiceRequestHero.tsx`,
  `components/service-request/ServiceRequestFormCard.tsx`,
  `app/gari-auto-cng/[slug]/VehicleServiceRequest.tsx`,
  `components/buy-sell/SellerCard.tsx`,
  `components/home-tutor/TutorRequestForm.tsx`,
  `components/home-tutor/detail/TutorCtaBar.tsx`,
  `components/home-moving/MovingRequestWizard.tsx`,
  `components/staff/StaffRequestForm.tsx`

## Verification

- `npx tsc --noEmit`: passed.
- `npx eslint` on every changed file: passed with one pre-existing `<img>`
  warning in `components/home-moving/MovingRequestWizard.tsx`.
- `npm run build`: passed; `/admin/analytics/website` compiled as a dynamic
  route.

Not verifiable in this workspace: applying the migration, running the RPC,
RLS/rate-limit behaviour, and live event persistence all require a Supabase
project. The migration was inspected but not executed against a database. There
is no test script in `package.json`.

## Limitations

- `lib/supabase/schema.sql` is a reference mirror and is not the canonical apply
  path (per `README.md`); the new objects live only in the migration.
- "New vs returning" is decided server-side: a visitor is new only when no
  earlier `site_events` row exists for them, so the count cannot be inflated by
  a forged payload.
- Device type is inferred from viewport width, which cannot distinguish a small
  laptop from a large tablet.
- No signed-in-user attribution is written for page views (user_id stays NULL),
  keeping the log anonymous by default.
- SPA hash-only changes are not treated as new page views (the App Router does
  not change `pathname` for them).
