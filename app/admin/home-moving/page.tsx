import { redirect } from 'next/navigation';

/**
 * Legacy alias kept for URL compatibility.
 *
 * This page used to be a thin wrapper around the home-moving request queue.
 * That queue now lives at `/admin/requests`, which covers every service
 * request in one place, so this route simply forwards there.
 */
export default function AdminHomeMovingAlias() {
  redirect('/admin/requests');
}