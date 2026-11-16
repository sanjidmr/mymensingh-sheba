'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import type { AdminPostRow } from '@/lib/admin/queries';
import { setPostStatus, deletePost } from '@/app/admin/actions/posts';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

/**
 * Moderation actions for a community post.
 *
 * Approval is the publish switch — every public read path filters on
 * `status = 'approved'`. Rejection requires a reason, which the author can read
 * back from their own profile; "removed" without a reason is not moderation,
 * it is a dead end.
 */
export default function PostActions({ post }: { post: AdminPostRow }) {
  const router = useRouter();
  const { notify } = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result.ok) {
        notify('success', result.message ?? 'সম্পন্ন হয়েছে');
        router.refresh();
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error);
      }
      return result.ok;
    } catch (error) {
      notify(
        'error',
        'কাজটি সম্পন্ন হয়নি',
        error instanceof Error ? error.message : 'আবার চেষ্টা করুন।'
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    const ok = await run(() => setPostStatus(post.id, 'rejected', reason));
    if (ok) {
      setRejecting(false);
      setReason('');
    }
  };

  const confirmDelete = async () => {
    const ok = await run(() => deletePost(post.id));
    if (ok) setDeleting(false);
  };

  return (
    <>
      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
        <Link
          href={`/admin/posts/${post.id}/edit`}
          aria-label="পোস্ট সম্পাদনা"
          title="সম্পাদনা"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-admin-border bg-white text-admin-muted hover:bg-admin-page hover:text-admin-navy"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {post.status === 'approved' && (
          <button
            type="button"
            onClick={() => {
              setReason(post.rejection_reason ?? '');
              setRejecting(true);
            }}
            disabled={busy}
            aria-label="প্রকাশনা প্রত্যাহার"
            title="প্রকাশনা প্রত্যাহার"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setDeleting(true)}
          disabled={busy}
          aria-label="পোস্ট মুছুন"
          title="পোস্ট মুছুন"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ---------- Rejection reason ---------- */}
      {rejecting && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setRejecting(false)}
            disabled={busy}
            className="absolute inset-0 h-full w-full bg-ink-900/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-post-title"
            className="relative w-full max-w-md rounded-2xl border border-mist-200 bg-white p-5 shadow-2xl"
          >
            <h3 id="reject-post-title" className="text-base font-bold text-ink-900">
              {post.status === 'approved' ? 'প্রকাশনা প্রত্যাহারের কারণ' : 'প্রত্যাখ্যানের কারণ'}
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              লেখক কারণটি তার প্রোফাইলে দেখতে পাবেন এবং সংশোধন করে আবার জমা দিতে পারবেন। এই স্কিমায় প্রত্যাখ্যান ও সংশোধন-অনুরোধ আলাদা স্ট্যাটাস নয়; কারণটি স্পষ্ট লিখুন।
            </p>
            <div className="mt-3">
              <Textarea
                label="কারণ"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="যেমন: ছবি অস্পষ্ট, তথ্য অসম্পূর্ণ, বা একই পোস্ট আগেই প্রকাশিত"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
                বাতিল
              </Button>
              <Button
                variant="danger"
                onClick={confirmReject}
                isLoading={busy}
                disabled={reason.trim().length < 5}
              >
                {post.status === 'approved' ? 'প্রত্যাহার করুন' : 'প্রত্যাখ্যান করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete confirmation ---------- */}
      <ConfirmDialog
        open={deleting}
        title="পোস্টটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-semibold">“{post.title_bn}”</span> পোস্টটি স্থায়ীভাবে মুছে
            যাবে। সংযুক্ত সংরক্ষিত (bookmark) রেকর্ডও ডেটাবেজের cascade নিয়মে মুছবে। ফিরিয়ে আনা যাবে না।
          </>
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        isLoading={busy}
        requireText={post.title_bn}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}