-- Founder details are public website content, while all unrelated platform
-- settings remain restricted to admins.
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
        'founder_content',
        'faq_content',
        'footer_content',
        'seo'
    )
);
