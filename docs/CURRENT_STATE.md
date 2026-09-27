# Mymensingh Sheba — Current State

**Date:** 2026-09-27
**Stage:** Foundation audit + stabilization (Steps 1–4) + **complete To-Let system** (Step 5 for To-Let only) + **complete Admin-managed staff services** (কাজের বুয়া / Electrician / Plumber, Step 5) + **complete Admin-managed Home Moving** (বাসা পাল্টানো, Step 5) + **complete Home Tutor (গৃহশिक्षক)** (Step 8) + **complete Blood Donor (রক্তদাতা)** (Step 9) + **FINAL PRODUCTION READINESS** (Step 18 — Admin console, notifications, user management, reports/reviews, settings, security hardening).
**Branch/Source of truth:** `lib/supabase/schema.sql`, `lib/auth-context.tsx`, `lib/staff-service.ts`, `lib/tolet-service.ts`, `lib/home-moving-service.ts`, `lib/home-tutor-service.ts`, `lib/blood-donor-service.ts`, `lib/admin-service.ts`, `lib/notification-service.ts`, `app/`.

---

## 1. What this project is

Mymensingh Sheba is a Bangladeshi local-services platform for Mymensingh City
Corporation (MCC). It organizes To-let, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার,
Home Moving, Home Tutor, and Blood Donor services under one city-scoped
marketplace. This repository currently contains the application foundation:

- Product-branded Next.js app (no AI-Studio boilerplate remains)
- Centralized MCC locations dataset (`lib/locations.ts`)
- Auth model + Supabase schema/RLS (deployable)
- UI component library + design-system showcase (dev-only)
- Public directory/listing pages wired to sample data
- Placeholder detail/request flows for every service (Step 5 slots)

## 2. Tech stack & scripts

| Tool | Version |
| --- | --- |
| Next.js (App Router, `output: 'standalone'`) | 15.4.9 |
| React | 19.2.1 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.1.11 |
| Supabase (`@supabase/ssr`, `supabase-js`) | 0.12.7 / 2.116.0 |

Scripts: `dev`, `build`, `start`, `lint`. Type-check with `npx tsc --noEmit`.
Package manager: **npm** (Node >= 20). `bun.lock` was removed.

> note: React 19 compatible — styling is plain utility classes + `components/ui/*`
> primitives; no component library dependency was added.

## 3. Auth model (honest, no demo personas)

`lib/auth-context.tsx` exposes a single `AuthProvider` used by the whole app.

- One account per person: `profiles` (core) + optional `tolet_profiles`,
  `home_tutor_profiles`, `blood_donor_profiles`, `service_requests`,
  `saved_items` in Supabase.
- **Visitors start logged out.** No auto-login, no demo personas, no faked
  admin/customer/সেবা প্রদানকারী switcher (removed from login + profile).
- When **Supabase is not configured** (`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`
  missing):
  - `login`, `sendOtp`/`verifyOtp`, `register`, `resetPassword` return the
    honest error `লগইন ও রেজিস্ট্রেশন পরিষেবা এখনো চালু হয়নি…`
  - Login page shows an amber banner; forgot-password/register surface the
    error inline.
- When configured, flows use real Supabase Auth: `signInWithPassword`,
  `signInWithOtp` + `verifyOtp` (sms), `signUp` (+ `profiles` upsert),
  `resetPasswordForEmail`, `signOut`, and `refreshUserData` pulls all profile
  extensions. Sessions are restored on mount (`getSession` +
  `onAuthStateChange`).
- **Admin role is only achievable via DB** (`profiles.role='admin'`). The admin
  console is hidden behind a client-side guard using `isAdmin`.
- Service-profile activation **never self-approves**: DB status is forced to
  `pending_approval` (DB trigger also blocks non-admin `approved`/`suspended`).

## 4. Route map

| Route | Status |
| --- | --- |
| `/` home (hero, categories, previews, trust) | Real |
| `/tolet` | **Real (complete)** — directory listing with filters |
| `/tolet/[id]` | **Real** — full listing detail, gallery, request, report |
| `/profile/tolet`, `/profile/tolet/new`, `/profile/tolet/[id]/edit` | **Real** — owner dashboard, wizard create/edit |
| `/profile/requests` | **Real** — merged customer requests incl. tolet |
| `/admin/tolet`, `/admin/tolet/[id]`, `/admin/tolet/[id]/edit` | **Real** — moderation, review, fee config |
| `/home-tutor`, `/blood-donor` | `/home-tutor` directory + `/home-tutor/[id]` and `/blood-donor` directory + `/blood-donor/[id]` are **Real (complete)** |
| `/home-moving` | **Real (complete)** — Admin-managed Home Moving; CTA + 7-step mobile-first request wizard (From → To → Date/Time → Items → House → Extra/Photos → Contact/Submit). `/home-moving/[id]` redirects here (legacy package page removed) |
| `/kajer-bua`, `/electrician`, `/plumber`, `/plumbing` (+ `[id]`) | **Real (complete)** — Admin-managed staff services; `/plumbing` is an alias redirect to `/plumber` |
| `/services` | Service request form (stores to Supabase when configured, else honest "not configured" error) |
| `/login`, `/register`, `/forgot-password` | Real auth flows (honest errors when unconfigured) |
| `/profile` + subroutes | Gated by login; tabular dashboard; setup/edit flows force `pending_approval` |
| `/profile/requests`, `/profile/saved`, `/profile/notifications` | Read from DB via context; `/profile/requests` renders staff + home-moving + home-tutor + tolet + blood-donation requests |
| `/admin/*` | Gated to `isAdmin`; `/admin/tolet*`, `/admin/services*`, `/admin/requests` (+ `[id]`), `/admin/verifications`, `/admin/blood` (+ `[id]`) real workflows; `/admin/home-moving` redirects to `/admin/requests`; `/admin/kajer-bua` + `/admin/electrician` are legacy placeholders |
| `/design-system` | **Dev-only** (404 in production via `NODE_ENV` check) |
| `/about`, `/help`, `/safety`, `/contact` | Static content |

## 5. Demo data & placeholders (conscious)

- Public directory pages for the pre-milestone state listed sample data
  (`ids tl-101..tl-106`, etc. in `lib/services-data.ts`). This was intentional
  scaffolding; every implemented service (staff, home-moving, home-tutor, tolet,
  blood-donor) now runs on its real facade over the DB with a mock store when
  Supabase is not configured.
- **To-Let is not sample-data-driven anymore.** It runs on
  `lib/tolet-service.ts` over `tolet_listings`/`tolet_requests`/`listing_reports`
  with a full in-memory mock store (`lib/tolet-service-mock.ts`) whenever
  Supabase is not configured. Mock rows seed owners as `নমুনা মালিক` with
  `isVerified=false` — no fake verification or statistics anywhere.
- `RoutePlaceholderShell` fallback text is user-facing (no "Step 1…" dev speak).
- Emojis and English/dev labels removed from public UI.

## 6. To-Let system (complete)

- **Domain** (`lib/tolet-types.ts`): 8 property types (flat/room/sublet/family/
  bachelor/mess/hostel/seat) with Bangla labels + `isMessLike` groups; listing
  statuses draft/pending_review/approved/rejected/unavailable/suspended/
  archived; customer request statuses submitted/contacted/completed/cancelled;
  report statuses open/resolved/dismissed.
- **Fee engine** (`lib/tolet-fees.ts`, single source of truth): mess/hostel/seat
  ৳50; rent ≤10k ৳100; 10k–20k ৳200; >20k ৳400. Admin-overridable and
  persisted to `platform_settings` (`tolet_fee_rules`) via
  `loadToletFeeRules()`/`saveToletFeeRules()`. `services-data.ts` re-exports for
  backward compatibility; `SAMPLE_TOLET_LISTINGS` type is now
  `SampleToletListing`.
- **Data layer** (`lib/tolet-service.ts` + mock): public browsing, owner
  create/update/archive/draft, admin list/review, customer request lifecycle,
  listing reports, photo upload (bucket `listings`, path `{ownerId}/{context}/…`,
  mock mode uses data URLs), row mapping camel↔snake (`lib/supabase/transform.ts`).
  New listings go to `pending_review` (never self-approve).
- **Filtering** (`lib/tolet-filters.ts`): search + area + type groups
  (family-like vs mess-like) + rent preset + beds + baths + 16 facilities +
  availability; sorts newest/recent/price asc/desc/availability.
- **UI**: `ToletListingCard`, 9-step `ToletWizardForm` (types→area→rent→home
  info→facilities→photos→description→preview→submit; mess-like collapses beds/
  baths/balconies into totalRooms), `ListingStatusBadge`/`RequestStatusBadge`,
  `PhotoUploader` (validation image + ≤5MB, max 6), `RequestSection`,
  `ReportSheet`. Favorites reuse the one-account `toggleSaveItem`.
