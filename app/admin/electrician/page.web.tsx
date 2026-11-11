import { redirect } from 'next/navigation';

/**
 * Legacy alias kept for URL compatibility.
 *
 * This page was a mock: two hardcoded technicians in `useState`, read-only,
 * with no database behind it. The real screen is `/admin/services`.
 */
export default function AdminElectricianAlias() {
  redirect('/admin/services');
}