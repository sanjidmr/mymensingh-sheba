import { redirect } from 'next/navigation';

/**
 * Legacy alias kept for URL compatibility.
 *
 * This page toggled area status in local component state only — the comment in
 * the original file said so explicitly ("for demonstration of admin control") —
 * so every toggle reset on refresh. Ward and area data is reference data about
 * Mymensingh City Corporation, not admin-managed content, so the honest
 * destination is the website management screen.
 */
export default function AdminLocationsAlias() {
  redirect('/admin/website');
}