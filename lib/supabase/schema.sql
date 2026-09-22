-- ====================================================================
-- MYMENSINGH SHEBA - PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Service Area: Exclusively within Mymensingh City Corporation (MCC)
-- One-Account System: Customer + Service Profile Extensions
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Core Account for every user)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar_url TEXT,
    primary_area_id TEXT NOT NULL, -- Centralized MCC area id (e.g., 'charpara', 'ganginarpar')
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Idempotent upgrade for existing databases (add status column + constraint)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
            CHECK (status IN ('active', 'suspended', 'blocked'));
    END IF;
END
$$;

-- 2. TO-LET PROFILES (Activated by house owners / mess managers)
CREATE TABLE IF NOT EXISTS public.tolet_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paused', 'suspended')),
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    primary_area_id TEXT NOT NULL,
    address_line TEXT NOT NULL,
    nid_number TEXT,
    nid_doc_url TEXT,
    holding_number TEXT,
    total_listings_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. HOME TUTOR PROFILES (Activated by teachers/students)
-- Lifecycle: draft -> pending_approval -> approved/published -> rejected/suspended
CREATE TABLE IF NOT EXISTS public.home_tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended')),
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    institution TEXT NOT NULL,
    department TEXT NOT NULL,
    qualification TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    preferred_areas TEXT[] NOT NULL DEFAULT '{}',
    preferred_classes TEXT[] NOT NULL DEFAULT '{}',
    preferred_subjects TEXT[] NOT NULL DEFAULT '{}',
    expected_salary_min INTEGER DEFAULT 2000,
    expected_salary_max INTEGER DEFAULT 6000,
    days_per_week INTEGER DEFAULT 3,
    bio TEXT,
    student_id_card_url TEXT,
    nid_number TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    -- PRIVACY RULE: private_phone must NEVER be publicly exposed on directory
    private_phone TEXT NOT NULL,
    -- Teaching mode: বাসায় / Online / দুটোই
    teaching_mode TEXT NOT NULL DEFAULT 'both' CHECK (teaching_mode IN ('home', 'online', 'both')),
    -- Availability: free / limited / busy
    availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'busy')),
    profile_photo_url TEXT,
    admin_notes TEXT,          -- Admin review notes (never public)
    rejection_reason TEXT,     -- Set when rejected / changes requested (visible to the tutor only)
    published_at TIMESTAMPTZ,  -- Set when admin approves/publishes
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. BLOOD DONOR PROFILES (Activated by volunteer blood donors)
CREATE TABLE IF NOT EXISTS public.blood_donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended')),
    full_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    area_id TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    birth_year INTEGER,
    weight_kg INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    last_donation_date DATE,
    donation_count INTEGER DEFAULT 0,
    -- CRITICAL PRIVACY RULE: private_phone is never public; emergency contact released only by Admin
    private_phone TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    intro TEXT,
    profile_photo_url TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. SERVICE REQUESTS TABLE (one reusable request system for all services)
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'in_progress', 'completed', 'cancelled', 'rejected', 'submitted', 'assigned')),
    area_id TEXT NOT NULL,
    address_line TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    preferred_date DATE,
    details TEXT,
    profile_id TEXT,
    profile_title TEXT,
    service_type TEXT,
    preferred_time TEXT,
    attachment_url TEXT,
    admin_notes TEXT,
    -- Home Moving (বাসা পাল্টানো) private request fields
    pickup_area_id TEXT,
    destination_area_id TEXT,
    pickup_address TEXT,
    destination_address TEXT,
    pickup_floor TEXT,
    destination_floor TEXT,
    has_lift BOOLEAN DEFAULT FALSE,
    parking_info TEXT,
    moving_items JSONB DEFAULT '[]'::jsonb,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    -- Future quotation support: Admin records the agreed price manually (no automatic pricing)
    quotation TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Idempotent migration for databases created before the staff-services milestone
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS profile_id TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS profile_title TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_status_check CHECK (status IN ('new', 'reviewing', 'contacted', 'in_progress', 'completed', 'cancelled', 'rejected', 'submitted', 'assigned'));

