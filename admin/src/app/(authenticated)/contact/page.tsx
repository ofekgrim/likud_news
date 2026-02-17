'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContactMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Mail, MailOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => api.get<{ data: ContactMessage[]; total: number }>('/contact'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/contact/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success('סומן כנקרא');
    },
  });

  function formatTimestamp(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">הודעות יצירת קשר</h1>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))
        ) : data?.data.length === 0 ? (
          <p className="text-gray-500">אין הודעות</p>
        ) : (
          data?.data.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border shadow-sm p-4 transition-colors ${
                !msg.isRead
                  ? 'bg-blue-50/50 border-[#0099DB] border-r-4'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="pt-0.5 shrink-0">
                    {!msg.isRead ? (
                      <Mail className="w-5 h-5 text-[#0099DB]" />
                    ) : (
                      <MailOpen className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{msg.name}</span>
                      <span className="text-gray-400 text-sm">{msg.email}</span>
                      {!msg.isRead && <Badge>חדש</Badge>}
                    </div>
                    <p className="font-medium text-sm mb-1">{msg.subject}</p>
                    <p className="text-gray-600 text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatTimestamp(msg.createdAt)}</p>
                  </div>
                </div>
                {!msg.isRead && (
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => markReadMutation.mutate(msg.id)}>
                    סמן כנקרא
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
