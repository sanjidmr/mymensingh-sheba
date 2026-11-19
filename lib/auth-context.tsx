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
import { safeUUID } from './safe';
import { normalizeJsonArray } from './request-data';
import { LAUNCH_SERVICES } from './services-data';
import { isSafeInternalPath, type AppRole } from './auth-routes';
import { normalizeBangladeshPhone } from './onboarding';
import { normalizeAreaName } from './area-names';
import { apiFetch } from './api-fetch';
import { Browser } from '@capacitor/browser';
import { isNative } from './platform';
import { removeDeviceToken } from './native-push';
import { getRecentAuthRefreshFailure, isAbortError } from './fetch-with-timeout';
import { getTransientSessionRestoreMessage } from './auth/session-restore';
import { getAuthErrorMessage } from './auth-error-messages';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const NOT_CONFIGURED_MESSAGE =
  'ডেটাবেজ সংযোগ নেই। Supabase কনফিগারেশন যাচাই করে আবার চেষ্টা করুন।';
const ACCOUNT_DATA_PAGE_SIZE = 50;
const SERVICE_REQUEST_COLUMNS =
  'id, reference_code, customer_id, service_slug, status, area_id, address_line, contact_name, contact_phone, preferred_date, details, profile_id, profile_title, service_type, preferred_time, attachment_url, admin_notes, updated_at, created_at, pickup_area_id, destination_area_id, pickup_address, destination_address, pickup_floor, destination_floor, has_lift, parking_info, moving_items, photo_urls, quotation';
const SAVED_ITEM_COLUMNS = 'id, user_id, item_type, item_id, created_at';
const NOTIFICATION_COLUMNS =
  'id, user_id, target_role, title, body, type, related_type, related_id, is_read, created_at';

function describeDataError(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const candidate = error as { code?: unknown; message?: unknown; status?: unknown };
  const details = [
    typeof candidate.status === 'number' ? `HTTP ${candidate.status}` : '',
    typeof candidate.code === 'string' ? candidate.code : '',
    typeof candidate.message === 'string' ? candidate.message : '',
  ].filter(Boolean);
  return details.join(': ') || 'Unknown database error';
}

function logAuthEvent(
  name: string,
  details: Record<string, string | number | undefined> = {},
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  console[level](JSON.stringify({ event: `auth.${name}`, ...details }));
}

function authErrorLogDetails(error: unknown): Record<string, string | number | undefined> {
  if (!error || typeof error !== 'object') {
    return { reason: typeof error === 'string' ? error : 'Unknown auth error' };
  }
  const candidate = error as { code?: unknown; message?: unknown; status?: unknown };
  return {
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    reason: typeof candidate.message === 'string' ? candidate.message : 'Unknown auth error',
  };
}

function mapServiceRequestRows(rows: Array<Record<string, unknown>>): ServiceRequestItem[] {
  return rows.map((row) => {
    const camel = toCamelObject(row) as unknown as ServiceRequestItem;
    camel.movingItems = normalizeJsonArray(camel.movingItems).filter(
      (item): item is NonNullable<ServiceRequestItem['movingItems']>[number] =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).labelBn === 'string'
    );
    camel.photoUrls = normalizeJsonArray(camel.photoUrls).filter(
      (url): url is string => typeof url === 'string'
    );
    const service = LAUNCH_SERVICES.find((s) => s.slug === camel.serviceSlug);
    camel.serviceTitleBn = service?.nameBn || camel.serviceSlug;
    if (!camel.profileTitleBn) {
      camel.profileTitleBn =
        ((camel as unknown as Record<string, unknown>).profileTitle as string) || undefined;
    }
    return camel;
  });
}

function mapSavedItemRows(rows: Array<Record<string, unknown>>): SavedListingItem[] {
  return rows.flatMap((row) => {
    const camel = toCamelObject(row);
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
  });
}

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

