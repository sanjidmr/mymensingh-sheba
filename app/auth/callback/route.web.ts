import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { isSafeInternalPath, resolveAuthRedirect } from '@/lib/auth-routes';
import { isOnboardingComplete } from '@/lib/onboarding';
import { getSiteOrigin } from '@/lib/site-url';

function authFailure(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/login?error=auth', getSiteOrigin(request)));
}

/**
 * OAuth / email-confirmation / password-recovery callback.
 *
 * Exchanges the PKCE code for a session, then resolves the caller's *verified*
 * role from the trusted `profiles` row (never from the email or metadata) and
 * sends them to the right place: admins to the console, customers to their
 * profile. An explicit `next` is honoured only when it is a safe internal path.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const requested = isSafeInternalPath(nextParam) ? nextParam : null;

  if (!code) return authFailure(request);

  const supabase = await createServerSideClient();
  if (!supabase) return authFailure(request);

  let exchangeResult;
  try {
    exchangeResult = await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    console.error('Auth callback code exchange failed:', error);
    return authFailure(request);
  }
  if (exchangeResult.error || !exchangeResult.data.user) {
    console.error('Auth callback code exchange failed:', exchangeResult.error);
    return authFailure(request);
  }

  const user = exchangeResult.data.user;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status, full_name, phone, primary_area_id, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('Auth callback profile lookup failed:', profileError ?? 'Profile row not found');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) console.error('Auth callback session cleanup failed:', signOutError);
    return authFailure(request);
  }
  if ((profile.status ?? 'active') !== 'active') {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) console.error('Auth callback session cleanup failed:', signOutError);
    return authFailure(request);
  }

  const role =
    profile.role === 'admin'
      ? 'admin'
      : profile.role === 'news_editor'
        ? 'news_editor'
        : 'customer';
  const needsOnboarding =
    role === 'customer' &&
    !isOnboardingComplete({
      fullName: profile.full_name,
      phone: profile.phone,
      primaryAreaId: profile.primary_area_id,
      onboardingCompletedAt: profile.onboarding_completed_at,
    });

  // Password recovery must always land on the reset form, admin or not.
  const destination =
    requested === '/reset-password'
      ? '/reset-password'
      : needsOnboarding
        ? '/onboarding'
      : resolveAuthRedirect(role, requested);

  return NextResponse.redirect(new URL(destination, getSiteOrigin(request)));
}
