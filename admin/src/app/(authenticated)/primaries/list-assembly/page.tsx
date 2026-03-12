'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  PrimaryElection,
  PrimaryCandidate,
  KnessetListSlot,
  KnessetSlotType,
  SlotStatistics,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  CheckCircle2,
  Trash2,
  User,
  Users,
  BarChart3,
  ListChecks,
  Hash,
} from 'lucide-react';

// ── Slot type helpers ────────────────────────────────────────────────────

const SLOT_TYPE_LABELS: Record<KnessetSlotType, string> = {
  leader: 'מנהיג',
  reserved_minority: 'מיעוטים',
  reserved_woman: 'נשים',
  national: 'ארצי',
  district: 'מחוזי',
};

const SLOT_TYPE_COLORS: Record<KnessetSlotType, string> = {
  leader: 'bg-amber-100 text-amber-800 border-amber-300',
  reserved_minority: 'bg-purple-100 text-purple-800 border-purple-300',
  reserved_woman: 'bg-pink-100 text-pink-800 border-pink-300',
  national: 'bg-blue-100 text-blue-800 border-blue-300',
  district: 'bg-green-100 text-green-800 border-green-300',
};

const SLOT_TYPE_BORDER_COLORS: Record<KnessetSlotType, string> = {
  leader: 'border-amber-300',
  reserved_minority: 'border-purple-300',
  reserved_woman: 'border-pink-300',
  national: 'border-blue-300',
  district: 'border-green-300',
};

// ── Main Page Component ─────────────────────────────────────────────────

