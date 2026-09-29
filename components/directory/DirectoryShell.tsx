'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export interface DirectoryCrumb {
  label: string;
  href?: string;
}

export interface DirectoryShellProps {
  title: string;
  /** One-line promise under the title. Kept to a single sentence. */
  subtitle?: string;
  breadcrumbs: DirectoryCrumb[];
  /**
   * The page's single most important action (post a listing, send a request…).
   * Rendered inside the header so it is visible before any scrolling.
   */
  action?: React.ReactNode;
  /** A short trust/benefit line rendered as a compact chip row. */
  highlights?: string[];
  children: React.ReactNode;
}

/**
 * DirectoryShell — the frame for every service/category page.
 *
 * Per the site rule, category and detail pages deliberately do NOT render the
 * global Footer: the page ends with its own content and the fixed mobile
 * bottom navigation (mounted once in the root layout). Marketing pages
 * (home, about, contact) keep their footer.
 *
 * Spacing here is deliberately tight. A directory is a tool, not a landing
 * page: breadcrumb, title, optional action, then straight into search and
 * results. Vertical rhythm is `gap`-driven rather than a stack of `mb-*`, which
 * is what previously left a dead band above the listing grid on mobile.
 */
export default function DirectoryShell({
  title,
  subtitle,
  breadcrumbs,
  action,
  highlights,
  children,
}: DirectoryShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        {/* Breadcrumb — the first thing after the navbar, kept to one line. */}
        <nav
          aria-label="ব্রেডক্রাম্ব"
          className="flex items-center gap-1 text-[11px] text-ink-400 sm:text-xs"
        >
          <Link href="/" className={`shrink-0 transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}>
            হোম
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              <ChevronRight className="h-3 w-3 shrink-0 text-brand-200" aria-hidden="true" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className={`truncate transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-ink-600">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Compact header. `flex-wrap` keeps the action button on the same
            block as the title on phones instead of pushing it far down. */}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5 sm:mt-3">
          <div className="min-w-0 flex-1 basis-64">
            <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl lg:text-[1.75rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {highlights && highlights.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {highlights.map((item) => (
              <li
                key={item}
                className="rounded-md border border-brand-100 bg-white px-2 py-[3px] text-[11px] font-medium text-ink-600"
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        {/* Only 12px between the header block and whatever the page puts next
            (almost always the search bar). */}
        <div className="mt-3">{children}</div>
      </main>
    </div>
  );
}
