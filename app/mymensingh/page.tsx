import type { Metadata } from 'next';
import MymensinghCityPage from '@/components/mymensingh/MymensinghCityPage';

export const metadata: Metadata = {
  title: 'ময়মনসিংহ পরিচিতি - ইতিহাস, ঐতিহ্য ও সংস্কৃতি',
  description:
    'ময়মনসিংহের ডিজিটাল ইতিহাস অ্যালবাম - ১৭৮৭ থেকে বর্তমানের সময়রেখা, নামের বিভিন্ন উৎপত্তি, প্রাচীন জনপদ, বৃহত্তর ময়মনসিংহ থেকে আজকের চারটি জেলা, নদী, সংস্কৃতি, শিক্ষা, বিখ্যাত মানুষ, মুক্তিযুদ্ধের স্মৃতি ও তথ্যসূত্র।',
};

export default function Page() {
  return <MymensinghCityPage />;
}
