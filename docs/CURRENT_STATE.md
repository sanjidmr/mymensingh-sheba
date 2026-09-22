# Mymensingh Sheba — Current State

**Date:** 2026-09-22
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
- `npm run lint` — clean (0 errors, 3 pre-existing warnings)
- `npm run build` — passes; all 52 routes compile (including new `/admin/users`, `/admin/settings`, `/admin/reports`, `/admin/reviews`, `/admin/notifications`)