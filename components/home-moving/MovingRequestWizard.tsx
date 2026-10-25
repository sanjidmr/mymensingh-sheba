'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Lock, Send, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { validateMovingRoute } from '@/lib/locations';
import LocationSelectInput from '@/components/LocationSelectInput';
import { uploadRequestAttachment } from '@/lib/home-moving-service';
import {
  HOME_MOVING_FLOOR_OPTIONS,
} from '@/lib/home-moving-types';
import { normalizeBdPhone } from '@/lib/catalog-service';
import { trackFormSubmit } from '@/lib/site-analytics';

const FIELD_CLASS =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:text-sm';
const LABEL_CLASS = 'mb-1.5 block text-[13px] font-bold text-slate-700';

export default function MovingRequestWizard() {
  const { user, createServiceRequest } = useAuth();
  const [pickupAreaId, setPickupAreaId] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAreaId, setDestinationAreaId] = useState<string | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [items, setItems] = useState('');
  const [pickupFloor, setPickupFloor] = useState('');
  const [destinationFloor, setDestinationFloor] = useState('');
  const [hasLift, setHasLift] = useState(false);
  const [parkingInfo, setParkingInfo] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReference, setRequestReference] = useState('');

  const clearFieldError = (name: string) => {
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('শুধুমাত্র ছবির ফাইল সংযুক্ত করা যাবে।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ছবির সাইজ ৫MB এর কম হতে হবে।');
      return;
    }
    if (!user) {
      setError('ছবি আপলোড করতে অ্যাকাউন্টে লগইন করুন।');
      return;
    }

    setUploadingPhoto(true);
    setError('');
    try {
      const result = await uploadRequestAttachment(user.id, file);
      if (!result.success || !result.url) {
        setError(result.error || 'ছবি সংযুক্ত করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setPhotoUrl(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ছবি সংযুক্ত করা যায়নি।');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const nextErrors: Record<string, string> = {};
    const contactNameValue = contactName;
    const contactPhoneValue = contactPhone;
    const latinPhone = contactPhoneValue.replace(/[০-৯]/g, (digit) =>
      String('০১২৩৪৫৬৭৮৯'.indexOf(digit))
    );
    const normalizedPhone = normalizeBdPhone(latinPhone);

    if (!pickupAreaId || !destinationAreaId) {
      if (!pickupAreaId) nextErrors.pickupArea = 'পিকআপ এলাকা নির্বাচন করুন।';
      if (!destinationAreaId) nextErrors.destinationArea = 'গন্তব্য এলাকা নির্বাচন করুন।';
    }
    if (pickupAreaId && destinationAreaId && !validateMovingRoute(pickupAreaId, destinationAreaId).valid) {
      nextErrors.destinationArea = 'পিকআপ ও গন্তব্যের জন্য আলাদা, সঠিক এলাকা নির্বাচন করুন।';
    }
    if (!pickupAddress.trim()) nextErrors.pickupAddress = 'পিকআপ বাসার বিস্তারিত ঠিকানা লিখুন।';
    if (!destinationAddress.trim()) nextErrors.destinationAddress = 'গন্তব্য বাসার বিস্তারিত ঠিকানা লিখুন।';
    if (!preferredDate) nextErrors.preferredDate = 'শিফটিংয়ের তারিখ নির্বাচন করুন।';
    if (!preferredTime.trim()) nextErrors.preferredTime = 'পছন্দের সময় লিখুন।';
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (preferredDate && preferredDate < today) nextErrors.preferredDate = 'শিফটিংয়ের তারিখ আজ বা ভবিষ্যতের হতে হবে।';
    if (!items.trim()) nextErrors.items = 'কোন মালামাল সরাতে হবে তা লিখুন।';
    if (!pickupFloor) nextErrors.pickupFloor = 'পিকআপ বাসার তলা নির্বাচন করুন।';
    if (!destinationFloor) nextErrors.destinationFloor = 'গন্তব্য বাসার তলা নির্বাচন করুন।';
    if (contactNameValue.trim().length < 3) nextErrors.contactName = 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে।';
    if (!normalizedPhone || !/^01[3-9]\d{8}$/.test(normalizedPhone)) nextErrors.contactPhone = 'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('চিহ্নিত তথ্যগুলো ঠিক করে আবার জমা দিন।');
      return;
    }
    if (!user) {
      setError('অনুরোধ পাঠাতে লগইন করুন।');
      return;
    }
    const pickupId = typeof pickupAreaId === 'string' ? pickupAreaId : '';
    const destinationId = typeof destinationAreaId === 'string' ? destinationAreaId : '';
    if (!pickupId || !destinationId || !preferredDate) {
      setError('চিহ্নিত তথ্যগুলো ঠিক করে আবার জমা দিন।');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createServiceRequest({
        serviceSlug: 'home-moving',
        contactName: contactNameValue.trim(),
        contactPhone: normalizedPhone || '',
        pickupAreaId: pickupId,
        destinationAreaId: destinationId,
        pickupAddress: pickupAddress.trim(),
        destinationAddress: destinationAddress.trim(),
        preferredDate,
        preferredTime,
        movingItems: [{ id: 'custom', labelBn: items.trim() }],
        pickupFloor,
        destinationFloor,
        hasLift,
        parkingInfo: parkingInfo.trim() || undefined,
        details: description.trim() || undefined,
        photoUrls: photoUrl ? [photoUrl] : [],
        areaId: pickupId,
        addressLine: pickupAddress.trim(),
      });

      if (!result.success) {
        setError(result.error || 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setRequestReference(result.referenceCode || '');
      trackFormSubmit({ ctaType: 'home_moving_request', category: 'home-moving' });
      setRequestSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (requestSent) {
    return (
      <section className="rounded-2xl border border-brand-200 bg-white p-6 text-center sm:p-8" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-700" aria-hidden="true" />
        <h3 className="mt-3 text-xl font-extrabold text-slate-900">আপনার অনুরোধ পাঠানো হয়েছে</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
          অনুরোধটি অ্যাডমিন টিমের তালিকায় জমা হয়েছে। তারা তথ্য যাচাই করে খরচ ও সময় চূড়ান্ত করতে আপনার সঙ্গে যোগাযোগ করবেন।
        </p>
        {requestReference && (
          <p className="mx-auto mt-3 inline-flex rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-800">
            রেফারেন্স নম্বর: {requestReference}
          </p>
        )}
        <Link href="/profile/requests" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">
          আমার অনুরোধ দেখুন
        </Link>
      </section>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
        <Lock className="mx-auto h-9 w-9 text-slate-500" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-extrabold text-slate-900">অনুরোধ পাঠাতে লগইন করুন</h3>
        <p className="mx-auto mt-1 max-w-lg text-sm leading-relaxed text-slate-600">
          আপনার ঠিকানা ও যোগাযোগের তথ্য গোপন রেখে অনুরোধটি অ্যাডমিন টিমের কাছে পাঠানো হবে।
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/login?redirect=/home-moving" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">
            লগইন করুন
          </Link>
          <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 px-5 text-sm font-bold text-brand-800 hover:bg-brand-50">
            অ্যাকাউন্ট খুলুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">১. পিকআপ ও গন্তব্য</legend>
        <div className="space-y-3">
          <LocationSelectInput value={pickupAreaId} onChange={(value) => { setPickupAreaId(value); clearFieldError('pickupArea'); }} placeholder="পিকআপ এলাকা বেছে নিন" label="পিকআপ এলাকা *" />
          {fieldErrors.pickupArea && <FieldError>{fieldErrors.pickupArea}</FieldError>}
          <div>
            <label htmlFor="moving-pickup-address" className={LABEL_CLASS}>পিকআপ বাসার বিস্তারিত ঠিকানা *</label>
            <input id="moving-pickup-address" value={pickupAddress} onChange={(event) => { setPickupAddress(event.target.value); clearFieldError('pickupAddress'); }} placeholder="এলাকা, রোড ও বাসা নম্বর" className={`${FIELD_CLASS} ${fieldErrors.pickupAddress ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.pickupAddress)} required />
            {fieldErrors.pickupAddress && <FieldError>{fieldErrors.pickupAddress}</FieldError>}
          </div>
        </div>
        <div className="space-y-3">
          <LocationSelectInput value={destinationAreaId} onChange={(value) => { setDestinationAreaId(value); clearFieldError('destinationArea'); }} placeholder="গন্তব্য এলাকা বেছে নিন" label="গন্তব্য এলাকা *" />
          {fieldErrors.destinationArea && <FieldError>{fieldErrors.destinationArea}</FieldError>}
          <div>
            <label htmlFor="moving-destination-address" className={LABEL_CLASS}>গন্তব্য বাসার বিস্তারিত ঠিকানা *</label>
            <input id="moving-destination-address" value={destinationAddress} onChange={(event) => { setDestinationAddress(event.target.value); clearFieldError('destinationAddress'); }} placeholder="এলাকা, রোড ও বাসা নম্বর" className={`${FIELD_CLASS} ${fieldErrors.destinationAddress ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.destinationAddress)} required />
            {fieldErrors.destinationAddress && <FieldError>{fieldErrors.destinationAddress}</FieldError>}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">২. তারিখ, সময় ও মালামাল</legend>
        <div>
          <label htmlFor="moving-date" className={LABEL_CLASS}>শিফটিংয়ের সম্ভাব্য তারিখ *</label>
          <input id="moving-date" type="date" min={new Date().toISOString().slice(0, 10)} value={preferredDate} onChange={(event) => { setPreferredDate(event.target.value); clearFieldError('preferredDate'); }} className={`${FIELD_CLASS} ${fieldErrors.preferredDate ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.preferredDate)} required />
          <button type="button" onClick={() => { const today = new Date(); setPreferredDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`); clearFieldError('preferredDate'); }} className="mt-1.5 min-h-9 rounded-lg border border-brand-200 px-3 text-xs font-bold text-brand-800 hover:bg-brand-50">
            আজকেই
          </button>
          {fieldErrors.preferredDate && <FieldError>{fieldErrors.preferredDate}</FieldError>}
        </div>
        <div>
          <label htmlFor="moving-time" className={LABEL_CLASS}>পছন্দের সময় *</label>
          <input id="moving-time" value={preferredTime} onChange={(event) => { setPreferredTime(event.target.value); clearFieldError('preferredTime'); }} placeholder="যেমন: সকাল ১০টা অথবা দুপুরের পর" className={`${FIELD_CLASS} ${fieldErrors.preferredTime ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.preferredTime)} required />
          {fieldErrors.preferredTime && <FieldError>{fieldErrors.preferredTime}</FieldError>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="moving-items" className={LABEL_CLASS}>সরানোর মালামালের তালিকা *</label>
          <textarea id="moving-items" value={items} onChange={(event) => { setItems(event.target.value); clearFieldError('items'); }} placeholder="যেমন: ২টি খাট, আলমারি, ফ্রিজ, ৪টি চেয়ার..." rows={4} className={`${FIELD_CLASS} resize-y ${fieldErrors.items ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.items)} required />
          {fieldErrors.items && <FieldError>{fieldErrors.items}</FieldError>}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">৩. বাসা ও প্রবেশপথের তথ্য</legend>
        <div>
          <label htmlFor="moving-pickup-floor" className={LABEL_CLASS}>পিকআপ বাসার তলা *</label>
          <select id="moving-pickup-floor" value={pickupFloor} onChange={(event) => { setPickupFloor(event.target.value); clearFieldError('pickupFloor'); }} className={`${FIELD_CLASS} ${fieldErrors.pickupFloor ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.pickupFloor)} required>
            <option value="">তলা বেছে নিন</option>
            {HOME_MOVING_FLOOR_OPTIONS.map((floor) => <option key={floor.id} value={floor.id}>{floor.labelBn}</option>)}
          </select>
          {fieldErrors.pickupFloor && <FieldError>{fieldErrors.pickupFloor}</FieldError>}
        </div>
        <div>
          <label htmlFor="moving-destination-floor" className={LABEL_CLASS}>গন্তব্য বাসার তলা *</label>
          <select id="moving-destination-floor" value={destinationFloor} onChange={(event) => { setDestinationFloor(event.target.value); clearFieldError('destinationFloor'); }} className={`${FIELD_CLASS} ${fieldErrors.destinationFloor ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.destinationFloor)} required>
            <option value="">তলা বেছে নিন</option>
            {HOME_MOVING_FLOOR_OPTIONS.map((floor) => <option key={floor.id} value={floor.id}>{floor.labelBn}</option>)}
          </select>
          {fieldErrors.destinationFloor && <FieldError>{fieldErrors.destinationFloor}</FieldError>}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={hasLift} onChange={(event) => setHasLift(event.target.checked)} className="h-4 w-4 accent-brand-700" />
          পিকআপ ভবনে লিফট আছে
        </label>
        <div>
          <label htmlFor="moving-parking" className={LABEL_CLASS}>গাড়ি পার্কিং / প্রবেশের তথ্য</label>
          <input id="moving-parking" value={parkingInfo} onChange={(event) => setParkingInfo(event.target.value)} placeholder="ঐচ্ছিক" className={FIELD_CLASS} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">৪. যোগাযোগ ও অতিরিক্ত তথ্য</legend>
        <div>
          <label htmlFor="moving-contact-name" className={LABEL_CLASS}>আপনার নাম *</label>
          <input id="moving-contact-name" name="contactName" value={contactName} onChange={(event) => { setContactName(event.target.value); clearFieldError('contactName'); }} className={`${FIELD_CLASS} ${fieldErrors.contactName ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.contactName)} autoComplete="off" required />
          {fieldErrors.contactName && <FieldError>{fieldErrors.contactName}</FieldError>}
        </div>
        <div>
          <label htmlFor="moving-contact-phone" className={LABEL_CLASS}>মোবাইল নম্বর *</label>
          <input id="moving-contact-phone" name="contactPhone" type="tel" inputMode="tel" value={contactPhone} onChange={(event) => { setContactPhone(event.target.value); clearFieldError('contactPhone'); }} className={`${FIELD_CLASS} ${fieldErrors.contactPhone ? 'border-rose-500' : ''}`} aria-invalid={Boolean(fieldErrors.contactPhone)} autoComplete="off" required />
          {fieldErrors.contactPhone && <FieldError>{fieldErrors.contactPhone}</FieldError>}
        </div>
        <div>
          <label htmlFor="moving-description" className={LABEL_CLASS}>আরও কিছু জানাতে চান?</label>
          <textarea id="moving-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="বিশেষ বা ভঙ্গুর মালামাল, সিঁড়ি বা অন্য কোনো প্রয়োজন লিখুন" className={FIELD_CLASS} />
        </div>
        <div>
          <label htmlFor="moving-photo" className={LABEL_CLASS}>মালামালের ছবি (ঐচ্ছিক)</label>
          <input id="moving-photo" type="file" accept="image/*" onChange={(event) => void handlePhoto(event.target.files?.[0])} className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:font-bold file:text-brand-800" />
          <p className="mt-1 text-xs text-slate-500">{uploadingPhoto ? 'ছবি আপলোড হচ্ছে…' : photoUrl ? 'ছবি অনুরোধের সঙ্গে যুক্ত হয়েছে।' : 'সর্বোচ্চ ৫MB; ছবিটি শুধু অনুরোধ সামলাতে ব্যবহার হবে।'}</p>
        </div>
      </fieldset>

      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-slate-500">আপনার ঠিকানা ও ফোন নম্বর শুধু অনুরোধ পরিচালনার জন্য ব্যবহৃত হবে।</p>
        <button type="submit" disabled={submitting || uploadingPhoto} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-7 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {submitting ? 'পাঠানো হচ্ছে…' : 'বাসা পাল্টানোর অনুরোধ পাঠান'}
        </button>
      </div>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="mt-1 text-xs font-semibold text-rose-700">{children}</p>;
}
