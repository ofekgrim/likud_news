'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Article, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ImagePicker } from '@/components/image-picker';
import { toast } from 'sonner';
import { Trash2, Play, Youtube, ExternalLink } from 'lucide-react';

type VideoSource = 'upload' | 'youtube' | 'x' | 'facebook' | 'instagram';

interface VideoForm {
  title: string;
  subtitle: string;
  videoUrl: string;
  heroImageUrl: string;
  categoryId: string;
  source: VideoSource;
  socialUrl: string;
}

const EMPTY_FORM: VideoForm = {
  title: '',
  subtitle: '',
  videoUrl: '',
  heroImageUrl: '',
  categoryId: '',
  source: 'youtube',
  socialUrl: '',
};

function extractVideoUrl(source: VideoSource, socialUrl: string): string {
  if (!socialUrl) return '';

  if (source === 'youtube') {
    // Extract YouTube video ID and create embed URL
    const match = socialUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return socialUrl;
  }

  // For other platforms, store the URL directly
  return socialUrl;
}

function getSourceLabel(source: VideoSource): string {
  switch (source) {
    case 'upload': return 'העלאה ישירה';
    case 'youtube': return 'YouTube';
    case 'x': return 'X (Twitter)';
    case 'facebook': return 'Facebook';
    case 'instagram': return 'Instagram';
  }
}

function getSourceIcon(source: VideoSource) {
  switch (source) {
    case 'youtube': return <Youtube className="h-4 w-4" />;
    default: return <ExternalLink className="h-4 w-4" />;
  }
}

export default function VideosPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<VideoForm>({ ...EMPTY_FORM });

  // Fetch video articles
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['video-articles'],
    queryFn: () => api.get<{ data: Article[] }>('/articles?category=video&limit=100'),
  });
  const videos = videosData?.data ?? (Array.isArray(videosData) ? videosData : []);

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/articles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-articles'] });
      toast.success('הוידאו נוצר');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-articles'] });
      toast.success('הוידאו נמחק');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    const videoCategory = categories?.find((c) => c.slug === 'video');
    setForm({ ...EMPTY_FORM, categoryId: videoCategory?.id || '' });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const videoUrl = form.source === 'upload'
      ? form.videoUrl
      : extractVideoUrl(form.source, form.socialUrl);

    // Generate a slug from the title
    const slug = 'video-' + form.title.replace(/[^\w\u0590-\u05FF]+/g, '-').substring(0, 50) + '-' + Date.now().toString(36);

    // Determine bodyBlocks based on source
    let bodyBlocks: Record<string, unknown>[] = [];
    if (form.source === 'youtube') {
      const match = form.socialUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) {
        bodyBlocks = [{ type: 'youtube', videoId: match[1], caption: form.title }];
      } else {
        bodyBlocks = videoUrl ? [{ type: 'video', url: videoUrl }] : [];
      }
    } else {
      bodyBlocks = videoUrl ? [{ type: 'video', url: videoUrl }] : [];
    }

    // Find the video category to auto-assign
    const videoCategory = categories?.find((c) => c.slug === 'video');
    const payload: Record<string, unknown> = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      slug,
      content: form.title,
      heroImageUrl: form.heroImageUrl || undefined,
      categoryId: form.categoryId || videoCategory?.id || undefined,
      status: 'published',
      bodyBlocks,
    };

    createMutation.mutate(payload);
  }

  function handleDelete(article: Article) {
    if (confirm(`למחוק את הוידאו "${article.title}"?`)) {
      deleteMutation.mutate(article.id);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">וידאו</h1>
        <Button onClick={openCreate}>וידאו חדש +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תצוגה</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium">קטגוריה</th>
              <th className="text-right px-4 py-3 font-medium">צפיות</th>
              <th className="text-right px-4 py-3 font-medium">תאריך</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : (videos as Article[]).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  אין וידאו. צור וידאו חדש כדי להתחיל.
                </td>
              </tr>
            ) : (
              (videos as Article[]).map((video) => (
                <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2">
                    {video.heroImageUrl ? (
                      <div className="relative w-12 h-8 rounded overflow-hidden border">
                        <img
                          src={video.heroImageUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Play className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{video.title}</td>
                  <td className="px-4 py-3.5 text-gray-500">{video.category?.name ?? '---'}</td>
                  <td className="px-4 py-3.5 text-gray-500">{video.viewCount ?? 0}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {video.createdAt
                      ? new Date(video.createdAt).toLocaleDateString('he-IL', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '---'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(video)}
                      className="text-red-500 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>וידאו חדש</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="כותרת הוידאו"
            />
          </div>

          <div className="space-y-2">
            <Label>תקציר</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="תיאור קצר (אופציונלי)"
            />
          </div>

          <div className="space-y-2">
            <Label>מקור הוידאו</Label>
            <div className="flex flex-wrap gap-2">
              {(['youtube', 'x', 'facebook', 'instagram', 'upload'] as VideoSource[]).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm({ ...form, source: src })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    form.source === src
                      ? 'bg-[#0099DB] text-white border-[#0099DB]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#0099DB] hover:text-[#0099DB]'
                  }`}
                >
                  {getSourceIcon(src)}
                  {getSourceLabel(src)}
                </button>
              ))}
            </div>
          </div>

          {form.source !== 'upload' ? (
            <div className="space-y-2">
              <Label>URL מ-{getSourceLabel(form.source)}</Label>
              <Input
                value={form.socialUrl}
                onChange={(e) => setForm({ ...form, socialUrl: e.target.value })}
                dir="ltr"
                placeholder={
                  form.source === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : form.source === 'x'
                    ? 'https://x.com/.../status/...'
                    : form.source === 'facebook'
                    ? 'https://www.facebook.com/.../videos/...'
                    : 'https://www.instagram.com/reel/...'
                }
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>העלאת קובץ וידאו</Label>
              {form.videoUrl ? (
                <div className="space-y-2">
                  <video src={form.videoUrl} className="w-full rounded-lg border" controls style={{ maxHeight: 200 }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, videoUrl: '' })}>
                    הסר וידאו
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { uploadFile } = await import('@/lib/api');
                        const media = await uploadFile(file);
                        setForm({ ...form, videoUrl: media.url });
                        toast.success('הוידאו הועלה');
                      } catch {
                        toast.error('שגיאה בהעלאת הוידאו');
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0099DB]/10 file:text-[#0099DB] hover:file:bg-[#0099DB]/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV -- עד 100MB</p>
                </div>
              )}
            </div>
          )}

          <ImagePicker
            value={form.heroImageUrl}
            onChange={(url) => setForm({ ...form, heroImageUrl: url })}
            label="תמונת תצוגה"
          />

          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099DB] focus:ring-offset-2"
            >
              <option value="">ללא קטגוריה</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">צור</Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              ביטול
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
