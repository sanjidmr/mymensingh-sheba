'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FilePlus2,
  Globe,
  ImagePlus,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { AdminNotice } from '@/components/admin/States';
import AdminNotificationMenu from '@/components/admin/AdminNotificationMenu';
import { useToast } from '@/components/admin/ToastProvider';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, findAdminNavItem, type AdminBadgeKey } from '@/lib/admin/nav';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AdminShellProps {
  children: React.ReactNode;
  badges?: Partial<Record<AdminBadgeKey, number>> & {
    unavailable?: boolean;
    error?: string;
  };
  adminName: string;
}

export default function AdminShell({ children, badges, adminName }: AdminShellProps) {
  const pathname = usePathname();
  const current = findAdminNavItem(pathname);
  const { notify } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const activeGroup = ADMIN_NAV.find((group) =>
    group.items.some((item) => item.href === current?.href)
  )?.title;
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => [
    activeGroup ?? 'Overview',
  ]);

  const [previousPathname, setPreviousPathname] = useState(pathname);
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>('[data-admin-menu][open]').forEach((menu) => {
      menu.open = false;
    });
  }, [pathname]);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured || signingOut) return;
    setSigningOut(true);
    try {
      const client = createClient();
      if (!client) {
        notify('error', 'সাইন আউট করা যায়নি', 'Supabase সংযোগ উপলব্ধ নয়।');
        return;
      }
      const { error } = await client.auth.signOut();
      if (error) {
        notify('error', 'সাইন আউট করা যায়নি', error.message);
        return;
      }
      window.location.assign('/login');
    } catch (error) {
      notify(
        'error',
        'সাইন আউট করা যায়নি',
        error instanceof Error ? error.message : 'অনুরোধটি সম্পন্ন করা যায়নি।'
      );
    } finally {
      setSigningOut(false);
    }
  }, [notify, signingOut]);

  const navigation = (isCollapsed: boolean) => (
    <nav
      className={cn('admin-navigation flex-1 overflow-y-auto overscroll-contain py-4', isCollapsed ? 'px-2' : 'px-3')}
      aria-label="অ্যাডমিন মেনু"
    >
      {ADMIN_NAV.map((group) => {
        return (
          <details
            key={group.title}
            className={cn('mb-3 last:mb-0', isCollapsed && 'admin-nav-collapsed')}
            open={isCollapsed || expandedGroups.includes(group.title)}
          >
            <summary
              onClick={(event) => {
                if (isCollapsed) {
                  event.preventDefault();
                  return;
                }
                event.preventDefault();
                setExpandedGroups((groups) =>
                  groups.includes(group.title)
                    ? groups.filter((title) => title !== group.title)
                    : [...groups, group.title]
                );
              }}
              className={cn(
                'mb-1 list-none select-none rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 [&::-webkit-details-marker]:hidden',
                isCollapsed ? 'cursor-default px-0 text-center' : 'cursor-pointer hover:text-white'
              )}
              title={isCollapsed ? group.title : undefined}
            >
              <span className={isCollapsed ? 'sr-only' : undefined}>{group.title}</span>
              {isCollapsed && <span className="mx-auto block h-px w-8 bg-slate-700" />}
            </summary>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = current?.href === item.href;
                const count = item.badgeKey ? badges?.[item.badgeKey] : undefined;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setExpandedGroups((groups) =>
                          groups.includes(group.title) ? groups : [...groups, group.title]
                        );
                      }}
                      aria-current={active ? 'page' : undefined}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent',
                        isCollapsed && 'justify-center px-0',
                        active
                          ? 'bg-admin-navy-soft text-white shadow-sm'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      <span className={cn('min-w-0 flex-1 truncate', isCollapsed && 'sr-only')}>
                        {item.label}
                      </span>
                      {typeof count === 'number' && count > 0 && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                            isCollapsed && 'sr-only',
                            active ? 'bg-white/15 text-white' : 'bg-rose-500 text-white'
                          )}
                          aria-label={`${count}টি অপেক্ষমাণ`}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                      {isCollapsed && <span className="sr-only">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </nav>
  );

  const renderBrand = (isCollapsed = false, closeDrawer = false) => (
    <div className={cn('flex min-h-[68px] items-center border-b border-white/10 px-4', isCollapsed && 'justify-center px-2')}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-admin-accent text-admin-navy-dark">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      {!isCollapsed && (
        <div className="ml-3 min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">অ্যাডমিন প্যানেল</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">Mymensingh Sheba</p>
        </div>
      )}
      {closeDrawer && (
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="মেনু বন্ধ করুন"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const renderNotifications = () => {
    return <AdminNotificationMenu unreadCount={badges?.notifications ?? 0} unavailable={badges?.unavailable} />;
  };

  const renderProfileMenu = (isCompact = false) => (
    <details className="admin-menu relative" data-admin-menu>
      <summary
        className={cn(
          'flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md text-left text-admin-text hover:bg-admin-page [&::-webkit-details-marker]:hidden',
          isCompact ? 'w-10 justify-center sm:w-auto sm:max-w-56 sm:justify-start sm:px-2' : 'max-w-56 px-2'
        )}
        aria-label={`অ্যাডমিন প্রোফাইল: ${adminName}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-page text-admin-navy">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className={cn('min-w-0 flex-1 truncate text-xs font-semibold', isCompact && 'hidden sm:block')}>
          {adminName}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-admin-muted', isCompact && 'hidden sm:block')}
          aria-hidden="true"
        />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-56 rounded-admin-card border border-admin-border bg-white p-2 shadow-admin-popover">
        <p className="truncate px-3 py-2 text-xs font-semibold text-admin-text">{adminName}</p>
        <Link
          href="/admin/settings"
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          সেটিংস
        </Link>
        <Link
          href="/"
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          ওয়েবসাইট দেখুন
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={!isSupabaseConfigured || signingOut}
          className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold text-status-danger hover:bg-status-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? 'সাইন আউট হচ্ছে…' : 'সাইন আউট'}
        </button>
      </div>
    </details>
  );

  const renderQuickActions = () => (
    <details className="admin-menu relative" data-admin-menu>
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-admin-border bg-white px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page [&::-webkit-details-marker]:hidden">
        <Wrench className="h-4 w-4" aria-hidden="true" />
        দ্রুত কাজ
        <ChevronDown className="h-3.5 w-3.5 text-admin-muted" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-56 rounded-admin-card border border-admin-border bg-white p-2 shadow-admin-popover">
        <Link
          href="/admin/services/new"
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          নতুন সেবা যোগ করুন
        </Link>
        <Link
          href="/admin/hero"
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          ব্যানার পরিচালনা
        </Link>
        <Link
          href="/admin/website"
          className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          ওয়েবসাইট কনটেন্ট
        </Link>
      </div>
    </details>
  );

  return (
    <div
      data-admin-shell
      data-sidebar-collapsed={collapsed}
      className="admin-shell min-h-screen bg-admin-page"
    >
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-admin-navy-dark transition-[width] duration-200 lg:flex',
          'w-[var(--admin-sidebar-width)]'
        )}
      >
        {renderBrand(collapsed)}
        {navigation(collapsed)}
        <div className={cn('border-t border-white/10 px-3 py-3', collapsed && 'px-2')}>
          <p
            className={cn('truncate px-2 pb-2 text-xs font-semibold text-white', collapsed && 'sr-only')}
            title={adminName}
          >
            {adminName}
          </p>
          <Link
            href="/"
            title={collapsed ? 'ওয়েবসাইট দেখুন' : undefined}
            className={cn(
              'flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-medium text-slate-300 hover:bg-white/8 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : undefined}>ওয়েবসাইট দেখুন</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={!isSupabaseConfigured || signingOut}
            title={collapsed ? 'সাইন আউট' : undefined}
            className={cn(
              'flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-medium text-slate-300 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : undefined}>
              {signingOut ? 'সাইন আউট হচ্ছে…' : 'সাইন আউট'}
            </span>
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-admin-navy-dark/55"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-admin-navy-dark shadow-2xl">
            {renderBrand(false, true)}
            {navigation(false)}
            <div className="border-t border-white/10 p-3">
              <p className="truncate px-3 pb-2 text-xs font-semibold text-white">{adminName}</p>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={!isSupabaseConfigured || signingOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-slate-300 hover:bg-white/8 hover:text-white disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {signingOut ? 'সাইন আউট হচ্ছে…' : 'সাইন আউট'}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--admin-sidebar-width)]">
        <header className="sticky top-0 z-20 border-b border-admin-border bg-white/95 backdrop-blur-sm">
          <div className="flex min-h-[64px] items-center gap-2 px-3 sm:px-5 lg:px-7">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-admin-navy hover:bg-admin-page lg:hidden"
              aria-label="মেনু খুলুন"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <nav className="hidden items-center gap-2 text-[11px] text-admin-muted sm:flex" aria-label="Breadcrumb">
                <Link href="/admin" className="hover:text-admin-navy">Overview</Link>
                {current?.href !== '/admin' && current && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span className="truncate">{current.label}</span>
                  </>
                )}
              </nav>
              <p className="truncate text-sm font-bold text-admin-text sm:mt-0.5">
                {current?.label ?? 'অ্যাডমিন প্যানেল'}
              </p>
            </div>

            <label className="hidden h-10 w-full max-w-64 items-center gap-2 rounded-md border border-admin-border bg-admin-page px-3 text-admin-muted md:flex">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                disabled
                aria-label="গ্লোবাল সার্চ"
                placeholder="শিগগিরই গ্লোবাল সার্চ"
                className="w-full bg-transparent text-xs text-admin-text outline-none placeholder:text-admin-muted disabled:cursor-not-allowed"
              />
            </label>

            <div className="hidden items-center gap-2 lg:flex">
              {renderQuickActions()}
              <span className="mx-1 h-7 w-px bg-admin-border" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-admin-muted hover:bg-admin-page hover:text-admin-navy"
                aria-label={collapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার ছোট করুন'}
                aria-expanded={!collapsed}
              >
                {collapsed
                  ? <ChevronsRight className="h-[18px] w-[18px]" aria-hidden="true" />
                  : <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden="true" />}
              </button>
            </div>
            {renderNotifications()}
            {renderProfileMenu(true)}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {badges?.unavailable && (
            <AdminNotice
              tone="warning"
              title="নেভিগেশন কাউন্ট লোড করা যায়নি"
              className="mb-4"
            >
              {badges.error ?? 'ডেটাবেজ থেকে অপেক্ষমাণ কাজের সংখ্যা পাওয়া যায়নি।'}
            </AdminNotice>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
