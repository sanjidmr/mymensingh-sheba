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
   TELEGRAM_BOT_TOKEN=""
   TELEGRAM_CHAT_ID=""
   ADMIN_TELEGRAM_WORKER_SECRET=""
   ORDER_TELEGRAM_DELIVERY_MODE="api"
   ORDER_TELEGRAM_WEBHOOK_SECRET=""
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

   The default `ORDER_TELEGRAM_DELIVERY_MODE="api"` saves requests to Supabase
   and awaits a Telegram send. To use the optional database webhook instead,
   set it to `webhook`, set a random `ORDER_TELEGRAM_WEBHOOK_SECRET`, and add
   Supabase webhooks for `service_requests`, `vehicle_requests`,
   `vehicle_bookings`, and `tolet_listings` to `/api/order/webhook` with the
   `x-webhook-secret` header. Use INSERT for the first three tables; for
   `tolet_listings`, enable INSERT and UPDATE to include resubmissions. Use one
   delivery mode at a time. Telegram failures are logged and do not undo a
   saved request. Other admin events use the durable Telegram outbox. Keep all
   Telegram secrets and the Supabase service-role key server-only; never use
   `NEXT_PUBLIC_` names. `.env.local` is ignored by Git. Supabase Auth
   email/verification settings remain separate from these admin notifications.

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
Apply the existing incremental migrations in timestamp order, including the
historical `20261022190000_admin_email_outbox.sql`,
`20261023214000_admin_email_notification_coverage.sql`,
`20261023214100_admin_email_provider_http_status.sql`,
`20261108000000_vehicle_bookings.sql`, and
`20261109000000_vehicle_booking_admin_email.sql` migrations if they have not
already been applied. These are retained migration history; the later
`20261110120000_telegram_notifications.sql` migration renames the outbox and
worker objects, removes provider-specific schema, and disables the old booking
outbox trigger. Apply it after the vehicle-bookings table and all earlier
migrations, then apply
`supabase/migrations/20261110130000_direct_order_telegram_notifications.sql`
to disable duplicate generic service-request and To-Let outbox events and
enable full old-row data for To-Let update webhooks. Do not edit or delete
migrations that have already been applied.

Database triggers enqueue admin Telegram alerts transactionally for reports,
safety/payment complaints, customer-submitted service listings, community
posts, vehicle and blood requests, and pending To-Let-owner, tutor, and donor
profiles. Service, To-Let listing, and vehicle order APIs send detailed
Telegram notifications after their database writes. A Telegram failure is
logged and does not undo a saved database record.

### Telegram worker

Build the application with Node.js 22 from the project root. The project
`.npmrc` includes development dependencies even when npm runs with
`NODE_ENV=production`; this is required because `next.config.ts` needs
TypeScript during `next build`. Install dependencies with `npm ci` (do not use
`npm ci --omit=dev`), then run:

```sh
CIRCLE_NODE_TOTAL=1 NEXT_PRIVATE_BUILD_WORKER=1 npm run build
```

The `postbuild` script copies `public` and `.next/static` into `.next/standalone`.
Keep the cPanel application root and startup command aligned with the existing
deployment configuration; the project startup script is
`node .next/standalone/server.js`.

1. Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and a separate random
   `ADMIN_TELEGRAM_WORKER_SECRET` to the server environment. Restart the
   application after changing environment variables. Never expose these values
   with `NEXT_PUBLIC_` names. For Vercel Cron, set `CRON_SECRET` to the same
   value as `ADMIN_TELEGRAM_WORKER_SECRET`; the worker accepts authenticated
   GET requests as well as POST.
2. In cPanel → **Cron Jobs**, run this once every minute:

   ```cron
   * * * * * /usr/bin/curl -fsS -X POST "https://mymensinghsheba.com/api/admin-telegram-alerts/worker" -H "Authorization: Bearer YOUR_WORKER_SECRET" -o /dev/null
   ```

      Replace the domain and secret with production values. The worker handles up
      to 3 queued notifications per run and retries transient failures with bounded
      exponential backoff. On Vercel, add a Cron Job for
      `/api/admin-telegram-alerts/worker`; Vercel calls it with GET.
3. To queue a Telegram test, sign in as an admin and POST
   `{"type":"test"}` to `/api/admin-telegram-alerts` with
   `Content-Type: application/json`, then run the worker or wait for the cron.

In staging, inspect recent jobs in `admin_telegram_outbox`. The worker lock
serializes invocations and `SKIP LOCKED` claims jobs atomically:

```sql
SELECT event_id, related_type, status, attempt_count, last_error, created_at, sent_at
FROM public.admin_telegram_outbox
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at, event_id;
```

Do not load-test with a large number of real Telegram notifications in the
production chat. No production credentials or full message payloads are written
to logs.
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