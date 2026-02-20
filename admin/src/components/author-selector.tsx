'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Author } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { User } from 'lucide-react';

interface AuthorSelectorProps {
  value: string | undefined;
  onChange: (authorId: string | undefined) => void;
}

export function AuthorSelector({ value, onChange }: AuthorSelectorProps) {
  const { data: authors = [], isLoading } = useQuery({
    queryKey: ['authors-active'],
    queryFn: () => api.get<Author[]>('/authors?active=true'),
  });

  return (
    <div className="space-y-2">
      <Label>כתב/עורך</Label>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? 'טוען...' : 'בחר כתב/עורך'}
        </option>
        {authors.map((author) => (
          <option key={author.id} value={author.id}>
            {author.nameHe}
            {author.roleHe ? ` — ${author.roleHe}` : ''}
          </option>
        ))}
      </Select>

      {/* Preview of selected author */}
      {value && authors.length > 0 && (() => {
        const selected = authors.find((a) => a.id === value);
        if (!selected) return null;
        return (
          <div className="flex items-center gap-2 mt-1.5 p-2 bg-gray-50 rounded-md">
            {selected.avatarUrl ? (
              <img
                src={selected.avatarUrl}
                alt={selected.nameHe}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium">{selected.nameHe}</p>
              {selected.roleHe && (
                <p className="text-[10px] text-gray-500">{selected.roleHe}</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
