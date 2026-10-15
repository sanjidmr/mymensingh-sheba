-- ====================================================================
-- DIRECTORY & CATALOG UPGRADE
-- ====================================================================
-- Upgrades the admin-curated "ডিরেক্টরি ও ক্যাটালগ" directories:
--
--   * কোচিং সেন্টার  — teachers (নাম/বিষয়/যোগ্যতা) + batch announcements
--   * WiFi প্রদানকারী — packages (স্পিড/দাম/অফার) that visitors can compare
--   * বাস টিকিট তথ্য — an explicit operator column, kept on the listing row
--
-- And adds a shared review/rating table for coaching + wifi so visitors can
-- submit star ratings and written reviews, with the aggregate kept accurate by
-- a trigger rather than by client maths.
--
-- Design notes
--  * `service_listings` stays the single parent row. The new child tables all
--    FK to it with ON DELETE CASCADE, so removing/republishing a listing stays
--    one admin action.
--  * Ratings live on `service_listings.rating_avg` / `rating_count`, recomputed
--    from PUBLISHED reviews by `refresh_directory_rating`. A client can never
--    write those columns to inflate a score — only the trigger does.
--  * ONE review per (category, listing, author). Enforced by a UNIQUE constraint
--    as well as RLS, so duplicate ratings are impossible, not merely discouraged.
--  * A batch announcement has NO expiry. Requirement: it must remain editable
--    after two days, so nothing here deletes or hides a batch on a timer — admin
--    controls `is_active` by hand.
--
-- All additions are `IF NOT EXISTS`/`CREATE OR REPLACE` so the migration is
-- safe to re-run against a database that already has part of it.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Listing columns
-- --------------------------------------------------------------------
-- operator_bn : the bus operating company ("শ্যামলী", "এনা"), distinct from
--               the listing title (which is the service/route name an admin set).
-- address_bn  : a coaching centre's (or provider's) street address.
-- rating_*    : populated ONLY by the reviews trigger below.
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS operator_bn TEXT,
    ADD COLUMN IF NOT EXISTS address_bn TEXT,
    ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- --------------------------------------------------------------------
-- 2. Coaching teachers
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coaching_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
    name_bn TEXT NOT NULL,
    -- Taxonomy slugs from COACHING_SUBJECTS, plus free text an admin may add.
    subjects TEXT[] NOT NULL DEFAULT '{}'::text[],
    qualification_bn TEXT,
    experience_bn TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_coaching_teachers_listing
    ON public.coaching_teachers (listing_id, sort_order);

-- --------------------------------------------------------------------
-- 3. Coaching batch announcements
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coaching_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
    title_bn TEXT NOT NULL,
    start_date DATE,
    -- Free text ("সকাল ৯টা", "বিকাল ৪টা – ৬টা") — a local time convention, not
    -- a timestamp an admin should have to convert.
    start_time TEXT,
    note_bn TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_coaching_batches_listing
    ON public.coaching_batches (listing_id, is_active, start_date);

-- --------------------------------------------------------------------
-- 4. WiFi packages
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wifi_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
    name_bn TEXT NOT NULL,
    speed_mbps INTEGER CHECK (speed_mbps IS NULL OR speed_mbps > 0),
    price INTEGER CHECK (price IS NULL OR price >= 0),
    -- An offer/discount is a label (what the deal is) plus the conditions it is
    -- valid under. Kept as free text because "৩ মাসের অগ্রিমে" is a local
    -- commercial convention, not an enumerable field.
    offer_label_bn TEXT,
    offer_conditions_bn TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_wifi_packages_listing
    ON public.wifi_packages (listing_id, is_active, sort_order);

