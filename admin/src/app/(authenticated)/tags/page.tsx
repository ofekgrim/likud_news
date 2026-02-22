'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const TAG_TYPE_LABELS: Record<string, string> = {
  topic: 'נושא',
  person: 'אישיות',
  location: 'מיקום',
};

const TAG_TYPE_COLORS: Record<string, string> = {
  topic: 'bg-blue-100 text-blue-700',
  person: 'bg-purple-100 text-purple-700',
  location: 'bg-green-100 text-green-700',
};

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState({
    nameHe: '',
    nameEn: '',
    slug: '',
    tagType: 'topic' as 'topic' | 'person' | 'location',
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('התגית נוצרה');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof form & { id: string }) =>
      api.put(`/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('התגית עודכנה');
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('התגית נמחקה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm({ nameHe: '', nameEn: '', slug: '', tagType: 'topic' });
    setDialogOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditing(tag);
    setForm({
      nameHe: tag.nameHe,
      nameEn: tag.nameEn || '',
      slug: tag.slug,
      tagType: tag.tagType,
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

  function handleDelete(tag: Tag) {
    if (confirm(`למחוק את התגית "${tag.nameHe}"?`)) {
      deleteMutation.mutate(tag.id);
    }
  }

  function autoSlug(nameHe: string) {
    return nameHe
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0590-\u05FFa-z0-9-]/g, '');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">תגיות</h1>
        <Button onClick={openCreate}>תגית חדשה +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">שם באנגלית</th>
              <th className="text-right px-4 py-3 font-medium">Slug</th>
              <th className="text-right px-4 py-3 font-medium">סוג</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))
            ) : tags?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  אין תגיות. צור תגית חדשה כדי להתחיל.
                </td>
              </tr>
            ) : (
              tags?.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium">{tag.nameHe}</td>
                  <td className="px-4 py-3.5 text-gray-500" dir="ltr">
                    {tag.nameEn || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500" dir="ltr">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        TAG_TYPE_COLORS[tag.tagType] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {TAG_TYPE_LABELS[tag.tagType] || tag.tagType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(tag)}
                      >
                        עריכה
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tag)}
                        className="text-red-500 hover:text-red-600 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת תגית' : 'תגית חדשה'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם בעברית</Label>
            <Input
              value={form.nameHe}
              onChange={(e) => {
                const nameHe = e.target.value;
                setForm({
                  ...form,
                  nameHe,
                  ...(editing ? {} : { slug: autoSlug(nameHe) }),
                });
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>שם באנגלית</Label>
            <Input
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              dir="ltr"
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
          <div className="space-y-2">
            <Label>סוג</Label>
            <select
              value={form.tagType}
              onChange={(e) =>
                setForm({
                  ...form,
                  tagType: e.target.value as typeof form.tagType,
                })
              }
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099DB] focus:ring-offset-2"
            >
              <option value="topic">נושא</option>
              <option value="person">אישיות</option>
              <option value="location">מיקום</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {editing ? 'עדכן' : 'צור'}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              ביטול
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
