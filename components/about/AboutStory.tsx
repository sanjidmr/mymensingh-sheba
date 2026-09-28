import Image from 'next/image';
import { Quote } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

/**
 * AboutStory — "আমরা আসলে কী?"
 *
 * The origin story, set as an editorial two-column piece: narrative on the
 * left, an authentic local service collage on the right. On mobile the collage
 * comes after the text so the paragraph flow is never interrupted.
 */
export default function AboutStory() {
  return (
    <AboutSection labelledBy="about-story-heading" className="bg-mist-50">
      <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div>
          <Reveal>
            <SectionLabel>আমাদের সম্পর্কে</SectionLabel>
            <h2
              id="about-story-heading"
              className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
            >
              আমরা আসলে কী?
            </h2>
          </Reveal>

          <Reveal delay={70}>
            <div className="mt-4 space-y-3.5 text-[15px] leading-relaxed text-ink-600">
              <p>
                ময়মনসিংহে একটি বাসা খুঁজতে গেলে আপনাকে পরিচিত মানুষের সাথে ফোন করতে হয়,
                পাশের এলাকার বার্তা ঘুরতে হয়, কখনো কখনো ভুল ঠিকানায় চলে যেতে হয়। কাজের
                বুয়া, ইলেক্ট্রিশিয়ান বা গৃহশিক্ষক — যাদের খোঁজা দরকার, তাদের সঠিকভাবে খুঁজে
                পাওয়াটাই আসল সমস্যা।
              </p>
              <p>
                অথচ প্রয়োজনটা খুব সাধারণ। একটা ফোন নম্বর, একটা সঠিক ঠিকানা আর একজন
                বিশ্বস্ত মানুষ — এতটুকুই দরকার। প্রয়োজনের জন্য যত ঝামেলা, ততটাই অযথা।
              </p>
              <p>
                <span className="font-bold text-ink-900">
                  Mymensingh Sheba এই ফাঁকটাই পূরণ করতে তৈরি।
                </span>{' '}
                শহরের প্রয়োজনীয় সেবা আর প্রয়োজনীয় মানুষকে একটি সহজ ঠিকানায় মেলানো —
                এটি শুধু একটি ওয়েবসাইট নয়, ময়মনসিংহের মানুষের দৈনন্দিন জীবনকে একটু
                সহজ করার চেষ্টা।
              </p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <blockquote className="mt-6 flex gap-3 border-l-2 border-accent-400 pl-4">
              <Quote className="h-5 w-5 shrink-0 text-accent-500" aria-hidden="true" />
              <p className="text-sm font-bold leading-relaxed text-ink-900 sm:text-[15px]">
                একটি শহরের হাজারো ছোট ছোট প্রয়োজনের জন্য একটি সহজ, স্পষ্ট ও
                নির্ভরযোগ্য ঠিকানা।
              </p>
            </blockquote>
          </Reveal>
        </div>

        <Reveal delay={100} className="relative">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-brand-100 sm:aspect-[4/5]">
            <Image
              src="/kajerbua.jpg"
              alt="ময়মনসিংহে কাজের বুয়া সেবা নেওয়ার কাজ"
              fill
              sizes="(max-width: 1023px) 92vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-3 w-28 overflow-hidden rounded-xl border-4 border-mist-50 bg-white shadow-lg sm:-left-5 sm:w-36">
            <div className="relative aspect-square">
              <Image
                src="/e&p.jpg"
                alt="এলাকায় ইলেক্ট্রিশিয়ান ও প্লাম্বার সেবাদেওয়া"
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
          </div>
          <p className="mt-7 text-xs font-medium text-ink-500 sm:mt-8">
            ময়মনসিংহের বাস্তব চাহিদা থেকেই প্রতিটি সেবার পথ খোলা হয়েছে।
          </p>
        </Reveal>
      </div>
    </AboutSection>
  );
}
