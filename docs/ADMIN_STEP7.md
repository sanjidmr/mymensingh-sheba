# Admin Step 7: Service Directories and Vehicle Requests

## Routes

- `/admin/directories/bus`, `/admin/directories/wifi`, and `/admin/directories/coaching` are the separate admin directory pages.
- `/admin/directories/vehicle` remains available for the existing vehicle listings.
- Each category page provides category-specific search, filters, counts, pagination, create/edit, publication controls, and guarded deletion.
- `/admin/vehicle-requests` and `/admin/vehicle-requests/[id]` provide the request inbox and details.

## Existing schema reused

`service_listings` remains the shared table for the four categories: `vehicle`, `bus`, `wifi`, and `coaching`. The directory migration reconciles existing vehicle-price fields and adds bus travel-day, stop, and journey-duration fields where missing; it does not create a separate catalog table or invent a replacement price field. It also requests a PostgREST schema-cache reload to address stale composite results such as the `additional_fee` RPC error. Admin directory reads query `service_listings` directly; the unrelated media library continues to use its storage RPC. `contact_phone_private` remains excluded from public reads and available to authorized admins.

The schema has no dedicated vehicle-kind column, so the admin form stores exactly one selected kind (`গাড়ি`, `অটো`, or `CNG`) in the existing `tags` array. That value drives the existing public kind filter and is validated on the server.

`vehicle_requests` supplies the request UUID, nullable `vehicle_listing_id`, stored `vehicle_kind` and `vehicle_name`, customer reference and submitted contact, pickup/destination, date/time, passenger count, duration, budget, notes, status, and timestamps. Its existing statuses are `new`, `contacted`, and `closed`. Request deletion is not offered in the UI. Vehicle-listing deletion is refused while requests still reference it; unpublishing retains the listing and the request relationship.

## Workflows and limits

- Admins create and manage bus listings; customer policies and server-side guards restrict customer-created listings to coaching and WiFi. Coaching/WiFi submissions are owner-linked and enter moderation before public display. Customers can view their listing status and edit their own records; owner edits and coaching/WiFi child-record changes return the listing to pending review.
- Admins can review, edit, approve/reject, publish/unpublish, and delete directory records, subject to the existing references guard for vehicles. Shared and category-specific form values are validated on the server. Admin images upload to the existing `site` storage bucket.
- Public directory reads require approved, active listings. Reviews remain separate from listing submissions and retain their existing per-author uniqueness and rating validation.
- `is_active` controls publication only; there is no verification field. A listing being published does not mean its claims, coverage, pricing, or availability were independently verified.
- The public directory cards no longer display a verification mark for these records; detail pages explicitly say the information is admin-managed but has no separate verification state.
- The bus directory displays the stored route, schedule, operator-provided fare, and service type only. There is no seat inventory, reservation, payment, or ticket-booking integration.
- Vehicle requests link to the current listing by its FK where it still exists. Their stored name and vehicle kind remain visible if it does not. Requests do not snapshot an image or historical listing title/category; deleting a referenced vehicle listing is blocked in both current and legacy admin actions.
- Request statuses are administrative records, not booking confirmations. “যোগাযোগ নথিভুক্ত” should only be selected after actual contact; no call, SMS, email, or WhatsApp is sent by these actions. Closing a request does not confirm a booking.
- The database notification trigger covers new vehicle requests, not later status changes. Status updates do not send a customer notification.
- Existing RLS remains responsible for reads/writes. Admin pages/actions verify the authenticated admin, and mutations use the existing RLS-gated Supabase client. No service-role key was added to browser code.

## Validation

Focused TypeScript and ESLint checks cover the directory routes, actions, components, query layer, and bus detail. Live Supabase migration, CRUD/RLS, and end-to-end checks require a configured authenticated environment and were not run as part of local validation.
