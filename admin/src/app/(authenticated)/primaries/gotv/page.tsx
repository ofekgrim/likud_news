'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryElection, GotvEngagement, GotvStats } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableRowSkeleton, Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users,
  CalendarCheck,
  MapPin,
  Award,
  Bell,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// ── Filter type ─────────────────────────────────────────────────────────

type FilterType = 'all' | 'has_plan' | 'checked_in' | 'has_badge';

// ── Main Page Component ─────────────────────────────────────────────────

export default function GotvDashboardPage() {
  const queryClient = useQueryClient();

  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [pushConfirmOpen, setPushConfirmOpen] = useState(false);

  // ── Fetch elections ──
  const { data: electionsRes } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  // ── Fetch GOTV stats ──
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gotv-stats', selectedElectionId],
    queryFn: () =>
      api.get<GotvStats>(`/gotv/stats/${selectedElectionId}`),
    enabled: !!selectedElectionId,
  });

  // ── Fetch GOTV engagements ──
  const { data: engagements = [], isLoading: engagementsLoading } = useQuery({
    queryKey: ['gotv-engagements', selectedElectionId],
    queryFn: () =>
      api.get<GotvEngagement[]>(`/gotv/engagements/${selectedElectionId}`),
    enabled: !!selectedElectionId,
  });

  // ── Send push mutation ──
  const pushMutation = useMutation({
    mutationFn: () =>
      api.post('/gotv/push/manual', { electionId: selectedElectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gotv-stats', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['gotv-engagements', selectedElectionId] });
      toast.success('ההתראות נשלחו בהצלחה');
      setPushConfirmOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשליחת התראות'),
  });

  // ── Filtered engagements ──
  const filteredEngagements = useMemo(() => {
    switch (filter) {
      case 'has_plan':
        return engagements.filter((e) => e.votingPlanTime !== null);
      case 'checked_in':
        return engagements.filter((e) => e.stationCheckinAt !== null);
      case 'has_badge':
        return engagements.filter((e) => e.votedBadgeClaimedAt !== null);
      default:
        return engagements;
    }
  }, [engagements, filter]);

  // ── Helpers ──
  function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getPercentage(part: number, total: number): string {
    if (total === 0) return '0%';
    return `${((part / total) * 100).toFixed(1)}%`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">מרכז GOTV - הוצא את הקול</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול ומעקב אחר מאמצי הוצאת הקול לבחירות
          </p>
        </div>
        {selectedElectionId && (
          <Button onClick={() => setPushConfirmOpen(true)}>
            <Send className="h-4 w-4 ml-1" />
            שלח התראה
          </Button>
        )}
      </div>

      {/* Election Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label>בחירות</Label>
          <Select
            value={selectedElectionId}
            onChange={(e) => {
              setSelectedElectionId(e.target.value);
              setFilter('all');
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

      {!selectedElectionId ? (
        <div className="text-center py-12 text-gray-400">
          <p>בחר בחירות כדי להציג את נתוני ה-GOTV</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Users className="h-4 w-4" />
                      <span>זכאי הצבעה</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {(stats?.totalEligible ?? 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <CalendarCheck className="h-4 w-4" />
                      <span>תוכניות הצבעה</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {(stats?.votingPlans ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getPercentage(stats?.votingPlans ?? 0, stats?.totalEligible ?? 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>צ&apos;ק-אין</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {(stats?.checkedIn ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getPercentage(stats?.checkedIn ?? 0, stats?.totalEligible ?? 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Award className="h-4 w-4" />
                      <span>תגי &quot;הצבעתי&quot;</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {(stats?.votedBadges ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getPercentage(stats?.votedBadges ?? 0, stats?.totalEligible ?? 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Bell className="h-4 w-4" />
                      <span>התראות שנשלחו</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {(stats?.notificationsSent ?? 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="space-y-2 max-w-xs">
              <Label>סינון</Label>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
              >
                <option value="all">הכל</option>
                <option value="has_plan">עם תוכנית הצבעה</option>
                <option value="checked_in">עשו צ&apos;ק-אין</option>
                <option value="has_badge">קיבלו תג &quot;הצבעתי&quot;</option>
              </Select>
            </div>
          </div>

          {/* Engagements Table */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">משתמש</th>
                  <th className="text-center px-4 py-3 font-medium">תוכנית הצבעה</th>
                  <th className="text-center px-4 py-3 font-medium">צ&apos;ק-אין</th>
                  <th className="text-center px-4 py-3 font-medium">תג &quot;הצבעתי&quot;</th>
                  <th className="text-center px-4 py-3 font-medium w-24">התראות</th>
                  <th className="text-center px-4 py-3 font-medium w-24">תזכורות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {engagementsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))
                ) : filteredEngagements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      {filter !== 'all'
                        ? 'אין תוצאות עבור הסינון הנוכחי.'
                        : 'אין נתוני GOTV עבור בחירות אלו.'}
                    </td>
                  </tr>
                ) : (
                  filteredEngagements.map((engagement) => (
                    <tr
                      key={engagement.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium">
                          {engagement.appUserName || 'משתמש אנונימי'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {engagement.votingPlanTime ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mb-0.5" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(engagement.votingPlanTime)}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {engagement.stationCheckinAt ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mb-0.5" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(engagement.stationCheckinAt)}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {engagement.votedBadgeClaimedAt ? (
                          <div className="flex flex-col items-center">
                            <Award className="h-4 w-4 text-purple-500 mb-0.5" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(engagement.votedBadgeClaimedAt)}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="secondary">
                          {engagement.notificationLog.length}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={engagement.remindersEnabled ? 'success' : 'outline'}
                        >
                          {engagement.remindersEnabled ? 'פעיל' : 'כבוי'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {engagements.length > 0 && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>
                סה&quot;כ: {engagements.length} רשומות
              </span>
              {filter !== 'all' && (
                <span>
                  מסוננות: {filteredEngagements.length}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Send Push Confirmation Dialog */}
      <ConfirmDialog
        open={pushConfirmOpen}
        onConfirm={() => pushMutation.mutate()}
        onCancel={() => setPushConfirmOpen(false)}
        title="שליחת התראת GOTV"
        description="האם לשלוח התראת GOTV ידנית לכל המשתמשים שטרם הצביעו? פעולה זו תשלח push notification לכל המכשירים הרלוונטיים."
        confirmLabel="שלח התראה"
        loading={pushMutation.isPending}
      />
    </div>
  );
}
