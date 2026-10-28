/**
 * Role-aware routing helpers — the single source of truth for "where does a
 * signed-in user belong" and for deciding which post-auth path is safe to honour.
 *
 * Security contract: this module only *maps* a role that has ALREADY been
 * verified against the trusted `profiles` row (via the Supabase session client
 * in `lib/auth-context.tsx` / `lib/admin/guard.ts`). It never infers admin-ness
 * from an email, user metadata, a URL parameter or client state.
 */

export type AppRole = 'admin' | 'news_editor' | 'customer';

/** The admin console entry route. */
export const ADMIN_HOME = '/admin';
/** The dedicated news-editor dashboard. */
export const NEWS_EDITOR_HOME = '/news/editor';
/** The customer account/profile entry route (`/profile` redirects to `/dashboard`). */
export const CUSTOMER_HOME = '/profile';

/** True only for the verified `admin` role. */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

/** True only for the verified `news_editor` role. */
export function isNewsEditorRole(role: string | null | undefined): boolean {
  return role === 'news_editor';
}

/** Default landing route for a resolved role. */
export function roleHome(role: string | null | undefined): string {
  if (isAdminRole(role)) return ADMIN_HOME;
  if (isNewsEditorRole(role)) return NEWS_EDITOR_HOME;
  return CUSTOMER_HOME;
}

/**
 * Only same-origin, absolute path targets are allowed. This rejects absolute
 * URLs and protocol-relative targets (`//evil.com`, `/\evil.com`), which keeps
 * the `?redirect=` / `?next=` parameters from becoming an open redirect.
 */
export function isSafeInternalPath(target: string | null | undefined): target is string {
  if (typeof target !== 'string' || target.length === 0) return false;
  if (!target.startsWith('/')) return false;
  // `//host` and `/\host` are treated as protocol-relative by browsers.
  if (target.startsWith('//') || target.startsWith('/\\')) return false;
  return true;
}

const CUSTOMER_AREAS = ['/profile', '/dashboard'] as const;
const ADMIN_AREA = '/admin';

function inArea(path: string, area: string): boolean {
  return path === area || path.startsWith(`${area}/`) || path.startsWith(`${area}?`);
}

/**
 * Decide where to send a user after an auth round-trip (login, registration,
 * session restoration or the OAuth/email callback).
 *
 * - A requested path (`?redirect=` / `?next=`) is honoured only when it is a
 *   safe internal path AND does not contradict the resolved role.
 * - An admin is never sent into the customer profile/dashboard; they land on
 *   `/admin` instead. A customer is never sent into `/admin`.
 * - With no usable request the role's own home is used, so an admin always goes
 *   straight to the console and a customer to their profile.
 */
export function resolveAuthRedirect(
  role: string | null | undefined,
  requested?: string | null
): string {
  const home = roleHome(role);
  if (!isSafeInternalPath(requested)) return home;

  const target = requested;
  if (isAdminRole(role)) {
    // Keep explicit admin targets; never default an admin into the customer area.
    return CUSTOMER_AREAS.some((area) => inArea(target, area)) ? ADMIN_HOME : target;
  }

  if (isNewsEditorRole(role)) {
    const targetIsAdmin = inArea(target, ADMIN_AREA);
    const targetIsCustomer = CUSTOMER_AREAS.some((area) => inArea(target, area));
    return targetIsAdmin || targetIsCustomer ? NEWS_EDITOR_HOME : target;
  }

  // Customer: never allow the admin area as a post-auth destination.
  return inArea(target, ADMIN_AREA) ? CUSTOMER_HOME : target;
}
