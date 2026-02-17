'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  nameEn: '',
  title: '',
  titleEn: '',
  bio: '',
  photoUrl: '',
  socialTwitter: '',
  socialFacebook: '',
  socialInstagram: '',
  isActive: true,
  sortOrder: 0,
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/members', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('החבר נוצר');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof form & { id: string }) => api.put(`/members/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('החבר עודכן');
      closeDialog();
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({
      name: member.name,
      nameEn: member.nameEn || '',
      title: member.title || '',
      titleEn: member.titleEn || '',
      bio: member.bio || '',
      photoUrl: member.photoUrl || '',
      socialTwitter: member.socialTwitter || '',
      socialFacebook: member.socialFacebook || '',
      socialInstagram: member.socialInstagram || '',
      isActive: member.isActive,
      sortOrder: member.sortOrder,
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

  function getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">חברי כנסת</h1>
        <Button onClick={openCreate}>חבר חדש +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">תמונה</th>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">תפקיד</th>
              <th className="text-right px-4 py-3 font-medium">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium">סדר</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">טוען...</td></tr>
            ) : (
              members?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-semibold text-sm">
                        {getInitial(member.name)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{member.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{member.title || '-'}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={member.isActive ? 'success' : 'outline'}>
                      {member.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{member.sortOrder}</td>
                  <td className="px-4 py-3.5">
                    <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                      עריכה
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} className="max-w-2xl">
        <DialogTitle>{editing ? 'עריכת חבר' : 'חבר חדש'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>שם באנגלית</Label>
              <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תפקיד</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>תפקיד באנגלית</Label>
              <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ביוגרפיה</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>קישור תמונה</Label>
            <Input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} dir="ltr" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input value={form.socialTwitter} onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })} dir="ltr" placeholder="@handle" />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={form.socialFacebook} onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })} dir="ltr" placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.socialInstagram} onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })} dir="ltr" placeholder="@handle" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
              />
              <Label htmlFor="isActive">פעיל</Label>
            </div>
            <div className="space-y-2">
              <Label>סדר</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <Button type="submit">{editing ? 'עדכן' : 'צור'}</Button>
            <Button type="button" variant="outline" onClick={closeDialog}>ביטול</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
