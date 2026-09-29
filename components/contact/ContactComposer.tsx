import ContactChannels from './ContactChannels';
import ContactForm from './ContactForm';
import Reveal from '@/components/home/Reveal';

/**
 * ContactComposer — contact information on the left, the form on the right.
 *
 * This is the page's main event, so on desktop it is a single two-column
 * composition rather than two stacked sections: the channels act as the
 * supporting rail and the form keeps the wider column and the visual weight.
 * Below `lg` the same two blocks simply stack, channels first, so the order a
 * phone visitor meets them is still the sensible one.
 */
export default function ContactComposer() {
  return (
    <section
      aria-label="যোগাযোগের উপায় ও বার্তা পাঠানোর ফর্ম"
      className="border-y border-brand-100/70 bg-mist-50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
          <Reveal className="lg:sticky lg:top-24">
            <ContactChannels />
          </Reveal>

          <Reveal delay={90}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
