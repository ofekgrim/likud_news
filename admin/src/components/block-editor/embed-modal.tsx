'use client';

import { useState, useEffect } from 'react';
import { Youtube, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { YouTubeBlock, TweetBlock } from '@/lib/types';

// ── YouTube URL parsing ─────────────────────────────────────────────────────

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

// ── Twitter/X URL parsing ───────────────────────────────────────────────────

function extractTweetInfo(url: string): { tweetId: string; authorHandle: string } | null {
  if (!url) return null;

  // twitter.com/user/status/TWEET_ID or x.com/user/status/TWEET_ID
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
  if (match) {
    return {
      authorHandle: match[1],
      tweetId: match[2],
    };
  }

  return null;
}

// ── YouTubeBlockEditor ──────────────────────────────────────────────────────

interface YouTubeBlockEditorProps {
  block: YouTubeBlock;
  onChange: (block: YouTubeBlock) => void;
}

export function YouTubeBlockEditor({ block, onChange }: YouTubeBlockEditorProps) {
  const [urlInput, setUrlInput] = useState('');

  // Reconstruct URL from existing videoId on first mount
  useEffect(() => {
    if (block.videoId && !urlInput) {
      setUrlInput(`https://youtube.com/watch?v=${block.videoId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      onChange({ ...block, videoId, caption: block.caption, credit: block.credit });
    }
  };

  const thumbnailUrl = block.videoId
    ? `https://img.youtube.com/vi/${block.videoId}/maxresdefault.jpg`
    : null;

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div>
        <Label className="mb-1.5 block">קישור YouTube</Label>
        <div className="relative">
          <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          <Input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            dir="ltr"
            className="pr-10"
          />
        </div>
        {urlInput && !block.videoId && (
          <p className="text-xs text-red-500 mt-1">לא ניתן לזהות מזהה וידאו מהקישור</p>
        )}
      </div>

      {/* Thumbnail preview */}
      {thumbnailUrl && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
          <img
            src={thumbnailUrl}
            alt="YouTube thumbnail"
            className="w-full max-h-[200px] object-contain"
            onError={(e) => {
              // Fall back to hqdefault if maxresdefault doesn't exist
              const img = e.currentTarget;
              if (img.src.includes('maxresdefault')) {
                img.src = `https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`;
              }
            }}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-red-600 rounded-xl px-4 py-2.5 flex items-center gap-1.5 shadow-lg">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Metadata fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block">כיתוב</Label>
          <Input
            value={block.caption || ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="כיתוב לסרטון..."
            dir="rtl"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">קרדיט</Label>
          <Input
            value={block.credit || ''}
            onChange={(e) => onChange({ ...block, credit: e.target.value })}
            placeholder="מקור הסרטון..."
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

// ── TweetBlockEditor ────────────────────────────────────────────────────────

interface TweetBlockEditorProps {
  block: TweetBlock;
  onChange: (block: TweetBlock) => void;
}

export function TweetBlockEditor({ block, onChange }: TweetBlockEditorProps) {
  const [urlInput, setUrlInput] = useState('');

  // Reconstruct URL from existing tweetId on first mount
  useEffect(() => {
    if (block.tweetId && block.authorHandle && !urlInput) {
      setUrlInput(`https://x.com/${block.authorHandle}/status/${block.tweetId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    const info = extractTweetInfo(url);
    if (info) {
      onChange({
        ...block,
        tweetId: info.tweetId,
        authorHandle: info.authorHandle,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div>
        <Label className="mb-1.5 block">קישור Twitter/X</Label>
        <div className="relative">
          <Twitter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://x.com/user/status/..."
            dir="ltr"
            className="pr-10"
          />
        </div>
        {urlInput && !block.tweetId && (
          <p className="text-xs text-red-500 mt-1">לא ניתן לזהות ציוץ מהקישור</p>
        )}
      </div>

      {/* Tweet preview card */}
      {block.tweetId && block.authorHandle && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center',
              'text-gray-500 text-sm font-bold'
            )}>
              {block.authorHandle.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                @{block.authorHandle}
              </p>
              <p className="text-xs text-gray-500">
                Twitter / X
              </p>
            </div>
            <svg className="h-5 w-5 text-gray-400 mr-auto" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-400">
              Tweet ID: {block.tweetId}
            </p>
            {block.previewText && (
              <p className="text-sm text-gray-700 mt-1" dir="auto">
                {block.previewText}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Optional caption */}
      {block.tweetId && (
        <div>
          <Label className="mb-1.5 block">כיתוב (אופציונלי)</Label>
          <Input
            value={block.caption || ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="כיתוב לציוץ..."
            dir="rtl"
          />
        </div>
      )}
    </div>
  );
}
