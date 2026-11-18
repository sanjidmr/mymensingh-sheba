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
   NEXT_PUBLIC_SITE_URL="https://mymensinghsheba.com"
   SUPABASE_SERVICE_ROLE_KEY=""
   TELEGRAM_BOT_TOKEN=""
   TELEGRAM_CHAT_ID=""
   ADMIN_TELEGRAM_WORKER_SECRET=""
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

   All admin Telegram alerts are queued by PostgreSQL triggers and delivered
   by the authenticated worker. Telegram failures never roll back a saved
   account, post, request, or message. Keep the bot token, chat ID, worker
   secret, and Supabase service-role key server-only; never use `NEXT_PUBLIC_`
   names for secrets. `.env.local` is ignored by Git. Supabase Auth
   email/verification settings remain separate from these admin notifications.

3. Run the dev server:

   ```
   npm run dev
   ```

   Development uses `.next-dev` so it can run alongside a production build
   without overwriting the build's route chunks.

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
enable full old-row data for To-Let update webhooks. Apply
`supabase/migrations/20261113010000_public_event_telegram_notifications.sql`
after it to queue detailed notifications for submitted community posts,
To-Let listings and profiles, user-owned service listings, contact messages,
customer support replies, and complaints. Apply
`supabase/migrations/20261114020000_vehicle_booking_redesign.sql` to align the
vehicle booking table with the current car/auto/CNG form and remove the legacy
required current-address column. Then apply
`supabase/migrations/20261114040000_admin_telegram_complete_event_coverage.sql`
to queue every requested event, including account creation/deletion, all
service request tables, any community-post type, and rental-listing deletion.
Apply subsequent migrations in timestamp order, including
`supabase/migrations/20261116020000_admin_telegram_all_service_request_statuses.sql`,
which adds coverage for service requests inserted with statuses other than
`new`, and
`supabase/migrations/20261118000000_customer_account_pagination_indexes.sql`,
which supports bounded, cursor-paginated reads of customer requests and saved
items.
Do not edit or delete migrations that have already been applied.

### Reliability checks

- `GET https://mymensinghsheba.com/api/health` checks that the Supabase
  PostgREST/database endpoint is reachable. It returns HTTP 200 when healthy
  and HTTP 503 when unavailable; it does not expose credentials or database
  contents.
- On cPanel, open **Setup Node.js App**, select the deployed Nexus application,
  and inspect its application/error logs. Depending on the hosting provider's
  cPanel integration, these may also be available under **Metrics → Errors**.
  The structured server-side `upstream.request_*`,
  `auth.guard_verification_failed`, and `health.database_check_failed` events
  include status/reason and duration but never tokens or request query strings.
- Login/password and refresh-token events are issued directly between the
  browser and Supabase Auth. Check those in the Supabase Dashboard under
  **Logs → Auth**; they do not pass through the cPanel application process.
  The browser also emits structured `auth.login_*`, `auth.token_refreshed`, and
  `auth.logout_*` events in its developer console; these do not include email,
  user ID, or token values.

Database triggers enqueue admin Telegram alerts transactionally for reports,
all contact messages, customer support replies and complaints, community posts,
customer-submitted
service listings, To-Let listings, and pending To-Let-owner, tutor, and donor
profiles. The complete-coverage migration adds transactional outbox events for
new accounts, all service requests/bookings, and deletions. The worker is the
only normal Telegram sender; its delivery retries do not undo a saved record.

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
   with `NEXT_PUBLIC_` names. `TELEGRAM_CHAT_ID` may contain multiple
   comma-separated numeric chat IDs or `@channel` usernames. For Vercel Cron,
   set `CRON_SECRET` to the same value as `ADMIN_TELEGRAM_WORKER_SECRET`; the
   worker accepts authenticated GET requests as well as POST.
2. In cPanel → **Cron Jobs**, run this once every minute:

   ```cron
   * * * * * /usr/bin/curl -fsS -X POST "https://mymensinghsheba.com/api/admin-telegram-alerts/worker" -H "Authorization: Bearer YOUR_WORKER_SECRET" -o /dev/null
   ```

      Replace the domain and secret with production values. The worker handles up
      to 3 queued notifications per run and makes up to 3 retries (4 attempts
      total) for transient failures. Telegram `retry_after` is honored for
      rate-limited requests. On Vercel Pro, configure a Cron Job for
      `/api/admin-telegram-alerts/worker` every minute; on Vercel Hobby, use an
      external scheduler because its Cron minimum interval is once per day.
      Configure an equivalent once-per-minute scheduler on other hosts.
3. Sign in as an admin and open **Admin → Settings → Telegram notification
   test**. Use **Bot ও chat যাচাই** to call Telegram `getMe`, verify each
   configured chat with `getChat`, and send a verification message, or
   **সব event-এর test পাঠান** to send sample messages for each event type. The
   test endpoint returns Telegram's `ok`, `error_code`, and `description`.

To check a token and discover chats that have sent the bot an update locally,
run `node --env-file=.env.local scripts/check-telegram.mjs`. Start the bot in
a private chat or add it to a group/channel and generate an update first.
Group and channel IDs are usually negative; the script prints only chat
metadata, not message contents or the bot token. `getUpdates` is unavailable
while a webhook is configured; in that case inspect the webhook's incoming
updates instead.

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