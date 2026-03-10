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
import { ImagePicker } from '@/components/image-picker';
import { CandidateSelector } from '@/components/candidate-selector';
import { toast } from 'sonner';

export default function NewEventPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    location: '',
    city: '',
    district: '',
    latitude: '',
    longitude: '',
    candidateId: undefined as string | undefined,
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/campaign-events', data),
    onSuccess: () => {
      toast.success('האירוע נוצר בהצלחה');
      router.push('/primaries/events');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title,
      titleEn: form.titleEn || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      location: form.location,
      city: form.city || undefined,
      district: form.district || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      candidateId: form.candidateId || undefined,
      isActive: form.isActive,
    };
    createMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אירוע חדש</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'שומר...' : 'שמור אירוע'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1 — Event Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטי האירוע</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>כותרת (עברית) *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="שם האירוע בעברית"
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
                  placeholder="Event title in English"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="תיאור האירוע..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Date & Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תאריך ומיקום</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תאריך התחלה *</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>תאריך סיום</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>מיקום *</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="כתובת או שם המקום"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>עיר</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="למשל: תל אביב"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מחוז</Label>
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="למשל: מרכז"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — GPS Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">מיקום GPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>קו רוחב (Latitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    dir="ltr"
                    placeholder="31.7683"
                  />
                </div>
                <div className="space-y-2">
                  <Label>קו אורך (Longitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    dir="ltr"
                    placeholder="35.2137"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                לתצוגה במפה
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">תמונה</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePicker
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="תמונת האירוע"
              />
            </CardContent>
          </Card>

          {/* Candidate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">שיוך</CardTitle>
            </CardHeader>
            <CardContent>
              <CandidateSelector
                value={form.candidateId}
                onChange={(candidateId) => setForm({ ...form, candidateId })}
                label="מועמד משויך"
              />
              <p className="text-xs text-gray-400 mt-2">
                אופציונלי. ניתן ליצור אירוע ללא שיוך למועמד ספציפי.
              </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
