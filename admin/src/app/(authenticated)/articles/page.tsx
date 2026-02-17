'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Article, PaginatedResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  draft: 'טיוטה',
  published: 'פורסם',
  archived: 'ארכיון',
};

const statusVariants: Record<string, 'warning' | 'success' | 'outline'> = {
  draft: 'warning',
  published: 'success',
  archived: 'outline',
};

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', page, search],
    queryFn: () =>
      api.get<PaginatedResponse<Article>>(
        `/articles?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('הכתבה נמחקה');
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">כתבות</h1>
        <Link href="/articles/new">
          <Button>
            <Plus className="h-4 w-4 ml-1" />
            כתבה חדשה
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש כתבות..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium text-gray-500">כותרת</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">קטגוריה</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">צפיות</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">תאריך</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-1">אין כתבות</p>
                  <p className="text-sm">צור כתבה חדשה כדי להתחיל</p>
                </td>
              </tr>
            ) : (
              data?.data.map((article, i) => (
                <tr key={article.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{article.title}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{article.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant={statusVariants[article.status]}>
                        {statusLabels[article.status]}
                      </Badge>
                      {article.isHero && <Badge variant="secondary">ראשי</Badge>}
                      {article.isBreaking && <Badge variant="destructive">מבזק</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {article.category?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {article.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {article.publishedAt ? formatDate(article.publishedAt) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/articles/${article.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(article.id)}
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

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              עמוד {data.page} מתוך {data.totalPages} ({data.total} כתבות)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                הקודם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
              >
                הבא
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="מחיקת כתבה"
        description="האם למחוק את הכתבה? פעולה זו אינה הפיכה."
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
