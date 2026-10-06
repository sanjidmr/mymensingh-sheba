'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { AdminMediaItem } from '@/lib/admin/queries'
import { deleteMedia } from '@/app/admin/actions/media'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/ToastProvider'

export default function MediaActions({ item }: { item: AdminMediaItem }) {
  const router = useRouter()
  const { notify } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const canDelete = item.bucket_id === 'site'

  const confirmDelete = async () => {
    setBusy(true)
    try {
      const result = await deleteMedia(item.bucket_id, item.name)
      if (result.ok) {
        notify('success', result.message ?? 'মুছে ফেলা হয়েছে')
        router.refresh()
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error)
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
        disabled={!canDelete}
        aria-label={canDelete ? 'ফাইল মুছুন' : 'এই ফাইল মুছে ফেলা যাবে না'}
        title={
          canDelete
            ? 'ফাইল মুছুন'
            : 'শুধুমাত্র অ্যাডমিন আপলোড করা ফাইল মুছে ফেলা যাবে'
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-mist-200 disabled:text-ink-300 disabled:hover:bg-transparent"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={deleting}
        title="ফাইলটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-mono text-xs">{item.name}</span> ফাইলটি স্টোরেজ থেকে
            স্থায়ীভাবে মুছে যাবে। ওয়েবসাইটে এই ফাইলটি ব্যবহার করলে সেখানে ভাঙা ছবি
            দেখাতে পারে。
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