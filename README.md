# Mymensingh Sheba

ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায় — বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও রক্তদাতা।

## Stack

- Next.js 15 (App Router, `output: 'standalone'`)
- React 19, TypeScript 5.9 (strict)
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + RLS) via `@supabase/ssr`
- lucide-react, motion, class-variance-authority

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:

   ```
   npm install
   ```

2. Configure environment variables — copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key (optional for UI preview; required for working login, OTP, and data persistence):

   ```
   NEXT_PUBLIC_SUPABASE_URL=""
   NEXT_PUBLIC_SUPABASE_ANON_KEY=""
   SUPABASE_SERVICE_ROLE_KEY=""
   BREVO_API_KEY=""
   ADMIN_NOTIFICATION_EMAIL=""
   EMAIL_FROM=""
   APP_BASE_URL="https://mymensinghsheba.com"
   ADMIN_EMAIL_WORKER_SECRET=""
   BREVO_WEBHOOK_SECRET=""
   ```

   `/admin` uses a signed-in Supabase admin account by default. The
   local-only development auth bypass is disabled by default. For isolated
   local UI work only, `DEV_AUTH_BYPASS=1` in `.env.local` skips normal login;
   it is disabled on hosted Vercel environments and is never an authorization
   substitute. Never point it at production or shared customer data.

   For immediate email/password registration without an email verification
   step, open Supabase Dashboard → Authentication → Providers → Email and turn
   off **Confirm email**. The `on_auth_user_created` database trigger creates
   the customer profile when Supabase creates the auth user; disabling
   confirmation lets Supabase also return an active session immediately.
   Without this project-level setting, Supabase intentionally returns no
   session and the app cannot safely sign the user in automatically.

   Important admin events are written to a durable Supabase outbox and sent
   asynchronously through Brevo. Set
   `BREVO_API_KEY`, `ADMIN_NOTIFICATION_EMAIL` (the administrator's Gmail),
   `EMAIL_FROM` (a sender address verified in Brevo), `APP_BASE_URL`,
   `ADMIN_EMAIL_WORKER_SECRET`, and `BREVO_WEBHOOK_SECRET` in the server
   environment. `BREVO_MIN_INTERVAL_MS` defaults to `12000` (five sends per
   minute) and can be set to the account's documented transactional limit,
   but is clamped to 1–60 seconds between messages. The API key must have access to Brevo Transactional Email
   (`transactional.email`) and the sender must be verified. Keep these
   server-only and never use `NEXT_PUBLIC_` names. A queue write is part of the
   source database transaction; later email provider failures do not change an
   already committed business operation or the in-app notification.

3. Run the dev server:

   ```
   npm run dev
   ```

## Database

The deployable schema, RLS policies, storage buckets, and triggers are in
`supabase/migrations/20261008000000_master_consolidated_schema.sql`. Apply it
to the Supabase project before enabling real login/registration. Then apply
newer incremental migrations in timestamp order; the admin audit log, for
example, is added by
`supabase/migrations/20261009000000_admin_audit_log.sql`. The older
`lib/supabase/schema.sql` is retained for reference and is not the canonical
deployment entry point.

Apply `supabase/migrations/20261009200000_emergency_contact_verification.sql`
after the audit-log migration. Public emergency directories only show contacts
that an admin has activated and documented with a verification source.
Apply `supabase/migrations/20261009220000_customer_support_conversations.sql`
to enable private dashboard messaging and scoped conversation replies.
Apply `supabase/migrations/20261009224500_customer_service_request_cancellation.sql`
to restrict customer service-request updates to cancellation of new/submitted
requests only.
Apply `supabase/migrations/20261009230000_customer_post_drafts.sql` to enable
private, per-category Supabase drafts for signed-in customers.
Apply `supabase/migrations/20261019200000_admin_email_delivery_tracking.sql`
if it has not already been applied, then apply
`supabase/migrations/20261022190000_admin_email_outbox.sql`. The outbox
migration is additive: it preserves the existing in-app `notifications`
system and existing delivery history. Database triggers enqueue one job for
each new service request, pending To-Let submission, report, and safety/payment
complaint in the same transaction as its source row. Duplicate database events
use a unique idempotency key. Routine contact messages and customer-facing
status notifications do not send email.

### cPanel worker and Brevo webhook

1. Add the server-only environment variables in the cPanel Node.js application
   configuration (or the private environment file used by the deployed Next.js
   process): `ADMIN_EMAIL_WORKER_SECRET` and `BREVO_WEBHOOK_SECRET`, each a
   different random secret. Do not add either to a `NEXT_PUBLIC_` variable.
   Restart the application after changing environment variables.
2. In cPanel → **Cron Jobs**, run this once every minute:

   ```cron
   * * * * * /usr/bin/curl -fsS -X POST "https://mymensinghsheba.com/api/admin-email-alerts/worker" -H "Authorization: Bearer REPLACE_WITH_ADMIN_EMAIL_WORKER_SECRET" -o /dev/null
   ```

   Replace the domain and secret with production values. This HTTP cron
   command is independent of the cron shell's working directory; the worker
   runs inside the deployed Next.js application. It handles up to 3 jobs per
   tick, serially, while a database lease prevents overlapping workers. A
   crashed request is reclaimed when its lease expires. Brevo `Retry-After`
   and transient HTTP/network failures are scheduled with bounded exponential
   backoff and jitter; permanent 4xx responses become `failed`.
3. In the Brevo Transactional → **Settings → Webhooks** screen, add
   `https://mymensinghsheba.com/api/admin-email-alerts/webhook`. Configure its
   Authorization header as `Bearer REPLACE_WITH_BREVO_WEBHOOK_SECRET` and
   subscribe to `delivered`, `deferred`, `blocked`, `softBounce`, `hardBounce`,
   and `error`. The endpoint checks the shared secret in constant time and
   deduplicates provider event IDs before changing a job. If the Brevo account
   does not offer custom webhook headers, do not expose the endpoint without
   authentication; configure an authenticated webhook proxy instead.
4. Sign in as an admin and open `/admin/email-deliveries` to inspect recent
   event IDs, attempts, next retry, sanitized error, Brevo message ID, provider
   acceptance, and delivery confirmation. `accepted_by_provider` is not
   equivalent to Gmail delivery. A `delivered` webhook is the provider's
   delivery event; it still cannot guarantee inbox placement rather than spam.
5. To enqueue a test message, sign in as an admin and POST
   `{"type":"test"}` to `/api/admin-email-alerts` with
   `Content-Type: application/json`. HTTP `202` means the durable test job was
   queued—not that Brevo accepted it or Gmail delivered it. Wait for the cron
   and inspect the event on `/admin/email-deliveries`, then check the Gmail
   inbox and spam folder.

For a concurrency verification in a staging database, create 20–50 distinct
valid source events (not duplicate copies of a single event), collect their
`event_id` values from `admin_email_outbox`, then run two worker HTTP requests
at the same time. The worker lock serializes invocations and `SKIP LOCKED`
claims jobs atomically. Verify that each event ID reaches
`accepted_by_provider`, `delivered`, or a visible terminal `failed` state and
that there are no duplicate `idempotency_key` values:

```sql
SELECT event_id, related_type, status, attempt_count, provider_message_id,
       last_error, created_at, sent_at, delivered_at
FROM public.admin_email_outbox
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at, event_id;

SELECT idempotency_key, COUNT(*)
FROM public.admin_email_outbox
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
```

Do not load-test by sending 50 real emails to the production Gmail inbox.
Verify retries using a staging Brevo key or controlled transient provider
response; verify the delivered/blocked/bounce paths with Brevo's webhook test
facility. No production credentials or message payloads are written to logs.

Signed-in community post drafts are stored in Supabase, scoped by customer and
post category; anonymous drafts are local to the browser. Images must be
reselected when a draft is restored.
The customer dashboard activity feed is assembled from the customer's existing
posts, service requests, and notifications and does not introduce a second
activity store.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (typecheck + build) and prepare standalone assets
- `npm run start` — start the production standalone server
- `npm run lint` — ESLint