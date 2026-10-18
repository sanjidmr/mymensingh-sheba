'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  MapPin,
  Phone,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Video,
  Home as HomeIcon,
  RefreshCw,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import { uploadTutorProfilePhoto } from '@/lib/home-tutor-service';
import { TUTOR_TEACHING_MODE_LABELS } from '@/lib/home-tutor-types';
import type { TutorTeachingMode } from '@/lib/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AVAILABLE_CLASSES = [
  '১ম - ৫ম শ্রেণি',
  '৬ষ্ঠ - ৮ম শ্রেণি',
  '৯ম - ১০ম শ্রেণি (SSC)',
  'একাদশ - দ্বাদশ শ্রেণি (HSC)',
  'ভর্তি পরীক্ষা / এডমিশন',
];

const AVAILABLE_SUBJECTS = [
  'সাধারণ গণিত',
  'উচ্চতর গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'ইংরেজি',
  'বাংলা',
  'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
  'সকল বিষয় (প্রাথমিক/জুনিয়র)',
];

export default function HomeTutorSetupPage() {
  const router = useRouter();
  const { user, homeTutorProfile, activateHomeTutorProfile } = useAuth();

  const [fullName, setFullName] = useState(homeTutorProfile?.fullName || user?.fullName || '');
  const [gender, setGender] = useState<'male' | 'female'>(homeTutorProfile?.gender || 'male');
  const [institution, setInstitution] = useState(homeTutorProfile?.institution || '');
  const [department, setDepartment] = useState(homeTutorProfile?.department || '');
  const [qualification, setQualification] = useState(homeTutorProfile?.qualification || '');
  const initialEducationStatus = homeTutorProfile?.educations?.[0]?.status;
  const [educationStatus, setEducationStatus] = useState<'studying' | 'completed' | ''>(
    initialEducationStatus === 'studying' || initialEducationStatus === 'completed'
      ? initialEducationStatus
      : ''
  );
  const [experienceYears, setExperienceYears] = useState(homeTutorProfile?.experienceYears || 2);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    homeTutorProfile?.preferredAreas || ['charpara', 'ganginarpar']
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    homeTutorProfile?.preferredClasses || ['৯ম - ১০ম শ্রেণি (SSC)', 'একাদশ - দ্বাদশ শ্রেণি (HSC)']
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    homeTutorProfile?.preferredSubjects || ['সাধারণ গণিত', 'পদার্থবিজ্ঞান']
  );
  const [salaryMin, setSalaryMin] = useState(homeTutorProfile?.expectedSalaryMin || 3000);
  const [salaryMax, setSalaryMax] = useState(homeTutorProfile?.expectedSalaryMax || 6000);
  const [daysPerWeek, setDaysPerWeek] = useState(homeTutorProfile?.daysPerWeek || 3);
  const [bio, setBio] = useState(homeTutorProfile?.bio || '');
  const [privatePhone, setPrivatePhone] = useState(
    homeTutorProfile?.privatePhone || user?.phone || ''
  );
  const [teachingMode, setTeachingMode] = useState<TutorTeachingMode>(
    homeTutorProfile?.teachingMode || 'both'
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(homeTutorProfile?.profilePhotoUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    try {
      const res = await uploadTutorProfilePhoto(user.id, file);
      if (res.success && res.url) {
        setProfilePhotoUrl(res.url);
      } else {
        setError('ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।');
      }
    } catch (uploadError) {
      console.error('Tutor profile photo upload failed', uploadError);
      setError('ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveProfile = async (mode: 'draft' | 'submit') => {
    if (mode === 'submit' && (!fullName || !department || selectedAreas.length === 0)) {
      setError('নাম, বিভাগ এবং অন্তত একটি এলাকা নির্বাচন করুন।');
      return;
    }
    if (mode === 'submit' && !educationStatus) {
      setError('আপনার পড়াশোনার বর্তমান অবস্থা নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await activateHomeTutorProfile({
        fullName,
        gender,
        institution,
        department,
        qualification,
        educations: educationStatus && qualification.trim()
          ? [
              {
                institution,
                department,
                degree: qualification.trim(),
                status: educationStatus,
              },
              ...(homeTutorProfile?.educations?.slice(1) ?? []),
            ]
          : homeTutorProfile?.educations ?? [],
        experienceYears: Number(experienceYears),
        preferredAreas: selectedAreas,
        preferredClasses: selectedClasses,
        preferredSubjects: selectedSubjects,
        expectedSalaryMin: Number(salaryMin),
        expectedSalaryMax: Number(salaryMax),
        daysPerWeek: Number(daysPerWeek),
        bio,
        privatePhone,
        isVerified: false,
        teachingMode,
        availability: homeTutorProfile?.availability || 'available',
        profilePhotoUrl,
      }, mode);
      if (!result.success) throw new Error(result.error || 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।');
      setSuccess(true);
      setSuccessMessage(
        homeTutorProfile?.status === 'approved'
          ? 'পরিবর্তন সংরক্ষিত হয়েছে। আপনার প্রোফাইল প্রকাশিত অবস্থায় আছে।'
          : mode === 'draft'
            ? 'জমা দেওয়া হয়নি হিসেবে সংরক্ষণ হয়েছে। পরে সম্পাদনা করে জমা দিতে পারবেন।'
            : 'গৃহশিক্ষক প্রোফাইল জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে সক্রিয় হবে।'
      );
      setTimeout(() => {
        router.push('/dashboard/posts');
      }, 1200);
    } catch (saveError) {
      console.error('Tutor profile save failed', saveError);
      setError('প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void saveProfile('submit');
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-3 py-4 sm:px-4 sm:py-7">
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
          <Link href="/profile" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-semibold">গৃহশিক্ষক (Home Tutor) প্রোফাইল সেটআপ</span>
        </div>

        <div className="rounded-xl border border-brand-100 bg-white p-3 sm:rounded-2xl sm:p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-brand-100 pb-4 sm:mb-5 sm:pb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
                গৃহশিক্ষক প্রোফাইল সেটআপ
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
                ময়মনসিংহ শহরের শিক্ষার্থী ও অভিভাবকদের জন্য আপনার শিক্ষক প্রোফাইল সাজান
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-brand-50 border border-brand-200 text-ink-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
              <span className="text-sm font-semibold">
                {successMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile photo (optional) */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                প্রোফাইল ছবি (ঐচ্ছিক)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                  {profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoUrl} alt="প্রোফাইল ছবি" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-300">
                      {fullName.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <label className="px-3.5 py-2 rounded-xl border border-brand-100 bg-white text-xs font-medium text-ink-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-mist-50">
                  {photoUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  {photoUploading ? 'আপলোড হচ্ছে...' : 'ছবি বাছাই করুন'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setProfilePhotoUrl('')}
                    className="text-xs text-ink-400 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> মুছুন
                  </button>
                )}
              </div>
              <p className="text-[11px] text-ink-400 mt-1.5">
                ছবিটি পাবলিক প্রোফাইলে দেখা যাবে। সর্বোচ্চ ৫MB।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  শিক্ষকের পুরো নাম
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: তানজিম আহমেদ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  লিঙ্গ
                </label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 text-sm text-ink-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className="text-brand-700 focus:ring-brand-500"
                    />
                    <span>পুরুষ শিক্ষক</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className="text-brand-700 focus:ring-brand-500"
                    />
                    <span>মহিলা শিক্ষিকা</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  শিক্ষা প্রতিষ্ঠান
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="প্রতিষ্ঠানের নাম লিখুন"
                  maxLength={160}
                  className="min-h-11 w-full rounded-xl border border-brand-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  বিভাগ / বিষয়
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="যেমন: গণিত বিভাগ / পদার্থবিজ্ঞান"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  শিক্ষাগত যোগ্যতা
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="যেমন: B.Sc Honours (3rd Year)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <fieldset>
                <legend className="block text-xs font-semibold text-ink-800 mb-1.5">
                  পড়াশোনার অবস্থা
                </legend>
                <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1">
                  <label className="flex min-h-11 items-center gap-2 text-sm text-ink-800">
                    <input
                      type="radio"
                      name="education-status"
                      checked={educationStatus === 'studying'}
                      onChange={() => setEducationStatus('studying')}
                      required
                      className="text-brand-700 focus:ring-brand-500"
                    />
                    <span>এখনও পড়াশোনা করছি</span>
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm text-ink-800">
                    <input
                      type="radio"
                      name="education-status"
                      checked={educationStatus === 'completed'}
                      onChange={() => setEducationStatus('completed')}
                      className="text-brand-700 focus:ring-brand-500"
                    />
                    <span>পড়াশোনা সম্পন্ন</span>
                  </label>
                </div>
              </fieldset>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  শিক্ষকতার অভিজ্ঞতা (বছর)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  সপ্তাহে পড়ানোর দিন
                </label>
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={2}>২ দিন</option>
                  <option value={3}>৩ দিন</option>
                  <option value={4}>৪ দিন</option>
                  <option value={5}>৫ দিন</option>
                </select>
              </div>
            </div>

            {/* Preferred Classes */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                যেসব শ্রেণি পড়াতে আগ্রহী (একাধিক নির্বাচন করা যাবে)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CLASSES.map((cls) => {
                  const active = selectedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-white text-ink-700 border-brand-100 hover:bg-mist-50'
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Subjects */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                যেসব বিষয় পড়াতে আগ্রহী
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SUBJECTS.map((sub) => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-white text-ink-700 border-brand-100 hover:bg-mist-50'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Areas within MCC */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                পছন্দের এলাকা (শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-mist-50 rounded-xl border border-brand-100 max-h-48 overflow-y-auto">
                {MCC_AREAS.map((area) => {
                  const active = selectedAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleArea(area.id)}
                        className="rounded border-brand-200 text-brand-700 focus:ring-brand-500"
                      />
                      <span className="truncate">{area.nameBn}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Expected Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  সর্বনিম্ন প্রত্যাশিত বেতন (৳)
                </label>
                <input
                  type="number"
                  step="500"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                  সর্বোচ্চ প্রত্যাশিত বেতন (৳)
                </label>
                <input
                  type="number"
                  step="500"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Teaching mode */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                পড়ানোর মাধ্যম
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TUTOR_TEACHING_MODE_LABELS) as TutorTeachingMode[]).map((mode) => {
                  const active = teachingMode === mode;
                  return (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setTeachingMode(mode)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-white text-ink-700 border-brand-100 hover:bg-mist-50'
                      }`}
                    >
                      {mode === 'home' && <HomeIcon className="inline w-3.5 h-3.5 mr-1" />}
                      {mode === 'online' && <Video className="inline w-3.5 h-3.5 mr-1" />}
                      {TUTOR_TEACHING_MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                অভিজ্ঞতা ও শিক্ষাদান পদ্ধতি সম্পর্কে সংক্ষেপে
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="যেমন: বিগত ৩ বছর ধরে শিক্ষার্থীদের যত্ন নিয়ে বিজ্ঞান ও গণিত পড়াচ্ছি..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Private contact */}
            <div>
              <label className="block text-xs font-semibold text-ink-800 mb-1.5">
                যোগাযোগের মোবাইল নম্বর (সুরক্ষিত থাকবে)
              </label>
              <input
                type="tel"
                value={privatePhone}
                onChange={(e) => setPrivatePhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-[11px] text-ink-400 mt-1">
                এই নম্বরে শুধুমাত্র ময়মনসিংহ সেবা অ্যাডমিন টিম টিউশন রিকোয়েস্ট সমন্বয় করতে যোগাযোগ করবে।
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              {homeTutorProfile?.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => void saveProfile('draft')}
                  disabled={loading || photoUploading}
                  className="px-4 py-2.5 rounded-xl border border-brand-200 text-brand-800 text-xs font-semibold hover:bg-brand-50 disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'জমা দেওয়া হয়নি সংরক্ষণ'}
                </button>
              )}
              <Link
                href="/profile"
                className="px-4 py-2.5 rounded-xl border border-brand-100 text-ink-700 text-xs font-medium hover:bg-mist-50"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold  flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'সংরক্ষণ হচ্ছে...'
                    : homeTutorProfile?.status === 'approved'
                      ? 'পরিবর্তন সংরক্ষণ'
                      : 'শিক্ষক প্রোফাইল সক্রিয় করুন'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
