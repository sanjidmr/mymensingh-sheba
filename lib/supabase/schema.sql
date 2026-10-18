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
    -- Short self-description, editable from the customer dashboard.
    bio TEXT,
    primary_area_id TEXT NOT NULL DEFAULT 'charpara', -- Centralized MCC area id (e.g., 'charpara', 'ganginarpar'); DEFAULT guards legacy signup-trigger inserts
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_contact TEXT,
    notification_preferences JSONB NOT NULL DEFAULT
      '{"post_updates":true,"request_updates":true,"support_replies":true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Idempotent upgrade for existing databases (add status + bio columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT
    '{"post_updates":true,"request_updates":true,"support_replies":true}'::jsonb;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_notification_preferences_object_check'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_notification_preferences_object_check
            CHECK (jsonb_typeof(notification_preferences) = 'object') NOT VALID;
    END IF;
END
$$;
-- Registration hardening: without a value here, any signup-time trigger that
-- inserts a profile row omitting the column would abort auth signup with a
-- NOT NULL violation ("Database error saving new user"). See
-- supabase/migrations/20261007000000_fix_user_registration_profiles.sql.
ALTER TABLE public.profiles ALTER COLUMN primary_area_id SET DEFAULT 'charpara';
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
    -- Profile-page detail. All optional on purpose: a tutor who has not filled
    -- these in must not have a fact invented for them, so the UI omits the
    -- whole section instead of printing a blank or a zero.
    -- A qualification timeline, newest first:
    --   [{ institution, department, degree, status: 'passed'|'studying'|'completed', year }]
    educations JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- What they are doing right now:
    --   { roleLabelBn, studyingAt, teachingAt, workingAt, note }
    current_activity JSONB,
    class_duration_minutes INTEGER,
    preferred_student_type TEXT,
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

-- Idempotent migration for the Service Request detail pages
-- (কাজের বুয়া / ইলেকট্রিশিয়ান / প্লাম্বার / বাসা পাল্টানো / এসি ও ফ্রিজ).
-- One nullable JSONB column holds everything that has no column of its own:
-- per-service question answers, the location blocks (including the second
-- address for a house move), the alternative phone number and the readable
-- Bangla summary. `details` and `service_type` are untouched, so every existing
-- admin screen and status flow keeps working.
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS service_meta JSONB DEFAULT NULL;

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
    -- Snapshot of the released number on the audit row itself: the requester can
    -- read it from THEIR OWN row, so the donor's private_phone stays revoked.
    contact_phone TEXT,
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
    item_type TEXT NOT NULL CHECK (item_type IN ('tolet', 'tutor', 'service', 'market')),
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
  -- A suspended/blocked admin is not an admin. `status` is admin-owned.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

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
    -- Editing an already-published profile keeps it approved: the UPDATE just
    -- re-asserts the status it already holds. Every other path into a guarded
    -- status (self-INSERT or a real transition) still requires an admin.
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
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
    -- Free text by design: owners answer "তাৎক্ষণিক সম্ভব" / "আগামী মাস থেকে" /
    -- a month name, rendered verbatim on the listing ("উপলব্ধ: <value>").
    available_from TEXT,
    facilities TEXT[] NOT NULL DEFAULT '{}',
    -- Facilities the owner explicitly states are NOT included. Drives the
    -- "এই বাসায় যা নেই" panel on the detail page. Optional on purpose: it is
    -- never inferred from the absence of an entry in `facilities`.
    unavailable_facilities TEXT[] NOT NULL DEFAULT '{}',
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

-- 11a. COMMUNITY POST REPORTS
--
-- Separate from `listing_reports` because that table is FK-bound to
-- `tolet_listings` and a marketplace item is a `community_posts` row. Reports
-- cascade on delete: a report about a row that no longer exists cannot be
-- actioned, so keeping it would only pollute the moderation queue.
--
-- Anyone may INSERT — guests included, because a fake listing is precisely the
-- case where the reporter has no account. No SELECT/UPDATE policy exists, so
-- with RLS enabled those actions are denied to every non-admin role; the UI
-- confirms success from the insert rather than from a re-read.
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

-- --- COMMUNITY POST REPORTS RLS ---
--
-- This table previously shipped with no `ENABLE ROW LEVEL SECURITY` and no
-- policies at all. Supabase grants ALL on new tables to `anon` and
-- `authenticated`, so with RLS disabled ANY visitor could read the entire
-- moderation queue (reporter names and reasons) and rewrite rows -- including
-- setting `status = 'dismissed'`, which removes a report from the very admin
-- who has to action it. The policies below close that and give the admin panel
-- the read access it needs. Kept in sync with
-- supabase/migrations/20261006000000_admin_panel_security.sql.
ALTER TABLE public.community_post_reports ENABLE ROW LEVEL SECURITY;

-- Guests may file a report (a fake listing is precisely the case where the
-- reporter has no account), but the row must be well-formed and a signed-in
-- reporter may only file under their own id.
 
-- 11b. TO-LET LISTING ENGAGEMENT EVENTS
--
-- Append-only log of every meaningful action on a listing detail page:
-- view / call_click / whatsapp_click / favorite / share. Written by
-- `lib/tolet-tracking.ts` and aggregated for the admin panel by the
-- `tolet_listing_analytics()` RPC below.
--
-- SEMANTICS — read before reporting on these numbers:
--   `call_click` records that the "কল করুন" button was PRESSED. It does NOT
--   mean a call was placed, connected or answered: the platform has no telephony
--   integration and cannot observe any of that. Admin copy must say
--   "কল বাটন চাপা হয়েছে" and must never say "কল হয়েছে".
--
-- DESIGN NOTES:
--   * `listing_id` is TEXT with NO foreign key on purpose. (a) Showcase ids are
--     not UUIDs, so an FK would reject them; (b) an FK would cascade-delete the
--     analytics history of a listing an owner removed, losing exactly the data
--     an admin would want to review. Denormalised area_id / property_type /
--     rent_price keep per-property reporting meaningful after deletion.
--   * `visitor_id` is an opaque client-generated id — never an IP address and
--     never a fingerprint — so unique-visitor counts work without collecting
--     anything identifying. Guests get `user_id = NULL` by design.
--   * Rows are readable by admins only. Public select is deliberately NOT
--     granted: engagement counts are business data and are also a small
--     fingerprinting surface.
CREATE TABLE IF NOT EXISTS public.tolet_listing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'call_click', 'whatsapp_click', 'favorite', 'share')),
    event_source TEXT NOT NULL DEFAULT 'detail_page'
        CHECK (event_source IN ('detail_page', 'sticky_bar', 'card')),
    visitor_id TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    area_id TEXT,
    property_type TEXT,
    rent_price INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aggregation reads are always "per listing", so that is the leading index.
