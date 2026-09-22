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
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (phoneOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
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

      const { data: toletRow } = await client.from('tolet_profiles').select('*').eq('user_id', userId).maybeSingle();
      setToletProfile(toletRow ? (toCamelObject(toletRow) as unknown as ToletProfile) : null);

      const { data: tutorRow } = await client.from('home_tutor_profiles').select('*').eq('user_id', userId).maybeSingle();
      setHomeTutorProfile(tutorRow ? (toCamelObject(tutorRow) as unknown as HomeTutorProfile) : null);

      const { data: donorRow } = await client.from('blood_donor_profiles').select('*').eq('user_id', userId).maybeSingle();
      setBloodDonorProfile(donorRow ? (toCamelObject(donorRow) as unknown as BloodDonorProfile) : null);

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
                : `সেবা (${itemId})`,
            areaName: '',
            linkHref:
              itemType === 'tolet'
                ? `/tolet/${itemId}`
                : itemType === 'tutor'
                ? `/home-tutor/${itemId}`
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
    });
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
      const email = data.email || `${data.phone}@mymensinghsheba.internal`;
      const { data: signUpData, error } = await client.auth.signUp({
        email,
        password: data.password,
        options: { data: { phone: data.phone, full_name: data.fullName } },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (signUpData.user) {
        await client.from('profiles').upsert({
          id: signUpData.user.id,
          full_name: data.fullName,
          phone: data.phone,
          email,
          primary_area_id: data.primaryAreaId,
          role: 'customer',
          is_verified: false,
        });
      }
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password: data.password });
      if (signInError) {
        return { success: true };
      }
      if (signInData.user) {
        await refreshUserData(client, signInData.user.id);
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
      const { error } = await client.auth.resetPasswordForEmail(email);
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
            primary_area_id: updated.primaryAreaId,
            emergency_contact: updated.emergencyContact || null,
            updated_at: updated.updatedAt,
          })
          .eq('id', user.id);
      }
    }
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
        await client.from('home_tutor_profiles').upsert(payload, { onConflict: 'user_id' });
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
        await client.from('blood_donor_profiles').upsert(payload, { onConflict: 'user_id' });
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
    if (!client) return;
    await client.from('notifications').update({ is_read: true }).eq('is_read', false);
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
