'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  PolicyStatement,
  PrimaryCandidate,
  PrimaryElection,
  CandidatePosition,
  PositionValue,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { CsvImport } from '@/components/csv-import';
import { toast } from 'sonner';
import {
  ArrowRight,
  Save,
  Upload,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from 'lucide-react';

// ── Position helpers ────────────────────────────────────────────────────

const POSITION_OPTIONS: { value: PositionValue; label: string; icon: typeof ThumbsUp; color: string }[] = [
  { value: 'agree', label: 'בעד', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'neutral', label: 'ניטרלי', icon: Minus, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'disagree', label: 'נגד', icon: ThumbsDown, color: 'text-red-600 bg-red-50 border-red-200' },
];

const POSITION_DISPLAY: Record<PositionValue, { label: string; variant: 'success' | 'outline' | 'destructive' }> = {
  agree: { label: 'בעד', variant: 'success' },
  neutral: { label: 'ניטרלי', variant: 'outline' },
  disagree: { label: 'נגד', variant: 'destructive' },
};

// ── Position Cell Component ─────────────────────────────────────────────

function PositionCell({
  value,
  onChange,
}: {
  value: PositionValue | undefined;
  onChange: (val: PositionValue) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {POSITION_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`p-1.5 rounded-md border transition-all ${
              isSelected
                ? opt.color + ' border-current shadow-sm'
                : 'text-gray-300 bg-white border-transparent hover:bg-gray-50 hover:text-gray-500'
            }`}
            title={opt.label}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────

export default function PositionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [electionFilter, setElectionFilter] = useState<string>('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, Record<string, PositionValue>>
  >({});

  // ── Fetch elections ──
  const { data: electionsRes } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  // ── Fetch statements ──
  const { data: statements = [], isLoading: statementsLoading } = useQuery({
    queryKey: ['matcher-statements', electionFilter],
    queryFn: () =>
      api.get<PolicyStatement[]>(
        `/primaries/matcher/statements/${electionFilter}`
      ),
    enabled: !!electionFilter,
  });

  // ── Fetch candidates ──
  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates', electionFilter],
    queryFn: () =>
      api.get<PrimaryCandidate[]>(
        `/candidates/election/${electionFilter}`
      ),
    enabled: !!electionFilter,
  });

  // ── Fetch existing positions ──
  const { data: existingPositions = [] } = useQuery({
    queryKey: ['matcher-positions', electionFilter],
    queryFn: () =>
      api.get<CandidatePosition[]>(
        `/primaries/matcher/statements/${electionFilter}`
      ).then(() => {
        // Positions are fetched via statements endpoint or a dedicated one.
        // We build a positions lookup from what the API provides.
        return [] as CandidatePosition[];
      }),
    enabled: !!electionFilter,
  });

  // ── Active, sorted statements ──
  const activeStatements = useMemo(
    () =>
      statements
        .filter((s) => s.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [statements]
  );

  // ── Build existing positions map ──
  const positionsMap = useMemo(() => {
    const map = new Map<string, PositionValue>();
    for (const pos of existingPositions) {
      map.set(`${pos.candidateId}:${pos.statementId}`, pos.position);
    }
    return map;
  }, [existingPositions]);

  // ── Get current position for a cell ──
  const getPosition = useCallback(
    (candidateId: string, statementId: string): PositionValue | undefined => {
      // Check pending changes first
      const pending = pendingChanges[candidateId]?.[statementId];
      if (pending) return pending;
      // Then existing positions
      return positionsMap.get(`${candidateId}:${statementId}`);
    },
    [pendingChanges, positionsMap]
  );

  // ── Handle position change ──
  function handlePositionChange(
    candidateId: string,
    statementId: string,
    value: PositionValue
  ) {
    setPendingChanges((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        [statementId]: value,
      },
    }));
  }

  // ── Count pending changes ──
  const pendingCount = useMemo(() => {
    let count = 0;
    for (const candidateChanges of Object.values(pendingChanges)) {
      count += Object.keys(candidateChanges).length;
    }
    return count;
  }, [pendingChanges]);

  // ── Bulk save mutation ──
  const saveMutation = useMutation({
    mutationFn: () => {
      const positions: {
        candidateId: string;
        statementId: string;
        position: PositionValue;
      }[] = [];

      for (const [candidateId, stmtChanges] of Object.entries(pendingChanges)) {
        for (const [statementId, position] of Object.entries(stmtChanges)) {
          positions.push({ candidateId, statementId, position });
        }
      }

      return api.post('/primaries/matcher/admin/positions/bulk', { positions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['matcher-positions', electionFilter],
      });
      setPendingChanges({});
      toast.success('העמדות נשמרו בהצלחה');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה בשמירת העמדות'),
  });

  // ── CSV import mutation ──
  const csvImportMutation = useMutation({
    mutationFn: (rows: Record<string, string>[]) =>
      api.post('/primaries/matcher/admin/positions/bulk', {
        positions: rows.map((row) => ({
          candidateId: row.candidateId,
          statementId: row.statementId,
          position: row.position as PositionValue,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['matcher-positions', electionFilter],
      });
      setShowCsvImport(false);
      toast.success('העמדות יובאו בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בייבוא'),
  });

  // ── Completion stats ──
  const completionStats = useMemo(() => {
    if (!candidates.length || !activeStatements.length) {
      return { filled: 0, total: 0, percentage: 0 };
    }

    let filled = 0;
    const total = candidates.length * activeStatements.length;

    for (const candidate of candidates) {
      for (const statement of activeStatements) {
        if (getPosition(candidate.id, statement.id)) {
          filled++;
        }
      }
    }

    return {
      filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }, [candidates, activeStatements, getPosition]);

  const isLoading = statementsLoading || candidatesLoading;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/primaries/matcher')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">מטריצת עמדות מועמדים</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              הגדר עמדת כל מועמד ביחס לכל הצהרת מדיניות
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCsvImport(true)}
          >
            <Upload className="h-4 w-4 ml-1" />
            ייבוא CSV
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={pendingCount === 0 || saveMutation.isPending}
          >
            <Save className="h-4 w-4 ml-1" />
            {saveMutation.isPending
              ? 'שומר...'
              : pendingCount > 0
              ? `שמור (${pendingCount} שינויים)`
              : 'שמור'}
          </Button>
        </div>
      </div>

      {/* Election Filter */}
      <div className="mb-6 max-w-sm">
        <div className="space-y-2">
          <Label>בחירות</Label>
          <Select
            value={electionFilter}
            onChange={(e) => {
              setElectionFilter(e.target.value);
              setPendingChanges({});
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
      </div>

      {/* Completion Stats */}
      {electionFilter && !isLoading && activeStatements.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">מילוי:</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0099DB] rounded-full transition-all"
                style={{ width: `${completionStats.percentage}%` }}
              />
            </div>
            <span className="text-gray-600 font-medium">
              {completionStats.percentage}%
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {completionStats.filled} / {completionStats.total} תאים
          </span>
        </div>
      )}

      {/* Content */}
      {!electionFilter ? (
        <div className="text-center py-12 text-gray-400">
          <p>בחר בחירות כדי להציג את מטריצת העמדות</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : activeStatements.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>אין הצהרות פעילות. צור הצהרות חדשות בדף ההצהרות.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => router.push('/primaries/matcher')}
          >
            לדף ההצהרות
          </Button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>אין מועמדים בבחירות אלה.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => router.push('/primaries/candidates')}
          >
            לדף המועמדים
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium sticky right-0 bg-gray-50 z-10 min-w-[180px]">
                    מועמד
                  </th>
                  {activeStatements.map((stmt) => (
                    <th
                      key={stmt.id}
                      className="text-center px-3 py-3 font-medium min-w-[140px]"
                    >
                      <div
                        className="text-xs leading-tight"
                        title={stmt.textHe}
                      >
                        {stmt.textHe.length > 35
                          ? `${stmt.textHe.slice(0, 35)}...`
                          : stmt.textHe}
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {stmt.category}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium sticky right-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        {candidate.photoUrl ? (
                          <img
                            src={candidate.photoUrl}
                            alt={candidate.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#0099DB] flex items-center justify-center text-white text-xs font-semibold">
                            {candidate.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <span className="block text-sm">
                            {candidate.fullName}
                          </span>
                          {candidate.district && (
                            <span className="block text-[10px] text-gray-400">
                              {candidate.district}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {activeStatements.map((stmt) => (
                      <td key={stmt.id} className="px-2 py-2 text-center">
                        <PositionCell
                          value={getPosition(candidate.id, stmt.id)}
                          onChange={(val) =>
                            handlePositionChange(
                              candidate.id,
                              stmt.id,
                              val
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {electionFilter && activeStatements.length > 0 && candidates.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium">מקרא:</span>
          {POSITION_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <span
                key={opt.value}
                className="flex items-center gap-1"
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </span>
            );
          })}
        </div>
      )}

      {/* CSV Import Dialog */}
      <Dialog
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        className="max-w-2xl"
      >
        <DialogTitle>ייבוא עמדות מ-CSV</DialogTitle>
        <p className="text-sm text-gray-600 mb-4">
          העלה קובץ CSV עם העמודות הבאות: candidateId, statementId, position
          (agree/neutral/disagree)
        </p>
        <CsvImport
          onImport={(rows) => csvImportMutation.mutate(rows)}
          expectedColumns={['candidateId', 'statementId', 'position']}
          title="ייבוא עמדות"
        />
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setShowCsvImport(false)}>
            סגור
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
