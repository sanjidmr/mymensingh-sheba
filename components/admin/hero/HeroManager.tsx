'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { AdminHeroSlide } from '@/lib/admin/queries';
import {
  uploadHeroSlide,
  updateHeroSlide,
  replaceHeroImage,
  toggleHeroSlide,
  reorderHeroSlides,
  deleteHeroSlide,
} from '@/app/admin/actions/hero';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { AdminEmpty } from '@/components/admin/States';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

/**
 * The hero carousel manager.
 *
 * Reordering uses explicit up/down buttons rather than drag-and-drop: it works
 * on a touch screen without a pointer, it is reachable by keyboard, and a
 * mis-tap cannot silently move a slide to the wrong place.
 */
export default function HeroManager({ initialSlides }: { initialSlides: AdminHeroSlide[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [slides, setSlides] = useState(initialSlides);
  const [busy, setBusy] = useState(false);

  // Upload form
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [href, setHref] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editHref, setEditHref] = useState('');

  // Replace image
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreview, setReplacePreview] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleting, setDeleting] = useState<AdminHeroSlide | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
      setBusy(true);
      try {
        const result = await fn();
        if (result.ok) {
          notify('success', result.message ?? 'সম্পন্ন হয়েছে');
          router.refresh();
          return true;
        }
        notify('error', 'ব্যর্থ হয়েছে', result.error);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [notify, router]
  );

  // --- upload ---------------------------------------------------------------

  const handleFilePick = (picked: File | null) => {
    setUploadError('');
    if (!picked) {
      setFile(null);
      setFilePreview(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(picked.type)) {
      setUploadError('শুধুমাত্র JPG, PNG, WebP বা AVIF ছবি আপলোড করা যাবে।');
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      setUploadError('ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।');
      return;
    }
    setFile(picked);
    // A local object URL gives an immediate preview without a round trip.
    setFilePreview(URL.createObjectURL(picked));
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('আগে একটি ছবি বেছে নিন।');
      return;
    }
    if (!caption.trim()) {
      setUploadError('স্লাইডের টেক্সট লিখুন।');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.set('image', file);
      formData.set('caption', caption.trim());
      formData.set('altText', altText.trim());
      formData.set('href', href.trim());

      const ok = await run(() => uploadHeroSlide(formData));
      if (ok) {
        setCaption('');
        setAltText('');
        setHref('');
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  // --- reorder --------------------------------------------------------------

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
    void run(() => reorderHeroSlides(next.map((s) => s.id)));
  };

  // --- inline edit ----------------------------------------------------------

  const startEdit = (slide: AdminHeroSlide) => {
    setEditingId(slide.id);
    setEditCaption(slide.caption_bn);
    setEditAlt(slide.alt_text_bn ?? '');
    setEditHref(slide.href ?? '');
  };

  const saveEdit = async (slide: AdminHeroSlide) => {
    const ok = await run(() =>
      updateHeroSlide(slide.id, {
        caption_bn: editCaption,
        alt_text_bn: editAlt,
        href: editHref,
      })
    );
    if (ok) setEditingId(null);
  };

  // --- replace image --------------------------------------------------------

  const handleReplacePick = (picked: File | null) => {
    if (!picked) {
      setReplaceFile(null);
      setReplacePreview(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(picked.type)) {
      notify('error', 'অবৈধ ফাইল', 'শুধুমাত্র JPG, PNG, WebP বা AVIF ছবি আপলোড করা যাবে।');
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      notify('error', 'ফাইল বড়', 'ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।');
      return;
    }
    setReplaceFile(picked);
    setReplacePreview(URL.createObjectURL(picked));
  };

  const confirmReplace = async () => {
    if (!replacingId || !replaceFile) return;
    setReplacing(true);
    try {
      const formData = new FormData();
      formData.set('image', replaceFile);
      const ok = await run(() => replaceHeroImage(replacingId, formData));
      if (ok) {
        setReplacingId(null);
        setReplaceFile(null);
        setReplacePreview(null);
        if (replaceInputRef.current) replaceInputRef.current.value = '';
      }
    } finally {
      setReplacing(false);
    }
  };

  // --- delete ---------------------------------------------------------------

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const ok = await run(() => deleteHeroSlide(deleting.id));
      if (ok) setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ---------- Upload ---------- */}
      <section className="rounded-xl border border-mist-200 bg-white p-4">
        <h2 className="text-sm font-bold text-ink-900">নতুন স্লাইড যোগ করুন</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          নতুন স্লাইড ক্যারোসেলের শেষে যুক্ত হবে এবং সাথে সাথে ওয়েবসাইটে দেখা যাবে।
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          {/* Preview / picker */}
          <div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-mist-200 bg-mist-50">
              {filePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={filePreview} alt="প্রিভিউ" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink-300">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                  <span className="text-[11px]">ছবির প্রিভিউ</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
              className="mt-2 w-full text-xs text-ink-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
              aria-label="ছবি বেছে নিন"
            />
            <p className="mt-1 text-[11px] text-ink-400">JPG, PNG, WebP বা AVIF — সর্বোচ্চ ৫MB</p>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <Textarea
              label="স্লাইডের টেক্সট"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="যেমন: প্রতিদিনের সেবা, এক জায়গায়"
              rows={2}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="বিকল্প টেক্সট (alt)"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="ছবির বর্ণনা"
              />
              <Input
                label="লিংক (ঐচ্ছিক)"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/contact"
              />
            </div>
            {uploadError && (
              <p role="alert" className="text-xs font-medium text-rose-600">
                {uploadError}
              </p>
            )}
            <div className="flex justify-end">
              <Button onClick={handleUpload} isLoading={uploading}>
                স্লাইড যোগ করুন
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Current slides ---------- */}
      <section className="rounded-xl border border-mist-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink-900">বর্তমান স্লাইডসমূহ</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              উপরের তালিকা থেকে নিচে — এটিই ওয়েবসাইটে যে ক্রমে দেখাবে।
            </p>
          </div>
          <span className="rounded-md bg-mist-100 px-2 py-1 text-[11px] font-semibold text-ink-600">
            {slides.length} টি স্লাইড
          </span>
        </div>

        {slides.length === 0 ? (
          <AdminEmpty
            title="কোনো স্লাইড নেই"
            description="ওয়েবসাইট এখন বিল্ট-ইন হিরো ছবি দেখাচ্ছে। নতুন স্লাইড যোগ করলে সেটি ব্যবহার হবে।"
          />
        ) : (
          <ul className="space-y-3">
            {slides.map((slide, index) => (
              <li
                key={slide.id}
                className={cn(
                  'rounded-xl border p-3',
                  slide.is_enabled ? 'border-mist-200 bg-white' : 'border-mist-200 bg-mist-50 opacity-70'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-mist-100 sm:w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.image_url}
                      alt={slide.caption_bn}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-ink-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    {editingId === slide.id ? (
                      <div className="space-y-2">
                        <Textarea
                          label="টেক্সট"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          rows={2}
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Input
                            label="বিকল্প টেক্সট"
                            value={editAlt}
                            onChange={(e) => setEditAlt(e.target.value)}
                          />
                          <Input
                            label="লিংক"
                            value={editHref}
                            onChange={(e) => setEditHref(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(slide)} isLoading={busy}>
                            সংরক্ষণ
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            বাতিল
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-ink-900">{slide.caption_bn}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {slide.alt_text_bn || 'বিকল্প টেক্সট নেই'}
                          {slide.href ? ` · লিংক: ${slide.href}` : ''}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {slide.is_enabled ? 'চালু — ওয়েবসাইটে দেখা যাচ্ছে' : 'বন্ধ — ওয়েবসাইটে দেখা যাচ্ছে না'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== slide.id && (
                    <div className="flex shrink-0 flex-row gap-1.5 sm:flex-col sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || busy}
                        aria-label="উপরে সরান"
                        className="flex h-10 flex-1 items-center justify-center rounded-lg border border-mist-200 text-ink-600 hover:bg-mist-50 disabled:opacity-40 sm:flex-none"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === slides.length - 1 || busy}
                        aria-label="নিচে সরান"
                        className="flex h-10 flex-1 items-center justify-center rounded-lg border border-mist-200 text-ink-600 hover:bg-mist-50 disabled:opacity-40 sm:flex-none"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(slide)}
                        aria-label="সম্পাদনা"
                        className="flex h-10 flex-1 items-center justify-center rounded-lg border border-mist-200 text-ink-600 hover:bg-mist-50 sm:flex-none"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingId(slide.id);
                          setReplaceFile(null);
                          setReplacePreview(null);
                        }}
                        aria-label="ছবি বদলান"
                        className="flex h-10 flex-1 items-center justify-center rounded-lg border border-mist-200 text-ink-600 hover:bg-mist-50 sm:flex-none"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(slide)}
                        aria-label="মুছুন"
                        className="flex h-10 flex-1 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Toggle */}
                {editingId !== slide.id && (
                  <div className="mt-3 border-t border-mist-100 pt-3">
                    <button
                      type="button"
                      onClick={() => run(() => toggleHeroSlide(slide.id))}
                      disabled={busy}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold',
                        slide.is_enabled
                          ? 'border-mist-200 text-ink-600 hover:bg-mist-50'
                          : 'border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          slide.is_enabled ? 'bg-brand-600' : 'bg-ink-300'
                        )}
                        aria-hidden="true"
                      />
                      {slide.is_enabled ? 'চালু আছে — বন্ধ করুন' : 'বন্ধ আছে — চালু করুন'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Replace image dialog ---------- */}
      {replacingId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setReplacingId(null)}
            className="absolute inset-0 h-full w-full bg-ink-900/50"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-mist-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-ink-900">ছবি বদলান</h3>
            <p className="mt-1 text-xs text-ink-500">
              পুরনো ছবিটি স্টোরেজ থেকে মুছে যাবে। টেক্সট ও লিংক অপরিবর্তিত থাকবে।
            </p>

            <div className="mt-4">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-mist-200 bg-mist-50">
                {replacePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={replacePreview} alt="নতুন ছবির প্রিভিউ" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-300">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  </div>
                )}
              </div>
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleReplacePick(e.target.files?.[0] ?? null)}
                className="mt-2 w-full text-xs text-ink-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-800"
                aria-label="নতুন ছবি বেছে নিন"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReplacingId(null)} disabled={replacing}>
                বাতিল
              </Button>
              <Button onClick={confirmReplace} isLoading={replacing} disabled={!replaceFile}>
                ছবি বসান
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete confirmation ---------- */}
      <ConfirmDialog
        open={deleting !== null}
        title="স্লাইডটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-semibold">“{deleting?.caption_bn}”</span> স্লাইডটি স্থায়ীভাবে
            মুছে যাবে। স্টোরেজের ছবিটিও মুছে ফেলা হবে।
          </>
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        isLoading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}