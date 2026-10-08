import type { UserProfile } from './supabase/types';

/**
 * ⚠️ DEVELOPMENT-ONLY AUTH BYPASS — NOT FOR PRODUCTION.
 *
 * Lets `/profile` and `/admin` open without an authenticated Supabase session
 * so they can be built and tested locally. Everything is deliberately isolated
 * in this one module (plus `lib/admin/dev-service-role.ts`) so the whole bypass
 * can be removed in one step.
 *
 * ── HOW TO REMOVE IT ──────────────────────────────────────────────────────
 *   1. Delete this file and `lib/admin/dev-service-role.ts`.
 *   2. Revert the three call sites (they all carry a `DEV AUTH BYPASS` comment):
 *        - `lib/admin/guard.ts`          (getAdminSession)
 *        - `lib/admin/queries.ts`        (getAdminDataClient)
 *        - `app/profile/layout.tsx`      (redirect gate)
 *        - `app/profile/page.tsx`        (login-required screen)
 *
 * ── SAFETY ────────────────────────────────────────────────────────────────
 *   • `DEV_AUTH_BYPASS` is hard-gated on `NODE_ENV !== 'production'`, so a
 *     production build (`next build`) can never activate it.
 *   • Set `NEXT_PUBLIC_DEV_AUTH_BYPASS=0` in `.env.local` to switch it off in
 *     development as well, without touching any code.
 *   • It never changes Supabase Auth, RLS, sign-in, sign-up or reset-password.
 *   • The service-role key is only read in `lib/admin/dev-service-role.ts`,
 *     which is imported exclusively by server code and is never sent to the
 *     browser.
 */

/** `true` only in development (and only when not explicitly disabled). */
export const DEV_AUTH_BYPASS: boolean =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== '0';

/** Placeholder admin identity, used when no real admin row can be found. */
export const DEV_ADMIN_SESSION = {
  userId: 'dev-bypass-admin',
  email: 'dev-bypass@localhost',
  fullName: 'ডেভ অ্যাডমিন',
};

/**
 * Stand-in customer rendered by `/profile` while bypassing, so the real page
 * UI renders instead of the "লগইন প্রয়োজন" screen.
 */
export const DEV_PROFILE_USER: UserProfile = {
  id: 'dev-bypass-user',
  fullName: 'ডেভ ব্যবহারকারী',
  phone: '01700000000',
  email: 'dev-bypass@localhost',
  primaryAreaId: 'charpara',
  role: 'admin',
  status: 'active',
  isVerified: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};