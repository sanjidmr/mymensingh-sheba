'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import type { AdminRequestRow } from '@/lib/admin/queries'
import {
  setServiceRequestStatus,
  deleteServiceRequest,
} from '@/app/admin/actions/requests'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS } from '@/lib/admin/format'

export default function RequestActions({ request }: { request: AdminRequestRow }) {
  const router = useRouter()
  const { notify } = useToast()
  const [statusOpen, setStatusOpen] = useState(false)
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.admin_notes ?? '')
  const [quotation, setQuotation] = useState(request.quotation ?? '')
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setBusy(true)
    try {
      const result = await fn()
      if (result.ok) {
        notify('success', result.message ?? 'সম্পন্ন হয়েছে')
        router.refresh()
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error)
      }
      return result.ok
    } finally {
      setBusy(false)
    }
  }

  const saveStatus = async () => {
    const ok = await run(() => setServiceRequestStatus(request.id, status, quotation, notes))
    if (ok) setStatusOpen(false)
  }

  const confirmDelete = async () => {
    const ok = await run(() => deleteServiceRequest(request.id))
    if (ok) setDeleting(false)
  }

  const statusOptions = STATUS_OPTIONS.service_requests
  const currentStatus = statusOptions.find((o) => o.value === request.status)

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
            currentStatus?.tone === 'success'
              ? 'border-brand-200 bg-brand-50 text-brand-800'
              : currentStatus?.tone === 'warning'
                ? 'border-accent-300 bg-accent-100 text-accent-700'
                : currentStatus?.tone === 'danger'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
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
            setNotes(request.admin_notes ?? '')
            setQuotation(request.quotation ?? '')
            setStatusOpen(true)
          }}
          disabled={busy}
        >
          স্ট্যাটাস
        </Button>

        <button
          type="button"
          onClick={() => setDeleting(true)}
          aria-label="রিকোয়েস্ট মুছুন"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
            <h3 className="text-base font-bold text-ink-900">স্ট্যাটাস পরিবর্তন</h3>
            <p className="mt-1 text-xs text-ink-500">রিকোয়েস্টের স্ট্যাটাস পরিবর্তন করুন। গ্রামকও এই স্ট্যাটাস দেখতে পাবেন。</p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="request-status" className="mb-1 block text-xs font-semibold text-ink-700">স্ট্যাটাস</label>
                <select
                  id="request-status"
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

              <Textarea
                label="কোটেশন (ঐচ্ছিক)"
                value={quotation}
                onChange={(e) => setQuotation(e.target.value)}
                rows={2}
                placeholder="যেমন: ৫০০ টায়া"
              />

              <Textarea
                label="অভ্যন্তরীণ নোট"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="শুধুমাত্র অ্যাডমিনরা দেখবেন"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStatusOpen(false)} disabled={busy}>
                বাতিল
              </Button>
              <Button onClick={saveStatus} isLoading={busy}>সংরক্ষণ</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting}
        title="রিকোয়েস্টটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-semibold">{request.contact_name}</span> এর রিকোয়েস্টটি
            স্থায়ীভাবে মুছে যাবে।
          </>
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </>
  )
}