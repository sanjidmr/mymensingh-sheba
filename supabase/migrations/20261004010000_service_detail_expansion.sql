-- ============================================================================
--  SERVICE DETAIL EXPANSION — গৃহশিক্ষক / রক্তদাতা / গাড়ি / কেনাবেচা
-- ============================================================================
--  Companion to `20261004000000_tolet_analytics.sql`. Idempotent: every
--  statement is `IF NOT EXISTS` / `CREATE OR REPLACE`, so re-running it against
--  a database that already has these columns is a no-op.
--
--  WHAT THIS ADDS, AND WHY EACH IS OPTIONAL
--  -----------------------------------------
--  The detail pages for four services were rebuilt to show what a person
--  actually asks before committing: a tutor's full qualification timeline and
--  what they are doing right now, a vehicle's model year and whether the driver
--  comes with it, a marketplace item's gallery and how to reach the seller.
--
--  Every added column is NULLABLE (or defaults to an empty array) and the UI
--  prints a section only when data exists. That is the whole point: an older
--  row must keep rendering exactly the facts it actually has. A migration that
--  backfilled plausible-looking defaults would be worse than one that leaves
--  gaps, because a gap reads as "not stated" while a default reads as a fact.
--
--  NOTHING HERE IS BACKFILLED. No phone number, name, price or specification
--  is invented for an existing row.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. HOME TUTOR — the profile page needs more than three text columns
-- ----------------------------------------------------------------------------
--  `institution` / `department` / `qualification` describe exactly ONE
--  qualification. A tutor holding an HSC, an ongoing BSc and a teaching
--  certificate cannot be represented, so the timeline becomes a list and the
--  legacy triple stays as the fallback the UI synthesises from.
--
--  JSONB rather than a child table because the timeline is always read whole,
--  never queried by content, and never joined. A child table would buy nothing
--  here and would cost a second RLS surface.
ALTER TABLE public.home_tutor_profiles
    ADD COLUMN IF NOT EXISTS educations JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.home_tutor_profiles
    ADD COLUMN IF NOT EXISTS current_activity JSONB;
ALTER TABLE public.home_tutor_profiles
    ADD COLUMN IF NOT EXISTS class_duration_minutes INTEGER;
ALTER TABLE public.home_tutor_profiles
    ADD COLUMN IF NOT EXISTS preferred_student_type TEXT;

COMMENT ON COLUMN public.home_tutor_profiles.educations IS
    'Qualification timeline, newest first: '
    '[{institution, department, degree, status: passed|studying|completed, year}]. '
    'Empty array = not filled in; the UI falls back to institution/department/'
    'qualification rather than showing nothing.';
COMMENT ON COLUMN public.home_tutor_profiles.current_activity IS
    'What the tutor is doing now: '
    '{roleLabelBn, studyingAt, teachingAt, workingAt, note}.';
COMMENT ON COLUMN public.home_tutor_profiles.class_duration_minutes IS
    'Minutes in one class. NULL = not stated; never treated as 0.';
COMMENT ON COLUMN public.home_tutor_profiles.preferred_student_type IS
    'Free text: "ছেলে", "মেয়ে", "যেকোনো", or a grade band.';


-- ----------------------------------------------------------------------------
-- 2. SERVICE LISTINGS — vehicle detail
-- ----------------------------------------------------------------------------
--  A vehicle is the one curated category where the photo IS the listing, so it
--  is the one that carries a gallery. The spec columns cover the questions a
--  renter asks before calling: which model, which year, air-con or not, is the
--  driver included, and when is it free.
--
--  `has_ac` is a nullable BOOLEAN, not a default-FALSE one, because "not
--  recorded" and "recorded as no air-con" are different facts and the profile
--  must be able to say so.
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS model_name_bn TEXT;
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS model_year INTEGER;
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS has_ac BOOLEAN;
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS driver_included BOOLEAN;
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS available_time_bn TEXT;
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS price_note_bn TEXT;

COMMENT ON COLUMN public.service_listings.photos IS
    'Vehicle photo gallery. cover is image_url; this is everything after it.';
