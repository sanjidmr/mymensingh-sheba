'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, House, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SplashScreen from '@/components/site/SplashScreen';
import { useAuth } from '@/lib/auth-context';
import { isOnboardingComplete } from '@/lib/onboarding';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?next=%2Fwelcome');
    } else if (user.role === 'admin') {
      router.replace('/admin');
    } else if (user.role === 'news_editor') {
      router.replace('/news/editor');
    } else if (!isOnboardingComplete(user)) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role === 'admin' || user.role === 'news_editor' || !isOnboardingComplete(user)) {
    return <SplashScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <main data-welcome-shell className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="mms-welcome-card w-full max-w-2xl border border-brand-100 bg-white px-6 py-9 text-center shadow-sm sm:px-12 sm:py-14">
          <span className="mx-auto flex h-14 w-14 items-center justify-center border border-brand-200 bg-brand-50 text-brand-700">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-7 text-xs font-extrabold tracking-[0.14em] text-brand-600">
            নতুন যাত্রার শুরু
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            স্বাগতম, {user.fullName}!
          </h1>
          <div className="mx-auto mt-5 h-1 w-14 bg-red-600" aria-hidden="true" />
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-ink-600 sm:text-base sm:leading-8">
            ময়মনসিংহ সেবায় আপনাকে স্বাগতম। আপনার প্রয়োজনীয় সেবা এখন হাতের নাগালেই।
          </p>

          <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              <House className="h-4 w-4" aria-hidden="true" />
              হোমপেজে যান
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-300 bg-white px-5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              প্রোফাইলে যান
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
