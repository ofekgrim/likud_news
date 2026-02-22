#!/usr/bin/env npx tsx
/**
 * Seed Stories Script
 * Creates sample Instagram-style stories for the home screen.
 *
 * Usage:
 *   npx tsx scripts/seed-stories.ts
 *
 * Prerequisites:
 *   - Backend running on localhost:9090
 *   - Base seed data applied (articles exist for linking)
 */

const API = process.env.API_URL || 'http://localhost:9090/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@likud.org.il';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin123!';

// ─── API Helpers ─────────────────────────────────────────────────────────────

let token = '';

async function login(): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  token = data.accessToken;
  console.log('✓ Logged in as admin');
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

// ─── Story Definitions ───────────────────────────────────────────────────────

// Using Unsplash images (free, no auth needed, reliable)
const STORIES = [
  {
    title: 'ישיבת ממשלה חגיגית',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=200&fit=crop',
    sortOrder: 0,
    linkToArticleIndex: 0, // Will link to first article found
  },
  {
    title: 'פיתוח הנגב',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200&h=200&fit=crop',
    sortOrder: 1,
    linkToArticleIndex: 1,
  },
  {
    title: 'חינוך איכותי לכל ילד',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop',
    sortOrder: 2,
    linkToArticleIndex: 2,
  },
  {
    title: 'הייטק ישראלי',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
    sortOrder: 3,
    linkUrl: 'https://www.likud.org.il', // Standalone with external link
  },
  {
    title: 'ביטחון לאומי',
    imageUrl: 'https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=200&h=200&fit=crop',
    sortOrder: 4,
    linkToArticleIndex: 3,
  },
  {
    title: 'הסכמי אברהם - שנתיים',
    imageUrl: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=200&h=200&fit=crop',
    sortOrder: 5,
    linkToArticleIndex: 4,
  },
  {
    title: 'ירושלים בירתנו',
    imageUrl: 'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=200&h=200&fit=crop',
    sortOrder: 6,
    // Standalone story — no link, no article
  },
  {
    title: 'בריאות לכולם',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=1200&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop',
    sortOrder: 7,
    linkToArticleIndex: 5,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Seeding stories...\n');

  await login();

  // Check existing stories
  const existingStories = await apiGet<any[]>('/stories/all');
  if (existingStories.length > 0) {
    console.log(`⚠  ${existingStories.length} stories already exist. Skipping seed.`);
    console.log('   To re-seed, delete existing stories first from the admin panel.');
    return;
  }

  // Fetch a few published articles to link stories to
  const articlesRes = await apiGet<{ data: { id: string; slug: string; title: string }[] }>(
    '/articles?limit=10&status=published',
  );
  const articles = articlesRes.data ?? (Array.isArray(articlesRes) ? articlesRes : []);
  console.log(`📰 Found ${articles.length} published articles to link\n`);

  let created = 0;
  for (const storyDef of STORIES) {
    const payload: Record<string, unknown> = {
      title: storyDef.title,
      imageUrl: storyDef.imageUrl,
      thumbnailUrl: storyDef.thumbnailUrl,
      sortOrder: storyDef.sortOrder,
      isActive: true,
    };

    // Link to article if index is defined and article exists
    if ('linkToArticleIndex' in storyDef && storyDef.linkToArticleIndex !== undefined) {
      const articleIndex = storyDef.linkToArticleIndex as number;
      if (articleIndex < articles.length) {
        payload.articleId = articles[articleIndex].id;
      }
    }

    // External link for standalone stories
    if ('linkUrl' in storyDef && storyDef.linkUrl) {
      payload.linkUrl = storyDef.linkUrl;
    }

    try {
      const story = await apiPost<{ id: string }>('/stories', payload);
      console.log(`  ✓ Story: "${storyDef.title}" (${story.id})`);
      created++;
    } catch (err) {
      console.error(`  ✗ Failed: "${storyDef.title}" — ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done! Created ${created}/${STORIES.length} stories.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
