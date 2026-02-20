'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Tag } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { nameHe: string; slug: string }) =>
      api.post<Tag>('/tags', data),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onChange([...selectedIds, newTag.id]);
      setNewTagName('');
      setNewTagSlug('');
      setShowCreate(false);
      toast.success('תגית נוצרה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));
  const filteredTags = tags.filter(
    (t) =>
      !selectedIds.includes(t.id) &&
      t.nameHe.toLowerCase().includes(search.toLowerCase())
  );

  function handleRemove(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  function handleAdd(id: string) {
    onChange([...selectedIds, id]);
    setSearch('');
  }

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    const slug =
      newTagSlug.trim() ||
      newTagName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    createMutation.mutate({ nameHe: newTagName.trim(), slug });
  }

  return (
    <div className="space-y-2">
      <Label>תגיות</Label>

      {/* Selected chips */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200"
            >
              {tag.nameHe}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span>הוסף תגית...</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חפש תגית..."
                  className="pr-8 h-8 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Tag list */}
            <div className="max-h-40 overflow-y-auto p-1">
              {filteredTags.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  לא נמצאו תגיות
                </p>
              )}
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAdd(tag.id)}
                  className="w-full text-right px-3 py-1.5 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  {tag.nameHe}
                  {tag.tagType && (
                    <span className="text-gray-400 text-xs mr-2">
                      ({tag.tagType === 'topic'
                        ? 'נושא'
                        : tag.tagType === 'person'
                        ? 'אדם'
                        : 'מיקום'})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Create new tag */}
            <div className="border-t border-gray-100 p-2">
              {!showCreate ? (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 text-sm text-[#0099DB] hover:text-[#0077b3] transition-colors w-full px-2 py-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>צור תגית חדשה</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="שם התגית (עברית)"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={newTagSlug}
                    onChange={(e) => setNewTagSlug(e.target.value)}
                    placeholder="Slug (אוטומטי אם ריק)"
                    dir="ltr"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={createMutation.isPending || !newTagName.trim()}
                      className="h-7 text-xs"
                    >
                      {createMutation.isPending ? 'יוצר...' : 'צור'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreate(false);
                        setNewTagName('');
                        setNewTagSlug('');
                      }}
                      className="h-7 text-xs"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
