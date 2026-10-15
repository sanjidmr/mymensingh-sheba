'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AdminVehicleRequestRow } from '@/lib/admin/queries';
import { setVehicleRequestStatus, updateVehicleRequestManagement } from '@/app/admin/actions/requests';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS } from '@/lib/admin/format';

export default function VehicleRequestActions({
  request,
  vehicles,
}: {
  request: AdminVehicleRequestRow;
  vehicles?: Array<{ id: string; title_bn: string }>;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState(request.status);
  const [assignedVehicle, setAssignedVehicle] = useState(request.assigned_vehicle_listing_id ?? '');
  const [driverName, setDriverName] = useState(request.assigned_driver_name ?? '');
  const [driverPhone, setDriverPhone] = useState(request.assigned_driver_phone ?? '');
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? '');
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

  const saveStatus = async () => {
    const ok = vehicles
      ? await run(() => updateVehicleRequestManagement({
          requestId: request.id,
          status,
          assignedVehicleListingId: assignedVehicle,
          assignedDriverName: driverName,
          assignedDriverPhone: driverPhone,
          adminNotes,
        }))
      : await run(() => setVehicleRequestStatus(request.id, status));
    if (ok) setStatusOpen(false);
  };

  const statusOptions = STATUS_OPTIONS.vehicle_requests;
  const currentStatus = statusOptions.find((o) => o.value === request.status);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
            currentStatus?.tone === 'warning'
              ? 'border-accent-300 bg-accent-100 text-accent-700'
              : currentStatus?.tone === 'info'
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-mist-200 bg-mist-100 text-ink-600'
          )}
        >
          {currentStatus?.label ?? request.status}
        </span>

        <Button
          size="sm"
          variant="secondary"
          leftIcon={<ChevronDown className="h-3.5 w-3.5" />}
          onClick={() => {
            setStatus(request.status)
            setAssignedVehicle(request.assigned_vehicle_listing_id ?? '')
            setDriverName(request.assigned_driver_name ?? '')
            setDriverPhone(request.assigned_driver_phone ?? '')
            setAdminNotes(request.admin_notes ?? '')
            setStatusOpen(true)
          }}
          disabled={busy}
        >
          স্ট্যাটাস
        </Button>

      </div>

      {statusOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setStatusOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink-900/50"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-mist-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-ink-900">রিকোয়েস্ট পরিচালনা</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              “যোগাযোগ নথিভুক্ত” শুধু বাস্তবে যোগাযোগের পর বাছুন। অনুমোদন বা যানবাহন/চালক নির্ধারণ চূড়ান্ত বুকিং বা dispatch নিশ্চিত করে না।
            </p>
            <div className="mt-3">
              <label htmlFor={`vehicle-request-status-${request.id}`} className="mb-1 block text-xs font-semibold text-ink-700">স্ট্যাটাস</label>
              <select
                id={`vehicle-request-status-${request.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-lg border border-mist-200 bg-white px-3 text-sm text-ink-900"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {vehicles && (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor={`vehicle-request-vehicle-${request.id}`} className="mb-1 block text-xs font-semibold text-ink-700">নির্ধারিত যানবাহন (ঐচ্ছিক)</label>
                  <select id={`vehicle-request-vehicle-${request.id}`} value={assignedVehicle} onChange={(event) => setAssignedVehicle(event.target.value)} className="h-11 w-full rounded-lg border border-mist-200 bg-white px-3 text-sm text-ink-900">
                    <option value="">নির্ধারণ করা হয়নি</option>
                    {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.title_bn}</option>)}
                    {assignedVehicle && !vehicles.some((vehicle) => vehicle.id === assignedVehicle) && <option value={assignedVehicle}>বর্তমান যানবাহন (এখন নিষ্ক্রিয়)</option>}
                  </select>
                </div>
                <label className="block text-xs font-semibold text-ink-700">চালকের নাম (ঐচ্ছিক)
                  <input value={driverName} onChange={(event) => setDriverName(event.target.value)} maxLength={120} className="mt-1 h-11 w-full rounded-lg border border-mist-200 px-3 text-sm font-normal" />
                </label>
                <label className="block text-xs font-semibold text-ink-700">চালকের ফোন (ঐচ্ছিক)
                  <input value={driverPhone} onChange={(event) => setDriverPhone(event.target.value)} maxLength={24} inputMode="tel" className="mt-1 h-11 w-full rounded-lg border border-mist-200 px-3 text-sm font-normal" />
                </label>
                <label className="block text-xs font-semibold text-ink-700">শুধু অ্যাডমিনের নোট
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} maxLength={1200} rows={3} className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 text-sm font-normal" />
                </label>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStatusOpen(false)} disabled={busy}>
                বাতিল
              </Button>
              <Button onClick={saveStatus} isLoading={busy} disabled={status === request.status}>সংরক্ষণ</Button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}