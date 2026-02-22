'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', slug: '', color: '#0099DB', sortOrder: 0 });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('הקטגוריה נוצרה');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof form & { id: string }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('הקטגוריה עודכנה');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('הקטגוריה נמחקה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(cat: Category) {
    if (confirm(`למחוק את הקטגוריה "${cat.name}"? כתבות שמשויכות לקטגוריה זו יישארו ללא קטגוריה.`)) {
      deleteMutation.mutate(cat.id);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', nameEn: '', slug: '', color: '#0099DB', sortOrder: 0 });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, nameEn: cat.nameEn || '', slug: cat.slug, color: cat.color || '#0099DB', sortOrder: cat.sortOrder });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">קטגוריות</h1>
        <Button onClick={openCreate}>קטגוריה חדשה +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">צבע</th>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">Slug</th>
              <th className="text-right px-4 py-3 font-medium">סדר</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))
            ) : (
              categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div
                      className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                      style={{ backgroundColor: cat.color || '#ccc' }}
                    />
                  </td>
                  <td className="px-4 py-3.5 font-medium">{cat.name}</td>
                  <td className="px-4 py-3.5 text-gray-500" dir="ltr">{cat.slug}</td>
                  <td className="px-4 py-3.5 text-gray-500">{cat.sortOrder}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                        עריכה
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cat)}
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
        <DialogTitle>{editing ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>שם באנגלית</Label>
            <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>צבע</Label>
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>סדר</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
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
