'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TickerItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface TickerForm {
  text: string;
  position: number;
  linkUrl: string;
  isActive: boolean;
  expiresAt: string;
}

const emptyForm: TickerForm = { text: '', position: 0, linkUrl: '', isActive: true, expiresAt: '' };

export default function TickerPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TickerItem | null>(null);
  const [form, setForm] = useState<TickerForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TickerItem | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['ticker'],
    queryFn: () => api.get<TickerItem[]>('/ticker'),
  });

  const createMutation = useMutation({
    mutationFn: (data: TickerForm) => {
      const payload: Record<string, unknown> = {
        text: data.text,
        position: data.position,
        isActive: data.isActive,
      };
      if (data.linkUrl.trim()) payload.linkUrl = data.linkUrl.trim();
      if (data.expiresAt) payload.expiresAt = data.expiresAt;
      return api.post('/ticker', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticker'] });
      toast.success('פריט טיקר נוצר');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה ביצירת פריט טיקר');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: TickerForm & { id: string }) => {
      const payload: Record<string, unknown> = {
        text: data.text,
        position: data.position,
        isActive: data.isActive,
      };
      if (data.linkUrl.trim()) payload.linkUrl = data.linkUrl.trim();
      else payload.linkUrl = null;
      if (data.expiresAt) payload.expiresAt = data.expiresAt;
      else payload.expiresAt = null;
      return api.put(`/ticker/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticker'] });
      toast.success('פריט טיקר עודכן');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה בעדכון פריט טיקר');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ticker/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticker'] });
      toast.success('פריט טיקר נמחק');
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה במחיקת פריט טיקר');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: TickerItem) {
    setEditing(item);
    setForm({
      text: item.text,
      position: item.position,
      linkUrl: item.linkUrl || '',
      isActive: item.isActive,
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 16) : '',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">טיקר חדשות</h1>
        <Button onClick={openCreate}>פריט חדש +</Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-gray-500">טוען...</p>
        ) : items?.length === 0 ? (
          <p className="text-gray-500">אין פריטי טיקר</p>
        ) : (
          items?.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border shadow-sm p-4 flex items-center justify-between transition-colors hover:bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                  {item.position}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="font-medium">{item.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.linkUrl && (
                    <span className="text-xs text-gray-400" dir="ltr">{item.linkUrl}</span>
                  )}
                  {item.expiresAt && (
                    <span className="text-xs text-gray-400">
                      תפוגה: {new Date(item.expiresAt).toLocaleString('he-IL')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                  עריכה
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                >
                  מחיקה
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{editing ? 'עריכת פריט טיקר' : 'פריט טיקר חדש'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>טקסט</Label>
            <Input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="טקסט הטיקר..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>מיקום</Label>
            <Input
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>קישור</Label>
            <Input
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>תפוגה</Label>
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
            />
            <Label htmlFor="isActive">פעיל</Label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'עדכן' : 'צור'}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>ביטול</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="מחיקת פריט טיקר"
        description={`האם למחוק את פריט הטיקר "${deleteTarget?.text}"?`}
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
