'use client';

/**
 * Create / edit form for a user-authored post (news, job, buy-sell).
 *
 * One form serves all three kinds. The fields a reader must fill genuinely
 * differ per kind — a job needs a salary band, a marketplace item needs a price
 * and a condition — so the form reveals the relevant fields rather than showing
 * every field and leaving the reader to work out which apply. That is also what
 * keeps the submitted row clean.
 *
 * Validation is done here rather than by the database alone, because the error
 * has to be shown against the field the reader got wrong.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trash2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import {
  createCommunityPost,
  currentUserId,
  deleteCommunityPost,
  updateCommunityPost,
  uploadPostImage,
} from '@/lib/catalog-service';
import { getAllMCCAreas } from '@/lib/locations';
import { normalizeBdPhone } from '@/lib/contact-types';
import {
  JOB_EDUCATION,
  JOB_EXPERIENCE,
  JOB_TYPES,
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  NEWS_CATEGORIES,
  tagLabels,
  uniqueSlug,
  type CommunityPost,
  type PostKind,
} from '@/lib/catalog-types';

const KIND_META: Record<PostKind, { title: string; noun: string }> = {
  news: { title: 'সংবাদ পোস্ট', noun: 'সংবাদ' },
  job: { title: 'চাকরির খবর', noun: 'চাকরি' },
  buy_sell: { title: 'বিক্রয়ের পোস্ট', noun: 'পণ্য' },
};

/** Public route for each post kind — `news` and `job` are not the same string. */
export const KIND_ROUTE: Record<PostKind, string> = {
  news: '/news',
  job: '/jobs',
  buy_sell: '/buy-sell',
};

interface FormValues {
  title: string;
  summary: string;
  body: string;
  category: string;
  areaId: string;
  price: string;
  salaryMin: string;
  salaryMax: string;
  jobType: string;
  education: string;
  experience: string;
  deadline: string;
  condition: string;
  phone: string;
}

const EMPTY: FormValues = {
  title: '',
  summary: '',
  body: '',
  category: '',
  areaId: '',
  price: '',
  salaryMin: '',
  salaryMax: '',
  jobType: '',
  education: '',
  experience: '',
  deadline: '',
  condition: '',
  phone: '',
};

type Errors = Partial<Record<keyof FormValues, string>>;

