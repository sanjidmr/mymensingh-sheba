import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import CityHero from './CityHero';
import CitySectionNav from './CitySectionNav';
import CityQuickFacts from './CityQuickFacts';
import NameOrigins from './NameOrigins';
import AncientMymensingh from './AncientMymensingh';
import HistoryTimeline from './HistoryTimeline';
import DivisionMap from './DivisionMap';
import Division2015 from './Division2015';
import NatureJourney from './NatureJourney';
import CultureHeritage from './CultureHeritage';
import EducationAndArts from './EducationAndArts';
import NotablePeople from './NotablePeople';
import BrahmaputraStory from './BrahmaputraStory';
import ZamindariHeritage from './ZamindariHeritage';
import MovementsAndWar from './MovementsAndWar';
import PresentMymensingh from './PresentMymensingh';
import TodayDashboard from './TodayDashboard';
import DidYouKnow from './DidYouKnow';
import ArchiveGallery from './ArchiveGallery';
import Sources from './Sources';
import CityClosing from './CityClosing';

/**
 * MymensinghCityPage — "ময়মনসিংহ পরিচিতি".
 *
 * Nineteen chapters, read as one continuous digital history album. The reading
 * order is deliberate:
 *
 *   01 quick facts      → what and when
 *   02 name origins     → why the name
 *   03 ancient          → the long background
 *   04 timeline         → the core interactive feature
 *   05 division         → Greater Mymensingh vs. today
 *   06 2015             → the division's birth
 *   07 nature           → land and river
 *   08 culture          → গীতিকা, লোকসঙ্গীত, নকশীকাঁথা
 *   09 education        → শিক্ষা ও শিল্প (+ জয়নুল আবেদিন)
 *   10 people           → who, and how they are connected
 *   11 river            → পুরাতন ব্রহ্মপুত্র
 *   12 zamindari        → land system and architecture
 *   13 movements        → ভাষা আন্দোলন ও মুক্তিযুদ্ধ
 *   14 present          → the city today
 *   15 today dashboard  → the four districts
 *   16 myths            → common misreadings
 *   17 gallery          → archive frames
 *   18 sources          → where this came from
 *   19 closing          → where to go next
 *
 * Interaction lives in the interactive components (tabs, timeline, map,
 * district switcher, gallery, sources); this file only composes, so the page
 * shell stays readable and every chapter can be edited on its own.
 */
export default function MymensinghCityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        <CityHero />
        <CitySectionNav />

        <CityQuickFacts />
        <NameOrigins />
        <AncientMymensingh />
        <HistoryTimeline />
        <DivisionMap />
        <Division2015 />
        <NatureJourney />
        <CultureHeritage />
        <EducationAndArts />
        <NotablePeople />
        <BrahmaputraStory />
        <ZamindariHeritage />
        <MovementsAndWar />
        <PresentMymensingh />
        <TodayDashboard />
        <DidYouKnow />
        <ArchiveGallery />
        <Sources />
        <CityClosing />
      </main>

      <Footer />
    </div>
  );
}
