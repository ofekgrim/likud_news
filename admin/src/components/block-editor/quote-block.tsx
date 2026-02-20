'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuoteBlockEditorProps {
  text: string;
  attribution: string;
  onChange: (text: string, attribution: string) => void;
}

export function QuoteBlockEditor({ text, attribution, onChange }: QuoteBlockEditorProps) {
  return (
    <div className="space-y-3">
      {/* Quote text with styled border */}
      <div>
        <Label className="mb-1.5 block">ציטוט</Label>
        <div className="border-r-4 border-[#0099DB] pr-3">
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value, attribution)}
            placeholder="הזן את טקסט הציטוט..."
            dir="rtl"
            rows={3}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm italic leading-relaxed placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0099DB] disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"
          />
        </div>
      </div>

      {/* Attribution */}
      <div>
        <Label className="mb-1.5 block">ייחוס</Label>
        <Input
          value={attribution}
          onChange={(e) => onChange(text, e.target.value)}
          placeholder="— שם המצוטט"
          dir="rtl"
        />
      </div>
    </div>
  );
}