function authUserHasPassword(authUser: {
  email?: string | null;
  identities?: Array<{ provider: string }> | null;
  app_metadata?: { provider?: string; providers?: string[] };
}): boolean {
  const providers = new Set([
    ...(authUser.identities ?? []).map((identity) => identity.provider),
    ...(authUser.app_metadata?.providers ?? []),
    ...(authUser.app_metadata?.provider ? [authUser.app_metadata.provider] : []),
  ]);
  if (providers.has('email')) return true;
  if (providers.size > 0) return false;
  // When provider metadata is unavailable, fail closed for email accounts and
  // require verification rather than accidentally allowing an unverified change.
  return Boolean(authUser.email);
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
  requestsLoading: boolean;
  requestsError: string;
  hasMoreRequests: boolean;
  loadMoreRequests: () => Promise<void>;
  savedListings: SavedListingItem[];
  savedListingsLoading: boolean;
  savedListingsError: string;
  hasMoreSavedListings: boolean;
  loadMoreSavedListings: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  notifications: NotificationItem[];
  notificationsError: string;
  notificationsLoading: boolean;
  isLoading: boolean;
  authRestoreError: string;
  isAdmin: boolean;
  isConfiguredWithSupabase: boolean;
  hasPassword: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; role?: AppRole }>;
  signInWithGoogle: (next?: string | null) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string; role?: AppRole }>;
  register: (data: { email: string; password: string; next?: string | null }) => Promise<{
    success: boolean;
    error?: string;
    needsConfirmation?: boolean;
  }>;
  resetPassword: (phoneOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPhoneUpdate: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneUpdate: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  /** Upload a new profile photo to the owner-scoped `avatars` bucket. */
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string; url?: string }>;
  /** Change the signed-in user's password via Supabase Auth. */
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationsReadAll: () => Promise<{ success: boolean; error?: string }>;
  activateToletProfile: (details: Omit<ToletProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalListingsCount' | 'status'>) => Promise<void>;
  activateHomeTutorProfile: (
    details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode?: 'draft' | 'submit'
  ) => Promise<{ success: true; profile: HomeTutorProfile } | { success: false; error: string }>;
  activateBloodDonorProfile: (
    details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode?: 'draft' | 'submit'
  ) => Promise<{ success: true; profile: BloodDonorProfile } | { success: false; error: string }>;
  toggleSaveItem: (item: Omit<SavedListingItem, 'id' | 'userId' | 'savedAt'>) => Promise<{ success: boolean; error?: string }>;
  createServiceRequest: (
    request: Omit<ServiceRequestItem, 'id' | 'customerId' | 'createdAt' | 'status' | 'serviceTitleBn'>
  ) => Promise<{ success: boolean; error?: string; referenceCode?: string; requestId?: string }>;
}

interface UserRefreshResult {
  ok: boolean;
  blocked?: boolean;
  profileMissing?: boolean;
  retryable?: boolean;
  error?: string;
  role?: AppRole;
}

