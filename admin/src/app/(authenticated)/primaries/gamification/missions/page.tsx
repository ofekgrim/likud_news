'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DailyMission, MissionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ── Mission type helpers ────────────────────────────────────────────────

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  quiz_complete: 'השלמת חידון',
  article_read: 'קריאת כתבה',
  poll_vote: 'הצבעה בסקר',
  share: 'שיתוף',
  event_rsvp: 'אישור הגעה לאירוע',
  comment: 'תגובה',
  login: 'התחברות',
  endorsement: 'תמיכה',
};

const ALL_MISSION_TYPES: MissionType[] = [
  'quiz_complete',
  'article_read',
  'poll_vote',
  'share',
  'event_rsvp',
  'comment',
  'login',
  'endorsement',
];

interface MissionFormData {
  type: MissionType;
  descriptionHe: string;
  descriptionEn: string;
  points: number;
  frequency: string;
}

const EMPTY_FORM: MissionFormData = {
  type: 'quiz_complete',
  descriptionHe: '',
  descriptionEn: '',
  points: 10,
  frequency: 'daily',
};

// ── Main Page Component ─────────────────────────────────────────────────

export default function DailyMissionsPage() {
  const queryClient = useQueryClient();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<DailyMission | null>(null);
  const [formData, setFormData] = useState<MissionFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DailyMission | null>(null);

  // ── Fetch missions pool ──
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions-pool'],
    queryFn: () => api.get<DailyMission[]>('/engagement/missions/pool'),
  });

  // ── Create mission mutation ──
  const createMutation = useMutation({
    mutationFn: (data: MissionFormData) =>
      api.post<DailyMission>('/engagement/missions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions-pool'] });
      toast.success('המשימה נוצרה בהצלחה');
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה ביצירת משימה'),
  });

  // ── Update mission mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MissionFormData> }) =>
      api.patch<DailyMission>(`/engagement/missions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions-pool'] });
      toast.success('המשימה עודכנה בהצלחה');
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון משימה'),
  });

  // ── Delete mission mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/engagement/missions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions-pool'] });
      toast.success('המשימה נמחקה');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת משימה'),
  });

  // ── Toggle active mutation ──
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<DailyMission>(`/engagement/missions/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions-pool'] });
      toast.success('הסטטוס עודכן');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון'),
  });

  // ── Handlers ──
  function openCreateDialog() {
    setEditingMission(null);
    setFormData(EMPTY_FORM);
    setFormDialogOpen(true);
  }

  function openEditDialog(mission: DailyMission) {
    setEditingMission(mission);
    setFormData({
      type: mission.type,
      descriptionHe: mission.descriptionHe,
      descriptionEn: mission.descriptionEn,
      points: mission.points,
      frequency: mission.frequency,
    });
    setFormDialogOpen(true);
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    setEditingMission(null);
    setFormData(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!formData.descriptionHe.trim()) {
      toast.error('יש להזין תיאור בעברית');
      return;
    }
    if (editingMission) {
      updateMutation.mutate({ id: editingMission.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleToggleActive(mission: DailyMission) {
    toggleMutation.mutate({ id: mission.id, isActive: !mission.isActive });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול משימות יומיות</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול מאגר המשימות היומיות למערכת הגיימיפיקציה
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף משימה
        </Button>
      </div>

      {/* Missions Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">סוג</th>
              <th className="text-right px-4 py-3 font-medium">תיאור</th>
              <th className="text-center px-4 py-3 font-medium w-20">נקודות</th>
              <th className="text-center px-4 py-3 font-medium w-24">תדירות</th>
              <th className="text-center px-4 py-3 font-medium w-20">סטטוס</th>
              <th className="text-center px-4 py-3 font-medium w-32">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : missions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  אין משימות במאגר. צור משימה חדשה כדי להתחיל.
                </td>
              </tr>
            ) : (
              missions.map((mission) => (
                <tr
                  key={mission.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <Badge variant="secondary">
                      {MISSION_TYPE_LABELS[mission.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-sm">
                      {mission.descriptionHe}
                    </p>
                    {mission.descriptionEn && (
                      <p
                        className="text-xs text-gray-400 mt-0.5"
                        dir="ltr"
                      >
                        {mission.descriptionEn}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm font-mono font-semibold text-[#0099DB]">
                      {mission.points}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm text-gray-600">
                      {mission.frequency}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      variant={mission.isActive ? 'success' : 'outline'}
                    >
                      {mission.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(mission)}
                        title="עריכה"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(mission)}
                        disabled={toggleMutation.isPending}
                        title={mission.isActive ? 'השבת' : 'הפעל'}
                      >
                        {mission.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(mission)}
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
      {missions.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>
            סה&quot;כ: {missions.length} משימות
          </span>
          <span>
            פעילות: {missions.filter((m) => m.isActive).length}
          </span>
        </div>
      )}

      {/* Create/Edit Mission Dialog */}
      <Dialog open={formDialogOpen} onClose={closeFormDialog}>
        <DialogTitle>
          {editingMission ? 'עריכת משימה' : 'משימה חדשה'}
        </DialogTitle>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>סוג משימה</Label>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as MissionType,
                }))
              }
            >
              {ALL_MISSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MISSION_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>תיאור בעברית</Label>
            <Input
              value={formData.descriptionHe}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descriptionHe: e.target.value,
                }))
              }
              placeholder="תיאור המשימה בעברית..."
            />
          </div>
          <div className="space-y-2">
            <Label>תיאור באנגלית</Label>
            <Input
              value={formData.descriptionEn}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descriptionEn: e.target.value,
                }))
              }
              placeholder="Mission description in English..."
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>נקודות</Label>
              <Input
                type="number"
                min={0}
                value={formData.points}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    points: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>תדירות</Label>
              <Select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: e.target.value,
                  }))
                }
              >
                <option value="daily">יומי</option>
                <option value="weekly">שבועי</option>
                <option value="once">חד פעמי</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeFormDialog}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? 'שומר...'
                : editingMission
                  ? 'עדכן משימה'
                  : 'צור משימה'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="מחיקת משימה"
        description={`האם למחוק את המשימה "${deleteTarget?.descriptionHe ?? ''}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
