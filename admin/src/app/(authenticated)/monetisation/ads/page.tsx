'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdPlacements,
  getAdStats,
  getAdBreakdown,
  approveAdPlacement,
  rejectAdPlacement,
  pauseAdPlacement,
  resumeAdPlacement,
  endAdPlacement,
  createAdPlacement,
  updateAdPlacement,
  getArticlesForLinking,
} from '@/lib/api';
import { api } from '@/lib/api';
import type {
  CandidateAdPlacement,
  AdPlacementType,
  AdPlacementStatus,
  AdTargetingRules,
  AdBreakdownStats,
  PrimaryCandidate,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Eye,
  DollarSign,
  TrendingUp,
  Megaphone,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  StopCircle,
  Pencil,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Constants ───────────────────────────────────────────────────────────

const PLACEMENT_TYPE_LABELS: Record<AdPlacementType, string> = {
  profile_featured: 'פרופיל מובלט',
  feed_sponsored: 'פיד ממומן',
  push_notification: 'התראת פוש',
  quiz_end: 'סוף חידון',
};

const PLACEMENT_TYPE_BADGE_VARIANTS: Record<
  AdPlacementType,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  profile_featured: 'default',
  feed_sponsored: 'secondary',
  push_notification: 'warning',
  quiz_end: 'outline',
};

const ALL_PLACEMENT_TYPES: AdPlacementType[] = [
  'profile_featured',
  'feed_sponsored',
  'push_notification',
  'quiz_end',
];

const STATUS_LABELS: Record<AdPlacementStatus, string> = {
  pending: 'ממתין לאישור',
  approved: 'מאושר',
  rejected: 'נדחה',
  paused: 'מושהה',
  ended: 'הסתיים',
};

const STATUS_BADGE_VARIANTS: Record<
  AdPlacementStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  paused: 'secondary',
  ended: 'outline',
};

const DISTRICTS = ['צפון', 'מרכז', 'דרום', 'ירושלים', 'חיפה', 'גוש דן'];

type TabKey = 'all' | 'pending' | 'approved' | 'paused' | 'rejected';

// ── Helpers ─────────────────────────────────────────────────────────────

function formatCTR(impressions: number, clicks: number): string {
  if (impressions === 0) return '0.00%';
  return ((clicks / impressions) * 100).toFixed(2) + '%';
}

function formatSpend(impressions: number, cpmNis: number | string): string {
  return '₪' + ((impressions * Number(cpmNis)) / 1000).toFixed(2);
}

function calcPacingPct(impressions: number, cpmNis: number | string, dailyBudgetNis: number | string): number {
  const budget = Number(dailyBudgetNis);
  if (budget === 0) return 0;
  return Math.min(100, ((impressions * Number(cpmNis)) / 1000 / budget) * 100);
}

function getPacingColor(pct: number): string {
  if (pct > 90) return 'bg-red-500';
  if (pct > 70) return 'bg-yellow-400';
  return 'bg-green-500';
}

function getStatusFromAd(ad: CandidateAdPlacement): AdPlacementStatus {
  if (ad.status) return ad.status;
  if (!ad.isActive) return 'ended';
  if (!ad.isApproved) return 'pending';
  return 'approved';
}

// ── CSV Export ──────────────────────────────────────────────────────────