CREATE INDEX IF NOT EXISTS idx_tolet_events_listing ON public.tolet_listing_events (listing_id);
CREATE INDEX IF NOT EXISTS idx_tolet_events_listing_type ON public.tolet_listing_events (listing_id, event_type);
CREATE INDEX IF NOT EXISTS idx_tolet_events_created ON public.tolet_listing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tolet_events_area ON public.tolet_listing_events (area_id);

ALTER TABLE public.tolet_listing_events ENABLE ROW LEVEL SECURITY;

-- Public writes only. The WITH CHECK constrains the shape of a row a visitor can
-- forge: they cannot attribute an event to somebody else's user_id, and they
-- cannot submit an event_type outside the vocabulary the UI uses.
DROP POLICY IF EXISTS "Anyone can record a tolet engagement event" ON public.tolet_listing_events;
CREATE POLICY "Anyone can record a tolet engagement event"
ON public.tolet_listing_events FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admins read everything; an owner additionally sees their own listing's rows so
-- they can judge interest without waiting on the platform.
DROP POLICY IF EXISTS "Admins read all tolet engagement events" ON public.tolet_listing_events;
CREATE POLICY "Admins read all tolet engagement events"
ON public.tolet_listing_events FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Owners read events for their own listings" ON public.tolet_listing_events;
CREATE POLICY "Owners read events for their own listings"
ON public.tolet_listing_events FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.tolet_listings l
        WHERE l.id::text = public.tolet_listing_events.listing_id
          AND l.owner_id = auth.uid()
    )
);

-- Aggregated rollup for the admin panel: one row per listing, hottest first.
-- Does the counting in Postgres so the console never pulls the raw event log.
-- SECURITY DEFINER because the underlying table's SELECT policy is admin-only;
-- the function re-checks is_admin() before returning anything.
CREATE OR REPLACE FUNCTION public.tolet_listing_analytics(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    listing_id            TEXT,
    listing_title         TEXT,
    area_id               TEXT,
    property_type         TEXT,
    rent_price            INTEGER,
    status                TEXT,
    views                 BIGINT,
    call_clicks           BIGINT,
    whatsapp_clicks       BIGINT,
    favorites             BIGINT,
    shares                BIGINT,
    unique_visitors       BIGINT,
    last_activity_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only';
    END IF;

    RETURN QUERY
    WITH ev AS (
        SELECT e.listing_id,
               COUNT(*) FILTER (WHERE e.event_type = 'view')           AS views,
               COUNT(*) FILTER (WHERE e.event_type = 'call_click')     AS call_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'whatsapp_click') AS whatsapp_clicks,
               COUNT(*) FILTER (WHERE e.event_type = 'favorite')       AS favorites,
               COUNT(*) FILTER (WHERE e.event_type = 'share')          AS shares,
               COUNT(DISTINCT COALESCE(e.user_id::text, e.visitor_id)) AS unique_visitors,
               MAX(e.created_at)                                       AS last_activity_at,
               -- Denormalised copy, used when the listing row no longer exists
               -- (owner deleted it) so the history is still attributable.
               MIN(e.area_id)                                         AS area_id
        FROM public.tolet_listing_events e
        GROUP BY e.listing_id
    )
    SELECT ev.listing_id,
           l.title,
           COALESCE(l.area_id, ev.area_id),
           l.property_type,
           l.rent_price,
           l.status,
           ev.views,
           ev.call_clicks,
           ev.whatsapp_clicks,
           ev.favorites,
           ev.shares,
           ev.unique_visitors,
           ev.last_activity_at
    FROM ev
    LEFT JOIN public.tolet_listings l ON l.id::text = ev.listing_id
    -- Hottest first: contact clicks, then views. Ties broken by recency so a
    -- freshly-active listing outranks a stale one with identical totals.
    ORDER BY (ev.call_clicks + ev.whatsapp_clicks) DESC, ev.views DESC, ev.last_activity_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500));
END;
$$;

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

CREATE OR REPLACE FUNCTION public.tolet_listings_owner_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'pending_review', 'unavailable') THEN
            NEW.status := 'pending_review';
        END IF;
        NEW.is_verified := FALSE;
        NEW.rejection_reason := NULL;
        NEW.published_at := NULL;
    ELSE
        NEW.owner_id := OLD.owner_id;
        NEW.is_verified := OLD.is_verified;
        NEW.published_at := OLD.published_at;
        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status NOT IN ('draft', 'pending_review', 'archived', 'unavailable') THEN
            RAISE EXCEPTION 'Only an admin can move a listing to status %', NEW.status
                USING ERRCODE = '42501';
        END IF;
        IF OLD.status = 'archived' AND NEW.status = 'pending_review' THEN
            NEW.rejection_reason := NULL;
        ELSE
            NEW.rejection_reason := OLD.rejection_reason;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_listings_owner_guard ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listings_owner_guard
BEFORE INSERT OR UPDATE ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.tolet_listings_owner_guard();

