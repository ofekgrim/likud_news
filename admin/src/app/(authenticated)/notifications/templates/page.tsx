'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TemplateVariable {
  name: string;
  required: boolean;
  description: string;
}

interface Template {
  id: string;
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
  imageUrlTemplate?: string;
  contentType: string;
  triggerEvent?: string;
  isAutoTrigger: boolean;
  defaultAudience: Record<string, unknown>;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: string;
}

const contentTypeLabels: Record<string, string> = {
  article: 'כתבה',
  poll: 'סקר',
  event: 'אירוע',
  election: 'בחירות',
  quiz: 'שאלון',
  custom: 'מותאם',
};

const defaultForm = {
  name: '',
  titleTemplate: '',
  bodyTemplate: '',
  imageUrlTemplate: '',
  contentType: 'custom',
  triggerEvent: '',
  isAutoTrigger: false,
  isActive: true,
  variables: [] as TemplateVariable[],
};

export default function NotificationTemplatesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [newVarName, setNewVarName] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => api.get<Template[]>('/notifications/templates'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/notifications/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('התבנית נוצרה');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof form & { id: string }) =>
      api.put(`/notifications/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('התבנית עודכנה');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('התבנית נמחקה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({
      name: t.name,
      titleTemplate: t.titleTemplate,
      bodyTemplate: t.bodyTemplate,
      imageUrlTemplate: t.imageUrlTemplate || '',
      contentType: t.contentType,
      triggerEvent: t.triggerEvent || '',
      isAutoTrigger: t.isAutoTrigger,
      isActive: t.isActive,
      variables: t.variables || [],
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

  function handleDelete(t: Template) {
    if (confirm(`למחוק את התבנית "${t.name}"?`)) {
      deleteMutation.mutate(t.id);
    }
  }

  function addVariable() {
    if (!newVarName.trim()) return;
    setForm({
      ...form,
      variables: [
        ...form.variables,
        { name: newVarName.trim(), required: false, description: '' },
      ],
    });
    setNewVarName('');
  }

  function removeVariable(index: number) {
    setForm({
      ...form,
      variables: form.variables.filter((_, i) => i !== index),
    });
  }

  function updateVariable(index: number, field: keyof TemplateVariable, value: unknown) {
    const updated = [...form.variables];
    (updated[index] as Record<string, unknown>)[field] = value;
    setForm({ ...form, variables: updated });
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">תבניות התראה</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />
          תבנית חדשה
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">שם</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">כותרת</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">סוג</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">טריגר</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">אוטומטי</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">פעיל</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !templates?.length ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      אין תבניות. צור תבנית חדשה כדי להתחיל.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium" dir="ltr">{t.name}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">
                        {t.titleTemplate}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {contentTypeLabels[t.contentType] || t.contentType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs" dir="ltr">
                        {t.triggerEvent || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {t.isAutoTrigger ? (
                          <Badge variant="success">כן</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.isActive ? 'success' : 'outline'}>
                          {t.isActive ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t)}
                            className="text-red-500 hover:text-red-600"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת תבנית' : 'תבנית חדשה'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם (מזהה)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>סוג תוכן</Label>
              <select
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(contentTypeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>תבנית כותרת</Label>
            <Input
              value={form.titleTemplate}
              onChange={(e) => setForm({ ...form, titleTemplate: e.target.value })}
              placeholder='כתבה חדשה: {{article_title}}'
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תבנית תוכן</Label>
            <textarea
              value={form.bodyTemplate}
              onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })}
              placeholder='{{article_title}} פורסמה עכשיו'
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תבנית תמונה (URL)</Label>
            <Input
              value={form.imageUrlTemplate}
              onChange={(e) => setForm({ ...form, imageUrlTemplate: e.target.value })}
              placeholder="{{hero_image_url}}"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>אירוע טריגר</Label>
              <Input
                value={form.triggerEvent}
                onChange={(e) => setForm({ ...form, triggerEvent: e.target.value })}
                placeholder="article.published"
                dir="ltr"
              />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAutoTrigger}
                  onChange={(e) => setForm({ ...form, isAutoTrigger: e.target.checked })}
                />
                שליחה אוטומטית
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                פעיל
              </label>
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-3">
            <Label>משתנים</Label>
            {form.variables.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={v.name}
                  onChange={(e) => updateVariable(i, 'name', e.target.value)}
                  placeholder="שם"
                  dir="ltr"
                  className="w-1/3"
                />
                <Input
                  value={v.description}
                  onChange={(e) => updateVariable(i, 'description', e.target.value)}
                  placeholder="תיאור"
                  className="flex-1"
                />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={v.required}
                    onChange={(e) => updateVariable(i, 'required', e.target.checked)}
                  />
                  חובה
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(i)}
                  className="text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="שם משתנה חדש"
                dir="ltr"
                className="w-1/3"
              />
              <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                <Plus className="h-3.5 w-3.5 ml-1" />
                הוסף
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">{editing ? 'עדכן' : 'צור'}</Button>
            <Button type="button" variant="outline" onClick={closeDialog}>ביטול</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
