'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Article } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Play, Pencil } from 'lucide-react';

export default function VideosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch video articles
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['video-articles'],
    queryFn: () => api.get<{ data: Article[] }>('/articles?category=video&limit=100'),
  });
  const videos = videosData?.data ?? (Array.isArray(videosData) ? videosData : []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-articles'] });
      toast.success('הוידאו נמחק');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(article: Article) {
    if (confirm(`למחוק את הוידאו "${article.title}"?`)) {
      deleteMutation.mutate(article.id);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">וידאו</h1>
        <Button onClick={() => router.push('/videos/new')}>וידאו חדש +</Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תצוגה</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium">קטגוריה</th>
              <th className="text-right px-4 py-3 font-medium">צפיות</th>
              <th className="text-right px-4 py-3 font-medium">תאריך</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : (videos as Article[]).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  אין וידאו. צור וידאו חדש כדי להתחיל.
                </td>
              </tr>
            ) : (
              (videos as Article[]).map((video) => (
                <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2">
                    {video.heroImageUrl ? (
                      <div className="relative w-12 h-8 rounded overflow-hidden border">
                        <img
                          src={video.heroImageUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Play className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{video.title}</td>
                  <td className="px-4 py-3.5 text-gray-500">{video.category?.name ?? '---'}</td>
                  <td className="px-4 py-3.5 text-gray-500">{video.viewCount ?? 0}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {video.createdAt
                      ? new Date(video.createdAt).toLocaleDateString('he-IL', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '---'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/videos/${video.id}/edit`)}
                        className="text-[#0099DB] hover:text-[#007ab8] hover:border-[#0099DB]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(video)}
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
    </div>
  );
}
