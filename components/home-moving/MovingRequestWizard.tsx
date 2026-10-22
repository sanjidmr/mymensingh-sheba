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
  HOME_MOVING_ITEMS,
  HOME_MOVING_TIME_SLOTS,
} from '@/lib/home-moving-types';
import type { HomeMovingItem } from '@/lib/home-moving-types';
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
  const [items, setItems] = useState<HomeMovingItem[]>([]);
  const [pickupFloor, setPickupFloor] = useState('');
  const [destinationFloor, setDestinationFloor] = useState('');
  const [hasLift, setHasLift] = useState(false);
  const [parkingInfo, setParkingInfo] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const toggleItem = (itemId: string, labelBn: string, allowQuantity: boolean) => {
    setItems((current) => {
      if (current.some((item) => item.id === itemId)) {
        return current.filter((item) => item.id !== itemId);
      }
      return [...current, { id: itemId, labelBn, quantity: allowQuantity ? 1 : undefined }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(1, Math.min(50, quantity)) } : item
      )
    );
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
    const contactNameValue = contactName;
    const contactPhoneValue = contactPhone;
    const latinPhone = contactPhoneValue.replace(/[০-৯]/g, (digit) =>
      String('০১২৩৪৫৬৭৮৯'.indexOf(digit))
    );
    const normalizedPhone = normalizeBdPhone(latinPhone);

    if (!pickupAreaId || !destinationAreaId) {
      setError('পিকআপ ও গন্তব্য—দুই এলাকার ঠিকানা নির্বাচন করুন।');
      return;
    }
    if (!validateMovingRoute(pickupAreaId, destinationAreaId).valid) {
      setError('পিকআপ ও গন্তব্যের জন্য আলাদা, সঠিক এলাকা নির্বাচন করুন।');
      return;
    }
    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      setError('পিকআপ ও গন্তব্য বাসার বিস্তারিত ঠিকানা লিখুন।');
      return;
    }
    if (!preferredDate || !preferredTime) {
      setError('শিফটিংয়ের তারিখ ও পছন্দের সময় নির্বাচন করুন।');
      return;
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (preferredDate < today) {
      setError('শিফটিংয়ের তারিখ আজ বা ভবিষ্যতের হতে হবে।');
      return;
    }
    if (items.length === 0) {
      setError('কমপক্ষে একটি মালামাল নির্বাচন করুন।');
      return;
    }
    if (!pickupFloor || !destinationFloor) {
      setError('পিকআপ ও গন্তব্য বাসার তলা নির্বাচন করুন।');
      return;
    }
    if (contactNameValue.trim().length < 3) {
      setError('আপনার নাম লিখুন।');
      return;
    }
    if (!normalizedPhone || !/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      setError('সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!user) {
      setError('অনুরোধ পাঠাতে লগইন করুন।');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createServiceRequest({
        serviceSlug: 'home-moving',
        contactName: contactNameValue.trim(),
        contactPhone: normalizedPhone,
        pickupAreaId,
        destinationAreaId,
        pickupAddress: pickupAddress.trim(),
        destinationAddress: destinationAddress.trim(),
        preferredDate,
        preferredTime,
        movingItems: items,
        pickupFloor,
        destinationFloor,
        hasLift,
        parkingInfo: parkingInfo.trim() || undefined,
        details: description.trim() || undefined,
        photoUrls: photoUrl ? [photoUrl] : [],
        areaId: pickupAreaId,
        addressLine: pickupAddress.trim(),
      });

      if (!result.success) {
        setError(result.error || 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
        return;
      }
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
          <LocationSelectInput value={pickupAreaId} onChange={setPickupAreaId} placeholder="পিকআপ এলাকা বেছে নিন" label="পিকআপ এলাকা *" />
          <div>
            <label htmlFor="moving-pickup-address" className={LABEL_CLASS}>পিকআপ বাসার বিস্তারিত ঠিকানা *</label>
            <input id="moving-pickup-address" value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} placeholder="এলাকা, রোড ও বাসা নম্বর" className={FIELD_CLASS} required />
          </div>
        </div>
        <div className="space-y-3">
          <LocationSelectInput value={destinationAreaId} onChange={setDestinationAreaId} placeholder="গন্তব্য এলাকা বেছে নিন" label="গন্তব্য এলাকা *" />
          <div>
            <label htmlFor="moving-destination-address" className={LABEL_CLASS}>গন্তব্য বাসার বিস্তারিত ঠিকানা *</label>
            <input id="moving-destination-address" value={destinationAddress} onChange={(event) => setDestinationAddress(event.target.value)} placeholder="এলাকা, রোড ও বাসা নম্বর" className={FIELD_CLASS} required />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">২. তারিখ, সময় ও মালামাল</legend>
        <div>
          <label htmlFor="moving-date" className={LABEL_CLASS}>শিফটিংয়ের সম্ভাব্য তারিখ *</label>
          <input id="moving-date" type="date" min={new Date().toISOString().slice(0, 10)} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className={FIELD_CLASS} required />
        </div>
        <div>
          <label htmlFor="moving-time" className={LABEL_CLASS}>পছন্দের সময় *</label>
          <select id="moving-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className={FIELD_CLASS} required>
            <option value="">সময় বেছে নিন</option>
            {HOME_MOVING_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <span className={LABEL_CLASS}>কোন কোন মালামাল নিতে হবে? *</span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_MOVING_ITEMS.map((option) => {
              const selected = items.some((item) => item.id === option.id);
              const item = items.find((entry) => entry.id === option.id);
              return (
                <label key={option.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={selected} onChange={() => toggleItem(option.id, option.labelBn, option.allowQuantity)} className="h-4 w-4 accent-brand-700" />
                  <span className="flex-1">{option.labelBn}</span>
                  {selected && option.allowQuantity && (
                    <input aria-label={`${option.labelBn} সংখ্যা`} type="number" min={1} max={50} value={item?.quantity ?? 1} onChange={(event) => updateQuantity(option.id, Number(event.target.value))} className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center" />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-2 text-sm font-extrabold text-slate-900">৩. বাসা ও প্রবেশপথের তথ্য</legend>
        <div>
          <label htmlFor="moving-pickup-floor" className={LABEL_CLASS}>পিকআপ বাসার তলা *</label>
          <select id="moving-pickup-floor" value={pickupFloor} onChange={(event) => setPickupFloor(event.target.value)} className={FIELD_CLASS} required>
            <option value="">তলা বেছে নিন</option>
            {HOME_MOVING_FLOOR_OPTIONS.map((floor) => <option key={floor.id} value={floor.id}>{floor.labelBn}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="moving-destination-floor" className={LABEL_CLASS}>গন্তব্য বাসার তলা *</label>
          <select id="moving-destination-floor" value={destinationFloor} onChange={(event) => setDestinationFloor(event.target.value)} className={FIELD_CLASS} required>
            <option value="">তলা বেছে নিন</option>
            {HOME_MOVING_FLOOR_OPTIONS.map((floor) => <option key={floor.id} value={floor.id}>{floor.labelBn}</option>)}
          </select>
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
          <input id="moving-contact-name" name="contactName" value={contactName} onChange={(event) => setContactName(event.target.value)} className={FIELD_CLASS} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="moving-contact-phone" className={LABEL_CLASS}>মোবাইল নম্বর *</label>
          <input id="moving-contact-phone" name="contactPhone" type="tel" inputMode="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className={FIELD_CLASS} autoComplete="off" required />
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
