'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TurnoutSnapshot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TurnoutForm {
  district: string;
  eligibleVoters: number;
  actualVoters: number;
}

const emptyForm: TurnoutForm = {
  district: '',
  eligibleVoters: 0,
  actualVoters: 0,
};

function getPercentageColor(pct: number): string {
  if (pct < 30) return 'text-red-600';
  if (pct <= 60) return 'text-yellow-600';
  return 'text-green-600';
}

function getPercentageBadgeVariant(pct: number): 'destructive' | 'warning' | 'success' {
  if (pct < 30) return 'destructive';
  if (pct <= 60) return 'warning';
  return 'success';
}

export default function TurnoutPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState<string | undefined>();
  const [form, setForm] = useState<TurnoutForm>(emptyForm);

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['turnout', electionId],
    queryFn: () => api.get<TurnoutSnapshot[]>(`/elections/${electionId}/turnout`),
    enabled: !!electionId,
    refetchInterval: 30000,
  });

  // ── Computed totals ────────────────────────────────────────────────────

  const totals = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return { eligibleVoters: 0, actualVoters: 0, percentage: 0 };
    }
    const eligibleVoters = snapshots.reduce((sum, s) => sum + s.eligibleVoters, 0);
    const actualVoters = snapshots.reduce((sum, s) => sum + s.actualVoters, 0);
    const percentage = eligibleVoters > 0 ? (actualVoters / eligibleVoters) * 100 : 0;
    return { eligibleVoters, actualVoters, percentage };
  }, [snapshots]);

  // ── Computed form percentage ───────────────────────────────────────────

  const formPercentage = useMemo(() => {
    if (form.eligibleVoters <= 0) return 0;
    return (form.actualVoters / form.eligibleVoters) * 100;
  }, [form.eligibleVoters, form.actualVoters]);

  // ── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: TurnoutForm) =>
      api.post(`/elections/${electionId}/turnout`, {
        district: data.district || undefined,
        eligibleVoters: data.eligibleVoters,
        actualVoters: data.actualVoters,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnout', electionId] });
      toast.success('נתוני ההצבעה נשמרו בהצלחה');
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירת הנתונים'),
  });

  // ── Form submit ────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.eligibleVoters <= 0) {
      toast.error('מספר הזכאים חייב להיות גדול מ-0');
      return;
    }
    if (form.actualVoters < 0) {
      toast.error('מספר המצביעים לא יכול להיות שלילי');
      return;
    }
    if (form.actualVoters > form.eligibleVoters) {
      toast.error('מספר המצביעים לא יכול לעלות על מספר הזכאים');
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אחוזי הצבעה</h1>
        {electionId && (
          <Badge variant="secondary">
            רענון אוטומטי כל 30 שניות
          </Badge>
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
          יש לבחור בחירות כדי לצפות באחוזי ההצבעה
        </p>
      ) : (
        <div className="space-y-6">
          {/* ── Turnout Table ──────────────────────────────────────── */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">מחוז</th>
                  <th className="text-right px-4 py-3 font-medium">זכאים</th>
                  <th className="text-right px-4 py-3 font-medium">הצביעו</th>
                  <th className="text-right px-4 py-3 font-medium">אחוז</th>
                  <th className="text-right px-4 py-3 font-medium">זמן</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))
                ) : !snapshots || snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      אין נתוני הצבעה עדיין. הוסף נתונים באמצעות הטופס למטה.
                    </td>
                  </tr>
                ) : (
                  <>
                    {snapshots.map((snapshot) => (
                      <tr
                        key={snapshot.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium">
                          {snapshot.district || 'כללי'}
                        </td>
                        <td className="px-4 py-3.5" dir="ltr">
                          {snapshot.eligibleVoters.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5" dir="ltr">
                          {snapshot.actualVoters.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={getPercentageBadgeVariant(snapshot.percentage)}>
                            {snapshot.percentage.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600" dir="ltr">
                          {format(new Date(snapshot.snapshotAt), 'dd/MM/yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-gray-50 font-semibold border-t-2">
                      <td className="px-4 py-3.5">סה&quot;כ</td>
                      <td className="px-4 py-3.5" dir="ltr">
                        {totals.eligibleVoters.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5" dir="ltr">
                        {totals.actualVoters.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={getPercentageBadgeVariant(totals.percentage)}>
                          {totals.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400">-</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Add Snapshot Form ──────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הוסף נתוני הצבעה</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מחוז</Label>
                    <Input
                      value={form.district}
                      onChange={(e) =>
                        setForm({ ...form, district: e.target.value })
                      }
                      placeholder="שם המחוז (אופציונלי)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>מספר זכאים</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.eligibleVoters || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          eligibleVoters: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>מספר מצביעים</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.actualVoters || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          actualVoters: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <div className="space-y-1">
                      <Label>אחוז הצבעה</Label>
                      <p className={`text-lg font-semibold ${getPercentageColor(formPercentage)}`}>
                        {formPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending || form.eligibleVoters <= 0}
                >
                  {createMutation.isPending ? 'שומר...' : 'שמור נתונים'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
