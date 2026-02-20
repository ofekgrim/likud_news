'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Article, Category, Member, ContentBlock } from '@/lib/types';
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
import { ColorPicker } from '@/components/color-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const articleId = params.id as string;
  const [htmlFallbackOpen, setHtmlFallbackOpen] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.get<Article>(`/articles/${articleId}/by-id`),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    status: 'draft' as string,
    categoryId: '',
    isHero: false,
    isBreaking: false,
    heroImageUrl: '',
    memberIds: [] as string[],
    bodyBlocks: [] as ContentBlock[],
    alertBannerText: '',
    alertBannerEnabled: false,
    alertBannerColor: '#E53935',
    heroImageCredit: '',
    heroImageCaptionHe: '',
    authorId: '',
    tagIds: [] as string[],
    allowComments: true,
  });

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        subtitle: article.subtitle || '',
        slug: article.slug,
        content: article.content,
        status: article.status,
        categoryId: article.categoryId || '',
        isHero: article.isHero,
        isBreaking: article.isBreaking,
        heroImageUrl: article.heroImageUrl || '',
        memberIds: article.members?.map((m) => m.id) || [],
        bodyBlocks: article.bodyBlocks || [],
        alertBannerText: article.alertBannerText || '',
        alertBannerEnabled: article.alertBannerEnabled || false,
        alertBannerColor: article.alertBannerColor || '#E53935',
        heroImageCredit: article.heroImageCredit || '',
        heroImageCaptionHe: article.heroImageCaptionHe || '',
        authorId: article.authorId || '',
        tagIds: article.tags?.map((t) => t.id) || [],
        allowComments: article.allowComments ?? true,
      });
    }
  }, [article]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put<Article>(`/articles/${articleId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('הכתבה עודכנה');
      router.push('/articles');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: form.categoryId || undefined,
      heroImageUrl: form.heroImageUrl || undefined,
      memberIds: form.memberIds.length > 0 ? form.memberIds : undefined,
      bodyBlocks: form.bodyBlocks.length > 0 ? form.bodyBlocks : undefined,
      alertBannerText: form.alertBannerText || undefined,
      alertBannerColor: form.alertBannerEnabled ? form.alertBannerColor : undefined,
      heroImageCredit: form.heroImageCredit || undefined,
      heroImageCaptionHe: form.heroImageCaptionHe || undefined,
      authorId: form.authorId || undefined,
      tagIds: form.tagIds.length > 0 ? form.tagIds : undefined,
      publishedAt:
        form.status === 'published' && !article?.publishedAt
          ? new Date().toISOString()
          : undefined,
    };
    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">עריכת כתבה</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'שומר...' : 'עדכן כתבה'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>כותרת</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>כותרת משנה</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Block Editor — primary content editor */}
          <Card>
            <CardContent className="p-5">
              <Label className="mb-2 block">תוכן הכתבה (בלוקים)</Label>
              <BlockEditor
                blocks={form.bodyBlocks}
                onChange={(blocks) => setForm({ ...form, bodyBlocks: blocks })}
              />
            </CardContent>
          </Card>

          {/* HTML Fallback (TipTap) — collapsible */}
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
          {/* Alert Banner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">באנר התראה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.alertBannerEnabled}
                  onChange={(e) =>
                    setForm({ ...form, alertBannerEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">הפעל באנר התראה</span>
              </label>
              {form.alertBannerEnabled && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">טקסט ההתראה</Label>
                    <Input
                      value={form.alertBannerText}
                      onChange={(e) =>
                        setForm({ ...form, alertBannerText: e.target.value })
                      }
                      placeholder="למשל: מבזק - עדכון אחרון"
                    />
                  </div>
                  <ColorPicker
                    value={form.alertBannerColor}
                    onChange={(color) =>
                      setForm({ ...form, alertBannerColor: color })
                    }
                    label="צבע הבאנר"
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Author Selector */}
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

          {/* Tag Selector */}
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

              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isHero}
                    onChange={(e) =>
                      setForm({ ...form, isHero: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">כתבה ראשית</span>
                </label>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowComments}
                    onChange={(e) =>
                      setForm({ ...form, allowComments: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">אפשר תגובות</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Hero Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונה ראשית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImagePicker
                value={form.heroImageUrl}
                onChange={(url) => setForm({ ...form, heroImageUrl: url })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">קרדיט תמונה</Label>
                <Input
                  value={form.heroImageCredit}
                  onChange={(e) =>
                    setForm({ ...form, heroImageCredit: e.target.value })
                  }
                  placeholder="שם הצלם / מקור"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">כיתוב</Label>
                <Input
                  value={form.heroImageCaptionHe}
                  onChange={(e) =>
                    setForm({ ...form, heroImageCaptionHe: e.target.value })
                  }
                  placeholder="כיתוב לתמונה"
                />
              </div>
            </CardContent>
          </Card>

          {/* Linked Members */}
          {members && members.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">חברי כנסת מקושרים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(member.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...form.memberIds, member.id]
                            : form.memberIds.filter(
                                (id) => id !== member.id
                              );
                          setForm({ ...form, memberIds: ids });
                        }}
                        className="h-3.5 w-3.5 rounded"
                      />
                      <span>{member.name}</span>
                      {member.title && (
                        <span className="text-gray-400 text-xs">
                          — {member.title}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