- **Routes**: `/tolet` (URL-synced filters + sort), `/tolet/[id]` (visibility
  guard: approved public, owner/admin see own; gallery, transparent price box,
  request, report), `/profile/tolet` + `new` + `[id]/edit` (owner dashboard +
  wizard, inbox with status management), `/admin/tolet` + `[id]` + `[id]/edit`
  (pending_review default tab, approve/reject(reason)/suspend/unavailable/
  archive, verify toggle, reports + requests per listing, fee config),
  `/profile/requests` merged inbox.

## 7. Admin-managed staff services (কাজের বুয়া / Electrician / Plumber)

- **Domain** (`lib/staff-types.ts`): single `StaffProfile` shape across the three
  services keyed by `serviceSlug` (`kajer-bua`, `electrician`, `plumber`); every
  profile is **admin-created** (`phonePrivate` is ADMIN-ONLY and stripped from
  public queries). Per-service UI config (`STAFF_SERVICE_UI`) carries route,
  Bangla labels, hero copy, accent and business flags (`usesSalary`,
  `usesEmergency`, `hasPhotoOnRequest`). No fake verification — `isVerified` is
  admin-controlled only.
- **Data layer** (`lib/staff-service.ts` + `lib/staff-service-mock.ts`):
  public list/detail (active only, no private phone), admin profile
  CRUD, admin request fetch/update, staff profile reports (open/resolved/
  dismissed), photo upload (public `staff` bucket, mock= data URL), request
  attachment upload (private `documents` bucket + admin signed URL). Mock store
  seeds realistic profiles/requests/reports when Supabase is unconfigured, same
  as the To-Let pattern.
- **Requests reuse the single `service_requests` table** (statuses `new`,
  `contacted`, `completed`, `cancelled`, `reviewing`, `in_progress`, `rejected`
  + legacy `submitted`/`assigned`). Denormalized `profile_id` + `profile_title`
  snapshots the chosen worker so requests stay readable even if the profile is
  edited later; a DB trigger forces `status='new'` + null `admin_notes` for
  non-admin inserts. Customers submit via the shared `createServiceRequest`.
- **Public UI** (`components/staff/*`): `StaffProfileCard` (accent chip, work
  types, area list, rate, verified/emergency badges), `StaffServiceListing`
  (shared filtered grid wired into the generic `ServiceFilterBar`/
  `ServiceFilterDrawer` API: area, work type vs. service type, work mode, time
  slot, experience, availability, salary preset, emergency), `StaffDetail`
  (public detail + request form + report sheet), `StaffReportSheet`.
- **Admin UI** (`app/admin/services*`): list with search + service filter +
  delete; `new` / `[id]` / `[id]/edit` via shared `StaffProfileForm`
  (photo upload, multi-area + multi-work-type pickers, exit/inactive + verify
  toggles, admin-only private phone); `[id]` shows requests + contact panel.
- **Admin requests** (`app/admin/requests`): merged inbox for all three staff
  services with full 9-status badges and quick actions (completed/contacted/
  cancelled) via `adminUpdateStaffRequest`. `/profile/requests` shows the new
  statuses and links back to the chosen worker profile.
- **Routes**: `/kajer-bua`, `/electrician`, `/plumber` (+ `[id]` details),
  `/plumbing` → redirect (`/plumber`), `/admin/services`, `/admin/services/new`,
  `/admin/services/[id]`, `/admin/services/[id]/edit`, `/admin/requests`.
- **Schema** (`lib/supabase/schema.sql`): `staff_profiles` (with
  `area_ids TEXT[]`, `work_types TEXT[]`, `phone_private`, verified/active
  flags, RLS: public sees active only, admins full), `staff_profile_reports`,
  `service_requests` extension columns (`profile_id`, `profile_title`,
  `service_type`), `staff` storage bucket, sanitize trigger.

## 8. Admin-managed Home Moving (বাসা পাল্টানো)

- **Domain** (`lib/home-moving-types.ts`): Admin-managed, request-driven service
  (no provider account/dashboard). Customer submits a Moving Request; Admin
  reviews, contacts, assigns, and quotes the price **manually**. No automatic
  pricing anywhere. Item catalog (`HOME_MOVING_ITEMS`: বেড/খাট, সোফা, ফ্রিজ,
  টিভি, আলমারি, টেবিল, চেয়ার, ওয়াশিং মেশিন, অন্যান্য) with quantity steppers,
  floor options, time slots, and status info map.
- **Location rule:** pickup + destination MUST be centralized MCC location IDs
  (`lib/locations.ts`). The wizard uses `LocationSelectInput`/`getAllMCCAreas`
  and validates the route with `validateMovingRoute()` — both areas must be
  inside Mymensingh City Corporation.
- **Data layer** (`lib/home-moving-service.ts` + `lib/home-moving-mock.ts`):
  requests reuse the single `service_requests` table with new home-moving
  columns (`pickup_area_id`, `destination_area_id`, `pickup_address`,
  `destination_address`, `pickup_floor`, `destination_floor`, `has_lift`,
  `parking_info`, `moving_items JSONB`, `photo_urls JSONB`, `quotation`). Admin
  fetch/filter, per-id detail, and status/notes/quotation update run through the
  facade; `adminFetchAllManagedRequests()` returns a normalized
  `AdminRequestRow` union of staff + home-moving for the merged inbox. Mock
  store seeds demo requests when Supabase is unconfigured.
- **Public UI** (`components/home-moving/MovingRequestWizard.tsx`,
  `app/home-moving/page.tsx`): mobile-first 7-step wizard (From → To → Date/
  Time → Items → House details → Extra info + optional photo → Contact +
  Submit) with progress indicator, per-step validation, one step at a time.
  Photos use the private `documents` bucket (`uploadRequestAttachment` +
  `getRequestAttachmentViewUrl` signed URL for admin viewing). Customer contact
  name/phone default from the profile. After submit the request appears in
  `/profile/requests`.
- **Customer requests** (`app/profile/requests`): home-moving requests render
  the route (থেকে → যাবেন), floor/lift/parking, and the moving items list
  instead of the generic single-area block.
- **Admin UI** (`app/admin/requests` + `app/admin/requests/[id]`): merged inbox
  with filters for **service** (সব/বাসা পাল্টানো/কাজের বুয়া/Electrician/Plumber),
  **area**, **date**, and **status**; cards show route, items, quotation and
  admin notes. `/admin/requests/[id]` is the full detail page: status
  management (all 9 statuses as button grid), internal admin notes, manual
  quotation field (future quotation support), and private photo viewing via
  signed URLs. `/admin/home-moving` redirects to `/admin/requests`.
- **Schema** (`lib/supabase/schema.sql`): idempotent `ALTER`s add the
  home-moving columns above to `service_requests`; RLS is unchanged (customers
  see only their own rows, admins full access — phone and detailed addresses
  stay private). No new location system: `area_id`/`address_line` remain the
  generic columns while home-moving also stores explicit pickup/destination.

## 9. Home Tutor (গৃহশিক্ষক)

- **Domain** (`lib/home-tutor-types.ts`): one-account model — the same user can
  be a Customer AND a Tutor. `HomeTutorProfile` lifecycle: `draft` →
  `pending_approval` → `approved` (published) → `rejected` / `suspended` /
  `paused`. Status labels (`TUTOR_STATUS_META`), teaching mode (home/online/бoth),
  availability (available/limited/busy), `formatTutorFee`, and subject/class
  matching helpers operate on the friendly Bangla labels stored by the setup form.
- **Schema** (`lib/supabase/schema.sql`): `home_tutor_profiles` CREATE TABLE
  (status CHECK includes `rejected`; `teaching_mode`, `availability`,
  `profile_photo_url`, `admin_notes`, `rejection_reason`, `published_at`,
  `rating_avg`, `rating_count`) plus an idempotent ALTER block for existing DBs.
  `tutor_reviews` (RLS + `tutor_review_insert_validate` trigger: only completed
  tutor service requests may be reviewed, once per request, by the requesting
  customer; `tutor_reviews_ratings` trigger recomputes rating_avg/count).
  `tutor_reports` for public reporting. `prevent_self_approval` now also blocks
  non-admin `rejected`.
- **Data layer** (`lib/home-tutor-service.ts` + `lib/home-tutor-mock.ts`):
  `PUBLIC_TUTOR_COLUMNS` never selects `private_phone`/`nid_number`; admin mode
  (`mapTutorRow(row, { admin })`) exposes them; public facade force-strips
  `privatePhone`. Public list/detail (approved or owner/admin), reviews + review
  eligibility + create, reports, admin profile fetch/update, admin request
  fetch/update, photo upload (public `avatars` bucket) + `resolveTutorPhotoUrl`.
  Mock seeds 4 approved + 1 pending + 1 rejected tut-ors; reviews exist only for
  `tut-001` (2 reviews tied to completed requests) — no fake ratings.