-- Idempotent migration for home-moving (বাসা পাল্টানো) private request fields
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS pickup_area_id TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS destination_area_id TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS destination_address TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS pickup_floor TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS destination_floor TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS has_lift BOOLEAN DEFAULT FALSE;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS moving_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS quotation TEXT;

-- Idempotent migration for the Home Tutor (গৃহশিক্ষক) milestone:
-- extra profile columns + 'rejected' status (previously draft/pending_approval/approved/paused/suspended)
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS teaching_mode TEXT NOT NULL DEFAULT 'both';
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE public.home_tutor_profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.home_tutor_profiles DROP CONSTRAINT IF EXISTS home_tutor_profiles_status_check;
ALTER TABLE public.home_tutor_profiles ADD CONSTRAINT home_tutor_profiles_status_check CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended'));
ALTER TABLE public.home_tutor_profiles DROP CONSTRAINT IF EXISTS home_tutor_profiles_teaching_mode_check;
ALTER TABLE public.home_tutor_profiles ADD CONSTRAINT home_tutor_profiles_teaching_mode_check CHECK (teaching_mode IN ('home', 'online', 'both'));
ALTER TABLE public.home_tutor_profiles DROP CONSTRAINT IF EXISTS home_tutor_profiles_availability_check;
ALTER TABLE public.home_tutor_profiles ADD CONSTRAINT home_tutor_profiles_availability_check CHECK (availability IN ('available', 'limited', 'busy'));

-- Idempotent migration for the Blood Donor (রক্তদাতা) milestone:
-- extra profile columns + 'draft'/'rejected' statuses
ALTER TABLE public.blood_donor_profiles ADD COLUMN IF NOT EXISTS intro TEXT;
ALTER TABLE public.blood_donor_profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.blood_donor_profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.blood_donor_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.blood_donor_profiles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.blood_donor_profiles DROP CONSTRAINT IF EXISTS blood_donor_profiles_status_check;
ALTER TABLE public.blood_donor_profiles ADD CONSTRAINT blood_donor_profiles_status_check CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended'));

-- 5c. BLOOD REQUESTS (রক্তের অনুরোধ)
-- A customer picks a published donor and files a request with a REQUIRED
-- prescription. Email/Hospital info is private: only the requester and admins
-- can view it. The donor's phone is NEVER stored here — it stays on the
-- donor profile and is only released through the controlled, audited flow.
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    donor_profile_id UUID REFERENCES public.blood_donor_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'donor_contacted', 'in_progress', 'completed', 'rejected', 'cancelled')),
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units INTEGER NOT NULL DEFAULT 1 CHECK (units BETWEEN 1 AND 6),
    hospital_name TEXT NOT NULL,
    hospital_area_id TEXT,
    hospital_location TEXT NOT NULL,
    required_date_time TEXT,
    area_id TEXT NOT NULL,
    patient_info TEXT,
    -- PRIVATE: storage path in the 'documents' bucket. Never exposed publicly.
    prescription_url TEXT NOT NULL,
    admin_notes TEXT,
    rejection_reason TEXT,
    -- CONTACT-RELEASE AUDIT: set when Admin releases the donor number to the requester.
    contact_released_at TIMESTAMPTZ,
    contacted_donor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blood_requests_customer ON public.blood_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests (status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_donor ON public.blood_requests (donor_profile_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created ON public.blood_requests (created_at DESC);

-- 5d. BLOOD CONTACT-RELEASE AUDIT TRAIL
-- Records WHO released the donor contact to WHOM, for WHICH request, and WHEN.
-- No phone number is stored here — the audit proves the action happened.
CREATE TABLE IF NOT EXISTS public.blood_contact_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    donor_profile_id UUID NOT NULL REFERENCES public.blood_donor_profiles(id) ON DELETE CASCADE,
    released_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    released_to_customer UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blood_contact_releases_request ON public.blood_contact_releases (request_id);
CREATE INDEX IF NOT EXISTS idx_blood_contact_releases_donor ON public.blood_contact_releases (donor_profile_id);

-- 5e. BLOOD DONOR REPORTS (visitors can flag a problematic donor profile)
CREATE TABLE IF NOT EXISTS public.blood_donor_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_profile_id UUID NOT NULL REFERENCES public.blood_donor_profiles(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blood_donor_reports_donor ON public.blood_donor_reports (donor_profile_id);
CREATE INDEX IF NOT EXISTS idx_blood_donor_reports_status ON public.blood_donor_reports (status);

-- 5b. TUTOR REVIEWS (only ever created after an appropriate completed tutor request)
CREATE TABLE IF NOT EXISTS public.tutor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.home_tutor_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE SET NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor ON public.tutor_reviews (tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_customer ON public.tutor_reviews (customer_id);

-- 5c. TUTOR REPORTS (visitors / admins)
CREATE TABLE IF NOT EXISTS public.tutor_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.home_tutor_profiles(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tutor_reports_tutor ON public.tutor_reports (tutor_id);

-- 6. SAVED LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('tolet', 'tutor', 'service')),
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, item_type, item_id)
);

-- 7. STAFF PROFILES TABLE (Admin-managed workers: কাজের বুয়া / Electrician / Plumber)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_slug TEXT NOT NULL CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber')),
    name_bn TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    image_url TEXT,
    areas TEXT[] NOT NULL DEFAULT '{}',
    work_types TEXT[] NOT NULL DEFAULT '{}',
    work_mode TEXT,
    time_slot TEXT,
    experience_years INTEGER DEFAULT 0,
    availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'busy')),
    is_emergency BOOLEAN DEFAULT FALSE,
    salary_min INTEGER,
    salary_max INTEGER,
    rate_label TEXT,
    about_bn TEXT NOT NULL,
    -- PRIVACY RULE: phone_private is ADMIN-ONLY and never returned by public queries
    phone_private TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. STAFF PROFILE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.staff_profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    service_slug TEXT NOT NULL CHECK (service_slug IN ('kajer-bua', 'electrician', 'plumber')),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tolet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profile_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_contact_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donor_reports ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an admin?
