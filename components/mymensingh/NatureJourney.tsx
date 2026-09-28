import { Sprout, Trees, Mountain, Waves, Droplets } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import ArchivePhoto from './ArchivePhoto';
import { CityLabel, CitySection, TITLE } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const LAYERS = [
  {
    icon: Waves,
    title: 'নদী',
    body: 'পুরাতন ব্রহ্মপুত্র আর তার শাখা — যাতায়াত, মাছ, বাণিজ্য আর চরাঞ্চলের জীবন এই জলের ওপর দাঁড়িয়ে।',
    src: '/mymensingh/brahmaputra-boats.jpg',
    alt: 'পুরাতন ব্রহ্মপুত্রে নৌকা ও ভিটি',
  },
  {
    icon: Trees,
    title: 'বনাঞ্চল',
    body: 'মধুপুর গড়ের চারপাশের বন ও বনজাতি — বাংলার প্রকৃতি ঐতিহ্যের একটি বড় অংশ।',
    src: '/mymensingh/forest.jpg',
    alt: 'ময়মনসিংহ অঞ্চলের বনাঞ্চল',
  },
  {
    icon: Mountain,
    title: 'পাহাড়',
    body: 'গারো পাহাড় ও বরেন্দ্র অঞ্চল — পাথর, বন ও দৃশ্যের এক অনন্য মিশ্রণ।',
    src: '/mymensingh/garo-hill.jpg',
    alt: 'গারো পাহাড়ের প্রাকৃতিক দৃশ্য',
  },
  {
    icon: Droplets,
    title: 'হাওর ও জলাভূমি',
    body: 'হাওর, বিল ও জলাভূমি — শীতের পাখি, মাছ ও চরা চাষের জীবন্ত ভূমিরূপ।',
    src: '/mymensingh/haor.jpg',
    alt: 'ময়মনসিংহ অঞ্চলের হাওর ও জলাভূমি',
  },
  {
    icon: Sprout,
    title: 'লালমাটির কৃষিজমি',
    body: 'লালমাটি — উর্বর কৃষিভূমি। ধান, সবজি ও ফল চাষে এই মাটির নিজস্ব ভূমিকা রয়েছে।',
    src: '/mymensingh/red-soil.jpg',
    alt: 'লালমাটির কৃষিজমি',
  },
];

/**
 * NatureJourney — geography told as a sequence: নদী → বন → পাহাড় → হাওর → কৃষিজমি.
 * Every frame is an archive slot so no unverified photograph is passed off as
 * real scenery.
 */
export default function NatureJourney() {
  return (
    <CitySection labelledBy="city-nature-heading" id="city-nature" className="bg-mist-50">
      <Reveal className="max-w-2xl">
        <CityLabel index="০৭">ভূপ্রকৃতি ও প্রকৃতি</CityLabel>
        <h2 id="city-nature-heading" className={`mt-3 ${TITLE}`}>
          নদী, পাহাড়, হাওর আর লালমাটির ময়মনসিংহ
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          একটি জেলার চেহারা তার নদী আর মাটি দিয়ে তৈরি। নিচে পাঁচটি স্তরে এই ভূমির
          বৈশিষ্ট্য সাজিয়ে দেখানো হলো।
        </p>
      </Reveal>

      <ol className="mt-8 space-y-8">
        {LAYERS.map((layer, index) => {
          const Icon = layer.icon;
          const flip = index % 2 === 1;
          return (
            <Reveal
              as="li"
              key={layer.title}
              delay={index * 60}
              className="grid gap-4 lg:grid-cols-2 lg:items-center lg:gap-10"
            >
              <ArchivePhoto
                src={layer.src}
                alt={layer.alt}
                slotNote={`${layer.title} — আর্কাইভাল দৃশ্যের ছবির স্থান`}
                icon={layer.title === 'নদী' ? 'waves' : 'landmark'}
                className={`aspect-[16/10] w-full rounded-2xl ${
                  flip ? 'lg:order-2' : ''
                }`}
                sizes="(max-width: 1023px) 100vw, 48vw"
              />
              <div className={flip ? 'lg:order-1' : ''}>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-700">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  ধাপ {toBengaliDigits(String(index + 1).padStart(2, '0'))}
                </span>
                <h3 className="mt-2.5 text-lg font-extrabold text-ink-900">{layer.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{layer.body}</p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </CitySection>
  );
}
