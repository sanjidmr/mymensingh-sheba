'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/admin/ToastProvider';
import { createAdminPost, updateAdminPost } from '@/app/admin/actions/posts';
import type { AdminPostInput } from '@/lib/admin/post-input';
import type { AdminPostRow } from '@/lib/admin/queries';
import {
  JOB_TYPES,
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  NEWS_CATEGORIES,
  type PostKind,
} from '@/lib/catalog-types';
import { uploadPostImage } from '@/lib/catalog-service';
import { normalizeBdPhone } from '@/lib/contact-types';

type FormValues = Omit<AdminPostInput, 'kind' | 'tags' | 'coverImageUrl' | 'gallery'>;
type Photo = { url: string; file?: File };

const EMPTY: FormValues = {
  titleBn: '',
  summaryBn: '',
  bodyBn: '',
  category: '',
  areaId: '',
  authorName: '',
  authorPhone: '',
  whatsappNumber: '',
  price: '',
  conditionLabel: '',
  organizationBn: '',
  jobType: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
};

const KIND_LABEL: Record<PostKind, string> = {
  news: 'সংবাদ',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

function initialValues(post?: AdminPostRow): FormValues {
  if (!post) return EMPTY;
  return {
    titleBn: post.title_bn,
    summaryBn: post.summary_bn ?? '',
    bodyBn: post.body_bn ?? '',
    category: post.category ?? '',
    areaId: post.area_id ?? '',
    authorName: post.author_name ?? '',
    authorPhone: post.author_phone ?? '',
    whatsappNumber: post.whatsapp_number ?? '',
    price: post.price == null ? '' : String(post.price),
    conditionLabel: post.condition_label ?? '',
    organizationBn: post.organization_bn ?? '',
    jobType: post.job_type ?? '',
    salaryMin: post.salary_min == null ? '' : String(post.salary_min),
    salaryMax: post.salary_max == null ? '' : String(post.salary_max),
    deadline: post.deadline ?? '',
  };
}

export function AdminPostForm({
  adminId,
  post,
  initialKind,
  lockKind = false,
}: {
  adminId: string;
  post?: AdminPostRow;
  initialKind?: PostKind;
  lockKind?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [kind, setKind] = useState<PostKind>(post?.kind ?? initialKind ?? 'news');
  const [values, setValues] = useState<FormValues>(() => initialValues(post));
  const [tagsText, setTagsText] = useState(() => post?.tags.join(', ') ?? '');
  const [photos, setPhotos] = useState<Photo[]>(() => [
    ...(post?.cover_image_url ? [{ url: post.cover_image_url }] : []),
    ...(post?.gallery ?? []).map((url) => ({ url })),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    if (photos.length + incoming.length > 5) {
      setError('সর্বোচ্চ ৫টি ছবি যোগ করা যাবে।');
      return;
    }
    const invalid = incoming.find((file) =>
      !file.type.startsWith('image/') || file.size === 0 || file.size > 5 * 1024 * 1024
    );
    if (invalid) {
      setError('ছবি JPG, PNG, WebP বা AVIF হতে হবে এবং ৫MB-এর মধ্যে হতে হবে।');
      return;
    }
    setError('');
    setPhotos((current) => [...current, ...incoming.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }))]);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (values.titleBn.trim().length < 8) {
      setError('শিরোনাম কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    const minimumBodyLength = kind === 'news' ? 40 : kind === 'job' ? 20 : 10;
    if (values.bodyBn.trim().length < minimumBodyLength) {
      setError(
        kind === 'news'
          ? 'সংবাদের মূল বিষয়বস্তু কমপক্ষে ৪০ অক্ষরের হতে হবে।'
          : kind === 'job'
            ? 'কাজের বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে।'
            : 'পণ্যের বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে।'
      );
      return;
    }
    if (values.summaryBn.trim() && values.summaryBn.trim().length < 20) {
      setError('সংক্ষিপ্ত বিবরণ কমপক্ষে ২০ অক্ষরের হলে ভালো হয়।');
      return;
    }
    if (kind === 'buy_sell' && photos.length === 0) {
      setError('পণ্যের অন্তত একটি ছবি দিন।');
      return;
    }
    if (kind === 'buy_sell' && !/^01[3-9]\d{8}$/.test(normalizeBdPhone(values.authorPhone))) {
      setError('সঠিক বিক্রেতার মোবাইল নম্বর দিন।');
      return;
    }
    if (
      kind === 'job' &&
      values.salaryMin.trim() &&
      values.salaryMax.trim() &&
      Number(values.salaryMax) < Number(values.salaryMin)
    ) {
      setError('সর্বোচ্চ বেতন সর্বনিম্ন বেতনের চেয়ে কম হতে পারবে না।');
      return;
    }

    setBusy(true);
    try {
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        if (!photo.file) {
          uploadedUrls.push(photo.url);
          continue;
        }
        const result = await uploadPostImage(adminId, photo.file);
        if (!result.success) {
          setError(result.error);
          return;
        }
        uploadedUrls.push(result.data);
      }

      const input: AdminPostInput = {
        kind,
        ...values,
        tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        coverImageUrl: uploadedUrls[0] ?? '',
        gallery: uploadedUrls.slice(1),
      };
      const result = post
        ? await updateAdminPost(post.id, input)
        : await createAdminPost(input);
      if (!result.ok) {
        setError(result.error);
        notify('error', 'সংরক্ষণ ব্যর্থ হয়েছে', result.error);
        return;
      }
      notify('success', result.message ?? 'পোস্ট সংরক্ষণ হয়েছে');
      router.push(`/admin/posts/${'postId' in result && result.postId ? result.postId : post?.id}`);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'পোস্ট সংরক্ষণ করা যায়নি।';
      setError(message);
      notify('error', 'সংরক্ষণ ব্যর্থ হয়েছে', message);
    } finally {
      setBusy(false);
    }
  };

  const categoryOptions =
    kind === 'news' ? NEWS_CATEGORIES : kind === 'buy_sell' ? MARKET_CATEGORIES : [];
  const selectedLegacyCategory = Boolean(
    post &&
    values.category &&
    !categoryOptions.some((item) => item.id === values.category)
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={post ? `/admin/posts/${post.id}` : '/admin/posts'}
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-admin-muted hover:bg-white hover:text-admin-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ফিরে যান
        </Link>
        <Button type="submit" isLoading={busy} disabled={busy}>
          {post ? 'পরিবর্তন সংরক্ষণ' : 'পোস্ট তৈরি করুন'}
        </Button>
      </div>

      {post?.status === 'rejected' && post.rejection_reason && (
        <div className="rounded-admin-card border border-status-warning/30 bg-status-warning/5 p-4">
          <p className="text-xs font-semibold text-admin-text">বর্তমান প্রত্যাখ্যানের কারণ</p>
          <p className="mt-1 break-words text-sm text-admin-muted">{post.rejection_reason}</p>
          <p className="mt-2 text-xs text-admin-muted">
            বিষয়বস্তু সম্পাদনা করলে বর্তমান স্ট্যাটাস অপরিবর্তিত থাকবে; পুনরায় পর্যালোচনার জন্য আলাদাভাবে অপেক্ষমাণ করুন।
          </p>
        </div>
      )}

      <section className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
        <h2 className="text-sm font-bold text-admin-text">মূল তথ্য</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-semibold text-admin-text">
            পোস্টের ধরন
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as PostKind)}
              disabled={Boolean(post) || lockKind}
              className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm font-normal disabled:bg-admin-page"
            >
              {(['news', 'job', 'buy_sell'] as const).map((value) => (
                <option key={value} value={value}>{KIND_LABEL[value]}</option>
              ))}
            </select>
          </label>
          <Input
            label="শিরোনাম"
            value={values.titleBn}
            onChange={(event) => set('titleBn', event.target.value)}
            required
            maxLength={180}
            helperText="কমপক্ষে ৮ অক্ষর"
          />
          {kind === 'job' ? (
            <Input
              label="চাকরির ক্যাটাগরি (ঐচ্ছিক)"
              value={values.category}
              onChange={(event) => set('category', event.target.value)}
              maxLength={100}
              helperText="যেমন: শিক্ষা, বিক্রয়, অফিস"
            />
          ) : (
            <label className="block space-y-1.5 text-sm font-semibold text-admin-text">
              ক্যাটাগরি
              <select
                value={values.category}
                onChange={(event) => set('category', event.target.value)}
                required={kind === 'buy_sell'}
                className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm font-normal"
              >
                <option value="">ক্যাটাগরি বেছে নিন</option>
                {selectedLegacyCategory && (
                  <option value={values.category}>{values.category} (বর্তমান)</option>
                )}
                {categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.labelBn}</option>
                ))}
              </select>
            </label>
          )}
          <Input
            label="এলাকা"
            value={values.areaId}
            onChange={(event) => set('areaId', event.target.value)}
            maxLength={120}
            helperText="প্রযোজ্য হলে এলাকার নাম লিখুন"
          />
          <div className="sm:col-span-2">
            <Textarea
              label="সংক্ষিপ্ত বিবরণ"
              value={values.summaryBn}
              onChange={(event) => set('summaryBn', event.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label={kind === 'news' ? 'সংবাদের বিবরণ' : kind === 'job' ? 'কাজের বিবরণ' : 'পণ্যের বিবরণ'}
              value={values.bodyBn}
              onChange={(event) => set('bodyBn', event.target.value)}
              rows={7}
              maxLength={12000}
              required
              helperText={kind === 'job'
                ? 'বিবরণ, যোগ্যতা/অভিজ্ঞতা, কোথায় আবেদন করবেন ও নির্দেশনা শুধু সরবরাহকৃত তথ্যের ভিত্তিতে লিখুন।'
                : kind === 'news'
                  ? 'সংবাদ প্রতিবেদনটি লিখুন; লেখক/সূত্রের নাম আলাদা ঐচ্ছিক ঘরে যোগ করা যাবে।'
                  : 'পণ্যের বাস্তব অবস্থা ও বর্ণনা লিখুন; না জানা তথ্য বা দর-কষাকষির দাবি যোগ করবেন না।'}
            />
          </div>
          <Input
            label="ট্যাগ"
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            maxLength={500}
            helperText="কমা দিয়ে আলাদা করুন"
          />
        </div>
      </section>

      {kind === 'job' && (
        <section className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
          <h2 className="text-sm font-bold text-admin-text">চাকরির তথ্য</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="প্রতিষ্ঠান"
              value={values.organizationBn}
              onChange={(event) => set('organizationBn', event.target.value)}
              required
              maxLength={160}
            />
            <label className="block space-y-1.5 text-sm font-semibold text-admin-text">
              চাকরির ধরন
              <select
                value={values.jobType}
                onChange={(event) => set('jobType', event.target.value)}
                required
                className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm font-normal"
              >
                <option value="">ধরন বেছে নিন</option>
                {JOB_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.labelBn}</option>
                ))}
                {post?.job_type && !JOB_TYPES.some((item) => item.id === post.job_type) && (
                  <option value={post.job_type}>{post.job_type} (বর্তমান)</option>
                )}
              </select>
            </label>
            <Input label="সর্বনিম্ন বেতন (ঐচ্ছিক)" type="number" min="0" step="1" value={values.salaryMin} onChange={(event) => set('salaryMin', event.target.value)} />
            <Input label="সর্বোচ্চ বেতন (ঐচ্ছিক)" type="number" min="0" step="1" value={values.salaryMax} onChange={(event) => set('salaryMax', event.target.value)} />
            <Input label="আবেদনের শেষ তারিখ (ঐচ্ছিক)" type="date" value={values.deadline} onChange={(event) => set('deadline', event.target.value)} />
          </div>
        </section>
      )}

      {kind === 'news' && (
        <section className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
          <h2 className="text-sm font-bold text-admin-text">লেখক / সূত্র</h2>
          <p className="mt-1 text-xs text-admin-muted">শুধু সরবরাহ করা ও যাচাই করা নাম/সূত্র লিখুন; কোনো পরিচয় বা প্রকাশনা নিজে থেকে অনুমান করবেন না।</p>
          <div className="mt-4 max-w-xl">
            <Input
              label="লেখক বা সংবাদসূত্র (ঐচ্ছিক)"
              value={values.authorName}
              onChange={(event) => set('authorName', event.target.value)}
              maxLength={120}
            />
          </div>
        </section>
      )}

      {kind === 'buy_sell' && (
        <section className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
          <h2 className="text-sm font-bold text-admin-text">বিক্রেতা ও পণ্যের তথ্য</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="বিক্রেতার নাম" value={values.authorName} onChange={(event) => set('authorName', event.target.value)} required maxLength={120} />
            <Input label="যোগাযোগ নম্বর" type="tel" value={values.authorPhone} onChange={(event) => set('authorPhone', event.target.value)} required maxLength={30} />
            <Input label="হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)" type="tel" value={values.whatsappNumber} onChange={(event) => set('whatsappNumber', event.target.value)} maxLength={30} />
            <Input label="দাম (৳)" type="number" min="0" step="1" value={values.price} onChange={(event) => set('price', event.target.value)} required />
            <label className="block space-y-1.5 text-sm font-semibold text-admin-text">
              পণ্যের অবস্থা
              <select
                value={values.conditionLabel}
                onChange={(event) => set('conditionLabel', event.target.value)}
                required
                className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm font-normal"
              >
                <option value="">অবস্থা বেছে নিন</option>
                {MARKET_CONDITIONS.map((item) => (
                  <option key={item.id} value={item.id}>{item.labelBn}</option>
                ))}
                {post?.condition_label &&
                  !MARKET_CONDITIONS.some((item) => item.id === post.condition_label) && (
                    <option value={post.condition_label}>{post.condition_label} (বর্তমান)</option>
                  )}
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:p-5">
        <h2 className="text-sm font-bold text-admin-text">ছবি</h2>
        <p className="mt-1 text-xs text-admin-muted">
          বিদ্যমান `posts` স্টোরেজ বাকেট ব্যবহার হবে; সর্বোচ্চ ৫টি ছবি, প্রতিটি ৫MB পর্যন্ত।
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={`${photo.url}-${index}`} className="flex max-w-full items-center gap-2 rounded-md border border-admin-border bg-admin-page px-3 py-2 text-xs">
              <a href={photo.url} target="_blank" rel="noreferrer" className="max-w-48 truncate text-admin-navy underline">
                {photo.file?.name ?? `ছবি ${index + 1}`}
              </a>
              <button
                type="button"
                aria-label={`ছবি ${index + 1} সরান`}
                onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                className="flex h-8 w-8 items-center justify-center rounded-md text-admin-muted hover:bg-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-admin-border px-3 text-xs font-semibold text-admin-muted hover:bg-admin-page">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              ছবি যোগ করুন
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          )}
        </div>
      </section>


      {error && (
        <p role="alert" className="rounded-md border border-status-danger/30 bg-status-danger/5 p-3 text-sm text-status-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" isLoading={busy} disabled={busy}>
          {post ? 'পরিবর্তন সংরক্ষণ' : 'পোস্ট তৈরি করুন'}
        </Button>
      </div>
    </form>
  );
}
