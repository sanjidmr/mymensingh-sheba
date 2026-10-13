'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Star, Trash2 } from 'lucide-react';
import {
  setServiceListingActive,
  setServiceListingFeatured,
  deleteServiceListing,
  setEmergencyContactActive,
  setEmergencyContactOrder,
  deleteEmergencyContact,
} from '@/app/admin/actions/catalog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';

/**
 * Actions for catalog rows.
 *
 * The same component serves both `service_listings` and `emergency_contacts`
 * because the actions are identical in shape: toggle active, and delete. The
 * row's `category`/`service` field tells us which table it belongs to.
 */
export default function CatalogActions({ row }: { row: any }) {
  const router = useRouter();
  const { notify } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmingActive, setConfirmingActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sortOrder, setSortOrder] = useState(String(row.sort_order ?? 0));

  const isListing = 'category' in row;
  const id = row.id as string;
  const isActive = Boolean(row.is_active);

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
      return result;
    } catch (error) {
      notify('error', 'কাজটি সম্পন্ন হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
      return { ok: false, error: 'কাজটি সম্পন্ন হয়নি।' };
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = () => {
    if (isListing) {
      void run(() => setServiceListingActive(id, !isActive));
    } else {
      setConfirmingActive(true);
    }
  };

  const confirmActiveChange = async () => {
    const result = await run(() => setEmergencyContactActive(id, !isActive));
    if (result.ok) setConfirmingActive(false);
  };

  const toggleFeatured = () => {
    if (isListing) {
      void run(() => setServiceListingFeatured(id, !row.is_featured));
    }
  };

  const confirmDelete = async () => {
    const result = isListing
      ? await run(() => deleteServiceListing(id))
      : await run(() => deleteEmergencyContact(id));
    if (result.ok) setDeleting(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {!isListing && (
          <div className="flex items-center gap-1">
            <label htmlFor={`contact-order-${id}`} className="sr-only">তালিকায় ক্রম</label>
            <input
              id={`contact-order-${id}`}
              type="number"
              min={0}
              max={9999}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-9 w-16 rounded-lg border border-brand-100 px-2 text-xs"
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label="ক্রম সংরক্ষণ"
              disabled={busy || !/^\d{1,4}$/.test(sortOrder)}
              onClick={() => void run(() => setEmergencyContactOrder(id, Number(sortOrder)))}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant={isActive ? 'secondary' : 'success'}
          onClick={toggleActive}
          disabled={busy}
        >
          {isActive ? 'বন্ধ করুন' : 'চালু করুন'}
        </Button>

        {isListing && (
          <Button
            size="sm"
            variant={row.is_featured ? 'secondary' : 'ghost'}
            leftIcon={<Star className="h-3.5 w-3.5" />}
            onClick={toggleFeatured}
            disabled={busy}
          >
            {row.is_featured ? 'ফিচার সরান' : 'ফিচার'}
          </Button>
        )}

        <button
          type="button"
          onClick={() => setDeleting(true)}
          aria-label="মুছুন"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmingActive}
        title={isActive ? 'জরুরি যোগাযোগটি বন্ধ করবেন?' : 'জরুরি যোগাযোগটি চালু করবেন?'}
        description={isActive
          ? 'এটি পাবলিক জরুরি ডিরেক্টরি থেকে সরানো হবে।'
          : 'এটি পাবলিক ডিরেক্টরিতে প্রকাশিত হবে। চালু করার আগে নম্বর ও তথ্যসূত্র যাচাই করুন।'}
        confirmLabel={isActive ? 'হ্যাঁ, বন্ধ করুন' : 'হ্যাঁ, চালু করুন'}
        tone={isActive ? 'danger' : 'primary'}
        isLoading={busy}
        onConfirm={() => void confirmActiveChange()}
        onCancel={() => setConfirmingActive(false)}
      />
      <ConfirmDialog
        open={deleting}
        title={isListing ? 'তালিকাটি মুছে ফেলবেন?' : 'নম্বরটি মুছে ফেলবেন?'}
        description={
          < >
            এই {isListing ? 'তালিকা' : 'নম্বর'}টি স্থায়ীভাবে মুছে যাবে। এই কাজটি আর
            ফেরানো যাবে না।
          </ >
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}