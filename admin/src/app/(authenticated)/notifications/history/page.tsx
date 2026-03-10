'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  contentType: string;
  status: string;
  totalTargeted: number;
  totalSent: number;
  totalFailed: number;
  totalOpened: number;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  template?: { name: string };
  sentBy?: { name: string };
  createdAt: string;
}

interface LogsResponse {
  data: NotificationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusLabels: Record<string, { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  pending: { text: 'ממתין', variant: 'warning' },
  sending: { text: 'שולח', variant: 'warning' },
  sent: { text: 'נשלח', variant: 'success' },
  failed: { text: 'נכשל', variant: 'destructive' },
  cancelled: { text: 'בוטל', variant: 'outline' },
};

const contentTypeLabels: Record<string, string> = {
  article: 'כתבה',
  poll: 'סקר',
  event: 'אירוע',
  election: 'בחירות',
  quiz: 'שאלון',
  custom: 'מותאם',
};

export default function NotificationHistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  if (statusFilter) params.set('status', statusFilter);
  if (contentTypeFilter) params.set('contentType', contentTypeFilter);
  if (search.trim()) params.set('search', search.trim());

  const { data, isLoading } = useQuery({
    queryKey: ['notification-logs', page, statusFilter, contentTypeFilter, search],
    queryFn: () => api.get<LogsResponse>(`/notifications/logs?${params.toString()}`),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/logs/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      toast.success('ההתראה בוטלה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function formatDate(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleString('he-IL');
  }

  return (
    <div dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notifications">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">היסטוריית התראות</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="חיפוש לפי כותרת..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.text}</option>
          ))}
        </select>
        <select
          value={contentTypeFilter}
          onChange={(e) => { setContentTypeFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">כל הסוגים</option>
          {Object.entries(contentTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">כותרת</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">סוג</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">סטטוס</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">יעד</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">נשלחו</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">נפתחו</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-32">תאריך</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-16">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !data?.data?.length ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      אין התראות בהיסטוריה
                    </td>
                  </tr>
                ) : (
                  data.data.map((log) => {
                    const si = statusLabels[log.status] || { text: log.status, variant: 'outline' as const };
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{log.title}</p>
                            {log.template && (
                              <p className="text-xs text-gray-400">{log.template.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {contentTypeLabels[log.contentType] || log.contentType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={si.variant}>{si.text}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{log.totalTargeted}</td>
                        <td className="px-4 py-3 text-gray-600">{log.totalSent}</td>
                        <td className="px-4 py-3 text-gray-600">{log.totalOpened}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatDate(log.sentAt || log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(log.id)}
                              className="text-red-500"
                              title="ביטול"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            הקודם
          </Button>
          <span className="text-sm text-gray-500">
            עמוד {data.page} מתוך {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            הבא
          </Button>
        </div>
      )}
    </div>
  );
}
