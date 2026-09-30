'use client';

/**
 * The "add a listing" action on a curated directory header.
 *
 * Curated categories are admin-owned, so the control is only rendered for an
 * admin — a logged-out or ordinary reader never sees a dead "add" button. The
 * database enforces the same rule via RLS; this is just so the page does not
 * advertise an action the reader cannot perform.
 */
import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export default function AdminListingLink({
  category,
  label = 'যোগ করুন',
}: {
  category: string;
  label?: string;
}) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  return (
    <Link
      href={`/admin/catalog?category=${category}`}
      className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[13px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50 ${LIGHT_FOCUS}`}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
