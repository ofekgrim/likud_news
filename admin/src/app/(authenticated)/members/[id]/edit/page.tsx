'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Member, ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from '@/components/editor';
import { BlockEditor } from '@/components/block-editor';
import { ImagePicker } from '@/components/image-picker';
import { toast } from 'sonner';

function generateSlug(name: string): string {
  return name
    .replace(/[^\w\u0590-\u05FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const memberId = params.id as string;

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => api.get<Member>(`/members/${memberId}`),
  });

  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    title: '',
    titleEn: '',
    slug: '',
    bio: '',
    bioEn: '',
    bioBlocks: [] as ContentBlock[],
    personalPageHtml: '',
    photoUrl: '',
    coverImageUrl: '',
    office: '',
    phone: '',
    email: '',
    website: '',
    socialTwitter: '',
    socialFacebook: '',
    socialInstagram: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        nameEn: member.nameEn || '',
        title: member.title || '',
        titleEn: member.titleEn || '',
        slug: member.slug || '',
        bio: member.bio || '',
        bioEn: member.bioEn || '',
        bioBlocks: member.bioBlocks || [],
        personalPageHtml: member.personalPageHtml || '',
        photoUrl: member.photoUrl || '',
        coverImageUrl: member.coverImageUrl || '',
        office: member.office || '',
        phone: member.phone || '',
        email: member.email || '',
        website: member.website || '',
        socialTwitter: member.socialTwitter || '',
        socialFacebook: member.socialFacebook || '',
        socialInstagram: member.socialInstagram || '',
        isActive: member.isActive,
        sortOrder: member.sortOrder,
      });
    }
  }, [member]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/members/${memberId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      toast.success('החבר עודכן בהצלחה');
      router.push('/members');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...form,
      slug: form.slug || generateSlug(form.name),
      nameEn: form.nameEn || undefined,
      titleEn: form.titleEn || undefined,
      bio: form.bio || undefined,
      bioEn: form.bioEn || undefined,
      bioBlocks: form.bioBlocks.length > 0 ? form.bioBlocks : [],
      personalPageHtml: form.personalPageHtml || undefined,
      photoUrl: form.photoUrl || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      office: form.office || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      socialTwitter: form.socialTwitter || undefined,
      socialFacebook: form.socialFacebook || undefined,
      socialInstagram: form.socialInstagram || undefined,
    };
    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">עריכת חבר</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'שומר...' : 'עדכן חבר'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1 — Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטים בסיסיים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם (עברית) *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="שם מלא בעברית"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>שם (אנגלית)</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    dir="ltr"
                    placeholder="Full name in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תפקיד (עברית)</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="למשל: שר האוצר"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד (אנגלית)</Label>
                  <Input
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    dir="ltr"
                    placeholder="e.g. Minister of Finance"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  dir="ltr"
                  placeholder="auto-generated-from-name"
                />
                <p className="text-xs text-gray-400">
                  נוצר אוטומטית מהשם. ניתן לערוך ידנית.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Biography */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ביוגרפיה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>תקציר קצר (עברית)</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="ביוגרפיה קצרה בעברית..."
                />
              </div>
              <div className="space-y-2">
                <Label>תקציר קצר (אנגלית)</Label>
                <Textarea
                  value={form.bioEn}
                  onChange={(e) => setForm({ ...form, bioEn: e.target.value })}
                  rows={3}
                  dir="ltr"
                  placeholder="Short biography in English..."
                />
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-2">
                <Label>ביוגרפיה מורחבת (בלוקים)</Label>
                <p className="text-xs text-gray-400">
                  תוכן עשיר הכולל פסקאות, כותרות, תמונות, ציטוטים ועוד.
                </p>
                <BlockEditor
                  blocks={form.bioBlocks}
                  onChange={(blocks) => setForm({ ...form, bioBlocks: blocks })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Personal Page HTML */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">עמוד אישי (HTML מעוצב)</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={form.personalPageHtml}
                onChange={(html) => setForm({ ...form, personalPageHtml: html })}
                placeholder="תוכן העמוד האישי של החבר..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Photo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונת פרופיל</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={form.photoUrl}
                onChange={(url) => setForm({ ...form, photoUrl: url })}
                label="תמונת פרופיל"
              />
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונת כיסוי</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={form.coverImageUrl}
                onChange={(url) => setForm({ ...form, coverImageUrl: url })}
                label="תמונת כיסוי"
              />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטי קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">משרד</Label>
                <Input
                  value={form.office}
                  onChange={(e) => setForm({ ...form, office: e.target.value })}
                  placeholder="למשל: הכנסת, חדר 204"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">טלפון</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  dir="ltr"
                  placeholder="+972-2-123-4567"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">אימייל</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  dir="ltr"
                  placeholder="member@knesset.gov.il"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">אתר אינטרנט</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">רשתות חברתיות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Twitter / X</Label>
                <Input
                  value={form.socialTwitter}
                  onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                  dir="ltr"
                  placeholder="@handle or URL"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Facebook</Label>
                <Input
                  value={form.socialFacebook}
                  onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                  dir="ltr"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instagram</Label>
                <Input
                  value={form.socialInstagram}
                  onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                  dir="ltr"
                  placeholder="@handle or URL"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הגדרות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm">פעיל</span>
              </label>
              <div className="space-y-1.5">
                <Label className="text-xs">סדר תצוגה</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
