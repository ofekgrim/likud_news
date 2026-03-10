import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:9090/api/v1';

export const handlers = [
  // Auth
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'admin@likud.org.il' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: 'mock-jwt-token',
        user: { id: '1', email: 'admin@likud.org.il', name: 'Admin', role: 'super_admin' },
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  // Articles (paginated)
  http.get(`${API_BASE}/articles`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1', title: 'Test Article 1', slug: 'test-1', status: 'published',
          publishedAt: '2024-01-15', viewCount: 150, commentCount: 5,
          isHero: false, isBreaking: false, isMain: true,
          category: { id: '1', name: 'פוליטיקה' }, createdAt: '2024-01-10',
        },
        {
          id: '2', title: 'Test Article 2', slug: 'test-2', status: 'draft',
          publishedAt: null, viewCount: 0, commentCount: 0,
          isHero: true, isBreaking: false, isMain: false,
          category: { id: '2', name: 'כלכלה' }, createdAt: '2024-01-12',
        },
      ],
      total: 2, page: 1, limit: 20, totalPages: 1,
    });
  }),

  // Categories
  http.get(`${API_BASE}/categories`, () => {
    return HttpResponse.json([
      { id: '1', name: 'פוליטיקה', slug: 'politics', isActive: true, color: '#0099DB', sortOrder: 0 },
      { id: '2', name: 'כלכלה', slug: 'economy', isActive: true, color: '#10B981', sortOrder: 1 },
    ]);
  }),

  // Members
  http.get(`${API_BASE}/members`, () => {
    return HttpResponse.json([
      { id: '1', name: 'יוסי כהן', isActive: true, title: 'חבר כנסת', email: 'yossi@knesset.gov.il', sortOrder: 0 },
      { id: '2', name: 'שרה לוי', isActive: false, title: 'שרה', email: 'sarah@knesset.gov.il', sortOrder: 1 },
    ]);
  }),

  // Tags
  http.get(`${API_BASE}/tags`, () => {
    return HttpResponse.json([
      { id: '1', nameHe: 'פוליטיקה', slug: 'politics', tagType: 'topic' },
      { id: '2', nameHe: 'ירושלים', slug: 'jerusalem', tagType: 'location' },
    ]);
  }),

  // Authors
  http.get(`${API_BASE}/authors`, () => {
    return HttpResponse.json([
      { id: '1', name: 'Test Author' },
    ]);
  }),

  // Ticker
  http.get(`${API_BASE}/ticker`, () => {
    return HttpResponse.json([
      { id: '1', text: 'חדשות ראשונות', isActive: true, position: 0 },
    ]);
  }),

  // Contact (unread)
  http.get(`${API_BASE}/contact`, () => {
    return HttpResponse.json({ data: [], total: 3 });
  }),

  // Analytics overview
  http.get(`${API_BASE}/article-analytics/overview`, () => {
    return HttpResponse.json({ view: 1500, share: 200, read_complete: 800, comment: 50 });
  }),

  // Analytics top articles
  http.get(`${API_BASE}/article-analytics/top`, () => {
    return HttpResponse.json([
      { articleId: '1', title: 'Top Article', heroImageUrl: null, count: 500 },
      { articleId: '2', title: 'Second Article', heroImageUrl: null, count: 300 },
    ]);
  }),

  // Analytics trend
  http.get(`${API_BASE}/article-analytics/article/:id/trend`, () => {
    return HttpResponse.json([
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 20 },
    ]);
  }),

  // Analytics referrers
  http.get(`${API_BASE}/article-analytics/referrers`, () => {
    return HttpResponse.json([
      { referrer: 'home_feed', count: 100 },
      { referrer: 'search', count: 50 },
    ]);
  }),

  // Delete article
  http.delete(`${API_BASE}/articles/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Update article (PUT)
  http.put(`${API_BASE}/articles/:id`, () => {
    return HttpResponse.json({ id: '1', title: 'Updated' });
  }),

  // Create article (POST)
  http.post(`${API_BASE}/articles`, () => {
    return HttpResponse.json({ id: '3', title: 'New Article', slug: 'new-article' });
  }),

  // Create category
  http.post(`${API_BASE}/categories`, () => {
    return HttpResponse.json({ id: '3', name: 'New Category', slug: 'new-category' });
  }),

  // Update category
  http.put(`${API_BASE}/categories/:id`, () => {
    return HttpResponse.json({ id: '1', name: 'Updated Category' });
  }),

  // Delete category
  http.delete(`${API_BASE}/categories/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Create tag
  http.post(`${API_BASE}/tags`, () => {
    return HttpResponse.json({ id: '3', nameHe: 'New Tag', slug: 'new-tag', tagType: 'topic' });
  }),

  // Media library
  http.get(`${API_BASE}/media`, () => {
    return HttpResponse.json({
      data: [
        { id: '1', filename: 'photo1.jpg', url: 'https://example.com/photo1.jpg', type: 'image', altText: 'Photo 1' },
        { id: '2', filename: 'photo2.jpg', url: 'https://example.com/photo2.jpg', type: 'image', altText: 'Photo 2' },
      ],
      total: 2, page: 1, limit: 18, totalPages: 1,
    });
  }),
];
