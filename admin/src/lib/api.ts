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

// ── Articles for content linking ─────────────────────────────────────────
export async function getArticlesForLinking(): Promise<{ id: string; title: string; heroImageUrl?: string }[]> {
  const res = await api.get<{ data: import('@/lib/types').Article[] }>(
    '/articles?status=published&limit=100&sortBy=publishedAt&sortOrder=DESC'
  );
  return (res.data ?? []).map((a) => ({ id: a.id, title: a.title, heroImageUrl: a.heroImageUrl }));
}

// ── Ads API ──────────────────────────────────────────────────────────────
export async function getAdPlacements(filters?: {
  type?: string;
  candidateId?: string;
  status?: string;
}): Promise<import('@/lib/types').CandidateAdPlacement[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.candidateId) params.append('candidateId', filters.candidateId);
  if (filters?.status === 'approved') params.append('isApproved', 'true');
  if (filters?.status === 'pending') params.append('isApproved', 'false');
  const qs = params.toString();
  return api.get<import('@/lib/types').CandidateAdPlacement[]>(`/ads/admin/placements${qs ? `?${qs}` : ''}`);
}

export async function getAdStats(): Promise<import('@/lib/types').AdPlacementStats> {
  return api.get<import('@/lib/types').AdPlacementStats>('/ads/admin/stats');
}

export async function getAdBreakdown(): Promise<import('@/lib/types').AdBreakdownStats> {
  return api.get<import('@/lib/types').AdBreakdownStats>('/ads/admin/analytics/breakdown');
}

export async function createAdPlacement(candidateId: string, dto: Omit<import('@/lib/types').CandidateAdPlacement, 'id' | 'candidateId' | 'candidateName' | 'impressions' | 'clicks' | 'isApproved' | 'isActive' | 'status' | 'createdAt' | 'candidate'>): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements?candidateId=${candidateId}`, dto);
}

export async function updateAdPlacement(id: string, dto: Partial<import('@/lib/types').CandidateAdPlacement>): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.patch<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}`, dto);
}

export async function approveAdPlacement(id: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}/approve`, {});
}

export async function rejectAdPlacement(id: string, reason: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}/reject`, { reason });
}

export async function pauseAdPlacement(id: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}/pause`, {});
}

export async function resumeAdPlacement(id: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}/resume`, {});
}

export async function endAdPlacement(id: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.post<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}/end`, {});
}

export async function deleteAdPlacement(id: string): Promise<import('@/lib/types').CandidateAdPlacement> {
  return api.delete<import('@/lib/types').CandidateAdPlacement>(`/ads/admin/placements/${id}`);
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

// ── Company Ads API ──────────────────────────────────────────────────────────

export async function getCompanyAdvertisers(): Promise<import('@/lib/types').CompanyAdvertiser[]> {
  return api.get<import('@/lib/types').CompanyAdvertiser[]>('/ads/admin/company/advertisers');
}

export async function createCompanyAdvertiser(dto: {
  name: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  isActive?: boolean;
}): Promise<import('@/lib/types').CompanyAdvertiser> {
  return api.post<import('@/lib/types').CompanyAdvertiser>('/ads/admin/company/advertisers', dto);
}

export async function getCompanyAds(filters?: {
  type?: string;
  advertiserId?: string;
  isApproved?: boolean;
}): Promise<import('@/lib/types').CompanyAd[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.advertiserId) params.append('advertiserId', filters.advertiserId);
  if (filters?.isApproved !== undefined) params.append('isApproved', String(filters.isApproved));
  const qs = params.toString();
  return api.get<import('@/lib/types').CompanyAd[]>(`/ads/admin/company/placements${qs ? `?${qs}` : ''}`);
}

export async function createCompanyAd(
  advertiserId: string,
  dto: Partial<import('@/lib/types').CompanyAd>,
): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements?advertiserId=${advertiserId}`, dto);
}

export async function updateCompanyAd(
  id: string,
  dto: Partial<import('@/lib/types').CompanyAd>,
): Promise<import('@/lib/types').CompanyAd> {
  return api.patch<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}`, dto);
}

export async function approveCompanyAd(id: string): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}/approve`, {});
}

export async function rejectCompanyAd(id: string, reason: string): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}/reject`, { reason });
}

export async function pauseCompanyAd(id: string): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}/pause`, {});
}

export async function resumeCompanyAd(id: string): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}/resume`, {});
}

export async function endCompanyAd(id: string): Promise<import('@/lib/types').CompanyAd> {
  return api.post<import('@/lib/types').CompanyAd>(`/ads/admin/company/placements/${id}/end`, {});
}

// ── AMA API ───────────────────────────────────────────────────────────────────

export async function getAmaSessions(status?: string): Promise<import('@/lib/types').AmaSession[]> {
  const qs = status ? `?status=${status}` : '';
  return api.get<import('@/lib/types').AmaSession[]>(`/ama/sessions${qs}`);
}

export async function getAmaSessionDetail(sessionId: string): Promise<import('@/lib/types').AmaSession & { questions: import('@/lib/types').AmaQuestion[] }> {
  return api.get<import('@/lib/types').AmaSession & { questions: import('@/lib/types').AmaQuestion[] }>(`/ama/sessions/${sessionId}`);
}

export async function createAmaSession(data: {
  candidateId: string;
  title: string;
  description: string;
  scheduledAt: string;
}): Promise<import('@/lib/types').AmaSession> {
  return api.post<import('@/lib/types').AmaSession>('/ama/sessions', data);
}

export async function updateAmaSession(
  id: string,
  data: { title?: string; description?: string; scheduledAt?: string },
): Promise<import('@/lib/types').AmaSession> {
  return api.patch<import('@/lib/types').AmaSession>(`/ama/sessions/${id}`, data);
}

export async function startAmaSession(id: string): Promise<import('@/lib/types').AmaSession> {
  return api.post<import('@/lib/types').AmaSession>(`/ama/sessions/${id}/start`, {});
}

export async function endAmaSession(id: string): Promise<import('@/lib/types').AmaSession> {
  return api.post<import('@/lib/types').AmaSession>(`/ama/sessions/${id}/end`, {});
}

export async function moderateAmaQuestion(
  questionId: string,
  action: 'approve' | 'reject',
): Promise<import('@/lib/types').AmaQuestion> {
  return api.post<import('@/lib/types').AmaQuestion>(`/ama/questions/${questionId}/moderate`, { action });
}

export async function answerAmaQuestion(
  questionId: string,
  answerText: string,
): Promise<import('@/lib/types').AmaQuestion> {
  return api.post<import('@/lib/types').AmaQuestion>(`/ama/questions/${questionId}/answer`, { answerText });
}

export async function pinAmaQuestion(questionId: string): Promise<import('@/lib/types').AmaQuestion> {
  return api.post<import('@/lib/types').AmaQuestion>(`/ama/questions/${questionId}/pin`, {});
}
