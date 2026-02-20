'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Type,
  Heading2,
  Image,
  Quote,
  Minus,
  List,
  Youtube,
  Twitter,
  Link2,
  Video,
} from 'lucide-react';
import type { ContentBlock } from '@/lib/types';
import {
  createEmptyParagraph,
  createEmptyHeading,
  createEmptyImage,
  createEmptyQuote,
  createDivider,
  createEmptyBulletList,
  createEmptyYouTube,
  createEmptyTweet,
  createEmptyArticleLink,
  createEmptyVideo,
} from './types';

interface AddBlockMenuProps {
  onAdd: (block: ContentBlock) => void;
}

interface BlockOption {
  label: string;
  icon: React.ReactNode;
  factory: () => ContentBlock;
}

const blockOptions: BlockOption[] = [
  { label: 'פסקה', icon: <Type className="h-4 w-4" />, factory: createEmptyParagraph },
  { label: 'כותרת', icon: <Heading2 className="h-4 w-4" />, factory: createEmptyHeading },
  { label: 'תמונה', icon: <Image className="h-4 w-4" />, factory: createEmptyImage },
  { label: 'ציטוט', icon: <Quote className="h-4 w-4" />, factory: createEmptyQuote },
  { label: 'קו מפריד', icon: <Minus className="h-4 w-4" />, factory: createDivider },
  { label: 'רשימה', icon: <List className="h-4 w-4" />, factory: createEmptyBulletList },
  { label: 'YouTube', icon: <Youtube className="h-4 w-4" />, factory: createEmptyYouTube },
  { label: 'וידאו', icon: <Video className="h-4 w-4" />, factory: createEmptyVideo },
  { label: 'X / Tweet', icon: <Twitter className="h-4 w-4" />, factory: createEmptyTweet },
  { label: 'קישור לכתבה', icon: <Link2 className="h-4 w-4" />, factory: createEmptyArticleLink },
];

export function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (factory: () => ContentBlock) => {
    onAdd(factory());
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#0099DB] hover:text-[#0099DB] transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">הוסף בלוק</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 z-50 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          {blockOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleSelect(option.factory)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right"
              dir="rtl"
            >
              <span className="text-gray-400">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
