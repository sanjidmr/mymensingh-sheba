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
import { MCC_AREAS } from './locations';
import type { AppRole } from './auth-routes';

const NOT_CONFIGURED_MESSAGE =
  'ডেটাবেজ সংযোগ নেই। Supabase কনফিগারেশন যাচাই করে আবার চেষ্টা করুন।';

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
    if (n.relatedType === 'blood_request') return '/admin/blood/donors';
    if (n.relatedType === 'contact_message') return `/admin/messages/${id}`;
    return '/admin/reports';
  }
  // Customer-facing decisions point at the customer dashboard: a moderation
  // verdict belongs next to the posts list, not in a generic inbox.
  if (n.relatedType === 'community_post') return '/dashboard/posts';
  if (n.relatedType === 'tolet_listing') return '/profile/tolet';
  if (n.relatedType === 'tutor_profile' || n.relatedType === 'blood_donor_profile') return '/dashboard/posts';
  if (n.relatedType === 'contact_message') return '/dashboard/messages';
  return '/profile/requests';
}

interface AuthContextType {
  user: UserProfile | null;
  toletProfile: ToletProfile | null;
  homeTutorProfile: HomeTutorProfile | null;
  bloodDonorProfile: BloodDonorProfile | null;
  requests: ServiceRequestItem[];
  savedListings: SavedListingItem[];
  savedListingsLoading: boolean;
  savedListingsError: string;
  notifications: NotificationItem[];
  notificationsError: string;
  notificationsLoading: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isConfiguredWithSupabase: boolean;
  login: (phoneOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string; role?: AppRole }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string; role?: AppRole }>;
  register: (data: {
    fullName: string;
    phone: string;
    primaryAreaId: string;
    password: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  resetPassword: (phoneOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  /** Upload a new profile photo to the owner-scoped `avatars` bucket. */
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string; url?: string }>;
  /** Change the signed-in user's password via Supabase Auth. */
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationsReadAll: () => Promise<{ success: boolean; error?: string }>;
  activateToletProfile: (details: Omit<ToletProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalListingsCount' | 'status'>) => Promise<void>;
  activateHomeTutorProfile: (
    details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode?: 'draft' | 'submit'
  ) => Promise<{ success: boolean; error?: string }>;
  activateBloodDonorProfile: (
    details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode?: 'draft' | 'submit'
  ) => Promise<{ success: boolean; error?: string }>;
  toggleSaveItem: (item: Omit<SavedListingItem, 'id' | 'userId' | 'savedAt'>) => Promise<{ success: boolean; error?: string }>;
  createServiceRequest: (
    request: Omit<ServiceRequestItem, 'id' | 'customerId' | 'createdAt' | 'status' | 'serviceTitleBn'>
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toletProfile, setToletProfile] = useState<ToletProfile | null>(null);
  const [homeTutorProfile, setHomeTutorProfile] = useState<HomeTutorProfile | null>(null);
  const [bloodDonorProfile, setBloodDonorProfile] = useState<BloodDonorProfile | null>(null);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([]);
  const [savedListingsLoading, setSavedListingsLoading] = useState(true);
  const [savedListingsError, setSavedListingsError] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState('');
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  // Keep the server render and the browser's first render identical. Whether
  // Supabase is configured is resolved after hydration in the effect below.
  const [isLoading, setIsLoading] = useState(true);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setToletProfile(null);
    setHomeTutorProfile(null);
    setBloodDonorProfile(null);
    setRequests([]);
    setSavedListings([]);
    setSavedListingsError('');
    setSavedListingsLoading(false);
    setNotifications([]);
    setNotificationsError('');
    setNotificationsLoading(false);
  }, []);

  const refreshUserData = useCallback(
    async (
      client: NonNullable<ReturnType<typeof createClient>>,
      userId: string
    ): Promise<{ ok: boolean; blocked?: boolean; role?: AppRole }> => {
      const { data: profileData } = await client.from('profiles').select('*').eq('id', userId).single();
      if (!profileData) {
        clearSessionState();
        return { ok: false };
      }
      const profile = toCamelObject(profileData) as unknown as UserProfile;
      if (profile.email?.endsWith('@mymensinghsheba.internal')) profile.email = '';
      const rawPreferences = profileData.notification_preferences as Record<string, unknown> | null;
      profile.notificationPreferences = {
        postUpdates: rawPreferences?.post_updates !== false,
        requestUpdates: rawPreferences?.request_updates !== false,
        supportReplies: rawPreferences?.support_replies !== false,
      };
      // Account can be suspended/blocked by admin. Such users must not stay signed in.
      if (profile.status && profile.status !== 'active') {
        clearSessionState();
        return { ok: false, blocked: true };
      }
      // The verified role lives in the trusted `profiles` row, never in user
      // metadata or the email address. Everything downstream (routing, guards)
      // branches on this value.
      const role: AppRole = profile.role === 'admin' ? 'admin' : 'customer';
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

      setSavedListingsLoading(true);
      const { data: savedRows, error: savedError } = await client
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (savedError) {
        setSavedListings([]);
        setSavedListingsError(`সংরক্ষিত পোস্ট লোড করা যায়নি: ${savedError.message}`);
      } else {
        setSavedListingsError('');
        setSavedListings(
          (savedRows ?? []).flatMap((row: Record<string, unknown>) => {
            const camel = toCamelObject(row) as Record<string, unknown>;
            const itemType = camel.itemType;
            const itemId = String(camel.itemId ?? '');
            if (
              (itemType !== 'tolet' && itemType !== 'tutor' && itemType !== 'market' && itemType !== 'service') ||
              !itemId
            ) {
              return [];
            }
            return [{
              id: String(camel.id),
              userId: String(camel.userId),
              itemType,
              itemId,
              title: '',
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
            }];
          })
        );
      }
      setSavedListingsLoading(false);

      // Notifications: personal ones plus (for admins) the admin hub rows.
      setNotificationsLoading(true);
      const isAdminUser = profile.role === 'admin';
      const { data: personalNotifs, error: personalNotifError } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      const { data: adminNotifs, error: adminNotifError } = isAdminUser
        ? await client
            .from('notifications')
            .select('*')
            .eq('target_role', 'admin')
            .order('created_at', { ascending: false })
            .limit(50)
        : { data: [], error: null };
      if (personalNotifError || adminNotifError) {
        setNotifications([]);
        setNotificationsError(
          `নোটিফিকেশন লোড করা যায়নি: ${personalNotifError?.message ?? adminNotifError?.message}`
        );
        setNotificationsLoading(false);
        // The profile itself loaded fine — a transient notifications failure must
        // not sign the user out or make the caller forget their verified role.
        return { ok: true, role };
      }
      setNotificationsError('');
      const merged: NotificationItem[] = [...personalNotifs, ...adminNotifs]
        .map((row) => {
          const c = toCamelObject(row as Record<string, unknown>) as unknown as NotificationItem;
          c.linkHref = notificationLink(c);
          return c;
        })
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 50);
      setNotifications(merged);
      setNotificationsLoading(false);
      return { ok: true, role };
    },
    [clearSessionState]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      queueMicrotask(() => setIsLoading(false));
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
              ? 'আপনার অ্যাকাউন্টটি স্থগিত বা বন্ধ। সহায়তার জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।'
              : 'প্রোফাইল তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
          };
        }
        return { success: true, role: res?.role ?? 'customer' };
      }
      return { success: false, error: 'লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' };
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
              ? 'আপনার অ্যাকাউন্টটি স্থগিত বা বন্ধ। সহায়তার জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।'
              : 'প্রোফাইল তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
          };
        }
        return { success: true, role: res?.role ?? 'customer' };
      }
      return { success: false, error: 'যাচাইকরণ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' };
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
        return { success: false, error: 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।' };
      }

      const userId = signUpData.user.id;
      const hasSession = Boolean(signUpData.session);

      // When Supabase hands back a live session (email confirmation off) the
      // new user is authenticated immediately, so we can (and must) create
      // their profiles row right here, with exactly the values the INSERT
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
            error: 'প্রোফাইল তৈরি করা যায়নি। সহায়তার জন্য যোগাযোগ করুন।',
          };
        }
      }

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password: data.password });
      // When email confirmation is on, signUp returns no session and the sign-in
      // right after will be rejected until the confirmation link is opened. The
      // account was still created successfully (its DB trigger will have made
      // the profiles row), so surface the happy path and let the user confirm +
      // sign in, matching the previous success UX. With a session already in
      // hand, a redundant sign-in hiccup must not flip success into failure.
      if (signInError && !hasSession && signUpData.user?.confirmation_sent_at) {
        // `needsConfirmation` tells the caller that this "success" has no
        // session behind it yet, so it must NOT be treated as a completed
        // sign-in (no redirect to /profile; that page would bounce straight
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
      return { success: false, error: err instanceof Error ? err.message : 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' };
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
        if (!client) throw new Error('Supabase সংযোগ তৈরি করা যায়নি।');
        const { error } = await client.auth.signOut();
        if (error) throw new Error(`লগআউট করা যায়নি: ${error.message}`);
      }
      clearSessionState();
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase সংযুক্ত নেই; তথ্য সংরক্ষণ করা যায়নি।' };
    }
    const client = createClient();
    if (!client) {
      return { success: false, error: 'ডেটাবেজ সংযোগ তৈরি করা যায়নি; আবার চেষ্টা করুন।' };
    }

    if (updates.phone !== undefined && updates.phone !== user.phone) {
      return { success: false, error: 'নম্বর বদলাতে আগে নতুন নম্বরে OTP যাচাই সম্পন্ন করুন।' };
    }
    if (updates.fullName !== undefined && updates.fullName.trim().length < 2) {
      return { success: false, error: 'নাম কমপক্ষে ২ অক্ষরের লিখুন।' };
    }
    if (updates.bio !== undefined && updates.bio.length > 300) {
      return { success: false, error: 'পরিচিতি ৩০০ অক্ষরের মধ্যে লিখুন।' };
    }
    if (updates.primaryAreaId !== undefined && !updates.primaryAreaId.trim()) {
      return { success: false, error: 'আপনার এলাকা নির্বাচন করুন।' };
    }
    if (updates.primaryAreaId !== undefined && !MCC_AREAS.some((area) => area.id === updates.primaryAreaId)) {
      return { success: false, error: 'ময়মনসিংহ সিটি কর্পোরেশনের একটি এলাকা নির্বাচন করুন।' };
    }

    const updated = { ...user, ...updates, phone: user.phone, updatedAt: new Date().toISOString() };
    const notificationPreferences = updates.notificationPreferences
      ? {
          post_updates: updates.notificationPreferences.postUpdates,
          request_updates: updates.notificationPreferences.requestUpdates,
          support_replies: updates.notificationPreferences.supportReplies,
        }
      : undefined;
    const { error } = await client
      .from('profiles')
      .update({
        full_name: updated.fullName,
        email: updated.email || null,
        avatar_url: updated.avatarUrl || null,
        bio: updated.bio || null,
        primary_area_id: updated.primaryAreaId,
        emergency_contact: updated.emergencyContact || null,
        ...(notificationPreferences ? { notification_preferences: notificationPreferences } : {}),
        updated_at: updated.updatedAt,
      })
      .eq('id', user.id);
    if (error) {
      return { success: false, error: `প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে: ${error.message}` };
    }

    setUser(updated);
    return { success: true };
  };

  /** Uploads an avatar to the caller's own folder in the public avatars bucket. */
  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    const avatarExtensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = avatarExtensions[file.type];
    if (!extension) {
      return { success: false, error: 'শুধু JPG, PNG বা WebP ছবি আপলোড করুন।' };
    }
    if (file.size === 0) return { success: false, error: 'খালি ফাইল আপলোড করা যাবে না।' };
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'ছবির আকার সর্বোচ্চ ৫ MB হতে পারবে।' };
    }
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };

    const uniqueId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${user.id}/avatar-${uniqueId}.${extension}`;
    const { error } = await client.storage.from('avatars').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ হয়েছে: ${error.message}` };

    const { data } = client.storage.from('avatars').getPublicUrl(path);
    if (!data.publicUrl) return { success: false, error: 'ছবির ঠিকানা তৈরি করা যায়নি।' };
    const profileResult = await updateProfile({ avatarUrl: data.publicUrl });
    if (!profileResult.success) {
      const { error: cleanupError } = await client.storage.from('avatars').remove([path]);
      if (cleanupError) {
        return {
          success: false,
          error: `${profileResult.error || 'প্রোফাইলে ছবি সংরক্ষণ ব্যর্থ হয়েছে।'} ছবিটি আপলোড হয়েছে, কিন্তু পরিষ্কার করা যায়নি: ${cleanupError.message}`,
        };
      }
      return profileResult;
    }
    return { success: true, url: data.publicUrl };
  };

  /** Sets a new password for the current authenticated session. */
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
    details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode: 'draft' | 'submit' = 'submit'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'প্রোফাইল সংরক্ষণ করতে লগইন করুন।' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    // Editing an already-published tutor keeps them published; otherwise the edit
    // goes back into review (draft/pending_approval). Approved/Rejected status is
    // always admin-owned and never sent from the client.
    const { data: existing, error: lookupError } = await client
      .from('home_tutor_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (lookupError) return { success: false, error: `প্রোফাইল পড়া যায়নি: ${lookupError.message}` };
    const keepApproved = existing?.status === 'approved';
    const status = keepApproved ? 'approved' : mode === 'draft' ? 'draft' : 'pending_approval';
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
      educations: details.educations ?? [],
      status,
    };
    // The trigger permits keeping an existing approved profile approved but
    // prevents every owner-initiated transition into a guarded status.
    const result = existing
      ? await client
          .from('home_tutor_profiles')
          .update(payload)
          .eq('id', existing.id)
          .select('id, created_at, updated_at')
          .single()
      : await client
          .from('home_tutor_profiles')
          .insert(payload)
          .select('id, created_at, updated_at')
          .single();
    if (result.error || !result.data) {
      return {
        success: false,
        error: `প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে: ${result.error?.message || 'সংরক্ষিত প্রোফাইল ফেরত পাওয়া যায়নি।'}`,
      };
    }
    const newProf: HomeTutorProfile = {
      id: result.data.id,
      userId: user.id,
      status,
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
      ...details,
    };
    setHomeTutorProfile(newProf);
    return { success: true };
  };

  const activateBloodDonorProfile = async (
    details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode: 'draft' | 'submit' = 'submit'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'প্রোফাইল সংরক্ষণ করতে লগইন করুন।' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    // Editing an already-published donor keeps them published; otherwise the edit
    // goes back into review (pending_approval). Approved/Rejected/Suspended status
    // is always admin-owned and never sent from the client.
    const { data: existing, error: lookupError } = await client
      .from('blood_donor_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (lookupError) return { success: false, error: `প্রোফাইল পড়া যায়নি: ${lookupError.message}` };
    const keepApproved = existing?.status === 'approved';
    const status = keepApproved ? 'approved' : mode === 'draft' ? 'draft' : 'pending_approval';
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
      // Private donor contact and verification are never public or owner-writable.
      private_phone: details.privatePhone,
      intro: details.intro || null,
      profile_photo_url: details.profilePhotoUrl || null,
      // Owner-controlled visibility of the "রক্তদানের বর্তমান প্রস্তুতি" panel on
      // the public card. Defaults to hidden so a donor who never chose to show it
      // is never published as if they had.
      show_readiness: details.showReadiness ?? false,
      status,
    };
    const result = existing
      ? await client
          .from('blood_donor_profiles')
          .update(payload)
          .eq('id', existing.id)
          .select('id, created_at, updated_at')
          .single()
      : await client
          .from('blood_donor_profiles')
          .insert(payload)
          .select('id, created_at, updated_at')
          .single();
    if (result.error || !result.data) {
      return {
        success: false,
        error: `প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে: ${result.error?.message || 'সংরক্ষিত প্রোফাইল ফেরত পাওয়া যায়নি।'}`,
      };
    }
    const newProf: BloodDonorProfile = {
      id: result.data.id,
      userId: user.id,
      status,
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
      ...details,
    };
    setBloodDonorProfile(newProf);
    return { success: true };
  };

  const toggleSaveItem = async (item: Omit<SavedListingItem, 'id' | 'userId' | 'savedAt'>) => {
    if (!user) return { success: false, error: 'সংরক্ষিত পোস্টে পরিবর্তনের আগে লগইন করুন।' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: 'ডেটাবেজ সংযোগ তৈরি করা যায়নি।' };
    const itemId = item.itemId || item.linkHref.split('/').filter(Boolean).pop();
    if (!itemId) return { success: false, error: 'পোস্টের পরিচিতি পাওয়া যায়নি।' };
    const existing = savedListings.find((saved) => saved.itemType === item.itemType && saved.itemId === itemId);
    if (existing) {
      const { error } = await client
        .from('saved_items')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', user.id);
      if (error) return { success: false, error: `সংরক্ষিত পোস্ট সরানো যায়নি: ${error.message}` };
      setSavedListings((previous) => previous.filter((saved) => saved.id !== existing.id));
    } else {
      const { data, error } = await client
        .from('saved_items')
        .insert({ user_id: user.id, item_type: item.itemType, item_id: itemId })
        .select('id, created_at')
        .single();
      if (error || !data) {
        return { success: false, error: `পোস্ট সংরক্ষণ করা যায়নি: ${error?.message ?? 'সংরক্ষিত পোস্ট ফেরত পাওয়া যায়নি।'}` };
      }
      setSavedListings((previous) => [{
        ...item,
        itemId,
        id: data.id,
        userId: user.id,
        savedAt: data.created_at,
      }, ...previous]);
    }
    return { success: true };
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    if (!/^[0-9a-f-]{36}$/i.test(notificationId)) {
      return { success: false, error: 'নোটিফিকেশন আইডি সঠিক নয়।' };
    }
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase সংযুক্ত নেই; নোটিফিকেশন আপডেট করা যায়নি।' };
    }
    const client = createClient();
    if (!client) return { success: false, error: 'ডেটাবেজ সংযোগ তৈরি করা যায়নি।' };

    let query = client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('is_read', false);
    query = user.role === 'admin'
      ? query.or(`user_id.eq.${user.id},target_role.eq.admin`)
      : query.eq('user_id', user.id).eq('target_role', 'customer');
    const { error } = await query;
    if (error) return { success: false, error: `নোটিফিকেশন আপডেট ব্যর্থ হয়েছে: ${error.message}` };
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
    return { success: true };
  };

  const markNotificationsReadAll = async () => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase সংযুক্ত নেই; নোটিফিকেশন আপডেট করা যায়নি।' };
    }
    const client = createClient();
    if (!client) {
      return { success: false, error: 'ডেটাবেজ সংযোগ তৈরি করা যায়নি; আবার চেষ্টা করুন।' };
    }

    // Personal rows are scoped to the signed-in user; admin hub rows are only
    // included for a verified admin session and remain protected by RLS.
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
    const [personalResult, adminResult] = await Promise.all([personalPromise, adminPromise]);
    if (personalResult.error || adminResult.error) {
      return {
        success: false,
        error: `নোটিফিকেশন আপডেট ব্যর্থ হয়েছে: ${personalResult.error?.message ?? adminResult.error?.message}`,
      };
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    return { success: true };
  };

  const createServiceRequest = async (
    requestData: Omit<
      ServiceRequestItem,
      'id' | 'customerId' | 'createdAt' | 'status' | 'serviceTitleBn'
    >
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'অনুরোধ পাঠাতে লগইন করতে হবে।' };
    }
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

    // Write first, then reflect it. A request that failed to persist must not
    // appear in the customer's list as if it had been filed — and callers rely
    // on this result to know whether the submission was really recorded.
    if (isSupabaseConfigured) {
      const client = createClient();
      if (client) {
        const { error } = await client.from('service_requests').insert({
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
          // Home Moving private request fields
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
        if (error) {
          return { success: false, error: `অনুরোধ সংরক্ষণ করা যায়নি: ${error.message}` };
        }
      }
    }

    setRequests((prev) => [newReq, ...prev]);
    return { success: true };
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
        savedListingsLoading,
        savedListingsError,
        notifications,
        notificationsError,
        notificationsLoading,
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
        markNotificationRead,
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