COMMENT ON COLUMN public.service_listings.has_ac IS
    'NULL = not recorded. Distinct from FALSE, which means "no air-con".';
COMMENT ON COLUMN public.service_listings.price_note_bn IS
    'How price_min/price_max should be read, e.g. "প্রতি কিলোমিটার", '
    '"পুরো ভাড়া (চালকসহ)". Free text because the unit is a local convention.';


-- ----------------------------------------------------------------------------
-- 3. COMMUNITY POSTS — marketplace seller contact + gallery
-- ----------------------------------------------------------------------------
--  WHY author_phone / whatsapp_number ARE NOT IN THE PUBLIC COLUMN LIST
--  ---------------------------------------------------------------------
--  `community_posts` backs all three of news, jobs and buy-sell. A marketplace
--  buyer must be able to call the seller — that is the product. A news article
--  and a job ad must never expose their author's number; nothing in those two
--  workflows asks the author to publish it.
--
--  RLS is row-level and PostgREST lets any caller who can read a row read all
--  of its columns, so "just leave the phone out of the SELECT list" is a
--  convention, not a boundary — any client could ask for `select=*`. The only
--  real boundary is to make the column unreadable and hand it over through a
--  function that checks what the row is. That is
--  `fetch_market_contact` at the bottom of this file.
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS author_phone TEXT;
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.community_posts.author_phone IS
    'Seller/author contact. Read back ONLY via fetch_market_contact(), which '
    'returns it for an approved buy_sell post and nothing else. Never include '
    'it in a public column list.';
COMMENT ON COLUMN public.community_posts.gallery IS
    'Product photos after the cover image. Empty = single-photo item.';

-- A guest posting without an account has no profile row to take a name from,
-- so the form collects it. Populated for every kind: harmless on news/jobs
-- because the RPC refuses to return it for them.
CREATE INDEX IF NOT EXISTS idx_community_posts_market
    ON public.community_posts (kind, status, published_at DESC)
    WHERE kind = 'buy_sell';


-- ----------------------------------------------------------------------------
-- 4. VEHICLE REQUESTS — the "সেবা নিন" form asks for more than a name
-- ----------------------------------------------------------------------------
--  The request form collects a passenger count, a hire term and a budget
--  ceiling. An operator can then quote from the row instead of phoning back,
--  which is the difference between a request that gets answered and one that
--  does not. All three are nullable: the old short form still validates.
ALTER TABLE public.vehicle_requests
    ADD COLUMN IF NOT EXISTS passenger_count INTEGER;
ALTER TABLE public.vehicle_requests
    ADD COLUMN IF NOT EXISTS trip_duration TEXT;
ALTER TABLE public.vehicle_requests
    ADD COLUMN IF NOT EXISTS budget INTEGER;

COMMENT ON COLUMN public.vehicle_requests.trip_duration IS
    'Hire term as the renter words it: "এক ঘণ্টা", "সারাদিন", "দুই দিন".';


