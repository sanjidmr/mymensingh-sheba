import { redirect } from 'next/navigation';

export default function AdminHomeMovingRedirect() {
  redirect('/admin/requests');
}