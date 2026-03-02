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
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

function generateSlug(title: string): string {
  return title
    .replace(/[^\w\u0590-\u05FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export default function NewElectionPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    description: '',
    slug: '',
    electionDate: '',
    registrationDeadline: '',
    status: 'draft' as 'draft' | 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled',
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/elections', data),
    onSuccess: () => {
      toast.success('הבחירות נוצרו בהצלחה');
      router.push('/primaries/elections');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title,
      titleEn: form.titleEn || undefined,
      description: form.description || undefined,
      slug: form.slug || generateSlug(form.title),
      electionDate: form.electionDate || undefined,
      registrationDeadline: form.registrationDeadline || undefined,
      status: form.status,
      isActive: form.isActive,
    };
    createMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">בחירות חדשות</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'שומר...' : 'שמור בחירות'}
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
                  <Label>כותרת (עברית) *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      })
                    }
                    placeholder="כותרת הבחירות בעברית"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>כותרת (אנגלית)</Label>
                  <Input
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    dir="ltr"
                    placeholder="Election title in English"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="תיאור קצר של הבחירות..."
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  dir="ltr"
                  placeholder="auto-generated-from-title"
                />
                <p className="text-xs text-gray-400">
                  נוצר אוטומטית מהכותרת. ניתן לערוך ידנית.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תאריכים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך בחירות</Label>
                  <Input
                    type="date"
                    value={form.electionDate}
                    onChange={(e) =>
                      setForm({ ...form, electionDate: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מועד אחרון לרישום</Label>
                  <Input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) =>
                      setForm({ ...form, registrationDeadline: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">סטטוס</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">סטטוס בחירות</Label>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as typeof form.status,
                    })
                  }
                >
                  <option value="draft">טיוטה</option>
                  <option value="upcoming">עתידיות</option>
                  <option value="active">פעילות</option>
                  <option value="voting">הצבעה</option>
                  <option value="completed">הושלמו</option>
                  <option value="cancelled">בוטלו</option>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm">פעיל</span>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
