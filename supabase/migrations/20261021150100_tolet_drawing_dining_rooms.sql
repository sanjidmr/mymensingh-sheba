ALTER TABLE public.tolet_listings
  ADD COLUMN IF NOT EXISTS has_drawing_room BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_dining_room BOOLEAN NOT NULL DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
