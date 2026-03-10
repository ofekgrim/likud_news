'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category, ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor';
import { BlockEditor } from '@/components/block-editor';
import { ImagePicker } from '@/components/image-picker';
import { TagSelector } from '@/components/tag-selector';
import { AuthorSelector } from '@/components/author-selector';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Youtube, ExternalLink } from 'lucide-react';

type VideoSource = 'youtube' | 'x' | 'facebook' | 'instagram' | 'upload';

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

interface VideoForm {
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  status: string;
  categoryId: string;
  isBreaking: boolean;
  heroImageUrl: string;
  authorId: string;
  tagIds: string[];
  bodyBlocks: ContentBlock[];
  source: VideoSource;
  socialUrl: string;
  videoUrl: string;
  publishedAt: string;
}

const EMPTY_FORM: VideoForm = {
  title: '',
  subtitle: '',
  slug: '',
  content: '',
  status: 'draft',
  categoryId: '',
  isBreaking: false,
  heroImageUrl: '',
  authorId: '',
  tagIds: [],
  bodyBlocks: [],
  source: 'youtube',
  socialUrl: '',
  videoUrl: '',
  publishedAt: '',
};

export default function NewVideoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VideoForm>({ ...EMPTY_FORM });
  const [htmlFallbackOpen, setHtmlFallbackOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/articles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('הוידאו נוצר בהצלחה');
      router.push('/videos');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Generate slug from title if empty
    const slug =
      form.slug ||
      'video-' +
        form.title
          .replace(/[^\w\u0590-\u05FF]+/g, '-')
          .substring(0, 50) +
        '-' +
        Date.now().toString(36);

    // Auto-detect video category
    const videoCategory = categories?.find((c) => c.slug === 'video');
    const categoryId = form.categoryId || videoCategory?.id || undefined;

    // Build bodyBlocks: video source block + editor blocks
    let videoBlocks: ContentBlock[] = [];
    if (form.source === 'youtube' && form.socialUrl) {
      const match = form.socialUrl.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (match) {
        videoBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'youtube',
            videoId: match[1],
            caption: form.title,
          },
        ];
      } else {
        videoBlocks = [
          {
            id: crypto.randomUUID(),
            type: 'video',
            source: 'youtube',
            url: form.socialUrl,
          },
        ];
      }
    } else if (form.source === 'upload' && form.videoUrl) {
      videoBlocks = [
        {
          id: crypto.randomUUID(),
          type: 'video',
          source: 'upload',
          url: form.videoUrl,
        },
      ];
    } else if (form.socialUrl) {
      // x, facebook, instagram
      videoBlocks = [
        {
          id: crypto.randomUUID(),
          type: 'video',
          source: 'youtube', // fallback source type
          url: form.socialUrl,
        },
      ];
    }

    // Append editor blocks after the video source block
    const allBlocks = [...videoBlocks, ...form.bodyBlocks];

    // Determine publishedAt
    let publishedAt = form.publishedAt
      ? new Date(form.publishedAt).toISOString()
      : undefined;
    if (form.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    const payload: Record<string, unknown> = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      slug,
      content: form.content || form.title,
      heroImageUrl: form.heroImageUrl || undefined,
      categoryId,
      status: form.status,
      isBreaking: form.isBreaking,
      bodyBlocks: allBlocks.length > 0 ? allBlocks : undefined,
      authorId: form.authorId || undefined,
      tagIds: form.tagIds.length > 0 ? form.tagIds : undefined,
      publishedAt,
    };

    createMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">וידאו חדש</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'שומר...' : 'צור וידאו'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1 - Basic Info */}
          <Card>
            <CardContent className="p-5 space-y-4">
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
                <Label>כותרת משנה</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  placeholder="תיאור קצר (אופציונלי)"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  dir="ltr"
                  placeholder="ייווצר אוטומטית מהכותרת אם ריק"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Video Source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">מקור הוידאו</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  ['youtube', 'x', 'facebook', 'instagram', 'upload'] as VideoSource[]
                ).map((src) => (
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

              {form.source !== 'upload' ? (
                <div className="space-y-2">
                  <Label>URL מ-{getSourceLabel(form.source)}</Label>
                  <Input
                    value={form.socialUrl}
                    onChange={(e) =>
                      setForm({ ...form, socialUrl: e.target.value })
                    }
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
                      <video
                        src={form.videoUrl}
                        className="w-full rounded-lg border"
                        controls
                        style={{ maxHeight: 200 }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm({ ...form, videoUrl: '' })}
                      >
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
                      <p className="text-xs text-gray-400 mt-1">
                        MP4, WebM, MOV -- עד 100MB
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3 - Block Editor */}
          <Card>
            <CardContent className="p-5">
              <Label className="mb-2 block">תוכן הוידאו (בלוקים)</Label>
              <BlockEditor
                blocks={form.bodyBlocks}
                onChange={(blocks) => setForm({ ...form, bodyBlocks: blocks })}
              />
            </CardContent>
          </Card>

          {/* Card 4 - HTML Fallback (TipTap) */}
          <Card>
            <button
              type="button"
              onClick={() => setHtmlFallbackOpen(!htmlFallbackOpen)}
              className="flex items-center justify-between w-full p-5 text-right"
            >
              <Label className="cursor-pointer text-gray-500">
                תוכן HTML (לגיבוי)
              </Label>
              {htmlFallbackOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {htmlFallbackOpen && (
              <CardContent className="p-5 pt-0">
                <RichTextEditor
                  content={form.content}
                  onChange={(html) => setForm({ ...form, content: html })}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Thumbnail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונת תצוגה</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={form.heroImageUrl}
                onChange={(url) => setForm({ ...form, heroImageUrl: url })}
              />
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הגדרות פרסום</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option value="draft">טיוטה</option>
                  <option value="published">פורסם</option>
                  <option value="archived">ארכיון</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">בחר קטגוריה</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תאריך פרסום</Label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) =>
                    setForm({ ...form, publishedAt: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0099DB] disabled:cursor-not-allowed disabled:opacity-50"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isBreaking}
                    onChange={(e) =>
                      setForm({ ...form, isBreaking: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">מבזק</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Author */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">כתב</CardTitle>
            </CardHeader>
            <CardContent>
              <AuthorSelector
                value={form.authorId || undefined}
                onChange={(authorId) =>
                  setForm({ ...form, authorId: authorId || '' })
                }
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תגיות</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector
                selectedIds={form.tagIds}
                onChange={(ids) => setForm({ ...form, tagIds: ids })}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
