'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BlockEditor } from '@/components/block-editor';
import { ImagePicker } from '@/components/image-picker';
import { ElectionSelector } from '@/components/election-selector';
import { toast } from 'sonner';
import type { ContentBlock } from '@/lib/types';

function generateSlug(name: string): string {
  return name
    .replace(/[^\w\u0590-\u05FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export default function NewCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    district: '',
    shortBio: '',
    bioBlocks: [] as ContentBlock[],
    photoUrl: '',
    coverImageUrl: '',
    phone: '',
    email: '',
    website: '',
    socialTwitter: '',
    socialFacebook: '',
    socialInstagram: '',
    electionId: '',
    isActive: true,
    sortOrder: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/candidates', data),
    onSuccess: () => {
      toast.success('המועמד נוצר בהצלחה');
      router.push('/primaries/candidates');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const socialLinks: Record<string, string> = {};
    if (form.socialTwitter) socialLinks.twitter = form.socialTwitter;
    if (form.socialFacebook) socialLinks.facebook = form.socialFacebook;
    if (form.socialInstagram) socialLinks.instagram = form.socialInstagram;

    const payload: Record<string, unknown> = {
      fullName: form.name,
      slug: form.slug || generateSlug(form.name),
      district: form.district || undefined,
      bio: form.shortBio || undefined,
      bioBlocks: form.bioBlocks.length > 0 ? form.bioBlocks : [],
      photoUrl: form.photoUrl || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      socialLinks,
      electionId: form.electionId,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };
    createMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">מועמד חדש</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'שומר...' : 'שמור מועמד'}
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
              <div className="space-y-2">
                <Label>שם מלא *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  placeholder="שם מלא בעברית"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>מחוז</Label>
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="למשל: מרכז, צפון, דרום"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>תקציר קצר</Label>
                <Textarea
                  value={form.shortBio}
                  onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
                  rows={3}
                  placeholder="תיאור קצר של המועמד..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Extended Biography */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ביוגרפיה מורחבת</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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

          {/* Card 3 — Contact Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטי קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    dir="ltr"
                    placeholder="+972-50-123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>אימייל</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    dir="ltr"
                    placeholder="candidate@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>אתר אינטרנט</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4 — Social Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">רשתות חברתיות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Twitter / X</Label>
                <Input
                  value={form.socialTwitter}
                  onChange={(e) =>
                    setForm({ ...form, socialTwitter: e.target.value })
                  }
                  dir="ltr"
                  placeholder="@handle or URL"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Facebook</Label>
                <Input
                  value={form.socialFacebook}
                  onChange={(e) =>
                    setForm({ ...form, socialFacebook: e.target.value })
                  }
                  dir="ltr"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instagram</Label>
                <Input
                  value={form.socialInstagram}
                  onChange={(e) =>
                    setForm({ ...form, socialInstagram: e.target.value })
                  }
                  dir="ltr"
                  placeholder="@handle or URL"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile Photo */}
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

          {/* Election Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">שיוך</CardTitle>
            </CardHeader>
            <CardContent>
              <ElectionSelector
                value={form.electionId}
                onChange={(val) =>
                  setForm({ ...form, electionId: val || '' })
                }
                label="בחירות *"
                required
              />
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
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
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
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
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