- **Activation** (`lib/auth-context.tsx`): `activateHomeTutorProfile` sends an
  owner-editable whitelist; when editing an already-`approved` profile it keeps
  `approved` (sends no status) to avoid the self-approval trigger firing, else
  it forces `pending_approval`.
- **Public UI**: `TutorCard` (with `TutorAvatar` + `TutorRatingBadge`),
  `TutorRequestForm`, `TutorReviewsSection`, `TutorReportSheet`. `/home-tutor`
  has real filters (subject/class/mode/gender/experience/education/fee preset/
  availability/rated-only) via the generic `ServiceFilterBar`/`ServiceFilterDrawer`;
  `/home-tutor/[id]` is a full profile page with reviews, request form, mobile
  sticky CTA and report sheet. Rating badges render only when `ratingCount > 0`.
- **Customer UI**: `/profile/home-tutor` status-aware dashboard (rejection reason
  shown, resubmit CTA when rejected); `/profile/home-tutor/setup` is the full
  form; `/profile/home-tutor/edit` redirects to setup; `/profile/requests`
  renders tutor requests with the subject label.
- **Admin UI**: `/admin/verifications` — status tabs, search, verify toggle,
  approve/reject-with-reason/suspend/activate, admin-only private phone + admin
  notes. `/admin/requests` (+ `[id]`) merged inbox now includes home-tutor rows
  (`tutorToAdminRow`, `adminUpdateManagedRequest` per slug) with subject labels.
  Dashboard links cards for গৃহশিক্ষক ভেরিফিকেশন.
- **Privacy contract**: private phone / NID never leave the admin path; review
  eligibility is enforced by DB; customers only review after a completed class.

## 10. Blood Donor (রক্তদাতা)

- **Domain** (`lib/blood-donor-types.ts`): one-account model — the same user is
  a Customer AND a Blood Donor. Donor lifecycle `draft` → `pending_approval` →
  `approved` (published to public directory) → `rejected` / `paused` /
  `suspended`; only `approved` donors are ever published. Status badges
  (`DONOR_STATUS_META`, `BLOOD_REQUEST_STATUS_META`), availability labels,
  `formatLastDonation`, and `canGiveBlood`/`COMPATIBLE_DONORS` (compatibility
  rule: O− universal donor, O+ gives to O+/A+/B+/AB+, etc.) live here.
- **Schema** (`lib/supabase/schema.sql`): `blood_donor_profiles` CREATE TABLE
  (status CHECK includes `draft`/`rejected`; `intro`, `profile_photo_url`,
  `admin_notes`, `rejection_reason`, `published_at`) plus an idempotent ALTER
  block for existing DBs. Dedicated **`blood_requests`** table (NOT
  `service_requests`): statuses `pending_review` → `approved` →
  `donor_contacted` → `in_progress` → `completed`, plus `rejected`/`cancelled`;
  stores `prescription_url` (private storage path). **`blood_contact_releases`**
  is a phone-less audit trail (who released donor contact to whom, for which
  request, when — no number persisted, per the blood-donation privacy
  contract). **`blood_donor_reports`** lets visitors flag a donor profile.
  RLS: requester sees own requests, admins full; `blood_contact_releases`
  INSERT only by admins, SELECT by the `released_to_customer` or admins.
  `blood_requests_insert_sanitize` forces non-admin inserts to
  `pending_review`; `prevent_self_approval` now also blocks non-admin
  `rejected` (donor status changes fully admin-owned).
- **Data layer** (`lib/blood-donor-service.ts` + `lib/blood-donor-mock.ts`):
  `PUBLIC_DONOR_COLUMNS` never selects `private_phone`; the admin facade
  (`mapDonorRow(..., { admin })`) exposes it and public rows carry a
  `__protected__` phone in preview mode. Public list/detail (approved only),
  customer `createBloodRequest` (prescription file REQUIRED — image or PDF
  ≤5MB into the private `documents` bucket at `{userId}/prescriptions/…`,
  opened only via `getPrescriptionViewUrl` signed URL), `fetchMyBloodRequests`,
  `cancelMyBloodRequest` (pending_review or unreleased approved), admin
  request/donor/report facades, `adminReleaseDonorContact` (Promise.all donor +
  existing-release check → audit insert → request update), `adminFetchContactReleases`
  (joins released-by name + private donor phone), `uploadDonorProfilePhoto`
  (public `avatars` bucket), `resolveDonorPhotoUrl`, `fetchDonorModuleStats`.
  Mock seeds 9 donors (8 approved + 1 rejected with reason), 3 requests,
  2 contact releases, 1 report — no fake verification/statistics.
- **Activation** (`lib/auth-context.tsx`): `activateBloodDonorProfile` mirrors
  the tutor pattern — owner-editable whitelist; editing an `approved` profile
  keeps `approved` (no status sent, avoiding the self-approval trigger),
  otherwise forces `pending_approval`. Never sends `is_verified`/status from
  the client.
- **Public UI** (`components/blood-donor/*`): `DonorCard` (`DonorAvatar`,
  `DonorVerifiedBadge`, rose-gradient header, privacy-lock note),
  `BloodRequestForm` (donor request sheet: blood group, units 1–6, hospital +
  area, required date, patient info, contact phone, REQUIRED prescription
  upload; login gate; success state; `RequestSheetHeader` export),
  `DonorReportSheet`. `/blood-donor` has URL-synced filters (blood group +
  area) via the generic `ServiceFilterBar`; `/blood-donor/[id]` is a full
  profile page with request form, report sheet and a related-donors hint.
- **Customer UI**: `/profile/blood-donor` status-aware dashboard (rejection
  reason shown, resubmit CTA when rejected); `/profile/blood-donor/setup`
  (photo upload + intro + full form); `/profile/blood-donor/edit` redirects to
  setup; `/profile` blood-donor card shows status-aware labels;
  `/profile/requests` renders blood requests with the full status badge grid,
  released-contact notice, and cancel for pending/unreleased requests.
- **Admin UI**: `/admin/blood` — two tabs: রক্তের অনুরোধ (status filter chips,
  rows link to detail) and রক্তদাতা প্রোফাইল (search + status tabs, verify
  toggle, approve/reject-with-reason/suspend/reactivate, admin-only private
  phone, avatars). `/admin/blood/[id]` — full request review: patient/hospital
  info, secure prescription viewing via signed URL (image or PDF modal),
  admin notes + "suggest correction", 7-status control grid, rejection with
  reason, and the **audited contact-release** panel (release button → audit
  trail of who/when; released phone shown admin-side only). Dashboard links
  card to `/admin/blood`.
- **Blood non-commercial policy**: no payment, no credit — the platform only
  coordinates. Prescriptions + patient info are private; donor phone is never
  public and never disclosed to the requester without an audited admin release
  (and even then it is not persisted in the audit row).

## 11. Final Production Readiness (Step 18)

### 11.1 Complete Admin Console
All admin routes now have real, data-driven implementations:

| Route | Description |
|-------|-------------|
| `/admin` | Real dashboard with live stats (users, pending verifications, published tutors/donors, active staff, open requests, blood requests, open reports, unread notifications) — all counts from DB via `fetchAdminDashboardStats()` |
| `/admin/users` | User management: search, view all profiles with service-profile rollups (To-Let, Tutor, Donor statuses), suspend/block/restore actions via `adminUpdateUserStatus()` |
| `/admin/services` | Staff profile CRUD (kajer-bua, electrician, plumber) with delete, verify toggle, admin-only private phone |
| `/admin/services/new` / `[id]` / `[id]/edit` | Create/edit staff profiles via shared `StaffProfileForm` |
| `/admin/tolet` / `[id]` / `[id]/edit` | Listing moderation, fee config (fee slabs persisted to `platform_settings`), verify toggle, per-listing requests & reports |
| `/admin/blood` / `[id]` | Blood request moderation (7-status grid, prescription viewer via signed URL, audited contact release with audit trail) + donor profile moderation tabs |
| `/admin/verifications` | Tutor profile moderation (status tabs, search, verify toggle, approve/reject/suspend/reactivate, admin-only phone) |
| `/admin/requests` / `[id]` | Unified request inbox (staff + home-moving + tutor + tolet) with service/area/date/status filters, status grid, admin notes, quotation, signed photo URLs |
| `/admin/reports` | **New** — Unified moderation hub for all 4 report types (listing, staff, tutor, donor) with search, type/status filters, resolve/dismiss actions, links to source admin pages |
| `/admin/reviews` | **New** — Tutor review moderation (search, published/unpublished filter, publish/unpublish toggle) |
| `/admin/notifications` | **New** — Admin notification hub (real-time unread count, mark-all-read, links to related admin pages) |
| `/admin/settings` | **New** — Platform settings: To-Let fee rules (source of truth: `platform_settings` key `tolet_fee_rules`), service availability toggles, notification settings — all persisted to `platform_settings` table |
| `/admin/locations` | MCC wards/areas management (search, filter, ward view, active/inactive toggle) |

