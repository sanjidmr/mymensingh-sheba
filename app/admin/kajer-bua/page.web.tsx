import { redirect } from 'next/navigation';

/**
 * Legacy alias kept for URL compatibility.
 *
 * This page was a mock: it held two hardcoded technicians in `useState` and
 * never touched the database, so every change vanished on refresh. The real
 * staff management screen is `/admin/services`, which reads `staff_profiles`
 * for the `kajer-bua`, `electrician` and `plumber` slugs.
 */
export default function AdminKajerBuaAlias() {
  redirect('/admin/services');
}