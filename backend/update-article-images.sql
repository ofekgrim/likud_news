-- Update existing articles to use stable placeholder images instead of random picsum URLs
-- This ensures images don't change on hot reload

-- Article 1: Netanyahu (Politics)
UPDATE articles
SET "heroImageUrl" = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop&q=80',
    "heroImageCaption" = 'ראש הממשלה בנימין נתניהו',
    "heroImageCredit" = 'צילום: GPO'
WHERE slug LIKE '%netanyahu%' OR title LIKE '%נתניהו%'
LIMIT 1;

-- Article 2: Knesset (Government)
UPDATE articles
SET "heroImageUrl" = 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop&q=80',
    "heroImageCaption" = 'בניין הכנסת בירושלים',
    "heroImageCredit" = 'צילום: ויקימדיה'
WHERE title LIKE '%כנסת%' OR title LIKE '%הצעת חוק%'
LIMIT 1;

-- Article 3: Jerusalem
UPDATE articles
SET "heroImageUrl" = 'https://images.unsplash.com/photo-1555880192-48ad3a8f6e5d?w=800&h=500&fit=crop&q=80',
    "heroImageCaption" = 'ירושלים - עיר הבירה',
    "heroImageCredit" = 'צילום: Unsplash'
WHERE title LIKE '%ירושלים%'
LIMIT 1;

-- Article 4: Conference/Event
UPDATE articles
SET "heroImageUrl" = 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop&q=80',
    "heroImageCaption" = 'ועידת הליכוד',
    "heroImageCredit" = 'צילום: הליכוד'
WHERE title LIKE '%ועידה%' OR title LIKE '%כנס%'
LIMIT 1;

-- Article 5: News/Media
UPDATE articles
SET "heroImageUrl" = 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=500&fit=crop&q=80',
    "heroImageCaption" = 'חדשות',
    "heroImageCredit" = 'צילום: ארכיון'
WHERE title LIKE '%חדשות%'
LIMIT 1;

-- Set one article as main (the most recent one)
UPDATE articles SET "isMain" = false WHERE "isMain" = true;

UPDATE articles
SET "isMain" = true,
    "isHero" = true,
    "isBreaking" = true
WHERE status = 'published'
ORDER BY "publishedAt" DESC
LIMIT 1;

-- Verify changes
SELECT
  id,
  title,
  "isMain",
  "isHero",
  "isBreaking",
  LEFT("heroImageUrl", 50) as image_preview,
  "heroImageCaption"
FROM articles
WHERE status = 'published'
ORDER BY "publishedAt" DESC
LIMIT 5;
