import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

const VALUES = [
  {
    title: 'বিশ্বাস',
    text: 'মানুষের আস্থা অর্জন ও ধরে রাখাকে আমরা সবচেয়ে বেশি গুরুত্ব দিই। আস্থা একবার পাওয়া কঠিন, কিন্তু একবার হারালে তা অনেক কঠিন।',
  },
  {
    title: 'সহজতা',
    text: 'প্রযুক্তিকে জটিল রেখে না দিয়ে সহজ করে মানুষের দৈনন্দিন জীবনের কাছে নিয়ে আসার চেষ্টা করি।',
  },
  {
    title: 'স্থানীয়তা',
    text: 'ময়মনসিংহের বাস্তব প্রয়োজন এবং এখানকার মানুষকে কেন্দ্র করে কাজ করি — বাইরের কোনো ছক নয়।',
  },
  {
    title: 'দায়িত্বশীলতা',
    text: 'তথ্য ও সেবা অভিজ্ঞতা আরও নির্ভরযোগ্য করার জন্য দায়িত্বশীলভাবে কাজ করা আমাদের অঙ্গীকার।',
  },
];

/**
 * AboutValues — four core values, set with hairline rules and numerals
 * instead of identical cards, so the section stays calm and editorial.
 */
export default function AboutValues() {
  return (
    <AboutSection labelledBy="about-values-heading" className="bg-mist-100">
      <Reveal>
        <SectionLabel>আমাদের মূল্যবোধ</SectionLabel>
        <h2
          id="about-values-heading"
          className="mt-3 max-w-2xl text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
        >
          চারটি সহজ নীতি, প্রতিদিন মেনে চলা
        </h2>
      </Reveal>

      <ul className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {VALUES.map((value, index) => (
          <Reveal
            as="li"
            key={value.title}
            delay={index * 60}
            className="border-t border-brand-200 pt-4"
          >
            <h3 className="text-base font-extrabold text-ink-900">
              <span className="mr-2 text-xs font-bold text-accent-700">
                {['০১', '০২', '০৩', '০৪'][index]}
              </span>
              {value.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{value.text}</p>
          </Reveal>
        ))}
      </ul>
    </AboutSection>
  );
}