### 11.2 Notification System
- **Reusable, simple** (`lib/notification-service.ts`): `notifyCustomer()` (personal) and `notifyAdminHub()` (admin hub) — fire-and-forget, never blocks primary operation.
- **DB triggers** (server-enforced, not client-spammable):
  - `service_requests` insert → customer "রিকোয়েস্ট জমা হয়েছে" + admin "নতুন সার্ভিস রিকোয়েস্ট"
  - `blood_requests` insert → customer "রক্তের অনুরোধ জমা হয়েছে" + admin "নতুন রক্তের অনুরোধ"
  - All report tables (`listing_reports`, `staff_profile_reports`, `tutor_reports`, `blood_donor_reports`) insert → admin "নতুন মডারেশন রিপোর্ট"
- **Admin status updates** (facade-level): tutor/donor approve/reject, blood request status, staff/home-moving/tolet request status → customer notification + admin hub entry
- **AuthContext integration**: `refreshUserData()` fetches personal + admin-hub notifications, `markNotificationsReadAll()` marks all read via DB update
- **Profile notifications page** (`/profile/notifications`): uses new `NotificationItem` shape (`body`, `danger` type), mark-all-read button, link derivation from `relatedType/relatedId`
- **Admin notifications page** (`/admin/notifications`): admin hub inbox with mark-all-read, type icons, links to related admin pages

### 11.3 User Management
- **Account status** (`profiles.status`): `active` | `suspended` | `blocked` — enforced by RLS + `profiles_admin_only_fields` trigger (non-admins cannot change role/is_verified/status)
- **RLS fixes**: `profiles` SELECT restricted to own row + admin; INSERT restricted to own row as `customer` + `active`; UPDATE restricted to own row with admin-only columns protected by trigger
- **Auth gating**: `refreshUserData()` checks `status !== 'active'` → clears session + signs out; `login`/`verifyOtp` surface honest blocked-account message
- **Admin user management** (`/admin/users`): search, service-profile rollups (To-Let/Tutor/Donor statuses), suspend/block/restore via `adminUpdateUserStatus()`

### 11.4 Reports & Reviews Moderation
- **Unified reports hub** (`/admin/reports`): aggregates 4 report types (listing, staff, tutor, donor) with search, type/status filters, inline resolve/dismiss, links to source admin pages
- **Tutor review moderation** (`/admin/reviews`): list all reviews (published/unpublished filter, search), publish/unpublish toggle — updates `is_published` on `tutor_reviews` (rating triggers recompute `rating_avg/count`)

### 11.5 Admin Settings (Single Source of Truth)
- **To-Let fee rules** (`platform_settings` key `tolet_fee_rules`): mess/hostel/seat ৳50; rent ≤10k ৳100; 10k–20k ৳200; >20k ৳400 — **single source**, no duplication. Public read policy on `platform_settings` for `tolet_fee_rules` key.
- **Service availability** toggles per service (tolet, home-tutor, home-moving, kajer-bua, electrician, plumber) — persisted to `platform_settings` key `service_availability`
- **Notification settings** toggles (request submitted, status change, admin new-request, customer status change) — persisted to `notification_settings`
- All settings read/write via `fetchPlatformSettings()`/`savePlatformSettings()` in `lib/admin-service.ts`

### 11.6 Security Hardening
- **RLS privilege-escalation fix**: `profiles` UPDATE policy no longer allows non-admin role/is_verified/status changes; `profiles_admin_only_fields` trigger enforces this at DB level
- **Profiles enumeration fix**: `profiles` SELECT policy restricted to `id = auth.uid() OR is_admin()` — no authenticated user can enumerate phones/emails
- **Self-registration RLS**: INSERT policy restricts to `auth.uid() = id AND role='customer' AND status='active' AND is_verified=FALSE`
- **Admin-only columns**: `profiles_admin_only_fields` trigger blocks non-admin changes to `role`, `is_verified`, `status`
- **Prescription/document privacy**: `documents` bucket has no anon SELECT policy; prescriptions opened only via signed URLs (`getPrescriptionViewUrl`)
- **Audit trails**: `blood_contact_releases` (phone-less), report moderation status changes, notification inserts — all server-enforced
- **No service-role key in client code**: all operations use anon key + RLS; admin actions gated by `is_admin()` in RLS

### 11.7 Privacy Compliance
- **Private phones never public**: `PUBLIC_*` column lists exclude `private_phone`; admin facades expose only in admin responses
- **Prescriptions private**: stored in `documents` bucket `{userId}/prescriptions/…`, viewed only via signed URLs
- **Admin notes never public**: `admin_notes` only in admin facades
- **Donor contact release audited**: `blood_contact_releases` stores who/when, no phone persisted; phone shown in-memory only during admin release
- **No fake data**: mock stores seed realistic but unverified data; no fake ratings, reviews, or statistics anywhere

## 12. Supabase schema & RLS

Canonical file: `lib/supabase/schema.sql`. Covers:

- `profiles`, `tolet_profiles`, `home_tutor_profiles`, `blood_donor_profiles`,
  `service_requests`, `saved_items` with strict CHECK constraints.
- **To-Let tables:** `tolet_listings`, `tolet_requests`, `listing_reports`,
  `platform_settings` with status CHECK constraints, indexes, and an
  `updated_at` trigger shared via `public.set_updated_at()`.
- RLS enabled everywhere. Listing SELECT is `approved` only (owner/admin see
  own). Owner INSERT/UPDATE limited to `draft`/`pending_review`/`archived`/
  `unavailable` or unchanged status (no self-approval); admins have full
  access via FOR ALL policy. `tolet_requests` exposes phone only to the listing
  owner (`public.is_listing_owner()`), the customer, and admins; owners may
  advance status to contacted/completed/cancelled, customers may self-cancel
  submitted/contacted. Reports insertable by authenticated users or guests
  (name only, `reporter_id IS NULL`); status managed by admins. All other
  authenticated reads constrained (`approved` only for public service
  profiles; owner + admin see own rows).
- `is_admin()` is `SECURITY DEFINER` with `SET search_path = ''` +
  schema-qualified refs.
- `prevent_self_approval()` trigger blocks non-admins from setting
  `approved`/`suspended` on any service profile (insert or update).
- Storage buckets (`avatars` public, `documents` private, `listings` public)
  with per-user UPDATE/DELETE policies. `listings` photos are public to read;
  owners manage files under `{ownerId}/…`, admins bypass.

> **Migration caveat:** `supabase/migrations/20260920000000_auth_and_profiles.sql`
> only `\i`-includes the canonical schema file, which works from psql but not via
> `supabase db push`. For CLI deploys, inline the schema or convert includes to
> standalone migrations. If you connect a Supabase project + `.env.local`, run
> `schema.sql` in the SQL editor.

## 13. Environment

`.env.example` requires only:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No other secrets. App runs fully in "preview mode" without these — the To-Let
and staff-services systems use their in-memory mock stores in that mode.

## 13. Known limitations

- Remaining Step 5 business logic (payments, chat, AI) is **not implemented**.
  Search/filter against the DB for all implemented services (staff,
  home-moving, home-tutor, tolet, blood-donor) now works through the
  mock/real facades.
- `middleware.ts` is pass-through (no session refresh on edge); acceptable for
  the preview, revisit when real traffic appears.
- In-progress staff services render as submitted requests only; the actual
  work-completion/feedback loop is a future step.
- Design-system page is dev-only by design.
- Owner/new-listing flows (`/profile/tolet*`) require a logged-in session, so
  in preview mode (Supabase unconfigured, no login possible) they are gated
  behind the login prompt by design — no demo personas. In-memory mock data for
  those flows populates only after a real Supabase project is connected.
- Home-moving quotation is a free-text admin note for now; a formal quotation
  line-item/approval flow and customer-facing quote confirmation are future
  steps. Photo limit is one per request (photo_urls array supports more later).
- Blood request prescription upload is limited to a single image or PDF (≤5MB);
  the released donor number is shown to the requester only after the audited
  admin release and is intentionally not persisted (re-usable audit row), so a
  requester must keep the number from the release screen/coordination.

## 15. Verification

Green at time of writing (`lib/staff-service.ts` + `lib/tolet-service.ts` + `lib/home-moving-service.ts` + `lib/home-tutor-service.ts` + `lib/blood-donor-service.ts` + `lib/admin-service.ts` + `lib/notification-service.ts` + all routes):

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (0 errors; 5 pre-existing/intentional warnings — native `<img>` with `onError` fallback for hero + card media, one unused eslint-disable)
- `npm run build` — passes; all 62 routes compile (including new `/admin/users`, `/admin/settings`, `/admin/reports`, `/admin/reviews`, `/admin/notifications` and the SSG `/services/[slug]` aliases → `/tolet`, `/electrician`, `/plumber`, `/kajer-bua`, `/home-tutor`, `/blood-donor`)
- Rebrand verified green: 62/62 static routes after the palette + hero-carousel + pill-bar + flat-CTA pass.

