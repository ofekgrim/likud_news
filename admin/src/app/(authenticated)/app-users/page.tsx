'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AppUser, AppUsersResponse, PrimaryElection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Search, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<AppUser['role'], string> = {
  guest: 'אורח',
  member: 'חבר',
  verified_member: 'חבר מאומת',
};

const ROLE_BADGE_VARIANTS: Record<AppUser['role'], 'outline' | 'default' | 'success'> = {
  guest: 'outline',
  member: 'default',
  verified_member: 'success',
};

const MEMBERSHIP_LABELS: Record<AppUser['membershipStatus'], string> = {
  unverified: 'לא מאומת',
  pending: 'ממתין',
  verified: 'מאומת',
  expired: 'פג תוקף',
};

const MEMBERSHIP_BADGE_VARIANTS: Record<AppUser['membershipStatus'], 'outline' | 'warning' | 'success' | 'destructive'> = {
  unverified: 'outline',
  pending: 'warning',
  verified: 'success',
  expired: 'destructive',
};

export default function AppUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Bulk voting eligibility state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showBulkVotingDialog, setShowBulkVotingDialog] = useState(false);
  const [bulkElectionId, setBulkElectionId] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'destructive' | 'default';
    confirmLabel: string;
    action: (() => void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    confirmLabel: '',
    action: null,
  });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (membershipFilter !== 'all') params.set('membershipStatus', membershipFilter);
    return params.toString();
  }, [page, searchQuery, roleFilter, membershipFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['app-users', queryParams],
    queryFn: () => api.get<AppUsersResponse>(`/app-users?${queryParams}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/app-users/${id}/approve-membership`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('החברות אושרה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור החברות'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/app-users/${id}/reject-membership`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('החברות נדחתה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בדחיית החברות'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/app-users/${id}/toggle-active`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('סטטוס המשתמש עודכן');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון הסטטוס'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/app-users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('המשתמש נמחק לצמיתות');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת המשתמש'),
  });

  // ── Bulk Voting Eligibility ───────────────────────────────────────────────
  const { data: electionsData } = useQuery({
    queryKey: ['elections-list'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });

  const bulkVotingMutation = useMutation({
    mutationFn: (body: { userIds: string[]; electionId: string }) =>
      api.post('/app-users/bulk-voting-eligibility', body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success(`זכאות הצבעה אושרה ל-${vars.userIds.length} משתמשים`);
      setSelectedUserIds(new Set());
      setShowBulkVotingDialog(false);
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור זכאות'),
  });

  function handleApprove(user: AppUser) {
    setConfirmDialog({
      open: true,
      title: 'אישור חברות',
      description: `האם לאשר את החברות של ${user.displayName || user.phone || 'משתמש'}?`,
      variant: 'default',
      confirmLabel: 'אשר',
      action: () => approveMutation.mutate(user.id),
    });
  }

  function handleReject(user: AppUser) {
    setConfirmDialog({
      open: true,
      title: 'דחיית חברות',
      description: `האם לדחות את החברות של ${user.displayName || user.phone || 'משתמש'}?`,
      variant: 'destructive',
      confirmLabel: 'דחה',
      action: () => rejectMutation.mutate(user.id),
    });
  }

  function handleToggleActive(user: AppUser) {
    const actionLabel = user.isActive ? 'חסימה' : 'ביטול חסימה';
    setConfirmDialog({
      open: true,
      title: `${actionLabel} משתמש`,
      description: user.isActive
        ? `האם לחסום את ${user.displayName || user.phone || 'משתמש'}? המשתמש לא יוכל להשתמש באפליקציה.`
        : `האם לבטל את חסימת ${user.displayName || user.phone || 'משתמש'}?`,
      variant: user.isActive ? 'destructive' : 'default',
      confirmLabel: actionLabel,
      action: () => toggleActiveMutation.mutate(user.id),
    });
  }

  function handleDelete(user: AppUser) {
    setConfirmDialog({
      open: true,
      title: 'מחיקת משתמש לצמיתות',
      description: `האם אתה בטוח שברצונך למחוק לצמיתות את ${user.displayName || user.phone || 'משתמש'}? פעולה זו בלתי הפיכה.`,
      variant: 'destructive',
      confirmLabel: 'מחק לצמיתות',
      action: () => deleteMutation.mutate(user.id),
    });
  }

  function handleConfirm() {
    confirmDialog.action?.();
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleCancelDialog() {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function getInitial(name?: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  const users = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול משתמשי אפליקציה</h1>
          <p className="text-sm text-gray-500 mt-1">
            {!isLoading && `${total} משתמשים`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="חיפוש לפי שם, טלפון או אימייל..."
            className="pr-10"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44"
        >
          <option value="all">כל התפקידים</option>
          <option value="guest">אורח</option>
          <option value="member">חבר</option>
          <option value="verified_member">חבר מאומת</option>
        </Select>
        <Select
          value={membershipFilter}
          onChange={(e) => {
            setMembershipFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="unverified">לא מאומת</option>
          <option value="pending">ממתין</option>
          <option value="verified">מאומת</option>
          <option value="expired">פג תוקף</option>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUserIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-700">
            {selectedUserIds.size} משתמשים נבחרו
          </span>
          <Button
            size="sm"
            onClick={() => setShowBulkVotingDialog(true)}
          >
            אשר זכאות הצבעה
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUserIds(new Set())}
          >
            ביטול בחירה
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.size === users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(new Set(users.map((u) => u.id)));
                      } else {
                        setSelectedUserIds(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-right px-4 py-3 font-medium w-16">תמונה</th>
                <th className="text-right px-4 py-3 font-medium">שם תצוגה</th>
                <th className="text-right px-4 py-3 font-medium">טלפון</th>
                <th className="text-right px-4 py-3 font-medium">אימייל</th>
                <th className="text-right px-4 py-3 font-medium">תפקיד</th>
                <th className="text-right px-4 py-3 font-medium">סטטוס חברות</th>
                <th className="text-right px-4 py-3 font-medium">פעיל</th>
                <th className="text-right px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={9} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    {searchQuery.trim() || roleFilter !== 'all' || membershipFilter !== 'all'
                      ? 'לא נמצאו משתמשים התואמים את החיפוש.'
                      : 'אין משתמשי אפליקציה עדיין.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={(e) => {
                          setSelectedUserIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(user.id);
                            else next.delete(user.id);
                            return next;
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    {/* Avatar */}
                    <td className="px-4 py-3.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName || ''}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitial(user.displayName)}
                        </div>
                      )}
                    </td>
                    {/* Display Name */}
                    <td className="px-4 py-3.5 font-medium">
                      {user.displayName || '-'}
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3.5 text-gray-500 text-xs" dir="ltr">
                      {user.phone || '-'}
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3.5 text-gray-500 text-xs" dir="ltr">
                      {user.email || '-'}
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    {/* Membership Status */}
                    <td className="px-4 py-3.5">
                      <Badge variant={MEMBERSHIP_BADGE_VARIANTS[user.membershipStatus]}>
                        {MEMBERSHIP_LABELS[user.membershipStatus]}
                      </Badge>
                    </td>
                    {/* Active */}
                    <td className="px-4 py-3.5">
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'פעיל' : 'חסום'}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/app-users/${user.id}`)}
                        >
                          צפייה
                        </Button>
                        {user.membershipStatus === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(user)}
                            >
                              אשר
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(user)}
                            >
                              דחה
                            </Button>
                          </>
                        )}
                        <Button
                          variant={user.isActive ? 'ghost' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? 'חסום' : 'בטל חסימה'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
            <div className="text-sm text-gray-500">
              עמוד {page} מתוך {totalPages} ({total} תוצאות)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight className="h-4 w-4" />
                הקודם
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                הבא
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={handleConfirm}
        onCancel={handleCancelDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        loading={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          toggleActiveMutation.isPending ||
          deleteMutation.isPending
        }
      />

      {/* Bulk Voting Dialog */}
      {showBulkVotingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" dir="rtl">
            <h3 className="text-lg font-bold mb-4">אישור זכאות הצבעה</h3>
            <p className="text-sm text-gray-500 mb-4">
              אישור זכאות הצבעה ל-{selectedUserIds.size} משתמשים נבחרים
            </p>
            <select
              value={bulkElectionId}
              onChange={(e) => setBulkElectionId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4 text-sm"
            >
              <option value="" disabled>בחר בחירות...</option>
              {(electionsData?.data || []).map((el) => (
                <option key={el.id} value={el.id}>{el.title}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkVotingDialog(false);
                  setBulkElectionId('');
                }}
              >
                ביטול
              </Button>
              <Button
                disabled={!bulkElectionId || bulkVotingMutation.isPending}
                onClick={() => {
                  bulkVotingMutation.mutate({
                    userIds: Array.from(selectedUserIds),
                    electionId: bulkElectionId,
                  });
                }}
              >
                {bulkVotingMutation.isPending ? 'מאשר...' : 'אשר'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
