'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { ToletListingForm } from '@/components/tolet/ToletListingForm';
import { useAuth } from '@/lib/auth-context';
import { createListing, uploadListingPhotos } from '@/lib/tolet-service';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { ToletListingInput } from '@/lib/tolet-types';

export default function AdminCreateToletListingPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [error, setError] = useState('');
  const createdId = useRef('');

  if (isLoading) {
    return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-admin-muted"><Loader2 className="h-4 w-4 animate-spin" />লোড হচ্ছে...</div>;
  }
  if (!isAdmin || !user) {
    return <div role="alert" className="rounded-admin-card border border-status-danger/20 bg-status-danger-bg p-4 text-sm text-status-danger">অ্যাডমিন অনুমতি যাচাই করা যায়নি।</div>;
  }

  const handleUpload = async (file: File) => {
    if (!isSupabaseConfigured) throw new Error('Supabase সংযুক্ত নেই; ছবি আপলোড করা যায়নি।');
    const result = await uploadListingPhotos(user.id, [file], 'admin-created');
    if (!result.success || !result.urls?.[0]) throw new Error(result.error || 'ছবি আপলোড ব্যর্থ হয়েছে।');
    return result.urls[0];
  };

  const handleSubmit = async (input: ToletListingInput, draft: boolean) => {
    setError('');
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase সংযুক্ত নেই; নমুনা ডেটায় অ্যাডমিন বিজ্ঞাপন তৈরি করা হবে না।' };
    const result = await createListing(user.id, user.fullName || 'অ্যাডমিন', false, input, draft ? 'draft' : 'submit');
    if (result.success && result.listing) createdId.current = result.listing.id;
    else setError(result.error || 'বিজ্ঞাপন তৈরি করা যায়নি।');
    return { success: result.success, error: result.error };
  };

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admin/tolet" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-admin-muted hover:text-admin-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />To-Let তালিকায় ফিরুন
      </Link>
      <h1 className="text-xl font-bold text-admin-text sm:text-2xl">নতুন To-Let বিজ্ঞাপন</h1>
      <p className="mb-5 mt-1 text-sm leading-relaxed text-admin-muted">
        এই বিজ্ঞাপনটি অ্যাডমিন অ্যাকাউন্টের মালিকানায় থাকবে; কোনো গ্রাহককে মালিক হিসেবে দেখানো হবে না।
      </p>
      {error && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-status-danger/20 bg-status-danger-bg p-3 text-sm text-status-danger"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
      <ToletListingForm
        mode="admin"
        onUploadFile={handleUpload}
        onSubmit={handleSubmit}
        onDone={() => router.replace(createdId.current ? `/admin/tolet/${createdId.current}` : '/admin/tolet')}
      />
    </section>
  );
}
