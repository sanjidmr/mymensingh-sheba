'use client';

import HeroCarousel, { type HeroSlide } from '@/components/home/HeroCarousel';

/**
 * Hero copy — warm, place-rooted (Mymensingh), premium and human.
 * Layout lives in HeroCarousel: desktop (image-first hero + intro block below)
 * and mobile (headline → swipeable carousel → thumb-friendly search).
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/sheba1.png',
    tag: 'সেবা খুঁজুন',
    title: 'ময়মনসিংহের ভিতরে আপনার পছন্দের সেবা খুঁজে নিন',
    subtitle: 'ফ্ল্যাট, রুম, ব্যাচেলর, মেস-হোস্টেলসহ সব সেবা এক জায়গায় — এলাকা ও বাজেট অনুযায়ী যাচাইকৃত তালিকা।',
  },
  {
    src: '/sheba2.png',
    tag: 'বাসা • মেস • হোস্টেল',
    title: 'আপনার পছন্দের বাসা, মেস, হোস্টেল খুঁজে নিন',
    subtitle: 'ঘর খোঁজা এখন আরও সহজ — ফ্ল্যাট, রুম, ব্যাচেলর, মেস ও হোস্টেলের নির্ভরযোগ্য তালিকা।',
  },
  {
    src: '/sheba3.png',
    tag: 'মেরামত • গৃহকর্মী',
    title: 'জরুরি মেরামতে অভিজ্ঞ টেকনিশিয়ান এবং বাসায় চাওয়া গৃহকর্মী খুঁজে নিন',
    subtitle: 'শর্ট সার্কিট থেকে পাইপ-লিক, আর বাসায় এবার নিয়মিত গৃহকর্মী — সবকিছু দরজায় দরজায়।',
  },
  {
    src: '/sheba4.png',
    tag: 'গৃহশিক্ষক • রক্তদাতা',
    title: 'গৃহশিক্ষক এবং জরুরি রক্তদাতা খুঁজে নিন',
    subtitle: 'পড়াশোনার জন্য অভিজ্ঞ গৃহশিক্ষক, আর জরুরি রক্তের প্রয়োজনে সম্পূর্ণ বিনামূল্যে রক্তদাতা।',
  },
];

export default function HeroSection() {
  return <HeroCarousel slides={HERO_SLIDES} interval={4800} />;
}