import { BookOpen, Music4, Palette, Sparkles, Users } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE } from './CityBits';

const FOLK = [
  { name: 'ময়মনসিংহ গীতিকা', body: 'মায়া লিখনের ধারায় রচিত বিশাল গীতি সংকলন — বাংলা লোকসাহিত্যের অন্যতম বড় নিদর্শন।' },
  { name: 'মহুয়া', body: 'নৌকায় চড়ে বা নৌকার সঙ্গে জলে ভাসা রূপে গাওয়া একটি বিশেষ ধরনের লোকগান।' },
  { name: 'মলুয়া', body: 'শ্রমজীবী ও নৌকাজীবী জনগোষ্ঠীর ঐতিহ্যবাহী লোকসঙ্গীত।' },
  { name: 'চন্দ্রাবতী', body: 'নারী কণ্ঠে প্রচলিত একটি জনপ্রিয় লোকগীতির নাম।' },
  { name: 'দেওয়ানা মদিনা', body: 'লোকসঙ্গীতে প্রচলিত একটি পুরোনো ধারার নাম।' },
  { name: 'কাজলরেখা', body: 'লোকসঙ্গীত ও লোকনাট্যে প্রচলিত বিশেষ ধারার নাম।' },
  { name: 'নকশীকাঁথা', body: 'শিল্পকলায় বিখ্যাত নকশিকাঁথার চর্চা ময়মনসিংহেই বিশেষভাবে প্রসিদ্ধ।' },
  { name: 'পালাগান', body: 'নৌকা ও নদীঘাটের সঙ্গে জড়িত ঐতিহ্যবাহী লোকগান।' },
];

/**
 * CultureHeritage — the folk chapter. The Mymensingh Gīṭikā is the headline
 * because it carries the region's claim to national and international
 * literary significance; everything else is presented as part of the same
 * living tradition rather than a museum list.
 */
export default function CultureHeritage() {
  return (
    <CitySection labelledBy="city-culture-heading" id="city-culture" className="border-y border-brand-100 bg-white">
      <div className="grid gap-9 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <Reveal>
          <CityLabel index="০৮">সংস্কৃতি ও লোকঐতিহ্য</CityLabel>
          <h2 id="city-culture-heading" className={`mt-3 ${TITLE}`}>
            গান, গল্প আর লোকজ জীবনের ময়মনসিংহ
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            নদীর তীরের জনপদে লোকসংগীত সাধারণ বিষয় নয় — এখানে গান মানুষের পেশা,
            দৈনন্দিন যাতায়াত আর বাণিজ্যের সঙ্গে জড়িয়ে আছে।
          </p>

          <div className="mt-6 rounded-2xl border border-bronze-200 bg-bronze-50 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-bronze-600">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              সবচেয়ে গুরুত্বপূর্ণ সম্পদ
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-ink-900">ময়মনসিংহ গীতিকা</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              মায়া লিপিতে রচিত এই বিশাল গীতি সংকলন বাংলা লোকসাহিত্যের অন্যতম
              বড় নিদর্শন এবং আন্তর্জাতিকভাবে স্বীকৃত। একটি অঞ্চলের নিজস্ব ভাষা ও
              স্মৃতির এত বড় একটি নথি — এর চেয়ে বড় সম্মান লোকজ সংস্কৃতির জন্য
              আর কী হতে পারে?
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-600">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" aria-hidden="true" />
              <span>
                লোকসঙ্গীত, লোককথা, নকশীকাঁথা আর নৌকাজীবনের ঐতিহ্য — এসব একসাথে
                ময়মনসিংহের সাংস্কৃতিক পরিচয়।
              </span>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[Music4, Palette, Users].map((Icon, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-mist-50 px-3 py-1.5 text-xs font-bold text-brand-700"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {['লোকসংগীত', 'নকশীকাঁথা', 'গ্রামীণ জীবন'][i]}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={90}>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-brand-100 bg-brand-100 sm:grid-cols-2">
            {FOLK.map((item) => (
              <li key={item.name} className="bg-white p-4">
                <h3 className="text-sm font-extrabold text-ink-900">{item.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </CitySection>
  );
}
