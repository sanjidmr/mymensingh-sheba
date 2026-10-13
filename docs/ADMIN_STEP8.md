# Admin Step 8: Community Posts

## Admin interface

`/admin/posts` manages all content, with category tabs for news, jobs, and Buy & Sell. The list is paginated and supports status, category, job type, created-date, and area filters, plus title/submitter/phone/UUID search. Counts report real total, pending, approved, and rejected records for the selected post type. Existing detail, edit, create, moderation, featured, and safe-confirmed delete routes/actions are reused.

Admin-created posts use the verified admin profile ID as `author_id`, start pending, and are not published automatically. Customer post ownership is not editable by the admin content form. A news byline/source may be recorded in the existing `author_name` field when a source was supplied.

## Existing schema and public visibility

All three content types use `community_posts`:

- Shared: `id`, `kind`, `slug`, `author_id`, `title_bn`, `summary_bn`, `body_bn`, `cover_image_url`, `gallery`, `category`, `area_id`, `tags`, `status`, `rejection_reason`, `is_featured`, `published_at`, `created_at`, and `updated_at`.
- Jobs: `organization_bn`, `job_type`, `salary_min`, `salary_max`, and `deadline`.
- Buy & Sell: `price`, `condition_label`, `author_name`, `author_phone`, and `whatsapp_number`.
- News source/byline: `author_name`.

The existing `/news`, `/jobs`, and `/buy-sell` pages read approved posts through the shared catalog service. Marketplace phone/WhatsApp details remain behind the `fetch_market_contact` RPC, which only returns contact for approved Buy & Sell posts. Customer inserts remain pending; the database moderation guard and RLS preserve customer ownership and stop customers from publishing or featuring their own content. Admin reads use the existing `fn_admin_posts` security-definer RPC, and admin writes verify the session and continue through RLS.

Post images use the existing `posts` Storage bucket and upload flow. No tables or migrations were added.

## Schema limitations and moderation semantics

- The schema has no `edit_requested`, `archived`, or separate unpublished status. An approved post can be returned to `pending` to unpublish it. A rejected post with a reason can be edited by its owner and resubmitted through the existing customer flow.
- The schema has no marketplace negotiability field. The admin does not create or display a negotiability claim.
- There are no separate job qualification, experience, or application-URL columns. Existing `tags` and `body_bn` can contain supplied requirements and instructions; missing information stays missing.
- Salary and deadline may be absent. News source/byline is optional and uses only supplied information.
- Existing database notifications cover post submission and moderation status changes; they are in-app database records, not SMS/email/WhatsApp delivery. Admin content changes do not claim an external notification was sent.

## Validation

TypeScript, focused ESLint, and production build are run for the implementation. Live Supabase CRUD/RLS checks and authenticated browser workflows require the configured deployment environment and are not inferred from a local build.
