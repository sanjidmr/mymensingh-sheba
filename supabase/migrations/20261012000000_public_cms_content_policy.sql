-- Only explicitly public website content may be read without an admin role.
-- Platform settings such as notification preferences and fee administration
-- remain private; this policy adds no public write access.
DROP POLICY IF EXISTS "Public read published site content" ON public.platform_settings;
CREATE POLICY "Public read published site content"
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (
    key IN (
        'homepage_sections',
        'launch_services',
        'site_contact',
        'announcement',
        'about_content',
        'faq_content',
        'footer_content',
        'seo'
    )
);
