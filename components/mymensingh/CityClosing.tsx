import { ArrowRight, Compass } from 'lucide-react';
import { CityHeading } from './CityBits';

const LINKS = [
  { href: '/services', label: 'সেবাসমূহ', note: 'কী কী সেবা পাওয়া যায়' },
  { href: '/about', label: 'পরিচিতি', note: 'আমাদের সম্পর্কে' },
  { href: '/contact', label: 'যোগাযোগ', note: 'প্রশ্ন ও মতামত' },
];

/**
 * CityClosing — low-key sign-off. Deliberately not a promo block: the page is
 * a reference, so the only actions offered are "read the rest of the site" and
 * "tell us something".
 */
export default function CityClosing() {
  return (
    <section
      aria-labelledby="city-closing-heading"
      id="city-closing"
      className="relative overflow-hidden bg-brand-950 text-brand-100"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <CityHeading
          id="city-closing-heading"
          index="১৯"
          eyebrow="শেষ কথা"
          title="ইতিহাস জানলে বর্তমান বোঝা যায়"
          intro="ময়মনসিংহের গল্প শুধু অতীতের নয় — নদী, চাষ, পাখি আর মানুষের জীবন আজও এখানে চলছে। কিছু তথ্য এখনো যাচাইয়ের অপেক্ষায় আছে; সেগুলো যাচাই হলে এখানে যুক্ত হবে।"
          tone="dark"
        />

        <nav aria-label="পরবর্তী পাতা" className="mt-8 grid gap-3 sm:grid-cols-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex min-h-[64px] items-center gap-3 rounded-2xl border border-brand-800 bg-brand-900/60 px-4 py-3.5 transition-colors hover:border-brand-600 hover:bg-brand-900"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold text-white">
                  {link.label}
                </span>
                <span className="block text-[12px] text-brand-300">{link.note}</span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-accent-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2.5 text-center text-[12px] leading-relaxed text-brand-400/85">
          <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            এই পাতার তথ্য সংগ্রহ ও যাচাইয়ের কাজ চলমান। ভুল বা অসম্পূর্ণ তথ্য চিহ্নিত
            করে দিলে আমরা কৃতজ্ঞ থাকব।
          </span>
        </p>
      </div>
    </section>
  );
}
