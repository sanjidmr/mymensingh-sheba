'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { updateVehicleBookingStatus } from '@/app/admin/actions/requests';
import { useToast } from '@/components/admin/ToastProvider';
import type { AdminVehicleBookingRow } from '@/lib/admin/queries';

const STATUSES = [
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'confirmed', label: 'নিশ্চিত' },
  { value: 'completed', label: 'সম্পন্ন' },
  { value: 'cancelled', label: 'বাতিল' },
] as const;

export default function VehicleBookingStatus({ booking }: { booking: AdminVehicleBookingRow }) {
  const router = useRouter();
  const { notify } = useToast();
  const [status, setStatus] = useState(booking.status);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy || status === booking.status) return;
    setBusy(true);
    try {
      const result = await updateVehicleBookingStatus(booking.id, booking.service_type, status);
      if (!result.ok) {
        notify('error', 'অবস্থা আপডেট হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'বুকিংয়ের অবস্থা আপডেট হয়েছে।');
      router.refresh();
    } catch {
      notify('error', 'অবস্থা আপডেট হয়নি', 'সার্ভারের সঙ্গে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-40 items-center gap-2">
      <select
        aria-label="বুকিংয়ের অবস্থা"
        value={status}
        onChange={(event) => setStatus(event.target.value as AdminVehicleBookingRow['status'])}
        className="h-10 min-w-28 rounded-md border border-admin-border bg-white px-2 text-xs font-semibold text-admin-text"
      >
        {STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={busy || status === booking.status}
        aria-label="অবস্থা সংরক্ষণ"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-admin-border bg-white text-admin-navy hover:bg-admin-page disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
