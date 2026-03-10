-- Update existing articles to use stable placeholder images instead of random picsum URLs

-- First, update all articles to use stable Unsplash images
WITH articles_to_update AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "publishedAt" DESC) as rn
  FROM articles
  WHERE status = 'published'
)
UPDATE articles
SET
  "heroImageUrl" = CASE
    WHEN (SELECT rn FROM articles_to_update WHERE id = articles.id) % 5 = 0 THEN 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop&q=80'
    WHEN (SELECT rn FROM articles_to_update WHERE id = articles.id) % 5 = 1 THEN 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop&q=80'
    WHEN (SELECT rn FROM articles_to_update WHERE id = articles.id) % 5 = 2 THEN 'https://images.unsplash.com/photo-1555880192-48ad3a8f6e5d?w=800&h=500&fit=crop&q=80'
    WHEN (SELECT rn FROM articles_to_update WHERE id = articles.id) % 5 = 3 THEN 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop&q=80'
    ELSE 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=500&fit=crop&q=80'
  END,
  "heroImageCaption" = 'תמונת המחשה',
  "heroImageCredit" = 'צילום: Unsplash'
WHERE status = 'published';

-- Unset all main articles first
UPDATE articles SET "isMain" = false WHERE "isMain" = true;

-- Set the most recent published article as main
WITH latest_article AS (
  SELECT id FROM articles
  WHERE status = 'published'
  ORDER BY "publishedAt" DESC
  LIMIT 1
)
UPDATE articles
SET
  "isMain" = true,
  "isHero" = true,
  "isBreaking" = true
WHERE id IN (SELECT id FROM latest_article);

-- Verify changes
SELECT
  id,
  LEFT(title, 40) as title,
  "isMain",
  "isHero",
  "isBreaking",
  LEFT("heroImageUrl", 60) as image_url,
  "publishedAt"
FROM articles
WHERE status = 'published'
ORDER BY "publishedAt" DESC
LIMIT 5;
