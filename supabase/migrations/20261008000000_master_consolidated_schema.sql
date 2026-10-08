-- ============================================================================
-- MYMENSINGH SHEBA — MASTER SCHEMA MIGRATION (single source of truth)
-- ============================================================================
-- Generated 2026-10-07.
--
-- This ONE file replaces the previous, fragmented migration set. It is:
--   * self-contained  — no \\i includes, no reliance on lib/supabase/schema.sql;
--   * ordered         — extensions, tables, indexes, helpers, triggers, RLS,
--                       policies, storage, then the corrections/additions;
--   * idempotent      — CREATE ... IF NOT EXISTS, DROP POLICY IF EXISTS,
--                       DROP FUNCTION ... CASCADE before redefining;
--   * production-safe — no NEW/OLD inside any CREATE POLICY (the cause of
--                       "42P01 missing FROM-clause entry for table new").
--
-- Execution order (top to bottom, single transaction not required):
--   PART 0  function-conflict prelude (drops stale function definitions)
--   PART 1  full domain schema + RLS (the old lib/supabase/schema.sql, fixed)
--   PART 2  corrections & objects that only lived in old migrations
--   PART 3  read-only verification (raises an exception if anything is missing)
--
-- Apply with:  supabase db push   (after removing/archiving the old migration
--              files) or paste the whole file into the Supabase SQL editor.
-- ============================================================================

