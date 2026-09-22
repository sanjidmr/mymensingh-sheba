'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Home,
  GraduationCap,
  Heart,
  FileText,
  Bookmark,
  Bell,
  Settings,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  LogOut,
  MapPin,
  CheckCircle2,
  Clock,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAreaById } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    toletProfile,
    homeTutorProfile,
    bloodDonorProfile,
    requests,
    savedListings,
    notifications,
    logout,
    isAdmin,
  } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">লগইন প্রয়োজন</h2>
<p className="text-xs text-slate-600 mt-1 mb-5">
              প্রোফাইল দেখতে দয়া করে লগইন করুন।
            </p>
            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
              >
                লগইন পেজে যান
              </Link>
              <Link
                href="/register"
                className="block w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                নতুন অ্যাকাউন্ট খুলুন
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const primaryArea = getAreaById(user.primaryAreaId);
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

<main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              আমার অ্যাকাউন্ট ও ড্যাশবোর্ড
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              এক অ্যাকাউন্ট থেকেই কাস্টমার হিসেবে সেবা গ্রহণ ও সার্ভিস প্রোফাইল পরিচালনা করুন
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all w-fit"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>অ্যাডমিন মডারেশন প্যানেল</span>
            </Link>
          )}
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Core User Card + Quick Links (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-2xs">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 text-2xl font-bold flex items-center justify-center mx-auto mb-3 border-2 border-emerald-300">
                {user.fullName.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{user.fullName}</h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 inline" />
                <span>{user.phone}</span>
              </p>
              <p className="text-xs text-emerald-900 font-medium mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{primaryArea?.nameBn || 'চরপাড়া'}, ময়মনসিংহ সিটি কর্পোরেশন</span>
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-xl ${
                user.isVerified
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-500 bg-slate-50 font-medium'
              }">
                <ShieldCheck className={`w-4 h-4 ${user.isVerified ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{user.isVerified ? 'ভেরিফাইড অ্যাকাউন্ট' : 'যাচাইকরণ এখনো সম্পন্ন হয়নি'}</span>
              </div>
            </div>

            {/* Quick Account Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-1 text-sm shadow-2xs">
              <Link
                href="/profile/requests"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>আমার রিকোয়েস্টসমূহ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {requests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {requests.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link
                href="/profile/saved"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-slate-500" />
                  <span>পছন্দের বাসা ও সেবা</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {savedListings.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {savedListings.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link
                href="/profile/notifications"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>নোটিফিকেশন</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadNotifs > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                      {unreadNotifs}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link
                href="/profile/settings"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>অ্যাকাউন্ট সেটিংস</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-700 font-medium transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>লগআউট করুন</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Service Profiles Section (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-2xs">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  আপনার সার্ভিস প্রোফাইলসমূহ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  এক অ্যাকাউন্ট থেকেই আপনার ইচ্ছামতো আলাদা আলাদা সার্ভিস সক্রিয় করতে পারবেন
                </p>
              </div>

              {/* 3 Service Profiles Cards */}
              <div className="space-y-4">
                {/* 1. To-Let Profile Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">
                            বাসা মালিক / To-Let প্রোফাইল
                          </h3>
{toletProfile ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {toletProfile.status === 'approved'
                                  ? 'অনুমোদিত ও সক্রিয়'
                                  : toletProfile.status === 'pending_approval' || toletProfile.status === 'draft'
                                  ? 'অনুমোদনের অপেক্ষায়'
                                  : toletProfile.status === 'suspended'
                                  ? 'সাসপেন্ডেড'
                                  : 'বিরতিতে আছে'}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-medium">
                              সক্রিয় করা হয়নি
                            </span>
                          )}
                        </div>

                        {toletProfile ? (
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <p>
                              <strong>মালিকের নাম:</strong> {toletProfile.ownerName} •{' '}
                              <strong>হোল্ডিং:</strong> {toletProfile.holdingNumber || 'N/A'}
                            </p>
                            <p>
                              <strong>ঠিকানা:</strong> {toletProfile.addressLine}
                            </p>
                            <p className="text-emerald-800 font-medium">
                              মোট পোস্টকৃত বিজ্ঞাপন: {toletProfile.totalListingsCount} টি
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 mt-1">
                            আপনার ফ্যামিলি বাসা, মেস বা সিট ভাড়া দেওয়ার বিজ্ঞাপন দিন ও আবেদনকারী কাস্টমারদের সাথে যোগাযোগ করুন।
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      {toletProfile ? (
                        <>
                          <Link
                            href="/tolet"
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
                          >
                            <span>বিজ্ঞাপন দেখুন</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href="/profile/tolet/setup"
                            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>এডিট প্রোফাইল</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/profile/tolet/setup"
                          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>প্রোফাইল সক্রিয় করুন</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Home Tutor Profile Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">
                            গৃহশিক্ষক (Home Tutor) প্রোফাইল
                          </h3>
                          {homeTutorProfile ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {homeTutorProfile.status === 'approved'
                                  ? 'অনুমোদিত শিক্ষক'
                                  : homeTutorProfile.status === 'pending_approval' || homeTutorProfile.status === 'draft'
                                  ? 'অনুমোদনের অপেক্ষায়'
                                  : homeTutorProfile.status === 'rejected'
                                  ? 'প্রত্যাখ্যাত'
                                  : homeTutorProfile.status === 'suspended'
                                  ? 'সাময়িক নিষ্ক্রিয়'
                                  : 'বিরতিতে'}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-medium">
                              সক্রিয় করা হয়নি
                            </span>
                          )}
                        </div>

                        {homeTutorProfile ? (
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <p>
                              <strong>প্রতিষ্ঠান:</strong> {homeTutorProfile.institution} (
                              {homeTutorProfile.department})
                            </p>
                            <p>
                              <strong>পড়ানোর বিষয়:</strong>{' '}
                              {homeTutorProfile.preferredSubjects.join(', ')}
                            </p>
                            <p>
                              <strong>শ্রেণি:</strong>{' '}
                              {homeTutorProfile.preferredClasses.join(', ')} •{' '}
                              <strong>প্রত্যাশিত বেতন:</strong> ৳ {homeTutorProfile.expectedSalaryMin} -{' '}
                              {homeTutorProfile.expectedSalaryMax}
                            </p>
                            <div className="mt-2 p-2 rounded-lg bg-emerald-100/50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center gap-1.5 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>গোপনীয়তা নিশ্চিত: আপনার মোবাইল নম্বর ডিরেক্টরিতে গোপন থাকে।</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 mt-1">
                            ময়মনসিংহ শহরের ছাত্র-ছাত্রীদের পড়াতে নিজের শিক্ষক প্রোফাইল তৈরি করুন। ফোন নম্বর পাবলিকলি সুরক্ষিত থাকবে।
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      {homeTutorProfile ? (
                        <>
                          <Link
                            href="/home-tutor"
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
                          >
                            <span>শিক্ষক তালিকা</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href="/profile/home-tutor/setup"
                            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>এডিট প্রোফাইল</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/profile/home-tutor/setup"
                          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>শিক্ষক প্রোফাইল খুলুন</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Blood Donor Profile Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        {bloodDonorProfile ? bloodDonorProfile.bloodGroup : <Heart className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">
                            রক্তদাতা (Blood Donor) প্রোফাইল
                          </h3>
                          {bloodDonorProfile ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {bloodDonorProfile.status === 'approved'
                                  ? `সক্রিয় রক্তদাতা (${bloodDonorProfile.bloodGroup})`
                                  : bloodDonorProfile.status === 'pending_approval' || bloodDonorProfile.status === 'draft'
                                  ? 'অনুমোদনের অপেক্ষায়'
                                  : bloodDonorProfile.status === 'rejected'
                                  ? 'প্রত্যাখ্যাত'
                                  : bloodDonorProfile.status === 'suspended'
                                  ? 'নিষ্ক্রিয়'
                                  : 'বিরতিতে'}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-medium">
                              সক্রিয় করা হয়নি
                            </span>
                          )}
                        </div>

                        {bloodDonorProfile ? (
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <p>
                              <strong>রক্তের গ্রুপ:</strong>{' '}
                              <span className="font-bold text-rose-800">{bloodDonorProfile.bloodGroup}</span>{' '}
                              • <strong>মোট রক্তদান:</strong> {bloodDonorProfile.donationCount} বার
                            </p>
                            <p>
                              <strong>অবস্থা:</strong>{' '}
                              <span className="text-emerald-700 font-semibold">
                                {bloodDonorProfile.isAvailable ? 'রক্তদানে প্রস্তুত' : 'বর্তমানে বিরতিতে'}
                              </span>
                            </p>
                            <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-950 flex items-center gap-1.5 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                              <span>
                                কঠোর প্রাইভেসি পলিসি: আপনার ফোন নম্বর কখনোই সরাসরি প্রদর্শিত হয় না।
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 mt-1">
                            জরুরি প্রয়োজনে ময়মনসিংহের রোগীদের রক্ত দিতে রক্তদাতা হিসেবে তালিকাভুক্ত হোন।
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      {bloodDonorProfile ? (
                        <>
                          <Link
                            href="/blood-donor"
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
                          >
                            <span>রক্তদাতা ডিরেক্টরি</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href="/profile/blood-donor/setup"
                            className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>এডিট প্রোফাইল</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/profile/blood-donor/setup"
                          className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>রক্তদাতা হিসেবে নিবন্ধন</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin-managed services reminder box */}
              <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-emerald-50/40 text-xs text-slate-700">
                <span className="font-bold text-emerald-950 block mb-1">
                  কাজের বুয়া, ইলেক্ট্রিশিয়ান এবং বাসা পাল্টানো সেবা সম্পর্কে:
                </span>
                এই ৩টি সেবা সরাসরি ময়মনসিংহ সেবা অ্যাডমিন টিম দ্বারা ভেরিফাই ও পরিচালনা করা হয়। এর জন্য আলাদা প্রোভাইডার প্রোফাইল খোলার প্রয়োজন নেই — কাস্টমার হিসেবে সরাসরি সেবা রিকোয়েস্ট জমা দিলেই অ্যাডমিন টিম দায়িত্বপ্রাপ্ত কর্মী পাঠাবে।
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
