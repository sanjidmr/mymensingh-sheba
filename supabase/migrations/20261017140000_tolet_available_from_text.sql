-- The "কোন মাস থেকে ভাড়া দেওয়া হবে" field on the to-let listing form is free
-- text by design: the owner may answer "তাৎক্ষণিক সম্ভব", "আগামী মাস থেকে" or a
-- month name, and the value is rendered back verbatim on the listing card and
-- detail page (`উপলব্ধ: <value>`). `available_from` was declared as DATE, so any
-- non-date answer was rejected by Postgres with
-- `invalid input syntax for type date`. Store the answer as text instead; the
-- existing dates are cast to their ISO form so no data is lost.
ALTER TABLE public.tolet_listings
    ALTER COLUMN available_from TYPE TEXT USING available_from::text;
