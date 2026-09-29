import { CalendarDays, Layers, MapPin } from 'lucide-react';
import ArchivePhoto from './ArchivePhoto';
import { DARK_FOCUS } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const STRIP = [
  { icon: CalendarDays, label: 'জেলা প্রতিষ্ঠা', value: `${toBengaliDigits(1787)} · ১ মে` },
  { icon: Layers, label: 'বর্তমান বিভাগ', value: toBengaliDigits(2015) },
  { icon: MapPin, label: 'বাংলাদেশের', value: 'অষ্টম প্রশাসনিক বিভাগ' },
];

/**
 * CityHero — cinematic opening. A dark river-toned surface, one strong
 * statement and a compact information strip, backed by /mymensingh.jpg. If
 * that file is ever removed it degrades to a labelled archive frame rather
 * than a broken image.
 */
export default function CityHero() {
  return (
    <section
      aria-labelledby="city-hero-heading"
      className="relative overflow-hidden bg-brand-950 text-brand-100"
    >
      <ArchivePhoto
        src="/mymensingh.jpg"
        alt="ময়মনসিংহ শহরের একটি দৃশ্য"
        slotNote="পুরাতন ব্রহ্মপুত্রের আর্কাইভাল ছবির স্থান"
        icon="waves"
        eager
        sizes="100vw"
        fill
        imgClassName="object-cover opacity-45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-brand-950/45"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pb-14 sm:pt-20 lg:px-8 lg:pb-16 lg:pt-24">
        <p className="mms-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900/70 px-3 py-1.5 text-[11px] font-bold text-accent-300 sm:text-xs">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          ময়মনসিংহ · একটি পরিচিতি
        </p>

        <h1
          id="city-hero-heading"
          className="mms-fade-up mx-auto mt-4 max-w-3xl text-[1.85rem] font-extrabold leading-[1.22] tracking-tight text-white sm:text-4xl lg:text-5xl"
          style={{ animationDelay: '80ms' }}
        >
          ময়মনসিংহ পরিচিতি
        </h1>

        <p
          className="mms-fade-up mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-relaxed text-accent-200 sm:text-lg"
          style={{ animationDelay: '150ms' }}
        >
          ইতিহাস, ঐতিহ্য, সংস্কৃতি আর মানুষের গল্পে গড়ে ওঠা এক জনপদ
        </p>

        <p
          className="mms-fade-up mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-brand-100/85 sm:text-base"
          style={{ animationDelay: '220ms' }}
        >
          পুরাতন ব্রহ্মপুত্রের তীরে গড়ে ওঠা এই শহর — একদিকে লালমাটির চর, অন্যদিকে
          বিশ্ববিদ্যালয়, জাদুঘর আর লোকগীতির ঐতিহ্য। নামের বহু রূপ, জেলা বিভাজনের
          ইতিহাস আর মুক্তিযুদ্ধের স্মৃতি — সবকিছু নিয়ে একটি খোলা অ্যালবাম।
        </p>

        <dl
          className="mms-fade-up mt-7 grid gap-px overflow-hidden rounded-xl border border-brand-800 bg-brand-800 sm:grid-cols-3"
          style={{ animationDelay: '290ms' }}
        >
          {STRIP.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-brand-950/85 px-4 py-3.5 backdrop-blur-sm">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-300">
                <Icon className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1 text-sm font-extrabold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="relative mx-auto w-full max-w-7xl px-4 pb-4 text-[10px] leading-relaxed text-brand-300/70 sm:px-6 lg:px-8">
        ছবির উৎস ও লাইসেন্স প্রতিটি ফ্রেমের নিচে উল্লেখ করা হবে; যাচাই না হওয়া
        ছবি কখনো “ঐতিহাসিক ছবি” হিসেবে উপস্থাপিত হবে না।{' '}
        <a
          href="#city-sources"
          className={`font-bold text-accent-300 underline underline-offset-4 ${DARK_FOCUS} rounded-sm`}
        >
          তথ্যসূত্র দেখুন
        </a>
      </p>
    </section>
  );
}
