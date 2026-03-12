'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Branch, BranchWeeklyScore } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableRowSkeleton, Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
} from 'lucide-react';

// ── Tab type ────────────────────────────────────────────────────────────

type TabId = 'branches' | 'leaderboard';

interface BranchFormData {
  name: string;
  district: string;
}

const EMPTY_FORM: BranchFormData = {
  name: '',
  district: '',
};

// ── Main Page Component ─────────────────────────────────────────────────

export default function BranchesPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('branches');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [weekPeriod, setWeekPeriod] = useState<string>('current');

  // ── Fetch branches ──
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get<Branch[]>('/engagement/leaderboard/branches'),
  });

  // ── Fetch leaderboard ──
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['branch-leaderboard', weekPeriod],
    queryFn: () =>
      api.get<BranchWeeklyScore[]>(
        `/engagement/leaderboard/branches?period=${weekPeriod}`
      ),
  });

  // ── Sorted leaderboard ──
  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => a.rank - b.rank),
    [leaderboard]
  );

  // ── Create branch mutation ──
  const createMutation = useMutation({
    mutationFn: (data: BranchFormData) =>
      api.post<Branch>('/branches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      toast.success('הסניף נוצר בהצלחה');
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה ביצירת סניף'),
  });

  // ── Update branch mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchFormData & { isActive: boolean }> }) =>
      api.patch<Branch>(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      toast.success('הסניף עודכן בהצלחה');
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון סניף'),
  });

  // ── Delete branch mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      toast.success('הסניף נמחק');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת סניף'),
  });

  // ── Toggle active mutation ──
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<Branch>(`/branches/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches-list'] });
      toast.success('הסטטוס עודכן');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון'),
  });

  // ── Handlers ──
  function openCreateDialog() {
    setEditingBranch(null);
    setFormData(EMPTY_FORM);
    setFormDialogOpen(true);
  }

  function openEditDialog(branch: Branch) {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      district: branch.district,
    });
    setFormDialogOpen(true);
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    setEditingBranch(null);
    setFormData(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error('יש להזין שם סניף');
      return;
    }
    if (!formData.district.trim()) {
      toast.error('יש להזין מחוז');
      return;
    }
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleToggleActive(branch: Branch) {
    toggleMutation.mutate({ id: branch.id, isActive: !branch.isActive });
  }

  function getRankDelta(score: BranchWeeklyScore): number {
    return score.prevRank - score.rank;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול סניפים</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול סניפי הליכוד ולוח מובילים שבועי
          </p>
        </div>
        {activeTab === 'branches' && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 ml-1" />
            סניף חדש
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'branches'
              ? 'border-[#0099DB] text-[#0099DB]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            סניפים
          </div>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-[#0099DB] text-[#0099DB]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            לוח מובילים
          </div>
        </button>
      </div>

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <>
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">שם סניף</th>
                  <th className="text-right px-4 py-3 font-medium">מחוז</th>
                  <th className="text-center px-4 py-3 font-medium w-28">חברים</th>
                  <th className="text-center px-4 py-3 font-medium w-20">סטטוס</th>
                  <th className="text-center px-4 py-3 font-medium w-32">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {branchesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))
                ) : branches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      אין סניפים. צור סניף חדש כדי להתחיל.
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium">{branch.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {branch.district}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-mono text-sm">
                            {branch.memberCount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={branch.isActive ? 'success' : 'outline'}
                        >
                          {branch.isActive ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(branch)}
                            title="עריכה"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(branch)}
                            disabled={toggleMutation.isPending}
                            title={branch.isActive ? 'השבת' : 'הפעל'}
                          >
                            {branch.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(branch)}
                            title="מחיקה"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {branches.length > 0 && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>
                סה&quot;כ: {branches.length} סניפים
              </span>
              <span>
                פעילים: {branches.filter((b) => b.isActive).length}
              </span>
            </div>
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <>
          {/* Week selector */}
          <div className="mb-6">
            <div className="space-y-2 max-w-xs">
              <Label>תקופה</Label>
              <Select
                value={weekPeriod}
                onChange={(e) => setWeekPeriod(e.target.value)}
              >
                <option value="current">השבוע הנוכחי</option>
                <option value="last_week">שבוע שעבר</option>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {leaderboardLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
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
                      <Building2 className="h-4 w-4" />
                      <span>סניפים משתתפים</span>
                    </div>
                    <p className="text-2xl font-bold">{sortedLeaderboard.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Trophy className="h-4 w-4" />
                      <span>ניקוד מוביל</span>
                    </div>
                    <p className="text-2xl font-bold text-[#0099DB]">
                      {sortedLeaderboard.length > 0
                        ? sortedLeaderboard[0].totalScore.toLocaleString()
                        : 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Users className="h-4 w-4" />
                      <span>חברים פעילים</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {sortedLeaderboard.reduce((sum, s) => sum + s.activeMemberCount, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-center px-4 py-3 font-medium w-20">דירוג</th>
                  <th className="text-right px-4 py-3 font-medium">סניף</th>
                  <th className="text-center px-4 py-3 font-medium w-28">ניקוד כולל</th>
                  <th className="text-center px-4 py-3 font-medium w-28">ניקוד לנפש</th>
                  <th className="text-center px-4 py-3 font-medium w-28">חברים פעילים</th>
                  <th className="text-center px-4 py-3 font-medium w-24">שינוי</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboardLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))
                ) : sortedLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      אין נתוני לוח מובילים לתקופה זו.
                    </td>
                  </tr>
                ) : (
                  sortedLeaderboard.map((score) => {
                    const delta = getRankDelta(score);
                    return (
                      <tr
                        key={score.branchId}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-center">
                          {score.rank <= 3 ? (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto"
                              style={{
                                backgroundColor:
                                  score.rank === 1
                                    ? '#FFD700'
                                    : score.rank === 2
                                      ? '#C0C0C0'
                                      : '#CD7F32',
                              }}
                            >
                              {score.rank}
                            </div>
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {score.rank}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium">{score.branchName}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-[#0099DB]">
                            {score.totalScore.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono text-sm">
                            {score.perCapitaScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm text-gray-600">
                            {score.activeMemberCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {delta > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-sm font-medium">+{delta}</span>
                            </div>
                          ) : delta < 0 ? (
                            <div className="flex items-center justify-center gap-1 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                              <span className="text-sm font-medium">{delta}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <Minus className="h-4 w-4" />
                              <span className="text-sm">-</span>
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
        </>
      )}

      {/* Create/Edit Branch Dialog */}
      <Dialog open={formDialogOpen} onClose={closeFormDialog}>
        <DialogTitle>
          {editingBranch ? 'עריכת סניף' : 'סניף חדש'}
        </DialogTitle>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם סניף</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="שם הסניף..."
            />
          </div>
          <div className="space-y-2">
            <Label>מחוז</Label>
            <Input
              value={formData.district}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, district: e.target.value }))
              }
              placeholder="מחוז..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeFormDialog}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? 'שומר...'
                : editingBranch
                  ? 'עדכן סניף'
                  : 'צור סניף'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="מחיקת סניף"
        description={`האם למחוק את הסניף "${deleteTarget?.name ?? ''}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
