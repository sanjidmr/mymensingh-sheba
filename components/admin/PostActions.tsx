'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
import type { AdminPostRow } from '@/lib/admin/queries';
import {
  setPostStatus,
  togglePostFeatured,
  deletePost,
} from '@/app/admin/actions/posts';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

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

  const isPending = post.status === 'pending';

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {isPending && (
          <>
            <Button
              size="sm"
              variant="success"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              onClick={() => run(() => setPostStatus(post.id, 'approved'))}
              disabled={busy}
            >
              অনুমোদন
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => {
                setReason(post.rejection_reason ?? '');
                setRejecting(true);
              }}
              disabled={busy}
            >
              প্রত্যাখ্যান
            </Button>
          </>
        )}

        {post.status === 'approved' && (
          <Button
            size="sm"
            variant={post.is_featured ? 'secondary' : 'ghost'}
            leftIcon={<Star className="h-3.5 w-3.5" />}
            onClick={() => run(() => togglePostFeatured(post.id))}
            disabled={busy}
          >
            {post.is_featured ? 'ফিচার সরান' : 'ফিচার'}
          </Button>
        )}

        <button
          type="button"
          onClick={() => setDeleting(true)}
          aria-label="পোস্ট মুছুন"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* ---------- Rejection reason ---------- */}
      {rejecting && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setRejecting(false)}
            className="absolute inset-0 h-full w-full bg-ink-900/50"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-mist-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-ink-900">প্রত্যাখ্যানের কারণ</h3>
            <p className="mt-1 text-xs text-ink-500">
              লেখক এই কারণটি তার প্রোফাইলে দেখতে পাবেন। অনুগ্রহ করে স্পষ্ট লিখুন।
            </p>
            <div className="mt-3">
              <Textarea
                label="কারণ"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
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
                disabled={!reason.trim()}
              >
                প্রত্যাখ্যান করুন
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
            যাবে। এই কাজটি আর ফেরানো যাবে না।
          </>
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}