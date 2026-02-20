'use client';

import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Loader2, ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ImageBlock } from '@/lib/types';

interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
}

type UploadMode = 'upload' | 'url';

export function ImageBlockEditor({ block, onChange }: ImageBlockEditorProps) {
  const [mode, setMode] = useState<UploadMode>(block.url ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(block.url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const mediaItem = await uploadFile(file);
      onChange({ ...block, url: mediaItem.url });
    } catch {
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlConfirm = () => {
    if (urlInput.trim()) {
      onChange({ ...block, url: urlInput.trim() });
    }
  };

  const updateField = (field: keyof ImageBlock, value: string) => {
    onChange({ ...block, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors',
            mode === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          העלאה
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors',
            mode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          קישור
        </button>
      </div>

      {/* Upload / URL input area */}
      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!block.url && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors',
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
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm">בחר תמונה להעלאה</span>
                </div>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1.5 block">קישור לתמונה</Label>
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUrlConfirm();
              }}
            />
          </div>
          <Button size="sm" onClick={handleUrlConfirm} disabled={!urlInput.trim()}>
            אישור
          </Button>
        </div>
      )}

      {/* Image preview */}
      {block.url && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={block.url}
              alt={block.altText || 'תצוגה מקדימה'}
              className="w-full max-h-[240px] object-contain"
            />
            <button
              type="button"
              onClick={() => {
                onChange({ ...block, url: '' });
                setUrlInput('');
              }}
              className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors text-xs px-2 py-0.5"
            >
              הסר
            </button>
          </div>

          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">קרדיט (צלם/מקור)</Label>
              <Input
                value={block.credit || ''}
                onChange={(e) => updateField('credit', e.target.value)}
                placeholder="צלם: ישראל ישראלי"
                dir="rtl"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">כיתוב</Label>
              <Input
                value={block.captionHe || ''}
                onChange={(e) => updateField('captionHe', e.target.value)}
                placeholder="כיתוב לתמונה..."
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">טקסט חלופי (Alt Text)</Label>
            <Input
              value={block.altText || ''}
              onChange={(e) => updateField('altText', e.target.value)}
              placeholder="תיאור התמונה לנגישות"
              dir="rtl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