export default function PostForm({
  kind,
  editing,
}: {
  kind: PostKind;
  /** Present when editing an existing post of this kind. */
  editing?: CommunityPost;
}) {
  const router = useRouter();
  const { user, isConfiguredWithSupabase } = useAuth();
  const meta = KIND_META[kind];
  const fileRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);

  // Seed the form once when editing. `editing.id` is the key so re-saving does
  // not clobber what the reader is currently typing.
  useEffect(() => {
    if (!editing) return;
    setValues({
      title: editing.titleBn,
      summary: editing.summaryBn ?? '',
      body: editing.bodyBn ?? '',
      category: editing.category ?? '',
      areaId: editing.areaId ?? '',
      price: editing.price != null ? String(editing.price) : '',
      salaryMin: editing.salaryMin != null ? String(editing.salaryMin) : '',
      salaryMax: editing.salaryMax != null ? String(editing.salaryMax) : '',
      jobType: editing.jobType ?? '',
      education: '',
      experience: '',
      deadline: editing.deadline ?? '',
      condition: editing.conditionLabel ?? '',
      phone: '',
    });
    setTags(editing.tags ?? []);
    setImagePreview(editing.coverImageUrl ?? '');
  }, [editing]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const phoneRequired = !editing && !user;

  function validate(): Errors {
    const next: Errors = {};
    const title = values.title.trim();
    if (title.length < 8) next.title = 'শিরোনাম কমপক্ষে ৮ অক্ষরের হতে হবে।';

    if (values.summary.trim().length > 0 && values.summary.trim().length < 20) {
      next.summary = 'সংক্ষিপ্ত বিবরণ কমপক্ষে ২০ অক্ষরের হলে ভালো হয়।';
    }

    if (kind === 'news' && values.body.trim().length < 40) {
      next.body = 'সংবাদের মূল বিষয়বস্তু কমপক্ষে ৪০ অক্ষরের হতে হবে।';
    }
    if (kind === 'job' && values.body.trim().length < 20) {
      next.body = 'কাজের বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে।';
    }
    if (kind === 'buy_sell' && values.body.trim().length < 10) {
      next.body = 'পণ্যের বিবরণ লিখুন।';
    }

    if (kind === 'buy_sell') {
      if (!values.category) next.category = 'ক্যাটাগরি বেছে নিন।';
      if (!values.condition) next.condition = 'পণ্যের অবস্থা বেছে নিন।';
      const price = Number(values.price);
      if (!values.price.trim()) next.price = 'দাম লিখুন।';
      else if (Number.isNaN(price) || price < 0) next.price = 'সঠিক দাম লিখুন।';
    }

    if (kind === 'job') {
      if (!values.jobType) next.jobType = 'চাকরির ধরন বেছে নিন।';
      const min = values.salaryMin.trim() ? Number(values.salaryMin) : null;
      const max = values.salaryMax.trim() ? Number(values.salaryMax) : null;
      if (min === null && max === null) {
        next.salaryMin = 'বেতনের একটি অন্তত সীমা লিখুন।';
      } else if (min !== null && Number.isNaN(min)) {
        next.salaryMin = 'সঠিক সংখ্যা লিখুন।';
      } else if (max !== null && Number.isNaN(max)) {
        next.salaryMax = 'সঠিক সংখ্যা লিখুন।';
      } else if (min !== null && max !== null && max < min) {
        next.salaryMax = 'সর্বোচ্চ বেতন কমপক্ষে সর্বনিম্ন বেতনের সমান হতে হবে।';
      }
    }

    if (phoneRequired) {
      const phone = normalizeBdPhone(values.phone);
      if (!/^01[3-9]\d{8}$/.test(phone)) {
        next.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।';
      }
    }

    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so a keyboard user is not left hunting.
      const firstKey = Object.keys(found)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const authorId = await currentUserId();
      let coverImageUrl = imagePreview;

      if (imageFile) {
        if (!authorId) {
          setFormError('ছবি আপলোড করতে লগইন করুন।');
          setSubmitting(false);
          return;
        }
        const uploaded = await uploadPostImage(authorId, imageFile);
        if (!uploaded.success) {
          setFormError(uploaded.error);
          setSubmitting(false);
          return;
        }
        coverImageUrl = uploaded.data;
      }

      // The taxonomy facets are stored as slugs, so a chip and the facet share
      // one value and the filter works on the row that was just written.
      const allTags = [...tags];
      if (kind === 'job') {
        if (values.education) allTags.push(values.education);
        if (values.experience) allTags.push(values.experience);
      }

      // `status`, `isFeatured`, `authorId` and `slug` are not the author's to
      // choose. The service layer re-forces moderation state and attribution,
      // so passing anything here would be a lie the caller cannot rely on.
      const content = {
        kind,
        titleBn: values.title.trim(),
        summaryBn: values.summary.trim() || undefined,
        bodyBn: values.body.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        category: values.category || undefined,
        areaId: values.areaId || undefined,
        tags: allTags,
        authorName: editing?.authorName,
        authorPhone: phoneRequired ? normalizeBdPhone(values.phone) : editing?.authorPhone,
        status: 'pending' as const,
        isFeatured: false,
        authorId: '',
        slug: editing?.slug ?? uniqueSlug(values.title, meta.noun),
        price: kind === 'buy_sell' ? Number(values.price) : undefined,
        salaryMin: kind === 'job' && values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: kind === 'job' && values.salaryMax ? Number(values.salaryMax) : undefined,
        jobType: kind === 'job' ? values.jobType : undefined,
        deadline: kind === 'job' && values.deadline ? values.deadline : undefined,
        conditionLabel: kind === 'buy_sell' ? values.condition : undefined,
      };

      if (editing) {
        const result = await updateCommunityPost(editing.id, content);
        if (!result.success) {
          setFormError(result.error);
          return;
        }
        router.push(`${KIND_ROUTE[editing.kind]}/${result.data.slug}`);
      } else {
        const result = await createCommunityPost(content);
        if (!result.success) {
          setFormError(result.error);
          return;
        }
        router.push(`/profile/posts?submitted=${encodeURIComponent(result.data.slug)}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setDeleting(true);
    const result = await deleteCommunityPost(editing.id);
    if (result.success) {
      router.push('/profile/posts');
    } else {
      setFormError(result.error);
      setDeleting(false);
    }
  }

  function pickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('শুধুমাত্র ছবি ফাইল দেওয়া যাবে।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError('');
  }

  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-8">
        <Link
          href={editing ? `${KIND_ROUTE[kind]}/${editing.slug}` : '/profile/posts'}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition-colors hover:text-brand-700 ${LIGHT_FOCUS}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          বাতিল করে ফিরে যান
        </Link>

        <h1 className="mt-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
          {editing ? `${meta.title} সম্পাদনা` : `নতুন ${meta.title}`}
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          {editing
            ? 'সম্পাদনা করলে পোস্টটি আবার অ্যাডমিন অনুমোদনের অপেক্ষায় যাবে।'
            : 'পোস্টটি অ্যাডমিন অনুমোদনের পর সবার জন্য দেখা যাবে। অনুমোদনের আগে আপনি নিজেই দেখতে পাবেন।'}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
          <Field
            id="title"
            label="শিরোনাম"
            required
            error={errors.title}
            hint={`${values.title.trim().length}/৮০`}
          >
            <input
              id="field-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
              required
              aria-invalid={Boolean(errors.title)}
              className={inputClass(Boolean(errors.title))}
            />
          </Field>

          <Field id="summary" label="সংক্ষিপ্ত বিবরণ" error={errors.summary}>
            <textarea
              id="field-summary"
              value={values.summary}
              onChange={(e) => set('summary', e.target.value)}
              rows={2}
              maxLength={300}
              aria-invalid={Boolean(errors.summary)}
              className={inputClass(Boolean(errors.summary))}
            />
          </Field>

          <Field
            id="body"
            label={kind === 'news' ? 'সংবাদের বিষয়বস্তু' : 'বিস্তারিত'}
            required
            error={errors.body}
          >
            <textarea
              id="field-body"
              value={values.body}
              onChange={(e) => set('body', e.target.value)}
              rows={6}
              maxLength={6000}
              aria-invalid={Boolean(errors.body)}
              className={inputClass(Boolean(errors.body))}
            />
          </Field>

          {/* Category: the news desk, or the marketplace category. */}
          <Field
            id="category"
            label={kind === 'news' ? 'বিভাগ' : 'ক্যাটাগরি'}
            required={kind !== 'job'}
            error={errors.category}
          >
            <select
              id="field-category"
              value={values.category}
              onChange={(e) => set('category', e.target.value)}
              aria-invalid={Boolean(errors.category)}
              className={inputClass(Boolean(errors.category))}
            >
              <option value="">বেছে নিন</option>
              {(kind === 'news' ? NEWS_CATEGORIES : MARKET_CATEGORIES).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.labelBn}
                </option>
              ))}
            </select>
          </Field>

          {kind === 'job' && (
            <>
              <Field id="jobType" label="চাকরির ধরন" required error={errors.jobType}>
                <select
                  id="field-jobType"
                  value={values.jobType}
                  onChange={(e) => set('jobType', e.target.value)}
                  aria-invalid={Boolean(errors.jobType)}
                  className={inputClass(Boolean(errors.jobType))}
                >
                  <option value="">বেছে নিন</option>
                  {JOB_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.labelBn}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field id="salaryMin" label="সর্বনিম্ন বেতন" error={errors.salaryMin}>
                  <input
                    id="field-salaryMin"
                    value={values.salaryMin}
                    onChange={(e) => set('salaryMin', e.target.value)}
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.salaryMin)}
                    className={inputClass(Boolean(errors.salaryMin))}
                  />
                </Field>
                <Field id="salaryMax" label="সর্বোচ্চ বেতন" error={errors.salaryMax}>
                  <input
                    id="field-salaryMax"
                    value={values.salaryMax}
                    onChange={(e) => set('salaryMax', e.target.value)}
                    inputMode="numeric"
                    aria-invalid={Boolean(errors.salaryMax)}
                    className={inputClass(Boolean(errors.salaryMax))}
                  />
                </Field>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field id="education" label="শিক্ষাগত যোগ্যতা">
                  <select
                    id="field-education"
                    value={values.education}
                    onChange={(e) => set('education', e.target.value)}
                    className={inputClass(false)}
                  >
                    <option value="">বেছে নিন</option>
                    {JOB_EDUCATION.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.labelBn}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="experience" label="অভিজ্ঞতা">
                  <select
                    id="field-experience"
                    value={values.experience}
                    onChange={(e) => set('experience', e.target.value)}
                    className={inputClass(false)}
                  >
                    <option value="">বেছে নিন</option>
                    {JOB_EXPERIENCE.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.labelBn}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field id="deadline" label="শেষ তারিখ">
                <input
                  id="field-deadline"
                  type="date"
                  value={values.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            </>
          )}

          {kind === 'buy_sell' && (
            <>
              <Field id="price" label="দাম (টাকা)" required error={errors.price}>
                <input
                  id="field-price"
                  value={values.price}
                  onChange={(e) => set('price', e.target.value)}
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(errors.price)}
                  className={inputClass(Boolean(errors.price))}
                />
              </Field>
              <Field id="condition" label="অবস্থা" required error={errors.condition}>
                <select
                  id="field-condition"
                  value={values.condition}
                  onChange={(e) => set('condition', e.target.value)}
                  aria-invalid={Boolean(errors.condition)}
                  className={inputClass(Boolean(errors.condition))}
                >
                  <option value="">বেছে নিন</option>
                  {MARKET_CONDITIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.labelBn}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field id="areaId" label="এলাকা">
            <select
              id="field-areaId"
              value={values.areaId}
              onChange={(e) => set('areaId', e.target.value)}
              className={inputClass(false)}
            >
              <option value="">বেছে নিন</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </Field>

          {/* Cover image */}
          <div>
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-700">ছবি</span>
            {imagePreview && (
              <div className="relative mb-2 w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="নির্বাচিত ছবির প্রিভিউ"
                  className="h-32 w-44 rounded-lg border border-brand-100 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm ring-1 ring-brand-100 ${LIGHT_FOCUS}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">ছবি সরান</span>
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`min-h-[44px] w-full rounded-lg border border-dashed border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              {imagePreview ? 'ছবি বদলান' : 'ছবি যোগ করুন'}
            </button>
            <p className="mt-1 text-[11px] text-ink-400">সর্বোচ্চ ৫MB।</p>
          </div>

          {/* Free-text tags */}
          <TagEditor tags={tags} onChange={setTags} />

          {phoneRequired && (
            <Field
              id="phone"
              label="আপনার মোবাইল নম্বর"
              required
              error={errors.phone}
              hint="অ্যাডমিন যোগাযোগ করতে ব্যবহার করবেন, প্রকাশ করা হবে না"
            >
              <input
                id="field-phone"
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
                inputMode="tel"
                required
                aria-invalid={Boolean(errors.phone)}
                className={inputClass(Boolean(errors.phone))}
              />
            </Field>
          )}

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-medium text-red-800"
            >
              {formError}
            </p>
          )}

          {!isConfiguredWithSupabase && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
              সার্ভার সংযোগ বর্তমানে কনফিগার করা নেই, তাই পোস্ট সংরক্ষণ করা যাবে না।
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 ${LIGHT_FOCUS}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting
                ? 'পাঠানো হচ্ছে…'
                : editing
                  ? 'পরিবর্তন জমা দিন'
                  : 'অ্যাডমিনের কাছে পাঠান'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting || deleting}
                className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 ${LIGHT_FOCUS}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deleting ? 'মুছছে…' : 'মুছে ফেলুন'}
              </button>
            )}
          </div>

          {editing?.status === 'rejected' && (
            <p className="text-[11.5px] leading-relaxed text-ink-400">
              পুনরায় পাঠালে পোস্টটি আবার অনুমোদনের অপেক্ষায় যাবে।
            </p>
          )}
        </form>
      </main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small form pieces
