'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  LogOut,
  Menu,
  ExternalLink,
  X,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { ADMIN_NAV, findAdminNavItem, type AdminBadgeKey } from '@/lib/admin/nav';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export interface AdminShellProps {
  children: React.ReactNode;
  /** Live counts keyed by nav `badgeKey`. Omitted keys simply render no pill. */
  badges?: Partial<Record<AdminBadgeKey, number>>;
  /** Displayed in the sidebar footer. */
  adminName: string;
}

/**
 * The admin console chrome: a fixed sidebar on desktop, a slide-in drawer plus a
 * sticky top bar on small screens.
 *
 * Notes on the two things that are easy to get wrong here:
 *
 *  * The public `<Navbar />`, `<Footer />` and `<MobileBottomNav />` are all
 *    absent from every admin screen. The admin panel is a separate console,
 *    not the public site with an extra header. `MobileBottomNav` already
 *    excludes `/admin`, and `globals.css` drops the reserved bottom padding
 *    inside the shell via the `[data-admin-shell]` marker.
 *  * The drawer closes on navigation and on Escape, locks the page behind it
 *    while open, and every link is a full-height touch target, so the panel is
 *    usable one-handed.
 */
export default function AdminShell({ children, badges, adminName }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const current = findAdminNavItem(pathname);

  // Close the drawer whenever the route changes, otherwise it stays open over
  // the page the user just asked for. Adjust state during render (React's
  // recommended pattern) rather than in an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setSigningOut(true);
    try {
      const client = createClient();
      await client?.auth.signOut();
      // Full navigation, not a router push: the admin layout is a Server
      // Component whose result must be re-fetched after the cookie changes.
      window.location.href = '/login';
    } finally {
      setSigningOut(false);
    }
  }, []);

  const nav = (
    <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="অ্যাডমিন মেনু">
      {ADMIN_NAV.map((group) => (
        <div key={group.title} className="mb-5 last:mb-0">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = current?.href === item.href;
              const count = item.badgeKey ? badges?.[item.badgeKey] : undefined;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-700 text-white'
                        : 'text-ink-600 hover:bg-brand-50 hover:text-brand-800'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {typeof count === 'number' && count > 0 && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                          active ? 'bg-white/20 text-white' : 'bg-rose-600 text-white'
                        )}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-brand-800/60 px-3 py-3">
      <p className="px-3 pb-2 text-sm font-semibold text-white truncate" title={adminName}>
        {adminName}
      </p>
      <div className="space-y-0.5">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-100 hover:bg-brand-800"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          ওয়েবসাইট দেখুন
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-100 hover:bg-brand-800 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {signingOut ? 'সাইন আউট হচ্ছে…' : 'সাইন আউট'}
        </button>
      </div>
    </div>
  );

  const renderNotificationLink = (onDark = false) => (
    <Link
      href="/admin/notifications"
      className={cn(
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
        onDark
          ? 'text-brand-100 hover:bg-brand-800'
          : 'text-ink-500 hover:bg-mist-100 hover:text-brand-700'
      )}
      aria-label={
        badges?.notifications
          ? `নোটিফিকেশন, ${badges.notifications}টি অপঠিত`
          : 'নোটিফিকেশন'
      }
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {!!badges?.notifications && (
        <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
          {badges.notifications > 99 ? '99+' : badges.notifications}
        </span>
      )}
    </Link>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-brand-800/60 px-5 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 text-brand-900">
        <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-white">অ্যাডমিন কন্ট্রোল</p>
        <p className="truncate text-[11px] leading-tight text-brand-200">Mymensingh Sheba</p>
      </div>
      <button
        type="button"
        onClick={() => setDrawerOpen(false)}
        className="ml-auto rounded-lg p-2 text-brand-100 hover:bg-brand-800 lg:hidden"
        aria-label="মেনু বন্ধ করুন"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div data-admin-shell className="min-h-screen bg-mist-50">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-900 lg:flex">
        {brand}
        {nav}
        {sidebarFooter}
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink-900/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col bg-brand-900 shadow-2xl">
            {brand}
            {nav}
            {sidebarFooter}
          </div>
        </div>
      )}

      {/* ---------- Mobile top bar ---------- */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-mist-200 bg-brand-900 px-3 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white hover:bg-brand-800"
          aria-label="মেনু খুলুন"
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-white">
            {current?.label ?? 'অ্যাডমিন কন্ট্রোল'}
          </p>
          <p className="truncate text-[11px] leading-tight text-brand-200">Mymensingh Sheba</p>
        </div>
        {renderNotificationLink(true)}
        <Link
          href="/admin"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand-100 hover:bg-brand-800"
          aria-label="ড্যাশবোর্ডে ফিরে যান"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Link>
      </header>

      {/* ---------- Content ---------- */}
      <main className="lg:pl-64">
        <div className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-mist-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:flex">
          <div className="mx-auto flex w-full max-w-6xl justify-end">
            <div className="rounded-lg text-ink-600 hover:bg-mist-50 hover:text-brand-700">
              {renderNotificationLink()}
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}