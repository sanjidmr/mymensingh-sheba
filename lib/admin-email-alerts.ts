export type AdminEmailAlertType =
  | 'service_request'
  | 'tolet_listing'
  | 'blood_donor_reports'
  | 'listing_reports'
  | 'tutor_reports'
  | 'staff_profile_reports'
  | 'community_post_reports'
  | 'contact_message'
  | 'blood_request'
  | 'vehicle_request'
  | 'community_post'
  | 'service_listing'
  | 'tolet_profile'
  | 'tutor_profile'
  | 'donor_profile';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requestAdminEmailAlert(
  type: AdminEmailAlertType,
  eventId: string
): Promise<void> {
  if (!UUID_PATTERN.test(eventId)) return;

  try {
    const response = await fetch('/api/admin-email-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, eventId }),
      keepalive: true,
    });
    if (!response.ok) {
      console.warn('Admin email alert request was not accepted.', {
        type,
        status: response.status,
      });
    }
  } catch {
    console.warn('Admin email alert service could not be reached.', { type });
  }
}
