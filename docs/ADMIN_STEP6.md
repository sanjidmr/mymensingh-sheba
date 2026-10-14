# Admin Step 6: Home Service Requests and Workers

## Service requests

- The admin queue reads the existing `service_requests` table and is scoped to
  `kajer-bua`, `electrician`, `plumber`, `basha-paltano`, `ac-fridge`, plus the
  legacy `home-moving` slug already handled by the application.
- Search uses the request UUID, submitted contact name, phone, service slug, and
  assigned title. Status, service, area, worker/unassigned, and Dhaka-local
  submission-date filters run in Supabase; results use database pagination.
- The detail route `/admin/requests/[id]/operations` shows the real request,
  customer/contact snapshot, customer profile ID, location, preferred time,
  description, assignment, moderation notes, and supported moving fields.
- Status and notes are saved by a verified-admin Server Action. The existing
  customer submission form and ownership (`customer_id`) are unchanged.
- Customer in-app notifications are attempted only after a persisted status or
  assignment change. A failed notification is reported as a warning after the
  saved request is refreshed; this action does not send SMS, email, WhatsApp,
  or contact either party.
- The exact database statuses are `new`, `submitted`, `reviewing`, `assigned`,
  `contacted`, `in_progress`, `completed`, `cancelled`, and `rejected`. Summary
  counts are computed from those existing values.

## Worker profiles

- The existing `staff_profiles` directory is reused for `kajer-bua`,
  `electrician`, and `plumber`, with fields including `name_bn`, `title_bn`,
  `image_url`, `areas`, `work_types`, `experience_years`, `availability`,
  `is_emergency`, salary/rate fields, `about_bn`, `phone_private`,
  `is_verified`, and `is_active`.
- Worker list/search/filter/pagination does not select `phone_private`.
  Protected worker details load through the existing admin-gated
  `fn_admin_staff_profile(p_id)` RPC; saves, activation/deactivation, and
  deletion use verified-admin Server Actions and existing RLS.
- Assignment validates an active worker, exact service category, non-busy
  availability, and declared area coverage when the request has an area.
  `service_requests.profile_id` is `TEXT`, not a foreign key, so assignment
  history is not a relational/auditable history.
- Removing a worker is blocked if service requests or profile reports refer to
  the worker. Deactivation is the safe alternative for referenced profiles.

## Schema and audit limitations

- The worker schema now has an `ac-fridge` category (এসি ও ফ্রিজ মেরামত) —
  added by `supabase/migrations/20261014100000_staff_ac_fridge_category.sql`, so
  those requests can be assigned an `ac-fridge` worker. `basha-paltano` still has
  no worker category; those requests support status/notes but cannot be assigned
  a mismatched worker.
- The service-request audit trigger records status changes, but its field
  allowlist omits `profile_id` and `admin_notes`. There is no reliable previous
  assignment history or internal-note audit. No migration was applied.
- Minimal future extension, only if assignment history is required: add an
  append-only `service_request_assignment_events` table with a request FK,
  nullable old/new worker references, admin ID, timestamp, and reason; protect
  inserts/reads with admin RLS. Assignment and event writes should be atomic
  through a database function/transaction.

## Validation

- TypeScript (`npx tsc --noEmit`) and focused ESLint passed.
- Live Supabase persistence, customer RLS-denial, and notification-failure
  behavior require a configured Supabase project and authenticated test
  accounts; they were not exercised in this workspace.
