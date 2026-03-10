const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090/api/v1';

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API Error');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export const api = {
  get: <T>(path: string) => fetchApi<T>(path),
  post: <T>(path: string, data: unknown) => fetchApi<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => fetchApi<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => fetchApi<T>(path, { method: 'DELETE' }),
};

// ── Daily Quiz ─────────────────────────────────────────────────────────

export async function fetchDailyQuizzes(page = 1, limit = 20) {
  return api.get<import('@/lib/types').PaginatedResponse<import('@/lib/types').DailyQuizWithStats>>(
    `/gamification/admin/daily-quiz?page=${page}&limit=${limit}`
  );
}

export async function createDailyQuiz(data: { date: string; questions: import('@/lib/types').DailyQuizQuestion[]; pointsReward?: number }) {
  return api.post<import('@/lib/types').DailyQuiz>('/gamification/admin/daily-quiz', data);
}

export async function updateDailyQuiz(id: string, data: { date: string; questions: import('@/lib/types').DailyQuizQuestion[]; pointsReward?: number }) {
  return api.put<import('@/lib/types').DailyQuiz>(`/gamification/admin/daily-quiz/${id}`, data);
}

export async function deleteDailyQuiz(id: string) {
  return api.delete(`/gamification/admin/daily-quiz/${id}`);
}

export async function uploadFile(file: File): Promise<import('@/lib/types').MediaItem> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Upload failed');
  }
  return res.json();
}
