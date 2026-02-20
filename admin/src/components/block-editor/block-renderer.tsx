'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  GripVertical,
  Trash2,
  Bold,
  Italic,
  Link as LinkIcon,
  Plus,
  X,
  Search,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePicker } from '@/components/image-picker';
import { api, uploadFile } from '@/lib/api';
import { toast } from 'sonner';
import type {
  ContentBlock,
  ParagraphBlock,
  HeadingBlock,
  ImageBlock,
  YouTubeBlock,
  TweetBlock,
  QuoteBlock,
  BulletListBlock,
  ArticleLinkBlock,
  VideoBlock,
  Article,
  PaginatedResponse,
} from '@/lib/types';

// ── Block label mapping ──────────────────────────────────────────────────

const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
  paragraph: 'פסקה',
  heading: 'כותרת',
  image: 'תמונה',
  youtube: 'YouTube',
  tweet: 'X / Tweet',
  quote: 'ציטוט',
  divider: 'קו מפריד',
  bullet_list: 'רשימה',
  article_link: 'קישור לכתבה',
  video: 'וידאו',
};

// ── Props ────────────────────────────────────────────────────────────────

interface BlockRendererProps {
  block: ContentBlock;
  onChange: (updated: ContentBlock) => void;
  onDelete: () => void;
  /** Spread onto the drag handle element. Accepts dnd-kit listener props. */
  dragHandleProps?: Record<string, unknown>;
}

// ── Main Renderer ────────────────────────────────────────────────────────

export function BlockRenderer({ block, onChange, onDelete, dragHandleProps }: BlockRendererProps) {
  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          tabIndex={-1}
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-gray-400 select-none">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
          title="מחק בלוק"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block content */}
      <div className="p-4" dir="rtl">
        <BlockContent block={block} onChange={onChange} />
      </div>
    </div>
  );
}

// ── Content Switch ───────────────────────────────────────────────────────

function BlockContent({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphEditor block={block} onChange={onChange} />;
    case 'heading':
      return <HeadingEditor block={block} onChange={onChange} />;
    case 'image':
      return <ImageEditor block={block} onChange={onChange} />;
    case 'youtube':
      return <YouTubeEditor block={block} onChange={onChange} />;
    case 'tweet':
      return <TweetEditor block={block} onChange={onChange} />;
    case 'quote':
      return <QuoteEditor block={block} onChange={onChange} />;
    case 'divider':
      return <DividerDisplay />;
    case 'bullet_list':
      return <BulletListEditor block={block} onChange={onChange} />;
    case 'article_link':
      return <ArticleLinkEditor block={block} onChange={onChange} />;
    case 'video':
      return <VideoEditor block={block} onChange={onChange} />;
    default:
      return <div className="text-sm text-gray-400">בלוק לא מוכר</div>;
  }
}

// ── Paragraph (Mini TipTap) ──────────────────────────────────────────────

function ParagraphEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const handleUpdate = useCallback(
    (html: string) => {
      onChange({ ...block, text: html });
    },
    [block, onChange],
  );

  return <MiniTipTap content={block.text} onUpdate={handleUpdate} placeholder="התחל לכתוב..." />;
}

// ── Mini TipTap (reusable, bold/italic/link only) ────────────────────────

function MiniTipTap({
  content,
  onUpdate,
  placeholder,
}: {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-[60px] text-sm text-right focus:outline-none prose prose-sm max-w-none',
        dir: 'rtl',
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('קישור:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  return (
    <div className="space-y-2">
      {/* Mini toolbar */}
      <div className="flex items-center gap-1">
        <MiniToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </MiniToolbarBtn>
        <MiniToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </MiniToolbarBtn>
        <MiniToolbarBtn active={editor.isActive('link')} onClick={addLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </MiniToolbarBtn>
      </div>
      <div className="rounded-md border border-gray-200 px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function MiniToolbarBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1 rounded transition-colors',
        active ? 'bg-[#0099DB] text-white' : 'text-gray-500 hover:bg-gray-100',
      )}
    >
      {children}
    </button>
  );
}

// ── Heading ──────────────────────────────────────────────────────────────

function HeadingEditor({
  block,
  onChange,
}: {
  block: HeadingBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-gray-500">רמה:</Label>
        {([2, 3, 4] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange({ ...block, level: lvl })}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
              block.level === lvl
                ? 'bg-[#0099DB] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            H{lvl}
          </button>
        ))}
      </div>
      <Input
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="טקסט כותרת..."
        dir="rtl"
        className={cn(
          'font-bold',
          block.level === 2 && 'text-xl',
          block.level === 3 && 'text-lg',
          block.level === 4 && 'text-base',
        )}
      />
    </div>
  );
}

