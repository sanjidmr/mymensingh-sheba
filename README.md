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
   ```

   `/admin` uses a signed-in Supabase admin account by default. The
   local-only development auth bypass is disabled by default. For isolated
   local UI work only, `DEV_AUTH_BYPASS=1` in `.env.local` skips normal login;
   it is disabled on hosted Vercel environments and is never an authorization
   substitute. Never point it at production or shared customer data.

   Important admin events can also send email through Brevo. Set
   `BREVO_API_KEY`, `ADMIN_NOTIFICATION_EMAIL` (the administrator's Gmail),
   `EMAIL_FROM` (a sender address verified in Brevo), and `APP_BASE_URL` in the
   server environment. Keep these server-only and never use `NEXT_PUBLIC_`
   names. Email is best-effort and cannot change the result of the underlying
   database operation.

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
after the other incremental migrations to enable deduplicated Brevo alert
delivery tracking.
To verify an alert, configure the four Brevo variables and the migration, restart
the server, then submit a new service request, pending To-Let listing, report,
or safety/payment complaint. Confirm the server log records delivery and check
the configured Gmail inbox (including spam). Routine contact messages and
customer-facing status notifications do not send email. A build never attempts
real delivery. Brevo rate-limit responses are retried a bounded number of times;
failed deliveries are recorded for a later retry of the same event.

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