## 16. Homepage redesign (premium UI + rebrand)

- Brand: Noto Sans Bengali via `next/font/google`. Exact palette in `app/globals.css` `@theme`:
  - Deep Navy `--color-brand-700` `#12304A`, Secondary Navy `--color-brand-600` `#2F6B8A`, Warm Gold Accent `--color-accent-400` `#E8A83E`, Warm Off-White `--color-mist-50` `#F8F7F3`, Primary Text `--color-ink-900` `#17212B`, Muted `--color-ink-500` `#55677B`, Border `--color-brand-100` `#DDE7F0`.
  - `--color-emerald-*` is aliased to the same navy scale so legacy pages (login, admin, tolet, services…) share the Deep Navy identity without per-class migration.
  - Body `bg-mist-50`; `::selection` warm gold; desktop `viewport.themeColor` `#F8F7F3`.
- Design rules: no gradients/glassmorphism/floating blobs/AI-template look; Deep Navy for headings/buttons/nav/strong sections; pure white selectively for cards & forms; gold used only for tiny highlights (consistent with §17); rounded-2xl max (pills full-round); subtle shadows; `backdrop-blur` only on the functional navbar/bottom-nav surfaces.
- The homepage is now the **narrative three-category redesign** described in §18. The former carousel hero, `PopularServicesSection`, the five stacked `HomeServiceSection` grids, `HeroSearchBar`, `HeroSearchSection`, `ServiceSection` and `ServiceCarousel` were REMOVED (files deleted, last verified only referenced from within `components/home/`).
- Image policy for কাজের বুয়া & রক্তদাতা: NO photos anywhere on their public cards/details (privacy). Live `ServiceCard` has an `imageless` variant — a soft navy-toned header with a large brand initial and the status pills (no photo/arrow-overlay). Wired via `FeaturedServicesSection imageless` for its কাজের বুয়া and রক্তদাতা tabs. On `/services` the two cards DO render `coverImage` (images restored on that page only; no `hideCardImage` flag). Kajer-bua catalog uses `StaffProfileCard imageless`, blood-donor catalog uses an image-less `DonorCard`; detail pages `StaffDetail imageless` / Droplets tile replace photos. Electrician/Plumber cards & details keep their photos.
- `ReviewSection` is a MODAL (no standalone section): the final CTA's "আপনার রিভিউ দিন" button dispatches `mms:open-review`, opening a dialog with the rating+text form. Reviews persist to `localStorage` key `mms_home_reviews_v1` (max 24); shows average + recent reviews with dates via `toLocaleDateString('bn-BD')`. Closes on backdrop/Escape; body scroll locked while open.
- Compact sections (`py-9 sm:py-12`): কেন Mymensingh Sheba? stats strip flattened to a white bordered card, 3-step how it works (`id="how-it-works"`), testimonials (mobile carousel + desktop 3-col), final CTA on flat deep-navy card without blobs/gradients.
- Deep-Navy `Footer` (2-col mobile / 12-col lg), fixed mobile bottom nav with safe-area padding (home root reserves `env(safe-area-inset-bottom)+5.5rem`, visible only below lg).
- `/services` reads a `q` param (hero search lands here, pre-filled); explicit `viewport` meta exported from `app/layout.tsx`.

## 17. Deep Navy + Off-White rebrand (global color system)

- Purpose: transform the previous green/lime identity into a premium **Deep Navy + Warm Off-White** system WITHOUT changing any structure, content, services, routes, functionality or features. Achieved entirely in the token layer.
- `app/globals.css` `@theme` remap (no component edits required — everything is token-driven):
  - `brand-*` scale → navy: 700 = `#12304A` (Deep Navy, primary buttons/headings/nav), 600 = `#2F6B8A` (Secondary Navy, links/icons), 800/900/950 = deeper navy for hero frame/footer/CTA sections, 50–500 = calibrated navy tints/lines (borders `#C2D3E1`).
  - `accent-*` scale → warm gold: 400 = `#E8A83E` (small highlights/CTAs only), 300 = `#F1C87B` (gold text on navy), 100/200 = soft gold tints (chips, `::selection`).
  - `mist-*` → warm off-white: 50 = `#F8F7F3` (dominant page background), 100 = `#EFEDE5` (subtle panels/placeholders).
  - `ink-*` → navy-tinted text: 900 = `#17212B` (primary text), 500 = `#55677B` (muted), 400 = `#7C8CA0` (subtle).
  - `emerald-*` aliases map to the identical navy scale so legacy pages (login/register, admin, profile, tolet, home-tutor, blood-donor, services, detail layouts, ui components) inherit the rebrand with zero migration.
- Hardcoded near-white page wrappers `bg-[#FBFDFB]` (≈31 files) replaced with the off-white `#F8F7F3` to keep one dominant background.
- `viewport.themeColor` → `#F8F7F3`; `lib/design-tokens.ts` reference palette updated to the navy identity.
- Semantic colors intentionally retained: `rose-*` for blood-donor, `amber-*` for ratings/warnings, `teal-*` for online/availability, `sky-*` info toasts.
- Verified: tsc clean, lint clean (0 errors / 5 pre-existing warnings), `npm run build` green — 62/62 routes.

## 18. Homepage — narrative three-category design (from scratch)

- Purpose: rebuild the homepage by hand into a human, premium, mobile-first page with three **visually distinct** service categories, a new hero, a new navbar and one dynamic featured-live-data area — preserving ALL functionality (routes, services, data, auth, review modal, anchors).
- New **Navbar** (`components/Navbar.tsx`, used on all pages): Deep-Navy bar (`bg-brand-700`) — logo in a white tile + wordmark "Mymensingh Sheba" with gold "ময়মনসিংহ সেবা"; desktop links (হোম/সেবা সমূহ/কিভাবে কাজ করে/আমাদের সম্পর্কে/যোগাযোগ) with `bg-white/10` active state; gold "জরুরি: ৯৯৯" `tel:999` chip; `/services` search icon; logged-out লগইন (outline) / রেজিস্ট্রেশন (gold) buttons, logged-in user chip (roleLabel + initial avatar). Mobile hamburger opens a white drawer: navy emergency quick-dial strip, links, auth buttons, "সেবা সমূহ দেখুন", safety/help links. 44px targets preserved; same `useAuth`/`isActive`/`roleLabel` logic.
- Homepage flow (`components/home/HomePage.tsx`): Navbar → Hero → Cat 1 দৈনন্দিন সেবা (white) → Cat 2 কেনাকাটা, যাতায়াত ও তথ্য (mist) → Cat 3 জরুরি ও জনসেবা (navy band) → ফিচার্ড সেবা (live tabs) → Steps → Testimonials → Why → ReviewSection (modal) → FinalCta → Footer + MobileBottomNav.
- Hero (`HeroSection.tsx`): `bg-mist-50`, left-aligned editorial copy — eyebrow "ময়মনসিংহ সিটি কর্পোরেশন • স্থানীয় সেবা প্ল্যাটফর্ম", headline "ময়মনসিংহের প্রয়োজনীয় সেবা, এখন এক জায়গায়" with a gold underline, supportive warm line, then the new product-grade **`ServiceSearchBox`** (big white rounded bar + gold "খুঁজুন" → `/services?q=…` + quick suggestion chips). Right side: off-set photo stack (`/sheba1.png` aspect-16/10 + rotated overlap `/sheba2.png` + a white "৩৩টি সিটির ওয়ার্ড" chip), with a relaxed-motion fade-up entrance (`mms-fade-up`, replacing the removed carousel keyframes). `png`→flat navy panel `onError` fallback inside a local `HeroImage` probe.
- **ক্যাটাগরি ০১ — দৈনন্দিন সেবা** (`DailyServicesSection.tsx`, white): editorial eyebrow "০১ • দৈনন্দিন সেবা", left header + "সব সেবা দেখুন". Asymmetric composition: one large বাসা ভাড়া feature panel (`/home.jpg`, "সবচেয়ে জনপ্রিয়" pill, chips ফ্যামিলি ফ্ল্যাট/ব্যাচেলর/মেস সিট) beside a compact 9-tile icon board (Electrician, Plumber, AC/Fridge, গাড়ি/CNG/অটো, গৃহশিক্ষক, কাজের বুয়া, বাসা পাল্টানো). Existing-route hrefs point to real pages; not-yet-live ones go to `/services?q=…`. Closing helper line → /services.
- **ক্যাটাগরি ০২ — কেনাকাটা, যাতায়াত ও তথ্য** (`ShopTravelInfoSection.tsx`, mist): deliberately different rhythm — two large "magazine" numbered feature cards (০১ কেনাবেচা white / ০২ Bus Ticket navy `bg-brand-800`, ghost index numerals, "শীঘ্রই যুক্ত হচ্ছে" pill) over two slim information rows (চাকরি, News) with icon tiles + "শীঘ্রই" badge.
- **ক্যাটাগরি ০৩ — জরুরি ও জনসেবা** (`EmergencyServicesSection.tsx`, `bg-brand-900` band): calm/professional, five big thumb-friendly cards — ডাক্তার ১৬২৬৩, পুলিশ ৯৯৯ (featured accent outline), অ্যাম্বুলেন্স ৯৯৯, ফায়ার সার্ভিস ১০২ (all gold "কল করুন" quick-dial `tel:`), Mymensingh Sheba helpline → `/contact`. Reassurance note: "৯৯৯ জাতীয় জরুরি সেবা… ১০২ সরাসরি ফায়ার… ১৬২৬৩ ডাক্তারের পরামর্শ".
- **ফিচার্ড সেবা** (`FeaturedServicesSection.tsx`, white): one dynamic area replacing the five repeated grids — category tabs (বাসা ভাড়া / মেরামত / কাজের বুয়া / গৃহশিক্ষক / রক্তদাতা) load the SAME preview facades (`lib/home-preview.ts` + `components/home/section-loaders.ts`) through `loadToletCards/loadRepairCards/loadMaidCards/loadTutorCards/loadDonorCards`. Desktop 4-col grid; mobile snap rail; skeletons while loading; empty state card; per-tab "আরও দেখুন" → the real service page. কাজের বুয়া + রক্তদাতা tabs use the `imageless` card variant (privacy preserved).
- `ServiceCard.tsx` (new card language, same `HomePreviewCard` props): white card, hairline `slate-200` border, `rounded-xl`, hover lift + subtle shadow, image zoom, verified pill on photo (top-left), availability pill bottom-left, amber rating, navy/rose arrow box (rose for blood-donor tone), `imageless` variant = soft navy initial header.
- Section restyles: `StepsSection` (`id="how-it-works"` kept, editorial 3-step cards + dashed connector + navy CTA), `TestimonialsSection` (eyebrow normalized; mobile carousel + desktop 3-col), `WhySection` (kept `id="about"` + stats strip), `FinalCtaSection` (deep-navy CTA card, review dispatch kept).
- Deleted dead components (no external references): `HeroCarousel`, `HeroSearchSection`, `HeroSearchBar`, `PopularServicesSection`, `ServiceSection`, `ServiceCarousel`, `HomeServiceSection`. `app/globals.css`: removed dead `hero-slide-*`/`hero-img-*` keyframes, added `mms-fade-up` (respects `prefers-reduced-motion`).
- Verified: tsc clean, lint 0 errors (5 pre-existing warnings only), `npm run build` green — 62/62 routes (homepage `/` = 21.3 kB, 247 kB first-load JS).