// ── Image ────────────────────────────────────────────────────────────────

function ImageEditor({
  block,
  onChange,
}: {
  block: ImageBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <ImagePicker
        value={block.url}
        onChange={(url) => onChange({ ...block, url })}
        label="תמונה"
      />
      {block.url && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">כיתוב (עברית)</Label>
            <Input
              value={block.captionHe || ''}
              onChange={(e) => onChange({ ...block, captionHe: e.target.value })}
              placeholder="כיתוב לתמונה..."
              dir="rtl"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">קרדיט</Label>
            <Input
              value={block.credit || ''}
              onChange={(e) => onChange({ ...block, credit: e.target.value })}
              placeholder="צלם / מקור..."
              dir="rtl"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-gray-500 mb-1 block">טקסט חלופי (alt)</Label>
            <Input
              value={block.altText || ''}
              onChange={(e) => onChange({ ...block, altText: e.target.value })}
              placeholder="תיאור התמונה לנגישות..."
              dir="rtl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── YouTube ──────────────────────────────────────────────────────────────

function extractYouTubeId(input: string): string {
  // Accept a bare video ID or a full URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

function YouTubeEditor({
  block,
  onChange,
}: {
  block: YouTubeBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const [rawInput, setRawInput] = useState(block.videoId || '');

  const handleBlur = () => {
    const videoId = extractYouTubeId(rawInput.trim());
    setRawInput(videoId);
    onChange({ ...block, videoId });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">קישור YouTube או מזהה סרטון</Label>
        <Input
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          onBlur={handleBlur}
          placeholder="https://www.youtube.com/watch?v=..."
          dir="ltr"
        />
      </div>
      {block.videoId && (
        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black">
          <img
            src={`https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">כיתוב</Label>
        <Input
          value={block.caption || ''}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="כיתוב לסרטון..."
          dir="rtl"
        />
      </div>
    </div>
  );
}

// ── Tweet ────────────────────────────────────────────────────────────────

function extractTweetId(input: string): string {
  const match = input.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  if (match) return match[1];
  // If it's already a numeric ID
  if (/^\d+$/.test(input.trim())) return input.trim();
  return input;
}

function TweetEditor({
  block,
  onChange,
}: {
  block: TweetBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const [rawInput, setRawInput] = useState(block.tweetId || '');

  const handleBlur = () => {
    const tweetId = extractTweetId(rawInput.trim());
    // Try to extract author handle from URL
    const handleMatch = rawInput.match(/(?:twitter\.com|x\.com)\/(\w+)\/status/);
    const authorHandle = handleMatch ? handleMatch[1] : block.authorHandle;
    setRawInput(tweetId);
    onChange({ ...block, tweetId, authorHandle });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">קישור X/Twitter או מזהה ציוץ</Label>
        <Input
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          onBlur={handleBlur}
          placeholder="https://x.com/user/status/123..."
          dir="ltr"
        />
      </div>
      {block.tweetId && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">@{block.authorHandle || '...'}</span>
          </div>
          <p className="text-xs text-gray-400">Tweet ID: {block.tweetId}</p>
        </div>
      )}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">כיתוב</Label>
        <Input
          value={block.caption || ''}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="כיתוב..."
          dir="rtl"
        />
      </div>
    </div>
  );
}

// ── Quote ────────────────────────────────────────────────────────────────

function QuoteEditor({
  block,
  onChange,
}: {
  block: QuoteBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  return (
    <div className="space-y-3 border-r-4 border-[#0099DB] pr-4">
      <Textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder={'"הכנס ציטוט כאן..."'}
        dir="rtl"
        className="font-serif text-lg italic"
        rows={3}
      />
      <Input
        value={block.attribution || ''}
        onChange={(e) => onChange({ ...block, attribution: e.target.value })}
        placeholder="מקור / שם המצטט"
        dir="rtl"
      />
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────

function DividerDisplay() {
  return (
    <div className="py-2">
      <hr className="border-t-2 border-gray-200" />
    </div>
  );
}

// ── Bullet List ──────────────────────────────────────────────────────────

function BulletListEditor({
  block,
  onChange,
}: {
  block: BulletListBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const handleItemChange = (index: number, value: string) => {
    const items = [...block.items];
    items[index] = value;
    onChange({ ...block, items });
  };

  const addItem = () => {
    onChange({ ...block, items: [...block.items, ''] });
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    const items = block.items.filter((_, i) => i !== index);
    onChange({ ...block, items });
  };

  return (
    <div className="space-y-2">
      {block.items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-gray-400 text-sm select-none">&#x2022;</span>
          <Input
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            placeholder={`פריט ${index + 1}...`}
            dir="rtl"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            disabled={block.items.length <= 1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addItem} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        הוסף פריט
      </Button>
    </div>
  );
}

// ── Article Link ─────────────────────────────────────────────────────────

function ArticleLinkEditor({
  block,
  onChange,
}: {
  block: ArticleLinkBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setResults([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await api.get<PaginatedResponse<Article>>(
            `/articles?search=${encodeURIComponent(q)}&limit=5`,
          );
          setResults(res.data);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [],
  );

  const selectArticle = (article: Article) => {
    onChange({
      ...block,
      linkedArticleId: article.id,
      linkedArticle: {
        title: article.title,
        heroImageUrl: article.heroImageUrl,
        slug: article.slug,
      },
    });
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-3">
      {/* Style selector */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-gray-500">תצוגה:</Label>
        {(['card', 'inline'] as const).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange({ ...block, displayStyle: style })}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
              block.displayStyle === style
                ? 'bg-[#0099DB] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {style === 'card' ? 'כרטיס' : 'שורה'}
          </button>
        ))}
      </div>

      {/* Selected article preview */}
      {block.linkedArticle ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {block.linkedArticle.heroImageUrl && (
            <img
              src={block.linkedArticle.heroImageUrl}
              alt=""
              className="h-12 w-16 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {block.linkedArticle.title}
            </p>
            <p className="text-xs text-gray-400">{block.linkedArticle.slug}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                linkedArticleId: '',
                linkedArticle: undefined,
              })
            }
            className="text-gray-400 hover:text-red-500 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="חפש כתבה..."
              dir="rtl"
              className="pr-9"
            />
          </div>
          {searching && <p className="text-xs text-gray-400">מחפש...</p>}
          {results.length > 0 && (
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {results.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => selectArticle(article)}
                  className="flex items-center gap-3 w-full p-2.5 text-right hover:bg-gray-50 transition-colors"
                  dir="rtl"
                >
                  {article.heroImageUrl && (
                    <img
                      src={article.heroImageUrl}
                      alt=""
                      className="h-10 w-14 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-sm text-gray-700 truncate">{article.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Video ─────────────────────────────────────────────────────────────────

function extractYouTubeVideoId(input: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

function VideoEditor({
  block,
  onChange,
}: {
  block: VideoBlock;
  onChange: (updated: ContentBlock) => void;
}) {
  const [rawInput, setRawInput] = useState(block.videoId || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleYouTubeBlur = () => {
    const videoId = extractYouTubeVideoId(rawInput.trim());
    setRawInput(videoId);
    onChange({
      ...block,
      videoId,
      thumbnailUrl: videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : undefined,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const mediaItem = await uploadFile(file);
      onChange({
        ...block,
        source: 'upload',
        url: mediaItem.url,
        mimeType: mediaItem.mimeType,
        thumbnailUrl: block.thumbnailUrl,
      });
    } catch {
      toast.error('שגיאה בהעלאת הסרטון');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveUpload = () => {
    onChange({ ...block, url: '', mimeType: undefined, thumbnailUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Source toggle */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-gray-500">מקור:</Label>
        {(['youtube', 'upload'] as const).map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => onChange({ ...block, source: src })}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
              block.source === src
                ? 'bg-[#0099DB] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {src === 'youtube' ? 'YouTube' : 'העלאה'}
          </button>
        ))}
      </div>

      {/* YouTube mode */}
      {block.source === 'youtube' && (
        <>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">קישור YouTube או מזהה סרטון</Label>
            <Input
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onBlur={handleYouTubeBlur}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
            />
          </div>
          {block.videoId && (
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black">
              <img
                src={`https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </>
      )}

      {/* Upload mode */}
      {block.source === 'upload' && (
        <>
          {block.url ? (
            <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-black">
              <video
                src={block.url}
                controls
                className="w-full max-h-[300px]"
              />
              <button
                type="button"
                onClick={handleRemoveUpload}
                className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors',
                uploading
                  ? 'border-gray-300 bg-gray-50 cursor-wait'
                  : 'border-gray-300 hover:border-[#0099DB] hover:bg-blue-50/30 cursor-pointer',
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">מעלה...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">בחר קובץ וידאו</span>
                </div>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {/* Caption & Credit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">כיתוב</Label>
          <Input
            value={block.caption || ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="כיתוב לסרטון..."
            dir="rtl"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">קרדיט</Label>
          <Input
            value={block.credit || ''}
            onChange={(e) => onChange({ ...block, credit: e.target.value })}
            placeholder="צלם / מקור..."
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}
