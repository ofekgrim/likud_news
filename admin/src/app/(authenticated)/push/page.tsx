'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: { articleSlug?: string; type?: string };
}

export default function PushPage() {
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '', articleSlug: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (payload: PushPayload) => api.post('/push/send', payload),
    onSuccess: () => {
      toast.success('ההתראה נשלחה בהצלחה');
      setForm({ title: '', body: '', imageUrl: '', articleSlug: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'שגיאה בשליחת ההתראה');
    },
  });

  function handleSend() {
    const payload: PushPayload = {
      title: form.title,
      body: form.body,
    };
    if (form.imageUrl.trim()) {
      payload.imageUrl = form.imageUrl.trim();
    }
    if (form.articleSlug.trim()) {
      payload.data = { articleSlug: form.articleSlug.trim(), type: 'article' };
    }
    sendMutation.mutate(payload);
    setConfirmOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">שליחת התראה</h1>
      </div>

      {/* Warning banner */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6 max-w-2xl">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
        <p className="text-sm text-yellow-800 font-medium">ההתראה תישלח לכל המשתמשים הרשומים</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="כותרת ההתראה..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תוכן ההתראה</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="תוכן ההתראה..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>קישור לתמונה</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label>Slug של כתבה (אופציונלי)</Label>
            <Input
              value={form.articleSlug}
              onChange={(e) => setForm({ ...form, articleSlug: e.target.value })}
              placeholder="article-slug"
              dir="ltr"
            />
            <p className="text-xs text-gray-500">אם מוגדר, לחיצה על ההתראה תפתח את הכתבה</p>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={sendMutation.isPending}>
              <Bell className="w-4 h-4 ml-2" />
              שלח התראה
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
        title="שליחת התראה"
        description="ההתראה תישלח לכל המכשירים הרשומים. פעולה זו אינה הפיכה."
        confirmLabel="שלח"
        variant="default"
        loading={sendMutation.isPending}
      />
    </div>
  );
}