function exportCSV(placements: CandidateAdPlacement[]) {
  const headers = [
    'ID', 'Candidate', 'Type', 'Title', 'Status',
    'Impressions', 'Clicks', 'CTR', 'Daily Budget (NIS)', 'CPM (NIS)',
    'Start Date', 'End Date', 'Total Spend (NIS)',
  ];
  const rows = placements.map((ad) => [
    ad.id,
    ad.candidate?.fullName || ad.candidateName || '',
    PLACEMENT_TYPE_LABELS[ad.placementType],
    ad.title,
    STATUS_LABELS[getStatusFromAd(ad)],
    ad.impressions,
    ad.clicks,
    formatCTR(ad.impressions, ad.clicks),
    ad.dailyBudgetNis,
    ad.cpmNis,
    ad.startDate,
    ad.endDate,
    ((ad.impressions * Number(ad.cpmNis)) / 1000).toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ad-placements-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function AdsMarketplacePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [candidateFilter, setCandidateFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<CandidateAdPlacement | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CandidateAdPlacement | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  // ── Queries ──
  const { data: stats } = useQuery({
    queryKey: ['ad-stats'],
    queryFn: getAdStats,
  });

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['ad-placements', typeFilter, candidateFilter],
    queryFn: () => getAdPlacements({ type: typeFilter, candidateId: candidateFilter }),
  });

  const { data: breakdown } = useQuery<AdBreakdownStats>({
    queryKey: ['ad-breakdown'],
    queryFn: getAdBreakdown,
  });

  const { data: candidatesRes } = useQuery({
    queryKey: ['candidates-all'],
    queryFn: () => api.get<{ data: PrimaryCandidate[] }>('/candidates'),
  });
  const candidates = candidatesRes?.data ?? [];

  // ── Derived counts ──
  const pendingCount = useMemo(() => placements.filter((p) => getStatusFromAd(p) === 'pending').length, [placements]);

  const tabFilteredPlacements = useMemo(() => {
    if (activeTab === 'all') return placements;
    return placements.filter((p) => getStatusFromAd(p) === activeTab);
  }, [placements, activeTab]);

  // ── Mutations ──
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ad-placements'] });
    queryClient.invalidateQueries({ queryKey: ['ad-stats'] });
    queryClient.invalidateQueries({ queryKey: ['ad-breakdown'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAdPlacement(id),
    onSuccess: () => { invalidateAll(); toast.success('המודעה אושרה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAdPlacement(id, reason),
    onSuccess: () => { invalidateAll(); toast.success('המודעה נדחתה'); setRejectTarget(null); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בדחייה'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseAdPlacement(id),
    onSuccess: () => { invalidateAll(); toast.success('המודעה הושהתה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בהשהייה'),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeAdPlacement(id),
    onSuccess: () => { invalidateAll(); toast.success('המודעה חודשה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בחידוש'),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endAdPlacement(id),
    onSuccess: () => { invalidateAll(); toast.success('המודעה הסתיימה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בסיום'),
  });

  // ── Tab buttons ──
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'pending', label: `ממתינות (${pendingCount})` },
    { key: 'approved', label: 'פעילות' },
    { key: 'paused', label: 'מושהות' },
    { key: 'rejected', label: 'נדחו' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">שוק מודעות מועמדים</h1>
          <p className="text-sm text-gray-500 mt-1">ניהול מודעות ממומנות למועמדים</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCSV(placements)}>
            <Download className="h-4 w-4 ml-1" />
            ייצוא CSV
          </Button>
          <Button onClick={() => { setEditingAd(null); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 ml-1" />
            מודעה חדשה
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="מודעות פעילות"
          value={stats?.activePlacements ?? 0}
          icon={<Megaphone className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          label="ממתינות לאישור"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          color="orange"
        />
        <StatCard
          label="סה״כ חשיפות"
          value={(stats?.totalImpressions ?? 0).toLocaleString()}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          label="סה״כ הוצאה"
          value={`₪${(stats?.totalSpendNis ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard
          label="CTR ממוצע"
          value={`${(stats?.ctr ?? 0).toFixed(2)}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white border border-b-white text-[#0099DB] border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Label className="text-xs">סוג מודעה</Label>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">כל הסוגים</option>
            {ALL_PLACEMENT_TYPES.map((type) => (
              <option key={type} value={type}>{PLACEMENT_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">מועמד</Label>
          <Select value={candidateFilter} onChange={(e) => setCandidateFilter(e.target.value)}>
            <option value="">כל המועמדים</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">מועמד</th>
              <th className="text-right px-4 py-3 font-medium">סוג</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-center px-4 py-3 font-medium">סטטוס</th>
              <th className="text-center px-4 py-3 font-medium">חשיפות</th>
              <th className="text-center px-4 py-3 font-medium">קליקים</th>
              <th className="text-center px-4 py-3 font-medium">CTR</th>
              <th className="text-center px-4 py-3 font-medium">תקציב/יום</th>
              <th className="text-center px-4 py-3 font-medium">פעפוע</th>
              <th className="text-center px-4 py-3 font-medium">תאריכים</th>
              <th className="text-center px-4 py-3 font-medium w-36">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={11} />
              ))
            ) : tabFilteredPlacements.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  אין מודעות בקטגוריה זו.
                </td>
              </tr>
            ) : (
              tabFilteredPlacements.map((ad) => {
                const adStatus = getStatusFromAd(ad);
                const pacingPct = calcPacingPct(ad.impressions, ad.cpmNis, ad.dailyBudgetNis);
                return (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Candidate */}
                    <td className="px-4 py-3.5 font-medium">
                      {ad.candidate?.fullName || ad.candidateName || '—'}
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <Badge variant={PLACEMENT_TYPE_BADGE_VARIANTS[ad.placementType]}>
                        {PLACEMENT_TYPE_LABELS[ad.placementType]}
                      </Badge>
                    </td>
                    {/* Title */}
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm truncate">{ad.title}</span>
                        <span className="shrink-0 text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                          ממומן
                        </span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={STATUS_BADGE_VARIANTS[adStatus]}>
                        {STATUS_LABELS[adStatus]}
                      </Badge>
                    </td>
                    {/* Impressions */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {ad.impressions.toLocaleString()}
                    </td>
                    {/* Clicks */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {ad.clicks.toLocaleString()}
                    </td>
                    {/* CTR */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {formatCTR(ad.impressions, ad.clicks)}
                    </td>
                    {/* Daily Budget */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      ₪{Number(ad.dailyBudgetNis).toFixed(0)}
                    </td>
                    {/* Pacing */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getPacingColor(pacingPct)}`}
                            style={{ width: `${pacingPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          {pacingPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    {/* Dates */}
                    <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                      <div>{ad.startDate}</div>
                      <div>{ad.endDate}</div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {adStatus === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveMutation.mutate(ad.id)}
                              disabled={approveMutation.isPending}
                              title="אשר מודעה"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRejectTarget(ad)}
                              title="דחה מודעה"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {adStatus === 'approved' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => pauseMutation.mutate(ad.id)}
                              disabled={pauseMutation.isPending}
                              title="השהה מודעה"
                            >
                              <Pause className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingAd(ad); setShowCreateDialog(true); }}
                              title="ערוך מודעה"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => endMutation.mutate(ad.id)}
                              disabled={endMutation.isPending}
                              title="סיים מודעה"
                            >
                              <StopCircle className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                        {adStatus === 'paused' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resumeMutation.mutate(ad.id)}
                              disabled={resumeMutation.isPending}
                              title="חדש מודעה"
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingAd(ad); setShowCreateDialog(true); }}
                              title="ערוך מודעה"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => endMutation.mutate(ad.id)}
                              disabled={endMutation.isPending}
                              title="סיים מודעה"
                            >
                              <StopCircle className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                        {adStatus === 'rejected' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingAd(ad); setShowCreateDialog(true); }}
                            title="ערוך מודעה"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      {placements.length > 0 && (
        <div className="mb-6 flex items-center gap-4 text-xs text-gray-500">
          <span>סה״כ: {placements.length} מודעות</span>
          <span>מאושרות: {placements.filter((a) => getStatusFromAd(a) === 'approved').length}</span>
          <span>מושהות: {placements.filter((a) => getStatusFromAd(a) === 'paused').length}</span>
          <span>
            הוצאה כוללת:{' '}
            {formatSpend(
              placements.reduce((s, a) => s + a.impressions, 0),
              placements.length > 0
                ? placements.reduce((s, a) => s + Number(a.cpmNis), 0) / placements.length
                : 0
            )}
          </span>
        </div>
      )}

      {/* Analytics Section */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50/60 transition-colors"
          onClick={() => setAnalyticsOpen((v) => !v)}
        >
          <span>ניתוח ביצועים</span>
          {analyticsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {analyticsOpen && (
          <div className="px-5 pb-5 space-y-6 border-t">
            {/* Breakdown by type */}
            <div className="pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">פירוט לפי סוג מודעה</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600">סוג</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">כמות</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">חשיפות</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">קליקים</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">CTR</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">הוצאה</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-600">פעילות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {breakdown?.byType && breakdown.byType.length > 0 ? (
                      breakdown.byType.map((row) => (
                        <tr key={row.type} className="hover:bg-gray-50/40">
                          <td className="px-4 py-2.5">
                            <Badge variant={PLACEMENT_TYPE_BADGE_VARIANTS[row.type]}>
                              {PLACEMENT_TYPE_LABELS[row.type]}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.count}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.impressions.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.clicks.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.ctr.toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">₪{row.totalSpendNis.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.activePlacements}</td>
                        </tr>
                      ))
                    ) : (
                      /* fallback: derive from placements data */
                      ALL_PLACEMENT_TYPES.map((type) => {
                        const group = placements.filter((p) => p.placementType === type);
                        if (group.length === 0) return null;
                        const imps = group.reduce((s, p) => s + p.impressions, 0);
                        const clks = group.reduce((s, p) => s + p.clicks, 0);
                        const spend = group.reduce((s, p) => s + (p.impressions * Number(p.cpmNis)) / 1000, 0);
                        const active = group.filter((p) => getStatusFromAd(p) === 'approved').length;
                        return (
                          <tr key={type} className="hover:bg-gray-50/40">
                            <td className="px-4 py-2.5">
                              <Badge variant={PLACEMENT_TYPE_BADGE_VARIANTS[type]}>
                                {PLACEMENT_TYPE_LABELS[type]}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">{group.length}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">{imps.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">{clks.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">{formatCTR(imps, clks)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">₪{spend.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">{active}</td>
                          </tr>
                        );
                      }).filter(Boolean)
                    )}
                    {!breakdown?.byType && placements.filter((p) => ALL_PLACEMENT_TYPES.some((t) => t === p.placementType)).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-xs">אין נתונים</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Pacing */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">פעפוע תקציב</h3>
              {(() => {
                const pacingAds = breakdown?.budgetPacing
                  ? breakdown.budgetPacing
                  : placements
                      .filter((p) => getStatusFromAd(p) === 'approved' || getStatusFromAd(p) === 'paused')
                      .map((p) => ({
                        id: p.id,
                        title: p.title,
                        candidateName: p.candidate?.fullName || p.candidateName || '—',
                        dailyBudgetNis: Number(p.dailyBudgetNis),
                        currentSpendNis: (p.impressions * Number(p.cpmNis)) / 1000,
                        pacingPct: calcPacingPct(p.impressions, p.cpmNis, p.dailyBudgetNis),
                        status: getStatusFromAd(p),
                      }));

                if (pacingAds.length === 0) {
                  return <p className="text-xs text-gray-400">אין מודעות פעילות למעקב פעפוע.</p>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">מודעה</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">מועמד</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600">תקציב יומי</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600">הוצאה נוכחית</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600 min-w-[140px]">פעפוע</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pacingAds.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/40">
                            <td className="px-4 py-2.5 font-medium text-sm max-w-[200px] truncate">{row.title}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{row.candidateName}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">₪{Number(row.dailyBudgetNis).toFixed(0)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">₪{Number(row.currentSpendNis).toFixed(2)}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getPacingColor(row.pacingPct)}`}
                                    style={{ width: `${row.pacingPct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-10 text-gray-600">
                                  {Number(row.pacingPct).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <AdFormDialog
        open={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); setEditingAd(null); }}
        candidates={candidates}
        editingAd={editingAd}
        onSuccess={() => invalidateAll()}
      />

      {/* Reject Dialog */}
      <RejectDialog
        ad={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
        isPending={rejectMutation.isPending}
      />
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────

const STAT_COLOR_MAP: Record<string, string> = {
  green: 'bg-green-50 border-green-100',
  orange: 'bg-orange-50 border-orange-100',
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
};

function StatCard({
  label,
  value,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`rounded-lg border shadow-sm p-4 ${STAT_COLOR_MAP[color] ?? 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── Ad Form Dialog (Create + Edit) ──────────────────────────────────────

interface AdFormState {
  candidateId: string;
  placementType: AdPlacementType;
  title: string;
  contentHe: string;
  imageUrl: string;
  dailyBudgetNis: string;
  cpmNis: string;
  startDate: string;
  endDate: string;
  targetingDistricts: string[];
  targetingAgeMin: string;
  targetingAgeMax: string;
  targetingMembersOnly: boolean;
  showTargeting: boolean;
  linkedContentType: string;
  linkedContentId: string;
  ctaUrl: string;
}

const EMPTY_FORM: AdFormState = {
  candidateId: '',
  placementType: 'feed_sponsored',
  title: '',
  contentHe: '',
  imageUrl: '',
  dailyBudgetNis: '',
  cpmNis: '',
  startDate: '',
  endDate: '',
  targetingDistricts: [],
  targetingAgeMin: '',
  targetingAgeMax: '',
  targetingMembersOnly: false,
  showTargeting: false,
  linkedContentType: '',
  linkedContentId: '',
  ctaUrl: '',
};

function adToFormState(ad: CandidateAdPlacement): AdFormState {
  const tr = ad.targetingRules;
  return {
    candidateId: ad.candidateId,
    placementType: ad.placementType,
    title: ad.title,
    contentHe: ad.contentHe,
    imageUrl: ad.imageUrl ?? '',
    dailyBudgetNis: String(ad.dailyBudgetNis),
    cpmNis: String(ad.cpmNis),
    startDate: ad.startDate ?? '',
    endDate: ad.endDate ?? '',
    targetingDistricts: tr?.districts ?? [],
    targetingAgeMin: tr?.ageRange?.min != null ? String(tr.ageRange.min) : '',
    targetingAgeMax: tr?.ageRange?.max != null ? String(tr.ageRange.max) : '',
    targetingMembersOnly: tr?.membersOnly ?? false,
    showTargeting: !!(tr && (tr.districts?.length || tr.ageRange || tr.membersOnly)),
    linkedContentType: ad.linkedContentType ?? '',
    linkedContentId: ad.linkedContentId ?? '',
    ctaUrl: ad.ctaUrl ?? '',
  };
}

function AdFormDialog({
  open,
  onClose,
  candidates,
  editingAd,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  candidates: PrimaryCandidate[];
  editingAd: CandidateAdPlacement | null;
  onSuccess: () => void;
}) {
  const isEdit = !!editingAd;
  const [form, setForm] = useState<AdFormState>(EMPTY_FORM);

  // Sync form when dialog opens
  useState(() => {
    if (open) {
      setForm(editingAd ? adToFormState(editingAd) : EMPTY_FORM);
    }
  });

  // Reset when dialog opens/closes
  const handleOpen = (prevOpen: boolean) => {
    if (open && !prevOpen) {
      setForm(editingAd ? adToFormState(editingAd) : EMPTY_FORM);
    }
  };
  void handleOpen; // used via effect below

  const createMutation = useMutation({
    mutationFn: (payload: { candidateId: string; dto: Omit<CandidateAdPlacement, 'id' | 'candidateId' | 'candidateName' | 'impressions' | 'clicks' | 'isApproved' | 'isActive' | 'status' | 'createdAt' | 'candidate'> }) =>
      createAdPlacement(payload.candidateId, payload.dto),
    onSuccess: () => {
      onSuccess();
      toast.success('המודעה נוצרה בהצלחה');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה ביצירת מודעה'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; dto: Partial<CandidateAdPlacement> }) =>
      updateAdPlacement(payload.id, payload.dto),
    onSuccess: () => {
      onSuccess();
      toast.success('המודעה עודכנה בהצלחה');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון מודעה'),
  });

  function set<K extends keyof AdFormState>(key: K, value: AdFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDistrict(d: string) {
    setForm((prev) => ({
      ...prev,
      targetingDistricts: prev.targetingDistricts.includes(d)
        ? prev.targetingDistricts.filter((x) => x !== d)
        : [...prev.targetingDistricts, d],
    }));
  }

  function buildTargeting(): AdTargetingRules | undefined {
    const tr: AdTargetingRules = {};
    if (form.targetingDistricts.length > 0) tr.districts = form.targetingDistricts;
    if (form.targetingAgeMin || form.targetingAgeMax) {
      tr.ageRange = {
        min: Number(form.targetingAgeMin) || 0,
        max: Number(form.targetingAgeMax) || 120,
      };
    }
    if (form.targetingMembersOnly) tr.membersOnly = true;
    return Object.keys(tr).length > 0 ? tr : undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.contentHe || !form.dailyBudgetNis || !form.cpmNis || !form.startDate || !form.endDate) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return;
    }
    const dto = {
      placementType: form.placementType,
      title: form.title,
      contentHe: form.contentHe,
      imageUrl: form.imageUrl || undefined,
      dailyBudgetNis: Number(form.dailyBudgetNis),
      cpmNis: Number(form.cpmNis),
      startDate: form.startDate,
      endDate: form.endDate,
      targetingRules: form.showTargeting ? buildTargeting() : undefined,
      linkedContentType: (form.linkedContentType || undefined) as CandidateAdPlacement['linkedContentType'],
      linkedContentId: form.linkedContentType && form.linkedContentType !== 'external' ? (form.linkedContentId || undefined) : undefined,
      ctaUrl: form.ctaUrl || undefined,
    };
    if (isEdit && editingAd) {
      updateMutation.mutate({ id: editingAd.id, dto });
    } else {
      if (!form.candidateId) { toast.error('יש לבחור מועמד'); return; }
      createMutation.mutate({ candidateId: form.candidateId, dto: dto as Parameters<typeof createAdPlacement>[1] });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-for-linking'],
    queryFn: getArticlesForLinking,
    enabled: open && form.placementType === 'feed_sponsored',
  });

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogTitle>{isEdit ? 'עריכת מודעה' : 'יצירת מודעה חדשה'}</DialogTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate — only in create mode */}
        {!isEdit && (
          <div className="space-y-2">
            <Label>מועמד *</Label>
            <Select value={form.candidateId} onChange={(e) => set('candidateId', e.target.value)}>
              <option value="">בחר מועמד</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Placement type */}
        <div className="space-y-2">
          <Label>סוג מודעה *</Label>
          <Select value={form.placementType} onChange={(e) => set('placementType', e.target.value as AdPlacementType)}>
            {ALL_PLACEMENT_TYPES.map((type) => (
              <option key={type} value={type}>{PLACEMENT_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>כותרת *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} dir="rtl" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label>תוכן (עברית) *</Label>
          <textarea
            value={form.contentHe}
            onChange={(e) => set('contentHe', e.target.value)}
            dir="rtl"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0099DB] focus:outline-none focus:ring-1 focus:ring-[#0099DB]"
          />
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label>קישור תמונה</Label>
          <Input
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </div>

        {/* Content linking — only for feed_sponsored */}
        {form.placementType === 'feed_sponsored' && (
          <div className="border rounded-lg p-4 space-y-3 bg-blue-50/40">
            <p className="text-sm font-medium text-blue-800">קישור תוכן (אופציונלי)</p>
            <p className="text-xs text-blue-600">קשרו את המודעה לכתבה — המשתמש ייפתח לכתבה בלחיצה על המודעה.</p>
            <div className="space-y-2">
              <Label>סוג קישור</Label>
              <Select value={form.linkedContentType} onChange={(e) => { set('linkedContentType', e.target.value); set('linkedContentId', ''); }}>
                <option value="">ללא קישור</option>
                <option value="article">כתבה</option>
                <option value="candidate">פרופיל מועמד</option>
                <option value="poll">סקר קהילתי</option>
                <option value="event">אירוע</option>
                <option value="external">קישור חיצוני</option>
              </Select>
            </div>
            {form.linkedContentType === 'article' && (
              <div className="space-y-2">
                <Label>בחר כתבה</Label>
                <Select value={form.linkedContentId} onChange={(e) => set('linkedContentId', e.target.value)}>
                  <option value="">בחר כתבה...</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </Select>
                {form.linkedContentId && (
                  <p className="text-[11px] text-gray-400 dir-ltr font-mono">{form.linkedContentId}</p>
                )}
              </div>
            )}
            {form.linkedContentType && form.linkedContentType !== 'article' && form.linkedContentType !== 'external' && (
              <div className="space-y-2">
                <Label>UUID של {form.linkedContentType === 'candidate' ? 'המועמד' : form.linkedContentType === 'poll' ? 'הסקר' : 'האירוע'}</Label>
                <Input
                  value={form.linkedContentId}
                  onChange={(e) => set('linkedContentId', e.target.value)}
                  placeholder="הכנס UUID..."
                  dir="ltr"
                />
              </div>
            )}
            {(form.linkedContentType === 'external' || form.linkedContentType) && (
              <div className="space-y-2">
                <Label>{form.linkedContentType === 'external' ? 'קישור URL' : 'קישור חלופי (fallback)'}</Label>
                <Input
                  value={form.ctaUrl}
                  onChange={(e) => set('ctaUrl', e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
            )}
          </div>
        )}

        {/* Budget + CPM */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>תקציב יומי (₪) *</Label>
            <Input
              type="number"
              value={form.dailyBudgetNis}
              onChange={(e) => set('dailyBudgetNis', e.target.value)}
              min="1"
              step="0.01"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>CPM (₪ לכל 1,000 חשיפות) *</Label>
            <Input
              type="number"
              value={form.cpmNis}
              onChange={(e) => set('cpmNis', e.target.value)}
              min="0.01"
              step="0.01"
              dir="ltr"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>תאריך התחלה *</Label>
            <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>תאריך סיום *</Label>
            <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} dir="ltr" />
          </div>
        </div>

        {/* Targeting Rules (collapsible) */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => set('showTargeting', !form.showTargeting)}
          >
            <span>כללי מיקוד (אופציונלי)</span>
            {form.showTargeting ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {form.showTargeting && (
            <div className="p-4 space-y-4">
              {/* Districts */}
              <div className="space-y-2">
                <Label className="text-xs">מחוזות</Label>
                <div className="flex flex-wrap gap-2">
                  {DISTRICTS.map((d) => (
                    <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.targetingDistricts.includes(d)}
                        onChange={() => toggleDistrict(d)}
                        className="rounded"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label className="text-xs">טווח גיל</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="מינימום"
                    value={form.targetingAgeMin}
                    onChange={(e) => set('targetingAgeMin', e.target.value)}
                    className="w-28"
                    min="1"
                    max="120"
                    dir="ltr"
                  />
                  <span className="text-gray-400">—</span>
                  <Input
                    type="number"
                    placeholder="מקסימום"
                    value={form.targetingAgeMax}
                    onChange={(e) => set('targetingAgeMax', e.target.value)}
                    className="w-28"
                    min="1"
                    max="120"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Members Only */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.targetingMembersOnly}
                  onChange={(e) => set('targetingMembersOnly', e.target.checked)}
                  className="rounded"
                />
                חברי מפלגה בלבד
              </label>
            </div>
          )}
        </div>

        {/* Preview */}
        {form.title && (
          <div className="bg-gray-50 rounded-lg p-4 border" dir="rtl">
            <p className="text-xs text-gray-400 mb-2">תצוגה מקדימה:</p>
            <div className="flex items-start gap-3">
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-16 h-16 rounded object-cover border" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-medium text-sm">{form.title}</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                    ממומן
                  </span>
                </div>
                {form.contentHe && (
                  <p className="text-xs text-gray-600">{form.contentHe}</p>
                )}
                {form.dailyBudgetNis && form.cpmNis && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    תקציב יומי: ₪{form.dailyBudgetNis} | CPM: ₪{form.cpmNis}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (isEdit ? 'מעדכן...' : 'יוצר...') : (isEdit ? 'שמור שינויים' : 'צור מודעה')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ── Reject Dialog ────────────────────────────────────────────────────────

function RejectDialog({
  ad,
  onClose,
  onReject,
  isPending,
}: {
  ad: CandidateAdPlacement | null;
  onClose: () => void;
  onReject: (id: string, reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { toast.error('יש להזין סיבת דחייה'); return; }
    if (!ad) return;
    onReject(ad.id, reason.trim());
  }

  return (
    <Dialog open={!!ad} onClose={onClose} className="max-w-md">
      <DialogTitle>דחיית מודעה</DialogTitle>
      {ad && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            דחיית מודעה: <span className="font-medium">{ad.title}</span>
          </p>
          <div className="space-y-2">
            <Label>סיבת הדחייה *</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              dir="rtl"
              rows={4}
              placeholder="תאר את הסיבה לדחיית המודעה..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0099DB] focus:outline-none focus:ring-1 focus:ring-[#0099DB]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? 'דוחה...' : 'דחה מודעה'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