-- SECURITY: pinned search_path + schema-qualified refs to prevent search-path hijacking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- --- PROFILES POLICIES ---
-- Users can only read their own profile row; admins can read everyone's.
-- This prevents any authenticated user from enumerating phones/emails of others.
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- User can update their own profile (non-privileged fields only).
-- Role / verification / account status changes are ADMIN-ONLY, enforced by the
-- profiles_admin_only_fields trigger below.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND public.is_admin() IS NOT TRUE)
WITH CHECK (auth.uid() = id);

-- Self-registration: a brand-new user may create ONLY their own row as a
-- plain active customer (never as admin). Guarded so the profile row always
-- matches the authenticated identity.
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    AND role = 'customer'
    AND status = 'active'
    AND is_verified = FALSE
);

-- Admins have full access to profiles
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- Admin-only columns may never be changed by non-admins (defense in depth).
CREATE OR REPLACE FUNCTION public.profiles_admin_only_fields()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Not allowed to change role, verification or account status';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_admin_only_fields ON public.profiles;
CREATE TRIGGER trg_profiles_admin_only_fields
BEFORE UPDATE OF role, is_verified, status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_admin_only_fields();

-- --- TO-LET PROFILES POLICIES ---
-- Anyone can view approved To-Let owner profiles
CREATE POLICY "Approved tolet profiles are public"
ON public.tolet_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

-- Owners can insert and update their own tolet profile
CREATE POLICY "Owners can create their tolet profile"
ON public.tolet_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their tolet profile"
ON public.tolet_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can update any tolet profile (e.g. approve, suspend)
CREATE POLICY "Admins manage tolet profiles"
ON public.tolet_profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- --- HOME TUTOR PROFILES POLICIES ---
-- Public can view approved tutors, but phone is hidden in public view
CREATE POLICY "Approved tutors are viewable"
ON public.home_tutor_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their tutor profile"
ON public.home_tutor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tutor profile"
ON public.home_tutor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage tutor profiles"
ON public.home_tutor_profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- --- TUTOR REVIEWS POLICIES ---
-- Public (incl. anonymous) can read only published reviews; customer/admin see their rows.
CREATE POLICY "Published tutor reviews are public"
ON public.tutor_reviews FOR SELECT
TO anon
USING (is_published = TRUE);

CREATE POLICY "Reviewers and admins read tutor reviews"
ON public.tutor_reviews FOR SELECT
TO authenticated
USING (is_published = TRUE OR auth.uid() = customer_id OR public.is_admin());