export default function ListAssemblyPage() {
  const queryClient = useQueryClient();

  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<KnessetListSlot | null>(null);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [assignCandidateId, setAssignCandidateId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // ── Fetch elections ──
  const { data: electionsRes } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  // ── Fetch slots ──
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['list-assembly-slots', selectedElectionId],
    queryFn: () =>
      api.get<KnessetListSlot[]>(
        `/election-results/list-assembly/${selectedElectionId}`
      ),
    enabled: !!selectedElectionId,
  });
  const slots = slotsData ?? [];

  // ── Fetch statistics ──
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['list-assembly-stats', selectedElectionId],
    queryFn: () =>
      api.get<SlotStatistics>(
        `/election-results/list-assembly/${selectedElectionId}/stats`
      ),
    enabled: !!selectedElectionId,
  });

  // ── Fetch candidates ──
  const { data: candidatesRes } = useQuery({
    queryKey: ['candidates-for-assembly', selectedElectionId],
    queryFn: () =>
      api.get<{ data: PrimaryCandidate[] }>(
        `/candidates?electionId=${selectedElectionId}`
      ),
    enabled: !!selectedElectionId,
  });
  const allCandidates = candidatesRes?.data ?? [];

  // ── Unassigned candidates ──
  const assignedCandidateIds = useMemo(
    () => new Set(slots.filter((s) => s.candidateId).map((s) => s.candidateId)),
    [slots]
  );

  const unassignedCandidates = useMemo(
    () => allCandidates.filter((c) => !assignedCandidateIds.has(c.id)),
    [allCandidates, assignedCandidateIds]
  );

  // ── Sorted slots ──
  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.slotNumber - b.slotNumber),
    [slots]
  );

  // ── Assign mutation ──
  const assignMutation = useMutation({
    mutationFn: (data: { slotNumber: number; candidateId: string; notes?: string }) =>
      api.post(`/election-results/list-assembly/assign`, {
        electionId: selectedElectionId,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-assembly-slots', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['list-assembly-stats', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['candidates-for-assembly', selectedElectionId] });
      toast.success('המועמד שובץ בהצלחה');
      closeAssignDialog();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשיבוץ'),
  });

  // ── Confirm mutation ──
  const confirmMutation = useMutation({
    mutationFn: (slotNumber: number) =>
      api.post(`/election-results/list-assembly/confirm`, {
        electionId: selectedElectionId,
        slotNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-assembly-slots', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['list-assembly-stats', selectedElectionId] });
      toast.success('המקום אושר');
      setDetailsDialogOpen(false);
      setSelectedSlot(null);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור'),
  });

  // ── Remove mutation ──
  const removeMutation = useMutation({
    mutationFn: (slotNumber: number) =>
      api.delete(
        `/election-results/list-assembly/${selectedElectionId}/${slotNumber}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-assembly-slots', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['list-assembly-stats', selectedElectionId] });
      queryClient.invalidateQueries({ queryKey: ['candidates-for-assembly', selectedElectionId] });
      toast.success('המועמד הוסר מהמקום');
      setDetailsDialogOpen(false);
      setSelectedSlot(null);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בהסרה'),
  });

  // ── Handlers ──
  function openAssignDialog(slotNumber: number) {
    setSelectedSlotNumber(slotNumber);
    setAssignCandidateId('');
    setAssignNotes('');
    setAssignDialogOpen(true);
  }

  function closeAssignDialog() {
    setAssignDialogOpen(false);
    setSelectedSlotNumber(null);
    setAssignCandidateId('');
    setAssignNotes('');
  }

  function handleAssign() {
    if (!selectedSlotNumber || !assignCandidateId) return;
    assignMutation.mutate({
      slotNumber: selectedSlotNumber,
      candidateId: assignCandidateId,
      notes: assignNotes || undefined,
    });
  }

  function openDetailsDialog(slot: KnessetListSlot) {
    setSelectedSlot(slot);
    setDetailsDialogOpen(true);
  }

  function closeDetailsDialog() {
    setDetailsDialogOpen(false);
    setSelectedSlot(null);
  }

  // ── Stats computed values ──
  const remainingSlots = statsData
    ? statsData.totalSlots - statsData.filledSlots
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">הרכבת רשימה לכנסת</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול ושיבוץ מועמדים לרשימת הכנסת
          </p>
        </div>
      </div>

      {/* Election Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label>בחירות</Label>
          <Select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
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
          <p>בחר בחירות כדי להציג את הרשימה</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
                      <Hash className="h-4 w-4" />
                      <span>סה&quot;כ מקומות</span>
                    </div>
                    <p className="text-2xl font-bold">{statsData?.totalSlots ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Users className="h-4 w-4" />
                      <span>מקומות מאוישים</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {statsData?.filledSlots ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>מקומות מאושרים</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {statsData?.confirmedSlots ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>נותרו</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {remainingSlots}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Content: Grid + Candidate Pool */}
          <div className="flex gap-6">
            {/* Slot Grid */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">רשימת מקומות</h2>
              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <Skeleton className="h-4 w-8 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : sortedSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border border-dashed rounded-lg">
                  <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>אין מקומות מוגדרים לבחירות אלו</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                  {sortedSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onClickEmpty={() => openAssignDialog(slot.slotNumber)}
                      onClickFilled={() => openDetailsDialog(slot)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Pool Sidebar */}
            <div className="w-64 shrink-0 hidden lg:block">
              <h2 className="text-lg font-semibold mb-4">
                מועמדים זמינים ({unassignedCandidates.length})
              </h2>
              <div className="border rounded-lg bg-white max-h-[600px] overflow-y-auto">
                {unassignedCandidates.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    כל המועמדים שובצו
                  </div>
                ) : (
                  <div className="divide-y">
                    {unassignedCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="p-3 hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">
                          {candidate.fullName}
                        </p>
                        {candidate.district && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {candidate.district}
                          </p>
                        )}
                        {candidate.position && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {candidate.position}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Candidate Dialog */}
      <Dialog open={assignDialogOpen} onClose={closeAssignDialog}>
        <DialogTitle>שיבוץ מועמד למקום #{selectedSlotNumber}</DialogTitle>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>מועמד</Label>
            <Select
              value={assignCandidateId}
              onChange={(e) => setAssignCandidateId(e.target.value)}
            >
              <option value="">בחר מועמד</option>
              {unassignedCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                  {c.district ? ` (${c.district})` : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>הערות (אופציונלי)</Label>
            <Textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="הערות לשיבוץ..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAssignDialog}>
              ביטול
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignCandidateId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'משבץ...' : 'שבץ מועמד'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Slot Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={closeDetailsDialog}>
        {selectedSlot && (
          <>
            <DialogTitle>
              מקום #{selectedSlot.slotNumber}
            </DialogTitle>
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {selectedSlot.candidate?.fullName ?? 'לא ידוע'}
                  </span>
                </div>
                {selectedSlot.candidate?.district && (
                  <p className="text-sm text-gray-600">
                    מחוז: {selectedSlot.candidate.district}
                  </p>
                )}
                {selectedSlot.candidate?.position && (
                  <p className="text-sm text-gray-600">
                    תפקיד: {selectedSlot.candidate.position}
                  </p>
                )}
              </div>

              {/* Slot Type */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">סוג מקום:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${SLOT_TYPE_COLORS[selectedSlot.slotType]}`}
                >
                  {SLOT_TYPE_LABELS[selectedSlot.slotType]}
                </span>
              </div>

              {/* Confirmation Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">סטטוס:</span>
                <Badge variant={selectedSlot.isConfirmed ? 'success' : 'warning'}>
                  {selectedSlot.isConfirmed ? 'מאושר' : 'ממתין לאישור'}
                </Badge>
              </div>

              {selectedSlot.confirmedAt && (
                <p className="text-xs text-gray-400">
                  אושר בתאריך: {new Date(selectedSlot.confirmedAt).toLocaleDateString('he-IL')}
                </p>
              )}

              {selectedSlot.notes && (
                <div>
                  <span className="text-sm text-gray-500">הערות:</span>
                  <p className="text-sm mt-1">{selectedSlot.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                {!selectedSlot.isConfirmed && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMutation.mutate(selectedSlot.slotNumber)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      {removeMutation.isPending ? 'מסיר...' : 'הסר מועמד'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => confirmMutation.mutate(selectedSlot.slotNumber)}
                      disabled={confirmMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1" />
                      {confirmMutation.isPending ? 'מאשר...' : 'אשר מקום'}
                    </Button>
                  </>
                )}
                {selectedSlot.isConfirmed && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled
                    title="לא ניתן להסיר מקום מאושר"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    הסר מועמד
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={closeDetailsDialog}>
                  סגור
                </Button>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

// ── Slot Card Component ─────────────────────────────────────────────────

function SlotCard({
  slot,
  onClickEmpty,
  onClickFilled,
}: {
  slot: KnessetListSlot;
  onClickEmpty: () => void;
  onClickFilled: () => void;
}) {
  const isEmpty = !slot.candidateId;

  if (isEmpty) {
    return (
      <button
        onClick={onClickEmpty}
        className="rounded-lg border-2 border-dashed border-gray-300 p-3 text-center hover:border-[#0099DB] hover:bg-blue-50/50 transition-colors cursor-pointer min-h-[100px] flex flex-col items-center justify-center"
      >
        <span className="text-xs font-mono text-gray-400 mb-1">
          #{slot.slotNumber}
        </span>
        <Plus className="h-5 w-5 text-gray-400 mb-1" />
        <span className="text-xs text-gray-400">ריק</span>
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border mt-1 ${SLOT_TYPE_COLORS[slot.slotType]}`}
        >
          {SLOT_TYPE_LABELS[slot.slotType]}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClickFilled}
      className={`rounded-lg border-2 p-3 text-right hover:shadow-md transition-all cursor-pointer min-h-[100px] flex flex-col ${
        slot.isConfirmed
          ? 'border-green-400 bg-green-50/30'
          : SLOT_TYPE_BORDER_COLORS[slot.slotType] + ' bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-gray-400">
          #{slot.slotNumber}
        </span>
        {slot.isConfirmed && (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        )}
      </div>
      <p className="text-xs font-medium truncate leading-tight mb-1">
        {slot.candidate?.fullName ?? 'מועמד'}
      </p>
      <span
        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border mt-auto self-start ${SLOT_TYPE_COLORS[slot.slotType]}`}
      >
        {SLOT_TYPE_LABELS[slot.slotType]}
      </span>
    </button>
  );
}
