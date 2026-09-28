import { ArrowDown, Map } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const SEQUENCE = [
  { year: null, label: 'বৃহত্তর ময়মনসিংহ', note: 'অনেকগুলো আজকের জেলা নিয়ে এক বিশাল প্রশাসনিক এলাকা' },
  { year: 1969, label: 'টাঙ্গাইল পৃথক জেলা', note: toBengaliDigits(1969) },
  { year: 1978, label: 'জামালপুর পৃথক জেলা', note: toBengaliDigits(1978) },
  { year: 1984, label: 'শেরপুর, নেত্রকোনা ও কিশোরগঞ্জ পৃথক জেলা', note: toBengaliDigits(1984) },
  { year: null, label: 'বর্তমান ময়মনসিংহ জেলা', note: 'চারপাশে ছোট জেলা, কেন্দ্রে একটি জেলা' },
  { year: 2015, label: 'ময়মনসিংহ বিভাগ', note: toBengaliDigits(2015) },
];

/**
 * DivisionMap — how Greater Mymensingh became today's division.
 *
 * The map is a deliberately labelled schematic (relative positions, not a
 * surveyed boundary) because we do not have a licensed boundary dataset. Saying
 * so on the page is more honest than shipping a fake-accurate outline.
 */
export default function DivisionMap() {
  return (
    <CitySection labelledBy="city-division-heading" id="city-division" className="border-b border-brand-100 bg-white">
      <div className="grid gap-9 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-14">
        <div>
          <Reveal>
            <CityLabel index="০৫">প্রশাসনিক পরিবর্তন</CityLabel>
            <h2 id="city-division-heading" className={`mt-3 ${TITLE}`}>
              বৃহত্তর ময়মনসিংহ থেকে বর্তমান ময়মনসিংহ
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
              আজকের ময়মনসিংহ একসময় এত বড় ছিল না। একটি বিশাল প্রশাসনিক এলাকা ধীরে ধীরে
              ভাঙতে ভাঙতে আজকের চারটি জেলা তৈরি হয়েছে — এবং সেই এলাকা নিয়েই ২০১৫ সালে
              বিভাগ গঠিত হয়েছে।
            </p>
          </Reveal>

          <Reveal delay={70}>
            <ol className="mt-6 space-y-1">
              {SEQUENCE.map((step, index) => {
                const isLast = index === SEQUENCE.length - 1;
                return (
                  <li key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                          isLast
                            ? 'bg-accent-400 text-brand-950'
                            : 'border border-brand-300 bg-white text-brand-700'
                        }`}
                      >
                        {toBengaliDigits(index + 1)}
                      </span>
                      {!isLast ? (
                        <span aria-hidden="true" className="my-1 w-px flex-1 bg-brand-200" />
                      ) : null}
                    </div>
                    <div className={`min-w-0 ${isLast ? '' : 'pb-4'}`}>
                      <p className="text-sm font-extrabold text-ink-900">{step.label}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{step.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="rounded-2xl border border-brand-100 bg-mist-50 p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-brand-600">
              <Map className="h-4 w-4" aria-hidden="true" />
              ময়মনসিংহ বিভাগ · চারটি জেলা
            </p>

            <svg
              viewBox="0 0 320 260"
              role="img"
              aria-label="ধারণামূলক মানচিত্র: ময়মনসিংহ বিভাগের চারটি জেলা — নেত্রকোনা উত্তরে, ময়মনসিংহ পশ্চিমে, শেরপুর মাঝখানে ও জামালপুর পূর্বে"
              className="mt-3 h-auto w-full"
            >
              <rect x="0" y="0" width="320" height="260" fill="none" />
              <path
                d="M96 18 L206 26 L214 84 L160 104 L84 92 L78 46 Z"
                fill="#e0e9e0"
                stroke="#a5c0a7"
                strokeWidth="1.5"
              />
              <path
                d="M18 96 L96 84 L118 128 L96 196 L34 208 L12 158 Z"
                fill="#6d9773"
                stroke="#4a7857"
                strokeWidth="1.5"
              />
              <path
                d="M118 106 L206 92 L228 132 L200 186 L126 190 L112 146 Z"
                fill="#c5d6c6"
                stroke="#84a68b"
                strokeWidth="1.5"
              />
              <path
                d="M232 40 L306 56 L312 132 L286 190 L232 176 L220 116 Z"
                fill="#4a7857"
                stroke="#0c3b2e"
                strokeWidth="1.5"
              />
              <text x="147" y="66" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2b3a31">
                নেত্রকোনা
              </text>
              <text x="62" y="146" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff">
                ময়মনসিংহ
              </text>
              <text x="168" y="146" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2b3a31">
                শেরপুর
              </text>
              <text x="266" y="118" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
                জামালপুর
              </text>
            </svg>

            <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-ink-500">
              <ArrowDown className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              ধারণামূলক মানচিত্র — জেলাগুলোর আপেক্ষিক অবস্থান দেখানো হয়েছে; প্রকৃত
              প্রশাসনিক সীমানা নয়।
            </p>
          </div>
        </Reveal>
      </div>
    </CitySection>
  );
}