-- A customer may insert a review only for their OWN completed tutor request
-- (the validation trigger enforces this server-side — never trust the frontend).
CREATE POLICY "Customers can review tutors after completed request"
ON public.tutor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins moderate tutor reviews"
ON public.tutor_reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- TUTOR REPORTS POLICIES ---
CREATE POLICY "Tutor reports readable by admins or reporter"
ON public.tutor_reports FOR SELECT
TO authenticated
USING (public.is_admin() OR (reporter_id IS NOT NULL AND reporter_id = auth.uid()));

CREATE POLICY "Authenticated users can report tutors"
ON public.tutor_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

CREATE POLICY "Guests can report tutors"
ON public.tutor_reports FOR INSERT
TO anon
WITH CHECK (reporter_id IS NULL AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

CREATE POLICY "Admins manage tutor reports"
ON public.tutor_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- TUTOR REVIEWS INTEGRITY TRIGGERS ---
-- 1) A review is only valid when the reviewer owns a COMPLETED 'home-tutor' request
--    whose profile_id matches the reviewed tutor. Duplicates blocked by UNIQUE(request_id).
CREATE OR REPLACE FUNCTION public.tutor_review_insert_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.customer_id <> auth.uid() AND COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000') <> NEW.customer_id THEN
    RAISE EXCEPTION 'Review must be submitted by the request customer';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = NEW.request_id
      AND sr.customer_id = NEW.customer_id
      AND sr.service_slug = 'home-tutor'
      AND sr.status = 'completed'
      AND sr.profile_id::uuid = NEW.tutor_id
  ) THEN
    RAISE EXCEPTION 'Review requires a completed tutor request for this tutor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tutor_review_insert_validate ON public.tutor_reviews;
CREATE TRIGGER trg_tutor_review_insert_validate
BEFORE INSERT ON public.tutor_reviews
FOR EACH ROW EXECUTE FUNCTION public.tutor_review_insert_validate();

-- 2) Keep rating_avg / rating_count on the tutor profile in sync with published reviews.
CREATE OR REPLACE FUNCTION public.tutor_reviews_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _tutor_id UUID;
BEGIN
  _tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);
  UPDATE public.home_tutor_profiles htp
  SET rating_avg = COALESCE((
        SELECT round(avg(r.rating)::numeric, 1)
        FROM public.tutor_reviews r
        WHERE r.tutor_id = _tutor_id AND r.is_published = TRUE
      ), 0),
      rating_count = (
        SELECT count(*) FROM public.tutor_reviews r
        WHERE r.tutor_id = _tutor_id AND r.is_published = TRUE
      ),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE htp.id = _tutor_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_tutor_reviews_ratings ON public.tutor_reviews;
CREATE TRIGGER trg_tutor_reviews_ratings
AFTER INSERT OR UPDATE OF is_published OR DELETE ON public.tutor_reviews
FOR EACH ROW EXECUTE FUNCTION public.tutor_reviews_ratings();

-- --- BLOOD DONOR PROFILES POLICIES ---
-- Anyone can view active donors for group and area matching, but contact info is guarded
CREATE POLICY "Approved donors viewable"
ON public.blood_donor_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can register as blood donor"
ON public.blood_donor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their donor profile"
ON public.blood_donor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage blood donor profiles"
ON public.blood_donor_profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- --- SELF-APPROVAL PREVENTION ---
-- Service profiles must go through admin approval. Non-admin users can never
-- force status to 'approved' or 'suspended' (direct SQL or client payload).
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role TEXT;
BEGIN
  IF NEW.status IN ('approved', 'suspended', 'rejected') THEN
    SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
    IF COALESCE(_role, '') <> 'admin' THEN
      RAISE EXCEPTION 'Status change to % requires admin approval', NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_no_self_approve ON public.tolet_profiles;
CREATE TRIGGER trg_tolet_no_self_approve
BEFORE INSERT OR UPDATE OF status ON public.tolet_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

DROP TRIGGER IF EXISTS trg_tutor_no_self_approve ON public.home_tutor_profiles;
CREATE TRIGGER trg_tutor_no_self_approve
BEFORE INSERT OR UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

