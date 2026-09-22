/**
 * Admin-managed Home Moving (বাসা পাল্টানো) domain types.
 *
 * Business rules:
 *  - Customer submits a Moving Request; Admin reviews, assigns, and quotes the
 *    price manually. There is NO automatic pricing.
 *  - Pickup and destination MUST be MCC location ids (lib/locations.ts).
 *  - Customer phone and detailed addresses are private: only the customer and
 *    admins can read request rows (RLS + facade both enforce).
 */
import type { ServiceRequestStatus } from '@/lib/supabase/types';

export const HOME_MOVING_SLUG = 'home-moving' as const;

/** Selectable moving items with optional quantity where useful. */
export interface HomeMovingItemOption {
  id: string;
  labelBn: string;
  /** Whether a quantity controller should be shown for this item. */
  allowQuantity: boolean;
}

export const HOME_MOVING_ITEMS: HomeMovingItemOption[] = [
  { id: 'bed', labelBn: 'বেড / খাট', allowQuantity: true },
  { id: 'sofa', labelBn: 'সোফা', allowQuantity: true },
  { id: 'fridge', labelBn: 'ফ্রিজ', allowQuantity: true },
  { id: 'tv', labelBn: 'টিভি', allowQuantity: true },
  { id: 'wardrobe', labelBn: 'আলমারি', allowQuantity: true },
  { id: 'table', labelBn: 'টেবিল', allowQuantity: true },
  { id: 'chair', labelBn: 'চেয়ার', allowQuantity: true },
  { id: 'washing_machine', labelBn: 'ওয়াশিং মেশিন', allowQuantity: true },
  { id: 'other', labelBn: 'অন্যান্য মালামাল', allowQuantity: false },
];

export interface HomeMovingItem {
  id: string;
  labelBn: string;
  quantity?: number;
}

export interface HomeMovingFloorOption {
  id: string;
  labelBn: string;
}

/** Common floor choices; free-text floor is also acceptable in the form. */
export const HOME_MOVING_FLOOR_OPTIONS: HomeMovingFloorOption[] = [
  { id: 'ground', labelBn: 'Ground / নিচ তলা' },
  { id: '1', labelBn: '১ম তলা' },
  { id: '2', labelBn: '২য় তলা' },
  { id: '3', labelBn: '৩য় তলা' },
  { id: '4', labelBn: '৪র্থ তলা' },
  { id: '5', labelBn: '৫ম তলা' },
  { id: '6+', labelBn: '৬ষ্ঠ তলা বা তার বেশি' },
];

export const HOME_MOVING_TIME_SLOTS = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'যেকোনো সময়',
];

/** Domain request shape used by the admin console (mirrors service_requests row). */
export interface HomeMovingRequest {
  id: string;
  customerId: string;
  serviceSlug: 'home-moving';
  status: ServiceRequestStatus;
  pickupAreaId: string;
  destinationAreaId: string;
  pickupAddress: string;
  destinationAddress: string;
  preferredDate?: string;
  preferredTime?: string;
  items: HomeMovingItem[];
  pickupFloor?: string;
  destinationFloor?: string;
  hasLift?: boolean;
  parkingInfo?: string;
  description?: string;
  photoUrls: string[];
  contactName: string;
  contactPhone: string;
  adminNotes?: string;
  /** Future quotation support: Admin records the agreed price here manually. */
  quotation?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Input submitted by the customer via the shared request system. */
export interface HomeMovingRequestInput {
  pickupAreaId: string;
  destinationAreaId: string;
  pickupAddress: string;
  destinationAddress: string;
  preferredDate?: string;
  preferredTime?: string;
  items: HomeMovingItem[];
  pickupFloor?: string;
  destinationFloor?: string;
  hasLift?: boolean;
  parkingInfo?: string;
  description?: string;
  photoUrls: string[];
  contactName: string;
  contactPhone: string;
}

export const HOME_MOVING_STATUS_INFO: Record<
  ServiceRequestStatus,
  { labelBn: string; badgeClass: string }
> = {
  new: { labelBn: 'নতুন', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
  reviewing: { labelBn: 'পর্যালোচনাধীন', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
  contacted: { labelBn: 'যোগাযোগ হয়েছে', badgeClass: 'bg-violet-50 text-violet-900 border-violet-200' },
  assigned: { labelBn: 'নির্ধারিত', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
  in_progress: { labelBn: 'কাজ চলছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  completed: { labelBn: 'সম্পন্ন', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  cancelled: { labelBn: 'বাতিল', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200' },
  submitted: { labelBn: 'জমা দেওয়া হয়েছে', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
};

export function getHomeMovingItemLabel(id: string): string {
  return HOME_MOVING_ITEMS.find((o) => o.id === id)?.labelBn || id;
}