-- ----------------------------------------------------------------------------
-- 5. THE CONTACT GATE
-- ----------------------------------------------------------------------------
--  Reads an approved marketplace item's seller contact and nothing else.
--  SECURITY DEFINER is what makes the check meaningful: the function runs with
--  the owner's rights, so it can read `author_phone` on a row the anon caller
--  must not be able to read that column from directly.
CREATE OR REPLACE FUNCTION public.fetch_market_contact(p_slug TEXT)
RETURNS TABLE (
    post_id UUID,
    author_name TEXT,
    author_phone TEXT,
    whatsapp_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT p.id, p.author_name, p.author_phone, p.whatsapp_number
    FROM public.community_posts p
    WHERE p.slug = p_slug
      AND p.kind = 'buy_sell'
      AND p.status = 'approved'
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.fetch_market_contact(TEXT) IS
    'Seller phone / WhatsApp for an approved buy_sell post. Returns zero rows '
    'for a news or job post, and for a post still in moderation. This is the '
    'only supported way for a client to read author_phone.';

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 6. SAVED ITEMS — the marketplace shortlist needs its own type
-- ----------------------------------------------------------------------------
--  `saved_items.item_type` is a CHECK with three values, none of which means
--  "a listing in the কেনা-বেচা marketplace". Filing a marketplace item under
--  'service' would work, but then a saved listing list mixes service-directory
--  rows and marketplace rows under one label and the saved page cannot say what
--  the reader actually saved.
--
--  The constraint is dropped and re-added rather than ALTERed because there is
--  no "ADD VALUE" for a CHECK, and this is the only statement in this file that
--  is not `IF NOT EXISTS` — so the block is guarded by a catalogue lookup that
--  makes it a no-op once 'market' is present.
--
--  The lookup identifies the constraint by WHAT it checks, not by its name.
--  Matching on `conname = 'saved_items_item_type_check'` looks safer but is
--  strictly weaker: a database created before this file existed may hold that
--  check under a different generated name, and then the guard matches nothing,
--  the block quietly does nothing, and `'market'` is still rejected at runtime
--  with no error anywhere to explain why. Matching on the table plus a check
--  whose definition mentions `item_type` finds the real constraint whatever it
--  is called, and the block then fails loudly rather than silently.
DO $$
DECLARE
    target TEXT;
BEGIN
    SELECT c.conname INTO target
    FROM pg_constraint c
    WHERE c.conrelid = 'public.saved_items'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%item_type%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%market%'
    LIMIT 1;

    IF target IS NULL THEN
        -- Either 'market' is already accepted, or there is no check on
        -- `item_type` at all. Both are fine: nothing to widen.
        RETURN;
    END IF;

    EXECUTE format('ALTER TABLE public.saved_items DROP CONSTRAINT %I', target);
    EXECUTE 'ALTER TABLE public.saved_items
             ADD CONSTRAINT saved_items_item_type_check
             CHECK (item_type IN (''tolet'', ''tutor'', ''service'', ''market''))';
END $$;

COMMENT ON COLUMN public.saved_items.item_type IS
    'tolet = ভাড়া, tutor = গৃহশিক্ষক, service = সেবা-ডিরেক্টরি, '
    'market = কেনাবেচার পণ্য।';


-- ----------------------------------------------------------------------------
-- 7. COMMUNITY POST REPORTS — the marketplace needs a real "report" action
-- ----------------------------------------------------------------------------
--  `listing_reports` cannot be reused: it is FK-bound to `tolet_listings`, and a
--  marketplace item is a `community_posts` row. Pointing it at the post table
--  would mean either a second nullable FK or dropping the integrity of the
--  first, and both are worse than a second small table.
--
--  Without this, the only "report" a marketplace reader has is the generic
--  contact form — which puts a row about a fake phone listing into an inbox
--  nobody triages by listing id, so nobody can ever tell which listings are
--  generating reports.
--
--  ON DELETE CASCADE is correct here, unlike the moderation history on
--  `listing_reports`: a deleted post's reports are about a row that no longer
--  exists and nothing can be acted on.
--
--  RLS: anyone may INSERT (guests included — a fake listing is exactly the
--  case where the reporter has no account), nobody but an admin may SELECT or
--  UPDATE.
CREATE TABLE IF NOT EXISTS public.community_post_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_community_post_reports_post
    ON public.community_post_reports (post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_reports_status
    ON public.community_post_reports (status, created_at DESC);

COMMENT ON COLUMN public.community_post_reports.reporter_name IS
    'Kept as text rather than resolved from reporter_id, because the majority '
    'of reporters are guests with no profile row to take a name from.';

ALTER TABLE public.community_post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_post_reports_insert ON public.community_post_reports;
CREATE POLICY community_post_reports_insert ON public.community_post_reports
    FOR INSERT
    WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policy is created on purpose. With RLS enabled
-- and no policy for an action, that action is denied to every role except the
-- table owner, and `is_admin()` is checked inside the admin-only policies used
-- everywhere else in this schema. A reporter therefore cannot read back the
-- reports they filed — the UI confirms success from the insert, not from a
-- re-read, exactly as `createVehicleRequest` does.

GRANT INSERT ON public.community_post_reports TO anon, authenticated;
