'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ROLE_LABELS: Record<User['role'], string> = {
  super_admin: 'מנהל ראשי',
  admin: 'מנהל',
  editor: 'עורך',
};

const ROLE_BADGE_VARIANTS: Record<User['role'], 'destructive' | 'default' | 'outline'> = {
  super_admin: 'destructive',
  admin: 'default',
  editor: 'outline',
};

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: User['role'];
}

const EMPTY_FORM: UserForm = { name: '', email: '', password: '', role: 'editor' };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserForm) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש נוצר בהצלחה');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה ביצירת המשתמש');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<UserForm> & { id: string }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('המשתמש עודכן בהצלחה');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה בעדכון המשתמש');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const payload: Partial<UserForm> & { id: string } = {
        id: editing.id,
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) {
        payload.password = form.password;
      }
      updateMutation.mutate(payload);
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
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <Button onClick={openCreate}>משתמש חדש +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">אימייל</th>
              <th className="text-right px-4 py-3 font-medium">תפקיד</th>
              <th className="text-right px-4 py-3 font-medium">תאריך יצירה</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">טוען...</td></tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {getInitial(user.name)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500" dir="ltr">{user.email}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-4 py-3.5">
                    <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                      עריכה
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת משתמש' : 'משתמש חדש'}</DialogTitle>
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
            <Label>אימייל</Label>
            <Input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>סיסמה</Label>
            <Input
              type="password"
              dir="ltr"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
              placeholder={editing ? 'השאר ריק לשמירת הסיסמה הנוכחית' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label>תפקיד</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}
            >
              <option value="super_admin">{ROLE_LABELS.super_admin}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
              <option value="editor">{ROLE_LABELS.editor}</option>
            </Select>
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
