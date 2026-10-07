'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  ToletProfile,
  HomeTutorProfile,
  BloodDonorProfile,
  ServiceRequestItem,
  SavedListingItem,
  NotificationItem,
} from './supabase/types';
import { createClient, isSupabaseConfigured } from './supabase/client';
import { LAUNCH_SERVICES } from './services-data';

const NOT_CONFIGURED_MESSAGE =
  'লগইন ও রেজিস্ট্রেশন পরিষেবা এখনো চালু হয়নি। প্রকল্পে Supabase সেটআপ সম্পন্ন হলে এই সেবা সক্রিয় হবে।';

function toCamelObject(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out;
}

function toSnakeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

/** Builds a sensible in-app link for a notification based on its type/id. */
function notificationLink(n: {
  targetRole: string;
  relatedType?: string;
  relatedId?: string;
}): string | undefined {
  const id = n.relatedId;
  if (!id) return undefined;
  if (n.targetRole === 'admin') {
    if (n.relatedType === 'service_request') return `/admin/requests/${id}`;
    if (n.relatedType === 'blood_request') return `/admin/blood/${id}`;
    return '/admin/reports';
  }
  // Customer-facing decisions point at the customer dashboard: a moderation
  // verdict belongs next to the posts list, not in a generic inbox.
  if (n.relatedType === 'community_post') return '/dashboard/posts';
  if (n.relatedType === 'tolet_listing') return '/profile/tolet';
  return '/profile/requests';
}

