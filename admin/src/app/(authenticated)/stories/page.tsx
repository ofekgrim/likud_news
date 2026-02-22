'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Story, Article } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, ExternalLink, FileText, Image as ImageIcon, Video, Clock, Plus } from 'lucide-react';
import { MediaPicker } from '@/components/media-picker';
import Link from 'next/link';

interface StoryForm {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  linkUrl: string;
  articleId: string;
  linkedArticleId: string;
  sortOrder: number;
  isActive: boolean;
  expiresAt: string;
  videoUrl: string;
  durationSeconds: number;
  mediaType: 'image' | 'video';
}

const EMPTY_FORM: StoryForm = {
  title: '',
  imageUrl: '',
  thumbnailUrl: '',
  linkUrl: '',
  articleId: '',
  linkedArticleId: '',
  sortOrder: 0,
  isActive: true,
  expiresAt: '',
  videoUrl: '',
  durationSeconds: 5,
  mediaType: 'image' as const,
};

export default function StoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [form, setForm] = useState<StoryForm>({ ...EMPTY_FORM });

  // Fetch all stories (admin endpoint includes inactive/expired)
  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get<Story[]>('/stories/all'),
  });

  // Fetch articles for the dropdown
  const { data: articlesData } = useQuery({
    queryKey: ['articles-for-stories'],
    queryFn: () => api.get<{ data: Article[] }>('/articles?limit=100&status=published'),
  });
  const articles = articlesData?.data ?? (Array.isArray(articlesData) ? articlesData : []);

  // Fetch only video articles for the linked video dropdown
  const { data: videoArticlesData } = useQuery({
    queryKey: ['video-articles-for-stories'],
    queryFn: () => api.get<{ data: Article[] }>('/articles?category=video&limit=100&status=published'),
  });
  const videoArticles = videoArticlesData?.data ?? (Array.isArray(videoArticlesData) ? videoArticlesData : []);

  const createMutation = useMutation({
    mutationFn: (data: Partial<StoryForm>) => api.post('/stories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('הסטורי נוצר');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<StoryForm> & { id: string }) =>
      api.put(`/stories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('הסטורי עודכן');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('הסטורי נמחק');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEdit(story: Story) {
    setEditing(story);
    setForm({
      title: story.title,
      imageUrl: story.imageUrl,
      thumbnailUrl: story.thumbnailUrl || '',
      linkUrl: story.linkUrl || '',
      articleId: story.articleId || '',
      linkedArticleId: story.linkedArticleId || '',
      sortOrder: story.sortOrder,
      isActive: story.isActive,
      expiresAt: story.expiresAt ? story.expiresAt.split('T')[0] : '',
      videoUrl: story.videoUrl || '',
      durationSeconds: story.durationSeconds ?? 5,
      mediaType: story.mediaType || 'image',
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const imageUrl = form.mediaType === 'video' && !form.imageUrl
      ? (form.thumbnailUrl || form.videoUrl)
      : form.imageUrl;
    const payload: Record<string, unknown> = {
      title: form.title,
      imageUrl,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      durationSeconds: form.durationSeconds,
      mediaType: form.mediaType,
    };
    if (form.thumbnailUrl) payload.thumbnailUrl = form.thumbnailUrl;
    if (form.linkUrl) payload.linkUrl = form.linkUrl;
    if (form.articleId) payload.articleId = form.articleId;
    if (form.linkedArticleId) payload.linkedArticleId = form.linkedArticleId;
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    if (form.mediaType === 'video' && form.videoUrl) payload.videoUrl = form.videoUrl;

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload } as any);
    } else {
      createMutation.mutate(payload as any);
    }
  }

  function handleDelete(story: Story) {
    if (confirm(`למחוק את הסטורי "${story.title}"?`)) {
      deleteMutation.mutate(story.id);
    }
  }

  function formatExpiry(date?: string) {
    if (!date) return '—';
    const d = new Date(date);
    const now = new Date();
    const isExpired = d < now;
    const formatted = d.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return isExpired ? `${formatted} (פג)` : formatted;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">סטוריז</h1>
        <Button onClick={openCreate}>סטורי חדש +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תצוגה</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium w-24">סוג/משך</th>
              <th className="text-right px-4 py-3 font-medium">קישור/כתבה</th>
              <th className="text-right px-4 py-3 font-medium w-20">סדר</th>
              <th className="text-right px-4 py-3 font-medium w-20">פעיל</th>
              <th className="text-right px-4 py-3 font-medium">תפוגה</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={8} />
              ))
            ) : stories?.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  אין סטוריז. צור סטורי חדש כדי להתחיל.
                </td>
              </tr>
            ) : (
              stories?.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2">
                    {story.thumbnailUrl || story.imageUrl ? (
                      <img
                        src={story.thumbnailUrl || story.imageUrl}
                        alt={story.title}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{story.title}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {story.mediaType === 'video' ? (
                        <Video className="h-4 w-4 text-purple-500" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {story.durationSeconds}s
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {story.articleId ? (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-xs">כתבה מקושרת</span>
                      </span>
                    ) : story.linkUrl ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-xs truncate max-w-[150px]" dir="ltr">
                          {story.linkUrl}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">עצמאי</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">{story.sortOrder}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        story.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {story.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {formatExpiry(story.expiresAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(story)}
                      >
                        עריכה
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(story)}
                        className="text-red-500 hover:text-red-600 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת סטורי' : 'סטורי חדש'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="כותרת הסטורי"
            />
          </div>

          {form.mediaType === 'image' && (
            <div className="space-y-2">
              <MediaPicker
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="תמונה *"
                accept="image"
              />
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                dir="ltr"
                placeholder="או הזן URL ידנית: https://..."
                className="text-xs"
              />
            </div>
          )}

          <div className="space-y-2">
            <MediaPicker
              value={form.thumbnailUrl}
              onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
              label="תמונה ממוזערת (אופציונלי)"
              accept="image"
            />
          </div>

          <div className="space-y-2">
            <Label>סוג מדיה</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={form.mediaType === 'image'}
                  onChange={() => setForm({ ...form, mediaType: 'image' })}
                  className="h-4 w-4 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> תמונה
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={form.mediaType === 'video'}
                  onChange={() => setForm({ ...form, mediaType: 'video' })}
                  className="h-4 w-4 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm flex items-center gap-1">
                  <Video className="h-4 w-4" /> וידאו
                </span>
              </label>
            </div>
          </div>

          {form.mediaType === 'video' && (
            <div className="space-y-2">
              <MediaPicker
                value={form.videoUrl}
                onChange={(url) => setForm({ ...form, videoUrl: url })}
                label="וידאו"
                accept="video"
              />
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                dir="ltr"
                placeholder="או הזן URL ידנית: https://..."
                className="text-xs"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>משך (שניות)</Label>
            <Input
              type="number"
              value={form.durationSeconds}
              onChange={(e) =>
                setForm({ ...form, durationSeconds: parseInt(e.target.value) || 5 })
              }
              min={1}
              max={60}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label>קישור חיצוני</Label>
            <Input
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              dir="ltr"
              placeholder="https://... (לסטוריז שלא מקושרים לכתבה)"
            />
          </div>

          <div className="space-y-2">
            <Label>כתבה מקושרת</Label>
            <select
              value={form.articleId}
              onChange={(e) => setForm({ ...form, articleId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099DB] focus:ring-offset-2"
            >
              <option value="">ללא כתבה</option>
              {(articles as Article[])?.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </div>

          {form.mediaType === 'video' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>כתבת וידאו מקושרת</Label>
                <Link
                  href="/videos"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-[#0099DB] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  צור וידאו חדש
                </Link>
              </div>
              <select
                value={form.linkedArticleId}
                onChange={(e) => setForm({ ...form, linkedArticleId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099DB] focus:ring-offset-2"
              >
                <option value="">ללא כתבת וידאו</option>
                {(videoArticles as Article[])?.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">קישור לכתבת וידאו ספציפית (אופציונלי)</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סדר תצוגה</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>תאריך תפוגה</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
            />
            <Label htmlFor="isActive">פעיל</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {editing ? 'עדכן' : 'צור'}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              ביטול
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