CREATE OR REPLACE FUNCTION public.fn_set_my_tolet_visibility(
    p_listing_id UUID,
    p_action TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing public.tolet_listings%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;
    IF p_action NOT IN ('archive', 'restore') THEN
        RAISE EXCEPTION 'invalid lifecycle action';
    END IF;
    SELECT * INTO listing
    FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid()
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing not found';
    END IF;

    IF p_action = 'archive' THEN
        IF listing.status IN ('archived', 'suspended') THEN
            RAISE EXCEPTION 'listing cannot be removed from display in its current status';
        END IF;
        UPDATE public.tolet_listings SET status = 'archived'
        WHERE id = p_listing_id AND owner_id = auth.uid();
        RETURN 'archived';
    END IF;

    IF listing.status <> 'archived' THEN
        RAISE EXCEPTION 'only an archived listing can be restored';
    END IF;
    IF length(btrim(listing.title)) < 8
       OR listing.property_type NOT IN ('flat', 'room', 'sublet', 'family', 'bachelor', 'mess', 'hostel', 'seat')
       OR NULLIF(btrim(listing.area_id), '') IS NULL
       OR length(btrim(COALESCE(listing.specific_address, ''))) < 5
       OR listing.rent_price NOT BETWEEN 100 AND 500000
       OR (listing.property_type IN ('mess', 'hostel', 'seat') AND COALESCE(listing.total_rooms, 0) < 1)
       OR (listing.property_type NOT IN ('mess', 'hostel', 'seat') AND listing.bedrooms < 1)
       OR listing.bathrooms < 0
       OR listing.balconies < 0
       OR length(btrim(COALESCE(listing.description, ''))) < 20 THEN
        RAISE EXCEPTION 'listing details are incomplete; edit and save the listing before restoring';
    END IF;

    UPDATE public.tolet_listings SET status = 'pending_review'
    WHERE id = p_listing_id AND owner_id = auth.uid();
    RETURN 'pending_review';
END;
$$;
REVOKE ALL ON FUNCTION public.fn_set_my_tolet_visibility(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_set_my_tolet_visibility(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_delete_my_tolet_listing(p_listing_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    listing_photos TEXT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;
    SELECT photos INTO listing_photos
    FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid()
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing not found';
    END IF;
    DELETE FROM public.tolet_listing_events WHERE listing_id = p_listing_id::TEXT;
    DELETE FROM public.tolet_listings
    WHERE id = p_listing_id AND owner_id = auth.uid();
    RETURN COALESCE(listing_photos, ARRAY[]::TEXT[]);
END;
$$;
REVOKE ALL ON FUNCTION public.fn_delete_my_tolet_listing(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_delete_my_tolet_listing(UUID) TO authenticated;

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

-- --- POST PHOTOS STORAGE ---
--
-- The `posts` bucket is referenced by `uploadPostImage()` in
-- `lib/catalog-service.ts` for every community-post cover / gallery image, so
-- without it image upload fails at runtime with "Bucket not found". Public for
-- the same reason `listings` is: an approved post's photo is rendered on a
-- public page from a stored URL. Writes are scoped to the uploader's own
-- `<uid>/…` folder, so no account can touch another account's image.
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Post photos are public" ON storage.objects;
CREATE POLICY "Post photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Authors upload their own post photos" ON storage.objects;
CREATE POLICY "Authors upload their own post photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authors update their own post photos" ON storage.objects;
CREATE POLICY "Authors update their own post photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authors delete their own post photos" ON storage.objects;
CREATE POLICY "Authors delete their own post photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

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
--
-- The `target_role = 'customer'` clause is load-bearing: the admin hub reads
-- every row with `target_role = 'admin'` (see "Users read own notifications"
-- above), so without it any signed-in customer could post arbitrary title/body
-- text straight into an admin's inbox. The database triggers that raise admin
-- notifications are SECURITY DEFINER and are not subject to this policy.
CREATE POLICY "Users create own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (user_id = auth.uid() AND target_role = 'customer')
);

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

CREATE OR REPLACE FUNCTION public.apply_customer_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    preferences JSONB;
    preference_key TEXT;
BEGIN
    IF NEW.target_role <> 'customer' OR NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    preference_key := CASE
        WHEN NEW.related_type IN ('community_post', 'tolet_listing', 'tutor_profile', 'blood_donor_profile')
            THEN 'post_updates'
        WHEN NEW.related_type IN ('service_request', 'tolet_request', 'blood_request')
            THEN 'request_updates'
        WHEN NEW.related_type = 'contact_message'
            THEN 'support_replies'
        ELSE NULL
    END;
    IF preference_key IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT p.notification_preferences INTO preferences
    FROM public.profiles AS p
    WHERE p.id = NEW.user_id;

    IF preferences ->> preference_key = 'false' THEN
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_customer_notification_preferences() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_apply_customer_notification_preferences ON public.notifications;
CREATE TRIGGER trg_apply_customer_notification_preferences
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.apply_customer_notification_preferences();

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

-- ====================================================================
-- CONTACT MESSAGES (/contact form)
-- ====================================================================

-- Messages sent through the public contact form. Anyone can send one (no
-- login required), which is why the INSERT policy below is open to `anon` as
-- well as `authenticated`; only admins can read the inbox.
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    subject TEXT NOT NULL CHECK (subject IN ('general', 'service_info', 'post_service', 'correction', 'complaint', 'partnership', 'other')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'replied', 'closed')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created
ON public.contact_messages (created_at DESC);

-- --- CONTACT MESSAGES RLS ---
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- The contact inbox is admin-only: a visitor's name, phone and message must
-- never be readable by another visitor.
DROP POLICY IF EXISTS "Admins read contact messages" ON public.contact_messages;
CREATE POLICY "Admins read contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.is_admin());

-- Guests may submit the form. Length checks mirror the client rules in
-- lib/contact-types.ts (NAME_MIN 3, MESSAGE_MAX 1500) so a hand-rolled request
-- cannot bypass them.
DROP POLICY IF EXISTS "Guests can send contact messages" ON public.contact_messages;
CREATE POLICY "Guests can send contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND length(trim(name)) >= 3
    AND phone IS NOT NULL AND length(trim(phone)) >= 10
    AND message IS NOT NULL AND length(trim(message)) >= 12
    AND length(message) <= 1500
);

DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins manage contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- A new contact message notifies the admin hub. It gets its own function
-- rather than reusing notif_report_inserted(), because that one hardcodes a
-- "রিপোর্ট" title and would mislabel every enquiry in the admin inbox.
CREATE OR REPLACE FUNCTION public.notif_contact_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন যোগাযোগের বার্তা',
        NEW.name || ' — ' || NEW.subject || ' বিষয়ে একটি বার্তা পাঠিয়েছেন। অনুরোধটি দেখে নিন।',
        'info', 'contact_message', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_contact_message ON public.contact_messages;
CREATE TRIGGER trg_notif_contact_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notif_contact_message();

-- ====================================================================
-- MARKETPLACE + LOCAL DIRECTORY MIGRATION
-- Covers: Coaching, WiFi, News, Jobs, Buy-Sell, Bus, Vehicle rental,
--         and the local Emergency directory (doctor/police/ambulance/fire).
--
-- Design notes
--  * `service_listings` is the single admin-curated table behind the four
--    admin-only directories (coaching / wifi / bus / vehicle). They share a
--    shape (title, image, area coverage, contact, status) but differ in their
--    category-specific attributes, which live in a JSONB `details` bag with a
--    CHECK that the keys the UI actually reads are present for that category.
--    One table keeps admin CRUD, search, and moderation to a single code path.
--  * `community_posts` is the single user-authored table behind News, Jobs and
--    Buy-Sell. It is author-scoped (RLS: authors read/edit only their own rows)
--    and ships in `pending` status so the existing admin moderation pattern can
--    approve it. A news post can be `featured` for the editorial lead slot.
--  * `emergency_contacts` is admin-curated and intentionally has NO public
--    write path. Phone numbers are only ever values an admin entered from a
--    verified source; there is no seed data in this file, because inventing a
--    local number is exactly what the platform must not do.
--  * `vehicle_requests` captures the "অনুরোধ করুন" form for the vehicle page.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SERVICE LISTINGS (admin-only: coaching / wifi / bus / vehicle)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL
        CHECK (category IN ('coaching', 'wifi', 'bus', 'vehicle')),
    -- URL-safe identifier used by /<category>/<slug> detail pages.
    slug TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    subtitle_bn TEXT,
    summary_bn TEXT,
    description_bn TEXT,
    image_url TEXT,
    logo_url TEXT,
    -- MCC area ids this listing serves. Empty = city-wide.
    area_ids TEXT[] NOT NULL DEFAULT '{}',
    -- Free-form highlight chips (e.g. wifi packages, bus amenities).
    tags TEXT[] NOT NULL DEFAULT '{}',
    -- Numeric fields the fee/speed/fare RANGE filters compare against.
    --  * coaching -> monthly_fee_min / monthly_fee_max
    --  * wifi     -> price_min / price_max (monthly taka)
    --  * bus      -> fare_min / fare_max
    --  * vehicle  -> left NULL (rental price is intentionally not shown)
    monthly_fee_min INTEGER,
    monthly_fee_max INTEGER,
    admission_fee INTEGER CHECK (admission_fee IS NULL OR admission_fee >= 0),
    price_min INTEGER,
    price_max INTEGER,
    speed_mbps INTEGER,
    fare_min INTEGER,
    fare_max INTEGER,
    -- Bus: origin / destination (free text, kept local and human).
    origin_bn TEXT,
    destination_bn TEXT,
    -- Vehicle: no rental price on the card, so capacity/notes only.
    seat_count INTEGER,
    -- Vehicle-only detail. Nullable and printed only when stored, so an older
    -- row keeps showing exactly the facts it actually has.
    photos TEXT[] NOT NULL DEFAULT '{}',
    model_name_bn TEXT,
    model_year INTEGER,
    has_ac BOOLEAN,
    driver_included BOOLEAN,
    available_time_bn TEXT,
    -- How price_min / price_max should be read: "প্রতি কিলোমিটার" etc.
    price_note_bn TEXT,
    -- Admin-curated public contact. Kept out of the public SELECT surface the
    -- same way staff_profiles keeps phone_private, and surfaced through the
    -- service facade / contact-form routing instead of a raw number.
    contact_phone_private TEXT,
    -- Who may add rows: only admins. Customers never write here, so the whole
    -- INSERT/UPDATE/DELETE surface is admin-gated in RLS below.
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- Slug is unique per category, not globally, so the same word can exist as a
    -- bus route and a coaching centre without colliding.
    UNIQUE (category, slug)
);

-- Idempotent upgrade for DBs created before this migration.
ALTER TABLE public.service_listings ADD COLUMN IF NOT EXISTS seat_count INTEGER;
ALTER TABLE public.service_listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.service_listings ADD COLUMN IF NOT EXISTS admission_fee INTEGER;

CREATE INDEX IF NOT EXISTS idx_service_listings_category_active
    ON public.service_listings (category, is_active);
CREATE INDEX IF NOT EXISTS idx_service_listings_slug
    ON public.service_listings (category, slug);

-- --------------------------------------------------------------------
-- 2. COMMUNITY POSTS (user-authored: news / jobs / buy-sell)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL CHECK (kind IN ('news', 'job', 'buy_sell')),
    slug TEXT NOT NULL UNIQUE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title_bn TEXT NOT NULL,
    summary_bn TEXT,
    -- Buy-sell uses this for the item name/price; news for the body excerpt.
    body_bn TEXT,
    cover_image_url TEXT,
    category TEXT,
    -- Optional location context (news local tag, job location, item area).
    area_id TEXT,
    -- Taxonomy chips (news category, buy-sell item type, job category).
    tags TEXT[] NOT NULL DEFAULT '{}',
    -- Numeric fields the range filters compare against.
    --  * job      -> salary_min / salary_max
    --  * buy_sell -> price (single point, mapped to both min & max for the range)
    salary_min INTEGER,
    salary_max INTEGER,
    price INTEGER,
    -- Job-only fields.
    job_type TEXT,
    -- Job-only: the hiring organisation / company. Added by the customer
    -- dashboard migration; NULL for every other kind and for every row
    -- written before it existed, so no existing post changes meaning.
    organization_bn TEXT,
    deadline DATE,
    -- Buy-sell-only field.
    condition_label TEXT,
    marketplace_status TEXT,
    -- Marketplace contact. `author_phone` / `whatsapp_number` are deliberately
    -- NOT part of the public column list used by the service layer: they are
    -- read back only through the `fetch_market_contact` RPC below, which
    -- returns them for an approved `buy_sell` row and nothing else. That keeps
    -- a news article or a job ad from ever exposing its author's number while
    -- still letting a buyer call the seller.
    author_name TEXT,
    author_phone TEXT,
    whatsapp_number TEXT,
    -- Extra product photos beyond the cover image.
    gallery TEXT[] NOT NULL DEFAULT '{}',
    -- Moderation. Customers may only ever insert 'pending'; approval is admin.
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    -- Why a moderator rejected this post. Set by an admin only; the author
    -- reads it through the existing "Authors read own posts" policy and it is
    -- shown on /dashboard. Mirrors tolet_listings.rejection_reason.
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT community_posts_marketplace_status_check CHECK (
        (kind = 'buy_sell' AND marketplace_status IN ('available', 'sold', 'closed'))
        OR (kind <> 'buy_sell' AND marketplace_status IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_community_posts_kind_status
    ON public.community_posts (kind, status);
CREATE INDEX IF NOT EXISTS idx_community_posts_author
    ON public.community_posts (author_id);

-- --------------------------------------------------------------------
-- 3. EMERGENCY CONTACTS (admin-only, verified local numbers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL
        CHECK (service IN ('doctor', 'police', 'ambulance', 'fire_service')),
    name_bn TEXT NOT NULL,
    organization_bn TEXT,
    area_id TEXT,
    address_bn TEXT,
    -- A REAL, locally-sourced number. No defaults, no national fallbacks in the
    -- data — an admin must enter a verified value or leave the row out.
    phone TEXT NOT NULL,
    -- Where the number came from, for auditability ("verified_source" note).
    source_note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_service_active
    ON public.emergency_contacts (service, is_active);

-- --------------------------------------------------------------------
-- 4. VEHICLE REQUESTS ("গাড়ির জন্য অনুরোধ করুন")
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_listing_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
    vehicle_kind TEXT NOT NULL CHECK (vehicle_kind IN ('গাড়ি', 'অটো', 'CNG')),
    vehicle_name TEXT,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    pickup_area_id TEXT,
    destination_area_id TEXT,
    travel_date DATE,
    travel_time TEXT,
    -- What the renter actually asked for, so an operator can quote without a
    -- phone call back. All nullable: the short form stays valid.
    passenger_count INTEGER,
    trip_duration TEXT,
    budget INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status
    ON public.vehicle_requests (status, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY — new tables
-- ====================================================================
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;

-- --- service_listings ---
-- Public (incl. anonymous) can read ONLY active rows. The public SELECT policy
-- intentionally does not expose contact_phone_private to non-admins; the
-- service facade never selects it for public reads either.
DROP POLICY IF EXISTS "Active service listings are public" ON public.service_listings;
CREATE POLICY "Active service listings are public"
ON public.service_listings FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

-- Admins manage every service listing. Customers have no INSERT/UPDATE/DELETE
-- policy at all, so RLS denies them by default (this is the "admin only" gate).
DROP POLICY IF EXISTS "Admins manage service listings" ON public.service_listings;
CREATE POLICY "Admins manage service listings"
ON public.service_listings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- community_posts ---
-- Public reads only approved posts (the news desk, jobs board, marketplace).
DROP POLICY IF EXISTS "Approved community posts are public" ON public.community_posts;
CREATE POLICY "Approved community posts are public"
ON public.community_posts FOR SELECT
TO anon, authenticated
USING (
    status = 'approved'
    AND (kind <> 'buy_sell' OR marketplace_status = 'available')
    AND (
        kind <> 'job'
        OR deadline IS NULL
        OR deadline >= (TIMEZONE('Asia/Dhaka', NOW()))::DATE
    )
);

-- Authors can see their own posts regardless of moderation state.
DROP POLICY IF EXISTS "Authors read own posts" ON public.community_posts;
CREATE POLICY "Authors read own posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- SECURITY: a customer may only insert a post that is their own AND still
-- 'pending'. They can never self-approve by sending status='approved'.
DROP POLICY IF EXISTS "Authors create own posts" ON public.community_posts;
CREATE POLICY "Authors create own posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid() AND status = 'pending');

-- Authors may edit the content of their own post, but must keep it 'pending'
-- (an edit re-enters moderation) and may not change the author.
DROP POLICY IF EXISTS "Authors update own posts" ON public.community_posts;
CREATE POLICY "Authors update own posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid() AND status = 'pending');

-- Authors may delete their own post; nobody else can delete it.
DROP POLICY IF EXISTS "Authors delete own posts" ON public.community_posts;
CREATE POLICY "Authors delete own posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Admins moderate everything (approve/reject/feature/delete).
DROP POLICY IF EXISTS "Admins moderate community posts" ON public.community_posts;
CREATE POLICY "Admins moderate community posts"
ON public.community_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- MODERATION COLUMN GUARD ---
-- RLS proves the ROW belongs to the caller and forces status = 'pending', but
-- it does not restrict WHICH columns a caller may write. Without this trigger
-- an author could insert their own post with is_featured = TRUE (it becomes
-- featured the moment an admin approves it) or overwrite/clear the rejection
-- reason a moderator left for them. The service layer strips those fields too,
-- but frontend stripping is not a security boundary — a crafted PostgREST
-- request skips it entirely. SECURITY DEFINER so the check can not be routed
-- around, and non-admins simply get the OLD values restored.
--
-- auth.uid() IS NULL means a migration / service-role write: those have no
-- user session to judge and must keep working (seeds, backfills).
CREATE OR REPLACE FUNCTION public.community_posts_guard_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.marketplace_status := CASE
                WHEN NEW.kind = 'buy_sell' THEN COALESCE(NEW.marketplace_status, 'available')
                ELSE NULL
            END;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        NEW.status := 'pending';
        NEW.is_featured := FALSE;
        NEW.published_at := NULL;
        NEW.rejection_reason := NULL;
        NEW.marketplace_status := CASE WHEN NEW.kind = 'buy_sell' THEN 'available' ELSE NULL END;
    ELSE
        IF OLD.kind = 'buy_sell'
           AND OLD.status = 'approved'
           AND NEW.status = OLD.status
           AND NEW.author_id = OLD.author_id
           AND NEW.kind = OLD.kind
           AND NEW.marketplace_status IN ('available', 'sold', 'closed')
           AND (to_jsonb(NEW) - 'marketplace_status' - 'updated_at')
               = (to_jsonb(OLD) - 'marketplace_status' - 'updated_at') THEN
            RETURN NEW;
        END IF;

        NEW.author_id := OLD.author_id;
        -- An author edit always re-enters moderation (matches RLS WITH CHECK),
        -- but only moderators decide feature/publish/rejection state.
        NEW.status := 'pending';
        NEW.is_featured := OLD.is_featured;
        NEW.published_at := OLD.published_at;
        NEW.rejection_reason := OLD.rejection_reason;
        NEW.marketplace_status := OLD.marketplace_status;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_moderation_guard ON public.community_posts;
CREATE TRIGGER trg_community_posts_moderation_guard
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_guard_moderation();

CREATE OR REPLACE FUNCTION public.community_posts_validate_category_length()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.category IS NOT NULL AND char_length(NEW.category) > 100 THEN
        RAISE EXCEPTION 'category must be 100 characters or fewer'
            USING ERRCODE = '23514',
                  CONSTRAINT = 'community_posts_category_check';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length
    ON public.community_posts;
DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length_insert
    ON public.community_posts;
DROP TRIGGER IF EXISTS trg_community_posts_validate_category_length_update
    ON public.community_posts;
CREATE TRIGGER trg_community_posts_validate_category_length_insert
BEFORE INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_validate_category_length();
CREATE TRIGGER trg_community_posts_validate_category_length_update
BEFORE UPDATE OF category ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_validate_category_length();

CREATE OR REPLACE FUNCTION public.community_posts_sync_legacy_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    post_kind TEXT;
    submitted_content TEXT;
    profile_name TEXT;
BEGIN
    post_kind := to_jsonb(NEW) ->> 'kind';
    IF post_kind = 'news' THEN
        submitted_content := COALESCE(
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'body_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'summary_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'content'), '')
        );
    ELSE
        submitted_content := COALESCE(
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'summary_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'body_bn'), ''),
            NULLIF(BTRIM(to_jsonb(NEW) ->> 'content'), '')
        );
    END IF;

    IF submitted_content IS NOT NULL AND to_jsonb(NEW) ? 'content' THEN
        NEW := jsonb_populate_record(NEW, jsonb_build_object('content', submitted_content));
    END IF;

    IF auth.uid() IS NOT NULL AND public.is_admin() IS NOT TRUE THEN
        SELECT profiles.full_name
          INTO profile_name
          FROM public.profiles
         WHERE profiles.id = auth.uid();

        IF NULLIF(BTRIM(profile_name), '') IS NOT NULL THEN
            NEW.author_name := BTRIM(profile_name);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_sync_legacy_content ON public.community_posts;
CREATE TRIGGER trg_community_posts_sync_legacy_content
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_sync_legacy_content();

-- Seller contact for a marketplace item — the ONLY way a buyer's browser ever
-- reads a seller's number.
--
-- PostgREST column lists are not a security boundary: any row an anon visitor
-- can SELECT, they can select every column of. So the marketplace phone cannot
-- simply be left out of the public query — it has to be unreadable at the
-- database level and handed over only through a function that checks what the
-- row actually is. This does that: it returns contact details for an APPROVED
-- `buy_sell` post and for nothing else, so a news article or a job ad can never
-- leak its author's number no matter what the client asks for.
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
SET search_path = ''
AS $$
    SELECT p.id, p.author_name, p.author_phone, p.whatsapp_number
    FROM public.community_posts p
    WHERE p.slug = p_slug
      AND p.kind = 'buy_sell'
      AND p.status = 'approved'
      AND p.marketplace_status = 'available'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_my_marketplace_status(
    p_id UUID,
    p_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    updated_status TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'sign-in required';
    END IF;
    IF p_status NOT IN ('available', 'sold', 'closed') THEN
        RAISE EXCEPTION 'invalid marketplace status';
    END IF;

    UPDATE public.community_posts
    SET marketplace_status = p_status,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
      AND author_id = auth.uid()
      AND kind = 'buy_sell'
      AND status = 'approved'
    RETURNING marketplace_status INTO updated_status;

    IF updated_status IS NULL THEN
        RAISE EXCEPTION 'marketplace post not found or not approved';
    END IF;
    RETURN updated_status;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_set_my_marketplace_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_set_my_marketplace_status(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.fetch_market_contact(TEXT) IS
    'Seller contact for an approved and available buy_sell post only.';

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO anon, authenticated;

-- ============================================================
-- PRIVACY & SECURITY HARDENING (mirrors migration 20261006020000)
-- Column-level REVOKEs + SECURITY DEFINER RPCs for the reads
-- that legitimately need revoked PII. See that migration for
-- the full rationale.
-- ============================================================

-- --- Column-level REVOKEs (anon key can no longer select PII) ---
-- Block raw table reads for the public key; public-approved rows must go through
-- the narrow SECURITY DEFINER RPCs that project only the allowed columns. The
-- authenticated role still keeps its owner/admin access via RLS policies.
REVOKE SELECT ON TABLE public.tolet_profiles FROM anon;
REVOKE SELECT (phone, emergency_phone, nid_number, nid_doc_url, holding_number, address_line)
ON public.tolet_profiles FROM anon, authenticated;

REVOKE SELECT ON TABLE public.home_tutor_profiles FROM anon;
REVOKE SELECT (private_phone, nid_number, admin_notes)
ON public.home_tutor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.home_tutor_profiles FROM anon;

REVOKE SELECT ON TABLE public.blood_donor_profiles FROM anon;
REVOKE SELECT (private_phone, admin_notes)
ON public.blood_donor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.blood_donor_profiles FROM anon;

REVOKE SELECT ON TABLE public.staff_profiles FROM anon;
REVOKE SELECT (phone_private) ON public.staff_profiles FROM anon, authenticated;

REVOKE SELECT ON TABLE public.community_posts FROM anon;
REVOKE SELECT (author_phone, whatsapp_number, rejection_reason)
ON public.community_posts FROM anon, authenticated;

REVOKE SELECT ON TABLE public.service_listings FROM anon;
REVOKE SELECT (contact_phone_private) ON public.service_listings FROM anon, authenticated;

-- --- Owner self-read RPCs (full caller-owned rows incl. PII) ---
CREATE OR REPLACE FUNCTION public.fn_my_tolet_profile()
RETURNS SETOF public.tolet_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.tolet_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_tutor_profile()
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_donor_profile()
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t WHERE t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_posts()
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.author_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_my_post_by_id(p_id UUID)
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.id = p_id AND p.author_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.fn_my_post_by_slug(p_kind TEXT, p_slug TEXT)
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p
  WHERE p.kind = p_kind AND p.slug = p_slug AND p.author_id = auth.uid();
$$;

-- --- Admin RPCs (moderation reads; gated by is_admin() inside) ---
CREATE OR REPLACE FUNCTION public.fn_admin_tutor_profiles()
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t
  WHERE public.is_admin()
  ORDER BY t.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_tutor_profile(p_id UUID)
RETURNS SETOF public.home_tutor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.home_tutor_profiles t
  WHERE public.is_admin() AND t.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_donor_profiles()
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t
  WHERE public.is_admin()
  ORDER BY t.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_donor_profile(p_id UUID)
RETURNS SETOF public.blood_donor_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.* FROM public.blood_donor_profiles t
  WHERE public.is_admin() AND t.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_donor_phone(p_donor_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.private_phone FROM public.blood_donor_profiles t
  WHERE public.is_admin() AND t.id = p_donor_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_staff_profiles()
RETURNS SETOF public.staff_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.* FROM public.staff_profiles s
  WHERE public.is_admin()
  ORDER BY s.updated_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_staff_profile(p_id UUID)
RETURNS SETOF public.staff_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.* FROM public.staff_profiles s
  WHERE public.is_admin() AND s.id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_posts()
RETURNS SETOF public.community_posts
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.* FROM public.community_posts p WHERE public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_service_listings(p_category TEXT)
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT l.* FROM public.service_listings l
  WHERE public.is_admin() AND l.category = p_category
  ORDER BY l.is_featured DESC, l.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_service_listing(p_category TEXT, p_slug TEXT)
RETURNS SETOF public.service_listings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT l.* FROM public.service_listings l
  WHERE public.is_admin() AND l.category = p_category AND l.slug = p_slug;
$$;

-- --- Grants: explicit, minimal ---
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_tolet_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_tutor_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_donor_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_posts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_post_by_id(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_my_post_by_slug(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_tutor_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_tutor_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_donor_phone(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_staff_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_staff_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_posts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_service_listings(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_admin_service_listing(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_tolet_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_tutor_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_donor_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_post_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_post_by_slug(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_tutor_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_tutor_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_donor_phone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_staff_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_service_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_service_listing(TEXT, TEXT) TO authenticated;

-- --- emergency_contacts ---
-- Public reads active rows (verified local numbers only). No customer write.
DROP POLICY IF EXISTS "Active emergency contacts are public" ON public.emergency_contacts;
CREATE POLICY "Active emergency contacts are public"
ON public.emergency_contacts FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Admins manage emergency contacts"
ON public.emergency_contacts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- vehicle_requests ---
-- A visitor (even anonymous) may submit a request; admins read the inbox.
-- Guests can INSERT but cannot read back the inbox.
DROP POLICY IF EXISTS "Anyone can submit vehicle requests" ON public.vehicle_requests;
CREATE POLICY "Anyone can submit vehicle requests"
ON public.vehicle_requests FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'new');

-- Admins read and manage all vehicle requests.
DROP POLICY IF EXISTS "Admins manage vehicle requests" ON public.vehicle_requests;
CREATE POLICY "Admins manage vehicle requests"
ON public.vehicle_requests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- A signed-in customer may read their own submitted requests.
DROP POLICY IF EXISTS "Customers read own vehicle requests" ON public.vehicle_requests;
CREATE POLICY "Customers read own vehicle requests"
ON public.vehicle_requests FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- --- updated_at triggers for the new tables ---
DROP TRIGGER IF EXISTS trg_service_listings_updated ON public.service_listings;
CREATE TRIGGER trg_service_listings_updated
BEFORE UPDATE ON public.service_listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_community_posts_updated ON public.community_posts;
CREATE TRIGGER trg_community_posts_updated
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_emergency_contacts_updated ON public.emergency_contacts;
CREATE TRIGGER trg_emergency_contacts_updated
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicle_requests_updated ON public.vehicle_requests;
CREATE TRIGGER trg_vehicle_requests_updated
BEFORE UPDATE ON public.vehicle_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- New community posts and vehicle requests notify the admin hub, matching the
-- existing service_request / contact_message notification pattern.
CREATE OR REPLACE FUNCTION public.notif_community_post_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন ' || NEW.kind || ' পোস্ট',
        NEW.title_bn || ' — অনুমোদনের জন্য অপেক্ষমাণ।',
        'info', 'community_post', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_community_post ON public.community_posts;
CREATE TRIGGER trg_notif_community_post
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.notif_community_post_inserted();

-- A moderation DECISION tells the author. Before this the only post
-- notification was the admin hub on insert, so an author had to reload the
-- dashboard to discover whether their post had been approved — or why it had
-- not been. Server-side and SECURITY DEFINER, so a client cannot forge one.
CREATE OR REPLACE FUNCTION public.notif_community_post_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.author_id, 'customer',
            'আপনার পোস্ট অনুমোদিত হয়েছে',
            '“' || NEW.title_bn || '” এখন সবার জন্য দেখা যাচ্ছে।',
            'success', 'community_post', NEW.id::text
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.author_id, 'customer',
            'পোস্টটি অনুমোদিত হয়নি',
            CASE
                WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                    THEN '“' || NEW.title_bn || '” অনুমোদিত হয়নি। কারণ: '
                         || BTRIM(NEW.rejection_reason)
                         || ' — কারণটি পড়ে সম্পাদনা করে আবার পাঠান।'
                ELSE '“' || NEW.title_bn || '” অনুমোদিত হয়নি। সম্পাদনা করে আবার পাঠাতে পারেন।'
            END,
            'warning', 'community_post', NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_community_post_status ON public.community_posts;
CREATE TRIGGER trg_notif_community_post_status
AFTER UPDATE OF status ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.notif_community_post_status_changed();

CREATE OR REPLACE FUNCTION public.notif_vehicle_request_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন গাড়ি/অটো/CNG অনুরোধ',
        NEW.contact_name || ' — ' || NEW.vehicle_kind || ' অনুরোধ পাঠিয়েছেন।',
        'info', 'vehicle_request', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_vehicle_request ON public.vehicle_requests;
CREATE TRIGGER trg_notif_vehicle_request
AFTER INSERT ON public.vehicle_requests
FOR EACH ROW EXECUTE FUNCTION public.notif_vehicle_request_inserted();

-- Private customer support conversations and tracked complaint attachments.
CREATE TABLE IF NOT EXISTS public.contact_message_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_contact_message_replies_thread
    ON public.contact_message_replies (message_id, created_at);
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.contact_message_replies TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_contact_conversation(target_message_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.contact_messages AS message
            WHERE message.id = target_message_id AND message.user_id = auth.uid()
        )
$$;
REVOKE ALL ON FUNCTION public.can_access_contact_conversation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_contact_conversation(UUID) TO authenticated;

DROP POLICY IF EXISTS "Conversation participants read replies" ON public.contact_message_replies;
CREATE POLICY "Conversation participants read replies"
ON public.contact_message_replies FOR SELECT TO authenticated
USING (public.can_access_contact_conversation(message_id));

DROP POLICY IF EXISTS "Conversation participants add replies" ON public.contact_message_replies;
CREATE POLICY "Conversation participants add replies"
ON public.contact_message_replies FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND (
        (sender_role = 'admin' AND public.is_admin())
        OR (
            sender_role = 'customer'
            AND NOT public.is_admin()
            AND public.can_access_contact_conversation(message_id)
        )
    )
);

ALTER TABLE public.contact_messages
    ADD COLUMN IF NOT EXISTS complaint_category TEXT,
    ADD COLUMN IF NOT EXISTS complaint_subject TEXT,
    ADD COLUMN IF NOT EXISTS attachment_path TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_complaint_category_check' AND conrelid = 'public.contact_messages'::regclass) THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_complaint_category_check
            CHECK (complaint_category IS NULL OR complaint_category IN ('account', 'posts', 'service', 'safety', 'payment', 'other')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_complaint_subject_check' AND conrelid = 'public.contact_messages'::regclass) THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_complaint_subject_check
            CHECK (complaint_subject IS NULL OR length(trim(complaint_subject)) BETWEEN 3 AND 120) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_attachment_path_check' AND conrelid = 'public.contact_messages'::regclass) THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_attachment_path_check
            CHECK (attachment_path IS NULL OR (user_id IS NOT NULL AND length(attachment_path) <= 500)) NOT VALID;
    END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('support-attachments', 'support-attachments', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "Support attachment owner and admins read" ON storage.objects;
CREATE POLICY "Support attachment owner and admins read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS "Customers upload own support attachments" ON storage.objects;
CREATE POLICY "Customers upload own support attachments" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Customers delete own support attachments" ON storage.objects;
CREATE POLICY "Customers delete own support attachments" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS "Guests can send contact messages" ON public.contact_messages;
CREATE POLICY "Guests can send contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND length(trim(name)) >= 3
    AND phone IS NOT NULL AND length(trim(phone)) >= 10
    AND message IS NOT NULL AND length(trim(message)) BETWEEN 12 AND 1500
    AND (
        (auth.uid() IS NULL AND user_id IS NULL AND attachment_path IS NULL)
        OR (
            auth.uid() IS NOT NULL
            AND (user_id IS NULL OR user_id = auth.uid())
            AND (
                user_id IS NULL OR subject <> 'complaint'
                OR (
                    complaint_category IN ('account', 'posts', 'service', 'safety', 'payment', 'other')
                    AND complaint_subject IS NOT NULL
                    AND length(trim(complaint_subject)) BETWEEN 3 AND 120
                )
            )
            AND (
                attachment_path IS NULL
                OR (user_id = auth.uid() AND subject = 'complaint' AND attachment_path LIKE auth.uid()::text || '/%')
            )
        )
    )
);

DROP FUNCTION IF EXISTS public.fn_my_contact_conversations();
CREATE FUNCTION public.fn_my_contact_conversations()
RETURNS TABLE (
    id UUID, subject TEXT, message TEXT, status TEXT, created_at TIMESTAMPTZ,
    complaint_category TEXT, complaint_subject TEXT, attachment_path TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT m.id, m.subject, m.message, m.status, m.created_at,
           m.complaint_category, m.complaint_subject, m.attachment_path
    FROM public.contact_messages AS m
    WHERE m.user_id = auth.uid()
    ORDER BY m.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.fn_my_contact_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_contact_conversations() TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_contact_message_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    message_owner UUID;
    message_subject TEXT;
BEGIN
    SELECT user_id, subject INTO message_owner, message_subject
    FROM public.contact_messages WHERE id = NEW.message_id;
    IF NEW.sender_role = 'admin' AND message_owner IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (message_owner, 'customer', 'সাপোর্ট টিমের উত্তর',
            'আপনার "' || message_subject || '" বার্তার উত্তর এসেছে।',
            'info', 'contact_message', NEW.message_id::text);
    ELSIF NEW.sender_role = 'customer' THEN
        INSERT INTO public.notifications (target_role, title, body, type, related_type, related_id)
        VALUES ('admin', 'সাপোর্ট বার্তার উত্তর', 'একজন গ্রাহক কথোপকথনে নতুন উত্তর দিয়েছেন।',
            'info', 'contact_message', NEW.message_id::text);
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_contact_message_reply() FROM PUBLIC;
DROP TRIGGER IF EXISTS trg_notify_contact_message_reply ON public.contact_message_replies;
CREATE TRIGGER trg_notify_contact_message_reply AFTER INSERT ON public.contact_message_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_contact_message_reply();

CREATE OR REPLACE FUNCTION public.notif_tolet_listing_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    IF NEW.status = 'approved' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (NEW.owner_id, 'customer', 'আপনার বাসাভাড়ার পোস্ট অনুমোদিত হয়েছে',
            '“' || NEW.title || '” এখন সবার জন্য দেখা যাচ্ছে।',
            'success', 'tolet_listing', NEW.id::text);
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (NEW.owner_id, 'customer', 'বাসাভাড়ার পোস্টে সংশোধন প্রয়োজন',
            CASE WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
                THEN '“' || NEW.title || '” পোস্টে সংশোধন প্রয়োজন। কারণ: ' || BTRIM(NEW.rejection_reason)
                ELSE '“' || NEW.title || '” পোস্টে সংশোধন করে আবার জমা দিন।' END,
            'warning', 'tolet_listing', NEW.id::text);
    ELSIF NEW.status = 'suspended' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (NEW.owner_id, 'customer', 'বাসাভাড়ার পোস্টের অবস্থা পরিবর্তিত হয়েছে',
            '“' || NEW.title || '” আপাতত স্থগিত রাখা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।',
            'warning', 'tolet_listing', NEW.id::text);
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notif_tolet_listing_status_changed() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notif_tolet_listing_status ON public.tolet_listings;
CREATE TRIGGER trg_notif_tolet_listing_status AFTER UPDATE OF status ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.notif_tolet_listing_status_changed();

CREATE OR REPLACE FUNCTION public.notif_contact_conversation_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.user_id IS NULL THEN RETURN NEW; END IF;
    IF NEW.status = 'closed' THEN
        INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
        VALUES (
            NEW.user_id, 'customer',
            CASE WHEN NEW.subject = 'complaint' THEN 'আপনার অভিযোগের আপডেট' ELSE 'সাপোর্ট বার্তার আপডেট' END,
            CASE WHEN NEW.subject = 'complaint'
                THEN '“' || COALESCE(NEW.complaint_subject, 'আপনার অভিযোগ') || '” সমাধান করে বন্ধ করা হয়েছে।'
                ELSE 'আপনার সাপোর্ট কথোপকথন বন্ধ করা হয়েছে।' END,
            'info', 'contact_message', NEW.id::text
        );
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notif_contact_conversation_status_changed() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notif_contact_conversation_status ON public.contact_messages;
CREATE TRIGGER trg_notif_contact_conversation_status AFTER UPDATE OF status ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notif_contact_conversation_status_changed();

CREATE OR REPLACE FUNCTION public.notif_customer_profile_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    profile_label TEXT;
    related_kind TEXT;
    status_title TEXT;
    status_body TEXT;
    status_type TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME = 'home_tutor_profiles' THEN
        profile_label := 'গৃহশিক্ষক প্রোফাইল';
        related_kind := 'tutor_profile';
    ELSE
        profile_label := 'রক্তদাতা প্রোফাইল';
        related_kind := 'blood_donor_profile';
    END IF;

    IF NEW.status = 'approved' THEN
        status_title := profile_label || ' অনুমোদিত হয়েছে';
        status_body := 'আপনার ' || profile_label || ' এখন প্রকাশিত হয়েছে।';
        status_type := 'success';
    ELSIF NEW.status = 'rejected' THEN
        status_title := profile_label || ' সংশোধন প্রয়োজন';
        status_body := CASE WHEN NULLIF(BTRIM(NEW.rejection_reason), '') IS NOT NULL
            THEN 'আপনার ' || profile_label || ' সংশোধন করুন। কারণ: ' || BTRIM(NEW.rejection_reason)
            ELSE 'আপনার ' || profile_label || ' সংশোধন করে আবার জমা দিন।' END;
        status_type := 'warning';
    ELSIF NEW.status = 'suspended' THEN
        status_title := profile_label || ' সাময়িকভাবে স্থগিত';
        status_body := 'আপনার ' || profile_label || ' সাময়িকভাবে স্থগিত রাখা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।';
        status_type := 'warning';
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (NEW.user_id, 'customer', status_title, status_body, status_type, related_kind, NEW.id::text);
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notif_customer_profile_status_changed() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notif_tutor_profile_status ON public.home_tutor_profiles;
CREATE TRIGGER trg_notif_tutor_profile_status AFTER UPDATE OF status ON public.home_tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notif_customer_profile_status_changed();
DROP TRIGGER IF EXISTS trg_notif_blood_donor_profile_status ON public.blood_donor_profiles;
CREATE TRIGGER trg_notif_blood_donor_profile_status AFTER UPDATE OF status ON public.blood_donor_profiles
FOR EACH ROW EXECUTE FUNCTION public.notif_customer_profile_status_changed();
