import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isOnboardingComplete } from '@/lib/onboarding';

const AUTH_PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]);

const EMERGENCY_PUBLIC_PATHS = new Set([
  '/emergency-call',
  '/ambulance',
  '/police',
  '/fire-service',
  '/fireservice',
]);

const PUBLIC_API_PATHS = new Set([
  '/api/site-content',
  '/api/vehicle-route',
  '/api/tolet/events',
]);

const AUTH_REQUIRED_PAGE_PATHS = [
  '/admin',
  '/dashboard',
  '/profile',
  '/onboarding',
  '/welcome',
];

const ROUTE_AUTHENTICATED_API_PATHS = new Set([
  '/api/admin-email-alerts/worker',
  '/api/admin-email-alerts/webhook',
]);

function isPublicPage(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (AUTH_PUBLIC_PATHS.has(normalizedPath) || EMERGENCY_PUBLIC_PATHS.has(normalizedPath)) {
    return true;
  }
  return !AUTH_REQUIRED_PAGE_PATHS.some(
    (path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`)
  );
}

function copyAuthCookies(
  response: NextResponse,
  cookies: ReturnType<NextResponse['cookies']['getAll']>
): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  cookies.forEach((cookie) => response.cookies.set(cookie));
  return response;
}

function loginRequiredResponse(
  request: NextRequest,
  isApiRequest: boolean,
  cookiesToCopy: ReturnType<NextResponse['cookies']['getAll']> = []
): NextResponse {
  const response = isApiRequest
    ? NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    : (() => {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.search = '';
        loginUrl.searchParams.set(
          'next',
          `${request.nextUrl.pathname}${request.nextUrl.search}`
        );
        return NextResponse.redirect(loginUrl);
      })();

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return copyAuthCookies(response, cookiesToCopy);
}

/**
 * Refreshes Supabase sessions. Public content is available to guests; account,
 * admin and private API routes still require an authenticated session.
 *
 * Why this file exists at all: `@supabase/ssr` stores the session in cookies,
 * and a cookie is only refreshed when the browser sends it along and the
 * response is allowed to write back a new one. Without a middleware that calls
 * `getUser()`, the access token in the cookie silently expires and every
 * server-side `createServerSideClient()` call afterwards sees "no user" even
 * though the person is still signed in on the client.
 *
 * Admin authorization remains in `app/admin/layout.tsx`; this middleware only
 * verifies that a user is signed in before allowing private pages to render.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';
  const isRouteAuthenticatedApi = ROUTE_AUTHENTICATED_API_PATHS.has(pathname);
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
  const isPublic = isApiRequest
    ? PUBLIC_API_PATHS.has(pathname) ||
      EMERGENCY_PUBLIC_PATHS.has(pathname) ||
      isRouteAuthenticatedApi
    : isPublicPage(pathname);

  const createResponse = () => {
    const nextResponse = NextResponse.next({
      request: { headers: request.headers },
    });
    if (!isPublic || isRouteAuthenticatedApi) {
      nextResponse.headers.set('Cache-Control', 'private, no-store, max-age=0');
    }
    return nextResponse;
  };
  let response = createResponse();

  if (!url || !anonKey) {
    return isPublic
      ? response
      : loginRequiredResponse(request, isApiRequest);
  }

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  if (!hasSupabaseSessionCookie) {
    return isPublic
      ? response
      : loginRequiredResponse(request, isApiRequest);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mirror the refreshed cookies onto the request so this same render
        // already sees the new session…
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // …and onto the response so the browser keeps it.
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPublic && !user) {
    return loginRequiredResponse(request, isApiRequest, response.cookies.getAll());
  }

  if (!isPublic && user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, full_name, phone, primary_area_id, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      const errorResponse = isApiRequest
        ? NextResponse.json({ error: 'Profile verification failed' }, { status: 503 })
        : new NextResponse('প্রোফাইল যাচাই করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।', {
            status: 503,
            headers: { 'Cache-Control': 'private, no-store, max-age=0' },
          });
      return copyAuthCookies(errorResponse, response.cookies.getAll());
    }
    if (!profile) {
      const errorResponse = isApiRequest
        ? NextResponse.json({ error: 'Profile not found' }, { status: 503 })
        : new NextResponse('আপনার প্রোফাইল তৈরি হয়নি। সহায়তার জন্য যোগাযোগ করুন।', {
            status: 503,
            headers: { 'Cache-Control': 'private, no-store, max-age=0' },
          });
      return copyAuthCookies(errorResponse, response.cookies.getAll());
    }

    const isOnboardingPath = pathname === '/onboarding';
    const isWelcomePath = pathname === '/welcome';
    const isAdmin = profile.role === 'admin';
    const onboardingComplete = isOnboardingComplete({
      fullName: profile.full_name,
      phone: profile.phone,
      primaryAreaId: profile.primary_area_id,
      onboardingCompletedAt: profile.onboarding_completed_at,
    });

    if (isAdmin && (isOnboardingPath || isWelcomePath)) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      adminUrl.search = '';
      return copyAuthCookies(NextResponse.redirect(adminUrl), response.cookies.getAll());
    }

    if (!isAdmin && !onboardingComplete && !isOnboardingPath) {
      if (isApiRequest) {
        return copyAuthCookies(
          NextResponse.json({ error: 'Profile setup required' }, { status: 403 }),
          response.cookies.getAll()
        );
      }
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      onboardingUrl.search = '';
      return copyAuthCookies(NextResponse.redirect(onboardingUrl), response.cookies.getAll());
    }

    if (!isAdmin && onboardingComplete && isOnboardingPath) {
      const welcomeUrl = request.nextUrl.clone();
      welcomeUrl.pathname = '/welcome';
      welcomeUrl.search = '';
      return copyAuthCookies(NextResponse.redirect(welcomeUrl), response.cookies.getAll());
    }

    if (!isAdmin && !onboardingComplete && isWelcomePath) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      onboardingUrl.search = '';
      return copyAuthCookies(NextResponse.redirect(onboardingUrl), response.cookies.getAll());
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own build output and static files. Static
     * assets cannot influence authorisation, and skipping them keeps this off
     * the hot path for images and fonts.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)$).*)',
  ],
};