'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import type { AdminToletRequestRow } from '@/lib/admin/queries'
import {
  setToletRequestStatus,
  deleteToletRequest,
} from '@/app/admin/actions/requests'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/ToastProvider'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS } from '@/lib/admin/format'

export default function ToletRequestActions({ request }: { request: AdminToletRequestRow }) {
  const router = useRouter()
  const { notify } = useToast()
  const [statusOpen, setStatusOpen] = useState(false)
  const [status, setStatus] = useState(request.status)
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
    const ok = await run(() => setToletRequestStatus(request.id, status))
    if (ok) setStatusOpen(false)
  }

  const confirmDelete = async () => {
    const ok = await run(() => deleteToletRequest(request.id))
    if (ok) setDeleting(false)
  }

  const statusOptions = STATUS_OPTIONS.tolet_requests
  const currentStatus = statusOptions.find((o) => o.value === request.status)

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
            setStatusOpen(true)
          }}
          disabled={busy}
        >
          স্ট্যাটাস
        </Button>

        <button
          type="button"
          onClick={() => setDeleting(true)}
          aria-label="অনুসন্ধান মুছুন"
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
            <div className="mt-3">
              <label htmlFor="tolet-request-status" className="mb-1 block text-xs font-semibold text-ink-700">স্ট্যাটাস</label>
              <select
                id="tolet-request-status"
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
        title="অনুসন্ধানটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-semibold">{request.customer_name}</span> এর অনুসন্ধানটি
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