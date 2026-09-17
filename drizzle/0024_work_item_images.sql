-- Convert related-work thumbnailSrc → images[] inside page_sections JSON
-- (services + CMS marketing pages). Zod also accepts legacy thumbnailSrc at read time.

UPDATE services
SET page_sections = jsonb_set(
  page_sections,
  '{workItems}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem ? 'images' AND jsonb_typeof(elem->'images') = 'array' THEN
            (elem - 'thumbnailSrc' - 'href')
          WHEN COALESCE(elem->>'thumbnailSrc', '') <> '' THEN
            (elem - 'thumbnailSrc' - 'href')
              || jsonb_build_object('images', jsonb_build_array(elem->>'thumbnailSrc'))
          ELSE
            (elem - 'thumbnailSrc' - 'href')
              || jsonb_build_object('images', '[]'::jsonb)
        END
      )
      FROM jsonb_array_elements(COALESCE(page_sections->'workItems', '[]'::jsonb)) AS elem
    ),
    '[]'::jsonb
  )
)
WHERE page_sections IS NOT NULL
  AND page_sections ? 'workItems';

UPDATE pages
SET page_sections = jsonb_set(
  page_sections,
  '{workItems}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem ? 'images' AND jsonb_typeof(elem->'images') = 'array' THEN
            (elem - 'thumbnailSrc' - 'href')
          WHEN COALESCE(elem->>'thumbnailSrc', '') <> '' THEN
            (elem - 'thumbnailSrc' - 'href')
              || jsonb_build_object('images', jsonb_build_array(elem->>'thumbnailSrc'))
          ELSE
            (elem - 'thumbnailSrc' - 'href')
              || jsonb_build_object('images', '[]'::jsonb)
        END
      )
      FROM jsonb_array_elements(COALESCE(page_sections->'workItems', '[]'::jsonb)) AS elem
    ),
    '[]'::jsonb
  )
)
WHERE page_sections IS NOT NULL
  AND page_sections ? 'workItems';
