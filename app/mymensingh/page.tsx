import type { Metadata } from 'next';
import MymensinghCityPage from '@/components/mymensingh/MymensinghCityPage';

export const metadata: Metadata = {
  title: 'ময়মনসিংহ পরিচিতি — ইতিহাস, ঐতিহ্য ও সংস্কৃতি',
  description:
    'পুরাতন ব্রহ্মপুত্রের তীরের শহর ময়মনসিংহ — ইতিহাস, নামের উৎস, নদী, শিক্ষাপ্রতিষ্ঠান, সাহিত্য ও দর্শনীয় স্থানের একটি সম্পাদিত পরিচিতি।',
};

export default function Page() {
  return <MymensinghCityPage />;
}