import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';

export default function PrivacyPolicyPage() {
  return (
    <RoutePlaceholderShell
      title="গোপনীয়তা নীতি"
      subtitle="আপনার তথ্য কীভাবে ব্যবহার ও সুরক্ষিত রাখা হয় তা এখানে জানুন।"
      categoryBadge="গোপনীয়তা"
      breadcrumbs={[{ label: 'গোপনীয়তা নীতি' }]}
    >
      <article className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 sm:p-8 sm:text-base">
        <p>সর্বশেষ হালনাগাদ: ১২ নভেম্বর ২০২৬</p>
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">আমরা যে তথ্য সংগ্রহ করি</h2>
          <p>অ্যাকাউন্ট তৈরি ও সেবা ব্যবহারের সময় আপনার দেওয়া নাম, ইমেইল, ফোন নম্বর, প্রোফাইল তথ্য এবং অনুরোধ/বিজ্ঞাপনের বিবরণ ব্যবহার করা হয়। আপনি ছবি বা নথি আপলোড করলে তা সংশ্লিষ্ট সেবা বা প্রোফাইল দেখানোর জন্য সংরক্ষিত হয়।</p>
          <p className="mt-2">অ্যাপের পুশ নোটিফিকেশন চালু করলে ডিভাইস টোকেন সংরক্ষিত হয়, যাতে অনুরোধ বা অ্যাকাউন্টের গুরুত্বপূর্ণ আপডেট পাঠানো যায়। বর্তমান অ্যাপে কাছাকাছি সেবা খোঁজার অবস্থান-ভিত্তিক সুবিধা চালু নেই; ভবিষ্যতে চালু হলে কেবল আপনার অনুরোধ ও অনুমতিতে অবস্থান ব্যবহার করা হবে।</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">তথ্যের ব্যবহার</h2>
          <p>তথ্য অ্যাকাউন্ট পরিচালনা, অনুরোধ সংশ্লিষ্ট সেবা প্রদানকারীর কাছে পৌঁছানো, নিরাপত্তা ও অপব্যবহার প্রতিরোধ, এবং ঐচ্ছিক পুশ আপডেট পাঠাতে ব্যবহৃত হয়। ওয়েবসাইটের পরিসংখ্যানে ব্যক্তিগত বার্তা বা পাসওয়ার্ড পাঠানো হয় না।</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">তথ্য সংরক্ষণ ও শেয়ার</h2>
          <p>অ্যাকাউন্ট ও মার্কেটপ্লেস ডেটা Supabase-এ সংরক্ষিত হয়। সেবা সম্পন্ন করতে প্রয়োজনীয় তথ্য কেবল সংশ্লিষ্ট সেবা প্রদানকারী বা প্রশাসনিক কর্মীদের সাথে শেয়ার করা হতে পারে। আমরা ব্যক্তিগত তথ্য বিক্রি করি না।</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">আপনার নিয়ন্ত্রণ</h2>
          <p>আপনি প্রোফাইল তথ্য সংশোধন করতে, নোটিফিকেশন অনুমতি বন্ধ করতে, অথবা অ্যাকাউন্ট/তথ্য সংক্রান্ত অনুরোধ জানাতে পারেন। তথ্য মুছে ফেলার ক্ষেত্রে আইনগত, নিরাপত্তা বা অনুরোধ-সম্পর্কিত রেকর্ড সংরক্ষণের প্রয়োজন প্রযোজ্য হতে পারে।</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">যোগাযোগ</h2>
          <p>গোপনীয়তা বিষয়ে প্রশ্ন বা তথ্য-সংক্রান্ত অনুরোধের জন্য <a className="font-semibold text-brand-700 underline" href="/contact">যোগাযোগ পৃষ্ঠায়</a> বার্তা দিন।</p>
        </section>
      </article>
    </RoutePlaceholderShell>
  );
}
