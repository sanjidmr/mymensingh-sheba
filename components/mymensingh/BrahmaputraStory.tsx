import { Palette, Ship, Waves } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import ArchivePhoto from './ArchivePhoto';
import { CityLabel, TITLE_DARK, SCROLL_MT } from './CityBits';

/**
 * BrahmaputraStory — the emotional river chapter.
 *
 * The frame is a real archive slot for the Brahmaputra; the water-like motion
 * is a purely decorative CSS layer, so it is hidden from assistive tech.
 */
export default function BrahmaputraStory() {
  return (
    <section
      aria-labelledby="city-river-heading"
      id="city-river"
      className={`${SCROLL_MT} relative overflow-hidden bg-brand-950 text-brand-100`}
    >
      <ArchivePhoto
        src="/nodi.jpg"
        alt="পুরাতন ব্রহ্মপুত্রে নৌকা ও ভিটি"
        slotNote="পুরাতন ব্রহ্মপুত্রের আর্কাইভাল দৃশ্যের ছবির স্থান"
        icon="waves"
        sizes="100vw"
        fill
        imgClassName="object-cover opacity-35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/85 to-brand-950/50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-950 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <CityLabel index="১১" tone="dark">
            ব্রহ্মপুত্র
          </CityLabel>
          <h2 id="city-river-heading" className={`mt-3 ${TITLE_DARK}`}>
            ব্রহ্মপুত্র শুধু একটি নদী নয় — ময়মনসিংহের পরিচয়ের অংশ
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100/85 sm:text-base">
            যে নদীর তীরে এই শহর গড়ে উঠেছে, সে নদী আজও মানুষের জীবন থেকে
            বিচ্ছিন্ন হয়ে যায়নি। নৌকা, মাঝি, চরাঞ্চলের বাজার, মাছ আর বৃষ্টির
            খবর — সবকিছু একই জলের ওপর দাঁড়িয়ে।
          </p>
        </Reveal>

        <Reveal delay={90}>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Ship,
                  title: 'জীবিকা',
                  text: 'নৌকা ও মাঝির ধারায় চলে যাতায়াত আর মাঝির জীবিকা।',
                },
                {
                  icon: Waves,
                  title: 'প্রকৃতি',
                  text: 'নদী ও চর — বন্যা, পলি আর উর্বর মাটির উৎস।',
                },
                {
                  icon: Palette,
                  title: 'শিল্প ও সাহিত্য',
                  text: 'জয়নুল আবেদিনের অনেক চিত্রে এই নদী আর চরাঞ্চল।',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="rounded-xl border border-brand-800 bg-brand-900/60 p-4 backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-accent-400" aria-hidden="true" />
                    <h3 className="mt-2 text-sm font-extrabold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-brand-200/85">
                      {item.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Reveal>
      </div>
    </section>
  );
}
