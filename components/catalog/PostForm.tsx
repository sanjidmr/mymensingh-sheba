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
import { Eye, Loader2, Save, Trash2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import {
  createCommunityPost,
  currentUserId,
  deleteCommunityPostDraft,
  deleteCommunityPost,
  loadCommunityPostDraft,
  saveCommunityPostDraft,
  updateCommunityPost,
  uploadPostImage,
  type CommunityPostDraft,
} from '@/lib/catalog-service';
import { getAllMCCAreas } from '@/lib/locations';
import { normalizeBdPhone } from '@/lib/contact-types';
import {
  JOB_EXPERIENCE,
  JOB_TYPES,
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
  organization: string;
  education: string;
  experience: string;
  deadline: string;
  condition: string;
  phone: string;
  /** buy_sell: the seller's own number, which the buyer is allowed to call. */
  sellerPhone: string;
  /** buy_sell: optional WhatsApp line. Blank means "same as the call number". */
  whatsapp: string;
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
  organization: '',
  education: '',
  experience: '',
  deadline: '',
  condition: '',
  phone: '',
  sellerPhone: '',
  whatsapp: '',
};

type Errors = Partial<Record<keyof FormValues | 'photos', string>>;

/**
 * One photo slot in the uploader.
 *
 * `file` is a freshly picked file still on this device; `url` is either the
 * object URL of that file or the stored URL of an existing photo. The first slot
 * becomes `cover_image_url` and the rest become `gallery` — a split the column
 * layout already forces, and one that keeps the card grid's first photo cheap
 * to fetch.
 */
type PhotoSlot = { key: string; file: File | null; url: string };

/** Cover plus four gallery photos. */
const MAX_PHOTOS = 5;
const DRAFT_VERSION = 1;

type PostDraft = CommunityPostDraft;

function isPostDraft(value: unknown): value is PostDraft {
  if (typeof value !== 'object' || value === null || !('version' in value) || value.version !== DRAFT_VERSION) {
    return false;
  }
  if (!('values' in value) || typeof value.values !== 'object' || value.values === null) return false;
  if (!('tags' in value) || !Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string')) {
    return false;
  }
  if ('photos' in value && (!Array.isArray(value.photos) || !value.photos.every((photo) => typeof photo === 'string'))) {
    return false;
  }
  return 'savedAt' in value && typeof value.savedAt === 'string' &&
    Object.values(value.values).every((entry) => typeof entry === 'string');
}

function draftSignature(values: FormValues, tags: string[], photos: PhotoSlot[]): string {
  return JSON.stringify({
    values,
    tags,
    photos: photos.map(({ key, url, file }) => [
      key,
      url,
      file?.name,
      file?.size,
      file?.lastModified,
    ]),
  });
}

/**
 * The form's starting state for an existing post.
 *
 * A factory rather than an effect. The previous shape set five pieces of state
 * from inside `useEffect`, which meant every field rendered blank for one frame
 * on load and — worse — would overwrite half-typed input if the `editing`
 * reference ever changed identity. The caller keys the form on the post id, so
 * "a different post" is now "a different component instance" and the seed runs
 * exactly once, at mount.
 *
 * `education` and `experience` start empty on purpose: they are job facets
 * stored as tags, not columns, and there is no column to read them back out of.
 * Pre-filling them would show the seller's existing chips as unselected.
 */
function seedFrom(post: CommunityPost) {
  return {
    values: {
      title: post.titleBn,
      summary: post.summaryBn ?? '',
      body: post.bodyBn ?? '',
      category: post.category ?? '',
      areaId: post.areaId ?? '',
      price: post.price != null ? String(post.price) : '',
      salaryMin: post.salaryMin != null ? String(post.salaryMin) : '',
      salaryMax: post.salaryMax != null ? String(post.salaryMax) : '',
      jobType: post.jobType ?? '',
      organization: post.organizationBn ?? '',
      education: '',
      experience: '',
      deadline: post.deadline ?? '',
      condition: post.conditionLabel ?? '',
      phone: '',
      sellerPhone: post.authorPhone ?? '',
      whatsapp: post.whatsappNumber ?? '',
    },
    tags: post.tags ?? [],
    photos: [
      ...(post.coverImageUrl ? [{ key: 'cover', file: null, url: post.coverImageUrl }] : []),
      ...(post.gallery ?? []).map((url, i) => ({ key: `existing-${i}`, file: null, url })),
    ],
  };
}

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

  // One seed, computed once. The lazy initialisers below read it in order, so
  // `seedFrom` runs at most once per mount and never on a later render.
  const [seed] = useState(() => (editing ? seedFrom(editing) : null));
  const [values, setValues] = useState<FormValues>(() => seed?.values ?? EMPTY);
  const [tags, setTags] = useState<string[]>(() => seed?.tags ?? []);
  const [photos, setPhotos] = useState<PhotoSlot[]>(() => seed?.photos ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [formError, setFormError] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  /**
   * A stored draft is never applied on its own any more.
   *
   * It used to be, which meant opening "নতুন চাকরির খবর" silently re-filled the
   * form with the last job a member had written — from their point of view the
   * site had put them back inside an existing post instead of starting a new
   * one, and they could not tell which of the two they were about to publish.
   * Holding it here and asking keeps "new" meaning new, while still making the
   * saved copy one tap away.
   */
  const [pendingDraft, setPendingDraft] = useState<{
    values: FormValues;
    tags: string[];
    photos: string[];
    savedAt: string | null;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draftLoadedFor, setDraftLoadedFor] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [autosaveRevision, setAutosaveRevision] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const userId = user?.id;
  const hasInteractedRef = useRef(false);
  const submittedRef = useRef(false);
  const autosavingRef = useRef(false);
  const lastSavedDraftRef = useRef<string | null>(null);
  const latestDraftRef = useRef({ values, tags, photos });
  const objectUrlsRef = useRef(new Set<string>());
  const draftKey = `mymensingh-sheba:post-draft:${userId ?? 'guest'}:${kind}`;
  const draftReady = Boolean(editing) || draftLoadedFor === draftKey;

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);

  useEffect(() => {
    latestDraftRef.current = { values, tags, photos };
  }, [photos, tags, values]);

  async function uploadPendingPhotos(
    slots: PhotoSlot[],
    onUploaded?: () => void
  ): Promise<PhotoSlot[]> {
    const hasPending = slots.some((photo) => photo.file);
    const authorId = hasPending ? await currentUserId() : null;
    if (hasPending && !authorId) {
      throw new Error('ছবি সংরক্ষণ করতে লগইন করুন।');
    }

    const persisted: PhotoSlot[] = [];
    for (const photo of slots) {
      if (!photo.file) {
        persisted.push(photo);
        continue;
      }
      if (!authorId) throw new Error('ছবি সংরক্ষণ করতে লগইন করুন।');
      const result = await uploadPostImage(authorId, photo.file);
      if (!result.success) throw new Error('ছবি সংরক্ষণ করা যায়নি।');
      persisted.push({ ...photo, file: null, url: result.data });
      onUploaded?.();
      setPhotos((current) => current.map((item) =>
        item.key === photo.key ? { ...item, file: null, url: result.data } : item
      ));
    }
    return persisted;
  }

  /**
   * Object URLs are released only once nothing points at them any more.
   *
   * The preview is a `blob:` URL that the `<img>` is already showing. Revoking
   * it at the moment the upload finishes blanked that `<img>` before React had
   * repainted with the stored URL — the photo "vanished" for a beat, and on a
   * slow device it stayed gone. Releasing here (and on unmount, below) means the
   * swap happens first and the blob is freed afterwards.
   */
  useEffect(() => {
    const live = new Set(photos.map((slot) => slot.url));
    objectUrlsRef.current.forEach((url) => {
      if (!live.has(url)) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(url);
      }
    });
  }, [photos]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (editing) return;
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        let parsed: unknown = null;
        let savedAt: string | null = null;
        if (userId) {
          const result = await loadCommunityPostDraft(kind);
          if (!result.success) throw new Error('খসড়া লোড করা যায়নি।');
          parsed = result.data.draft;
          savedAt = result.data.updatedAt;
        } else {
          const raw = window.localStorage.getItem(draftKey);
          if (raw) parsed = JSON.parse(raw);
        }
        if (parsed !== null) {
          if (!isPostDraft(parsed)) throw new Error('খসড়াটি পড়া যায়নি।');
          if (active && !hasInteractedRef.current) {
            const storedValues = { ...EMPTY };
            for (const key of Object.keys(EMPTY) as (keyof FormValues)[]) {
              const value = parsed.values[key];
              if (typeof value === 'string') storedValues[key] = value;
            }
            const hasContent =
              Object.values(storedValues).some((value) => value.trim().length > 0) ||
              parsed.tags.length > 0 ||
              (parsed.photos?.length ?? 0) > 0;
            // Held, not applied. The member decides whether this form is the
            // draft they left behind or a genuinely new post — see `pendingDraft`.
            if (hasContent) {
              setPendingDraft({
                values: storedValues,
                tags: parsed.tags.slice(0, 6),
                photos: (parsed.photos ?? []).slice(0, MAX_PHOTOS),
                savedAt: savedAt ?? parsed.savedAt,
              });
              setDraftSavedAt(savedAt ?? parsed.savedAt);
            }
          }
        }
      } catch {
        if (active) setFormError('খসড়াটি পড়া যায়নি। আবার চেষ্টা করুন।');
      } finally {
        if (active) setDraftLoadedFor(draftKey);
      }
    });
    return () => { active = false; };
  }, [draftKey, editing, kind, userId]);

  useEffect(() => {
    if (!draftReady || editing || submitting || draftBusy || submittedRef.current) return;
    // Nothing is written until the member has actually touched the form. Writing
    // first would overwrite the stored draft they have not been asked about yet.
    if (!hasInteractedRef.current) return;
    const signature = draftSignature(values, tags, photos);
    if (signature === lastSavedDraftRef.current || autosavingRef.current) return;
    const timeout = window.setTimeout(async () => {
      autosavingRef.current = true;
      setAutosaving(true);
      let saved = false;
      try {
        const hasContent =
          Object.values(values).some((value) => value.trim().length > 0) ||
          tags.length > 0 ||
          photos.length > 0;
        if (!hasContent) {
          if (userId) {
            const result = await deleteCommunityPostDraft(kind);
            if (!result.success) throw new Error('খসড়া মুছে ফেলা যায়নি।');
          } else {
            window.localStorage.removeItem(draftKey);
          }
          setDraftSavedAt(null);
          lastSavedDraftRef.current = signature;
          saved = true;
          return;
        }

        const savedPhotos = userId
          ? await uploadPendingPhotos(photos)
          : photos.filter((photo) => !photo.file);
        const savedAt = new Date().toISOString();
        const draft: PostDraft = {
          version: DRAFT_VERSION,
          values: { ...values },
          tags,
          photos: savedPhotos.map((photo) => photo.url),
          savedAt,
        };
        if (userId) {
          const result = await saveCommunityPostDraft(kind, draft);
          if (!result.success) throw new Error('খসড়া সংরক্ষণ করা যায়নি।');
          setDraftSavedAt(result.data);
        } else {
          window.localStorage.setItem(draftKey, JSON.stringify(draft));
          setDraftSavedAt(savedAt);
        }
        lastSavedDraftRef.current = draftSignature(
          values,
          tags,
          userId ? savedPhotos : photos
        );
        saved = true;
      } catch (error) {
        console.error('Post draft autosave failed', error);
        setFormError('খসড়া সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        autosavingRef.current = false;
        setAutosaving(false);
        if (
          saved &&
          draftSignature(
            latestDraftRef.current.values,
            latestDraftRef.current.tags,
            latestDraftRef.current.photos
          ) !== lastSavedDraftRef.current
        ) {
          setAutosaveRevision((revision) => revision + 1);
        }
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [autosaveRevision, draftBusy, draftKey, draftReady, editing, kind, photos, submitting, tags, userId, values]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    hasInteractedRef.current = true;
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
    if (kind === 'buy_sell') {
      if (!values.category.trim()) next.category = 'ক্যাটাগরি লিখুন।';
      if (!values.condition) next.condition = 'পণ্যের অবস্থা বেছে নিন।';
      const price = Number(values.price);
      if (!values.price.trim()) next.price = 'দাম লিখুন।';
      else if (Number.isNaN(price) || price < 0) next.price = 'সঠিক দাম লিখুন।';

      // A photo is not optional on a marketplace listing. A text-only post for
      // "Samsung phone, 45000" is indistinguishable from a scam, and it is the
      // single strongest predictor of one — a buyer cannot judge condition,
      // size or damage from a description. It is required for buy_sell only,
      // because a news article legitimately runs without a photo.
      if (photos.length === 0) next.photos = 'পণ্যের অন্তত একটি ছবি দিন।';

      // The seller's number is required here for the same reason: a listing a
      // buyer cannot call is not a listing. `normalizeBdPhone` handles the
      // Bangladeshi formats (01…, +8801…, spaces) and returns '' on garbage.
      const seller = normalizeBdPhone(values.sellerPhone);
      if (!/^01[3-9]\d{8}$/.test(seller)) {
        next.sellerPhone = 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।';
      }
      if (values.whatsapp.trim()) {
        const wa = normalizeBdPhone(values.whatsapp);
        if (!/^01[3-9]\d{8}$/.test(wa)) {
          next.whatsapp = 'হোয়াটসঅ্যাপ নম্বরটি সঠিক নয়।';
        }
      }
    }

    if (kind === 'job') {
      if (values.organization.trim().length < 2) {
        next.organization = 'প্রতিষ্ঠানের নাম লিখুন (কমপক্ষে ২ অক্ষর)।';
      }
      if (!values.category.trim()) next.category = 'ক্যাটাগরি লিখুন।';
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
    hasInteractedRef.current = true;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so a keyboard user is not left hunting.
      const firstKey = Object.keys(found)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el instanceof HTMLElement) el.focus();
      return;
    }

    setSubmitting(true);
    try {
      setUploadedCount(0);
      const pendingCount = photos.filter((slot) => slot.file).length;
      const persistedPhotos = await uploadPendingPhotos(photos, () => setUploadedCount((n) => n + 1));
      const urls = persistedPhotos.map((photo) => photo.url);
      if (pendingCount === 0) setUploadedCount(0);

      const allTags: string[] = [];
      if (kind === 'job' && values.education.trim()) allTags.push(values.education.trim());
      allTags.push(...tags);
      if (kind === 'job') {
        if (values.experience) allTags.push(values.experience);
      }

      // `status`, `isFeatured`, `authorId` and `slug` are not the author's to
      // choose. The service layer re-forces moderation state and attribution,
      // so passing anything here would be a lie the caller cannot rely on.
      const content = {
        kind,
        titleBn: values.title.trim(),
        summaryBn: values.summary.trim() || undefined,
        bodyBn: kind === 'news' ? values.body.trim() || undefined : undefined,
        coverImageUrl: urls[0] || undefined,
        gallery: urls.slice(1),
        category: values.category.trim() || undefined,
        areaId: values.areaId || undefined,
        tags: allTags,
        authorName: editing?.authorName,
        authorPhone:
          kind === 'buy_sell'
            ? normalizeBdPhone(values.sellerPhone)
            : phoneRequired
              ? normalizeBdPhone(values.phone)
              : editing?.authorPhone,
        whatsappNumber:
          kind === 'buy_sell' ? normalizeBdPhone(values.whatsapp) || null : undefined,
        status: 'pending' as const,
        isFeatured: false,
        authorId: '',
        slug: editing?.slug ?? uniqueSlug(values.title, meta.noun),
        price: kind === 'buy_sell' ? Number(values.price) : undefined,
        salaryMin: kind === 'job' && values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: kind === 'job' && values.salaryMax ? Number(values.salaryMax) : undefined,
        jobType: kind === 'job' ? values.jobType : undefined,
        organizationBn: kind === 'job' ? values.organization.trim() || undefined : undefined,
        deadline: kind === 'job' && values.deadline ? values.deadline : undefined,
        conditionLabel: kind === 'buy_sell' ? values.condition : undefined,
      };

      if (editing) {
        const result = await updateCommunityPost(editing.id, content);
        if (!result.success) {
          console.error('Post update failed', result.error);
          setFormError('পোস্টটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
          return;
        }
        router.push(`${KIND_ROUTE[editing.kind]}/${result.data.slug}`);
      } else {
        const result = await createCommunityPost(content);
        if (!result.success) {
          console.error('Post creation failed', result.error);
          setFormError('পোস্টটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
          return;
        }
        submittedRef.current = true;
        let draftCleanupFailed = false;
        if (userId) {
          const cleanup = await deleteCommunityPostDraft(kind);
          draftCleanupFailed = !cleanup.success;
        } else {
          try {
            window.localStorage.removeItem(draftKey);
          } catch {
            draftCleanupFailed = true;
          }
        }
        router.push(
          `/dashboard/posts?submitted=${encodeURIComponent(result.data.slug)}${draftCleanupFailed ? `&draftCleanup=${kind}` : ''}`
        );
      }
    } catch (error) {
      console.error('Post submission failed', error);
      setFormError('পোস্টটি পাঠানো যায়নি। আবার চেষ্টা করুন।');
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

  function pickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    hasInteractedRef.current = true;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setFormError(`সর্বোচ্চ ${MAX_PHOTOS}টি ছবি দেওয়া যাবে।`);
      return;
    }
    const accepted: PhotoSlot[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith('image/')) {
        setFormError('শুধুমাত্র ছবি ফাইল দেওয়া যাবে।');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('প্রতিটি ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।');
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      accepted.push({
        key: `local-${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        url: previewUrl,
      });
    }
    // Reporting the truncation matters: silently dropping the 6th photo leaves
    // the seller believing they uploaded all of them.
    if (files.length > room) {
      setFormError(`সর্বোচ্চ ${MAX_PHOTOS}টি ছবি রাখা যায় — বাকিগুলো যোগ করা হয়নি।`);
    } else {
      setFormError('');
    }
    if (accepted.length) setPhotos((prev) => [...prev, ...accepted]);
  }

  /**
   * Remove a photo.
   *
   * The first slot is special: dropping it does not shift the gallery up into
   * the cover position, because the seller chose that photo as the one buyers
   * see in the grid. Removing it leaves a gap the cover should fill, so the
   * cover is removed and the next photo takes over.
   */
  function removePhoto(key: string) {
    hasInteractedRef.current = true;
    // The blob itself is released by the effect that watches `photos`; doing it
    // here would blank the tile before the row is gone.
    setPhotos((prev) => prev.filter((slot) => slot.key !== key));
  }

  /** Promote a gallery photo to be the cover. */
  function makeCover(key: string) {
    hasInteractedRef.current = true;
    setPhotos((prev) => {
      const index = prev.findIndex((slot) => slot.key === key);
      if (index <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }

  async function saveDraftNow() {
    if (autosavingRef.current) return;
    hasInteractedRef.current = true;
    setDraftBusy(true);
    setFormError('');
    try {
      const persistedPhotos = userId
        ? await uploadPendingPhotos(photos)
        : photos.filter((photo) => !photo.file);
      const savedAt = new Date().toISOString();
      const draft: PostDraft = {
        version: DRAFT_VERSION,
        values: { ...values },
        tags,
        photos: persistedPhotos.map((photo) => photo.url),
        savedAt,
      };
      if (userId) {
        const result = await saveCommunityPostDraft(kind, draft);
        if (!result.success) throw new Error('খসড়া সংরক্ষণ করা যায়নি।');
        setDraftSavedAt(result.data);
        setDraftNotice('খসড়া ও ছবিগুলো সংরক্ষিত হয়েছে।');
      } else {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftSavedAt(savedAt);
        setDraftNotice(
          photos.some((photo) => photo.file)
            ? 'খসড়াটি এই ব্রাউজারে সংরক্ষিত হয়েছে; ছবিগুলো সংরক্ষণ করতে লগইন করুন।'
            : 'খসড়া এই ব্রাউজারে সংরক্ষিত হয়েছে।'
        );
      }
      lastSavedDraftRef.current = draftSignature(
        values,
        tags,
        userId ? persistedPhotos : photos
      );
    } catch (error) {
      console.error('Post draft save failed', error);
      setFormError('খসড়া সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setDraftBusy(false);
    }
  }

  /** Continue from the stored draft the member was offered. */
  function restorePendingDraft() {
    if (!pendingDraft) return;
    hasInteractedRef.current = true;
    const restoredPhotos: PhotoSlot[] = pendingDraft.photos.map((url, index) => ({
      key: `draft-${index}`,
      file: null,
      url,
    }));
    setValues(pendingDraft.values);
    setTags(pendingDraft.tags);
    setPhotos(restoredPhotos);
    setErrors({});
    setFormError('');
    lastSavedDraftRef.current = draftSignature(
      pendingDraft.values,
      pendingDraft.tags,
      restoredPhotos
    );
    setDraftNotice(
      pendingDraft.photos.length
        ? 'খসড়া ও ছবিগুলো ফিরিয়ে আনা হয়েছে।'
        : 'খসড়া ফিরিয়ে আনা হয়েছে।'
    );
    setPendingDraft(null);
  }

  /** Start a brand-new post and throw the stored draft away. */
  async function discardPendingDraft() {
    setPendingDraft(null);
    setDraftSavedAt(null);
    hasInteractedRef.current = true;
    try {
      if (userId) {
        await deleteCommunityPostDraft(kind);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      // The draft is gone from this screen either way; a retry is not useful to
      // the member, so this stays silent.
    }
    setDraftNotice('খসড়া মুছে ফেলা হয়েছে।');
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
        {!editing && (
          <p className="mt-1 text-[11px] text-ink-400">
            {user ? 'খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে' : 'খসড়া শুধু এই ব্রাউজারে সংরক্ষিত হবে'}
            {' · '}
            {user
              ? 'ছবিসহ সংরক্ষণ করতে “খসড়া সংরক্ষণ” চাপুন'
              : 'ছবি সংরক্ষণ করতে লগইন করুন'}
            {autosaving ? ' · খসড়া সংরক্ষণ হচ্ছে…' : ''}
            {draftSavedAt ? ` · সর্বশেষ সংরক্ষণ ${new Date(draftSavedAt).toLocaleTimeString('bn-BD')}` : ''}।
          </p>
        )}

        {pendingDraft && !editing && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-[12.5px] font-semibold text-amber-900">
              আপনি আগে লেখা একটি খসড়া রেখে গেছেন
              {pendingDraft.savedAt
                ? ` (${new Date(pendingDraft.savedAt).toLocaleString('bn-BD')})`
                : ''}
              ।
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-amber-800">
              চাইলে সেটি ফিরিয়ে আনুন, নয়তো খালি ফর্ম থেকেই নতুন পোস্ট লিখুন — এভাবে জমা দিলে এটি
              আলাদা নতুন পোস্ট হিসেবেই সংরক্ষিত হবে।
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={restorePendingDraft}
                className={`inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-700 px-3 text-[12px] font-bold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
              >
                খসড়া ফিরিয়ে আনুন
              </button>
              <button
                type="button"
                onClick={discardPendingDraft}
                className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border border-amber-300 bg-white px-3 text-[12px] font-bold text-amber-900 transition-colors hover:bg-amber-100 ${LIGHT_FOCUS}`}
              >
                খসড়া মুছে ফেলুন
              </button>
            </div>
          </div>
        )}

        {/* Why this post came back — the whole point of editing a rejected
            submission is knowing what to fix. */}
        {editing?.status === 'rejected' && editing.rejectionReason && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-medium leading-relaxed text-red-900">
            <strong>অনুমোদিত হয়নি —</strong> {editing.rejectionReason}
          </p>
        )}

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

          {/*
            Only news carries a long body now. A job or a marketplace item is a
            short set of facts, and the old "বিস্তারিত" box on the job form was
            the field members filled last and least usefully — the vacancy text
            belongs in the summary and the facts. News keeps its article body.
          */}
          {kind === 'news' && (
            <Field id="body" label="সংবাদের বিষয়বস্তু" required error={errors.body}>
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
          )}

          {/*
            Category is typed, not chosen. Only the news desk keeps a list,
            because the newsroom filter is a fixed set of desks; a job's category
            and a marketplace item's category are whatever the writer calls them,
            so a dropdown there only ever meant "your option is missing".
          */}
          <Field
            id="category"
            label={kind === 'news' ? 'বিভাগ' : 'ক্যাটাগরি'}
            required={kind !== 'news'}
            error={errors.category}
          >
            {kind === 'news' ? (
              <select
                id="field-category"
                value={values.category}
                onChange={(e) => set('category', e.target.value)}
                aria-invalid={Boolean(errors.category)}
                className={inputClass(Boolean(errors.category))}
              >
                <option value="">বেছে নিন</option>
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.labelBn}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="field-category"
                type="text"
                value={values.category}
                onChange={(e) => set('category', e.target.value)}
                maxLength={60}
                placeholder={kind === 'job' ? 'যেমন: শিক্ষক, বিক্রয় প্রতিনিধি' : 'যেমন: মোবাইল, আসবাবপত্র'}
                aria-invalid={Boolean(errors.category)}
                className={inputClass(Boolean(errors.category))}
              />
            )}
          </Field>

          {kind === 'job' && (
            <>
              <Field
                id="organization"
                label="প্রতিষ্ঠানের নাম"
                required
                error={errors.organization}
                hint="যে প্রতিষ্ঠান/কোম্পানিতে নিয়োগ দেওয়া হচ্ছে।"
              >
                <input
                  id="field-organization"
                  type="text"
                  value={values.organization}
                  onChange={(e) => set('organization', e.target.value)}
                  maxLength={120}
                  placeholder="যেমন: ময়মনসিংহ ইন্টারন্যাশনাল স্কুল"
                  aria-invalid={Boolean(errors.organization)}
                  className={inputClass(Boolean(errors.organization))}
                />
              </Field>

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
                  <input
                    id="field-education"
                    type="text"
                    value={values.education}
                    onChange={(e) => set('education', e.target.value)}
                    maxLength={80}
                    placeholder="যেমন: এইচএসসি, স্নাতক"
                    className={inputClass(false)}
                  />
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

              {/* Seller contact. Required, because a marketplace listing whose
                  buyer cannot call the seller is not a listing. The number goes
                  to `author_phone`, which the public page reads back only
                  through `fetch_market_contact` — see `lib/catalog-service.ts`.
                  Kept out of the news and job forms entirely: nothing in those
                  two workflows asks an author to publish a number. */}
              <fieldset className="rounded-xl border border-mist-200 bg-mist-50/60 p-3">
                <legend className="px-1 text-[12px] font-extrabold text-ink-700">
                  বিক্রেতার যোগাযোগ
                </legend>

                <Field
                  id="sellerPhone"
                  label="মোবাইল নম্বর"
                  required
                  error={errors.sellerPhone}
                  hint="অ্যাডমিন অনুমোদনের পর ক্রেতারা এই নম্বরে কল করতে পারবেন"
                >
                  <input
                    id="field-sellerPhone"
                    value={values.sellerPhone}
                    onChange={(e) => set('sellerPhone', e.target.value)}
                    inputMode="tel"
                    required
                    aria-invalid={Boolean(errors.sellerPhone)}
                    className={inputClass(Boolean(errors.sellerPhone))}
                  />
                </Field>

                <div className="mt-3">
                  <Field
                    id="whatsapp"
                    label="হোয়াটসঅ্যাপ নম্বর"
                    error={errors.whatsapp}
                    hint="না দিলে উপরের নম্বরটিই হোয়াটসঅ্যাপে ব্যবহার হবে"
                  >
                    <input
                      id="field-whatsapp"
                      value={values.whatsapp}
                      onChange={(e) => set('whatsapp', e.target.value)}
                      inputMode="tel"
                      aria-invalid={Boolean(errors.whatsapp)}
                      className={inputClass(Boolean(errors.whatsapp))}
                    />
                  </Field>
                </div>
              </fieldset>
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

          {/* Photos. The first one is the cover the card grid shows; the rest form the
            gallery on the detail page. buy_sell needs at least one — see the
            note in `validate`. */}
          <div
            id="field-photos"
            tabIndex={-1}
            className="outline-none"
            aria-invalid={Boolean(errors.photos)}
          >
            <span className="mb-1.5 block text-[12.5px] font-bold text-ink-700">
              ছবি
              {kind === 'buy_sell' && <span className="text-rose-600"> *</span>}
            </span>

            {photos.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-2">
                {photos.map((slot, index) => (
                  <li key={slot.key} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.url}
                      alt={index === 0 ? 'প্রচ্ছদ ছবি' : `ছবি ${index + 1}`}
                      className={`h-24 w-32 rounded-lg border object-cover ${
                        index === 0 ? 'border-brand-500' : 'border-mist-200'
                      }`}
                    />
                    {index === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded bg-ink-900/75 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                        প্রচ্ছদ
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(slot.key)}
                        disabled={submitting || draftBusy || autosaving}
                        className={`absolute bottom-1 left-1 min-h-11 rounded bg-white/90 px-2 text-[10px] font-bold text-ink-700 disabled:opacity-60 ${LIGHT_FOCUS}`}
                      >
                        প্রচ্ছদ করুন
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(slot.key)}
                      aria-label={`ছবি ${index + 1} সরান`}
                      disabled={submitting || draftBusy || autosaving}
                      className={`absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm ring-1 ring-mist-200 disabled:opacity-60 ${LIGHT_FOCUS}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple={kind === 'buy_sell'}
              onChange={(e) => {
                pickImages(e.target.files);
                // Reset so picking the same file twice in a row still fires
                // `onChange` — otherwise the second pick looks like nothing
                // happened and the seller cannot retry a bad photo.
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS || submitting || draftBusy || autosaving}
              className={`min-h-[44px] w-full rounded-lg border border-dashed border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 disabled:cursor-not-allowed disabled:text-ink-400 ${LIGHT_FOCUS}`}
            >
              {photos.length === 0
                ? 'ছবি যোগ করুন'
                : `আরও ছবি যোগ করুন (${photos.length}/${MAX_PHOTOS})`}
            </button>
            <p className="mt-1 text-[11px] text-ink-400">
              প্রতিটি ছবি সর্বোচ্চ ৫MB। প্রথম ছবিটি তালিকায় দেখাবে।
            </p>
            {errors.photos && (
              <p role="alert" className="mt-1 text-[11.5px] font-medium text-rose-600">
                {errors.photos}
              </p>
            )}
          </div>

          {/* Free-text tags */}
          <TagEditor
            tags={tags}
            onChange={(next) => {
              hasInteractedRef.current = true;
              setTags(next);
            }}
          />

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
          {draftNotice && (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-800">
              {draftNotice}
            </p>
          )}

          {!isConfiguredWithSupabase && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
              সার্ভার সংযোগ বর্তমানে কনফিগার করা নেই, তাই পোস্ট সংরক্ষণ করা যাবে না।
            </p>
          )}

          {showPreview && (
            <section aria-label="পোস্টের প্রিভিউ" className="rounded-xl border border-brand-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-extrabold text-brand-700">প্রিভিউ · {meta.noun}</p>
              {photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0].url} alt="" className="mb-3 max-h-56 w-full rounded-lg object-cover" />
              )}
              <h2 className="text-base font-extrabold text-ink-900">{values.title.trim() || 'আপনার শিরোনাম'}</h2>
              {values.summary.trim() && <p className="mt-1 text-sm text-ink-600">{values.summary}</p>}
              {kind === 'news' && (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700">
                  {values.body || 'সংবাদের বিষয়বস্তু এখানে দেখা যাবে।'}
                </p>
              )}
              {values.price && <p className="mt-2 font-extrabold text-brand-700">৳ {values.price}</p>}
              {values.organization && <p className="mt-2 text-xs text-ink-500">{values.organization}</p>}
            </section>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {!editing && (
              <button
                type="button"
                onClick={saveDraftNow}
                disabled={submitting || deleting || draftBusy || autosaving || !draftReady}
                className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[12px] font-bold text-brand-700 hover:bg-mist-50 disabled:opacity-60 ${LIGHT_FOCUS}`}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {draftBusy ? 'সংরক্ষণ হচ্ছে…' : 'খসড়া সংরক্ষণ'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((visible) => !visible)}
              className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[12px] font-bold text-brand-700 hover:bg-mist-50 ${LIGHT_FOCUS}`}
              aria-expanded={showPreview}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              {showPreview ? 'প্রিভিউ বন্ধ' : 'প্রিভিউ'}
            </button>
            <button
              type="submit"
              disabled={submitting || deleting || draftBusy || autosaving}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 ${LIGHT_FOCUS}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting
                ? photos.some((slot) => slot.file)
                  ? `ছবি আপলোড হচ্ছে… (${uploadedCount}/${photos.filter((slot) => slot.file).length})`
                  : 'পাঠানো হচ্ছে…'
                : editing
                  ? 'পরিবর্তন জমা দিন'
                  : kind === 'buy_sell'
                    ? 'বিজ্ঞাপন পাঠান'
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
