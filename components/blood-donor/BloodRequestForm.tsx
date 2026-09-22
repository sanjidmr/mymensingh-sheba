'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Loader2,
  UploadCloud,
  FileText,
  Lock,
  Send,
  Hospital,
  User,
  Phone,
  Droplets,
  CalendarClock,
  MapPin,
} from 'lucide-react';
import type { BloodDonorProfile, BloodGroup } from '@/lib/supabase/types';
import { createBloodRequest, uploadBloodPrescription } from '@/lib/blood-donor-service';
import { getAllMCCAreas } from '@/lib/locations';
import { cn } from '@/lib/utils';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AREAS = getAllMCCAreas({ activeOnly: true });

export interface BloodRequestFormProps {
  donor: BloodDonorProfile;
  user: { id?: string; fullName?: string; phone?: string; primaryAreaId?: string } | null;
  onClose: () => void;
}

export function BloodRequestForm({ donor, user, onClose }: BloodRequestFormProps) {
  const [patientName, setPatientName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(donor.bloodGroup);
  const [units, setUnits] = useState(1);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAreaId, setHospitalAreaId] = useState(donor.areaId);
  const [hospitalLocation, setHospitalLocation] = useState('');
  const [requiredDateTime, setRequiredDateTime] = useState('');
  const [areaId, setAreaId] = useState(donor.areaId);
  const [patientInfo, setPatientInfo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok || f.size > 5 * 1024 * 1024) {
      setError('শুধুমাত্র ছবি বা PDF (সর্বোচ্চ ৫MB) ফাইল দেওয়া যাবে।');
      return;
    }
    setFile(f);
    setFileName(f.name);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!patientName.trim()) return setError('রোগী / যোগাযোগকারীর নাম লিখুন।');
    if (!phone.trim()) return setError('আপনার ফোন নম্বর লিখুন।');
    if (!hospitalName.trim()) return setError('হাসপাতাল / ক্লিনিকের নাম লিখুন।');
    if (!hospitalLocation.trim()) return setError('হাসপাতালের সঠিক অবস্থান লিখুন।');
    if (!file) return setError('প্রেসক্রিপশন / ডাক্তারের লিখন আপলোড করা বাধ্যতামূলক।');

    setSending(true);
    const uploaded = await uploadBloodPrescription((user?.id as string) || 'guest', file);
    if (!uploaded.success || !uploaded.url) {
      setSending(false);
      return setError(uploaded.error || 'প্রেসক্রিপশন আপলোড ব্যর্থ হয়েছে।');
    }
    const result = await createBloodRequest({
      donorProfileId: donor.id,
      patientName,
      phone,
      bloodGroup,
      units,
      hospitalName,
      hospitalAreaId,
      hospitalLocation,
      requiredDateTime: requiredDateTime || undefined,
      areaId,
      patientInfo: patientInfo || undefined,
      prescriptionUrl: uploaded.url,
    });
    setSending(false);
    if (result.success) setDone(true);
    else setError(result.error || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
  };

  if (!user) {
    return (
      <div className="p-5 text-center">
        <Lock className="w-8 h-8 text-rose-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-900 mb-1">রক্তের অনুরোধ পাঠাতে লগইন প্রয়োজন</p>
        <p className="text-xs text-slate-500 mb-4">
          গোপনীয়তা ও যাচাইয়ের স্বার্থে রক্তের অনুরোধ শুধুমাত্র নিবন্ধিত অ্যাকাউন্ট থেকে পাঠানো যায়।
        </p>
        <Link
          href={`/login?next=/blood-donor/${donor.id}`}
          className="inline-block px-5 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-semibold"
        >
          লগইন / রেজিস্টার করুন
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-5">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-700 mx-auto mb-2" />
          <div className="font-bold">অনুরোধ পাঠানো হয়েছে</div>
          <p className="text-xs text-emerald-800 leading-relaxed mt-1">
            আপনার রক্তের অনুরোধটি পর্যালোচনায় রয়েছে। অ্যাডমিন নিশ্চিত হয়ে রক্তদাতার সঙ্গে সমন্বয় করবেন।
          </p>
          <p className="text-[11px] text-emerald-800/80 mt-2">
            আপনার অনুরোধের হালনাগাদ <Link href="/profile/requests" className="font-bold underline">আমার অনুরোধ</Link> পৃষ্ঠায় দেখতে পাবেন।
          </p>
          <button type="button" onClick={onClose} className="mt-3 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold">
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200">
        <Droplets className="w-6 h-6 text-rose-700 shrink-0" />
        <div className="text-xs text-rose-950 leading-snug">
          <p className="font-bold mb-0.5">
            {(donor.fullName || '').split(' ')[0]} — {donor.bloodGroup}
          </p>
          <p>অনুরোধটি অ্যাডমিন পর্যালোচনার পর অনুমোদিত হলে রক্তদাতার নম্বর নিয়ন্ত্রিতভাবে প্রকাশিত হবে।</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-rose-600" /> রোগী / যোগাযোগকারীর নাম *
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="যেমন: রুহুল আমিন"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-rose-600" /> আপনার ফোন নম্বর *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">রক্তের গ্রুপ *</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                  {g === donor.bloodGroup ? ' (রক্তদাতার গ্রুপ)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">কত ইউনিট লাগবে *</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUnits(n)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors',
                    units === n
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Hospital className="w-3.5 h-3.5 text-rose-600" /> হাসপাতাল / ক্লিনিকের নাম *
          </label>
          <input
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="যেমন: ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">হাসপাতালের এলাকা *</label>
            <select
              value={hospitalAreaId}
              onChange={(e) => setHospitalAreaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">হাসপাতালের অবস্থান (বিস্তারিত) *</label>
            <input
              type="text"
              value={hospitalLocation}
              onChange={(e) => setHospitalLocation(e.target.value)}
              placeholder="যেমন: ৩ নম্বর সার্জারি ওয়ার্ড"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-rose-600" /> প্রয়োজনীয় তারিখ / সময়
            </label>
            <input
              type="text"
              value={requiredDateTime}
              onChange={(e) => setRequiredDateTime(e.target.value)}
              placeholder="যেমন: ২৩ সেপ্টেম্বর, সকাল ১০টা"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" /> এলাকা *
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">রোগী সম্পর্কে সংক্ষিপ্ত তথ্য</label>
          <textarea
            rows={2}
            value={patientInfo}
            onChange={(e) => setPatientInfo(e.target.value)}
            placeholder="যেমন: শল্যচিকিৎসার জন্য রক্ত প্রয়োজন..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
          />
        </div>

        {/* Prescription upload — REQUIRED */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            প্রেসক্রিপশন / ডাক্তারের লিখন (আপলোড বাধ্যতামূলক) *
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              'w-full p-4 rounded-xl border-2 border-dashed text-center transition-colors',
              file ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-300 hover:border-rose-400'
            )}
          >
            {file ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <FileText className="w-5 h-5" />
                {fileName || 'ফাইল সংযুক্ত হয়েছে'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <UploadCloud className="w-5 h-5 text-rose-600" />
                ছবি বা PDF আপলোড করুন
              </span>
            )}
          </button>
          {file && (
            <div className="mt-1.5 flex items-center justify-between">
              <button type="button" onClick={() => { setFile(null); setFileName(''); }} className="text-[11px] text-rose-600 font-semibold">
                ফাইল বদল করুন
              </button>
            </div>
          )}
          <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> প্রেসক্রিপশনটি শুধুমাত্র অ্যাডমিন যাচাইয়ের জন্য ব্যবহার হয় — সর্বদা গোপন থাকে।
          </p>
        </div>

        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          রক্তদান একটি সম্পূর্ণ স্বেচ্ছাসেবী ও অ-বাণিজ্যিক সেবা। রক্ত কেনা-বেচা কঠোরভাবে নিষিদ্ধ।
          অনুরোধটি<b> পর্যালোচনায়</b> যাবে এবং অ্যাডমিন যাচাইয়ের পর রক্তদাতার সঙ্গে সমন্বয় করা হবে।
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{sending ? ' পাঠানো হচ্ছে...' : 'রক্তদান অনুরোধ পাঠান'}</span>
        </button>
      </form>
    </div>
  );
}

export function RequestSheetHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Droplets className="w-4 h-4 text-rose-600" />
        <span>রক্তের জন্য অনুরোধ</span>
      </div>
      <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="বন্ধ করুন">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}