# Admin Step 5: Blood Donors and Emergency Directory

## Blood donor profiles

- Uses `blood_donor_profiles` and its existing `draft`, `pending_approval`,
  `approved`, `rejected`, `paused`, and `suspended` statuses.
- The donor list is filtered, searched, counted, and paginated in Supabase. It
  selects public-to-admin profile fields only; it does not select `private_phone`.
- The details route reads a single profile through the existing
  `fn_admin_donor_profile(p_id)` admin-gated RPC. The phone and owner ID are
  rendered only in the authenticated admin page; neither is passed into its
  client-side action component.
- Moderation and editing use a verified-admin Server Action, retain the
  existing `user_id`, write the supported `rejection_reason` and profile
  fields, and revalidate affected routes. Existing notification writes and the
  database audit trigger are retained.
- Paused/suspended statuses and `is_available = false` contribute to the
  unavailable count. There is no separate `inactive` or `needs-edit` status.
- Creating an admin-owned donor profile is not offered: `user_id` is required,
  unique, and references a real customer profile. Hard deletion is also not
  offered because donor deletion cascades to contact-release audit records and
  donor reports. Use the existing moderation/availability states instead.
- The existing public donor listing/contact-release flow is unchanged; the
  donor phone is not made public by this admin workflow.

## Emergency contacts

- Uses the existing `emergency_contacts` table and its supported `doctor`,
  `police`, `ambulance`, and `fire_service` categories.
- Existing admin-only CRUD, active public reads, source note, sort order, and
  service routes are reused. New contacts start inactive. Activation and
  deletion require confirmation, and server actions re-check admin access and
  RLS.
- The homepage's doctor tile no longer claims 24/7 availability.
- The database does not support an official-helpline category or fields for
  descriptions, operating hours, images/logos, or a last-verified date. No
  values or schema changes were invented for them.

### Minimal future schema extension

If official helplines and those metadata fields are required, add a forward,
non-destructive migration that extends the `emergency_contacts.service` check
constraint with an `official_helpline` value and adds nullable
`description_bn`, `operating_hours_bn`, `image_url`, and `verified_at` columns.
Keep `source_note` as the reference text, then update the generated database
types, admin validation/editor, and public display together. This extension was
not applied in Step 5.
