'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, X, LayoutGrid, AlignJustify } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArticleLinkBlock, Article, PaginatedResponse } from '@/lib/types';

interface ArticleLinkBlockEditorProps {
  block: ArticleLinkBlock;
  onChange: (block: ArticleLinkBlock) => void;
}

export function ArticleLinkBlockEditor({ block, onChange }: ArticleLinkBlockEditorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchArticles = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Article>>(
        `/articles?search=${encodeURIComponent(searchQuery)}&limit=10`
      );
      setResults(response.data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchArticles(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchArticles]);

  // Click outside to close results
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectArticle = (article: Article) => {
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
    setShowResults(false);
  };

  const handleRemoveArticle = () => {
    onChange({
      ...block,
      linkedArticleId: '',
      linkedArticle: undefined,
    });
  };

  const toggleDisplayStyle = (style: 'card' | 'inline') => {
    onChange({ ...block, displayStyle: style });
  };

  return (
    <div className="space-y-4">
      {/* Selected article display */}
      {block.linkedArticleId && block.linkedArticle ? (
        <div className="rounded-lg border border-[#0099DB]/30 bg-blue-50/30 p-3">
          <div className="flex items-start gap-3">
            {block.linkedArticle.heroImageUrl && (
              <img
                src={block.linkedArticle.heroImageUrl}
                alt=""
                className="w-16 h-12 object-cover rounded-md flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" dir="rtl">
                {block.linkedArticle.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                /{block.linkedArticle.slug}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveArticle}
              className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Search input */
        <div ref={containerRef} className="relative">
          <Label className="mb-1.5 block">חיפוש כתבה</Label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
              placeholder="הקלד לחיפוש כתבה..."
              dir="rtl"
              className="pr-10"
            />
          </div>

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 border-2 border-gray-300 border-t-[#0099DB] rounded-full animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  לא נמצאו תוצאות
                </div>
              ) : (
                results.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleSelectArticle(article)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {article.heroImageUrl ? (
                      <img
                        src={article.heroImageUrl}
                        alt=""
                        className="w-10 h-7 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {article.title}
                      </p>
                      {article.category && (
                        <p className="text-xs text-gray-500">
                          {article.category.name}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Display style toggle */}
      <div>
        <Label className="mb-1.5 block">סגנון תצוגה</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={block.displayStyle === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleDisplayStyle('card')}
            className={cn(
              'flex items-center gap-1.5',
              block.displayStyle === 'card' && 'bg-[#0099DB] hover:bg-[#0088c4]'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            כרטיס
          </Button>
          <Button
            type="button"
            variant={block.displayStyle === 'inline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleDisplayStyle('inline')}
            className={cn(
              'flex items-center gap-1.5',
              block.displayStyle === 'inline' && 'bg-[#0099DB] hover:bg-[#0088c4]'
            )}
          >
            <AlignJustify className="h-3.5 w-3.5" />
            שורה
          </Button>
        </div>
      </div>
    </div>
  );
}
