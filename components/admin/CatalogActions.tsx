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
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = () => {
    if (isListing) {
      void run(() => setServiceListingActive(id, !isActive));
    } else {
      void run(() => setEmergencyContactActive(id, !isActive));
    }
  };

  const toggleFeatured = () => {
    if (isListing) {
      void run(() => setServiceListingFeatured(id, !row.is_featured));
    }
  };

  const confirmDelete = async () => {
    if (isListing) {
      await run(() => deleteServiceListing(id));
    } else {
      await run(() => deleteEmergencyContact(id));
    }
    if (!deleting) setDeleting(false);
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