DROP TRIGGER IF EXISTS trg_donor_no_self_approve ON public.blood_donor_profiles;
CREATE TRIGGER trg_donor_no_self_approve
BEFORE INSERT OR UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

-- --- BLOOD REQUESTS POLICIES ---
-- Requesters see their own requests (with their private info); admins see all.
-- Donors never see patient request data — donors manage only their own profile.
CREATE POLICY "Customers can view own blood requests"
ON public.blood_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Customers can create blood requests"
ON public.blood_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id
  AND patient_name IS NOT NULL
  AND trim(patient_name) <> ''
  AND phone IS NOT NULL
  AND trim(phone) <> ''
  AND prescription_url IS NOT NULL
  AND trim(prescription_url) <> ''
);

-- A requester may cancel their own request while it is still in review/approved.
CREATE POLICY "Customers can cancel own blood request"
ON public.blood_requests FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin())
WITH CHECK (
  public.is_admin() OR
  (auth.uid() = customer_id AND NEW.status = 'cancelled')
);

CREATE POLICY "Admins manage blood requests"
ON public.blood_requests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- BLOOD REQUESTS INSERT SANITIZE ---
-- Non-admins cannot set review/approval/contact states or admin fields on insert;
-- every customer submission starts as 'pending_review'.
CREATE OR REPLACE FUNCTION public.blood_requests_insert_sanitize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := 'pending_review';
    NEW.admin_notes := NULL;
    NEW.rejection_reason := NULL;
    NEW.contact_released_at := NULL;
    NEW.contacted_donor_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blood_requests_insert_sanitize ON public.blood_requests;
CREATE TRIGGER trg_blood_requests_insert_sanitize
BEFORE INSERT ON public.blood_requests
FOR EACH ROW EXECUTE FUNCTION public.blood_requests_insert_sanitize();

-- --- BLOOD CONTACT-RELEASE AUDIT POLICIES ---
-- Audit trail proves the release happened; only the affected requester and admins
-- can see the audit entry (the phone itself is handed back via the service layer).
CREATE POLICY "Requester can view own contact releases"
ON public.blood_contact_releases FOR SELECT
TO authenticated
USING (released_to_customer = auth.uid() OR public.is_admin());

CREATE POLICY "Admins record contact releases"
ON public.blood_contact_releases FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage contact release audits"
ON public.blood_contact_releases FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- BLOOD DONOR REPORTS POLICIES ---
CREATE POLICY "Donor reports readable by admins or reporter"
ON public.blood_donor_reports FOR SELECT
TO authenticated
USING (public.is_admin() OR (reporter_id IS NOT NULL AND reporter_id = auth.uid()));

CREATE POLICY "Authenticated users can report donors"
ON public.blood_donor_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

CREATE POLICY "Guests can report donors"
ON public.blood_donor_reports FOR INSERT
TO anon
WITH CHECK (reporter_id IS NULL AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

CREATE POLICY "Admins manage donor reports"
ON public.blood_donor_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- SERVICE REQUESTS POLICIES ---
CREATE POLICY "Users can view own service requests"
ON public.service_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Users can create service requests"
ON public.service_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can cancel own service request" ON public.service_requests;
CREATE POLICY "Users can cancel own service request"
ON public.service_requests FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin())
WITH CHECK (
  public.is_admin() OR
  (auth.uid() = customer_id AND NEW.status = 'cancelled')
);

-- SECURITY: customers cannot self-assign statuses or admin notes on insert.
-- Also keeps legacy 'submitted' flows valid for existing rows.
-- quotation is admin-only (no automatic pricing; admin quotes the move).
CREATE OR REPLACE FUNCTION public.service_requests_insert_sanitize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := 'new';
    NEW.admin_notes := NULL;
    NEW.quotation := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_requests_insert_sanitize ON public.service_requests;
CREATE TRIGGER trg_service_requests_insert_sanitize
BEFORE INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.service_requests_insert_sanitize();

