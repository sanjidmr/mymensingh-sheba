'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Send,
  CheckCircle2,
  Loader2,
  Camera,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  Home,
  CalendarDays,
  Package,
  Building2,
  MessageSquare,
  User,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllMCCAreas, validateMovingRoute } from '@/lib/locations';
import LocationSelectInput from '@/components/LocationSelectInput';
import { uploadRequestAttachment } from '@/lib/home-moving-service';
import {
  HOME_MOVING_ITEMS,
  HOME_MOVING_FLOOR_OPTIONS,
  HOME_MOVING_TIME_SLOTS,
} from '@/lib/home-moving-types';
import type { HomeMovingItem } from '@/lib/home-moving-types';

const STEP_LABELS = [
  'কোথা থেকে',
  'কোথায় যাবেন',
  'তারিখ ও সময়',
  'মালামাল',
  'বাসার তথ্য',
  'অতিরিক্ত তথ্য',
  'যোগাযোগ ও জমা',
];

export default function MovingRequestWizard() {
  const { user, createServiceRequest } = useAuth();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1: From
  const [pickupAreaId, setPickupAreaId] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  // Step 2: To
  const [destinationAreaId, setDestinationAreaId] = useState<string | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  // Step 3: Date & time
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  // Step 4: Items
  const [items, setItems] = useState<HomeMovingItem[]>([]);
  // Step 5: House details
  const [pickupFloor, setPickupFloor] = useState('');
  const [destinationFloor, setDestinationFloor] = useState('');
  const [hasLift, setHasLift] = useState(false);
  const [parkingInfo, setParkingInfo] = useState('');
  // Step 6: Extra
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  // Step 7: Contact
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  const areas = getAllMCCAreas({ activeOnly: true });

  const route = validateMovingRoute(pickupAreaId || '', destinationAreaId || '');

  const toggleItem = (itemId: string, labelBn: string, allowQuantity: boolean) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === itemId);
      if (exists) {
        return prev.filter((i) => i.id !== itemId);
      }
      return [...prev, { id: itemId, labelBn, quantity: allowQuantity ? 1 : undefined }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const next = Math.max(1, Math.min(50, (i.quantity || 1) + delta));
        return { ...i, quantity: next };
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handlePhoto = async (file?: File) => {
    if (!file) {
      setPhotoUrl('');
      return;
    }
    if (!user) {
      setError('ছবি আপলোড করতে অ্যাকাউন্টে লগইন করুন।');
      return;
    }
    setUploadingPhoto(true);
    setError('');
    const res = await uploadRequestAttachment(user.id, file);
    setUploadingPhoto(false);
    if (res.success && res.url) setPhotoUrl(res.url);
    else setError(res.error || 'ছবি সংযুক্ত করতে ব্যর্থ হয়েছে।');
  };

  const validateStep = (): string => {
    switch (step) {
      case 0:
        if (!pickupAreaId) return 'কোথা থেকে শিফটিং হবে — পিকআপ এলাকা বেছে নিন।';
        if (!pickupAddress.trim()) return 'পিকআপ বাসার বিস্তারিত ঠিকানা দিন।';
        return '';
      case 1:
        if (!destinationAreaId) return 'কোথায় যাবেন — গন্তব্য এলাকা বেছে নিন।';
        if (!destinationAddress.trim()) return 'গন্তব্য বাসার বিস্তারিত ঠিকানা দিন।';
        if (pickupAreaId === destinationAreaId)
          return 'পিকআপ ও গন্তব্য এলাকা একই। সঠিক গন্তব্য নির্বাচন করুন।';
        if (!route.valid) return route.error || 'শিফটিং রুট সঠিক নয়।';
        return '';
      case 2:
        if (!preferredDate) return 'আনুমানিক শিফটিং তারিখ দিন।';
        if (!preferredTime) return 'পছন্দের সময় বেছে নিন।';
        return '';
      case 3:
        if (items.length === 0) return 'কমপক্ষে একটি মালামালের আইটেম বেছে নিন।';
        return '';
      case 4:
        if (!pickupFloor) return 'পিকআপ বাসার তলা নির্বাচন করুন।';
        if (!destinationFloor) return 'গন্তব্য বাসার তলা নির্বাচন করুন।';
        return '';
      case 5:
        return '';
      case 6:
        if (!contactName.trim()) return 'আপনার নাম লিখুন।';
        if (!/^01\d{9}$/.test(contactPhone.replace(/[^\d]/g, '')))
          return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।';
        return '';
      default:
        return '';
    }
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, 6));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    if (!user) return;
    setError('');
    setSubmitting(true);
    await createServiceRequest({
      serviceSlug: 'home-moving',
      contactName: contactName.trim(),
      contactPhone: contactPhone.replace(/[^\d]/g, ''),
      pickupAreaId: pickupAreaId || '',
      destinationAreaId: destinationAreaId || '',
      pickupAddress: pickupAddress.trim(),
      destinationAddress: destinationAddress.trim(),
      preferredDate: preferredDate || undefined,
      preferredTime,
      movingItems: items,
      pickupFloor,
      destinationFloor,
      hasLift,
      parkingInfo: parkingInfo.trim() || undefined,
      details: description.trim() || undefined,
      photoUrls: photoUrl ? [photoUrl] : [],
      areaId: pickupAreaId || '',
      addressLine: pickupAddress.trim(),
    });
    setSubmitting(false);
    setRequestSent(true);
  };

  const pickedItemsCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  if (requestSent) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-700" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          আপনার Moving Request পাঠানো হয়েছে!
        </h3>
        <p className="text-sm text-slate-600 mb-1">
          আপনার রিকোয়েস্টটি রেকর্ড হয়েছে এবং আমার রিকোয়েস্ট তালিকায় দেখতে পাবেন।
        </p>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          অ্যাডমিন টিম রিকোয়েস্টটি পর্যালোচনা করে শিফটিং খরচের আনুমানিক হিসাব ও সময় চূড়ান্ত করতে
          আপনার সাথে যোগাযোগ করবে।
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/profile/requests"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
          >
            আমার রিকোয়েস্ট দেখুন
          </Link>
          <button
            type="button"
            onClick={() => {
              setRequestSent(false);
              setStep(0);
              setItems([]);
              setDescription('');
              setPhotoUrl('');
              setPreferredDate('');
              setPreferredTime('');
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            আরেকটি রিকোয়েস্ট
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">অ্যাকাউন্টে লগইন প্রয়োজন</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          বাসা পাল্টানোর রিকোয়েস্ট পাঠাতে আপনার অ্যাকাউন্টে লগইন করুন। আপনার ফোন ও বাসার ঠিকানা
          সম্পূর্ণ গোপন রাখা হবে।
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/login?redirect=/home-moving"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
          >
            লগইন করুন
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-800 text-emerald-800 text-sm font-semibold hover:bg-emerald-50"
          >
            অ্যাকাউন্ট খুলুন
          </Link>
        </div>
      </div>
    );
  }

  const stepIcons = [MapPin, Home, CalendarDays, Package, Building2, MessageSquare, User];

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800">
            ধাপ {step + 1} / 7 — {STEP_LABELS[step]}
          </span>
          <span className="text-[11px] text-slate-400">{Math.round(((step + 1) / 7) * 100)}%</span>
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((_, i) => {
            const StepIcon = stepIcons[i];
            return (
              <div key={i} className="flex-1">
                <div
                  className={`w-full h-1 rounded-full transition-colors ${
                    i <= step ? 'bg-emerald-700' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`mt-1.5 flex flex-col items-center gap-0.5 ${
                    i === step ? 'text-emerald-800' : i < step ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  {i < step ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[9px] font-semibold leading-none">{STEP_LABELS[i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Step content */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">বর্তমান বাসা (পিকআপ)</h3>
          </div>
          <LocationSelectInput
            value={pickupAreaId}
            onChange={(id) => setPickupAreaId(id)}
            placeholder="কোথা থেকে শিফটিং হবে?"
            label="পিকআপ এলাকা *"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পিকআপ বাসার বিস্তারিত ঠিকানা *
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="যেমন: চরপাড়া, নাহার মেমোরিয়াল রোড, বাসা ১২"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">গন্তব্য বাসা (যেখানে যাবেন)</h3>
          </div>
          <LocationSelectInput
            value={destinationAreaId}
            onChange={(id) => setDestinationAreaId(id)}
            placeholder="কোথায় যাবেন?"
            label="গন্তব্য এলাকা *"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গন্তব্য বাসার বিস্তারিত ঠিকানা *
            </label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="যেমন: কাঁচিঝুলি, জিলা স্কুল রোড, ভবন 8/ক"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশনের (MCC) অভ্যন্তরের এলাকায় শিফটিং সেবা দেওয়া হয়।
              <strong> পিকআপ:</strong>{' '}
              {route.pickup?.nameBn || 'নির্বাচন করা হয়নি'}{' '}
              <strong>→ গন্তব্য:</strong>{' '}
              {route.destination?.nameBn || 'নির্বাচন করা হয়নি'}
            </span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">প্রত্যাশিত শিফটিং সময়</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              আনুমানিক তারিখ *
            </label>
            <input
              type="date"
              value={preferredDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              পছন্দের সময় *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {HOME_MOVING_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPreferredTime(slot)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                    preferredTime === slot
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{slot}</span>
                  {preferredTime === slot && <Check className="w-4 h-4 text-emerald-700" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">কোন মালামাল স্থানান্তর করবেন?</h3>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            একাধিক নির্বাচন করুন। পরিমাণ বাড়ানো-কমানো যাবে।
          </p>
          <div className="grid grid-cols-1 gap-2">
            {HOME_MOVING_ITEMS.map((opt) => {
              const selected = items.find((i) => i.id === opt.id);
              return (
                <div
                  key={opt.id}
                  className={`rounded-xl border p-3 transition-all ${
                    selected
                      ? 'border-emerald-700 bg-emerald-50/40'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleItem(opt.id, opt.labelBn, opt.allowQuantity)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          selected ? 'bg-emerald-700 border-emerald-700' : 'border-slate-300'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{opt.labelBn}</span>
                    </button>
                    {selected && opt.allowQuantity && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(opt.id, -1)}
                          className="w-8 h-8 rounded-lg border border-slate-300 text-lg text-slate-600 hover:bg-slate-100"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-6 text-center">
                          {selected.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(opt.id, 1)}
                          className="w-8 h-8 rounded-lg border border-slate-300 text-lg text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(opt.id)}
                          className="ml-1 text-rose-500 hover:text-rose-700 text-xs font-semibold"
                        >
                          বাদ দিন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {items.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold">
              মোট {pickedItemsCount}টি মালামাল নির্বাচিত হয়েছে
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">বাসা সংক্রান্ত তথ্য</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পিকআপ তলা *
              </label>
              <select
                value={pickupFloor}
                onChange={(e) => setPickupFloor(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="">তলা বেছে নিন</option>
                {HOME_MOVING_FLOOR_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.labelBn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গন্তব্য তলা *
              </label>
              <select
                value={destinationFloor}
                onChange={(e) => setDestinationFloor(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="">তলা বেছে নিন</option>
                {HOME_MOVING_FLOOR_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.labelBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-800">লিফট আছে?</div>
              <div className="text-[11px] text-slate-500">
                লিফট না থাকলে শ্রমিক দল সিঁড়ি দিয়ে মালামাল ওঠাবেন
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHasLift((v) => !v)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                hasLift ? 'bg-emerald-700' : 'bg-slate-300'
              }`}
              aria-label="লিফট আছে কিনা"
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  hasLift ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পার্কিং / গাড়ি রাখার জায়গা (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={parkingInfo}
              onChange={(e) => setParkingInfo(e.target.value)}
              placeholder="যেমন: বাসার সামনে ভ্যান রাখার জায়গা আছে"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">অতিরিক্ত তথ্য</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মালামালের বিবরণ বা বিশেষ নির্দেশ (ঐচ্ছিক)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: রান্নাঘরের বড় গ্যাসের চুলা, ৩টি বড় আলমারি, গ্লাসের মালামাল সাবধানে..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              মালামালের ছবি (ঐচ্ছিক)
            </label>
            {photoUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                <img
                  src={photoUrl}
                  alt="মালামালের ছবি"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">ছবি সংযুক্ত হয়েছে</div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="mt-1 text-rose-600 hover:underline"
                  >
                    ছবি বাদ দিন
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-emerald-700 hover:bg-emerald-50/30 transition-all">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-xs text-slate-500 font-semibold">
                  {uploadingPhoto ? 'আপলোড হচ্ছে...' : 'ছবি তুলুন বা আপলোড করুন'}
                </span>
                <span className="text-[10px] text-slate-400">
                  শুধুমাত্র ছবি, সর্বোচ্চ ৫MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">যোগাযোগের তথ্য</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার নাম *</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="আপনার নাম"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নম্বর *
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Summary */}
          <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
            <div className="font-bold text-slate-900 text-sm mb-1">রিকোয়েস্ট সামারি</div>
            <div className="flex items-center justify-between">
              <span>শিফটিং রুট</span>
              <span className="font-semibold text-right">
                {route.pickup?.nameBn} → {route.destination?.nameBn}
              </span>
            </div>
            {items.length > 0 && (
              <div className="flex items-center justify-between">
                <span>মালামাল</span>
                <span className="font-semibold text-right">
                  {items.map((i) => `${i.labelBn}${i.quantity ? ` ×${i.quantity}` : ''}`).join(', ')}
                </span>
              </div>
            )}
            {preferredDate && (
              <div className="flex items-center justify-between">
                <span>তারিখ</span>
                <span className="font-semibold">{preferredDate}</span>
              </div>
            )}
            {preferredTime && (
              <div className="flex items-center justify-between">
                <span>সময়</span>
                <span className="font-semibold">{preferredTime}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
              আপনার ফোন ও ঠিকানা শুধুমাত্র অ্যাডমিন পর্যালোচনার জন্য — প্রকাশ্যে কোনো নম্বর দেখানো হবে না।
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold shadow-xs disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Request Submit করুন
          </button>
        </div>
      )}

      {/* Nav buttons */}
      {step < 6 && (
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              আগে
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className={`flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-xs ${
              step === 0 ? 'flex-1' : 'flex-[2]'
            } bg-emerald-800 hover:bg-emerald-900`}
          >
            এগিয়ে যান
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}