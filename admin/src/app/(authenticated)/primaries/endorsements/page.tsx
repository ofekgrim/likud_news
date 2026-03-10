'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CandidateEndorsement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { CandidateSelector } from '@/components/candidate-selector';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function EndorsementsPage() {
  const queryClient = useQueryClient();

  const [electionId, setElectionId] = useState<string | undefined>(undefined);
  const [candidateId, setCandidateId] = useState<string | undefined>(undefined);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: (() => void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    action: null,
  });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (electionId) params.set('electionId', electionId);
    if (candidateId) params.set('candidateId', candidateId);
    return params.toString();
  }, [electionId, candidateId]);

  const { data: endorsementsRes, isLoading } = useQuery({
    queryKey: ['endorsements', queryParams],
    queryFn: () =>
      api.get<{ data: CandidateEndorsement[] }>(
        `/endorsements${queryParams ? `?${queryParams}` : ''}`
      ),
  });
  const endorsements = endorsementsRes?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/endorsements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endorsements'] });
      toast.success('התמיכה נמחקה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת התמיכה'),
  });

  function handleDelete(endorsement: CandidateEndorsement) {
    const userName =
      endorsement.user?.displayName || endorsement.user?.phone || 'משתמש';
    const candidateName = endorsement.candidate?.fullName || 'מועמד';
    setConfirmDialog({
      open: true,
      title: 'מחיקת תמיכה',
      description: `האם למחוק את התמיכה של ${userName} ב${candidateName}?`,
      action: () => deleteMutation.mutate(endorsement.id),
    });
  }

  function handleConfirm() {
    confirmDialog.action?.();
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleCancelDialog() {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleElectionChange(id: string | undefined) {
    setElectionId(id);
    setCandidateId(undefined);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">תמיכות במועמדים</h1>
          <p className="text-sm text-gray-500 mt-1">
            {!isLoading && `סה"כ ${endorsements.length} תמיכות`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-64">
          <ElectionSelector
            value={electionId}
            onChange={handleElectionChange}
            label="סינון לפי בחירות"
          />
        </div>
        <div className="w-full sm:w-64">
          <CandidateSelector
            electionId={electionId}
            value={candidateId}
            onChange={setCandidateId}
            label="סינון לפי מועמד"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-medium">משתמש</th>
                <th className="text-right px-4 py-3 font-medium">מועמד</th>
                <th className="text-right px-4 py-3 font-medium">בחירות</th>
                <th className="text-right px-4 py-3 font-medium">תאריך</th>
                <th className="text-right px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))
              ) : endorsements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    {electionId || candidateId
                      ? 'לא נמצאו תמיכות התואמות את הסינון.'
                      : 'אין תמיכות עדיין.'}
                  </td>
                </tr>
              ) : (
                endorsements.map((endorsement) => (
                  <tr
                    key={endorsement.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3.5 font-medium">
                      {endorsement.user?.displayName ||
                        endorsement.user?.phone ||
                        '-'}
                    </td>
                    {/* Candidate */}
                    <td className="px-4 py-3.5">
                      {endorsement.candidate ? (
                        <div className="flex items-center gap-2">
                          {endorsement.candidate.photoUrl && (
                            <img
                              src={endorsement.candidate.photoUrl}
                              alt={endorsement.candidate.fullName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          )}
                          <span>{endorsement.candidate.fullName}</span>
                          {endorsement.candidate.district && (
                            <Badge variant="outline">
                              {endorsement.candidate.district}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {/* Election */}
                    <td className="px-4 py-3.5 text-gray-600">
                      {endorsement.candidate?.election?.title ||
                        endorsement.electionId}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5 text-gray-500" dir="ltr">
                      {format(
                        new Date(endorsement.createdAt),
                        'dd/MM/yyyy HH:mm'
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleDelete(endorsement)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={handleConfirm}
        onCancel={handleCancelDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmLabel="מחק"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