-- --- SAVED ITEMS POLICIES ---
CREATE POLICY "Users manage own saved items"
ON public.saved_items FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- --- STAFF PROFILES POLICIES (Admin-managed: কাজের বুয়া / Electrician / Plumber) ---
-- Public (including anonymous visitors) can read ONLY active profiles.
-- phone_private column is never queryable by non-admins because admin-only policies gate write,
-- and public SELECT rows flow through the staff-service facade which strips it defensively.
CREATE POLICY "Active staff profiles are public"
ON public.staff_profiles FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins manage staff profiles"
ON public.staff_profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- STAFF PROFILE REPORTS POLICIES ---
CREATE POLICY "Staff reports readable by admins"
ON public.staff_profile_reports FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Authenticated users can report staff profiles"
ON public.staff_profile_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

CREATE POLICY "Guests can report staff profiles"
ON public.staff_profile_reports FOR INSERT
WITH CHECK (reporter_id IS NULL);

CREATE POLICY "Admins manage staff reports"
ON public.staff_profile_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ====================================================================
-- STORAGE BUCKETS & STORAGE POLICIES
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff', 'staff', true)
ON CONFLICT (id) DO NOTHING;

-- Staff profile photos are public; upload managed by admins only
CREATE POLICY "Staff profile photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff');

CREATE POLICY "Admins can upload staff profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staff' AND public.is_admin());

CREATE POLICY "Admins can update or delete staff profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'staff' AND public.is_admin())
WITH CHECK (bucket_id = 'staff' AND public.is_admin());

CREATE POLICY "Admins can delete staff profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'staff' AND public.is_admin());

-- Avatars are publicly readable, uploadable by the user
CREATE POLICY "Avatars are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update or delete their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verification documents (NID, Student ID, Prescription) are private to owner and admin
CREATE POLICY "Verification docs are private to owner and admin"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

CREATE POLICY "Users can upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update or delete own verification documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()))
WITH CHECK (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

CREATE POLICY "Users can delete own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- ====================================================================
-- TO-LET / BAASA BHARA SYSTEM
-- Listings, tenant requests, listing reports, platform settings
-- ====================================================================

-- 9. TO-LET LISTINGS
CREATE TABLE IF NOT EXISTS public.tolet_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('flat', 'room', 'sublet', 'family', 'bachelor', 'mess', 'hostel', 'seat')),
    area_id TEXT NOT NULL, -- MCC area id (matches lib/locations.ts)
    specific_address TEXT,
    rent_price INTEGER NOT NULL DEFAULT 0 CHECK (rent_price >= 0),
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    balconies INTEGER NOT NULL DEFAULT 0,
    total_rooms INTEGER,
    floor TEXT,
    available_from DATE,
    facilities TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    photos TEXT[] NOT NULL DEFAULT '{}', -- Public storage URLs; photos[0] = cover
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'unavailable', 'suspended', 'archived')),
    rejection_reason TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tolet_listings_status ON public.tolet_listings (status);
CREATE INDEX IF NOT EXISTS idx_tolet_listings_area ON public.tolet_listings (area_id);
CREATE INDEX IF NOT EXISTS idx_tolet_listings_owner ON public.tolet_listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_tolet_listings_rent ON public.tolet_listings (rent_price);
CREATE INDEX IF NOT EXISTS idx_tolet_listings_created ON public.tolet_listings (created_at DESC);

-- 10. TENANT / CUSTOMER REQUESTS for a listing
CREATE TABLE IF NOT EXISTS public.tolet_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.tolet_listings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL, -- Visible only to owner & admin of that listing
    area_id TEXT,
    preferred_time TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'contacted', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tolet_requests_listing ON public.tolet_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_tolet_requests_customer ON public.tolet_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_tolet_requests_status ON public.tolet_requests (status);

