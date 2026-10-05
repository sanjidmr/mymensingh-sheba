import { redirect } from 'next/navigation';

/**
 * `/ac-fridge-repair` was an earlier standalone version of the AC & Fridge
 * request page. It now redirects to the canonical `/ac-fridge` so there is
 * exactly one AC & Fridge form in the codebase — two pages writing different
 * shapes into the same `service_requests` row would drift apart.
 */
export default function AcFridgeRepairRedirectPage() {
  redirect('/ac-fridge');
}