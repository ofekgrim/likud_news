'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ElectionResult, PollingStation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ElectionSelector } from '@/components/election-selector';
import { CandidateSelector } from '@/components/candidate-selector';
import { CsvImport } from '@/components/csv-import';
import { toast } from 'sonner';

interface ResultForm {
  candidateId: string | undefined;
  stationId: string;
  voteCount: number;
  isOfficial: boolean;
}

const emptyForm: ResultForm = {
  candidateId: undefined,
  stationId: '',
  voteCount: 0,
  isOfficial: false,
};

export default function ElectionResultsPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState<string | undefined>();
  const [form, setForm] = useState<ResultForm>(emptyForm);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ElectionResult | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: () => api.get<ElectionResult[]>(`/election-results/election/${electionId}`),
    enabled: !!electionId,
  });

  const { data: stationsResponse } = useQuery({
    queryKey: ['polling-stations', electionId],
    queryFn: () => api.get<{ data: PollingStation[] }>(`/polling-stations?electionId=${electionId}&limit=100`),
    enabled: !!electionId,
  });
  const stations = stationsResponse?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: ResultForm) =>
      api.post('/election-results', {
        electionId,
        candidateId: data.candidateId,
        stationId: data.stationId || undefined,
        voteCount: data.voteCount,
        isOfficial: data.isOfficial,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });
      toast.success('התוצאות נשמרו בהצלחה');
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירת התוצאות'),
  });

  const toggleOfficialMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/election-results/${id}`, { isOfficial: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });
      toast.success('התוצאות סומנו כרשמיות');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/election-results/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });
      toast.success('התוצאות נמחקו');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת התוצאות'),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post('/election-results/publish', { electionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });
      toast.success('התוצאות פורסמו בהצלחה');
      setPublishConfirmOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'שגיאה בפרסום התוצאות');
      setPublishConfirmOpen(false);
    },
  });

  // ── CSV Import handler ─────────────────────────────────────────────────

  async function handleCsvImport(rows: Record<string, string>[]) {
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        await api.post('/election-results', {
          electionId,
          candidateId: row.candidateId,
          stationId: row.stationId || undefined,
          voteCount: parseInt(row.voteCount) || 0,
          isOfficial: row.isOfficial === 'true' || row.isOfficial === '1',
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });

    if (errorCount === 0) {
      toast.success(`יובאו ${successCount} תוצאות בהצלחה`);
    } else {
      toast.warning(`יובאו ${successCount} תוצאות, ${errorCount} שגיאות`);
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.candidateId) {
      toast.error('יש לבחור מועמד');
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div>
      {/* Header + Publish */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">תוצאות בחירות</h1>
        {electionId && (
          <Button
            className="bg-[#0099DB] hover:bg-[#0088c4] text-white"
            onClick={() => setPublishConfirmOpen(true)}
            disabled={publishMutation.isPending}
          >
            פרסם תוצאות
          </Button>
        )}
      </div>

      {/* Election Selector */}
      <div className="mb-6 max-w-sm">
        <ElectionSelector
          value={electionId}
          onChange={(id) => {
            setElectionId(id);
            setForm(emptyForm);
          }}
          label="בחר בחירות"
          required
        />
      </div>

      {!electionId ? (
        <p className="text-gray-400 text-center py-12">
          יש לבחור בחירות כדי לצפות בתוצאות
        </p>
      ) : (
        <div className="space-y-6">
          {/* ── Section A: Results Table ─────────────────────────────── */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">מועמד</th>
                  <th className="text-right px-4 py-3 font-medium">קלפי</th>
                  <th className="text-right px-4 py-3 font-medium">קולות</th>
                  <th className="text-right px-4 py-3 font-medium">רשמי</th>
                  <th className="text-right px-4 py-3 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resultsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))
                ) : !results || results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      אין תוצאות עדיין. הוסף תוצאות באמצעות הטופס או ייבוא CSV.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium">
                        {result.candidate?.fullName || result.candidateId}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {result.station?.name || 'כללי'}
                      </td>
                      <td className="px-4 py-3.5" dir="ltr">
                        {result.voteCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={result.isOfficial ? 'success' : 'outline'}>
                          {result.isOfficial ? 'רשמי' : 'לא רשמי'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          {!result.isOfficial && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleOfficialMutation.mutate(result.id)}
                              disabled={toggleOfficialMutation.isPending}
                            >
                              סמן כרשמי
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => setDeleteTarget(result)}
                            disabled={deleteMutation.isPending}
                          >
                            מחיקה
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Section B: Manual Entry Form ────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הוספת תוצאות</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CandidateSelector
                    value={form.candidateId}
                    onChange={(id) => setForm({ ...form, candidateId: id })}
                    electionId={electionId}
                    label="מועמד"
                  />

                  <div className="space-y-2">
                    <Label>קלפי (אופציונלי)</Label>
                    <Select
                      value={form.stationId}
                      onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                    >
                      <option value="">כללי</option>
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.city}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>מספר קולות</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.voteCount}
                      onChange={(e) =>
                        setForm({ ...form, voteCount: parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isOfficial"
                        checked={form.isOfficial}
                        onChange={(e) =>
                          setForm({ ...form, isOfficial: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
                      />
                      <Label htmlFor="isOfficial">תוצאות רשמיות</Label>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending || !form.candidateId}
                >
                  {createMutation.isPending ? 'שומר...' : 'שמור תוצאות'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Section C: CSV Import ───────────────────────────────── */}
          <CsvImport
            onImport={handleCsvImport}
            expectedColumns={['candidateId', 'stationId', 'voteCount', 'isOfficial']}
            title="ייבוא תוצאות מ-CSV"
          />
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        open={publishConfirmOpen}
        onConfirm={() => publishMutation.mutate()}
        onCancel={() => setPublishConfirmOpen(false)}
        title="פרסום תוצאות"
        description="האם לפרסם את התוצאות? פעולה זו תשלח עדכון לכל המשתמשים המחוברים."
        confirmLabel="פרסם"
        loading={publishMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="מחיקת תוצאות"
        description={`האם למחוק את תוצאות הקולות של "${deleteTarget?.candidate?.name || 'מועמד'}"?`}
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