-- 11. LISTING REPORTS (visitors / admins)
CREATE TABLE IF NOT EXISTS public.listing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.tolet_listings(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing ON public.listing_reports (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON public.listing_reports (status);

-- 12. PLATFORM SETTINGS (admin-configurable values, e.g. tolet_fee_rules)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_listings_updated ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listings_updated
BEFORE UPDATE ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_platform_settings_updated ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Owner scope helper (avoid repeating subqueries; owner may manage request on own listing)
CREATE OR REPLACE FUNCTION public.is_listing_owner(listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tolet_listings l WHERE l.id = listing_id AND l.owner_id = auth.uid());
$$;

-- --- TO-LET LISTINGS RLS ---
ALTER TABLE public.tolet_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved tolet listings are public" ON public.tolet_listings;
CREATE POLICY "Approved tolet listings are public"
ON public.tolet_listings FOR SELECT
USING (status = 'approved' OR auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Owners can create tolet listings" ON public.tolet_listings;
CREATE POLICY "Owners can create tolet listings"
ON public.tolet_listings FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR
  (auth.uid() = owner_id AND NEW.status IN ('draft', 'pending_review'))
);

DROP POLICY IF EXISTS "Owners can update own tolet listings" ON public.tolet_listings;
CREATE POLICY "Owners can update own tolet listings"
ON public.tolet_listings FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (
  public.is_admin() OR
  (auth.uid() = owner_id AND (
    NEW.status IN ('draft', 'pending_review', 'archived', 'unavailable') OR
    NEW.status = OLD.status
  ))
);

DROP POLICY IF EXISTS "Admins manage tolet listings" ON public.tolet_listings;
CREATE POLICY "Admins manage tolet listings"
ON public.tolet_listings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- TO-LET REQUESTS RLS ---
-- PRIVACY: phone is exposed only to the listing owner (authorized) and admins.
ALTER TABLE public.tolet_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own tolet requests" ON public.tolet_requests;
CREATE POLICY "Customers view own tolet requests"
ON public.tolet_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin() OR public.is_listing_owner(listing_id));

DROP POLICY IF EXISTS "Customers can create tolet requests" ON public.tolet_requests;
CREATE POLICY "Customers can create tolet requests"
ON public.tolet_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customer/owner can update tolet requests" ON public.tolet_requests;
CREATE POLICY "Customer/owner can update tolet requests"
ON public.tolet_requests FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin() OR public.is_listing_owner(listing_id))
WITH CHECK (
  public.is_admin() OR
  (auth.uid() = customer_id AND NEW.status = 'cancelled' AND OLD.status IN ('submitted', 'contacted')) OR
  (public.is_listing_owner(listing_id) AND NEW.status IN ('contacted', 'completed', 'cancelled') AND OLD.status IN ('submitted', 'contacted'))
);