interface AccountDataCursor {
  created_at: string;
  id: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toletProfile, setToletProfile] = useState<ToletProfile | null>(null);
  const [homeTutorProfile, setHomeTutorProfile] = useState<HomeTutorProfile | null>(null);
  const [bloodDonorProfile, setBloodDonorProfile] = useState<BloodDonorProfile | null>(null);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const requestCursorRef = React.useRef<AccountDataCursor | null>(null);
  const requestLoadInFlightRef = React.useRef(false);
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([]);
  const [savedListingsLoading, setSavedListingsLoading] = useState(true);
  const [savedListingsError, setSavedListingsError] = useState('');
  const [hasMoreSavedListings, setHasMoreSavedListings] = useState(false);
  const savedCursorRef = React.useRef<AccountDataCursor | null>(null);
  const savedLoadInFlightRef = React.useRef(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState('');
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const notificationLoadInFlightRef = React.useRef(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [authRestoreError, setAuthRestoreError] = useState('');
  // Keep the server render and the browser's first render identical. Whether
  // Supabase is configured is resolved after hydration in the effect below.
  const [isLoading, setIsLoading] = useState(true);
  const activeUserIdRef = React.useRef<string | null>(null);

  const clearSessionState = useCallback(() => {
    activeUserIdRef.current = null;
    setAuthRestoreError('');
    setUser(null);
    setHasPassword(false);
    setToletProfile(null);
    setHomeTutorProfile(null);
    setBloodDonorProfile(null);
    setRequests([]);
    setRequestsLoading(false);
    setRequestsError('');
    setHasMoreRequests(false);
    requestCursorRef.current = null;
    requestLoadInFlightRef.current = false;
    setSavedListings([]);
    setSavedListingsError('');
    setSavedListingsLoading(false);
    setHasMoreSavedListings(false);
    savedCursorRef.current = null;
    savedLoadInFlightRef.current = false;
    setNotifications([]);
    setNotificationsError('');
    setNotificationsLoading(false);
    notificationLoadInFlightRef.current = false;
  }, []);

  const loadMoreRequests = useCallback(async () => {
    if (!user?.id || requestLoadInFlightRef.current) return;
    const client = createClient();
    if (!client) {
      setRequestsError(NOT_CONFIGURED_MESSAGE);
      return;
    }

    requestLoadInFlightRef.current = true;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      let query = client
        .from('service_requests')
        .select(SERVICE_REQUEST_COLUMNS)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      const cursor = requestCursorRef.current;
      if (cursor) {
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      }
      const { data, error } = await query.limit(ACCOUNT_DATA_PAGE_SIZE + 1);
      if (activeUserIdRef.current !== user.id) return;
      if (error) throw error;

      const page = (data ?? []).slice(0, ACCOUNT_DATA_PAGE_SIZE);
      const last = page[page.length - 1] as Record<string, unknown> | undefined;
      requestCursorRef.current = last
        ? { created_at: String(last.created_at), id: String(last.id) }
        : requestCursorRef.current;
      setHasMoreRequests((data?.length ?? 0) > ACCOUNT_DATA_PAGE_SIZE);
      setRequests((previous) => [...previous, ...mapServiceRequestRows(page)]);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Signed-in service request page load failed:', error);
        setRequestsError(`রিকোয়েস্ট লোড করা যায়নি: ${describeDataError(error)}`);
      }
    } finally {
      if (activeUserIdRef.current === user.id) {
        requestLoadInFlightRef.current = false;
        setRequestsLoading(false);
      }
    }
  }, [user]);

  const loadMoreSavedListings = useCallback(async () => {
    if (!user?.id || savedLoadInFlightRef.current) return;
    const client = createClient();
    if (!client) {
      setSavedListingsError(NOT_CONFIGURED_MESSAGE);
      return;
    }

    savedLoadInFlightRef.current = true;
    setSavedListingsLoading(true);
    setSavedListingsError('');
    try {
      let query = client
        .from('saved_items')
        .select(SAVED_ITEM_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      const cursor = savedCursorRef.current;
      if (cursor) {
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      }
      const { data, error } = await query.limit(ACCOUNT_DATA_PAGE_SIZE + 1);
      if (activeUserIdRef.current !== user.id) return;
      if (error) throw error;

      const page = (data ?? []).slice(0, ACCOUNT_DATA_PAGE_SIZE);
      const last = page[page.length - 1] as Record<string, unknown> | undefined;
      savedCursorRef.current = last
        ? { created_at: String(last.created_at), id: String(last.id) }
        : savedCursorRef.current;
      setHasMoreSavedListings((data?.length ?? 0) > ACCOUNT_DATA_PAGE_SIZE);
      setSavedListings((previous) => [...previous, ...mapSavedItemRows(page)]);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Saved listing page load failed:', error);
        setSavedListingsError(`সংরক্ষিত পোস্ট লোড করা যায়নি: ${describeDataError(error)}`);
      }
    } finally {
      if (activeUserIdRef.current === user.id) {
        savedLoadInFlightRef.current = false;
        setSavedListingsLoading(false);
      }
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id || notificationLoadInFlightRef.current) return;
    const client = createClient();
    if (!client) {
      setNotificationsError(NOT_CONFIGURED_MESSAGE);
      return;
    }

    notificationLoadInFlightRef.current = true;
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const personalPromise = client
        .from('notifications')
        .select(NOTIFICATION_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      const adminPromise = user.role === 'admin'
        ? client
            .from('notifications')
            .select(NOTIFICATION_COLUMNS)
            .eq('target_role', 'admin')
            .order('created_at', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [], error: null });
      const [personalResult, adminResult] = await Promise.all([personalPromise, adminPromise]);
      if (activeUserIdRef.current !== user.id) return;
      if (personalResult.error || adminResult.error) {
        const error = personalResult.error ?? adminResult.error;
        if (error && !isAbortError(error)) {
          console.error('Notification retry failed:', error);
          setNotificationsError(`নোটিফিকেশন লোড করা যায়নি: ${describeDataError(error)}`);
        }
        return;
      }

      const merged: NotificationItem[] = [...personalResult.data, ...adminResult.data]
        .map((row) => {
          const item = toCamelObject(row as Record<string, unknown>) as unknown as NotificationItem;
          item.linkHref = notificationLink(item);
          return item;
        })
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 50);
      setNotifications(merged);
    } catch (error) {
      if (!isAbortError(error) && activeUserIdRef.current === user.id) {
        console.error('Notification retry failed:', error);
        setNotificationsError(`নোটিফিকেশন লোড করা যায়নি: ${describeDataError(error)}`);
      }
    } finally {
      if (activeUserIdRef.current === user.id) {
        notificationLoadInFlightRef.current = false;
        setNotificationsLoading(false);
      }
    }
  }, [user]);

  const refreshUserData = useCallback(
    async (
      client: NonNullable<ReturnType<typeof createClient>>,
      userId: string,
      authUser?: {
        id: string;
        email?: string | null;
        identities?: Array<{ provider: string }> | null;
        app_metadata?: { provider?: string; providers?: string[] };
      },
      signal?: AbortSignal
    ): Promise<UserRefreshResult> => {
      const requestSignal = signal ?? new AbortController().signal;
      if (activeUserIdRef.current !== userId) {
        requestLoadInFlightRef.current = false;
        savedLoadInFlightRef.current = false;
      }
      activeUserIdRef.current = userId;
      setHasPassword(
        authUser?.id === userId ? authUserHasPassword(authUser) : false
      );
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .select('id, public_id, full_name, phone, email, avatar_url, primary_area_id, onboarding_completed_at, role, status, is_verified, emergency_contact, bio, notification_preferences, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()
        .abortSignal(requestSignal);
      if (activeUserIdRef.current !== userId) return { ok: false, retryable: true };
      if (profileError) {
        if (isAbortError(profileError)) return { ok: false, retryable: true };
        console.error('Signed-in profile lookup failed:', profileError);
        return { ok: false, retryable: true, error: describeDataError(profileError) };
      }
      if (!profileData) {
        clearSessionState();
        return { ok: false, profileMissing: true };
      }
      const profile = toCamelObject(profileData) as unknown as UserProfile;
      profile.phone = profile.phone || '';
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
      const role: AppRole =
        profile.role === 'admin'
          ? 'admin'
          : profile.role === 'news_editor'
            ? 'news_editor'
            : 'customer';
      setUser({ ...profile, status: profile.status || 'active' });
      setRequests([]);
      setRequestsLoading(true);
      setRequestsError('');
      setHasMoreRequests(false);
      requestCursorRef.current = null;
      setSavedListings([]);
      setSavedListingsLoading(true);
      setSavedListingsError('');
      setHasMoreSavedListings(false);
      savedCursorRef.current = null;
      setNotifications([]);
      setNotificationsLoading(true);
      setNotificationsError('');
      notificationLoadInFlightRef.current = false;

      const isAdminUser = profile.role === 'admin';
      const [
        toletResult,
        tutorResult,
        donorResult,
        requestResult,
        savedResult,
        personalNotificationResult,
        adminNotificationResult,
      ] = await Promise.all([
        client.rpc('fn_my_tolet_profile').abortSignal(requestSignal).maybeSingle(),
        client.rpc('fn_my_tutor_profile').abortSignal(requestSignal).maybeSingle(),
        client.rpc('fn_my_donor_profile').abortSignal(requestSignal).maybeSingle(),
        client
          .from('service_requests')
          .select(SERVICE_REQUEST_COLUMNS)
          .eq('customer_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(ACCOUNT_DATA_PAGE_SIZE + 1)
          .abortSignal(requestSignal),
        client
          .from('saved_items')
          .select(SAVED_ITEM_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(ACCOUNT_DATA_PAGE_SIZE + 1)
          .abortSignal(requestSignal),
        client
          .from('notifications')
          .select(NOTIFICATION_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
          .abortSignal(requestSignal),
        isAdminUser
          ? client
              .from('notifications')
              .select(NOTIFICATION_COLUMNS)
              .eq('target_role', 'admin')
              .order('created_at', { ascending: false })
              .limit(50)
              .abortSignal(requestSignal)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (activeUserIdRef.current !== userId) return { ok: false, retryable: true };

      for (const [operation, error] of [
        ['tolet profile', toletResult.error],
        ['tutor profile', tutorResult.error],
        ['blood donor profile', donorResult.error],
      ] as const) {
        if (error && !isAbortError(error)) {
          console.error(`Signed-in ${operation} lookup failed:`, error);
        }
      }

      const { data: toletRow } = toletResult;
      setToletProfile(toletRow ? (toCamelObject(toletRow as Record<string, unknown>) as unknown as ToletProfile) : null);
      const { data: tutorRow } = tutorResult;
      setHomeTutorProfile(tutorRow ? (toCamelObject(tutorRow as Record<string, unknown>) as unknown as HomeTutorProfile) : null);
      const { data: donorRow } = donorResult;
      setBloodDonorProfile(donorRow ? (toCamelObject(donorRow as Record<string, unknown>) as unknown as BloodDonorProfile) : null);

      if (requestResult.error) {
        if (!isAbortError(requestResult.error)) {
          console.error('Signed-in service request lookup failed:', requestResult.error);
          setRequestsError(`রিকোয়েস্ট লোড করা যায়নি: ${describeDataError(requestResult.error)}`);
        }
        setRequests([]);
        setHasMoreRequests(false);
      } else {
        const requestRows = requestResult.data ?? [];
        const firstPage = requestRows.slice(0, ACCOUNT_DATA_PAGE_SIZE);
        const lastRequest = firstPage[firstPage.length - 1];
        requestCursorRef.current = lastRequest
          ? { created_at: lastRequest.created_at, id: lastRequest.id }
          : null;
        setHasMoreRequests(requestRows.length > ACCOUNT_DATA_PAGE_SIZE);
        setRequests(mapServiceRequestRows(firstPage));
      }
      setRequestsLoading(false);

      if (savedResult.error) {
        if (!isAbortError(savedResult.error)) {
          console.error('Signed-in saved listing lookup failed:', savedResult.error);
          setSavedListingsError(`সংরক্ষিত পোস্ট লোড করা যায়নি: ${describeDataError(savedResult.error)}`);
        }
        setSavedListings([]);
        setHasMoreSavedListings(false);
      } else {
        const savedRows = savedResult.data ?? [];
        const firstPage = savedRows.slice(0, ACCOUNT_DATA_PAGE_SIZE);
        const lastSaved = firstPage[firstPage.length - 1];
        savedCursorRef.current = lastSaved
          ? { created_at: lastSaved.created_at, id: lastSaved.id }
          : null;
        setHasMoreSavedListings(savedRows.length > ACCOUNT_DATA_PAGE_SIZE);
        setSavedListings(mapSavedItemRows(firstPage));
      }
      setSavedListingsLoading(false);

      const { data: personalNotifs, error: personalNotifError } = personalNotificationResult;
      const { data: adminNotifs, error: adminNotifError } = adminNotificationResult;
      if (personalNotifError || adminNotifError) {
        if (personalNotifError && !isAbortError(personalNotifError)) {
          console.error(
            'Personal notification lookup failed:',
            describeDataError(personalNotifError)
          );
        }
        if (adminNotifError && !isAbortError(adminNotifError)) {
          console.error(
            'Admin notification lookup failed:',
            describeDataError(adminNotifError)
          );
        }
        setNotifications([]);
        setNotificationsError(
          `নোটিফিকেশন লোড করা যায়নি: ${describeDataError(personalNotifError ?? adminNotifError)}`
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
    let active = true;
    const controller = new AbortController();
    const pendingTimers = new Set<number>();
    const schedule = (callback: () => void, delay = 0) => {
      const timer = window.setTimeout(() => {
        pendingTimers.delete(timer);
        if (active) callback();
      }, delay);
      pendingTimers.add(timer);
    };

    const restoreInitialSession = async (
      user: NonNullable<Parameters<typeof refreshUserData>[2]>,
      signal: AbortSignal
    ): Promise<void> => {
      if (!active || activeUserIdRef.current !== user.id) return;
      try {
        const result = await refreshUserData(client, user.id, user, signal);
        if (!active) return;
        if (result.ok) setAuthRestoreError('');
        if (result.retryable) {
          console.error('Auth session restore could not verify the profile:', result.error);
        }
        if (!result.ok && !result.retryable) {
          await client.auth.signOut();
        }
      } catch (error) {
        if (!active) return;
        if (!isAbortError(error)) {
          console.error('Auth session restore failed:', error);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const { data: subscription } = client.auth.onAuthStateChange((
      event: AuthChangeEvent,
      session: Session | null
    ) => {
      schedule(() => {
        if (event === 'SIGNED_OUT') {
          logAuthEvent('session_signed_out', { reason: event });
          clearSessionState();
          setIsLoading(false);
          return;
        }
        if (!session?.user) {
          if (event === 'INITIAL_SESSION') {
            const refreshFailure = getRecentAuthRefreshFailure();
            const restoreError = getTransientSessionRestoreMessage(
              event,
              false,
              refreshFailure
            );
            if (restoreError) {
              logAuthEvent(
                'session_restore_temporarily_unavailable',
                { status: refreshFailure?.status, reason: refreshFailure?.kind },
                'warn'
              );
              setAuthRestoreError(restoreError);
              setIsLoading(false);
              return;
            }
          }
          clearSessionState();
          setIsLoading(false);
          return;
        }
        setAuthRestoreError('');
        if (event === 'TOKEN_REFRESHED') {
          logAuthEvent('token_refreshed');
        }
        if (
          event === 'INITIAL_SESSION' ||
          (event === 'SIGNED_IN' && activeUserIdRef.current !== session.user.id)
        ) {
          if (activeUserIdRef.current && activeUserIdRef.current !== session.user.id) {
            clearSessionState();
          }
          activeUserIdRef.current = session.user.id;
          setIsLoading(true);
          void restoreInitialSession(session.user, controller.signal);
        }
      });
    });
    return () => {
      active = false;
      controller.abort();
      pendingTimers.forEach((timer) => window.clearTimeout(timer));
      pendingTimers.clear();
      subscription.subscription.unsubscribe();
    };
  }, [refreshUserData, clearSessionState]);

  const login = async (email: string, pass: string) => {
    setAuthRestoreError('');
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });
      if (error) {
        logAuthEvent('login_failed', authErrorLogDetails(error), 'warn');
        if (isAbortError(error)) return { success: false };
        return { success: false, error: getAuthErrorMessage(error, 'login') };
      }
      if (data.user) {
        const res = await refreshUserData(client, data.user.id, data.user);
        if (!res.ok) {
          logAuthEvent(
            res.blocked ? 'login_blocked' : 'login_profile_verification_failed',
            { reason: res.error ?? (res.blocked ? 'Account is suspended' : 'Profile unavailable') },
            'warn'
          );
          if (!res.retryable) await client.auth.signOut();
          return {
            success: false,
            error: res.blocked
              ? 'আপনার অ্যাকাউন্টটি স্থগিত বা বন্ধ। সহায়তার জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।'
              : res.retryable
                ? `অ্যাকাউন্ট যাচাই করতে সাময়িক সমস্যা হয়েছে: ${res.error || 'আবার চেষ্টা করুন।'}`
                : 'প্রোফাইল তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
          };
        }
        logAuthEvent('login_succeeded', { role: res.role ?? 'customer' });
        return { success: true, role: res?.role ?? 'customer' };
      }
      logAuthEvent('login_failed', { reason: 'Supabase returned no user or error' }, 'warn');
      return { success: false, error: 'লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' };
    } catch (err: unknown) {
      logAuthEvent('login_failed', authErrorLogDetails(err), 'error');
      if (isAbortError(err)) return { success: false };
      return { success: false, error: getAuthErrorMessage(err, 'login') };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (next?: string | null) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }
    const client = createClient();
    if (!client) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }
    const target = isSafeInternalPath(next) ? next : '/profile';
    let callback: string;
    if (isNative()) {
      callback = `com.mymensinghsheba.app://auth/callback?next=${encodeURIComponent(target)}`;
    } else {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', target);
      callback = callbackUrl.toString();
    }
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback, ...(isNative() ? { skipBrowserRedirect: true } : {}) },
    });
    if (!error && isNative()) {
      if (!data.url) return { success: false, error: 'Google লগইন লিংক তৈরি করা যায়নি।' };
      try {
        await Browser.open({ url: data.url, toolbarColor: '#0c3b2e' });
      } catch {
        return { success: false, error: 'Google লগইন খোলা যায়নি। আবার চেষ্টা করুন।' };
      }
    }
    return error
      ? { success: false, error: getAuthErrorMessage(error, 'google') }
      : { success: true };
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

  const requestPhoneUpdate = async (phone: string) => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) return { success: false, error: 'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।' };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };

    const { error } = await client.auth.updateUser({ phone: normalized.international });
    return error
      ? { success: false, error: `যাচাইকরণ কোড পাঠানো যায়নি: ${error.message}` }
      : { success: true };
  };

  const verifyPhoneUpdate = async (phone: string, token: string) => {
    if (!user) return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const normalized = normalizeBangladeshPhone(phone);
    if (!normalized) return { success: false, error: 'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।' };
    if (!/^\d{6}$/.test(token.trim())) return { success: false, error: '৬ সংখ্যার যাচাইকরণ কোড লিখুন।' };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };

    const { data, error } = await client.auth.verifyOtp({
      phone: normalized.international,
      token: token.trim(),
      type: 'phone_change',
    });
    if (error) return { success: false, error: `নম্বর যাচাই করা যায়নি: ${error.message}` };
    if (!data.user) return { success: false, error: 'নম্বর যাচাই সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' };

    const { error: profileError } = await client
      .from('profiles')
      .update({ phone: normalized.local, updated_at: new Date().toISOString() })
      .eq('id', data.user.id);
    if (profileError) {
      return { success: false, error: `যাচাইকৃত নম্বর প্রোফাইলে সংরক্ষণ করা যায়নি: ${profileError.message}` };
    }

    const refreshed = await refreshUserData(client, data.user.id, data.user);
    if (!refreshed?.ok) {
      return { success: false, error: 'নম্বর সংরক্ষিত হয়েছে, তবে প্রোফাইল রিফ্রেশ করা যায়নি। পৃষ্ঠা রিলোড করুন।' };
    }
    return { success: true };
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
        const res = await refreshUserData(client, data.user.id, data.user);
        if (!res.ok) {
          if (!res.retryable) await client.auth.signOut();
          return {
            success: false,
            error: res.blocked
              ? 'আপনার অ্যাকাউন্টটি স্থগিত বা বন্ধ। সহায়তার জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।'
              : res.retryable
                ? `অ্যাকাউন্ট যাচাই করতে সাময়িক সমস্যা হয়েছে: ${res.error || 'আবার চেষ্টা করুন।'}`
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

  const register = async (data: { email: string; password: string; next?: string | null }) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const client = createClient();
      if (!client) {
        return { success: false, error: NOT_CONFIGURED_MESSAGE };
      }
      const email = data.email.trim().toLowerCase();
      const emailRedirectTo = new URL('/auth/callback', window.location.origin);
      const requestedTarget = isSafeInternalPath(data.next) ? data.next : '/profile';
      const redirectTo = isNative()
        ? `com.mymensinghsheba.app://auth/callback?next=${encodeURIComponent(requestedTarget)}`
        : (() => {
            emailRedirectTo.searchParams.set('next', requestedTarget);
            return emailRedirectTo.toString();
          })();
      const { data: signUpData, error } = await client.auth.signUp({
        email,
        password: data.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { email, full_name: 'নতুন ব্যবহারকারী' },
        },
      });
      if (error) {
        return { success: false, error: getAuthErrorMessage(error, 'register') };
      }
      if (!signUpData.user) {
        return { success: false, error: 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।' };
      }

      if (signUpData.session) {
        const res = await refreshUserData(client, signUpData.user.id, signUpData.user);
        if (!res.ok) {
          if (!res.retryable) await client.auth.signOut();
          return {
            success: false,
            error: res?.blocked
              ? 'আপনার অ্যাকাউন্টটি স্থগিত বা বন্ধ। সহায়তার জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।'
              : res.retryable
                ? `অ্যাকাউন্ট যাচাই করতে সাময়িক সমস্যা হয়েছে: ${res.error || 'আবার চেষ্টা করুন।'}`
                : 'প্রোফাইল তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
          };
        }
        return { success: true };
      }

      // Supabase does not issue a session until its required email confirmation
      // is completed. The callback exchanges that confirmation code and signs
      // the user in; do not attempt a second password login here.
      if (signUpData.user.confirmation_sent_at) {
        return { success: true, needsConfirmation: true };
      }

      return {
        success: false,
        error: 'এই ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যায়নি। ইমেইলটি আগে ব্যবহার হয়ে থাকলে পাসওয়ার্ড পুনরুদ্ধার করুন।',
      };
    } catch (err: unknown) {
      return { success: false, error: getAuthErrorMessage(err, 'register') };
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
      const redirectTo = isNative()
        ? 'com.mymensinghsheba.app://auth/callback?next=%2Freset-password'
        : new URL('/auth/callback?next=/reset-password', window.location.origin).toString();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        return { success: false, error: getAuthErrorMessage(error, 'recovery') };
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
        if (user) await removeDeviceToken(user.id);
        const { error } = await client.auth.signOut();
        if (error) throw new Error(`লগআউট করা যায়নি: ${error.message}`);
      }
      clearSessionState();
      logAuthEvent('logout_succeeded', { reason: 'user_initiated' });
    } catch (error) {
      logAuthEvent('logout_failed', authErrorLogDetails(error), 'error');
      throw error;
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

    if (updates.phone !== undefined && updates.phone.trim() && !normalizeBangladeshPhone(updates.phone)) {
      return { success: false, error: 'সঠিক ১১-ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন।' };
    }
    if (updates.fullName !== undefined && updates.fullName.trim().length < 2) {
      return { success: false, error: 'নাম কমপক্ষে ২ অক্ষরের লিখুন।' };
    }
    if (updates.bio !== undefined && updates.bio.length > 300) {
      return { success: false, error: 'পরিচিতি ৩০০ অক্ষরের মধ্যে লিখুন।' };
    }
    const primaryAreaId = updates.primaryAreaId === undefined
      ? user.primaryAreaId
      : normalizeAreaName(updates.primaryAreaId || '');
    if (updates.primaryAreaId !== undefined && (!primaryAreaId || primaryAreaId.length > 100)) {
      return { success: false, error: 'আপনার এলাকার নাম লিখুন (সর্বোচ্চ ১০০ অক্ষর)।' };
    }

    const normalizedPhone = updates.phone === undefined
      ? user.phone
      : normalizeBangladeshPhone(updates.phone)?.local ?? '';
    const updated = {
      ...user,
      ...updates,
      primaryAreaId,
      phone: normalizedPhone,
      updatedAt: new Date().toISOString(),
    };
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
        phone: updated.phone || null,
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

    const uniqueId = safeUUID();
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
  const changePassword = async (newPassword: string, currentPassword?: string) => {
    if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    const client = createClient();
    if (!client) return { success: false, error: NOT_CONFIGURED_MESSAGE };
    if (newPassword.length < 6) {
      return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }
    const { data: authData, error: authError } = await client.auth.getUser();
    const authUser = authData.user;
    if (authError || !authUser) {
      return { success: false, error: 'আপনাকে আগে লগইন করতে হবে।' };
    }
    const passwordExists = authUserHasPassword(authUser);
    if (passwordExists) {
      if (!currentPassword) {
        return { success: false, error: 'বর্তমান পাসওয়ার্ড লিখুন।' };
      }
      if (!authUser.email) {
        return { success: false, error: 'বর্তমান পাসওয়ার্ড যাচাই করা যাচ্ছে না।' };
      }
      const { error: verificationError } = await client.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });
      if (verificationError) {
        return { success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' };
      }
    }
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: `পাসওয়ার্ড সংরক্ষণ করা যায়নি: ${error.message}` };
    setHasPassword(true);
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
        const result = await client
          .from('tolet_profiles')
          .upsert(
            { ...toSnakeObject(details as Record<string, unknown>), user_id: user.id, status: 'pending_approval' },
            { onConflict: 'user_id' }
          )
          .select('id')
          .maybeSingle();
        if (result.data?.id) {
          setToletProfile({ ...newProf, id: result.data.id });
        }
      }
    }
  };

  const activateHomeTutorProfile = async (
    details: Omit<HomeTutorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode: 'draft' | 'submit' = 'submit'
  ): Promise<{ success: true; profile: HomeTutorProfile } | { success: false; error: string }> => {
    if (!user) return { success: false, error: 'প্রোফাইল সংরক্ষণ করতে লগইন করুন।' };
    const validChoices = (items: string[]) =>
      items.length <= 30 &&
      items.every((item) => item.trim().length > 0 && item.trim().length <= 60) &&
      new Set(items.map((item) => item.trim().toLocaleLowerCase())).size === items.length;
    if (!validChoices(details.preferredClasses) || !validChoices(details.preferredSubjects)) {
      return { success: false, error: 'শ্রেণি ও বিষয়ের তথ্য সঠিকভাবে লিখুন।' };
    }
    if (!Number.isInteger(details.expectedSalary) || details.expectedSalary < 0 ||
      !Number.isInteger(details.daysPerWeek) || details.daysPerWeek < 1 || details.daysPerWeek > 7) {
      return { success: false, error: 'প্রত্যাশিত বেতন বা সপ্তাহে পড়ানোর দিনের সংখ্যা সঠিক নয়।' };
    }
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
      expected_salary: details.expectedSalary,
      expected_salary_min: details.expectedSalary,
      expected_salary_max: details.expectedSalary,
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
    return { success: true, profile: newProf };
  };

  const activateBloodDonorProfile = async (
    details: Omit<BloodDonorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>,
    mode: 'draft' | 'submit' = 'submit'
  ): Promise<{ success: true; profile: BloodDonorProfile } | { success: false; error: string }> => {
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
    return { success: true, profile: newProf };
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
  ): Promise<{ success: boolean; error?: string; referenceCode?: string; requestId?: string }> => {
    if (!user) {
      return { success: false, error: 'অনুরোধ পাঠাতে লগইন করতে হবে।' };
    }

    // Write first, then reflect it. A request that failed to persist must not
    // appear in the customer's list as if it had been filed — and callers rely
    // on this result to know whether the submission was really recorded.
    let requestId: string | undefined;
    let referenceCode: string | undefined;
    if (isSupabaseConfigured) {
      let response: Response;
      try {
        response = await apiFetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_type: requestData.serviceSlug,
            service_slug: requestData.serviceSlug,
            service_label: requestData.serviceType || null,
            area_id: requestData.areaId,
            address_line: requestData.addressLine,
            contact_name: requestData.contactName,
            contact_phone: requestData.contactPhone,
            preferred_date: requestData.preferredDate || null,
            preferred_time: requestData.preferredTime || null,
            details: requestData.details || null,
            profile_id: requestData.profileId || null,
            profile_title: requestData.profileTitleBn || null,
            attachment_url: requestData.attachmentUrl || null,
            pickup_area_id: requestData.pickupAreaId || null,
            destination_area_id: requestData.destinationAreaId || null,
            pickup_address: requestData.pickupAddress || null,
            destination_address: requestData.destinationAddress || null,
            pickup_floor: requestData.pickupFloor || null,
            destination_floor: requestData.destinationFloor || null,
            has_lift: requestData.hasLift || false,
            parking_info: requestData.parkingInfo || null,
            moving_items: requestData.movingItems ?? [],
            photo_urls: requestData.photoUrls ?? [],
          }),
        });
      } catch {
        return { success: false, error: 'অনুরোধ সংরক্ষণ করা যায়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।' };
      }
      let result: {
        success?: boolean;
        requestId?: string;
        reference?: string;
        error?: string;
      };
      try {
        result = await response.json() as typeof result;
      } catch {
        return { success: false, error: 'সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।' };
      }
      if (!response.ok || !result.success || !result.requestId) {
        return { success: false, error: result.error || 'অনুরোধ সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
      }
      requestId = result.requestId;
      referenceCode = result.reference;
    }

    const newReq: ServiceRequestItem = {
      ...requestData,
      id: requestId ?? `req-${Date.now()}`,
      referenceCode,
      customerId: user.id,
      status: 'new',
      serviceTitleBn:
        LAUNCH_SERVICES.find((s) => s.slug === requestData.serviceSlug)?.nameBn ||
        requestData.serviceSlug,
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [newReq, ...prev]);
    return { success: true, requestId, referenceCode };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        toletProfile,
        homeTutorProfile,
        bloodDonorProfile,
        requests,
        requestsLoading,
        requestsError,
        hasMoreRequests,
        loadMoreRequests,
        savedListings,
        savedListingsLoading,
        savedListingsError,
        hasMoreSavedListings,
        loadMoreSavedListings,
        refreshNotifications,
        notifications,
        notificationsError,
        notificationsLoading,
        isLoading,
        authRestoreError,
        isAdmin: user?.role === 'admin',
        isConfiguredWithSupabase: isSupabaseConfigured,
        hasPassword,
        login,
        signInWithGoogle,
        sendOtp,
        verifyOtp,
        register,
        resetPassword,
        logout,
        requestPhoneUpdate,
        verifyPhoneUpdate,
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
