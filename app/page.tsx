import React from 'react';
import Navbar from '@/components/Navbar';
import HeroServiceFinder from '@/components/HeroServiceFinder';
import ServiceCardsSection from '@/components/ServiceCardsSection';
import ToletPreviewSection from '@/components/ToletPreviewSection';
import TrustSection from '@/components/TrustSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import EmergencyBloodSection from '@/components/EmergencyBloodSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFDFB]">
      {/* Global Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero & Service Finder */}
        <HeroServiceFinder />

        {/* 2. Coherent 7 Launch Service Cards */}
        <ServiceCardsSection />

        {/* 3. Featured To-Let Preview with Price & Fee Breakdown */}
        <ToletPreviewSection />

        {/* 4. Trust & Security Architecture */}
        <TrustSection />

        {/* 5. 4-Step How It Works Workflow */}
        <HowItWorksSection />

        {/* 6. Emergency Blood Donor Section */}
        <EmergencyBloodSection />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