-- ====================================================================
-- MYMENSINGH SHEBA - PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Service Area: Exclusively within Mymensingh City Corporation (MCC)
-- One-Account System: Customer + Service Profile Extensions
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 0. FUNCTION-CONFLICT PRELUDE
-- ============================================================================
-- DROP before CREATE OR REPLACE so a database that still holds an older
-- definition (different parameter names, or a RETURNS TABLE with different
-- output column names) cannot fail with:
--   42P13 cannot change name of input parameter "listing_id"
--   42P13 cannot change return type of existing function
-- CASCADE removes any RLS policy that depended on a dropped function; every
-- such policy is recreated in PART 1 below.
-- ============================================================================
DROP FUNCTION IF EXISTS public.is_listing_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.tolet_listing_analytics(integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_recent_activity(integer) CASCADE;
DROP FUNCTION IF EXISTS public.fetch_market_contact(text) CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_tolet_profile() CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_tutor_profile() CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_donor_profile() CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_posts() CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_post_by_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_my_post_by_slug(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_tutor_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_tutor_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_donor_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_donor_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_donor_phone(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_staff_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_staff_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_posts() CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_service_listings(text) CASCADE;
DROP FUNCTION IF EXISTS public.fn_admin_service_listing(text, text) CASCADE;


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
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Idempotent upgrade for existing databases (add status + bio columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
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
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
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
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
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
DROP POLICY IF EXISTS "Approved tolet profiles are public" ON public.tolet_profiles;
CREATE POLICY "Approved tolet profiles are public"
ON public.tolet_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

-- Owners can insert and update their own tolet profile
DROP POLICY IF EXISTS "Owners can create their tolet profile" ON public.tolet_profiles;
CREATE POLICY "Owners can create their tolet profile"
ON public.tolet_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update their tolet profile" ON public.tolet_profiles;
CREATE POLICY "Owners can update their tolet profile"
ON public.tolet_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

-- Admins can update any tolet profile (e.g. approve, suspend)
DROP POLICY IF EXISTS "Admins manage tolet profiles" ON public.tolet_profiles;
CREATE POLICY "Admins manage tolet profiles"
ON public.tolet_profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- --- HOME TUTOR PROFILES POLICIES ---
-- Public can view approved tutors, but phone is hidden in public view
DROP POLICY IF EXISTS "Approved tutors are viewable" ON public.home_tutor_profiles;
CREATE POLICY "Approved tutors are viewable"
ON public.home_tutor_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create their tutor profile" ON public.home_tutor_profiles;
CREATE POLICY "Users can create their tutor profile"
ON public.home_tutor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their tutor profile" ON public.home_tutor_profiles;
CREATE POLICY "Users can update their tutor profile"
ON public.home_tutor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

DROP POLICY IF EXISTS "Admins manage tutor profiles" ON public.home_tutor_profiles;
CREATE POLICY "Admins manage tutor profiles"
ON public.home_tutor_profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- --- TUTOR REVIEWS POLICIES ---
-- Public (incl. anonymous) can read only published reviews; customer/admin see their rows.
DROP POLICY IF EXISTS "Published tutor reviews are public" ON public.tutor_reviews;
CREATE POLICY "Published tutor reviews are public"
ON public.tutor_reviews FOR SELECT
TO anon
USING (is_published = TRUE);

DROP POLICY IF EXISTS "Reviewers and admins read tutor reviews" ON public.tutor_reviews;
CREATE POLICY "Reviewers and admins read tutor reviews"
ON public.tutor_reviews FOR SELECT
TO authenticated
USING (is_published = TRUE OR auth.uid() = customer_id OR public.is_admin());

-- A customer may insert a review only for their OWN completed tutor request
-- (the validation trigger enforces this server-side — never trust the frontend).
DROP POLICY IF EXISTS "Customers can review tutors after completed request" ON public.tutor_reviews;
CREATE POLICY "Customers can review tutors after completed request"
ON public.tutor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins moderate tutor reviews" ON public.tutor_reviews;
CREATE POLICY "Admins moderate tutor reviews"
ON public.tutor_reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- TUTOR REPORTS POLICIES ---
DROP POLICY IF EXISTS "Tutor reports readable by admins or reporter" ON public.tutor_reports;
CREATE POLICY "Tutor reports readable by admins or reporter"
ON public.tutor_reports FOR SELECT
TO authenticated
USING (public.is_admin() OR (reporter_id IS NOT NULL AND reporter_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can report tutors" ON public.tutor_reports;
CREATE POLICY "Authenticated users can report tutors"
ON public.tutor_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Guests can report tutors" ON public.tutor_reports;
CREATE POLICY "Guests can report tutors"
ON public.tutor_reports FOR INSERT
TO anon
WITH CHECK (reporter_id IS NULL AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Admins manage tutor reports" ON public.tutor_reports;
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
DROP POLICY IF EXISTS "Approved donors viewable" ON public.blood_donor_profiles;
CREATE POLICY "Approved donors viewable"
ON public.blood_donor_profiles FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can register as blood donor" ON public.blood_donor_profiles;
CREATE POLICY "Users can register as blood donor"
ON public.blood_donor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their donor profile" ON public.blood_donor_profiles;
CREATE POLICY "Users can update their donor profile"
ON public.blood_donor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending_approval', 'approved'));

DROP POLICY IF EXISTS "Admins manage blood donor profiles" ON public.blood_donor_profiles;
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
DROP POLICY IF EXISTS "Customers can view own blood requests" ON public.blood_requests;
CREATE POLICY "Customers can view own blood requests"
ON public.blood_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can create blood requests" ON public.blood_requests;
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
DROP POLICY IF EXISTS "Customers can cancel own blood request" ON public.blood_requests;
CREATE POLICY "Customers can cancel own blood request"
ON public.blood_requests FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin())
WITH CHECK (
  public.is_admin() OR
  auth.uid() = customer_id
);

DROP POLICY IF EXISTS "Admins manage blood requests" ON public.blood_requests;
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
DROP POLICY IF EXISTS "Requester can view own contact releases" ON public.blood_contact_releases;
CREATE POLICY "Requester can view own contact releases"
ON public.blood_contact_releases FOR SELECT
TO authenticated
USING (released_to_customer = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins record contact releases" ON public.blood_contact_releases;
CREATE POLICY "Admins record contact releases"
ON public.blood_contact_releases FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage contact release audits" ON public.blood_contact_releases;
CREATE POLICY "Admins manage contact release audits"
ON public.blood_contact_releases FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- BLOOD DONOR REPORTS POLICIES ---
DROP POLICY IF EXISTS "Donor reports readable by admins or reporter" ON public.blood_donor_reports;
CREATE POLICY "Donor reports readable by admins or reporter"
ON public.blood_donor_reports FOR SELECT
TO authenticated
USING (public.is_admin() OR (reporter_id IS NOT NULL AND reporter_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can report donors" ON public.blood_donor_reports;
CREATE POLICY "Authenticated users can report donors"
ON public.blood_donor_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Guests can report donors" ON public.blood_donor_reports;
CREATE POLICY "Guests can report donors"
ON public.blood_donor_reports FOR INSERT
TO anon
WITH CHECK (reporter_id IS NULL AND reporter_name IS NOT NULL AND trim(reporter_name) <> '');

DROP POLICY IF EXISTS "Admins manage donor reports" ON public.blood_donor_reports;
CREATE POLICY "Admins manage donor reports"
ON public.blood_donor_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- SERVICE REQUESTS POLICIES ---
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
CREATE POLICY "Users can view own service requests"
ON public.service_requests FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create service requests" ON public.service_requests;
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
  auth.uid() = customer_id
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
DROP POLICY IF EXISTS "Users manage own saved items" ON public.saved_items;
CREATE POLICY "Users manage own saved items"
ON public.saved_items FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- --- STAFF PROFILES POLICIES (Admin-managed: কাজের বুয়া / Electrician / Plumber) ---
-- Public (including anonymous visitors) can read ONLY active profiles.
-- phone_private column is never queryable by non-admins because admin-only policies gate write,
-- and public SELECT rows flow through the staff-service facade which strips it defensively.
DROP POLICY IF EXISTS "Active staff profiles are public" ON public.staff_profiles;
CREATE POLICY "Active staff profiles are public"
ON public.staff_profiles FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage staff profiles" ON public.staff_profiles;
CREATE POLICY "Admins manage staff profiles"
ON public.staff_profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --- STAFF PROFILE REPORTS POLICIES ---
DROP POLICY IF EXISTS "Staff reports readable by admins" ON public.staff_profile_reports;
CREATE POLICY "Staff reports readable by admins"
ON public.staff_profile_reports FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can report staff profiles" ON public.staff_profile_reports;
CREATE POLICY "Authenticated users can report staff profiles"
ON public.staff_profile_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

DROP POLICY IF EXISTS "Guests can report staff profiles" ON public.staff_profile_reports;
CREATE POLICY "Guests can report staff profiles"
ON public.staff_profile_reports FOR INSERT
WITH CHECK (reporter_id IS NULL);

DROP POLICY IF EXISTS "Admins manage staff reports" ON public.staff_profile_reports;
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
DROP POLICY IF EXISTS "Staff profile photos are public" ON storage.objects;
CREATE POLICY "Staff profile photos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff');

DROP POLICY IF EXISTS "Admins can upload staff profile photos" ON storage.objects;
CREATE POLICY "Admins can upload staff profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staff' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update or delete staff profile photos" ON storage.objects;
CREATE POLICY "Admins can update or delete staff profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'staff' AND public.is_admin())
WITH CHECK (bucket_id = 'staff' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete staff profile photos" ON storage.objects;
CREATE POLICY "Admins can delete staff profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'staff' AND public.is_admin());

-- Avatars are publicly readable, uploadable by the user
DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
CREATE POLICY "Avatars are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update or delete their own avatar" ON storage.objects;
CREATE POLICY "Users can update or delete their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verification documents (NID, Student ID, Prescription) are private to owner and admin
DROP POLICY IF EXISTS "Verification docs are private to owner and admin" ON storage.objects;
CREATE POLICY "Verification docs are private to owner and admin"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS "Users can upload own verification documents" ON storage.objects;
CREATE POLICY "Users can upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update or delete own verification documents" ON storage.objects;
CREATE POLICY "Users can update or delete own verification documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()))
WITH CHECK (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;
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
    post_id UUID NOT NULL, -- FK added at the end, after community_posts exists
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
  auth.uid() = owner_id
);

DROP POLICY IF EXISTS "Owners can update own tolet listings" ON public.tolet_listings;
CREATE POLICY "Owners can update own tolet listings"
ON public.tolet_listings FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (
  public.is_admin() OR
  auth.uid() = owner_id
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
  auth.uid() = customer_id OR
  public.is_listing_owner(listing_id)
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
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
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
DROP POLICY IF EXISTS "Users create own notifications" ON public.notifications;
CREATE POLICY "Users create own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (user_id = auth.uid() AND target_role = 'customer')
);

-- Marking read is the only client-side mutation.
DROP POLICY IF EXISTS "Users mark own notifications read" ON public.notifications;
CREATE POLICY "Users mark own notifications read"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR (target_role = 'admin' AND public.is_admin()))
WITH CHECK ((user_id = auth.uid() OR (target_role = 'admin' AND public.is_admin())) AND is_read = TRUE);

-- Deletion is admin-only (housekeeping).
DROP POLICY IF EXISTS "Admins delete notifications" ON public.notifications;
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
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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
USING (status = 'approved');

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
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.author_id := auth.uid();
        NEW.status := 'pending';
        NEW.is_featured := FALSE;
        NEW.published_at := NULL;
        NEW.rejection_reason := NULL;
    ELSE
        NEW.author_id := OLD.author_id;
        -- An author edit always re-enters moderation (matches RLS WITH CHECK),
        -- but only moderators decide feature/publish/rejection state.
        NEW.status := 'pending';
        NEW.is_featured := OLD.is_featured;
        NEW.published_at := OLD.published_at;
        NEW.rejection_reason := OLD.rejection_reason;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_moderation_guard ON public.community_posts;
CREATE TRIGGER trg_community_posts_moderation_guard
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.community_posts_guard_moderation();

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
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.fetch_market_contact(TEXT) IS
    'Seller phone / WhatsApp for an approved buy_sell post. Returns nothing for '
    'news or job posts, and nothing for a post still in moderation.';

REVOKE ALL ON FUNCTION public.fetch_market_contact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_market_contact(TEXT) TO anon, authenticated;

-- ============================================================
-- PRIVACY & SECURITY HARDENING (mirrors migration 20261006020000)
-- Column-level REVOKEs + SECURITY DEFINER RPCs for the reads
-- that legitimately need revoked PII. See that migration for
-- the full rationale.
-- ============================================================

-- --- Column-level REVOKEs (anon key can no longer select PII) ---
REVOKE SELECT (phone, emergency_phone, nid_number, nid_doc_url, holding_number, address_line)
ON public.tolet_profiles FROM anon, authenticated;

REVOKE SELECT (private_phone, nid_number, admin_notes)
ON public.home_tutor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.home_tutor_profiles FROM anon;

REVOKE SELECT (private_phone, admin_notes)
ON public.blood_donor_profiles FROM anon, authenticated;
REVOKE SELECT (rejection_reason) ON public.blood_donor_profiles FROM anon;

REVOKE SELECT (phone_private) ON public.staff_profiles FROM anon, authenticated;

REVOKE SELECT (author_phone, whatsapp_number, rejection_reason)
ON public.community_posts FROM anon, authenticated;

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

-- ============================================================================
-- PART 2 — CORRECTIONS, MISSING OBJECTS & HARDENING
-- ============================================================================
-- Everything below either:
--   (a) replaces a CREATE POLICY in PART 1 that illegally referenced NEW/OLD
--       (PostgreSQL only allows NEW/OLD inside trigger functions), or
--   (b) adds an object that existed only in an old fragmented migration and was
--       therefore missing from a database built from lib/supabase/schema.sql
--       (hero slides, admin dashboard RPCs, the `site` bucket,
--       community_post_reports RLS, admin DELETE policies, the signup trigger),
--   (c) fixes the forward-reference / ordering bug on community_post_reports,
--   (d) adds the admin-queue indexes, with the three broken column references
--       corrected.
-- It is idempotent and safe to re-run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 2.1  STATUS-TRANSITION GUARDS
-- ----------------------------------------------------------------------------
-- The policies in PART 1 no longer contain NEW/OLD. These triggers carry the
-- transition rules that used to live (illegally) inside those policies.
-- SECURITY DEFINER + pinned search_path; a NULL auth.uid() means a migration /
-- service-role write, which is trusted and passes straight through.
-- ----------------------------------------------------------------------------

-- To-let listings: an owner may only draft / submit / archive / mark a listing
-- unavailable. Approving, rejecting or suspending is admin-only, and the
-- admin-owned columns cannot be forged by an owner.
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
        -- OLD is not assigned on INSERT, so it must not be referenced here.
        IF NEW.status IS NULL
           OR NEW.status NOT IN ('draft', 'pending_review', 'unavailable') THEN
            NEW.status := 'pending_review';
        END IF;
        NEW.is_verified      := FALSE;
        NEW.rejection_reason := NULL;
        NEW.published_at     := NULL;
    ELSE
        NEW.owner_id         := OLD.owner_id;
        NEW.is_verified      := OLD.is_verified;
        NEW.rejection_reason := OLD.rejection_reason;
        NEW.published_at     := OLD.published_at;

        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status NOT IN ('draft', 'pending_review', 'archived', 'unavailable') THEN
            RAISE EXCEPTION 'Only an admin can move a listing to status %', NEW.status
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_listings_owner_guard ON public.tolet_listings;
CREATE TRIGGER trg_tolet_listings_owner_guard
BEFORE INSERT OR UPDATE ON public.tolet_listings
FOR EACH ROW EXECUTE FUNCTION public.tolet_listings_owner_guard();

-- To-let requests: the requester may only cancel an open enquiry; the listing
-- owner may only move it forward (contacted / completed / cancelled) and may
-- never rewrite the requester's identity or contact details.
CREATE OR REPLACE FUNCTION public.tolet_requests_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.customer_id = auth.uid() AND NEW.customer_id = OLD.customer_id THEN
        IF NOT (NEW.status = 'cancelled' AND OLD.status IN ('submitted', 'contacted')) THEN
            RAISE EXCEPTION 'A requester may only cancel an open enquiry'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF public.is_listing_owner(OLD.listing_id) THEN
        IF NOT (NEW.status IN ('contacted', 'completed', 'cancelled')
                AND OLD.status IN ('submitted', 'contacted')) THEN
            RAISE EXCEPTION 'The listing owner may only move an enquiry forward'
                USING ERRCODE = '42501';
        END IF;
        -- The owner may change only the status; requester data is immutable.
        NEW.listing_id     := OLD.listing_id;
        NEW.customer_id    := OLD.customer_id;
        NEW.customer_name  := OLD.customer_name;
        NEW.customer_phone := OLD.customer_phone;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed to update this enquiry' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_tolet_requests_guard ON public.tolet_requests;
CREATE TRIGGER trg_tolet_requests_guard
BEFORE UPDATE ON public.tolet_requests
FOR EACH ROW EXECUTE FUNCTION public.tolet_requests_guard();

-- Service requests: a customer may only cancel; admin-owned fields are kept.
CREATE OR REPLACE FUNCTION public.service_requests_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
        RAISE EXCEPTION 'A request cannot be reassigned to another customer'
            USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'A customer may only cancel their own request'
            USING ERRCODE = '42501';
    END IF;

    -- Admin-owned fields stay put.
    NEW.admin_notes   := OLD.admin_notes;
    NEW.quotation     := OLD.quotation;
    NEW.profile_id    := OLD.profile_id;
    NEW.profile_title := OLD.profile_title;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_requests_guard ON public.service_requests;
CREATE TRIGGER trg_service_requests_guard
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.service_requests_guard();

-- Blood requests: same rule — a customer may only cancel; review/contact state
-- is admin-owned.
CREATE OR REPLACE FUNCTION public.blood_requests_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
        RAISE EXCEPTION 'The requester cannot be reassigned' USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'A customer may only cancel their own blood request'
            USING ERRCODE = '42501';
    END IF;

    NEW.admin_notes          := OLD.admin_notes;
    NEW.rejection_reason     := OLD.rejection_reason;
    NEW.contact_released_at  := OLD.contact_released_at;
    NEW.contacted_donor_name := OLD.contacted_donor_name;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blood_requests_guard ON public.blood_requests;
CREATE TRIGGER trg_blood_requests_guard
BEFORE UPDATE ON public.blood_requests
FOR EACH ROW EXECUTE FUNCTION public.blood_requests_guard();


-- ----------------------------------------------------------------------------
-- 2.2  COMMUNITY POST REPORTS — RLS (was missing entirely)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS community_post_reports_insert ON public.community_post_reports;
CREATE POLICY community_post_reports_insert
    ON public.community_post_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(trim(reporter_name)) >= 2
        AND length(trim(reason)) >= 2
        AND (reporter_id IS NULL OR reporter_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins read community post reports" ON public.community_post_reports;
CREATE POLICY "Admins read community post reports"
    ON public.community_post_reports
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Reporters read own community post reports" ON public.community_post_reports;
CREATE POLICY "Reporters read own community post reports"
    ON public.community_post_reports
    FOR SELECT
    TO authenticated
    USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage community post reports" ON public.community_post_reports;
CREATE POLICY "Admins manage community post reports"
    ON public.community_post_reports
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS policies only take effect once the role actually holds the table
-- privilege; Supabase grants these by default, but make it explicit so the
-- report action works on a database provisioned without those defaults.
GRANT INSERT ON public.community_post_reports TO anon, authenticated;

-- The notification trigger for this queue was also never wired up.
CREATE OR REPLACE FUNCTION public.notif_community_post_report_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, target_role, title, body, type, related_type, related_id)
    VALUES (
        NULL, 'admin',
        'নতুন পোস্ট রিপোর্ট',
        'একটি কমিউনিটি পোস্ট রিপোর্ট জমা হয়েছে, পর্যালোচনা করুন।',
        'warning', 'community_post_report', NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_community_post_report ON public.community_post_reports;
CREATE TRIGGER trg_notif_community_post_report
AFTER INSERT ON public.community_post_reports
FOR EACH ROW EXECUTE FUNCTION public.notif_community_post_report_inserted();


-- ----------------------------------------------------------------------------
-- 2.3  ADMIN DELETE / INSERT RIGHTS ON THE MODERATION QUEUES
-- ----------------------------------------------------------------------------
-- These queues had no DELETE policy for anyone (admin included).
DROP POLICY IF EXISTS "Admins delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins delete contact messages"
    ON public.contact_messages FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete service requests" ON public.service_requests;
CREATE POLICY "Admins delete service requests"
    ON public.service_requests FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tolet requests" ON public.tolet_requests;
CREATE POLICY "Admins delete tolet requests"
    ON public.tolet_requests FOR DELETE
    TO authenticated USING (public.is_admin());

-- An admin logging an enquiry on a customer's behalf must not be blocked by
-- `auth.uid() = customer_id`.
DROP POLICY IF EXISTS "Admins create tolet requests" ON public.tolet_requests;
CREATE POLICY "Admins create tolet requests"
    ON public.tolet_requests FOR INSERT
    TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete listing reports" ON public.listing_reports;
CREATE POLICY "Admins delete listing reports"
    ON public.listing_reports FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete staff profile reports" ON public.staff_profile_reports;
CREATE POLICY "Admins delete staff profile reports"
    ON public.staff_profile_reports FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tutor reports" ON public.tutor_reports;
CREATE POLICY "Admins delete tutor reports"
    ON public.tutor_reports FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete blood donor reports" ON public.blood_donor_reports;
CREATE POLICY "Admins delete blood donor reports"
    ON public.blood_donor_reports FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete tutor reviews" ON public.tutor_reviews;
CREATE POLICY "Admins delete tutor reviews"
    ON public.tutor_reviews FOR DELETE
    TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete community post reports" ON public.community_post_reports;
CREATE POLICY "Admins delete community post reports"
    ON public.community_post_reports FOR DELETE
    TO authenticated USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- 2.4  ADMIN-QUEUE INDEXES (broken column references corrected)
-- ----------------------------------------------------------------------------
-- Corrections vs the old migration:
--   * idx_staff_profiles_name_lower  used staff_profiles(full_name) — the column
--     is NAME_BN.                                   -> lower(name_bn)
--   * idx_service_requests_name_lower used service_requests(customer_name) —
--     the column is CONTACT_NAME.                   -> lower(contact_name)
--   * idx_service_requests_listing indexed a non-existent service_requests
--     listing_id.                                   -> omitted
CREATE INDEX IF NOT EXISTS idx_home_tutor_profiles_status_created
    ON public.home_tutor_profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_home_tutor_profiles_user
    ON public.home_tutor_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_status_created
    ON public.blood_donor_profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_user
    ON public.blood_donor_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_blood_donor_profiles_blood_group
    ON public.blood_donor_profiles (blood_group)
    WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_service_requests_status_created
    ON public.service_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer
    ON public.service_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_slug_status
    ON public.service_requests (service_slug, status);

CREATE INDEX IF NOT EXISTS idx_tolet_profiles_status_created
    ON public.tolet_profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tolet_listings_status_created
    ON public.tolet_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status_created
    ON public.blood_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tolet_requests_status_created
    ON public.tolet_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
    ON public.contact_messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_status_created
    ON public.community_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status_created
    ON public.vehicle_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status
    ON public.profiles (role, status);

-- Search prefixes (plain B-tree text_pattern_ops; no extension required).
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower
    ON public.profiles (lower(full_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_contact_messages_name_lower
    ON public.contact_messages (lower(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_service_requests_name_lower
    ON public.service_requests (lower(contact_name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_community_posts_title_lower
    ON public.community_posts (lower(title_bn) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_name_lower
    ON public.staff_profiles (lower(name_bn) text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_listing_reports_reason_lower
    ON public.listing_reports (lower(reason) text_pattern_ops);

-- Marketplace + report-queue indexes carried over from the old migrations.
CREATE INDEX IF NOT EXISTS idx_community_posts_market
    ON public.community_posts (kind, status, published_at DESC)
    WHERE kind = 'buy_sell';
CREATE INDEX IF NOT EXISTS idx_cpr_post_created
    ON public.community_post_reports (post_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- 2.5  HERO SLIDES (homepage carousel, admin-managed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caption_bn TEXT NOT NULL CHECK (length(trim(caption_bn)) > 0),
    image_url TEXT NOT NULL CHECK (length(trim(image_url)) > 0),
    storage_path TEXT,
    alt_text_bn TEXT,
    href TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS alt_text_bn TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS href TEXT;

CREATE INDEX IF NOT EXISTS idx_hero_slides_order
    ON public.hero_slides (sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_enabled
    ON public.hero_slides (is_enabled, sort_order);

DROP TRIGGER IF EXISTS trg_hero_slides_updated ON public.hero_slides;
CREATE TRIGGER trg_hero_slides_updated
    BEFORE UPDATE ON public.hero_slides
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enabled hero slides are public" ON public.hero_slides;
CREATE POLICY "Enabled hero slides are public"
    ON public.hero_slides FOR SELECT
    TO anon, authenticated
    USING (is_enabled = TRUE);

DROP POLICY IF EXISTS "Admins manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins manage hero slides"
    ON public.hero_slides FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Seed the four slides live today; guarded so a re-run never duplicates or
-- overwrites an admin-edited slide.
INSERT INTO public.hero_slides (caption_bn, image_url, sort_order, is_enabled)
SELECT v.caption, v.image, v.ord, TRUE
FROM (VALUES
    ('প্রতিদিনের সেবা, এক জায়গায়',     '/sheba1.png', 1),
    ('বাসা থেকে মেরামত — সবই স্থানীয়', '/sheba2.png', 2),
    ('ময়মনসিংহের মানুষের হাতেই গড়া',   '/sheba3.png', 3),
    ('জরুরি সেবা, সঠিক নম্বরে',         '/sheba4.png', 4)
) AS v(caption, image, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM public.hero_slides h WHERE h.caption_bn = v.caption
);


-- ----------------------------------------------------------------------------
-- 2.5b  SITE MEDIA BUCKET (admin-managed hero / homepage images)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site', 'site', TRUE, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Site media is publicly readable" ON storage.objects;
CREATE POLICY "Site media is publicly readable"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'site');

DROP POLICY IF EXISTS "Admins can upload site media" ON storage.objects;
CREATE POLICY "Admins can upload site media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'site' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update site media" ON storage.objects;
CREATE POLICY "Admins can update site media"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'site' AND public.is_admin())
    WITH CHECK (bucket_id = 'site' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete site media" ON storage.objects;
CREATE POLICY "Admins can delete site media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'site' AND public.is_admin());


-- ----------------------------------------------------------------------------
-- 2.6  ADMIN DASHBOARD READ MODELS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
    total_users                  BIGINT,
    active_users                 BIGINT,
    blocked_users                BIGINT,
    new_users_7d                 BIGINT,
    total_posts                  BIGINT,
    pending_posts                BIGINT,
    approved_posts               BIGINT,
    rejected_posts               BIGINT,
    featured_posts               BIGINT,
    total_requests               BIGINT,
    open_requests                BIGINT,
    total_tolet_requests         BIGINT,
    open_tolet_requests          BIGINT,
    total_blood_requests         BIGINT,
    open_blood_requests          BIGINT,
    total_vehicle_requests       BIGINT,
    open_vehicle_requests        BIGINT,
    total_messages               BIGINT,
    unread_messages              BIGINT,
    total_reports                BIGINT,
    open_reports                 BIGINT,
    pending_verifications        BIGINT,
    active_tolet_listings        BIGINT,
    pending_tolet_listings       BIGINT,
    active_staff                 BIGINT,
    active_service_listings      BIGINT,
    active_emergency_contacts    BIGINT,
    unread_admin_notifications   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT count(*) FROM public.profiles),
        (SELECT count(*) FROM public.profiles WHERE status = 'active'),
        (SELECT count(*) FROM public.profiles WHERE status IN ('suspended', 'blocked')),
        (SELECT count(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days'),

        (SELECT count(*) FROM public.community_posts),
        (SELECT count(*) FROM public.community_posts WHERE status = 'pending'),
        (SELECT count(*) FROM public.community_posts WHERE status = 'approved'),
        (SELECT count(*) FROM public.community_posts WHERE status = 'rejected'),
        (SELECT count(*) FROM public.community_posts WHERE is_featured = TRUE),

        (SELECT count(*) FROM public.service_requests),
        (SELECT count(*) FROM public.service_requests
            WHERE status NOT IN ('completed', 'cancelled', 'rejected')),
        (SELECT count(*) FROM public.tolet_requests),
        (SELECT count(*) FROM public.tolet_requests
            WHERE status NOT IN ('completed', 'cancelled')),
        (SELECT count(*) FROM public.blood_requests),
        (SELECT count(*) FROM public.blood_requests
            WHERE status NOT IN ('completed', 'cancelled')),
        (SELECT count(*) FROM public.vehicle_requests),
        (SELECT count(*) FROM public.vehicle_requests WHERE status = 'new'),

        (SELECT count(*) FROM public.contact_messages),
        (SELECT count(*) FROM public.contact_messages WHERE status = 'new'),

        (SELECT
            (SELECT count(*) FROM public.listing_reports)
          + (SELECT count(*) FROM public.staff_profile_reports)
          + (SELECT count(*) FROM public.tutor_reports)
          + (SELECT count(*) FROM public.blood_donor_reports)
          + (SELECT count(*) FROM public.community_post_reports)),
        (SELECT
            (SELECT count(*) FROM public.listing_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.staff_profile_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.tutor_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.blood_donor_reports WHERE status = 'open')
          + (SELECT count(*) FROM public.community_post_reports WHERE status = 'open')),

        ((SELECT count(*) FROM public.home_tutor_profiles WHERE status = 'pending_approval')
       + (SELECT count(*) FROM public.blood_donor_profiles WHERE status = 'pending_approval')
       + (SELECT count(*) FROM public.tolet_profiles WHERE status = 'pending_approval')),
        (SELECT count(*) FROM public.tolet_listings WHERE status = 'approved'),
        (SELECT count(*) FROM public.tolet_listings WHERE status = 'pending_review'),
        (SELECT count(*) FROM public.staff_profiles WHERE is_active = TRUE),
        (SELECT count(*) FROM public.service_listings WHERE is_active = TRUE),
        (SELECT count(*) FROM public.emergency_contacts WHERE is_active = TRUE),

        (SELECT count(*) FROM public.notifications
            WHERE target_role = 'admin' AND is_read = FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS
    'Admin dashboard counters. Admin-only; every figure is a live count.';

-- Recent activity feed (full union of every queue that receives rows). The
-- tolet_enquiries detail expression was corrected: the old definition passed
-- four arguments to COALESCE, so the enquiry status was never shown.
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity(p_limit INT DEFAULT 12)
RETURNS TABLE (
    id          TEXT,
    occurred_at TIMESTAMPTZ,
    category    TEXT,
    action      TEXT,
    title       TEXT,
    detail      TEXT,
    href        TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    WITH feed AS (
        -- Community posts: submitted
        SELECT 'cp-new-' || p.id::text            AS id,
               p.created_at                       AS occurred_at,
               'post'::TEXT                       AS category,
               'submitted'::TEXT                  AS action,
               p.title_bn                         AS title,
               COALESCE(
                   CASE p.kind
                       WHEN 'news'     THEN 'খবর'
                       WHEN 'job'      THEN 'চাকরির বিজ্ঞাপন'
                       WHEN 'buy_sell' THEN 'কেনাবেচা'
                   END, p.kind
               ) || ' — অনুমোদনের অপেক্ষায়'  AS detail,
               '/admin/posts'::TEXT               AS href
        FROM public.community_posts p
        WHERE p.status = 'pending'

        UNION ALL
        -- Community posts: approved
        SELECT 'cp-app-' || p.id::text, p.updated_at, 'post', 'approved',
               p.title_bn, 'সর্বজনীনভাবে প্রকাশ করা হয়েছে', '/admin/posts'
        FROM public.community_posts p
        WHERE p.status = 'approved' AND p.published_at IS NOT NULL

        UNION ALL
        -- Community posts: rejected
        SELECT 'cp-rej-' || p.id::text, p.updated_at, 'post', 'rejected',
               p.title_bn, 'প্রকাশ করা হয়নি', '/admin/posts'
        FROM public.community_posts p
        WHERE p.status = 'rejected'

        UNION ALL
        -- Service requests
        SELECT 'sr-' || r.id::text, r.created_at, 'request', 'submitted',
               COALESCE(NULLIF(r.profile_title, ''), r.service_slug, 'সেবা রিকোয়েস্ট'),
               COALESCE(r.contact_name, 'অজানা') || ' — ' || COALESCE(r.status, 'new'),
               '/admin/requests'
        FROM public.service_requests r

        UNION ALL
        -- To-let enquiries
        SELECT 'tr-' || r.id::text, r.created_at, 'request', 'submitted',
               'বাসা ভাড়া সংক্রান্ত অনুসন্ধান',
               COALESCE(NULLIF(r.customer_name, ''), 'অজানা') || ' — ' || COALESCE(r.status, 'submitted'),
               '/admin/tolet-requests'
        FROM public.tolet_requests r

        UNION ALL
        -- Blood requests
        SELECT 'br-' || r.id::text, r.created_at, 'request', 'submitted',
               'রক্ত রিকোয়েস্ট',
               COALESCE(r.blood_group, '') || ' — ' || COALESCE(r.patient_name, 'অজানা'),
               '/admin/blood'
        FROM public.blood_requests r

        UNION ALL
        -- Vehicle requests (guest-submitted: contact_name / contact_phone)
        SELECT 'vr-' || r.id::text, r.created_at, 'request', 'submitted',
               'গাড়ি / অটো / সিএনজি রিকোয়েস্ট',
               COALESCE(NULLIF(r.vehicle_name, ''), r.vehicle_kind) || ' — ' || r.contact_name,
               '/admin/vehicle-requests'
        FROM public.vehicle_requests r

        UNION ALL
        -- Contact messages
        SELECT 'cm-' || m.id::text, m.created_at, 'message', 'submitted',
               m.name,
               COALESCE(m.subject, '') || ' — ' || left(m.message, 90),
               '/admin/messages'
        FROM public.contact_messages m

        UNION ALL
        -- Reports, all five tables
        SELECT 'rp-l-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'বাসা ভাড়া বিজ্ঞাপন', '/admin/reports'
        FROM public.listing_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-s-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'কর্মী প্রোফাইল', '/admin/reports'
        FROM public.staff_profile_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-t-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'গৃহশিক্ষক প্রোফাইল', '/admin/reports'
        FROM public.tutor_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-b-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'রক্তদাতা প্রোফাইল', '/admin/reports'
        FROM public.blood_donor_reports r WHERE r.status = 'open'
        UNION ALL
        SELECT 'rp-c-' || r.id::text, r.created_at, 'report', 'submitted',
               COALESCE(r.reason, 'রিপোর্ট'), 'কেনাবেচা/খবর/চাকরি পোস্ট', '/admin/reports'
        FROM public.community_post_reports r WHERE r.status = 'open'

        UNION ALL
        -- New accounts
        SELECT 'pf-' || u.id::text, u.created_at, 'user', 'registered',
               COALESCE(NULLIF(u.full_name, ''), u.phone, 'নতুন ব্যবহারকারী'),
               'নতুন অ্যাকাউন্ট তৈরি হয়েছে', '/admin/users'
        FROM public.profiles u
    )
    SELECT f.id, f.occurred_at, f.category, f.action, f.title, f.detail, f.href
    FROM feed f
    WHERE public.is_admin()
    ORDER BY f.occurred_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 50));
$$;

REVOKE ALL ON FUNCTION public.get_admin_recent_activity(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_activity(INT) TO authenticated;
COMMENT ON FUNCTION public.get_admin_recent_activity(INT) IS
    'Recent admin activity feed. Admin-only.';


-- ----------------------------------------------------------------------------
-- 2.7  REGISTRATION TRIGGER — auth.users -> public.profiles
-- ----------------------------------------------------------------------------
-- The canonical, defensive signup trigger. SECURITY DEFINER (at signup there is
-- no session, so auth.uid() is NULL and the INSERT RLS policy cannot be met by
-- the trigger itself). When the registration metadata is absent it skips the
-- insert rather than aborting the auth transaction.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    meta       jsonb := NEW.raw_user_meta_data;
    _full_name text;
    _phone     text;
    _area_id   text;
    _email     text;
BEGIN
    _full_name := BTRIM(NULLIF(meta->>'full_name', ''));
    _phone     := BTRIM(NULLIF(meta->>'phone', ''));
    _area_id   := BTRIM(NULLIF(meta->>'primary_area_id', ''));
    _email     := COALESCE(NULLIF(BTRIM(meta->>'email'), ''), NEW.email);

    IF _full_name IS NULL OR _phone IS NULL OR _area_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles
        (id, full_name, phone, email, primary_area_id, role, status, is_verified)
    VALUES
        (NEW.id, _full_name, _phone, _email, _area_id, 'customer', 'active', FALSE)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 2.8  community_post_reports — foreign-key ordering fix
-- ----------------------------------------------------------------------------
-- In PART 1 the table is created before community_posts exists, so the FK is
-- added here, once the parent table is guaranteed to exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'community_post_reports_post_id_fkey'
    ) THEN
        ALTER TABLE public.community_post_reports
            ADD CONSTRAINT community_post_reports_post_id_fkey
            FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
    END IF;
END
$$;


-- ============================================================================
-- PART 3 — VERIFICATION (read-only structural checks)
-- ============================================================================
-- Safe to run: it only reads the catalog and raises NOTICE / EXCEPTION. It
-- fails loudly if a required table, function, policy or trigger is missing.
DO $$
DECLARE
    missing TEXT := '';
    _tbl TEXT;
    _fn  TEXT;
    _pol RECORD;
BEGIN
    FOREACH _tbl IN ARRAY ARRAY[
        'profiles','tolet_profiles','home_tutor_profiles','blood_donor_profiles',
        'service_requests','blood_requests','blood_contact_releases',
        'blood_donor_reports','saved_items','staff_profiles',
        'staff_profile_reports','tutor_reviews','tutor_reports',
        'tolet_listings','tolet_requests','listing_reports',
        'community_post_reports','community_posts','tolet_listing_events',
        'platform_settings','hero_slides','notifications','contact_messages',
        'service_listings','emergency_contacts','vehicle_requests'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = _tbl AND c.relkind = 'r'
        ) THEN
            missing := missing || ' table:' || _tbl;
        END IF;
    END LOOP;

    FOREACH _fn IN ARRAY ARRAY[
        'is_admin','handle_new_user','is_listing_owner','set_updated_at',
        'tolet_listing_analytics','get_admin_dashboard_stats',
        'get_admin_recent_activity','fetch_market_contact',
        'tolet_listings_owner_guard','tolet_requests_guard',
        'service_requests_guard','blood_requests_guard',
        'fn_my_tolet_profile','fn_my_tutor_profile','fn_my_donor_profile',
        'fn_my_posts','fn_admin_tutor_profiles','fn_admin_donor_profiles',
        'fn_admin_staff_profiles','fn_admin_posts'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = _fn
        ) THEN
            missing := missing || ' function:' || _fn;
        END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles')
       AND NOT EXISTS (SELECT 1 FROM pg_policies
                       WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins have full access to profiles') THEN
        missing := missing || ' policy:profiles/admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public' AND tablename='community_post_reports'
                     AND policyname='Admins read community post reports') THEN
        missing := missing || ' policy:community_post_reports/admin-read';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public' AND tablename='hero_slides'
                     AND policyname='Admins manage hero slides') THEN
        missing := missing || ' policy:hero_slides/admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='storage' AND tablename='objects'
                     AND policyname='Admins can upload site media') THEN
        missing := missing || ' policy:storage/site-admin';
    END IF;

    -- No policy anywhere may reference NEW/OLD (the original bug).
    FOR _pol IN
        SELECT schemaname, tablename, policyname, qual, with_check, cmd
        FROM pg_policies
        WHERE schemaname IN ('public', 'storage')
    LOOP
        IF (_pol.qual ~* '(^|[^a-z_])NEW\.[a-z_]')
           OR (_pol.with_check ~* '(^|[^a-z_])NEW\.[a-z_]')
           OR (_pol.qual ~* '(^|[^a-z_])OLD\.[a-z_]')
           OR (_pol.with_check ~* '(^|[^a-z_])OLD\.[a-z_]') THEN
            missing := missing || ' bad-policy:' || _pol.tablename || '.' || _pol.policyname;
        END IF;
    END LOOP;

    IF missing <> '' THEN
        RAISE EXCEPTION 'Master schema verification failed ->%', missing;
    END IF;

    RAISE NOTICE 'Master schema verification passed: tables, functions, policies and RLS are all present and no policy references NEW/OLD.';
END
$$;

-- ---------------------------------------------------------------------------
-- OPTIONAL behaviour checks (run manually in the SQL editor; commented because
-- they write rows). Replace the UUIDs with real ids from your own DB.
-- ---------------------------------------------------------------------------
-- 1) Registration -> profile row (exercise the real signup path through the API,
--    then confirm the trigger created the row):
--    SELECT id, full_name, phone, role, status, primary_area_id
--      FROM public.profiles ORDER BY created_at DESC LIMIT 5;
--
-- 2) Admin access (as an authenticated admin in the SQL editor):
--    SELECT public.is_admin();
--    SELECT * FROM public.get_admin_dashboard_stats();
--    SELECT * FROM public.get_admin_recent_activity(5);
--
-- 3) Listing creation + ownership (as the owner JWT):
--    INSERT INTO public.tolet_listings (owner_id, title, property_type, area_id, rent_price)
--    VALUES (auth.uid(), 'পরীক্ষা', 'flat', 'charpara', 8000);
--    SELECT public.is_listing_owner('<listing-uuid>');   -- true for the owner
--
-- 4) Request creation (as a customer JWT):
--    INSERT INTO public.tolet_requests (listing_id, customer_id, customer_name, customer_phone)
--    VALUES ('<listing-uuid>', auth.uid(), 'পরীক্ষা', '01700000000');
--
-- 5) RLS: as an unrelated authenticated user,
--    SELECT * FROM public.tolet_requests;   -- returns 0 rows
--
-- 6) Analytics write + read:
--    INSERT INTO public.tolet_listing_events (listing_id, event_type)
--    VALUES ('<listing-uuid>', 'view');
--    SELECT * FROM public.tolet_listing_analytics(10);   -- admin only
--
-- 7) Triggers: update a profile's role as a non-admin -> must raise
--    'Not allowed to change role, verification or account status'.
