-- Upgrade legacy text-only CTA content blocks to linkbutton JSON shape.
-- Defaults match previous hardcoded hrefs. Custom labels are preserved.
-- New keys are inserted by ensureContentBlocks() on admin load.

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'Get in touch'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/contact-us'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.hero.cta_primary'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'All services'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/services'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.hero.cta_secondary'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'More about us'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/about-us'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.about.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'Start your project'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/contact-us'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.cta.button'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'Book a call'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/contact-us'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key IN ('global.cta_band.button', 'global.header.cta')
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'Get in touch'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/contact-us#contact-form'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'global.footer.connect_cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'Back home'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'global.404.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'How we work'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/about-us'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.why.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'View all services'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/services'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.dev.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'View all services'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/services/digital-marketing'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.growth.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

UPDATE content_blocks
SET
  type = 'linkbutton',
  value = jsonb_build_object(
    'label', COALESCE(NULLIF(value->>'text', ''), value->>'label', 'View reviews'),
    'href', COALESCE(NULLIF(value->>'href', ''), '/about-us#testimonials'),
    'enabled', COALESCE((value->>'enabled')::boolean, true)
  ),
  updated_at = NOW()
WHERE key = 'home.testimonials.cta'
  AND (type <> 'linkbutton' OR value->>'href' IS NULL);

-- Service pageSections CTAs are jsonb fields with Zod defaults on read;
-- no SQL column change required for services.hero_visual / page_sections.
