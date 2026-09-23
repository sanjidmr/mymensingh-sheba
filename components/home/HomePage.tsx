'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import HeroSection from '@/components/home/HeroSection';
import ServiceCategoryBar from '@/components/home/ServiceCategoryBar';
import HomeServiceSection from '@/components/home/HomeServiceSection';
import WhySection from '@/components/home/WhySection';
import StepsSection from '@/components/home/StepsSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FinalCtaSection from '@/components/home/FinalCtaSection';
import {
  loadToletCards,
  loadElectricianCards,
  loadPlumberCards,
  loadMaidCards,
  loadTutorCards,
  loadDonorCards,
} from '@/components/home/section-loaders';

/**
 * ময়মনসিংহ সেবা — হোমপেজ
 * Sections are data-driven through the shared preview facades (Supabase-ready,
 * falls back to curated mock data when Supabase isn't configured).
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-0">
      <Navbar />

      <main className="flex-1">
        <HeroSection />

        {/* Service category bar */}
        <ServiceCategoryBar />

        {/* 1 — বাসা ভাড়া (To-Let) */}
        <HomeServiceSection
          id="tolet-preview"
          eyebrow="আবাসন"
          title="ময়মনসিংহ সিটিতে বাসা ভাড়া"
          description="ফ্ল্যাট, রুম, ব্যাচেলর ও মেস সিট — এলাকা ও বাজেট অনুযায়ী ভেরিফাইড তালিকা।"
          seeMoreHref="/services/toilet"
          background="soft"
          load={loadToletCards}
        />

        {/* 2 — Electrician */}
        <HomeServiceSection
          id="electrician-preview"
          eyebrow="মেরামত • Electrician"
          title="Electrician (ইলেক্ট্রিশিয়ান) সেবা"
          description="শর্ট সার্কিট, ফ্যান-লাইট, ওয়্যারিং ও গিজারের সমস্যা সমাধানে অভিজ্ঞ টেকনিশিয়ান।"
          seeMoreHref="/services/electrician"
          background="white"
          load={loadElectricianCards}
        />

        {/* 3 — Plumber */}
        <HomeServiceSection
          id="plumber-preview"
          eyebrow="মেরামত • Plumber"
          title="Plumber (প্লাম্বার) সেবা"
          description="পাইপ লিক, মোটর-পাম্প ও স্যানিটারি ফিটিংসের জরুরি সমাধানে যাচাইকৃত মিস্ত্রি।"
          seeMoreHref="/services/plumber"
          background="soft"
          load={loadPlumberCards}
        />

        {/* 4 — কাজের বুয়া */}
        <HomeServiceSection
          id="maid-preview"
          eyebrow="গৃহকর্মী"
          title="কাজের বুয়া (গৃহকর্মী)"
          description="রান্না, ঘর-মোছা ও কাপড় ধোয়ায় অভিজ্ঞ — ফুল-টাইম ও পার্ট-টাইম, বাসায়-থেকে-থাকা সহ।"
          seeMoreHref="/services/maid"
          background="white"
          load={loadMaidCards}
        />

        {/* 5 — গৃহশিক্ষক */}
        <HomeServiceSection
          id="tutor-preview"
          eyebrow="শিক্ষা"
          title="অভিজ্ঞ গৃহশিক্ষক"
          description="রেটিং, শিক্ষাগত যোগ্যতা ও এলাকা অনুযায়ী বেছে নিন — বাসায় পড়ার পাশাপাশি অনলাইনও।"
          seeMoreHref="/services/tutor"
          background="soft"
          load={loadTutorCards}
        />

        {/* 6 — ব্লাড ডোনার */}
        <HomeServiceSection
          id="blood-donor-preview"
          eyebrow="জরুরি সেবা"
          title="জরুরি প্রয়োজনে রক্তদাতা"
          description="সম্পূর্ণ বিনামূল্যে রক্তদান — অ্যাডমিন টিম রক্তদাতার সঙ্গে সমন্বয় করে। কোনো ফি বা লেনদেন নেই।"
          seeMoreHref="/services/blood-donor"
          background="white"
          load={loadDonorCards}
        />

        <WhySection />
        <StepsSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}