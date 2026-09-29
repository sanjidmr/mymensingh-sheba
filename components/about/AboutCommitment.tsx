import Image from 'next/image';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

const AUDIENCES = [
  { title: 'স্থানীয় মানুষ', text: 'যাদের প্রতিদিন কোনো না কোনো সেবা দরকার হয়।' },
  { title: 'ছোট সেবাপ্রদানকারী', text: 'যারা নিজের পেশায় পারদর্শী, কাজ পেতে চান।' },
  { title: 'সেবা নেওয়ারকারী', text: 'যারা দ্রুত ও নির্ভরযোগ্য কাউকে খুঁজছেন।' },
  { title: 'স্থানীয় ব্যবসা', text: 'যারা নিজের পরিচিতি মানুষের কাছে পৌঁছাতে চান।' },
];

/**
 * AboutCommitment — the emotional close of the story, built on a real local
 * photograph (decorative, so an empty alt is correct here) rather than a
 * generic city skyline.
 */
export default function AboutCommitment() {
  return (
    <section aria-labelledby="about-commitment-heading" className="relative bg-brand-950">
      <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-72">
        <Image
          src="/sheba1.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-brand-950/70"
        />
      </div>

      <AboutSection labelledBy="about-commitment-heading" className="bg-brand-950">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <Reveal>
            <SectionLabel tone="dark">ময়মনসিংহের প্রতি আমাদের অঙ্গীকার</SectionLabel>
            <h2
              id="about-commitment-heading"
              className="mt-3 text-xl font-extrabold leading-[1.35] tracking-tight text-white sm:text-2xl lg:text-[1.9rem]"
            >
              আমরা শুধু একটি ওয়েবসাইট বানাতে চাই না — আমরা ময়মনসিংহের মানুষের জন্য
              একটি কার্যকর ডিজিটাল পরিবেশ তৈরি করতে চাই।
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-brand-100/80">
              একটি শহরের সবাইকে একই সহজ ঠিকানায় নিয়ে আসা কঠিন কাজ, তবে এই লক্ষ্যেই
              আমরা এগোচ্ছি। স্থানীয় মানুষ, ছোট সেবাপ্রদানকারী, সেবা নেওয়ারকারী ও
              স্থানীয় ব্যবসা — সবাইকে একটি সহময়ী প্ল্যাটফর্মে যুক্ত করাই আমাদের
              দীর্ঘমেয়াদি ভাবনা।
            </p>
          </Reveal>

          <ul className="grid gap-3 sm:grid-cols-2">
            {AUDIENCES.map((audience, index) => (
              <Reveal
                as="li"
                key={audience.title}
                delay={index * 60}
                className="rounded-xl border border-brand-800 bg-brand-900/70 p-4"
              >
                <h3 className="text-[15px] font-extrabold text-white">
                  {audience.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-200/85">
                  {audience.text}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </AboutSection>
    </section>
  );
}
