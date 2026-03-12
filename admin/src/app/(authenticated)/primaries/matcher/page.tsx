'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PolicyStatement, PrimaryElection, MatcherCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { CsvImport } from '@/components/csv-import';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Upload,
  Grid3X3,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ── Category helpers ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<MatcherCategory, string> = {
  security: 'ביטחון',
  economy: 'כלכלה',
  society: 'חברה',
  law: 'חוק ומשפט',
  education: 'חינוך',
  foreign_policy: 'מדיניות חוץ',
};

const CATEGORY_BADGE_VARIANTS: Record<
  MatcherCategory,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  security: 'destructive',
  economy: 'success',
  society: 'secondary',
  law: 'warning',
  education: 'default',
  foreign_policy: 'outline',
};

const ALL_CATEGORIES: MatcherCategory[] = [
  'security',
  'economy',
  'society',
  'law',
  'education',
  'foreign_policy',
];

// ── Main Page Component ─────────────────────────────────────────────────

export default function MatcherStatementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [electionFilter, setElectionFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  // ── Fetch elections ──
  const { data: electionsRes } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  // ── Fetch statements ──
  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['matcher-statements', electionFilter],
    queryFn: () =>
      api.get<PolicyStatement[]>(
        `/primaries/matcher/statements/${electionFilter}`
      ),
    enabled: !!electionFilter,
  });

  // ── Toggle active mutation ──
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<PolicyStatement>(
        `/primaries/matcher/admin/statements/${id}`,
        { isActive }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['matcher-statements', electionFilter],
      });
      toast.success('הסטטוס עודכן');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון'),
  });

  // ── Bulk import mutation ──
  const bulkImportMutation = useMutation({
    mutationFn: (positions: Record<string, string>[]) =>
      api.post('/primaries/matcher/admin/positions/bulk', {
        positions: positions.map((row) => ({
          candidateId: row.candidateId,
          statementId: row.statementId,
          position: row.position,
        })),
      }),
    onSuccess: () => {
      toast.success('העמדות יובאו בהצלחה');
      setShowBulkImport(false);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בייבוא'),
  });

  // ── Filtered statements ──
  const filteredStatements = useMemo(() => {
    if (!categoryFilter) return statements;
    return statements.filter((s) => s.category === categoryFilter);
  }, [statements, categoryFilter]);

  // ── Sorted statements ──
  const sortedStatements = useMemo(
    () => [...filteredStatements].sort((a, b) => a.sortOrder - b.sortOrder),
    [filteredStatements]
  );

  function handleToggleActive(statement: PolicyStatement) {
    toggleMutation.mutate({
      id: statement.id,
      isActive: !statement.isActive,
    });
  }

  function handleBulkImport(rows: Record<string, string>[]) {
    bulkImportMutation.mutate(rows);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">מתאים מועמדים - הצהרות מדיניות</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול הצהרות מדיניות ועמדות מועמדים
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkImport(true)}
          >
            <Upload className="h-4 w-4 ml-1" />
            ייבוא עמדות
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/primaries/matcher/positions')}
            disabled={!electionFilter}
          >
            <Grid3X3 className="h-4 w-4 ml-1" />
            מטריצת עמדות
          </Button>
          <Button
            onClick={() =>
              router.push(
                `/primaries/matcher/statements/new${
                  electionFilter ? `?electionId=${electionFilter}` : ''
                }`
              )
            }
          >
            <Plus className="h-4 w-4 ml-1" />
            הצהרה חדשה
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label>סינון לפי בחירות</Label>
          <Select
            value={electionFilter}
            onChange={(e) => {
              setElectionFilter(e.target.value);
              setCategoryFilter('');
            }}
          >
            <option value="">בחר בחירות</option>
            {elections.map((el) => (
              <option key={el.id} value={el.id}>
                {el.title} ({el.status})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>סינון לפי קטגוריה</Label>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={!electionFilter}
          >
            <option value="">כל הקטגוריות</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Statements Table */}
      {!electionFilter ? (
        <div className="text-center py-12 text-gray-400">
          <p>בחר בחירות כדי להציג את ההצהרות</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-medium w-12">#</th>
                <th className="text-right px-4 py-3 font-medium">הצהרה</th>
                <th className="text-right px-4 py-3 font-medium w-32">
                  קטגוריה
                </th>
                <th className="text-center px-4 py-3 font-medium w-20">
                  משקל
                </th>
                <th className="text-center px-4 py-3 font-medium w-20">
                  סטטוס
                </th>
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
              ) : sortedStatements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    {categoryFilter
                      ? 'אין הצהרות בקטגוריה זו.'
                      : 'אין הצהרות. צור הצהרה חדשה כדי להתחיל.'}
                  </td>
                </tr>
              ) : (
                sortedStatements.map((statement) => (
                  <tr
                    key={statement.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                      {statement.sortOrder}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm">
                        {statement.textHe}
                      </p>
                      {statement.textEn && (
                        <p
                          className="text-xs text-gray-400 mt-0.5"
                          dir="ltr"
                        >
                          {statement.textEn}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={CATEGORY_BADGE_VARIANTS[statement.category]}
                      >
                        {CATEGORY_LABELS[statement.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-mono">
                        {statement.defaultWeight}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge
                        variant={statement.isActive ? 'success' : 'outline'}
                      >
                        {statement.isActive ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/primaries/matcher/statements/new?edit=${statement.id}&electionId=${electionFilter}`
                            )
                          }
                          title="עריכה"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(statement)}
                          disabled={toggleMutation.isPending}
                          title={
                            statement.isActive
                              ? 'השבת'
                              : 'הפעל'
                          }
                        >
                          {statement.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {electionFilter && statements.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>
            סה&quot;כ: {statements.length} הצהרות
          </span>
          <span>
            פעילות: {statements.filter((s) => s.isActive).length}
          </span>
          {categoryFilter && (
            <span>
              מסוננות: {sortedStatements.length}
            </span>
          )}
        </div>
      )}

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onClose={() => setShowBulkImport(false)} className="max-w-2xl">
        <DialogTitle>ייבוא עמדות מועמדים</DialogTitle>
        <p className="text-sm text-gray-600 mb-4">
          העלה קובץ CSV עם עמודות: candidateId, statementId, position (agree/neutral/disagree)
        </p>
        <CsvImport
          onImport={handleBulkImport}
          expectedColumns={['candidateId', 'statementId', 'position']}
          title="ייבוא עמדות"
        />
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setShowBulkImport(false)}
          >
            סגור
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
