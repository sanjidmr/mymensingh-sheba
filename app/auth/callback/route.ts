import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { isSafeInternalPath, resolveAuthRedirect } from '@/lib/auth-routes';
import { isOnboardingComplete } from '@/lib/onboarding';

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

  let role: string | null = null;
  let needsOnboarding = false;
  if (code) {
    const supabase = await createServerSideClient();
    if (supabase) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      const user = data?.user ?? null;
      if (user) {
        // RLS restricts this SELECT to the caller's own row.
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, full_name, phone, primary_area_id, onboarding_completed_at')
          .eq('id', user.id)
          .maybeSingle();
        if (profile && (profile.status ?? 'active') === 'active') {
          role =
            profile.role === 'admin'
              ? 'admin'
              : profile.role === 'news_editor'
                ? 'news_editor'
                : 'customer';
          needsOnboarding =
            role === 'customer' &&
            !isOnboardingComplete({
              fullName: profile.full_name,
              phone: profile.phone,
              primaryAreaId: profile.primary_area_id,
              onboardingCompletedAt: profile.onboarding_completed_at,
            });
        }
      }
    }
  }

  // Password recovery must always land on the reset form, admin or not.
  const destination =
    requested === '/reset-password'
      ? '/reset-password'
      : needsOnboarding
        ? '/onboarding'
      : resolveAuthRedirect(role, requested);

  return NextResponse.redirect(new URL(destination, request.url));
}
