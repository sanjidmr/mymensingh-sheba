-- ====================================================================
-- CUSTOMER-OWNED SERVICE LISTINGS (কোচিং সেন্টার + WiFi প্রদানকারী)
-- ====================================================================
-- Until now `service_listings` was admin-curated only: RLS denied every
-- customer write, and the public policy exposed just `is_active` rows. This
-- migration turns the two member-facing categories (coaching, wifi) into
-- something a signed-in customer can create, edit and manage themselves —
-- while keeping admin moderation as the gate before anything goes public.
--
-- What it adds
--   1. Ownership + moderation columns on `service_listings`
--      (owner_id, status, rejection_reason, published_at) plus the extra
--      public/self-service facts the new customer forms collect
--      (contact_phone_public, admission_info_bn, connection_fee, terms_bn).
--   2. Package extras on `wifi_packages` (connection_fee, offer_expires_on).
--   3. Owner RLS on `service_listings` and its child tables, and a guard
--      trigger that pins owner_id/status/is_featured/published_at so a crafted
--      request can never self-approve or claim someone else's row.
--   4. Owner-facing read RPCs (`fn_my_service_listings`,
--      `fn_my_service_listing`) — the same shape as `fn_my_posts` — so a
--      member can read their own private columns without a table-level grant.
--   5. Notifications: the admin hub hears about a pending submission, the
--      owner hears the verdict.
--
-- Design notes
--   * Only `coaching` and `wifi` may be customer-created. `bus` and `vehicle`
--     stay admin-only (the guard rejects any other category from a member).
--   * A customer row is always `is_active = TRUE` but only becomes publicly
--     visible once an admin sets `status = 'approved'`, because the public
--     SELECT policy now requires BOTH. Admin-created rows default to
--     'approved' and are unaffected.
--   * An owner edit re-enters moderation (status -> 'pending'), matching the
--     community_posts model, so an approved listing cannot be silently
--     rewritten into something else.
--   * Idempotent: every statement is guarded so re-running is safe.

-- --------------------------------------------------------------------
-- 1. Ownership + moderation columns on service_listings
-- --------------------------------------------------------------------
ALTER TABLE public.service_listings
    ADD COLUMN IF NOT EXISTS owner_id UUID
        REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- 'approved' is the default so every pre-existing admin row stays public.
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    -- A deliberately public number the owner publishes for the call button.
    -- Kept separate from contact_phone_private (admin-only) on purpose.
    ADD COLUMN IF NOT EXISTS contact_phone_public TEXT,
    -- কোচিং: ভর্তি ও ফি সংক্রান্ত তথ্য (free text, owner-written).
    ADD COLUMN IF NOT EXISTS admission_info_bn TEXT,
    -- WiFi: one-time connection/installation fee for the listing as a whole.
    ADD COLUMN IF NOT EXISTS connection_fee INTEGER,
    -- WiFi: সংযোগের শর্ত / শর্তাবলি (free text, owner-written).
    ADD COLUMN IF NOT EXISTS terms_bn TEXT;

-- Add the status CHECK separately so the ALTER stays idempotent even if the
-- column already existed without the constraint.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.service_listings'::regclass
          AND conname = 'service_listings_status_check'
    ) THEN
        ALTER TABLE public.service_listings
            ADD CONSTRAINT service_listings_status_check
            CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_service_listings_owner
    ON public.service_listings (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_listings_status
    ON public.service_listings (status, is_active);

-- --------------------------------------------------------------------
-- 2. Package extras on wifi_packages
-- --------------------------------------------------------------------
ALTER TABLE public.wifi_packages
    ADD COLUMN IF NOT EXISTS connection_fee INTEGER,
    ADD COLUMN IF NOT EXISTS offer_expires_on DATE;

-- --------------------------------------------------------------------
-- 3. Owner guard trigger
-- --------------------------------------------------------------------
-- Mirrors community_posts_guard_moderation. A member write can never choose
-- owner_id, status, featured/published/rejection state, or touch the
-- admin-only private contact column; an edit re-enters moderation. Admins and
-- service-role/background writes (auth.uid() IS NULL) pass through untouched.
CREATE OR REPLACE FUNCTION public.service_listings_guard_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Customers may only create the two member-facing categories.
    IF NEW.category NOT IN ('coaching', 'wifi') THEN
        RAISE EXCEPTION 'customers may only create coaching or wifi listings';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.owner_id := auth.uid();
        -- A member may save a draft or send it for review; never approve.
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.rejection_reason := NULL;
        NEW.published_at := NULL;
        NEW.is_featured := FALSE;
        NEW.contact_phone_private := NULL;
        NEW.is_active := TRUE;
    ELSE
        NEW.owner_id := OLD.owner_id;
        NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        NEW.rejection_reason := OLD.rejection_reason;
        NEW.published_at := OLD.published_at;
        NEW.is_featured := OLD.is_featured;
        NEW.contact_phone_private := OLD.contact_phone_private;
        NEW.is_active := OLD.is_active;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_listings_guard_owner ON public.service_listings;
CREATE TRIGGER trg_service_listings_guard_owner
BEFORE INSERT OR UPDATE ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.service_listings_guard_owner();

-- --------------------------------------------------------------------
-- 4. Row Level Security — service_listings
-- --------------------------------------------------------------------
-- Public now needs an approval, not just is_active, so a pending customer row
-- never shows up in the directory.
DROP POLICY IF EXISTS "Active service listings are public" ON public.service_listings;
DROP POLICY IF EXISTS "Approved active service listings are public" ON public.service_listings;
CREATE POLICY "Approved active service listings are public"
ON public.service_listings FOR SELECT
TO anon, authenticated
USING (is_active = TRUE AND status = 'approved');

-- Owners read their own row at any moderation state.
DROP POLICY IF EXISTS "Owners read own service listings" ON public.service_listings;
CREATE POLICY "Owners read own service listings"
ON public.service_listings FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- A member creates only their own row, and only as a draft or pending.
DROP POLICY IF EXISTS "Owners create own service listings" ON public.service_listings;
CREATE POLICY "Owners create own service listings"
ON public.service_listings FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid() AND status IN ('draft', 'pending'));