-- --------------------------------------------------------------------
-- 5. Directory reviews (coaching + wifi)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directory_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('coaching', 'wifi')),
    listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_bn TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    -- One review per member per listing. Duplicate ratings are impossible at the
    -- storage layer, not just hidden by the UI.
    CONSTRAINT directory_reviews_one_per_author UNIQUE (category, listing_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_directory_reviews_listing
    ON public.directory_reviews (listing_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_directory_reviews_author
    ON public.directory_reviews (author_id);

-- --------------------------------------------------------------------
-- 6. updated_at triggers
-- --------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_coaching_teachers_updated ON public.coaching_teachers;
CREATE TRIGGER trg_coaching_teachers_updated
    BEFORE UPDATE ON public.coaching_teachers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_coaching_batches_updated ON public.coaching_batches;
CREATE TRIGGER trg_coaching_batches_updated
    BEFORE UPDATE ON public.coaching_batches
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wifi_packages_updated ON public.wifi_packages;
CREATE TRIGGER trg_wifi_packages_updated
    BEFORE UPDATE ON public.wifi_packages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_directory_reviews_updated ON public.directory_reviews;
CREATE TRIGGER trg_directory_reviews_updated
    BEFORE UPDATE ON public.directory_reviews
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 7. Review guard + rating aggregation
-- --------------------------------------------------------------------
-- The guard is what makes the write side trustworthy:
--   * INSERT: the author is forced to the caller (no impersonation) and the
--     review is published immediately (a member cannot insert a hidden row to
--     skew nothing); the listing must exist and its category must match, so a
--     review cannot be attached to the wrong directory.
--   * UPDATE: a non-admin may edit only their own rating/comment. author_id,
--     listing_id, category and is_published are pinned to the old row, so an
--     author cannot "re-publish" a review an admin hid, nor move it.
CREATE OR REPLACE FUNCTION public.guard_directory_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        IF NOT public.is_admin() THEN
            NEW.is_published := TRUE;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM public.service_listings sl
            WHERE sl.id = NEW.listing_id
              AND sl.category = NEW.category
              AND sl.category IN ('coaching', 'wifi')
        ) THEN
            RAISE EXCEPTION 'directory review listing/category mismatch';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NOT public.is_admin() THEN
            NEW.author_id := OLD.author_id;
            NEW.listing_id := OLD.listing_id;
            NEW.category := OLD.category;
            NEW.is_published := OLD.is_published;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_directory_reviews_guard ON public.directory_reviews;
CREATE TRIGGER trg_directory_reviews_guard
    BEFORE INSERT OR UPDATE ON public.directory_reviews
    FOR EACH ROW EXECUTE FUNCTION public.guard_directory_review();

-- Recompute a listing's public rating from its PUBLISHED reviews only. Runs on
-- every review write so the average on the card is never stale and never
-- client-computed.
CREATE OR REPLACE FUNCTION public.refresh_directory_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    _listing_id UUID;
BEGIN
    _listing_id := COALESCE(NEW.listing_id, OLD.listing_id);
    UPDATE public.service_listings sl
    SET rating_count = agg.cnt,
        rating_avg = agg.avg_rating
    FROM (
        SELECT COUNT(*)::INTEGER AS cnt,
               COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0)::NUMERIC(3,2) AS avg_rating
        FROM public.directory_reviews r
        WHERE r.listing_id = _listing_id AND r.is_published = TRUE
    ) agg
    WHERE sl.id = _listing_id;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_directory_reviews_rating ON public.directory_reviews;
CREATE TRIGGER trg_directory_reviews_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.directory_reviews
    FOR EACH ROW EXECUTE FUNCTION public.refresh_directory_rating();

-- --------------------------------------------------------------------
-- 8. Row Level Security
-- --------------------------------------------------------------------
ALTER TABLE public.coaching_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_reviews ENABLE ROW LEVEL SECURITY;