// ---------------------------------------------------------------------------

function inputClass(invalid: boolean): string {
  return `min-h-[44px] w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors ${
    invalid ? 'border-red-300' : 'border-brand-100 focus:border-brand-500'
  }`;
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`field-${id}`} className="mb-1.5 block text-[12.5px] font-bold text-ink-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11.5px] font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Free-text tag entry.
 *
 * Tags are the same slug vocabulary the facets use, so any that match a
 * taxonomy entry are shown with their Bangla label; the rest are the reader's
 * own words and are kept verbatim.
 */
function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value || tags.includes(value)) {
      setDraft('');
      return;
    }
    if (tags.length >= 6) return;
    onChange([...tags, value]);
    setDraft('');
  }

  return (
    <div>
      <label htmlFor="tag-input" className="mb-1.5 block text-[12.5px] font-bold text-ink-700">
        ট্যাগ (ঐচ্ছিক)
      </label>
      {tags.length > 0 && (
        <ul className="mb-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[11px] font-medium text-ink-600"
            >
              {tagLabelSafe(tag)}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-ink-400 hover:text-red-600"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">{tagLabelSafe(tag)} সরান</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id="tag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          maxLength={30}
          placeholder="যেমন: ঈদ, ফ্রিল্যান্স"
          className={inputClass(false)}
        />
        <button
          type="button"
          onClick={add}
          disabled={tags.length >= 6}
          className={`min-h-[44px] shrink-0 rounded-lg border border-brand-200 bg-white px-3.5 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50 disabled:opacity-50 ${LIGHT_FOCUS}`}
        >
          যোগ
        </button>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">সর্বোচ্চ ৬টি।</p>
    </div>
  );
}

/** Resolves a slug to its Bangla label when one exists. */
function tagLabelSafe(tag: string): string {
  const labels = tagLabels([tag]);
  return labels[0] ?? tag;
}