-- A member edits only their own row and must keep it out of 'approved'.
DROP POLICY IF EXISTS "Owners update own service listings" ON public.service_listings;
CREATE POLICY "Owners update own service listings"
ON public.service_listings FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid() AND status IN ('draft', 'pending'));

DROP POLICY IF EXISTS "Owners delete own service listings" ON public.service_listings;
CREATE POLICY "Owners delete own service listings"
ON public.service_listings FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- --------------------------------------------------------------------
-- 5. Row Level Security — child tables owned by the listing owner
-- --------------------------------------------------------------------
-- A single FOR ALL policy per child table is enough: USING covers
-- select/update/delete, WITH CHECK covers insert/update, and both ask the
-- parent listing who owns it. The existing public + admin policies still apply
-- (permissive policies OR together), so nothing regresses.
DROP POLICY IF EXISTS "Owners manage own coaching teachers" ON public.coaching_teachers;
CREATE POLICY "Owners manage own coaching teachers"
ON public.coaching_teachers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_teachers.listing_id AND sl.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_teachers.listing_id AND sl.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners manage own coaching batches" ON public.coaching_batches;
CREATE POLICY "Owners manage own coaching batches"
ON public.coaching_batches FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_batches.listing_id AND sl.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = coaching_batches.listing_id AND sl.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners manage own wifi packages" ON public.wifi_packages;
CREATE POLICY "Owners manage own wifi packages"
ON public.wifi_packages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = wifi_packages.listing_id AND sl.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_listings sl
        WHERE sl.id = wifi_packages.listing_id AND sl.owner_id = auth.uid()
    )
);

-- --------------------------------------------------------------------
-- 6. Owner-facing read RPCs
-- --------------------------------------------------------------------
-- SECURITY DEFINER so a member can read their own row (including the private
-- columns) without relying on a table-level grant, and ownership is re-checked
-- in SQL rather than trusted from the client.
CREATE OR REPLACE FUNCTION public.fn_my_service_listings()
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT l.* FROM public.service_listings l
    WHERE l.owner_id = auth.uid()
    ORDER BY l.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_my_service_listing(p_id UUID)
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT l.* FROM public.service_listings l
    WHERE l.owner_id = auth.uid() AND l.id = p_id;
$$;

REVOKE ALL ON FUNCTION public.fn_my_service_listings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_service_listing(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_my_service_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_service_listing(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 7. Notifications
-- --------------------------------------------------------------------
-- Admin hub: a pending member submission needs a look.
CREATE OR REPLACE FUNCTION public.notif_service_listing_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    cat_label TEXT;
BEGIN
    IF NEW.owner_id IS NULL OR NEW.status <> 'pending' THEN
        RETURN NEW;
    END IF;

    cat_label := CASE NEW.category
        WHEN 'coaching' THEN 'কোচিং সেন্টার'
        WHEN 'wifi' THEN 'WiFi প্রদানকারী'
        ELSE 'সেবা তালিকা'
    END;

    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন ' || cat_label,
        NEW.title_bn || ' — অনুমোদনের জন্য অপেক্ষমাণ।',
        'info', 'service_listing', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_service_listing ON public.service_listings;
CREATE TRIGGER trg_notif_service_listing
AFTER INSERT ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.notif_service_listing_inserted();

-- Owner: the moderation verdict.
CREATE OR REPLACE FUNCTION public.notif_service_listing_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.owner_id IS NULL OR NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.owner_id, 'customer',
            'আপনার তালিকা অনুমোদিত হয়েছে',
            '“' || NEW.title_bn || '” এখন সবার জন্য দেখা যাচ্ছে।',
            'success', 'service_listing', NEW.id::text
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.owner_id, 'customer',
            'তালিকাটি অনুমোদিত হয়নি',
            CASE
                WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                    THEN '“' || NEW.title_bn || '” অনুমোদিত হয়নি। কারণ: '
                         || BTRIM(NEW.rejection_reason)
                         || ' — কারণটি পড়ে সম্পাদনা করে আবার পাঠান।'
                ELSE '“' || NEW.title_bn || '” অনুমোদিত হয়নি। সম্পাদনা করে আবার পাঠাতে পারেন।'
            END,
            'warning', 'service_listing', NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_service_listing_status ON public.service_listings;
CREATE TRIGGER trg_notif_service_listing_status
AFTER UPDATE OF status ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.notif_service_listing_status_changed();

-- --------------------------------------------------------------------
-- 8. Verification (read-only structural checks)
-- --------------------------------------------------------------------
DO $$
DECLARE
    missing TEXT := '';
    _col TEXT;
BEGIN
    FOREACH _col IN ARRAY ARRAY[
        'owner_id', 'status', 'rejection_reason', 'published_at',
        'contact_phone_public', 'admission_info_bn', 'connection_fee', 'terms_bn'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'service_listings'
              AND column_name = _col
        ) THEN
            missing := missing || 'service_listings.' || _col || ' ';
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_service_listings_guard_owner'
    ) THEN
        missing := missing || 'trigger:trg_service_listings_guard_owner ';
    END IF;

    IF missing <> '' THEN
        RAISE EXCEPTION 'customer service listings migration incomplete: missing %', missing;
    END IF;
END
$$;
