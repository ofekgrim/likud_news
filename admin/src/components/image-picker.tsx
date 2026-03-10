'use client';

import { useState, useRef } from 'react';
import { Upload, X, FolderOpen, Check, Loader2 } from 'lucide-react';
import { api, uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MediaItem, PaginatedResponse } from '@/lib/types';

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImagePicker({ value, onChange, label = 'תמונה', className }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const mediaItem = await uploadFile(file);
      onChange(mediaItem.url);
    } catch {
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLibrarySelect = (url: string) => {
    onChange(url);
    setLibraryOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {value ? (
        <div className="relative inline-block group">
          <div className="relative w-[200px] h-[130px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed transition-colors',
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-wait'
                : 'border-gray-300 hover:border-[#0099DB] hover:bg-blue-50/30 cursor-pointer'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">מעלה...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="h-6 w-6" />
                <span className="text-sm">בחר תמונה</span>
              </div>
            )}
          </button>

          {/* Browse Library Button */}
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[#0099DB] hover:bg-blue-50/50 rounded-lg border border-gray-200 transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            בחר מספריית מדיה
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
}

// ── Media Library Modal ──────────────────────────────────────────────────

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

function MediaLibraryModal({ open, onClose, onSelect }: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchMedia = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<MediaItem>>(
        `/media?page=${p}&limit=18`
      );
      setMedia(res.data);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
      toast.error('שגיאה בטעינת ספריית מדיה');
    } finally {
      setLoading(false);
    }
  };

  // Load media when modal opens
  if (open && !loaded) {
    setLoaded(true);
    fetchMedia(1);
  }

  // Reset when modal closes
  if (!open && loaded) {
    setLoaded(false);
    setSelectedUrl(null);
    setSearchQuery('');
  }

  const filteredMedia = media.filter((item) => {
    if (item.type !== 'image') return false;
    if (!searchQuery) return true;
    return item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl">
      <DialogTitle>בחר תמונה מהספרייה</DialogTitle>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="חיפוש לפי שם קובץ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">לא נמצאו תמונות</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
          {filteredMedia.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedUrl(item.url)}
              className={cn(
                'aspect-square rounded-md overflow-hidden border-2 transition-all relative',
                selectedUrl === item.url
                  ? 'border-[#0099DB] ring-2 ring-[#0099DB]/30'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <img
                src={item.url}
                alt={item.altText || item.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selectedUrl === item.url && (
                <div className="absolute inset-0 bg-[#0099DB]/20 flex items-center justify-center">
                  <div className="bg-[#0099DB] rounded-full p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMedia(page - 1)}
            disabled={page <= 1 || loading}
          >
            הקודם
          </Button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMedia(page + 1)}
            disabled={page >= totalPages || loading}
          >
            הבא
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          ביטול
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedUrl}
          className="bg-[#0099DB] hover:bg-[#0088C4] text-white"
        >
          בחר תמונה
        </Button>
      </div>
    </Dialog>
  );
}
