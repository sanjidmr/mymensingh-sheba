'use client';

import HeroCarousel, { type HeroSlide } from '@/components/home/HeroCarousel';
import HeroSearchBar from '@/components/home/HeroSearchBar';

/**
 * Hero section in two dedicated layouts:
 * - Desktop (lg+): full-bleed text-free carousel — /sheba1…4 fill the section
 *   edge-to-edge at their own aspect ratio (never cropped).
 * - Mobile/tablet: tall image band with Bengali headline, supporting text and
 *   a search bar overlaid; swipe + dots keep the carousel intact.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/sheba1.png',
    tag: 'বাসা ভাড়া',
    title: 'ময়মনসিংহ সিটিতে বাসা ভাড়া',
    subtitle: 'ফ্ল্যাট, রুম, ব্যাচেলর ও মেস সিট এক জায়গায়।',
  },
  {
    src: '/sheba2.png',
    tag: 'Electrician • Plumber',
    title: 'জরুরি মেরামতে অভিজ্ঞ টেকনিশিয়ান',
    subtitle: 'যাচাইকৃত সেবাদাতা, দরজায় দরজায়।',
  },
  {
    src: '/sheba3.png',
    tag: 'কাজের বুয়া • গৃহশিক্ষক',
    title: 'যাচাইকৃত গৃহকর্মী ও গৃহশিক্ষক',
    subtitle: 'রেটিং ও শিক্ষাগত যোগ্যতা অনুযায়ী বেছে নিন।',
  },
  {
    src: '/sheba4.png',
    tag: 'জরুরি রক্তদান',
    title: 'রক্তদাতা — সম্পূর্ণ বিনামূল্যে',
    subtitle: 'রক্তদান একটি মানবিক সেবা, এখানে কোনো ফি নেই।',
  },
];

export default function HeroSection() {
  return (
    <>
      {/* Desktop (lg+): full-bleed text-free carousel, images never cropped */}
      <div className="hidden lg:block">
        <HeroCarousel slides={HERO_SLIDES} interval={4500} variant="bleed" />
      </div>

      {/* Mobile / tablet: tall image band with headline + search overlay */}
      <div className="lg:hidden">
        <HeroCarousel slides={HERO_SLIDES} interval={4500} variant="mobile" search={<HeroSearchBar />} />
      </div>
    </>
  );
}