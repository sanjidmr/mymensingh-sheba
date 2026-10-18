# Admin Step 10 — Analytics, Auditability, and Final QA

## Analytics implementation

`/admin/analytics` is linked in the Business & Analytics navigation group. It
uses the authenticated admin's server-side Supabase client to call
`get_admin_analytics(p_from, p_to)`. The RPC checks `public.is_admin()` itself,
rejects invalid ranges longer than 367 inclusive calendar days, uses UTC date
bounds, and returns aggregates only; customer contact details and raw event
rows are not sent to the page.

The aggregates use these existing sources:

- `profiles`: all-time customer total and date-bounded new customer counts.
- `community_posts`: news, job, and buy/sell counts by moderation status.
- `tolet_listings`: date-bounded property-type and status counts.
- `service_listings`: date-bounded category and active/inactive counts.
- `service_requests`: counts by `service_slug` and status. Tutor enquiries use
  the existing `home-tutor` service slug; there is no separate tutor
  applications table.
- `tolet_requests`, `vehicle_requests`, and `blood_requests`: recorded requests
  by actual status.
- `blood_donor_profiles`: current status and the recorded `is_available` flag;
  this is a current snapshot, not date-bounded.
- The existing listing, tutor, donor, staff, and community-post report tables:
  recorded report counts by category and status.
- `tolet_listing_events`: recorded views, button clicks, favorites, and shares.
  Clicks are not represented as calls, bookings, or completed services.
- `contact_messages`, `notifications` (admin-targeted only), and
  `admin_audit_log`: support status, admin notification read state, and logged
  admin actions for the selected time range.

`/admin/approvals` combines pending community posts, To-Let listings and owner
profiles, tutor and donor profiles, and customer-owned WiFi/coaching listings.
It calls existing moderation actions; its admin-only queue RPC is defined in
`20261018000900_admin_approvals_and_financial_records.sql`. `/admin/users`
links to a server-side detail view of each account's service profiles, posts,
listings, and submitted requests. The same migration creates the RLS-protected
manual financial ledger and its service-level aggregate function.

The admin financial-management page stores manual income and due entries in
`admin_financial_records`, with an admin-only RLS policy and service-level
aggregates. These are bookkeeping records, not payment processing or verified
transactions; revenue is never inferred from listing prices, fee rules, or
requests.

## Security and auditability

- `/admin/analytics` remains behind the existing server-side `requireAdmin()`
  layout. The aggregate RPC independently verifies `public.is_admin()` and is
  executable by authenticated users only.
- Existing role controls remain admin-only. The profile policies and
  `profiles_admin_only_fields()` database trigger prevent customer self-service
  role, verification, and account-status changes. Admin role changes continue
  through the existing protected server actions.
- The existing `admin_audit_log` trigger set captures admin changes to profiles,
  listings, requests, moderation records, CMS settings, and directory content.
  This migration adds the worker assignment `profile_id` to the safe state
  allowlist and adds auditing for `contact_message_replies`; it never stores
  reply bodies or free-form admin notes.
- The development auth bypass is now private-env, local `next dev` only and is
  disabled on Vercel. It must not be used with shared or production data.
- Static review did not identify a high-confidence vulnerability in the
  reviewed changes. Deployed RLS, Storage policies, credentials, and Supabase
  project configuration cannot be confirmed from this local workspace.

The audit schema has no dedicated safe moderation-reason field. Free-form
rejection reasons and internal notes are not copied into audit state; the
existing affected-record ID, actor, operation, timestamp, and allowlisted
state changes are retained.

## Deployment and verification limits

Apply migrations in timestamp order, including
`20261012000000_public_cms_content_policy.sql` and
`20261012100000_admin_analytics.sql`, before relying on the new RPC, support
reply audit trigger, or public CMS reads. Apply
`20261018000900_admin_approvals_and_financial_records.sql` after the preceding
timestamped migrations before using the unified approval queue or financial
ledger. The migrations were inspected but could not be applied against the
production Supabase project in this environment.

Local validation performed for this step:

- TypeScript `npx tsc --noEmit`: passed after the production build completed.
- `npm run lint`: passed with two existing `<img>` optimization warnings in
  `app/admin/requests/[id]/page.tsx` and
  `components/home-moving/MovingRequestWizard.tsx`.
- `npm run build`: passed.
- Built app smoke check: `/admin/analytics` and `/admin` both returned the
  expected unauthenticated redirect to `/login`.
- No test script is defined in `package.json`; authenticated database queries,
  RLS behavior, migration execution, and admin-session data loading remain
  unverified.