-- --- LISTING REPORTS RLS ---
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reports are readable by admins" ON public.listing_reports;
CREATE POLICY "Reports are readable by admins"
ON public.listing_reports FOR SELECT
TO authenticated
USING (public.is_admin() OR (auth.uid() IS NOT NULL AND reporter_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can report listings" ON public.listing_reports;
CREATE POLICY "Authenticated users can report listings"
ON public.listing_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Guests can report listings" ON public.listing_reports;
CREATE POLICY "Guests can report listings"
ON public.listing_reports FOR INSERT
TO anon
WITH CHECK (reporter_id IS NULL AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Admins manage reports" ON public.listing_reports;
CREATE POLICY "Admins manage reports"
ON public.listing_reports FOR UPDATE
TO authenticated
USING (public.is_admin() OR reporter_id = auth.uid())
WITH CHECK (public.is_admin());

-- --- PLATFORM SETTINGS RLS ---
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read platform settings" ON public.platform_settings;
CREATE POLICY "Admins read platform settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (public.is_admin());

-- Fee rules are public (transparency on the public to-let pages); every other
-- settings key stays admin-only.
DROP POLICY IF EXISTS "Public read public tolet fee rules" ON public.platform_settings;
CREATE POLICY "Public read public tolet fee rules"
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (key = 'tolet_fee_rules');

DROP POLICY IF EXISTS "Admins write platform settings" ON public.platform_settings;
CREATE POLICY "Admins write platform settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- LISTING PHOTOS STORAGE ---
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Listing photos are public (displayed on public listing pages)
DROP POLICY IF EXISTS "Listing photos are public" ON storage.objects;
CREATE POLICY "Listing photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

-- Owners upload under their own folder: {ownerId}/...
DROP POLICY IF EXISTS "Owners can upload listing photos" ON storage.objects;
CREATE POLICY "Owners can upload listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can manage own listing photos" ON storage.objects;
CREATE POLICY "Owners can manage own listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listings' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()))
WITH CHECK (bucket_id = 'listings' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS "Owners can delete own listing photos" ON storage.objects;
CREATE POLICY "Owners can delete own listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listings' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- 13. NOTIFICATIONS (reusable, simple)
-- One row per notification. target_role='customer' → the user_id owner receives it.
-- target_role='admin' → every admin's inbox sees it (admin hub notifications).
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL DEFAULT 'customer' CHECK (target_role IN ('customer', 'admin')),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
    related_type TEXT,
    related_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_admin ON public.notifications (target_role, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read their own customer notifications; admins read the admin hub.
CREATE POLICY "Users read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR (target_role = 'admin' AND public.is_admin()));

-- Users may create their own notifications; admins may notify any account.
CREATE POLICY "Users create own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Marking read is the only client-side mutation.
CREATE POLICY "Users mark own notifications read"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR (target_role = 'admin' AND public.is_admin()))
WITH CHECK ((user_id = auth.uid() OR (target_role = 'admin' AND public.is_admin())) AND is_read = TRUE);

-- Deletion is admin-only (housekeeping).
CREATE POLICY "Admins delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (public.is_admin());

-- --- NOTIFICATION TRIGGERS (server-enforced, not client-spammable) ---
-- A new service request notifies the customer + the admin hub.
CREATE OR REPLACE FUNCTION public.notif_service_request_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NEW.customer_id, 'customer',
        'রিকোয়েস্ট জমা হয়েছে',
        'আপনার সেবার রিকোয়েস্টটি জমা হয়েছে। অ্যাডমিন শীঘ্রই পর্যালোচনা করে যোগাযোগ করবেন।',
        'success', 'service_request', NEW.id::text
    );
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন সার্ভিস রিকোয়েস্ট',
        'একটি নতুন সার্ভিস রিকোয়েস্ট জমা হয়েছে, পর্যালোচনা করুন।',
        'info', 'service_request', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_service_request ON public.service_requests;
CREATE TRIGGER trg_notif_service_request
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.notif_service_request_inserted();

-- A new blood request notifies the customer + the admin hub (prescription review).
CREATE OR REPLACE FUNCTION public.notif_blood_request_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NEW.customer_id, 'customer',
        'রক্তের অনুরোধ জমা হয়েছে',
        'আপনার রক্তদান রিকোয়েস্টটি জমা হয়েছে। প্রেসক্রিপশন যাচাইয়ের পর অ্যাডমিন অনুমোদন দেবেন।',
        'success', 'blood_request', NEW.id::text
    );
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন রক্তের অনুরোধ',
        'রক্তদানে একটি নতুন অনুরোধ জমা হয়েছে। প্রেসক্রিপশন যাচাই করুন।',
        'info', 'blood_request', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_blood_request ON public.blood_requests;
CREATE TRIGGER trg_notif_blood_request
AFTER INSERT ON public.blood_requests
FOR EACH ROW EXECUTE FUNCTION public.notif_blood_request_inserted();

-- Any moderation report notifies the admin hub.
CREATE OR REPLACE FUNCTION public.notif_report_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন মডারেশন রিপোর্ট',
        'একটি নতুন রিপোর্ট জমা হয়েছে, পর্যালোচনা করুন।',
        'warning', TG_TABLE_NAME, NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_tutor_report ON public.tutor_reports;
CREATE TRIGGER trg_notif_tutor_report
AFTER INSERT ON public.tutor_reports
FOR EACH ROW EXECUTE FUNCTION public.notif_report_inserted();

DROP TRIGGER IF EXISTS trg_notif_blood_report ON public.blood_donor_reports;
CREATE TRIGGER trg_notif_blood_report
AFTER INSERT ON public.blood_donor_reports
FOR EACH ROW EXECUTE FUNCTION public.notif_report_inserted();

DROP TRIGGER IF EXISTS trg_notif_staff_report ON public.staff_profile_reports;
CREATE TRIGGER trg_notif_staff_report
AFTER INSERT ON public.staff_profile_reports
FOR EACH ROW EXECUTE FUNCTION public.notif_report_inserted();

DROP TRIGGER IF EXISTS trg_notif_listing_report ON public.listing_reports;
CREATE TRIGGER trg_notif_listing_report
AFTER INSERT ON public.listing_reports
FOR EACH ROW EXECUTE FUNCTION public.notif_report_inserted();
