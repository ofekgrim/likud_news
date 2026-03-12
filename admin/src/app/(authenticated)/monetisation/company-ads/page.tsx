'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Megaphone,
  Plus,
  Download,
  Eye,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  StopCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCompanyAds,
  getCompanyAdvertisers,
  createCompanyAd,
  updateCompanyAd,
  approveCompanyAd,
  rejectCompanyAd,
  pauseCompanyAd,
  resumeCompanyAd,
  endCompanyAd,
} from '@/lib/api';
import type { CompanyAd, CompanyAdStatus, CompanyAdType } from '@/lib/types';

// ── Constants ────────────────────────────────────────────────────────────

const STATUS_TABS: { key: CompanyAdStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'pending', label: 'ממתינות' },
  { key: 'approved', label: 'פעילות' },
  { key: 'paused', label: 'מושהות' },
  { key: 'rejected', label: 'נדחו' },
  { key: 'ended', label: 'הסתיימו' },
];

const AD_TYPE_LABELS: Record<CompanyAdType, string> = {
  article_banner: 'שלט בכתבה',
  feed_native: 'מודעה בפיד',
  article_pre_roll: 'מודעה לפני כתבה',
};

const ALL_AD_TYPES: CompanyAdType[] = ['feed_native', 'article_banner', 'article_pre_roll'];

// ── Helpers ──────────────────────────────────────────────────────────────

function calcPacingPct(impressions: number, cpmNis: number, dailyBudgetNis: number): number {
  if (!dailyBudgetNis || dailyBudgetNis === 0) return 0;
  const spend = (impressions * cpmNis) / 1000;
  return Math.min((spend / dailyBudgetNis) * 100, 100);
}

function getPacingColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function formatCTR(impressions: number, clicks: number): string {
  if (!impressions) return '0.00%';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

function formatSpend(impressions: number, cpmNis: number): string {
  return `₪${((impressions * cpmNis) / 1000).toFixed(2)}`;
}

function exportCSV(ads: CompanyAd[]) {
  const headers = ['מפרסם', 'כותרת', 'סוג', 'סטטוס', 'חשיפות', 'קליקים', 'CTR', 'תקציב יומי', 'CPM', 'הוצאה', 'תחילה', 'סיום'];
  const rows = ads.map((ad) => [
    ad.advertiser?.name || ad.advertiserId,
    ad.title,
    AD_TYPE_LABELS[ad.adType] || ad.adType,
    ad.status,
    ad.impressions,
    ad.clicks,
    formatCTR(ad.impressions, ad.clicks),
    ad.dailyBudgetNis,
    ad.cpmNis,
    ((ad.impressions * Number(ad.cpmNis)) / 1000).toFixed(2),
    ad.startDate || '',
    ad.endDate || '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `company-ads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────

const STAT_COLOR_MAP: Record<string, string> = {
  green: 'bg-green-50 border-green-100',
  orange: 'bg-orange-50 border-orange-100',
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
};

function StatCard({ label, value, icon, color = 'blue' }: {
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

function StatusBadge({ status }: { status: CompanyAdStatus }) {
  const map: Record<CompanyAdStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'ממתין', variant: 'secondary' },
    approved: { label: 'פעיל', variant: 'default' },
    rejected: { label: 'נדחה', variant: 'destructive' },
    paused: { label: 'מושהה', variant: 'outline' },
    ended: { label: 'הסתיים', variant: 'secondary' },
  };
  const { label, variant } = map[status] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function CompanyAdsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<CompanyAdStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [advertiserFilter, setAdvertiserFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CompanyAd | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['company-ads'],
    queryFn: () => getCompanyAds(),
  });

  const { data: advertisers = [] } = useQuery({
    queryKey: ['company-advertisers'],
    queryFn: getCompanyAdvertisers,
  });

  // ── Derived stats ──
  const stats = useMemo(() => {
    const active = ads.filter((a) => a.status === 'approved').length;
    const pending = ads.filter((a) => a.status === 'pending').length;
    const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
    const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
    const totalSpend = ads.reduce((s, a) => s + (a.impressions * Number(a.cpmNis)) / 1000, 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return { active, pending, totalImpressions, totalSpend, ctr };
  }, [ads]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = activeTab === 'all' ? ads : ads.filter((a) => a.status === activeTab);
    if (typeFilter) result = result.filter((a) => a.adType === typeFilter);
    if (advertiserFilter) result = result.filter((a) => a.advertiserId === advertiserFilter);
    return result;
  }, [ads, activeTab, typeFilter, advertiserFilter]);

  const pendingCount = stats.pending;

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['company-ads'] });

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async (form: typeof EMPTY_FORM) => {
      const dto = {
        adType: form.adType,
        title: form.title,
        contentHe: form.contentHe || undefined,
        imageUrl: form.imageUrl || undefined,
        ctaUrl: form.ctaUrl || undefined,
        ctaLabelHe: form.ctaLabelHe || undefined,
        dailyBudgetNis: Number(form.dailyBudgetNis) || 0,
        cpmNis: Number(form.cpmNis) || 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editingAd) return updateCompanyAd(editingAd.id, dto);
      return createCompanyAd(form.advertiserId, dto);
    },
    onSuccess: () => {
      invalidateAll();
      setDialogOpen(false);
      setEditingAd(null);
      toast.success(editingAd ? 'המודעה עודכנה' : 'המודעה נוצרה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירה'),
  });

  const approveMutation = useMutation({
    mutationFn: approveCompanyAd,
    onSuccess: () => { invalidateAll(); toast.success('המודעה אושרה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה באישור'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCompanyAd(id, reason),
    onSuccess: () => {
      invalidateAll();
      setRejectDialogOpen(false);
      setRejectingId(null);
      setRejectReason('');
      toast.success('המודעה נדחתה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בדחייה'),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseCompanyAd,
    onSuccess: () => { invalidateAll(); toast.success('המודעה הושהתה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בהשהייה'),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeCompanyAd,
    onSuccess: () => { invalidateAll(); toast.success('המודעה חודשה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בחידוש'),
  });

  const endMutation = useMutation({
    mutationFn: endCompanyAd,
    onSuccess: () => { invalidateAll(); toast.success('המודעה הסתיימה'); },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בסיום'),
  });

  const openCreate = () => {
    setEditingAd(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (ad: CompanyAd) => {
    setEditingAd(ad);
    setForm({
      advertiserId: ad.advertiserId,
      adType: ad.adType,
      title: ad.title,
      contentHe: ad.contentHe || '',
      imageUrl: ad.imageUrl || '',
      ctaUrl: ad.ctaUrl || '',
      ctaLabelHe: ad.ctaLabelHe || '',
      dailyBudgetNis: String(ad.dailyBudgetNis),
      cpmNis: String(ad.cpmNis),
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
    });
    setDialogOpen(true);
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">מודעות חברות</h1>
            <p className="text-sm text-gray-500 mt-1">ניהול מודעות פרסום של חברות</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCSV(ads)}>
            <Download className="h-4 w-4 ml-1" />
            ייצוא CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 ml-1" />
            מודעה חדשה
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="מודעות פעילות"
          value={stats.active}
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
          value={stats.totalImpressions.toLocaleString()}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          label="סה״כ הוצאה"
          value={`₪${stats.totalSpend.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard
          label="CTR ממוצע"
          value={`${stats.ctr.toFixed(2)}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        {STATUS_TABS.map((tab) => (
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
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="mr-1.5 bg-yellow-100 text-yellow-800 rounded-full px-1.5 py-0.5 text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Label className="text-xs">סוג מודעה</Label>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">כל הסוגים</option>
            {ALL_AD_TYPES.map((type) => (
              <option key={type} value={type}>{AD_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">מפרסם</Label>
          <Select value={advertiserFilter} onChange={(e) => setAdvertiserFilter(e.target.value)}>
            <option value="">כל המפרסמים</option>
            {advertisers.map((adv) => (
              <option key={adv.id} value={adv.id}>{adv.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">מפרסם</th>
              <th className="text-right px-4 py-3 font-medium">סוג</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-center px-4 py-3 font-medium">סטטוס</th>
              <th className="text-center px-4 py-3 font-medium">חשיפות</th>
              <th className="text-center px-4 py-3 font-medium">קליקים</th>
              <th className="text-center px-4 py-3 font-medium">CTR</th>
              <th className="text-center px-4 py-3 font-medium">תקציב/יום</th>
              <th className="text-center px-4 py-3 font-medium">פעפוע</th>
              <th className="text-center px-4 py-3 font-medium">תאריכים</th>
              <th className="text-center px-4 py-3 font-medium w-32">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 11 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  אין מודעות בקטגוריה זו.
                </td>
              </tr>
            ) : (
              filtered.map((ad) => {
                const pacingPct = calcPacingPct(ad.impressions, Number(ad.cpmNis), Number(ad.dailyBudgetNis));
                return (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-sm">
                      {ad.advertiser?.name || ad.advertiserId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-xs">
                        {AD_TYPE_LABELS[ad.adType] || ad.adType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm truncate">{ad.title}</span>
                        <span className="shrink-0 text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium">
                          ממומן
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={ad.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      {formatCTR(ad.impressions, ad.clicks)}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs">
                      ₪{Number(ad.dailyBudgetNis).toFixed(0)}
                    </td>
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
                    <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                      <div>{ad.startDate || '—'}</div>
                      <div>{ad.endDate || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {ad.status === 'pending' && (
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
                              onClick={() => { setRejectingId(ad.id); setRejectReason(''); setRejectDialogOpen(true); }}
                              title="דחה מודעה"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {ad.status === 'approved' && (
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
                              onClick={() => openEdit(ad)}
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
                        {ad.status === 'paused' && (
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
                              onClick={() => openEdit(ad)}
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
                        {(ad.status === 'rejected' || ad.status === 'ended') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(ad)}
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
      {ads.length > 0 && (
        <div className="mb-6 flex items-center gap-4 text-xs text-gray-500">
          <span>סה״כ: {ads.length} מודעות</span>
          <span>מאושרות: {stats.active}</span>
          <span>מושהות: {ads.filter((a) => a.status === 'paused').length}</span>
          <span>הוצאה כוללת: {formatSpend(ads.reduce((s, a) => s + a.impressions, 0), ads.length > 0 ? ads.reduce((s, a) => s + Number(a.cpmNis), 0) / ads.length : 0)}</span>
        </div>
      )}

      {/* Analytics section */}
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
                    {ALL_AD_TYPES.map((type) => {
                      const group = ads.filter((a) => a.adType === type);
                      if (group.length === 0) return null;
                      const imps = group.reduce((s, a) => s + a.impressions, 0);
                      const clks = group.reduce((s, a) => s + a.clicks, 0);
                      const spend = group.reduce((s, a) => s + (a.impressions * Number(a.cpmNis)) / 1000, 0);
                      const active = group.filter((a) => a.status === 'approved').length;
                      return (
                        <tr key={type} className="hover:bg-gray-50/40">
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="text-xs">{AD_TYPE_LABELS[type]}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{group.length}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{imps.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{clks.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{formatCTR(imps, clks)}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">₪{spend.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{active}</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                    {ALL_AD_TYPES.every((t) => ads.filter((a) => a.adType === t).length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-xs">אין נתונים</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget pacing */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">פעפוע תקציב</h3>
              {(() => {
                const pacingAds = ads
                  .filter((a) => a.status === 'approved' || a.status === 'paused')
                  .map((a) => ({
                    id: a.id,
                    title: a.title,
                    advertiserName: a.advertiser?.name || '—',
                    dailyBudgetNis: Number(a.dailyBudgetNis),
                    currentSpendNis: (a.impressions * Number(a.cpmNis)) / 1000,
                    pacingPct: calcPacingPct(a.impressions, Number(a.cpmNis), Number(a.dailyBudgetNis)),
                    status: a.status,
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
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600">מפרסם</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600">תקציב יומי</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600">הוצאה נוכחית</th>
                          <th className="text-center px-4 py-2.5 font-medium text-gray-600 min-w-[140px]">פעפוע</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pacingAds.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/40">
                            <td className="px-4 py-2.5 font-medium text-sm max-w-[200px] truncate">{row.title}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{row.advertiserName}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">₪{row.dailyBudgetNis.toFixed(0)}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-xs">₪{row.currentSpendNis.toFixed(2)}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getPacingColor(row.pacingPct)}`}
                                    style={{ width: `${row.pacingPct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-10 text-gray-600">
                                  {row.pacingPct.toFixed(0)}%
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
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingAd(null); }}
        advertisers={advertisers}
        editingAd={editingAd}
        form={form}
        setForm={setForm}
        onSave={() => saveMutation.mutate(form)}
        isSaving={saveMutation.isPending}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} className="max-w-sm">
        <div dir="rtl">
          <DialogTitle>דחיית מודעה</DialogTitle>
          <div className="py-2">
            <Label className="mb-1.5 block">סיבת דחייה *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="הסבר מדוע המודעה נדחתה..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>ביטול</Button>
            <Button
              variant="destructive"
              onClick={() => rejectingId && rejectMutation.mutate({ id: rejectingId, reason: rejectReason })}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'דוחה...' : 'דחה מודעה'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  advertiserId: '',
  adType: 'feed_native' as CompanyAdType,
  title: '',
  contentHe: '',
  imageUrl: '',
  ctaUrl: '',
  ctaLabelHe: '',
  dailyBudgetNis: '',
  cpmNis: '',
  startDate: '',
  endDate: '',
};

// ── Ad Form Dialog ────────────────────────────────────────────────────────

function AdFormDialog({
  open,
  onClose,
  advertisers,
  editingAd,
  form,
  setForm,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  advertisers: { id: string; name: string }[];
  editingAd: CompanyAd | null;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSave: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!editingAd;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <div dir="rtl">
        <DialogTitle>{isEdit ? 'עריכת מודעה' : 'מודעה חדשה'}</DialogTitle>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>מפרסם *</Label>
              <Select value={form.advertiserId} onChange={(e) => setForm({ ...form, advertiserId: e.target.value })}>
                <option value="">בחר מפרסם</option>
                {advertisers.map((adv) => (
                  <option key={adv.id} value={adv.id}>{adv.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>סוג מודעה *</Label>
            <Select value={form.adType} onChange={(e) => setForm({ ...form, adType: e.target.value as CompanyAdType })}>
              <option value="feed_native">מודעה בפיד</option>
              <option value="article_banner">שלט בכתבה</option>
              <option value="article_pre_roll">מודעה לפני כתבה</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת המודעה" />
          </div>
          <div className="space-y-1.5">
            <Label>תוכן (עברית)</Label>
            <Textarea value={form.contentHe} onChange={(e) => setForm({ ...form, contentHe: e.target.value })} placeholder="תוכן המודעה בעברית" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>URL תמונה</Label>
            <Input dir="ltr" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>URL קריאה לפעולה</Label>
              <Input dir="ltr" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>טקסט כפתור</Label>
              <Input value={form.ctaLabelHe} onChange={(e) => setForm({ ...form, ctaLabelHe: e.target.value })} placeholder="למידע נוסף" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>תקציב יומי (₪)</Label>
              <Input type="number" value={form.dailyBudgetNis} onChange={(e) => setForm({ ...form, dailyBudgetNis: e.target.value })} placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <Label>CPM (₪)</Label>
              <Input type="number" value={form.cpmNis} onChange={(e) => setForm({ ...form, cpmNis: e.target.value })} placeholder="15" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>תאריך התחלה</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>תאריך סיום</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} dir="ltr" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            onClick={onSave}
            disabled={!form.title || (!isEdit && !form.advertiserId) || isSaving}
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