interface AuthContextType {
  user: UserProfile | null;
  toletProfile: ToletProfile | null;
  homeTutorProfile: HomeTutorProfile | null;
  bloodDonorProfile: BloodDonorProfile | null;
  requests: ServiceRequestItem[];
  savedListings: SavedListingItem[];
  notifications: NotificationItem[];
  isLoading: boolean;
  isAdmin: boolean;
  isConfiguredWithSupabase: boolean;
  login: (phoneOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    phone: string;
    primaryAreaId: string;
    password: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  resetPassword: (phoneOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  /** Upload a new profile photo to the owner-scoped `avatars` bucket. */
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string; url?: string }>;
  /** Change the signed-in user's password via Supabase Auth. */
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationsReadAll: () => Promise<void>;
  activateToletProfile: (details: Omit<ToletProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalListingsCount' | 'status'>) => Promise<void>;
  activateHomeTutorProfile: (details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  activateBloodDonorProfile: (details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  toggleSaveItem: (item: Omit<SavedListingItem, 'id' | 'userId' | 'savedAt'>) => Promise<void>;
  createServiceRequest: (
    request: Omit<ServiceRequestItem, 'id' | 'customerId' | 'createdAt' | 'status' | 'serviceTitleBn'>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toletProfile, setToletProfile] = useState<ToletProfile | null>(null);
  const [homeTutorProfile, setHomeTutorProfile] = useState<HomeTutorProfile | null>(null);
  const [bloodDonorProfile, setBloodDonorProfile] = useState<BloodDonorProfile | null>(null);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setToletProfile(null);
    setHomeTutorProfile(null);
    setBloodDonorProfile(null);
    setRequests([]);
    setSavedListings([]);
    setNotifications([]);
  }, []);

  const refreshUserData = useCallback(
    async (
      client: NonNullable<ReturnType<typeof createClient>>,
      userId: string
    ): Promise<{ ok: boolean; blocked?: boolean }> => {
      const { data: profileData } = await client.from('profiles').select('*').eq('id', userId).single();
      if (!profileData) {
        clearSessionState();
        return { ok: false };
      }
      const profile = toCamelObject(profileData) as unknown as UserProfile;
      // Account can be suspended/blocked by admin. Such users must not stay signed in.
      if (profile.status && profile.status !== 'active') {
        clearSessionState();
        return { ok: false, blocked: true };
      }
      setUser({ ...profile, status: profile.status || 'active' });

      const { data: toletRow } = await client.rpc('fn_my_tolet_profile').maybeSingle();
      setToletProfile(toletRow ? (toCamelObject(toletRow as Record<string, unknown>) as unknown as ToletProfile) : null);

      const { data: tutorRow } = await client.rpc('fn_my_tutor_profile').maybeSingle();
      setHomeTutorProfile(tutorRow ? (toCamelObject(tutorRow as Record<string, unknown>) as unknown as HomeTutorProfile) : null);

      const { data: donorRow } = await client.rpc('fn_my_donor_profile').maybeSingle();
      setBloodDonorProfile(donorRow ? (toCamelObject(donorRow as Record<string, unknown>) as unknown as BloodDonorProfile) : null);

      const { data: requestRows } = await client
        .from('service_requests')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      const mappedRequests = (requestRows ?? []).map((row: Record<string, unknown>) => {
        const camel = toCamelObject(row) as unknown as ServiceRequestItem;
        const service = LAUNCH_SERVICES.find((s) => s.slug === camel.serviceSlug);
        camel.serviceTitleBn = service?.nameBn || camel.serviceSlug;
        if (!camel.profileTitleBn) {
          camel.profileTitleBn =
            ((camel as unknown as Record<string, unknown>).profileTitle as string) || undefined;
        }
        return camel;
      });
      setRequests(mappedRequests);

      const { data: savedRows } = await client.from('saved_items').select('*').eq('user_id', userId);
      setSavedListings(
        (savedRows ?? []).map((row: Record<string, unknown>) => {
          const camel = toCamelObject(row) as Record<string, unknown>;
          const itemType = camel.itemType as string;
          const itemId = String(camel.itemId ?? '');
          return {
            id: String(camel.id),
            userId: String(camel.userId),
            itemType,
            title:
              itemType === 'tolet'
                ? `ভাড়া দেওয়া বাসা (${itemId})`
                : itemType === 'tutor'
                ? `গৃহশিক্ষক (${itemId})`
                : itemType === 'market'
                    ? `কেনাবেচার পণ্য (${itemId})`
                    : `সেবা (${itemId})`,
            areaName: '',
            linkHref:
              itemType === 'tolet'
                ? `/tolet/${itemId}`
                : itemType === 'tutor'
                ? `/home-tutor/${itemId}`
                : itemType === 'market'
                    ? `/buy-sell/${itemId}`
                    : '/services',
            savedAt: String(camel.createdAt),
          } as SavedListingItem;
        })
      );

      // Notifications: personal ones plus (for admins) the admin hub rows.
      const isAdminUser = profile.role === 'admin';
      const personalNotifs =
        (await client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50))?.data ?? [];
      const adminNotifs =
        isAdminUser
          ? ((await client
              .from('notifications')
              .select('*')
              .eq('target_role', 'admin')
              .order('created_at', { ascending: false })
              .limit(50))?.data ?? [])
          : [];
      const merged: NotificationItem[] = [...personalNotifs, ...adminNotifs]
        .map((row) => {
          const c = toCamelObject(row as Record<string, unknown>) as unknown as NotificationItem;
          c.linkHref = notificationLink(c);
          return c;
        })
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 50);
      setNotifications(merged);
      return { ok: true };
    },
    [clearSessionState]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }
    const client = createClient();
    if (!client) {
      return;
    }
    client.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const res = await refreshUserData(client, data.session.user.id);
        if (res && !res.ok) {
          await client.auth.signOut();
        }
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshUserData(client, session.user.id);
      } else {
        clearSessionState();
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, [refreshUserData, clearSessionState]);

  const login = async (phoneOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const isEmail = phoneOrEmail.includes('@');
      const email = isEmail ? phoneOrEmail : `${phoneOrEmail}@mymensinghsheba.internal`;
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const res = await refreshUserData(client, data.user.id);
        if (res && !res.ok) {
          await client.auth.signOut();
          return {
            success: false,
            error: res.blocked
              ? 'আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় অবস্থায় রয়েছে। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।'
              : 'লগইন তথ্য সঠিক নয়',
          };
        }
        return { success: true };
      }
      return { success: false, error: 'লগইন তথ্য সঠিক নয়' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'লগইন করতে সমস্যা হয়েছে' };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const { error } = await client.auth.signInWithOtp({ phone });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const { data, error } = await client.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const res = await refreshUserData(client, data.user.id);
        if (res && !res.ok) {
          await client.auth.signOut();
          return {
            success: false,
            error: res.blocked
              ? 'আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় অবস্থায় রয়েছে। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।'
              : 'তথ্য খুঁজে পাওয়া যায়নি',
          };
        }
        return { success: true };
      }
      return { success: false, error: 'তথ্য খুঁজে পাওয়া যায়নি' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    fullName: string;
    phone: string;
    primaryAreaId: string;
    password: string;
    email?: string;
  }) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const email = (data.email?.trim() || '').toLowerCase() || `${data.phone}@mymensinghsheba.internal`;
      // Pass the full registration payload into the auth user's metadata. The
      // profiles row mirrors these values (see the DB-side trigger in
      // supabase/migrations/...fix_user_registration_profiles.sql), so the
      // row always matches the INSERT RLS policy for self-registration:
      //   auth.uid() = id, role = 'customer', status = 'active', is_verified = false
      const { data: signUpData, error } = await client.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            phone: data.phone,
            full_name: data.fullName,
            primary_area_id: data.primaryAreaId,
            email,
          },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (!signUpData.user) {
        return { success: false, error: 'একাউন্ট তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন।' };
      }

      const userId = signUpData.user.id;
      const hasSession = Boolean(signUpData.session);

      // When Supabase hands back a live session (email confirmation off) the
      // new user is authenticated immediately, so we can (and must) create
      // their profiles row right here — with exactly the values the INSERT
      // policy demands. When confirmation is required there is no session yet
      // and the row is created by the DB trigger on first signup instead.
      if (hasSession) {
        const { error: profileError } = await client.from('profiles').upsert({
          id: userId,
          full_name: data.fullName,
          phone: data.phone,
          email,
          primary_area_id: data.primaryAreaId,
          role: 'customer',
          status: 'active',
          is_verified: false,
        });
        if (profileError) {
          return {
            success: false,
            error: 'প্রোফাইল তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন।',
          };
        }
      }

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password: data.password });
      // When email confirmation is on, signUp returns no session and the sign-in
      // right after will be rejected until the confirmation link is opened. The
      // account was still created successfully (its DB trigger will have made
      // the profiles row), so surface the happy path and let the user confirm +
      // sign in — matching the previous success UX. With a session already in
      // hand, a redundant sign-in hiccup must not flip success into failure.
      if (signInError && !hasSession && signUpData.user?.confirmation_sent_at) {
        // `needsConfirmation` tells the caller that this "success" has no
        // session behind it yet, so it must NOT be treated as a completed
        // sign-in (no redirect to /profile — that page would bounce straight
        // back to /login until the link in the email is opened).
        return { success: true, needsConfirmation: true };
      }
      if (signInError && !hasSession) {
        return { success: false, error: signInError.message };
      }
      if (signInData.user) {
        await refreshUserData(client, signInData.user.id);
      } else if (hasSession && signUpData.session?.user) {
        // signUp already handed back a live session but the follow-up sign-in
        // hiccuped: hydrate from the session we already have, so "success"
        // always leaves `user` populated and the caller's redirect lands on a
        // profile page that can actually render.
        await refreshUserData(client, signUpData.session.user.id);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (phoneOrEmail: string) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const email = phoneOrEmail.includes('@') ? phoneOrEmail : `${phoneOrEmail}@mymensinghsheba.internal`;
      // Route the recovery link through the existing code-exchange callback so
      // the email opens a validated session, then land on the password form.
      const redirectTo = new URL('/auth/callback?next=/reset-password', window.location.origin).toString();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const client = createClient();
        if (client) await client.auth.signOut();
      }
      clearSessionState();
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        await client
          .from('profiles')
          .update({
            full_name: updated.fullName,
            phone: updated.phone,
            email: updated.email || null,
            avatar_url: updated.avatarUrl || null,
            bio: updated.bio || null,
            primary_area_id: updated.primaryAreaId,
            emergency_contact: updated.emergencyContact || null,
            updated_at: updated.updatedAt,
          })
          .eq('id', user.id);
      }
    }
  };

  /**
   * Profile photo → public `avatars` bucket, under the caller's own uid folder
   * (the storage policies only allow that folder, so one account can never
   * overwrite another's photo). The stored public URL is then persisted on the
   * profile row through the same `updateProfile` path everything else uses.
   */
  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false, error: 'লগইন করতে হবে।' };
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) দেওয়া যাবে।' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।' };
    }
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5);
    const path = `${user.id}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await client.storage.from('avatars').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ হয়েছে: ${error.message}` };

    const { data } = client.storage.from('avatars').getPublicUrl(path);
    if (!data.publicUrl) return { success: false, error: 'ছবির লিংক তৈরি করা যায়নি।' };
    await updateProfile({ avatarUrl: data.publicUrl });
    return { success: true, url: data.publicUrl };
  };

  /** Sets a new password for the CURRENT session — no reset email needed. */
  const changePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    if (newPassword.length < 6) {
      return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const activateToletProfile = async (
    details: Omit<ToletProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalListingsCount' | 'status'>
  ) => {
    if (!user) return;
    const newProf: ToletProfile = {
      id: `tolet-${Date.now()}`,
      userId: user.id,
      status: 'pending_approval',
      totalListingsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...details,
    };
    setToletProfile(newProf);
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        await client
          .from('tolet_profiles')
          .upsert(
            { ...toSnakeObject(details as Record<string, unknown>), user_id: user.id, status: 'pending_approval' },
            { onConflict: 'user_id' }
          );
      }
    }
  };

  const activateHomeTutorProfile = async (
    details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (!user) return;
    // Editing an already-published tutor keeps them published; otherwise the edit
    // goes back into review (draft/pending_approval). Approved/Rejected status is
    // always admin-owned and never sent from the client.
    const keepApproved = homeTutorProfile?.status === 'approved';
    const newProf: HomeTutorProfile = {
      id: homeTutorProfile?.id || `tutor-${Date.now()}`,
      userId: user.id,
      status: keepApproved ? 'approved' : 'pending_approval',
      createdAt: homeTutorProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...details,
    };
    setHomeTutorProfile(newProf);
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        const payload: Record<string, unknown> = {
          user_id: user.id,
          full_name: details.fullName,
          gender: details.gender,
          institution: details.institution,
          department: details.department,
          qualification: details.qualification,
          experience_years: details.experienceYears,
          preferred_areas: details.preferredAreas,
          preferred_classes: details.preferredClasses,
          preferred_subjects: details.preferredSubjects,
          expected_salary_min: details.expectedSalaryMin,
          expected_salary_max: details.expectedSalaryMax,
          days_per_week: details.daysPerWeek,
          bio: details.bio || null,
          student_id_card_url: details.studentIdCardUrl || null,
          nid_number: details.nidNumber || null,
          private_phone: details.privatePhone,
          teaching_mode: details.teachingMode,
          availability: details.availability,
          profile_photo_url: details.profilePhotoUrl || null,
        };
        // Never let the owner move an already-published profile out of 'approved'
        if (!keepApproved) {
          payload.status = 'pending_approval';
        }
        // The self-approval guard rejects INSERTing an 'approved' row, so a new
        // profile starts in review. An existing profile is UPDATEd in place —
        // the guard lets an owner re-assert the 'approved' status it holds.
        const { data: existing } = await client
          .from('home_tutor_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing) {
          await client.from('home_tutor_profiles').update(payload).eq('id', existing.id);
        } else {
          await client
            .from('home_tutor_profiles')
            .insert({ ...payload, status: 'pending_approval' });
        }
      }
    }
  };

  const activateBloodDonorProfile = async (
    details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (!user) return;
    // Editing an already-published donor keeps them published; otherwise the edit
    // goes back into review (pending_approval). Approved/Rejected/Suspended status
    // is always admin-owned and never sent from the client.
    const keepApproved = bloodDonorProfile?.status === 'approved';
    const newProf: BloodDonorProfile = {
      id: bloodDonorProfile?.id || `donor-${Date.now()}`,
      userId: user.id,
      status: keepApproved ? 'approved' : 'pending_approval',
      createdAt: bloodDonorProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...details,
    };
    setBloodDonorProfile(newProf);
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        const payload: Record<string, unknown> = {
          user_id: user.id,
          full_name: details.fullName,
          blood_group: details.bloodGroup,
          area_id: details.areaId,
          gender: details.gender,
          birth_year: details.birthYear ?? null,
          weight_kg: details.weightKg ?? null,
          is_available: details.isAvailable,
          last_donation_date: details.lastDonationDate || null,
          donation_count: details.donationCount,
          // PRIVACY: private_phone is stored but is only surfaced via the admin
          // contact-release flow. is_verified is never writable by the owner.
          private_phone: details.privatePhone,
          intro: details.intro || null,
          profile_photo_url: details.profilePhotoUrl || null,
        };
        // Never let the owner move an already-published profile out of 'approved'
        if (!keepApproved) {
          payload.status = 'pending_approval';
        }
        // Same guard as the tutor flow: INSERT starts in review; UPDATE in
        // place lets an approved donor keep publishing while being edited.
        const { data: existing } = await client
          .from('blood_donor_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing) {
          await client.from('blood_donor_profiles').update(payload).eq('id', existing.id);
        } else {
          await client
            .from('blood_donor_profiles')
            .insert({ ...payload, status: 'pending_approval' });
        }
      }
    }
  };

  const toggleSaveItem = async (item: Omit<SavedListingItem, 'id' | 'userId' | 'savedAt'>) => {
    if (!user) return;
    setSavedListings((prev) => {
      const exists = prev.find((i) => i.itemType === item.itemType && i.title === item.title);
      let nextList: SavedListingItem[];
      if (exists) {
        nextList = prev.filter((i) => i.id !== exists.id);
      } else {
        const newItem: SavedListingItem = {
          ...item,
          id: `save-${Date.now()}`,
          userId: user.id,
          savedAt: new Date().toISOString(),
        };
        nextList = [newItem, ...prev];
      }
      return nextList;
    });
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        const exists = savedListings.find((i) => i.itemType === item.itemType && i.title === item.title);
        if (exists) {
          await client.from('saved_items').delete().eq('id', exists.id);
        } else {
          await client.from('saved_items').insert({
            user_id: user.id,
            item_type: item.itemType,
            item_id: item.linkHref.split('/').pop() || 'listing',
          });
        }
      }
    }
  };

  const markNotificationsReadAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (!isSupabaseConfigured) return;
    const client = createClient();
    if (!client || !user) return;
    try {
      // Personal inbox: only rows owned by this user. Admin hub rows
      // (target_role='admin') are matched separately so a single action covers
      // both, while never touching another user's notifications.
      const personalPromise = client
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      const adminPromise =
        user.role === 'admin'
          ? client
              .from('notifications')
              .update({ is_read: true })
              .eq('target_role', 'admin')
              .eq('is_read', false)
          : Promise.resolve({ error: null });
      await Promise.all([personalPromise, adminPromise]);
    } catch {
      // The optimistic UI update already happened; a failed write should not
      // crash the page or leave an unhandled rejection in the console.
    }
  };

  const createServiceRequest = async (
    requestData: Omit<
      ServiceRequestItem,
      'id' | 'customerId' | 'createdAt' | 'status' | 'serviceTitleBn'
    >
  ) => {
    if (!user) return;
    const newReq: ServiceRequestItem = {
      ...requestData,
      id: `req-${Date.now()}`,
      customerId: user.id,
      status: 'new',
      serviceTitleBn:
        LAUNCH_SERVICES.find((s) => s.slug === requestData.serviceSlug)?.nameBn ||
        requestData.serviceSlug,
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [newReq, ...prev]);
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        await client.from('service_requests').insert({
          customer_id: user.id,
          service_slug: requestData.serviceSlug,
          status: 'new',
          area_id: requestData.areaId,
          address_line: requestData.addressLine,
          contact_name: requestData.contactName,
          contact_phone: requestData.contactPhone,
          preferred_date: requestData.preferredDate || null,
          preferred_time: requestData.preferredTime || null,
          details: requestData.details || null,
          profile_id: requestData.profileId || null,
          profile_title: requestData.profileTitleBn || null,
          service_type: requestData.serviceType || null,
          attachment_url: requestData.attachmentUrl || null,
          // Home Moving (বাসা পাল্টানো) private request fields
          pickup_area_id: requestData.pickupAreaId || null,
          destination_area_id: requestData.destinationAreaId || null,
          pickup_address: requestData.pickupAddress || null,
          destination_address: requestData.destinationAddress || null,
          pickup_floor: requestData.pickupFloor || null,
          destination_floor: requestData.destinationFloor || null,
          has_lift: requestData.hasLift || false,
          parking_info: requestData.parkingInfo || null,
          moving_items: requestData.movingItems ? JSON.stringify(requestData.movingItems) : '[]',
          photo_urls: requestData.photoUrls ? JSON.stringify(requestData.photoUrls) : '[]',
        });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        toletProfile,
        homeTutorProfile,
        bloodDonorProfile,
        requests,
        savedListings,
        notifications,
        isLoading,
        isAdmin: user?.role === 'admin',
        isConfiguredWithSupabase: isSupabaseConfigured,
        login,
        sendOtp,
        verifyOtp,
        register,
        resetPassword,
        logout,
        updateProfile,
        uploadAvatar,
        changePassword,
        markNotificationsReadAll,
        activateToletProfile,
        activateHomeTutorProfile,
        activateBloodDonorProfile,
        toggleSaveItem,
        createServiceRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
