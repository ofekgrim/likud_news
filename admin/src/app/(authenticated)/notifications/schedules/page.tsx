'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Trash2, Pencil, Power } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  name: string;
  templateId: string;
  template?: { id: string; name: string; titleTemplate: string };
  scheduleType: 'once' | 'recurring';
  scheduledAt?: string;
  cronExpression?: string;
  timezone: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  titleTemplate: string;
}

const defaultForm = {
  name: '',
  templateId: '',
  scheduleType: 'once' as 'once' | 'recurring',
  scheduledAt: '',
  cronExpression: '',
  timezone: 'Asia/Jerusalem',
  audienceRules: { type: 'all' as const },
  isActive: true,
};

export default function NotificationSchedulesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['notification-schedules'],
    queryFn: () => api.get<Schedule[]>('/notifications/schedules'),
  });

  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => api.get<Template[]>('/notifications/templates'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/notifications/schedules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-schedules'] });
      toast.success('התזמון נוצר');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof form & { id: string }) =>
      api.put(`/notifications/schedules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-schedules'] });
      toast.success('התזמון עודכן');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/schedules/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-schedules'] });
      toast.success('הסטטוס עודכן');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-schedules'] });
      toast.success('התזמון נמחק');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setForm({
      name: s.name,
      templateId: s.templateId,
      scheduleType: s.scheduleType,
      scheduledAt: s.scheduledAt || '',
      cronExpression: s.cronExpression || '',
      timezone: s.timezone,
      audienceRules: { type: 'all' },
      isActive: s.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  function handleDelete(s: Schedule) {
    if (confirm(`למחוק את התזמון "${s.name}"?`)) {
      deleteMutation.mutate(s.id);
    }
  }

  function formatDate(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleString('he-IL');
  }

  const cronPresets = [
    { label: 'כל יום ב-8:00', value: '0 8 * * *' },
    { label: 'כל יום ב-18:00', value: '0 18 * * *' },
    { label: 'כל ראשון ב-9:00', value: '0 9 * * 0' },
    { label: 'כל שני ב-8:00', value: '0 8 * * 1' },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">תזמון התראות</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />
          תזמון חדש
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">שם</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">תבנית</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">סוג</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-36">הפעלה הבאה</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-36">הפעלה אחרונה</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">פעיל</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !schedules?.length ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      אין תזמונים. צור תזמון חדש כדי להתחיל.
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.template?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {s.scheduleType === 'once' ? 'חד-פעמי' : 'חוזר'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.nextRunAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.lastRunAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.isActive ? 'success' : 'outline'}>
                          {s.isActive ? 'פעיל' : 'מושבת'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMutation.mutate(s.id)}
                            title={s.isActive ? 'השבת' : 'הפעל'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת תזמון' : 'תזמון חדש'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>תבנית</Label>
            <select
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">בחר תבנית...</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.titleTemplate}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>סוג</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.scheduleType === 'once' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForm({ ...form, scheduleType: 'once' })}
              >
                חד-פעמי
              </Button>
              <Button
                type="button"
                variant={form.scheduleType === 'recurring' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForm({ ...form, scheduleType: 'recurring' })}
              >
                חוזר
              </Button>
            </div>
          </div>

          {form.scheduleType === 'once' && (
            <div className="space-y-2">
              <Label>תאריך ושעה</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                dir="ltr"
              />
            </div>
          )}

          {form.scheduleType === 'recurring' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Cron Expression</Label>
                <Input
                  value={form.cronExpression}
                  onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
                  placeholder="0 8 * * *"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {cronPresets.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, cronExpression: p.value })}
                    className="text-xs"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit">{editing ? 'עדכן' : 'צור'}</Button>
            <Button type="button" variant="outline" onClick={closeDialog}>ביטול</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
