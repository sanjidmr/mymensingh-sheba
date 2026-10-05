-- ============================================================================
-- Service Request Details Page — structured per-service answers
-- ============================================================================
--
-- The five "book a service" pages (কাজের বুয়া / ইলেকট্রিশিয়ান / প্লাম্বার /
-- বাসা পাল্টানো / এসি ও ফ্রিজ) ask service-specific questions that have no
-- column of their own: an alternative phone number, the road and the nearest
-- landmark, the second address for a house move, and the answers to the
-- service's own questions.
--
-- Everything is kept in ONE nullable JSONB column rather than a dozen thin
-- TEXT columns, because:
--   1. The shape differs per service, so a fixed set of columns would be mostly
--      NULL for every request.
--   2. `details` and `service_type` are untouched, so every existing admin
--      screen, filter, export and status flow keeps working unchanged.
--
-- Expected shape (every key optional):
--   {
--     "serviceTypeId": "leakage",
--     "altPhone": "01812345678",
--     "locations": {
--       "work":        { "areaId": "charpara", "road": "...", "house": "...", "landmark": "...", "geo": { "lat": 24.75, "lng": 90.40 } },
--       "destination": { "areaId": "natun-bazar", "road": "...", "house": "..." }
--     },
--     "answers": { "urgency": "urgent", "problemPlace": ["pipe_line"] },
--     "summaryBn": "কী ধরনের কাজ প্রয়োজন? পানির পাইপ লিক মেরামত"
--   }
--
-- `summaryBn` is the same human-readable Bangla block that is appended to
-- `details`, stored separately so it can be listed in admin without splitting
-- the free-text notes back out.
--
-- RLS is unchanged: the table already restricts rows to their own customer,
-- and adding a nullable column cannot widen access.
-- ============================================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS service_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN public.service_requests.service_meta IS
  'Structured answers from the service request detail pages: per-service questions (answers), location blocks (locations), alternative phone (altPhone) and the readable Bangla summary (summaryBn). Human-readable copy also lives in details/service_type.';