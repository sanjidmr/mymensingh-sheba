'use client';

import { useState, type ChangeEvent } from 'react';
import { setServiceRequestStatus } from '@/app/admin/actions/requests';
import { STATUS_OPTIONS, lookupStatus } from '@/lib/admin/format';
import { isHomeServiceSlug, SERVICE_REQUEST_STATUSES } from '@/lib/admin/service-request-constants';

export default function RequestStatusDropdown({
  requestId,
  serviceSlug,
  initialStatus,
}: {
  requestId: string;
  serviceSlug: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const validService = isHomeServiceSlug(serviceSlug);
  const statusOptions = STATUS_OPTIONS.service_requests.filter((option) =>
    validService && SERVICE_REQUEST_STATUSES.some((value) => value === option.value)
  );
  const currentLabel = lookupStatus(status).label;

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.currentTarget.value;
    if (isSaving || !validService || !SERVICE_REQUEST_STATUSES.some((value) => value === nextStatus)) return;
    const previousStatus = status;
    setStatus(nextStatus);
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await setServiceRequestStatus(requestId, nextStatus);
      if (!result.ok) {
        setStatus(previousStatus);
        setFeedback({ message: result.error, error: true });
      } else {
        setFeedback({ message: result.message ?? 'স্ট্যাটাস সংরক্ষিত হয়েছে।', error: false });
      }
    } catch {
      setStatus(previousStatus);
      setFeedback({ message: 'স্ট্যাটাস সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।', error: true });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <span className="block min-w-36">
      <label className="sr-only" htmlFor={`request-status-${requestId}`}>
        {serviceSlug} রিকোয়েস্টের স্ট্যাটাস
      </label>
      <select
        id={`request-status-${requestId}`}
        value={status}
        onChange={handleChange}
        disabled={!validService || isSaving}
        aria-busy={isSaving}
        className="min-h-10 w-full rounded-md border border-admin-border bg-white px-2.5 text-xs font-semibold text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30 disabled:cursor-wait disabled:opacity-60"
      >
        {!statusOptions.some((option) => option.value === status) && <option value={status}>{currentLabel}</option>}
        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span
        role="status"
        aria-live="polite"
        className={`mt-1 block min-h-4 text-[10px] ${feedback?.error ? 'text-status-danger' : 'text-admin-muted'}`}
      >
        {isSaving ? 'সংরক্ষণ হচ্ছে…' : feedback?.message ?? ''}
      </span>
    </span>
  );
}
