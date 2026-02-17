'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '@/lib/api';
import type { MediaItem, PaginatedResponse } from '@/lib/types';
import { formatFileSize } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Copy, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  document: '📄',
};

export default function MediaPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', page],
    queryFn: () =>
      api.get<PaginatedResponse<MediaItem>>(`/media?page=${page}&limit=20`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('הקובץ נמחק');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('שגיאה במחיקת הקובץ');
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadFile(file);
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('הקובץ הועלה בהצלחה');
    } catch {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('הקישור הועתק');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ספריית מדיה</h1>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              מעלה...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              העלאת קובץ
            </span>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">טוען...</div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <UploadCloud className="w-16 h-16 mb-4 stroke-1" />
          <p className="text-lg font-medium text-gray-500 mb-1">אין קבצים בספרייה</p>
          <p className="text-sm text-gray-400">לחץ על &quot;העלאת קובץ&quot; כדי להתחיל</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="aspect-square relative bg-gray-100">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.altText || item.filename}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-4xl">
                      {typeIcons[item.type] || '📄'}
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url)}
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    title="העתק קישור"
                  >
                    <Copy className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    title="מחיקה"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p
                  className="text-sm font-medium truncate"
                  title={item.filename}
                >
                  {item.filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(item.size)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-500">
            עמוד {data.page} מתוך {data.totalPages} ({data.total} קבצים)
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="מחיקת קובץ"
        description={`האם למחוק את "${deleteTarget?.filename}"? פעולה זו אינה הפיכה.`}
        confirmLabel="מחיקה"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
