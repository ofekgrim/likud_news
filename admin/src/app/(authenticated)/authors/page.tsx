'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Author } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImagePicker } from '@/components/image-picker';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  User,
  X,
  Check,
} from 'lucide-react';

interface AuthorFormData {
  nameHe: string;
  nameEn: string;
  roleHe: string;
  roleEn: string;
  bioHe: string;
  email: string;
  avatarUrl: string;
  isActive: boolean;
}

const emptyForm: AuthorFormData = {
  nameHe: '',
  nameEn: '',
  roleHe: '',
  roleEn: '',
  bioHe: '',
  email: '',
  avatarUrl: '',
  isActive: true,
};

export default function AuthorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AuthorFormData>(emptyForm);

  const { data: authors = [], isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: () => api.get<Author[]>('/authors'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AuthorFormData) =>
      api.post<Author>('/authors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('הכתב נוצר בהצלחה');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AuthorFormData }) =>
      api.put<Author>(`/authors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('הכתב עודכן');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/authors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('הכתב נמחק');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  }

  function handleEdit(author: Author) {
    setForm({
      nameHe: author.nameHe,
      nameEn: author.nameEn || '',
      roleHe: author.roleHe || '',
      roleEn: author.roleEn || '',
      bioHe: author.bioHe || '',
      email: author.email || '',
      avatarUrl: author.avatarUrl || '',
      isActive: author.isActive,
    });
    setEditingId(author.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">כתבים ועורכים</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-1.5" />
            הוסף כתב
          </Button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {editingId ? 'עריכת כתב' : 'כתב חדש'}
              </CardTitle>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם (עברית) *</Label>
                  <Input
                    value={form.nameHe}
                    onChange={(e) =>
                      setForm({ ...form, nameHe: e.target.value })
                    }
                    placeholder="שם מלא בעברית"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>שם (אנגלית)</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) =>
                      setForm({ ...form, nameEn: e.target.value })
                    }
                    placeholder="Full name in English"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד (עברית)</Label>
                  <Input
                    value={form.roleHe}
                    onChange={(e) =>
                      setForm({ ...form, roleHe: e.target.value })
                    }
                    placeholder="כתב מדיני, עורך חדשות..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד (אנגלית)</Label>
                  <Input
                    value={form.roleEn}
                    onChange={(e) =>
                      setForm({ ...form, roleEn: e.target.value })
                    }
                    placeholder="Political correspondent..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>אימייל</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="author@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>סטטוס</Label>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm">פעיל</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ביוגרפיה</Label>
                <textarea
                  value={form.bioHe}
                  onChange={(e) =>
                    setForm({ ...form, bioHe: e.target.value })
                  }
                  placeholder="כמה מילים על הכתב..."
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0099DB] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <ImagePicker
                  value={form.avatarUrl}
                  onChange={(url) => setForm({ ...form, avatarUrl: url })}
                  label="תמונת פרופיל"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'שומר...'
                    : editingId
                    ? 'עדכן כתב'
                    : 'צור כתב'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ביטול
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Authors Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg font-medium">
              אין כתבים במערכת
            </p>
            <p className="text-gray-400 text-sm mt-1">
              הוסף את הכתב הראשון כדי להתחיל
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    תמונה
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    שם
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    תפקיד
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    אימייל
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    סטטוס
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {authors.map((author) => (
                  <tr
                    key={author.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      {author.avatarUrl ? (
                        <img
                          src={author.avatarUrl}
                          alt={author.nameHe}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{author.nameHe}</p>
                      {author.nameEn && (
                        <p className="text-xs text-gray-400" dir="ltr">
                          {author.nameEn}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-600">
                        {author.roleHe || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-600" dir="ltr">
                        {author.email || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      {author.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" />
                          פעיל
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          לא פעיל
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(author)}
                          className="h-7 text-xs"
                        >
                          <Pencil className="h-3 w-3 ml-1" />
                          ערוך
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`למחוק את ${author.nameHe}?`)) {
                              deleteMutation.mutate(author.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
