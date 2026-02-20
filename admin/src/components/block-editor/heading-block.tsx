'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeadingBlockEditorProps {
  text: string;
  level: 2 | 3 | 4;
  onChange: (text: string, level: 2 | 3 | 4) => void;
}

const HEADING_LEVELS: { value: 2 | 3 | 4; label: string }[] = [
  { value: 2, label: 'H2' },
  { value: 3, label: 'H3' },
  { value: 4, label: 'H4' },
];

export function HeadingBlockEditor({ text, level, onChange }: HeadingBlockEditorProps) {
  return (
    <div className="space-y-3">
      {/* Level toggle buttons */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 ml-2">רמה:</span>
        {HEADING_LEVELS.map((h) => (
          <button
            key={h.value}
            type="button"
            onClick={() => onChange(text, h.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-md transition-colors',
              level === h.value
                ? 'bg-[#0099DB] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Heading text input */}
      <Input
        value={text}
        onChange={(e) => onChange(e.target.value, level)}
        placeholder="טקסט כותרת..."
        dir="rtl"
        className={cn(
          'font-bold',
          level === 2 && 'text-xl',
          level === 3 && 'text-lg',
          level === 4 && 'text-base'
        )}
      />
    </div>
  );
}
