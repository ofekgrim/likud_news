'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Article, Category, Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor';
import { ImagePicker } from '@/components/image-picker';
import { toast } from 'sonner';

export default function NewArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    categoryId: '',
    isHero: false,
    isBreaking: false,
    heroImageUrl: '',
    memberIds: [] as string[],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<Article>('/articles', data),
    onSuccess: () => {
      toast.success('הכתבה נוצרה בהצלחה');
      router.push('/articles');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: form.categoryId || undefined,
      heroImageUrl: form.heroImageUrl || undefined,
      memberIds: form.memberIds.length > 0 ? form.memberIds : undefined,
      publishedAt:
        form.status === 'published' ? new Date().toISOString() : undefined,
    };
    createMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">כתבה חדשה</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'שומר...' : 'שמור כתבה'}
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
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  placeholder="כותרת הכתבה"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>כותרת משנה</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  placeholder="כותרת משנה (אופציונלי)"
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

          <Card>
            <CardContent className="p-5">
              <Label className="mb-2 block">תוכן הכתבה</Label>
              <RichTextEditor
                content={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
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
                    setForm({
                      ...form,
                      status: e.target.value as 'draft' | 'published',
                    })
                  }
                >
                  <option value="draft">טיוטה</option>
                  <option value="published">פורסם</option>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונה ראשית</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={form.heroImageUrl}
                onChange={(url) => setForm({ ...form, heroImageUrl: url })}
              />
            </CardContent>
          </Card>

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
                            : form.memberIds.filter((id) => id !== member.id);
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
