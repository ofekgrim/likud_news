'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ArticleAiSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Brain,
  Zap,
  FileText,
  BarChart3,
} from 'lucide-react';

export default function AiSummariesPage() {
  const queryClient = useQueryClient();
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(
    null
  );

  // ── Fetch summaries ──
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['ai-summaries'],
    queryFn: () => api.get<ArticleAiSummary[]>('/ai/summarize/all'),
  });

  // ── Regenerate summary ──
  const regenerateMutation = useMutation({
    mutationFn: (articleId: string) =>
      api.post<ArticleAiSummary>(`/ai/summarize/${articleId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-summaries'] });
      toast.success('הסיכום נוצר מחדש בהצלחה');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה ביצירת סיכום מחדש'),
  });

  // ── Stats ──
  const stats = useMemo(() => {
    if (summaries.length === 0) {
      return {
        total: 0,
        avgTokens: 0,
        modelDistribution: {} as Record<string, number>,
      };
    }
    const totalTokens = summaries.reduce((sum, s) => sum + s.tokensUsed, 0);
    const modelDistribution: Record<string, number> = {};
    for (const s of summaries) {
      modelDistribution[s.modelUsed] =
        (modelDistribution[s.modelUsed] || 0) + 1;
    }
    return {
      total: summaries.length,
      avgTokens: Math.round(totalTokens / summaries.length),
      modelDistribution,
    };
  }, [summaries]);

  function toggleExpand(summaryId: string) {
    setExpandedSummaryId((prev) => (prev === summaryId ? null : summaryId));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">סיכומי כתבות - AI</h1>
          <p className="text-sm text-gray-500 mt-1">
            צפייה וניהול סיכומים שנוצרו על ידי AI
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">סה&quot;כ סיכומים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.avgTokens.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">ממוצע טוקנים לכתבה</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.modelDistribution).map(
                  ([model, count]) => (
                    <Badge key={model} variant="secondary" className="text-xs">
                      {model}: {count}
                    </Badge>
                  )
                )}
                {Object.keys(stats.modelDistribution).length === 0 && (
                  <p className="text-sm text-gray-400">-</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">התפלגות מודלים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summaries Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">כותרת כתבה</th>
              <th className="text-right px-4 py-3 font-medium w-72">
                תצוגה מקדימה
              </th>
              <th className="text-right px-4 py-3 font-medium w-28">מודל</th>
              <th className="text-center px-4 py-3 font-medium w-24">
                טוקנים
              </th>
              <th className="text-center px-4 py-3 font-medium w-28">תאריך</th>
              <th className="text-center px-4 py-3 font-medium w-28">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : summaries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  אין סיכומים להצגה
                </td>
              </tr>
            ) : (
              summaries.map((summary) => {
                const isExpanded = expandedSummaryId === summary.id;
                return (
                  <tr key={summary.id} className="group">
                    <td colSpan={6} className="p-0">
                      {/* Main row */}
                      <div
                        className="flex items-center hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(summary.id)}
                      >
                        <div className="flex-1 px-4 py-3.5">
                          <p className="font-medium text-sm">
                            {summary.articleTitle || 'ללא כותרת'}
                          </p>
                        </div>
                        <div className="w-72 px-4 py-3.5">
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {summary.summaryHe}
                          </p>
                        </div>
                        <div className="w-28 px-4 py-3.5">
                          <Badge variant="outline" className="text-xs">
                            {summary.modelUsed}
                          </Badge>
                        </div>
                        <div className="w-24 px-4 py-3.5 text-center">
                          <span className="text-sm font-mono">
                            {summary.tokensUsed.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-28 px-4 py-3.5 text-center">
                          <span className="text-xs text-gray-400">
                            {new Date(summary.createdAt).toLocaleDateString(
                              'he-IL'
                            )}
                          </span>
                        </div>
                        <div className="w-28 px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                regenerateMutation.mutate(summary.articleId);
                              }}
                              disabled={regenerateMutation.isPending}
                              title="צור מחדש"
                            >
                              <RefreshCcw
                                className={`h-4 w-4 ${
                                  regenerateMutation.isPending
                                    ? 'animate-spin'
                                    : ''
                                }`}
                              />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 bg-gray-50/30 border-t border-gray-100">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                            {/* Full summary */}
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Brain className="h-3.5 w-3.5" />
                                סיכום מלא
                              </h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {summary.summaryHe}
                              </p>
                            </div>

                            {/* Key points */}
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                נקודות מפתח
                              </h4>
                              {summary.keyPointsHe.length > 0 ? (
                                <ul className="space-y-1.5">
                                  {summary.keyPointsHe.map((point, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                      <span className="text-blue-500 mt-1 shrink-0">
                                        •
                                      </span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-400">
                                  אין נקודות מפתח
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Political angle */}
                          {summary.politicalAngleHe && (
                            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                              <span className="text-xs font-medium text-amber-700 block mb-0.5">
                                זווית פוליטית
                              </span>
                              <p className="text-xs text-amber-800">
                                {summary.politicalAngleHe}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
