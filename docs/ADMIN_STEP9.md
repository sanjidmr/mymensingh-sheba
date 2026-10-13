# Admin Step 9 — Notifications, Website CMS, and Customer Support

## Existing data sources reused

- `notifications`: persisted admin/customer notifications (`target_role`, `title`, `body`, `type`, `related_type`, `related_id`, `is_read`, `created_at`). Existing event triggers remain the notification source; no demo notifications or replacement table were added.
- `platform_settings`: existing JSONB key/value CMS store. Existing keys `homepage_sections`, `launch_services`, and `site_contact` remain in use. Editorial content adds `announcement`, `about_content`, `faq_content`, `footer_content`, and `seo`.
- `hero_slides`: existing hero carousel rows, including `image_url`, `storage_path`, `caption_bn`, `alt_text_bn`, `href`, `sort_order`, and `is_enabled`.
- Supabase Storage buckets: existing `site`, `listings`, `staff`, `avatars`, `documents`, `posts`, and private `support-attachments`; existing upload paths and image validation are preserved.
- `contact_messages`: existing support tickets, with actual statuses `new`, `reviewing`, `replied`, and `closed`, plus private `admin_notes` and optional customer `user_id`.
- `contact_message_replies`: existing threaded replies with `sender_id`, `sender_role`, `body`, and `created_at`.

## Implemented

- Admin notification dropdown loads five actual recent notifications, shows read state and timestamps, and routes to the associated admin record. Unread notifications are marked read before navigation; failures prevent navigation and show an error.
- Notifications page supports unread/read filters, available event-category filters, text search, server pagination, individual read, and mark-all-read. Count queries are scoped to `target_role = 'admin'`.
- CMS retains section visibility, service overrides, contact details, carousel and media managers, and featured-post management. It additionally persists validated homepage announcements, the `/about` hero text, `/help` FAQs, Footer description/links, and site-level title/description/social-sharing image. Changes are read from the public site content loader and revalidated after successful saves.
- Contact information overrides are now used on the public `/contact` page as well as the Footer. Carousel uploads and ordering continue through `hero_slides` and the `site` bucket.
- Support inbox filters include actual status and subject values, searches by customer fields and exact UUID ticket ID, and displays the latest reply. The detail view allows actual status updates, authenticated-customer replies, and private admin notes.
- Support replies are only available for conversations linked to an authenticated customer. Guest messages remain phone/email follow-ups; no external email, SMS, or WhatsApp delivery is claimed.

## Security and migration

All protected actions use the existing verified-admin Server Action helper. Notifications and support data continue to use the existing RLS-protected Supabase client; customer-visible replies continue through `contact_message_replies` policies and existing triggers. No service-role key was added to browser code.

Migration `20261012000000_public_cms_content_policy.sql` is required to make only the explicitly public CMS keys readable to `anon` and `authenticated`. It grants no public write permission and does not expose unrelated platform settings. Existing admin write policies remain authoritative.

## Existing limits

- Homepage categories remain defined by the existing catalog constants; their existing homepage section visibility switches are retained. There is no separate category-content table.
- Featured content continues to use the existing community-post moderation and `is_featured` mechanism.
- Contact tickets have no assignment/assignee column or independent read flag; the actual status is used as the inbox state. `admin_notes` is the existing private-notes field.
- The project has no external message-delivery integration, so replies only appear inside an authenticated customer's dashboard.
- Production RLS, live content persistence, and Storage behavior still require verification against the target Supabase project after applying the migration.

The admin media library uses the protected `fn_admin_media_page` RPC rather
than querying PostgREST's internal `storage` schema, which is intentionally not
exposed. The RPC returns paginated metadata only to an active admin and keeps
private document/support attachment objects without public URLs.
