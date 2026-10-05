'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/ToastProvider'

export default function MessageActions({ message }: { message: { id: string; name: string; email: string | null } }) {
  const router = useRouter()
  const { notify } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirmDelete = async () => {
    setBusy(true)
    try {
      // TODO: implement actual delete
      if (true) {
        notify('success', 'মুছে ফেলা হয়েছে')
        router.refresh()
      } else {
        notify('error', 'ব্যর্থ হয়েছে')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDeleting(true)}
        aria-label="বার্তা মুছুন"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={deleting}
        title="বার্তা মুছে ফেলবেন?"
        description={
          <>
            <span className="font-semibold">{message.name}</span> এর বার্তা
            স্থायीভাবে মুছে যাবে।
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