## 19. Live info bar + ময়মনসিংহ পরিচিতি page

Two user-requested features (mobile-first, Deep Navy + Off-White, no regressions):

### 19.1 Live Mymensingh Information Bar (`components/MymensinghLiveBar.tsx` + `lib/mymensingh-live.ts`)
- Mounted at the **very top of every page** — rendered first inside `components/Navbar.tsx` (Navbar is used by all 38 pages), above the sticky navy header. The bar scrolls away; the header stays sticky.
- **Weather (no hard-coding, live API):** Open-Meteo forecast for Mymensingh (24.754N / 90.407E), `timezone=Asia/Dhaka`, `forecast_days=1`. Shows temp, condition label (Bengali from `weather_code`), humidity, feels-like, and daily high/low; day/night-aware icon from `is_day`.
- **Prayer times (live API, Asia/Dhaka):** Aladhan `/v1/timings/{dd-mm-yyyy}` with `method=1` (University of Karachi/Hanafi — constant `PRAYER_METHOD_NAME`) and `timezonestring=Asia/Dhaka`. Shows ফজর/যোহর/আসর/মাগরিব/এশা in Bengali 12h + period; highlights the **current/next** prayer with a countdown ("পরবর্তী মাগরিব · ১ঘ ১২মি"); after Isha falls through to next-day Fajr labelled (কাল). Date/digits converted to Bengali; date key derives from Dhaka midnight (UTC+6, no DST).
- **Freshness contract:** nothing is cached or ever shown stale — on fetch failure the segment renders an honest fallback ("…সাময়িকভাবে অনুপলব্ধ") with a retry button (loading skeletons before first success). Re-fetches every 30 min (`LIVE_FRESHNESS_MS`) and automatically on Dhaka date change; `nowTick` refreshes the countdown every minute.
- Compact: desktop = one horizontal row (weather | prayers + next pill | ময়মনসিংহ পরিচিতি link), ~44–48px tall; mobile = a `no-scrollbar` horizontally scrollable strip (weather pane, next-prayer pill + full inline times, link). No API keys required (Open-Meteo + Aladhan are keyless; nothing secret in code).
- Live A/B of the two APIs verified against real responses during development (timings sample `04:33 11:49 15:15 17:50 19:06`).

### 19.2 ময়মনসিংহ পরিচিতি (`/mymensingh`, French–style editorial documentary page)
- `app/mymensingh/page.tsx` (server, exports `metadata`) renders the client page `components/mymensingh/MymensinghCityPage.tsx`; `components/mymensingh/CityPhoto.tsx` is a shared image-with-`onError`-fallback figure (designed navy panel, never a broken layout).
- Route wired: Navbar mobile drawer "ময়মনসিংহ পরিচিতি" item (Landmark icon, active state), Footer → কোম্পানি adds `{ name: 'ময়মনসিংহ পরিচিতি', href: '/mymensingh' }`, plus a permanent link chip on the right of the live bar.
- Structure (all 8 requested sections, editorial layout, no government-page look):
  1. **Cinematic hero** (`hero-river.jpg` full-bleed, navy overlay, gold accent) — ১৭৮৭ · জেলা, পুরাতন ব্রহ্মপুত্রের তীর, সেক্টর ১১ chips.
  2. **০১ · পরিচয়** — narrative + "এক নজরে" fact panel (pratisthā ১৭৮৭, পূর্ব নাম নাসিরাবাদ, ডাকনাম ‘শিক্ষা নগরী’, সেক্টর ১১, নদী-কথা).
  3. **০২ · ইতিহাসের সময়রেখা** — 10-point navy timeline (ষোড়শ শতক মোমেনশাহী → ১৭৮৭ কালেক্টরেট → ব্রহ্মপুত্র স্রোত পরিবর্তন → ১৮৯৭ ভূমিকম্প → ১৯০৫ শশী লজ → ১৯৬১ বাকৃবি → ১৯৬৯ জাদুঘর → ১৯৭১ /সেক্টর ১১ → ১৯৭৫ জয়নুল সংগ্রহশালা → ২০১৫ প্রত্নতত্ত্ব অধিদপ্তর).
  4. **০৩ · নামের ইতিহাস** — three honest columns: নথিভুক্ত (মোমেনশাহী পরগণা/Jarret’s ‘Momensingh’) vs লোককথা (রাজা ময়নসিংহ/মহিষ) vs বিতর্কিত (দ্বিগুণ-রাজস্ব Alapsingh, তালিকার নাম, নাসিরাবাদ) — folklore explicitly separated from documented facts.
  5. **০৪ · প্রকৃতি ও ব্রহ্মপুত্র** — `brahmaputra-boats.jpg` full-bleed + `zainul-park-boat.jpg`, noun on Moktagachha manda, char localities (চরপাড়া, সানকিপাড়া, কাঁচিঝুলি).
  6. **০৫ · শিক্ষা ও জ্ঞান** — navy cards: বাকৃবি ১৯৬১, মেডিকেল ১৯৬২, MEC ২০০৭ (মুয়েট), আনন্দ মোহন ১৯০৮, নজরুল বিশ্ববিদ্যালয় (ত্রিশাল) ২০০৬ + ‘শিক্ষা নগরী’ accent band.
  7. **০৬ · সাহিত্য ও সংস্কৃতি** — মৈমনসিংহ গীতিকা (দীনেশচন্দ্র সেন, ১৯২৩ থেকে কলকাতা বিশ্ববিদ্যালয়), জয়নুল ও জাদুঘর, নদীতীরের স্মৃতি/সংগীত, মুক্তাগাছার মণ্ডা.
  8. **০৭ · ঐতিহাসিক ও দর্শনীয় স্থান** — `shashi-lodge.jpg` feature tile + numbered ০২–০৬ tiles (আলেকজান্ডার ক্যাসেল, ময়মনসিংহ জাদুঘর, জয়নুল সংগ্রহশালা, মুক্তাগাছা রাজবাড়ি/আটআনি, গৌরীপুর রাজবাড়ি) + ময়মনসিংহ-১৯৭১ note.
  9. **০৮ · আমাদের ময়মনসিংহ** — closing navy band with three service CTAs; credits footnote (উইকিপিডিয়া/বাংলাপিডিয়া, foto credits Ibrahim Husain Meraj / Rupon Das / Topu Saha for the four Wikimedia Commons CC BY-SA 3.0/4.0 photos).
