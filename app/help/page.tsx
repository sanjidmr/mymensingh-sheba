'use client';

import React from 'react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    {
      q: 'Mymensingh Sheba কোন কোন এলাকায় সেবা দেয়?',
      a: 'আমরা শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন (MCC) এলাকার ৩৩টি ওয়ার্ডে সেবা পরিচালনা করি।',
    },
    {
      q: 'বাসা ভাড়ার ক্ষেত্রে প্ল্যাটফর্ম ফি কীভাবে নির্ধারিত হয়?',
      a: 'মেস বা সিট ভাড়ার ক্ষেত্রে প্ল্যাটফর্ম ফি ৳৫০। বাসা ভাড়ার ক্ষেত্রে: ১০,০০০ টাকা পর্যন্ত ৳১০০, ১০,০০১ থেকে ২০,০০০ টাকা পর্যন্ত ৳২০০ এবং ২০,০০০ টাকার ঊর্ধ্বে ৳৪০০। এই ফি তালিকা ও রসিদে সম্পূর্ণ স্বচ্ছভাবে প্রদর্শিত হয়।',
    },
    {
      q: 'কাজের বুয়া ও ইলেক্ট্রিশিয়ান সেবা কারা পরিচালনা করেন?',
      a: 'কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার ও বাসা পাল্টানো সেবা প্ল্যাটফর্মের অ্যাডমিন টিম সরাসরি যাচাই ও পরিচালনা করে থাকেন।',
    },
    {
      q: 'রক্তদাতার ফোন নম্বর সরাসরি দেওয়া হয় না কেন?',
      a: 'স্বেচ্ছাসেবী রক্তদাতাদের অহেতুক ফোন কল বা অপব্যবহার থেকে সুরক্ষিত রাখতে রোগীর সঠিক রিকুইজিশন স্লিপ যাচাইয়ের পর আমাদের টিম সরাসরি যোগাযোগ স্থাপন করে দেয়। রক্ত ক্রয়-বিক্রয় কঠোরভাবে নিষিদ্ধ।',
    },
  ];

  return (
    <RoutePlaceholderShell
      title="সাহায্য ও সাধারণ জিজ্ঞাসা (FAQ)"
      subtitle="ময়মনসিংহ সেবা ব্যবহারের নিয়মাবলী ও সচরাচর জানতে চাওয়া প্রশ্নগুলোর উত্তর।"
      categoryBadge="সহায়তা কেন্দ্র"
      breadcrumbs={[{ label: 'সাহায্য' }]}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 max-w-4xl mx-auto">
        {faqs.map((faq, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </RoutePlaceholderShell>
  );
}
