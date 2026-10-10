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
   ```

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

Signed-in community post drafts are stored in Supabase, scoped by customer and
post category; anonymous drafts are local to the browser. Images must be
reselected when a draft is restored.
The customer dashboard activity feed is assembled from the customer's existing
posts, service requests, and notifications and does not introduce a second
activity store.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (typecheck + build)
- `npm run start` — start production server
- `npm run lint` — ESLint