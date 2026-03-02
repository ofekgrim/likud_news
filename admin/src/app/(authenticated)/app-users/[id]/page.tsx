'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { AppUser, VotingEligibility, PrimaryElection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowRight, Phone, Mail, Shield, Calendar, Hash, Clock, Trash2 } from 'lucide-react';
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
  pending: 'ממתין לאישור',
  verified: 'מאומת',
  expired: 'פג תוקף',
};

const MEMBERSHIP_BADGE_VARIANTS: Record<AppUser['membershipStatus'], 'outline' | 'warning' | 'success' | 'destructive'> = {
  unverified: 'outline',
  pending: 'warning',
  verified: 'success',
  expired: 'destructive',
};

export default function AppUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;

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

  const { data: user, isLoading } = useQuery({
    queryKey: ['app-user', userId],
    queryFn: () => api.get<AppUser>(`/app-users/${userId}`),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/app-users/${userId}/approve-membership`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('החברות אושרה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור החברות'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/app-users/${userId}/reject-membership`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('החברות נדחתה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בדחיית החברות'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => api.post(`/app-users/${userId}/toggle-active`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('סטטוס המשתמש עודכן');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון הסטטוס'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/app-users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('המשתמש נמחק לצמיתות');
      router.push('/app-users');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת המשתמש'),
  });

  // ── Voting Eligibility ──────────────────────────────────────────────────
  const { data: eligibility = [] } = useQuery({
    queryKey: ['voting-eligibility', userId],
    queryFn: () => api.get<VotingEligibility[]>(`/app-users/${userId}/voting-eligibility`),
  });

  const { data: electionsData } = useQuery({
    queryKey: ['elections-list'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });

  const approveVotingMutation = useMutation({
    mutationFn: (electionId: string) => api.post(`/app-users/${userId}/voting-eligibility`, { electionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting-eligibility', userId] });
      toast.success('זכאות הצבעה אושרה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור זכאות'),
  });

  const revokeVotingMutation = useMutation({
    mutationFn: (electionId: string) => api.delete(`/app-users/${userId}/voting-eligibility/${electionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting-eligibility', userId] });
      toast.success('זכאות הצבעה בוטלה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בביטול זכאות'),
  });

  function handleApprove() {
    setConfirmDialog({
      open: true,
      title: 'אישור חברות',
      description: `האם לאשר את החברות של ${user?.displayName || user?.phone || 'משתמש'}?`,
      variant: 'default',
      confirmLabel: 'אשר',
      action: () => approveMutation.mutate(),
    });
  }

  function handleReject() {
    setConfirmDialog({
      open: true,
      title: 'דחיית חברות',
      description: `האם לדחות את החברות של ${user?.displayName || user?.phone || 'משתמש'}?`,
      variant: 'destructive',
      confirmLabel: 'דחה',
      action: () => rejectMutation.mutate(),
    });
  }

  function handleToggleActive() {
    if (!user) return;
    const actionLabel = user.isActive ? 'חסימה' : 'ביטול חסימה';
    setConfirmDialog({
      open: true,
      title: `${actionLabel} משתמש`,
      description: user.isActive
        ? `האם לחסום את ${user.displayName || user.phone || 'משתמש'}? המשתמש לא יוכל להשתמש באפליקציה.`
        : `האם לבטל את חסימת ${user.displayName || user.phone || 'משתמש'}?`,
      variant: user.isActive ? 'destructive' : 'default',
      confirmLabel: actionLabel,
      action: () => toggleActiveMutation.mutate(),
    });
  }

  function handleDelete() {
    if (!user) return;
    setConfirmDialog({
      open: true,
      title: 'מחיקת משתמש לצמיתות',
      description: `האם אתה בטוח שברצונך למחוק לצמיתות את ${user.displayName || user.phone || 'משתמש'}? פעולה זו בלתי הפיכה.`,
      variant: 'destructive',
      confirmLabel: 'מחק לצמיתות',
      action: () => deleteMutation.mutate(),
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">המשתמש לא נמצא</p>
        <Button variant="outline" onClick={() => router.push('/app-users')}>
          חזרה לרשימה
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app-users')}
            aria-label="חזרה לרשימת משתמשים"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {user.displayName || 'משתמש ללא שם'}
            </h1>
            <p className="text-sm text-gray-500">פרטי משתמש אפליקציה</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.membershipStatus === 'pending' && (
            <>
              <Button onClick={handleApprove}>אשר חברות</Button>
              <Button variant="destructive" onClick={handleReject}>
                דחה חברות
              </Button>
            </>
          )}
          <Button
            variant={user.isActive ? 'destructive' : 'default'}
            onClick={handleToggleActive}
          >
            {user.isActive ? 'חסום משתמש' : 'בטל חסימה'}
          </Button>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            מחק לצמיתות
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרופיל</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-5">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || ''}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-bold text-2xl ring-4 ring-gray-100 shrink-0">
                    {getInitial(user.displayName)}
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {user.displayName || 'ללא שם תצוגה'}
                    </h2>
                    {user.bio && (
                      <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <Badge variant={MEMBERSHIP_BADGE_VARIANTS[user.membershipStatus]}>
                      {MEMBERSHIP_LABELS[user.membershipStatus]}
                    </Badge>
                    <Badge variant={user.isActive ? 'success' : 'destructive'}>
                      {user.isActive ? 'פעיל' : 'חסום'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטי קשר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">טלפון</p>
                    <p className="text-sm font-medium" dir="ltr">
                      {user.phone || 'לא צוין'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">אימייל</p>
                    <p className="text-sm font-medium" dir="ltr">
                      {user.email || 'לא צוין'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פעילות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">היסטוריית פעילות תהיה זמינה בקרוב</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Membership Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">פרטי חברות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">סטטוס חברות</p>
                  <Badge variant={MEMBERSHIP_BADGE_VARIANTS[user.membershipStatus]}>
                    {MEMBERSHIP_LABELS[user.membershipStatus]}
                  </Badge>
                </div>
              </div>
              {user.membershipId && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">מספר חברות</p>
                    <p className="text-sm font-medium" dir="ltr">
                      {user.membershipId}
                    </p>
                  </div>
                </div>
              )}
              {user.membershipVerifiedAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">תאריך אימות</p>
                    <p className="text-sm font-medium">
                      {new Date(user.membershipVerifiedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voting Rights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">זכאויות הצבעה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* List of approved elections */}
              {eligibility.length > 0 ? (
                eligibility.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{e.election?.title || e.electionId}</p>
                      <p className="text-xs text-gray-500">
                        אושר {new Date(e.approvedAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => revokeVotingMutation.mutate(e.electionId)}
                    >
                      ביטול
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">אין זכאויות הצבעה</p>
              )}

              {/* Add eligibility form */}
              <div className="flex gap-2 pt-2 border-t">
                <select
                  id="election-select"
                  className="flex-1 text-sm border rounded-md px-2 py-1.5"
                  defaultValue=""
                >
                  <option value="" disabled>בחר בחירות...</option>
                  {(electionsData?.data || []).map((el) => (
                    <option key={el.id} value={el.id}>{el.title}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => {
                    const select = document.getElementById('election-select') as HTMLSelectElement;
                    if (select.value) {
                      approveVotingMutation.mutate(select.value);
                      select.value = '';
                    }
                  }}
                >
                  אשר
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferred Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">קטגוריות מועדפות</CardTitle>
            </CardHeader>
            <CardContent>
              {user.preferredCategories && user.preferredCategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.preferredCategories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">אין קטגוריות מועדפות</p>
              )}
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">מידע נוסף</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">מזהה</p>
                <p className="text-xs font-mono text-gray-600" dir="ltr">
                  {user.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">תאריך הצטרפות</p>
                <p className="text-sm font-medium">
                  {new Date(user.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">העדפות התראות</p>
                {user.notificationPrefs &&
                Object.keys(user.notificationPrefs).length > 0 ? (
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-1 overflow-x-auto" dir="ltr">
                    {JSON.stringify(user.notificationPrefs, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-400">ברירת מחדל</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
    </div>
  );
}
