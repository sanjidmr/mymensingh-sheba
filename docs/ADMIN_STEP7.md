# Admin Step 7: Curated Catalogs and Vehicle Requests

## Routes

- `/admin/catalog` is the overview for the four admin-managed directories.
- `/admin/catalog/vehicle`, `/admin/catalog/bus`, `/admin/catalog/wifi`, and `/admin/catalog/coaching` provide category-specific search, filters, counts, pagination, create/edit, publication controls, and guarded deletion.
- `/admin/vehicle-requests` and `/admin/vehicle-requests/[id]` provide the request inbox and details.

## Existing schema reused

No migration or table was added.

`service_listings` is the existing admin-managed directory table. Its category values are `vehicle`, `bus`, `wifi`, and `coaching`. The UI uses its existing identifiers, slugs, titles, descriptions, image/logo URLs, `area_ids`, `tags`, price/fee/speed/fare fields, route fields, vehicle capacity/specification fields, private contact, `is_active`, `is_featured`, and timestamps. Admin listing reads use the existing `fn_admin_service_listings` and `fn_admin_service_listing` RPCs; public listing visibility remains governed by the existing active-row RLS policy. `contact_phone_private` remains excluded from public reads and available to authorized admins through the admin RPC.

The schema has no dedicated vehicle-kind column, so the admin form stores exactly one selected kind (`গাড়ি`, `অটো`, or `CNG`) in the existing `tags` array. That value drives the existing public kind filter and is validated on the server.

`vehicle_requests` supplies the request UUID, nullable `vehicle_listing_id`, stored `vehicle_kind` and `vehicle_name`, customer reference and submitted contact, pickup/destination, date/time, passenger count, duration, budget, notes, status, and timestamps. Its existing statuses are `new`, `contacted`, and `closed`. Request deletion is not offered in the UI. Vehicle-listing deletion is refused while requests still reference it; unpublishing retains the listing and the request relationship.

## Workflows and limits

- Directory records are created and edited per category; the form validates shared and category-specific values on the server. Images can use an existing HTTPS/site path or upload to the existing admin-managed `site` storage bucket.
- `is_active` controls publication only; there is no verification field. A listing being published does not mean its claims, coverage, pricing, or availability were independently verified.
- The public directory cards no longer display a verification mark for these records; detail pages explicitly say the information is admin-managed but has no separate verification state.
- The bus directory displays the stored route, schedule, operator-provided fare, and service type only. There is no seat inventory, reservation, payment, or ticket-booking integration.
- Vehicle requests link to the current listing by its FK where it still exists. Their stored name and vehicle kind remain visible if it does not. Requests do not snapshot an image or historical listing title/category; deleting a referenced vehicle listing is blocked in both current and legacy admin actions.
- Request statuses are administrative records, not booking confirmations. “যোগাযোগ নথিভুক্ত” should only be selected after actual contact; no call, SMS, email, or WhatsApp is sent by these actions. Closing a request does not confirm a booking.
- The database notification trigger covers new vehicle requests, not later status changes. Status updates do not send a customer notification.
- Existing RLS remains responsible for reads/writes. Admin pages/actions verify the authenticated admin, and mutations use the existing RLS-gated Supabase client. No service-role key was added to browser code.

## Validation

Focused TypeScript and ESLint checks cover the Step 7 routes, actions, components, query layer, and bus detail. Live Supabase CRUD/RLS checks require a configured authenticated environment and were not run as part of local validation.
