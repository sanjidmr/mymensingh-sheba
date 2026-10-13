# Admin Step 4: To-Let and Home Tutor

## Routes and data

- `/admin/tolet` keeps the existing fee configuration and analytics and now
  loads listing records with database-side status, property type, area, date,
  and search filters plus bounded pagination and exact status counts.
- `/admin/tolet/[id]` remains the review/detail page and uses admin Server
  Actions for status changes. `/admin/tolet/[id]/edit` retains the existing
  category-aware wizard. `/admin/tolet/new` creates a listing owned by the
  signed-in admin account, never by an impersonated customer.
- `/admin/verifications` is a PII-safe, database-paged tutor directory.
  `/admin/verifications/[id]` reads private profile fields only through the
  existing `fn_admin_tutor_profile` admin-gated RPC.
- `/admin/tutor-requests` and `/admin/tutor-requests/[id]` manage only
  `service_requests` rows whose `service_slug` is `home-tutor`. A request links
  to a tutor only when its stored `profile_id` is a valid UUID and that exact
  profile exists; `profile_title` remains a text snapshot, not a foreign key.

## Schema and safeguards

- To-Let records use `tolet_listings` and statuses `draft`, `pending_review`,
  `approved`, `rejected`, `unavailable`, `suspended`, and `archived`.
  `rejection_reason` stores the owner-facing explanation. Archival is used
  instead of adding a hard-delete workflow because the listing has cascading
  request/report relationships.
- Tutor records use `home_tutor_profiles` and statuses `draft`,
  `pending_approval`, `approved`, `rejected`, `paused`, and `suspended`.
  `rejection_reason` is the supported way to return a profile for edits; the
  schema has no separate `needs_edit` state.
- Tutor requests use `service_requests` columns including `profile_id`,
  `profile_title`, `service_type`, `contact_name`, `contact_phone`, `details`,
  `status`, and timestamps. The request status is constrained to the existing
  service-request status set.
- Protected changes re-check admin identity on the server and remain subject
  to existing RLS. The existing `admin_audit_log` triggers capture the actor,
  timestamp, and status changes for the affected tables. The existing
  notifications table is used for To-Let and tutor profile moderation; no
  contact or call is claimed for a tutor request status update.
- No migration was added. Tutor profiles cannot be created as admin-owned
  profiles safely through the current schema: `user_id` is required and unique,
  with no separate managed-by/admin ownership field. An admin create flow is
  intentionally deferred rather than binding the profile to a customer or
  reusing an admin account. The existing To-Let wizard edit path is reused.

## Verification

`npx tsc --noEmit`, focused ESLint for the changed implementation files, and
`npm run build` pass. Authenticated Supabase reads/writes and RLS denial tests
require a configured admin session and were not available in this run.
