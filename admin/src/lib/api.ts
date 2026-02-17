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
  return res.json();
}

export const api = {
  get: <T>(path: string) => fetchApi<T>(path),
  post: <T>(path: string, data: unknown) => fetchApi<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => fetchApi<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => fetchApi<T>(path, { method: 'DELETE' }),
};

export async function uploadFile(file: File): Promise<import('@/lib/types').MediaItem> {
  const ext = file.name.split('.').pop() || '';
  const typeMap: Record<string, string> = {
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    mp4: 'video', webm: 'video', mov: 'video',
    mp3: 'audio', wav: 'audio', ogg: 'audio',
  };
  const mediaType = typeMap[ext.toLowerCase()] || 'document';

  // 1. Get presigned URL
  const presign = await api.post<import('@/lib/types').PresignResponse>('/media/presign', {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });

  // 2. Upload directly to S3
  await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // 3. Confirm upload
  return api.post<import('@/lib/types').MediaItem>('/media/confirm', {
    s3Key: presign.s3Key,
    filename: file.name,
    type: mediaType,
    mimeType: file.type,
    size: file.size,
  });
}
