'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '@/lib/api';
import type { MediaItem, PaginatedResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Copy,
  Trash2,
  UploadCloud,
  Search,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const TYPE_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'image', label: 'תמונות' },
  { value: 'video', label: 'וידאו' },
  { value: 'audio', label: 'אודיו' },
  { value: 'document', label: 'מסמכים' },
] as const;

function getTypeBadgeStyle(type: string) {
  switch (type) {
    case 'image': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'video': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'audio': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'video': return Film;
    case 'audio': return Music;
    case 'document': return FileText;
    default: return ImageIcon;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['media', page],
    queryFn: () =>
      api.get<PaginatedResponse<MediaItem>>(`/media?page=${page}&limit=24`),
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
        successCount++;
      }
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success(
        successCount === 1
          ? 'הקובץ הועלה בהצלחה'
          : `${successCount} קבצים הועלו בהצלחה`
      );
    } catch {
      toast.error('שגיאה בהעלאת קבצים');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success('הקישור הועתק');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side filtering (type + search)
  const filteredMedia = (data?.data ?? []).filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ספריית מדיה</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ?? 0} קבצים בספרייה
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-[#0099DB] hover:bg-[#0088C4] text-white"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4 ml-2" />
          )}
          {uploading ? 'מעלה...' : 'העלאת קבצים'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                typeFilter === filter.value
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם קובץ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <ImageIcon className="w-16 h-16 mb-4 stroke-1" />
          <p className="text-lg font-medium text-gray-500 mb-1">
            {searchQuery || typeFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין קבצים בספרייה'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {searchQuery || typeFilter !== 'all'
              ? 'נסה לשנות את מסנני החיפוש'
              : 'לחץ על "העלאת קבצים" כדי להתחיל'}
          </p>
          {!searchQuery && typeFilter === 'all' && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <UploadCloud className="h-4 w-4 ml-2" />
              העלה קובץ ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative bg-gray-50">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.altText || item.filename}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <TypeIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title="העתק קישור"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title="פתח בחלון חדש"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="מחיקה"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`text-[10px] border ${getTypeBadgeStyle(item.type)}`}>
                      {item.type}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p
                    className="text-xs font-medium text-gray-900 truncate"
                    dir="ltr"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500">
                      {formatFileSize(item.size)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  {item.width && item.height && (
                    <span className="text-[10px] text-gray-400">
                      {item.width} x {item.height}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            הקודם
          </Button>
          <span className="text-sm text-gray-600">
            עמוד {data.page} מתוך {data.totalPages} ({data.total} קבצים)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.totalPages}
          >
            הבא
          </Button>
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
