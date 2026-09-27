'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import HeroCarousel from '@/components/home/HeroCarousel';
import SearchSection from '@/components/home/SearchSection';
import CategorySection from '@/components/home/CategorySection';
import ServiceRowSection from '@/components/home/ServiceRowSection';
import CommunityInviteSection from '@/components/home/CommunityInviteSection';
import WhySection from '@/components/home/WhySection';
import StepsSection from '@/components/home/StepsSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import ReviewSection from '@/components/home/ReviewSection';
import FinalCtaSection from '@/components/home/FinalCtaSection';
import {
  DAILY_CATEGORY,
  SHOP_TRAVEL_CATEGORY,
  EMERGENCY_CATEGORY,
} from '@/lib/homepage-catalog';
import {
  GARI_SAMPLE_CARDS,
  KENABECHA_SAMPLE_CARDS,
  NEWS_SAMPLE_CARDS,
} from '@/lib/home-static-rows';
import {
  loadToletCards,
  loadTutorCards,
  loadDonorCards,
} from '@/components/home/section-loaders';

/**
 * ময়মনসিংহ সেবা — হোমপেজ
 *
 * Desktop narrative flow:
 *   ট্রান্সপারেন্ট ন্যাভবার
 *   → প্রিমিয়াম ইমেজ ক্যারোসেল
 *   → সহায়ক টেক্সট + সার্চ
 *   → ক্যাটাগরি ০১ (দৈনন্দিন সেবা, white)
 *   → ক্যাটাগরি ০২ (কেনাকাটা, যাতায়াত ও তথ্য, mist)
 *   → ক্যাটাগরি ০৩ (জরুরি ও জনসেবা, সাদা — অন্য সেকশনের মতো, ডেন্স কার্ড)
 *   → সার্ভিস রো: বাসা ভাড়া → গৃহশিক্ষক → গাড়ি ভাড়া (৫টি ছোট imageless কার্ড এক রোতে)
 *   → ময়মনসিংহ কমিউনিটির জন্য
 *   → সার্ভিস রো: রক্তদাতা → কেনাবেচা → স্থানীয় খবর
 *   → কীভাবে কাজ করে → এলাকার মতামত → কেন আমরা → রিভিউ মডাল → শেষ কল-টু-অ্যাকশন
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Large premium image carousel — the primary visual */}
        <HeroCarousel />

        {/* Supporting editorial copy + product search */}
        <SearchSection />

        {/* ক্যাটাগরি ০১ */}
        <CategorySection category={DAILY_CATEGORY} />

        {/* ক্যাটাগরি ০২ */}
        <CategorySection category={SHOP_TRAVEL_CATEGORY} />

        {/* ক্যাটাগরি ০৩ */}
        <CategorySection category={EMERGENCY_CATEGORY} />

        {/* সার্ভিস রো — বাসা ভাড়া */}
        <ServiceRowSection
          kicker="এই শহরের তালিকা"
          title="বাসা / মেস / হোস্টেল ভাড়া"
          href="/tolet"
          load={loadToletCards}
          tone="mist"
          withImage
          demoImages={['/home.jpg', '/homechange.jpg', '/sheba1.png', '/sheba2.png']}
        />

        {/* সার্ভিস রো — গৃহশিক্ষক */}
        <ServiceRowSection
          kicker="অভিজ্ঞ শিক্ষক"
          title="গৃহশিক্ষক খুঁজুন"
          href="/home-tutor"
          load={loadTutorCards}
          tone="white"
          withImage
          demoImages={['/tutor.jpg', '/coutching.jpg', '/sheba3.png', '/sheba4.png']}
        />

        {/* সার্ভিস রো — গাড়ি, অটো ও CNG */}
        <ServiceRowSection
          kicker="স্থানীয় যাতায়াত"
          title="গাড়ি, অটো ও CNG ভাড়া"
          href="/services?q=%E0%A6%97%E0%A6%BE%E0%A6%A1%E0%A6%BC%E0%A6%BF"
          cards={GARI_SAMPLE_CARDS}
          tone="mist"
          withImage
          demoImages={['/carrent.png', '/bus.jpg', '/sheba1.png', '/sheba2.png']}
        />

        {/* Community invitation — people can share their own services/info */}
        <CommunityInviteSection />

        {/* সার্ভিস রো — রক্তদাতা */}
        <ServiceRowSection
          kicker="জরুরি প্রয়োজনে"
          title="রক্তদাতা খুঁজুন"
          href="/blood-donor"
          load={loadDonorCards}
          tone="white"
          cardTone="red"
          hideImage
        />

        {/* সার্ভিস রো — কেনাবেচা */}
        <ServiceRowSection
          kicker="স্থানীয় বাজার"
          title="কেনাবেচা"
          href="/services?q=%E0%A6%95%E0%A7%87%E0%A6%A8%E0%A6%BE%E0%A6%AC%E0%A7%87%E0%A6%9A%E0%A6%BE"
          cards={KENABECHA_SAMPLE_CARDS}
          tone="mist"
          withImage
          demoImages={['/buysell.jpg', '/sheba2.png', '/sheba3.png', '/sheba4.png']}
        />

        {/* সার্ভিস রো — স্থানীয় খবর */}
        <ServiceRowSection
          kicker="সম্প্রতি"
          title="স্থানীয় খবর ও ঘোষণা"
          href="/services?q=news"
          cards={NEWS_SAMPLE_CARDS}
          tone="white"
          withImage
          demoImages={['/news.jpg', '/job.jpg', '/bus.jpg', '/wifi.jpg']}
        />

        <StepsSection />
        <TestimonialsSection />
        <WhySection />
        <ReviewSection />
        <FinalCtaSection />
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}