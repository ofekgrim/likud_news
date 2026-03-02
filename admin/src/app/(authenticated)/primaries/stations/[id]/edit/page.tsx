'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PollingStation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { toast } from 'sonner';

export default function EditStationPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const stationId = params.id as string;

  const { data: station, isLoading } = useQuery({
    queryKey: ['polling-station', stationId],
    queryFn: () => api.get<PollingStation>(`/polling-stations/${stationId}`),
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    latitude: '',
    longitude: '',
    openTime: '',
    closeTime: '',
    electionId: undefined as string | undefined,
    capacity: '',
    isAccessible: false,
    isActive: true,
  });

  useEffect(() => {
    if (station) {
      setForm({
        name: station.name,
        address: station.address,
        city: station.city,
        district: station.district || '',
        latitude: String(station.latitude),
        longitude: String(station.longitude),
        openTime: station.openTime || '',
        closeTime: station.closeTime || '',
        electionId: station.electionId,
        capacity: station.capacity != null ? String(station.capacity) : '',
        isAccessible: station.isAccessible,
        isActive: station.isActive,
      });
    }
  }, [station]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/polling-stations/${stationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polling-stations'] });
      queryClient.invalidateQueries({
        queryKey: ['polling-station', stationId],
      });
      toast.success('הקלפי עודכנה בהצלחה');
      router.push('/primaries/stations');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name,
      address: form.address,
      city: form.city,
      district: form.district || undefined,
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
      openTime: form.openTime || undefined,
      closeTime: form.closeTime || undefined,
      electionId: form.electionId,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      isAccessible: form.isAccessible,
      isActive: form.isActive,
    };
    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">עריכת קלפי</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'שומר...' : 'עדכן קלפי'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1 — Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>שם *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="שם הקלפי"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>כתובת *</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="כתובת מלאה"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>עיר *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                    placeholder="עיר"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>מחוז</Label>
                  <Input
                    value={form.district}
                    onChange={(e) =>
                      setForm({ ...form, district: e.target.value })
                    }
                    placeholder="מחוז"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">מיקום</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>קו רוחב (Latitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                    dir="ltr"
                    placeholder="35.2137"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">קואורדינטות GPS</p>
            </CardContent>
          </Card>

          {/* Card 3 — Hours */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">שעות פעילות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שעת פתיחה</Label>
                  <Input
                    type="time"
                    value={form.openTime}
                    onChange={(e) =>
                      setForm({ ...form, openTime: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>שעת סגירה</Label>
                  <Input
                    type="time"
                    value={form.closeTime}
                    onChange={(e) =>
                      setForm({ ...form, closeTime: e.target.value })
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
          {/* Election */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">שיוך</CardTitle>
            </CardHeader>
            <CardContent>
              <ElectionSelector
                value={form.electionId}
                onChange={(id) => setForm({ ...form, electionId: id })}
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
              <div className="space-y-2">
                <Label className="text-xs">קיבולת</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  placeholder="מספר מצביעים"
                  dir="ltr"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAccessible}
                  onChange={(e) =>
                    setForm({ ...form, isAccessible: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm">נגישות לנכים</span>
              </label>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