-- --- coaching_teachers: readable while the parent listing is published ---
DROP POLICY IF EXISTS "Published coaching teachers are public" ON public.coaching_teachers;
CREATE POLICY "Published coaching teachers are public"
ON public.coaching_teachers FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_teachers.listing_id AND sl.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Admins manage coaching teachers" ON public.coaching_teachers;
CREATE POLICY "Admins manage coaching teachers"
ON public.coaching_teachers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- coaching_batches: public sees active batches of published listings ---
DROP POLICY IF EXISTS "Active coaching batches are public" ON public.coaching_batches;
CREATE POLICY "Active coaching batches are public"
ON public.coaching_batches FOR SELECT
TO anon, authenticated
USING (
    is_active = TRUE
    AND EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_batches.listing_id AND sl.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Admins manage coaching batches" ON public.coaching_batches;
CREATE POLICY "Admins manage coaching batches"
ON public.coaching_batches FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- wifi_packages: public sees active packages of published providers ---
DROP POLICY IF EXISTS "Active wifi packages are public" ON public.wifi_packages;
CREATE POLICY "Active wifi packages are public"
ON public.wifi_packages FOR SELECT
TO anon, authenticated
USING (
    is_active = TRUE
    AND EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = wifi_packages.listing_id AND sl.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Admins manage wifi packages" ON public.wifi_packages;
CREATE POLICY "Admins manage wifi packages"
ON public.wifi_packages FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- directory_reviews ---
-- Published reviews are public. This policy is granted to anon too, so it must
-- NOT call is_admin() (EXECUTE on that helper is granted only to authenticated,
-- and a missing grant would fail the whole anonymous read). Admin visibility is
-- a separate, authenticated-only policy below; permissive SELECT policies OR
-- together, so an admin still sees every row.
DROP POLICY IF EXISTS "Published directory reviews are public" ON public.directory_reviews;
CREATE POLICY "Published directory reviews are public"
ON public.directory_reviews FOR SELECT
TO anon, authenticated
USING (is_published = TRUE OR author_id = auth.uid());

-- An author also sees their own review even if an admin unpublished it.
DROP POLICY IF EXISTS "Admins read all directory reviews" ON public.directory_reviews;
CREATE POLICY "Admins read all directory reviews"
ON public.directory_reviews FOR SELECT
TO authenticated
USING (public.is_admin());

-- A signed-in member may submit a review only in their own name. The guard
-- trigger pins author_id/is_published/category on top of this.
DROP POLICY IF EXISTS "Members submit their own directory reviews" ON public.directory_reviews;
CREATE POLICY "Members submit their own directory reviews"
ON public.directory_reviews FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Members update their own directory reviews" ON public.directory_reviews;
CREATE POLICY "Members update their own directory reviews"
ON public.directory_reviews FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Members delete their own directory reviews" ON public.directory_reviews;
CREATE POLICY "Members delete their own directory reviews"
ON public.directory_reviews FOR DELETE
TO authenticated
USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage directory reviews" ON public.directory_reviews;
CREATE POLICY "Admins manage directory reviews"
ON public.directory_reviews FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 9. Grants
-- --------------------------------------------------------------------
-- Supabase's default privileges normally cover this; granting explicitly means
-- the migration is correct even on a project where default privileges were
-- tightened. RLS above is still the real boundary.
GRANT SELECT ON public.coaching_teachers TO anon, authenticated;
GRANT SELECT ON public.coaching_batches TO anon, authenticated;
GRANT SELECT ON public.wifi_packages TO anon, authenticated;
GRANT SELECT ON public.directory_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coaching_teachers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coaching_batches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.wifi_packages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.directory_reviews TO authenticated;

-- --------------------------------------------------------------------
-- 10. Verification (read-only structural checks)
-- --------------------------------------------------------------------
DO $$
DECLARE
    missing TEXT := '';
    _tbl TEXT;
    _col TEXT;
BEGIN
    FOREACH _tbl IN ARRAY ARRAY[
        'coaching_teachers', 'coaching_batches', 'wifi_packages', 'directory_reviews'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = _tbl
        ) THEN
            missing := missing || _tbl || ' ';
        END IF;
    END LOOP;

    FOREACH _col IN ARRAY ARRAY['operator_bn', 'address_bn', 'rating_avg', 'rating_count'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'service_listings' AND column_name = _col
        ) THEN
            missing := missing || 'service_listings.' || _col || ' ';
        END IF;
    END LOOP;

    IF missing <> '' THEN
        RAISE EXCEPTION 'directory catalog upgrade incomplete: missing %', missing;
    END IF;
END
$$;
