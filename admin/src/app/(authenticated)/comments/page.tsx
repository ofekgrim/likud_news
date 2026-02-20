'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Comment, PaginatedResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CheckCircle,
  Trash2,
  Pin,
  MessageSquare,
  Clock,
  Filter,
} from 'lucide-react';

type ViewMode = 'pending' | 'all';

export default function CommentsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', viewMode],
    queryFn: () =>
      api.get<PaginatedResponse<Comment>>(
        viewMode === 'pending'
          ? '/comments?isApproved=false'
          : '/comments'
      ),
  });

  const approveMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.patch(`/comments/${commentId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('התגובה אושרה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.patch(`/comments/${id}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('התגובה עודכנה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('התגובה נמחקה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const comments = data?.data || [];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">ניהול תגובות</h1>
          {viewMode === 'pending' && comments.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {comments.length} ממתינות
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pending')}
          >
            <Clock className="h-4 w-4 ml-1.5" />
            ממתינות לאישור
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            <Filter className="h-4 w-4 ml-1.5" />
            כל התגובות
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg font-medium">
              {viewMode === 'pending'
                ? 'אין תגובות הממתינות לאישור'
                : 'אין תגובות במערכת'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              תגובות חדשות יופיעו כאן
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Comment header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {comment.authorName}
                      </span>
                      {comment.authorEmail && (
                        <span className="text-xs text-gray-400">
                          ({comment.authorEmail})
                        </span>
                      )}
                      {comment.isPinned && (
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          נעוצה
                        </span>
                      )}
                      {comment.isApproved ? (
                        <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          מאושרת
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          ממתינה
                        </span>
                      )}
                    </div>

                    {/* Article reference */}
                    {comment.article && (
                      <p className="text-xs text-gray-400 mb-2">
                        על הכתבה:{' '}
                        <a
                          href={`/articles/${comment.article.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                        >
                          {comment.article.title}
                        </a>
                      </p>
                    )}

                    {/* Comment body */}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {comment.body}
                    </p>

                    {/* Date */}
                    <p className="text-[11px] text-gray-400 mt-2">
                      {formatDate(comment.createdAt)}
                      {comment.likesCount > 0 && (
                        <span className="mr-3">
                          {comment.likesCount} לייקים
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!comment.isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate(comment.id)}
                        disabled={approveMutation.isPending}
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        title="אשר תגובה"
                      >
                        <CheckCircle className="h-3.5 w-3.5 ml-1" />
                        <span className="text-xs">אשר</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        pinMutation.mutate({
                          id: comment.id,
                          isPinned: !comment.isPinned,
                        })
                      }
                      disabled={pinMutation.isPending}
                      className={`h-8 text-xs ${
                        comment.isPinned
                          ? 'text-blue-600 bg-blue-50 border-blue-200'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={comment.isPinned ? 'בטל נעיצה' : 'נעץ תגובה'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('למחוק את התגובה?')) {
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      title="מחק תגובה"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