- **Imagery policy:** four authentic real photographs downloaded from Wikimedia Commons into `public/mymensingh/` (`hero-river.jpg`, `brahmaputra-boats.jpg`, `zainul-park-boat.jpg`, `shashi-lodge.jpg`) via `Special:FilePath`; author/license verified per-file; every photo carries a visible caption line on the page. Moktagachha/Gouripur tiles are typographic (no suitable free image found), never mocked.
- **Fact-checking:** all claims traced to Wikipedia/Banglapedia docs found in research; disputed/factual ambiguity explicitly labelled in-copy; only verified years/events used (1787, 1905, 1961/72, 1969, 1975, 2015; sector 11; Banglapedia confirms Gauripur upazila is in Mymensingh district and Rajendra Kishore Roy Chowdhury’s photography pioneer role).
- Verified: tsc clean, lint 0 errors (now **4** pre-existing warnings only — admin img, services img, MovingRequestWizard img, TutorReviews unused-disabled), `npm run build` green — **63/63 routes**; `/mymensingh` = 13.5 kB / 210 kB first-load JS.

## 20. Deep Forest rebrand (4-color identity turn) — replaces the navy era

- Purpose: turn the whole app — homepage, legacy pages, admin, `/mymensingh` — from the Deep Navy identity into the user's exact 4-color forest palette, without changing structure/content/services/functionality. Achieved almost entirely at the token layer, plus intolerant cleanup of hardcodes and the design-system hierarchy.
- Exact brand colors (the user-specified four): **Deep Forest Green `#0C3B2E`** · **Soft Sage Green `#6D9773`** · **Warm Earth/Bronze `#BB8A52`** · **Warm Golden Yellow `#FFBA00`**. Ratio ≈ Forest 40% / Sage 25% / Warm Cream 25% / Bronze+Gold 10%.
- `app/globals.css` `@theme` remap (component edits needed only where notes below):
  - `brand-*` → forest→sage: 700 = `#0C3B2E` (Deep Forest primary: nav, headings, primary buttons), 500 = `#6D9773` (exact sage — chips/icons/decorative), **600 = `#4A7857`** (darkened sage holding ≥4.5:1 white text/links), 800/900/950 = deeper forest (photo frames, emergency/footer bands), 50–300 = calibrated sage tints/lines (`#E0E9E0` hairline borders).
  - `accent-*` → golden yellow: 400 = `#FFBA00` (CTAs, spark — gold-on-forest ≈8:1, gold button+forest text ≈9:1), 300 = `#FFD15C` (gold text on forest), 100/200 = soft gold tints (chips, `::selection`).
  - **NEW `bronze-*` scale**: 500 = `#BB8A52` (the fourth color), 200 = `#E6D3B8` (outline-button/subtle borders), 300 = `#D4B489` (icon tints on forest).
  - `mist-*` → warm cream: 50 = `#FAF8F2` (dominant page background), 100 = `#F1EDE1`, 200 = `#E7E1D1`.
  - `ink-*` → green-charcoal: 900 = `#16241C` (primary text), 700 = `#2B3A31`, 600 = `#3D4D43` (new stop — used by `/mymensingh` body text), 500 = `#57665C` (muted), 400 = `#7D8B81` (subtle).
  - `emerald-*` aliases map to the same forest/sage scale so **legacy pages inherit the rebrand with zero migration** (emerald is now semantically the brand green).
