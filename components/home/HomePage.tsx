import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/home/HeroCarousel';
import SearchSection from '@/components/home/SearchSection';
import CategorySection from '@/components/home/CategorySection';
import ServiceRowSection from '@/components/home/ServiceRowSection';
import WifiCoachingSection from '@/components/home/WifiCoachingSection';
import CommunityInviteSection from '@/components/home/CommunityInviteSection';
import WhySection from '@/components/home/WhySection';
import StepsSection from '@/components/home/StepsSection';
import ReviewSection from '@/components/home/ReviewSection';
import FinalCtaSection from '@/components/home/FinalCtaSection';
import {
  mergeHomepageCategories,
  isHomepageSectionVisible,
} from '@/lib/site-content';
import { getSiteContentOverrides } from '@/lib/site-content-server';
import { fetchPublicHeroSlides } from '@/lib/hero-service';

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
 *   → সার্ভিস রো: রক্তদাতা → WiFi ও কোচিং → স্থানীয় খবর ও ঘোষণা
 *   → কীভাবে কাজ করে → এলাকার মতামত → কেন আমরা → রিভিউ মডাল → শেষ কল-টু-অ্যাকশন
 *
 * This is a Server Component so it can read the admin's homepage overrides
 * (section visibility, card order, card titles) from `platform_settings` before
 * rendering. With no overrides saved it renders exactly the built-in layout.
 */
export default async function HomePage() {
  const [overrides, heroSlides] = await Promise.all([
    getSiteContentOverrides(),
    fetchPublicHeroSlides(),
  ]);
  const categories = mergeHomepageCategories(overrides);
  const visible = (key: Parameters<typeof isHomepageSectionVisible>[0]) =>
    isHomepageSectionVisible(key, overrides);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {overrides.announcement?.enabled &&
          overrides.announcement.title &&
          overrides.announcement.body && (
            <section aria-label="ওয়েবসাইট ঘোষণা" className="border-b border-accent-500/30 bg-accent-100 px-4 py-3 text-brand-950">
              <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{overrides.announcement.title}</p>
                  <p className="break-words text-sm leading-relaxed">{overrides.announcement.body}</p>
                </div>
                {overrides.announcement.href && overrides.announcement.linkLabel && (
                  <a href={overrides.announcement.href} className="shrink-0 text-sm font-bold underline underline-offset-4">
                    {overrides.announcement.linkLabel}
                  </a>
                )}
              </div>
            </section>
          )}
        {/* Large premium image carousel — the primary visual */}
        {visible('hero') && <HeroCarousel slides={heroSlides ?? undefined} />}

        {/* Supporting editorial copy + product search */}
        {visible('search') && <SearchSection />}

        {/* ক্যাটাগরি ০১ */}
        {visible('category_daily') && <CategorySection category={categories.daily} />}

        {/* ক্যাটাগরি ০২ */}
        {visible('category_shop') && <CategorySection category={categories.shopTravel} />}

        {/* ক্যাটাগরি ০৩ */}
        {visible('category_emergency') && <CategorySection category={categories.emergency} />}

        {/* সার্ভিস রো — বাসা ভাড়া */}
        {visible('row_tolet') && (
          <ServiceRowSection
            kicker="এই শহরের তালিকা"
            hideKickerOnMobile
            title="বাসা / মেস / হোস্টেল ভাড়া"
            href="/tolet"
            source="tolet"
            tone="mist"
            withImage
            demoImages={['/home.jpg', '/homechange.jpg', '/sheba1.png', '/sheba2.png']}
          />
        )}

        {/* সার্ভিস রো — গৃহশিক্ষক */}
        {visible('row_tutor') && (
          <ServiceRowSection
            kicker="অভিজ্ঞ শিক্ষক"
            hideKickerOnMobile
            title="গৃহশিক্ষক খুঁজুন"
            href="/home-tutor"
            source="tutor"
            tone="white"
            withImage
            demoImages={['/tutor.jpg', '/coutching.jpg', '/sheba3.png', '/sheba4.png']}
          />
        )}

        {/* সার্ভিস রো — গাড়ি, অটো ও CNG */}
        {visible('row_gari') && (
          <ServiceRowSection
            kicker="স্থানীয় যাতায়াত"
            hideKickerOnMobile
            title="গাড়ি, অটো ও CNG ভাড়া"
            href="/services?q=%E0%A6%97%E0%A6%BE%E0%A6%A1%E0%A6%BC%E0%A6%BF"
            source="vehicle"
            tone="mist"
            withImage
          />
        )}

        {/* Community invitation — people can share their own services/info */}
        {visible('community') && <CommunityInviteSection />}

        {/* সার্ভিস রো — রক্তদাতা */}
        {visible('row_donor') && (
          <ServiceRowSection
            kicker="জরুরি প্রয়োজনে"
            hideKickerOnMobile
            title="রক্তদাতা খুঁজুন"
            href="/blood-donor"
            source="donor"
            tone="white"
            cardTone="red"
            hideImage
          />
        )}

        {/* WiFi ও কোচিং — প্রকাশিত প্রোভাইডার/সেন্টারের কার্ড */}
        {visible('row_kenabecha') && <WifiCoachingSection />}

        {/* সার্ভিস রো — স্থানীয় খবর */}
        {visible('row_news') && (
          <ServiceRowSection
            kicker="সম্প্রতি"
            hideKickerOnMobile
            title="স্থানীয় খবর ও ঘোষণা"
            href="/news"
            source="news"
            tone="white"
            withImage
          />
        )}

        {visible('steps') && <StepsSection />}
        {visible('why') && <WhySection />}
        {visible('reviews') && <ReviewSection />}
        {visible('final_cta') && <FinalCtaSection />}
      </main>

      <Footer />
    </div>
  );
}