'use client';

import React from 'react';
import {
  Bed,
  Bath,
  Wind,
  Layers,
  Ruler,
  CalendarClock,
  DoorOpen,
} from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';

interface Fact {
  icon: React.ElementType;
  labelBn: string;
  value: string;
}

/**
 * PropertyFactGrid — the "at a glance" row of numbers.
 *
 * Why a flat spec row instead of an icon grid of cards:
 * a tenant scanning this page asks six questions in a fixed order — how many
 * rooms, how many baths, is there a balcony, which floor, how big, and when can
 * I move in. A single bordered strip that answers all six in one line reads as
 * a record. Six separate floating cards would read as decoration and would
 * push the description off-screen on a phone.
 *
 * Mess-like listings (mess / hostel / seat) swap "bedrooms" for total seats,
 * because for that audience the seat count is the only number that matters.
 * Only facts the owner actually filled in are rendered — a missing value is
 * never rendered as "0" or "-", it is simply omitted, so the strip can never
 * imply something the listing does not say.
 */
export function PropertyFactGrid({ listing }: { listing: ToletListing }) {
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const isMessLike = typeInfo?.isMessLike ?? false;
  const seatCount = listing.totalRooms ?? listing.bedrooms;

  const facts: Fact[] = [];

  facts.push({
    icon: isMessLike ? DoorOpen : Bed,
    labelBn: isMessLike ? 'মোট সিট' : 'রুম',
    value: `${toBengaliDigits(isMessLike ? seatCount : listing.bedrooms)} টি`,
  });

  if (listing.bathrooms > 0) {
    facts.push({
      icon: Bath,
      labelBn: 'বাথরুম',
      value: `${toBengaliDigits(listing.bathrooms)} টি`,
    });
  }

  if (listing.balconies > 0) {
    facts.push({
      icon: Wind,
      labelBn: 'বারান্দা',
      value: `${toBengaliDigits(listing.balconies)} টি`,
    });
  }

  if (listing.floor && listing.floor.trim()) {
    facts.push({ icon: Layers, labelBn: 'তলা', value: listing.floor });
  }

  // Area is not a first-class column yet, so it is read out of the free-text
  // description ("১,২০০ সেফট ফুট") when the owner happened to mention it.
  const areaText = extractAreaText(listing.description);
  if (areaText) {
    facts.push({ icon: Ruler, labelBn: 'আয়তন', value: areaText });
  }

  if (listing.availableFrom && listing.availableFrom.trim()) {
    facts.push({
      icon: CalendarClock,
      labelBn: 'উপলব্ধ',
      value: listing.availableFrom,
    });
  }

  if (facts.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-brand-100 bg-white px-3.5 py-3.5 sm:grid-cols-3 sm:px-4 lg:grid-cols-6">
      {facts.map((fact, i) => (
        <FactCell key={`${fact.labelBn}-${i}`} fact={fact} />
      ))}
    </dl>
  );
}

function FactCell({ fact }: { fact: Fact }) {
  const Icon = fact.icon;
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10.5px] font-medium leading-tight text-ink-400">
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span className="truncate">{fact.labelBn}</span>
      </dt>
      <dd className="mt-1 text-[13px] font-bold leading-snug text-ink-900">
        {fact.value}
      </dd>
    </div>
  );
}

/**
 * Pulls a floor-area figure out of the description when the owner wrote one.
 *
 * Bangla flat ads very often state the size in prose ("১,২০০ সেফট") rather than
 * filling a field, and the square footage is one of the first things a tenant
 * checks. Matching a few common phrasings surfaces that number as a fact chip
 * instead of making them hunt through the paragraph — and when nothing
 * matches, nothing is shown.
 */
function extractAreaText(description: string): string | null {
  if (!description) return null;
  const patterns = [
    /([০-৯\d][০-৯\d,.\s]{1,9})\s*(সেফট|সেফট\u09ac\u09df\u09b0\u09cd\u099f|বর্গফুট)/,
    /([০-৯\d][০-৯\d,.\s]{1,9})\s*(ফুট)/,
  ];
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const number = match[1].trim().replace(/\s+/g, ' ').replace(/[,\s]+$/, '');
      const unit = match[2] === 'ফুট' ? 'ফুট' : 'সেফট';
      return `${toBengaliDigits(number)} ${unit}`;
    }
  }
  return null;
}