- Hardcoded cleanup: all 31 files using `bg-[#F8F7F3]` (login/register, profile/*, admin/*, blood-donor, home-tutor, home-moving, DetailPageLayout, RoutePlaceholderShell, design-system…) rewritten to `bg-mist-50` so every page shares the cream background token; `viewport.themeColor` → `#FAF8F2`.
- Button hierarchy (`components/ui/Button.tsx`, now a 4-tier system): **Primary** = Deep Forest `bg-emerald-700 text-white` · **Important** (new `important` variant) = Golden Yellow `bg-accent-400 text-emerald-900` · **Secondary** = soft sage tint · **Subtle/Outline** = cream surface + forest text + `border-bronze-200` hairline. `ghost`/`success`/`icon` retinted to forest/sage. Semantic `danger` stays rose.
- Curated flagship touches (human-designed feel on top of the token swap):
  - Hero: photo blood-donor chip overlays now a forest-glass (`bg-brand-900/70` + sage ring) instead of neutral black.
  - `ServiceSearchBox`: hairline `border-brand-100/90` (sage) with `focus-within:border-brand-400`; gold "খুঁজুন" unchanged.
  - `ServiceCard`: white card now rests on a sage hairline `border-brand-100/90`, hover lifts with a **warm bronze** edge (`hover:border-bronze-300/70`) — the fourth color's signature; body divider `brand-100`; `imageless` header gradient = sage→cream.
  - `Footer`: brand-pin chip + social icons pick up bronze-hairline borders (`border-bronze-400/25`, hover `50/60`) and bronze icon tints on the forest band.
  - `MymensinghLiveBar` / `/mymensingh` bands (forest) and gold accents inherit automatically — no edits required.

## 21. Verification
- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors; same **4** pre-existing warnings (admin img, services img, MovingRequestWizard img, TutorReviews unused-disabled).
- `npm run build` — green **63/63 routes**; homepage `/` = 18.2 kB / 252 kB first-load; `/mymensingh` unchanged 13.5 kB / 210 kB.
- `lib/design-tokens.ts` reference palette synced to forest/sage/bronze/gold (README/narrative unchanged).

## 22. Homepage redesign — carousel + unified category system (user's 22-point spec)
- Purpose: reshape the homepage into the user's exact desktop-first narrative: **Transparent navbar → Premium image carousel → Supporting copy + search → Category 1 (daily) → Category 2 (shop/travel/info) → Category 3 (emergency) → existing live sections (featured, steps, testimonials, reviews, final CTA)**. Functionality preserved: routes, auth, Supabase, search, filters, services data, mobile nav all untouched.
- Navbar (`components/Navbar.tsx`): homepage bar is **transparent** over the hero and becomes a soft cream blur (`bg-mist-50/90 backdrop-blur-md` + brand hairline) after 12px scroll; brand is **the logo alone, larger (`h-12 w-12`)**, no wordmark, `ring-brand-200` on cream; links/text learn dark-on-cream (`ink-700` / `hover:bg-brand-100/60`, active `bg-brand-100 text-brand-800`) vs. the unchanged forest bar on every other page; login/register/user-chip/hamburger all get on-home variants (gold Register kept).
- `components/home/HeroCarousel.tsx` (new): seamless **infinite cloned-track** slide — `track = [last, ...slides, first]`, second-state clone, `translateX` in %, 850ms `cubic-bezier(0.22,1,0.36,1)` ease, invisible `onTransitionEnd` snap (won't stick because reduced-motion **never enters** the clone track); 5.5s autoplay paused on hover/focus/visibility; ghost arrows (desktop `sm:flex`), quiet dots (active `w-6 bg-accent-400`) bottom-right, caption chip bottom-left with gradient; phonetic `aspect-[4/3] → sm:16/9 → lg:21/9`; uses the existing `/sheba1-4.png` images, no new assets.
- `components/home/SearchSection.tsx` (new): replaces the old image-stack hero with the supporting editorial copy (gold-dot eyebrow, forest "এখন এক জায়গায়" + gold underline, supporting paragraph, "আপনার কী সেবা প্রয়োজন?") + the **same `ServiceSearchBox`** (search functionality unchanged), centered `max-w-3xl` on cream.
- Reusable category system (new files) — one card language, three sections:
  - `components/home/CategoryHeader.tsx` — gold-dot eyebrow `{numeral} • {label}`, forest/cream `text-2xl/3xl font-extrabold` title, description, optional View All (with CTA arrow); `dark` flag flips to silver/gold on the forest band.
  - `components/home/CategoryCard.tsx` — equal medium cards: white `rounded-xl border-brand-100/90 shadow-sm`, hover `-translate-y-1 border-bronze-300/70 shadow-lg`; image top `aspect-[16/10]` with subtle hover zoom + bottom gradient, **or** a designed forest glyph panel (icon tile in gold + number ghost-watermark) for the emergency category; pill; name + `en` + `text`; member chips; `mt-auto` CTA row — dial items get a full-width **gold** `bg-accent-400` button with `PhoneCall` + number, others a forest text + `ArrowRight`.
  - `components/home/CategorySection.tsx` — header + grid shell; section background rhythm `white → mist → deep-forest band` (`category.tone`), `py-10 sm:py-14 lg:py-16`, `max-w-7xl`.
- `lib/homepage-catalog.ts` (new, the single edit point for content/images): typed `HomepageCategory`/`HomepageService` + the three datasets.
  - **Category 1 (দৈনন্দিন সেবা, white, 7 cards)**: টয়লেট → `/home.jpg`; **Electrician + Plumber grouped** into one card (`/e&p.jpg`, chips ইলেক্ট্রিশিয়ান+প্লাম্বার, pill "২টি সেবা", → `/services`); **Gari + Auto + CNG grouped** into one card (`/mymensingh/brahmaputra-boats.jpg`, pill "৩টি সেবা", → `/services`); এয়ারকন্ডিশন/ফ্রিজ → `/sheba1.png`; গৃহশিক্ষক → `/tutor.jpg`; কাজের বুয়া → `/kajerbua.jpg`; বাসা পাল্টানো → `/homechange.jpg` (centered alone on lg via `layoutClass: sm:col-span-2 lg:col-span-1 lg:col-start-2` — no orphan).
  - **Category 2 (কেনাকাটা, যাতায়াত ও তথ্য, mist, 6 cards)**: বাস টিকেট → `/mymensingh/zainul-park-boat.jpg`; কেনাবেচা → `/sheba2.png`; চাকরি/জব → `/sheba3.png`; খবর → `/sheba4.png`; **WiFi** → `/mymensingh/hero-river.jpg` (→ `/services?q=wifi`); **কোচিং** → `/mymensingh/shashi-lodge.jpg` (→ `/services?q=coaching`) — added as first-class cards with image/title/description.
  - **Category 3 (জরুরি ও জনসেবা, deep-forest band, 5 cards, NO photos by design)**: ডাক্তার, পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস (**full-width gold `tel:` buttons** with national numbers) + জাতীয় জরুরি হেল্পলাইন ৯৯৯ (forest text card, `lg:grid-cols-5` + `sm:col-span-2 lg:col-span-1`). Imageless cards intentionally render the designed forest glyph panel (icon tile + ghost number watermark) so the section never falls back to fake stock photos while keeping equal card geometry.
- Left untouched: `FeaturedServicesSection`, `StepsSection`, `TestimonialsSection`, `WhySection`, `ReviewSection`, `FinalCtaSection`, `Footer`, `MobileBottomNav` (still the safe-area-aware 5-tab bar).
- Old `HeroSection`, `DailyServicesSection`, `ShopTravelInfoSection`, `EmergencyServicesSection` **deleted** (only HomePage imported them).
- Design-for-motion: `prefers-reduced-motion` readers get no autoplay + no transitions and simple direct-wrap navigation.
- Verification: tsc clean; lint 0 errors (same 4 pre-existing warnings — now `HeroCarousel` passes the newer `react-hooks/set-state-in-effect` + `react-hooks/refs` rules via lazy initializer + effect-synced ref); build green **63/63**; homepage `/` = 18.8 kB / 253 kB.
- Known follow-ups for the user: carousel captions/alt and some card photos are thematic placeholders (assistant could not visually inspect images) — swap paths in `lib/homepage-catalog.ts` + `HeroCarousel.tsx`; group cards intentionally route to `/services`; WiFi/Coaching currently open the services search (`?q=…`) since no dedicated landing pages exist yet.
- Follow-up tweaks (same session): ক্যাটাগরি ০১ (`lg:grid-cols-7`) ও ০২ (`lg:grid-cols-6`) now render **compact** cards (`category.compact`) so the whole row fits on desktop — square image top, tight `p-3` body (title/2-line text/small CTA), `gap-3 sm:gap-4`, pill overlaid on image, home-moving's orphan-centering removed; mobile stays a clean 2–3 column stack. Navbar logo: white tile + `ring` removed — the logo now fills the navbar height edge-to-edge (`h-full w-auto`, no top/bottom gap, ~64px on desktop vs 48px before).
- Follow-up tweaks (same session, top bar / navbar cleanup): the live bar above the navbar (`components/MymensinghLiveBar.tsx`) no longer shows weather (humidity, feels-like, max/min removed) — it keeps the live dot + location/date and the prayer times (desktop + compact mobile). The "ময়মনসিংহ পরিচিতি" link moved from the live bar into the navbar (`navLinks`: `পরিচিতি → /mymensingh`, Landmark icon) and the navbar's gold "জরুরি: ৯৯৯" chip (desktop) plus the mobile-drawer emergency dial were removed.
  - Follow-up tweaks (same session, homepage headings + services page):
  - Category headings are now big & centered (`text-3xl sm:text-4xl`) with the eyebrow/numeral lines ("০১ • …") removed; titles renamed to **জনপ্রিয় সেবা**, **প্রয়োজনীয় সব সেবা**, **ইমার্জেন্সি সেবা**; "সব সেবা দেখুন" moved to the **bottom** of each section under the grid (dark-band variant on the emergency section).
  - `/services` (the catalog): now lists **every homepage service** (13 new entries in `lib/services-data.ts`: গাড়ি/অটো/CNG, এসি ও ফ্রিজ, Bus Ticket, কেনাবেচা, চাকরি, News, WiFi, কোচিং, ডাক্তার, পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস, Mymensingh Sheba হেল্পলাইন) with the same compact homepage-size cards (aspect-square image, `p-3` body, dense `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`); emergency services render a gold `tel:` call button. New `SERVICE_REDIRECTS` route each new slug to a pre-filtered catalog view (`/services?q=<encoded বাংলা/%>`) or `/contact` (helpline) — Bengali queries are percent-encoded because `redirect()` rejects non-ASCII ByteStrings. Filter/search/area bar refreshed to brand tokens (bg-mist-50, brand hairlines, brand focus rings).
- **Homepage re-architecture (latest, supersedes the deep-forest emergency band + Featured block above):** `FeaturedServicesSection.tsx` **deleted** (tabs/preview facades live on — reused by the new rows). New reusable `components/home/ServiceRowSection.tsx` (client): kicker eyebrow + big title + "আরও দেখুন" link, `asynchronous load?` or static `cards?`, white/mist tone (`border-b` hairline), skeleton cards while loading, empty state, mobile bottom CTA; grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` using `ServiceCard compact imageless` → **no photos in any row** (photo policy: photos only on homepage category cards + `/services`).
  - **New homepage flow:** Hero → Search → ক্যাটাগরি ০১ (white) → ক্যাটাগরি ০২ (mist) → **ইমার্জেন্সি (`tone:'white'` now — same background as other sections; **dense** `CategoryCard` variant: `aspect-[4/3]` media, `p-2.5` body, `text-[12px]` title, tiny gold dial chip)** → সার্ভিস রো **বাসা ভাড়া** (mist, live `loadToletCards` → `/tolet`) → **গৃহশিক্ষক** (white, `loadTutorCards` → `/home-tutor`) → **গাড়ি, অটো ও CNG** (mist, static `GARI_SAMPLE_CARDS` → `/services?q=গাড়ি`) → **CommunityInviteSection** (mist) → **রক্তদাতা** (white, `loadDonorCards` → `/blood-donor`) → **কেনাবেচা** (mist, static → `/services?q=কেনাবেচা`) → **News** (white, static → `/services?q=news`) → Steps (mist) → Testimonials → Why → Review → FinalCta.
  - Static sample rows live in `lib/home-static-rows.ts` (`GARI/KENABECHA/NEWS_SAMPLE_CARDS`, 5 each; `withHref` helper adds each row's services-search href; swapping a row to a live loader later = one prop change).
  - **Image removal for কাজের বুয়া + রক্তদাতা:** photos removed from `lib/homepage-catalog.ts` (cards fall back to the brand-50 glyph panel) and from `lib/services-data.ts` (`coverImage` dropped for both); `/services` cards now render an **initial-letter panel** (`bg-gradient-to-br from-brand-50 to-mist-50`, first character of `nameBn`) when `coverImage` is absent. Live `ServiceCard imageless compact` keeps the avatar-initial header + pills (privacy preserved).
  - Compatibility: the older "deep-forest emergency band" and "Featured untouched" bullets above are **historical** — current behavior is documented here. Verified: tsc clean; lint 0 errors (same 4 pre-existing warnings); build green **76/76**.
- New **community invite** section (`components/home/CommunityInviteSection.tsx`, mist, `border-b`): left column = eyebrow (gold dot + "ময়মনসিংহ কমিউনিটির জন্য"), heading **"আপনার সেবা, আপনার তথ্য — পৌঁছে দিন পুরো ময়মনসিংহে"**, supporting copy, a soft white friendly-message callout with Sparkles icon, primary CTA "আপনার তথ্য / সেবা যোগ করুন" → `/register` (emerald-700) and secondary "আমাদের সাথে যোগাযোগ করুন" → `/contact` (outline, bronze hairline); right column = compact 3×3 mosaic of 9 community categories (Home/GraduationCap/HeartHandshake/ShoppingBag/Briefcase/PenLine/Newspaper/Wrench/Store lucide icons, white tiles, brand-50 icon chips, hover bronze). `Reveal` stagger (0/120ms). Mobile: stacked single column copy → 3-across compact tiles, ≥44px CTAs, no overflow.