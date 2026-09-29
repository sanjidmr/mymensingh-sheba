'use client';

import CategoryCard from '@/components/home/CategoryCard';
import { SHOP_TRAVEL_CATEGORY, type HomepageService } from '@/lib/homepage-catalog';

/**
 * রক্তদাতা card — হোমপেজের "প্রয়োজনীয় সব সেবা" section এর card থেকে হুবহু একই।
 *
 * CategoryCard একটি client component এবং তার `item` prop-এ Lucide icon
 * (একটি function) থাকে — তাই server component থেকে সেই object পাঠানো যায় না।
 * তাই catalog lookup ও object তৈরি এই client component এর ভেতরেই করা হয়েছে,
 * যাতে ডিজাইন এক জায়গায় (CategoryCard) source of truth থাকে।
 *
 * শুধু CTA ও লিংক এখানকার সেকশনের মতো নিবন্ধন ফর্মে নিয়ে যাওয়া হয়েছে।
 *
 * `wide` দেওয়া হয় কারণ how-it-works-এর self-post row মোবাইলে single column,
 * অর্থাৎ কার্ডটি পুরো প্রস্থ পায় — তাই সাধারণ 3-up গ্রিডের মতো ছোট টাইপ নয়,
 * বরং পাশের লেখা কার্ডগুলোর সমান পরিমাণের লেখা দেখাতে হয়।
 */
export default function BloodDonorCard({
  compact = true,
  wide = false,
  mediaClassName,
}: {
  compact?: boolean;
  wide?: boolean;
  mediaClassName?: string;
}) {
  const homeCard = SHOP_TRAVEL_CATEGORY.items.find((item) => item.id === 'blood-donor');
  if (!homeCard) return null;

  const item: HomepageService = {
    ...homeCard,
    cta: 'নিবন্ধন করুন',
    href: '/profile/blood-donor/setup',
  };

  return (
    <CategoryCard
      item={item}
      compact={compact}
      wide={wide}
      mediaClassName={mediaClassName}
    />
  );
}
