'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LeaderboardEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TableRowSkeleton, Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Award, Trophy, Star, Save } from 'lucide-react';

// ── Action types with Hebrew labels ─────────────────────────────────────

const ACTION_TYPES: { key: string; label: string }[] = [
  { key: 'quiz_complete', label: 'מילוי שאלון' },
  { key: 'endorsement', label: 'תמיכה במועמד' },
  { key: 'poll_vote', label: 'הצבעה בסקר' },
  { key: 'event_rsvp', label: 'אישור הגעה לאירוע' },
  { key: 'comment', label: 'תגובה' },
  { key: 'share', label: 'שיתוף' },
  { key: 'login_streak', label: 'רצף התחברות' },
  { key: 'profile_complete', label: 'השלמת פרופיל' },
];

// ── Badge definitions ───────────────────────────────────────────────────

const BADGE_DEFINITIONS: { type: string; label: string; description: string }[] = [
  { type: 'quiz_taker', label: 'שאלון', description: 'השלמת שאלון התאמה למועמד' },
  { type: 'first_vote', label: 'הצבעה ראשונה', description: 'הצבעה ראשונה בסקר קהילתי' },
  { type: 'endorser', label: 'תומך', description: 'תמיכה במועמד בבחירות' },
  { type: 'poll_voter', label: 'מצביע בסקרים', description: 'השתתפות ב-5 סקרים לפחות' },
  { type: 'event_goer', label: 'משתתף באירועים', description: 'אישור הגעה ל-3 אירועים לפחות' },
  { type: 'top_contributor', label: 'תורם מוביל', description: 'הגעה למקום 10 בלוח המובילים' },
  { type: 'early_bird', label: 'מקדים', description: 'הצטרפות מוקדמת לפלטפורמה' },
  { type: 'social_sharer', label: 'משתף', description: 'שיתוף 10 תכנים לפחות ברשתות חברתיות' },
];

// ── Rank styling helpers ────────────────────────────────────────────────

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-600 font-bold';
    case 2:
      return 'text-gray-400 font-bold';
    case 3:
      return 'text-amber-700 font-bold';
    default:
      return 'text-gray-600';
  }
}

function getRankBgColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700';
    case 2:
      return '#C0C0C0';
    case 3:
      return '#CD7F32';
    default:
      return '#E5E7EB';
  }
}

export default function GamificationPage() {
  const queryClient = useQueryClient();

  // Points config state
  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({});

  // ── Load current config ────────────────────────────────────────────────

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['gamification-config'],
    queryFn: () => api.get<{ actions: Record<string, number> }>('/gamification/config'),
  });

  // Sync fetched config into local state
  useEffect(() => {
    if (configData?.actions) {
      setPointsConfig(configData.actions);
    }
  }, [configData]);

  // ── Save config mutation ───────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (actions: Record<string, number>) =>
      api.put('/gamification/config', { actions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-config'] });
      toast.success('הגדרות הנקודות נשמרו בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירת ההגדרות'),
  });

  // ── Leaderboard query ──────────────────────────────────────────────────

  const { data: leaderboardRes, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () =>
      api.get<{ data: LeaderboardEntry[] }>('/gamification/leaderboard?period=all_time&limit=10'),
  });
  const leaderboard = leaderboardRes?.data ?? [];

  // ── Handlers ───────────────────────────────────────────────────────────

  function handlePointsChange(actionKey: string, value: string) {
    const numValue = parseInt(value, 10);
    setPointsConfig((prev) => ({
      ...prev,
      [actionKey]: isNaN(numValue) ? 0 : numValue,
    }));
  }

  function handleSaveConfig() {
    saveMutation.mutate(pointsConfig);
  }

  function getInitial(name?: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">גיימיפיקציה</h1>
        <p className="text-sm text-gray-500 mt-1">
          הגדרת נקודות, תגי הישג ולוח מובילים
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Section A: Points Configuration ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-[#0099DB]" />
              הגדרת נקודות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium">פעולה</th>
                    <th className="text-right px-4 py-3 font-medium">נקודות</th>
                    <th className="text-right px-4 py-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {configLoading ? (
                    Array.from({ length: ACTION_TYPES.length }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={3} />
                    ))
                  ) : (
                    ACTION_TYPES.map(({ key, label }) => (
                      <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-medium">{label}</td>
                        <td className="px-4 py-3.5">
                          <Input
                            type="number"
                            min={0}
                            value={pointsConfig[key] ?? 0}
                            onChange={(e) => handlePointsChange(key, e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs">
                          {key}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSaveConfig}
                disabled={saveMutation.isPending || configLoading}
              >
                <Save className="h-4 w-4 ml-2" />
                שמור הגדרות
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Section B: Badge Definitions ─────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-[#0099DB]" />
              תגי הישג
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {BADGE_DEFINITIONS.map(({ type, label, description }) => (
                <div
                  key={type}
                  className="border rounded-lg p-4 flex flex-col items-center text-center space-y-2 bg-gray-50/50"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0099DB]/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-[#0099DB]" />
                  </div>
                  <h4 className="font-semibold text-sm">{label}</h4>
                  <p className="text-xs text-gray-500">{description}</p>
                  <span className="text-[10px] text-gray-400 font-mono">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section C: Leaderboard Preview ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#0099DB]" />
              לוח מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium w-20">דירוג</th>
                    <th className="text-right px-4 py-3 font-medium">משתמש</th>
                    <th className="text-right px-4 py-3 font-medium">נקודות</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaderboardLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={3} />
                    ))
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        אין נתונים בלוח המובילים.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {entry.rank <= 3 ? (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: getRankBgColor(entry.rank) }}
                              >
                                {entry.rank}
                              </div>
                            ) : (
                              <span className={getRankStyle(entry.rank)}>
                                {entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* User */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {entry.avatarUrl ? (
                              <img
                                src={entry.avatarUrl}
                                alt={entry.displayName || 'משתמש'}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0099DB] flex items-center justify-center text-white text-xs font-semibold">
                                {getInitial(entry.displayName)}
                              </div>
                            )}
                            <span className="font-medium">
                              {entry.displayName || 'משתמש אנונימי'}
                            </span>
                          </div>
                        </td>
                        {/* Points */}
                        <td className="px-4 py-3.5 font-semibold text-[#0099DB]">
                          {entry.totalPoints.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
